"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useRole } from "@/contexts/RoleContext";
import { redirect } from "next/navigation";

type UserRole = "admin" | "user";
type UserEstado = "activo" | "inactivo";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  estado: UserEstado;
  ultimoAcceso: string;
}

const MOCK_USUARIOS: Usuario[] = [
  { id: 1, nombre: "Laura Martínez", email: "laura@lacuchara.co", rol: "admin", estado: "activo", ultimoAcceso: "Hoy 09:12" },
  { id: 2, nombre: "Carlos Pérez", email: "carlos@lacuchara.co", rol: "user", estado: "activo", ultimoAcceso: "Hoy 08:45" },
  { id: 3, nombre: "Ana Gómez", email: "ana@lacuchara.co", rol: "user", estado: "activo", ultimoAcceso: "Ayer 18:30" },
  { id: 4, nombre: "Miguel Torres", email: "miguel@lacuchara.co", rol: "user", estado: "inactivo", ultimoAcceso: "Hace 5 días" },
  { id: 5, nombre: "Sofía Ríos", email: "sofia@lacuchara.co", rol: "admin", estado: "activo", ultimoAcceso: "Hoy 07:55" },
];

const rolLabel: Record<UserRole, string> = {
  admin: "Administrador",
  user: "Empleado",
};

function RolBadge({ rol }: { rol: UserRole }) {
  return (
    <Badge variant={rol === "admin" ? "bad" : "neutral"}>
      {rolLabel[rol]}
    </Badge>
  );
}

function EstadoBadge({ estado }: { estado: UserEstado }) {
  return (
    <Badge variant={estado === "activo" ? "good" : "neutral"}>
      {estado === "activo" ? "Activo" : "Inactivo"}
    </Badge>
  );
}

interface EditState {
  usuario: Usuario | null;
  rol: UserRole;
  estado: UserEstado;
}

export default function UsuariosPage() {
  const { role } = useRole();

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USUARIOS);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    usuario: null,
    rol: "user",
    estado: "activo",
  });

  const [showInvitar, setShowInvitar] = useState(false);
  const [invitando, setInvitando] = useState(false);
  const [inviteForm, setInviteForm] = useState({ nombre: "", email: "", rol: "user" as UserRole });
  const [inviteErrors, setInviteErrors] = useState<{ nombre?: string; email?: string }>({});

  const openEdit = (usuario: Usuario) => {
    setEditState({ usuario, rol: usuario.rol, estado: usuario.estado });
    setShowEdit(true);
  };

  const handleGuardarEdicion = async () => {
    if (!editState.usuario) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === editState.usuario!.id
          ? { ...u, rol: editState.rol, estado: editState.estado }
          : u
      )
    );
    setSaving(false);
    setShowEdit(false);
  };

  const validateInvite = (): boolean => {
    const errs: { nombre?: string; email?: string } = {};
    if (!inviteForm.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!inviteForm.email.trim() || !inviteForm.email.includes("@"))
      errs.email = "Ingresa un email válido";
    setInviteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInvitar = async () => {
    if (!validateInvite()) return;
    setInvitando(true);
    await new Promise((r) => setTimeout(r, 1000));
    const nuevo: Usuario = {
      id: Date.now(),
      nombre: inviteForm.nombre.trim(),
      email: inviteForm.email.trim(),
      rol: inviteForm.rol,
      estado: "activo",
      ultimoAcceso: "Nunca",
    };
    setUsuarios((prev) => [nuevo, ...prev]);
    setInvitando(false);
    setShowInvitar(false);
    setInviteForm({ nombre: "", email: "", rol: "user" });
    setInviteErrors({});
  };

  return (
    <main className="min-h-screen bg-maiz px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-cafe text-2xl">Usuarios</h1>
          <p className="text-sm text-cafe/60 mt-1">
            {usuarios.filter((u) => u.estado === "activo").length} usuarios activos
          </p>
        </div>
        <Button size="sm" onClick={() => setShowInvitar(true)}>
          Invitar usuario
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-cafe/15 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th>Último acceso</Th>
              <Th className="text-right">Acciones</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <Td className="font-medium">{usuario.nombre}</Td>
                <Td className="text-cafe/70">{usuario.email}</Td>
                <Td>
                  <RolBadge rol={usuario.rol} />
                </Td>
                <Td>
                  <EstadoBadge estado={usuario.estado} />
                </Td>
                <Td className="text-cafe/50 text-xs">{usuario.ultimoAcceso}</Td>
                <Td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(usuario)}>
                    Editar
                  </Button>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog editar usuario */}
      <Dialog
        open={showEdit}
        onClose={() => { if (!saving) setShowEdit(false); }}
        title={`Editar — ${editState.usuario?.nombre ?? ""}`}
        confirmLabel="Guardar cambios"
        cancelLabel="Cancelar"
        onConfirm={handleGuardarEdicion}
        loading={saving}
      >
        <div className="space-y-5">
          {editState.usuario && (
            <div className="bg-cafe/5 rounded-lg px-4 py-3 text-sm">
              <p className="text-cafe/50 text-xs mb-0.5">Email</p>
              <p className="text-cafe font-medium">{editState.usuario.email}</p>
            </div>
          )}

          {/* Rol */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-cafe font-body">Rol</p>
            <div className="flex gap-2">
              {(["admin", "user"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEditState((p) => ({ ...p, rol: r }))}
                  className={[
                    "flex-1 py-2 rounded-md text-sm font-medium font-body border transition-colors",
                    editState.rol === r
                      ? "bg-rojo-ladrillo text-maiz border-rojo-ladrillo"
                      : "bg-transparent text-cafe/60 border-cafe/20 hover:border-cafe/40",
                  ].join(" ")}
                >
                  {rolLabel[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-cafe font-body">Estado</p>
            <div className="flex gap-2">
              {(["activo", "inactivo"] as UserEstado[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEditState((p) => ({ ...p, estado: e }))}
                  className={[
                    "flex-1 py-2 rounded-md text-sm font-medium font-body border transition-colors capitalize",
                    editState.estado === e
                      ? e === "activo"
                        ? "bg-hoja text-white border-hoja"
                        : "bg-cafe/40 text-white border-cafe/40"
                      : "bg-transparent text-cafe/60 border-cafe/20 hover:border-cafe/40",
                  ].join(" ")}
                >
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Dialog invitar usuario */}
      <Dialog
        open={showInvitar}
        onClose={() => {
          if (!invitando) {
            setShowInvitar(false);
            setInviteForm({ nombre: "", email: "", rol: "user" });
            setInviteErrors({});
          }
        }}
        title="Invitar usuario"
        confirmLabel="Crear usuario"
        cancelLabel="Cancelar"
        onConfirm={handleInvitar}
        loading={invitando}
      >
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            placeholder="Ej. Ana Gómez"
            value={inviteForm.nombre}
            onChange={(e) => setInviteForm((p) => ({ ...p, nombre: e.target.value }))}
            error={inviteErrors.nombre}
          />
          <Input
            label="Email"
            type="email"
            placeholder="usuario@lacuchara.co"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
            error={inviteErrors.email}
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-cafe font-body">Rol</p>
            <div className="flex gap-2">
              {(["admin", "user"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInviteForm((p) => ({ ...p, rol: r }))}
                  className={[
                    "flex-1 py-2 rounded-md text-sm font-medium font-body border transition-colors",
                    inviteForm.rol === r
                      ? "bg-rojo-ladrillo text-maiz border-rojo-ladrillo"
                      : "bg-transparent text-cafe/60 border-cafe/20 hover:border-cafe/40",
                  ].join(" ")}
                >
                  {rolLabel[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
