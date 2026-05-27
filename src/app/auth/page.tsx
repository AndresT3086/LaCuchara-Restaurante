import Link from "next/link";

type Mode = "login" | "register";
type Role = "cliente" | "empleado" | "admin";

const roleCopy: Record<Role, { title: string; desc: string; href: string; badge: string }> = {
  cliente: {
    title: "Cliente",
    desc: "Ve la carta, arma tu pedido, elige recoger o domicilio y paga online o contra entrega.",
    href: "/",
    badge: "Pedidos",
  },
  empleado: {
    title: "Empleado",
    desc: "Gestiona la cola de pedidos, confirma pagos y avanza estados de cocina.",
    href: "/pedidos",
    badge: "Operación",
  },
  admin: {
    title: "Administrador",
    desc: "Configura menú, especiales, inventario, usuarios y sugerencias con Claude.",
    href: "/dashboard",
    badge: "Panel interno",
  },
};

export default function AuthPage({
  searchParams,
}: {
  searchParams?: { mode?: string; role?: string };
}) {
  const mode: Mode = searchParams?.mode === "register" ? "register" : "login";
  const selectedRole: Role =
    searchParams?.role === "empleado" || searchParams?.role === "admin" ? searchParams.role : "cliente";
  const copy = roleCopy[selectedRole];

  return (
    <main className="min-h-screen bg-maiz text-cafe">
      <header className="border-b border-maiz-3 bg-maiz/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
            Volver a la carta
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </p>
          <h1 className="font-heading text-5xl font-extrabold leading-tight text-cafe">
            Entra según tu rol en La Cuchara.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-cafe-2">
            El acceso separa la experiencia pública del cliente y el sistema interno para empleados y administradores.
          </p>

          <div className="mt-8 grid gap-3">
            {(Object.keys(roleCopy) as Role[]).map((role) => (
              <Link
                key={role}
                href={`/auth?mode=${mode}&role=${role}`}
                className={[
                  "rounded-xl border p-4 transition-colors",
                  selectedRole === role
                    ? "border-rojo-ladrillo bg-rojo-ladrillo/5 shadow-warm-sm"
                    : "border-maiz-3 bg-elevated hover:bg-maiz-2",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-lg font-extrabold text-cafe">{roleCopy[role].title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-cafe-2">{roleCopy[role].desc}</p>
                  </div>
                  <span className="rounded-full bg-achiote/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-achiote-dark">
                    {roleCopy[role].badge}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-maiz-3 bg-elevated shadow-warm-md">
          <div className="bg-gradient-to-r from-cafe to-[#4A2E1F] px-6 py-5 text-maiz">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-achiote">
              {copy.badge}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-extrabold">
              {mode === "login" ? `Acceso ${copy.title.toLowerCase()}` : `Registro ${copy.title.toLowerCase()}`}
            </h2>
            <p className="mt-1 text-sm text-maiz/65">{copy.desc}</p>
          </div>

          <div className="p-6">
            <div className="mb-5 inline-flex rounded-full bg-maiz-2 p-1 text-sm font-semibold">
              <Link
                href={`/auth?mode=login&role=${selectedRole}`}
                className={mode === "login" ? "rounded-full bg-elevated px-4 py-2 text-rojo-ladrillo shadow-warm-sm" : "px-4 py-2 text-cafe-2"}
              >
                Iniciar sesión
              </Link>
              <Link
                href={`/auth?mode=register&role=${selectedRole}`}
                className={mode === "register" ? "rounded-full bg-elevated px-4 py-2 text-rojo-ladrillo shadow-warm-sm" : "px-4 py-2 text-cafe-2"}
              >
                Registrarse
              </Link>
            </div>

            <form className="space-y-4">
              {mode === "register" && (
                <label className="block">
                  <span className="text-sm font-semibold text-cafe">Nombre completo</span>
                  <input className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15" placeholder="Tu nombre" />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-semibold text-cafe">Correo</span>
                <input className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15" placeholder={selectedRole === "cliente" ? "cliente@email.com" : "usuario@lacuchara.co"} type="email" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-cafe">Contraseña</span>
                <input className="mt-1 w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15" placeholder="••••••••" type="password" />
              </label>

              {selectedRole !== "cliente" && (
                <div className="rounded-lg border border-platano/30 bg-platano/10 p-3 text-sm text-cafe-2">
                  Las cuentas internas deben ser aprobadas por un administrador antes de acceder al panel.
                </div>
              )}

              <Link
                href={copy.href}
                className="flex w-full items-center justify-center rounded-md bg-rojo-ladrillo px-4 py-3 text-sm font-semibold text-maiz hover:bg-rojo-ladrillo-dark"
              >
                {mode === "login" ? "Entrar" : "Crear cuenta"}
              </Link>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
