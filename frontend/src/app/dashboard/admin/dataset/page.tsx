"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  datasets as datasetsApi,
  courses as coursesApi,
  type Course,
} from "@/lib/api";
import {
  Database,
  Download,
  FileSpreadsheet,
  Users,
  MessageSquare,
  Sparkles,
  Info,
  RefreshCw,
  TrendingUp,
  Filter,
  CheckCircle2,
  Table as TableIcon,
  Search,
  Sliders,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
  Edit3,
  Bot,
  UserCheck,
  AlertCircle,
  FileText,
  Smile,
  Heart,
  Target,
} from "lucide-react";
import { DonutChart, StatGauge } from "@/components/charts";

export default function AdminDatasetPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"export" | "manage">("export");

  useEffect(() => {
    if (!authLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  // General Statistics & Courses
  const [stats, setStats] = useState<any>(null);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Tab 1: Export & Preview State
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<"csv" | "json" | null>(null);

  // Tab 2: Label Management State
  const [threadsList, setThreadsList] = useState<any[]>([]);
  const [threadsMeta, setThreadsMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [searchThread, setSearchThread] = useState("");
  const [labeledStatusFilter, setLabeledStatusFilter] = useState("ALL");
  const [threadPage, setThreadPage] = useState(1);

  // Modal: Label Annotation Studio
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [savingLabel, setSavingLabel] = useState(false);
  const [autoCalculating, setAutoCalculating] = useState(false);
  const [deletingLabel, setDeletingLabel] = useState(false);

  // Annotation Form State
  const [annotationForm, setAnnotationForm] = useState({
    qaRelevance: 0.85,
    afRelevance: 0.85,
    feedbackNovelty: 0.75,
    studentSentiment: "Positif",
    studentEmotion: "Happiness",
    lecturerEmotion: "Happiness",
    interactionQuality: 0.85,
  });

  // Bulk Auto-Label Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadPreview(selectedCourse);
    loadThreads();
  }, [selectedCourse]);

  useEffect(() => {
    if (activeTab === "manage") {
      loadThreads();
    }
  }, [activeTab, threadPage, labeledStatusFilter, searchThread]);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  async function loadAllData() {
    setLoading(true);
    try {
      const [summaryData, coursesData] = await Promise.all([
        datasetsApi.getSummary(),
        user?.role === "ADMIN" ? coursesApi.listAll() : coursesApi.myCourses(),
      ]);
      setStats(summaryData);
      setCoursesList(Array.isArray(coursesData) ? coursesData : []);
    } catch (err) {
      console.error("Gagal memuat ringkasan dataset:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview(courseId?: string) {
    try {
      const res = await datasetsApi.getPreview(courseId || undefined);
      setPreviewRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal memuat pratinjau dataset:", err);
    }
  }

  async function loadThreads() {
    setThreadsLoading(true);
    try {
      const res = await datasetsApi.listThreads({
        courseId: selectedCourse || undefined,
        labeledStatus: labeledStatusFilter,
        search: searchThread || undefined,
        page: threadPage,
        limit: 10,
      });
      setThreadsList(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta) {
        setThreadsMeta(res.meta);
      }
    } catch (err) {
      console.error("Gagal memuat daftar thread untuk anotasi:", err);
    } finally {
      setThreadsLoading(false);
    }
  }

  const handleDownload = async (format: "csv" | "json") => {
    setDownloading(format);
    try {
      const url = datasetsApi.exportUrl(selectedCourse || undefined, format);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengunduh dataset");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      const courseSuffix = selectedCourse ? `_course_${selectedCourse}` : "_all";
      a.download = `arjuna_dataset${courseSuffix}_${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      showNotification("success", `Dataset .${format.toUpperCase()} 15 kolom berhasil diunduh.`);
    } catch (err) {
      console.error("Download error:", err);
      window.open(datasetsApi.exportUrl(selectedCourse || undefined, format), "_blank");
    } finally {
      setDownloading(null);
    }
  };

  const openAnnotationModal = (thread: any) => {
    setSelectedThread(thread);
    const eff = thread.effectiveLabels;
    setAnnotationForm({
      qaRelevance: eff.qaRelevance ?? 0.85,
      afRelevance: eff.afRelevance ?? 0.85,
      feedbackNovelty: eff.feedbackNovelty ?? 0.75,
      studentSentiment: eff.studentSentiment ?? "Positif",
      studentEmotion: eff.studentEmotion ?? "Happiness",
      lecturerEmotion: eff.lecturerEmotion ?? "Happiness",
      interactionQuality: eff.interactionQuality ?? 0.85,
    });
    setShowAnnotationModal(true);
  };

  const handleAutoCalculateForm = () => {
    if (!selectedThread) return;
    setAutoCalculating(true);
    setTimeout(() => {
      const auto = selectedThread.autoCalculated;
      if (auto) {
        setAnnotationForm({
          qaRelevance: auto.qaRelevance ?? 0.85,
          afRelevance: auto.afRelevance ?? 0.85,
          feedbackNovelty: auto.feedbackNovelty ?? 0.75,
          studentSentiment: auto.studentSentiment ?? "Positif",
          studentEmotion: auto.studentEmotion ?? "Happiness",
          lecturerEmotion: auto.lecturerEmotion ?? "Happiness",
          interactionQuality: auto.interactionQuality ?? 0.85,
        });
        showNotification("success", "Skor inferensi NLP bahasa Indonesia berhasil dihitung!");
      }
      setAutoCalculating(false);
    }, 300);
  };

  const handleSaveAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread) return;
    setSavingLabel(true);
    try {
      await datasetsApi.setLabels(selectedThread.id, {
        qaRelevance: Number(annotationForm.qaRelevance),
        afRelevance: Number(annotationForm.afRelevance),
        feedbackNovelty: Number(annotationForm.feedbackNovelty),
        studentSentiment: annotationForm.studentSentiment,
        studentEmotion: annotationForm.studentEmotion,
        lecturerEmotion: annotationForm.lecturerEmotion,
        interactionQuality: Number(annotationForm.interactionQuality),
        source: "MANUAL",
      });

      showNotification("success", "Label anotasi berhasil disimpan ke database.");
      setShowAnnotationModal(false);
      loadThreads();
      loadPreview(selectedCourse);
      loadAllData();
    } catch (err: any) {
      showNotification("error", err.message || "Gagal menyimpan label anotasi.");
    } finally {
      setSavingLabel(false);
    }
  };

  const handleDeleteAnnotation = async () => {
    if (!selectedThread) return;
    setDeletingLabel(true);
    try {
      await datasetsApi.deleteLabels(selectedThread.id);
      showNotification("success", "Label manual dihapus. Sistem kembali ke inferensi otomatis.");
      setShowAnnotationModal(false);
      loadThreads();
      loadPreview(selectedCourse);
      loadAllData();
    } catch (err: any) {
      showNotification("error", err.message || "Gagal mereset label.");
    } finally {
      setDeletingLabel(false);
    }
  };

  const handleBulkAutoLabel = async () => {
    setBulkProcessing(true);
    try {
      const res = await datasetsApi.autoLabelAll(selectedCourse || undefined);
      showNotification(
        "success",
        `Berhasil meng-generate label otomatis untuk ${res.labeledCount} diskusi kelas.`
      );
      setShowBulkModal(false);
      loadThreads();
      loadPreview(selectedCourse);
      loadAllData();
    } catch (err: any) {
      showNotification("error", err.message || "Gagal menjalankan auto-labeling.");
    } finally {
      setBulkProcessing(false);
    }
  };

  // Dual-source reactive chart data: takes from live previewRows (manual + auto-infer) or stats API
  const chartEmotionCounts = useMemo(() => {
    if (previewRows && previewRows.length > 0) {
      const counts: Record<string, number> = {
        Happiness: 0,
        Anger: 0,
        Fear: 0,
        Disgust: 0,
        Sadness: 0,
      };
      previewRows.forEach((row) => {
        const emo = row.Student_Emotion || row.Lecturer_Emotion;
        if (emo && counts[emo] !== undefined) {
          counts[emo]++;
        }
      });
      return counts;
    }
    return stats?.emotionCounts || { Happiness: 0, Anger: 0, Fear: 0, Disgust: 0, Sadness: 0 };
  }, [previewRows, stats]);

  const chartSentimentCounts = useMemo(() => {
    if (previewRows && previewRows.length > 0) {
      const counts: Record<string, number> = { Positif: 0, Negatif: 0 };
      previewRows.forEach((row) => {
        const sent = row.Student_Sentiment;
        if (sent && counts[sent] !== undefined) {
          counts[sent]++;
        }
      });
      return counts;
    }
    return stats?.sentimentCounts || { Positif: 0, Negatif: 0 };
  }, [previewRows, stats]);

  const chartScores = useMemo(() => {
    if (previewRows && previewRows.length > 0) {
      let sumQa = 0, countQa = 0;
      let sumAf = 0, countAf = 0;
      let sumNov = 0, countNov = 0;
      let sumQual = 0, countQual = 0;

      previewRows.forEach((row) => {
        const qa = typeof row["Q-A_Relevance"] === "number" ? row["Q-A_Relevance"] : parseFloat(row["Q-A_Relevance"]);
        if (!isNaN(qa) && qa > 0) { sumQa += qa; countQa++; }

        const af = typeof row["A-F_Relevance"] === "number" ? row["A-F_Relevance"] : parseFloat(row["A-F_Relevance"]);
        if (!isNaN(af) && af > 0) { sumAf += af; countAf++; }

        const nov = typeof row.Feedback_Novalty === "number" ? row.Feedback_Novalty : parseFloat(row.Feedback_Novalty);
        if (!isNaN(nov) && nov > 0) { sumNov += nov; countNov++; }

        const qual = typeof row.Interaction_Quality === "number" ? row.Interaction_Quality : parseFloat(row.Interaction_Quality);
        if (!isNaN(qual) && qual > 0) { sumQual += qual; countQual++; }
      });

      return {
        avgQaRelevance: countQa > 0 ? Number((sumQa / countQa).toFixed(2)) : (stats?.avgQaRelevance || 0),
        avgAfRelevance: countAf > 0 ? Number((sumAf / countAf).toFixed(2)) : (stats?.avgAfRelevance || 0),
        avgFeedbackNovelty: countNov > 0 ? Number((sumNov / countNov).toFixed(2)) : (stats?.avgFeedbackNovelty || 0),
        avgInteractionQuality: countQual > 0 ? Number((sumQual / countQual).toFixed(2)) : (stats?.avgInteractionQuality || 0),
      };
    }
    return {
      avgQaRelevance: stats?.avgQaRelevance || 0,
      avgAfRelevance: stats?.avgAfRelevance || 0,
      avgFeedbackNovelty: stats?.avgFeedbackNovelty || 0,
      avgInteractionQuality: stats?.avgInteractionQuality || 0,
    };
  }, [previewRows, stats]);

  const totalChartSamples = (previewRows && previewRows.length > 0) ? previewRows.length : (stats?.totalLabels || 0);

  return (
    <div className="space-y-8 pb-12">
      {/* ═══════════════════════════════════════════════════════════════════
          FEEDBACK TOAST
      ═══════════════════════════════════════════════════════════════════ */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-bottom-4 ${
            feedback.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#ebd09e] backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Pipeline Ekstraksi & Modul Anotasi Dataset ARJUNA-Net</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              Pusat Dataset & Studio Label Interaksi
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-[#ebd09e]/80 max-w-3xl leading-relaxed">
              Mengekstrak data interaksi dosen–mahasiswa ke dalam 17 kolom terstandarisasi. Seluruh parameter label terisi dari input manual refleksi opini maupun otomatis via NLP heuristics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadAllData();
                loadPreview(selectedCourse);
                loadThreads();
              }}
              disabled={loading || threadsLoading}
              className="glass-button-secondary flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold backdrop-blur-xl"
            >
              <RefreshCw
                className={`h-4 w-4 text-[#C9A05C] ${
                  loading || threadsLoading ? "animate-spin" : ""
                }`}
              />
              <span>Segarkan Data</span>
            </button>

            <button
              onClick={() => handleDownload("csv")}
              disabled={downloading === "csv"}
              className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold shadow-lg"
            >
              <Download className="h-4 w-4" />
              <span>{downloading === "csv" ? "Mengunduh..." : "Ekspor CSV 17 Kolom"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. METRIC STAT CARDS
      ═══════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="glass-card-static flex flex-col items-center justify-center py-16 rounded-3xl gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#C9A05C]" />
          <p className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">
            Menghitung metrik kesiapan dataset...
          </p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassMetricCard
              title="Total Diskusi Kelas"
              value={stats.totalThreads || 0}
              desc="Topik interaksi perkuliahan aktif"
              icon={MessageSquare}
              color="text-[#0A3266] dark:text-[#8bb8f0] from-[#0A3266]/20 to-[#0A3266]/5 border-[#0A3266]/30"
            />
            <GlassMetricCard
              title="Total Jawaban Mahasiswa"
              value={stats.totalAnswers || 0}
              desc="Baris interaksi jawaban terekam"
              icon={FileSpreadsheet}
              color="text-[#8c6828] dark:text-[#C9A05C] from-[#C9A05C]/25 to-[#C9A05C]/5 border-[#C9A05C]/35"
            />
            <GlassMetricCard
              title="Opini / Refleksi Terkumpul"
              value={stats.totalOpinions || 0}
              desc="Data Refleksi Mahasiswa & Dosen"
              icon={Users}
              color="text-emerald-600 dark:text-emerald-300 from-emerald-600/20 to-emerald-400/5 border-emerald-500/30"
            />
            <GlassMetricCard
              title="Baris Sampel Siap Latih"
              value={totalChartSamples}
              desc={`${stats.readinessScore || 0}% kesiapan dataset siap latih`}
              icon={TrendingUp}
              color="text-[#0A3266] dark:text-[#dbb779] from-[#124687]/20 to-[#C9A05C]/10 border-[#C9A05C]/30"
            />
          </div>

          {/* Visual Analytics Chart Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Ekman 5-Emotions Donut */}
            <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                    <Smile className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Distribusi 5 Emosi Ekman</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    EWE Model
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Anotasi Manual / Auto-Infer Emosi
                </p>
              </div>

              <DonutChart
                data={[
                  { label: "Happiness", value: chartEmotionCounts.Happiness || 0, color: "#10B981" },
                  { label: "Anger", value: chartEmotionCounts.Anger || 0, color: "#EF4444" },
                  { label: "Fear", value: chartEmotionCounts.Fear || 0, color: "#8B5CF6" },
                  { label: "Disgust", value: chartEmotionCounts.Disgust || 0, color: "#F59E0B" },
                  { label: "Sadness", value: chartEmotionCounts.Sadness || 0, color: "#3B82F6" },
                ]}
                size={160}
                thickness={20}
                centerLabel="Total Sampel"
                centerValue={totalChartSamples}
              />
            </div>

            {/* 2. Binary Sentiment Ratio */}
            <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-amber-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-amber-500" />
                    <span>Rasio Sentimen Mahasiswa</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    SSWE Model
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Sebaran Sentimen (Positif vs Negatif)
                </p>
              </div>

              <DonutChart
                data={[
                  { label: "Positif", value: chartSentimentCounts.Positif || 0, color: "#10B981" },
                  { label: "Negatif", value: chartSentimentCounts.Negatif || 0, color: "#EF4444" },
                ]}
                size={160}
                thickness={20}
                centerLabel="Sentimen"
                centerValue={
                  ((chartSentimentCounts.Positif || 0) + (chartSentimentCounts.Negatif || 0)) > 0
                    ? `${Math.round(((chartSentimentCounts.Positif || 0) / ((chartSentimentCounts.Positif || 0) + (chartSentimentCounts.Negatif || 0))) * 100)}%`
                    : "0%"
                }
              />
            </div>

            {/* 3. Relevance & Interaction Quality Gauges */}
            <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-[#C9A05C] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>Skor Relevansi & Kualitas</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                    Semantic &alpha;, &beta;, &gamma;
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Metrik semantik Q-A, A-F, dan interaksi
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2">
                <StatGauge
                  value={chartScores.avgQaRelevance}
                  maxValue={1}
                  label="Q-A Relevance"
                  size={110}
                  unit=""
                  statusBadge={chartScores.avgQaRelevance > 0 ? "Tinggi" : "Belum Ada"}
                  statusType={chartScores.avgQaRelevance > 0 ? "success" : "info"}
                />
                <StatGauge
                  value={chartScores.avgAfRelevance}
                  maxValue={1}
                  label="A-F Relevance"
                  size={110}
                  unit=""
                  statusBadge={chartScores.avgAfRelevance > 0 ? "Tinggi" : "Belum Ada"}
                  statusType={chartScores.avgAfRelevance > 0 ? "success" : "info"}
                />
                <StatGauge
                  value={chartScores.avgFeedbackNovelty}
                  maxValue={1}
                  label="Novelty"
                  size={110}
                  unit=""
                  statusBadge={chartScores.avgFeedbackNovelty > 0 ? "Baik" : "Belum Ada"}
                  statusType={chartScores.avgFeedbackNovelty > 0 ? "gold" : "info"}
                />
                <StatGauge
                  value={chartScores.avgInteractionQuality}
                  maxValue={1}
                  label="Quality"
                  size={110}
                  unit=""
                  statusBadge={chartScores.avgInteractionQuality > 0 ? "Tinggi" : "Belum Ada"}
                  statusType={chartScores.avgInteractionQuality > 0 ? "gold" : "info"}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          3. TAB CONTROLS (EKSPOR DATASET vs KELOLA LABEL)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-[#C9A05C]/20 pb-4">
        <div className="flex items-center gap-2 rounded-2xl bg-black/5 dark:bg-[#030d1d]/60 p-1.5 border border-black/10 dark:border-[#C9A05C]/20">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "export"
                ? "bg-[#C9A05C] text-[#0A3266] shadow-md"
                : "text-slate-600 dark:text-[#ebd09e]/80 hover:text-[#0A3266] dark:hover:text-[#FBF8F3]"
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Ekspor & Pratinjau Dataset (15 Kolom)</span>
          </button>

          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "manage"
                ? "bg-[#C9A05C] text-[#0A3266] shadow-md"
                : "text-slate-600 dark:text-[#ebd09e]/80 hover:text-[#0A3266] dark:hover:text-[#FBF8F3]"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Studio Manajemen & Anotasi Label</span>
          </button>
        </div>

        {/* Global Filter Mata Kuliah */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#C9A05C]" />
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setThreadPage(1);
            }}
            className="glass-input rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <option value="">Semua Kelas Mata Kuliah</option>
            {coursesList.map((c) => (
              <option
                key={c.id}
                value={c.id}
                className="bg-white dark:bg-[#061a3b] text-[#0A3266] dark:text-[#FBF8F3]"
              >
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1: EKSPOR & PRATINJAU DATASET (15 KOLOM)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "export" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Export Cards */}
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] border border-[#C9A05C]/35">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                    Ekspor Dataset Penelitian (15 Kolom Otomatis)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#ebd09e]/80">
                    File CSV / JSON bergaransi 100% lengkap dengan 7 label inferensi semantik & emosi yang siap diolah model AI.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* CSV 15 Kolom Export Card */}
              <div className="glass-card flex flex-col justify-between rounded-2xl p-6 border-l-4 border-l-[#C9A05C]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-xl bg-[#C9A05C]/20 px-3 py-1 text-xs font-bold text-[#8c6828] dark:text-[#ebd09e] border border-[#C9A05C]/40">
                      Format Utama: CSV (15 Kolom)
                    </span>
                    <FileSpreadsheet className="h-5 w-5 text-[#C9A05C]" />
                  </div>
                  <h4 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                    Dataset Standar ARJUNA-Net (.CSV)
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-[#ebd09e]/85 font-medium">
                    Tabel baris-per-jawaban 15 kolom terstandarisasi dengan data label lengkap yang siap dimuat oleh Python Pandas, PyTorch DataLoader, atau scikit-learn.
                  </p>
                </div>

                <button
                  onClick={() => handleDownload("csv")}
                  disabled={downloading === "csv"}
                  className="glass-button-primary mt-6 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold shadow-lg"
                >
                  {downloading === "csv" ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Menyiapkan CSV...
                    </span>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Unduh Dataset .CSV (15 Kolom)</span>
                    </>
                  )}
                </button>
              </div>

              {/* JSON Export Card */}
              <div className="glass-card flex flex-col justify-between rounded-2xl p-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-xl bg-[#0A3266]/15 dark:bg-[#0A3266]/40 px-3 py-1 text-xs font-bold text-[#0A3266] dark:text-[#8bb8f0] border border-[#0A3266]/30">
                      Format Hierarki: JSON
                    </span>
                    <Database className="h-5 w-5 text-slate-400" />
                  </div>
                  <h4 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                    Hierarki Objek Relasional (.JSON)
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-[#ebd09e]/85 font-medium">
                    Menyimpan relasi objek lengkap antara mata kuliah, thread diskusi, pesan interaksi, dan label inferensi semantik.
                  </p>
                </div>

                <button
                  onClick={() => handleDownload("json")}
                  disabled={downloading === "json"}
                  className="glass-button-secondary mt-6 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold"
                >
                  {downloading === "json" ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Menyiapkan JSON...
                    </span>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-[#C9A05C]" />
                      <span>Unduh Berkas .JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Live Dataset Preview (17 Columns Table including Log & Lecturer_Opinion) */}
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] border border-[#C9A05C]/35">
                  <TableIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                    Pratinjau Data Mentah & Riwayat Interaksi Forum (17 Kolom)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#ebd09e]/80">
                    Menampilkan {previewRows.length} baris rekaman interaksi & balasan forum lengkap dengan kolom Log, Lecturer_Opinion, Student_Opinion, dan 7 label semantik/emosi otomatis.
                  </p>
                </div>
              </div>
            </div>

            {previewRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 dark:border-[#C9A05C]/30 p-10 text-center">
                <p className="text-sm font-semibold text-slate-500 dark:text-[#ebd09e]/70">
                  Belum ada baris interaksi pada kelas yang dipilih.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Data akan otomatis muncul ketika dosen membuat forum pertanyaan dan mahasiswa mengirimkan tanggapan / balasan di kelas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-[#C9A05C]/30 bg-black/[0.01] dark:bg-[#030d1d]/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-[#C9A05C]/30 bg-[#0A3266]/10 dark:bg-[#0A3266]/40 text-[#0A3266] dark:text-[#FBF8F3] font-bold">
                      <th className="py-3 px-3 whitespace-nowrap">#</th>
                      <th className="py-3 px-3 min-w-[220px] whitespace-nowrap">Log</th>
                      <th className="py-3 px-3 whitespace-nowrap">Course_ID</th>
                      <th className="py-3 px-3 whitespace-nowrap">Lecturer_ID</th>
                      <th className="py-3 px-3 whitespace-nowrap">Student_ID</th>
                      <th className="py-3 px-3 min-w-[200px]">Lecturer_Question</th>
                      <th className="py-3 px-3 min-w-[200px]">Student_Answer</th>
                      <th className="py-3 px-3 min-w-[180px]">Lecturer_Feedback</th>
                      <th className="py-3 px-3 min-w-[150px]">Student_Reaction</th>
                      <th className="py-3 px-3 min-w-[150px]">Lecturer_Opinion</th>
                      <th className="py-3 px-3 min-w-[150px]">Student_Opinion</th>
                      <th className="py-3 px-2 text-center whitespace-nowrap bg-[#C9A05C]/10 dark:bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                        Q-A
                      </th>
                      <th className="py-3 px-2 text-center whitespace-nowrap bg-[#C9A05C]/10 dark:bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                        A-F
                      </th>
                      <th className="py-3 px-2 text-center whitespace-nowrap bg-[#C9A05C]/10 dark:bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                        Novelty
                      </th>
                      <th className="py-3 px-3 whitespace-nowrap bg-[#C9A05C]/10 dark:bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                        Sentiment
                      </th>
                      <th className="py-3 px-3 whitespace-nowrap bg-[#C9A05C]/10 dark:bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                        Std_Emotion
                      </th>
                      <th className="py-3 px-3 whitespace-nowrap bg-[#C9A05C]/10 dark:bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                        Lec_Emotion
                      </th>
                      <th className="py-3 px-2 text-center whitespace-nowrap bg-[#C9A05C]/10 dark:bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                        Quality
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-[#C9A05C]/15 font-medium text-slate-700 dark:text-slate-200">
                    {previewRows.slice(0, 25).map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {idx + 1}
                        </td>
                        <td
                          className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[240px]"
                          title={row.Log}
                        >
                          {row.Log || "-"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-[#0A3266] dark:text-[#ebd09e] font-bold">
                          {row.Course_ID}
                        </td>
                        <td
                          className="py-3 px-3 whitespace-nowrap font-semibold text-xs text-slate-700 dark:text-slate-200 truncate max-w-[140px]"
                          title={row.Lecturer_ID}
                        >
                          {row.Lecturer_ID}
                        </td>
                        <td
                          className="py-3 px-3 whitespace-nowrap font-semibold text-xs text-slate-700 dark:text-slate-200 truncate max-w-[140px]"
                          title={row.Student_ID}
                        >
                          {row.Student_ID}
                        </td>
                        <td
                          className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate"
                          title={row.Lecturer_Question}
                        >
                          {row.Lecturer_Question || "-"}
                        </td>
                        <td
                          className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate font-semibold text-[#0A3266] dark:text-[#FBF8F3]"
                          title={row.Student_Answer}
                        >
                          {row.Student_Answer || (
                            <span className="text-slate-400 italic font-normal">
                              Belum dijawab
                            </span>
                          )}
                        </td>
                        <td
                          className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate"
                          title={row.Lecturer_Feedback}
                        >
                          {row.Lecturer_Feedback || "-"}
                        </td>
                        <td
                          className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate"
                          title={row.Student_Reaction}
                        >
                          {row.Student_Reaction || "-"}
                        </td>
                        <td
                          className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate"
                          title={row.Lecturer_Opinion}
                        >
                          {row.Lecturer_Opinion || "-"}
                        </td>
                        <td
                          className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate"
                          title={row.Student_Opinion}
                        >
                          {row.Student_Opinion || "-"}
                        </td>

                        {/* Label Columns with visual styling */}
                        <td className="py-3 px-2 text-center font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5">
                          {row["Q-A_Relevance"] !== "" ? row["Q-A_Relevance"] : "0.00"}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                          {row["A-F_Relevance"] !== "" ? row["A-F_Relevance"] : "0.00"}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                          {row.Feedback_Novalty !== "" ? row.Feedback_Novalty : "0.00"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-xs">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                              row.Student_Sentiment === "Positif"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : row.Student_Sentiment === "Negatif"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                : "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                            }`}
                          >
                            {row.Student_Sentiment || "Netral"}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-xs font-medium text-purple-600 dark:text-purple-300">
                          {row.Student_Emotion || "Neutral"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-xs font-medium text-teal-600 dark:text-teal-300">
                          {row.Lecturer_Emotion || "Supportive"}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-xs font-black text-[#C9A05C] bg-[#C9A05C]/10">
                          {row.Interaction_Quality !== "" ? row.Interaction_Quality : "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Specification Reference Table */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-5 w-5 text-[#C9A05C]" />
              <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                Spesifikasi Pemetaan 17 Kolom Dataset ARJUNA-Net
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-[#C9A05C]/20 text-[#0A3266] dark:text-[#ebd09e] font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Nama Kolom Dataset</th>
                    <th className="py-2.5 px-3">Tipe Data</th>
                    <th className="py-2.5 px-3">Sumber Entitas LMS</th>
                    <th className="py-2.5 px-3">Status Pengisian</th>
                    <th className="py-2.5 px-3">Keterangan / Fungsi NLP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-[#C9A05C]/10 text-slate-600 dark:text-slate-300 font-medium">
                  <tr>
                    <td className="py-2 px-3 font-mono">1</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Log</td>
                    <td className="py-2 px-3 font-mono">String (ISO Date)</td>
                    <td className="py-2 px-3">Audit Log Timestamp</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis Waktu</span></td>
                    <td className="py-2 px-3">Timestamp ISO interaksi thread/pesan forum</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">2</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Course_ID</td>
                    <td className="py-2 px-3 font-mono">String</td>
                    <td className="py-2 px-3">Course.code</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis DB</span></td>
                    <td className="py-2 px-3">Kode identitas mata kuliah</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">3</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Lecturer_ID</td>
                    <td className="py-2 px-3 font-mono">String</td>
                    <td className="py-2 px-3">Course.lecturer.name</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis DB</span></td>
                    <td className="py-2 px-3">Nama/ID dosen pengampu kelas</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">4</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_ID</td>
                    <td className="py-2 px-3 font-mono">String</td>
                    <td className="py-2 px-3">User.name</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis DB</span></td>
                    <td className="py-2 px-3">Nama/ID mahasiswa yang merespon</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">5</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Lecturer_Question</td>
                    <td className="py-2 px-3 font-mono">String (Clean Text)</td>
                    <td className="py-2 px-3">ThreadMessage (QUESTION)</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis Forum</span></td>
                    <td className="py-2 px-3">Teks pertanyaan dosen (BiLSTM / BERT embedding)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">6</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_Answer</td>
                    <td className="py-2 px-3 font-mono">String (Clean Text)</td>
                    <td className="py-2 px-3">ThreadMessage (ANSWER)</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis Forum</span></td>
                    <td className="py-2 px-3">Teks jawaban mahasiswa</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">7</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Lecturer_Feedback</td>
                    <td className="py-2 px-3 font-mono">String (Clean Text)</td>
                    <td className="py-2 px-3">ThreadMessage (FEEDBACK)</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis Forum</span></td>
                    <td className="py-2 px-3">Teks balasan feedback dosen</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">8</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_Reaction</td>
                    <td className="py-2 px-3 font-mono">String (Clean Text)</td>
                    <td className="py-2 px-3">ThreadMessage (REACTION)</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis Forum</span></td>
                    <td className="py-2 px-3">Reaksi respon mahasiswa</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">9</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Lecturer_Opinion</td>
                    <td className="py-2 px-3 font-mono">String (Clean Text)</td>
                    <td className="py-2 px-3">Opinion.opinionText (Dosen)</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis Refleksi</span></td>
                    <td className="py-2 px-3">Opini refleksi dosen pengampu</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">10</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_Opinion</td>
                    <td className="py-2 px-3 font-mono">String (Clean Text)</td>
                    <td className="py-2 px-3">Opinion.opinionText (Mhs)</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-semibold">Otomatis Refleksi</span></td>
                    <td className="py-2 px-3">Opini refleksi mahasiswa</td>
                  </tr>
                  <tr className="bg-[#C9A05C]/10 dark:bg-[#C9A05C]/15">
                    <td className="py-2 px-3 font-mono font-bold">11</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#ebd09e]">Q-A_Relevance</td>
                    <td className="py-2 px-3 font-mono">Float (0.0 - 1.0)</td>
                    <td className="py-2 px-3">DatasetLabel / NLP Engine</td>
                    <td className="py-2 px-3"><span className="text-[#C9A05C] font-extrabold">Terisi Otomatis / Manual</span></td>
                    <td className="py-2 px-3">Relevansi semantik pertanyaan vs jawaban</td>
                  </tr>
                  <tr className="bg-[#C9A05C]/10 dark:bg-[#C9A05C]/15">
                    <td className="py-2 px-3 font-mono font-bold">12</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#ebd09e]">A-F_Relevance</td>
                    <td className="py-2 px-3 font-mono">Float (0.0 - 1.0)</td>
                    <td className="py-2 px-3">DatasetLabel / NLP Engine</td>
                    <td className="py-2 px-3"><span className="text-[#C9A05C] font-extrabold">Terisi Otomatis / Manual</span></td>
                    <td className="py-2 px-3">Relevansi jawaban vs feedback dosen</td>
                  </tr>
                  <tr className="bg-[#C9A05C]/10 dark:bg-[#C9A05C]/15">
                    <td className="py-2 px-3 font-mono font-bold">13</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#ebd09e]">Feedback_Novalty</td>
                    <td className="py-2 px-3 font-mono">Float (0.0 - 1.0)</td>
                    <td className="py-2 px-3">DatasetLabel / NLP Engine</td>
                    <td className="py-2 px-3"><span className="text-[#C9A05C] font-extrabold">Terisi Otomatis / Manual</span></td>
                    <td className="py-2 px-3">Kebaruan materi pada feedback dosen</td>
                  </tr>
                  <tr className="bg-[#C9A05C]/10 dark:bg-[#C9A05C]/15">
                    <td className="py-2 px-3 font-mono font-bold">14</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#ebd09e]">Student_Sentiment</td>
                    <td className="py-2 px-3 font-mono">String</td>
                    <td className="py-2 px-3">DatasetLabel / NLP Engine</td>
                    <td className="py-2 px-3"><span className="text-[#C9A05C] font-extrabold">Terisi Otomatis / Manual</span></td>
                    <td className="py-2 px-3">Sentimen mahasiswa (Positif/Netral/Negatif)</td>
                  </tr>
                  <tr className="bg-[#C9A05C]/10 dark:bg-[#C9A05C]/15">
                    <td className="py-2 px-3 font-mono font-bold">15</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#ebd09e]">Student_Emotion</td>
                    <td className="py-2 px-3 font-mono">String</td>
                    <td className="py-2 px-3">DatasetLabel / NLP Engine</td>
                    <td className="py-2 px-3"><span className="text-[#C9A05C] font-extrabold">Terisi Otomatis / Manual</span></td>
                    <td className="py-2 px-3">Klasifikasi emosi mahasiswa</td>
                  </tr>
                  <tr className="bg-[#C9A05C]/10 dark:bg-[#C9A05C]/15">
                    <td className="py-2 px-3 font-mono font-bold">16</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#ebd09e]">Lecturer_Emotion</td>
                    <td className="py-2 px-3 font-mono">String</td>
                    <td className="py-2 px-3">DatasetLabel / NLP Engine</td>
                    <td className="py-2 px-3"><span className="text-[#C9A05C] font-extrabold">Terisi Otomatis / Manual</span></td>
                    <td className="py-2 px-3">Klasifikasi emosi feedback dosen</td>
                  </tr>
                  <tr className="bg-[#C9A05C]/10 dark:bg-[#C9A05C]/15">
                    <td className="py-2 px-3 font-mono font-bold">17</td>
                    <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#ebd09e]">Interaction_Quality</td>
                    <td className="py-2 px-3 font-mono">Float (0.0 - 1.0)</td>
                    <td className="py-2 px-3">DatasetLabel / NLP Engine</td>
                    <td className="py-2 px-3"><span className="text-[#C9A05C] font-extrabold">Terisi Otomatis / Manual</span></td>
                    <td className="py-2 px-3">Skor agregat kualitas diskusi pembelajaran</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: STUDIO MANAJEMEN & ANOTASI LABEL DATASET
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "manage" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Controls Bar */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchThread}
                    onChange={(e) => {
                      setSearchThread(e.target.value);
                      setThreadPage(1);
                    }}
                    placeholder="Cari topik diskusi..."
                    className="glass-input w-full rounded-xl pl-9 pr-3 py-2 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-[#ebd09e]/80">Status:</span>
                  <select
                    value={labeledStatusFilter}
                    onChange={(e) => {
                      setLabeledStatusFilter(e.target.value);
                      setThreadPage(1);
                    }}
                    className="glass-input rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <option value="ALL">Semua Status Anotasi</option>
                    <option value="MANUAL">Dianotasi Manual (Peneliti)</option>
                    <option value="AUTO">Auto-Inference (NLP AI)</option>
                    <option value="UNLABELED">Belum Tersimpan di DB</option>
                  </select>
                </div>
              </div>

              {/* Bulk Auto Label Action Button */}
              <button
                onClick={() => setShowBulkModal(true)}
                className="glass-button-secondary flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-[#C9A05C] border border-[#C9A05C]/40 hover:bg-[#C9A05C]/20"
              >
                <Sparkles className="h-4 w-4 text-[#C9A05C]" />
                <span>Auto-Label Semua Diskusi (1-Klik)</span>
              </button>
            </div>
          </div>

          {/* Threads List Table */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                  Daftar Interaksi Diskusi Kelas & Nilai Parameter Label
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#ebd09e]/80">
                  Pilih diskusi untuk menyesuaikan nilai skor 7 parameter penelitian secara manual atau menggunakan inferensi AI.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-[#ebd09e]/80">
                Total {threadsMeta.total} diskusi
              </span>
            </div>

            {threadsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-[#C9A05C]" />
                <p className="text-xs text-slate-500 dark:text-[#ebd09e]">Memuat data thread & label...</p>
              </div>
            ) : threadsList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 dark:border-[#C9A05C]/30 p-10 text-center">
                <p className="text-sm font-semibold text-slate-500 dark:text-[#ebd09e]/70">
                  Tidak ada diskusi yang cocok dengan kriteria filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-[#C9A05C]/30">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-[#C9A05C]/30 bg-[#0A3266]/10 dark:bg-[#0A3266]/40 text-[#0A3266] dark:text-[#FBF8F3] font-bold">
                      <th className="py-3 px-3">Kelas</th>
                      <th className="py-3 px-3 min-w-[220px]">Topik Pertanyaan</th>
                      <th className="py-3 px-2 text-center">Respon</th>
                      <th className="py-3 px-2 text-center">Q-A</th>
                      <th className="py-3 px-2 text-center">A-F</th>
                      <th className="py-3 px-2 text-center">Novelty</th>
                      <th className="py-3 px-2 text-center">Sentimen</th>
                      <th className="py-3 px-2 text-center">Emosi Mhs</th>
                      <th className="py-3 px-2 text-center">Kualitas</th>
                      <th className="py-3 px-3 text-center">Sumber Label</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-[#C9A05C]/15 font-medium text-slate-700 dark:text-slate-200">
                    {threadsList.map((thread) => {
                      const eff = thread.effectiveLabels;
                      const hasManual = thread.label?.source === "MANUAL";
                      const hasAuto = thread.label?.source === "AUTO";

                      return (
                        <tr
                          key={thread.id}
                          className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-[#0A3266] dark:text-[#ebd09e]">
                              {thread.course?.code}
                            </span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[110px]">
                              {thread.course?.name}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#0A3266] dark:text-[#FBF8F3] line-clamp-1">
                              {thread.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {thread.questionText || "-"}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap font-mono text-[11px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {thread.answersCount} jwb
                            </span>
                            <span className="text-slate-400 mx-1">·</span>
                            <span className="text-blue-500">
                              {thread.opinionsCount} opini
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                            {eff.qaRelevance?.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {eff.afRelevance?.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                            {eff.feedbackNovelty?.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                eff.studentSentiment === "Positif"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : eff.studentSentiment === "Negatif"
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                  : "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {eff.studentSentiment}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap text-[11px] font-semibold text-purple-600 dark:text-purple-300">
                            {eff.studentEmotion}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-black text-[#C9A05C]">
                            {eff.interactionQuality?.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {hasManual ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e] border border-[#C9A05C]/40">
                                <UserCheck className="h-3 w-3 text-[#C9A05C]" />
                                <span>Manual Anotator</span>
                              </span>
                            ) : hasAuto ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                                <Bot className="h-3 w-3 text-blue-400" />
                                <span>NLP AI Auto</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-500 border border-slate-500/20">
                                <span>Auto Fallback</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => openAnnotationModal(thread)}
                              className="glass-button-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Kelola Label</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {threadsMeta.totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-black/10 dark:border-[#C9A05C]/20">
                <span className="text-xs text-slate-500 dark:text-[#ebd09e]/80">
                  Halaman {threadsMeta.page} dari {threadsMeta.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setThreadPage((p) => Math.max(1, p - 1))}
                    disabled={threadPage <= 1}
                    className="glass-button-secondary rounded-xl p-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4 text-[#C9A05C]" />
                  </button>
                  <button
                    onClick={() => setThreadPage((p) => Math.min(threadsMeta.totalPages, p + 1))}
                    disabled={threadPage >= threadsMeta.totalPages}
                    className="glass-button-secondary rounded-xl p-2 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4 text-[#C9A05C]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: STUDIO ANOTASI LABEL DATASET (MANUAL / AUTO-CALCULATE)
      ═══════════════════════════════════════════════════════════════════ */}
      {showAnnotationModal && selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A05C]/40">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-black/10 dark:border-[#C9A05C]/20 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#C9A05C]/20 px-3 py-0.5 text-[11px] font-bold text-[#8c6828] dark:text-[#ebd09e] mb-1.5 border border-[#C9A05C]/40">
                  <span>{selectedThread.course?.code} - {selectedThread.course?.name}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#0A3266] dark:text-[#FBF8F3]">
                  Studio Anotasi Label Dataset ARJUNA-Net
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#ebd09e]/80">
                  Topik: {selectedThread.title}
                </p>
              </div>

              <button
                onClick={() => setShowAnnotationModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-[#0A3266] dark:hover:text-[#FBF8F3] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conversation Context Snippets */}
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-[#0A3266] dark:text-[#ebd09e] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>Konteks Teks Percakapan Diskusi</span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5 text-xs bg-black/5 dark:bg-[#030d1d]/60 p-4 rounded-2xl border border-black/10 dark:border-[#C9A05C]/20">
                <div>
                  <span className="font-bold text-[#0A3266] dark:text-[#ebd09e]">1. Pertanyaan Dosen:</span>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                    {selectedThread.questionText || "-"}
                  </p>
                </div>

                {selectedThread.sampleAnswer && (
                  <div className="pt-2 border-t border-black/5 dark:border-[#C9A05C]/10">
                    <span className="font-bold text-blue-600 dark:text-blue-300">2. Sampel Jawaban Mahasiswa:</span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                      {selectedThread.sampleAnswer}
                    </p>
                  </div>
                )}

                {selectedThread.sampleFeedback && (
                  <div className="pt-2 border-t border-black/5 dark:border-[#C9A05C]/10">
                    <span className="font-bold text-amber-600 dark:text-amber-300">3. Feedback Dosen:</span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                      {selectedThread.sampleFeedback}
                    </p>
                  </div>
                )}

                {selectedThread.sampleReaction && (
                  <div className="pt-2 border-t border-black/5 dark:border-[#C9A05C]/10">
                    <span className="font-bold text-purple-600 dark:text-purple-300">4. Reaksi Mahasiswa:</span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                      {selectedThread.sampleReaction}
                    </p>
                  </div>
                )}

                {selectedThread.sampleOpinion && (
                  <div className="pt-2 border-t border-black/5 dark:border-[#C9A05C]/10">
                    <span className="font-bold text-emerald-600 dark:text-emerald-300">5. Opini Mahasiswa:</span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                      {selectedThread.sampleOpinion}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Anotasi 7 Kolom Label */}
            <form onSubmit={handleSaveAnnotation} className="mt-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-xs font-bold text-[#0A3266] dark:text-[#ebd09e] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#C9A05C]" />
                  <span>Atur 7 Parameter Label Dataset</span>
                </h4>

                <button
                  type="button"
                  onClick={handleAutoCalculateForm}
                  disabled={autoCalculating}
                  className="glass-button-secondary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[#C9A05C] border border-[#C9A05C]/40"
                >
                  <Sparkles className={`h-3.5 w-3.5 text-[#C9A05C] ${autoCalculating ? "animate-spin" : ""}`} />
                  <span>Hitung Otomatis Berdasarkan Teks</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Q-A Relevance */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/5 dark:bg-[#030d1d]/40 border border-black/10 dark:border-[#C9A05C]/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Q-A_Relevance (0.0 - 1.0)
                    </label>
                    <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                      {Number(annotationForm.qaRelevance).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={annotationForm.qaRelevance}
                    onChange={(e) =>
                      setAnnotationForm({ ...annotationForm, qaRelevance: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#C9A05C] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Relevansi semantik antara pertanyaan dan jawaban</p>
                </div>

                {/* 2. A-F Relevance */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/5 dark:bg-[#030d1d]/40 border border-black/10 dark:border-[#C9A05C]/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      A-F_Relevance (0.0 - 1.0)
                    </label>
                    <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                      {Number(annotationForm.afRelevance).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={annotationForm.afRelevance}
                    onChange={(e) =>
                      setAnnotationForm({ ...annotationForm, afRelevance: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#C9A05C] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Relevansi antara jawaban mahasiswa dan feedback dosen</p>
                </div>

                {/* 3. Feedback Novelty */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/5 dark:bg-[#030d1d]/40 border border-black/10 dark:border-[#C9A05C]/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Feedback_Novalty (0.0 - 1.0)
                    </label>
                    <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                      {Number(annotationForm.feedbackNovelty).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={annotationForm.feedbackNovelty}
                    onChange={(e) =>
                      setAnnotationForm({ ...annotationForm, feedbackNovelty: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#C9A05C] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Tingkat kebaruan materi penjelasan baru pada feedback</p>
                </div>

                {/* 4. Student Sentiment */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/5 dark:bg-[#030d1d]/40 border border-black/10 dark:border-[#C9A05C]/20">
                  <label className="text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                    Student_Sentiment (SSWE)
                  </label>
                  <select
                    value={annotationForm.studentSentiment}
                    onChange={(e) =>
                      setAnnotationForm({ ...annotationForm, studentSentiment: e.target.value })
                    }
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Positif">Positif (Mendukung / Positif)</option>
                    <option value="Negatif">Negatif (Kritik / Kendala)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Polaritas sentimen biner mahasiswa (SSWE + CNN)</p>
                </div>

                {/* 5. Student Emotion */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/5 dark:bg-[#030d1d]/40 border border-black/10 dark:border-[#C9A05C]/20">
                  <label className="text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                    Student_Emotion (EWE 5-Classes)
                  </label>
                  <select
                    value={annotationForm.studentEmotion}
                    onChange={(e) =>
                      setAnnotationForm({ ...annotationForm, studentEmotion: e.target.value })
                    }
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Happiness">Happiness (Kebahagiaan / Kepuasan)</option>
                    <option value="Anger">Anger (Kemarahan / Frustrasi)</option>
                    <option value="Fear">Fear (Kekhawatiran / Kecemasan)</option>
                    <option value="Disgust">Disgust (Ketidaksukaan / Muak)</option>
                    <option value="Sadness">Sadness (Kesedihan / Kekecewaan)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Keadaan emosi dominan mahasiswa (EWE + CNN)</p>
                </div>

                {/* 6. Lecturer Emotion */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/5 dark:bg-[#030d1d]/40 border border-black/10 dark:border-[#C9A05C]/20">
                  <label className="text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                    Lecturer_Emotion (EWE 5-Classes)
                  </label>
                  <select
                    value={annotationForm.lecturerEmotion}
                    onChange={(e) =>
                      setAnnotationForm({ ...annotationForm, lecturerEmotion: e.target.value })
                    }
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Happiness">Happiness (Apresiasi / Positif)</option>
                    <option value="Anger">Anger (Koreksi Tegas / Peringatan)</option>
                    <option value="Fear">Fear (Peringatan Risiko / Kehati-hatian)</option>
                    <option value="Disgust">Disgust (Ketidaksesuaian Total)</option>
                    <option value="Sadness">Sadness (Kekecewaan / Perlu Perbaikan)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Nada/emosi feedback dosen (EWE + CNN)</p>
                </div>

                {/* 7. Interaction Quality */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/5 dark:bg-[#030d1d]/40 border border-black/10 dark:border-[#C9A05C]/20 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                      Interaction_Quality (0.0 - 1.0)
                    </label>
                    <span className="font-mono font-black text-[#C9A05C] text-sm">
                      {Number(annotationForm.interactionQuality).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={annotationForm.interactionQuality}
                    onChange={(e) =>
                      setAnnotationForm({ ...annotationForm, interactionQuality: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#C9A05C] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Skor komposit kualitas agregat interaksi diskusi</p>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/10 dark:border-[#C9A05C]/20">
                <div>
                  {selectedThread.label && (
                    <button
                      type="button"
                      onClick={handleDeleteAnnotation}
                      disabled={deletingLabel}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{deletingLabel ? "Mereset..." : "Reset Label Manual"}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAnnotationModal(false)}
                    className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingLabel}
                    className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold shadow-lg"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{savingLabel ? "Menyimpan..." : "Simpan Label Anotasi"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: BULK AUTO-LABEL CONFIRMATION
      ═══════════════════════════════════════════════════════════════════ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A05C]/40 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#C9A05C] mb-4 border border-[#C9A05C]/35">
              <Sparkles className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
              Auto-Label Semua Diskusi Kelas?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-[#ebd09e]/80">
              Sistem akan menjalankan engine NLP heuristics bahasa Indonesia untuk menghitung ke-7 parameter label (`Q-A_Relevance`, `A-F_Relevance`, `Feedback_Novalty`, `Student_Sentiment`, `Student_Emotion`, `Lecturer_Emotion`, `Interaction_Quality`) dan menyimpannya secara permanen ke database.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                disabled={bulkProcessing}
                className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkAutoLabel}
                disabled={bulkProcessing}
                className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold shadow-lg"
              >
                <Sparkles className={`h-4 w-4 ${bulkProcessing ? "animate-spin" : ""}`} />
                <span>{bulkProcessing ? "Memproses NLP..." : "Jalankan Auto-Labeling"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GlassMetricCard({
  title,
  value,
  desc,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  desc: string;
  icon: any;
  color: string;
}) {
  return (
    <div className={`glass-card relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${color} transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-[#ebd09e]/80 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/10 text-current backdrop-blur-md">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-[11px] font-medium text-slate-600 dark:text-[#ebd09e]/70">
        {desc}
      </p>
    </div>
  );
}
