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
  AlertTriangle,
  MessageSquare,
  User as UserIcon,
  Loader2,
  Lock,
  Sparkles,
  Radio,
  Clock,
  ThumbsUp,
} from "lucide-react";

const MESSAGE_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; borderClass: string }
> = {
  QUESTION: {
    label: "Pertanyaan",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    borderClass: "border-l-blue-500",
  },
  ANSWER: {
    label: "Jawaban Mahasiswa",
    badgeClass: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    borderClass: "border-l-teal-500",
  },
  FEEDBACK: {
    label: "Feedback Dosen",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    borderClass: "border-l-amber-500",
  },
  REACTION: {
    label: "Reaksi Mahasiswa",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    borderClass: "border-l-emerald-500",
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

  // Opinion state (Fase 5)
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

        // Check if user already submitted an opinion
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

  // Real-time WebSocket connection (Fase 4)
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
        // Avoid duplicate
        if (prev.messages?.some((m: Message) => m.id === newMsg.id)) {
          return prev;
        }
        return {
          ...prev,
          messages: [...(prev.messages || []), newMsg],
        };
      });
      // Refresh compliance if answer
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
      alert(err.message || "Gagal menyimpan opini");
    } finally {
      setSubmittingOpinion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!thread || !user) return null;

  const isLecturer = user.role === "LECTURER" || user.role === "ADMIN";
  const isClosed = thread.status === "CLOSED";

  return (
    <div>
      {/* Back button */}
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Forum Kelas
      </Link>

      {/* Thread header card */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-[#0e1726]/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold border ${
                  thread.initiatorRole === "LECTURER"
                    ? "bg-teal-500/15 text-teal-400 border-teal-500/30"
                    : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                }`}
              >
                {thread.initiatorRole === "LECTURER"
                  ? "Pertanyaan Dosen"
                  : "Pertanyaan Mahasiswa"}
              </span>

              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  isClosed ? "text-slate-500" : "text-emerald-400"
                }`}
              >
                {isClosed ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {isClosed ? "Thread Ditutup" : "Thread Terbuka"}
              </span>

              {realtimeConnected && (
                <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              {thread.title}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Kelas:{" "}
              <span className="text-slate-300 font-medium">
                {thread.course?.name}
              </span>{" "}
              · Diinisiasi oleh:{" "}
              <span className="text-slate-200 font-medium">
                {thread.initiator?.name}
              </span>
            </p>
          </div>

          {isLecturer && !isClosed && (
            <button
              onClick={handleCloseThread}
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            >
              Tutup Diskusi
            </button>
          )}
        </div>

        {/* Compliance tracker for lecturer */}
        {thread.compliance && isLecturer && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#070c18] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-200">
              <AlertTriangle
                className={`h-4 w-4 ${
                  thread.compliance.total === thread.compliance.answered
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              />
              <span>
                Status Partisipasi Jawaban: {thread.compliance.answered}/
                {thread.compliance.total} Mahasiswa
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {thread.compliance.students?.map((s: any) => (
                <span
                  key={s.id}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                    s.hasAnswered
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold"
                      : "bg-slate-800/80 text-slate-400 border-slate-700/60"
                  }`}
                >
                  {s.hasAnswered ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 opacity-60" />
                  )}
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages timeline */}
      <div className="space-y-4">
        {thread.messages?.map((msg: Message) => {
          const config =
            MESSAGE_TYPE_CONFIG[msg.type] || MESSAGE_TYPE_CONFIG.QUESTION;
          const isOwnMessage = msg.author.id === user.id;

          return (
            <div
              key={msg.id}
              className={`animate-fade-in rounded-2xl border border-slate-800/90 bg-[#0e1726]/80 p-5 shadow-lg border-l-4 ${config.borderClass}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-xs font-bold text-blue-400">
                    {msg.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-200">
                      {msg.author.name}
                      {isOwnMessage && (
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          (Anda)
                        </span>
                      )}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      ·{" "}
                      {new Date(msg.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${config.badgeClass}`}
                >
                  {config.label}
                </span>
              </div>

              <div
                className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: msg.body }}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Composer */}
      {!isClosed && (
        <form
          onSubmit={handleSendReply}
          className="mt-6 rounded-2xl border border-slate-800 bg-[#0e1726] p-5 shadow-xl"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span>
              {replyType === "ANSWER"
                ? "Tulis Jawaban Wajib Anda"
                : replyType === "FEEDBACK"
                  ? "Beri Feedback / Penilaian Dosen"
                  : "Beri Reaksi / Tanggapan atas Feedback"}
            </span>
          </div>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Tulis respon Anda di sini secara lengkap..."
            required
            rows={3}
            className="mb-3 w-full resize-none rounded-xl border border-slate-700 bg-[#070c18] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? "Mengirim..." : "Kirim Respon"}
            </button>
          </div>
        </form>
      )}

      {/* ═══ Fase 5: Post-Interaction Opinion Module ═══ */}
      <div className="mt-8 rounded-2xl border border-amber-500/30 bg-[#0e1726]/90 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Opini Pasca-Interaksi (Dataset ARJUNA-Net)
              </h3>
              <p className="text-xs text-slate-400">
                Refleksi singkat pemahaman dan kualitas diskusi untuk dataset riset.
              </p>
            </div>
          </div>
          {opinionSaved && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Opini Tersimpan
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
            placeholder="Tuliskan opini/refleksi Anda setelah mengikuti diskusi ini (misal: tingkat kejelasan materi, pemahaman yang didapat, atau saran perbaikan)..."
            required
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-700 bg-[#070c18] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingOpinion}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-amber-500 active:scale-95 disabled:opacity-50"
            >
              {submittingOpinion ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ThumbsUp className="h-3.5 w-3.5" />
              )}
              {opinionSaved ? "Perbarui Opini" : "Kirim Opini Pasca-Interaksi"}
            </button>
          </div>
        </form>

        {/* Existing Opinions List */}
        {thread.opinions && thread.opinions.length > 0 && (
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Opini Partisipan ({thread.opinions.length})
            </h4>
            <div className="space-y-3">
              {thread.opinions.map((op: any) => (
                <div
                  key={op.id}
                  className="rounded-xl border border-slate-800 bg-[#070c18]/70 p-3.5 text-xs text-slate-300"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {op.author?.name}
                      <span className="ml-1.5 text-[10px] text-slate-500">
                        ({op.authorRole === "LECTURER" ? "Dosen" : "Mahasiswa"})
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(op.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="italic text-slate-300">"{op.opinionText}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
