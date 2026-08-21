"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  academic as academicApi,
  courses as coursesApi,
  type Course,
} from "@/lib/api";
import {
  Bell,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Radio,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  Users,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";

export default function AdminAnnouncementsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "NORMAL",
    courseId: "",
    isPinned: false,
  });

  // Toast Feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [annData, crsData] = await Promise.all([
        academicApi.getGeneralAnnouncements(),
        coursesApi.listAll(),
      ]);
      setAnnouncements(Array.isArray(annData) ? annData : []);
      setCoursesList(Array.isArray(crsData) ? crsData : []);
    } catch {
      showNotification("error", "Gagal memuat daftar pengumuman.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadData();
    }
  }, [user?.role]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      priority: "NORMAL",
      courseId: "",
      isPinned: false,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (ann: any) => {
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      content: ann.content,
      priority: ann.priority || "NORMAL",
      courseId: ann.courseId || "",
      isPinned: ann.isPinned || false,
    });
    setShowModal(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showNotification("error", "Judul dan isi pengumuman wajib diisi!");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await academicApi.updateAnnouncement(editingId, {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          isPinned: formData.isPinned,
        });
        showNotification("success", "Pengumuman berhasil diperbarui.");
      } else {
        await academicApi.createAnnouncement(
          formData.courseId || undefined,
          {
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            isPinned: formData.isPinned,
          }
        );
        showNotification("success", "Broadcast pengumuman berhasil diterbitkan!");
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Gagal menyimpan pengumuman.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (ann: any) => {
    try {
      await academicApi.updateAnnouncement(ann.id, {
        isPinned: !ann.isPinned,
      });
      showNotification(
        "success",
        ann.isPinned
          ? "Pengumuman dilepas dari sematan teratas."
          : "Pengumuman disematkan ke posisi teratas!"
      );
      loadData();
    } catch {
      showNotification("error", "Gagal mengubah status sematan.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;
    try {
      await academicApi.deleteAnnouncement(id);
      showNotification("success", "Pengumuman berhasil dihapus.");
      loadData();
    } catch {
      showNotification("error", "Gagal menghapus pengumuman.");
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  // Filter announcements
  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch =
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === "ALL" || ann.priority === priorityFilter;
    const matchesCourse =
      !selectedCourseFilter ||
      (selectedCourseFilter === "GLOBAL" && !ann.courseId) ||
      ann.courseId === selectedCourseFilter;
    return matchesSearch && matchesPriority && matchesCourse;
  });

  const totalPinned = announcements.filter((a) => a.isPinned).length;
  const totalUrgent = announcements.filter((a) => a.priority === "URGENT").length;
  const totalGlobal = announcements.filter((a) => !a.courseId).length;

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
              <Megaphone className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Pusat Informasi Sivitas Akademika</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
              Kelola Pengumuman & Broadcast Notifikasi
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-[#ebd09e]/80 max-w-3xl leading-relaxed">
              Kirim broadcast pengumuman resmi ke seluruh dosen dan mahasiswa kampus, atau tujukan ke kelas mata kuliah spesifik dengan penanda prioritas penting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="glass-button-secondary flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold"
            >
              <RefreshCw className={`h-4 w-4 text-[#C9A05C] ${loading ? "animate-spin" : ""}`} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Terbitkan Pengumuman Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 2. Metric Stat Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-[#0A3266] dark:border-l-[#C9A05C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Pengumuman</span>
            <Bell className="h-4 w-4 text-[#0A3266] dark:text-[#C9A05C]" />
          </div>
          <div className="text-2xl font-black text-[#0A3266] dark:text-white mt-1">
            {announcements.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Seluruh arsip berita</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Broadcast Kampus (Global)</span>
            <Radio className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {totalGlobal}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Diterima seluruh sivitas</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pengumuman Disematkan</span>
            <Pin className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {totalPinned}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tampil di urutan teratas</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Prioritas Penting (Urgent)</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {totalUrgent}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Notifikasi berbendera merah</div>
        </div>
      </div>

      {/* ═══ 3. Search & Filter Bar ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul atau isi pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs font-medium focus:outline-none w-full text-[#0A3266] dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#C9A05C]" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="NORMAL">Prioritas Normal</option>
              <option value="URGENT">Prioritas Penting (Urgent)</option>
            </select>
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer max-w-[200px]"
          >
            <option value="">Semua Target Penerima</option>
            <option value="GLOBAL">Broadcast Seluruh Kampus</option>
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══ 4. Announcement Cards List ═══ */}
      {loading ? (
        <div className="glass-card-static flex flex-col items-center justify-center py-20 rounded-3xl gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#C9A05C]" />
          <p className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">
            Memuat pengumuman kampus...
          </p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/[0.06] text-slate-400 border border-black/10 dark:border-[#C9A05C]/20">
            <Megaphone className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
            Tidak Ada Pengumuman Ditemukan
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#ebd09e]/70 max-w-md mx-auto">
            Klik tombol &ldquo;Terbitkan Pengumuman Baru&rdquo; untuk mengirimkan broadcast pengumuman pertama Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isUrgent = ann.priority === "URGENT";
            const isGlobal = !ann.courseId;

            return (
              <div
                key={ann.id}
                className={`glass-card rounded-3xl p-6 transition-all border-l-4 ${
                  ann.isPinned
                    ? "border-l-amber-500 bg-[#C9A05C]/[0.04] dark:bg-[#C9A05C]/[0.08]"
                    : isUrgent
                      ? "border-l-rose-500"
                      : "border-l-blue-500"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/40">
                          <Pin className="h-3 w-3" />
                          <span>Disematkan</span>
                        </span>
                      )}

                      {isUrgent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 border border-rose-500/40">
                          <AlertTriangle className="h-3 w-3" />
                          <span>PENTING & SEGERA</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
                          <span>Informasi Umum</span>
                        </span>
                      )}

                      {isGlobal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A05C]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8c6828] dark:text-[#ebd09e] border border-[#C9A05C]/40">
                          <Radio className="h-3 w-3" />
                          <span>Broadcast Seluruh Sivitas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <GraduationCap className="h-3 w-3" />
                          <span>Kelas: {ann.course?.code || "Khusus"}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#0A3266] dark:text-white">
                      {ann.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {ann.content}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>Diterbitkan oleh: <strong className="text-slate-600 dark:text-slate-300">{ann.author?.name || "Admin"}</strong> ({ann.author?.role || "ADMIN"})</span>
                      <span>•</span>
                      <span>
                        {new Date(ann.createdAt).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePin(ann)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all border ${
                        ann.isPinned
                          ? "bg-amber-500 text-white border-amber-500 shadow-md"
                          : "border-black/10 dark:border-white/10 hover:bg-black/5 text-slate-400 hover:text-amber-500"
                      }`}
                      title={ann.isPinned ? "Lepas Sematan" : "Sematkan ke Teratas"}
                    >
                      {ann.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(ann)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 text-slate-400 hover:text-[#0A3266] dark:hover:text-[#C9A05C] transition-colors"
                      title="Edit Pengumuman"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 transition-colors"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ 5. Create / Edit Modal ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A05C]/40 space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e]">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                    {editingId ? "Edit Pengumuman" : "Terbitkan Broadcast Pengumuman"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Informasi akan disiarkan ke sivitas kampus
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Ujian Tengah Semester (UTS) 2026/2027"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Pengumuman Lengkap *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tuliskan isi pengumuman atau instruksi akademik secara detail..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="glass-input w-full rounded-xl p-3.5 text-xs font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioritas Pengumuman
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <option value="NORMAL">Normal (Informasi Rutin)</option>
                    <option value="URGENT">Penting & Mendesak (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Penerima
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    disabled={!!editingId}
                    className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Broadcast Seluruh Kampus</option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#C9A05C]"
                />
                <label htmlFor="isPinned" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Sematkan pengumuman ini di posisi teratas (Pin to top)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="glass-button-primary rounded-xl px-5 py-2.5 text-xs font-extrabold shadow-lg"
                >
                  {submitting ? "Menerbitkan..." : editingId ? "Simpan Perubahan" : "Terbitkan Pengumuman"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
