"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";

type CourseKey = "sopa" | "jugo" | "postre";

interface ToggleItem {
  activo: boolean;
  nombre: string;
}

interface SecoOption {
  id: "pollo" | "res" | "cerdo";
  nombre: string;
  stock: number;
  activo: boolean;
}

interface MenuState {
  sopa: ToggleItem;
  jugo: ToggleItem;
  postre: ToggleItem;
  secoActivo: boolean;
  secos: SecoOption[];
  precios: {
    completo: string;
    sinSopa: string;
    sinPostre: string;
    basico: string;
  };
}

interface Sugerencia {
  sopa: string;
  secos: Array<Pick<SecoOption, "id" | "nombre" | "stock">>;
  jugo: string;
  postre: string;
  precios: MenuState["precios"];
  razon: string;
}

const SUGERENCIA_MOCK: Sugerencia = {
  sopa: "Sopa de plátano verde con costilla",
  secos: [
    { id: "pollo", nombre: "Pollo sudado con champiñones", stock: 24 },
    { id: "res", nombre: "Carne mechada en salsa de tomate", stock: 18 },
    { id: "cerdo", nombre: "Cerdo agridulce con piña", stock: 12 },
  ],
  jugo: "Mora, mango o guanábana",
  postre: "Natilla con coco rallado",
  precios: { completo: "16000", sinSopa: "14000", sinPostre: "14500", basico: "12000" },
  razon:
    "Prioriza pollo, maracuyá y leche porque están próximos a vencerse, mantiene una proteína ganadora de la semana y cambia la combinación para no repetir el menú anterior.",
};

const COURSE_META: Record<CourseKey, { title: string; subtitle: string; placeholder: string; number: string }> = {
  sopa: {
    title: "Sopa del día",
    subtitle: "Se sirve antes del seco",
    placeholder: "Ej. Crema de auyama con cilantro",
    number: "1",
  },
  jugo: {
    title: "Jugo natural",
    subtitle: "En agua o leche",
    placeholder: "Ej. Mora, lulo o maracuyá",
    number: "3",
  },
  postre: {
    title: "Postre",
    subtitle: "Opcional para cerrar el combo",
    placeholder: "Ej. Arroz con leche con canela",
    number: "4",
  },
};

const PRICE_META: Array<{
  key: keyof MenuState["precios"];
  name: string;
  desc: string;
  featured?: boolean;
}> = [
  { key: "completo", name: "Completo", desc: "Sopa · Seco · Jugo · Postre", featured: true },
  { key: "sinSopa", name: "Sin sopa", desc: "Seco · Jugo · Postre" },
  { key: "sinPostre", name: "Sin postre", desc: "Sopa · Seco · Jugo" },
  { key: "basico", name: "Básico", desc: "Seco · Jugo" },
];

function formatCOP(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("es-CO").format(Number(digits));
}

