"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { auth as authApi, ApiError, type User } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Silent refresh interval: 10 minutes
const SILENT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const silentRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  const redirectToLogin = useCallback(() => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login") {
        window.location.href = `/login?from=${encodeURIComponent(currentPath)}&reason=session_expired`;
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await authApi.me();
      setUser(user);
    } catch (err) {
      // api.ts already handles 401 → refresh → retry automatically.
      // If we still get an error here, the refresh has already been attempted
      // and failed, so the session is truly expired.
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        redirectToLogin();
      } else {
        // Network error or other issue — keep current user state if we have one,
        // otherwise set null (could be initial load with no connectivity)
        setUser((prev) => prev);
      }
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  // ── Initial load ──
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Periodic silent token refresh ──
  // Proactively refreshes the token before it expires to prevent 401 storms
  useEffect(() => {
    if (!user) {
      // No user logged in — no need for silent refresh
      if (silentRefreshTimer.current) {
        clearInterval(silentRefreshTimer.current);
        silentRefreshTimer.current = null;
      }
      return;
    }

    silentRefreshTimer.current = setInterval(async () => {
      try {
        await authApi.refresh();
      } catch {
        // Refresh failed — next API call will trigger the full refresh flow
        // in api.ts, which will redirect to login if needed
      }
    }, SILENT_REFRESH_INTERVAL_MS);

    return () => {
      if (silentRefreshTimer.current) {
        clearInterval(silentRefreshTimer.current);
        silentRefreshTimer.current = null;
      }
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout endpoint might fail if token already expired — ignore
    }
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

