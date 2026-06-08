"use client";

import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useSession } from "@/contexts/SessionContext";
import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";

type UserRole = "ADMIN" | "USER";

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

interface Cliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  createdAt: string;
}

const rolLabel: Record<UserRole, string> = { ADMIN: "Administrador", USER: "Empleado" };

function RolBadge({ rol }: { rol: UserRole }) {
  return <Badge variant={rol === "ADMIN" ? "bad" : "neutral"}>{rolLabel[rol]}</Badge>;
}

function EstadoBadge({ enabled }: { enabled: boolean }) {
  return <Badge variant={enabled ? "good" : "neutral"}>{enabled ? "Activo" : "Inactivo"}</Badge>;
}

interface EditState {
  usuario: Usuario | null;
  rol: UserRole;
  enabled: boolean;
}

interface EditClienteState {
  cliente: Cliente | null;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
}

export default function UsuariosPage() {
  const { user: sessionUser } = useSession();
  const [usuarios, setUsuarios]   = useState<Usuario[]>([]);
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError]         = useState("");
  const [showEdit, setShowEdit]   = useState(false);
  const [showEditCliente, setShowEditCliente] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editState, setEditState] = useState<EditState>({ usuario: null, rol: "USER", enabled: true });
  const [editClienteState, setEditClienteState] = useState<EditClienteState>({
    cliente: null, nombre: "", email: "", telefono: "", direccion: "",
  });

  const cargarUsuarios = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const [resUsers, resClientes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/clientes"),
      ]);
      if (!resUsers.ok) throw new Error("Error al cargar usuarios");
      const dataUsers    = await resUsers.json();
      const dataClientes = resClientes.ok ? await resClientes.json() : { clientes: [] };
      setUsuarios(dataUsers.users);
      setClientes(dataClientes.clientes ?? []);
    } catch {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Solo ADMIN puede ver esta página
  if (sessionUser && sessionUser.role !== "ADMIN") {
    return (
      <AdminPage eyebrow="Administración" title="Usuarios" description="Esta sección solo está disponible para administradores.">
        <Panel title="Acceso restringido">
          <div className="p-6 text-sm text-cafe-2">No tienes permiso para ver esta página.</div>
        </Panel>
      </AdminPage>
    );
  }

  const openEditCliente = (cliente: Cliente) => {
    setSaveError("");
    setEditClienteState({
      cliente,
      nombre:    cliente.nombre,
      email:     cliente.email    ?? "",
      telefono:  cliente.telefono ?? "",
      direccion: cliente.direccion ?? "",
    });
    setShowEditCliente(true);
  };

  const handleGuardarCliente = async () => {
    if (!editClienteState.cliente) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/clientes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:        editClienteState.cliente.id,
          nombre:    editClienteState.nombre,
          email:     editClienteState.email    || null,
          telefono:  editClienteState.telefono || null,
          direccion: editClienteState.direccion || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Error al guardar");
        return;
      }
      setClientes((prev) =>
        prev.map((c) =>
          c.id === editClienteState.cliente!.id
            ? { ...c, nombre: editClienteState.nombre, email: editClienteState.email || null, telefono: editClienteState.telefono || null, direccion: editClienteState.direccion || null }
            : c
        )
      );
      setShowEditCliente(false);
    } catch {
      setSaveError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (usuario: Usuario) => {
    setSaveError("");
    setEditState({ usuario, rol: usuario.role, enabled: usuario.enabled });
    setShowEdit(true);
  };

  const handleGuardar = async () => {
    if (!editState.usuario) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:      editState.usuario.id,
          role:    editState.rol,
          enabled: editState.enabled,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Error al guardar");
        return;
      }
      // Actualizar la tabla localmente sin recargar todo
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editState.usuario!.id
            ? { ...u, role: editState.rol, enabled: editState.enabled }
            : u
        )
      );
      setShowEdit(false);
    } catch {
      setSaveError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AdminPage
      eyebrow="Administración"
      title="Usuarios"
      description="Administra accesos internos para administradores y empleados de operación."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Activos"         value={String(usuarios.filter((u) => u.enabled).length)}          detail="con acceso"           tone="good" />
        <StatCard label="Administradores" value={String(usuarios.filter((u) => u.role === "ADMIN").length)} detail="pueden configurar"    tone="bad"  />
        <StatCard label="Empleados"       value={String(usuarios.filter((u) => u.role === "USER").length)}  detail="gestionan pedidos"              />
        <StatCard label="Clientes"        value={String(clientes.length)}                                   detail="registrados"          tone="good" />
      </div>

      {/* Error de carga */}
      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
      )}

      {/* Tabla */}
      <Panel title="Equipo interno" meta="Roles y fecha de creación">
        {loadingData ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando usuarios…</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Creado</Th>
                <Th className="text-right">Acciones</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <Td className="font-semibold">{usuario.name}</Td>
                  <Td className="text-cafe-2">{usuario.email}</Td>
                  <Td><RolBadge rol={usuario.role} /></Td>
                  <Td><EstadoBadge enabled={usuario.enabled} /></Td>
                  <Td className="text-cafe-3 text-xs">{formatFecha(usuario.createdAt)}</Td>
                  <Td className="text-right">
                    {/* No dejar editar el propio usuario para evitar quitarse el ADMIN */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(usuario)}
                      disabled={usuario.id === sessionUser?.id}
                    >
                      {usuario.id === sessionUser?.id ? "Tú" : "Editar"}
                    </Button>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* Clientes */}
      <Panel title="Clientes" meta={`${clientes.length} registrados`}>
        {loadingData ? (
          <div className="flex items-center justify-center py-12 text-sm text-cafe-3">Cargando…</div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm font-semibold text-cafe">Sin clientes registrados</p>
            <p className="text-xs text-cafe-3">Aparecen aquí cuando se registran en la plataforma.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Teléfono</Th>
                <Th>Dirección</Th>
                <Th>Registrado</Th>
                <Th className="text-right">Acciones</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <Td className="font-semibold">{c.nombre}</Td>
                  <Td className="text-cafe-2">{c.email ?? <span className="text-cafe-3">—</span>}</Td>
                  <Td className="text-cafe-2">{c.telefono ?? <span className="text-cafe-3">—</span>}</Td>
                  <Td className="text-cafe-2 max-w-48 truncate">{c.direccion ?? <span className="text-cafe-3">—</span>}</Td>
                  <Td className="text-cafe-3 text-xs">{formatFecha(c.createdAt)}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditCliente(c)}>Editar</Button>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* Dialog editar cliente */}
      <Dialog
        open={showEditCliente}
        onClose={() => { if (!saving) setShowEditCliente(false); }}
        title={`Editar cliente — ${editClienteState.cliente?.nombre ?? ""}`}
        confirmLabel="Guardar cambios"
        cancelLabel="Cancelar"
        onConfirm={handleGuardarCliente}
        loading={saving}
      >
        <div className="space-y-4">
          {saveError && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{saveError}</div>
          )}
          <Input
            label="Nombre"
            value={editClienteState.nombre}
            onChange={(e) => setEditClienteState((p) => ({ ...p, nombre: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={editClienteState.email}
            onChange={(e) => setEditClienteState((p) => ({ ...p, email: e.target.value }))}
          />
          <Input
            label="Teléfono"
            value={editClienteState.telefono}
            onChange={(e) => setEditClienteState((p) => ({ ...p, telefono: e.target.value }))}
          />
          <Input
            label="Dirección"
            value={editClienteState.direccion}
            onChange={(e) => setEditClienteState((p) => ({ ...p, direccion: e.target.value }))}
          />
        </div>
      </Dialog>

      {/* Dialog editar usuario */}
      <Dialog
        open={showEdit}
        onClose={() => { if (!saving) setShowEdit(false); }}
        title={`Editar — ${editState.usuario?.name ?? ""}`}
        confirmLabel="Guardar cambios"
        cancelLabel="Cancelar"
        onConfirm={handleGuardar}
        loading={saving}
      >
        <div className="space-y-5">
          {editState.usuario && (
            <div className="rounded-lg bg-maiz px-4 py-3 text-sm">
              <p className="text-cafe-3 text-xs mb-0.5">Email</p>
              <p className="font-medium text-cafe">{editState.usuario.email}</p>
            </div>
          )}

          {saveError && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{saveError}</div>
          )}

          {/* Selector de rol */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-cafe">Rol</p>
            <div className="flex gap-2">
              {(["ADMIN", "USER"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEditState((p) => ({ ...p, rol: r }))}
                  className={[
                    "flex-1 py-2 rounded-md text-sm font-medium border transition-colors",
                    editState.rol === r
                      ? "bg-rojo-ladrillo text-maiz border-rojo-ladrillo"
                      : "bg-transparent text-cafe-2 border-maiz-3 hover:bg-maiz",
                  ].join(" ")}
                >
                  {rolLabel[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de estado */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-cafe">Estado</p>
            <div className="flex gap-2">
              {([true, false] as const).map((e) => (
                <button
                  key={String(e)}
                  type="button"
                  onClick={() => setEditState((p) => ({ ...p, enabled: e }))}
                  className={[
                    "flex-1 py-2 rounded-md text-sm font-medium border transition-colors",
                    editState.enabled === e
                      ? e ? "bg-hoja text-white border-hoja" : "bg-cafe/40 text-white border-cafe/40"
                      : "bg-transparent text-cafe-2 border-maiz-3 hover:bg-maiz",
                  ].join(" ")}
                >
                  {e ? "Activo" : "Inactivo"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </AdminPage>
  );
}
