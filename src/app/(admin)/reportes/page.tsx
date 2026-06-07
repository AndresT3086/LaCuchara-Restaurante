"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";
import { useSession } from "@/contexts/SessionContext";

interface Pedido {
  id: string;
  total: number;
  createdAt: string;
  items: Array<{
    cantidad: number;
    plato: { id: string; nombre: string };
  }>;
}

interface ResumenDia {
  dia: string;
  fecha: string;
  pedidos: number;
  ventas: number;
  mejor: string;
}

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function ReportesPage() {
  const { user: sessionUser } = useSession();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPedidos = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/pedidos");
        if (!res.ok) throw new Error();

        const data = await res.json();
        setPedidos(data.pedidos ?? []);
      } catch {
        setError("No se pudieron cargar los reportes desde la API.");
      } finally {
        setLoading(false);
      }
    };

    cargarPedidos();
  }, []);

  const resumen = useMemo<ResumenDia[]>(() => {
    const porDia = new Map<string, { pedidos: number; ventas: number; platos: Map<string, number> }>();

    for (const pedido of pedidos) {
      const fecha = new Date(pedido.createdAt).toISOString().split("T")[0];
      const actual = porDia.get(fecha) ?? { pedidos: 0, ventas: 0, platos: new Map<string, number>() };

      actual.pedidos += 1;
      actual.ventas += pedido.total;

      for (const item of pedido.items) {
        actual.platos.set(item.plato.nombre, (actual.platos.get(item.plato.nombre) ?? 0) + item.cantidad);
      }

      porDia.set(fecha, actual);
    }

    return Array.from(porDia.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
      .map(([fecha, data]) => {
        const mejor = Array.from(data.platos.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin ventas";

        return {
          fecha,
          dia: new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CO", { weekday: "long" }),
          pedidos: data.pedidos,
          ventas: data.ventas,
          mejor,
        };
      });
  }, [pedidos]);

  const ventasTotales = resumen.reduce((total, dia) => total + dia.ventas, 0);
  const pedidosTotales = resumen.reduce((total, dia) => total + dia.pedidos, 0);
  const platoMasVendido = useMemo(() => {
    const acumulado = new Map<string, number>();

    for (const pedido of pedidos) {
      for (const item of pedido.items) {
        acumulado.set(item.plato.nombre, (acumulado.get(item.plato.nombre) ?? 0) + item.cantidad);
      }
    }

    return Array.from(acumulado.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin datos";
  }, [pedidos]);

  if (sessionUser && sessionUser.role !== "ADMIN") {
    return (
      <AdminPage eyebrow="Administración" title="Reportes" description="Esta sección solo está disponible para administradores.">
        <Panel title="Acceso restringido">
          <div className="p-6 text-sm text-cafe-2">No tienes permiso para ver esta página.</div>
        </Panel>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      eyebrow="Administración"
      title="Reportes"
      description="Indicadores simples para ventas, rotación del menú y decisiones de inventario."
    >
      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Ventas" value={formatCOP(ventasTotales)} detail="últimos días con pedidos" tone="good" />
        <StatCard label="Pedidos" value={String(pedidosTotales)} detail="registros encontrados" />
        <StatCard label="Más vendido" value={platoMasVendido} detail="según items de pedidos" tone="blue" />
      </div>

      <Panel title="Resumen por día" meta="Calculado desde /api/pedidos">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando reportes...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Día</Th>
                <Th>Pedidos</Th>
                <Th>Ventas</Th>
                <Th>Más vendido</Th>
                <Th>Estado</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumen.map((fila) => (
                <TableRow key={fila.fecha}>
                  <Td className="font-semibold capitalize">{fila.dia}</Td>
                  <Td>{fila.pedidos}</Td>
                  <Td className="font-heading font-bold">{formatCOP(fila.ventas)}</Td>
                  <Td className="text-cafe-2">{fila.mejor}</Td>
                  <Td><Badge variant="good">Real</Badge></Td>
                </TableRow>
              ))}
              {resumen.length === 0 && (
                <TableRow>
                  <Td colSpan={5} className="py-8 text-center text-cafe-3">No hay pedidos para reportar.</Td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Panel>
    </AdminPage>
  );
}
