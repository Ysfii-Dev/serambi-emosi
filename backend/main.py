from __future__ import annotations

import logging
import os
import pickle
import tempfile
import time
from pathlib import Path
from typing import Any

import joblib
import librosa
import noisereduce as nr
import numpy as np
import tensorflow as tf
import yaml
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from scipy.signal import butter, filtfilt
from starlette.concurrency import run_in_threadpool


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "model"
CONFIG_CANDIDATES = [PROJECT_ROOT / "config.yaml", MODEL_DIR / "config.yaml"]

ARTIFACT_PATHS = {
    "model": MODEL_DIR / "best_model.h5",
    "scaler": MODEL_DIR / "scaler.pkl",
    "label_encoder": MODEL_DIR / "label_encoder.pkl",
    "max_frames": MODEL_DIR / "max_frames.npy",
}

EMOTION_MAP = {
    "01": "Netral",
    "02": "Senang",
    "03": "Terkejut",
    "04": "Jijik",
    "05": "Kecewa (Sedih)",
}

ASSETS: dict[str, Any] = {}
logger = logging.getLogger(__name__)

ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a"}
ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/vnd.wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "application/octet-stream",
    "",
}
MAX_AUDIO_UPLOAD_BYTES = int(
    os.getenv("MAX_AUDIO_UPLOAD_BYTES", str(10 * 1024 * 1024)))

app = FastAPI(title="Serambi Emosi API", version="1.0.0")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):(3000|4173)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProbabilityItem(BaseModel):
    name: str
    value: float


class AnalyzeResponse(BaseModel):
    dominant_emotion: str
    confidence: float
    probabilities: list[ProbabilityItem]


class NotEqualLayer(tf.keras.layers.Layer):
    """Compatibility layer for legacy H5 serialized op: NotEqual."""

    def __call__(self, x: tf.Tensor, y: Any = 0.0, *args: Any, **kwargs: Any) -> tf.Tensor:
        return super().__call__(x, y=y, *args, **kwargs)

    def call(self, x: tf.Tensor, y: Any = 0.0) -> tf.Tensor:
        return tf.not_equal(x, y)


