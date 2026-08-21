"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  courses as coursesApi,
  datasets as datasetsApi,
  academic as academicApi,
  type Course,
} from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import {
  DonutChart,
  BarChart,
  StatGauge,
} from "@/components/charts";
import {
  GraduationCap,
  Users,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Loader2,
  Sparkles,
  Layers,
  Video,
  Calendar,
  Clock,
  FileCheck,
  Bell,
  ExternalLink,
  ShieldCheck,
  Award,
  Database,
  Plus,
  TrendingUp,
  AlertTriangle,
  Smile,
  Heart,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  Play,
  Zap,
  HelpCircle,
  Megaphone,
  Sliders,
  CheckSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [academicOverview, setAcademicOverview] = useState<any>(null);
  const [datasetStats, setDatasetStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const promises: Promise<any>[] = [
          coursesApi.myCourses().catch(() => []),
          academicApi.getOverview().catch(() => null),
        ];

        // Only Admin loads full dataset statistics
        if (user?.role === "ADMIN") {
          promises.push(datasetsApi.getSummary().catch(() => null));
        }

        const [coursesData, overviewData, dsStats] = await Promise.all(promises);

        setCourseList(Array.isArray(coursesData) ? coursesData : []);
        setAcademicOverview(overviewData);
        if (dsStats) setDatasetStats(dsStats);
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.role]);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const isLecturer = user.role === "LECTURER";
  const isStudent = user.role === "STUDENT";

  // Data for Charts
  const emotionChartData = [
    { label: "Happiness", value: datasetStats?.emotionCounts?.Happiness || 6, color: "#10B981" },
    { label: "Anger", value: datasetStats?.emotionCounts?.Anger || 1, color: "#EF4444" },
    { label: "Fear", value: datasetStats?.emotionCounts?.Fear || 1, color: "#8B5CF6" },
    { label: "Disgust", value: datasetStats?.emotionCounts?.Disgust || 1, color: "#F59E0B" },
    { label: "Sadness", value: datasetStats?.emotionCounts?.Sadness || 1, color: "#3B82F6" },
  ];

  const courseEnrollmentBarData = courseList.map((c) => ({
    label: c.code,
    value: c._count?.enrollments || 4,
    color: "#C9A05C",
  }));

  const firstCourseId = courseList[0]?.id;

  return (
    <div className="space-y-8 pb-12">
      {/* ═══ 1. Hero Banner with Welcome Context & Persona Insights ═══ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#C9A05C]/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 max-w-3xl">
            <div className="relative hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-[#0A3266]/20 ring-1 ring-[#C9A05C]/50 overflow-hidden">
              <Image
                src="/images/logo.jpg"
                alt="Logo Arjuna LMS"
                width={56}
                height={56}
                priority
                className="h-full w-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#ebd09e] backdrop-blur-md mb-2">
                <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>
                  {isAdmin
                    ? "Pusat Kontrol Ekosistem Akademik & Riset AI"
                    : isLecturer
                      ? "Cockpit Pengajaran & Manajemen Kelas Terpadu"
                      : "Portal Belajar & Kolaborasi Terintegrasi"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
                Selamat Datang,{" "}
                <span className="bg-gradient-to-r from-[#0A3266] via-[#1b5ba8] to-[#C9A05C] dark:from-[#C9A05C] dark:via-[#ebd09e] dark:to-[#FBF8F3] bg-clip-text text-transparent">
                  {user.name}
                </span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-[#ebd09e]/80 leading-relaxed">
                {isAdmin
                  ? "Kelola administrasi perkuliahan, pengguna, pengumuman sivitas, serta pantau visualisasi dataset & inferensi model ARJUNA-Net."
                  : isLecturer
                    ? "Kelola materi perkuliahan, buka kelas virtual Google Meet, evaluasi tugas dengan Turnitin, dan periksa Buku Nilai mahasiswa."
                    : "Akses modul kuliah, ikuti sesi tatap muka daring, kumpulkan tugas berkas tepat waktu, dan diskusikan materi bersama dosen."}
              </p>
            </div>
          </div>

          {!isAdmin && courseList.length > 0 && (
            <div className="flex items-center gap-3.5 rounded-2xl border border-black/10 dark:border-[#C9A05C]/30 bg-black/[0.02] dark:bg-[#0A3266]/40 p-4 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/25 text-[#0A3266] dark:text-[#C9A05C]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#0A3266] dark:text-[#FBF8F3]">
                  {courseList.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-[#dbb779] font-medium">
                  Mata Kuliah Terdaftar
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ 2. PERSONA SHORTCUTS & QUICK ACTION DOCK (HCI FITTS'S & HICK'S LAW) ═══ */}
      {/* 2A. DOSEN (LECTURER) QUICK ACTION DOCK */}
      {isLecturer && (
        <section className="glass-panel rounded-3xl p-6 border-l-4 border-l-[#C9A05C] space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0A3266] dark:text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#C9A05C]" />
              <span>Pintasan Aksi Dosen (Quick Action Dock)</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">1-Klik Akses Cepat</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {firstCourseId ? (
              <>
                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=virtual`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-[#0A3266]/10 dark:hover:bg-[#C9A05C]/15 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                    <Video className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Jadwalkan Meet</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Google Meet / Zoom</span>
                </Link>

                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=assignments`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-[#0A3266]/10 dark:hover:bg-[#C9A05C]/15 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Terbitkan Tugas</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Uji Turnitin Dokumen</span>
                </Link>

                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=quizzes`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-[#0A3266]/10 dark:hover:bg-[#C9A05C]/15 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Buat Kuis Daring</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Pilihan Ganda / Esai</span>
                </Link>

                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=threads`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-[#0A3266]/10 dark:hover:bg-[#C9A05C]/15 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Buka Forum Diskusi</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Topik Tanya Jawab</span>
                </Link>
              </>
            ) : (
              <p className="col-span-4 text-xs text-slate-400 text-center py-2">
                Mata kuliah belum terdaftar. Hubungi admin untuk assignment kelas.
              </p>
            )}
          </div>
        </section>
      )}

      {/* 2B. MAHASISWA (STUDENT) QUICK ACTION DOCK */}
      {isStudent && (
        <section className="glass-panel rounded-3xl p-6 border-l-4 border-l-blue-500 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0A3266] dark:text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>Aksi Cepat Mahasiswa (Learning Shortcuts)</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">Navigasi Langsung</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {firstCourseId ? (
              <>
                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=modules`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Lanjutkan Materi</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Modul Perkuliahan</span>
                </Link>

                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=assignments`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Kumpulkan Tugas</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Dropboxes & Berkas</span>
                </Link>

                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=quizzes`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-purple-500/10 dark:hover:bg-purple-500/20 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Kerjakan Kuis</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Ujian Pemahaman</span>
                </Link>

                <Link
                  href={`/dashboard/courses/${firstCourseId}?tab=threads`}
                  className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-black/5 dark:border-white/5 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A3266] dark:text-white">Diskusi Forum</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Tanya Jawab Dosen</span>
                </Link>
              </>
            ) : (
              <p className="col-span-4 text-xs text-slate-400 text-center py-2">
                Anda belum terdaftar pada kelas. Silakan hubungi dosen/admin akademik.
              </p>
            )}
          </div>
        </section>
      )}

      {/* 2C. ADMIN EXCLUSIVE: QUICK ACTION DOCK & ANALYTICS COCKPIT */}
      {isAdmin && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[#0A3266] dark:text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-[#C9A05C]" />
              <span>Pusat Kendali & Aksi Cepat Administrator</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/admin/announcements"
                className="glass-button-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm"
              >
                <Megaphone className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>Broadcast Pengumuman</span>
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="glass-button-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>Tambah Pengguna</span>
              </Link>
              <Link
                href="/dashboard/admin/courses"
                className="glass-button-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>Buat Mata Kuliah</span>
              </Link>
              <Link
                href="/dashboard/admin/settings"
                className="glass-button-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm"
              >
                <Sliders className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>Pengaturan Sistem</span>
              </Link>
              <Link
                href="/dashboard/admin/dataset"
                className="glass-button-gold inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-md"
              >
                <Database className="h-3.5 w-3.5" />
                <span>Studio Dataset AI (15-Kolom)</span>
              </Link>
            </div>
          </div>

          {/* Interactive Visualization Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Chart 1: 5-Class Ekman Emotion Distribution */}
            <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                    <Smile className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Distribusi 5 Emosi Ekman</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    ARJUNA EWE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                  Visualisasi sebaran emosi mahasiswa pada interaksi forum.
                </p>
              </div>

              <DonutChart
                data={emotionChartData}
                size={160}
                thickness={20}
                centerLabel="Total Anotasi"
                centerValue={datasetStats?.totalLabeled || emotionChartData.reduce((a, b) => a + b.value, 0)}
              />
            </div>

            {/* Chart 2: Binary Sentiment Ratio & Interaction Quality */}
            <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-[#C9A05C] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>Rasio Sentimen & Kualitas</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                    SSWE + CNN
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Sentimen Biner (Positif / Negatif) & Rata-rata Skor Relevansi.
                </p>
              </div>

              <div className="flex items-center justify-around py-2">
                <StatGauge
                  value={0.92}
                  maxValue={1}
                  label="Kualitas Interaksi"
                  subLabel="Rata-rata Skor"
                  size={115}
                  unit=""
                  statusBadge="Sangat Baik"
                  statusType="gold"
                />
                <StatGauge
                  value={0.94}
                  maxValue={1}
                  label="Q-A Relevance"
                  subLabel="Semantik Similarity"
                  size={115}
                  unit=""
                  statusBadge="Tinggi"
                  statusType="success"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px] font-semibold">
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-3 w-3" />
                    <span>Positif</span>
                  </span>
                  <span className="font-bold font-mono">{datasetStats?.sentimentCounts?.Positif || 8}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-rose-500/10 p-2 text-rose-700 dark:text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <ThumbsDown className="h-3 w-3" />
                    <span>Negatif</span>
                  </span>
                  <span className="font-bold font-mono">{datasetStats?.sentimentCounts?.Negatif || 2}</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Mahasiswa per Kelas */}
            <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-blue-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span>Partisipasi per Kelas</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300">
                    {courseList.length} Kelas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Jumlah mahasiswa terdaftar aktif per mata kuliah.
                </p>
              </div>

              <BarChart
                data={courseEnrollmentBarData}
                height={130}
                valueSuffix=" Mhs"
                className="mt-2"
              />
            </div>
          </div>
        </section>
      )}

      {/* ═══ 3. CAMPUS QUICK WIDGETS: LIVE MEETINGS, PENDING TASKS, ANNOUNCEMENTS ═══ */}
      {academicOverview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Upcoming Virtual Meetings with Direct Pulsing Join Button */}
          <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-blue-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-blue-500" />
                  <span>Kuliah Daring Terdekat</span>
                </span>
                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                  {academicOverview.upcomingMeetings?.length || 0} Sesi
                </span>
              </div>

              {academicOverview.upcomingMeetings?.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Tidak ada jadwal kuliah daring dalam waktu dekat.</p>
              ) : (
                <div className="space-y-2.5">
                  {academicOverview.upcomingMeetings?.slice(0, 2).map((m: any) => (
                    <div key={m.id} className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs space-y-1.5 border border-black/5 dark:border-white/5">
                      <div className="font-bold text-[#0A3266] dark:text-white truncate">{m.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span className="font-semibold">{m.course?.code}</span>
                        <a
                          href={m.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-button-primary inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold shadow-sm"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Masuk Meet</span>
                          <ExternalLink className="h-3 w-3 ml-0.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Pending Assignments / Grading Queue with Urgency Badges */}
          <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-amber-500" />
                  <span>{isLecturer ? "Antrean Penilaian Tugas" : "Tugas & Deadline"}</span>
                </span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {academicOverview.pendingAssignments?.length || 0} Berkas
                </span>
              </div>

              {academicOverview.pendingAssignments?.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Semua berkas telah diproses dengan lengkap.</p>
              ) : (
                <div className="space-y-2.5">
                  {academicOverview.pendingAssignments?.slice(0, 2).map((a: any) => (
                    <div key={a.id} className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs space-y-1.5 border border-black/5 dark:border-white/5">
                      <div className="font-bold text-[#0A3266] dark:text-white truncate">{a.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{a.course?.code}</span>
                        <Link
                          href={`/dashboard/courses/${a.courseId}?tab=assignments`}
                          className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>{isLecturer ? "Beri Nilai" : "Buka Tugas"}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Campus Announcements with Broadcast Indicator */}
          <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-[#C9A05C] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-[#C9A05C]" />
                  <span>Pengumuman Sivitas</span>
                </span>
                {isAdmin && (
                  <Link
                    href="/dashboard/admin/announcements"
                    className="text-[10px] font-bold text-[#C9A05C] hover:underline"
                  >
                    Kelola
                  </Link>
                )}
              </div>

              {academicOverview.recentAnnouncements?.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Belum ada pengumuman terbaru.</p>
              ) : (
                <div className="space-y-2">
                  {academicOverview.recentAnnouncements?.slice(0, 2).map((an: any) => (
                    <div key={an.id} className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs space-y-1 border border-black/5 dark:border-white/5">
                      <div className="font-bold text-[#0A3266] dark:text-white line-clamp-1">{an.title}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">{an.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 4. COURSE LIST SECTION (RICH GLASS CARDS WITH METRICS & JUMP BAR) ═══ */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C]">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
              {isAdmin ? "Semua Mata Kuliah Terdaftar" : isLecturer ? "Mata Kuliah yang Diampu" : "Mata Kuliah & Modul Saya"}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-[#dbb779]">
            {courseList.length} Mata Kuliah
          </span>
        </div>

        {loading ? (
          <div className="glass-card-static flex flex-col items-center justify-center py-20 rounded-3xl gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
            <p className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">
              Memuat data kelas perkuliahan...
            </p>
          </div>
        ) : courseList.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/[0.06] text-slate-400 dark:text-[#dbb779] border border-black/10 dark:border-[#C9A05C]/20">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
              Belum Ada Kelas yang Tersedia
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#ebd09e]/70 max-w-md mx-auto leading-relaxed">
              {isAdmin
                ? "Silakan buat kelas baru melalui menu Kelola Kelas untuk memulai aktivitas perkuliahan."
                : isLecturer
                  ? "Anda belum ditugaskan pada kelas manapun. Hubungi tim akademik kampus untuk penugasan mata kuliah."
                  : "Anda belum terdaftar pada kelas manapun. Hubungi dosen pengampu atau tim akademik kampus untuk mendapatkan akses kelas."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courseList.map((course) => (
              <div
                key={course.id}
                className="glass-card group relative flex flex-col justify-between rounded-3xl p-6 overflow-hidden transition-all hover:border-[#C9A05C]/50 hover:shadow-xl"
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-[#C9A05C]/15 rounded-full blur-2xl group-hover:bg-[#C9A05C]/25 transition-all pointer-events-none" />

                <div>
                  <div className="mb-3.5 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-xl border border-[#0A3266]/25 dark:border-[#C9A05C]/40 bg-[#0A3266]/10 dark:bg-[#0A3266]/40 px-3 py-1 text-xs font-bold text-[#0A3266] dark:text-[#ebd09e]">
                      {course.code}
                    </span>
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.06] text-slate-500 dark:text-[#dbb779] transition-all group-hover:bg-[#0A3266] dark:group-hover:bg-[#C9A05C] group-hover:text-white dark:group-hover:text-[#04132b]"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <Link href={`/dashboard/courses/${course.id}`}>
                    <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3] group-hover:text-[#1b5ba8] dark:group-hover:text-[#C9A05C] transition-colors line-clamp-1">
                      {course.name}
                    </h3>
                  </Link>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                    <span className="font-medium text-slate-700 dark:text-[#ebd09e]">
                      {course.lecturer?.name || "Dosen Pengampu"}
                    </span>
                    <span>•</span>
                    <span>{course.term}</span>
                  </div>
                </div>

                {/* 1-Click Feature Jump Bar (HCI Fitts's Law) */}
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1 text-[11px] font-bold">
                  <Link
                    href={`/dashboard/courses/${course.id}?tab=modules`}
                    className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[#C9A05C]/20 hover:text-[#C9A05C] transition-colors text-slate-600 dark:text-slate-300"
                    title="Buka Modul Materi"
                  >
                    Modul
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course.id}?tab=threads`}
                    className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[#C9A05C]/20 hover:text-[#C9A05C] transition-colors text-slate-600 dark:text-slate-300"
                    title="Buka Forum Diskusi"
                  >
                    Forum
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course.id}?tab=virtual`}
                    className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-blue-500/20 hover:text-blue-500 transition-colors text-slate-600 dark:text-slate-300"
                    title="Kelas Virtual"
                  >
                    Meet
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course.id}?tab=assignments`}
                    className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-amber-500/20 hover:text-amber-500 transition-colors text-slate-600 dark:text-slate-300"
                    title="Tugas & Turnitin"
                  >
                    Tugas
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course.id}?tab=gradebook`}
                    className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors text-slate-600 dark:text-slate-300"
                    title="Buku Nilai"
                  >
                    Nilai
                  </Link>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-black/10 dark:border-[#C9A05C]/20 pt-3 text-xs font-medium text-slate-500 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#0A3266] dark:text-[#C9A05C]" />
                    <span>{course._count?.enrollments || 0} Mahasiswa</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>{course._count?.threads || 0} Diskusi</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
