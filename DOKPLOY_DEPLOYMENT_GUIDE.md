# Panduan Lengkap Deployment ARJUNA LMS ke VPS (Dokploy)

Dokumen ini adalah panduan resmi langkah-demi-langkah untuk mempublikasikan platform **ARJUNA LMS** ke server VPS (*Virtual Private Server*) menggunakan panel orkestrasi **Dokploy**.

---

## 1. Prasyarat & Kebutuhan Sistem

### Spesifikasi VPS Minimum:
* **Sistem Operasi**: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS (x86_64 / ARM64)
* **CPU**: Minimal 2 vCPU (Disarankan 4 vCPU)
* **RAM**: Minimal 4 GB (Disarankan 8 GB untuk build Turbopack & NestJS lancar)
* **Storage**: Minimal 25 GB SSD/NVMe
* **Panel Terpasang**: **Dokploy** (terpasang di VPS Anda)

### Konfigurasi DNS Domain:
Arahkan **DNS A Record** domain Anda di Cloudflare / registrar domain ke **IP Publik VPS**:
* `lms.domainanda.com` $\rightarrow$ `IP_PUBLIC_VPS` (Frontend Web Client)
* `api.domainanda.com` $\rightarrow$ `IP_PUBLIC_VPS` (Backend API & WebSocket Gateway)

> **Catatan**: Jika menggunakan Cloudflare, pastikan ikon Proxy (**Orange Cloud**) diaktifkan untuk proteksi DDoS dan SSL, atau gunakan **DNS Only (Grey Cloud)** jika ingin Dokploy yang mengelola sertifikat SSL Let's Encrypt langsung via Traefik.

---

## 2. Metode Deployment di Dokploy

Dokploy menyediakan dua metode deployment. **Metode 1 (Docker Compose)** sangat direkomendasikan karena mengelola seluruh stack (Postgres, Redis, Backend, Frontend) dalam satu kesatuan terisolasi.

---

### METODE 1: Deployment via "Compose" di Dokploy (Sangat Direkomendasikan)

#### Langkah 1: Buat Project di Dokploy
1. Buka dashboard Dokploy Anda (misal: `http://ip-vps:3000` atau domain Dokploy Anda).
2. Di sidebar kiri, klik **Projects** $\rightarrow$ Klik tombol **Create Project**.
3. Masukkan nama: `ARJUNA-LMS` $\rightarrow$ Klik **Create**.

#### Langkah 2: Buat Service Compose
1. Di dalam project `ARJUNA-LMS`, klik tombol **Create Service** $\rightarrow$ Pilih **Compose**.
2. Beri nama service: `arjuna-stack`.
3. Pada tab **Source / Provider**:
   * **Provider**: Pilih **Git** (GitHub / GitLab / Git Repository).
   * **Repository URL**: Masukkan URL repositori Anda (`https://github.com/arifsuz/Arjuna-LMS.git`).
   * **Branch**: `main`.
   * **Build Type**: `Docker Compose`.
   * **Compose Path**: `docker-compose.prod.yml`.

#### Langkah 3: Konfigurasi Environment Variables di Dokploy
Pilih tab **Environment** pada service compose di Dokploy, lalu masukkan konfigurasi variabel berikut:

```env
# ─── Basis Data (PostgreSQL 16) ───
POSTGRES_USER=arjuna
POSTGRES_PASSWORD=GantiDenganPasswordDatabaseSuperKuat2026!
POSTGRES_DB=arjuna_lms

# ─── Cache & PubSub (Redis 7) ───
REDIS_URL=redis://redis:6379

# ─── Keamanan JWT (Gunakan minimal 32 karakter acak) ───
JWT_ACCESS_SECRET=arjuna_jwt_access_secret_production_2026_super_secure_key_32chars
JWT_REFRESH_SECRET=arjuna_jwt_refresh_secret_production_2026_super_secure_key_32chars

# ─── Domain & CORS Whitelist ───
CORS_ORIGIN=https://lms.domainanda.com,https://api.domainanda.com
NEXT_PUBLIC_API_URL=https://api.domainanda.com/api
```

