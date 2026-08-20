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
  X,
} from "lucide-react";

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [term, setTerm] = useState("2026/2027-Ganjil");

  // Enroll state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await coursesApi.create({ code, name, lecturerId, term });
      setShowCreate(false);
      setCode("");
      setName("");
      setLecturerId("");
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleEnroll = async () => {
    if (!showEnroll || selectedStudents.length === 0) return;
    try {
      await coursesApi.enroll(showEnroll, selectedStudents);
      setShowEnroll(null);
      setSelectedStudents([]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manajemen Kelas</h1>
          <p className="mt-1 text-sm text-slate-400">
            Buat kelas perkuliahan, tentukan dosen pengampu, dan enroll mahasiswa
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

      {/* Create Course Form Modal/Card */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="animate-fade-in mb-8 rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Tambah Kelas Perkuliahan Baru</h3>
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
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={lecturerId}
                onChange={(e) => setLecturerId(e.target.value)}
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
                value={term}
                onChange={(e) => setTerm(e.target.value)}
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
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
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
                      disabled={selectedStudents.length === 0}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-40"
                    >
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
    </div>
  );
}
