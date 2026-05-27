"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";

interface PlatoEspecial {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  disponibleHoy: boolean;
}

const MOCK_PLATOS: PlatoEspecial[] = [
  { id: 1, nombre: "Bandeja paisa", precio: 28000, stock: 12, disponibleHoy: true },
  { id: 2, nombre: "Trucha al ajillo", precio: 32000, stock: 6, disponibleHoy: true },
  { id: 3, nombre: "Posta negra cartagenera", precio: 26000, stock: 0, disponibleHoy: false },
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
      precio: Number(form.precio),
      stock: Number(form.stock),
      disponibleHoy: Number(form.stock) > 0,
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

  const stockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="bad">Agotado</Badge>;
    if (stock <= 3) return <Badge variant="warn">{stock} restantes</Badge>;
    return <Badge variant="good">{stock} unidades</Badge>;
  };

  return (
    <>
      <section className="bg-white rounded-xl border border-cafe/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-cafe/10 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-cafe text-base">Platos especiales</h2>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          >
            Agregar plato
          </Button>
        </div>

        <div className="p-6">
          {platos.length === 0 ? (
            <p className="text-sm text-cafe/50 text-center py-8">
              No hay platos especiales. Agrega uno para comenzar.
            </p>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Nombre</Th>
                  <Th>Precio</Th>
                  <Th>Stock</Th>
                  <Th>Disponible hoy</Th>
                  <Th className="text-right">Acciones</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {platos.map((plato) => (
                  <TableRow key={plato.id}>
                    <Td className="font-medium">{plato.nombre}</Td>
                    <Td>{formatCOP(plato.precio)}</Td>
                    <Td>{stockBadge(plato.stock)}</Td>
                    <Td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={plato.disponibleHoy}
                        onClick={() => toggleDisponible(plato.id)}
                        className={[
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-rojo-ladrillo",
                          plato.disponibleHoy ? "bg-rojo-ladrillo" : "bg-cafe/20",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5",
                            plato.disponibleHoy ? "translate-x-4 ml-0.5" : "translate-x-0.5",
                          ].join(" ")}
                        />
                      </button>
                    </Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
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
