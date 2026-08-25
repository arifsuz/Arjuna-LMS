"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sparkles,
  ArrowRight,
  LogIn,
  GraduationCap,
  Users,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen selection:bg-[#C9A05C]/30 selection:text-[#C9A05C] overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          1. NAVIGATION BAR (Sticky Glass Header)
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-[#C9A05C]/25 bg-white/80 dark:bg-[#061a3b]/85 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-md shadow-[#0A3266]/15 ring-2 ring-[#C9A05C]/50 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo_arjuna-net.jpeg"
                alt="Logo Arjuna LMS"
                width={40}
                height={40}
                priority
                className="h-full w-full object-contain rounded-xl"
              />
              <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-tr from-[#0A3266] to-[#C9A05C] text-white">
                <Sparkles className="h-2.5 w-2.5" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
                ARJUNA{" "}
                <span className="bg-gradient-to-r from-[#0A3266] via-[#1b5ba8] to-[#C9A05C] dark:from-[#C9A05C] dark:via-[#ebd09e] dark:to-[#FBF8F3] bg-clip-text text-transparent">
                  LMS
                </span>
              </span>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-[#ebd09e]/80">
                Ruang Kolaborasi & Forum Perkuliahan
              </p>
            </div>
          </Link>

          {/* Quick Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-200">
            <a
              href="#beranda"
              className="transition hover:text-[#0A3266] dark:hover:text-[#C9A05C]"
            >
              Beranda
            </a>
            <a
              href="#fitur"
              className="transition hover:text-[#0A3266] dark:hover:text-[#C9A05C]"
            >
              Fitur Utama
            </a>
            <a
              href="#kolaborasi"
              className="transition hover:text-[#0A3266] dark:hover:text-[#C9A05C]"
            >
              Kolaborasi
            </a>
            <a
              href="#pembelajaran"
              className="transition hover:text-[#0A3266] dark:hover:text-[#C9A05C]"
            >
              Pembelajaran
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="glass-button-primary flex items-center gap-2 rounded-2xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-[#0A3266]/10 dark:shadow-[#C9A05C]/20 transition-all active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk LMS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. HERO SECTION WITH HEADER IMAGE ASSET
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="beranda"
        className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 overflow-hidden"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-4 py-1.5 text-xs font-bold text-[#8c6828] dark:text-[#ebd09e] backdrop-blur-md mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Sistem Pembelajaran & Forum Diskusi Terintegrasi</span>
            </div>

            {/* Headline */}
            <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[#0A3266] dark:text-[#FBF8F3] leading-[1.15]">
              Evolusi Pembelajaran Digital &{" "}
              <span className="bg-gradient-to-r from-[#0A3266] via-[#1b5ba8] to-[#C9A05C] dark:from-[#C9A05C] dark:via-[#ebd09e] dark:to-[#FBF8F3] bg-clip-text text-transparent">
                Kolaborasi Akademik
              </span>{" "}
              Masa Depan
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-sm sm:text-base lg:text-lg text-slate-600 dark:text-[#ebd09e]/90 font-medium leading-relaxed">
              Selamat datang di <strong>ARJUNA LMS</strong>. Platform pembelajaran
              interaktif yang menghubungkan dosen dan mahasiswa melalui forum diskusi
              terstruktur, peta kompetensi, dan materi perkuliahan kolaboratif.
            </p>

            {/* CTA Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="glass-button-primary flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm sm:text-base font-extrabold shadow-xl shadow-[#0A3266]/15 dark:shadow-[#C9A05C]/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Masuk ke Ruang Belajar</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>

              <a
                href="#fitur"
                className="glass-button-secondary flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm sm:text-base font-bold transition-all hover:scale-105"
              >
                <span>Jelajahi Fitur</span>
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            {/* ─── Hero Showcase: [header.jpg] in Glassmorphism Frame ─── */}
            <div className="mt-14 w-full max-w-5xl">
              <div className="rounded-[32px] sm:rounded-[40px] p-2.5 sm:p-3.5 backdrop-blur-2xl bg-white/40 dark:bg-[#0A3266]/25 border border-white/60 dark:border-[#C9A05C]/40 shadow-[0_25px_70px_-15px_rgba(10,50,102,0.18)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)] transition-all">
                <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-white/80 dark:border-[#C9A05C]/30 bg-black/5 dark:bg-[#030d1d]/60 aspect-[16/9] sm:aspect-[21/10]">
                  <Image
                    src="/images/header.jpg"
                    alt="Peta Pembelajaran dan Target Karir Arjuna LMS"
                    fill
                    priority
                    className="object-cover object-center transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 1200px) 100vw, 1200px"
                  />

                  {/* Subtle Corner Gradient Badges */}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 rounded-2xl bg-black/60 dark:bg-[#030d1d]/80 px-3.5 py-1.5 backdrop-blur-md border border-white/20 dark:border-[#C9A05C]/40 text-white text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>Peta Pembelajaran Terarah</span>
                  </div>

                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 hidden sm:flex items-center gap-2 rounded-2xl bg-[#0A3266]/80 dark:bg-[#C9A05C]/90 px-4 py-2 backdrop-blur-md border border-white/20 text-white dark:text-[#04132b] text-xs font-extrabold shadow-lg">
                    <GraduationCap className="h-4 w-4" />
                    <span>Target Kompetensi & Sertifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. STATS & VALUE HIGHLIGHT STRIP
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 -mt-8 sm:-mt-12 mb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-panel grid grid-cols-2 md:grid-cols-4 gap-6 rounded-3xl p-6 sm:p-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0A3266] dark:text-[#C9A05C]">
                100%
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-[#ebd09e]">
                Interaktif & Real-Time
              </p>
            </div>

            <div className="text-center border-l border-black/10 dark:border-[#C9A05C]/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0A3266] dark:text-[#C9A05C]">
                Modul Terpadu
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-[#ebd09e]">
                Materi, Tugas & Kuis
              </p>
            </div>

            <div className="text-center border-l-0 md:border-l border-black/10 dark:border-[#C9A05C]/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0A3266] dark:text-[#C9A05C]">
                Multi-Peran
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-[#ebd09e]">
                Mahasiswa, Dosen & Admin
              </p>
            </div>

            <div className="text-center border-l border-black/10 dark:border-[#C9A05C]/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0A3266] dark:text-[#C9A05C]">
                Responsif
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-[#ebd09e]">
                Web, Tablet & Mobile
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. FEATURE 1: GROUP COLLABORATION WITH [kolaborasi.jpg]
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="kolaborasi" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Image Showcase: [kolaborasi.jpg] */}
            <div className="lg:col-span-6">
              <div className="rounded-[32px] p-2.5 sm:p-3 backdrop-blur-2xl bg-white/40 dark:bg-[#0A3266]/25 border border-white/60 dark:border-[#C9A05C]/40 shadow-2xl transition-all hover:scale-[1.01]">
                <div className="relative overflow-hidden rounded-[24px] border border-white/80 dark:border-[#C9A05C]/30 bg-white dark:bg-[#030d1d]/60 aspect-[16/10]">
                  <Image
                    src="/images/kolaborasi.jpg"
                    alt="Kolaborasi Grup dan Berbagi Ide Modular Arjuna LMS"
                    fill
                    className="object-cover object-center transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Right Text Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3.5 py-1 text-xs font-bold text-[#8c6828] dark:text-[#ebd09e]">
                <Users className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>Kolaborasi Grup & Forum Diskusi</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3] leading-tight">
                Diskusi Perkuliahan Lebih Hidup & Berbobot
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-[#ebd09e]/90 leading-relaxed font-medium">
                Arjuna LMS menyediakan forum diskusi interaktif berbasis kelas dan
                topik. Mahasiswa dapat bertukar wawasan, mengajukan pertanyaan, dan
                menerima tanggapan langsung dari dosen pengampu secara terstruktur.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Thread Diskusi Terstruktur
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Pengelompokan pesan dan pembahasan per modul mata kuliah agar materi tetap rapi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Notifikasi & Umpan Balik Real-Time
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Pemberitahuan instan saat ada diskusi baru atau jawaban dosen untuk kelas Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Dataset Analisis Partisipasi
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Pemantauan keaktifan belajar secara analitis untuk mendukung evaluasi akademik.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. FEATURE 2: FLEXIBLE MOBILE LEARNING WITH [pembelajaran.jpg]
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="pembelajaran" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Text Content */}
            <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3.5 py-1 text-xs font-bold text-[#8c6828] dark:text-[#ebd09e]">
                <BookOpen className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>Pembelajaran Seluler & Fleksibel</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3] leading-tight">
                Belajar Kapan Saja & Di Mana Saja
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-[#ebd09e]/90 leading-relaxed font-medium">
                Akses platform secara lancar melalui perangkat desktop, tablet, maupun
                ponsel pintar Anda. Nikmati fleksibilitas mempelajari materi kuliah,
                mengikuti kuis, dan memeriksa penilaian akademik dalam satu genggaman.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Modul Kursus & Silabus Interaktif
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Materi teks, video perkuliahan, dan dokumen pendukung tersusun secara sistematis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Kuis, Tugas, & Penilaian Cepat
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Pelaksanaan evaluasi pembelajaran yang terintegrasi dengan rekapitulasi nilai otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Dukungan Mode Terang & Mode Gelap
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Kenyamanan visual saat belajar siang maupun malam dengan sistem warna adaptif.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image Showcase: [pembelajaran.jpg] */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="rounded-[32px] p-2.5 sm:p-3 backdrop-blur-2xl bg-white/40 dark:bg-[#0A3266]/25 border border-white/60 dark:border-[#C9A05C]/40 shadow-2xl transition-all hover:scale-[1.01]">
                <div className="relative overflow-hidden rounded-[24px] border border-white/80 dark:border-[#C9A05C]/30 bg-white dark:bg-[#030d1d]/60 aspect-[16/10]">
                  <Image
                    src="/images/pembelajaran.jpg"
                    alt="Fleksibilitas Pembelajaran Seluler Arjuna LMS"
                    fill
                    className="object-cover object-center transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. ROLE-BASED ECOSYSTEM SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="fitur" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3.5 py-1 text-xs font-bold text-[#8c6828] dark:text-[#ebd09e] mb-3">
              <Layers className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Ekosistem Terintegrasi</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              Dukungan Penuh untuk Setiap Peran
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-[#ebd09e]/85 font-medium">
              Dirancang khusus untuk mendukung alur kerja seluruh pemangku kepentingan akademik kampus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Mahasiswa */}
            <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/25 text-[#0A3266] dark:text-[#C9A05C]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                Untuk Mahasiswa
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Akses materi perkuliahan, berpartisipasi aktif dalam forum kelas, diskusikan tugas bersama kelompok, dan lacak capaian belajar Anda.
              </p>
            </div>

            {/* Card 2: Dosen Pengampu */}
            <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/25 text-[#0A3266] dark:text-[#C9A05C]">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                Untuk Dosen Pengampu
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Buat modul perkuliahan terstruktur, pimpin dan moderasi forum diskusi interaktif, serta berikan bimbingan langsung kepada mahasiswa.
              </p>
            </div>

            {/* Card 3: Administrator */}
            <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/25 text-[#0A3266] dark:text-[#C9A05C]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                Untuk Administrator
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Kelola pengguna secara terpusat, pantau aktivitas mata kuliah, serta akses dataset pembelajaran untuk riset dan evaluasi mutu institusi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          7. BOTTOM CTA & FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-black/10 dark:border-[#C9A05C]/25 bg-white/60 dark:bg-[#030d1d]/85 backdrop-blur-2xl py-12 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-[#0A3266]/15 ring-1 ring-[#C9A05C]/40">
                <Image
                  src="/images/logo_arjuna-net.jpeg"
                  alt="Logo Arjuna LMS"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
                  ARJUNA <span className="text-[#C9A05C]">LMS</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-[#ebd09e]/80">
                  © {new Date().getFullYear()} ARJUNA LMS. Hak Cipta Dilindungi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md"
              >
                <LogIn className="h-4 w-4" />
                <span>Masuk ke Ruang Belajar</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
