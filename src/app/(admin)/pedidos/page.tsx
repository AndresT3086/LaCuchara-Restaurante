"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AdminPage, FilterPill, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";
import { useSession } from "@/contexts/SessionContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EstadoPedido = "PENDIENTE" | "EN_COCINA" | "LISTO" | "ENTREGADO" | "CANCELADO";

interface ItemPedido {
  id: string;
  cantidad: number;
  precio: number;
  plato: { id: string; nombre: string };
}

interface Pedido {
  id: string;
  mesa: number | null;
  estado: EstadoPedido;
  subtotal: number;
  total: number;
  nota: string | null;
  createdAt: string;
  atendidoPor: { id: string; name: string } | null;
  cliente: { id: string; nombre: string; telefono: string | null } | null;
  items: ItemPedido[];
}

interface Plato {
  id: string;
  nombre: string;
  precio: number;
  categoria: { nombre: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_LABELS: Record<EstadoPedido, string> = {
  PENDIENTE:  "Pendiente",
  EN_COCINA:  "En cocina",
  LISTO:      "Listo",
  ENTREGADO:  "Entregado",
  CANCELADO:  "Cancelado",
};

const ESTADO_SIGUIENTE: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: "EN_COCINA",
  EN_COCINA: "LISTO",
  LISTO:     "ENTREGADO",
};

function estadoBadge(estado: EstadoPedido) {
  const variante =
    estado === "PENDIENTE"  ? "warn"    :
    estado === "EN_COCINA"  ? "neutral" :
    estado === "LISTO"      ? "good"    :
    estado === "CANCELADO"  ? "bad"     : "neutral";
  return <Badge variant={variante}>{ESTADO_LABELS[estado]}</Badge>;
}

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PedidosPage() {
  const { user } = useSession();

  const [pedidos, setPedidos]         = useState<Pedido[]>([]);
  const [platos, setPlatos]           = useState<Plato[]>([]);
  const [loadingPedidos, setLoading]  = useState(true);
  const [error, setError]             = useState("");
  const [filtro, setFiltro]           = useState<EstadoPedido | "TODOS">("TODOS");
  const [avanzando, setAvanzando]     = useState<string | null>(null);

  // Dialog nuevo pedido
  const [showNuevo, setShowNuevo]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [mesa, setMesa]               = useState("");
  const [nota, setNota]               = useState("");
  // Ítems seleccionados: { platoId -> cantidad }
  const [itemsSeleccionados, setItemsSeleccionados] = useState<Record<string, number>>({});

  // ── Cargar datos ─────────────────────────────────────────────────────────

  const cargarPedidos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pedidos");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPedidos(data.pedidos);
    } catch {
      setError("No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarPlatos = useCallback(async () => {
    try {
      const res = await fetch("/api/platos");
      if (!res.ok) return;
      const data = await res.json();
      setPlatos(data.platos.filter((p: Plato & { disponible: boolean }) => p.disponible));
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargarPedidos();
    cargarPlatos();
  }, [cargarPedidos, cargarPlatos]);

  // ── Avanzar estado ────────────────────────────────────────────────────────

  const avanzarEstado = async (pedido: Pedido) => {
    const siguiente = ESTADO_SIGUIENTE[pedido.estado];
    if (!siguiente) return;
    setAvanzando(pedido.id);
    try {
      const res = await fetch("/api/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pedido.id, estado: siguiente }),
      });
      if (!res.ok) return;
      // Actualizar localmente
      setPedidos((prev) =>
        prev.map((p) => p.id === pedido.id ? { ...p, estado: siguiente } : p)
      );
    } catch { /* silencioso */ }
    finally { setAvanzando(null); }
  };

  // ── Crear pedido ──────────────────────────────────────────────────────────

  const totalPedido = useMemo(() => {
    return Object.entries(itemsSeleccionados).reduce((acc, [platoId, cant]) => {
      const plato = platos.find((p) => p.id === platoId);
      return acc + (plato?.precio ?? 0) * cant;
    }, 0);
  }, [itemsSeleccionados, platos]);

