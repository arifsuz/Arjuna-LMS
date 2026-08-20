"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { users as usersApi, type User } from "@/lib/api";
import {
  Users,
  Upload,
  Search,
  Key,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, search]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const data = await usersApi.list(params);
      setUserList(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await usersApi.bulkImport(file);
      setImportResult(result);
      loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Masukkan password baru (min 6 karakter):");
    if (!newPassword || newPassword.length < 6) return;
    try {
      await usersApi.resetPassword(userId, newPassword);
      alert("Password berhasil direset!");
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  const roleBadge = (role: string) => {
    const config: Record<string, { label: string; style: string }> = {
      ADMIN: {
        label: "Administrator",
        style: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      },
      LECTURER: {
        label: "Dosen",
        style: "bg-teal-500/15 text-teal-400 border-teal-500/30",
      },
      STUDENT: {
        label: "Mahasiswa",
        style: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      },
    };
    const c = config[role] || config.STUDENT;
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${c.style}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola akun Dosen, Mahasiswa, dan import data massal via CSV
          </p>
        </div>
        <button
          onClick={() => setShowImport(!showImport)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 active:scale-95"
        >
          <Upload className="h-4 w-4" />
          Bulk Import CSV
        </button>
      </div>

      {/* CSV Import Panel */}
      {showImport && (
        <div className="animate-fade-in mb-8 rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Bulk Import Pengguna dari CSV</h3>
            <button
              onClick={() => setShowImport(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-slate-400">
            Format CSV: <code className="rounded bg-slate-800 px-1.5 py-0.5 text-blue-400 font-mono">name,email,password,role</code>
            <br />
            Nilai kolom <code className="text-slate-300">role</code>: <span className="text-teal-400">LECTURER</span> atau <span className="text-blue-400">STUDENT</span>
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            disabled={importing}
            className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-500"
          />
          {importing && (
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sedang mengimpor data user...
            </div>
          )}
          {importResult && (
            <div className="mt-4 rounded-xl border border-slate-700/80 bg-[#070c18] p-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{importResult.created} user baru berhasil dibuat</span>
              </div>
              {importResult.skipped > 0 && (
                <div className="mt-1.5 text-amber-400">
                  {importResult.skipped} user dilewati (email sudah terdaftar)
                </div>
              )}
              {importResult.errors?.length > 0 && (
                <div className="mt-1.5 text-red-400">
                  <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
                  {importResult.errors.length} baris gagal diproses
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama atau email..."
            className="w-full rounded-xl border border-slate-800 bg-[#0e1726] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-[#0e1726] px-4 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Semua Role</option>
          <option value="LECTURER">Dosen</option>
          <option value="STUDENT">Mahasiswa</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      {/* User Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e1726]/90 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">Email Pengguna</th>
                  <th className="px-6 py-3.5">Peran / Role</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {userList.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-semibold text-slate-100">{u.name}</td>
                    <td className="px-6 py-4 text-slate-400">{u.email}</td>
                    <td className="px-6 py-4">{roleBadge(u.role)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                      >
                        <Key className="h-3.5 w-3.5" />
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
                {userList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-500">
                      Tidak ada pengguna ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
