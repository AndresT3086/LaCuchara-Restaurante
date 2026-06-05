"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { Panel } from "@/components/layout/AdminPage";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

interface Plato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  categoria: { id: string; nombre: string };
}

function formatCOP(value: number): string {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function MenuDelDia() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPlatos = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/platos");
        if (!res.ok) throw new Error();

        const data = await res.json();
        setPlatos(data.platos ?? []);
      } catch {
        setError("No se pudo cargar el menú desde la API de platos.");
      } finally {
        setLoading(false);
      }
    };

    cargarPlatos();
  }, []);

  const disponiblesPorCategoria = useMemo(() => {
    const grupos = new Map<string, Plato[]>();

    for (const plato of platos.filter((item) => item.disponible)) {
      const key = plato.categoria.nombre;
      grupos.set(key, [...(grupos.get(key) ?? []), plato]);
    }

    return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [platos]);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
            Sección 1
          </p>
          <h2 className="font-heading text-2xl font-extrabold text-cafe">Menú disponible</h2>
          <p className="text-sm text-cafe-2">
            Platos marcados como disponibles en la API de platos.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      <Panel title="Carta publicada" meta={loading ? "Cargando..." : `${platos.filter((plato) => plato.disponible).length} platos disponibles`}>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando menú...</div>
        ) : disponiblesPorCategoria.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">
            No hay platos disponibles para publicar.
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Categoría</Th>
                <Th>Plato</Th>
                <Th>Descripción</Th>
                <Th>Precio</Th>
                <Th>Estado</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {disponiblesPorCategoria.flatMap(([categoria, items]) =>
                items.map((plato) => (
                  <TableRow key={plato.id}>
                    <Td><Badge variant="neutral">{categoria}</Badge></Td>
                    <Td className="font-semibold">{plato.nombre}</Td>
                    <Td className="max-w-md truncate text-cafe-2">{plato.descripcion}</Td>
                    <Td className="font-heading font-bold text-rojo-ladrillo">{formatCOP(plato.precio)}</Td>
                    <Td><Badge variant="good">Disponible</Badge></Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Panel>
    </section>
  );
}
