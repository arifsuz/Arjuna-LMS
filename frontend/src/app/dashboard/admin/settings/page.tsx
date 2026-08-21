"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { academic as academicApi } from "@/lib/api";
import {
  Sliders,
  Calendar,
  ShieldCheck,
  Brain,
  Building,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Scale,
  Database,
  Lock,
  Layers,
  Award,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const [settings, setSettings] = useState<any>({
    activeTerm: "2026/2027 Ganjil",
    registrationOpen: true,
    turnitinMaxSimilarity: 20,
    turnitinExcludeQuotes: true,
    turnitinExcludeBibliography: true,
    assessmentWeights: {
      assignments: 20,
      quizzes: 15,
      forum: 15,
      midterm: 25,
      finalExam: 25,
    },
    aiAnnotation: {
      autoLabelOnThreadClose: true,
      sentimentConfidenceThreshold: 0.8,
      emotionConfidenceThreshold: 0.75,
      weights: { alpha: 0.4, beta: 0.3, gamma: 0.3 },
    },
    institution: {
      campusName: "Universitas Arjuna (ARJUNA-LMS)",
      facultyName: "Fakultas Ilmu Komputer & Teknologi Informasi",
      contactEmail: "akademik@arjuna-lms.ac.id",
      lmsVersion: "v2.5.0-Enterprise",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "academic" | "assessment" | "turnitin" | "ai" | "institution"
  >("academic");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await academicApi.getSettings();
      if (data) setSettings(data);
    } catch {
      showNotification("error", "Gagal memuat pengaturan sistem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadSettings();
    }
  }, [user?.role]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await academicApi.updateSettings(settings);
      setSettings(updated);
      showNotification("success", "Pengaturan sistem dan parameter akademik berhasil disimpan!");
    } catch (err: any) {
      showNotification("error", err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  // Weight total validation
  const totalWeights =
    (Number(settings.assessmentWeights?.assignments) || 0) +
    (Number(settings.assessmentWeights?.quizzes) || 0) +
    (Number(settings.assessmentWeights?.forum) || 0) +
    (Number(settings.assessmentWeights?.midterm) || 0) +
    (Number(settings.assessmentWeights?.finalExam) || 0);

  return (
    <div className="space-y-8 pb-12">
      {/* ═══ Feedback Toast ═══ */}
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

      {/* ═══ 1. Header Banner ═══ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#C9A05C]/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#ebd09e] backdrop-blur-md mb-2">
              <Sliders className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Pusat Konfigurasi & Kebijakan Kampus</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              Pengaturan Sistem & Parameter Akademik
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-[#ebd09e]/80 max-w-3xl leading-relaxed">
              Atur semester aktif, standar bobot penilaian kelulusan, ambang batas kesamaan Turnitin, parameter inferensi model AI ARJUNA-Net, serta identitas institusi kampus.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSettings}
              disabled={loading}
              className="glass-button-secondary flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold"
            >
              <RefreshCw className={`h-4 w-4 text-[#C9A05C] ${loading ? "animate-spin" : ""}`} />
              <span>Reset Data</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold shadow-lg"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 2. Settings Nav Tabs ═══ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 dark:border-[#C9A05C]/20 pb-4">
        <button
          onClick={() => setActiveTab("academic")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "academic"
              ? "bg-[#C9A05C] text-[#0A3266] shadow-md"
              : "glass-card text-slate-600 dark:text-[#ebd09e]/80 hover:text-[#0A3266] dark:hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Semester & Periode</span>
        </button>

        <button
          onClick={() => setActiveTab("assessment")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "assessment"
              ? "bg-[#C9A05C] text-[#0A3266] shadow-md"
              : "glass-card text-slate-600 dark:text-[#ebd09e]/80 hover:text-[#0A3266] dark:hover:text-white"
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Standar Bobot Nilai ({totalWeights}%)</span>
        </button>

        <button
          onClick={() => setActiveTab("turnitin")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "turnitin"
              ? "bg-[#C9A05C] text-[#0A3266] shadow-md"
              : "glass-card text-slate-600 dark:text-[#ebd09e]/80 hover:text-[#0A3266] dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Turnitin & Anti-Plagiarisme</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "ai"
              ? "bg-[#C9A05C] text-[#0A3266] shadow-md"
              : "glass-card text-slate-600 dark:text-[#ebd09e]/80 hover:text-[#0A3266] dark:hover:text-white"
          }`}
        >
          <Brain className="h-4 w-4" />
          <span>Inferensi AI ARJUNA-Net</span>
        </button>

        <button
          onClick={() => setActiveTab("institution")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "institution"
              ? "bg-[#C9A05C] text-[#0A3266] shadow-md"
              : "glass-card text-slate-600 dark:text-[#ebd09e]/80 hover:text-[#0A3266] dark:hover:text-white"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Profil Institusi</span>
        </button>
      </div>

      {/* ═══ 3. Active Settings Form Panel ═══ */}
      <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
        {/* Tab 1: Academic Term */}
        {activeTab === "academic" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                  Pengaturan Periode & Semester Akademik
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menentukan semester yang sedang aktif berjalan bagi seluruh kelas perkuliahan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Semester Aktif Berjalan *
                </label>
                <input
                  type="text"
                  value={settings.activeTerm || ""}
                  onChange={(e) => setSettings({ ...settings, activeTerm: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-semibold"
                  placeholder="Contoh: 2026/2027 Ganjil"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Registrasi Mahasiswa (KRS)
                </label>
                <select
                  value={settings.registrationOpen ? "OPEN" : "CLOSED"}
                  onChange={(e) =>
                    setSettings({ ...settings, registrationOpen: e.target.value === "OPEN" })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <option value="OPEN">Dibuka (Mahasiswa Bebas Mengambil Kelas)</option>
                  <option value="CLOSED">Ditutup (Hanya Admin yang Meng-Enroll)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assessment Weights */}
        {activeTab === "assessment" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                    Standar Bobot Penilaian Akademik (Gradebook)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Proporsi persentase komponen penilaian untuk kalkulasi huruf mutu mahasiswa.
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-black px-3 py-1 rounded-xl border ${
                  totalWeights === 100
                    ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/40"
                    : "bg-rose-500/15 text-rose-600 border-rose-500/40"
                }`}
              >
                Total: {totalWeights}% {totalWeights === 100 ? "(Sesuai 100%)" : "(Harus 100%)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tugas Kuliah (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.assessmentWeights?.assignments ?? 20}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      assessmentWeights: {
                        ...settings.assessmentWeights,
                        assignments: Number(e.target.value),
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kuis Daring (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.assessmentWeights?.quizzes ?? 15}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      assessmentWeights: {
                        ...settings.assessmentWeights,
                        quizzes: Number(e.target.value),
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Forum ARJUNA (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.assessmentWeights?.forum ?? 15}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      assessmentWeights: {
                        ...settings.assessmentWeights,
                        forum: Number(e.target.value),
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  UTS (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.assessmentWeights?.midterm ?? 25}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      assessmentWeights: {
                        ...settings.assessmentWeights,
                        midterm: Number(e.target.value),
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  UAS (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.assessmentWeights?.finalExam ?? 25}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      assessmentWeights: {
                        ...settings.assessmentWeights,
                        finalExam: Number(e.target.value),
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Turnitin Engine */}
        {activeTab === "turnitin" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                  Konfigurasi Anti-Plagiarisme & Keaslian Dokumen (Turnitin Engine)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Parameter toleransi kesamaan teks pada unggahan berkas tugas mahasiswa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Batas Maksimal Kemiripan Dokumen (Similarity Threshold %)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.turnitinMaxSimilarity ?? 20}
                  onChange={(e) =>
                    setSettings({ ...settings, turnitinMaxSimilarity: Number(e.target.value) })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-bold font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Pengumpulan tugas di atas nilai ini akan ditandai berisiko plagiarisme.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.turnitinExcludeQuotes ?? true}
                    onChange={(e) =>
                      setSettings({ ...settings, turnitinExcludeQuotes: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#C9A05C]"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Abaikan kutipan langsung dalam tanda petik (&ldquo;...&rdquo;)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.turnitinExcludeBibliography ?? true}
                    onChange={(e) =>
                      setSettings({ ...settings, turnitinExcludeBibliography: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#C9A05C]"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Abaikan bagian Daftar Pustaka / Referensi
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Model ARJUNA-Net */}
        {activeTab === "ai" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                  Parameter Inferensi Model AI ARJUNA-Net & Formula Interaksi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konfigurasi bobot semantik ($\alpha, \beta, \gamma$) untuk dataset riset.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bobot $\alpha$ (Q-A Relevance)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={settings.aiAnnotation?.weights?.alpha ?? 0.4}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aiAnnotation: {
                        ...settings.aiAnnotation,
                        weights: {
                          ...settings.aiAnnotation?.weights,
                          alpha: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bobot $\beta$ (A-F Relevance)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={settings.aiAnnotation?.weights?.beta ?? 0.3}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aiAnnotation: {
                        ...settings.aiAnnotation,
                        weights: {
                          ...settings.aiAnnotation?.weights,
                          beta: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bobot $\gamma$ (Feedback Novelty)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={settings.aiAnnotation?.weights?.gamma ?? 0.3}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aiAnnotation: {
                        ...settings.aiAnnotation,
                        weights: {
                          ...settings.aiAnnotation?.weights,
                          gamma: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-bold font-mono text-center"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.aiAnnotation?.autoLabelOnThreadClose ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aiAnnotation: {
                        ...settings.aiAnnotation,
                        autoLabelOnThreadClose: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded accent-[#C9A05C]"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Generate otomatis label dataset NLP 15-kolom saat topik forum diskusi ditutup oleh dosen
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 5: Institution Profile */}
        {activeTab === "institution" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                  Profil Institusi Kampus & Branding LMS
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Informasi identitas perguruan tinggi yang ditampilkan pada antarmuka pengguna.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Perguruan Tinggi *
                </label>
                <input
                  type="text"
                  value={settings.institution?.campusName || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      institution: {
                        ...settings.institution,
                        campusName: e.target.value,
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fakultas / Program Studi
                </label>
                <input
                  type="text"
                  value={settings.institution?.facultyName || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      institution: {
                        ...settings.institution,
                        facultyName: e.target.value,
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Layanan Bantuan Akademik
                </label>
                <input
                  type="email"
                  value={settings.institution?.contactEmail || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      institution: {
                        ...settings.institution,
                        contactEmail: e.target.value,
                      },
                    })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Versi Platform LMS
                </label>
                <input
                  type="text"
                  disabled
                  value={settings.institution?.lmsVersion || "v2.5.0-Enterprise"}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-bold opacity-60"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="glass-button-primary flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-extrabold shadow-xl"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
