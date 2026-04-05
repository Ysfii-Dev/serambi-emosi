---
title: Serambi Emosi Backend
emoji: 💻
colorFrom: blue
colorTo: green
sdk: docker
app_port: 8000
pinned: false
short_description: FastAPI backend for voice emotion analysis with TensorFlow.
---

# Serambi Emosi

Serambi Emosi adalah aplikasi analisis emosi berbasis suara dengan frontend React + Vite dan backend FastAPI + TensorFlow. Pengguna dapat mengunggah audio `.wav`, `.mp3`, atau `.m4a`, lalu sistem akan menampilkan emosi dominan beserta distribusi probabilitas hasil inferensi model BiLSTM.

Project ini sudah disiapkan untuk:
- demo lokal
- integrasi frontend-backend
- deployment manual
- deployment berbasis Docker
- deployment backend di Hugging Face Spaces

## Fitur

- Upload audio dengan validasi format dan ukuran file
- Opsi noise reduction sebelum inferensi
- Analisis emosi dengan model TensorFlow/Keras
- UI responsif dengan navbar sticky dan footer minimal
- Endpoint health check untuk verifikasi layanan backend
- Dukungan build frontend untuk localhost, LAN IP, dan reverse proxy `/api`

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Motion, Recharts
- Backend: FastAPI, Uvicorn, TensorFlow, Librosa, Noisereduce, Scikit-learn
- Deployment: Docker, Docker Compose, Nginx reverse proxy

## Struktur Project

```text
serambi-emosi/
|-- backend/
|   |-- main.py
|   |-- requirements.txt
|   |-- .env.example
|   `-- Dockerfile
|-- deploy/
|   `-- nginx.conf
|-- docs/
|   |-- API.md
|   |-- DEPLOYMENT.md
|   `-- HUGGINGFACE_SPACES.md
|-- model/
|   |-- best_model.h5
|   |-- best_model.keras
|   |-- scaler.pkl
|   |-- label_encoder.pkl
|   |-- max_frames.npy
|   `-- config.yaml
|-- src/
|   |-- App.tsx
|   `-- components/
|-- .env.example
|-- docker-compose.yml
|-- Dockerfile
|-- frontend.Dockerfile
|-- package.json
`-- README.md
```

## Prasyarat

### Untuk development lokal

- Node.js 20+ disarankan
- npm 10+ disarankan
- Python 3.11 disarankan
- pip
- Virtual environment Python

### Untuk deployment Docker

- Docker
- Docker Compose

## Menjalankan Secara Lokal

### 1. Frontend

Salin env frontend:

```bash
copy .env.example .env.local
```

Atur `VITE_API_BASE_URL` di `.env.local`.

Contoh:

- Satu laptop yang sama:
  `VITE_API_BASE_URL=http://localhost:8000`
- Akses dari perangkat lain di jaringan yang sama:
  `VITE_API_BASE_URL=http://192.168.x.x:8000`

Install dependency dan jalankan frontend:

```bash
npm install
npm run dev
```

Frontend berjalan di:

```text
http://localhost:3000
```

### 2. Backend

Buat virtual environment lalu install dependency:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Jalankan backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend berjalan di:

```text
http://localhost:8000
```

Health check:

```text
GET http://localhost:8000/health
```

## Environment Variables

### Frontend

Lihat [`/.env.example`](./.env.example).

| Variable | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `VITE_API_BASE_URL` | Ya | `http://localhost:8000` | Base URL backend untuk frontend |

Catatan:
- untuk reverse proxy satu domain, gunakan `VITE_API_BASE_URL=/api`
- jika dikosongkan saat build, frontend fallback ke `http://<hostname>:8000`

### Backend

Lihat [`/backend/.env.example`](./backend/.env.example).

| Variable | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `CORS_ORIGINS` | Tidak | `http://localhost:3000,http://127.0.0.1:3000` | Daftar origin yang diizinkan |
| `MAX_AUDIO_UPLOAD_BYTES` | Tidak | `10485760` | Maksimal ukuran upload file audio |

## Build dan Preview

Build frontend:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

Preview berjalan di:

```text
http://localhost:4173
```

## Demo Checklist

Sebelum presentasi/demo:

1. Pastikan backend `GET /health` mengembalikan `{"status":"ok"}`.
2. Pastikan file model di folder `model/` lengkap.
3. Pastikan `.env.local` frontend mengarah ke backend yang benar.
4. Uji unggah minimal 1 file `.wav`.
5. Uji kondisi gagal:
   - file kosong
   - format file tidak didukung
   - backend mati
6. Jalankan `npm run build` untuk memastikan frontend bersih dari error build.

## API Singkat

Endpoint utama backend:

- `GET /health`
- `POST /api/analyze`

Dokumentasi detail API:

- [docs/API.md](./docs/API.md)

## Deployment

### Opsi 1: Docker Compose

Jalankan:

```bash
docker compose up --build
```

Hasil:

- frontend: `http://localhost:3000`
- backend langsung: `http://localhost:8000`

Pada mode ini frontend dipublish lewat Nginx dan request `/api/*` diproxy ke backend.

### Opsi 2: Manual

- deploy frontend sebagai static build
- deploy backend sebagai layanan ASGI/FastAPI
- arahkan `VITE_API_BASE_URL` ke URL backend atau gunakan reverse proxy `/api`

### Opsi 3: Hugging Face Spaces untuk Backend

- gunakan `Dockerfile` di root repo ini untuk `Docker Space`
- set `CORS_ORIGINS` ke domain frontend Vercel Anda
- gunakan direct URL Space berbentuk `https://<space-subdomain>.hf.space` sebagai `VITE_API_BASE_URL`

Panduan langkah demi langkah:

- [docs/HUGGINGFACE_SPACES.md](./docs/HUGGINGFACE_SPACES.md)

Panduan deployment lengkap:

- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Catatan Model

Backend membutuhkan artefak berikut di folder `model/`:

- `best_model.h5`
- `best_model.keras`
- `scaler.pkl`
- `label_encoder.pkl`
- `max_frames.npy`
- `config.yaml`

Jika salah satu artefak hilang, backend akan gagal startup.

## Troubleshooting Cepat

### Frontend menampilkan "Failed to fetch"

Periksa:

- backend aktif di port yang benar
- `VITE_API_BASE_URL` sesuai
- jika pakai IP LAN, IP mesin tidak berubah

### Backend gagal startup

Periksa:

- file model lengkap
- dependency backend terinstall
- TensorFlow dan library audio berhasil terpasang

### CORS error

Periksa:

- `CORS_ORIGINS`
- origin frontend yang dipakai saat demo (`3000` atau `4173`)

## Verifikasi yang Sudah Dilakukan

Sesudah cleanup ini:

- frontend berhasil build dengan `npm run build`
- dependency frontend yang tidak dipakai sudah dibersihkan
- konfigurasi env dan API base URL sudah dirapikan
- artefak Docker dan reverse proxy sudah ditambahkan

## Lisensi

Gunakan sesuai kebutuhan akademik, demo, atau deployment internal project.
