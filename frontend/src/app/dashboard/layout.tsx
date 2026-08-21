"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isAdmin = user?.role === "ADMIN";
  const isLecturer = user?.role === "LECTURER";
  const isStudent = user?.role === "STUDENT";

  // Dynamic Breadcrumb computation
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [{ label: "Beranda", href: "/dashboard" }];

    if (segments.includes("courses")) {
      crumbs.push({ label: "Mata Kuliah", href: "/dashboard/courses" });
      if (segments.length > 2) {
        crumbs.push({ label: "Detail Kelas", href: pathname });
      }
    } else if (segments.includes("admin")) {
      if (segments.includes("users")) {
        crumbs.push({ label: "Administrasi", href: "/dashboard/admin/users" });
        crumbs.push({ label: "Kelola Pengguna", href: "/dashboard/admin/users" });
      } else if (segments.includes("courses")) {
        crumbs.push({ label: "Administrasi", href: "/dashboard/admin/courses" });
        crumbs.push({ label: "Kelola Mata Kuliah", href: "/dashboard/admin/courses" });
      } else if (segments.includes("dataset")) {
        crumbs.push({ label: "Pusat Riset", href: "/dashboard/admin/dataset" });
        crumbs.push({ label: "Dataset & Analisis AI", href: "/dashboard/admin/dataset" });
      }
    }
    return crumbs;
  }, [pathname]);

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
    navGroups.push({
      groupTitle: "Ruang Pengajaran",
      items: [
        {
          href: "/dashboard",
          label: "Beranda Utama",
          icon: LayoutDashboard,
          exact: true,
          description: "Jadwal kuliah daring & tugas terkini",
        },
        {
          href: "/dashboard/courses",
          label: "Mata Kuliah & RPS Saya",
          icon: GraduationCap,
          exact: false,
          description: "Modul, kuis, tugas, & buku nilai",
        },
      ],
    });
  } else {
    // Student
    navGroups.push({
      groupTitle: "Ruang Belajar Mahasiswa",
      items: [
        {
          href: "/dashboard",
          label: "Beranda Utama",
          icon: LayoutDashboard,
          exact: true,
          description: "Jadwal perkuliahan & pengumuman",
        },
        {
          href: "/dashboard/courses",
          label: "Mata Kuliah & Modul Saya",
          icon: BookOpen,
          exact: false,
          description: "Akses materi, kuis, tugas & forum",
        },
      ],
    });
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
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");

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
        {/* Desktop Sticky Header Bar (HCI Breadcrumbs & Quick Context) */}
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

          {/* Quick Context Indicator Pills */}
          <div className="flex items-center gap-3">
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
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
