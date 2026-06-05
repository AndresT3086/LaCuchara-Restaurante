"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

interface Pedido {
  id: string;
  estado: "PENDIENTE" | "EN_COCINA" | "LISTO" | "ENTREGADO" | "CANCELADO";
  total: number;
  costoEnvio: number;
  createdAt: string;
  items: Array<{
    cantidad: number;
    plato: { id: string; nombre: string; precio: number };
  }>;
}

interface Maestro {
  id: string;
  nombre: string;
  unidad: string;
  saldo: number;
}

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError("");

      try {
        const [pedidosRes, maestrosRes] = await Promise.all([
          fetch("/api/pedidos"),
          fetch("/api/maestros"),
        ]);

        if (!pedidosRes.ok || !maestrosRes.ok) throw new Error();

        const [pedidosData, maestrosData] = await Promise.all([
          pedidosRes.json(),
          maestrosRes.json(),
        ]);

        setPedidos(pedidosData.pedidos ?? []);
        setMaestros(maestrosData.maestros ?? []);
      } catch {
        setError("No se pudo cargar el resumen desde las APIs.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const pedidosHoy = useMemo(() => pedidos.filter((pedido) => isToday(pedido.createdAt)), [pedidos]);
  const ingresosHoy = pedidosHoy.reduce((total, pedido) => total + pedido.total, 0);
  const domiciliosHoy = pedidosHoy.filter((pedido) => pedido.costoEnvio > 0).length;

  const alertasInventario = maestros
    .filter((maestro) => maestro.saldo <= 5)
    .sort((a, b) => a.saldo - b.saldo);

  const masVendidos = useMemo(() => {
    const acumulado = new Map<string, { plato: string; unidades: number }>();

    for (const pedido of pedidos) {
      for (const item of pedido.items) {
        const actual = acumulado.get(item.plato.id) ?? { plato: item.plato.nombre, unidades: 0 };
        actual.unidades += item.cantidad;
        acumulado.set(item.plato.id, actual);
      }
    }

    return Array.from(acumulado.values())
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 5);
  }, [pedidos]);

  return (
    <AdminPage
      eyebrow="Operación"
      title="Inicio"
      description="Resumen rápido para abrir cocina, revisar pedidos y decidir el menú."
    >
      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos hoy" value={String(pedidosHoy.length)} detail={`${pedidosHoy.filter((p) => p.estado === "PENDIENTE").length} pendientes`} tone="warn" />
        <StatCard label="Ingresos hoy" value={formatCOP(ingresosHoy)} detail="pedidos del día" tone="good" />
        <StatCard label="Domicilios hoy" value={String(domiciliosHoy)} detail="con costo de envío" tone="blue" />
        <StatCard label="Alertas" value={String(alertasInventario.length)} detail="inventario crítico" tone="bad" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Panel title="Pedidos recientes" meta={loading ? "Cargando..." : `${pedidos.slice(0, 5).length} últimos`}>
          <div className="divide-y divide-maiz-3">
            {pedidos.slice(0, 5).map((pedido) => (
              <div key={pedido.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="font-semibold text-cafe">Pedido {pedido.id.slice(0, 8)}</p>
                  <p className="text-xs text-cafe-3">{pedido.items.map((item) => `${item.cantidad}x ${item.plato.nombre}`).join(" · ") || "Sin items"}</p>
                </div>
                <Badge variant={pedido.estado === "PENDIENTE" ? "warn" : pedido.estado === "CANCELADO" ? "bad" : "good"}>
                  {pedido.estado.replace("_", " ")}
                </Badge>
              </div>
            ))}
            {!loading && pedidos.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-cafe-3">No hay pedidos registrados.</div>
            )}
          </div>
        </Panel>

        <Panel title="Alertas de inventario" meta="Desde /api/maestros">
          <div className="divide-y divide-maiz-3">
            {alertasInventario.map((maestro) => (
              <div key={maestro.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="font-semibold text-cafe">{maestro.nombre}</p>
                  <p className="text-xs text-cafe-3">Saldo actual: {maestro.saldo} {maestro.unidad}</p>
                </div>
                <Badge variant={maestro.saldo === 0 ? "bad" : "warn"}>
                  {maestro.saldo === 0 ? "Agotado" : "Bajo"}
                </Badge>
              </div>
            ))}
            {!loading && alertasInventario.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-cafe-3">Sin alertas de inventario.</div>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Más vendidos" meta="Calculado desde pedidos reales">
        <Table>
          <TableHead>
            <TableRow>
              <Th>Plato</Th>
              <Th>Unidades</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {masVendidos.map((venta) => (
              <TableRow key={venta.plato}>
                <Td className="font-semibold">{venta.plato}</Td>
                <Td>{venta.unidades}</Td>
              </TableRow>
            ))}
            {!loading && masVendidos.length === 0 && (
              <TableRow>
                <Td colSpan={2} className="py-8 text-center text-cafe-3">No hay ventas registradas.</Td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </AdminPage>
  );
}
