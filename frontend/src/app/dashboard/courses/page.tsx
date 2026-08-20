"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { courses as coursesApi, type Course } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await coursesApi.myCourses();
        setCourseList(Array.isArray(data) ? data : []);
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user) return null;

  const isLecturer = user.role === "LECTURER";

  const filteredCourses = courseList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.lecturer?.name && c.lecturer.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/10 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#dbb779] backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Daftar Perkuliahan Terdaftar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              Kelas Saya
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {isLecturer
                ? "Pilih mata kuliah yang Anda ampu untuk membuat topik diskusi baru atau memeriksa tanggapan mahasiswa."
                : "Pilih kelas untuk melihat instruksi tugas, berdiskusi dengan dosen pengampu, dan berkolaborasi."}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama mata kuliah..."
            className="glass-input w-full rounded-2xl py-3 pl-11 pr-4 text-sm placeholder-slate-400"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Menampilkan <span className="font-bold text-[#0A3266] dark:text-white">{filteredCourses.length}</span> dari {courseList.length} kelas
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="glass-card-static flex flex-col items-center justify-center py-20 rounded-3xl gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat data kelas perkuliahan...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-black/10 dark:border-white/[0.08]">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#0A3266] dark:text-slate-200">
            {searchQuery ? "Mata Kuliah Tidak Ditemukan" : "Belum Ada Kelas yang Diikuti"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian yang lain."
              : "Anda belum terdaftar pada kelas aktif. Silakan hubungi dosen pengampu untuk enrollment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="glass-card group relative flex flex-col justify-between rounded-3xl p-6 overflow-hidden"
            >
              {/* Glow accent */}
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#C9A05C]/10 rounded-full blur-2xl group-hover:bg-[#C9A05C]/20 transition-all pointer-events-none" />

              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-xl border border-[#0A3266]/25 dark:border-[#C9A05C]/40 bg-[#0A3266]/10 dark:bg-[#0A3266]/30 px-3 py-1 text-xs font-bold text-[#0A3266] dark:text-[#dbb779]">
                    {course.code}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 transition-all group-hover:bg-[#0A3266] dark:group-hover:bg-[#C9A05C] group-hover:text-white dark:group-hover:text-[#051329]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#0A3266] dark:text-white group-hover:text-[#1b5ba8] dark:group-hover:text-[#C9A05C] transition-colors line-clamp-1">
                  {course.name}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{course.lecturer?.name || "Dosen Pengampu"}</span>
                  <span>•</span>
                  <span>{course.term}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-black/10 dark:border-white/[0.06] pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
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
    </div>
  );
}
