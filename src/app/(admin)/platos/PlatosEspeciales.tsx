"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Panel } from "@/components/layout/AdminPage";

interface PlatoEspecial {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  maxStock: number;
  disponibleHoy: boolean;
  inicial: string;
}

const MOCK_PLATOS: PlatoEspecial[] = [
  {
    id: 1,
    nombre: "Bandeja paisa",
    descripcion: "Fríjoles, chicharrón, carne molida, chorizo, arroz, huevo y aguacate",
    precio: 28000,
    stock: 12,
    maxStock: 20,
    disponibleHoy: true,
    inicial: "B",
  },
  {
    id: 2,
    nombre: "Trucha al ajillo",
    descripcion: "Trucha dorada, patacón, ensalada fresca y arroz con coco",
    precio: 32000,
    stock: 6,
    maxStock: 12,
    disponibleHoy: true,
    inicial: "T",
  },
  {
    id: 3,
    nombre: "Posta negra cartagenera",
    descripcion: "Posta en salsa negra, arroz con coco y tajadas maduras",
    precio: 26000,
    stock: 0,
    maxStock: 15,
    disponibleHoy: false,
    inicial: "P",
  },
];

function formatCOP(value: number): string {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function parseCOP(raw: string): string {
  return raw.replace(/\D/g, "");
}

interface FormState {
  nombre: string;
  precio: string;
  stock: string;
}

interface FormErrors {
  nombre?: string;
  precio?: string;
  stock?: string;
}

export default function PlatosEspeciales() {
  const [platos, setPlatos] = useState<PlatoEspecial[]>(MOCK_PLATOS);
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>({ nombre: "", precio: "", stock: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setForm({ nombre: "", precio: "", stock: "" });
    setErrors({});
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio";
    if (!form.precio || Number(form.precio) <= 0) next.precio = "Ingresa un precio válido";
    if (form.stock === "" || Number(form.stock) < 0) next.stock = "Ingresa un stock válido";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCrear = async () => {
    if (!validate()) return;
    setCreating(true);
    await new Promise((r) => setTimeout(r, 900));
    const nuevo: PlatoEspecial = {
      id: Date.now(),
      nombre: form.nombre.trim(),
      descripcion: "Especial de la casa disponible por unidades limitadas",
      precio: Number(form.precio),
      stock: Number(form.stock),
      maxStock: Math.max(Number(form.stock), 10),
      disponibleHoy: Number(form.stock) > 0,
      inicial: form.nombre.trim().charAt(0).toUpperCase(),
    };
    setPlatos((prev) => [nuevo, ...prev]);
    setCreating(false);
    setShowDialog(false);
    resetForm();
  };

  const toggleDisponible = (id: number) => {
    setPlatos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, disponibleHoy: !p.disponibleHoy } : p))
    );
  };

  return (
    <>
      <section>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
              Sección 2
            </p>
            <h2 className="font-heading text-2xl font-extrabold text-cafe">Platos especiales</h2>
            <p className="text-sm text-cafe-2">
              Para clientes que quieren salirse del corrientazo: precio individual, stock y disponibilidad.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          >
            Agregar plato especial
          </Button>
        </div>

      <Panel
        title="Carta de especiales"
        meta={`${platos.length} platos · ${platos.filter((plato) => plato.disponibleHoy).length} disponibles hoy`}
        actions={<Button variant="secondary" size="sm">Reordenar</Button>}
      >
        <div>
          {platos.length === 0 ? (
            <p className="text-sm text-cafe/50 text-center py-8">
              No hay platos especiales. Agrega uno para comenzar.
            </p>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Nombre</Th>
                  <Th className="text-right">Precio</Th>
                  <Th>Stock</Th>
                  <Th>Disponible hoy</Th>
                  <Th className="text-right">Acciones</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {platos.map((plato, index) => {
                  const pct = Math.min(100, (plato.stock / plato.maxStock) * 100);
                  const stockTone = plato.stock === 0 ? "bg-aji" : plato.stock <= plato.maxStock * 0.25 ? "bg-platano" : "bg-hoja";

                  return (
                  <TableRow key={plato.id} className={!plato.disponibleHoy ? "opacity-60" : ""}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-heading text-lg font-extrabold text-maiz",
                            index === 0
                              ? "from-achiote to-rojo-ladrillo"
                              : index === 1
                              ? "from-platano to-achiote-dark"
                              : "from-cafe-3 to-cafe",
                          ].join(" ")}
                        >
                          {plato.inicial}
                        </div>
                        <div>
                          <p className="font-heading text-sm font-bold text-cafe">{plato.nombre}</p>
                          <p className="max-w-xl text-xs leading-relaxed text-cafe-3">{plato.descripcion}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-right font-heading text-base font-extrabold text-rojo-ladrillo">
                      {formatCOP(plato.precio)}
                    </Td>
                    <Td>
                      {plato.stock === 0 ? (
                        <Badge variant="bad">Agotado</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-maiz-2">
                            <div className={`h-full ${stockTone}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-heading text-sm font-bold text-cafe">
                            {plato.stock}/{plato.maxStock}
                          </span>
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={plato.disponibleHoy}
                          onClick={() => toggleDisponible(plato.id)}
                          className={[
                            "relative inline-flex h-[22px] w-[38px] flex-shrink-0 cursor-pointer rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rojo-ladrillo",
                            plato.disponibleHoy ? "bg-hoja" : "bg-maiz-3",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "pointer-events-none mt-0.5 inline-block h-[18px] w-[18px] rounded-full bg-elevated shadow transition-transform",
                              plato.disponibleHoy ? "translate-x-4 ml-0.5" : "translate-x-0.5",
                            ].join(" ")}
                          />
                        </button>
                        <span className={plato.disponibleHoy ? "text-xs font-semibold text-hoja" : "text-xs text-cafe-3"}>
                          {plato.disponibleHoy ? "Visible" : "Oculto"}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </Td>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </div>
      </Panel>
      </section>

      <Dialog
        open={showDialog}
        onClose={() => {
          if (!creating) {
            setShowDialog(false);
            resetForm();
          }
        }}
        title="Agregar plato especial"
        confirmLabel="Crear plato"
        cancelLabel="Cancelar"
        onConfirm={handleCrear}
        loading={creating}
      >
        <div className="space-y-4">
          <Input
            label="Nombre del plato"
            placeholder="Ej. Bandeja paisa"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            error={errors.nombre}
          />
          <Input
            label="Precio"
            placeholder="$0"
            value={form.precio ? `$${new Intl.NumberFormat("es-CO").format(Number(form.precio))}` : ""}
            onChange={(e) => {
              const raw = parseCOP(e.target.value.replace(/^\$/, ""));
              setForm((p) => ({ ...p, precio: raw }));
            }}
            error={errors.precio}
          />
          <Input
            label="Stock inicial"
            placeholder="0"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
            error={errors.stock}
          />
        </div>
      </Dialog>
    </>
  );
}