class AnyLayer(tf.keras.layers.Layer):
    """Compatibility layer for legacy H5 serialized op: Any."""

    def __init__(self, axis: int = -1, keepdims: bool = False, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.axis = axis
        self.keepdims = keepdims

    def call(self, x: tf.Tensor) -> tf.Tensor:
        return tf.reduce_any(x, axis=self.axis, keepdims=self.keepdims)

    def get_config(self) -> dict[str, Any]:
        config = super().get_config()
        config.update({"axis": self.axis, "keepdims": self.keepdims})
        return config


@tf.keras.utils.register_keras_serializable(package="ser")
class MaskedAttentionPooling(tf.keras.layers.Layer):
    """Temporal attention pooling with padding-mask support."""

    def __init__(self, attention_units: int = 64, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.attention_units = attention_units
        self.supports_masking = True
        # Keep the original sublayer names so legacy H5 weights still map cleanly.
        self.attention_dense = tf.keras.layers.Dense(
            attention_units,
            activation="tanh",
            name="dense_4",
        )
        self.score_dense = tf.keras.layers.Dense(1, name="dense_5")

    def build(self, input_shape: tf.TensorShape) -> None:
        self.attention_dense.build(input_shape)
        attention_shape = tf.TensorShape(
            input_shape[:-1]).concatenate(self.attention_units)
        self.score_dense.build(attention_shape)
        super().build(input_shape)

    def call(self, inputs: tf.Tensor, mask: tf.Tensor | None = None) -> tf.Tensor:
        scores = self.score_dense(self.attention_dense(inputs))
        if mask is not None:
            expanded_mask = tf.cast(mask[:, :, tf.newaxis], scores.dtype)
            large_negative = tf.cast(-1e9, scores.dtype)
            scores = tf.where(expanded_mask > 0, scores, large_negative)
        attention_weights = tf.nn.softmax(scores, axis=1)
        return tf.reduce_sum(inputs * attention_weights, axis=1)

    def compute_mask(self, inputs: tf.Tensor, mask: tf.Tensor | None = None) -> None:
        return None

    def get_config(self) -> dict[str, Any]:
        config = super().get_config()
        config.update({"attention_units": self.attention_units})
        return config


def _get_keras_custom_objects() -> dict[str, Any]:
    custom_objects = {
        "NotEqual": NotEqualLayer,
        "Any": AnyLayer,
        "MaskedAttentionPooling": MaskedAttentionPooling,
        "ser>MaskedAttentionPooling": MaskedAttentionPooling,
    }
    tf.keras.utils.get_custom_objects().update(custom_objects)
    return custom_objects


def _load_keras_model(model_h5_path: Path) -> tf.keras.Model:
    custom_objects = _get_keras_custom_objects()
    try:
        return tf.keras.models.load_model(
            model_h5_path,
            compile=False,
            custom_objects=custom_objects,
        )
    except Exception as h5_exc:
        keras_fallback_path = model_h5_path.with_suffix(".keras")
        if keras_fallback_path.exists():
            return tf.keras.models.load_model(
                keras_fallback_path,
                compile=False,
                custom_objects=custom_objects,
            )
        raise RuntimeError(
            f"Gagal memuat model H5 ({model_h5_path.name}) dan fallback .keras tidak ditemukan. "
            f"Error asli: {h5_exc}"
        ) from h5_exc


def _find_config_path() -> Path:
    for candidate in CONFIG_CANDIDATES:
        if candidate.exists():
            return candidate
    raise RuntimeError(
        "config.yaml tidak ditemukan di root project maupun folder model.")


def _validate_config(config: dict[str, Any]) -> None:
    required_keys = ["n_mfcc", "n_fft", "hop_length", "n_mels", "fmax"]
    features_cfg = config.get("features", {})
    missing = [key for key in required_keys if key not in features_cfg]
    if missing:
        raise RuntimeError(
            f"Konfigurasi fitur tidak lengkap di config.yaml: {missing}")


def _load_pickle(path: Path) -> Any:
    try:
        return joblib.load(path)
    except Exception:
        with path.open("rb") as fh:
            return pickle.load(fh)


def _load_max_frames(path: Path) -> int:
    loaded = np.load(path, allow_pickle=True)
    if isinstance(loaded, np.ndarray):
        if loaded.shape == ():
            return int(loaded.item())
        return int(loaded.reshape(-1)[0])
    return int(loaded)


def _normalize_peak(y: np.ndarray) -> np.ndarray:
    peak = float(np.max(np.abs(y))) if y.size else 0.0
    if peak > 0:
        return y / peak
    return y


def _bandpass_filter(y: np.ndarray, sr: int, low_hz: float, high_hz: float, order: int = 4) -> np.ndarray:
    nyquist = 0.5 * sr
    low = max(low_hz / nyquist, 1e-6)
    high = min(high_hz / nyquist, 0.999)
    if low >= high:
        return y
    b, a = butter(order, [low, high], btype="band")
    return filtfilt(b, a, y)


def _extract_features(y: np.ndarray, sr: int, config: dict[str, Any]) -> np.ndarray:
    features_cfg = config.get("features", {})
    n_mfcc = int(features_cfg["n_mfcc"])
    n_fft = int(features_cfg["n_fft"])
    hop_length = int(features_cfg["hop_length"])
    n_mels = int(features_cfg["n_mels"])
    fmax = int(features_cfg["fmax"])

    mfcc = librosa.feature.mfcc(
        y=y,
        sr=sr,
        n_mfcc=n_mfcc,
        n_fft=n_fft,
        hop_length=hop_length,
        n_mels=n_mels,
        fmax=fmax,
    )
    delta = librosa.feature.delta(mfcc)
    delta2 = librosa.feature.delta(mfcc, order=2)

    # Shape: (time, 3 * n_mfcc) -> expected (time, 120)
    return np.concatenate([mfcc, delta, delta2], axis=0).T


def _pad_or_truncate(features: np.ndarray, max_frames: int) -> np.ndarray:
    num_frames, num_features = features.shape
    if num_frames > max_frames:
        return features[:max_frames, :]
    if num_frames < max_frames:
        pad = np.zeros((max_frames - num_frames, num_features),
                       dtype=features.dtype)
        return np.vstack([features, pad])
    return features


def _to_code(raw_label: Any) -> str:
    if isinstance(raw_label, (bytes, bytearray)):
        label = raw_label.decode("utf-8", errors="ignore").strip()
    else:
        label = str(raw_label).strip()
    return label.zfill(2) if label.isdigit() else label


def _is_valid_wav_header(file_bytes: bytes) -> bool:
    if len(file_bytes) < 12:
        return False
    return file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WAVE"


def _validate_audio_upload(filename: str, content_type: str | None, file_bytes: bytes) -> None:
    ext = Path(filename or "").suffix.lower()
    mime = (content_type or "").lower().strip()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="File audio kosong.")

    if len(file_bytes) > MAX_AUDIO_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran file terlalu besar. Maksimum {MAX_AUDIO_UPLOAD_BYTES // (1024 * 1024)}MB.",
        )

    if ext not in ALLOWED_AUDIO_EXTENSIONS and mime not in ALLOWED_AUDIO_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Format audio tidak didukung. ext={ext or 'none'}, mime={mime or 'none'}",
        )

    if ext == ".wav" and not _is_valid_wav_header(file_bytes):
        raise HTTPException(
            status_code=400, detail="File .wav tidak valid (header RIFF/WAVE tidak cocok).")


