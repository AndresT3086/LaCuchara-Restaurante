"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useRole } from "@/contexts/RoleContext";

type Unidad = "kg" | "g" | "L" | "ml" | "unid" | "porciones";

interface Ingrediente {
  id: number;
  nombre: string;
  stock: number;
  minimo: number;
  unidad: Unidad;
  ultimaActualizacion: string;
}

const MOCK_INGREDIENTES: Ingrediente[] = [
  { id: 1, nombre: "Pollo entero", stock: 4, minimo: 5, unidad: "kg", ultimaActualizacion: "Hoy 08:30" },
  { id: 2, nombre: "Carne de res", stock: 1.5, minimo: 3, unidad: "kg", ultimaActualizacion: "Hoy 08:30" },
  { id: 3, nombre: "Lentejas", stock: 12, minimo: 5, unidad: "kg", ultimaActualizacion: "Ayer" },
  { id: 4, nombre: "Papa criolla", stock: 20, minimo: 8, unidad: "kg", ultimaActualizacion: "Ayer" },
  { id: 5, nombre: "Maracuyá", stock: 3, minimo: 4, unidad: "kg", ultimaActualizacion: "Hoy 07:00" },
  { id: 6, nombre: "Arroz", stock: 25, minimo: 10, unidad: "kg", ultimaActualizacion: "Lunes" },
  { id: 7, nombre: "Leche", stock: 8, minimo: 5, unidad: "L", ultimaActualizacion: "Hoy 08:00" },
  { id: 8, nombre: "Chorizo", stock: 0, minimo: 2, unidad: "kg", ultimaActualizacion: "Lunes" },
  { id: 9, nombre: "Canela en rama", stock: 15, minimo: 3, unidad: "unid", ultimaActualizacion: "La semana pasada" },
  { id: 10, nombre: "Aceite vegetal", stock: 6, minimo: 4, unidad: "L", ultimaActualizacion: "Ayer" },
];

function stockBadge(stock: number, minimo: number) {
  if (stock === 0) return <Badge variant="bad">Agotado</Badge>;
  if (stock < minimo) return <Badge variant="warn">Crítico</Badge>;
  return <Badge variant="good">OK</Badge>;
}

interface FormState {
  nombre: string;
  stock: string;
  minimo: string;
  unidad: Unidad;
}

interface AjusteState {
  ingredienteId: number | null;
  cantidad: string;
  tipo: "agregar" | "restar";
}

