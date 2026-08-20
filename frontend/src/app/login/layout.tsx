"use client";

import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
