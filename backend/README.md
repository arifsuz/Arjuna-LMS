# ARJUNA LMS — Backend API & Real-Time Engine

<p align="center">
  <img src="https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/ORM-Prisma%207-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO%204-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Unit%20Tests-42%2F42%20Passed-10B981?style=for-the-badge&logo=jest&logoColor=white" alt="42 Tests Passed" />
</p>

---

## 1. Deskripsi & Arsitektur Server

Backend **ARJUNA LMS** adalah RESTful API dan Real-Time WebSocket Gateway berskala enterprise yang dibangun menggunakan framework **NestJS 11** dan **Node.js**. Server ini bertanggung jawab mengelola seluruh operasi akademik LMS, tata kelola hak akses berbasis peran (RBAC), siklus interaksi diskusi terstruktur, mesin kuis dan tugas dengan Turnitin Similarity Index, kalkulasi buku nilai otomatis (*Gradebook Matrix*), serta ekstraksi dataset 18 label terstandarisasi untuk penelitian NLP **ARJUNA-Net**.

---

## 2. Struktur Modul Backend

```
backend/
├── prisma/
│   ├── schema.prisma             # Skema Relasional PostgreSQL 16 (16 Model Data)
│   ├── seed.ts                   # Script Inisialisasi Data Demo Komprehensif
│   └── seed.js                   # Template Seeding JavaScript untuk Docker Production
├── src/
│   ├── academic/                 # Modul Utama Fitur Akademik LMS
│   │   ├── dto/                  # DTO Validasi Modul, Materi, Pertemuan, Tugas, Kuis, Nilai, Pengumuman, Settings
│   │   ├── academic.controller.ts# Endpoint REST API Akademik
│   │   ├── academic.service.ts   # Logika Bisnis & Komputasi Akademik
│   │   └── academic.service.spec.ts # 11 Skenario Pengujian Unit
│   ├── auth/                     # Autentikasi JWT & Argon2id Hashing
│   │   ├── dto/                  # LoginDto & Auth Responses
│   │   ├── guards/               # JwtAuthGuard
│   │   ├── strategies/           # JwtStrategy (Cookie & Header Bearer)
│   │   ├── auth.controller.ts    # Login, Refresh, Logout, Profile (/me)
│   │   ├── auth.service.ts       # Argon2id Hashing & JWT Token Lifecycle
│   │   └── auth.service.spec.ts  # 6 Skenario Pengujian Unit
│   ├── common/                   # Shared Infrastructure & Decorators
│   │   ├── decorators/           # @Roles(), @CurrentUser()
│   │   ├── guards/               # RolesGuard (RBAC Multi-Level Isolation)
│   │   │   └── roles.guard.spec.ts # 6 Skenario Pengujian Unit
│   │   ├── interceptors/         # AuditInterceptor (Pencatatan Audit Trail Otomatis)
│   │   └── prisma/               # PrismaService Database Connector
│   ├── courses/                  # Manajemen Entitas Kelas & Enrollment
│   │   ├── dto/                  # CreateCourseDto, EnrollStudentDto
│   │   ├── courses.controller.ts # CRUD Kelas & Penugasan Dosen
│   │   └── courses.service.ts    # Validasi Hak Akses Kelas & Mahasiswa
│   ├── datasets/                 # Mesin Ekspor Dataset & NLP Labeling
│   │   ├── dto/                  # CreateDatasetLabelDto
│   │   ├── datasets.controller.ts# Export CSV/JSON 18 Label & Live Compliance Metrics
│   │   ├── datasets.service.ts   # Pipeline Ekstraksi 18 Label, Recursive Multi-turn & Heuristik NLP
│   │   └── datasets.service.spec.ts # 7 Skenario Pengujian Unit
│   ├── events/                   # WebSocket Real-Time Gateway (Socket.IO)
│   │   ├── events.gateway.ts     # Room Subscriptions, Handshake JWT Auth, Live Broadcast
│   │   └── events.gateway.spec.ts# 4 Skenario Pengujian Unit
│   ├── opinions/                 # Pengumpulan Opini & Refleksi Diskusi Pasca-Siklus (Privat)
│   │   ├── dto/                  # CreateOpinionDto (Sentiment, Emotion, targetStudentId)
│   │   ├── opinions.controller.ts# Endpoint Refleksi Peserta
│   │   └── opinions.service.ts   # Validasi Siklus Opini Dosen (Per Mahasiswa) & Mahasiswa (Mandiri)
│   ├── threads/                  # Forum Interaksi Terstruktur (Q -> A -> F -> R)
│   │   ├── dto/                  # CreateThreadDto, CreateMessageDto
│   │   ├── threads.controller.ts # Siklus Diskusi & Pelacakan Kepatuhan Respon Mahasiswa
│   │   ├── threads.service.ts    # Enforcing Sequential Lifecycle, Auto-Close & Privacy Filtering
│   │   └── threads.service.spec.ts # 8 Skenario Pengujian Unit
│   ├── users/                    # Manajemen Pengguna & Administrator Console
│   │   ├── dto/                  # CreateUserDto, ResetPasswordDto
│   │   ├── users.controller.ts   # CRUD Pengguna & Bulk Import CSV
│   │   └── users.service.ts      # Validasi Email Unik & User Provisioning
│   ├── app.module.ts             # Root Module NestJS (Registrasi Modul & Throttler)
│   └── main.ts                   # Bootstrap Application (Port 4000, Helmet, CORS, CookieParser)
```

