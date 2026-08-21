"use client";

import { useEffect, useState, useMemo, Suspense, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { academic as academicApi } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Database,
  LogOut,
  ChevronRight,
  Loader2,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Search,
  Bell,
  Home,
  Sliders,
  CheckCircle2,
  Megaphone,
  Radio,
  Pin,
  AlertTriangle,
  ExternalLink,
  FileCheck,
  HelpCircle,
  Video,
  MessageSquare,
} from "lucide-react";

interface NavGroup {
  groupTitle: string;
  items: {
    href: string;
    label: string;
    icon: any;
    exact?: boolean;
    description?: string;
  }[];
}

function AppShellInner({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification Bell Dropdown state
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Load announcements for notification dropdown
  useEffect(() => {
    if (user) {
      academicApi
        .getGeneralAnnouncements()
        .then((data) => {
          if (Array.isArray(data)) setRecentBroadcasts(data.slice(0, 5));
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  // Close mobile menu & notifications on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
  }, [pathname]);

  const isAdmin = user?.role === "ADMIN";
  const isLecturer = user?.role === "LECTURER";
  const isStudent = user?.role === "STUDENT";

  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  // Dynamic Breadcrumb computation
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [{ label: "Beranda", href: "/dashboard" }];

    if (segments.includes("courses")) {
      crumbs.push({ label: "Mata Kuliah", href: "/dashboard/courses" });
      if (currentTab === "assignments") {
        crumbs.push({ label: isLecturer ? "Pusat Tugas & Turnitin" : "Tugas & Dropboxes", href: "/dashboard/courses?tab=assignments" });
      } else if (currentTab === "quizzes") {
        crumbs.push({ label: "Kuis & Evaluasi Daring", href: "/dashboard/courses?tab=quizzes" });
      } else if (currentTab === "virtual") {
        crumbs.push({ label: "Jadwal Kuliah Virtual", href: "/dashboard/courses?tab=virtual" });
      } else if (currentTab === "gradebook") {
        crumbs.push({ label: isLecturer ? "Buku Nilai & Rekap Mutu" : "Transkrip Sementara", href: "/dashboard/courses?tab=gradebook" });
      } else if (currentTab === "threads") {
        crumbs.push({ label: "Forum Diskusi", href: "/dashboard/courses?tab=threads" });
      }
    } else if (segments.includes("announcements")) {
      crumbs.push({ label: "Papan Pengumuman", href: "/dashboard/announcements" });
    } else if (segments.includes("admin")) {
      if (segments.includes("users")) {
        crumbs.push({ label: "Administrasi", href: "/dashboard/admin/users" });
        crumbs.push({ label: "Kelola Pengguna", href: "/dashboard/admin/users" });
      } else if (segments.includes("courses")) {
        crumbs.push({ label: "Administrasi", href: "/dashboard/admin/courses" });
        crumbs.push({ label: "Kelola Mata Kuliah", href: "/dashboard/admin/courses" });
      } else if (segments.includes("announcements")) {
        crumbs.push({ label: "Pusat Kontrol", href: "/dashboard/admin/announcements" });
        crumbs.push({ label: "Kelola Pengumuman", href: "/dashboard/admin/announcements" });
      } else if (segments.includes("settings")) {
        crumbs.push({ label: "Administrasi", href: "/dashboard/admin/settings" });
        crumbs.push({ label: "Pengaturan Sistem", href: "/dashboard/admin/settings" });
      } else if (segments.includes("dataset")) {
        crumbs.push({ label: "Pusat Riset", href: "/dashboard/admin/dataset" });
        crumbs.push({ label: "Dataset & Analisis AI", href: "/dashboard/admin/dataset" });
      }
    }
    return crumbs;
  }, [pathname, currentTab, isLecturer]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F3] dark:bg-[#061a3b]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#C9A05C]/20 blur-xl animate-pulse" />
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-[#ebd09e] tracking-wider">
            Menyiapkan Ruang Belajar Terpadu...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Build role-based grouped navigation
  const navGroups: NavGroup[] = [];

  if (isAdmin) {
    navGroups.push(
      {
        groupTitle: "Pusat Kontrol",
        items: [
          {
            href: "/dashboard",
            label: "Beranda Utama",
            icon: LayoutDashboard,
            exact: true,
            description: "Ringkasan metrik & aktivitas kampus",
          },
          {
            href: "/dashboard/admin/announcements",
            label: "Kelola Pengumuman & Broadcast",
            icon: Megaphone,
            exact: false,
            description: "Broadcast notifikasi ke seluruh sivitas",
          },
        ],
      },
      {
        groupTitle: "Administrasi Akademik",
        items: [
          {
            href: "/dashboard/admin/courses",
            label: "Kelola Mata Kuliah & RPS",
            icon: GraduationCap,
            exact: false,
            description: "Manajemen silabus, CPL, dan enrollment",
          },
          {
            href: "/dashboard/admin/users",
            label: "Kelola Pengguna",
            icon: Users,
            exact: false,
            description: "Manajemen akun dosen & mahasiswa",
          },
          {
            href: "/dashboard/admin/settings",
            label: "Pengaturan Sistem & Kebijakan",
            icon: Sliders,
            exact: false,
            description: "Semester aktif, bobot nilai & Turnitin",
          },
        ],
      },
      {
        groupTitle: "Pusat Riset ARJUNA-Net",
        items: [
          {
            href: "/dashboard/admin/dataset",
            label: "Dataset & Anotasi AI",
            icon: Database,
            exact: false,
            description: "Studio anotasi & ekspor dataset 15 kolom",
          },
        ],
      }
    );
  } else if (isLecturer) {
    navGroups.push(
      {
        groupTitle: "Pusat Pengajaran",
        items: [
          {
            href: "/dashboard",
            label: "Beranda Utama",
            icon: LayoutDashboard,
            exact: true,
            description: "Cockpit mengajar & jadwal kuliah",
          },
          {
            href: "/dashboard/courses",
            label: "Mata Kuliah & RPS Saya",
            icon: GraduationCap,
            exact: true,
            description: "Silabus, CPL & modul pembelajaran",
          },
        ],
      },
      {
        groupTitle: "Kegiatan & Evaluasi Pembelajaran",
        items: [
          {
            href: "/dashboard/courses?tab=assignments",
            label: "Pusat Tugas & Turnitin",
            icon: FileCheck,
            exact: false,
            description: "Dropbox tugas & uji keaslian dokumen",
          },
          {
            href: "/dashboard/courses?tab=quizzes",
            label: "Kuis & Bank Soal Daring",
            icon: HelpCircle,
            exact: false,
            description: "Pilihan ganda, esai & batas waktu",
          },
          {
            href: "/dashboard/courses?tab=virtual",
            label: "Jadwal Kuliah Virtual (Meet)",
            icon: Video,
            exact: false,
            description: "Sesi tatap muka Google Meet & Zoom",
          },
          {
            href: "/dashboard/courses?tab=gradebook",
            label: "Buku Nilai & Rekap Mutu",
            icon: BookOpen,
            exact: false,
            description: "Rekapitulasi nilai & huruf mutu A-E",
          },
        ],
      },
      {
        groupTitle: "Komunikasi Sivitas",
        items: [
          {
            href: "/dashboard/courses?tab=threads",
            label: "Forum Diskusi Perkuliahan",
            icon: MessageSquare,
            exact: false,
            description: "Tanya jawab asinkron & respons dosen",
          },
          {
            href: "/dashboard/announcements",
            label: "Papan Pengumuman Kampus",
            icon: Megaphone,
            exact: false,
            description: "Siaran resmi akademik & informasi",
          },
        ],
      }
    );
  } else {
    // Student
    navGroups.push(
      {
        groupTitle: "Ruang Belajar Mahasiswa",
        items: [
          {
            href: "/dashboard",
            label: "Beranda & Timeline Belajar",
            icon: LayoutDashboard,
            exact: true,
            description: "Progres belajar & deadline terdekat",
          },
          {
            href: "/dashboard/courses",
            label: "Mata Kuliah & Modul Saya",
            icon: BookOpen,
            exact: true,
            description: "Akses materi slide, video & silabus",
          },
        ],
      },
      {
        groupTitle: "Aktivitas & Capaian Akademik",
        items: [
          {
            href: "/dashboard/courses?tab=assignments",
            label: "Tugas & Dropboxes Berkas",
            icon: FileCheck,
            exact: false,
            description: "Kumpulkan tugas & cek skor Turnitin",
          },
          {
            href: "/dashboard/courses?tab=quizzes",
            label: "Kuis & Ujian Daring",
            icon: HelpCircle,
            exact: false,
            description: "Pengerjaan evaluasi pemahaman",
          },
          {
            href: "/dashboard/courses?tab=virtual",
            label: "Jadwal Kuliah Virtual (Meet)",
            icon: Video,
            exact: false,
            description: "Kelas tatap muka daring aktif",
          },
          {
            href: "/dashboard/courses?tab=gradebook",
            label: "Transkrip & Nilai Sementara",
            icon: GraduationCap,
            exact: false,
            description: "Capaian huruf mutu & estimasi IPK",
          },
        ],
      },
      {
        groupTitle: "Komunikasi Sivitas",
        items: [
          {
            href: "/dashboard/courses?tab=threads",
            label: "Forum Tanya Jawab & Diskusi",
            icon: MessageSquare,
            exact: false,
            description: "Interaksi bersama dosen & rekan",
          },
          {
            href: "/dashboard/announcements",
            label: "Papan Pengumuman Akademik",
            icon: Megaphone,
            exact: false,
            description: "Siaran informasi resmi perkuliahan",
          },
        ],
      }
    );
  }

  const roleLabel = isAdmin
    ? "Administrator"
    : isLecturer
      ? "Dosen Pengampu"
      : "Mahasiswa";

  const roleBadgeStyle = isAdmin
    ? "bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e] border-[#C9A05C]/50"
    : isLecturer
      ? "bg-[#0A3266]/15 dark:bg-[#0A3266]/40 text-[#0A3266] dark:text-[#8bb8f0] border-[#0A3266]/40 dark:border-[#C9A05C]/40"
      : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";

  return (
    <div className="flex min-h-screen bg-[#FBF8F3] dark:bg-[#061a3b] text-[#0A3266] dark:text-[#FBF8F3] relative selection:bg-[#C9A05C]/30 selection:text-[#C9A05C] transition-colors duration-300">
      {/* ═══ Mobile Top Header ═══ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/25 bg-white/85 dark:bg-[#061a3b]/85 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-md shadow-[#0A3266]/15 ring-1 ring-[#C9A05C]/40 overflow-hidden">
            <Image
              src="/images/logo.jpg"
              alt="Logo Arjuna LMS"
              width={36}
              height={36}
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <span className="text-base font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
            ARJUNA <span className="text-[#C9A05C]">LMS</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-[#C9A05C]/30 bg-black/5 dark:bg-white/[0.05] text-slate-700 dark:text-[#FBF8F3]"
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ═══ Sidebar Navigation (Desktop & Mobile Drawer) ═══ */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-black/10 dark:border-[#C9A05C]/25 bg-white/90 dark:bg-[#061a3b]/92 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 border-b border-black/10 dark:border-[#C9A05C]/20 px-6 py-5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-[#0A3266]/20 ring-1 ring-[#C9A05C]/40 overflow-hidden">
            <Image
              src="/images/logo.jpg"
              alt="Logo Resmi Arjuna LMS"
              width={40}
              height={40}
              priority
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3]">
                ARJUNA <span className="bg-gradient-to-r from-[#0A3266] to-[#C9A05C] dark:from-[#C9A05C] dark:to-[#ebd09e] bg-clip-text text-transparent">LMS</span>
              </span>
              <Sparkles className="h-3 w-3 text-[#C9A05C]" />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#dbb779]">
              {isAdmin ? "Pusat Administrasi & Riset" : isLecturer ? "Workspace Dosen Pengampu" : "Ruang Kolaborasi Kampus"}
            </p>
          </div>
        </div>

        {/* Theme Switcher Segmented Control */}
        <div className="px-5 pt-4 pb-1">
          <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#dbb779]/75">
            Pilihan Tema Tampilan
          </div>
          <ThemeToggle variant="segmented" className="w-full" />
        </div>

        {/* Grouped Navigation Links */}
        <nav aria-label="Menu Utama" className="flex-1 space-y-4 px-4 py-4 overflow-y-auto no-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#dbb779]/80">
                {group.groupTitle}
              </div>

              {group.items.map((item) => {
                let isActive = false;
                try {
                  const itemUrl = new URL(item.href, "http://localhost");
                  const itemPath = itemUrl.pathname;
                  const itemTab = itemUrl.searchParams.get("tab");

                  if (itemTab) {
                    isActive = pathname === itemPath && currentTab === itemTab;
                  } else if (item.exact) {
                    isActive = pathname === itemPath && !currentTab;
                  } else {
                    isActive = (pathname === itemPath && !currentTab) || pathname.startsWith(itemPath + "/");
                  }
                } catch {
                  isActive = pathname === item.href;
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#0A3266]/15 via-[#0A3266]/10 to-[#C9A05C]/15 dark:from-[#C9A05C]/25 dark:via-[#C9A05C]/15 dark:to-[#0A3266]/35 text-[#0A3266] dark:text-[#FBF8F3] border border-[#0A3266]/30 dark:border-[#C9A05C]/50 shadow-md shadow-[#0A3266]/5"
                        : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-[#0A3266]/40 hover:text-[#0A3266] dark:hover:text-[#FBF8F3]"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                        isActive
                          ? "bg-[#0A3266] dark:bg-[#C9A05C] text-white dark:text-[#04132b] shadow-md shadow-[#0A3266]/20 dark:shadow-[#C9A05C]/30"
                          : "bg-black/5 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 group-hover:text-[#0A3266] dark:group-hover:text-[#C9A05C] group-hover:bg-black/10 dark:group-hover:bg-[#0A3266]/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{item.label}</div>
                      {item.description && (
                        <div className="truncate text-[10px] font-normal text-slate-400 dark:text-slate-400/80">
                          {item.description}
                        </div>
                      )}
                    </div>

                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-[#C9A05C] shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card & Logout Button */}
        <div className="border-t border-black/10 dark:border-[#C9A05C]/20 p-4 bg-black/[0.01] dark:bg-[#030d1d]/40 space-y-3">
          <div className="flex items-center gap-3.5 rounded-2xl bg-black/[0.03] dark:bg-[#0A3266]/30 p-3.5 border border-black/10 dark:border-[#C9A05C]/25 backdrop-blur-md">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0A3266] to-[#C9A05C] font-bold text-white shadow-md shadow-[#0A3266]/20 text-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#0A3266] dark:text-[#FBF8F3]">{user.name}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${roleBadgeStyle}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-[#C9A05C]/20 bg-black/[0.03] dark:bg-[#0A3266]/20 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-300 active:scale-[0.99]"
            title="Keluar dari Akun"
          >
            <LogOut className="h-3.5 w-3.5 text-red-500" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </aside>

      {/* ═══ Main Content Area & Sticky Top Bar ═══ */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">
        {/* Desktop Sticky Header Bar (HCI Breadcrumbs & Notification Bell) */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 bg-white/75 dark:bg-[#061a3b]/75 px-8 backdrop-blur-xl">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Home className="h-3.5 w-3.5 text-[#C9A05C]" />
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.href} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                <Link
                  href={crumb.href}
                  className={`hover:text-[#0A3266] dark:hover:text-[#ebd09e] transition-colors ${
                    idx === breadcrumbs.length - 1 ? "font-bold text-[#0A3266] dark:text-white" : ""
                  }`}
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </div>

          {/* Right Header Controls: Notification Bell, Term, Status */}
          <div className="flex items-center gap-3 relative">
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:text-[#0A3266] dark:hover:text-[#C9A05C] transition-colors"
                title="Pemberitahuan & Broadcast Kampus"
              >
                <Bell className="h-4 w-4" />
                {recentBroadcasts.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#C9A05C] ring-2 ring-white dark:ring-[#061a3b] animate-pulse" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl glass-panel p-4 shadow-2xl border border-[#C9A05C]/40 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-[#C9A05C]" />
                      <span className="text-xs font-bold text-[#0A3266] dark:text-white">
                        Pengumuman & Broadcast
                      </span>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin/announcements"
                        className="text-[10px] font-bold text-[#C9A05C] hover:underline"
                      >
                        Kelola
                      </Link>
                    )}
                  </div>

                  {recentBroadcasts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Belum ada pengumuman terbaru.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
                      {recentBroadcasts.map((b) => (
                        <div
                          key={b.id}
                          className={`rounded-2xl p-3 text-xs border ${
                            b.priority === "URGENT"
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
                              : b.isPinned
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
                                : "bg-black/[0.02] dark:bg-white/[0.04] border-black/5 dark:border-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold truncate text-[#0A3266] dark:text-white">
                              {b.title}
                            </span>
                            {b.isPinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {b.content}
                          </p>
                          <div className="mt-1.5 text-[9px] text-slate-400 flex items-center justify-between">
                            <span>{b.course?.code || "Broadcast Kampus"}</span>
                            <span>{new Date(b.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-[#C9A05C]" />
              <span>Semester 2026/2027 Ganjil</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Aktif</span>
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 p-5 sm:p-8 pt-20 lg:pt-8 min-w-0 overflow-x-hidden">
          <div className="animate-fade-in mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#FBF8F3] dark:bg-[#061a3b] text-xs text-slate-400">
            Memuat antarmuka LMS...
          </div>
        }
      >
        <AppShellInner>{children}</AppShellInner>
      </Suspense>
    </AuthProvider>
  );
}
