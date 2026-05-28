import Link from "next/link";

type Mode = "login" | "register";

export default function AuthPage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  const mode: Mode = searchParams?.mode === "register" ? "register" : "login";

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
          <Link href="/" className="text-sm font-semibold text-cafe-2 hover:text-cafe">
            Carta
          </Link>
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
                : "Crea una cuenta para pedir más rápido y guardar tus datos."}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <form className="space-y-4">
              {mode === "register" && (
                <label className="block">
                  <span className="text-sm font-semibold text-cafe">Nombre</span>
                  <input className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15" placeholder="Tu nombre" />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-semibold text-cafe">Correo</span>
                <input className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15" placeholder="correo@ejemplo.com" type="email" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-cafe">Contraseña</span>
                <input className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15" placeholder="••••••••" type="password" />
              </label>

              {mode === "register" && (
                <p className="rounded-lg border border-maiz-3 bg-maiz p-3 text-sm text-cafe-2">
                  Las cuentas internas de empleados y administradores se crean desde el panel de usuarios.
                </p>
              )}

              <Link
                href={mode === "login" ? "/dashboard" : "/"}
                className="flex w-full items-center justify-center rounded-md bg-rojo-ladrillo px-4 py-3 text-sm font-semibold text-maiz hover:bg-rojo-ladrillo-dark"
              >
                {mode === "login" ? "Entrar" : "Crear cuenta"}
              </Link>

              {mode === "login" ? (
                <p className="text-center text-sm text-cafe-2">
                  ¿No tienes cuenta?{" "}
                  <Link className="font-semibold text-rojo-ladrillo" href="/auth?mode=register">
                    Crear cuenta
                  </Link>
                </p>
              ) : (
                <p className="text-center text-sm text-cafe-2">
                  ¿Ya tienes cuenta?{" "}
                  <Link className="font-semibold text-rojo-ladrillo" href="/auth?mode=login">
                    Entrar
                  </Link>
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
