"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, type Role } from "@/contexts/RoleContext";

const INGREDIENTES_CRITICOS = 2;

interface NavItem {
  href: string;
  label: string;
  roles: Role[];
  alert?: boolean;
  alertCount?: number;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    roles: ["admin", "user"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 9L9 2l7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 7.5V15a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/platos",
    label: "Platos y menú",
    roles: ["admin"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 10a6 6 0 1112 0H3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M1 10h16M9 4V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/inventario",
    label: "Inventario",
    roles: ["admin", "user"],
    alert: true,
    alertCount: INGREDIENTES_CRITICOS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    roles: ["admin", "user"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 3h12l-1.5 9H4.5L3 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="6.5" cy="15.5" r="1" fill="currentColor" />
        <circle cx="12.5" cy="15.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    roles: ["admin"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/reportes",
    label: "Reportes",
    roles: ["admin"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 14V8l3-3 3 4 3-5 3 2v8H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const roleLabel: Record<Role, string> = {
  admin: "Administrador",
  user: "Empleado",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role, setRole } = useRole();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-56 min-h-screen bg-cafe flex flex-col py-6 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 mb-8">
        <Link href="/" className="block">
          <span className="font-heading font-bold text-maiz text-xl tracking-tight">
            La Cuchara
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-body transition-colors relative",
                isActive
                  ? "bg-rojo-ladrillo text-maiz"
                  : "text-maiz/70 hover:text-maiz hover:bg-white/10",
              ].join(" ")}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>

              {item.alert && item.alertCount && item.alertCount > 0 && (
                <span className="ml-auto relative flex items-center justify-center">
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-aji opacity-75 animate-ping-slow" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-aji" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role switcher (demo) */}
      <div className="px-4 pt-4 border-t border-white/10 space-y-2">
        <p className="text-xs text-maiz/40 font-body uppercase tracking-wide">Vista de rol</p>
        <div className="flex gap-1.5">
          {(["admin", "user"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={[
                "flex-1 py-1 rounded text-xs font-medium font-body transition-colors",
                role === r
                  ? "bg-rojo-ladrillo text-maiz"
                  : "bg-white/10 text-maiz/60 hover:bg-white/20 hover:text-maiz",
              ].join(" ")}
            >
              {r === "admin" ? "Admin" : "Empleado"}
            </button>
          ))}
        </div>
        <p className="text-xs text-maiz/30 font-body">{roleLabel[role]}</p>
      </div>
    </aside>
  );
}
