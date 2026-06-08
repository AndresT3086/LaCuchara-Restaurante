"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

export type SessionUser = {
  id:     string;
  name:   string;
  email:  string;
  role:   "ADMIN" | "USER" | "CLIENTE";
  image?: string | null;
};

interface SessionContextValue {
  user:    SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout:  () => Promise<void>;
}

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

const SessionContext = createContext<SessionContextValue>({
  user:    null,
  loading: true,
  refresh: async () => {},
  logout:  async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reinicia el timer de inactividad con cada interacción del usuario
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Escucha actividad del usuario solo cuando hay sesión activa
  useEffect(() => {
    if (!user) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer(); // Arranca el timer al iniciar sesión

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