export default function InventarioPage() {
  const { role } = useRole();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(MOCK_INGREDIENTES);
  const [showAgregar, setShowAgregar] = useState(false);
  const [showAjuste, setShowAjuste] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    stock: "",
    minimo: "",
    unidad: "kg",
  });
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [ajuste, setAjuste] = useState<AjusteState>({
    ingredienteId: null,
    cantidad: "",
    tipo: "agregar",
  });

  const ingredienteAjuste = ingredientes.find((i) => i.id === ajuste.ingredienteId);

  const resetForm = () => {
    setForm({ nombre: "", stock: "", minimo: "", unidad: "kg" });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      errs.stock = "Ingresa un stock válido";
    if (!form.minimo || isNaN(Number(form.minimo)) || Number(form.minimo) < 0)
      errs.minimo = "Ingresa un mínimo válido";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAgregar = async () => {
    if (!validateForm()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    const nuevo: Ingrediente = {
      id: Date.now(),
      nombre: form.nombre.trim(),
      stock: Number(form.stock),
      minimo: Number(form.minimo),
      unidad: form.unidad,
      ultimaActualizacion: "Ahora",
    };
    setIngredientes((prev) => [nuevo, ...prev]);
    setSaving(false);
    setShowAgregar(false);
    resetForm();
  };

  const handleAjusteConfirm = async () => {
    if (!ajuste.ingredienteId || !ajuste.cantidad) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const delta =
      ajuste.tipo === "agregar"
        ? Number(ajuste.cantidad)
        : -Number(ajuste.cantidad);
    setIngredientes((prev) =>
      prev.map((ing) =>
        ing.id === ajuste.ingredienteId
          ? {
              ...ing,
              stock: Math.max(0, ing.stock + delta),
              ultimaActualizacion: "Ahora",
            }
          : ing
      )
    );
    setSaving(false);
    setShowAjuste(false);
    setAjuste({ ingredienteId: null, cantidad: "", tipo: "agregar" });
  };

  const criticos = ingredientes.filter((i) => i.stock < i.minimo).length;

  return (
    <main className="min-h-screen bg-maiz px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-cafe text-2xl">Inventario</h1>
          <p className="text-sm text-cafe/60 mt-1">
            Ingredientes y stock actual
            {criticos > 0 && (
              <span className="ml-2 text-aji font-medium">
                · {criticos} {criticos === 1 ? "ingrediente crítico" : "ingredientes críticos"}
              </span>
            )}
          </p>
        </div>
        {role === "admin" && (
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowAgregar(true);
            }}
          >
            Agregar ingrediente
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-cafe/15 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <Th>Ingrediente</Th>
              <Th>Stock actual</Th>
              <Th>Mínimo</Th>
              <Th>Estado</Th>
              <Th>Actualizado</Th>
              <Th className="text-right">Acciones</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingredientes.map((ing) => (
              <TableRow key={ing.id}>
                <Td className="font-medium">{ing.nombre}</Td>
                <Td>
                  {ing.stock} {ing.unidad}
                </Td>
                <Td className="text-cafe/50">
                  {ing.minimo} {ing.unidad}
                </Td>
                <Td>{stockBadge(ing.stock, ing.minimo)}</Td>
                <Td className="text-cafe/50 text-xs">{ing.ultimaActualizacion}</Td>
                <Td className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAjuste({ ingredienteId: ing.id, cantidad: "", tipo: "agregar" });
                      setShowAjuste(true);
                    }}
                  >
                    Ajustar stock
                  </Button>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog agregar ingrediente (solo admin) */}
      <Dialog
        open={showAgregar}
        onClose={() => {
          if (!saving) { setShowAgregar(false); resetForm(); }
        }}
        title="Agregar ingrediente"
        confirmLabel="Crear ingrediente"
        cancelLabel="Cancelar"
        onConfirm={handleAgregar}
        loading={saving}
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej. Tomate chonto"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            error={formErrors.nombre}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stock inicial"
              placeholder="0"
              type="number"
              min="0"
              step="0.1"
              value={form.stock}
              onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
              error={formErrors.stock}
            />
            <Input
              label="Stock mínimo"
              placeholder="0"
              type="number"
              min="0"
              step="0.1"
              value={form.minimo}
              onChange={(e) => setForm((p) => ({ ...p, minimo: e.target.value }))}
              error={formErrors.minimo}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-cafe font-body">Unidad</label>
            <select
              value={form.unidad}
              onChange={(e) => setForm((p) => ({ ...p, unidad: e.target.value as Unidad }))}
              className="w-full px-3 py-2 text-sm font-body text-cafe bg-white border border-cafe/20 rounded-md outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/20 transition-colors"
            >
              {(["kg", "g", "L", "ml", "unid", "porciones"] as Unidad[]).map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </Dialog>

      {/* Dialog ajustar stock */}
      <Dialog
        open={showAjuste}
        onClose={() => {
          if (!saving) {
            setShowAjuste(false);
            setAjuste({ ingredienteId: null, cantidad: "", tipo: "agregar" });
          }
        }}
        title={`Ajustar stock — ${ingredienteAjuste?.nombre ?? ""}`}
        confirmLabel="Aplicar ajuste"
        cancelLabel="Cancelar"
        onConfirm={handleAjusteConfirm}
        loading={saving}
      >
        <div className="space-y-4">
          {ingredienteAjuste && (
            <div className="bg-cafe/5 rounded-lg px-4 py-3 flex gap-6 text-sm">
              <div>
                <p className="text-cafe/50 text-xs">Stock actual</p>
                <p className="font-medium text-cafe">
                  {ingredienteAjuste.stock} {ingredienteAjuste.unidad}
                </p>
              </div>
              <div>
                <p className="text-cafe/50 text-xs">Mínimo</p>
                <p className="font-medium text-cafe">
                  {ingredienteAjuste.minimo} {ingredienteAjuste.unidad}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {(["agregar", "restar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAjuste((p) => ({ ...p, tipo: t }))}
                className={[
                  "flex-1 py-2 rounded-md text-sm font-medium font-body border transition-colors",
                  ajuste.tipo === t
                    ? t === "agregar"
                      ? "bg-hoja text-white border-hoja"
                      : "bg-aji text-white border-aji"
                    : "bg-transparent text-cafe/60 border-cafe/20 hover:border-cafe/40",
                ].join(" ")}
              >
                {t === "agregar" ? "Agregar" : "Restar"}
              </button>
            ))}
          </div>
          <Input
            label={`Cantidad a ${ajuste.tipo}`}
            placeholder="0"
            type="number"
            min="0"
            step="0.1"
            value={ajuste.cantidad}
            onChange={(e) => setAjuste((p) => ({ ...p, cantidad: e.target.value }))}
          />
        </div>
      </Dialog>
    </main>
  );
}
