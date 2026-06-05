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

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function PedidoPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  const [platos, setPlatos] = useState<Plato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [platoId, setPlatoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [latCliente, setLatCliente] = useState("");
  const [lngCliente, setLngCliente] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

        const disponibles: Plato[] = (platosData.platos ?? []).filter((plato: Plato) => plato.disponible);
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
    () => clientes.find((cliente) => cliente.email?.toLowerCase() === user?.email.toLowerCase()) ?? null,
    [clientes, user?.email]
  );

  const platoSeleccionado = useMemo(
    () => platos.find((plato) => plato.id === platoId) ?? null,
    [platoId, platos]
  );

  const subtotal = platoSeleccionado ? platoSeleccionado.precio * Number(cantidad || 0) : 0;

  const handleConfirmar = async () => {
    if (!clienteActual || !platoSeleccionado) return;

    const cantidadNumber = Number(cantidad);
    const lat = Number(latCliente);
    const lng = Number(lngCliente);

    if (!cantidad || Number.isNaN(cantidadNumber) || cantidadNumber <= 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Ingresa coordenadas válidas para calcular el domicilio.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clienteActual.id,
          latCliente: lat,
          lngCliente: lng,
          items: [{ platoId: platoSeleccionado.id, cantidad: cantidadNumber }],
          observaciones: observaciones.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo crear el pedido.");
        return;
      }

      setSuccess(`Pedido creado. ${data.envio?.mensaje ?? ""}`);
      setCantidad("1");
      setObservaciones("");
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
        <div className="rounded-2xl border border-maiz-3 bg-elevated p-5 shadow-warm-md sm:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">
            Pedido cliente
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-cafe">Arma tu pedido</h1>
          <p className="mt-2 text-sm leading-relaxed text-cafe-2">
            Elige un plato disponible. El precio y la disponibilidad vienen de la API de platos.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
          )}
          {success && (
            <div className="mt-5 rounded-lg border border-hoja/30 bg-hoja/10 px-4 py-3 text-sm text-hoja">{success}</div>
          )}

          <div className="mt-7 space-y-6">
            <section>
              <h2 className="mb-3 font-heading text-xl font-extrabold">Plato</h2>
              {loadingData ? (
                <p className="text-sm text-cafe-3">Cargando platos...</p>
              ) : (
                <select
                  value={platoId}
                  onChange={(event) => setPlatoId(event.target.value)}
                  className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
                >
                  {platos.map((plato) => (
                    <option key={plato.id} value={plato.id}>
                      {plato.nombre} - {formatCOP(plato.precio)}
                    </option>
                  ))}
                </select>
              )}
              {platoSeleccionado && (
                <p className="mt-2 text-sm text-cafe-2">{platoSeleccionado.descripcion}</p>
              )}
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Cantidad"
                type="number"
                min="1"
                value={cantidad}
                onChange={(event) => setCantidad(event.target.value)}
              />
              <Input
                label="Latitud"
                placeholder="6.15155"
                value={latCliente}
                onChange={(event) => setLatCliente(event.target.value)}
              />
              <Input
                label="Longitud"
                placeholder="-75.61657"
                value={lngCliente}
                onChange={(event) => setLngCliente(event.target.value)}
              />
            </div>

            <Input
              label="Observaciones"
              placeholder="Indicaciones para el pedido"
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-maiz-3 bg-cafe p-5 text-maiz shadow-warm-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">Resumen</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold">Tu pedido</h2>
          <div className="mt-5 space-y-3 text-sm">
            <SummaryRow label="Cliente" value={clienteActual?.nombre ?? "Sin cliente asociado"} />
            <SummaryRow label="Plato" value={platoSeleccionado?.nombre ?? "Sin plato"} />
            <SummaryRow label="Cantidad" value={cantidad || "0"} />
          </div>
          <div className="mt-5 border-t border-maiz/15 pt-4">
            <SummaryRow label="Subtotal" value={formatCOP(subtotal)} />
            <p className="mt-2 text-xs leading-relaxed text-maiz/60">
              El costo de domicilio lo calcula el backend al confirmar el pedido.
            </p>
          </div>
          <Button
            type="button"
            className="mt-6 w-full"
            loading={creating}
            disabled={!clienteActual || !platoSeleccionado || loadingData}
            onClick={handleConfirmar}
          >
            Confirmar pedido
          </Button>
        </aside>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-maiz/60">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
