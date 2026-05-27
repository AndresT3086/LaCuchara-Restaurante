import MenuDelDia from "./MenuDelDia";
import PlatosEspeciales from "./PlatosEspeciales";
import { AdminPage } from "@/components/layout/AdminPage";
import Button from "@/components/ui/Button";

export default function PlatosPage() {
  return (
    <AdminPage
      eyebrow="Administración"
      title="Platos y menú"
      description="Configura el corrientazo del día, sus variaciones de precio y los platos especiales."
      actions={
        <>
          <Button variant="secondary" size="sm">Vista cliente</Button>
          <Button size="sm">Publicar menú</Button>
        </>
      }
    >
      <MenuDelDia />
      <PlatosEspeciales />
    </AdminPage>
  );
}
