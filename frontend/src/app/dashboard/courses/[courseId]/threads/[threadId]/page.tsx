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
  Clock,
  Reply,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  CornerDownRight,
  ShieldCheck,
  Check,
} from "lucide-react";

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

interface MessageTreeNode {
  message: Message;
  level: number;
  branchStudentId: string;
  parentAuthorName?: string;
  children: MessageTreeNode[];
}

export default function ThreadDetailPage() {
  const { courseId, threadId } = useParams<{
    courseId: string;
    threadId: string;
  }>();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Active inline replying state
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null);
  const [replyTargetInfo, setReplyTargetInfo] = useState<{ id: string; name: string; role: string; type: string } | null>(null);
  const [inlineReplyBody, setInlineReplyBody] = useState("");
  const [inlineSending, setInlineSending] = useState(false);

  // Post-discussion Reflection State: Student
  const [studentOpinionText, setStudentOpinionText] = useState("");
  const [studentEmotion, setStudentEmotion] = useState<string>("");
  const [studentSentiment, setStudentSentiment] = useState<string>("");
  const [submittingStudentReflection, setSubmittingStudentReflection] = useState(false);
  const [studentReflectionSaved, setStudentReflectionSaved] = useState(false);

  // Post-discussion Evaluation State: Lecturer (per student)
  const [lecturerEvaluations, setLecturerEvaluations] = useState<
    Record<string, { opinionText: string; sentiment: string; emotion: string; isSaved: boolean; isSaving: boolean }>
  >({});
  const [activeStudentEvalTab, setActiveStudentEvalTab] = useState<string>("");

  // Custom Modal Dialogs
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

  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const opinionSectionRef = useRef<HTMLElement>(null);

  const loadThread = useCallback(async () => {
    try {
      const data = await threadsApi.getById(threadId);
      setThread(data);

      if (user) {
        // 1. Populate student reflection if exists
        if (user.role === "STUDENT") {
          const myOpinion = data.opinions?.find(
            (o: any) => o.authorId === user.id && o.authorRole === "STUDENT"
          );
          if (myOpinion) {
            setStudentOpinionText(myOpinion.opinionText || "");
            setStudentEmotion(myOpinion.emotion || "");
            setStudentSentiment(myOpinion.sentiment || "");
            setStudentReflectionSaved(true);
          }
        }

        // 2. Populate lecturer evaluation map for all students in class
        if (user.role === "LECTURER" || user.role === "ADMIN") {
          const enrolledStudents = data.compliance?.students || [];
          const initialMap: Record<string, any> = {};

          enrolledStudents.forEach((student: any) => {
            const savedOp = data.opinions?.find(
              (o: any) =>
                (o.authorRole === "LECTURER" || o.authorId === user.id) &&
                o.targetStudentId === student.id
            );

            initialMap[student.id] = {
              opinionText: savedOp?.opinionText || "",
              sentiment: savedOp?.sentiment || "",
              emotion: savedOp?.emotion || "",
              isSaved: !!savedOp,
              isSaving: false,
            };
          });

          setLecturerEvaluations(initialMap);
          if (enrolledStudents.length > 0 && !activeStudentEvalTab) {
            setActiveStudentEvalTab(enrolledStudents[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load thread:", err);
    } finally {
      setLoading(false);
    }
  }, [threadId, user, activeStudentEvalTab]);

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

    socket.on("opinion:submitted", () => {
      loadThread();
    });

    return () => {
      socket.emit("leaveThread", { threadId });
      socket.off("message:created");
      socket.off("thread:closed");
      socket.off("opinion:submitted");
    };
  }, [threadId, loadThread]);

  // Handle start inline replying to a specific card (Level 1 or nested)
  const handleStartInlineReply = (
    messageId: string,
    authorName: string,
    authorRole: string,
    suggestedType: string
  ) => {
    if (!user) return;

    // Strict Role constraints
    if (user.role === "STUDENT" && authorRole === "STUDENT") {
      setModalAlert({
        isOpen: true,
        title: "Batasan Balasan Mahasiswa",
        message: "Mahasiswa hanya dapat membalas pertanyaan atau tanggapan dari Dosen pengampu.",
        variant: "warning",
      });
      return;
    }

    if (user.role === "LECTURER" && authorRole === "LECTURER") {
      setModalAlert({
        isOpen: true,
        title: "Batasan Balasan Dosen",
        message: "Dosen hanya dapat membalas pesan dan jawaban dari Mahasiswa.",
        variant: "warning",
      });
      return;
    }

    setReplyingToMessageId(messageId);
    setReplyTargetInfo({
      id: messageId,
      name: authorName,
      role: authorRole,
      type: suggestedType,
    });
    setInlineReplyBody("");

    setTimeout(() => {
      inlineInputRef.current?.focus();
    }, 100);
  };

  const handleCancelInlineReply = () => {
    setReplyingToMessageId(null);
    setReplyTargetInfo(null);
    setInlineReplyBody("");
  };

  const handleSendInlineReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineReplyBody.trim() || !replyTargetInfo) return;

    setInlineSending(true);
    try {
      const parentMessageId = replyTargetInfo.id === "root-topic" ? undefined : replyTargetInfo.id;
      await threadsApi.addMessage(threadId, {
        type: replyTargetInfo.type,
        body: inlineReplyBody.trim(),
        parentMessageId,
      });

      setInlineReplyBody("");
      setReplyingToMessageId(null);
      setReplyTargetInfo(null);
      await loadThread();
    } catch (err: any) {
      setModalAlert({
        isOpen: true,
        title: "Gagal Mengirim Balasan",
        message: err.message || "Terjadi kendala saat mengirimkan pesan balasan.",
        variant: "danger",
      });
    } finally {
      setInlineSending(false);
    }
  };

  // Student reflection submission
  const handleSaveStudentReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentOpinionText.trim() && !studentEmotion && !studentSentiment) {
      setModalAlert({
        isOpen: true,
        title: "Isi Refleksi Anda",
        message: "Silakan tuliskan refleksi pembelajaran dan pilih emosi/sentimen sebelum menyimpan.",
        variant: "warning",
      });
      return;
    }

    setSubmittingStudentReflection(true);
    try {
      await opinionsApi.create(threadId, {
        opinionText: studentOpinionText.trim(),
        emotion: studentEmotion || undefined,
        sentiment: studentSentiment || undefined,
      });
      setStudentReflectionSaved(true);
      await loadThread();
      setModalAlert({
        isOpen: true,
        title: "Refleksi Tersimpan",
        message: "Refleksi, emosi, dan sentimen Anda berhasil disimpan ke database penelitian ARJUNA-Net.",
        variant: "success",
      });
    } catch (err: any) {
      setModalAlert({
        isOpen: true,
        title: "Gagal Menyimpan Refleksi",
        message: err.message || "Terjadi kesalahan saat menyimpan refleksi mahasiswa.",
        variant: "danger",
      });
    } finally {
      setSubmittingStudentReflection(false);
    }
  };

  // Lecturer evaluation submission per student
  const handleSaveLecturerEvaluation = async (studentId: string) => {
    const evalData = lecturerEvaluations[studentId];
    if (!evalData) return;

    if (!evalData.opinionText.trim() && !evalData.sentiment && !evalData.emotion) {
      setModalAlert({
        isOpen: true,
        title: "Lengkapi Evaluasi Mahasiswa",
        message: "Silakan masukkan catatan opini, pilih sentimen, atau emosi untuk mahasiswa ini sebelum menyimpan.",
        variant: "warning",
      });
      return;
    }

    setLecturerEvaluations((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], isSaving: true },
    }));

    try {
      await opinionsApi.create(threadId, {
        targetStudentId: studentId,
        opinionText: evalData.opinionText.trim(),
        sentiment: evalData.sentiment || undefined,
        emotion: evalData.emotion || undefined,
      });

      setLecturerEvaluations((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], isSaved: true, isSaving: false },
      }));

      await loadThread();
      setModalAlert({
        isOpen: true,
        title: "Evaluasi Mahasiswa Berhasil Disimpan",
        message: "Data evaluasi opini, sentimen dosen, dan emosi untuk mahasiswa ini berhasil tersimpan.",
        variant: "success",
      });
    } catch (err: any) {
      setLecturerEvaluations((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], isSaving: false },
      }));
      setModalAlert({
        isOpen: true,
        title: "Gagal Menyimpan Evaluasi",
        message: err.message || "Terjadi kesalahan saat menyimpan evaluasi dosen.",
        variant: "danger",
      });
    }
  };

  // Close forum confirmation
  const handleConfirmCloseThread = async () => {
    setClosingThread(true);
    try {
      await threadsApi.close(threadId);
      setShowCloseConfirmModal(false);
      await loadThread();
      setTimeout(() => {
        opinionSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err: any) {
      setShowCloseConfirmModal(false);
      setModalAlert({
        isOpen: true,
        title: "Gagal Menutup Forum",
        message: err.message || "Terjadi kesalahan saat menutup forum diskusi perkuliahan.",
        variant: "danger",
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
  const isStudent = user?.role === "STUDENT";
  const isClosed = thread.status === "CLOSED";
  const isExpired =
    isClosed || (thread.expiresAt && new Date() > new Date(thread.expiresAt));

  // Find root question message (Level 1)
  const rootQuestionMsg =
    thread.messages?.find((m: Message) => m.type === "QUESTION" && !m.parentMessageId) ||
    thread.messages?.[0] ||
    null;

  // Build Hierarchical Message Tree
  const messageMap = new Map<string, Message>();
  thread.messages?.forEach((m: Message) => messageMap.set(m.id, m));

  // Find student answers that reply to root question (Level 2)
  const level2Answers = (thread.messages || []).filter(
    (m: Message) =>
      m.id !== rootQuestionMsg?.id &&
      (!m.parentMessageId || m.parentMessageId === rootQuestionMsg?.id || m.type === "ANSWER")
  );

  // Helper to recursively build reply tree for a given parent message
  const buildTree = (
    parentMsg: Message,
    currentLevel: number,
    branchStudentId: string,
    parentAuthorName?: string
  ): MessageTreeNode => {
    const childMessages = (thread.messages || []).filter(
      (m: Message) => m.parentMessageId === parentMsg.id && m.id !== parentMsg.id
    );

    return {
      message: parentMsg,
      level: currentLevel,
      branchStudentId,
      parentAuthorName,
      children: childMessages.map((child: Message) =>
        buildTree(child, currentLevel + 1, branchStudentId, parentMsg.author?.name)
      ),
    };
  };

  const discussionBranches: MessageTreeNode[] = level2Answers.map((l2Msg: Message) => {
    const studentId = l2Msg.author.role === "STUDENT" ? l2Msg.author.id : "";
    return buildTree(l2Msg, 2, studentId, rootQuestionMsg?.author?.name || "Dosen");
  });

  // Check if current student has already submitted a Level 2 answer to the main topic
  const hasCurrentStudentAnsweredLevel1 = isStudent && (thread.messages || []).some(
    (m: Message) => m.author.id === user?.id && m.type === "ANSWER"
  );

  // Enrolled students for compliance & evaluations
  const enrolledStudents = thread.compliance?.students || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER BAR
      ═══════════════════════════════════════════════════════════════════ */}
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
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500">
                <Lock className="h-3.5 w-3.5" />
                <span>Forum Ditutup</span>
              </span>
            ) : isLecturer || isAdmin ? (
              <button
                type="button"
                onClick={() => setShowCloseConfirmModal(true)}
                className="glass-button-secondary rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-red-500/40 hover:text-red-500 transition-colors"
              >
                Tutup Forum Diskusi
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
                <span>Partisipasi Menjawab Mahasiswa</span>
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
                Sesi Forum Diskusi Telah Ditutup (Read-Only)
              </h4>
              <p className="text-xs text-rose-600/90 dark:text-rose-300/90 mt-1 leading-relaxed">
                Waktu sesi aktif diskusi telah berakhir. Ruang diskusi beralih ke mode baca dan formulir evaluasi refleksi & sentimen pembelajaran di bawah telah aktif untuk diisi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          2. HIERARCHICAL DISCUSSION FORUM TREE (LEVEL 1 -> LEVEL 2 -> LEVEL 3 -> LEVEL 4...)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        {/* ── LEVEL 1: TOPIK DISKUSI UTAMA (DOSEN) ── */}
        {rootQuestionMsg && (
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-xl border-l-4 border-l-[#0A3266] bg-gradient-to-br from-[#0A3266]/10 via-transparent to-transparent dark:from-[#0A3266]/30">
            {/* Header info */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-white/10 text-sm font-black text-[#0A3266] dark:text-[#ebd09e] border border-[#0A3266]/20">
                  {rootQuestionMsg.author.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#0A3266] dark:text-white">
                      {rootQuestionMsg.author.name}
                    </span>
                    <span className="rounded-md bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#0A3266] dark:text-[#C9A05C] border border-[#0A3266]/30">
                      Dosen Pengampu
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(rootQuestionMsg.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Hierarchy Level Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#0A3266]/40 bg-[#0A3266]/15 px-3 py-1 text-xs font-black text-[#0A3266] dark:text-[#8bb8f0]">
                <Layers className="h-3.5 w-3.5 text-[#0A3266] dark:text-[#8bb8f0]" />
                <span>Level 1: Topik Diskusi Utama (Dosen)</span>
              </div>
            </div>

            {/* Question Body */}
            <div
              className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 font-medium pl-1"
              dangerouslySetInnerHTML={{ __html: rootQuestionMsg.body }}
            />

            {/* Level 1 Reply Trigger Button (Mahasiswa / Admin) */}
            {!isExpired && (isStudent || isAdmin) && (
              <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {hasCurrentStudentAnsweredLevel1
                    ? "✓ Anda telah mengirimkan jawaban atas pertanyaan dosen. Anda dapat berdiskusi pada balasan Dosen di bawah."
                    : "Mahasiswa diwajibkan menjawab pertanyaan utama ini untuk berpartisipasi dalam diskusi."}
                </span>

                {!hasCurrentStudentAnsweredLevel1 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStartInlineReply(
                        "root-topic",
                        rootQuestionMsg.author.name,
                        "LECTURER",
                        "ANSWER"
                      )
                    }
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white bg-[#0A3266] hover:bg-[#0c3e80] dark:bg-[#C9A05C] dark:text-[#0A3266] dark:hover:bg-[#dbb36e] transition-all shadow-md group"
                  >
                    <Reply className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Balas Pertanyaan Dosen</span>
                  </button>
                )}
              </div>
            )}

            {/* Inline Reply Composer for Level 1 */}
            {replyingToMessageId === "root-topic" && (
              <div className="mt-4 rounded-2xl border-2 border-[#C9A05C]/60 bg-black/[0.02] dark:bg-white/[0.04] p-4 animate-in fade-in slide-in-from-top-2">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0A3266] dark:text-[#ebd09e]">
                    <CornerDownRight className="h-4 w-4 text-[#C9A05C]" />
                    <span>Menulis Jawaban atas Pertanyaan Dosen</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelInlineReply}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSendInlineReply} className="space-y-3">
                  <textarea
                    ref={inlineInputRef}
                    value={inlineReplyBody}
                    onChange={(e) => setInlineReplyBody(e.target.value)}
                    placeholder="Tuliskan jawaban Anda atas pertanyaan dosen secara jelas dan terperinci..."
                    required
                    rows={3}
                    className="glass-input w-full resize-none rounded-xl px-4 py-3 text-sm placeholder-slate-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelInlineReply}
                      className="glass-button-secondary rounded-xl px-3.5 py-1.5 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={inlineSending || !inlineReplyBody.trim()}
                      className="glass-button-gold flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold disabled:opacity-50"
                    >
                      {inlineSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Kirim Jawaban</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── DISCUSSION BRANCHES (SINGLE CONTAINER / CARD BOX PER STUDENT ANSWER & REPLIES) ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <MessageCircle className="h-4 w-4 text-[#C9A05C]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ruang Diskusi Mahasiswa ({discussionBranches.length} Diskusi)
            </h3>
          </div>

          {discussionBranches.length === 0 ? (
            <div className="glass-panel text-center rounded-3xl py-12 border border-dashed border-black/10 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Belum ada jawaban dari mahasiswa pada topik ini.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Mahasiswa dapat mengklik tombol "Balas Pertanyaan Dosen" di atas untuk mengirimkan jawaban.
              </p>
            </div>
          ) : (
            discussionBranches.map((branch, branchIndex) => {
              const flatMessages = flattenBranch(branch);

              return (
                <div
                  key={branch.message.id || branchIndex}
                  className="glass-panel relative overflow-hidden rounded-3xl p-5 sm:p-7 shadow-lg border-l-4 border-l-[#C9A05C] border-black/10 dark:border-white/[0.08] space-y-5"
                >
                  {/* All replies in this branch flow directly under the student's answer inside the same Card Box */}
                  <div className="space-y-5">
                    {flatMessages.map((item, itemIdx) => {
                      const isInitialAnswer = itemIdx === 0;

                      return (
                        <div
                          key={item.message.id}
                          className={isInitialAnswer ? "" : "pt-5 border-t border-black/10 dark:border-white/[0.08]"}
                        >
                          {renderMessageItem(
                            item.message,
                            item.level,
                            item.branchStudentId,
                            item.parentAuthorName,
                            user,
                            isExpired,
                            replyingToMessageId,
                            inlineReplyBody,
                            inlineSending,
                            inlineInputRef,
                            handleStartInlineReply,
                            handleCancelInlineReply,
                            handleSendInlineReply,
                            setInlineReplyBody
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. REFLEKSI & EVALUASI PASCA-DISKUSI (HANYA SAAT FORUM DITUTUP / EXPIRED)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={opinionSectionRef}
        aria-label="Refleksi & Evaluasi Pembelajaran"
        className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 border-[#C9A05C]/40 space-y-6 mt-8"
      >
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#C9A05C] border border-[#C9A05C]/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Refleksi Pembelajaran, Sentimen & Evaluasi ARJUNA-Net
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Pengumpulan data 6 label afektif (Lucturer_Opinion, Student_Opinion, Lucturer_Sentiment, Student_Sentiment, Lucturer_Emotion, Student_Emotion) untuk dataset penelitian.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
              isExpired
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
            }`}
          >
            {isExpired ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
            <span>{isExpired ? "Form Evaluasi Terbuka (Pasca-Diskusi)" : "Terkunci Selama Diskusi Aktif"}</span>
          </span>
        </div>

        {/* ── KONDISI 1: JIKA FORUM MASIH OPEN (BELUM DITUTUP) ── */}
        {!isExpired ? (
          <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-2">
            <Lock className="h-8 w-8 text-amber-500 mx-auto opacity-80" />
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Sesi Diskusi Forum Masih Berlangsung Aktif
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Formulir pengisian Refleksi Opini, Sentimen, dan Anotasi Emosi akan otomatis aktif dan dapat diakses setelah Dosen menutup sesi diskusi perkuliahan ini.
            </p>
            {(isLecturer || isAdmin) && (
              <button
                type="button"
                onClick={() => setShowCloseConfirmModal(true)}
                className="glass-button-gold mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-md"
              >
                <span>Tutup Diskusi Sekarang untuk Membuka Evaluasi</span>
              </button>
            )}
          </div>
        ) : (
          /* ── KONDISI 2: FORUM SELESAI / CLOSED -> USERFLOW EVALUASI ── */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* A. TAMPILAN DOSEN: EVALUASI PER MAHASISWA */}
            {(isLecturer || isAdmin) && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-[#0A3266] dark:text-[#ebd09e] flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-[#C9A05C]" />
                      <span>Evaluasi & Refleksi Dosen untuk Mahasiswa Kelas</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
                      Berikan penilaian opini (Lucturer_Opinion), sentimen (Lucturer_Sentiment), dan klasifikasi emosi (Lucturer_Emotion) untuk setiap mahasiswa di kelas ini.
                    </p>
                  </div>
                </div>

                {/* Tab selector per student */}
                {enrolledStudents.length === 0 ? (
                  <p className="text-xs text-slate-400">Tidak ada mahasiswa terdaftar di kelas ini.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Student tab pills */}
                    <div className="flex flex-wrap gap-2">
                      {enrolledStudents.map((student: any) => {
                        const evalState = lecturerEvaluations[student.id];
                        const isSelected = activeStudentEvalTab === student.id;

                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => setActiveStudentEvalTab(student.id)}
                            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all border ${
                              isSelected
                                ? "bg-[#0A3266] text-white dark:bg-[#C9A05C] dark:text-[#0A3266] border-transparent shadow-lg scale-[1.02]"
                                : "glass-button-secondary text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                evalState?.isSaved
                                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                                  : "bg-amber-400"
                              }`}
                            />
                            <span>{student.name}</span>
                            {student.hasAnswered ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300">
                                Aktif
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-500/20 text-slate-400">
                                Pasif
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Student Evaluation Form Card */}
                    {activeStudentEvalTab && (
                      <div className="rounded-3xl border border-[#C9A05C]/35 bg-black/[0.02] dark:bg-white/[0.02] p-5 sm:p-7 space-y-6">
                        {(() => {
                          const currentStudent = enrolledStudents.find(
                            (s: any) => s.id === activeStudentEvalTab
                          );
                          const evalState = lecturerEvaluations[activeStudentEvalTab] || {
                            opinionText: "",
                            sentiment: "",
                            emotion: "",
                            isSaved: false,
                            isSaving: false,
                          };

                          if (!currentStudent) return null;

                          return (
                            <div className="space-y-5">
                              {/* Header info active student */}
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A05C]/20 text-xs font-bold text-[#C9A05C]">
                                    {currentStudent.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-bold text-[#0A3266] dark:text-white">
                                      Penilaian untuk: {currentStudent.name}
                                    </h5>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Status Forum: {currentStudent.hasAnswered ? "Mahasiswa telah memberikan jawaban dalam forum" : "Mahasiswa belum menjawab topik"}
                                    </p>
                                  </div>
                                </div>

                                {evalState.isSaved && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Evaluasi Tersimpan</span>
                                  </span>
                                )}
                              </div>

                              {/* Form Fields: Lucturer_Sentiment & Lucturer_Emotion */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Lucturer_Sentiment */}
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300 flex items-center justify-between">
                                    <span>1. Sentimen Dosen (Lucturer_Sentiment):</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      {evalState.sentiment || "Belum dipilih"}
                                    </span>
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLecturerEvaluations((prev) => ({
                                          ...prev,
                                          [activeStudentEvalTab]: {
                                            ...prev[activeStudentEvalTab],
                                            sentiment: "Positif",
                                            isSaved: false,
                                          },
                                        }))
                                      }
                                      className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                                        evalState.sentiment === "Positif"
                                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/40 shadow-md"
                                          : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                                      }`}
                                    >
                                      <ThumbsUp className="h-4 w-4 text-emerald-500" />
                                      <span>Positif (Pemahaman Baik / Aktif)</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLecturerEvaluations((prev) => ({
                                          ...prev,
                                          [activeStudentEvalTab]: {
                                            ...prev[activeStudentEvalTab],
                                            sentiment: "Negatif",
                                            isSaved: false,
                                          },
                                        }))
                                      }
                                      className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                                        evalState.sentiment === "Negatif"
                                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 ring-2 ring-rose-500/40 shadow-md"
                                          : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                                      }`}
                                    >
                                      <ThumbsDown className="h-4 w-4 text-rose-500" />
                                      <span>Negatif (Kurang / Pasif)</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Lucturer_Emotion */}
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300 flex items-center justify-between">
                                    <span>2. Anotasi Emosi Dosen (Lucturer_Emotion):</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      {evalState.emotion || "Belum dipilih"}
                                    </span>
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(EMOTIONS_CONFIG).map(([key, config]) => {
                                      const isSelected = evalState.emotion === key;
                                      return (
                                        <button
                                          key={key}
                                          type="button"
                                          onClick={() =>
                                            setLecturerEvaluations((prev) => ({
                                              ...prev,
                                              [activeStudentEvalTab]: {
                                                ...prev[activeStudentEvalTab],
                                                emotion: key,
                                                isSaved: false,
                                              },
                                            }))
                                          }
                                          className={`flex items-center gap-1.5 rounded-xl p-2 text-left text-xs font-bold transition-all border ${
                                            isSelected
                                              ? `${config.bg} ${config.color} ${config.border} ring-2 ring-[#C9A05C]/50 shadow-md`
                                              : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                                          }`}
                                        >
                                          <config.icon className="h-3.5 w-3.5 shrink-0" />
                                          <div className="leading-tight text-[11px]">{config.label}</div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Lucturer_Opinion Textarea */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300">
                                  3. Catatan Refleksi & Opini Dosen untuk Mahasiswa Ini (Lucturer_Opinion):
                                </label>
                                <textarea
                                  value={evalState.opinionText}
                                  onChange={(e) =>
                                    setLecturerEvaluations((prev) => ({
                                      ...prev,
                                      [activeStudentEvalTab]: {
                                        ...prev[activeStudentEvalTab],
                                        opinionText: e.target.value,
                                        isSaved: false,
                                      },
                                    }))
                                  }
                                  placeholder={`Tuliskan ulasan, evaluasi pemahaman, atau catatan keaktifan untuk ${currentStudent.name}...`}
                                  rows={3}
                                  className="glass-input w-full resize-none rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                                />
                              </div>

                              {/* Action Save per student */}
                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  disabled={evalState.isSaving}
                                  onClick={() => handleSaveLecturerEvaluation(activeStudentEvalTab)}
                                  className="glass-button-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 shadow-lg"
                                >
                                  {evalState.isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-4 w-4 text-[#0A3266]" />
                                  )}
                                  <span>
                                    {evalState.isSaved
                                      ? `Perbarui Evaluasi (${currentStudent.name})`
                                      : `Simpan Evaluasi (${currentStudent.name})`}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* B. TAMPILAN MAHASISWA: REFLEKSI SISWA UNTUK DOSEN */}
            {isStudent && (
              <div className="rounded-3xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-5 sm:p-7 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-[#0A3266] dark:text-[#ebd09e] flex items-center gap-2">
                      <Smile className="h-5 w-5 text-[#C9A05C]" />
                      <span>Refleksi Pembelajaran Mahasiswa untuk Dosen Pengampu</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
                      Isi data refleksi opini (Student_Opinion), sentimen (Student_Sentiment), dan emosi (Student_Emotion) selama berdiskusi dengan Dosen.
                    </p>
                  </div>

                  {studentReflectionSaved && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Refleksi Anda Tersimpan</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveStudentReflection} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Student_Sentiment */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300 flex items-center justify-between">
                        <span>1. Polaritas Sentimen Anda (Student_Sentiment):</span>
                        <span className="text-[10px] text-slate-400">{studentSentiment || "Belum dipilih"}</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStudentSentiment("Positif");
                            setStudentReflectionSaved(false);
                          }}
                          className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                            studentSentiment === "Positif"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/40 shadow-md"
                              : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4 text-emerald-500" />
                          <span>Positif (Mendukung / Jelas)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStudentSentiment("Negatif");
                            setStudentReflectionSaved(false);
                          }}
                          className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                            studentSentiment === "Negatif"
                              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 ring-2 ring-rose-500/40 shadow-md"
                              : "border-black/10 dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4 text-rose-500" />
                          <span>Negatif (Kritik / Bingung)</span>
                        </button>
                      </div>
                    </div>

                    {/* Student_Emotion */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300 flex items-center justify-between">
                        <span>2. Kategori Emosi Anda (Student_Emotion):</span>
                        <span className="text-[10px] text-slate-400">{studentEmotion || "Belum dipilih"}</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(EMOTIONS_CONFIG).map(([key, config]) => {
                          const isSelected = studentEmotion === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setStudentEmotion(key);
                                setStudentReflectionSaved(false);
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
                  </div>

                  {/* Student_Opinion */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#0A3266] dark:text-slate-300">
                      3. Refleksi Pembelajaran Mahasiswa (Student_Opinion):
                    </label>
                    <textarea
                      value={studentOpinionText}
                      onChange={(e) => {
                        setStudentOpinionText(e.target.value);
                        setStudentReflectionSaved(false);
                      }}
                      placeholder="Tuliskan pemahaman yang Anda dapatkan, kejelasan topik bahasan, atau kesan diskusi dengan dosen pengampu..."
                      rows={3}
                      className="glass-input w-full resize-none rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingStudentReflection}
                      className="glass-button-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 shadow-lg"
                    >
                      {submittingStudentReflection ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[#0A3266]" />
                      )}
                      <span>{studentReflectionSaved ? "Perbarui Refleksi Saya" : "Simpan Refleksi Saya"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Confirmation Modal: Tutup Diskusi */}
      <ConfirmationModal
        isOpen={showCloseConfirmModal}
        onClose={() => setShowCloseConfirmModal(false)}
        onConfirm={handleConfirmCloseThread}
        title="Tutup Forum Diskusi Perkuliahan"
        description="Apakah Anda yakin ingin menutup forum diskusi ini? Setelah ditutup, forum akan beralih ke mode Read-Only dan formulir evaluasi penilaian dosen serta refleksi mahasiswa akan langsung terbuka."
        confirmText="Ya, Tutup Forum"
        cancelText="Batal"
        variant="danger"
        loading={closingThread}
      />

      {/* Custom Modal Alert */}
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

// ─── HELPER TO FLATTEN BRANCH TREE CHRONOLOGICALLY ─────────────────────
function flattenBranch(node: MessageTreeNode): { message: Message; level: number; branchStudentId: string; parentAuthorName?: string }[] {
  const result: { message: Message; level: number; branchStudentId: string; parentAuthorName?: string }[] = [
    {
      message: node.message,
      level: node.level,
      branchStudentId: node.branchStudentId,
      parentAuthorName: node.parentAuthorName,
    },
  ];

  for (const child of node.children) {
    result.push(...flattenBranch(child));
  }

  return result;
}

// ─── MESSAGE ITEM RENDERER (DIRECTLY UNDER PARAGRAPH INSIDE SAME CARD) ─
function renderMessageItem(
  message: Message,
  level: number,
  branchStudentId: string,
  parentAuthorName: string | undefined,
  currentUser: any,
  isExpired: boolean,
  replyingToMessageId: string | null,
  inlineReplyBody: string,
  inlineSending: boolean,
  inlineInputRef: React.RefObject<HTMLTextAreaElement | null>,
  onStartReply: (messageId: string, name: string, role: string, type: string) => void,
  onCancelReply: () => void,
  onSendReply: (e: React.FormEvent) => void,
  setReplyBody: (val: string) => void
): React.ReactNode {
  const isAuthorCurrentUser = message.author.id === currentUser?.id;
  const isLecturerAuthor = message.author.role === "LECTURER";
  const isStudentAuthor = message.author.role === "STUDENT";

  // Role reply rules:
  // - If student: can ONLY reply to Lecturer messages that belong to their own branch
  // - If lecturer: can reply to any Student messages
  // - If admin: can reply to any
  const canCurrentUserReply =
    !isExpired &&
    currentUser &&
    (currentUser.role === "ADMIN" ||
      (currentUser.role === "STUDENT" &&
        isLecturerAuthor &&
        (!branchStudentId || branchStudentId === currentUser.id)) ||
      (currentUser.role === "LECTURER" && isStudentAuthor));

  // Determine context badge text & style
  let contextBadgeText = "Menjawab pertanyaan Dosen";
  let contextBadgeClass = "bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#ebd09e] border-[#C9A05C]/40";

  if (level === 2) {
    contextBadgeText = "Menjawab pertanyaan Dosen";
    contextBadgeClass = "bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#ebd09e] border-[#C9A05C]/40";
  } else if (isLecturerAuthor) {
    contextBadgeText = `Membalas ${parentAuthorName || "Mahasiswa"}`;
    contextBadgeClass = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
  } else {
    contextBadgeText = `Membalas ${parentAuthorName || "Dosen"}`;
    contextBadgeClass = "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40";
  }

  const suggestedNextType = isStudentAuthor ? "FEEDBACK" : "REACTION";

  return (
    <div key={message.id} className="w-full space-y-3">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0A3266]/10 dark:bg-white/10 text-xs font-bold text-[#0A3266] dark:text-white">
            {message.author.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0A3266] dark:text-white">
                {message.author.name}
              </span>
              {isAuthorCurrentUser && (
                <span className="rounded-md bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 px-2 py-0.5 text-[10px] font-bold text-[#0A3266] dark:text-[#C9A05C] border border-[#C9A05C]/30">
                  Anda
                </span>
              )}
              <span className="rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {message.author.role === "LECTURER" ? "Dosen" : "Mahasiswa"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {new Date(message.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold border ${contextBadgeClass}`}>
          {contextBadgeText}
        </span>
      </div>

      {/* Message body */}
      <div
        className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap pl-1"
        dangerouslySetInnerHTML={{ __html: message.body }}
      />

      {/* Reply button on this message if allowed */}
      {canCurrentUserReply && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() =>
              onStartReply(
                message.id,
                message.author.name,
                message.author.role,
                suggestedNextType
              )
            }
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-[#0A3266] dark:text-[#ebd09e] bg-[#0A3266]/10 dark:bg-[#C9A05C]/15 hover:bg-[#0A3266]/20 dark:hover:bg-[#C9A05C]/25 transition-all shadow-sm group"
          >
            <Reply className="h-3.5 w-3.5 text-[#C9A05C] group-hover:-translate-x-0.5 transition-transform" />
            <span>Balas {message.author.name}</span>
          </button>
        </div>
      )}

      {/* Inline Reply Composer directly beneath this specific message */}
      {replyingToMessageId === message.id && (
        <div className="mt-3 rounded-2xl border-2 border-[#C9A05C]/60 bg-black/[0.02] dark:bg-white/[0.04] p-4 animate-in fade-in slide-in-from-top-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0A3266] dark:text-[#ebd09e]">
              <CornerDownRight className="h-4 w-4 text-[#C9A05C]" />
              <span>
                Membalas {message.author.name} ({message.author.role === "LECTURER" ? "Dosen" : "Mahasiswa"})
              </span>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={onSendReply} className="space-y-3">
            <textarea
              ref={inlineInputRef}
              value={inlineReplyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Tuliskan respon balasan Anda di sini..."
              required
              rows={3}
              className="glass-input w-full resize-none rounded-xl px-4 py-3 text-sm placeholder-slate-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelReply}
                className="glass-button-secondary rounded-xl px-3.5 py-1.5 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={inlineSending || !inlineReplyBody.trim()}
                className="glass-button-gold flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold disabled:opacity-50"
              >
                {inlineSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Kirim Balasan</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
