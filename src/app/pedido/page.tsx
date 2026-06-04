"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch } from "react";
import { useSession } from "@/contexts/SessionContext";

const COMBOS = [
  { id: "completo", nombre: "Completo", descripcion: "Sopa, seco, jugo y postre", precio: 15000 },
  { id: "sin-sopa", nombre: "Sin sopa", descripcion: "Seco, jugo y postre", precio: 13000 },
  { id: "sin-postre", nombre: "Sin postre", descripcion: "Sopa, seco y jugo", precio: 13500 },
  { id: "basico", nombre: "Básico", descripcion: "Seco y jugo", precio: 11000 },
];

const SECOS = ["Pollo a la plancha", "Sobrebarriga en salsa criolla", "Cerdo apanado"];

type ChoiceOption = { value: string; label: string; detail: string };

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function PedidoPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [comboId, setComboId] = useState(COMBOS[0].id);
  const [seco, setSeco] = useState(SECOS[0]);
  const [entrega, setEntrega] = useState<"recoger" | "domicilio">("recoger");
  const [pago, setPago] = useState<"contra_entrega" | "tarjeta">("contra_entrega");

  const combo = COMBOS.find((item) => item.id === comboId) ?? COMBOS[0];
  const domicilio = entrega === "domicilio" ? 4500 : 0;
  const total = combo.precio + domicilio;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?mode=login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-maiz text-cafe">
        <div className="rounded-2xl border border-maiz-3 bg-elevated px-6 py-5 shadow-warm-sm">
          <p className="font-heading text-xl font-extrabold">Validando sesión...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-maiz text-cafe">
      <header className="border-b border-maiz-3 bg-maiz/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-heading text-2xl font-extrabold text-rojo-ladrillo">
            La Cuchara
          </Link>
          <span className="text-sm font-semibold text-cafe-2">{user.name}</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-maiz-3 bg-elevated p-5 shadow-warm-md sm:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">
            Pedido cliente
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-cafe">Arma tu corrientazo</h1>
          <p className="mt-2 text-sm leading-relaxed text-cafe-2">
            Escoge el combo, el seco, la entrega y la forma de pago. La creación final del pedido se conecta al backend de pedidos.
          </p>

          <div className="mt-7 space-y-7">
            <section>
              <h2 className="mb-3 font-heading text-xl font-extrabold">Combo</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {COMBOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setComboId(item.id)}
                    className={[
                      "rounded-xl border p-4 text-left transition",
                      comboId === item.id
                        ? "border-rojo-ladrillo bg-rojo-ladrillo text-maiz"
                        : "border-maiz-3 bg-maiz hover:border-achiote",
                    ].join(" ")}
                  >
                    <span className="block font-heading text-lg font-extrabold">{item.nombre}</span>
                    <span className={comboId === item.id ? "mt-1 block text-sm text-maiz/80" : "mt-1 block text-sm text-cafe-2"}>
                      {item.descripcion}
                    </span>
                    <span className="mt-3 block font-bold">{formatCOP(item.precio)}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-extrabold">Seco</h2>
              <div className="flex flex-wrap gap-2">
                {SECOS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSeco(item)}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold",
                      seco === item ? "border-cafe bg-cafe text-maiz" : "border-maiz-3 bg-maiz text-cafe hover:border-achiote",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <ChoiceGroup
                title="Entrega"
                value={entrega}
                options={[
                  { value: "recoger", label: "Recoger", detail: "Sin costo adicional" },
                  { value: "domicilio", label: "Domicilio", detail: "Costo según distancia" },
                ]}
                onChange={(value) => setEntrega(value as "recoger" | "domicilio")}
              />
              <ChoiceGroup
                title="Pago"
                value={pago}
                options={[
                  { value: "contra_entrega", label: "Contra entrega", detail: "Pagas al recibir" },
                  { value: "tarjeta", label: "Tarjeta", detail: "Stripe pendiente" },
                ]}
                onChange={(value) => setPago(value as "contra_entrega" | "tarjeta")}
              />
            </section>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-maiz-3 bg-cafe p-5 text-maiz shadow-warm-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">Resumen</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold">Tu pedido</h2>
          <div className="mt-5 space-y-3 text-sm">
            <SummaryRow label="Combo" value={combo.nombre} />
            <SummaryRow label="Seco" value={seco} />
            <SummaryRow label="Entrega" value={entrega === "recoger" ? "Recoger" : "Domicilio"} />
            <SummaryRow label="Pago" value={pago === "tarjeta" ? "Tarjeta" : "Contra entrega"} />
          </div>
          <div className="mt-5 border-t border-maiz/15 pt-4">
            <SummaryRow label="Almuerzo" value={formatCOP(combo.precio)} />
            <SummaryRow label="Domicilio" value={formatCOP(domicilio)} />
            <div className="mt-4 flex items-center justify-between font-heading text-2xl font-extrabold">
              <span>Total</span>
              <span className="text-achiote">{formatCOP(total)}</span>
            </div>
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-md bg-achiote px-4 py-3 text-sm font-semibold text-cafe opacity-70"
            disabled
          >
            Confirmar pedido
          </button>
          <p className="mt-3 text-xs leading-relaxed text-maiz/60">
            Falta conectar la confirmación con pedidos, mapas y pagos.
          </p>
        </aside>
      </section>
    </main>
  );
}

function ChoiceGroup({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: ChoiceOption[];
  onChange: Dispatch<string>;
}) {
  return (
    <div>
      <h2 className="mb-3 font-heading text-xl font-extrabold">{title}</h2>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "rounded-xl border px-4 py-3 text-left",
              value === option.value ? "border-achiote bg-achiote/15" : "border-maiz-3 bg-maiz hover:border-achiote",
            ].join(" ")}
          >
            <span className="block font-semibold">{option.label}</span>
            <span className="mt-1 block text-xs text-cafe-2">{option.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-maiz/60">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
