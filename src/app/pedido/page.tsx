"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useSession } from "@/contexts/SessionContext";

interface Plato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  categoria: { nombre: string };
}

interface Cliente {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
}

interface ItemCarrito {
  platoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface PedidoHistorial {
  id: string;
  estado: string;
  total: number;
  subtotal: number;
  costoEnvio: number;
  tipoEntrega: string;
  createdAt: string;
  items: { cantidad: number; precio: number; plato: { nombre: string } }[];
}

type TipoEntrega = "DOMICILIO" | "RECOGIDA";

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",   color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  EN_COCINA:  { label: "En cocina",   color: "bg-orange-100 text-orange-800 border-orange-200" },
  LISTO:      { label: "Listo",       color: "bg-green-100  text-green-800  border-green-200"  },
  ENTREGADO:  { label: "Entregado",   color: "bg-gray-100   text-gray-600   border-gray-200"   },
  CANCELADO:  { label: "Cancelado",   color: "bg-red-100    text-red-700    border-red-200"     },
};

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
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

export default function PedidoPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  const [platos, setPlatos]     = useState<Plato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [platoId, setPlatoId]   = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [carrito, setCarrito]   = useState<ItemCarrito[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("DOMICILIO");
  const [latCliente, setLatCliente]   = useState("");
  const [lngCliente, setLngCliente]   = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState("");

  // Historial de pedidos
  const [pedidos, setPedidos]           = useState<PedidoHistorial[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<PedidoHistorial | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login");
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    const cargar = async () => {
      setLoadingData(true);
      try {
        const [pr, cr] = await Promise.all([fetch("/api/platos"), fetch("/api/clientes")]);
        if (!pr.ok || !cr.ok) throw new Error();
        const [pd, cd] = await Promise.all([pr.json(), cr.json()]);
        const disponibles = (pd.platos ?? []).filter((p: Plato) => p.disponible);
        setPlatos(disponibles);
        setClientes(cd.clientes ?? []);
        setPlatoId(disponibles[0]?.id ?? "");
      } catch {
        setError("No se pudieron cargar los datos del pedido.");
      } finally {
        setLoadingData(false);
      }
    };
    cargar();
  }, [user]);

  const cargarPedidos = useCallback(async () => {
    setLoadingPedidos(true);
    try {
      const res = await fetch("/api/pedidos");
      if (res.ok) {
        const data = await res.json();
        setPedidos(data.pedidos ?? []);
      }
    } finally {
      setLoadingPedidos(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    cargarPedidos();
    // Refrescar estado cada 30 segundos
    const interval = setInterval(cargarPedidos, 30_000);
    return () => clearInterval(interval);
  }, [user, cargarPedidos]);

  const clienteActual = useMemo(
    () => clientes.find((c) => c.email?.toLowerCase() === user?.email.toLowerCase()) ?? null,
    [clientes, user?.email]
  );

  const platoSeleccionado = useMemo(
    () => platos.find((p) => p.id === platoId) ?? null,
    [platoId, platos]
  );

  const totalCarrito = useMemo(
    () => carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [carrito]
  );

  const handleAgregar = () => {
    if (!platoSeleccionado) return;
    const n = Number(cantidad);
    if (!cantidad || Number.isNaN(n) || n <= 0) { setError("Ingresa una cantidad válida."); return; }
    setError("");
    setCarrito((prev) => {
      const ex = prev.find((i) => i.platoId === platoSeleccionado.id);
      if (ex) return prev.map((i) => i.platoId === platoSeleccionado.id ? { ...i, cantidad: i.cantidad + n } : i);
      return [...prev, { platoId: platoSeleccionado.id, nombre: platoSeleccionado.nombre, precio: platoSeleccionado.precio, cantidad: n }];
    });
    setCantidad("1");
  };

  const handleConfirmar = async () => {
    if (!clienteActual || carrito.length === 0) return;
    if (tipoEntrega === "DOMICILIO") {
      const lat = Number(latCliente), lng = Number(lngCliente);
      if (!latCliente || !lngCliente || Number.isNaN(lat) || Number.isNaN(lng)) {
        setError("Ingresa tus coordenadas para calcular el costo de envío.");
        return;
      }
    }
    setCreating(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        clienteId: clienteActual.id,
        tipoEntrega,
        items: carrito.map((i) => ({ platoId: i.platoId, cantidad: i.cantidad })),
        observaciones: observaciones.trim() || null,
      };
      if (tipoEntrega === "DOMICILIO") {
        body.latCliente = Number(latCliente);
        body.lngCliente = Number(lngCliente);
      }
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo crear el pedido."); return; }

      // Mostrar confirmación y refrescar historial
      setPedidoConfirmado(data.pedido);
      setCarrito([]);
      setObservaciones("");
      setLatCliente("");
      setLngCliente("");
      cargarPedidos();
    } catch {
      setError("Error de conexión al crear el pedido.");
    } finally {
      setCreating(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-maiz text-cafe">
        <div className="rounded-2xl border border-maiz-3 bg-elevated px-6 py-5 shadow-warm-sm">
          <p className="font-heading text-xl font-extrabold">Validando sesión...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-maiz text-cafe">
      <header className="border-b border-maiz-3 bg-maiz/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-heading text-2xl font-extrabold text-rojo-ladrillo">La Cuchara</Link>
          <span className="text-sm font-semibold text-cafe-2">{user.name}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">

        {/* Banner de confirmación */}
        {pedidoConfirmado && (
          <div className="rounded-2xl border border-hoja/30 bg-hoja/10 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-hoja">¡Pedido confirmado!</p>
                <h2 className="mt-1 font-heading text-2xl font-extrabold text-cafe">
                  Tu pedido está en camino
                </h2>
                <p className="mt-1 text-sm text-cafe-2">
                  Puedes ver el estado de tu pedido más abajo. Te avisamos cuando esté listo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPedidoConfirmado(null)}
                className="text-cafe-3 hover:text-cafe text-lg leading-none"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-hoja/20 bg-white/50 p-4 text-sm space-y-1">
              {pedidoConfirmado.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.cantidad} × {item.plato.nombre}</span>
                  <span className="font-semibold">{formatCOP(item.precio * item.cantidad)}</span>
                </div>
              ))}
              <div className="border-t border-hoja/20 pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCOP(pedidoConfirmado.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Formulario + carrito */}
        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-maiz-3 bg-elevated p-5 shadow-warm-md sm:p-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">Pedido cliente</p>
            <h1 className="font-heading text-4xl font-extrabold text-cafe">Arma tu pedido</h1>
            <p className="mt-2 text-sm leading-relaxed text-cafe-2">Agrega los platos que quieras al carrito y confirma al final.</p>

            {error && <div className="mt-5 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>}

            <div className="mt-7 space-y-6">
              {/* Tipo de entrega */}
              <section>
                <h2 className="mb-3 font-heading text-xl font-extrabold">¿Cómo quieres recibir tu pedido?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(["DOMICILIO", "RECOGIDA"] as TipoEntrega[]).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoEntrega(tipo)}
                      className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                        tipoEntrega === tipo
                          ? "border-rojo-ladrillo bg-rojo-ladrillo/5 text-cafe"
                          : "border-maiz-3 text-cafe-2 hover:border-maiz-4"
                      }`}
                    >
                      <p className="text-sm font-bold">{tipo === "DOMICILIO" ? "Domicilio" : "Recoger en tienda"}</p>
                      <p className="mt-0.5 text-xs opacity-70">{tipo === "DOMICILIO" ? "Te lo llevamos a tu dirección" : "Sin costo de envío"}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Plato */}
              <section>
                <h2 className="mb-3 font-heading text-xl font-extrabold">Plato</h2>
                {loadingData ? <p className="text-sm text-cafe-3">Cargando platos...</p> : (
                  <select
                    value={platoId}
                    onChange={(e) => setPlatoId(e.target.value)}
                    className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
                  >
                    {platos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} — {formatCOP(p.precio)}</option>
                    ))}
                  </select>
                )}
                {platoSeleccionado && <p className="mt-2 text-sm text-cafe-2">{platoSeleccionado.descripcion}</p>}
              </section>

              <div className="flex items-end gap-3">
                <div className="w-32">
                  <Input label="Cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                </div>
                <Button type="button" onClick={handleAgregar} disabled={loadingData || !platoSeleccionado} className="flex-1">
                  Agregar al carrito
                </Button>
              </div>

              {tipoEntrega === "DOMICILIO" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Latitud" placeholder="6.15155" value={latCliente} onChange={(e) => setLatCliente(e.target.value)} />
                  <Input label="Longitud" placeholder="-75.61657" value={lngCliente} onChange={(e) => setLngCliente(e.target.value)} />
                </div>
              )}

              <Input label="Observaciones" placeholder="Indicaciones para el pedido (opcional)" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} maxLength={200} />
            </div>
          </div>

          {/* Carrito */}
          <aside className="h-fit rounded-2xl border border-maiz-3 bg-cafe p-5 text-maiz shadow-warm-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">Carrito</p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold">Tu pedido</h2>
            <p className="mt-3 text-sm text-maiz/60">{clienteActual?.nombre ?? "Sin cliente asociado"}</p>

            <div className="mt-4 space-y-2">
              {carrito.length === 0 ? (
                <p className="text-sm text-maiz/50">Aún no has agregado platos.</p>
              ) : carrito.map((item) => (
                <div key={item.platoId} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{item.nombre}</p>
                    <p className="text-maiz/60">{item.cantidad} × {formatCOP(item.precio)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCOP(item.precio * item.cantidad)}</span>
                    <button type="button" onClick={() => setCarrito((p) => p.filter((i) => i.platoId !== item.platoId))} className="text-maiz/40 hover:text-aji transition-colors" aria-label={`Quitar ${item.nombre}`}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            {carrito.length > 0 && (
              <div className="mt-4 border-t border-maiz/15 pt-4 space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-maiz/60">Subtotal</span>
                  <span>{formatCOP(totalCarrito)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-maiz/60">Envío</span>
                  <span className="text-maiz/60">{tipoEntrega === "RECOGIDA" ? "Gratis" : "Según tu ubicación"}</span>
                </div>
              </div>
            )}

            <Button type="button" className="mt-6 w-full" loading={creating} disabled={!clienteActual || carrito.length === 0 || loadingData} onClick={handleConfirmar}>
              Confirmar pedido
            </Button>
          </aside>
        </section>

        {/* Historial de pedidos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl font-extrabold text-cafe">Mis pedidos</h2>
            <button
              type="button"
              onClick={cargarPedidos}
              disabled={loadingPedidos}
              className="text-sm font-semibold text-rojo-ladrillo hover:text-rojo-ladrillo-dark disabled:opacity-50"
            >
              {loadingPedidos ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="rounded-2xl border border-maiz-3 bg-elevated px-6 py-10 text-center text-cafe-2">
              <p className="text-sm">Aún no tienes pedidos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="rounded-2xl border border-maiz-3 bg-elevated p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-cafe-3">{formatFecha(pedido.createdAt)}</p>
                      <p className="mt-0.5 text-sm text-cafe-2">
                        {pedido.tipoEntrega === "DOMICILIO" ? "Domicilio" : "Recogida en tienda"}
                      </p>
                    </div>
                    <EstadoBadge estado={pedido.estado} />
                  </div>

                  <div className="mt-3 space-y-0.5">
                    {pedido.items.map((item, i) => (
                      <p key={i} className="text-sm text-cafe">
                        {item.cantidad} × {item.plato.nombre}
                        <span className="text-cafe-3"> — {formatCOP(item.precio * item.cantidad)}</span>
                      </p>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-maiz-3 pt-3 flex justify-between text-sm font-semibold text-cafe">
                    <span>Total</span>
                    <span>{formatCOP(pedido.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
