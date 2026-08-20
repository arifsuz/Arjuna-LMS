"use client";

import { useEffect, useState, type ReactNode } from "react";
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
} from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F3] dark:bg-[#061a3b]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#C9A05C]/20 blur-xl animate-pulse" />
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-[#ebd09e] tracking-wider">
            Menyiapkan Ruang Belajar...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const navItems = [
    {
      href: "/dashboard",
      label: "Beranda Utama",
      icon: LayoutDashboard,
      visible: true,
      exact: true,
    },
    {
      href: "/dashboard/courses",
      label: "Kelas Saya",
      icon: GraduationCap,
      visible: !isAdmin,
      exact: false,
    },
    {
      href: "/dashboard/admin/users",
      label: "Kelola Pengguna",
      icon: Users,
      visible: isAdmin,
      exact: false,
    },
    {
      href: "/dashboard/admin/courses",
      label: "Kelola Kelas",
      icon: GraduationCap,
      visible: isAdmin,
      exact: false,
    },
    {
      href: "/dashboard/admin/dataset",
      label: "Dataset & Analisis",
      icon: Database,
      visible: isAdmin,
      exact: false,
    },
  ].filter((item) => item.visible);

  const roleLabel =
    user.role === "ADMIN"
      ? "Administrator"
      : user.role === "LECTURER"
        ? "Dosen Pengampu"
        : "Mahasiswa";

  const roleBadgeStyle =
    user.role === "ADMIN"
      ? "bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e] border-[#C9A05C]/50"
      : user.role === "LECTURER"
        ? "bg-[#0A3266]/15 dark:bg-[#0A3266]/40 text-[#0A3266] dark:text-[#8bb8f0] border-[#0A3266]/40 dark:border-[#C9A05C]/40"
        : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";

  return (
    <div className="flex min-h-screen bg-[#FBF8F3] dark:bg-[#061a3b] text-[#0A3266] dark:text-[#FBF8F3] relative selection:bg-[#C9A05C]/30 selection:text-[#C9A05C] transition-colors duration-300">
      {/* Mobile Top Header */}
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

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-black/10 dark:border-[#C9A05C]/25 bg-white/88 dark:bg-[#061a3b]/90 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header with Official Logo */}
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
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#dbb779]">Ruang Kolaborasi Kelas</p>
          </div>
        </div>

        {/* ═══ Theme Switcher Placed Directly Below Brand Logo Header ═══ */}
        <div className="px-5 pt-4 pb-1">
          <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#dbb779]/75">
            Pilihan Tema
          </div>
          <ThemeToggle variant="segmented" className="w-full" />
        </div>

        {/* Navigation Menu */}
        <nav aria-label="Menu Utama" className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#dbb779]/80">
            Menu Navigasi
          </div>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#0A3266]/15 via-[#0A3266]/10 to-[#C9A05C]/15 dark:from-[#C9A05C]/25 dark:via-[#C9A05C]/15 dark:to-[#0A3266]/35 text-[#0A3266] dark:text-[#FBF8F3] border border-[#0A3266]/30 dark:border-[#C9A05C]/50 shadow-lg shadow-[#0A3266]/5"
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
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-[#C9A05C]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Clean Logout Button */}
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

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 p-5 sm:p-8 pt-20 lg:pt-8 min-w-0 overflow-x-hidden">
        <div className="animate-fade-in mx-auto max-w-6xl">{children}</div>
      </main>
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
