"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { courses as coursesApi, type Course } from "@/lib/api";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await coursesApi.myCourses();
        setCourseList(Array.isArray(data) ? data : []);
      } catch {
        // Ignore if not yet set up
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Selamat datang, <span className="text-blue-400">{user.name}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {isAdmin
            ? "Panel administrasi & monitoring penelitian ARJUNA-Net"
            : user.role === "LECTURER"
              ? "Kelola diskusi kelas dan interaksi jawaban mahasiswa"
              : "Lihat dan jawab pertanyaan dosen di kelas Anda"}
        </p>
      </div>

      {/* Stats Cards for Admin */}
      {isAdmin && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminStatCard
            label="Total Kelas"
            value={courseList.length}
            icon={GraduationCap}
            color="text-blue-400"
            bg="bg-blue-500/10 border-blue-500/20"
          />
          <AdminStatCard
            label="Total Thread Diskusi"
            value={courseList.reduce((sum, c) => sum + (c._count?.threads || 0), 0)}
            icon={MessageSquare}
            color="text-teal-400"
            bg="bg-teal-500/10 border-teal-500/20"
          />
          <AdminStatCard
            label="Total Enrollment Mahasiswa"
            value={courseList.reduce(
              (sum, c) => sum + (c._count?.enrollments || 0),
              0
            )}
            icon={Users}
            color="text-amber-400"
            bg="bg-amber-500/10 border-amber-500/20"
          />
        </div>
      )}

      {/* Course section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">
          {isAdmin ? "Semua Kelas Terdaftar" : "Kelas Anda"}
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      ) : courseList.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/60 p-12 text-center backdrop-blur-sm">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">
            Belum ada kelas yang tersedia
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courseList.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="group relative rounded-2xl border border-slate-800/90 bg-[#0e1726]/80 p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-[#0e1726] hover:shadow-blue-500/5"
            >
              <div className="mb-3.5 flex items-start justify-between">
                <span className="rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
                  {course.code}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-blue-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                {course.name}
              </h3>
              <p className="mb-4 text-xs text-slate-400">
                {course.lecturer?.name} · {course.term}
              </p>
              <div className="flex gap-4 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  {course._count?.enrollments || 0} siswa
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                  {course._count?.threads || 0} thread
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminStatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0e1726]/80 p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${bg}`}>
          <Icon className={`h-4.5 w-4.5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-white">{value}</p>
    </div>
  );
}
