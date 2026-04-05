# Deployment Guide

Dokumen ini menjelaskan opsi deployment dan packaging project Serambi Emosi.

## Ringkasan Opsi

### Opsi A: Docker Compose

Cocok untuk:

- demo lokal cepat
- presentasi
- packaging project agar mudah dijalankan

### Opsi B: Deployment manual

Cocok untuk:

- frontend static hosting
- backend dipisah sebagai service FastAPI
- deployment di server/VPS internal

## Opsi A: Docker Compose

Project ini sudah menyediakan:

- [`backend/Dockerfile`](../backend/Dockerfile)
- [`frontend.Dockerfile`](../frontend.Dockerfile)
- [`deploy/nginx.conf`](../deploy/nginx.conf)
- [`docker-compose.yml`](../docker-compose.yml)

### Jalankan

```bash
docker compose up --build
```

### Hasil

- frontend: `http://localhost:3000`
- backend langsung: `http://localhost:8000`

### Cara kerja

- backend berjalan dengan Uvicorn di port `8000`
- frontend dibuild menjadi static files
- Nginx melayani frontend di port `3000`
- request `/api/*` dari frontend diproxy ke backend

### Keunggulan mode ini

- tidak perlu mengubah `VITE_API_BASE_URL` secara manual
- frontend dan backend sudah terhubung lewat reverse proxy
- cocok untuk demo karena startup cukup satu command

## Opsi B: Deployment Manual

### Frontend

1. Set `.env.local` atau env build:

```env
VITE_API_BASE_URL=https://domain-backend-anda.com
```

Atau jika frontend dan backend berada di domain yang sama melalui reverse proxy:

```env
VITE_API_BASE_URL=/api
```

2. Build:

```bash
npm install
npm run build
```

3. Deploy folder `dist/` ke web server atau static hosting.

### Backend

1. Siapkan Python environment:

```bash
python -m venv .venv
```

2. Install dependency:

```bash
pip install -r backend/requirements.txt
```

3. Pastikan folder `model/` ikut tersedia di server.

4. Jalankan:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Reverse Proxy yang Disarankan

Jika frontend dan backend ingin berada dalam satu domain:

- frontend di-root `/`
- backend diproxy dari `/api`
- health check opsional diproxy dari `/health`

Project ini sudah menyiapkan contoh konfigurasi Nginx untuk pola tersebut di:

- [`deploy/nginx.conf`](../deploy/nginx.conf)

## Variabel Environment yang Relevan

### Frontend

| Variable | Contoh |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` |
| `VITE_API_BASE_URL` | `http://192.168.1.9:8000` |
| `VITE_API_BASE_URL` | `/api` |

### Backend

| Variable | Contoh |
|---|---|
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` |
| `MAX_AUDIO_UPLOAD_BYTES` | `10485760` |

## Artefak Wajib Saat Deploy Backend

Folder `model/` wajib tersedia berisi:

- `best_model.h5`
- `best_model.keras`
- `scaler.pkl`
- `label_encoder.pkl`
- `max_frames.npy`
- `config.yaml`

Tanpa file-file ini backend tidak akan lolos startup.

## Checklist Sebelum Deploy

### Frontend

- `npm run build` berhasil
- `VITE_API_BASE_URL` sesuai target environment
- tampilan final sudah diuji di desktop dan mobile

### Backend

- `GET /health` mengembalikan status `ok`
- model berhasil load saat startup
- upload file `.wav` dan `.mp3` berhasil diuji
- `CORS_ORIGINS` sesuai domain atau port frontend

### Demo

- siapkan minimal 2 file audio contoh
- uji hasil inferensi end-to-end
- uji skenario gagal agar pesan error tetap jelas

## Catatan Praktis

- Jika hanya untuk demo di satu laptop, paling cepat gunakan mode local dev biasa.
- Jika ingin packaging yang lebih stabil dan mudah dipindahkan, gunakan Docker Compose.
- Jika ingin domain tunggal tanpa masalah CORS, gunakan reverse proxy dengan `VITE_API_BASE_URL=/api`.
