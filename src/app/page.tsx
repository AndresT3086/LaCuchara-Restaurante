import Link from "next/link";

const MENU_HOY = {
  fecha: "Martes 27 de mayo",
  sopa: "Sopa de lentejas con chorizo y papa criolla",
  secos: ["Pollo asado con guarnición", "Res en salsa criolla"],
  jugo: "Maracuyá con agua de panela",
  postre: "Arroz con leche con canela",
  precios: {
    completo: 18000,
    sinSopa: 15000,
    sinPostre: 14000,
    basico: 12000,
  },
};

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-maiz">
      {/* Header */}
      <header className="border-b border-cafe/10 bg-maiz/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-heading font-bold text-cafe text-xl tracking-tight">
            La Cuchara
          </span>
          <Link
            href="/platos"
            className="text-sm font-medium text-cafe/60 hover:text-cafe transition-colors"
          >
            Panel admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 bg-achiote/15 border border-achiote/25 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-hoja animate-pulse" />
          <span className="text-sm font-medium text-cafe">Menú activo hoy</span>
        </div>
        <h1 className="font-heading font-bold text-cafe text-4xl sm:text-5xl leading-tight mb-3">
          Menú del día
        </h1>
        <p className="text-cafe/60 text-lg font-body">{MENU_HOY.fecha}</p>
      </section>

      {/* Menú del día */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Sopa */}
          <MenuCard
            label="Sopa"
            value={MENU_HOY.sopa}
            color="bg-achiote/10 border-achiote/20"
            dot="bg-achiote"
          />

          {/* Secos */}
          <div className="rounded-xl border bg-hoja/10 border-hoja/20 p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-hoja" />
              <span className="text-xs font-semibold text-hoja uppercase tracking-wide font-heading">
                Secos
              </span>
            </div>
            <ul className="space-y-1.5">
              {MENU_HOY.secos.map((s) => (
                <li key={s} className="text-cafe font-body text-sm leading-snug">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Jugo */}
          <MenuCard
            label="Jugo"
            value={MENU_HOY.jugo}
            color="bg-platano/10 border-platano/20"
            dot="bg-platano"
          />

          {/* Postre */}
          <MenuCard
            label="Postre"
            value={MENU_HOY.postre}
            color="bg-rojo-ladrillo/8 border-rojo-ladrillo/15"
            dot="bg-rojo-ladrillo"
          />
        </div>

        {/* Precios */}
        <div className="bg-cafe rounded-xl p-6">
          <h2 className="font-heading font-semibold text-maiz text-base mb-5">Precios</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { key: "completo", label: "Completo" },
                { key: "sinSopa", label: "Sin sopa" },
                { key: "sinPostre", label: "Sin postre" },
                { key: "basico", label: "Básico" },
              ] as Array<{ key: keyof typeof MENU_HOY.precios; label: string }>
            ).map(({ key, label }) => (
              <div key={key} className="text-center">
                <p className="text-maiz/50 text-xs font-body mb-1">{label}</p>
                <p className="text-maiz font-heading font-bold text-xl">
                  {formatCOP(MENU_HOY.precios[key])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cafe/10 py-6 text-center">
        <p className="text-sm text-cafe/40 font-body">
          La Cuchara · Comida casera colombiana
        </p>
      </footer>
    </div>
  );
}

function MenuCard({
  label,
  value,
  color,
  dot,
}: {
  label: string;
  value: string;
  color: string;
  dot: string;
}) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 ${color}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-xs font-semibold uppercase tracking-wide font-heading text-cafe/70">
          {label}
        </span>
      </div>
      <p className="text-cafe font-body text-sm leading-snug">{value}</p>
    </div>
  );
}
