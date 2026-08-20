"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  courses as coursesApi,
  users as usersApi,
  type User,
} from "@/lib/api";
import {
  GraduationCap,
  Plus,
  Users,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function AdminCoursesPage() {
  const { user: currentUser } = useAuth();
  const [courseList, setCourseList] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    lecturerId: "",
    term: "2026/2027 Ganjil",
  });
  const [creating, setCreating] = useState(false);

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    lecturerId: "",
    term: "",
  });
  const [updating, setUpdating] = useState(false);

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Enroll state
  const [showEnroll, setShowEnroll] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  async function loadData() {
    setLoading(true);
    try {
      const [coursesData, lecturersData, studentsData] = await Promise.all([
        coursesApi.listAll(),
        usersApi.list({ role: "LECTURER" }),
        usersApi.list({ role: "STUDENT" }),
      ]);
      setCourseList(Array.isArray(coursesData) ? coursesData : []);
      setLecturers(lecturersData.data || []);
      setStudents(studentsData.data || []);
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memuat data kelas perkuliahan",
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle Create Course
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await coursesApi.create(createForm);
      setFeedback({
        type: "success",
        message: `Mata kuliah ${createForm.code} (${createForm.name}) berhasil dibuat.`,
      });
      setShowCreate(false);
      setCreateForm({
        code: "",
        name: "",
        lecturerId: "",
        term: "2026/2027 Ganjil",
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal membuat kelas baru",
      });
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setEditForm({
      code: course.code,
      name: course.name,
      lecturerId: course.lecturerId || course.lecturer?.id || "",
      term: course.term,
    });
    setShowEditModal(true);
  };

  // Handle Edit Course
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setUpdating(true);
    try {
      await coursesApi.update(editingCourse.id, editForm);
      setFeedback({
        type: "success",
        message: `Data kelas ${editForm.code} (${editForm.name}) berhasil diperbarui.`,
      });
      setShowEditModal(false);
      setEditingCourse(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui data kelas",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (course: any) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  // Handle Delete Course
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      await coursesApi.delete(courseToDelete.id);
      setFeedback({
        type: "success",
        message: `Kelas ${courseToDelete.code} (${courseToDelete.name}) berhasil dihapus.`,
      });
      setShowDeleteModal(false);
      setCourseToDelete(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal menghapus kelas perkuliahan",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle Enroll
  const handleEnroll = async () => {
    if (!showEnroll || selectedStudents.length === 0) return;
    setEnrolling(true);
    try {
      const res = await coursesApi.enroll(showEnroll, selectedStudents);
      setFeedback({
        type: "success",
        message: res.message || `${selectedStudents.length} mahasiswa berhasil didaftarkan ke kelas.`,
      });
      setShowEnroll(null);
      setSelectedStudents([]);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal mendaftarkan mahasiswa ke kelas",
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (!currentUser || currentUser.role !== "ADMIN") return null;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/10 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#dbb779] backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Manajemen Akademik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-white">
              Kelola Kelas Perkuliahan
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Buat kelas baru, tentukan dosen pengampu, atur periode perkuliahan, dan daftarkan mahasiswa.
            </p>
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-xl"
          >
            <Plus className="h-4 w-4 text-[#C9A05C]" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`animate-fade-in flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold backdrop-blur-md ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Create Course Form Modal/Card */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="glass-panel animate-fade-in relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl border-[#C9A05C]/40"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#0A3266] dark:text-white flex items-center gap-2.5">
              <Plus className="h-5 w-5 text-[#C9A05C]" />
              <span>Tambah Kelas Perkuliahan Baru</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Kode Mata Kuliah
              </label>
              <input
                value={createForm.code}
                onChange={(e) =>
                  setCreateForm({ ...createForm, code: e.target.value })
                }
                placeholder="Contoh: IF101"
                required
                className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nama Mata Kuliah
              </label>
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Contoh: Pemrograman Dasar"
                required
                className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Dosen Pengampu
              </label>
              <select
                value={createForm.lecturerId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, lecturerId: e.target.value })
                }
                required
                className="glass-input w-full rounded-2xl px-4 py-3 text-sm cursor-pointer"
              >
                <option value="" className="bg-[#FBF8F3] dark:bg-[#051329] text-slate-500">Pilih Dosen Pengampu</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id} className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">
                    {l.name} ({l.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Periode / Semester
              </label>
              <input
                value={createForm.term}
                onChange={(e) =>
                  setCreateForm({ ...createForm, term: e.target.value })
                }
                placeholder="Contoh: 2026/2027 Ganjil"
                required
                className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{creating ? "Menyimpan..." : "Simpan Kelas Baru"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Course Cards List */}
      {loading ? (
        <div className="glass-card-static flex flex-col items-center justify-center py-20 rounded-3xl gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat data kelas perkuliahan...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courseList.map((course) => (
            <div
              key={course.id}
              className="glass-panel relative overflow-hidden rounded-3xl p-6 transition-all duration-200"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center rounded-xl border border-[#0A3266]/25 dark:border-[#C9A05C]/40 bg-[#0A3266]/10 dark:bg-[#0A3266]/30 px-3 py-1 text-xs font-bold text-[#0A3266] dark:text-[#dbb779]">
                      {course.code}
                    </span>
                    <h3 className="text-lg font-bold text-[#0A3266] dark:text-white">{course.name}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <span>Dosen:</span>
                    <span className="text-[#0A3266] dark:text-[#dbb779] font-bold">{course.lecturer?.name || "Belum ditentukan"}</span>
                    <span>•</span>
                    <span>Semester:</span>
                    <span className="text-slate-700 dark:text-slate-200">{course.term}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#0A3266] dark:text-[#C9A05C]" />
                      <span>{course._count?.enrollments || 0} Mahasiswa Terdaftar</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-[#C9A05C]" />
                      <span>{course._count?.threads || 0} Topik Diskusi</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openEditModal(course)}
                    className="glass-button-secondary flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
                    title="Edit Data Kelas"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => openDeleteModal(course)}
                    className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-500/20"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>

                  <button
                    onClick={() =>
                      setShowEnroll(showEnroll === course.id ? null : course.id)
                    }
                    className="glass-button-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>Daftarkan Mahasiswa</span>
                  </button>
                </div>
              </div>

              {/* Interactive Enroll Panel */}
              {showEnroll === course.id && (
                <div className="animate-fade-in mt-6 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-5 backdrop-blur-md">
                  <p className="mb-3 text-xs font-bold text-[#0A3266] dark:text-slate-200">
                    Pilih mahasiswa yang akan didaftarkan ke kelas ini:
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                    {students.map((s) => {
                      const isSelected = selectedStudents.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setSelectedStudents((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== s.id)
                                : [...prev, s.id]
                            )
                          }
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-[#0A3266] dark:bg-[#C9A05C] text-white dark:text-[#051329] shadow-md shadow-[#0A3266]/20 font-semibold"
                              : "border border-black/10 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-[#C9A05C]/40"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                          <span>{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-3 border-t border-black/10 dark:border-white/[0.06] pt-3">
                    <button
                      type="button"
                      onClick={() => setShowEnroll(null)}
                      className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={selectedStudents.length === 0 || enrolling}
                      className="glass-button-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {enrolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Daftarkan ({selectedStudents.length}) Mahasiswa</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {courseList.length === 0 && (
            <div className="glass-panel rounded-3xl p-12 text-center">
              <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Belum ada kelas perkuliahan yang dibuat
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Edit Data Kelas */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-[#C9A05C]/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-white flex items-center gap-2.5">
                <Pencil className="h-5 w-5 text-[#C9A05C]" />
                <span>Edit Data Kelas Perkuliahan</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Kode Mata Kuliah
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) =>
                      setEditForm({ ...editForm, code: e.target.value })
                    }
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Nama Mata Kuliah
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Dosen Pengampu
                </label>
                <select
                  value={editForm.lecturerId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lecturerId: e.target.value })
                  }
                  required
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm cursor-pointer"
                >
                  <option value="" className="bg-[#FBF8F3] dark:bg-[#051329] text-slate-500">Pilih Dosen Pengampu</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">
                      {l.name} ({l.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Periode / Semester
                </label>
                <input
                  type="text"
                  required
                  value={editForm.term}
                  onChange={(e) =>
                    setEditForm({ ...editForm, term: e.target.value })
                  }
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-black/10 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{updating ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Kelas */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-red-500/40">
            <div className="mb-4 flex items-center gap-3 text-red-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">Hapus Kelas Perkuliahan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tindakan ini permanen</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus kelas{" "}
              <strong className="text-[#0A3266] dark:text-white font-bold">
                {courseToDelete.code} ({courseToDelete.name})
              </strong>
              ?
            </p>

            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-300 leading-relaxed">
              Seluruh thread diskusi, jawaban mahasiswa, catatan refleksi, dan data pendaftaran mahasiswa pada kelas ini akan dihapus secara permanen.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{deleting ? "Menghapus..." : "Ya, Hapus Kelas"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
