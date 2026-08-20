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
    term: "2026/2027-Ganjil",
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
        message: err.message || "Gagal memuat data kelas",
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
        message: `Kelas ${createForm.code} - ${createForm.name} berhasil dibuat.`,
      });
      setShowCreate(false);
      setCreateForm({
        code: "",
        name: "",
        lecturerId: "",
        term: "2026/2027-Ganjil",
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
        message: `Kelas ${editForm.code} - ${editForm.name} berhasil diperbarui.`,
      });
      setShowEditModal(false);
      setEditingCourse(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui kelas",
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
        message: `Kelas ${courseToDelete.code} - ${courseToDelete.name} berhasil dihapus.`,
      });
      setShowDeleteModal(false);
      setCourseToDelete(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal menghapus kelas",
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
        message: res.message || `${selectedStudents.length} mahasiswa berhasil di-enroll.`,
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
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manajemen Kelas</h1>
          <p className="mt-1 text-sm text-slate-400">
            Buat kelas perkuliahan, edit informasi, tentukan dosen pengampu, dan enroll mahasiswa
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Buat Kelas Baru
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`animate-fade-in mb-6 flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Create Course Form Modal/Card */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="animate-fade-in mb-8 rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" />
              Tambah Kelas Perkuliahan Baru
            </h3>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Kode Kelas
              </label>
              <input
                value={createForm.code}
                onChange={(e) =>
                  setCreateForm({ ...createForm, code: e.target.value })
                }
                placeholder="Contoh: IF101"
                required
                className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Nama Mata Kuliah
              </label>
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Contoh: Pemrograman Dasar"
                required
                className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Dosen Pengampu
              </label>
              <select
                value={createForm.lecturerId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, lecturerId: e.target.value })
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Pilih Dosen Pengampu</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Periode / Semester
              </label>
              <input
                value={createForm.term}
                onChange={(e) =>
                  setCreateForm({ ...createForm, term: e.target.value })
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? "Menyimpan..." : "Simpan Kelas"}
            </button>
          </div>
        </form>
      )}

      {/* Course Cards List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {courseList.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-800 bg-[#0e1726]/90 p-6 shadow-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
                      {course.code}
                    </span>
                    <h3 className="text-lg font-bold text-white">{course.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dosen: <span className="text-slate-200 font-medium">{course.lecturer?.name}</span> · Semester: {course.term}
                  </p>
                  <div className="mt-3 flex gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      {course._count?.enrollments || 0} Mahasiswa
                    </span>
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                      {course._count?.threads || 0} Thread Diskusi
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Edit Course Button */}
                  <button
                    onClick={() => openEditModal(course)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                    title="Edit Data Kelas"
                  >
                    <Pencil className="h-3.5 w-3.5 text-blue-400" />
                    Edit
                  </button>

                  {/* Delete Course Button */}
                  <button
                    onClick={() => openDeleteModal(course)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    Hapus
                  </button>

                  {/* Enroll Students Button */}
                  <button
                    onClick={() =>
                      setShowEnroll(showEnroll === course.id ? null : course.id)
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Enroll Mahasiswa
                  </button>
                </div>
              </div>

              {/* Interactive Enroll Panel */}
              {showEnroll === course.id && (
                <div className="animate-fade-in mt-5 rounded-xl border border-slate-800 bg-[#070c18] p-5">
                  <p className="mb-3 text-xs font-bold text-slate-300">
                    Pilih mahasiswa yang akan didaftarkan ke kelas ini:
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
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
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                              : "border border-slate-700/80 bg-slate-800/70 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEnroll(null)}
                      className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={selectedStudents.length === 0 || enrolling}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-40"
                    >
                      {enrolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Daftarkan ({selectedStudents.length}) Mahasiswa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {courseList.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/60 p-12 text-center">
              <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">
                Belum ada kelas perkuliahan yang dibuat
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Edit Data Kelas */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-400" />
                Edit Kelas Perkuliahan
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Kode Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) =>
                      setEditForm({ ...editForm, code: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Nama Mata Kuliah
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Dosen Pengampu
                </label>
                <select
                  value={editForm.lecturerId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lecturerId: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Pilih Dosen Pengampu</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Periode / Semester
                </label>
                <input
                  type="text"
                  required
                  value={editForm.term}
                  onChange={(e) =>
                    setEditForm({ ...editForm, term: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {updating ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Kelas */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Kelas Perkuliahan</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus kelas{" "}
              <strong className="text-white font-semibold">
                {courseToDelete.code} - {courseToDelete.name}
              </strong>
              ?
            </p>

            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 leading-relaxed">
              Semua data thread diskusi, pesan balasan, opini, serta data enrollment mahasiswa yang terdaftar di kelas ini akan dihapus secara permanen.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? "Menghapus..." : "Ya, Hapus Kelas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
