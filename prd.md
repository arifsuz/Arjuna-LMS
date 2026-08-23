
# PRD.md — ARJUNA-Net Data Collection LMS

## 1. Ringkasan Eksekutif

**Nama Proyek:** ARJUNA LMS
**Tujuan:** Membangun platform LMS forum diskusi kelas yang menghasilkan **data mentah interaksi dosen–mahasiswa** (pertanyaan, jawaban, feedback, reaksi, opini) sesuai skema dataset penelitian ARJUNA-Net, agar bisa diekspor dan diproses lebih lanjut oleh pipeline NLP (BiLSTM+BERT, SSWE/EWE+CNN, dan model fusion) yang sudah dirancang di diagram alur.

**Skala awal:** 10 kelas × (1 dosen + 4 mahasiswa) = 10 dosen, 40 mahasiswa, + 1–beberapa admin peneliti.

**Prinsip penting:** LMS ini **bukan** yang menjalankan model NLP (semantic similarity, sentiment, emotion) — itu adalah pipeline riset terpisah (offline, Python/PyTorch) yang mengonsumsi hasil ekspor dataset dari LMS. LMS hanya bertanggung jawab menangkap interaksi mentah dengan struktur yang bersih dan bisa diekspor 1:1 ke kolom dataset di Image 2. Beberapa kolom (`Q-A_Relevance`, `Sentiment`, `Emotion`, dll.) diisi belakangan lewat proses anotasi/model, bukan oleh sistem real-time — tapi saya sediakan modul anotasi di Admin agar prosesnya tetap satu pintu.

---

## 2. Actors & Roles

| Role | Dibuat oleh | Kemampuan Inti |
|---|---|---|
| **Super Admin (Peneliti)** | seed awal / bootstrap | Kelola semua user, kelas, enrollment; monitor forum semua kelas; ekspor & anotasi dataset; audit log |
| **Dosen** | dibuat oleh Admin | Login via email/password yang didaftarkan admin; posting Pertanyaan ke kelasnya; menjawab pertanyaan mahasiswa; memberi Feedback atas jawaban mahasiswa; mengisi Opini pasca-interaksi |
| **Mahasiswa** | dibuat oleh Admin | Login via email/password yang didaftarkan admin; menjawab pertanyaan dosen (wajib, semua mahasiswa di kelas); bertanya ke dosen; memberi Reaksi atas feedback dosen; mengisi Opini pasca-interaksi |

Tidak ada self-registration — sesuai requirement Anda, semua akun dibuat massal oleh Admin (bulk import CSV: nama, email, role, kelas).

---

## 3. Alur Interaksi (Domain Model)

Berdasarkan skema kolom dataset Anda, satu "unit interaksi" (**Interaction Thread**) punya urutan tetap:

```
1. Lecturer_Question   (dosen post pertanyaan ke kelas)
   └─▶ 2. Student_Answer    (WAJIB — setiap mahasiswa di kelas menjawab, N jawaban per thread)
         └─▶ 3. Lecturer_Feedback  (dosen memberi feedback per jawaban / per thread)
               └─▶ 4. Student_Reaction  (mahasiswa bereaksi atas feedback)
                     └─▶ 5. Student_Opinion   (opini mahasiswa pasca-interaksi keseluruhan)
                     └─▶ 5b. Lecturer_Opinion  (opini dosen pasca-interaksi keseluruhan — sesuai Image 1 blok 3.2)
```

Ditambah **arah sebaliknya** (mahasiswa bertanya, dosen menjawab) yang disebutkan di narasi Anda — ini di-mirror sebagai `Thread` dengan `initiator_role = STUDENT`.

### Entitas Utama

```
User (id, name, email, password_hash, role[ADMIN|LECTURER|STUDENT], created_by_admin_id)
Course (id, code, name, lecturer_id, term)
Enrollment (course_id, student_id)                      // 4 mahasiswa per course
Thread (id, course_id, initiator_role, initiator_id, opened_at, status)
ThreadMessage (id, thread_id, author_id, type[QUESTION|ANSWER|FEEDBACK|REACTION], body, parent_message_id, created_at)
Opinion (id, thread_id, author_id, author_role, opinion_text, created_at)   // post-interaction opinion
DatasetLabel (id, thread_id, qa_relevance, af_relevance, feedback_novelty,
              student_sentiment, student_emotion, lecturer_sentiment, lecturer_emotion,
              interaction_quality, labeled_by, labeled_at, source[MANUAL|MODEL])
AuditLog (id, actor_id, action, entity, entity_id, meta, created_at)
```

