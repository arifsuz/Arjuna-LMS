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
  AlertTriangle,
  Users,
  Loader2,
  Send,
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!course || !user) return null;

  const isLecturer = user.role === "LECTURER";
  const isStudent = user.role === "STUDENT";

  return (
    <div>
      {/* Back button */}
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Link>

      {/* Course header banner */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-[#0e1726]/80 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block mb-2.5 rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
              {course.code}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">{course.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              Dosen Pengampu: <span className="text-slate-200 font-medium">{course.lecturer?.name}</span> · Semester: {course.term}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-4 py-2 border border-slate-800 text-sm text-slate-300">
            <Users className="h-4 w-4 text-blue-400" />
            <span>{course.enrollments?.length || 0} Mahasiswa Terdaftar</span>
          </div>
        </div>
      </div>

      {/* Thread action header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Daftar Diskusi & Pertanyaan</h2>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {isStudent ? "Ajukan Pertanyaan" : "Buat Pertanyaan Dosen"}
        </button>
      </div>

      {/* New thread composer */}
      {showNewThread && (
        <form
          onSubmit={handleCreateThread}
          className="animate-fade-in mb-6 rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-xl"
        >
          <h3 className="mb-4 text-base font-bold text-white">
            {isStudent ? "Ajukan Pertanyaan ke Dosen" : "Buat Pertanyaan Baru untuk Kelas"}
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul topik diskusi / pertanyaan..."
              required
              className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Jelaskan pertanyaan atau instruksi tugas secara detail..."
              required
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-700 bg-[#070c18] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewThread(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {creating ? "Membuat..." : "Publikasikan"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Thread list */}
      {threadList.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/60 p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">
            Belum ada diskusi di kelas ini. Klik tombol di atas untuk memulai!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {threadList.map((thread) => (
            <Link
              key={thread.id}
              href={`/dashboard/courses/${courseId}/threads/${thread.id}`}
              className="group block rounded-2xl border border-slate-800/90 bg-[#0e1726]/80 p-5 shadow-md transition-all duration-150 hover:border-slate-700 hover:bg-[#0e1726]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${
                        thread.initiatorRole === "LECTURER"
                          ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {thread.initiatorRole === "LECTURER"
                        ? "Pertanyaan Dosen"
                        : "Pertanyaan Mahasiswa"}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium ${
                        thread.status === "OPEN"
                          ? "text-emerald-400"
                          : "text-slate-500"
                      }`}
                    >
                      {thread.status === "OPEN" ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {thread.status === "OPEN" ? "Terbuka" : "Ditutup"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {thread.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Oleh <span className="text-slate-300 font-medium">{thread.initiator.name}</span> ·{" "}
                    {new Date(thread.openedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Compliance badge */}
                {thread.compliance && (isLecturer || user.role === "ADMIN") && (
                  <div className="shrink-0 text-right">
                    <div
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                        thread.compliance.pending === 0
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {thread.compliance.pending === 0 ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {thread.compliance.answered}/{thread.compliance.total} Menjawab
                    </div>
                  </div>
                )}

                {/* Message count */}
                <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <span>{thread._count?.messages || 0} balasan</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
