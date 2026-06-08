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

type TipoEntrega = "DOMICILIO" | "RECOGIDA";

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
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("DOMICILIO");
  const [latCliente, setLatCliente] = useState("");
  const [lngCliente, setLngCliente] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?mode=login");
    }
  }, [loading, router, user]);

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

  const clienteActual = useMemo(
    () => clientes.find((c) => c.email?.toLowerCase() === user?.email.toLowerCase()) ?? null,
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

  const handleConfirmar = async () => {
    if (!clienteActual || carrito.length === 0) return;

    if (tipoEntrega === "DOMICILIO") {
      const lat = Number(latCliente);
      const lng = Number(lngCliente);
      if (!latCliente || !lngCliente || Number.isNaN(lat) || Number.isNaN(lng)) {
        setError("Ingresa tus coordenadas para calcular el costo de envío.");
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

      if (!res.ok) {
        setError(data.error || "No se pudo crear el pedido.");
        return;
      }

      setSuccess(`¡Pedido confirmado! ${data.entrega?.mensaje ?? ""}`);
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
            <div className="mt-5 rounded-lg border border-hoja/30 bg-hoja/10 px-4 py-3 text-sm text-hoja">{success}</div>
          )}

          <div className="mt-7 space-y-6">
            {/* Tipo de entrega */}
            <section>
              <h2 className="mb-3 font-heading text-xl font-extrabold">¿Cómo quieres recibir tu pedido?</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoEntrega("DOMICILIO")}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    tipoEntrega === "DOMICILIO"
                      ? "border-rojo-ladrillo bg-rojo-ladrillo/5 text-cafe"
                      : "border-maiz-3 text-cafe-2 hover:border-maiz-4"
                  }`}
                >
                  <p className="text-sm font-bold">Domicilio</p>
                  <p className="mt-0.5 text-xs opacity-70">Te lo llevamos a tu dirección</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEntrega("RECOGIDA")}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    tipoEntrega === "RECOGIDA"
                      ? "border-rojo-ladrillo bg-rojo-ladrillo/5 text-cafe"
                      : "border-maiz-3 text-cafe-2 hover:border-maiz-4"
                  }`}
                >
                  <p className="text-sm font-bold">Recoger en tienda</p>
                  <p className="mt-0.5 text-xs opacity-70">Sin costo de envío</p>
                </button>
              </div>
            </section>

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

            {/* Coordenadas — solo para domicilio */}
            {tipoEntrega === "DOMICILIO" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Latitud"
                  placeholder="6.15155"
                  value={latCliente}
                  onChange={(e) => setLatCliente(e.target.value)}
                />
                <Input
                  label="Longitud"
                  placeholder="-75.61657"
                  value={lngCliente}
                  onChange={(e) => setLngCliente(e.target.value)}
                />
              </div>
            )}

            <Input
              label="Observaciones"
              placeholder="Indicaciones para el pedido (opcional)"
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

          <p className="mt-3 text-sm text-maiz/60">{clienteActual?.nombre ?? "Sin cliente asociado"}</p>

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
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subtotal + envío */}
          {carrito.length > 0 && (
            <div className="mt-4 border-t border-maiz/15 pt-4 space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-maiz/60">Subtotal</span>
                <span>{formatCOP(totalCarrito)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-maiz/60">Envío</span>
                <span className="text-maiz/60">
                  {tipoEntrega === "RECOGIDA" ? "Gratis" : "Se calcula según tu ubicación"}
                </span>
              </div>
            </div>
          )}

          <Button
            type="button"
            className="mt-6 w-full"
            loading={creating}
            disabled={!clienteActual || carrito.length === 0 || loadingData}
            onClick={handleConfirmar}
          >
            Confirmar pedido
          </Button>
        </aside>
      </section>
    </main>
  );
}
