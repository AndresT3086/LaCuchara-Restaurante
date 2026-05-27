import Button from "@/components/ui/Button";

interface AdminPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}

export function AdminPage({
  eyebrow,
  title,
  description,
  actions,
  tabs,
  children,
}: AdminPageProps) {
  return (
    <main className="min-h-screen bg-elevated">
      <div className="flex items-center gap-4 border-b border-maiz-3 bg-elevated px-8 py-4">
        <div className="flex items-center gap-2 text-[13px] font-medium text-cafe-3">
          <span>La Cuchara</span>
          <span className="text-cafe-3/60">/</span>
          <span className="font-semibold text-cafe">{title}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden min-w-64 items-center gap-2 rounded-full border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe-3 md:flex">
            <span aria-hidden="true">⌕</span>
            <span>Buscar pedidos, platos, ingredientes...</span>
          </div>
          <Button variant="secondary" size="sm" aria-label="Notificaciones">
            <span aria-hidden="true">!</span>
          </Button>
        </div>
      </div>

      <header className="border-b border-maiz-3 bg-elevated px-8 py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
              {eyebrow}
            </p>
            <h1 className="font-heading text-3xl font-extrabold leading-tight text-cafe">
              {title}
            </h1>
            <p className="mt-1 text-sm text-cafe-2">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {tabs && <div className="mt-5 flex flex-wrap gap-2">{tabs}</div>}
      </header>

      <div className="flex max-w-[1400px] flex-col gap-6 px-8 py-6">{children}</div>
    </main>
  );
}

export function Panel({
  title,
  meta,
  actions,
  children,
  className = "",
}: {
  title: string;
  meta?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-maiz-3 bg-elevated shadow-warm-sm ${className}`}>
      <div className="flex items-center gap-3 border-b border-maiz-3 px-5 py-4">
        <h2 className="font-heading text-lg font-bold text-cafe">{title}</h2>
        {meta && <span className="text-xs text-cafe-3">{meta}</span>}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "blue";
}) {
  const toneClasses = {
    neutral: "bg-maiz-2 text-cafe",
    good: "bg-hoja-soft text-hoja",
    warn: "bg-platano-soft text-[#8A6716]",
    bad: "bg-aji-soft text-aji",
    blue: "bg-denim-soft text-denim",
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-maiz-3 bg-elevated p-4 shadow-warm-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <span className="h-2 w-2 rounded-full bg-current" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cafe-3">
          {label}
        </p>
        <p className="font-heading text-2xl font-extrabold leading-none text-cafe">
          {value}
        </p>
        <p className="mt-1 text-xs text-cafe-3">{detail}</p>
      </div>
    </div>
  );
}

export function FilterPill({
  active,
  children,
  count,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "border-cafe bg-cafe text-maiz"
          : "border-maiz-3 bg-elevated text-cafe-2 hover:bg-maiz-2 hover:text-cafe",
      ].join(" ")}
    >
      {children}
      {typeof count === "number" && (
        <span className={active ? "text-maiz/80" : "text-cafe-3"}>{count}</span>
      )}
    </button>
  );
}