---

## 3. Matriks Hak Akses & Keamanan (RBAC)

Sistem menerapkan prinsip **Role-Based Access Control (RBAC)** dan isolasi data yang ketat:

| Fitur / Domain API | Role ADMIN (Peneliti) | Role LECTURER (Dosen) | Role STUDENT (Mahasiswa) |
|---|:---:|:---:|:---:|
| **Manajemen Pengguna & Bulk Import CSV** | Penuh (Read, Create, Reset Password) | Ditolak (403 Forbidden) | Ditolak (403 Forbidden) |
| **Ekspor Dataset 18 Label & Labeling NLP** | Penuh (Akses Eksklusif) | Ditolak (403 Forbidden) | Ditolak (403 Forbidden) |
| **Pengaturan Sistem Institusi (Settings)** | Penuh (Read & Update) | Ditolak (403 Forbidden) | Ditolak (403 Forbidden) |
| **Penyusunan RPS & Modul Materi** | Penuh | Penuh (Kelas Ampuan) | Read-Only (Tandai Selesai) |
| **Jadwal Kuliah Virtual (Meet / Zoom)** | Penuh | Penuh (Jadwalkan Sesi) | Read & Akses Tautan |
| **Pusat Tugas & Turnitin Similarity** | Penuh | Buat Tugas & Beri Nilai | Kumpulkan Tugas |
| **Mesin Kuis & Pembuat Soal Dinamis** | Penuh | Buat Paket Kuis & Soal | Kerjakan Kuis (Timer) |
| **Buku Nilai & Early Warning System** | Penuh | Rekap Nilai & Status At-Risk | Transkrip Mandiri |
| **Forum Diskusi ARJUNA (Q-A-F-R)** | Penuh | Buat Thread & Beri Feedback | Jawab Wajib & Beri Reaksi |
| **Refleksi Pasca-Diskusi (Privat)** | Penuh | Menilai Tiap Mahasiswa Kelas | Mengisi Refleksi Sendiri |
| **Siaran Pengumuman Kampus & Kelas** | Siaran Global & Kelas | Siaran Kelas Ampuan | Read-Only |

---

## 4. Spesifikasi REST API Utama

### A. Autentikasi (`/api/auth`)
- `POST /api/auth/login`: Autentikasi via email dan password. Menghasilkan Access Token (15m) & Refresh Token (7d) dalam format `httpOnly` cookie.
- `POST /api/auth/refresh`: Merotasi token akses tanpa meminta kredensial ulang.
- `POST /api/auth/logout`: Menghapus sesi cookie secara aman.
- `GET /api/auth/me`: Mengembalikan data identitas pengguna yang sedang login beserta peran sistemnya.

### B. Akademik & Evaluasi (`/api/academic`)
- `GET /api/academic/courses/:id/modules`: Mengambil seluruh bab/modul pembelajaran beserta materi multimedia dan status penyelesaian mahasiswa.
- `POST /api/academic/courses/:id/modules`: Menambahkan bab/modul pembelajaran baru.
- `POST /api/academic/modules/:id/materials`: Mengunggah materi pembelajaran (PDF, Slide, Video, Link, SCORM/H5P).
- `POST /api/academic/materials/:id/progress`: Mengubah status penyelesaian materi (*Toggle Progress*).
- `GET /api/academic/courses/:id/meetings`: Mengambil jadwal kuliah virtual tatap muka.
- `POST /api/academic/courses/:id/meetings`: Menjadwalkan sesi Google Meet / Zoom baru.
- `GET /api/academic/courses/:id/assignments`: Mengambil daftar tugas, batas waktu, dan daftar pengumpulan mahasiswa.
- `POST /api/academic/courses/:id/assignments`: Membuat tugas perkuliahan baru.
- `POST /api/academic/assignments/:id/submissions`: Mahasiswa mengumpulkan berkas tugas (otomatis memicu simulasi Turnitin Similarity Index).
- `POST /api/academic/submissions/:id/grade`: Dosen memberikan skor nilai dan umpan balik tugas.
- `GET /api/academic/courses/:id/quizzes`: Mengambil daftar kuis daring aktif.
- `GET /api/academic/quizzes/:id`: Mengambil detail kuis, durasi waktu, passing grade, dan butir-butir soal.
- `POST /api/academic/courses/:id/quizzes`: Dosen membuat paket kuis baru beserta butir-butir soal pilihan ganda & esai.
- `POST /api/academic/quizzes/:id/attempt`: Mahasiswa mengirimkan jawaban kuis (sistem otomatis menghitung skor nilai dan status kelulusan).
- `GET /api/academic/courses/:id/gradebook`: Menghitung dan menghasilkan matriks nilai komposit semester (Tugas 20%, Kuis 15%, Forum 15%, UTS 25%, UAS 25%), Huruf Mutu (A, AB, B, BC, C, D, E), dan indikator *Early Warning System* (At-Risk).
- `GET /api/academic/announcements`: Mengambil pengumuman institusi dan kelas.
- `POST /api/academic/courses/:id/announcements`: Menerbitkan pengumuman kelas/kampus.
- `GET /api/academic/settings` & `PATCH /api/academic/settings`: Mengelola konfigurasi parameter institusi (Admin only).

