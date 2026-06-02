"use client";

// contexts/SessionContext.tsx
// Guarda el usuario con sesión activa y lo comparte en toda la app.
// Cualquier componente puede llamar useSession() para saber quién está logueado.

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  image?: string | null;
};

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  // Llama esto después de login para actualizar el contexto
  refresh: () => Promise<void>;
  // Llama esto al cerrar sesión
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar el contexto, preguntamos al backend quién está logueado
  const refresh = async () => {
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
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
