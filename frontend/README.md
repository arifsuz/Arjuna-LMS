# ARJUNA LMS — Frontend Web Client

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/Bundler-Turbopack-000000?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turbopack" />
  <img src="https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Styling-TailwindCSS%203-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Icons-Lucide%20React%20SVG-F56565?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React" />
  <img src="https://img.shields.io/badge/Design-Glassmorphism%20%26%20HCI-C9A05C?style=for-the-badge" alt="Glassmorphism" />
</p>

---

## 1. Ikhtisar Antarmuka & Filosofi Desain

Frontend **ARJUNA LMS** adalah aplikasi web modern berperforma tinggi yang dibangun menggunakan **Next.js 16 (App Router)** dan mesin kompilasi **Turbopack**. Antarmuka ini dirancang dengan standar desain estetika premium (*Glassmorphism*), palet warna akademik eksklusif (*Deep Academic Blue* `#0A3266` & *Metallic Gold* `#C9A05C`), serta mengimplementasikan prinsip-prinsip **Human-Computer Interaction (HCI)** untuk memaksimalkan efisiensi navigasi, keterbacaan data, dan kepuasan pengguna (*User Experience*).

---

## 2. Penerapan Prinsip Human-Computer Interaction (HCI)

1. **Hukum Fitts (*Fitts's Law*)**:
   - Menempatkan tombol aksi utama (*Call-to-Action*) pada posisi strategis dengan ukuran target klik yang nyaman dan kontras tinggi (misalnya tombol *"Mulai Kerjakan Kuis"*, *"Buka Ruang Kelas"*, dan *"Dock Pintasan Menu Dosen/Mahasiswa"*).
   - Menyediakan dermaga pintasan (*Quick Action Dock*) di bagian atas dashboard untuk memangkas waktu navigasi hingga 60%.
2. **Hukum Hick (*Hick's Law*)**:
   - Mengelompokkan fungsionalitas kompleks menjadi kategori hirarkis terstruktur (*Kurikulum & Modul*, *Interaksi & Kuliah*, *Tugas & Evaluasi*) pada navigasi samping (*Sidebar*) sehingga pengguna tidak mengalami kebingungan kognitif (*choice overload*).
3. **Hukum Miller (*Miller's Law*)**:
   - Mengatur informasi pada dashboard dan ruang kelas dalam 5–7 kluster visual yang mudah dicerna (kartu metrik capaian, daftar kuis, linimasa tugas, buku nilai).
4. **10 Heuristik Usabilitas Nielsen (*Nielsen's Usability Heuristics*)**:
   - **Visibilitas Status Sistem**: Indikator koneksi WebSocket real-time, lencana status (*Lulus/Remedial*, *At-Risk*, *Turnitin Similarity Score*), dan bar progres modul.
   - **Pencegahan Kesalahan (*Error Prevention*)**: Konfirmasi batas waktu pengerjaan kuis, validasi kelengkapan formulir sebelum submit, dan modal pratinjau nilai.
   - **Konsistensi & Standar**: Kepatuhan penuh pada aturan tipografi formal dan sistem ikon SVG tanpa penggunaan emoji mentah di seluruh aplikasi.

---

## 3. Struktur Direktori & Halaman (App Router)

```
frontend/src/
├── app/
│   ├── page.tsx                    # Landing Page Beranda Interaktif (Hero Showcase, Arsitektur, Fitur)
│   ├── login/                      # Halaman Autentikasi Modern dengan Glass Halo Effect
│   ├── dashboard/                  # Area Kerja Utama Terproteksi
│   │   ├── layout.tsx              # AppShell: Sidebar Hirarkis, Top Bar Dinamis, Breadcrumbs
│   │   ├── page.tsx                # Universal Dashboard (Persona Insights & Metrik Visual)
│   │   ├── announcements/          # Halaman Pusat Pengumuman Kampus & Filter Prioritas
│   │   ├── courses/                # Direktori Perkuliahan & Header Kontekstual Shortcut
│   │   │   ├── page.tsx            # Daftar Kelas (Grid/List Mode) dengan Tab Filter Kategori
│   │   │   └── [courseId]/         # Workspace Ruang Kelas Terintegrasi
│   │   │       ├── page.tsx        # 7-Tab Modul: RPS, Forum, Meet, Tugas, Kuis, Nilai, Pengumuman
│   │   │       └── threads/
│   │   │           └── [threadId]/ # Ruang Diskusi Interaktif (Q-A-F-R Lifecycle & Refleksi Opini)
│   │   └── admin/                  # Konsol Manajemen Khusus Super Admin (Peneliti)
│   │       ├── announcements/      # Manajemen Siaran Pengumuman Massal
│   │       ├── courses/            # Manajemen Kelas & Penugasan Dosen
│   │       ├── dataset/            # Ekspor Dataset 15 Kolom & Anotasi Interaktif NLP
│   │       ├── settings/           # Pengaturan Parameter Sistem & Institusi
│   │       └── users/              # Manajemen Akun Pengguna & Bulk Import CSV
├── components/
│   ├── charts/                     # Komponen Visualisasi Data Kustom (Bar, Donut, Radial Gauge)
│   │   ├── bar-chart.tsx           # Diagram Batang Distribusi Nilai & Emosi
│   │   ├── donut-chart.tsx         # Diagram Donut Polaritas Sentimen
│   │   ├── stat-gauge.tsx          # Radial Stat Gauge (Early Warning & Kepatuhan)
│   │   └── index.ts                # Barrel Export Komponen Charts
│   └── theme-toggle.tsx            # Pengalih Tema Adaptif (Terang, Gelap, Sistem)
└── lib/
    ├── api.ts                      # Klien REST API Terstruktur (Axios/Fetch Wrapper)
    ├── auth-context.tsx            # Global State Management untuk Autentikasi Pengguna
    ├── theme-context.tsx           # Context Penyedia Tema Gelap/Terang
    └── socket.ts                   # Manajer Koneksi WebSocket Real-Time
```

---

## 4. Fitur Utama Berdasarkan Peran Pengguna

### A. Peran Mahasiswa (Student)
- **Ringkasan Akademik Interaktif**: Memantau progres penyelesaian materi, tugas aktif, jadwal Google Meet, dan indeks prestasi sementara.
- **Learning Path Modul**: Membaca slide presentasi, materi PDF, dan video perkuliahan serta mencatat status penyelesaian per bab.
- **Pusat Tugas & Turnitin**: Mengunggah berkas tugas dengan simulasi estimasi keaslian *Turnitin Similarity Score* secara transparan.
- **Mesin Kuis Daring (Quiz Engine)**: Mengerjakan kuis pilihan ganda dan esai dengan penghitung waktu mundur (*countdown timer*) dan penilaian skor otomatis.
- **Forum Diskusi Wajib (ARJUNA Flow)**: Menjawab pertanyaan dosen, membaca umpan balik, memberikan reaksi, dan mencatatkan refleksi emosi (*Happiness, Anger, Fear, Disgust, Sadness*).
- **Transkrip Nilai Mandiri**: Melihat rekapitulasi nilai komponen dan status evaluasi belajar.

### B. Peran Dosen (Lecturer)
- **Penyusun Kurikulum & RPS**: Mengatur capaian pembelajaran lulusan (CPL) dan mengunggah modul multimedia.
- **Manajemen Kuliah Tatap Muka**: Menjadwalkan sesi perkuliahan virtual via Google Meet dan Zoom.
- **Pusat Tugas & Penilaian Cepat (*Quick Grade*)**: Menilai jawaban mahasiswa, meninjau skor orisinalitas Turnitin, dan memberikan feedback evaluasi.
- **Pembuat Kuis Dinamis (*Quiz Authoring Builder*)**: Menyusun paket kuis baru, menetapkan durasi, passing grade, bobot persentase, serta menyusun butir soal pilihan ganda (dengan kunci jawaban) dan soal esai.
- **Buku Nilai & Early Warning System**: Meninjau matriks nilai semester seluruh mahasiswa kelas dan mendeteksi mahasiswa yang berada dalam status *At-Risk*.

### C. Peran Super Admin (Peneliti)
- **Tata Kelola Pengguna**: Menambah, mencari, mereset kata sandi, serta mengimpor ratusan akun dosen/mahasiswa melalui file CSV secara massal.
- **Tata Kelola Kelas**: Membuka kelas baru, menetapkan dosen pengampu, dan mendaftarkan mahasiswa.
- **Eksplorasi & Ekspor Dataset 18 Label**: Mengunduh dataset interaksi lengkap dalam format CSV/JSON untuk pelatihan model NLP.
- **Anotasi Data NLP Interaktif**: Melakukan pelabelan data relevansi pertanyaan-jawaban, kebaruan feedback, sentimen dosen & mahasiswa, dan emosi secara manual atau semi-otomatis.
- **Konfigurasi Institusi**: Mengatur nama kampus, batas waktu tugas, ambang batas Turnitin, dan parameter platform.

---

## 5. Standar Desain, Modal Dialog & Iconography

* **100% SVG Iconography**: Menggunakan pustaka resmi **Lucide React SVG Icons**. Tidak ada penggunaan karakter emoji mentah pada antarmuka, menjaga tampilan tetap bersih, elegan, dan profesional.
* **React Portal Viewport-Centered Modals**: Komponen `ConfirmationModal` dirender melalui `createPortal(..., document.body)` dengan backdrop `z-[99999]` dan penguncian scroll (`overflow: hidden`) otomatis pada `document.body` saat terbuka, memastikan dialog aksi konfirmasi langsung terlihat tepat di tengah pandangan mata pengguna tanpa perlu menggulir layar.
* **Hierarki Percakapan Single-Column**: Struktur percakapan interaktif forum mengalir dalam satu kolom kontainer per jawaban mahasiswa, dengan lencana balasan kontekstual (`Menjawab pertanyaan Dosen`, `Membalas Arif`, dsb.) dan formulir evaluasi refleksi privat pasca-penutupan forum.
* **Palet Warna Utama**:
  - `Academic Blue (#0A3266)`: Warna dasar wibawa akademik dan integritas data.
  - `Metallic Gold (#C9A05C)`: Warna aksen premium untuk elemen aktif, lencana prestasi, dan tombol utama.
  - `Emerald Accent (#10B981)`: Indikator keberhasilan, kelulusan, dan sentimen positif.
  - `Rose Accent (#EF4444)`: Indikator peringatan dini (*Early Warning*), tugas mendesak, dan sentimen negatif.
* **Tipografi**: Menggunakan font modern dari Google Fonts (**Outfit** dan **Inter**) dengan hierarki visual terdefinisi.

---

## 6. Panduan Menjalankan Frontend Secara Lokal

### Prasyarat:
- Node.js v20+ atau v22+
- Server Backend ARJUNA LMS berjalan pada `http://localhost:4000`

```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Buat file environment local
cp .env.example .env.local

# 3. Pastikan konfigurasi URL Backend
# NEXT_PUBLIC_API_URL=http://localhost:4000/api

# 4. Instal dependensi paket
npm install

# 5. Jalankan server pengembangan (Next.js dengan Turbopack)
npm run dev

# 6. Untuk validasi build produksi
npm run build
```

Aplikasi web dapat diakses melalui browser pada `http://localhost:3000`.

