"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  direccion?: string | null;
  puntoReferencia?: string | null;
}

interface ItemCarrito {
  platoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function PedidoPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  const [platos, setPlatos]         = useState<Plato[]>([]);
  const [clientes, setClientes]     = useState<Cliente[]>([]);
  const [platoId, setPlatoId]       = useState("");
  const [cantidad, setCantidad]     = useState("1");
  const [carrito, setCarrito]       = useState<ItemCarrito[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [loadingData, setLoadingData]     = useState(true);
  const [creating, setCreating]           = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");

  // Tipo de entrega
  const [tipoEntrega, setTipoEntrega] = useState<"DOMICILIO" | "RECOGIDA">("DOMICILIO");

  // Dirección en texto y coordenadas resultantes
  const [direccionTexto, setDireccionTexto]           = useState("");
  const [verificando, setVerificando]                 = useState(false);
  const [direccionVerificada, setDireccionVerificada] = useState("");
  const [costoEnvio, setCostoEnvio]                   = useState<number | null>(null);
  const [mensajeEnvio, setMensajeEnvio]               = useState("");
  const [latCliente, setLatCliente]                   = useState<number | null>(null);
  const [lngCliente, setLngCliente]                   = useState<number | null>(null);
  const [sinCobertura, setSinCobertura]               = useState(false);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login");
  }, [loading, router, user]);

  // Cargar platos y cliente al montar
  useEffect(() => {
    if (!user) return;
    const cargarDatos = async () => {
      setLoadingData(true);
      setError("");
      try {
        const [platosRes, clientesRes] = await Promise.all([
          fetch("/api/platos"),
          fetch("/api/clientes"),
        ]);
        if (!platosRes.ok || !clientesRes.ok) throw new Error();
        const [platosData, clientesData] = await Promise.all([
          platosRes.json(),
          clientesRes.json(),
        ]);
        const disponibles: Plato[] = (platosData.platos ?? []).filter((p: Plato) => p.disponible);
        setPlatos(disponibles);
        setClientes(clientesData.clientes ?? []);
        setPlatoId(disponibles[0]?.id ?? "");
      } catch {
        setError("No se pudieron cargar los datos del pedido.");
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatos();
  }, [user]);

  // Limpiar datos de dirección cuando cambia el tipo de entrega
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
    () => carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    [carrito]
  );

  const totalConEnvio = useMemo(
    () => totalCarrito + (costoEnvio ?? 0),
    [totalCarrito, costoEnvio]
  );

  // ── Verificar dirección ────────────────────────────────────────────────────
  const handleVerificarDireccion = async () => {
    if (!direccionTexto.trim()) {
      setError("Escribe tu dirección antes de verificar.");
      return;
    }

    setVerificando(true);
    setError("");
    setDireccionVerificada("");
    setCostoEnvio(null);
    setSinCobertura(false);

    try {
      // 1. Geocodificar la dirección
      const geoRes = await fetch("/api/geocodificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion: direccionTexto }),
      });
      const geoData = await geoRes.json();

      if (!geoRes.ok || !geoData.encontrado) {
        setError(geoData.error || "No encontramos esa dirección. Sé más específico, por ejemplo: 'Carrera 43A #18-12, El Poblado, Medellín'");
        return;
      }

      setLatCliente(geoData.lat);
      setLngCliente(geoData.lng);

      // 2. Calcular costo de envío con las coordenadas obtenidas
      const envioRes = await fetch("/api/domicilio/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: geoData.lat, lng: geoData.lng }),
      });
      const envioData = await envioRes.json();

      if (!envioData.tiene_cobertura) {
        setSinCobertura(true);
        setError(envioData.mensaje);
        setDireccionVerificada(geoData.direccion_normalizada);
        return;
      }

      // Todo bien: mostrar dirección normalizada y costo
      setDireccionVerificada(geoData.direccion_normalizada);
      setCostoEnvio(envioData.costo);
      setMensajeEnvio(envioData.mensaje);

    } catch {
      setError("Error al verificar la dirección. Intenta de nuevo.");
    } finally {
      setVerificando(false);
    }
  };

  // ── Agregar al carrito ─────────────────────────────────────────────────────
  const handleAgregar = () => {
    if (!platoSeleccionado) return;
    const cantidadNum = Number(cantidad);
    if (!cantidad || Number.isNaN(cantidadNum) || cantidadNum <= 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }
    setError("");
    setCarrito((prev) => {
      const existente = prev.find((i) => i.platoId === platoSeleccionado.id);
      if (existente) {
        return prev.map((i) =>
          i.platoId === platoSeleccionado.id
            ? { ...i, cantidad: i.cantidad + cantidadNum }
            : i
        );
      }
      return [...prev, {
        platoId:  platoSeleccionado.id,
        nombre:   platoSeleccionado.nombre,
        precio:   platoSeleccionado.precio,
        cantidad: cantidadNum,
      }];
    });
    setCantidad("1");
  };

  const handleEliminarItem = (id: string) => {
    setCarrito((prev) => prev.filter((i) => i.platoId !== id));
  };

  // ── Confirmar pedido ───────────────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (!clienteActual || carrito.length === 0) return;

    // Validar que si es domicilio, la dirección fue verificada
    if (tipoEntrega === "DOMICILIO") {
      if (!latCliente || !lngCliente) {
        setError("Verifica tu dirección de entrega antes de confirmar.");
        return;
      }
      if (sinCobertura) {
        setError("Tu dirección está fuera de cobertura. Elige recoger en el punto.");
        return;
      }
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const body: Record<string, unknown> = {
        clienteId:    clienteActual.id,
        tipoEntrega,
        items:        carrito.map((i) => ({ platoId: i.platoId, cantidad: i.cantidad })),
        observaciones: observaciones.trim() || null,
      };

      // Solo enviamos coordenadas si es domicilio
      if (tipoEntrega === "DOMICILIO") {
        body.latCliente = latCliente;
        body.lngCliente = lngCliente;
      }

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo crear el pedido.");
        return;
      }

      const mensajeFinal = tipoEntrega === "RECOGIDA"
        ? "¡Pedido creado! Recoge en el Parque Principal de Sabaneta."
        : `¡Pedido creado! ${data.entrega?.mensaje ?? ""}`;

      setSuccess(mensajeFinal);
      setCarrito([]);
      setObservaciones("");
      setDireccionTexto("");
      setDireccionVerificada("");
      setCostoEnvio(null);
      setLatCliente(null);
      setLngCliente(null);
      setSinCobertura(false);
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
          <Link href="/" className="font-heading text-2xl font-extrabold text-rojo-ladrillo">
            La Cuchara
          </Link>
          <span className="text-sm font-semibold text-cafe-2">{user.name}</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">

        {/* Panel izquierdo */}
        <div className="rounded-2xl border border-maiz-3 bg-elevated p-5 shadow-warm-md sm:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">
            Pedido cliente
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-cafe">Arma tu pedido</h1>
          <p className="mt-2 text-sm leading-relaxed text-cafe-2">
            Agrega los platos que quieras al carrito y confirma al final.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
          )}
          {success && (
            <div className="mt-5 rounded-lg border border-hoja/30 bg-hoja/10 px-4 py-3 text-sm text-hoja font-medium">{success}</div>
          )}

          <div className="mt-7 space-y-6">

            {/* Selector de plato */}
            <section>
              <h2 className="mb-3 font-heading text-xl font-extrabold">Plato</h2>
              {loadingData ? (
                <p className="text-sm text-cafe-3">Cargando platos...</p>
              ) : (
                <select
                  value={platoId}
                  onChange={(e) => setPlatoId(e.target.value)}
                  className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
                >
                  {platos.map((plato) => (
                    <option key={plato.id} value={plato.id}>
                      {plato.nombre} — {formatCOP(plato.precio)}
                    </option>
                  ))}
                </select>
              )}
              {platoSeleccionado && (
                <p className="mt-2 text-sm text-cafe-2">{platoSeleccionado.descripcion}</p>
              )}
            </section>

            {/* Cantidad + agregar */}
            <div className="flex items-end gap-3">
              <div className="w-32">
                <Input
                  label="Cantidad"
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleAgregar}
                disabled={loadingData || !platoSeleccionado}
                className="flex-1"
              >
                Agregar al carrito
              </Button>
            </div>

            {/* Tipo de entrega */}
            <section>
              <h2 className="mb-3 font-heading text-xl font-extrabold">Tipo de entrega</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["DOMICILIO", "RECOGIDA"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoEntrega(tipo)}
                    className={[
                      "flex flex-col items-center gap-1 rounded-xl border-2 py-4 text-sm font-semibold transition-colors",
                      tipoEntrega === tipo
                        ? "border-rojo-ladrillo bg-rojo-ladrillo/5 text-rojo-ladrillo"
                        : "border-maiz-3 text-cafe-2 hover:border-cafe/30",
                    ].join(" ")}
                  >
                    <span className="text-xl">{tipo === "DOMICILIO" ? "🛵" : "🏠"}</span>
                    <span>{tipo === "DOMICILIO" ? "Domicilio" : "Recoger en punto"}</span>
                    {tipo === "RECOGIDA" && (
                      <span className="text-xs text-cafe-3 font-normal">Sin costo de envío</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Dirección (solo si es domicilio) */}
            {tipoEntrega === "DOMICILIO" && (
              <section>
                <h2 className="mb-3 font-heading text-xl font-extrabold">Dirección de entrega</h2>

                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
                    placeholder="Ej: Carrera 43A #18-12, El Poblado, Medellín"
                    value={direccionTexto}
                    onChange={(e) => {
                      setDireccionTexto(e.target.value);
                      // Limpiar verificación si cambia la dirección
                      setDireccionVerificada("");
                      setCostoEnvio(null);
                      setLatCliente(null);
                      setLngCliente(null);
                      setSinCobertura(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerificarDireccion()}
                    disabled={verificando}
                  />
                  <button
                    type="button"
                    onClick={handleVerificarDireccion}
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

                {/* Resultado de la verificación */}
                {direccionVerificada && !sinCobertura && costoEnvio !== null && (
                  <div className="mt-3 rounded-lg border border-hoja/30 bg-hoja/10 px-4 py-3">
                    <p className="text-sm font-semibold text-hoja">✓ Dirección encontrada</p>
                    <p className="text-sm text-cafe mt-0.5">{direccionVerificada}</p>
                    <p className="text-sm font-medium text-cafe mt-1">
                      Costo de envío: <span className="font-bold text-rojo-ladrillo">{formatCOP(costoEnvio)}</span>
                      <span className="ml-2 text-cafe-3 text-xs">— {mensajeEnvio}</span>
                    </p>
                  </div>
                )}

                {sinCobertura && direccionVerificada && (
                  <div className="mt-3 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3">
                    <p className="text-sm font-semibold text-aji">✗ Fuera de cobertura</p>
                    <p className="text-sm text-cafe mt-0.5">{direccionVerificada}</p>
                    <p className="text-sm text-cafe-2 mt-1">
                      Solo hacemos domicilios hasta 5 km del restaurante.
                      Puedes elegir <button type="button" className="font-semibold text-rojo-ladrillo underline" onClick={() => setTipoEntrega("RECOGIDA")}>recoger en el punto</button>.
                    </p>
                  </div>
                )}

                <p className="mt-2 text-xs text-cafe-3">
                  Cobertura máxima: 5 km desde el Parque Principal de Sabaneta.
                </p>
              </section>
            )}

            {/* Recogida en punto */}
            {tipoEntrega === "RECOGIDA" && (
              <div className="rounded-lg border border-maiz-3 bg-maiz px-4 py-3 text-sm text-cafe-2">
                <p className="font-semibold text-cafe">📍 Punto de recogida</p>
                <p className="mt-1">Parque Principal de Sabaneta, Antioquia.</p>
                <p className="mt-0.5 text-xs text-cafe-3">Lunes a sábado, 11:00 a.m. – 7:00 p.m.</p>
              </div>
            )}

            {/* Observaciones */}
            <Input
              label="Observaciones (opcional)"
              placeholder="Indicaciones para el pedido, ej: sin cebolla"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        {/* Panel derecho: carrito */}
        <aside className="h-fit rounded-2xl border border-maiz-3 bg-cafe p-5 text-maiz shadow-warm-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">Carrito</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold">Tu pedido</h2>
          <p className="mt-3 text-sm text-maiz/60">{clienteActual?.nombre ?? user.name}</p>

          {/* Ítems */}
          <div className="mt-4 space-y-2">
            {carrito.length === 0 ? (
              <p className="text-sm text-maiz/50">Aún no has agregado platos.</p>
            ) : (
              carrito.map((item) => (
                <div key={item.platoId} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{item.nombre}</p>
                    <p className="text-maiz/60">{item.cantidad} × {formatCOP(item.precio)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCOP(item.precio * item.cantidad)}</span>
                    <button
                      type="button"
                      onClick={() => handleEliminarItem(item.platoId)}
                      className="text-maiz/40 hover:text-aji transition-colors"
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subtotal y envío */}
          {carrito.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-maiz/15 pt-4 text-sm">
              <div className="flex justify-between text-maiz/70">
                <span>Subtotal</span>
                <span>{formatCOP(totalCarrito)}</span>
              </div>
              {tipoEntrega === "DOMICILIO" && costoEnvio !== null ? (
                <>
                  <div className="flex justify-between text-maiz/70">
                    <span>Domicilio</span>
                    <span>{formatCOP(costoEnvio)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-maiz/15">
                    <span>Total</span>
                    <span>{formatCOP(totalConEnvio)}</span>
                  </div>
                </>
              ) : tipoEntrega === "RECOGIDA" ? (
                <>
                  <div className="flex justify-between text-hoja text-xs">
                    <span>Domicilio</span>
                    <span>Gratis</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-maiz/15">
                    <span>Total</span>
                    <span>{formatCOP(totalCarrito)}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-maiz/50">Verifica tu dirección para ver el costo de envío.</p>
              )}
            </div>
          )}

          <Button
            type="button"
            className="mt-6 w-full"
            loading={creating}
            disabled={
              !clienteActual ||
              carrito.length === 0 ||
              loadingData ||
              (tipoEntrega === "DOMICILIO" && (!latCliente || sinCobertura))
            }
            onClick={handleConfirmar}
          >
            Confirmar pedido
          </Button>

          {tipoEntrega === "DOMICILIO" && !direccionVerificada && carrito.length > 0 && (
            <p className="mt-2 text-center text-xs text-maiz/50">
              Verifica tu dirección para habilitar el botón
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}