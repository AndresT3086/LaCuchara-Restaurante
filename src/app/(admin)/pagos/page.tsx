"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

type MetodoPago = "EFECTIVO" | "TARJETA_CREDITO" | "TARJETA_DEBITO" | "TRANSFERENCIA";

interface Pago {
  id: string;
  monto: number;
  metodo: MetodoPago;
  createdAt: string;
  pedido: {
    id: string;
    total: number;
    tipoEntrega: string;
    estado: string;
    cliente: { nombre: string; telefono?: string | null };
    items: { cantidad: number; plato: { nombre: string } }[];
  };
}

const METODO_LABEL: Record<MetodoPago, string> = {
  EFECTIVO:        "Efectivo",
  TARJETA_CREDITO: "Tarjeta crédito",
  TARJETA_DEBITO:  "Tarjeta débito",
  TRANSFERENCIA:   "Transferencia",
};

function formatCOP(v: number) {
  return `$${new Intl.NumberFormat("es-CO").format(v)}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function PagosPage() {
  const [pagos, setPagos]     = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/pagos");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPagos(data.pagos ?? []);
      } catch {
        setError("No se pudieron cargar los pagos.");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const pagosHoy = useMemo(() => pagos.filter((p) => isToday(p.createdAt)), [pagos]);
  const totalHoy = pagosHoy.reduce((s, p) => s + p.monto, 0);
  const totalGlobal = pagos.reduce((s, p) => s + p.monto, 0);

  const porMetodo = useMemo(() => {
    const acc: Partial<Record<MetodoPago, number>> = {};
    for (const p of pagos) {
      acc[p.metodo] = (acc[p.metodo] ?? 0) + p.monto;
    }
    return acc;
  }, [pagos]);

  const metodoTop = (Object.entries(porMetodo) as [MetodoPago, number][])
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <AdminPage
      eyebrow="Finanzas"
      title="Pagos"
      description="Registro de todos los pagos recibidos de los pedidos."
    >
      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pagos hoy"      value={String(pagosHoy.length)}  detail="transacciones"        tone="warn" />
        <StatCard label="Recaudado hoy"  value={formatCOP(totalHoy)}      detail="suma del día"          tone="good" />
        <StatCard label="Total acumulado" value={formatCOP(totalGlobal)}  detail="todos los pagos"       tone="blue" />
        <StatCard label="Método principal" value={metodoTop ? METODO_LABEL[metodoTop[0]] : "—"} detail={metodoTop ? formatCOP(metodoTop[1]) : "sin datos"} tone="neutral" />
      </div>

      {/* Resumen por método */}
      <Panel title="Por método de pago" meta={loading ? "Cargando..." : `${pagos.length} pagos registrados`}>
        <div className="grid grid-cols-2 gap-px bg-maiz-3 md:grid-cols-4">
          {(["EFECTIVO", "TARJETA_CREDITO", "TARJETA_DEBITO", "TRANSFERENCIA"] as MetodoPago[]).map((m) => (
            <div key={m} className="bg-elevated px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-cafe-3">{METODO_LABEL[m]}</p>
              <p className="mt-1 font-heading text-xl font-extrabold text-cafe">{formatCOP(porMetodo[m] ?? 0)}</p>
              <p className="text-xs text-cafe-3">
                {pagos.filter((p) => p.metodo === m).length} pago{pagos.filter((p) => p.metodo === m).length !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Tabla de pagos */}
      <Panel title="Historial de pagos" meta={loading ? "Cargando..." : `${pagos.length} registros`}>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando pagos...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th>Pedido</Th>
                <Th>Método</Th>
                <Th>Monto</Th>
                <Th>Estado pedido</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagos.length === 0 ? (
                <TableRow>
                  <Td colSpan={6} className="py-8 text-center text-cafe-3">No hay pagos registrados.</Td>
                </TableRow>
              ) : pagos.map((pago) => (
                <TableRow key={pago.id}>
                  <Td className="text-xs text-cafe-3 whitespace-nowrap">{formatDateTime(pago.createdAt)}</Td>
                  <Td>
                    <p className="font-semibold text-cafe">{pago.pedido.cliente.nombre}</p>
                    {pago.pedido.cliente.telefono && (
                      <p className="text-xs text-cafe-3">{pago.pedido.cliente.telefono}</p>
                    )}
                  </Td>
                  <Td>
                    <p className="font-mono text-xs text-cafe-2">{pago.pedido.id.slice(0, 8)}…</p>
                    <p className="text-xs text-cafe-3 max-w-[180px] truncate">
                      {pago.pedido.items.map((i) => `${i.cantidad}× ${i.plato.nombre}`).join(", ")}
                    </p>
                  </Td>
                  <Td>
                    <Badge variant="neutral">{METODO_LABEL[pago.metodo]}</Badge>
                  </Td>
                  <Td className="font-heading font-bold text-cafe">{formatCOP(pago.monto)}</Td>
                  <Td>
                    <Badge variant={
                      pago.pedido.estado === "ENTREGADO" ? "good"
                      : pago.pedido.estado === "CANCELADO" ? "bad"
                      : "warn"
                    }>
                      {pago.pedido.estado.replace("_", " ")}
                    </Badge>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </AdminPage>
  );
}