#### Langkah 4: Konfigurasi Domain & Traefik Routing di Dokploy
Pilih tab **Domains** pada service compose di Dokploy, lalu tambahkan 2 routing domain:

1. **Routing 1 (Frontend Web):**
   * **Host**: `lms.domainanda.com`
   * **Path**: `/`
   * **Service Name**: `frontend`
   * **Container Port**: `3000`
   * **HTTPS**: Centang **Enable SSL / Let's Encrypt**
   * **Certificate Resolver**: `letsencrypt`

2. **Routing 2 (Backend API & WebSocket):**
   * **Host**: `api.domainanda.com`
   * **Path**: `/`
   * **Service Name**: `backend`
   * **Container Port**: `4000`
   * **HTTPS**: Centang **Enable SSL / Let's Encrypt**
   * **Certificate Resolver**: `letsencrypt`
   * **WebSockets**: Centang **Enable WebSocket Support** *(Penting untuk Socket.IO)*

#### Langkah 5: Klik Deploy
1. Klik tombol **Deploy** di pojok kanan atas Dokploy.
2. Dokploy akan secara otomatis:
   * Mengunduh image `postgres:16-alpine` dan `redis:7-alpine`.
   * Melakukan build multi-stage Docker image backend (NestJS 11) dan frontend (Next.js 16 standalone).
   * Menjalankan otomatis migrasi basis data Prisma (`npx prisma db push`).
   * Menghubungkan seluruh routing Traefik dan menerbitkan sertifikat SSL otomatis.

---

### METODE 2: Deployment via Modular Services di Dokploy

Jika Anda lebih memilih memisahkan database terkelola Dokploy:

1. **Buat Database PostgreSQL**: Menu **Databases** $\rightarrow$ **PostgreSQL** $\rightarrow$ Simpan URL koneksi internal (`postgresql://...`).
2. **Buat Redis Database**: Menu **Databases** $\rightarrow$ **Redis** $\rightarrow$ Simpan URL internal (`redis://...`).
3. **Buat Application Backend**: Menu **Applications** $\rightarrow$ Hubungkan Git $\rightarrow$ Build Type: `Dockerfile` (path: `/backend/Dockerfile`) $\rightarrow$ Masukkan Port `4000` & Environment Variables $\rightarrow$ Pasang domain `api.domainanda.com`.
4. **Buat Application Frontend**: Menu **Applications** $\rightarrow$ Hubungkan Git $\rightarrow$ Build Type: `Dockerfile` (path: `/frontend/Dockerfile`) $\rightarrow$ Masukkan Port `3000` & `NEXT_PUBLIC_API_URL` $\rightarrow$ Pasang domain `lms.domainanda.com`.

---

## 3. Inisialisasi Data Awal (HANYA Saat Pertama Kali Setup / Cold Start)

> ⚠️ **PERHATIAN (REDEPLOY / UPDATE SISTEM)**: 
> Ketika melakukan **redeploy** atau pembaruan kode, proses seeding **SUDAH TIDAK DIBUTUHKAN & JANGAN DIJALANKAN LAGI**. `backend/Dockerfile` sudah dikonfigurasi langsung menjalankan `node dist/main.js` tanpa menyentuh data database.

Langkah ini **HANYA** dilakukan sekali saat database pertama kali dibuat kosong:

1. Di panel Dokploy, buka service `backend` $\rightarrow$ Pilih tab **Terminal** / **Exec**.
2. Jalankan perintah migrasi skema & seeding data awal (hanya jika database kosong):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
3. Data akun bawaan, kelas simulasi, silabus RPS, modul, tugas, kuis, dan data interaksi NLP akan terisi secara otomatis:
   * **Super Admin (Peneliti)**: `admin@arjuna-lms.ac.id` / `admin123`
   * **Dosen 1**: `dosen1@arjuna-lms.ac.id` / `dosen123`
   * **Dosen 2**: `dosen2@arjuna-lms.ac.id` / `dosen123`
   * **Mahasiswa (1–8)**: `mahasiswa1@arjuna-lms.ac.id` / `mahasiswa123`