  const ajustarCantidad = (platoId: string, delta: number) => {
    setItemsSeleccionados((prev) => {
      const actual = prev[platoId] ?? 0;
      const nueva = actual + delta;
      if (nueva <= 0) {
        const { [platoId]: _, ...resto } = prev;
        return resto;
      }
      return { ...prev, [platoId]: nueva };
    });
  };

  const handleCrearPedido = async () => {
    const items = Object.entries(itemsSeleccionados).map(([platoId, cantidad]) => ({ platoId, cantidad }));
    if (!items.length) {
      setSaveError("Agrega al menos un plato al pedido");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesa: mesa ? Number(mesa) : null,
          nota: nota || null,
          items,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Error al crear pedido");
        return;
      }
      await cargarPedidos();
      setShowNuevo(false);
      setMesa("");
      setNota("");
      setItemsSeleccionados({});
    } catch {
      setSaveError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // ── Filtrado ──────────────────────────────────────────────────────────────

  const pedidosFiltrados = useMemo(() =>
    filtro === "TODOS" ? pedidos : pedidos.filter((p) => p.estado === filtro),
    [pedidos, filtro]
  );

  const contarEstado = (e: EstadoPedido) => pedidos.filter((p) => p.estado === e).length;

  // Agrupar platos por categoría para el formulario
  const platosPorCategoria = useMemo(() => {
    const mapa = new Map<string, Plato[]>();
    for (const plato of platos) {
      const cat = plato.categoria.nombre;
      if (!mapa.has(cat)) mapa.set(cat, []);
      mapa.get(cat)!.push(plato);
    }
    return mapa;
  }, [platos]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminPage
      eyebrow="Operación"
      title="Pedidos"
      description="Gestiona pedidos del restaurante y avanza su estado en cocina."
      actions={
        <Button size="sm" onClick={() => { setSaveError(""); setItemsSeleccionados({}); setMesa(""); setNota(""); setShowNuevo(true); }}>
          Nuevo pedido
        </Button>
      }
      tabs={
        <>
          <FilterPill active={filtro === "TODOS"}     count={pedidos.length}           onClick={() => setFiltro("TODOS")}>Todos</FilterPill>
          <FilterPill active={filtro === "PENDIENTE"} count={contarEstado("PENDIENTE")} onClick={() => setFiltro("PENDIENTE")}>Pendientes</FilterPill>
          <FilterPill active={filtro === "EN_COCINA"} count={contarEstado("EN_COCINA")} onClick={() => setFiltro("EN_COCINA")}>En cocina</FilterPill>
          <FilterPill active={filtro === "LISTO"}     count={contarEstado("LISTO")}     onClick={() => setFiltro("LISTO")}>Listos</FilterPill>
          <FilterPill active={filtro === "ENTREGADO"} count={contarEstado("ENTREGADO")} onClick={() => setFiltro("ENTREGADO")}>Entregados</FilterPill>
        </>
      }
    >
      {/* Tarjetas resumen */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pendientes" value={String(contarEstado("PENDIENTE"))} detail="por confirmar"   tone="warn" />
        <StatCard label="En cocina"  value={String(contarEstado("EN_COCINA"))} detail="preparándose"   tone="blue" />
        <StatCard label="Listos"     value={String(contarEstado("LISTO"))}     detail="para entregar"  tone="good" />
        <StatCard label="Ventas"
          value={formatCOP(pedidos.filter(p => p.estado !== "CANCELADO").reduce((s, p) => s + p.total, 0))}
          detail="total del día"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      {/* Tabla de pedidos */}
      <Panel title="Cola de pedidos" meta={`${pedidosFiltrados.length} visibles`}>
        {loadingPedidos ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando pedidos…</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Pedido</Th>
                <Th>Mesa</Th>
                <Th>Platos</Th>
                <Th>Total</Th>
                <Th>Atendido por</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acción</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {pedidosFiltrados.length === 0 ? (
                <TableRow>
                  <Td colSpan={7} className="py-8 text-center text-cafe-3">No hay pedidos con ese filtro</Td>
                </TableRow>
              ) : (
                pedidosFiltrados.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <Td>
                      <p className="font-heading text-sm font-bold text-cafe">#{pedido.id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-cafe-3">{formatHora(pedido.createdAt)}</p>
                    </Td>
                    <Td className="text-cafe-2">{pedido.mesa ? `Mesa ${pedido.mesa}` : "—"}</Td>
                    <Td className="max-w-48">
                      <p className="text-sm text-cafe-2 truncate">
                        {pedido.items.map((i) => `${i.cantidad}× ${i.plato.nombre}`).join(", ")}
                      </p>
                    </Td>
                    <Td className="font-heading font-bold">{formatCOP(pedido.total)}</Td>
                    <Td className="text-cafe-2 text-sm">{pedido.atendidoPor?.name ?? "—"}</Td>
                    <Td>{estadoBadge(pedido.estado)}</Td>
                    <Td className="text-right">
                      {ESTADO_SIGUIENTE[pedido.estado] ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={avanzando === pedido.id}
                          onClick={() => avanzarEstado(pedido)}
                        >
                          {avanzando === pedido.id ? "…" : `→ ${ESTADO_LABELS[ESTADO_SIGUIENTE[pedido.estado]!]}`}
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" disabled>
                          {ESTADO_LABELS[pedido.estado]}
                        </Button>
                      )}
                    </Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* Dialog: nuevo pedido */}
      <Dialog
        open={showNuevo}
        onClose={() => { if (!saving) setShowNuevo(false); }}
        title="Nuevo pedido"
        confirmLabel={`Crear pedido${totalPedido > 0 ? ` — ${formatCOP(totalPedido)}` : ""}`}
        cancelLabel="Cancelar"
        onConfirm={handleCrearPedido}
        loading={saving}
      >
        <div className="space-y-4">
          {saveError && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{saveError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mesa (opcional)"
              placeholder="Ej. 4"
              type="number"
              min="1"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
            />
            <Input
              label="Nota (opcional)"
              placeholder="Sin cebolla..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>

          {/* Selector de platos agrupados por categoría */}
          <div className="max-h-80 overflow-y-auto space-y-4 rounded-lg border border-maiz-3 p-3">
            {platos.length === 0 ? (
              <p className="text-sm text-cafe-3 text-center py-4">
                No hay platos disponibles. Crea platos primero en la sección Platos y menú.
              </p>
            ) : (
              Array.from(platosPorCategoria.entries()).map(([categoria, platosCateg]) => (
                <div key={categoria}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-achiote-dark">{categoria}</p>
                  <div className="space-y-1">
                    {platosCateg.map((plato) => {
                      const cant = itemsSeleccionados[plato.id] ?? 0;
                      return (
                        <div key={plato.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-maiz">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-cafe">{plato.nombre}</p>
                            <p className="text-xs text-cafe-3">{formatCOP(plato.precio)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => ajustarCantidad(plato.id, -1)}
                              disabled={cant === 0}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-maiz-3 text-cafe-2 hover:bg-maiz-2 disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="w-4 text-center text-sm font-bold text-cafe">
                              {cant > 0 ? cant : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => ajustarCantidad(plato.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-rojo-ladrillo text-maiz hover:bg-rojo-ladrillo-dark"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total en tiempo real */}
          {totalPedido > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-cafe/5 px-4 py-3">
              <span className="text-sm font-medium text-cafe">Total</span>
              <span className="font-heading text-xl font-extrabold text-cafe">{formatCOP(totalPedido)}</span>
            </div>
          )}
        </div>
      </Dialog>
    </AdminPage>
  );
}
