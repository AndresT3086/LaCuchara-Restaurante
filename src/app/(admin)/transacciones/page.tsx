"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

interface Maestro {
  id: string;
  nombre: string;
  unidad: string;
  saldo: number;
  createdAt: string;
  creadoPor: { id: string; name: string; email: string };
}

interface Movimiento {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  nota: string | null;
  fecha: string;
  responsable: { id: string; name: string; email: string };
}

interface SaldoDiario {
  fecha: string;
  saldo: number;
}

type MovimientoForm = {
  tipo: "ENTRADA" | "SALIDA";
  cantidad: string;
};

const initialForm: MovimientoForm = {
  tipo: "ENTRADA",
  cantidad: "",
};

export default function TransaccionesPage() {
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [maestroId, setMaestroId] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [saldosDiarios, setSaldosDiarios] = useState<SaldoDiario[]>([]);

  const [loadingMaestros, setLoadingMaestros] = useState(true);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [errorMaestros, setErrorMaestros] = useState("");
  const [errorMovimientos, setErrorMovimientos] = useState("");

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<MovimientoForm>(initialForm);
  const [formErrors, setFormErrors] = useState<{ cantidad?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const maestroSeleccionado = useMemo(
    () => maestros.find((maestro) => maestro.id === maestroId) ?? null,
    [maestroId, maestros]
  );

  const cargarMaestros = useCallback(async () => {
    setLoadingMaestros(true);
    setErrorMaestros("");

    try {
      const res = await fetch("/api/maestros");
      if (!res.ok) throw new Error();

      const data = await res.json();
      const maestrosData: Maestro[] = data.maestros ?? [];

      setMaestros(maestrosData);
      setMaestroId((actual) => {
        if (actual && maestrosData.some((maestro) => maestro.id === actual)) return actual;
        return maestrosData[0]?.id ?? "";
      });
    } catch {
      setMaestros([]);
      setMaestroId("");
      setErrorMaestros("No se pudieron cargar los maestros.");
    } finally {
      setLoadingMaestros(false);
    }
  }, []);

  const cargarMovimientos = useCallback(async (id: string) => {
    if (!id) {
      setMovimientos([]);
      setSaldosDiarios([]);
      return;
    }

    setLoadingMovimientos(true);
    setErrorMovimientos("");

    try {
      const res = await fetch(`/api/movimientos?maestroId=${id}`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      setMovimientos(data.movimientos ?? []);
      setSaldosDiarios(data.saldosDiarios ?? []);
    } catch {
      setMovimientos([]);
      setSaldosDiarios([]);
      setErrorMovimientos("No se pudieron cargar los movimientos del maestro seleccionado.");
    } finally {
      setLoadingMovimientos(false);
    }
  }, []);

  useEffect(() => {
    cargarMaestros();
  }, [cargarMaestros]);

  useEffect(() => {
    cargarMovimientos(maestroId);
  }, [cargarMovimientos, maestroId]);

  const validarMovimiento = () => {
    const errores: typeof formErrors = {};
    const cantidad = Number(form.cantidad);

    if (!form.cantidad || Number.isNaN(cantidad) || cantidad <= 0) {
      errores.cantidad = "Ingresa una cantidad válida mayor a 0.";
    }

    setFormErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const abrirDialogo = () => {
    setForm(initialForm);
    setFormErrors({});
    setSaveError("");
    setSaveSuccess("");
    setShowDialog(true);
  };

  const cerrarDialogo = () => {
    if (saving) return;
    setShowDialog(false);
  };

  const handleCrearMovimiento = async () => {
    if (!maestroSeleccionado || !validarMovimiento()) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const res = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maestroId: maestroSeleccionado.id,
          tipo: form.tipo,
          cantidad: Number(form.cantidad),
          nota: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "No se pudo crear el movimiento.");
        return;
      }

      await Promise.all([cargarMaestros(), cargarMovimientos(maestroSeleccionado.id)]);
      setSaveSuccess("Movimiento creado correctamente.");

      window.setTimeout(() => {
        setShowDialog(false);
        setForm(initialForm);
        setFormErrors({});
        setSaveSuccess("");
      }, 700);
    } catch {
      setSaveError("Error de conexión al crear el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  const totalEntradas = movimientos
    .filter((movimiento) => movimiento.tipo === "ENTRADA")
    .reduce((total, movimiento) => total + movimiento.cantidad, 0);

  const totalSalidas = movimientos
    .filter((movimiento) => movimiento.tipo === "SALIDA")
    .reduce((total, movimiento) => total + movimiento.cantidad, 0);

  return (
    <AdminPage
      eyebrow="Inventario"
      title="Transacciones"
      description="Consulta y registra movimientos de inventario por Maestro."
      actions={
        <Button size="sm" onClick={abrirDialogo} disabled={!maestroSeleccionado}>
          Agregar movimiento
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Saldo actual" value={maestroSeleccionado ? formatNumber(maestroSeleccionado.saldo) : "0"} detail={maestroSeleccionado?.unidad ?? "sin maestro"} tone="good" />
        <StatCard label="Entradas" value={formatNumber(totalEntradas)} detail="unidades registradas" tone="blue" />
        <StatCard label="Salidas" value={formatNumber(totalSalidas)} detail="unidades registradas" tone="warn" />
      </div>

      <Panel title="Maestro a visualizar" meta="Selecciona el insumo para consultar sus movimientos">
        <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="maestro" className="text-sm font-semibold text-cafe">
              Maestro
            </label>
            <select
              id="maestro"
              value={maestroId}
              onChange={(event) => setMaestroId(event.target.value)}
              disabled={loadingMaestros || maestros.length === 0}
              className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none transition-all focus:border-rojo-ladrillo focus:bg-elevated focus:ring-2 focus:ring-rojo-ladrillo/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {maestros.length === 0 ? (
                <option value="">Sin maestros disponibles</option>
              ) : (
                maestros.map((maestro) => (
                  <option key={maestro.id} value={maestro.id}>
                    {maestro.nombre} ({maestro.unidad})
                  </option>
                ))
              )}
            </select>
            {errorMaestros && <p className="text-xs text-aji">{errorMaestros}</p>}
          </div>

          <div className="rounded-lg border border-maiz-3 bg-maiz px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cafe-3">Maestro seleccionado</p>
            <p className="mt-1 font-heading text-lg font-extrabold text-cafe">
              {maestroSeleccionado?.nombre ?? "Ninguno"}
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title="Evolución de saldos diarios"
        meta={maestroSeleccionado ? `Totales para ${maestroSeleccionado.nombre}` : "Selecciona un maestro"}
      >
        <SaldoChart saldos={saldosDiarios} unidad={maestroSeleccionado?.unidad ?? ""} />
      </Panel>

      <Panel
        title="Movimientos del Maestro"
        meta={maestroSeleccionado ? maestroSeleccionado.nombre : "Sin selección"}
        actions={
          <Button size="sm" variant="secondary" onClick={abrirDialogo} disabled={!maestroSeleccionado}>
            Agregar movimiento
          </Button>
        }
      >
        {errorMovimientos && (
          <div className="border-b border-aji/20 bg-aji/10 px-5 py-3 text-sm text-aji">{errorMovimientos}</div>
        )}

        {loadingMovimientos ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando movimientos...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>ID movimiento</Th>
                <Th>Fecha</Th>
                <Th>Tipo</Th>
                <Th>Cantidad</Th>
                <Th>Responsable</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.length === 0 ? (
                <TableRow>
                  <Td colSpan={5} className="py-8 text-center text-cafe-3">
                    No hay movimientos registrados para este Maestro.
                  </Td>
                </TableRow>
              ) : (
                movimientos.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <Td className="font-mono text-xs text-cafe-2" title={movimiento.id}>
                      {shortId(movimiento.id)}
                    </Td>
                    <Td className="text-xs text-cafe-3">{formatDateTime(movimiento.fecha)}</Td>
                    <Td>
                      <Badge variant={movimiento.tipo === "ENTRADA" ? "good" : "bad"}>
                        {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                      </Badge>
                    </Td>
                    <Td className="font-heading font-bold">
                      {movimiento.tipo === "SALIDA" ? "-" : "+"}
                      {formatNumber(movimiento.cantidad)} {maestroSeleccionado?.unidad}
                    </Td>
                    <Td className="text-cafe-2">{movimiento.responsable.name}</Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Dialog
        open={showDialog}
        onClose={cerrarDialogo}
        title={`Agregar movimiento - ${maestroSeleccionado?.nombre ?? "Maestro"}`}
        confirmLabel="Crear movimiento"
        cancelLabel="Cancelar"
        onConfirm={handleCrearMovimiento}
        loading={saving}
      >
        <div className="space-y-4">
          {maestroSeleccionado && (
            <div className="rounded-lg bg-cafe/5 px-4 py-3 text-sm">
              <p className="text-xs text-cafe/50">Maestro seleccionado</p>
              <p className="font-semibold text-cafe">{maestroSeleccionado.nombre}</p>
              <p className="mt-1 text-cafe-2">
                Saldo actual: {formatNumber(maestroSeleccionado.saldo)} {maestroSeleccionado.unidad}
              </p>
            </div>
          )}

          {saveError && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-lg border border-hoja/30 bg-hoja/10 px-3 py-2 text-sm text-hoja">
              {saveSuccess}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-cafe">Tipo de movimiento</p>
            <div className="flex gap-2">
              {(["ENTRADA", "SALIDA"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm((actual) => ({ ...actual, tipo }))}
                  disabled={saving}
                  className={[
                    "flex-1 rounded-md border py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    form.tipo === tipo
                      ? tipo === "ENTRADA"
                        ? "border-hoja bg-hoja text-white"
                        : "border-aji bg-aji text-white"
                      : "border-maiz-3 bg-transparent text-cafe-2 hover:bg-maiz",
                  ].join(" ")}
                >
                  {tipo === "ENTRADA" ? "Entrada" : "Salida"}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={`Cantidad (${maestroSeleccionado?.unidad ?? "unidades"})`}
            placeholder="0"
            type="number"
            min="0.01"
            step="0.1"
            value={form.cantidad}
            onChange={(event) => setForm((actual) => ({ ...actual, cantidad: event.target.value }))}
            error={formErrors.cantidad}
            disabled={saving}
          />
        </div>
      </Dialog>
    </AdminPage>
  );
}

function SaldoChart({ saldos, unidad }: { saldos: SaldoDiario[]; unidad: string }) {
  if (!saldos.length) {
    return (
      <div className="flex items-center justify-center px-5 py-12 text-sm text-cafe-3">
        No hay datos suficientes para graficar la evolución diaria.
      </div>
    );
  }

  const maxSaldo = Math.max(...saldos.map((saldo) => saldo.saldo), 1);

  return (
    <div className="p-5">
      <div className="flex h-56 items-end gap-2 rounded-lg border border-maiz-3 bg-maiz/50 p-4">
        {saldos.map((saldo) => {
          const height = Math.max((saldo.saldo / maxSaldo) * 100, 4);

          return (
            <div key={saldo.fecha} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-t-md bg-achiote/75 transition-colors group-hover:bg-achiote"
                style={{ height: `${height}%` }}
                aria-label={`Saldo ${formatNumber(saldo.saldo)} ${unidad} el ${saldo.fecha}`}
              />
              <span className="max-w-full origin-top-left -rotate-45 truncate text-[10px] text-cafe-3">
                {formatShortDate(saldo.fecha)}
              </span>
              <div className="absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-cafe px-2 py-1 text-[10px] text-maiz group-hover:block">
                {formatNumber(saldo.saldo)} {unidad}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 10)}...` : id;
}
