"use client";

import { useEffect, useState, useMemo } from "react";
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
  UserPlus,
  Pencil,
  Trash2,
  ShieldAlert,
  CheckSquare,
  Square,
  MinusSquare,
  Shield,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [counts, setCounts] = useState<{
    all: number;
    LECTURER: number;
    STUDENT: number;
    ADMIN: number;
  }>({
    all: 0,
    LECTURER: 0,
    STUDENT: 0,
    ADMIN: 0,
  });

  // Multi-selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Bulk Import state
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Notification state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create User Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [creating, setCreating] = useState(false);

  // Edit User Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "STUDENT",
    password: "",
  });
  const [updating, setUpdating] = useState(false);

  // Delete User Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Actions Modals state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>("STUDENT");
  const [bulkRoleUpdating, setBulkRoleUpdating] = useState(false);

  const [showBulkPasswordModal, setShowBulkPasswordModal] = useState(false);
  const [bulkNewPassword, setBulkNewPassword] = useState("");
  const [bulkPasswordUpdating, setBulkPasswordUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, search, page, limit]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await usersApi.list(params);
      setUserList(res.data || []);
      if (res.meta) setMeta(res.meta);
      if (res.counts) setCounts(res.counts);
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memuat data pengguna",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleRoleTabChange = (role: string) => {
    setRoleFilter(role);
    setPage(1);
    setSelectedUserIds([]);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    setSelectedUserIds([]);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setSelectedUserIds([]);
  };

  const isAllSelected = useMemo(() => {
    if (userList.length === 0) return false;
    return userList.every((u) => selectedUserIds.includes(u.id));
  }, [userList, selectedUserIds]);

  const isSomeSelected = useMemo(() => {
    return (
      selectedUserIds.length > 0 &&
      !isAllSelected &&
      userList.some((u) => selectedUserIds.includes(u.id))
    );
  }, [userList, selectedUserIds, isAllSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(userList.map((u) => u.id));
    }
  };

  const handleToggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await usersApi.bulkImport(file);
      setImportResult(result);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal mengimpor berkas CSV",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await usersApi.create(createForm);
      setFeedback({
        type: "success",
        message: `Pengguna ${createForm.name} (${createForm.email}) berhasil ditambahkan.`,
      });
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
      });
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal menambahkan pengguna baru",
      });
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      password: "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      const payload: Record<string, any> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password.trim() !== "") {
        payload.password = editForm.password;
      }

      await usersApi.update(editingUser.id, payload);
      setFeedback({
        type: "success",
        message: `Data pengguna ${editForm.name} berhasil diperbarui.`,
      });
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui data pengguna",
      });
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteModal = (u: User) => {
    setUserToDelete(u);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await usersApi.delete(userToDelete.id);
      setFeedback({
        type: "success",
        message: `Akun pengguna ${userToDelete.name} (${userToDelete.email}) berhasil dihapus.`,
      });
      setShowDeleteModal(false);
      setUserToDelete(null);
      setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal menghapus pengguna",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await usersApi.bulkDelete(selectedUserIds);
      let msg = res.message || `${res.count || selectedUserIds.length} akun pengguna berhasil dihapus.`;
      if (res.skippedSelf) {
        msg += " Akun Anda sendiri dilewati demi keamanan.";
      }
      setFeedback({
        type: "success",
        message: msg,
      });
      setShowBulkDeleteModal(false);
      setSelectedUserIds([]);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal melakukan penghapusan massal",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    setBulkRoleUpdating(true);
    try {
      const res = await usersApi.bulkUpdateRole(selectedUserIds, bulkRole);
      setFeedback({
        type: "success",
        message: res.message || `Peran untuk ${selectedUserIds.length} pengguna berhasil diperbarui ke ${bulkRole}.`,
      });
      setShowBulkRoleModal(false);
      setSelectedUserIds([]);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui peran pengguna",
      });
    } finally {
      setBulkRoleUpdating(false);
    }
  };

  const handleBulkPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0 || bulkNewPassword.length < 6) return;
    setBulkPasswordUpdating(true);
    try {
      const res = await usersApi.bulkResetPassword(selectedUserIds, bulkNewPassword);
      setFeedback({
        type: "success",
        message: res.message || `Kata sandi berhasil direset untuk ${selectedUserIds.length} pengguna.`,
      });
      setShowBulkPasswordModal(false);
      setBulkNewPassword("");
      setSelectedUserIds([]);
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal mereset kata sandi secara massal",
      });
    } finally {
      setBulkPasswordUpdating(false);
    }
  };

  if (!currentUser || currentUser.role !== "ADMIN") return null;

  const roleBadge = (role: string) => {
    const config: Record<string, { label: string; style: string }> = {
      ADMIN: {
        label: "Administrator",
        style: "bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#dbb779] border-[#C9A05C]/40",
      },
      LECTURER: {
        label: "Dosen Pengampu",
        style: "bg-[#0A3266]/15 text-[#0A3266] dark:text-[#8bb8f0] border-[#0A3266]/40",
      },
      STUDENT: {
        label: "Mahasiswa",
        style: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
      },
    };
    const c = config[role] || config.STUDENT;
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${c.style}`}>
        {c.label}
      </span>
    );
  };

  const roleTabs = [
    {
      id: "",
      label: "Semua Pengguna",
      icon: Users,
      count: counts.all,
      color: "text-[#0A3266] dark:text-[#8bb8f0]",
    },
    {
      id: "LECTURER",
      label: "Dosen",
      icon: GraduationCap,
      count: counts.LECTURER,
      color: "text-[#0A3266] dark:text-[#8bb8f0]",
    },
    {
      id: "STUDENT",
      label: "Mahasiswa",
      icon: BookOpen,
      count: counts.STUDENT,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "ADMIN",
      label: "Administrator",
      icon: Shield,
      count: counts.ADMIN,
      color: "text-[#8c6828] dark:text-[#C9A05C]",
    },
  ];

  const startItem = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, meta.total);

  return (
    <div className="space-y-8 relative pb-20">
      {/* Header Banner */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A05C]/40 bg-[#C9A05C]/10 px-3 py-1 text-xs font-semibold text-[#8c6828] dark:text-[#dbb779] backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Manajemen Akun Sivitas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-white">
              Kelola Data Pengguna
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Kelola akses dosen, mahasiswa, dan administrator dengan filter terstruktur dan aksi massal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="glass-button-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-xl"
            >
              <UserPlus className="h-4 w-4 text-[#C9A05C]" />
              <span>Tambah Pengguna</span>
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="glass-button-secondary flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold"
            >
              <Upload className="h-4 w-4 text-[#C9A05C]" />
              <span>Impor Massal CSV</span>
            </button>
          </div>
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

      {/* Role Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {roleTabs.map((tab) => {
          const isActive = roleFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleRoleTabChange(tab.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#0A3266]/15 via-[#0A3266]/10 to-[#C9A05C]/15 dark:from-[#0A3266]/40 dark:via-[#124687]/30 dark:to-[#C9A05C]/20 text-[#0A3266] dark:text-white border border-[#C9A05C]/50 shadow-md"
                  : "border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/[0.07] hover:text-[#0A3266] dark:hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#C9A05C]" : tab.color}`} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  isActive
                    ? "bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#dbb779] border border-[#C9A05C]/40"
                    : "bg-black/5 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* CSV Bulk Import Card */}
      {showImport && (
        <div className="glass-panel animate-fade-in relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl border-[#C9A05C]/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0A3266] dark:text-white flex items-center gap-2">
              <Upload className="h-4.5 w-4.5 text-[#C9A05C]" />
              <span>Impor Data Pengguna dari Berkas CSV</span>
            </h3>
            <button
              onClick={() => setShowImport(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Format kolom CSV: <code className="rounded-md bg-black/5 dark:bg-white/[0.08] px-2 py-1 text-[#0A3266] dark:text-[#dbb779] font-mono">name,email,password,role</code>
            <br />
            Pilihan peran: <span className="text-[#0A3266] dark:text-[#8bb8f0] font-bold">LECTURER</span> (Dosen) atau <span className="text-blue-600 dark:text-blue-300 font-bold">STUDENT</span> (Mahasiswa).
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            disabled={importing}
            className="block w-full text-xs text-slate-700 dark:text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-[#0A3266] dark:file:bg-[#C9A05C] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white dark:file:text-[#051329] hover:file:opacity-90 cursor-pointer"
          />
          {importing && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#C9A05C]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sedang memproses data pengguna...</span>
            </div>
          )}
          {importResult && (
            <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] p-4 text-xs backdrop-blur-md">
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{importResult.created} pengguna baru berhasil didaftarkan</span>
              </div>
              {importResult.skipped > 0 && (
                <div className="mt-1.5 text-amber-600 dark:text-amber-300 font-medium">
                  {importResult.skipped} pengguna dilewati karena email sudah terdaftar sebelumnya
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search and Page Size Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari berdasarkan nama atau alamat email..."
            className="glass-input w-full rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 backdrop-blur-md">
          <span className="text-slate-400 font-medium">Tampilkan:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="bg-transparent font-bold text-[#0A3266] dark:text-[#C9A05C] outline-none cursor-pointer"
          >
            <option value={10} className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">10 baris</option>
            <option value={20} className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">20 baris</option>
            <option value={50} className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">50 baris</option>
            <option value={100} className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">100 baris</option>
          </select>
        </div>
      </div>

      {/* User Table Card */}
      <div className="glass-panel overflow-hidden rounded-3xl shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat data pengguna...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="w-12 px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      disabled={userList.length === 0}
                      className="inline-flex items-center justify-center rounded p-1 text-slate-400 hover:text-[#0A3266] dark:hover:text-white"
                      title={isAllSelected ? "Batalkan Pilih Semua" : "Pilih Semua di Halaman Ini"}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-[#C9A05C]" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="h-4 w-4 text-[#C9A05C]" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-4">Nama Lengkap</th>
                  <th className="px-5 py-4">Alamat Email</th>
                  <th className="px-5 py-4">Peran Pengguna</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/[0.04] text-xs sm:text-sm">
                {userList.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-[#C9A05C]/15 hover:bg-[#C9A05C]/20"
                          : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="w-12 px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u.id)}
                          className="inline-flex items-center justify-center rounded p-1 text-slate-400 hover:text-[#0A3266] dark:hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#C9A05C]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#0A3266] dark:text-white flex items-center gap-2">
                          {u.name}
                          {isSelf && (
                            <span className="rounded-md bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 px-2 py-0.5 text-[10px] font-bold text-[#0A3266] dark:text-[#C9A05C] border border-[#C9A05C]/40">
                              Akun Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{u.email}</td>
                      <td className="px-5 py-4">{roleBadge(u.role)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="glass-button-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            title="Edit Data Pengguna"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#C9A05C]" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isSelf
                                ? "opacity-30 cursor-not-allowed border border-black/10 dark:border-white/[0.04] text-slate-400"
                                : "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20"
                            }`}
                            title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus Akun"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {userList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-xs font-medium text-slate-400">
                      Tidak ada pengguna yang sesuai dengan kriteria pencarian
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-[#0A3266] dark:text-white">{startItem}</span> hingga{" "}
            <span className="font-bold text-[#0A3266] dark:text-white">{endItem}</span> dari{" "}
            <span className="font-bold text-[#0A3266] dark:text-white">{meta.total}</span> data pengguna
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setPage(1); setSelectedUserIds([]); }}
              disabled={page <= 1}
              className="glass-button-secondary flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-30"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelectedUserIds([]); }}
              disabled={page <= 1}
              className="glass-button-secondary flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-30"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-[#0A3266] dark:text-white">
              Halaman {page} dari {meta.totalPages || 1}
            </span>
            <button
              onClick={() => { setPage((p) => Math.min(meta.totalPages || 1, p + 1)); setSelectedUserIds([]); }}
              disabled={page >= (meta.totalPages || 1)}
              className="glass-button-secondary flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-30"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setPage(meta.totalPages || 1); setSelectedUserIds([]); }}
              disabled={page >= (meta.totalPages || 1)}
              className="glass-button-secondary flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-30"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 rounded-3xl border border-[#C9A05C]/40 bg-white/95 dark:bg-[#051329]/95 px-6 py-3.5 shadow-2xl backdrop-blur-2xl animate-fade-in">
          <span className="text-xs font-bold text-[#0A3266] dark:text-white">
            {selectedUserIds.length} Pengguna Dipilih
          </span>
          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/20" />
          <button
            onClick={() => setShowBulkRoleModal(true)}
            className="glass-button-secondary rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            Ubah Peran
          </button>
          <button
            onClick={() => setShowBulkPasswordModal(true)}
            className="glass-button-secondary rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            Reset Kata Sandi
          </button>
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-500/25"
          >
            Hapus Massal
          </button>
          <button
            onClick={() => setSelectedUserIds([])}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
            title="Batalkan Pilihan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal: Tambah Pengguna Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-[#C9A05C]/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-white flex items-center gap-2.5">
                <UserPlus className="h-5 w-5 text-[#C9A05C]" />
                <span>Tambah Pengguna Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="Contoh: Budi Santoso"
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="budi@kampus.ac.id"
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Peran Akun
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value })
                  }
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm cursor-pointer"
                >
                  <option value="STUDENT" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Mahasiswa</option>
                  <option value="LECTURER" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Dosen Pengampu</option>
                  <option value="ADMIN" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Administrator</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  placeholder="Minimal 6 karakter"
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-black/10 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  <span>{creating ? "Menyimpan..." : "Simpan Pengguna"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Pengguna */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-[#C9A05C]/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#0A3266] dark:text-white flex items-center gap-2.5">
                <Pencil className="h-5 w-5 text-[#C9A05C]" />
                <span>Edit Data Pengguna</span>
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
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nama Lengkap
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

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Peran Akun
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm cursor-pointer"
                >
                  <option value="STUDENT" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Mahasiswa</option>
                  <option value="LECTURER" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Dosen Pengampu</option>
                  <option value="ADMIN" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Administrator</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Kata Sandi Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  placeholder="Kosongkan bila tidak ingin mengubah kata sandi"
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

      {/* Modal: Hapus Tunggal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-red-500/40">
            <div className="mb-4 flex items-center gap-3 text-red-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">Hapus Akun Pengguna</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-[#0A3266] dark:text-white font-bold">
                {userToDelete.name} ({userToDelete.email})
              </strong>
              ?
            </p>

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
                <span>{deleting ? "Menghapus..." : "Ya, Hapus Akun"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Hapus Massal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-red-500/40">
            <div className="mb-4 flex items-center gap-3 text-red-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">Hapus Massal Pengguna</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUserIds.length} akun terpilih</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus sebanyak{" "}
              <strong className="text-[#0A3266] dark:text-white font-bold">{selectedUserIds.length}</strong> akun pengguna yang dipilih?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={bulkDeleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
              >
                {bulkDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{bulkDeleting ? "Menghapus..." : "Hapus Semua Terpilih"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ubah Peran Massal */}
      {showBulkRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-[#C9A05C]/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">Ubah Peran Massal ({selectedUserIds.length} Akun)</h3>
              <button
                onClick={() => setShowBulkRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBulkRoleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pilih Peran Baru
                </label>
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value)}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm cursor-pointer"
                >
                  <option value="STUDENT" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Mahasiswa</option>
                  <option value="LECTURER" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Dosen Pengampu</option>
                  <option value="ADMIN" className="bg-[#FBF8F3] dark:bg-[#051329] text-[#0A3266] dark:text-white">Administrator</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-black/10 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowBulkRoleModal(false)}
                  className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkRoleUpdating}
                  className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {bulkRoleUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{bulkRoleUpdating ? "Menyimpan..." : "Terapkan Peran"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Kata Sandi Massal */}
      {showBulkPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="glass-panel animate-fade-in w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-[#C9A05C]/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-[#C9A05C]" />
                <span>Reset Kata Sandi Massal</span>
              </h3>
              <button
                onClick={() => setShowBulkPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBulkPasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Kata Sandi Baru untuk {selectedUserIds.length} Pengguna
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={bulkNewPassword}
                  onChange={(e) => setBulkNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru (minimal 6 karakter)"
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-black/10 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowBulkPasswordModal(false)}
                  className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkPasswordUpdating}
                  className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {bulkPasswordUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{bulkPasswordUpdating ? "Memproses..." : "Reset Kata Sandi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
