"use client";

import { useMemo, useState } from "react";
import { AdminPage, FilterPill, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

type Estado = "Pendiente" | "En preparación" | "Listo" | "Entregado";
type Entrega = "Recoger" | "Domicilio";
type Pago = "Contra entrega" | "Stripe";

interface Pedido {
  id: string;
  hora: string;
  cliente: string;
  telefono: string;
  detalle: string;
  entrega: Entrega;
  distancia?: string;
  pago: Pago;
  total: number;
  estado: Estado;
}

const PEDIDOS_INICIALES: Pedido[] = [
  {
    id: "LC-1048",
    hora: "12:08",
    cliente: "Diana Rojas",
    telefono: "300 456 9012",
    detalle: "Completo con pollo, sin postre",
    entrega: "Domicilio",
    distancia: "2.8 km",
    pago: "Stripe",
    total: 20500,
    estado: "Pendiente",
  },
  {
    id: "LC-1047",
    hora: "12:02",
    cliente: "Andrés Mora",
    telefono: "311 223 4545",
    detalle: "Básico con res, jugo de maracuyá",
    entrega: "Recoger",
    pago: "Contra entrega",
    total: 12000,
    estado: "En preparación",
  },
  {
    id: "LC-1046",
    hora: "11:55",
    cliente: "Paola Gil",
    telefono: "315 889 1200",
    detalle: "Bandeja paisa, sopa adicional",
    entrega: "Domicilio",
    distancia: "4.1 km",
    pago: "Stripe",
    total: 33800,
    estado: "Listo",
  },
  {
    id: "LC-1045",
    hora: "11:49",
    cliente: "Mateo Ruiz",
    telefono: "302 777 0191",
    detalle: "Completo con cerdo",
    entrega: "Recoger",
    pago: "Contra entrega",
    total: 18000,
    estado: "Entregado",
  },
];

const estadoOrden: Estado[] = ["Pendiente", "En preparación", "Listo", "Entregado"];

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function estadoBadge(estado: Estado) {
  const variant = estado === "Pendiente" ? "warn" : estado === "En preparación" ? "neutral" : estado === "Listo" ? "good" : "neutral";
  return <Badge variant={variant}>{estado}</Badge>;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIALES);
  const [filtro, setFiltro] = useState<Estado | "Todos">("Todos");

  const pedidosFiltrados = useMemo(
    () => pedidos.filter((pedido) => filtro === "Todos" || pedido.estado === filtro),
    [filtro, pedidos]
  );

  const avanzarEstado = (id: string) => {
    setPedidos((prev) =>
      prev.map((pedido) => {
        if (pedido.id !== id) return pedido;
        const index = estadoOrden.indexOf(pedido.estado);
        return { ...pedido, estado: estadoOrden[Math.min(index + 1, estadoOrden.length - 1)] };
      })
    );
  };

  return (
    <AdminPage
      eyebrow="Operación"
      title="Pedidos"
      description="Gestiona pedidos de recoger y domicilio, pagos y estados de cocina."
      tabs={
        <>
          <FilterPill active={filtro === "Todos"} count={pedidos.length} onClick={() => setFiltro("Todos")}>Todos</FilterPill>
          {estadoOrden.map((estado) => (
            <FilterPill
              key={estado}
              active={filtro === estado}
              count={pedidos.filter((p) => p.estado === estado).length}
              onClick={() => setFiltro(estado)}
            >
              {estado}
            </FilterPill>
          ))}
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pendientes" value={String(pedidos.filter((p) => p.estado === "Pendiente").length)} detail="por confirmar" tone="warn" />
        <StatCard label="En cocina" value={String(pedidos.filter((p) => p.estado === "En preparación").length)} detail="preparándose" tone="blue" />
        <StatCard label="Listos" value={String(pedidos.filter((p) => p.estado === "Listo").length)} detail="para entrega" tone="good" />
        <StatCard label="Ventas" value={formatCOP(pedidos.reduce((sum, p) => sum + p.total, 0))} detail="muestra de hoy" />
      </div>

      <Panel title="Cola de pedidos" meta={`${pedidosFiltrados.length} visibles`}>
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
                  <p className="font-heading text-sm font-bold text-cafe">{pedido.id}</p>
                  <p className="text-xs text-cafe-3">{pedido.hora}</p>
                </Td>
                <Td>
                  <p className="font-semibold text-cafe">{pedido.cliente}</p>
                  <p className="text-xs text-cafe-3">{pedido.telefono}</p>
                </Td>
                <Td className="max-w-56 text-cafe-2">{pedido.detalle}</Td>
                <Td>
                  <Badge variant={pedido.entrega === "Domicilio" ? "neutral" : "good"}>
                    {pedido.entrega}{pedido.distancia ? ` · ${pedido.distancia}` : ""}
                  </Badge>
                </Td>
                <Td className="text-cafe-2">{pedido.pago}</Td>
                <Td className="font-heading font-bold">{formatCOP(pedido.total)}</Td>
                <Td>{estadoBadge(pedido.estado)}</Td>
                <Td className="text-right">
                  <Button
                    variant={pedido.estado === "Entregado" ? "secondary" : "primary"}
                    size="sm"
                    disabled={pedido.estado === "Entregado"}
                    onClick={() => avanzarEstado(pedido.id)}
                  >
                    {pedido.estado === "Entregado" ? "Cerrado" : "Avanzar"}
                  </Button>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AdminPage>
  );
}
