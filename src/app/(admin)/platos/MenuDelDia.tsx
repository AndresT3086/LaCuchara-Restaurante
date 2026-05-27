"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dialog from "@/components/ui/Dialog";

type Seco = "pollo" | "res" | "cerdo";
type ToggleKey = "sopa" | "jugo" | "postre";

interface ToggleItem {
  activo: boolean;
  nombre: string;
}

interface MenuState {
  sopa: ToggleItem;
  jugo: ToggleItem;
  postre: ToggleItem;
  secos: Record<Seco, boolean>;
  precios: {
    completo: string;
    sinSopa: string;
    sinPostre: string;
    basico: string;
  };
}

interface Sugerencia {
  sopa: string;
  secos: string[];
  jugo: string;
  postre: string;
  razon: string;
}

const SUGERENCIA_MOCK: Sugerencia = {
  sopa: "Sopa de lentejas con chorizo y papa criolla",
  secos: ["pollo", "res"],
  jugo: "Maracuyá con agua de panela",
  postre: "Arroz con leche con canela",
  razon:
    "Basado en el inventario disponible y los platos más pedidos el martes. El pollo y la res tienen buena rotación. El maracuyá está en temporada y el arroz con leche es el postre favorito de tus clientes.",
};

const TOGGLE_ITEMS: Array<{ key: ToggleKey; label: string }> = [
  { key: "sopa", label: "Sopa" },
  { key: "jugo", label: "Jugo" },
  { key: "postre", label: "Postre" },
];

const PRECIO_ITEMS: Array<{ key: keyof MenuState["precios"]; label: string }> = [
  { key: "completo", label: "Completo" },
  { key: "sinSopa", label: "Sin sopa" },
  { key: "sinPostre", label: "Sin postre" },
  { key: "basico", label: "Básico" },
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
    sopa: { activo: true, nombre: "" },
    jugo: { activo: true, nombre: "" },
    postre: { activo: true, nombre: "" },
    secos: { pollo: false, res: false, cerdo: false },
    precios: { completo: "", sinSopa: "", sinPostre: "", basico: "" },
  });

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [showIA, setShowIA] = useState(false);
  const [applyingIA, setApplyingIA] = useState(false);

  const handlePrecio = (key: keyof MenuState["precios"], value: string) => {
    setMenu((prev) => ({
      ...prev,
      precios: { ...prev.precios, [key]: parseCOP(value) },
    }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    setSaveResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    setSaveResult("success");
    setTimeout(() => setSaveResult(null), 3000);
  };

  const handleAplicarSugerencia = async () => {
    setApplyingIA(true);
    await new Promise((r) => setTimeout(r, 800));
    setMenu((prev) => ({
      ...prev,
      sopa: { activo: true, nombre: SUGERENCIA_MOCK.sopa },
      jugo: { activo: true, nombre: SUGERENCIA_MOCK.jugo },
      postre: { activo: true, nombre: SUGERENCIA_MOCK.postre },
      secos: {
        pollo: SUGERENCIA_MOCK.secos.includes("pollo"),
        res: SUGERENCIA_MOCK.secos.includes("res"),
        cerdo: SUGERENCIA_MOCK.secos.includes("cerdo"),
      },
    }));
    setApplyingIA(false);
    setShowIA(false);
  };

  const toggleSeco = (seco: Seco) => {
    setMenu((prev) => ({
      ...prev,
      secos: { ...prev.secos, [seco]: !prev.secos[seco] },
    }));
  };

  const toggleItem = (key: ToggleKey) => {
    setMenu((prev) => ({
      ...prev,
      [key]: { ...prev[key], activo: !prev[key].activo },
    }));
  };

  const setItemNombre = (key: ToggleKey, nombre: string) => {
    setMenu((prev) => ({
      ...prev,
      [key]: { ...prev[key], nombre },
    }));
  };

  return (
    <>
      <section className="bg-white rounded-xl border border-cafe/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-cafe/10 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-cafe text-base">Menú del día</h2>
          <Button size="sm" onClick={() => setShowIA(true)}>
            Sugerir menú con IA ✨
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sopa, Jugo, Postre */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TOGGLE_ITEMS.map(({ key, label }) => {
              const item = menu[key];
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.activo}
                      onClick={() => toggleItem(key)}
                      className={[
                        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-rojo-ladrillo",
                        item.activo ? "bg-rojo-ladrillo" : "bg-cafe/20",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5",
                          item.activo ? "translate-x-4 ml-0.5" : "translate-x-0.5",
                        ].join(" ")}
                      />
                    </button>
                    <span className="text-sm font-medium text-cafe">{label}</span>
                  </div>
                  <Input
                    placeholder={`Nombre del ${label.toLowerCase()}`}
                    value={item.nombre}
                    disabled={!item.activo}
                    onChange={(e) => setItemNombre(key, e.target.value)}
                    className={!item.activo ? "opacity-40" : ""}
                  />
                </div>
              );
            })}
          </div>

          {/* Secos */}
          <div>
            <p className="text-sm font-medium text-cafe mb-2">Secos disponibles</p>
            <div className="flex gap-6">
              {(["pollo", "res", "cerdo"] as Seco[]).map((seco) => (
                <label key={seco} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menu.secos[seco]}
                    onChange={() => toggleSeco(seco)}
                    className="w-4 h-4 rounded border-cafe/30 accent-[#8B1A1A] cursor-pointer"
                  />
                  <span className="text-sm text-cafe capitalize">{seco}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Precios */}
          <div>
            <p className="text-sm font-medium text-cafe mb-3">Precios</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {PRECIO_ITEMS.map(({ key, label }) => (
                <Input
                  key={key}
                  label={label}
                  placeholder="$0"
                  value={menu.precios[key] ? `$${formatCOP(menu.precios[key])}` : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^\$/, "");
                    handlePrecio(key, raw);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 pt-2 border-t border-cafe/10">
            <Button onClick={handleGuardar} loading={saving}>
              Guardar menú
            </Button>
            {saveResult === "success" && (
              <p className="text-sm text-hoja font-medium">Menú guardado correctamente</p>
            )}
            {saveResult === "error" && (
              <p className="text-sm text-aji font-medium">Error al guardar. Intenta de nuevo.</p>
            )}
          </div>
        </div>
      </section>

      {/* Dialog IA */}
      <Dialog
        open={showIA}
        onClose={() => setShowIA(false)}
        title="Sugerencia de menú con IA ✨"
        confirmLabel="Aplicar sugerencia"
        cancelLabel="Cerrar"
        onConfirm={handleAplicarSugerencia}
        loading={applyingIA}
      >
        <div className="space-y-4 text-sm text-cafe">
          <div className="space-y-3">
            <Row label="Sopa sugerida" value={SUGERENCIA_MOCK.sopa} />
            <Row
              label="Secos sugeridos"
              value={SUGERENCIA_MOCK.secos.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ")}
            />
            <Row label="Jugo sugerido" value={SUGERENCIA_MOCK.jugo} />
            <Row label="Postre sugerido" value={SUGERENCIA_MOCK.postre} />
          </div>
          <div className="bg-achiote/10 border border-achiote/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-achiote uppercase tracking-wide mb-1">
              Por qué esta sugerencia
            </p>
            <p className="text-cafe/80 leading-relaxed">{SUGERENCIA_MOCK.razon}</p>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-cafe/50 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-cafe font-medium">{value}</p>
    </div>
  );
}
