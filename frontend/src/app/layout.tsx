import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARJUNA LMS",
  description:
    "Platform interaktif pembelajaran dan forum diskusi terstruktur untuk dosen dan mahasiswa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={`h-full antialiased ${plusJakartaSans.variable}`}>
      <head>
        {/* Anti-FOUC Theme Init Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('arjuna_theme') || 'system';
                let isDark = true;
                if (storedTheme === 'system') {
                  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                } else {
                  isDark = storedTheme === 'dark';
                }
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans transition-colors duration-300 selection:bg-[#C9A05C]/30 selection:text-[#C9A05C]"
      >
        <ThemeProvider>
          {/* Ambient Brand Glow Background Orbs (Navy & Warm Gold) */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Top Left Navy Glow Orb */}
            <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#0A3266]/50 via-[#124687]/30 to-transparent blur-[140px] dark:opacity-90 opacity-35" />
            {/* Center Right Warm Gold Radiant Orb */}
            <div className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-[#C9A05C]/35 via-[#b38841]/20 to-transparent blur-[140px] dark:opacity-80 opacity-45" />
            {/* Bottom Deep Royal Navy Orb */}
            <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#082450]/60 via-[#0A3266]/40 to-transparent blur-[160px] dark:opacity-90 opacity-35" />
            {/* Subtle grid backdrop pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#C9A05C22_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:opacity-45" />
          </div>

          <div className="relative z-10 flex min-h-full flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
