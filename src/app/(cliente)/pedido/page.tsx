"use client";

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
}

interface ItemCarrito {
  platoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface PedidoConfirmado {
  id: string;
  total: number;
  items: { cantidad: number; precio: number; plato: { nombre: string } }[];
}

type TipoEntrega = "DOMICILIO" | "RECOGIDA";

function formatCOP(v: number) {
  return `$${new Intl.NumberFormat("es-CO").format(v)}`;
}

export default function PedidoPage() {
  const { user } = useSession();

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
  const [confirmado, setConfirmado] = useState<PedidoConfirmado | null>(null);

  const cargarDatos = useCallback(async () => {
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
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const clienteActual = useMemo(
    () => clientes.find((c) => c.email?.toLowerCase() === user?.email.toLowerCase()) ?? null,
    [clientes, user?.email]
  );

  const platoSeleccionado = useMemo(
    () => platos.find((p) => p.id === platoId) ?? null,
    [platoId, platos]
  );

  const totalCarrito = useMemo(
    () => carrito.reduce((s, i) => s + i.precio * i.cantidad, 0),
    [carrito]
  );

  const handleAgregar = () => {
    if (!platoSeleccionado) return;
    const n = Number(cantidad);
    if (!n || n <= 0) { setError("Ingresa una cantidad válida."); return; }
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
    if (tipoEntrega === "DOMICILIO" && (!latCliente || !lngCliente)) {
      setError("Ingresa tus coordenadas para calcular el costo de envío.");
      return;
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
      const res  = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo crear el pedido."); return; }
      setConfirmado(data.pedido);
      setCarrito([]);
      setObservaciones("");
      setLatCliente("");
      setLngCliente("");
    } catch {
      setError("Error de conexión al crear el pedido.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 text-cafe">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">Pedido</p>
      <h1 className="mt-1 font-heading text-4xl font-extrabold text-cafe">Arma tu pedido</h1>
      <p className="mt-2 text-sm text-cafe-2">Agrega los platos que quieras y confirma al final.</p>

      {/* Confirmación */}
      {confirmado && (
        <div className="mt-6 rounded-2xl border border-hoja/30 bg-hoja/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-hoja">¡Pedido confirmado!</p>
              <p className="mt-0.5 text-sm text-cafe-2">Revisa el estado en <strong>Mis pedidos</strong>.</p>
            </div>
            <button type="button" onClick={() => setConfirmado(null)} className="text-cafe-3 hover:text-cafe">✕</button>
          </div>
          <div className="mt-3 rounded-xl border border-hoja/20 bg-white/50 p-4 text-sm space-y-1">
            {confirmado.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.cantidad} × {item.plato.nombre}</span>
                <span className="font-semibold">{formatCOP(item.precio * item.cantidad)}</span>
              </div>
            ))}
            <div className="border-t border-hoja/20 pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span><span>{formatCOP(confirmado.total)}</span>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-4 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Formulario */}
        <div className="rounded-2xl border border-maiz-3 bg-elevated p-5 shadow-warm-md space-y-6">
          {/* Tipo de entrega */}
          <div>
            <h2 className="mb-3 font-heading text-lg font-extrabold">¿Cómo quieres recibirlo?</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["DOMICILIO", "RECOGIDA"] as TipoEntrega[]).map((tipo) => (
                <button key={tipo} type="button" onClick={() => setTipoEntrega(tipo)}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${tipoEntrega === tipo ? "border-rojo-ladrillo bg-rojo-ladrillo/5" : "border-maiz-3 text-cafe-2 hover:border-maiz-4"}`}>
                  <p className="text-sm font-bold">{tipo === "DOMICILIO" ? "Domicilio" : "Recoger en tienda"}</p>
                  <p className="mt-0.5 text-xs opacity-70">{tipo === "DOMICILIO" ? "Te lo llevamos" : "Sin costo de envío"}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Plato */}
          <div>
            <h2 className="mb-3 font-heading text-lg font-extrabold">Plato</h2>
            {loadingData ? <p className="text-sm text-cafe-3">Cargando platos...</p> : (
              <select value={platoId} onChange={(e) => setPlatoId(e.target.value)}
                className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15">
                {platos.map((p) => <option key={p.id} value={p.id}>{p.nombre} — {formatCOP(p.precio)}</option>)}
              </select>
            )}
            {platoSeleccionado && <p className="mt-2 text-sm text-cafe-2">{platoSeleccionado.descripcion}</p>}
          </div>

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

        {/* Carrito */}
        <aside className="h-fit rounded-2xl border border-maiz-3 bg-cafe p-5 text-maiz shadow-warm-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">Carrito</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold">Tu pedido</h2>
          <p className="mt-2 text-sm text-maiz/60">{clienteActual?.nombre ?? "—"}</p>

          <div className="mt-4 space-y-2">
            {carrito.length === 0
              ? <p className="text-sm text-maiz/50">Aún no has agregado platos.</p>
              : carrito.map((item) => (
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
              ))
            }
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

          <Button type="button" className="mt-6 w-full" loading={creating}
            disabled={!clienteActual || carrito.length === 0 || loadingData} onClick={handleConfirmar}>
            Confirmar pedido
          </Button>
        </aside>
      </div>
    </div>
  );
}
