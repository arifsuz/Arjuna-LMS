"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  MessageSquare,
  Database,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";

function AppShellInner({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070c18]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      href: "/dashboard/courses",
      label: "Kelas Saya",
      icon: GraduationCap,
      visible: !isAdmin,
    },
    {
      href: "/dashboard/admin/users",
      label: "Kelola User",
      icon: Users,
      visible: isAdmin,
    },
    {
      href: "/dashboard/admin/courses",
      label: "Kelola Kelas",
      icon: GraduationCap,
      visible: isAdmin,
    },
    {
      href: "/dashboard/admin/dataset",
      label: "Dataset & Ekspor",
      icon: Database,
      visible: isAdmin,
    },
  ].filter((item) => item.visible);

  const roleLabel =
    user.role === "ADMIN"
      ? "Administrator"
      : user.role === "LECTURER"
        ? "Dosen"
        : "Mahasiswa";

  const roleBadgeStyle =
    user.role === "ADMIN"
      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
      : user.role === "LECTURER"
        ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
        : "bg-blue-500/15 text-blue-400 border border-blue-500/30";

  return (
    <div className="flex min-h-screen bg-[#070c18] text-slate-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-slate-800 bg-[#0e1726]/95 backdrop-blur-md">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 shadow-md shadow-blue-500/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">
              ARJUNA <span className="text-blue-400">LMS</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-900/60 p-3 border border-slate-800/50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{user.name}</p>
              <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="ml-64 flex-1 p-8">
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
