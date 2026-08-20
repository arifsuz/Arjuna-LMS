# Panduan Deployment ARJUNA LMS ke VPS (Dokploy)

Panduan ini berisi langkah-langkah praktis untuk mempublikasikan platform **ARJUNA LMS** ke server VPS Anda yang telah terinstall OS/Panel **Dokploy**.

---

## 1. Persiapan Sebelum Deployment

1. **Domain / Subdomain DNS:**
   Arahkan DNS Record domain Anda ke IP Public VPS:
   - `lms.domainanda.com` (A Record ➔ `IP_VPS_ANDA`) — untuk Frontend Web
   - `api.domainanda.com` (A Record ➔ `IP_VPS_ANDA`) — untuk Backend API & WebSocket

2. **Repository Git:**
   Push source code proyek `arjuna-lms` ini ke repository Git (GitHub / GitLab / Gitea) Anda.

---

## 2. Langkah Deployment di Panel Dokploy

### Langkah 1: Buat Project Baru di Dokploy
1. Login ke panel **Dokploy** di browser Anda.
2. Klik menu **Projects** ➔ Klik tombol **Create Project**.
3. Beri nama: `ARJUNA-LMS` ➔ Klik **Create**.

---

### Langkah 2: Tambahkan Service Berbasis "Docker Compose"
1. Di dalam project `ARJUNA-LMS`, klik **Create Service** ➔ Pilih **Compose**.
2. Beri nama service: `arjuna-stack`.
3. Di tab **Source / Provider**:
   - Pilih **Git**.
   - Hubungkan akun GitHub/GitLab Anda atau masukkan URL Repository Git proyek ini.
   - Branch: `main` (atau branch utama Anda).
   - **Compose Path**: `docker-compose.prod.yml`.

---

### Langkah 3: Konfigurasi Environment Variables di Dokploy
Pilih tab **Environment** pada service compose Anda di Dokploy, lalu salin dan sesuaikan variabel berikut:

```env
# Database Credentials
POSTGRES_USER=arjuna
POSTGRES_PASSWORD=BuatPasswordDatabaseYangKuatDanUnik2026!
POSTGRES_DB=arjuna_lms

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets (Gunakan minimal 32 karakter acak)
JWT_ACCESS_SECRET=arjuna_jwt_access_secret_super_secure_production_2026_xyz
JWT_REFRESH_SECRET=arjuna_jwt_refresh_secret_super_secure_production_2026_xyz

# Domain & CORS (Ganti dengan domain Anda)
CORS_ORIGIN=https://lms.domainanda.com,https://api.domainanda.com
NEXT_PUBLIC_API_URL=https://api.domainanda.com/api
```

---

### Langkah 4: Konfigurasi Domain & SSL (Traefik / Reverse Proxy di Dokploy)

Pada tab **Domains** di Dokploy, tambahkan 2 routing domain:

1. **Routing Frontend:**
   - **Host:** `lms.domainanda.com`
   - **Path:** `/`
   - **Service Name:** `frontend`
   - **Container Port:** `3000`
   - **HTTPS / SSL:** ✅ **Enable SSL** (Let's Encrypt otomatis)

2. **Routing Backend & WebSocket:**
   - **Host:** `api.domainanda.com`
   - **Path:** `/`
   - **Service Name:** `backend`
   - **Container Port:** `4000`
   - **HTTPS / SSL:** ✅ **Enable SSL** (Let's Encrypt otomatis)
   - **WebSocket:** ✅ **Enable WebSocket Support** (penting untuk Socket.IO realtime)

---

### Langkah 5: Klik Deploy
1. Klik tombol **Deploy** di pojok kanan atas Dokploy.
2. Dokploy akan secara otomatis:
   - Men-download image PostgreSQL 16 & Redis 7.
   - Mem-build multi-stage Docker image backend & frontend.
   - Menjalankan migrasi database Prisma (`prisma db push`).
   - Menerbitkan sertifikat SSL gratis dari Let's Encrypt.

---

## 3. Mengisi Data Awal (Database Seeding) di VPS

Setelah status deploy di Dokploy berwarna hijau (**Running**):
1. Buka tab **Terminal** / **Exec** pada container `arjuna-backend-prod` di Dokploy.
2. Jalankan perintah berikut untuk mengisi akun admin, dosen, mahasiswa, dan kelas pengujian:
   ```bash
   npx prisma db seed
   ```
3. Akun bawaan siap digunakan:
   - **Super Admin:** `admin@arjuna-lms.ac.id` (Password: `admin123`)
   - **Dosen:** `dosen1@arjuna-lms.ac.id` (Password: `dosen123`)
   - **Mahasiswa:** `mahasiswa1@arjuna-lms.ac.id` (Password: `mahasiswa123`)
   *(Segera ubah password admin melalui panel admin setelah login pertama kali).*

---

## 4. Pemeliharaan & Ekspor Dataset Rutin

- **Unduh Dataset:** Akses `https://lms.domainanda.com/dashboard/admin/dataset` kapan saja untuk memantau kelengkapan respon dan mengunduh file `.csv` 15 kolom.
- **Backup Database Rutin di VPS:**
  Jalankan perintah ini di terminal VPS untuk membuat cadangan data:
  ```bash
  docker exec -t arjuna-postgres-prod pg_dump -U arjuna arjuna_lms > backup_arjuna_$(date +%Y%m%d).sql
  ```
