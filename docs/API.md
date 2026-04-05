# API Serambi Emosi

Dokumen ini menjelaskan endpoint backend FastAPI yang dipakai frontend.

Base URL default saat development:

```text
http://localhost:8000
```

## 1. Health Check

### Request

```http
GET /health
```

### Response sukses

```json
{
  "status": "ok"
}
```

### Fungsi

- memastikan backend hidup
- cocok untuk smoke test sebelum demo
- bisa dipakai untuk health check deployment

## 2. Analisis Audio

### Request

```http
POST /api/analyze
Content-Type: multipart/form-data
```

### Form data

| Field | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| `audio` | file | Ya | `sample.wav` | File audio yang akan dianalisis |
| `use_noise_reduction` | boolean string | Tidak | `true` | Mengaktifkan bandpass + noisereduce |

Nilai valid untuk file:

- `.wav`
- `.mp3`
- `.m4a`

### Response sukses

```json
{
  "dominant_emotion": "Senang",
  "confidence": 78.24,
  "probabilities": [
    { "name": "Senang", "value": 78.24 },
    { "name": "Netral", "value": 9.11 },
    { "name": "Terkejut", "value": 7.56 },
    { "name": "Jijik", "value": 3.12 },
    { "name": "Kecewa (Sedih)", "value": 1.97 }
  ]
}
```

### Field response

| Field | Tipe | Keterangan |
|---|---|---|
| `dominant_emotion` | string | Emosi dengan probabilitas tertinggi |
| `confidence` | number | Confidence score emosi dominan dalam persen |
| `probabilities` | array | Daftar probabilitas semua emosi |
| `probabilities[].name` | string | Nama emosi |
| `probabilities[].value` | number | Nilai probabilitas dalam persen |

## Kategori Emosi

Mapping label model ke nama emosi:

| Kode | Label |
|---|---|
| `01` | Netral |
| `02` | Senang |
| `03` | Terkejut |
| `04` | Jijik |
| `05` | Kecewa (Sedih) |

## Validasi Upload

Backend melakukan validasi:

- file tidak boleh kosong
- ukuran file tidak boleh melebihi `MAX_AUDIO_UPLOAD_BYTES`
- extensi dan MIME type harus sesuai
- untuk `.wav`, header RIFF/WAVE akan diperiksa

## Error Umum

### 400 Bad Request

Contoh penyebab:

- file audio kosong
- header `.wav` tidak valid
- file audio tidak bisa dibaca
- audio terlalu pendek atau tidak valid

Contoh response:

```json
{
  "detail": "File audio kosong."
}
```

### 413 Payload Too Large

Contoh response:

```json
{
  "detail": "Ukuran file terlalu besar. Maksimum 10MB."
}
```

### 415 Unsupported Media Type

Contoh response:

```json
{
  "detail": "Format audio tidak didukung. ext=.txt, mime=text/plain"
}
```

### 500 Internal Server Error

Contoh penyebab:

- ekstraksi fitur gagal
- dimensi fitur tidak sesuai
- model gagal memproses input

### 503 Service Unavailable

Contoh penyebab:

- model belum selesai dimuat saat startup

Contoh response:

```json
{
  "detail": "Model belum siap. Coba lagi beberapa saat."
}
```

## Contoh cURL

### Health check

```bash
curl http://localhost:8000/health
```

### Analyze audio

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "audio=@sample.wav" \
  -F "use_noise_reduction=false"
```

## Catatan Integrasi Frontend

Frontend membangun URL API secara fleksibel:

- absolute URL, misalnya `http://localhost:8000`
- LAN URL, misalnya `http://192.168.1.9:8000`
- relative reverse proxy, misalnya `/api`

Jika `VITE_API_BASE_URL=/api`, maka request frontend akan diarahkan ke:

```text
/api/analyze
```

bukan:

```text
/api/api/analyze
```

Jadi mode reverse proxy sudah aman dipakai untuk deployment.
