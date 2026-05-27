"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useRole } from "@/contexts/RoleContext";
import { AdminPage, FilterPill, Panel, StatCard } from "@/components/layout/AdminPage";

type Unidad = "kg" | "g" | "L" | "ml" | "unid" | "porciones";

interface Ingrediente {
  id: number;
  nombre: string;
  stock: number;
  minimo: number;
  unidad: Unidad;
  venceEnDias: number;
  categoria: string;
  ultimaActualizacion: string;
}

const MOCK_INGREDIENTES: Ingrediente[] = [
  { id: 1, nombre: "Pollo entero", stock: 4, minimo: 5, unidad: "kg", venceEnDias: 1, categoria: "Proteína", ultimaActualizacion: "Hoy 08:30" },
  { id: 2, nombre: "Carne de res", stock: 1.5, minimo: 3, unidad: "kg", venceEnDias: 3, categoria: "Proteína", ultimaActualizacion: "Hoy 08:30" },
  { id: 3, nombre: "Lentejas", stock: 12, minimo: 5, unidad: "kg", venceEnDias: 40, categoria: "Grano", ultimaActualizacion: "Ayer" },
  { id: 4, nombre: "Papa criolla", stock: 20, minimo: 8, unidad: "kg", venceEnDias: 5, categoria: "Verdura", ultimaActualizacion: "Ayer" },
  { id: 5, nombre: "Maracuyá", stock: 3, minimo: 4, unidad: "kg", venceEnDias: 2, categoria: "Fruta", ultimaActualizacion: "Hoy 07:00" },
  { id: 6, nombre: "Arroz", stock: 25, minimo: 10, unidad: "kg", venceEnDias: 90, categoria: "Grano", ultimaActualizacion: "Lunes" },
  { id: 7, nombre: "Leche", stock: 8, minimo: 5, unidad: "L", venceEnDias: 1, categoria: "Lácteo", ultimaActualizacion: "Hoy 08:00" },
  { id: 8, nombre: "Chorizo", stock: 0, minimo: 2, unidad: "kg", venceEnDias: 0, categoria: "Proteína", ultimaActualizacion: "Lunes" },
  { id: 9, nombre: "Canela en rama", stock: 15, minimo: 3, unidad: "unid", venceEnDias: 180, categoria: "Condimento", ultimaActualizacion: "La semana pasada" },
  { id: 10, nombre: "Aceite vegetal", stock: 6, minimo: 4, unidad: "L", venceEnDias: 120, categoria: "Despensa", ultimaActualizacion: "Ayer" },
];

function stockBadge(stock: number, minimo: number) {
  if (stock === 0) return <Badge variant="bad">Agotado</Badge>;
  if (stock < minimo) return <Badge variant="warn">Crítico</Badge>;
  return <Badge variant="good">OK</Badge>;
}

function vencimientoBadge(dias: number) {
  if (dias <= 0) return <Badge variant="bad">Vence hoy</Badge>;
  if (dias <= 2) return <Badge variant="bad">{dias} día{dias === 1 ? "" : "s"}</Badge>;
  if (dias <= 5) return <Badge variant="warn">{dias} días</Badge>;
  return <Badge variant="good">{dias} días</Badge>;
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
      venceEnDias: 14,
      categoria: "Sin categoría",
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
  const agotados = ingredientes.filter((i) => i.stock === 0).length;
  const porVencer = ingredientes.filter((i) => i.venceEnDias <= 2).length;
  const saludables = ingredientes.filter((i) => i.stock >= i.minimo && i.venceEnDias > 5).length;

  return (
    <AdminPage
      eyebrow="Administración"
      title="Inventario"
      description="Stock, mínimos y vencimientos para decidir compras y sugerencias del menú."
      actions={
        role === "admin" ? (
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowAgregar(true);
            }}
          >
            Agregar ingrediente
          </Button>
        ) : null
      }
      tabs={
        <>
          <FilterPill active count={ingredientes.length}>Todos</FilterPill>
          <FilterPill count={criticos}>Críticos</FilterPill>
          <FilterPill count={porVencer}>Por vencer</FilterPill>
          <FilterPill count={agotados}>Agotados</FilterPill>
        </>
      }
    >
      {criticos > 0 && (
        <div className="flex items-center gap-4 overflow-hidden rounded-lg border border-aji/25 border-l-4 border-l-aji bg-gradient-to-r from-aji/10 to-aji/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aji text-maiz">
            !
          </div>
          <div className="flex-1">
            <p className="font-heading text-base font-bold text-cafe">
              {criticos} ingredientes necesitan atención
            </p>
            <p className="text-sm text-cafe-2">
              Pollo, res, maracuyá y chorizo pueden afectar el menú del día si no se ajustan.
            </p>
          </div>
          <Button variant="danger" size="sm">Revisar compras</Button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingredientes" value={String(ingredientes.length)} detail="registrados" />
        <StatCard label="Críticos" value={String(criticos)} detail="bajo mínimo" tone="bad" />
        <StatCard label="Por vencer" value={String(porVencer)} detail="en 48 horas" tone="warn" />
        <StatCard label="Saludables" value={String(saludables)} detail="stock y fecha OK" tone="good" />
      </div>

      {/* Tabla */}
      <Panel title="Ingredientes" meta="Ordenado por urgencia operativa">
        <Table>
          <TableHead>
            <TableRow>
              <Th>Ingrediente</Th>
              <Th>Categoría</Th>
              <Th>Stock actual</Th>
              <Th>Mínimo</Th>
              <Th>Vencimiento</Th>
              <Th>Estado</Th>
              <Th>Actualizado</Th>
              <Th className="text-right">Acciones</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingredientes.map((ing) => (
              <TableRow key={ing.id}>
                <Td className="font-semibold">{ing.nombre}</Td>
                <Td className="text-cafe-2">{ing.categoria}</Td>
                <Td>
                  {ing.stock} {ing.unidad}
                </Td>
                <Td className="text-cafe-3">
                  {ing.minimo} {ing.unidad}
                </Td>
                <Td>{vencimientoBadge(ing.venceEnDias)}</Td>
                <Td>{stockBadge(ing.stock, ing.minimo)}</Td>
                <Td className="text-cafe-3 text-xs">{ing.ultimaActualizacion}</Td>
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
      </Panel>

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
              className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm font-body text-cafe outline-none transition-all focus:border-rojo-ladrillo focus:bg-elevated focus:ring-2 focus:ring-rojo-ladrillo/15"
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
    </AdminPage>
  );
}
