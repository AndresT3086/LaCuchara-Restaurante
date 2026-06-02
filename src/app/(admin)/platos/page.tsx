"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPage, FilterPill, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";
import { useSession } from "@/contexts/SessionContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  createdAt: string;
  categoria: { id: string; nombre: string };
  creadoPor: { id: string; name: string };
}

function formatCOP(v: number) {
  return `$${new Intl.NumberFormat("es-CO").format(v)}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PlatosPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "ADMIN";

  const [platos, setPlatos]             = useState<Plato[]>([]);
  const [categorias, setCategorias]     = useState<Categoria[]>([]);
  const [loadingPlatos, setLoading]     = useState(true);
  const [error, setError]               = useState("");
  const [filtroCategoria, setFiltro]    = useState<string>("todas");

  // Dialog nuevo plato
  const [showNuevo, setShowNuevo]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState("");
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", categoriaId: "", disponible: true });
  const [formErrors, setFormErrors]     = useState<Partial<typeof form>>({});

  // Dialog nueva categoría
  const [showCategoria, setShowCategoria] = useState(false);
  const [savingCat, setSavingCat]         = useState(false);
  const [saveErrorCat, setSaveErrorCat]   = useState("");
  const [nombreCategoria, setNombreCategoria] = useState("");

  // Dialog editar plato
  const [editando, setEditando]         = useState<Plato | null>(null);
  const [showEdit, setShowEdit]         = useState(false);
  const [savingEdit, setSavingEdit]     = useState(false);
  const [saveErrorEdit, setSaveErrorEdit] = useState("");
  const [formEdit, setFormEdit] = useState({ nombre: "", descripcion: "", precio: "", categoriaId: "", disponible: true });

  // ── Cargar datos ─────────────────────────────────────────────────────────

  const cargarPlatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/platos");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlatos(data.platos);
    } catch {
      setError("No se pudieron cargar los platos");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await fetch("/api/categorias");
      if (!res.ok) return;
      const data = await res.json();
      setCategorias(data.categorias);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargarPlatos();
    cargarCategorias();
  }, [cargarPlatos, cargarCategorias]);

  // ── Crear categoría ───────────────────────────────────────────────────────

  const handleCrearCategoria = async () => {
    if (!nombreCategoria.trim()) { setSaveErrorCat("El nombre es obligatorio"); return; }
    setSavingCat(true);
    setSaveErrorCat("");
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreCategoria.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveErrorCat(d.error || "Error al crear categoría");
        return;
      }
      await cargarCategorias();
      setShowCategoria(false);
      setNombreCategoria("");
    } catch {
      setSaveErrorCat("Error de conexión");
    } finally {
      setSavingCat(false);
    }
  };

  // ── Crear plato ───────────────────────────────────────────────────────────

  const validarForm = () => {
    const errs: Partial<typeof form> = {};
    if (!form.nombre.trim())       errs.nombre      = "El nombre es obligatorio";
    if (!form.descripcion.trim())  errs.descripcion  = "La descripción es obligatoria";
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) <= 0)
                                   errs.precio       = "Precio inválido";
    if (!form.categoriaId)         errs.categoriaId  = "Selecciona una categoría";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCrearPlato = async () => {
    if (!validarForm()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/platos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:       form.nombre.trim(),
          descripcion:  form.descripcion.trim(),
          precio:       Number(form.precio),
          categoriaId:  form.categoriaId,
          disponible:   form.disponible,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Error al crear plato");
        return;
      }
      await cargarPlatos();
      setShowNuevo(false);
      setForm({ nombre: "", descripcion: "", precio: "", categoriaId: "", disponible: true });
      setFormErrors({});
    } catch {
      setSaveError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // ── Editar plato ──────────────────────────────────────────────────────────

  const abrirEditar = (plato: Plato) => {
    setEditando(plato);
    setFormEdit({
      nombre:       plato.nombre,
      descripcion:  plato.descripcion,
      precio:       String(plato.precio),
      categoriaId:  plato.categoria.id,
      disponible:   plato.disponible,
    });
    setSaveErrorEdit("");
    setShowEdit(true);
  };

  const handleEditarPlato = async () => {
    if (!editando) return;
    setSavingEdit(true);
    setSaveErrorEdit("");
    try {
      const res = await fetch("/api/platos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:           editando.id,
          nombre:       formEdit.nombre.trim(),
          descripcion:  formEdit.descripcion.trim(),
          precio:       Number(formEdit.precio),
          categoriaId:  formEdit.categoriaId,
          disponible:   formEdit.disponible,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveErrorEdit(d.error || "Error al actualizar plato");
        return;
      }
      await cargarPlatos();
      setShowEdit(false);
      setEditando(null);
    } catch {
      setSaveErrorEdit("Error de conexión");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Eliminar plato ────────────────────────────────────────────────────────

  const handleEliminar = async (plato: Plato) => {
    if (!confirm(`¿Eliminar "${plato.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(`/api/platos?id=${plato.id}`, { method: "DELETE" });
      await cargarPlatos();
    } catch { /* silencioso */ }
  };

  // ── Filtrado ──────────────────────────────────────────────────────────────

  const platosFiltrados = filtroCategoria === "todas"
    ? platos
    : platos.filter((p) => p.categoria.id === filtroCategoria);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminPage
      eyebrow="Administración"
      title="Platos y menú"
      description="Gestiona los platos del menú, sus precios y disponibilidad."
      actions={
        isAdmin ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setSaveErrorCat(""); setNombreCategoria(""); setShowCategoria(true); }}>
              + Categoría
            </Button>
            <Button size="sm" onClick={() => { setSaveError(""); setForm({ nombre: "", descripcion: "", precio: "", categoriaId: categorias[0]?.id ?? "", disponible: true }); setFormErrors({}); setShowNuevo(true); }}>
              Agregar plato
            </Button>
          </div>
        ) : null
      }
      tabs={
        <>
          <FilterPill active={filtroCategoria === "todas"} count={platos.length} onClick={() => setFiltro("todas")}>
            Todos
          </FilterPill>
          {categorias.map((cat) => (
            <FilterPill
              key={cat.id}
              active={filtroCategoria === cat.id}
              count={platos.filter((p) => p.categoria.id === cat.id).length}
              onClick={() => setFiltro(cat.id)}
            >
              {cat.nombre}
            </FilterPill>
          ))}
        </>
      }
    >
      {/* Tarjetas */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total platos"    value={String(platos.length)}                                              detail="en el menú"     />
        <StatCard label="Disponibles"     value={String(platos.filter((p) => p.disponible).length)}                 detail="activos hoy"    tone="good" />
        <StatCard label="No disponibles"  value={String(platos.filter((p) => !p.disponible).length)}                detail="ocultos"        tone="warn" />
      </div>

      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      {/* Tabla de platos */}
      <Panel title="Platos del menú" meta={`${platosFiltrados.length} platos`}>
        {loadingPlatos ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando platos…</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Nombre</Th>
                <Th>Categoría</Th>
                <Th>Descripción</Th>
                <Th>Precio</Th>
                <Th>Estado</Th>
                <Th>Creado por</Th>
                {isAdmin && <Th className="text-right">Acciones</Th>}
              </TableRow>
            </TableHead>
            <TableBody>
              {platosFiltrados.length === 0 ? (
                <TableRow>
                  <Td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-cafe-3">
                    No hay platos en esta categoría
                  </Td>
                </TableRow>
              ) : (
                platosFiltrados.map((plato) => (
                  <TableRow key={plato.id}>
                    <Td className="font-semibold">{plato.nombre}</Td>
                    <Td>
                      <Badge variant="neutral">{plato.categoria.nombre}</Badge>
                    </Td>
                    <Td className="max-w-56 text-cafe-2 text-sm truncate">{plato.descripcion}</Td>
                    <Td className="font-heading font-bold text-rojo-ladrillo">{formatCOP(plato.precio)}</Td>
                    <Td>
                      <Badge variant={plato.disponible ? "good" : "neutral"}>
                        {plato.disponible ? "Disponible" : "No disponible"}
                      </Badge>
                    </Td>
                    <Td className="text-cafe-2 text-sm">{plato.creadoPor.name}</Td>
                    {isAdmin && (
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => abrirEditar(plato)}>
                            Editar
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleEliminar(plato)}>
                            Eliminar
                          </Button>
                        </div>
                      </Td>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* Dialog: nueva categoría */}
      <Dialog
        open={showCategoria}
        onClose={() => { if (!savingCat) setShowCategoria(false); }}
        title="Nueva categoría"
        confirmLabel="Crear categoría"
        cancelLabel="Cancelar"
        onConfirm={handleCrearCategoria}
        loading={savingCat}
      >
        <div className="space-y-4">
          {saveErrorCat && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{saveErrorCat}</div>
          )}
          <Input
            label="Nombre de la categoría"
            placeholder="Ej. Sopas, Secos, Postres..."
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Dialog: nuevo plato */}
      <Dialog
        open={showNuevo}
        onClose={() => { if (!saving) setShowNuevo(false); }}
        title="Agregar plato al menú"
        confirmLabel="Crear plato"
        cancelLabel="Cancelar"
        onConfirm={handleCrearPlato}
        loading={saving}
      >
        <FormPlato
          form={form}
          setForm={setForm}
          errors={formErrors}
          categorias={categorias}
          saveError={saveError}
        />
      </Dialog>

      {/* Dialog: editar plato */}
      <Dialog
        open={showEdit}
        onClose={() => { if (!savingEdit) setShowEdit(false); }}
        title={`Editar — ${editando?.nombre ?? ""}`}
        confirmLabel="Guardar cambios"
        cancelLabel="Cancelar"
        onConfirm={handleEditarPlato}
        loading={savingEdit}
      >
        <FormPlato
          form={formEdit}
          setForm={setFormEdit}
          errors={{}}
          categorias={categorias}
          saveError={saveErrorEdit}
        />
      </Dialog>
    </AdminPage>
  );
}

// ─── Subcomponente reutilizable para el formulario ────────────────────────────

function FormPlato({
  form,
  setForm,
  errors,
  categorias,
  saveError,
}: {
  form: { nombre: string; descripcion: string; precio: string; categoriaId: string; disponible: boolean };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  errors: Partial<{ nombre: string; descripcion: string; precio: string; categoriaId: string }>;
  categorias: Categoria[];
  saveError: string;
}) {
  return (
    <div className="space-y-4">
      {saveError && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{saveError}</div>
      )}
      <Input
        label="Nombre del plato"
        placeholder="Ej. Bandeja paisa"
        value={form.nombre}
        onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        error={errors.nombre}
      />
      <Input
        label="Descripción"
        placeholder="Ingredientes y preparación..."
        value={form.descripcion}
        onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
        error={errors.descripcion}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Precio (COP)"
          placeholder="15000"
          type="number"
          min="0"
          value={form.precio}
          onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))}
          error={errors.precio}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-cafe">Categoría</label>
          <select
            value={form.categoriaId}
            onChange={(e) => setForm((p) => ({ ...p, categoriaId: e.target.value }))}
            className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
          >
            <option value="">Selecciona...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {errors.categoriaId && <p className="text-xs text-aji">{errors.categoriaId}</p>}
        </div>
      </div>
      {/* Disponibilidad */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, disponible: !p.disponible }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.disponible ? "bg-hoja" : "bg-cafe/20"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.disponible ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className="text-sm text-cafe">{form.disponible ? "Disponible en el menú" : "No disponible"}</span>
      </div>
    </div>
  );
}
