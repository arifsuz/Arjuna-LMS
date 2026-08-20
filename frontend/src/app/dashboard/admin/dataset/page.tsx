"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { datasets as datasetsApi, courses as coursesApi, type Course } from "@/lib/api";
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
  Tag,
  BookOpen,
} from "lucide-react";

export default function AdminDatasetPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"csv" | "json" | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadPreview(selectedCourse);
  }, [selectedCourse]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [summaryData, coursesData] = await Promise.all([
        datasetsApi.getSummary(),
        coursesApi.listAll(),
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
    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      window.open(datasetsApi.exportUrl(selectedCourse || undefined, format), "_blank");
    } finally {
      setDownloading(null);
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="space-y-8 pb-12">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/15 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#ebd09e] backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Pipeline Ekstraksi Dataset ARJUNA-Net 15 Kolom</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              Pusat Dataset & Ekspor Interaksi Kelas
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-[#ebd09e]/80 max-w-3xl leading-relaxed">
              Mengekstrak data mentah interaksi dosen–mahasiswa (pertanyaan, jawaban, feedback, reaksi, opini) secara 1:1 sesuai skema dataset penelitian ARJUNA-Net untuk diproses oleh pipeline model NLP.
            </p>
          </div>

          <button
            onClick={() => {
              loadAllData();
              loadPreview(selectedCourse);
            }}
            disabled={loading}
            className="glass-button-secondary flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold backdrop-blur-xl"
          >
            <RefreshCw className={`h-4 w-4 text-[#C9A05C] ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. METRIC STAT CARDS
      ═══════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="glass-card-static flex flex-col items-center justify-center py-16 rounded-3xl gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#C9A05C]" />
          <p className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">Menghitung metrik dataset...</p>
        </div>
      ) : stats ? (
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
            title="Opini / Refleksi Mahasiswa"
            value={stats.totalOpinions || 0}
            desc="Data Student_Opinion yang terkumpul"
            icon={Users}
            color="text-emerald-600 dark:text-emerald-300 from-emerald-600/20 to-emerald-400/5 border-emerald-500/30"
          />
          <GlassMetricCard
            title="Kesiapan Dataset (Readiness)"
            value={`${stats.readinessScore || 0}%`}
            desc={`${stats.totalLabels || 0} label anotasi tersimpan`}
            icon={TrendingUp}
            color="text-[#0A3266] dark:text-[#dbb779] from-[#124687]/20 to-[#C9A05C]/10 border-[#C9A05C]/30"
          />
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          3. EXPORT CONTROLS & FILTER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] border border-[#C9A05C]/35">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                Ekspor Dataset Penelitian (15 Kolom)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#ebd09e]/80">
                Unduh dataset dalam format .CSV atau .JSON siap proses untuk model BiLSTM, BERT, CNN & Fusion.
              </p>
            </div>
          </div>

          {/* Filter Mata Kuliah */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#C9A05C]" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
            >
              <option value="">Semua Kelas Mata Kuliah</option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#061a3b] text-[#0A3266] dark:text-[#FBF8F3]">
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
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
                Tabel baris-per-jawaban dengan 15 kolom terstandarisasi yang siap dibaca oleh Python Pandas, PyTorch DataLoader, atau scikit-learn.
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
                Menyimpan relasi pohon lengkap antara mata kuliah, thread diskusi, pesan balasan, catatan opini, dan label anotasi.
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

      {/* ═══════════════════════════════════════════════════════════════════
          4. LIVE DATASET PREVIEW (15 COLUMNS TABLE)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] border border-[#C9A05C]/35">
              <TableIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                Pratinjau Data Mentah (15 Kolom ARJUNA-Net)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#ebd09e]/80">
                Menampilkan {previewRows.length} baris rekaman interaksi yang siap diekspor.
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
              Data akan otomatis muncul ketika dosen memposting pertanyaan dan mahasiswa mengirim jawaban di forum kelas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-[#C9A05C]/30 bg-black/[0.01] dark:bg-[#030d1d]/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/10 dark:border-[#C9A05C]/30 bg-[#0A3266]/10 dark:bg-[#0A3266]/40 text-[#0A3266] dark:text-[#FBF8F3] font-bold">
                  <th className="py-3 px-3 whitespace-nowrap">#</th>
                  <th className="py-3 px-3 whitespace-nowrap">Course_ID</th>
                  <th className="py-3 px-3 whitespace-nowrap">Lecturer_ID</th>
                  <th className="py-3 px-3 whitespace-nowrap">Student_ID</th>
                  <th className="py-3 px-3 min-w-[200px]">Lecturer_Question</th>
                  <th className="py-3 px-3 min-w-[200px]">Student_Answer</th>
                  <th className="py-3 px-3 min-w-[180px]">Lecturer_Feedback</th>
                  <th className="py-3 px-3 min-w-[150px]">Student_Reaction</th>
                  <th className="py-3 px-3 min-w-[150px]">Student_Opinion</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Q-A</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">A-F</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Novelty</th>
                  <th className="py-3 px-3 whitespace-nowrap">Sentiment</th>
                  <th className="py-3 px-3 whitespace-nowrap">Std_Emotion</th>
                  <th className="py-3 px-3 whitespace-nowrap">Lec_Emotion</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-[#C9A05C]/15 font-medium text-slate-700 dark:text-slate-200">
                {previewRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-[#0A3266] dark:text-[#ebd09e] font-bold">
                      {row.Course_ID}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                      {row.Lecturer_ID}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                      {row.Student_ID}
                    </td>
                    <td className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate" title={row.Lecturer_Question}>
                      {row.Lecturer_Question || "-"}
                    </td>
                    <td className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate font-semibold text-[#0A3266] dark:text-[#FBF8F3]" title={row.Student_Answer}>
                      {row.Student_Answer || <span className="text-slate-400 italic font-normal">Belum dijawab</span>}
                    </td>
                    <td className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate" title={row.Lecturer_Feedback}>
                      {row.Lecturer_Feedback || "-"}
                    </td>
                    <td className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate" title={row.Student_Reaction}>
                      {row.Student_Reaction || "-"}
                    </td>
                    <td className="py-3 px-3 text-xs leading-relaxed max-w-xs truncate" title={row.Student_Opinion}>
                      {row.Student_Opinion || "-"}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs">{row["Q-A_Relevance"] !== "" ? row["Q-A_Relevance"] : "-"}</td>
                    <td className="py-3 px-2 text-center font-mono text-xs">{row["A-F_Relevance"] !== "" ? row["A-F_Relevance"] : "-"}</td>
                    <td className="py-3 px-2 text-center font-mono text-xs">{row.Feedback_Novalty !== "" ? row.Feedback_Novalty : "-"}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs">{row.Student_Sentiment || "-"}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs">{row.Student_Emotion || "-"}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs">{row.Lecturer_Emotion || "-"}</td>
                    <td className="py-3 px-2 text-center font-mono text-xs">{row.Interaction_Quality !== "" ? row.Interaction_Quality : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. SPECIFICATION REFERENCE TABLE (PRD SECTION 10 MAPPING)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-5 w-5 text-[#C9A05C]" />
          <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
            Spesifikasi Pemetaan 15 Kolom Dataset ARJUNA-Net (PRD Seksi 10)
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
                <th className="py-2.5 px-3">Keterangan / Fungsi Penelitian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-[#C9A05C]/10 text-slate-600 dark:text-slate-300">
              <tr>
                <td className="py-2 px-3 font-mono">1</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Course_ID</td>
                <td className="py-2 px-3 font-mono">String</td>
                <td className="py-2 px-3 font-mono text-xs">Course.id / Course.code</td>
                <td className="py-2 px-3">Identifikator unik mata kuliah perkuliahan</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">2</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Lecturer_ID</td>
                <td className="py-2 px-3 font-mono">String</td>
                <td className="py-2 px-3 font-mono text-xs">Course.lecturer_id</td>
                <td className="py-2 px-3">Identitas dosen pengampu pembuat thread pertanyaan</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">3</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_ID</td>
                <td className="py-2 px-3 font-mono">String</td>
                <td className="py-2 px-3 font-mono text-xs">Enrollment.student_id</td>
                <td className="py-2 px-3">Identitas mahasiswa penjawab per baris dataset</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">4</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Lecturer_Question</td>
                <td className="py-2 px-3 font-mono">Text</td>
                <td className="py-2 px-3 font-mono text-xs">ThreadMessage.type = QUESTION</td>
                <td className="py-2 px-3">Teks pertanyaan dosen (stimulus pembelajaran)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">5</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_Answer</td>
                <td className="py-2 px-3 font-mono">Text</td>
                <td className="py-2 px-3 font-mono text-xs">ThreadMessage.type = ANSWER</td>
                <td className="py-2 px-3">Teks jawaban mahasiswa terhadap pertanyaan dosen</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">6</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Lecturer_Feedback</td>
                <td className="py-2 px-3 font-mono">Text</td>
                <td className="py-2 px-3 font-mono text-xs">ThreadMessage.type = FEEDBACK</td>
                <td className="py-2 px-3">Umpan balik evaluasi dari dosen untuk mahasiswa</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">7</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_Reaction</td>
                <td className="py-2 px-3 font-mono">Text</td>
                <td className="py-2 px-3 font-mono text-xs">ThreadMessage.type = REACTION</td>
                <td className="py-2 px-3">Tanggapan/reaksi mahasiswa setelah menerima feedback</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">8</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">Student_Opinion</td>
                <td className="py-2 px-3 font-mono">Text</td>
                <td className="py-2 px-3 font-mono text-xs">Opinion.author_role = STUDENT</td>
                <td className="py-2 px-3">Opini refleksi mandiri mahasiswa terkait materi topik</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">9-15</td>
                <td className="py-2 px-3 font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                  Q-A_Relevance, A-F_Relevance, Feedback_Novalty, Student_Sentiment, Student_Emotion, Lecturer_Emotion, Interaction_Quality
                </td>
                <td className="py-2 px-3 font-mono">Float / String</td>
                <td className="py-2 px-3 font-mono text-xs">DatasetLabel</td>
                <td className="py-2 px-3">
                  Skor relevansi semantik, sentimen, klasifikasi emosi, dan kualitas interaksi (diisi via modul anotasi atau API pipeline model NLP)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
    <div className="glass-panel relative overflow-hidden rounded-3xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#dbb779]">
            {title}
          </span>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-[#ebd09e]/80 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
}