function parseCOP(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export default function MenuDelDia() {
  const [menu, setMenu] = useState<MenuState>({
    sopa: { activo: true, nombre: "Crema de auyama con cilantro" },
    jugo: { activo: true, nombre: "Mora, lulo o maracuyá" },
    postre: { activo: true, nombre: "Arroz con leche con canela" },
    secoActivo: true,
    secos: [
      { id: "pollo", nombre: "Pollo a la plancha", stock: 24, activo: true },
      { id: "res", nombre: "Sobrebarriga en salsa criolla", stock: 18, activo: true },
      { id: "cerdo", nombre: "Cerdo apanado", stock: 12, activo: true },
    ],
    precios: { completo: "15000", sinSopa: "13000", sinPostre: "13500", basico: "11000" },
  });

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | null>(null);
  const [showIA, setShowIA] = useState(false);
  const [applyingIA, setApplyingIA] = useState(false);

  const selectedSecos = menu.secos.filter((seco) => seco.activo);

  const handleGuardar = async () => {
    setSaving(true);
    setSaveResult(null);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaveResult("success");
    setTimeout(() => setSaveResult(null), 3000);
  };

  const handleAplicarSugerencia = async () => {
    setApplyingIA(true);
    await new Promise((r) => setTimeout(r, 700));
    setMenu((prev) => ({
      ...prev,
      sopa: { activo: true, nombre: SUGERENCIA_MOCK.sopa },
      jugo: { activo: true, nombre: SUGERENCIA_MOCK.jugo },
      postre: { activo: true, nombre: SUGERENCIA_MOCK.postre },
      secoActivo: true,
      secos: prev.secos.map((seco) => {
        const suggested = SUGERENCIA_MOCK.secos.find((item) => item.id === seco.id);
        return suggested
          ? { ...seco, nombre: suggested.nombre, stock: suggested.stock, activo: true }
          : { ...seco, activo: false };
      }),
      precios: SUGERENCIA_MOCK.precios,
    }));
    setApplyingIA(false);
    setShowIA(false);
  };

  const toggleCourse = (key: CourseKey) => {
    setMenu((prev) => ({
      ...prev,
      [key]: { ...prev[key], activo: !prev[key].activo },
    }));
  };

  const setCourseName = (key: CourseKey, nombre: string) => {
    setMenu((prev) => ({
      ...prev,
      [key]: { ...prev[key], nombre },
    }));
  };

  const updateSeco = (id: SecoOption["id"], patch: Partial<SecoOption>) => {
    setMenu((prev) => ({
      ...prev,
      secos: prev.secos.map((seco) => (seco.id === id ? { ...seco, ...patch } : seco)),
    }));
  };

  const handlePrecio = (key: keyof MenuState["precios"], value: string) => {
    setMenu((prev) => ({
      ...prev,
      precios: { ...prev.precios, [key]: parseCOP(value) },
    }));
  };

  return (
    <>
      <section>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
              Sección 1
            </p>
            <h2 className="font-heading text-2xl font-extrabold text-cafe">Menú del día</h2>
            <p className="text-sm text-cafe-2">
              Configura el corrientazo que se publica hoy: componentes, secos disponibles y combos.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-maiz-3 bg-elevated shadow-warm-sm">
          <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-cafe to-[#4A2E1F] px-6 py-4 text-maiz">
            <span className="rounded-full bg-achiote px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-cafe">
              Miércoles
            </span>
            <div>
              <p className="font-heading text-base font-bold">Servicio del mediodía</p>
              <p className="text-xs text-maiz/65">27 de mayo, 2026</p>
            </div>
            <span className="ml-auto flex items-center gap-2 text-xs text-maiz/85">
              <span className="h-2 w-2 rounded-full bg-hoja shadow-[0_0_0_4px_rgba(92,122,58,0.3)]" />
              Visible en la carta pública
            </span>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.95fr]">
            <div className="space-y-4 border-b border-maiz-3 p-6 lg:border-b-0 lg:border-r">
              {(Object.keys(COURSE_META) as CourseKey[]).map((key) => {
                const item = menu[key];
                const meta = COURSE_META[key];
                return (
                  <div
                    key={key}
                    className={[
                      "rounded-lg border p-4 transition-all",
                      item.activo ? "border-maiz-3 bg-elevated" : "border-dashed border-maiz-3 bg-maiz opacity-70",
                    ].join(" ")}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rojo-ladrillo/10 font-heading text-sm font-extrabold text-rojo-ladrillo">
                        {meta.number}
                      </span>
                      <div className="flex-1">
                        <p className="font-heading text-base font-bold text-cafe">{meta.title}</p>
                        <p className="text-xs text-cafe-3">{meta.subtitle}</p>
                      </div>
                      <Switch checked={item.activo} onClick={() => toggleCourse(key)} />
                    </div>
                    <input
                      className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none transition-all placeholder:text-cafe-3 focus:border-rojo-ladrillo focus:bg-elevated focus:ring-2 focus:ring-rojo-ladrillo/15 disabled:opacity-50"
                      placeholder={meta.placeholder}
                      value={item.nombre}
                      disabled={!item.activo}
                      onChange={(e) => setCourseName(key, e.target.value)}
                    />
                  </div>
                );
              })}

              <div className={["rounded-lg border p-4 transition-all", menu.secoActivo ? "border-maiz-3 bg-elevated" : "border-dashed border-maiz-3 bg-maiz opacity-70"].join(" ")}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rojo-ladrillo/10 font-heading text-sm font-extrabold text-rojo-ladrillo">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-heading text-base font-bold text-cafe">Seco · escoge uno</p>
                    <p className="text-xs text-cafe-3">Todos van con arroz, ensalada, tajada y principio</p>
                  </div>
                  <Switch
                    checked={menu.secoActivo}
                    onClick={() => setMenu((prev) => ({ ...prev, secoActivo: !prev.secoActivo }))}
                  />
                </div>

                <div className="space-y-2">
                  {menu.secos.map((seco) => (
                    <div
                      key={seco.id}
                      className={[
                        "grid gap-2 rounded-md border p-2 transition-colors sm:grid-cols-[auto_1fr_92px]",
                        seco.activo ? "border-hoja bg-hoja/10" : "border-maiz-3 bg-maiz",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        disabled={!menu.secoActivo}
                        onClick={() => updateSeco(seco.id, { activo: !seco.activo })}
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold",
                          seco.activo ? "border-hoja bg-hoja text-maiz" : "border-maiz-3 bg-elevated text-cafe-3",
                        ].join(" ")}
                        aria-label={`Activar ${seco.id}`}
                      >
                        {seco.activo ? "✓" : ""}
                      </button>
                      <input
                        className="rounded-md border border-maiz-3 bg-elevated px-3 py-2 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15 disabled:opacity-50"
                        value={seco.nombre}
                        disabled={!menu.secoActivo}
                        onChange={(e) => updateSeco(seco.id, { nombre: e.target.value })}
                      />
                      <label className="flex items-center gap-1 rounded-md bg-maiz px-2">
                        <input
                          className="w-full bg-transparent text-right font-heading text-sm font-bold text-cafe outline-none disabled:opacity-50"
                          type="number"
                          min={0}
                          value={seco.stock}
                          disabled={!menu.secoActivo}
                          onChange={(e) => updateSeco(seco.id, { stock: Number(e.target.value) })}
                        />
                        <span className="text-[10px] font-semibold text-cafe-3">porc.</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-maiz p-6">
              <div>
                <p className="font-heading text-lg font-bold text-cafe">Precios de los combos</p>
                <p className="text-sm text-cafe-2">En pesos colombianos.</p>
              </div>

              <div className="space-y-3">
                {PRICE_META.map((price) => (
                  <div
                    key={price.key}
                    className={[
                      "grid gap-3 rounded-lg border bg-elevated p-3 sm:grid-cols-[110px_1fr_120px] sm:items-center",
                      price.featured ? "border-achiote shadow-[0_0_0_1px_var(--achiote)]" : "border-maiz-3",
                    ].join(" ")}
                  >
                    <div className="font-heading text-sm font-bold text-cafe">
                      {price.name}
                      {price.featured && (
                        <span className="ml-2 rounded-full bg-achiote px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-cafe">
                          Más pedido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cafe-3">{price.desc}</p>
                    <label className="flex items-center overflow-hidden rounded-md border border-maiz-3 bg-elevated focus-within:border-rojo-ladrillo focus-within:ring-2 focus-within:ring-rojo-ladrillo/15">
                      <span className="px-3 font-heading text-sm font-bold text-cafe-3">$</span>
                      <input
                        className="w-full bg-transparent py-2 pr-3 text-right font-heading text-base font-extrabold text-cafe outline-none"
                        value={formatCOP(menu.precios[price.key])}
                        onChange={(e) => handlePrecio(price.key, e.target.value)}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-dashed border-achiote bg-gradient-to-br from-rojo-ladrillo/5 to-achiote/5 p-4">
                <div className="flex-1">
                  <p className="font-heading text-sm font-bold text-cafe">¿Sin idea de qué cocinar hoy?</p>
                  <p className="mt-1 text-xs leading-relaxed text-cafe-2">
                    Claude sugiere un menú con ingredientes por vencer, ventas de la semana y combinaciones no repetidas.
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowIA(true)}>Sugerir con Claude</Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-maiz-3 bg-elevated px-6 py-4">
            <span className="flex items-center gap-2 text-xs text-cafe-3">
              <span className="h-1.5 w-1.5 rounded-full bg-hoja" />
              {selectedSecos.length} secos activos · cambios listos para publicar
            </span>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm">Descartar cambios</Button>
              <Button onClick={handleGuardar} loading={saving}>Publicar menú</Button>
            </div>
            {saveResult === "success" && <p className="text-sm font-medium text-hoja">Menú publicado correctamente</p>}
          </div>
        </div>
      </section>

      <Dialog
        open={showIA}
        onClose={() => setShowIA(false)}
        title="Sugerencia inteligente del menú"
        confirmLabel="Aplicar sugerencia"
        cancelLabel="Cerrar"
        onConfirm={handleAplicarSugerencia}
        loading={applyingIA}
      >
        <div className="space-y-4 text-sm text-cafe">
          <div className="space-y-3">
            <Row label="Sopa sugerida" value={SUGERENCIA_MOCK.sopa} />
            <Row label="Secos sugeridos" value={SUGERENCIA_MOCK.secos.map((s) => s.nombre).join(" · ")} />
            <Row label="Jugo sugerido" value={SUGERENCIA_MOCK.jugo} />
            <Row label="Postre sugerido" value={SUGERENCIA_MOCK.postre} />
          </div>
          <div className="rounded-lg border border-achiote/20 bg-achiote/10 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-achiote-dark">
              Por qué esta sugerencia
            </p>
            <p className="leading-relaxed text-cafe-2">{SUGERENCIA_MOCK.razon}</p>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function Switch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={[
        "relative inline-flex h-[22px] w-[38px] shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rojo-ladrillo",
        checked ? "bg-hoja" : "bg-maiz-3",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none mt-0.5 inline-block h-[18px] w-[18px] rounded-full bg-elevated shadow transition-transform",
          checked ? "translate-x-4 ml-0.5" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-cafe-3">{label}</p>
      <p className="font-medium text-cafe">{value}</p>
    </div>
  );
}
