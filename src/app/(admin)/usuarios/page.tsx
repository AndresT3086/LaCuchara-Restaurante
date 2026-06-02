"use client";

import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useSession } from "@/contexts/SessionContext";
import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";

type UserRole  = "ADMIN" | "USER";
type UserEstado = "activo" | "inactivo";

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enabled: boolean;
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

export default function UsuariosPage() {
  const { user: sessionUser } = useSession();
  const [usuarios, setUsuarios]   = useState<Usuario[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError]         = useState("");
  const [showEdit, setShowEdit]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editState, setEditState] = useState<EditState>({ usuario: null, rol: "USER", enabled: true });

  // Cargar usuarios desde el backend
  const cargarUsuarios = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data.users);
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
      {/* Tarjetas de resumen */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Activos"         value={String(usuarios.filter((u) => u.enabled).length)}            detail="con acceso"           tone="good" />
        <StatCard label="Administradores" value={String(usuarios.filter((u) => u.role === "ADMIN").length)}   detail="pueden configurar"    tone="bad"  />
        <StatCard label="Empleados"       value={String(usuarios.filter((u) => u.role === "USER").length)}    detail="gestionan pedidos"              />
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