`ThreadMessage` yang generik (bukan tabel terpisah per jenis pesan) dipilih supaya alur Q→A→Feedback→Reaction bisa fleksibel jumlahnya (misal 4 `ANSWER` dari 4 mahasiswa dalam satu thread), tapi tetap mudah di-flatten jadi baris CSV sesuai skema Anda saat ekspor (join per pasangan Student–Thread).

### Modul Anotasi Dataset (Admin)
Karena kolom `Q-A_Relevance`, `Student_Sentiment`, dst adalah **output**, saya sarankan Admin panel punya:
- Tabel `DatasetLabel` yang bisa diisi manual (anotator) **atau** diisi otomatis via endpoint `POST /api/datasets/:threadId/labels` yang dipanggil dari pipeline Python Anda setelah model ARJUNA-Net dijalankan secara offline/batch.
- Ini menjembatani LMS (pengumpul data mentah) dengan pipeline riset (penghasil label), tanpa memaksa LMS menjalankan BERT/BiLSTM secara real-time (yang justru akan membebani performa forum).

---

## 4. Functional Requirements

### 4.1 Admin
- Bulk-create user (CSV import: dosen & mahasiswa) + reset password
- Bulk-create course + assign lecturer + enroll 4 mahasiswa/kelas
- Dashboard monitoring: jumlah thread aktif, response rate mahasiswa per kelas (untuk memastikan compliance — "semua mahasiswa wajib menjawab")
- Export dataset ke CSV/JSON/Parquet sesuai skema kolom Image 2, dengan filter per kelas/tanggal
- Endpoint API untuk menerima label hasil model (integrasi pipeline riset)
- Audit log seluruh aktivitas (siapa post apa, kapan) — penting untuk validitas data riset

### 4.2 Dosen
- Buat pertanyaan baru ke kelasnya (rich text, opsional lampiran)
- Lihat status jawaban semua mahasiswa (siapa sudah/belum menjawab) — real-time
- Beri feedback per jawaban mahasiswa
- Jawab pertanyaan yang diajukan mahasiswa
- Isi opini singkat pasca-interaksi (mis. rating + teks singkat)
- Notifikasi real-time saat mahasiswa menjawab/bertanya

### 4.3 Mahasiswa
- Lihat pertanyaan dosen di kelasnya, wajib menjawab (indikator "belum menjawab" di dashboard)
- Ajukan pertanyaan ke dosen
- Beri reaksi (teks) atas feedback dosen
- Isi opini pasca-interaksi
- Notifikasi real-time saat dosen membalas/memberi feedback

### 4.4 Cross-cutting
- Semua percakapan tersimpan permanen, tidak bisa dihapus oleh dosen/mahasiswa (hanya admin, dengan audit trail) — integritas dataset penelitian
- Rich-text minimal (bold/italic/list) tanpa emoji picker (sesuai preferensi desain Anda)

---

## 5. Non-Functional Requirements

| Aspek | Target |
|---|---|
| Concurrency | Mendukung 50+ user aktif bersamaan (realistis untuk skala 50 partisipan), didesain agar bisa scale horizontal jika riset diperluas |
| Real-time latency | < 300ms untuk update forum (WebSocket) |
| Uptime selama masa pengumpulan data | Tidak ada target SLA formal, tapi harus tahan koneksi long-lived (mahasiswa buka forum berjam-jam saat diskusi asinkron) |
| Keamanan | Password hashing kuat, rate limiting, RBAC ketat per endpoint, dependency discan sebelum dipakai |
| Portabilitas data | Ekspor dataset harus 1:1 cocok kolom dengan Image 2, tanpa transformasi manual |
| Desain | Custom UI system (bukan template default shadcn tanpa modifikasi), tanpa emoji, ikon SVG konsisten |

---

## 6. Keputusan Protokol Jaringan

| Kebutuhan | Protokol | Alasan |
|---|---|---|
| Forum diskusi (pertanyaan/jawaban/feedback/reaksi muncul live) | **WebSocket** (Socket.IO dengan Redis adapter) | Butuh push real-time ke semua partisipan kelas tanpa polling; Redis adapter agar bisa scale ke banyak instance backend |
| CRUD (kelola user, kelas, export dataset) | **HTTP REST** | Operasi admin bersifat request-response biasa, tidak butuh real-time |
| Notifikasi (badge "ada jawaban baru") | WebSocket event, fallback polling jika socket terputus | Robust terhadap jaringan kampus yang mungkin tidak stabil |

