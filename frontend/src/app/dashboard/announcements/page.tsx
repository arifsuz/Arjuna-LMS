"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { academic as academicApi } from "@/lib/api";
import Link from "next/link";
import {
  Megaphone,
  Search,
  Bell,
  Pin,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sliders,
  Filter,
  Sparkles,
} from "lucide-react";

export default function CampusAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
      try {
        const data = await academicApi.getGeneralAnnouncements();
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const filteredAnnouncements = announcements.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.author?.name && a.author.name.toLowerCase().includes(q)) ||
      (a.course?.name && a.course.name.toLowerCase().includes(q));
    const matchesPriority =
      priorityFilter === "ALL" ||
      (priorityFilter === "URGENT" && a.priority === "URGENT") ||
      (priorityFilter === "PINNED" && a.isPinned);
    return matchesQuery && matchesPriority;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ═══ 1. Header Banner ═══ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#C9A05C]/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#ebd09e] backdrop-blur-md mb-2">
              <Megaphone className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Papan Informasi & Pengumuman Resmi Sivitas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              Pengumuman Akademik & Kampus
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-[#ebd09e]/80 leading-relaxed">
              Informasi terkini mengenai kalender akademik, jadwal perkuliahan, siaran resmi universitas, dan instruksi dosen pengampu kelas.
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/dashboard/admin/announcements"
              className="glass-button-gold inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black shadow-lg"
            >
              <Sliders className="h-4 w-4" />
              <span>Kelola Broadcast Admin</span>
            </Link>
          )}
        </div>
      </div>

      {/* ═══ 2. Search & Filter Bar ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengumuman, pengirim, atau mata kuliah..."
            className="bg-transparent text-xs font-medium focus:outline-none w-full text-[#0A3266] dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#C9A05C]" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <option value="ALL">Semua Pengumuman</option>
            <option value="PINNED">Disematkan (Pinned)</option>
            <option value="URGENT">Penting (Urgent)</option>
          </select>
        </div>
      </div>

      {/* ═══ 3. Announcements List ═══ */}
      {loading ? (
        <div className="glass-card-static flex flex-col items-center justify-center py-20 rounded-3xl gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
          <p className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">
            Memuat pengumuman kampus...
          </p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/[0.06] text-slate-400 border border-black/10 dark:border-[#C9A05C]/20">
            <Bell className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
            Tidak Ada Pengumuman
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#ebd09e]/70 max-w-md mx-auto">
            {searchQuery
              ? "Tidak ada pengumuman yang cocok dengan pencarian Anda."
              : "Belum ada siaran pengumuman terbaru saat ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((a) => {
            const isUrgent = a.priority === "URGENT";
            const isPinned = a.isPinned;

            return (
              <div
                key={a.id}
                className={`glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-7 transition-all shadow-lg border-l-4 ${
                  isUrgent
                    ? "border-l-rose-500 bg-rose-500/[0.02]"
                    : isPinned
                      ? "border-l-[#C9A05C] bg-[#C9A05C]/[0.02]"
                      : "border-l-[#0A3266] dark:border-l-slate-400"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A05C]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#8c6828] dark:text-[#ebd09e] border border-[#C9A05C]/40">
                        <Pin className="h-3 w-3" />
                        <span>Disematkan</span>
                      </span>
                    )}
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-300 border border-rose-500/40">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Penting / Urgent</span>
                      </span>
                    )}
                    {a.course ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 border border-blue-500/30">
                        <BookOpen className="h-3 w-3" />
                        <span>{a.course.code} - {a.course.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <Sparkles className="h-3 w-3" />
                        <span>Siaran Seluruh Sivitas Kampus</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(a.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-[#0A3266] dark:text-white mb-2">
                  {a.title}
                </h2>

                <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {a.content}
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <User className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>Diterbitkan oleh: {a.author?.name || "Administrator Akademik"}</span>
                  </span>
                  {a.courseId && (
                    <Link
                      href={`/dashboard/courses/${a.courseId}?tab=announcements`}
                      className="inline-flex items-center gap-1 font-bold text-[#C9A05C] hover:underline"
                    >
                      <span>Buka Ruang Kelas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
