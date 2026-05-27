import MenuDelDia from "./MenuDelDia";
import PlatosEspeciales from "./PlatosEspeciales";

export default function PlatosPage() {
  return (
    <main className="min-h-screen bg-maiz px-6 py-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="font-heading font-bold text-cafe text-2xl">Platos y menú</h1>
        <p className="text-sm text-cafe/60 mt-1">Gestiona el menú del día y los platos especiales</p>
      </div>
      <MenuDelDia />
      <PlatosEspeciales />
    </main>
  );
}
