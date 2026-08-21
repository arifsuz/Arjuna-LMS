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
  ThumbsDown,
  GraduationCap,
  MessageCircle,
  Smile,
  Flame,
  AlertCircle,
  Frown,
  Meh,
  Shield,
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
    label: "Umpan Balik Dosen / Admin",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    borderClass: "border-l-4 border-l-amber-500",
  },
  REACTION: {
    label: "Tanggapan Mahasiswa",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    borderClass: "border-l-4 border-l-emerald-500",
  },
};

const EMOTIONS_CONFIG: Record<
  string,
  { label: string; icon: any; desc: string; color: string; border: string; bg: string }
> = {
  Happiness: {
    label: "Happiness",
    icon: Smile,
    desc: "Senang / Puas",
    color: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/15",
  },
  Anger: {
    label: "Anger",
    icon: Flame,
    desc: "Kecewa / Kesal",
    color: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/40",
    bg: "bg-rose-500/15",
  },
  Fear: {
    label: "Fear",
    icon: AlertCircle,
    desc: "Cemas / Ragu",
    color: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/40",
    bg: "bg-amber-500/15",
  },
  Disgust: {
    label: "Disgust",
    icon: Frown,
    desc: "Muak / Menolak",
    color: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/40",
    bg: "bg-purple-500/15",
  },
  Sadness: {
    label: "Sadness",
    icon: Meh,
    desc: "Sedih / Sulit",
    color: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/15",
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

  // Post-interaction reflection state (ARJUNA-Net Opinion Pipeline)
  const [opinionText, setOpinionText] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("Happiness");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("Positif");
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
        } else if (user.role === "ADMIN") {
          setReplyType("FEEDBACK");
        }

        const myOpinion = data.opinions?.find(
          (o: any) => o.authorId === user.id
        );
        if (myOpinion) {
          setOpinionText(myOpinion.opinionText);
          if (myOpinion.emotion) setSelectedEmotion(myOpinion.emotion);
          if (myOpinion.sentiment) setSelectedSentiment(myOpinion.sentiment);
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

  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinionText.trim()) return;
    setSubmittingOpinion(true);
    try {
      await opinionsApi.create(threadId, {
        opinionText,
        sentiment: selectedSentiment,
        emotion: selectedEmotion,
      });
      setOpinionSaved(true);
      await loadThread();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan refleksi");
    } finally {
      setSubmittingOpinion(false);
    }
  };

  const handleCloseThread = async () => {
    if (!confirm("Apakah Anda yakin ingin menutup thread diskusi ini?")) return;
    try {
      await threadsApi.close(threadId);
      loadThread();
    } catch (err: any) {
      alert(err.message || "Gagal menutup thread");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="glass-panel text-center rounded-3xl py-12">
        <p className="text-slate-500">Thread tidak ditemukan.</p>
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="glass-button-gold mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Kelas</span>
        </Link>
      </div>
    );
  }

  const isLecturer = user?.role === "LECTURER";
  const isAdmin = user?.role === "ADMIN";
  const isClosed = thread.status === "CLOSED";

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/courses/${courseId}`}
              className="glass-button-secondary flex h-10 w-10 items-center justify-center rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 text-[#C9A05C]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#8c6828] dark:text-[#C9A05C]">
                  {thread.course.code}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {thread.course.name}
                </span>
              </div>
              <h1 className="text-xl font-black text-[#0A3266] dark:text-white">
                {thread.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  realtimeConnected
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-[11px] font-medium text-slate-400">
                {realtimeConnected ? "Live Real-Time" : "Menghubungkan..."}
              </span>
            </div>

            {isClosed ? (
              <span className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500">
                <Lock className="h-3.5 w-3.5" />
                <span>Diskusi Ditutup</span>
              </span>
            ) : (isLecturer || isAdmin) ? (
              <button
                onClick={handleCloseThread}
                className="glass-button-secondary rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Tutup Diskusi
              </button>
            ) : null}
          </div>
        </div>

        {/* Compliance Meter (For Lecturer / Admin) */}
        {thread.compliance && (
          <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 text-[#0A3266] dark:text-white">
                <GraduationCap className="h-4 w-4 text-[#C9A05C]" />
                <span>Kepatuhan Menjawab Mahasiswa</span>
              </div>
              <span className="text-[#8c6828] dark:text-[#C9A05C]">
                {thread.compliance.answered} / {thread.compliance.total} Mahasiswa (
                {Math.round(
                  (thread.compliance.answered / (thread.compliance.total || 1)) *
                    100
                )}
                %)
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0A3266] to-[#C9A05C] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (thread.compliance.answered /
                        (thread.compliance.total || 1)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages Timeline */}
      <div className="space-y-4">
        {thread.messages?.map((msg: Message) => {
          const config =
            MESSAGE_TYPE_CONFIG[msg.type] || MESSAGE_TYPE_CONFIG.QUESTION;
          const isOwnMessage = msg.author.id === user?.id;

          return (
            <div
              key={msg.id}
              className={`glass-panel relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all duration-300 ${config.borderClass}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0A3266]/10 dark:bg-white/10 text-xs font-bold text-[#0A3266] dark:text-white">
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-[#0A3266] dark:text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#C9A05C]" />
              <span>
                {replyType === "ANSWER"
                  ? "Tulis Jawaban Wajib Anda"
                  : replyType === "FEEDBACK"
                  ? "Beri Umpan Balik & Evaluasi Dosen"
                  : "Beri Tanggapan atas Diskusi"}
              </span>
            </div>

            {/* If Admin: allow switching response type */}
            {isAdmin && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Tipe Respon:</span>
                <select
                  value={replyType}
                  onChange={(e) => setReplyType(e.target.value)}
                  className="glass-input rounded-xl px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="FEEDBACK">Feedback Dosen/Admin</option>
                  <option value="ANSWER">Jawaban Kelas</option>
                  <option value="REACTION">Reaksi Mahasiswa</option>
                </select>
              </div>
            )}
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

      {/* ═══════════════════════════════════════════════════════════════════
          REFLEKSI PEMBELAJARAN (OPINION, SENTIMENT & EMOTION PIPELINE)
      ═══════════════════════════════════════════════════════════════════ */}
      <section aria-label="Refleksi Pembelajaran" className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 border-[#C9A05C]/35">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#C9A05C] border border-[#C9A05C]/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Refleksi Pembelajaran & Anotasi Emosi (ARJUNA-Net)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Pilih emosi & polaritas sentimen serta tuliskan refleksi pemahaman Anda setelah mengikuti diskusi ini.
              </p>
            </div>
          </div>

          {opinionSaved && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Refleksi & Emosi Tersimpan</span>
            </span>
          )}
        </div>

        {/* Input Form for Current User (Student, Lecturer, or Admin) */}
        <form onSubmit={handleSubmitOpinion} className="space-y-4">
          {/* Emotion & Sentiment Selection Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/[0.02] dark:bg-white/[0.03] p-4 rounded-2xl border border-black/10 dark:border-white/[0.08]">
            {/* Emotion Selection (5 classes) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0A3266] dark:text-[#ebd09e] flex items-center gap-1.5">
                <Smile className="h-4 w-4 text-[#C9A05C]" />
                <span>Pilih Emosi Anda (EWE 5-Classes):</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(EMOTIONS_CONFIG).map(([key, config]) => {
                  const isSelected = selectedEmotion === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedEmotion(key);
                        setOpinionSaved(false);
                      }}
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-bold transition-all border ${
                        isSelected
                          ? `${config.bg} ${config.color} ${config.border} ring-2 ring-[#C9A05C]/50 shadow-md`
                          : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <config.icon className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="leading-tight">{config.label}</div>
                        <div className="text-[10px] font-normal opacity-80">{config.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sentiment Selection (Positif / Negatif) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0A3266] dark:text-[#ebd09e] flex items-center gap-1.5">
                <ThumbsUp className="h-4 w-4 text-[#C9A05C]" />
                <span>Polaritas Sentimen (SSWE):</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSentiment("Positif");
                    setOpinionSaved(false);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                    selectedSentiment === "Positif"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/40 shadow-md"
                      : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4 text-emerald-500" />
                  <span>Positif (Mendukung)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSentiment("Negatif");
                    setOpinionSaved(false);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                    selectedSentiment === "Negatif"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 ring-2 ring-rose-500/40 shadow-md"
                      : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4 text-rose-500" />
                  <span>Negatif (Kritik / Kendala)</span>
                </button>
              </div>
            </div>
          </div>

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
              className="glass-button-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 shadow-lg"
            >
              {submittingOpinion ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-[#0A3266]" />
              )}
              <span>{opinionSaved ? "Perbarui Refleksi & Emosi" : "Kirim Refleksi Pembelajaran"}</span>
            </button>
          </div>
        </form>

        {/* Existing Reflections List */}
        {thread.opinions && thread.opinions.length > 0 && (
          <div className="mt-6 border-t border-black/10 dark:border-white/[0.08] pt-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Catatan Refleksi & Emosi Peserta ({thread.opinions.length})
            </h4>
            <div className="space-y-3">
              {thread.opinions.map((op: any) => {
                const emoConfig =
                  EMOTIONS_CONFIG[op.emotion] || EMOTIONS_CONFIG.Happiness;

                return (
                  <div
                    key={op.id}
                    className="rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-4 text-xs text-slate-600 dark:text-slate-300 backdrop-blur-md"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0A3266] dark:text-white">
                          {op.author?.name}
                          <span className="ml-1.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            ({op.authorRole === "LECTURER" ? "Dosen" : op.authorRole === "ADMIN" ? "Admin" : "Mahasiswa"})
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {op.emotion && emoConfig?.icon && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold border ${emoConfig.bg} ${emoConfig.color} ${emoConfig.border}`}
                          >
                            <emoConfig.icon className="h-3 w-3" />
                            <span>{op.emotion}</span>
                          </span>
                        )}

                        {op.sentiment && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                              op.sentiment === "Positif"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {op.sentiment === "Positif" ? (
                              <ThumbsUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ThumbsDown className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                            )}
                            <span>{op.sentiment}</span>
                          </span>
                        )}

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
                    </div>
                    <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      &ldquo;{op.opinionText}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
