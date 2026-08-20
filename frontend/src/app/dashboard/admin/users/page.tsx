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
} from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // "" = All, "LECTURER", "STUDENT", "ADMIN"
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // default 10 per page
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

  // Load data on filter/page/limit changes
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
      if (res.meta) {
        setMeta(res.meta);
      }
      if (res.counts) {
        setCounts(res.counts);
      }
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

  // Handle Tab Role Switch
  const handleRoleTabChange = (role: string) => {
    setRoleFilter(role);
    setPage(1);
    setSelectedUserIds([]);
  };

  // Handle Search Input Change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    setSelectedUserIds([]);
  };

  // Handle Page Size Change
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setSelectedUserIds([]);
  };

  // Multi-selection computed values
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

  const handleClearSelection = () => {
    setSelectedUserIds([]);
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
        message: err.message || "Gagal mengimpor file CSV",
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle Create User
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

  // Open Edit Modal
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

  // Handle Update User
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

  // Open Single Delete Modal
  const openDeleteModal = (u: User) => {
    setUserToDelete(u);
    setShowDeleteModal(true);
  };

  // Handle Single Delete User
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

  // Handle Bulk Delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await usersApi.bulkDelete(selectedUserIds);
      let msg = res.message || `${res.count || selectedUserIds.length} akun pengguna berhasil dihapus.`;
      if (res.skippedSelf) {
        msg += " (Akun Anda sendiri dilewati demi keamanan).";
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
        message: err.message || "Gagal melakukan hapus massal",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Handle Bulk Role Update
  const handleBulkRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    setBulkRoleUpdating(true);
    try {
      const res = await usersApi.bulkUpdateRole(selectedUserIds, bulkRole);
      setFeedback({
        type: "success",
        message: res.message || `Role ${selectedUserIds.length} pengguna berhasil diperbarui ke ${bulkRole}.`,
      });
      setShowBulkRoleModal(false);
      setSelectedUserIds([]);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui role pengguna",
      });
    } finally {
      setBulkRoleUpdating(false);
    }
  };

  // Handle Bulk Password Reset
  const handleBulkPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0 || bulkNewPassword.length < 6) return;
    setBulkPasswordUpdating(true);
    try {
      const res = await usersApi.bulkResetPassword(selectedUserIds, bulkNewPassword);
      setFeedback({
        type: "success",
        message: res.message || `Password berhasil direset untuk ${selectedUserIds.length} pengguna.`,
      });
      setShowBulkPasswordModal(false);
      setBulkNewPassword("");
      setSelectedUserIds([]);
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal mereset password secara massal",
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

  // Tab definitions
  const roleTabs = [
    {
      id: "",
      label: "Semua Pengguna",
      icon: Users,
      count: counts.all,
      color: "text-blue-400",
    },
    {
      id: "LECTURER",
      label: "Dosen",
      icon: GraduationCap,
      count: counts.LECTURER,
      color: "text-teal-400",
    },
    {
      id: "STUDENT",
      label: "Mahasiswa",
      icon: BookOpen,
      count: counts.STUDENT,
      color: "text-blue-400",
    },
    {
      id: "ADMIN",
      label: "Administrator",
      icon: Shield,
      count: counts.ADMIN,
      color: "text-amber-400",
    },
  ];

  // Pagination calculation
  const startItem = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, meta.total);

  // Generate page numbers array
  const getPageNumbers = () => {
    const totalPages = meta.totalPages || 1;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="relative pb-24">
      {/* Top Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola data akun Dosen & Mahasiswa secara terpisah dengan page view terstruktur
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Pengguna
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition-all hover:bg-slate-700 active:scale-95"
          >
            <Upload className="h-4 w-4 text-blue-400" />
            Bulk Import CSV
          </button>
        </div>
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

      {/* Role Navigation Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {roleTabs.map((tab) => {
          const isActive = roleFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleRoleTabChange(tab.id)}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-500"
                  : "border border-slate-800/80 bg-[#0e1726]/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : tab.color}`} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
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

      {/* Filter, Search, and Page Size Controls */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-xl border border-slate-800 bg-[#0e1726] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-[#0e1726] px-3.5 py-2 text-xs text-slate-300">
          <span className="text-slate-400 font-medium">Tampilkan:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="bg-transparent font-semibold text-blue-400 focus:outline-none cursor-pointer"
          >
            <option value={10} className="bg-[#0e1726] text-white">10 data</option>
            <option value={20} className="bg-[#0e1726] text-white">20 data</option>
            <option value={50} className="bg-[#0e1726] text-white">50 data</option>
            <option value={100} className="bg-[#0e1726] text-white">100 data</option>
          </select>
        </div>
      </div>

      {/* User Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e1726]/90 shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-xs text-slate-400">Memuat data pengguna...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {/* Select All Checkbox Header */}
                  <th className="w-12 px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      disabled={userList.length === 0}
                      className="inline-flex items-center justify-center rounded p-1 text-slate-400 transition-colors hover:text-white disabled:opacity-40"
                      title={isAllSelected ? "Batalkan Pilih Semua" : "Pilih Semua di Halaman Ini"}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-400" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">Nama Lengkap</th>
                  <th className="px-5 py-3.5">Email Pengguna</th>
                  <th className="px-5 py-3.5">Peran / Role</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {userList.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-blue-600/10 hover:bg-blue-600/15"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="w-12 px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u.id)}
                          className="inline-flex items-center justify-center rounded p-1 text-slate-400 transition-colors hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          {u.name}
                          {isSelf && (
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-blue-400 border border-slate-700">
                              Akun Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{u.email}</td>
                      <td className="px-5 py-4">{roleBadge(u.role)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                            title="Edit Data Pengguna"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-400" />
                            Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isSelf
                                ? "border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed"
                                : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                            }`}
                            title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus Akun Pengguna"}
                          >
                            <Trash2 className={`h-3.5 w-3.5 ${isSelf ? "text-slate-600" : "text-red-400"}`} />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {userList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm font-medium text-slate-500">
                      Tidak ada pengguna ditemukan pada kategori ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/40 px-6 py-4 text-xs text-slate-400">
          <div>
            Menampilkan <span className="font-semibold text-white">{startItem}</span> -{" "}
            <span className="font-semibold text-white">{endItem}</span> dari{" "}
            <span className="font-semibold text-white">{meta.total}</span> data pengguna
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => { setPage(1); setSelectedUserIds([]); }}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800/60 disabled:hover:text-slate-400 transition-colors"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelectedUserIds([]); }}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800/60 disabled:hover:text-slate-400 transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-600 font-semibold">
                    ...
                  </span>
                );
              }
              const isCurrent = p === page;
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => { setPage(Number(p)); setSelectedUserIds([]); }}
                  className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "border border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              onClick={() => { setPage((p) => Math.min(meta.totalPages || 1, p + 1)); setSelectedUserIds([]); }}
              disabled={page >= (meta.totalPages || 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800/60 disabled:hover:text-slate-400 transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => { setPage(meta.totalPages || 1); setSelectedUserIds([]); }}
              disabled={page >= (meta.totalPages || 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800/60 disabled:hover:text-slate-400 transition-colors"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in flex flex-wrap items-center gap-3 rounded-2xl border border-blue-500/30 bg-[#070c18]/95 px-5 py-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 font-semibold text-sm text-white pr-2 border-r border-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {selectedUserIds.length}
            </span>
            <span>Dipilih</span>
          </div>

          {/* Bulk Role Change */}
          <button
            onClick={() => setShowBulkRoleModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-500/40 hover:bg-blue-500/15 hover:text-blue-300"
          >
            <Shield className="h-3.5 w-3.5 text-teal-400" />
            Ubah Role
          </button>

          {/* Bulk Reset Password */}
          <button
            onClick={() => setShowBulkPasswordModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-500/40 hover:bg-amber-500/15 hover:text-amber-300"
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            Reset Password
          </button>

          {/* Bulk Delete */}
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/20 px-3.5 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            Hapus Terpilih
          </button>

          {/* Clear Selection */}
          <button
            onClick={handleClearSelection}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Batalkan Seleksi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal: Tambah Pengguna Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                Tambah Pengguna Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="Contoh: Dr. Budi Santoso"
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="Contoh: budi@kampus.ac.id"
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Password Awal (min 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Peran / Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="STUDENT">Mahasiswa</option>
                  <option value="LECTURER">Dosen</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Pengguna */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-400" />
                Edit Data Pengguna
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
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Nama Lengkap
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

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Email Pengguna
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Peran / Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="STUDENT">Mahasiswa</option>
                  <option value="LECTURER">Dosen</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password Baru
                  </label>
                  <span className="text-[11px] text-slate-500">Opsional</span>
                </div>
                <input
                  type="password"
                  minLength={6}
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  placeholder="Kosongkan jika tidak ingin ganti password"
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Minimal 6 karakter jika ingin mengganti password pengguna.
                </p>
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

      {/* Modal: Konfirmasi Hapus Pengguna Tunggal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Akun Pengguna</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-white font-semibold">{userToDelete.name}</strong> (
              <span className="text-blue-400">{userToDelete.email}</span>)?
            </p>

            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 leading-relaxed">
              Data enrollment, pesan, dan riwayat aktivitas terkait pengguna ini akan dibersihkan secara aman dari sistem.
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
                {deleting ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Massal Pengguna</h3>
                <p className="text-xs text-slate-400">
                  {selectedUserIds.length} akun pengguna dipilih untuk dihapus
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus seluruh{" "}
              <strong className="text-white font-semibold">{selectedUserIds.length} pengguna terpilih</strong>?
            </p>

            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 leading-relaxed">
              Semua relasi data aktivitas, thread, pesan, dan enrollment terkait pengguna-pengguna ini akan dihapus secara permanen. Akun Anda sendiri (jika terpilih) akan otomatis diproteksi.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={bulkDeleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {bulkDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {bulkDeleting ? "Menghapus..." : `Ya, Hapus (${selectedUserIds.length}) Akun`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Update Role */}
      {showBulkRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-400" />
                Ubah Role Massal ({selectedUserIds.length} Pengguna)
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkRoleModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBulkRoleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Pilih peran/role baru yang akan diterapkan pada seluruh {selectedUserIds.length} pengguna yang dipilih:
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Pilih Role Baru
                </label>
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="STUDENT">Mahasiswa (STUDENT)</option>
                  <option value="LECTURER">Dosen (LECTURER)</option>
                  <option value="ADMIN">Administrator (ADMIN)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkRoleModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkRoleUpdating}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {bulkRoleUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {bulkRoleUpdating ? "Menyimpan..." : "Terapkan Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Reset Password */}
      {showBulkPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1726] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                Reset Password Massal ({selectedUserIds.length} Pengguna)
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkPasswordModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBulkPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Masukkan password baru seragam untuk {selectedUserIds.length} pengguna yang dipilih:
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Password Baru (min 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={bulkNewPassword}
                  onChange={(e) => setBulkNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-[#070c18] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPasswordModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkPasswordUpdating || bulkNewPassword.length < 6}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-500 disabled:opacity-50"
                >
                  {bulkPasswordUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {bulkPasswordUpdating ? "Mereset..." : "Reset Semua Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
