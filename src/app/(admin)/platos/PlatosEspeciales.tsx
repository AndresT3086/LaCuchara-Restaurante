"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Panel } from "@/components/layout/AdminPage";

interface Categoria {
  id: string;
  nombre: string;
}

interface Plato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  categoria: Categoria;
}

interface FormState {
  nombre: string;
  descripcion: string;
  precio: string;
}

interface FormErrors {
  nombre?: string;
  descripcion?: string;
  precio?: string;
}

function formatCOP(value: number): string {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function parseCOP(raw: string): string {
  return raw.replace(/\D/g, "");
}

export default function PlatosEspeciales() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>({ nombre: "", descripcion: "", precio: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  const categoriaEspecial = useMemo(
    () => categorias.find((categoria) => categoria.nombre.toLowerCase() === "especiales"),
    [categorias]
  );

  const platosEspeciales = useMemo(
    () => platos.filter((plato) => plato.categoria.nombre.toLowerCase() === "especiales"),
    [platos]
  );

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      const [platosRes, categoriasRes] = await Promise.all([
        fetch("/api/platos"),
        fetch("/api/categorias"),
      ]);

      if (!platosRes.ok || !categoriasRes.ok) throw new Error();

      const [platosData, categoriasData] = await Promise.all([
        platosRes.json(),
        categoriasRes.json(),
      ]);

      setPlatos(platosData.platos ?? []);
      setCategorias(categoriasData.categorias ?? []);
    } catch {
      setError("No se pudieron cargar los platos especiales desde las APIs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const resetForm = () => {
    setForm({ nombre: "", descripcion: "", precio: "" });
    setErrors({});
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio";
    if (!form.descripcion.trim()) next.descripcion = "La descripción es obligatoria";
    if (!form.precio || Number(form.precio) <= 0) next.precio = "Ingresa un precio válido";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCrear = async () => {
    if (!validate() || !categoriaEspecial) return;

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/platos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          precio: Number(form.precio),
          categoriaId: categoriaEspecial.id,
          disponible: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "No se pudo crear el plato especial.");
        return;
      }

      await cargarDatos();
      setShowDialog(false);
      resetForm();
    } catch {
      setError("Error de conexión al crear el plato especial.");
    } finally {
      setCreating(false);
    }
  };

  const toggleDisponible = async (plato: Plato) => {
    try {
      const res = await fetch("/api/platos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plato.id, disponible: !plato.disponible }),
      });

      if (!res.ok) throw new Error();
      await cargarDatos();
    } catch {
      setError("No se pudo actualizar la disponibilidad.");
    }
  };

  return (
    <>
      <section>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
              Sección 2
            </p>
            <h2 className="font-heading text-2xl font-extrabold text-cafe">Platos especiales</h2>
            <p className="text-sm text-cafe-2">
              Platos reales asociados a la categoría Especiales.
            </p>
          </div>
          <Button
            size="sm"
            disabled={!categoriaEspecial}
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          >
            Agregar plato especial
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
        )}

        {!categoriaEspecial && !loading && (
          <div className="mb-4 rounded-lg border border-platano/30 bg-platano/10 px-4 py-3 text-sm text-cafe">
            Crea la categoría Especiales para poder registrar platos especiales.
          </div>
        )}

        <Panel
          title="Carta de especiales"
          meta={loading ? "Cargando..." : `${platosEspeciales.length} platos · ${platosEspeciales.filter((plato) => plato.disponible).length} disponibles`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando especiales...</div>
          ) : platosEspeciales.length === 0 ? (
            <p className="py-8 text-center text-sm text-cafe/50">
              No hay platos especiales registrados.
            </p>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Nombre</Th>
                  <Th>Descripción</Th>
                  <Th className="text-right">Precio</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {platosEspeciales.map((plato) => (
                  <TableRow key={plato.id} className={!plato.disponible ? "opacity-60" : ""}>
                    <Td className="font-heading text-sm font-bold text-cafe">{plato.nombre}</Td>
                    <Td className="max-w-xl text-xs leading-relaxed text-cafe-3">{plato.descripcion}</Td>
                    <Td className="text-right font-heading text-base font-extrabold text-rojo-ladrillo">
                      {formatCOP(plato.precio)}
                    </Td>
                    <Td>
                      <Badge variant={plato.disponible ? "good" : "neutral"}>
                        {plato.disponible ? "Visible" : "Oculto"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleDisponible(plato)}>
                        {plato.disponible ? "Ocultar" : "Mostrar"}
                      </Button>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </section>

      <Dialog
        open={showDialog}
        onClose={() => {
          if (!creating) {
            setShowDialog(false);
            resetForm();
          }
        }}
        title="Agregar plato especial"
        confirmLabel="Crear plato"
        cancelLabel="Cancelar"
        onConfirm={handleCrear}
        loading={creating}
      >
        <div className="space-y-4">
          <Input
            label="Nombre del plato"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            error={errors.nombre}
          />
          <Input
            label="Descripción"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            error={errors.descripcion}
          />
          <Input
            label="Precio"
            placeholder="$0"
            value={form.precio ? `$${new Intl.NumberFormat("es-CO").format(Number(form.precio))}` : ""}
            onChange={(e) => {
              const raw = parseCOP(e.target.value.replace(/^\$/, ""));
              setForm((p) => ({ ...p, precio: raw }));
            }}
            error={errors.precio}
          />
        </div>
      </Dialog>
    </>
  );
}
