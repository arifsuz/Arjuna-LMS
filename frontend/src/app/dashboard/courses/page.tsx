"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { courses as coursesApi, type Course } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Loader2,
  Search,
  Sparkles,
  Layers,
  GraduationCap,
  Video,
  FileCheck,
  HelpCircle,
  TrendingUp,
  LayoutGrid,
  List,
  Filter,
  Plus,
} from "lucide-react";

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  const isAdmin = user.role === "ADMIN";
  const isLecturer = user.role === "LECTURER";
  const isStudent = user.role === "STUDENT";

  // Distinct terms
  const distinctTerms = Array.from(new Set(courseList.map((c) => c.term).filter(Boolean)));

  const filteredCourses = courseList.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.lecturer?.name && c.lecturer.name.toLowerCase().includes(q));
    const matchesTerm = termFilter === "ALL" || c.term === termFilter;
    return matchesQuery && matchesTerm;
  });

  const totalEnrollments = courseList.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);
  const totalThreads = courseList.reduce((acc, c) => acc + (c._count?.threads || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* ═══ 1. Header Banner ═══ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#C9A05C]/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#ebd09e] backdrop-blur-md mb-2">
              <GraduationCap className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>
                {isLecturer
                  ? "Direktori Pengajaran & Silabus Perkuliahan"
                  : "Ruang Perkuliahan & Modul Akademik"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              {isLecturer ? "Mata Kuliah yang Anda Ampu" : "Mata Kuliah & Modul Saya"}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-[#ebd09e]/80 leading-relaxed">
              {isLecturer
                ? "Kelola materi silabus RPS, sesi tatap muka Google Meet, evaluasi tugas berkas Turnitin, dan penilaian huruf mutu mahasiswa."
                : "Akses seluruh materi perkuliahan, slide, video interaktif, kumpulkan tugas berkas, dan ikuti forum tanya jawab bersama dosen."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/dashboard/admin/courses"
                className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Kelola Mata Kuliah</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ═══ 2. Quick Overview Stats Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-[#0A3266] dark:border-l-[#C9A05C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Mata Kuliah Aktif</span>
            <BookOpen className="h-4 w-4 text-[#0A3266] dark:text-[#C9A05C]" />
          </div>
          <div className="text-2xl font-black text-[#0A3266] dark:text-white mt-1">
            {courseList.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Semester 2026/2027 Ganjil</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isLecturer ? "Total Mahasiswa Diampu" : "Rekan Mahasiswa Terdaftar"}
            </span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {totalEnrollments}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Akumulasi seluruh kelas</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Diskusi Forum Terbuka</span>
            <MessageSquare className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalThreads}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Topik tanya-jawab aktif</div>
        </div>
      </div>

      {/* ═══ 3. Search, Filter, & View Mode Switcher ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode kelas, nama mata kuliah, atau dosen..."
            className="bg-transparent text-xs font-medium focus:outline-none w-full text-[#0A3266] dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {distinctTerms.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#C9A05C]" />
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="glass-input rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                <option value="ALL">Semua Semester</option>
                {distinctTerms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-black/5 dark:bg-white/[0.05] p-1 border border-black/10 dark:border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#0A3266] text-[#0A3266] dark:text-[#ebd09e] shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#0A3266] text-[#0A3266] dark:text-[#ebd09e] shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
              }`}
              title="Tampilan Daftar Tabel"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 4. Course Listing ═══ */}
      {loading ? (
        <div className="glass-card-static flex flex-col items-center justify-center py-20 rounded-3xl gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
          <p className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">
            Memuat direktori mata kuliah...
          </p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/[0.06] text-slate-400 border border-black/10 dark:border-[#C9A05C]/20">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
            Tidak Ada Kelas Perkuliahan Ditemukan
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#ebd09e]/70 max-w-md mx-auto">
            {searchQuery
              ? "Tidak ada kelas yang cocok dengan kata kunci pencarian Anda."
              : "Anda belum terdaftar pada kelas manapun."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* 🎴 GRID VIEW */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="glass-card group relative flex flex-col justify-between rounded-3xl p-6 overflow-hidden transition-all hover:border-[#C9A05C]/50 hover:shadow-2xl"
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

                {course.description && (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <span className="font-medium text-slate-700 dark:text-[#ebd09e]">
                    {course.lecturer?.name || "Dosen Pengampu"}
                  </span>
                  <span>•</span>
                  <span>{course.term}</span>
                </div>
              </div>

              {/* 1-Click Feature Jump Bar (HCI Fitts's Law) */}
              <div className="mt-5 pt-3.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1 text-[11px] font-bold">
                <Link
                  href={`/dashboard/courses/${course.id}?tab=modules`}
                  className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[#C9A05C]/20 hover:text-[#C9A05C] transition-colors text-slate-600 dark:text-slate-300"
                  title="Modul Materi"
                >
                  Modul
                </Link>
                <Link
                  href={`/dashboard/courses/${course.id}?tab=threads`}
                  className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[#C9A05C]/20 hover:text-[#C9A05C] transition-colors text-slate-600 dark:text-slate-300"
                  title="Forum Diskusi"
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
      ) : (
        /* 📋 COMPACT LIST / TABLE VIEW */
        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 dark:border-[#C9A05C]/20 bg-[#0A3266]/10 dark:bg-[#0A3266]/30 text-[#0A3266] dark:text-[#ebd09e] font-bold">
                  <th className="py-3.5 px-4">Kode & Mata Kuliah</th>
                  <th className="py-3.5 px-3">Dosen Pengampu</th>
                  <th className="py-3.5 px-3">Semester</th>
                  <th className="py-3.5 px-3 text-center">Mahasiswa</th>
                  <th className="py-3.5 px-3 text-center">Forum</th>
                  <th className="py-3.5 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-[#C9A05C]/10 text-slate-700 dark:text-slate-200 font-medium">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0A3266] dark:text-white text-sm">
                        {c.name}
                      </div>
                      <span className="inline-block rounded-md bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#0A3266] dark:text-[#ebd09e] mt-1">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {c.lecturer?.name || "Dosen Pengampu"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">{c.term}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {c._count?.enrollments || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#C9A05C]">
                      {c._count?.threads || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/courses/${c.id}?tab=modules`}
                          className="rounded-lg px-2.5 py-1 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-[#C9A05C] hover:text-[#0A3266] font-bold text-[11px] transition-colors"
                        >
                          Buka Kelas
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
