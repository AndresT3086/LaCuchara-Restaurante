"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, type Role } from "@/contexts/RoleContext";

const INGREDIENTES_CRITICOS = 4;

interface NavItem {
  href: string;
  label: string;
  section: "operacion" | "administracion";
  roles: Role[];
  alertCount?: number;
  icon: React.ReactNode;
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 18 18",
  fill: "none",
  "aria-hidden": true,
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    section: "operacion",
    roles: ["admin", "user"],
    icon: (
      <svg {...iconProps}>
        <path d="M2 9L9 2l7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 7.5V15a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    section: "operacion",
    roles: ["admin", "user"],
    icon: (
      <svg {...iconProps}>
        <path d="M3 3h12l-1.5 9H4.5L3 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M6.5 15.5h.01M12.5 15.5h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/platos",
    label: "Platos y menú",
    section: "administracion",
    roles: ["admin"],
    icon: (
      <svg {...iconProps}>
        <path d="M3 10a6 6 0 1112 0H3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M1 10h16M9 4V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/inventario",
    label: "Inventario",
    section: "administracion",
    roles: ["admin", "user"],
    alertCount: INGREDIENTES_CRITICOS,
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    section: "administracion",
    roles: ["admin"],
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/reportes",
    label: "Reportes",
    section: "administracion",
    roles: ["admin"],
    icon: (
      <svg {...iconProps}>
        <path d="M3 14V8l3-3 3 4 3-5 3 2v8H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const roleLabel: Record<Role, string> = {
  admin: "Administrador",
  user: "Empleado",
};

const roleName: Record<Role, string> = {
  admin: "Laura Martinez",
  user: "Carlos Perez",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role, setRole } = useRole();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  const sections = [
    { key: "operacion", label: "Operación" },
    { key: "administracion", label: "Administración" },
  ] as const;

  return (
    <aside className="relative flex min-h-screen w-64 flex-shrink-0 flex-col border-r border-black/20 bg-[#2A1810] text-maiz max-md:min-h-0 max-md:w-full max-md:border-b max-md:border-r-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rojo-ladrillo to-achiote" />

      <div className="flex items-center gap-3 border-b border-maiz/10 px-5 py-5">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-achiote/25 bg-achiote/10 text-achiote"
          aria-label="Ir al inicio"
        >
          <svg width="25" height="25" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M18.8 4.2c2 2.1 1.9 5.4-.2 7.4l-4.1 3.9 2.8 2.9 4.1-3.9c3.7-3.5 3.8-9.3.3-12.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M12 15.7l4.2 4.4-8.4 8.1a3 3 0 01-4.2-.1 3 3 0 01.1-4.2l8.3-8.2z" fill="currentColor" opacity=".9" />
          </svg>
        </Link>
        <Link href="/dashboard" className="min-w-0">
          <p className="font-heading text-[22px] font-extrabold leading-none tracking-normal text-maiz">
            La Cuchara
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#A89478]">
            Cocina oculta
          </p>
        </Link>
      </div>

      <div className="m-4 flex items-center gap-3 rounded-lg border border-maiz/10 bg-maiz/[0.04] p-3 max-md:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-achiote to-rojo-ladrillo font-heading text-sm font-extrabold text-maiz">
          {role === "admin" ? "LM" : "CP"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold leading-tight text-maiz">
            {roleName[role]}
          </p>
          <p className="text-[11px] text-[#A89478]">{roleLabel[role]}</p>
          <span className="mt-1 inline-flex rounded-full bg-achiote px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-cafe">
            Demo
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 max-md:overflow-x-auto max-md:pb-3">
        {sections.map((section) => {
          const items = visibleItems.filter((item) => item.section === section.key);
          if (!items.length) return null;
          return (
            <div key={section.key} className="mb-3 max-md:inline-block max-md:align-top">
              <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A89478]/70 max-md:hidden">
                {section.label}
              </p>
              <div className="space-y-0.5 max-md:flex max-md:gap-2 max-md:space-y-0">
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
                      {item.alertCount && item.alertCount > 0 && (
                        <span className="rounded-full bg-aji px-2 py-0.5 text-[10px] font-bold leading-tight text-maiz">
                          {item.alertCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-maiz/10 p-4 max-md:hidden">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A89478]/70">
          Vista de rol
        </p>
        <div className="flex rounded-full bg-maiz/10 p-1">
          {(["admin", "user"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={[
                "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                role === r ? "bg-maiz text-rojo-ladrillo" : "text-maiz/60 hover:text-maiz",
              ].join(" ")}
            >
              {r === "admin" ? "Admin" : "Empleado"}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
