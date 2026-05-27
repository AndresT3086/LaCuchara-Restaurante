import { AdminPage, Panel, StatCard } from "@/components/layout/AdminPage";
import Badge from "@/components/ui/Badge";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";

const datos = [
  { dia: "Lunes", pedidos: 52, ventas: "$936.000", mejor: "Pollo asado" },
  { dia: "Martes", pedidos: 46, ventas: "$782.000", mejor: "Res criolla" },
  { dia: "Miércoles", pedidos: 49, ventas: "$851.000", mejor: "Bandeja paisa" },
];

export default function ReportesPage() {
  return (
    <AdminPage
      eyebrow="Administración"
      title="Reportes"
      description="Indicadores simples para ventas, rotación del menú y decisiones de inventario."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Ventas semana" value="$2.56M" detail="muestra actual" tone="good" />
        <StatCard label="Pedidos" value="147" detail="últimos 3 días" />
        <StatCard label="Repeticiones" value="0" detail="menú no repetido" tone="blue" />
      </div>

      <Panel title="Resumen semanal" meta="Base para sugerencias inteligentes">
        <Table>
          <TableHead>
            <TableRow>
              <Th>Día</Th>
              <Th>Pedidos</Th>
              <Th>Ventas</Th>
              <Th>Más vendido</Th>
              <Th>Estado</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {datos.map((fila) => (
              <TableRow key={fila.dia}>
                <Td className="font-semibold">{fila.dia}</Td>
                <Td>{fila.pedidos}</Td>
                <Td className="font-heading font-bold">{fila.ventas}</Td>
                <Td className="text-cafe-2">{fila.mejor}</Td>
                <Td><Badge variant="good">Listo</Badge></Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AdminPage>
  );
}
