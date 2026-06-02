"use client";

import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useSession } from "@/contexts/SessionContext";
import { AdminPage, FilterPill, Panel, StatCard } from "@/components/layout/AdminPage";

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function InventarioPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "ADMIN";

  // Estado de maestros
  const [maestros, setMaestros]       = useState<Maestro[]>([]);
  const [loadingMaestros, setLoadingMaestros] = useState(true);
  const [errorMaestros, setErrorMaestros]     = useState("");

  // Maestro seleccionado para ver sus movimientos
  const [maestroSeleccionado, setMaestroSeleccionado] = useState<Maestro | null>(null);
  const [movimientos, setMovimientos]     = useState<Movimiento[]>([]);
  const [saldosDiarios, setSaldosDiarios] = useState<SaldoDiario[]>([]);
  const [loadingMov, setLoadingMov]       = useState(false);

  // Dialogs
  const [showAgregarMaestro, setShowAgregarMaestro] = useState(false);
  const [showAgregarMovimiento, setShowAgregarMovimiento] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");

  // Formulario nuevo maestro
  const [formMaestro, setFormMaestro] = useState({ nombre: "", unidad: "kg", saldoInicial: "" });
  const [erroresMaestro, setErroresMaestro] = useState<{ nombre?: string; saldoInicial?: string }>({});

  // Formulario nuevo movimiento
  const [formMov, setFormMov] = useState({ tipo: "ENTRADA" as "ENTRADA" | "SALIDA", cantidad: "", nota: "" });
  const [erroresMov, setErroresMov] = useState<{ cantidad?: string }>({});

  // Filtro activo
  const [filtro, setFiltro] = useState<"todos" | "criticos" | "agotados">("todos");

  // ── Cargar maestros ───────────────────────────────────────────────────────
  const cargarMaestros = useCallback(async () => {
    setLoadingMaestros(true);
    setErrorMaestros("");
    try {
      const res = await fetch("/api/maestros");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMaestros(data.maestros);
      // Si hay un maestro seleccionado, actualizarlo
      if (maestroSeleccionado) {
        const actualizado = data.maestros.find((m: Maestro) => m.id === maestroSeleccionado.id);
        if (actualizado) setMaestroSeleccionado(actualizado);
      }
    } catch {
      setErrorMaestros("No se pudieron cargar los maestros");
    } finally {
      setLoadingMaestros(false);
    }
  }, [maestroSeleccionado]);

  useEffect(() => { cargarMaestros(); }, []);

  // ── Cargar movimientos de un maestro ─────────────────────────────────────
  const cargarMovimientos = useCallback(async (maestroId: string) => {
    setLoadingMov(true);
    try {
      const res = await fetch(`/api/movimientos?maestroId=${maestroId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMovimientos(data.movimientos);
      setSaldosDiarios(data.saldosDiarios);
    } catch {
      setMovimientos([]);
    } finally {
      setLoadingMov(false);
    }
  }, []);

  const seleccionarMaestro = (maestro: Maestro) => {
    setMaestroSeleccionado(maestro);
    cargarMovimientos(maestro.id);
  };

  // ── Crear maestro ─────────────────────────────────────────────────────────
  const validarMaestro = () => {
    const errs: typeof erroresMaestro = {};
    if (!formMaestro.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!formMaestro.saldoInicial || isNaN(Number(formMaestro.saldoInicial)) || Number(formMaestro.saldoInicial) < 0)
      errs.saldoInicial = "Ingresa un saldo válido";
    setErroresMaestro(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCrearMaestro = async () => {
    if (!validarMaestro()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/maestros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:       formMaestro.nombre.trim(),
          unidad:       formMaestro.unidad,
          saldoInicial: Number(formMaestro.saldoInicial),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Error al crear maestro");
        return;
      }
      await cargarMaestros();
      setShowAgregarMaestro(false);
      setFormMaestro({ nombre: "", unidad: "kg", saldoInicial: "" });
      setErroresMaestro({});
    } catch {
      setSaveError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // ── Crear movimiento ──────────────────────────────────────────────────────
  const validarMovimiento = () => {
    const errs: typeof erroresMov = {};
    if (!formMov.cantidad || isNaN(Number(formMov.cantidad)) || Number(formMov.cantidad) <= 0)
      errs.cantidad = "Ingresa una cantidad válida mayor a 0";
    setErroresMov(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCrearMovimiento = async () => {
    if (!validarMovimiento() || !maestroSeleccionado) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maestroId: maestroSeleccionado.id,
          tipo:      formMov.tipo,
          cantidad:  Number(formMov.cantidad),
          nota:      formMov.nota || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Error al registrar movimiento");
        return;
      }
      // Recargar movimientos y maestros para reflejar el nuevo saldo
      await Promise.all([
        cargarMovimientos(maestroSeleccionado.id),
        cargarMaestros(),
      ]);
      setShowAgregarMovimiento(false);
      setFormMov({ tipo: "ENTRADA", cantidad: "", nota: "" });
      setErroresMov({});
    } catch {
      setSaveError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // ── Filtros ───────────────────────────────────────────────────────────────
  const MINIMO = 5; // Saldo mínimo de referencia
  const maestrosFiltrados = maestros.filter((m) => {
    if (filtro === "criticos") return m.saldo > 0 && m.saldo < MINIMO;
    if (filtro === "agotados") return m.saldo === 0;
    return true;
  });

  const criticos = maestros.filter((m) => m.saldo > 0 && m.saldo < MINIMO).length;
  const agotados = maestros.filter((m) => m.saldo === 0).length;

  function saldoBadge(saldo: number) {
    if (saldo === 0) return <Badge variant="bad">Agotado</Badge>;
    if (saldo < MINIMO) return <Badge variant="warn">Crítico</Badge>;
    return <Badge variant="good">OK</Badge>;
  }

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  const formatFechaHora = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminPage
      eyebrow="Administración"
      title="Inventario"
      description="Maestros de insumos, movimientos de entrada y salida, y saldos actuales."
      actions={
        isAdmin ? (
          <Button size="sm" onClick={() => { setSaveError(""); setFormMaestro({ nombre: "", unidad: "kg", saldoInicial: "" }); setErroresMaestro({}); setShowAgregarMaestro(true); }}>
            Agregar maestro
          </Button>
        ) : null
      }
      tabs={
        <>
          <FilterPill active={filtro === "todos"}    count={maestros.length}  onClick={() => setFiltro("todos")}>Todos</FilterPill>
          <FilterPill active={filtro === "criticos"} count={criticos}         onClick={() => setFiltro("criticos")}>Críticos</FilterPill>
          <FilterPill active={filtro === "agotados"} count={agotados}         onClick={() => setFiltro("agotados")}>Agotados</FilterPill>
        </>
      }
    >
      {/* Tarjetas de resumen */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Maestros"  value={String(maestros.length)} detail="registrados"      />
        <StatCard label="Críticos"  value={String(criticos)}        detail="bajo mínimo"      tone="bad"  />
        <StatCard label="Agotados"  value={String(agotados)}        detail="saldo en cero"    tone="warn" />
      </div>

      {errorMaestros && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{errorMaestros}</div>
      )}

      {/* Tabla de maestros */}
      <Panel title="Maestros de inventario" meta="Haz clic en una fila para ver sus movimientos">
        {loadingMaestros ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando maestros…</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Nombre</Th>
                <Th>Unidad</Th>
                <Th>Saldo actual</Th>
                <Th>Estado</Th>
                <Th>Creado por</Th>
                <Th>Fecha</Th>
                <Th className="text-right">Acciones</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {maestrosFiltrados.map((m) => (
                <TableRow
                  key={m.id}
                  className={`cursor-pointer transition-colors hover:bg-maiz/50 ${maestroSeleccionado?.id === m.id ? "bg-achiote/5" : ""}`}
                  onClick={() => seleccionarMaestro(m)}
                >
                  <Td className="font-semibold">{m.nombre}</Td>
                  <Td className="text-cafe-2">{m.unidad}</Td>
                  <Td className="font-heading font-bold">{m.saldo} {m.unidad}</Td>
                  <Td>{saldoBadge(m.saldo)}</Td>
                  <Td className="text-cafe-2 text-sm">{m.creadoPor.name}</Td>
                  <Td className="text-cafe-3 text-xs">{formatFecha(m.createdAt)}</Td>
                  <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { seleccionarMaestro(m); setSaveError(""); setFormMov({ tipo: "ENTRADA", cantidad: "", nota: "" }); setErroresMov({}); setShowAgregarMovimiento(true); }}
                    >
                      Registrar movimiento
                    </Button>
                  </Td>
                </TableRow>
              ))}
              {maestrosFiltrados.length === 0 && (
                <TableRow>
                  <Td colSpan={7} className="py-8 text-center text-cafe-3">No hay maestros con ese filtro</Td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* Sección de movimientos del maestro seleccionado */}
      {maestroSeleccionado && (
        <Panel
          title={`Movimientos — ${maestroSeleccionado.nombre}`}
          meta={`Saldo actual: ${maestroSeleccionado.saldo} ${maestroSeleccionado.unidad}`}
          actions={
            <Button size="sm" onClick={() => { setSaveError(""); setFormMov({ tipo: "ENTRADA", cantidad: "", nota: "" }); setErroresMov({}); setShowAgregarMovimiento(true); }}>
              Agregar movimiento
            </Button>
          }
        >
          {/* Gráfica simple de saldos diarios */}
          {saldosDiarios.length > 0 && (
            <div className="border-b border-maiz-3 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-cafe-3">Evolución de saldo</p>
              <div className="flex h-20 items-end gap-1">
                {saldosDiarios.map((d) => {
                  const max = Math.max(...saldosDiarios.map((x) => x.saldo), 1);
                  const pct = Math.max((d.saldo / max) * 100, 4);
                  return (
                    <div key={d.fecha} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
                      <div
                        className="w-full rounded-t bg-achiote/70 transition-all group-hover:bg-achiote"
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[9px] text-cafe-3 -rotate-45 origin-top-left whitespace-nowrap">
                        {d.fecha.slice(5)}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-cafe px-2 py-1 text-[10px] text-maiz whitespace-nowrap z-10">
                        {d.saldo} {maestroSeleccionado.unidad}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla de movimientos */}
          {loadingMov ? (
            <div className="flex items-center justify-center py-10 text-sm text-cafe-3">Cargando movimientos…</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th>Cantidad</Th>
                  <Th>Responsable</Th>
                  <Th>Nota</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimientos.length === 0 ? (
                  <TableRow>
                    <Td colSpan={5} className="py-8 text-center text-cafe-3">Sin movimientos aún</Td>
                  </TableRow>
                ) : (
                  movimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <Td className="text-xs text-cafe-3">{formatFechaHora(mov.fecha)}</Td>
                      <Td>
                        <Badge variant={mov.tipo === "ENTRADA" ? "good" : "bad"}>
                          {mov.tipo === "ENTRADA" ? "↑ Entrada" : "↓ Salida"}
                        </Badge>
                      </Td>
                      <Td className="font-heading font-bold">
                        {mov.tipo === "SALIDA" ? "-" : "+"}{mov.cantidad} {maestroSeleccionado.unidad}
                      </Td>
                      <Td className="text-cafe-2">{mov.responsable.name}</Td>
                      <Td className="text-cafe-3 text-sm">{mov.nota ?? "—"}</Td>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Panel>
      )}

      {/* Dialog: agregar maestro (solo ADMIN) */}
      <Dialog
        open={showAgregarMaestro}
        onClose={() => { if (!saving) { setShowAgregarMaestro(false); } }}
        title="Agregar maestro de inventario"
        confirmLabel="Crear maestro"
        cancelLabel="Cancelar"
        onConfirm={handleCrearMaestro}
        loading={saving}
      >
        <div className="space-y-4">
          {saveError && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{saveError}</div>
          )}
          <Input
            label="Nombre del insumo"
            placeholder="Ej. Fríjoles rojos"
            value={formMaestro.nombre}
            onChange={(e) => setFormMaestro((p) => ({ ...p, nombre: e.target.value }))}
            error={erroresMaestro.nombre}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-cafe">Unidad de medida</label>
            <select
              value={formMaestro.unidad}
              onChange={(e) => setFormMaestro((p) => ({ ...p, unidad: e.target.value }))}
              className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
            >
              {["kg", "g", "L", "ml", "unid", "porciones"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <Input
            label="Saldo inicial"
            placeholder="0"
            type="number"
            min="0"
            step="0.1"
            value={formMaestro.saldoInicial}
            onChange={(e) => setFormMaestro((p) => ({ ...p, saldoInicial: e.target.value }))}
            error={erroresMaestro.saldoInicial}
          />
        </div>
      </Dialog>

      {/* Dialog: agregar movimiento */}
      <Dialog
        open={showAgregarMovimiento}
        onClose={() => { if (!saving) setShowAgregarMovimiento(false); }}
        title={`Registrar movimiento — ${maestroSeleccionado?.nombre ?? ""}`}
        confirmLabel="Registrar"
        cancelLabel="Cancelar"
        onConfirm={handleCrearMovimiento}
        loading={saving}
      >
        <div className="space-y-4">
          {maestroSeleccionado && (
            <div className="rounded-lg bg-cafe/5 px-4 py-3 text-sm flex gap-6">
              <div>
                <p className="text-cafe/50 text-xs">Saldo actual</p>
                <p className="font-medium text-cafe">{maestroSeleccionado.saldo} {maestroSeleccionado.unidad}</p>
              </div>
            </div>
          )}

          {saveError && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{saveError}</div>
          )}

          {/* Tipo de movimiento */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-cafe">Tipo de movimiento</p>
            <div className="flex gap-2">
              {(["ENTRADA", "SALIDA"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormMov((p) => ({ ...p, tipo: t }))}
                  className={[
                    "flex-1 py-2 rounded-md text-sm font-medium border transition-colors",
                    formMov.tipo === t
                      ? t === "ENTRADA" ? "bg-hoja text-white border-hoja" : "bg-aji text-white border-aji"
                      : "bg-transparent text-cafe-2 border-maiz-3 hover:bg-maiz",
                  ].join(" ")}
                >
                  {t === "ENTRADA" ? "↑ Entrada" : "↓ Salida"}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Cantidad"
            placeholder="0"
            type="number"
            min="0.01"
            step="0.1"
            value={formMov.cantidad}
            onChange={(e) => setFormMov((p) => ({ ...p, cantidad: e.target.value }))}
            error={erroresMov.cantidad}
          />
          <Input
            label="Nota (opcional)"
            placeholder="Ej. Compra proveedor, consumo cocina..."
            value={formMov.nota}
            onChange={(e) => setFormMov((p) => ({ ...p, nota: e.target.value }))}
          />
        </div>
      </Dialog>
    </AdminPage>
  );
}
