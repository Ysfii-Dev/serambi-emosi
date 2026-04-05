# Hugging Face Spaces Backend Deployment

Dokumen ini menjelaskan cara menjalankan backend Serambi Emosi di Hugging Face Spaces lalu menghubungkannya ke frontend Vercel.

## Ringkasan Arsitektur

- frontend tetap di Vercel
- backend dipindah ke Hugging Face Spaces sebagai `Docker Space`
- frontend Vercel memanggil backend lewat URL `https://<space-subdomain>.hf.space`

## Prasyarat

- akun Hugging Face
- repo project ini sudah ada di GitHub
- frontend Vercel sudah berhasil deploy

## File yang Sudah Disiapkan di Repo Ini

- [`Dockerfile`](../Dockerfile)
- [`README.md`](../README.md)
- [`backend/requirements.txt`](../backend/requirements.txt)

`Dockerfile` root ini dibuat khusus agar cocok dengan Docker Spaces:

- memakai `sdk: docker` lewat metadata README
- memakai `app_port: 8000`
- menjalankan FastAPI dengan `uvicorn backend.main:app --port 8000`

## Step 1: Buat Space Baru

1. Buka Hugging Face.
2. Klik `New Space`.
3. Isi nama Space, misalnya `serambi-emosi-backend`.
4. Pilih visibility sesuai kebutuhan Anda.
5. Pada SDK, pilih `Docker`.
6. Klik `Create Space`.

## Step 2: Isi Repository Space

Ada dua cara:

### Cara A: Upload file lewat web

Upload isi repo ini ke Space, minimal file berikut:

- `Dockerfile`
- `README.md`
- folder `backend/`
- folder `model/`

### Cara B: Push lewat git

Contoh:

```bash
git remote add hf https://huggingface.co/spaces/USERNAME/serambi-emosi-backend
git push hf main
```

Jika Anda tidak ingin mencampur remote, Anda juga bisa clone Space kosong lalu copy file repo ini ke sana.

## Step 3: Tunggu Build Selesai

Setelah file masuk, Hugging Face akan build Space otomatis.

Kalau build sukses, app akan tersedia di direct URL:

```text
https://<space-subdomain>.hf.space
```

Contoh pola URL ini didokumentasikan oleh Hugging Face pada halaman embed Space.

## Step 4: Atur Variables di Space

Buka `Settings` pada Space lalu tambahkan variable runtime berikut:

```env
CORS_ORIGINS=https://serambi-emosi.vercel.app
MAX_AUDIO_UPLOAD_BYTES=10485760
```

Jika Anda masih ingin test lokal juga, Anda bisa pakai:

```env
CORS_ORIGINS=https://serambi-emosi.vercel.app,http://localhost:3000,http://127.0.0.1:3000
MAX_AUDIO_UPLOAD_BYTES=10485760
```

## Step 5: Test Backend Space

Tes endpoint health:

```text
https://<space-subdomain>.hf.space/health
```

Respons yang diharapkan:

```json
{"status":"ok"}
```

## Step 6: Hubungkan ke Frontend Vercel

Buka project frontend Anda di Vercel lalu set:

```env
VITE_API_BASE_URL=https://<space-subdomain>.hf.space
```

Setelah itu lakukan redeploy Vercel.

## Step 7: Uji End-to-End

1. Buka frontend Vercel.
2. Upload file audio `.wav`, `.mp3`, atau `.m4a`.
3. Klik `Analisis Sekarang`.
4. Pastikan request ke `/api/analyze` berhasil.

## Troubleshooting

### Build gagal di Hugging Face

Periksa:

- file `Dockerfile` ada di root repo Space
- folder `model/` ikut terupload
- `backend/requirements.txt` ada

### Health check gagal

Periksa:

- Space sudah selesai build
- backend berhasil start
- URL yang dibuka adalah direct URL `https://<space-subdomain>.hf.space`

### Frontend masih gagal fetch

Periksa:

- `VITE_API_BASE_URL` di Vercel mengarah ke direct URL Space
- `CORS_ORIGINS` di Hugging Face sudah memuat domain Vercel
- setelah ubah env di Vercel, frontend sudah di-redeploy

## Catatan Penting

- Hugging Face Spaces free saat ini menyediakan `2 vCPU`, `16 GB RAM`, dan `50 GB` disk gratis.
- Port default Docker Spaces adalah `7860`, tetapi untuk repo ini kita override dengan `app_port: 8000`.
- Data di disk Space akan hilang saat Space restart kecuali memakai solusi penyimpanan persisten.

## Referensi Resmi

- Docker Spaces: https://huggingface.co/docs/hub/spaces-sdks-docker
- Spaces Configuration Reference: https://huggingface.co/docs/hub/spaces-config-reference
- Spaces Overview: https://huggingface.co/docs/hub/spaces-overview
- Embed / direct URL Space: https://huggingface.co/docs/hub/spaces-embed
