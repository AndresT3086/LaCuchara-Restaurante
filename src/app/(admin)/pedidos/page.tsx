"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPage, FilterPill, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

type Estado = "PENDIENTE" | "EN_COCINA" | "LISTO" | "ENTREGADO" | "CANCELADO";

interface Pedido {
  id: string;
  estado: Estado;
  subtotal: number;
  total: number;
  costoEnvio: number;
  distanciaKm: number;
  createdAt: string;
  cliente: { nombre: string; telefono?: string | null; direccion?: string | null } | null;
  items: Array<{
    cantidad: number;
    plato: { nombre: string; precio: number };
  }>;
  pagos: Array<{ metodo: string; monto: number }>;
}

const estadoOrden: Estado[] = ["PENDIENTE", "EN_COCINA", "LISTO", "ENTREGADO"];
const estadoLabels: Record<Estado, string> = {
  PENDIENTE: "Pendiente",
  EN_COCINA: "En cocina",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function estadoBadge(estado: Estado) {
  const variant = estado === "PENDIENTE" ? "warn" : estado === "CANCELADO" ? "bad" : estado === "LISTO" || estado === "ENTREGADO" ? "good" : "neutral";
  return <Badge variant={variant}>{estadoLabels[estado]}</Badge>;
}

function detallePedido(pedido: Pedido) {
  return pedido.items.map((item) => `${item.cantidad}x ${item.plato.nombre}`).join(" · ") || "Sin items";
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<Estado | "TODOS">("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarPedidos = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pedidos");
      if (!res.ok) throw new Error();

      const data = await res.json();
      setPedidos(data.pedidos ?? []);
    } catch {
      setError("No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const pedidosFiltrados = useMemo(
    () => pedidos.filter((pedido) => filtro === "TODOS" || pedido.estado === filtro),
    [filtro, pedidos]
  );

  const avanzarEstado = async (id: string, estadoActual: Estado) => {
    const index = estadoOrden.indexOf(estadoActual);
    const siguiente = estadoOrden[Math.min(index + 1, estadoOrden.length - 1)];

    if (siguiente === estadoActual) return;

    try {
      const res = await fetch("/api/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: siguiente }),
      });

      if (!res.ok) throw new Error();
      await cargarPedidos();
    } catch {
      setError("No se pudo actualizar el estado del pedido.");
    }
  };

  return (
    <AdminPage
      eyebrow="Operación"
      title="Pedidos"
      description="Gestiona pedidos reales creados en el sistema."
      tabs={
        <>
          <FilterPill active={filtro === "TODOS"} count={pedidos.length} onClick={() => setFiltro("TODOS")}>Todos</FilterPill>
          {estadoOrden.map((estado) => (
            <FilterPill
              key={estado}
              active={filtro === estado}
              count={pedidos.filter((p) => p.estado === estado).length}
              onClick={() => setFiltro(estado)}
            >
              {estadoLabels[estado]}
            </FilterPill>
          ))}
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pendientes" value={String(pedidos.filter((p) => p.estado === "PENDIENTE").length)} detail="por confirmar" tone="warn" />
        <StatCard label="En cocina" value={String(pedidos.filter((p) => p.estado === "EN_COCINA").length)} detail="preparándose" tone="blue" />
        <StatCard label="Listos" value={String(pedidos.filter((p) => p.estado === "LISTO").length)} detail="para entrega" tone="good" />
        <StatCard label="Domicilios" value={String(pedidos.filter((p) => p.costoEnvio > 0).length)} detail="con envío calculado" />
      </div>

      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      <Panel title="Cola de pedidos" meta={`${pedidosFiltrados.length} visibles`}>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando pedidos...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Pedido</Th>
                <Th>Cliente</Th>
                <Th>Detalle</Th>
                <Th>Entrega</Th>
                <Th>Pago</Th>
                <Th>Total</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acción</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {pedidosFiltrados.map((pedido) => (
                <TableRow key={pedido.id}>
                  <Td>
                    <p className="font-heading text-sm font-bold text-cafe">{pedido.id.slice(0, 8)}</p>
                    <p className="text-xs text-cafe-3">{formatHora(pedido.createdAt)}</p>
                  </Td>
                  <Td>
                    <p className="font-semibold text-cafe">{pedido.cliente?.nombre ?? "Sin cliente"}</p>
                    <p className="text-xs text-cafe-3">{pedido.cliente?.telefono ?? "Sin teléfono"}</p>
                  </Td>
                  <Td className="max-w-64 text-cafe-2">{detallePedido(pedido)}</Td>
                  <Td>
                    <Badge variant={pedido.costoEnvio > 0 ? "neutral" : "good"}>
                      {pedido.costoEnvio > 0 ? `Domicilio · ${pedido.distanciaKm} km` : "Sin envío"}
                    </Badge>
                  </Td>
                  <Td className="text-cafe-2">{pedido.pagos[0]?.metodo ?? "Pendiente"}</Td>
                  <Td className="font-heading font-bold">{formatCOP(pedido.total)}</Td>
                  <Td>{estadoBadge(pedido.estado)}</Td>
                  <Td className="text-right">
                    <Button
                      variant={pedido.estado === "ENTREGADO" ? "secondary" : "primary"}
                      size="sm"
                      disabled={pedido.estado === "ENTREGADO" || pedido.estado === "CANCELADO"}
                      onClick={() => avanzarEstado(pedido.id, pedido.estado)}
                    >
                      {pedido.estado === "ENTREGADO" ? "Cerrado" : "Avanzar"}
                    </Button>
                  </Td>
                </TableRow>
              ))}
              {pedidosFiltrados.length === 0 && (
                <TableRow>
                  <Td colSpan={8} className="py-8 text-center text-cafe-3">No hay pedidos con este filtro.</Td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Panel>
    </AdminPage>
  );
}
