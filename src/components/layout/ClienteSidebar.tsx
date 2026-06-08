"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/contexts/SessionContext";

const navItems = [
  {
    href: "/pedido",
    label: "Hacer pedido",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 3h12l-1.5 9H4.5L3 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M6.5 15.5h.01M12.5 15.5h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/historial",
    label: "Mis pedidos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 4h12M3 8h8M3 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Mi perfil",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function ClienteSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout, loading } = useSession();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  return (
    <aside className="relative flex min-h-screen w-64 flex-shrink-0 flex-col border-r border-black/20 bg-[#2A1810] text-maiz max-md:min-h-0 max-md:w-full max-md:border-b max-md:border-r-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rojo-ladrillo to-achiote" />

      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-maiz/10 px-5 py-5">
        <Link href="/pedido" className="flex h-11 w-11 items-center justify-center rounded-xl border border-achiote/25 bg-achiote/10 text-achiote" aria-label="Inicio">
          <svg width="25" height="25" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M18.8 4.2c2 2.1 1.9 5.4-.2 7.4l-4.1 3.9 2.8 2.9 4.1-3.9c3.7-3.5 3.8-9.3.3-12.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M12 15.7l4.2 4.4-8.4 8.1a3 3 0 01-4.2-.1 3 3 0 01.1-4.2l8.3-8.2z" fill="currentColor" opacity=".9" />
          </svg>
        </Link>
        <Link href="/pedido">
          <p className="font-heading text-[22px] font-extrabold leading-none text-maiz">La Cuchara</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#A89478]">Tu pedido</p>
        </Link>
      </div>

      {/* Info del usuario */}
      <div className="m-4 flex items-center gap-3 rounded-lg border border-maiz/10 bg-maiz/[0.04] p-3 max-md:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-achiote to-rojo-ladrillo font-heading text-sm font-extrabold text-maiz">
          {loading ? "…" : initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold leading-tight text-maiz">
            {loading ? "Cargando…" : (user?.name ?? "Cliente")}
          </p>
          <p className="text-[11px] text-[#A89478]">Cliente</p>
          <span className="mt-1 inline-flex rounded-full bg-hoja/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
            CLIENTE
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 max-md:overflow-x-auto max-md:pb-3">
        <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A89478]/70 max-md:hidden">
          Mi cuenta
        </p>
        <div className="space-y-0.5 max-md:flex max-md:gap-2 max-md:space-y-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-rojo-ladrillo font-semibold text-maiz shadow-[0_2px_8px_-2px_rgba(139,26,26,0.5)] before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-achiote"
                    : "text-[#F1E8D3] hover:bg-maiz/[0.06] hover:text-maiz",
                ].join(" ")}
              >
                <span className="shrink-0 opacity-90">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Cerrar sesión */}
      <div className="border-t border-maiz/10 p-4 max-md:hidden">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#F1E8D3] hover:bg-maiz/[0.06] hover:text-maiz transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M7 3H3a1 1 0 00-1 1v10a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 13l4-4-4-4M16 9H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