---

## 7. Tech Stack yang Diusulkan

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend | **Next.js 16 (App Router) + TypeScript** | SSR untuk performa awal load, ekosistem matang |
| Styling/UI | **TailwindCSS + Radix UI primitives (dikustomisasi sendiri, bukan preset shadcn generik)** | Desain custom agar tidak terkesan "AI slop"; Radix untuk aksesibilitas komponen kompleks (modal, dropdown) |
| Icons | **lucide-react (SVG)** | Konsisten, ringan, tanpa emoji |
| Backend API + WS Gateway | **NestJS (TypeScript)** | Modular, punya Guard/Interceptor bawaan untuk RBAC, dukungan WebSocket Gateway native, cocok untuk sistem dengan banyak role & aturan akses |
| Realtime | **Socket.IO + Redis adapter** | Battle-tested, reconnection handling baik untuk koneksi mahasiswa yang tidak stabil |
| Database | **PostgreSQL** | Relasional cocok untuk struktur Course–Thread–Message yang ketat, mendukung ekspor terstruktur |
| ORM | **Prisma** | Type-safe, migrasi jelas, gampang untuk generate query ekspor dataset |
| Cache/Session/PubSub | **Redis** | Untuk socket adapter, rate limiting, dan session store |
| Auth | **JWT (access+refresh) via httpOnly cookie + argon2 password hashing** | Admin-provisioned accounts, tidak butuh OAuth pihak ketiga |
| File/CSV export | **ExcelJS / fast-csv** (server-side generate) | Untuk ekspor dataset ke CSV sesuai skema |
| Deployment | **Docker Compose** (app, ws-gateway bisa jadi 1 proses NestJS, Postgres, Redis, Nginx reverse proxy + TLS) | Reproducible, mudah dipindah ke VPS kampus/cloud |
| Monitoring dasar | **pino (structured logging)** + healthcheck endpoint | Debug lebih mudah selama masa pengumpulan data yang krusial |

---

## 8. Keamanan

- **Autentikasi:** email+password (argon2id hash), JWT access token (short-lived) + refresh token rotation, disimpan di httpOnly+SameSite cookie (bukan localStorage, mencegah XSS token theft).
- **Otorisasi:** RBAC berbasis Guard di NestJS — setiap endpoint eksplisit menyatakan role yang boleh akses; mahasiswa hanya bisa akses thread di kelas yang dia enroll.
- **Rate limiting:** per-IP dan per-user (mis. `@nestjs/throttler`) untuk endpoint auth dan posting.
- **Input sanitization:** validasi ketat (class-validator/DTO) untuk mencegah injection pada rich-text.
- **Dependency vetting (sesuai permintaan Anda):**
  - Sebelum menambah package apa pun: cek di **Socket/`socket.dev`**, **OSV.dev**, dan **npm audit** untuk indikasi malware/vulnerability.
  - Kunci versi lewat lockfile (`package-lock.json`), aktifkan **Dependabot/Renovate** untuk update terkontrol, bukan auto-update liar.
  - Hindari package yang baru rilis tanpa riwayat/maintainer jelas — prioritaskan library populer dan sudah lama dipakai (Next.js, NestJS, Prisma, Socket.IO — semuanya termasuk kategori aman/well-audited).