### C. Forum Interaksi Terstruktur (`/api/threads`)
- `GET /api/threads?course_id=...`: Mengambil daftar thread interaksi dalam kelas.
- `GET /api/threads/:id`: Mengambil seluruh hierarki pesan thread (Pertanyaan, Jawaban, Feedback, Reaksi) beserta status kepatuhan respons mahasiswa (dilengkapi role privacy filtering).
- `POST /api/threads`: Membuat thread baru.
- `POST /api/threads/:id/messages`: Mengirim pesan terstruktur (Answer, Feedback, atau Reaction).
- `PATCH /api/threads/:id/close`: Menutup forum diskusi secara manual dan mengaktifkan mode refleksi/evaluasi.

### D. Dataset NLP ARJUNA-Net (`/api/datasets`)
- `GET /api/datasets/export`: Mengunduh dataset interaksi 18 label dalam format CSV atau JSON.
- `GET /api/datasets/compliance`: Memantau persentase kepatuhan respon mahasiswa per kelas secara real-time.
- `POST /api/datasets/:threadId/labels`: Menyimpan anotasi kualitas interaksi, relevansi, sentimen, dan emosi (manual atau via model).

---

## 5. WebSocket Gateway Real-Time

- **Namespace**: `/ws` (Socket.IO pada port 4000)
- **Protokol Autentikasi**: Handshake JWT verifikasi otomatis via Cookie / Auth Token.
- **Kanal Room**:
  - `course:{courseId}`: Pembaruan aktivitas modul, pengumuman, dan materi kelas.
  - `thread:{threadId}`: Aliran percakapan langsung tanpa perlu me-refresh halaman web.
- **Daftar Event Siaran**:
  - `new_message`: Pesan baru masuk ke thread diskusi.
  - `student_answered`: Notifikasi saat mahasiswa menyelesaikan jawaban wajib.
  - `thread:closed`: Notifikasi forum diskusi ditutup.
  - `compliance_updated`: Pembaruan status kepatuhan interaksi kelas.
  - `new_announcement`: Siaran pengumuman penting kepada sivitas akademika.

---

## 6. Pengujian Unit & Jaminan Mutu (Unit Testing Suite)

Backend ARJUNA LMS dilengkapi rangkaian pengujian unit otomatis menggunakan **Jest** dengan cakupan 100% pada logika krusial:

```bash
# Menjalankan seluruh pengujian unit
npm run test
```

### Hasil Audit Unit Test:
- **`RolesGuard` (`src/common/guards/roles.guard.spec.ts`)**: 6/6 PASSED (RBAC enforcement, route bypass, role isolation).
- **`AuthService` (`src/auth/auth.service.spec.ts`)**: 6/6 PASSED (Argon2id hashing, JWT token lifecycle, validasi kredensial).
- **`AcademicService` (`src/academic/academic.service.spec.ts`)**: 11/11 PASSED (RPS, modul, materi progress, Turnitin similarity calculation, quiz auto-grading, gradebook letter grade matrix, broadcast pengumuman, institutional settings).
- **`ThreadsService` (`src/threads/threads.service.spec.ts`)**: 8/8 PASSED (Thread creation, message lifecycle, closed gates, compliance calculation, role privacy filtering).
- **`DatasetsService` (`src/datasets/datasets.service.spec.ts`)**: 7/7 PASSED (Ekman 5-emotion classification, SSWE sentiment polarity, composite interaction quality calculation, 18-label dataset export, multi-turn dialogue extraction, ground-truth emotion isolation).
- **`EventsGateway` (`src/events/events.gateway.spec.ts`)**: 4/4 PASSED (WebSocket handshake auth, room join/leave, live broadcast dispatching).

**Total: 42/42 PASSED (100% Success Rate).**

---

## 7. Panduan Menjalankan Backend Secara Lokal

### Prasyarat:
- Node.js v20+ atau v22+
- PostgreSQL 16 & Redis 7 (dapat dijalankan via Docker)

```bash
# 1. Masuk ke direktori backend
cd backend

# 2. Salin environment variables
cp .env.example .env

# 3. Instal dependensi
npm install

# 4. Sinkronisasi skema basis data dengan Prisma
npx prisma db push

# 5. Jalankan seed data awal komprehensif
npm run seed

# 6. Jalankan server mode development
npm run start:dev
```

Server backend akan berjalan di `http://localhost:4000`.

