"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { threads as threadsApi, opinions as opinionsApi, type Message } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  User as UserIcon,
  Loader2,
  Lock,
  Sparkles,
  ThumbsUp,
  GraduationCap,
  MessageCircle,
} from "lucide-react";

const MESSAGE_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; borderClass: string }
> = {
  QUESTION: {
    label: "Pertanyaan Diskusi",
    badgeClass: "bg-[#0A3266]/15 text-[#0A3266] dark:text-[#8bb8f0] border-[#0A3266]/40",
    borderClass: "border-l-4 border-l-[#0A3266]",
  },
  ANSWER: {
    label: "Jawaban Mahasiswa",
    badgeClass: "bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#dbb779] border-[#C9A05C]/40",
    borderClass: "border-l-4 border-l-[#C9A05C]",
  },
  FEEDBACK: {
    label: "Umpan Balik Dosen",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    borderClass: "border-l-4 border-l-amber-500",
  },
  REACTION: {
    label: "Tanggapan Mahasiswa",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    borderClass: "border-l-4 border-l-emerald-500",
  },
};

export default function ThreadDetailPage() {
  const { courseId, threadId } = useParams<{
    courseId: string;
    threadId: string;
  }>();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replyType, setReplyType] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Post-interaction reflection state
  const [opinionText, setOpinionText] = useState("");
  const [submittingOpinion, setSubmittingOpinion] = useState(false);
  const [opinionSaved, setOpinionSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    try {
      const data = await threadsApi.getById(threadId);
      setThread(data);
      if (user) {
        if (user.role === "STUDENT") {
          const hasAnswered = data.messages?.some(
            (m: Message) => m.author.id === user.id && m.type === "ANSWER"
          );
          setReplyType(hasAnswered ? "REACTION" : "ANSWER");
        } else if (user.role === "LECTURER") {
          setReplyType(
            data.initiatorRole === "STUDENT" ? "ANSWER" : "FEEDBACK"
          );
        }

        const myOpinion = data.opinions?.find(
          (o: any) => o.authorId === user.id
        );
        if (myOpinion) {
          setOpinionText(myOpinion.opinionText);
          setOpinionSaved(true);
        }
      }
    } catch (err) {
      console.error("Failed to load thread:", err);
    } finally {
      setLoading(false);
    }
  }, [threadId, user]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Real-time WebSocket connection
  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setRealtimeConnected(true);
      socket.emit("joinThread", { threadId });
    });

    if (socket.connected) {
      setRealtimeConnected(true);
      socket.emit("joinThread", { threadId });
    }

    socket.on("message:created", (newMsg: Message) => {
      setThread((prev: any) => {
        if (!prev) return prev;
        if (prev.messages?.some((m: Message) => m.id === newMsg.id)) {
          return prev;
        }
        return {
          ...prev,
          messages: [...(prev.messages || []), newMsg],
        };
      });
      if (newMsg.type === "ANSWER") {
        loadThread();
      }
    });

    socket.on("thread:closed", () => {
      setThread((prev: any) =>
        prev ? { ...prev, status: "CLOSED" } : prev
      );
    });

    socket.on("opinion:submitted", (newOpinion: any) => {
      setThread((prev: any) => {
        if (!prev) return prev;
        const exists = prev.opinions?.some((o: any) => o.id === newOpinion.id);
        return {
          ...prev,
          opinions: exists
            ? prev.opinions.map((o: any) =>
                o.id === newOpinion.id ? newOpinion : o
              )
            : [...(prev.opinions || []), newOpinion],
        };
      });
    });

    return () => {
      socket.emit("leaveThread", { threadId });
      socket.off("message:created");
      socket.off("thread:closed");
      socket.off("opinion:submitted");
    };
  }, [threadId, loadThread]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !replyType) return;
    setSending(true);
    try {
      await threadsApi.addMessage(threadId, {
        type: replyType,
        body: replyBody,
      });
      setReplyBody("");
      await loadThread();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      alert(err.message || "Gagal mengirim respon");
    } finally {
      setSending(false);
    }
  };

  const handleCloseThread = async () => {
    try {
      await threadsApi.close(threadId);
      await loadThread();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinionText.trim()) return;
    setSubmittingOpinion(true);
    try {
      await opinionsApi.create(threadId, { opinionText });
      setOpinionSaved(true);
      await loadThread();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan refleksi");
    } finally {
      setSubmittingOpinion(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card-static flex flex-col items-center justify-center py-24 rounded-3xl gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat percakapan diskusi...</span>
      </div>
    );
  }

  if (!thread || !user) return null;

  const isLecturer = user.role === "LECTURER" || user.role === "ADMIN";
  const isClosed = thread.status === "CLOSED";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="glass-button-secondary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Forum Kelas</span>
        </Link>
      </div>

      {/* Thread Header Banner */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center rounded-xl px-3 py-0.5 text-xs font-bold border ${
                  thread.initiatorRole === "LECTURER"
                    ? "bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#dbb779] border-[#C9A05C]/40"
                    : "bg-[#0A3266]/15 text-[#0A3266] dark:text-[#8bb8f0] border-[#0A3266]/40"
                }`}
              >
                {thread.initiatorRole === "LECTURER" ? "Pertanyaan Dosen" : "Pertanyaan Mahasiswa"}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-0.5 text-xs font-semibold ${
                  isClosed
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {isClosed ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span>{isClosed ? "Diskusi Selesai" : "Diskusi Terbuka"}</span>
              </span>

              {realtimeConnected && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Sinkronisasi Langsung</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-white">
              {thread.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>Mata Kuliah:</span>
              <span className="text-[#0A3266] dark:text-white font-bold">{thread.course?.name}</span>
              <span>•</span>
              <span>Inisiator:</span>
              <span className="text-[#8c6828] dark:text-[#C9A05C] font-semibold">{thread.initiator?.name}</span>
            </div>
          </div>

          {isLecturer && !isClosed && (
            <button
              onClick={handleCloseThread}
              className="glass-button-secondary rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300"
            >
              Tutup Forum Diskusi
            </button>
          )}
        </div>

        {/* Student Compliance Tracker */}
        {thread.compliance && isLecturer && (
          <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A3266] dark:text-slate-200">
                <GraduationCap className="h-4 w-4 text-[#C9A05C]" />
                <span>
                  Partisipasi Jawaban Mahasiswa: {thread.compliance.answered} dari {thread.compliance.total} Mahasiswa
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {thread.compliance.pending === 0
                  ? "Semua mahasiswa telah berpartisipasi"
                  : `${thread.compliance.pending} mahasiswa belum menjawab`}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {thread.compliance.students?.map((s: any) => (
                <span
                  key={s.id}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                    s.hasAnswered
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-semibold"
                      : "bg-black/5 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border-black/10 dark:border-white/[0.06]"
                  }`}
                >
                  {s.hasAnswered ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 opacity-50" />
                  )}
                  <span>{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Discussion Timeline */}
      <div className="space-y-4">
        {thread.messages?.map((msg: Message) => {
          const config =
            MESSAGE_TYPE_CONFIG[msg.type] || MESSAGE_TYPE_CONFIG.QUESTION;
          const isOwnMessage = msg.author.id === user.id;

          return (
            <div
              key={msg.id}
              className={`glass-card-static relative overflow-hidden rounded-3xl p-6 ${config.borderClass}`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0A3266] to-[#C9A05C] text-xs font-bold text-white shadow-sm">
                    {msg.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0A3266] dark:text-white">
                        {msg.author.name}
                      </span>
                      {isOwnMessage && (
                        <span className="rounded-md bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 px-2 py-0.5 text-[10px] font-bold text-[#0A3266] dark:text-[#C9A05C] border border-[#C9A05C]/30">
                          Anda
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(msg.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold border ${config.badgeClass}`}
                >
                  {config.label}
                </span>
              </div>

              <div
                className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap pl-1"
                dangerouslySetInnerHTML={{ __html: msg.body }}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Composer Form */}
      {!isClosed && (
        <form
          onSubmit={handleSendReply}
          className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-2xl"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0A3266] dark:text-white">
            <MessageCircle className="h-4 w-4 text-[#C9A05C]" />
            <span>
              {replyType === "ANSWER"
                ? "Tulis Jawaban Wajib Anda"
                : replyType === "FEEDBACK"
                  ? "Beri Umpan Balik & Evaluasi Dosen"
                  : "Beri Tanggapan atas Diskusi"}
            </span>
          </div>

          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {replyType === "ANSWER"
              ? "Berikan jawaban lengkap dan terstruktur atas pertanyaan yang diajukan."
              : replyType === "FEEDBACK"
                ? "Berikan penilaian konstruktif untuk memperdalam pemahaman mahasiswa."
                : "Sampaikan pandangan atau pertanyaan lanjutan untuk memperkaya diskusi kelas."}
          </p>

          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Tuliskan respon Anda di sini secara jelas dan terperinci..."
            required
            rows={3}
            className="glass-input mb-3 w-full resize-none rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>{sending ? "Mengirim Respon..." : "Kirim Respon"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Refleksi Pembelajaran */}
      <section aria-label="Refleksi Pembelajaran" className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 border-[#C9A05C]/35">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#C9A05C] border border-[#C9A05C]/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Refleksi Pembelajaran
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Bagikan refleksi pemahaman dan catatan belajar Anda setelah mengikuti diskusi ini.
              </p>
            </div>
          </div>

          {opinionSaved && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Refleksi Tersimpan</span>
            </span>
          )}
        </div>

        {/* Input Form for Current User */}
        <form onSubmit={handleSubmitOpinion} className="space-y-3">
          <textarea
            value={opinionText}
            onChange={(e) => {
              setOpinionText(e.target.value);
              setOpinionSaved(false);
            }}
            placeholder="Tuliskan pemahaman yang Anda dapatkan, kejelasan topik bahasan, atau saran perbaikan untuk diskusi selanjutnya..."
            required
            rows={3}
            className="glass-input w-full resize-none rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingOpinion}
              className="glass-button-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50"
            >
              {submittingOpinion ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ThumbsUp className="h-3.5 w-3.5" />
              )}
              <span>{opinionSaved ? "Perbarui Refleksi" : "Kirim Refleksi Pembelajaran"}</span>
            </button>
          </div>
        </form>

        {/* Existing Reflections List */}
        {thread.opinions && thread.opinions.length > 0 && (
          <div className="mt-6 border-t border-black/10 dark:border-white/[0.08] pt-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Catatan Refleksi Peserta ({thread.opinions.length})
            </h4>
            <div className="space-y-3">
              {thread.opinions.map((op: any) => (
                <div
                  key={op.id}
                  className="rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-4 text-xs text-slate-600 dark:text-slate-300 backdrop-blur-md"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-semibold text-[#0A3266] dark:text-white">
                      {op.author?.name}
                      <span className="ml-1.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        ({op.authorRole === "LECTURER" ? "Dosen" : "Mahasiswa"})
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(op.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    &ldquo;{op.opinionText}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