- **HTTPS wajib** di production (Nginx + Let's Encrypt).
- **Helmet** untuk HTTP security headers, **CORS** dibatasi ke domain frontend saja.

---

## 9. Prinsip Desain UI (anti "AI slop")

- Tidak pakai layout generik "hero + 3 card + gradient ungu-biru" khas template AI.
- Tentukan **design tokens** sendiri: 1 typeface untuk heading + 1 untuk body (bukan default Inter tanpa modifikasi), skala warna terbatas (2–3 warna inti + neutral), border-radius dan spacing konsisten lewat Tailwind config custom — bukan default.
- Semua indikator status (belum jawab/sudah jawab, notifikasi) pakai **ikon SVG + warna**, bukan emoji.
- Micro-interaction secukupnya (transisi halus), tidak berlebihan.
- Optimasi performa: `next/image` untuk aset, code-splitting per route, lazy-load komponen berat (misal rich-text editor), caching HTTP untuk data statis (daftar kelas), virtualized list untuk thread yang panjang.

---

## 10. Skema Ekspor Dataset ARJUNA-Net (18 Label / Kolom Terstandarisasi)

| No | Kolom Dataset | Sumber di LMS |
|---|---|---|
| 1 | `Log` | Timestamp format `[YYYY-MM-DD HH:mm:ss]`, Judul Thread, Metadata Partisipan |
| 2 | `Course_ID` | `Course.code` / `Course.name` |
| 3 | `Lecturer_ID` | `Course.lecturer.name` |
| 4 | `Student_ID` | `User.name (Role: STUDENT)` per baris interaksi |
| 5 | `Lecturer_Question` | `ThreadMessage.type=QUESTION` |
| 6 | `Student_Answer` | `ThreadMessage.type=ANSWER` (Level 2 / Turn N) |
| 7 | `Lecturer_Feedback` | `ThreadMessage.type=FEEDBACK` / `REPLY` Dosen |
| 8 | `Student_Reaction` | `ThreadMessage.type=REACTION` / `REPLY` Mahasiswa |
| 9 | `Lecturer_Opinion` | `Opinion.targetStudentId` (Penilaian dosen per mahasiswa) |
| 10 | `Student_Opinion` | `Opinion.authorRole=STUDENT` (Refleksi mandiri mahasiswa) |
| 11 | `Q-A_Relevance` | `DatasetLabel.qa_relevance` / Heuristik Otomatis NLP |
| 12 | `A-F_Relevance` | `DatasetLabel.af_relevance` / Heuristik Otomatis NLP |
| 13 | `Feedback_Novalty` | `DatasetLabel.feedback_novelty` / Heuristik Otomatis NLP |
| 14 | `Lecturer_Sentiment` | `Opinion.sentiment` / Heuristik Otomatis NLP |
| 15 | `Student_Sentiment` | `Opinion.sentiment` / Heuristik Otomatis NLP |
| 16 | `Lecturer_Emotion` | `Opinion.emotion` / Heuristik Otomatis NLP |
| 17 | `Student_Emotion` | `Opinion.emotion` / Heuristik Otomatis NLP |
| 18 | `Interaction_Quality` | `DatasetLabel.interaction_quality` / Fusi Relevansi $\alpha QA + \beta AF + \gamma FN$ |

Endpoint: `GET /api/datasets/export?format=csv&courseId=...` menghasilkan file dengan 18 parameter kolom lengkap siap olah model AI.

---

## 11. Roadmap Implementasi (Fase)

| Fase | Cakupan | Estimasi |
|---|---|---|
| 0 — Setup | Repo, Docker compose (Postgres, Redis), skeleton NestJS + Next.js, CI dasar | 2–3 hari |
| 1 — Auth & User Management | Login JWT, RBAC guard, bulk import user (CSV) oleh Admin | 3–4 hari |
| 2 — Course & Enrollment | CRUD kelas, assign dosen, enroll mahasiswa | 2 hari |
| 3 — Forum Core (HTTP) | Thread + Message CRUD (Question/Answer/Feedback/Reaction), status "wajib jawab" | 4–5 hari |
| 4 — Realtime Layer | Socket.IO gateway, notifikasi live, presence/typing indicator opsional | 3 hari |
| 5 — Opinion Module | Form opini pasca-interaksi dosen & mahasiswa | 1–2 hari |
| 6 — Admin Monitoring & Export | Dashboard compliance, export CSV sesuai skema, modul label dataset | 3–4 hari |
| 7 — Hardening | Rate limiting, dependency audit, security review, load test (k6/artillery untuk simulasi 50 user concurrent) | 2–3 hari |
| 8 — UI Polish | Finalisasi design tokens, aksesibilitas, ikon SVG konsisten, performance pass | 3 hari |

Total estimasi: **±4 minggu** kerja fokus (bisa dipangkas jika sebagian fase dikerjakan paralel FE/BE).

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Mahasiswa tidak menjawab semua pertanyaan (data tidak lengkap) | Dashboard compliance real-time untuk dosen/admin + reminder otomatis |
| Data forum hilang/corrupt (fatal untuk riset) | Backup harian Postgres (pg_dump terjadwal), soft-delete saja (tidak ada hard delete dari role non-admin) |
| Beban server saat semua 50 user aktif bersamaan (mis. mendekati deadline) | Redis adapter untuk Socket.IO agar scalable, load test sebelum masa pengumpulan data dimulai |
| Dependency mengandung malware | Proses vetting di §8 dijalankan sebagai checklist wajib sebelum `npm install` package baru |