> **PENTING**: Segera masuk ke akun Admin dan ubah kata sandi melalui menu profil/pengaturan demi keamanan server produksi Anda.

---

## 4. Checklist Verifikasi Pasca-Deployment (Smoke Test)

| No | Pengujian Sistem | Cara Pengujian | Ekspektasi Hasil |
|---|---|---|---|
| 1 | **HTTPS & SSL Certificate** | Akses `https://lms.domainanda.com` | Gembok hijau SSL aktif tanpa error sertifikat |
| 2 | **Autentikasi & Cookie Session** | Login menggunakan akun `dosen1@arjuna-lms.ac.id` | Masuk ke dashboard, cookie `access_token` httpOnly terpasang |
| 3 | **Koneksi WebSocket Real-Time** | Buka forum diskusi kelas | Konsol browser menampilkan `[WebSocket] Connected` |
| 4 | **Penyusunan Kuis Daring** | Buka Tab Kuis $\rightarrow$ Buat Paket Kuis Baru | Modal terbuka, soal tersimpan, kuis muncul di daftar |
| 5 | **Pengumpulan Tugas & Turnitin** | Login mahasiswa $\rightarrow$ Kumpulkan tugas | Jawaban tersimpan dengan Turnitin Similarity Index |
| 6 | **Buku Nilai & Huruf Mutu** | Akses tab Buku Nilai pada kelas | Matriks nilai A–E dan status At-Risk terhitung otomatis |
| 7 | **Ekspor Dataset 15 Kolom** | Login Admin $\rightarrow$ `/dashboard/admin/dataset` | File `.csv` atau `.json` 15 kolom terunduh lengkap |

---

## 5. Strategi Pemeliharaan & Cadangan Rutin (Backup)

### A. Backup Otomatis Basis Data PostgreSQL via Cron di VPS
Tambahkan jadwal cron harian pada server VPS Anda:

```bash
# Buka crontab VPS
crontab -e

# Tambahkan baris berikut (Backup setiap hari pukul 02.00 pagi):
0 2 * * * docker exec -t arjuna-postgres-prod pg_dump -U arjuna arjuna_lms | gzip > /var/backups/arjuna_backup_$(date +\%Y\%m\%d).sql.gz
```

### B. Memulihkan Data Cadangan (Restore)
Jika ingin memulihkan database dari file backup:

```bash
gunzip < /var/backups/arjuna_backup_20260822.sql.gz | docker exec -i arjuna-postgres-prod psql -U arjuna -d arjuna_lms
```

---

## 6. Panduan Pemecahan Masalah (Troubleshooting)

### 1. Masalah: "CORS error" atau request API ditolak
* **Solusi**: Pastikan nilai `CORS_ORIGIN` di tab Environment Dokploy telah mencakup domain frontend Anda dengan protokol yang tepat (`https://lms.domainanda.com`).

### 2. Masalah: WebSocket sering terputus (Disconnect / Polling Fallback)
* **Solusi**: Pada konfigurasi Domain Dokploy untuk backend (`api.domainanda.com`), pastikan opsi **Enable WebSocket** sudah dicentang agar Traefik mengizinkan upgrade header `Upgrade: websocket`.

### 3. Masalah: Frontend menampilkan data lama setelah deploy
* **Solusi**: Bersihkan cache browser atau lakukan rebuild frontend dengan memilih **Redeploy with No Cache** di Dokploy.

---

**ARJUNA LMS** kini telah 100% siap untuk diproduksi secara stabil, aman, dan berkinerja tinggi di server VPS Dokploy Anda.
