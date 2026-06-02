"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function AuthPage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  const mode: Mode = searchParams?.mode === "register" ? "register" : "login";
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Login exitoso: redirigir al dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-maiz text-cafe">
      <header className="border-b border-maiz-3 bg-maiz/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-achiote/25 bg-achiote/10 text-achiote">
              <svg width="23" height="23" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M18.8 4.2c2 2.1 1.9 5.4-.2 7.4l-4.1 3.9 2.8 2.9 4.1-3.9c3.7-3.5 3.8-9.3.3-12.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M12 15.7l4.2 4.4-8.4 8.1a3 3 0 01-4.2-.1 3 3 0 01.1-4.2l8.3-8.2z" fill="currentColor" opacity=".9" />
              </svg>
            </span>
            <span>
              <span className="block font-heading text-xl font-extrabold leading-none text-rojo-ladrillo">La Cuchara</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-cafe-2">Acceso</span>
            </span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-cafe-2 hover:text-cafe">Carta</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:py-14">
        <div className="hidden lg:block">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
            Cuenta La Cuchara
          </p>
          <h1 className="font-heading text-5xl font-extrabold leading-tight text-cafe">
            Entra y continúa desde tu espacio.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-cafe-2">
            Después de validar tus credenciales, el sistema abre automáticamente la vista que corresponde a tu cuenta.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-maiz-3 bg-elevated shadow-warm-md">
          <div className="border-b border-maiz-3 px-5 py-5 sm:px-6">
            <div className="mb-4 inline-flex rounded-full bg-maiz-2 p-1 text-sm font-semibold">
              <Link
                href="/auth?mode=login"
                className={mode === "login" ? "rounded-full bg-elevated px-4 py-2 text-rojo-ladrillo shadow-warm-sm" : "px-4 py-2 text-cafe-2"}
              >
                Entrar
              </Link>
              <Link
                href="/auth?mode=register"
                className={mode === "register" ? "rounded-full bg-elevated px-4 py-2 text-rojo-ladrillo shadow-warm-sm" : "px-4 py-2 text-cafe-2"}
              >
                Crear cuenta
              </Link>
            </div>

            <h1 className="font-heading text-3xl font-extrabold text-cafe">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h1>
            <p className="mt-1 text-sm text-cafe-2">
              {mode === "login"
                ? "Usa el correo asociado a tu cuenta."
                : "Las cuentas se crean desde el panel de administración."}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                {/* Mensaje de error */}
                {error && (
                  <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm font-medium text-aji">
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="text-sm font-semibold text-cafe">Correo</span>
                  <input
                    className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
                    placeholder="correo@ejemplo.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-cafe">Contraseña</span>
                  <input
                    className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-rojo-ladrillo px-4 py-3 text-sm font-semibold text-maiz hover:bg-rojo-ladrillo-dark disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-maiz/30 border-t-maiz" />
                      Verificando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-maiz-3 bg-maiz p-4 text-sm text-cafe-2">
                  <p className="font-semibold text-cafe mb-1">¿Eres empleado o administrador?</p>
                  <p>Las cuentas internas se crean desde el panel de usuarios. Contacta a un administrador del sistema.</p>
                </div>
                <Link
                  href="/auth?mode=login"
                  className="flex w-full items-center justify-center rounded-md bg-rojo-ladrillo px-4 py-3 text-sm font-semibold text-maiz hover:bg-rojo-ladrillo-dark"
                >
                  Ir a iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}