@app.on_event("startup")
def load_artifacts_on_startup() -> None:
    missing = [str(path)
               for path in ARTIFACT_PATHS.values() if not path.exists()]
    if missing:
        raise RuntimeError(f"Artefak model tidak ditemukan: {missing}")

    config_path = _find_config_path()
    with config_path.open("r", encoding="utf-8") as fh:
        config = yaml.safe_load(fh) or {}
    _validate_config(config)

    ASSETS["config"] = config
    ASSETS["model"] = _load_keras_model(ARTIFACT_PATHS["model"])
    ASSETS["scaler"] = _load_pickle(ARTIFACT_PATHS["scaler"])
    ASSETS["label_encoder"] = _load_pickle(ARTIFACT_PATHS["label_encoder"])
    ASSETS["max_frames"] = _load_max_frames(ARTIFACT_PATHS["max_frames"])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def _analyze_audio_file_sync(
    *,
    filename: str,
    temp_path: Path,
    use_noise_reduction: bool,
) -> AnalyzeResponse:
    request_started_at = time.perf_counter()

    try:
        target_sr = 16000
        load_started_at = time.perf_counter()
        y, sr = librosa.load(temp_path, sr=target_sr, mono=True)
        logger.info(
            "Audio decoded: filename=%s duration_sec=%.2f decode_sec=%.2f",
            filename,
            float(y.size / sr) if sr else 0.0,
            time.perf_counter() - load_started_at,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Gagal membaca file audio: {exc}") from exc

    if y.size == 0:
        raise HTTPException(
            status_code=400, detail="Audio tidak valid atau durasi terlalu pendek.")

    y = _normalize_peak(y)

    if use_noise_reduction:
        noise_started_at = time.perf_counter()
        noise_range = ASSETS["config"].get("preprocessing", {}).get(
            "noise_freq_range", [300, 3400])
        low_hz = float(noise_range[0])
        high_hz = float(noise_range[1])
        y = _bandpass_filter(y, sr=sr, low_hz=low_hz, high_hz=high_hz)
        y = nr.reduce_noise(y=y, sr=sr)
        logger.info(
            "Noise reduction finished: filename=%s noise_reduction_sec=%.2f",
            filename,
            time.perf_counter() - noise_started_at,
        )

    try:
        feature_started_at = time.perf_counter()
        feature_2d = _extract_features(y, sr=sr, config=ASSETS["config"])
        logger.info(
            "Feature extraction finished: filename=%s frames=%s features=%s extract_sec=%.2f",
            filename,
            feature_2d.shape[0],
            feature_2d.shape[1],
            time.perf_counter() - feature_started_at,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Gagal ekstraksi fitur: {exc}") from exc

    if feature_2d.shape[1] != 120:
        raise HTTPException(
            status_code=500,
            detail=f"Dimensi fitur tidak sesuai. Ditemukan {feature_2d.shape[1]}, diharapkan 120.",
        )

    scaler = ASSETS["scaler"]
    prep_started_at = time.perf_counter()
    scaled_feature_2d = scaler.transform(feature_2d)
    max_frames = int(ASSETS["max_frames"])
    model_input_2d = _pad_or_truncate(scaled_feature_2d, max_frames=max_frames)
    logger.info(
        "Feature prep finished: filename=%s max_frames=%s prep_sec=%.2f",
        filename,
        max_frames,
        time.perf_counter() - prep_started_at,
    )

    x = model_input_2d.astype(np.float32).reshape(1, max_frames, 120)

    model = ASSETS["model"]
    predict_started_at = time.perf_counter()
    probs = model.predict(x, verbose=0)[0]
    logger.info(
        "Model inference finished: filename=%s predict_sec=%.2f total_request_sec=%.2f",
        filename,
        time.perf_counter() - predict_started_at,
        time.perf_counter() - request_started_at,
    )
    pred_idx = int(np.argmax(probs))
    confidence = float(probs[pred_idx]) * 100.0

    label_encoder = ASSETS["label_encoder"]
    pred_code = _to_code(label_encoder.inverse_transform([pred_idx])[0])
    dominant_emotion = EMOTION_MAP.get(pred_code, pred_code)

    probability_items: list[ProbabilityItem] = []
    for idx, prob in enumerate(probs):
        code = _to_code(label_encoder.inverse_transform([idx])[0])
        probability_items.append(
            ProbabilityItem(
                name=EMOTION_MAP.get(code, code),
                value=round(float(prob) * 100.0, 2),
            )
        )

    probability_items.sort(key=lambda item: item.value, reverse=True)

    return AnalyzeResponse(
        dominant_emotion=dominant_emotion,
        confidence=round(confidence, 2),
        probabilities=probability_items,
    )


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_audio(
    audio: UploadFile = File(...),
    use_noise_reduction: bool = Form(False),
) -> AnalyzeResponse:
    if "model" not in ASSETS:
        raise HTTPException(
            status_code=503, detail="Model belum siap. Coba lagi beberapa saat.")

    filename = audio.filename or "input.wav"
    content_type = (audio.content_type or "").lower()
    file_bytes = await audio.read()
    logger.info(
        "Incoming upload: filename=%s content_type=%s size_bytes=%s",
        filename,
        content_type or "none",
        len(file_bytes),
    )
    _validate_audio_upload(
        filename=filename, content_type=content_type, file_bytes=file_bytes)

    suffix = Path(filename).suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_file.write(file_bytes)
        temp_path = Path(tmp_file.name)

    try:
        return await run_in_threadpool(
            _analyze_audio_file_sync,
            filename=filename,
            temp_path=temp_path,
            use_noise_reduction=use_noise_reduction,
        )
    finally:
        temp_path.unlink(missing_ok=True)
