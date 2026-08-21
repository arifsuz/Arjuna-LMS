"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  courses as coursesApi,
  academic as academicApi,
  type Course,
} from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [academicOverview, setAcademicOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [coursesData, overviewData] = await Promise.all([
          coursesApi.myCourses(),
          academicApi.getOverview().catch(() => null),
        ]);
        setCourseList(Array.isArray(coursesData) ? coursesData : []);
        setAcademicOverview(overviewData);
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const isLecturer = user.role === "LECTURER";
  const isStudent = user.role === "STUDENT";

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner with Brand Logo */}
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
                <span>Sistem Manajemen Pembelajaran Kampus & Riset AI</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
                Selamat Datang,{" "}
                <span className="bg-gradient-to-r from-[#0A3266] via-[#1b5ba8] to-[#C9A05C] dark:from-[#C9A05C] dark:via-[#ebd09e] dark:to-[#FBF8F3] bg-clip-text text-transparent">
                  {user.name}
                </span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-[#ebd09e]/80 leading-relaxed">
                {isAdmin
                  ? "Pusat monitoring administrasi akademik, RPS, kelas virtual, kuis, tugas, serta dataset penelitian ARJUNA-Net."
                  : isLecturer
                    ? "Kelola RPS, modul materi, jadwalkan kelas daring, evaluasi tugas & kuis, serta pandu diskusi kelas Anda."
                    : "Akses modul RPS perkuliahan, hadiri kelas virtual, kumpulkan tugas dengan Turnitin, dan diskusikan materi bersama dosen."}
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
                  Mata Kuliah Aktif
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campus Quick Widgets Grid (Virtual Meetings, Pending Tasks, Announcements) */}
      {academicOverview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Upcoming Virtual Meetings */}
          <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-blue-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-blue-500" />
                  <span>Kuliah Daring Hari Ini</span>
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
                    <div key={m.id} className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs space-y-1">
                      <div className="font-bold text-[#0A3266] dark:text-white truncate">{m.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{m.course?.code}</span>
                        <a
                          href={m.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>Masuk Meet</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Pending Assignments */}
          <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-amber-500" />
                  <span>Tugas & Deadline</span>
                </span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {academicOverview.pendingAssignments?.length || 0} Tugas
                </span>
              </div>

              {academicOverview.pendingAssignments?.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Semua tugas telah diselesaikan dengan baik.</p>
              ) : (
                <div className="space-y-2.5">
                  {academicOverview.pendingAssignments?.slice(0, 2).map((a: any) => (
                    <div key={a.id} className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs space-y-1">
                      <div className="font-bold text-[#0A3266] dark:text-white truncate">{a.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{a.course?.code}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {new Date(a.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Campus Announcements */}
          <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-[#C9A05C] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-[#C9A05C]" />
                  <span>Pengumuman Sivitas</span>
                </span>
              </div>

              {academicOverview.recentAnnouncements?.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Belum ada pengumuman terbaru.</p>
              ) : (
                <div className="space-y-2">
                  {academicOverview.recentAnnouncements?.slice(0, 2).map((an: any) => (
                    <div key={an.id} className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs space-y-1">
                      <div className="font-bold text-[#0A3266] dark:text-white line-clamp-1">{an.title}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{an.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Stat Cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminGlassStatCard
            label="Total Kelas Aktif"
            value={courseList.length}
            description="Mata kuliah terdaftar dalam sistem"
            icon={GraduationCap}
            glowColor="from-[#0A3266]/20 to-[#0A3266]/5 dark:from-[#0A3266]/50 dark:to-[#0A3266]/20 text-[#0A3266] dark:text-[#8bb8f0] border-[#0A3266]/30 dark:border-[#C9A05C]/40"
          />
          <AdminGlassStatCard
            label="Total Topik Diskusi"
            value={courseList.reduce((sum, c) => sum + (c._count?.threads || 0), 0)}
            description="Thread interaksi dosen dan mahasiswa"
            icon={MessageSquare}
            glowColor="from-[#C9A05C]/25 to-[#C9A05C]/5 dark:from-[#C9A05C]/35 dark:to-[#C9A05C]/15 text-[#8c6828] dark:text-[#C9A05C] border-[#C9A05C]/40"
          />
          <AdminGlassStatCard
            label="Total Pendaftaran Mahasiswa"
            value={courseList.reduce(
              (sum, c) => sum + (c._count?.enrollments || 0),
              0
            )}
            description="Partisipasi mahasiswa di seluruh kelas"
            icon={Users}
            glowColor="from-[#124687]/20 to-[#C9A05C]/10 dark:from-[#0A3266]/40 dark:to-[#C9A05C]/20 text-[#0A3266] dark:text-[#ebd09e] border-[#C9A05C]/35"
          />
        </div>
      )}

      {/* Course List Section */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C]">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
              {isAdmin ? "Semua Mata Kuliah Terdaftar" : "Daftar Mata Kuliah Anda"}
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
                : "Anda belum terdaftar pada kelas manapun. Hubungi dosen pengampu atau tim akademik kampus untuk mendapatkan akses kelas."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courseList.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="glass-card group relative flex flex-col justify-between rounded-3xl p-6 overflow-hidden transition-all hover:border-[#C9A05C]/50 hover:shadow-xl"
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-[#C9A05C]/15 rounded-full blur-2xl group-hover:bg-[#C9A05C]/25 transition-all pointer-events-none" />

                <div>
                  <div className="mb-3.5 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-xl border border-[#0A3266]/25 dark:border-[#C9A05C]/40 bg-[#0A3266]/10 dark:bg-[#0A3266]/40 px-3 py-1 text-xs font-bold text-[#0A3266] dark:text-[#ebd09e]">
                      {course.code}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.06] text-slate-500 dark:text-[#dbb779] transition-all group-hover:bg-[#0A3266] dark:group-hover:bg-[#C9A05C] group-hover:text-white dark:group-hover:text-[#04132b]">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3] group-hover:text-[#1b5ba8] dark:group-hover:text-[#C9A05C] transition-colors line-clamp-1">
                    {course.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                    <span className="font-medium text-slate-700 dark:text-[#ebd09e]">
                      {course.lecturer?.name || "Dosen Pengampu"}
                    </span>
                    <span>•</span>
                    <span>{course.term}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-black/10 dark:border-[#C9A05C]/20 pt-4 text-xs font-medium text-slate-500 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#0A3266] dark:text-[#C9A05C]" />
                    <span>{course._count?.enrollments || 0} Mahasiswa</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>{course._count?.threads || 0} Diskusi</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminGlassStatCard({
  label,
  value,
  description,
  icon: Icon,
  glowColor,
}: {
  label: string;
  value: number;
  description: string;
  icon: any;
  glowColor: string;
}) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#dbb779]">
            {label}
          </span>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${glowColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-[#ebd09e]/80 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
