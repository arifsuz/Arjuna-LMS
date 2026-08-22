"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  courses as coursesApi,
  users as usersApi,
  type User,
} from "@/lib/api";
import { ConfirmationModal } from "@/components/confirmation-modal";
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
  Search,
  UserMinus,
  Check,
  Calendar,
  Mail,
  ChevronDown,
  ChevronUp,
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

  // Delete Modal state (Custom Confirmation Modal)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Unenroll Modal state (Custom Confirmation Modal)
  const [unenrollState, setUnenrollState] = useState<{
    course: any;
    student: any;
  } | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);

  // Enroll state
  const [showEnrollCourseId, setShowEnrollCourseId] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  // Collapsed states for student lists per course
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

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
      const list = Array.isArray(coursesData) ? coursesData : [];
      setCourseList(list);
      setLecturers(lecturersData.data || []);
      setStudents(studentsData.data || []);

      // Auto-expand all courses by default
      const exp: Record<string, boolean> = {};
      list.forEach((c) => {
        exp[c.id] = true;
      });
      setExpandedCourses(exp);
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

  // Handle Unenroll Student
  const handleUnenrollConfirm = async () => {
    if (!unenrollState) return;
    setUnenrolling(true);
    try {
      await coursesApi.unenroll(unenrollState.course.id, unenrollState.student.id);
      setFeedback({
        type: "success",
        message: `Mahasiswa ${unenrollState.student.name} berhasil dikeluarkan dari kelas ${unenrollState.course.code}.`,
      });
      setUnenrollState(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal mengeluarkan mahasiswa dari kelas",
      });
    } finally {
      setUnenrolling(false);
    }
  };

  // Handle Enroll
  const handleEnroll = async () => {
    if (!showEnrollCourseId || selectedStudents.length === 0) return;
    setEnrolling(true);
    try {
      const res = await coursesApi.enroll(showEnrollCourseId, selectedStudents);
      setFeedback({
        type: "success",
        message: res.message || `${selectedStudents.length} mahasiswa berhasil didaftarkan ke kelas.`,
      });
      setShowEnrollCourseId(null);
      setSelectedStudents([]);
      setStudentSearchQuery("");
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

  const toggleExpand = (courseId: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
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
              <span>Manajemen Akademik & Kelas Perkuliahan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-white">
              Kelola Kelas & Pendaftaran Mahasiswa
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Atur kelas perkuliahan, tentukan dosen pengampu, pantau daftar mahasiswa terdaftar, dan kelola pendaftaran mahasiswa dengan mudah.
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
                <option value="" className="bg-[#FBF8F3] dark:bg-[#051329] text-slate-500">
                  Pilih Dosen Pengampu
                </option>
                {lecturers.map((l) => (
                  <option
                    key={l.id}
                    value={l.id}
                    className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white"
                  >
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
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Memuat data kelas perkuliahan & daftar mahasiswa...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {courseList.map((course) => {
            const enrolledStudents = (course.enrollments || []).map(
              (e: any) => e.student || { id: e.studentId, name: "Mahasiswa", email: "-" }
            );
            const isExpanded = expandedCourses[course.id] ?? true;

            // Filter available students for enrollment modal (students not yet enrolled)
            const enrolledStudentIds = new Set(enrolledStudents.map((s: any) => s.id));
            const availableStudents = students.filter(
              (s) => !enrolledStudentIds.has(s.id)
            );
            const filteredAvailableStudents = availableStudents.filter(
              (s) =>
                s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
            );

            return (
              <div
                key={course.id}
                className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-xl border border-black/10 dark:border-[#C9A05C]/30 transition-all duration-200"
              >
                {/* Course Header & Primary Actions */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-black/10 dark:border-white/[0.08] pb-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center rounded-xl border border-[#0A3266]/25 dark:border-[#C9A05C]/40 bg-[#0A3266]/10 dark:bg-[#0A3266]/30 px-3 py-1 text-xs font-bold text-[#0A3266] dark:text-[#dbb779]">
                        {course.code}
                      </span>
                      <h3 className="text-xl font-extrabold text-[#0A3266] dark:text-white">
                        {course.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Dosen Pengampu:</span>
                        <span className="text-[#0A3266] dark:text-[#dbb779] font-bold">
                          {course.lecturer?.name || "Belum ditentukan"}
                        </span>
                        {course.lecturer?.email && (
                          <span className="text-slate-400 text-[11px]">
                            ({course.lecturer.email})
                          </span>
                        )}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#C9A05C]" />
                        <span>{course.term}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 font-semibold text-[#0A3266] dark:text-[#FBF8F3]">
                        <Users className="h-4 w-4 text-[#C9A05C]" />
                        <span>{enrolledStudents.length} Mahasiswa Terdaftar</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        <span>{course._count?.threads || 0} Topik Forum</span>
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
                      <span>Edit Kelas</span>
                    </button>

                    <button
                      onClick={() => openDeleteModal(course)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-500/20 transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>

                    <button
                      onClick={() => {
                        if (showEnrollCourseId === course.id) {
                          setShowEnrollCourseId(null);
                        } else {
                          setShowEnrollCourseId(course.id);
                          setSelectedStudents([]);
                          setStudentSearchQuery("");
                        }
                      }}
                      className="glass-button-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-[#C9A05C]" />
                      <span>+ Daftarkan Mahasiswa</span>
                    </button>
                  </div>
                </div>

                {/* Enrolled Students Section */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#C9A05C]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#ebd09e]">
                        Daftar Mahasiswa yang Terdaftar di Kelas Ini ({enrolledStudents.length})
                      </h4>
                    </div>
                    {enrolledStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(course.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0A3266] dark:hover:text-white"
                      >
                        <span>{isExpanded ? "Sembunyikan" : "Tampilkan"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {enrolledStudents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] p-6 text-center">
                      <Users className="mx-auto h-8 w-8 text-slate-400 mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Belum ada mahasiswa yang didaftarkan pada kelas ini.
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Klik tombol <strong>"+ Daftarkan Mahasiswa"</strong> di atas untuk menambahkan peserta kelas.
                      </p>
                    </div>
                  ) : isExpanded ? (
                    <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[#0A3266] dark:text-[#FBF8F3] font-bold">
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3">Nama Mahasiswa</th>
                            <th className="py-2.5 px-3">Email Pengguna</th>
                            <th className="py-2.5 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/[0.05]">
                          {enrolledStudents.map((student: any, idx: number) => (
                            <tr
                              key={student.id || idx}
                              className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] font-bold text-xs border border-[#C9A05C]/30">
                                    {student.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {student.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  <span>{student.email}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setUnenrollState({
                                      course,
                                      student,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-300 hover:bg-red-500/20 transition-all active:scale-95"
                                  title={`Keluarkan ${student.name} dari kelas ${course.code}`}
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                  <span>Keluarkan</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>

                {/* Interactive Enroll Drawer / Panel */}
                {showEnrollCourseId === course.id && (
                  <div className="animate-fade-in mt-6 rounded-3xl border border-[#C9A05C]/40 bg-black/[0.03] dark:bg-[#061733]/70 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#0A3266] dark:text-white flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-[#C9A05C]" />
                          <span>Pendaftaran Mahasiswa Baru ke Kelas {course.code}</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Tersedia {availableStudents.length} mahasiswa yang belum terdaftar di kelas ini.
                        </p>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder="Cari nama atau email..."
                          className="glass-input w-full rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder-slate-400"
                        />
                      </div>
                    </div>

                    {availableStudents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-6 text-center text-xs text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="mx-auto h-6 w-6 mb-1 text-emerald-500" />
                        Semua mahasiswa terdaftar di sistem telah didaftarkan ke kelas ini.
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Pilih Mahasiswa:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = filteredAvailableStudents.map((s) => s.id);
                              if (selectedStudents.length === allIds.length) {
                                setSelectedStudents([]);
                              } else {
                                setSelectedStudents(allIds);
                              }
                            }}
                            className="text-[11px] font-bold text-[#C9A05C] hover:underline"
                          >
                            {selectedStudents.length === filteredAvailableStudents.length &&
                            filteredAvailableStudents.length > 0
                              ? "Batalkan Pilihan Semua"
                              : "Pilih Semua Mahasiswa"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar mb-4">
                          {filteredAvailableStudents.map((s) => {
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
                                className={`flex items-center justify-between gap-2 rounded-2xl p-2.5 text-left text-xs transition-all ${
                                  isSelected
                                    ? "bg-[#0A3266] dark:bg-[#C9A05C] text-white dark:text-[#04132b] shadow-md shadow-[#0A3266]/20 font-semibold border border-black/10 dark:border-white/20"
                                    : "border border-black/10 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 hover:border-[#C9A05C]/50 hover:bg-black/10 dark:hover:bg-white/[0.06]"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-bold">{s.name}</div>
                                  <div
                                    className={`truncate text-[10px] ${
                                      isSelected
                                        ? "text-blue-100 dark:text-slate-800"
                                        : "text-slate-400 dark:text-slate-400"
                                    }`}
                                  >
                                    {s.email}
                                  </div>
                                </div>
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border ${
                                    isSelected
                                      ? "bg-white dark:bg-[#04132b] text-[#0A3266] dark:text-[#C9A05C] border-transparent"
                                      : "border-slate-300 dark:border-slate-600 bg-transparent"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 dark:border-white/[0.08] pt-4">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {selectedStudents.length} mahasiswa terpilih
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEnrollCourseId(null);
                            setSelectedStudents([]);
                          }}
                          className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
                        >
                          Tutup
                        </button>
                        <button
                          type="button"
                          onClick={handleEnroll}
                          disabled={selectedStudents.length === 0 || enrolling}
                          className="glass-button-primary flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white disabled:opacity-40 shadow-lg"
                        >
                          {enrolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          <span>Daftarkan ({selectedStudents.length}) Mahasiswa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {courseList.length === 0 && (
            <div className="glass-panel rounded-3xl p-12 text-center">
              <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Belum ada kelas perkuliahan yang dibuat
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Silakan klik tombol "Tambah Kelas Baru" untuk memulai.
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
                  <option value="" className="bg-[#FBF8F3] dark:bg-[#051329] text-slate-500">
                    Pilih Dosen Pengampu
                  </option>
                  {lecturers.map((l) => (
                    <option
                      key={l.id}
                      value={l.id}
                      className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white"
                    >
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

      {/* Confirmation Modal: Hapus Kelas */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kelas Perkuliahan"
        description={`Apakah Anda yakin ingin menghapus kelas ${courseToDelete?.code} (${courseToDelete?.name})?`}
        confirmText="Ya, Hapus Kelas"
        cancelText="Batal"
        variant="danger"
        loading={deleting}
      >
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-300 leading-relaxed">
          Seluruh thread diskusi, jawaban mahasiswa, catatan refleksi, dan data pendaftaran mahasiswa pada kelas ini akan dihapus secara permanen.
        </div>
      </ConfirmationModal>

      {/* Confirmation Modal: Keluarkan Mahasiswa (Unenroll) */}
      <ConfirmationModal
        isOpen={!!unenrollState}
        onClose={() => setUnenrollState(null)}
        onConfirm={handleUnenrollConfirm}
        title="Keluarkan Mahasiswa dari Kelas"
        description={`Apakah Anda yakin ingin mengeluarkan ${unenrollState?.student?.name} (${unenrollState?.student?.email}) dari kelas ${unenrollState?.course?.code} - ${unenrollState?.course?.name}?`}
        confirmText="Ya, Keluarkan Mahasiswa"
        cancelText="Batal"
        variant="danger"
        loading={unenrolling}
      >
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          Mahasiswa yang dikeluarkan tidak akan lagi memiliki akses ke materi perkuliahan, kuis, tugas, dan forum diskusi di kelas ini.
        </div>
      </ConfirmationModal>
    </div>
  );
}
