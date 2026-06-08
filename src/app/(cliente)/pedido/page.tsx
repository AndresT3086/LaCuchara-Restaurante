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
  const [tipoEntrega, setTipoEntrega]     = useState<TipoEntrega>("DOMICILIO");
  const [observaciones, setObservaciones] = useState("");
  const [loadingData, setLoadingData]     = useState(true);
  const [creating, setCreating]           = useState(false);
  const [error, setError]                 = useState("");
  const [confirmado, setConfirmado]       = useState<PedidoConfirmado | null>(null);

  // Dirección
  const [direccionTexto, setDireccionTexto]           = useState("");
  const [verificando, setVerificando]                 = useState(false);
  const [direccionVerificada, setDireccionVerificada] = useState("");
  const [costoEnvio, setCostoEnvio]                   = useState<number | null>(null);
  const [mensajeEnvio, setMensajeEnvio]               = useState("");
  const [latCliente, setLatCliente]                   = useState<number | null>(null);
  const [lngCliente, setLngCliente]                   = useState<number | null>(null);
  const [sinCobertura, setSinCobertura]               = useState(false);

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

  useEffect(() => {
    setDireccionTexto("");
    setDireccionVerificada("");
    setCostoEnvio(null);
    setMensajeEnvio("");
    setLatCliente(null);
    setLngCliente(null);
    setSinCobertura(false);
    setError("");
  }, [tipoEntrega]);

  const clienteActual = useMemo(
    () => clientes.find((c) => c.email?.toLowerCase() === user?.email?.toLowerCase()) ?? null,
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

  const totalConEnvio = useMemo(
    () => totalCarrito + (costoEnvio ?? 0),
    [totalCarrito, costoEnvio]
  );

  // ── Verificar dirección ────────────────────────────────────────────────────
  const handleVerificar = async () => {
    if (!direccionTexto.trim()) { setError("Escribe tu dirección."); return; }
    setVerificando(true);
    setError("");
    setDireccionVerificada("");
    setCostoEnvio(null);
    setSinCobertura(false);

    try {
      const geoRes  = await fetch("/api/geocodificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion: direccionTexto }),
      });
      const geoData = await geoRes.json();
      console.log("Respuesta geocodificar:", geoData);

      if (!geoRes.ok || !geoData.encontrado) {
        setError(geoData.error || "No encontramos esa dirección.");
        return;
      }

      setLatCliente(geoData.lat);
      setLngCliente(geoData.lng);

      const envioRes  = await fetch("/api/domicilio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: geoData.lat, lng: geoData.lng }),
      });
      const envioData = await envioRes.json();

      if (!envioData.tiene_cobertura) {
        setSinCobertura(true);
        setDireccionVerificada(geoData.direccion_normalizada);
        setError(envioData.mensaje);
        return;
      }

      setDireccionVerificada(geoData.direccion_normalizada);
      setCostoEnvio(envioData.costo);
      setMensajeEnvio(envioData.mensaje);
    } catch {
      setError("Error al verificar la dirección. Intenta de nuevo.");
    } finally {
      setVerificando(false);
    }
  };

  const limpiarDireccion = () => {
    setDireccionVerificada("");
    setCostoEnvio(null);
    setLatCliente(null);
    setLngCliente(null);
    setSinCobertura(false);
  };

  // ── Agregar al carrito ─────────────────────────────────────────────────────
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

  // ── Confirmar pedido ───────────────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (!clienteActual || carrito.length === 0) return;
    if (tipoEntrega === "DOMICILIO" && (!latCliente || sinCobertura)) {
      setError("Verifica tu dirección antes de confirmar.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        clienteId:    clienteActual.id,
        tipoEntrega,
        items:        carrito.map((i) => ({ platoId: i.platoId, cantidad: i.cantidad })),
        observaciones: observaciones.trim() || null,
      };
      if (tipoEntrega === "DOMICILIO") {
        body.latCliente = latCliente;
        body.lngCliente = lngCliente;
      }
      const res  = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo crear el pedido."); return; }
      setConfirmado(data.pedido);
      setCarrito([]);
      setObservaciones("");
      setDireccionTexto("");
      limpiarDireccion();
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
              <span>Total</span>
              <span>{formatCOP(confirmado.total)}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-maiz-3 bg-elevated p-5 shadow-warm-md space-y-6">

          {/* Tipo de entrega */}
          <div>
            <h2 className="mb-3 font-heading text-lg font-extrabold">¿Cómo quieres recibirlo?</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["DOMICILIO", "RECOGIDA"] as TipoEntrega[]).map((tipo) => (
                <button key={tipo} type="button" onClick={() => setTipoEntrega(tipo)}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${tipoEntrega === tipo ? "border-rojo-ladrillo bg-rojo-ladrillo/5" : "border-maiz-3 text-cafe-2 hover:border-maiz-4"}`}>
                  <p className="text-sm font-bold">{tipo === "DOMICILIO" ? "🛵 Domicilio" : "🏠 Recoger en punto"}</p>
                  <p className="mt-0.5 text-xs opacity-70">{tipo === "DOMICILIO" ? "Te lo llevamos" : "Sin costo de envío"}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dirección domicilio */}
          {tipoEntrega === "DOMICILIO" && (
            <div>
              <h2 className="mb-3 font-heading text-lg font-extrabold">Dirección de entrega</h2>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
                  placeholder="Cra 34A #75 Sur 50, Sabaneta"
                  value={direccionTexto}
                  onChange={(e) => { setDireccionTexto(e.target.value); limpiarDireccion(); }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerificar()}
                  disabled={verificando}
                />
                <button
                  type="button"
                  onClick={handleVerificar}
                  disabled={verificando || !direccionTexto.trim()}
                  className="rounded-md bg-cafe px-4 py-2.5 text-sm font-semibold text-maiz hover:bg-cafe/90 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {verificando ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-maiz/30 border-t-maiz" />
                      Buscando...
                    </span>
                  ) : "Verificar"}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-cafe-3">
                Escribe la dirección completa incluyendo el municipio. Ej: Cra 34A #75 Sur 50, Sabaneta
              </p>

              {/* Verificada con éxito */}
              {direccionVerificada && !sinCobertura && costoEnvio !== null && (
                <div className="mt-3 rounded-lg border border-hoja/30 bg-hoja/10 px-4 py-3">
                  <p className="text-sm font-semibold text-hoja">✓ Dirección encontrada</p>
                  <p className="text-sm text-cafe mt-0.5">{direccionVerificada}</p>
                  <p className="text-sm font-medium text-cafe mt-1">
                    Costo de envío:{" "}
                    <span className="font-bold text-rojo-ladrillo">{formatCOP(costoEnvio)}</span>
                    <span className="ml-2 text-xs text-cafe-3">— {mensajeEnvio}</span>
                  </p>
                  <button type="button" onClick={limpiarDireccion} className="mt-1 text-xs text-cafe-3 underline hover:text-cafe">
                    Cambiar dirección
                  </button>
                </div>
              )}

              {/* Sin cobertura */}
              {sinCobertura && (
                <div className="mt-3 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3">
                  <p className="text-sm font-semibold text-aji">Sin cobertura de domicilio</p>
                  <p className="text-sm text-cafe-2 mt-1">
                    Solo llegamos hasta 5 km del Parque de Sabaneta. Puedes{" "}
                    <button type="button" className="font-semibold text-rojo-ladrillo underline" onClick={() => setTipoEntrega("RECOGIDA")}>
                      recoger en el punto
                    </button>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recogida */}
          {tipoEntrega === "RECOGIDA" && (
            <div className="rounded-lg border border-maiz-3 bg-maiz px-4 py-3 text-sm">
              <p className="font-semibold text-cafe">📍 Parque Principal de Sabaneta, Antioquia</p>
              <p className="mt-0.5 text-xs text-cafe-3">Lunes a sábado, 11:00 a.m. – 7:00 p.m.</p>
            </div>
          )}

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

          <Input
            label="Observaciones (opcional)"
            placeholder="Sin cebolla, extra salsa..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Carrito */}
        <aside className="h-fit rounded-2xl border border-maiz-3 bg-cafe p-5 text-maiz shadow-warm-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">Carrito</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold">Tu pedido</h2>
          <p className="mt-2 text-sm text-maiz/60">{clienteActual?.nombre ?? "—"}</p>

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
                  <button type="button" onClick={() => setCarrito((p) => p.filter((i) => i.platoId !== item.platoId))} className="text-maiz/40 hover:text-aji transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>

          {carrito.length > 0 && (
            <div className="mt-4 border-t border-maiz/15 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-maiz/70">
                <span>Subtotal</span><span>{formatCOP(totalCarrito)}</span>
              </div>
              {tipoEntrega === "RECOGIDA" ? (
                <div className="flex justify-between text-hoja text-xs"><span>Envío</span><span>Gratis</span></div>
              ) : costoEnvio !== null ? (
                <div className="flex justify-between text-maiz/70"><span>Envío</span><span>{formatCOP(costoEnvio)}</span></div>
              ) : (
                <div className="flex justify-between text-maiz/50 text-xs"><span>Envío</span><span>Verifica tu dirección</span></div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-maiz/15">
                <span>Total</span>
                <span>{formatCOP(tipoEntrega === "RECOGIDA" ? totalCarrito : totalConEnvio)}</span>
              </div>
            </div>
          )}

          <Button type="button" className="mt-6 w-full" loading={creating}
            disabled={!clienteActual || carrito.length === 0 || loadingData || (tipoEntrega === "DOMICILIO" && (!latCliente || sinCobertura))}
            onClick={handleConfirmar}>
            Confirmar pedido
          </Button>

          {tipoEntrega === "DOMICILIO" && !direccionVerificada && carrito.length > 0 && (
            <p className="mt-2 text-center text-xs text-maiz/50">Verifica tu dirección para habilitar el botón</p>
          )}
        </aside>
      </div>
    </div>
  );
}