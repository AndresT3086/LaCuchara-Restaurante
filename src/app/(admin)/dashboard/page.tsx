import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

const ventas = [
  { plato: "Corrientazo completo con pollo", unidades: 38, variacion: "+14%" },
  { plato: "Corrientazo sin sopa con res", unidades: 27, variacion: "+8%" },
  { plato: "Bandeja paisa", unidades: 12, variacion: "+4%" },
];

const alertas = [
  { item: "Pollo entero", estado: "Vence mañana", tipo: "bad" as const },
  { item: "Maracuyá", estado: "Bajo mínimo", tipo: "warn" as const },
  { item: "Chorizo", estado: "Agotado", tipo: "bad" as const },
];

export default function DashboardPage() {
  return (
    <AdminPage
      eyebrow="Operación"
      title="Inicio"
      description="Resumen rápido para abrir cocina, revisar pedidos y decidir el menú."
      actions={<Button size="sm">Abrir jornada</Button>}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos hoy" value="46" detail="18 pendientes" tone="warn" />
        <StatCard label="Ingresos" value="$782k" detail="corte parcial" tone="good" />
        <StatCard label="Domicilios" value="19" detail="mapa y tarifa activa" tone="blue" />
        <StatCard label="Alertas" value="4" detail="inventario crítico" tone="bad" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Panel
          title="Menú publicado"
          meta="Miércoles 27 de mayo"
          actions={<Button variant="secondary" size="sm">Editar menú</Button>}
        >
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3 p-5">
              <MenuLine label="Sopa" value="Sopa de lentejas con chorizo y papa criolla" />
              <MenuLine label="Secos" value="Pollo asado, res en salsa criolla" />
              <MenuLine label="Jugo" value="Maracuyá con agua de panela" />
              <MenuLine label="Postre" value="Arroz con leche con canela" />
            </div>
            <div className="space-y-3 bg-maiz p-5">
              <Price label="Completo" value="$18.000" />
              <Price label="Sin sopa" value="$15.000" />
              <Price label="Sin postre" value="$14.000" />
              <Price label="Básico" value="$12.000" />
            </div>
          </div>
        </Panel>

        <Panel title="Alertas de inventario" meta="Útiles para Claude">
          <div className="divide-y divide-maiz-3">
            {alertas.map((alerta) => (
              <div key={alerta.item} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="font-semibold text-cafe">{alerta.item}</p>
                  <p className="text-xs text-cafe-3">Afecta sugerencias del menú del día</p>
                </div>
                <Badge variant={alerta.tipo}>{alerta.estado}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Más vendidos de la semana" meta="Base para innovación del menú">
        <Table>
          <TableHead>
            <TableRow>
              <Th>Plato</Th>
              <Th>Unidades</Th>
              <Th>Tendencia</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {ventas.map((venta) => (
              <TableRow key={venta.plato}>
                <Td className="font-semibold">{venta.plato}</Td>
                <Td>{venta.unidades}</Td>
                <Td>
                  <Badge variant="good">{venta.variacion}</Badge>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AdminPage>
  );
}

function MenuLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-maiz-3 bg-elevated p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-achiote-dark">{label}</p>
      <p className="mt-1 text-sm font-semibold text-cafe">{value}</p>
    </div>
  );
}

function Price({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-maiz-3 pb-2 last:border-b-0 last:pb-0">
      <span className="text-sm text-cafe-2">{label}</span>
      <span className="font-heading text-lg font-extrabold text-cafe">{value}</span>
    </div>
  );
}
