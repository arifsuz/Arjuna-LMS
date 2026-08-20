"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Download,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BarChart3,
  Filter,
  Loader2,
  RefreshCw,
  Tag,
  ExternalLink,
} from "lucide-react";
import { datasets, courses, Course } from "@/lib/api";

interface DatasetSummary {
  totalCourses: number;
  totalThreads: number;
  totalMessages: number;
  totalAnswers: number;
  totalOpinions: number;
  totalLabels: number;
  readinessScore: number;
}

export default function AdminDatasetPage() {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Labeling modal state
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [targetThreadId, setTargetThreadId] = useState("");
  const [labelForm, setLabelForm] = useState({
    qaRelevance: 0.95,
    afRelevance: 0.9,
    feedbackNovelty: 0.85,
    studentSentiment: "Positive",
    studentEmotion: "Curiosity",
    interactionQuality: 4.8,
  });
  const [savingLabel, setSavingLabel] = useState(false);
  const [labelSuccess, setLabelSuccess] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, courseRes] = await Promise.all([
        datasets.getSummary(),
        courses.listAll(),
      ]);
      setSummary(sumRes);
      setCourseList(courseRes);
    } catch (err) {
      console.error("Failed to load dataset summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownloadCsv = () => {
    setDownloading(true);
    const url = datasets.exportUrl(selectedCourse || undefined, "csv");
    window.open(url, "_blank");
    setTimeout(() => setDownloading(false), 1500);
  };

  const handleDownloadJson = () => {
    const url = datasets.exportUrl(selectedCourse || undefined, "json");
    window.open(url, "_blank");
  };

  const handleSaveLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetThreadId.trim()) return;

    try {
      setSavingLabel(true);
      await datasets.setLabels(targetThreadId.trim(), {
        ...labelForm,
        qaRelevance: Number(labelForm.qaRelevance),
        afRelevance: Number(labelForm.afRelevance),
        feedbackNovelty: Number(labelForm.feedbackNovelty),
        interactionQuality: Number(labelForm.interactionQuality),
      });
      setLabelSuccess(true);
      setTimeout(() => {
        setLabelSuccess(false);
        setLabelModalOpen(false);
        setTargetThreadId("");
        loadData();
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan label anotasi");
    } finally {
      setSavingLabel(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const columnsList = [
    { col: "Course_ID", source: "Course.code", desc: "Kode mata kuliah" },
    { col: "Lecturer_ID", source: "Course.lecturer.email", desc: "Email pengampu" },
    { col: "Student_ID", source: "User.email", desc: "Email mahasiswa responden" },
    { col: "Lecturer_Question", source: "ThreadMessage (QUESTION)", desc: "Teks pertanyaan dosen" },
    { col: "Student_Answer", source: "ThreadMessage (ANSWER)", desc: "Teks jawaban mahasiswa" },
    { col: "Lecturer_Feedback", source: "ThreadMessage (FEEDBACK)", desc: "Teks umpan balik dosen" },
    { col: "Student_Reaction", source: "ThreadMessage (REACTION)", desc: "Teks reaksi mahasiswa" },
    { col: "Student_Opinion", source: "Opinion (STUDENT)", desc: "Opini reflektif pasca-interaksi" },
    { col: "Q-A_Relevance", source: "DatasetLabel", desc: "Skor relevansi pertanyaan-jawaban (0-1)" },
    { col: "A-F_Relevance", source: "DatasetLabel", desc: "Skor relevansi jawaban-feedback (0-1)" },
    { col: "Feedback_Novalty", source: "DatasetLabel", desc: "Skor kebaruan info feedback (0-1)" },
    { col: "Student_Sentiment", source: "DatasetLabel", desc: "Sentimen mahasiswa (Positive/Neutral/Negative)" },
    { col: "Student_Emotion", source: "DatasetLabel", desc: "Klasifikasi emosi mahasiswa" },
    { col: "Lecturer_Emotion", source: "DatasetLabel", desc: "Klasifikasi emosi dosen" },
    { col: "Interaction_Quality", source: "DatasetLabel", desc: "Kualitas interaksi keseluruhan (1-5)" },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dataset & Ekspor Penelitian
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitoring data interaksi dosen-mahasiswa dan ekspor 1:1 ke skema riset ARJUNA-Net.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLabelModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-sm font-semibold text-teal-300 transition-colors hover:bg-teal-500/20"
          >
            <Tag className="h-4 w-4" />
            Anotasi Label Model
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Segarkan
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Thread
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
              <Layers className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {summary?.totalThreads ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Dari {summary?.totalCourses ?? 0} kelas aktif
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Jawaban Mahasiswa
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {summary?.totalAnswers ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Target: 4 jawaban / thread
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Opini Reflektif
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {summary?.totalOpinions ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary?.totalLabels ?? 0} label terdaftar
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kelengkapan Data
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {summary?.readinessScore ?? 0}%
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-500"
              style={{ width: `${summary?.readinessScore ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Export Action Card */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-[#0e1726] to-[#0e1726] p-6 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30">
              <Database className="h-3.5 w-3.5" />
              Format Standar ARJUNA-Net
            </div>
            <h2 className="text-xl font-bold text-white">
              Ekspor Dataset Interaksi (15 Kolom)
            </h2>
            <p className="text-sm text-slate-300">
              Hasil ekspor dapat langsung digunakan pada pipeline pengujian model NLP (BiLSTM+BERT, CNN & Fusion).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter class */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition focus:border-blue-500"
              >
                <option value="">Semua Kelas</option>
                {courseList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDownloadCsv}
              disabled={downloading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download CSV
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Schema Mapping Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/80 p-6 shadow-xl">
        <h3 className="mb-4 text-base font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-400" />
          Struktur 15 Kolom Dataset ARJUNA-Net
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Kolom Dataset</th>
                <th className="px-4 py-3">Sumber Data di LMS</th>
                <th className="px-4 py-3">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {columnsList.map((col, idx) => (
                <tr key={col.col} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-400">
                    {col.col}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-800/80 px-2 py-0.5 font-mono text-xs text-teal-300 border border-slate-700/50">
                      {col.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual / Model Label Annotation Modal */}
      {labelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Tag className="h-5 w-5 text-teal-400" />
              Input Label Model / Anotator
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Simpan hasil prediksi model riset NLP atau anotasi manual untuk thread tertentu.
            </p>

            <form onSubmit={handleSaveLabels} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Thread ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: cm7... (ID thread)"
                  value={targetThreadId}
                  onChange={(e) => setTargetThreadId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Q-A Relevance (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={labelForm.qaRelevance}
                    onChange={(e) =>
                      setLabelForm({ ...labelForm, qaRelevance: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    A-F Relevance (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={labelForm.afRelevance}
                    onChange={(e) =>
                      setLabelForm({ ...labelForm, afRelevance: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Feedback Novelty (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={labelForm.feedbackNovelty}
                    onChange={(e) =>
                      setLabelForm({ ...labelForm, feedbackNovelty: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Interaction Quality (1-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={labelForm.interactionQuality}
                    onChange={(e) =>
                      setLabelForm({ ...labelForm, interactionQuality: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Sentiment
                  </label>
                  <select
                    value={labelForm.studentSentiment}
                    onChange={(e) =>
                      setLabelForm({ ...labelForm, studentSentiment: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500"
                  >
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Emotion
                  </label>
                  <input
                    type="text"
                    value={labelForm.studentEmotion}
                    onChange={(e) =>
                      setLabelForm({ ...labelForm, studentEmotion: e.target.value })
                    }
                    placeholder="Contoh: Curiosity, Joy"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {labelSuccess && (
                <p className="text-center text-xs font-bold text-teal-400">
                  ✓ Label berhasil disimpan ke dataset!
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setLabelModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingLabel}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {savingLabel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan Label"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
