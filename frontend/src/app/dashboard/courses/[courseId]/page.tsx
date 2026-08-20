"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  courses as coursesApi,
  threads as threadsApi,
  type Thread,
} from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  Send,
  Sparkles,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [threadList, setThreadList] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [courseData, threadsData] = await Promise.all([
          coursesApi.getById(courseId),
          threadsApi.list(courseId),
        ]);
        setCourse(courseData);
        setThreadList(threadsData.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    setCreating(true);
    try {
      await threadsApi.create(courseId, {
        title: newTitle,
        body: newBody,
      });
      const threadsData = await threadsApi.list(courseId);
      setThreadList(threadsData.data || []);
      setShowNewThread(false);
      setNewTitle("");
      setNewBody("");
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card-static flex flex-col items-center justify-center py-24 rounded-3xl gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat ruang diskusi kelas...</span>
      </div>
    );
  }

  if (!course || !user) return null;

  const isLecturer = user.role === "LECTURER";
  const isStudent = user.role === "STUDENT";

  return (
    <div className="space-y-6">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          href="/dashboard"
          className="glass-button-secondary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Course Banner Card */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#C9A05C]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-xl border border-[#0A3266]/25 dark:border-[#C9A05C]/40 bg-[#0A3266]/10 dark:bg-[#0A3266]/30 px-3 py-1 text-xs font-bold text-[#0A3266] dark:text-[#dbb779]">
                {course.code}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Semester {course.term}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-white">
              {course.name}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
              <span>Dosen Pengampu:</span>
              <span className="text-[#0A3266] dark:text-[#dbb779] font-bold">{course.lecturer?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-4 py-3 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0A3266] dark:text-white">
                {course.enrollments?.length || 0}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Mahasiswa Terdaftar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C]">
            <MessageSquare className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold text-[#0A3266] dark:text-slate-100">Forum Diskusi & Tanya Jawab</h2>
        </div>

        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0A3266]/20"
        >
          <Plus className="h-4 w-4 text-[#C9A05C]" />
          <span>{isStudent ? "Mulai Pertanyaan Baru" : "Buat Topik Pertanyaan Kelas"}</span>
        </button>
      </div>

      {/* New Thread Composer Form */}
      {showNewThread && (
        <form
          onSubmit={handleCreateThread}
          className="glass-panel animate-fade-in relative overflow-hidden rounded-3xl p-6 shadow-2xl border-[#C9A05C]/40"
        >
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C9A05C]/20 text-[#C9A05C]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                {isStudent ? "Ajukan Pertanyaan ke Forum Kelas" : "Publikasikan Pertanyaan Diskusi Baru"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isStudent
                  ? "Tuliskan pertanyaan dengan jelas agar dosen dan rekan kelas dapat memahami topik diskusi Anda."
                  : "Buat pertanyaan yang mendorong mahasiswa berpikir kritis dan berpartisipasi aktif."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Judul Topik Diskusi
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Analisis Kebutuhan Pengguna pada Perancangan Perangkat Lunak"
                required
                className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Uraian Lengkap / Instruksi
              </label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Jelaskan pertanyaan, konteks masalah, atau panduan jawaban yang diharapkan..."
                required
                rows={4}
                className="glass-input w-full resize-none rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewThread(false)}
                className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>{creating ? "Mempublikasikan..." : "Kirim ke Forum"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Discussion Thread List */}
      {threadList.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-black/10 dark:border-white/[0.08]">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#0A3266] dark:text-slate-200">Belum Ada Diskusi yang Dimulai</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Jadilah yang pertama membuka forum diskusi untuk kelas ini. Klik tombol di atas untuk membuat pertanyaan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {threadList.map((thread) => {
            const isLecturerThread = thread.initiatorRole === "LECTURER";
            const isOpen = thread.status === "OPEN";

            return (
              <Link
                key={thread.id}
                href={`/dashboard/courses/${courseId}/threads/${thread.id}`}
                className="glass-card group block rounded-3xl p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center rounded-xl px-3 py-0.5 text-xs font-bold border ${
                          isLecturerThread
                            ? "bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#dbb779] border-[#C9A05C]/40"
                            : "bg-[#0A3266]/15 text-[#0A3266] dark:text-[#8bb8f0] border-[#0A3266]/40"
                        }`}
                      >
                        {isLecturerThread ? "Pertanyaan Dosen" : "Pertanyaan Mahasiswa"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-0.5 text-xs font-semibold ${
                          isOpen
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                          }`}
                        />
                        {isOpen ? "Diskusi Aktif" : "Diskusi Ditutup"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#0A3266] dark:text-white group-hover:text-[#1b5ba8] dark:group-hover:text-[#C9A05C] transition-colors">
                      {thread.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Dipublikasikan oleh</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{thread.initiator.name}</span>
                      <span>•</span>
                      <span>
                        {new Date(thread.openedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    {/* Compliance summary */}
                    {thread.compliance && (isLecturer || user.role === "ADMIN") && (
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                          thread.compliance.pending === 0
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                            : "bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#dbb779] border-[#C9A05C]/40"
                        }`}
                      >
                        {thread.compliance.pending === 0 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-[#C9A05C]" />
                        )}
                        <span>
                          {thread.compliance.answered} dari {thread.compliance.total} Menjawab
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 rounded-xl bg-black/5 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-black/10 dark:border-white/[0.06]">
                      <MessageSquare className="h-3.5 w-3.5 text-[#C9A05C]" />
                      <span>{thread._count?.messages || 0} Tanggapan</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#0A3266] dark:group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
