"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { threads as threadsApi, opinions as opinionsApi, type Message } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { ConfirmationModal } from "@/components/confirmation-modal";
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
  Clock,
  Reply,
  X,
  HeartHandshake,
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
  { label: string; icon: any; color: string; border: string; bg: string; colorClass: string; desc: string }
> = {
  Happiness: {
    label: "Happiness",
    icon: Smile,
    color: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/15",
    colorClass: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    desc: "Senang / Termotivasi / Paham",
  },
  Anger: {
    label: "Anger",
    icon: Flame,
    color: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/40",
    bg: "bg-rose-500/15",
    colorClass: "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10",
    desc: "Jengkel / Keberatan",
  },
  Fear: {
    label: "Fear",
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/40",
    bg: "bg-amber-500/15",
    colorClass: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10",
    desc: "Cemas / Bingung / Ragu",
  },
  Disgust: {
    label: "Disgust",
    icon: Meh,
    color: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/40",
    bg: "bg-purple-500/15",
    colorClass: "text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10",
    desc: "Menolak / Tidak Puas",
  },
  Sadness: {
    label: "Sadness",
    icon: Frown,
    color: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/15",
    colorClass: "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10",
    desc: "Sedih / Kecewa / Sulit",
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
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Post-interaction reflection state (Separated Opinion & Emotion Pipelines)
  const [opinionText, setOpinionText] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<string>(""); // Default: empty/null
  const [selectedSentiment, setSelectedSentiment] = useState<string>(""); // Default: empty/null
  const [submittingEmotion, setSubmittingEmotion] = useState(false);
  const [submittingOpinion, setSubmittingOpinion] = useState(false);
  const [emotionSaved, setEmotionSaved] = useState(false);
  const [opinionSaved, setOpinionSaved] = useState(false);

  // Custom Modal Dialogs (No window.alert / window.confirm)
  const [modalAlert, setModalAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
  });

  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [closingThread, setClosingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyFormRef = useRef<HTMLFormElement>(null);
  const opinionSectionRef = useRef<HTMLElement>(null);

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
          if (myOpinion.opinionText && myOpinion.opinionText.trim() !== "") {
            setOpinionText(myOpinion.opinionText);
            setOpinionSaved(true);
          }
          if (myOpinion.emotion) {
            setSelectedEmotion(myOpinion.emotion);
            setEmotionSaved(true);
          }
          if (myOpinion.sentiment) {
            setSelectedSentiment(myOpinion.sentiment);
          }
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

  // Start replying to a specific message conforming to role rules
  const handleStartReply = (msg: Message) => {
    if (!user) return;
    if (user.role === "STUDENT" && msg.author.role !== "LECTURER") {
      setModalAlert({
        isOpen: true,
        title: "Batasan Balasan Role",
        message: "Sebagai Mahasiswa, Anda hanya dapat membalas pesan dari Dosen pengampu.",
        variant: "warning",
      });
      return;
    }
    if (user.role === "LECTURER" && msg.author.role !== "STUDENT") {
      setModalAlert({
        isOpen: true,
        title: "Batasan Balasan Role",
        message: "Sebagai Dosen, Anda hanya dapat membalas pesan dari Mahasiswa.",
        variant: "warning",
      });
      return;
    }

    setReplyingToMessage(msg);

    if (user.role === "STUDENT") {
      const hasAnswered = thread?.messages?.some(
        (m: Message) => m.author.id === user.id && m.type === "ANSWER"
      );
      setReplyType(hasAnswered ? "REACTION" : "ANSWER");
    } else if (user.role === "LECTURER") {
      setReplyType("FEEDBACK");
    }

    setTimeout(() => {
      replyFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !replyType) return;
    setSending(true);
    try {
      await threadsApi.addMessage(threadId, {
        type: replyType,
        body: replyBody,
        parentMessageId: replyingToMessage ? replyingToMessage.id : undefined,
      });
      setReplyBody("");
      setReplyingToMessage(null);
      await loadThread();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      setModalAlert({
        isOpen: true,
        title: "Gagal Mengirim Respon",
        message: err.message || "Terjadi kesalahan saat mengirim pesan balasan.",
        variant: "danger",
      });
    } finally {
      setSending(false);
    }
  };

  // Submit Emotion & Sentiment Separately
  const handleSubmitEmotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmotion && !selectedSentiment) {
      setModalAlert({
        isOpen: true,
        title: "Pilih Emosi atau Sentimen",
        message: "Silakan pilih salah satu ikon emosi atau tombol polaritas sentimen sebelum menyimpan.",
        variant: "warning",
      });
      return;
    }
    setSubmittingEmotion(true);
    try {
      await opinionsApi.create(threadId, {
        emotion: selectedEmotion || undefined,
        sentiment: selectedSentiment || undefined,
      });
      setEmotionSaved(true);
      await loadThread();
    } catch (err: any) {
      setModalAlert({
        isOpen: true,
        title: "Gagal Menyimpan Emosi",
        message: err.message || "Terjadi kesalahan saat menyimpan anotasi emosi.",
        variant: "danger",
      });
    } finally {
      setSubmittingEmotion(false);
    }
  };

  // Submit Reflection Opinion Separately (Mandatory for closing)
  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinionText.trim()) {
      setModalAlert({
        isOpen: true,
        title: "Opini Tidak Boleh Kosong",
        message: "Silakan tuliskan refleksi pembelajaran Anda sebelum menyimpan.",
        variant: "warning",
      });
      return;
    }
    setSubmittingOpinion(true);
    try {
      await opinionsApi.create(threadId, {
        opinionText: opinionText.trim(),
      });
      setOpinionSaved(true);
      await loadThread();
    } catch (err: any) {
      setModalAlert({
        isOpen: true,
        title: "Gagal Menyimpan Refleksi",
        message: err.message || "Terjadi kesalahan saat menyimpan refleksi opini.",
        variant: "danger",
      });
    } finally {
      setSubmittingOpinion(false);
    }
  };

  // Check opinion requirement before closing
  const handleOpenCloseModal = () => {
    setShowCloseConfirmModal(true);
  };

  const handleConfirmCloseThread = async () => {
    setClosingThread(true);
    try {
      await threadsApi.close(threadId);
      setShowCloseConfirmModal(false);
      await loadThread();
    } catch (err: any) {
      setShowCloseConfirmModal(false);
      setModalAlert({
        isOpen: true,
        title: "Gagal Menutup Forum",
        message: err.message || "Pastikan Refleksi Opini Dosen telah terisi sebelum menutup forum secara manual.",
        variant: "warning",
      });
    } finally {
      setClosingThread(false);
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
  const isExpired =
    isClosed || (thread.expiresAt && new Date() > new Date(thread.expiresAt));

  // Check if current lecturer or any lecturer has filled opinion
  const lecturerOpinionObj = thread.opinions?.find(
    (o: any) => o.authorRole === "LECTURER" && o.opinionText && o.opinionText.trim() !== ""
  );
  const isLecturerOpinionFilled = !!lecturerOpinionObj;

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

          <div className="flex flex-wrap items-center gap-3">
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

            {/* Session Expiration Badge */}
            {thread.expiresAt && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                  isExpired
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                    : "border-[#C9A05C]/30 bg-[#C9A05C]/10 text-[#8c6828] dark:text-[#ebd09e]"
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>
                  {isExpired
                    ? "Sesi Kadaluarsa"
                    : `Batas Sesi: ${new Date(thread.expiresAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                </span>
              </span>
            )}

            {isClosed ? (
              <span className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500">
                <Lock className="h-3.5 w-3.5" />
                <span>Diskusi Ditutup</span>
              </span>
            ) : isLecturer || isAdmin ? (
              <button
                type="button"
                onClick={handleOpenCloseModal}
                className="glass-button-secondary rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-red-500/40 hover:text-red-500 transition-colors"
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

      {/* Session Expired Notice Banner */}
      {isExpired && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-md animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-600 dark:text-rose-300">
                Sesi Forum Diskusi Telah Ditutup / Kadaluarsa
              </h4>
              <p className="text-xs text-rose-600/90 dark:text-rose-300/90 mt-1 leading-relaxed">
                Waktu sesi aktif diskusi telah berakhir. Peserta tidak dapat mengirimkan respon atau balasan baru, namun seluruh riwayat tanya-jawab dan refleksi pembelajaran tetap dapat diakses dalam mode baca (Read-Only).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Timeline */}
      <div className="space-y-4">
        {thread.messages?.map((msg: Message) => {
          const config =
            MESSAGE_TYPE_CONFIG[msg.type] || MESSAGE_TYPE_CONFIG.QUESTION;
          const isOwnMessage = msg.author.id === user?.id;

          // Role-based reply constraints:
          // Mahasiswa can ONLY reply to Dosen messages
          // Dosen can ONLY reply to Mahasiswa messages
          // Admin can reply to all messages
          const canReplyToMsg =
            !isExpired &&
            (isAdmin ||
              (user?.role === "STUDENT" && msg.author.role === "LECTURER") ||
              (user?.role === "LECTURER" && msg.author.role === "STUDENT"));

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
                      <span className="rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {msg.author.role === "LECTURER" ? "Dosen" : "Mahasiswa"}
                      </span>
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

              {/* Parent Message Quoted Preview if replying to a specific message */}
              {msg.parent && (
                <div className="mb-3 rounded-2xl border border-[#C9A05C]/30 bg-black/[0.03] dark:bg-white/[0.04] p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#8c6828] dark:text-[#ebd09e] text-[11px] mb-1">
                    <Reply className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>
                      Membalas pesan dari {msg.parent.author?.name || "Pengguna"} (
                      {msg.parent.author?.role === "LECTURER" ? "Dosen" : "Mahasiswa"}):
                    </span>
                  </div>
                  <p className="line-clamp-2 italic text-slate-600 dark:text-slate-300 font-sans pl-4 border-l-2 border-[#C9A05C]/50">
                    "{msg.parent.body.replace(/<[^>]*>?/gm, "")}"
                  </p>
                </div>
              )}

              <div
                className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap pl-1"
                dangerouslySetInnerHTML={{ __html: msg.body }}
              />

              {/* Reply Button on Message conforming to Role Rules */}
              {canReplyToMsg && (
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleStartReply(msg)}
                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-[#0A3266] dark:text-[#ebd09e] bg-[#0A3266]/10 dark:bg-[#C9A05C]/15 hover:bg-[#0A3266]/20 dark:hover:bg-[#C9A05C]/25 transition-all shadow-sm group"
                  >
                    <Reply className="h-3.5 w-3.5 text-[#C9A05C] group-hover:-translate-x-0.5 transition-transform" />
                    <span>Balas Pesan Ini</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Composer Form */}
      {!isExpired ? (
        <form
          ref={replyFormRef}
          onSubmit={handleSendReply}
          className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-2xl border-t-2 border-t-[#C9A05C]/50"
        >
          {/* Targeted Reply Banner if Replying to a Message */}
          {replyingToMessage && (
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-[#C9A05C]/15 border border-[#C9A05C]/35 p-3.5 text-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <Reply className="h-4 w-4 text-[#C9A05C] shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0A3266] dark:text-white">
                      Membalas: {replyingToMessage.author.name}
                    </span>
                    <span className="rounded-md bg-[#0A3266]/15 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0A3266] dark:text-[#C9A05C]">
                      {replyingToMessage.author.role === "LECTURER" ? "Dosen" : "Mahasiswa"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 italic mt-0.5">
                    "{replyingToMessage.body.replace(/<[^>]*>?/gm, "")}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="glass-button-secondary flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                title="Batal Membalas Spesifik"
              >
                <X className="h-3.5 w-3.5" />
                <span>Batal</span>
              </button>
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-[#0A3266] dark:text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#C9A05C]" />
              <span>
                {replyingToMessage
                  ? `Kirim Balasan untuk ${replyingToMessage.author.name}`
                  : replyType === "ANSWER"
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

          <div className="flex justify-end gap-2">
            {replyingToMessage && (
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal Reply
              </button>
            )}
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
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          REFLEKSI PEMBELAJARAN & ANOTASI EMOSI (ARJUNA-Net Pipeline)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={opinionSectionRef}
        aria-label="Refleksi Pembelajaran"
        className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 border-[#C9A05C]/35 space-y-8"
      >
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#C9A05C] border border-[#C9A05C]/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Refleksi Pembelajaran & Anotasi Emosi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Pengumpulan data afektif & evaluasi pemahaman untuk peningkatan kualitas pembelajaran dan dataset ARJUNA-Net.
              </p>
            </div>
          </div>
        </div>

        {/* ── BAGIAN 1: ANOTASI EMOSI & SENTIMEN (OPSIONAL / TERPISAH) ── */}
        <div className="rounded-3xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Smile className="h-4 w-4 text-[#C9A05C]" />
              <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#ebd09e]">
                1. Anotasi Emosi & Sentimen Interaksi (Opsional)
              </h4>
            </div>
            {emotionSaved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Emosi Tersimpan ({selectedEmotion || "Tersimpan"})</span>
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
            💡 <strong>Catatan:</strong> Jika Anda tidak memilih emosi atau sentimen secara manual, sistem NLP heuristik ARJUNA-Net akan menginferensi emosi dan sentimen Anda secara otomatis dari teks jawaban atau pesan diskusi.
          </div>

          <form onSubmit={handleSubmitEmotion} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emotion Selection (5 classes - default unselected/null) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300 flex items-center justify-between">
                  <span>Pilih Kategori Emosi:</span>
                  {selectedEmotion ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmotion("");
                        setEmotionSaved(false);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-white underline"
                    >
                      Reset Pilihan
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum dipilih (Default: Auto)</span>
                  )}
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
                          setEmotionSaved(false);
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

              {/* Sentiment Selection (Positif / Negatif / Netral) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300 flex items-center justify-between">
                  <span>Pilih Polaritas Sentimen:</span>
                  {selectedSentiment ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSentiment("");
                        setEmotionSaved(false);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-white underline"
                    >
                      Reset Pilihan
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum dipilih (Default: Auto)</span>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSentiment("Positif");
                      setEmotionSaved(false);
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
                      setEmotionSaved(false);
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

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingEmotion}
                className="glass-button-secondary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-[#0A3266] dark:text-[#ebd09e] disabled:opacity-50"
              >
                {submittingEmotion && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{emotionSaved ? "Perbarui Anotasi Emosi" : "Simpan Pilihan Emosi"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── BAGIAN 2: REFLEKSI PEMBELAJARAN (WAJIB DIISI) ── */}
        <div className="rounded-3xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#C9A05C]" />
              <h4 className="text-sm font-bold text-[#0A3266] dark:text-[#ebd09e]">
                2. Refleksi & Opini Pembelajaran {isLecturer ? "(Wajib untuk Dosen)" : "(Wajib)"}
              </h4>
            </div>
            {opinionSaved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Refleksi Opini Tersimpan</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isLecturer
              ? "Sebagai Dosen pengampu, Anda wajib mengisi evaluasi & refleksi diskusi ini sebelum dapat menutup forum secara manual."
              : "Tuliskan pemahaman yang Anda dapatkan, kejelasan topik bahasan, atau saran perbaikan untuk diskusi selanjutnya."}
          </p>

          <form onSubmit={handleSubmitOpinion} className="space-y-3">
            <textarea
              value={opinionText}
              onChange={(e) => {
                setOpinionText(e.target.value);
                setOpinionSaved(false);
              }}
              placeholder="Tuliskan refleksi opini dan evaluasi diskusi di sini (minimal 3 karakter)..."
              required
              rows={3}
              className="glass-input w-full resize-none rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
            />

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submittingOpinion || !opinionText.trim()}
                className="glass-button-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 shadow-lg"
              >
                {submittingOpinion ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-[#0A3266]" />
                )}
                <span>{opinionSaved ? "Perbarui Refleksi Opini" : "Simpan Refleksi Opini"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Reflections List from All Participants */}
        {thread.opinions && thread.opinions.length > 0 && (
          <div className="border-t border-black/10 dark:border-white/[0.08] pt-6">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Catatan Refleksi & Emosi Peserta ({thread.opinions.length})
            </h4>
            <div className="space-y-3">
              {thread.opinions.map((op: any) => {
                const emoConfig =
                  op.emotion && EMOTIONS_CONFIG[op.emotion]
                    ? EMOTIONS_CONFIG[op.emotion]
                    : null;

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
                        {emoConfig?.icon && (
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
                    {op.opinionText ? (
                      <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        &ldquo;{op.opinionText}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        (Anotasi emosi tersimpan tanpa catatan teks)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Confirmation Modal: Tutup Diskusi Manual */}
      <ConfirmationModal
        isOpen={showCloseConfirmModal}
        onClose={() => setShowCloseConfirmModal(false)}
        onConfirm={
          isLecturer && !isLecturerOpinionFilled
            ? () => {
                setShowCloseConfirmModal(false);
                opinionSectionRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            : handleConfirmCloseThread
        }
        title={
          isLecturer && !isLecturerOpinionFilled
            ? "Refleksi Opini Dosen Wajib Diisi"
            : "Tutup Forum Diskusi Perkuliahan"
        }
        description={
          isLecturer && !isLecturerOpinionFilled
            ? "Sesuai ketentuan akademik dan integritas dataset, Dosen pengampu wajib mengisi form Refleksi & Opini sebelum forum dapat ditutup secara manual (kecuali forum tertutup otomatis karena waktu sesi kadaluarsa)."
            : "Apakah Anda yakin ingin menutup forum diskusi ini? Setelah ditutup, forum akan beralih ke mode Read-Only dan tidak dapat lagi menerima jawaban atau balasan baru."
        }
        confirmText={
          isLecturer && !isLecturerOpinionFilled
            ? "Isi Refleksi Sekarang"
            : "Ya, Tutup Forum"
        }
        cancelText="Batal"
        variant={isLecturer && !isLecturerOpinionFilled ? "warning" : "danger"}
        loading={closingThread}
      />

      {/* Custom Modal Dialog (Replaces window.alert) */}
      <ConfirmationModal
        isOpen={modalAlert.isOpen}
        onClose={() => setModalAlert({ ...modalAlert, isOpen: false })}
        title={modalAlert.title}
        description={modalAlert.message}
        confirmText="Mengerti"
        hideCancel={true}
        variant={modalAlert.variant}
      />
    </div>
  );
}
