"use client";

import { useCallback, useEffect, useState } from "react";

interface Pedido {
  id: string;
  estado: string;
  total: number;
  subtotal: number;
  costoEnvio: number;
  tipoEntrega: string;
  observaciones?: string | null;
  createdAt: string;
  items: { cantidad: number; precio: number; plato: { nombre: string } }[];
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  EN_COCINA: { label: "En cocina",  color: "bg-orange-100 text-orange-800 border-orange-200" },
  LISTO:     { label: "Listo",      color: "bg-green-100  text-green-800  border-green-200"  },
  ENTREGADO: { label: "Entregado",  color: "bg-gray-100   text-gray-600   border-gray-200"   },
  CANCELADO: { label: "Cancelado",  color: "bg-red-100    text-red-700    border-red-200"     },
};

function formatCOP(v: number) {
  return `$${new Intl.NumberFormat("es-CO").format(v)}`;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function HistorialPage() {
  const [pedidos, setPedidos]   = useState<Pedido[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pedidos");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPedidos(data.pedidos ?? []);
    } catch {
      setError("No se pudieron cargar tus pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30_000);
    return () => clearInterval(interval);
  }, [cargar]);

  return (
    <div className="p-6 sm:p-8 text-cafe">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">Historial</p>
          <h1 className="mt-1 font-heading text-4xl font-extrabold text-cafe">Mis pedidos</h1>
          <p className="mt-2 text-sm text-cafe-2">El estado se actualiza automáticamente cada 30 segundos.</p>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={loading}
          className="text-sm font-semibold text-rojo-ladrillo hover:text-rojo-ladrillo-dark disabled:opacity-50 transition-colors"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      <div className="mt-6">
        {loading && pedidos.length === 0 ? (
          <div className="rounded-2xl border border-maiz-3 bg-elevated px-6 py-12 text-center text-cafe-2">
            <p className="text-sm">Cargando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-2xl border border-maiz-3 bg-elevated px-6 py-12 text-center">
            <p className="text-base font-semibold text-cafe">Aún no tienes pedidos</p>
            <p className="mt-1 text-sm text-cafe-2">Ve a <strong>Hacer pedido</strong> para comenzar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="rounded-2xl border border-maiz-3 bg-elevated p-5 shadow-warm-sm">
                {/* Encabezado */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-cafe-3">{formatFecha(pedido.createdAt)}</p>
                    <p className="mt-0.5 text-sm font-medium text-cafe-2">
                      {pedido.tipoEntrega === "DOMICILIO" ? "Domicilio" : "Recogida en tienda"}
                    </p>
                  </div>
                  <EstadoBadge estado={pedido.estado} />
                </div>

                {/* Ítems */}
                <div className="mt-4 divide-y divide-maiz-3">
                  {pedido.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
                      <span className="text-cafe">{item.cantidad} × {item.plato.nombre}</span>
                      <span className="text-cafe-2">{formatCOP(item.precio * item.cantidad)}</span>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="mt-3 space-y-1 border-t border-maiz-3 pt-3 text-sm">
                  <div className="flex justify-between text-cafe-2">
                    <span>Subtotal</span>
                    <span>{formatCOP(pedido.subtotal)}</span>
                  </div>
                  {pedido.costoEnvio > 0 && (
                    <div className="flex justify-between text-cafe-2">
                      <span>Envío</span>
                      <span>{formatCOP(pedido.costoEnvio)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-cafe">
                    <span>Total</span>
                    <span>{formatCOP(pedido.total)}</span>
                  </div>
                </div>

                {pedido.observaciones && (
                  <p className="mt-3 rounded-lg bg-maiz-2 px-3 py-2 text-xs text-cafe-2">
                    <span className="font-semibold">Nota:</span> {pedido.observaciones}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
