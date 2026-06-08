"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useSession } from "@/contexts/SessionContext";

interface ClienteData {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
}

export default function PerfilPage() {
  const { user } = useSession();

  const [cliente, setCliente]   = useState<ClienteData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [guardado, setGuardado] = useState(false);

  const [nombre,    setNombre]    = useState("");
  const [telefono,  setTelefono]  = useState("");
  const [direccion, setDireccion] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clientes");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const c: ClienteData = data.clientes?.[0] ?? null;
      if (c) {
        setCliente(c);
        setNombre(c.nombre);
        setTelefono(c.telefono ?? "");
        setDireccion(c.direccion ?? "");
      }
    } catch {
      setError("No se pudo cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError("");
    setGuardado(false);
    try {
      const res = await fetch("/api/clientes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:        cliente.id,
          nombre:    nombre.trim(),
          telefono:  telefono.trim()  || null,
          direccion: direccion.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Error al guardar.");
        return;
      }
      setGuardado(true);
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 text-cafe">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">Cuenta</p>
      <h1 className="mt-1 font-heading text-4xl font-extrabold text-cafe">Mi perfil</h1>
      <p className="mt-2 text-sm text-cafe-2">Actualiza tu información de contacto y dirección de entrega.</p>

      {loading ? (
        <div className="mt-10 text-sm text-cafe-3">Cargando...</div>
      ) : (
        <form onSubmit={handleGuardar} className="mt-8 max-w-lg space-y-5">
          <div>
            <p className="mb-1 text-sm font-medium text-cafe">Correo</p>
            <p className="rounded-md border border-maiz-3 bg-maiz/50 px-3 py-2.5 text-sm text-cafe-2">
              {user?.email ?? cliente?.email ?? "—"}
            </p>
            <p className="mt-1 text-xs text-cafe-3">El correo no se puede cambiar.</p>
          </div>

          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={saving}
          />

          <Input
            label="Celular"
            placeholder="300 123 4567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={saving}
          />

          <div>
            <Input
              label="Dirección principal"
              placeholder="Ej. Cra 34A #75 Sur 50, Sabaneta"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              disabled={saving}
            />
            <p className="mt-1 text-xs text-cafe-3">
              Se guarda para referencia. Al hacer un pedido puedes escribir la dirección exacta.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3 text-sm text-aji">{error}</div>
          )}

          {guardado && (
            <div className="rounded-lg border border-hoja/30 bg-hoja/10 px-4 py-3 text-sm font-medium text-hoja">
              Cambios guardados correctamente.
            </div>
          )}

          <Button type="submit" loading={saving} disabled={saving}>
            Guardar cambios
          </Button>
        </form>
      )}
    </div>
  );
}
