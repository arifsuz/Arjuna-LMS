"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogIn, AlertCircle, Sparkles, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Kombinasi email atau kata sandi belum sesuai. Silakan periksa kembali.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-12 overflow-hidden">
      {/* Top Right Floating Theme Switcher */}
      <div className="absolute top-5 right-5 z-30">
        <ThemeToggle />
      </div>

      {/* Clear & Vivid Campus Background Image with Adaptive Mode Tints */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/bg.png"
          alt="Suasana Kampus Perkuliahan Arjuna LMS"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-100 transition-all duration-700 opacity-95 dark:opacity-20 dark:brightness-[0.4] dark:contrast-[1.2]"
        />

        {/* Dark Mode: Deep Midnight Royal Navy Overlays */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-[#030d1d]/90 via-[#061a3b]/85 to-[#030d1d]/95" />
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(3,13,29,0.85)_100%)]" />

        {/* Light Mode: Soft Warm Ivory Atmosphere Overlays */}
        <div className="block dark:hidden absolute inset-0 bg-gradient-to-b from-[#FBF8F3]/60 via-[#FBF8F3]/25 to-[#FBF8F3]/50" />
        <div className="block dark:hidden absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgba(251,248,243,0.65)_100%)]" />

        {/* Ambient Brand Color Glows */}
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-[#0A3266]/30 dark:bg-[#0A3266]/70 blur-[120px] pointer-events-none transition-all" />
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-[#C9A05C]/20 dark:bg-[#C9A05C]/35 blur-[120px] pointer-events-none transition-all" />
      </div>

      {/* Login Container with Frosted Glass Border Halo */}
      <div className="animate-fade-in relative z-10 w-full max-w-md my-auto">
        {/* Brand Header with Official Logo */}
        <header className="mb-5 text-center">
          <div className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/95 dark:bg-[#061a3b]/90 p-2 shadow-2xl shadow-black/15 dark:shadow-black/60 ring-2 ring-[#C9A05C]/60 dark:ring-[#C9A05C]/80 backdrop-blur-xl transition-all">
            <Image
              src="/images/logo.jpg"
              alt="Logo Arjuna LMS"
              width={72}
              height={72}
              priority
              className="h-full w-full object-contain rounded-2xl"
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#0A3266] to-[#C9A05C] text-white shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A3266] dark:text-[#FBF8F3] drop-shadow-md">
            ARJUNA <span className="bg-gradient-to-r from-[#0A3266] via-[#1b5ba8] to-[#C9A05C] dark:from-[#C9A05C] dark:via-[#ebd09e] dark:to-[#FBF8F3] bg-clip-text text-transparent">LMS</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-[#ebd09e] font-semibold drop-shadow-sm">
            Ruang Kolaborasi & Forum Diskusi Perkuliahan
          </p>
        </header>

        {/* ═══ Frosted Glass Halo Edge Wrapper (Gaussian Blur Effect on Form Edges) ═══ */}
        <div className="rounded-[36px] p-2 sm:p-2.5 backdrop-blur-2xl bg-white/40 dark:bg-[#0A3266]/30 border border-white/60 dark:border-[#C9A05C]/40 shadow-[0_20px_50px_rgba(10,50,102,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] transition-all">
          {/* Inner Ultra-Translucent Glass Card */}
          <section
            aria-label="Formulir Masuk"
            className="relative overflow-hidden rounded-[28px] p-6 sm:p-7 backdrop-blur-3xl bg-white/90 dark:bg-[#061a3b]/85 border border-white/80 dark:border-[#C9A05C]/30 shadow-xl transition-all"
          >
            {/* Top golden light reflection */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A05C]/70 to-transparent" />

            <div className="mb-5">
              <h2 className="text-center text-xl font-bold text-[#0A3266] dark:text-[#FBF8F3]">Selamat Datang</h2>
              <p className="mt-1 text-center text-xs text-slate-600 dark:text-[#ebd09e]/85 leading-relaxed font-medium">
                Masuk dengan akun anda untuk mengakses ruang kelas Anda.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/20 p-3.5 text-xs font-semibold text-red-700 dark:text-red-200 backdrop-blur-md animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 ml-1 block text-xs font-bold uppercase tracking-wider text-[#0A3266] dark:text-[#ebd09e]"
                >
                  Alamat Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@arjuna-lms.ac.id"
                  required
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400 font-medium"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 ml-1 block text-xs font-bold uppercase tracking-wider text-[#0A3266] dark:text-[#ebd09e]"
                >
                  Kata Sandi
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Anda"
                  required
                  minLength={6}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder-slate-400 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Memverifikasi Akun...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span>Masuk ke Ruang Belajar</span>
                  </>
                )}
              </button>
            </form>

            {/* Assistance Footer */}
            <div className="mt-5 pt-4 border-t border-black/10 dark:border-[#C9A05C]/20 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0A3266] dark:text-[#C9A05C]">
                <GraduationCap className="h-4 w-4" />
                <span>Portal Akses Dosen & Mahasiswa</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-[#ebd09e]/80 font-medium">
                Belum memiliki akun atau butuh bantuan login? <br /> Silakan hubungi pengelola ARJUNA LMS.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
