import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARJUNA LMS — Forum Diskusi Kelas",
  description:
    "Platform LMS untuk pengumpulan data interaksi dosen-mahasiswa dalam riset ARJUNA-Net",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#070c18] text-[#f0f4fc]">
        {children}
      </body>
    </html>
  );
}
