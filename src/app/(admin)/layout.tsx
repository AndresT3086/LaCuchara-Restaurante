import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { RoleProvider } from "@/contexts/RoleContext";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) redirect("/auth");
  if (user.role === "CLIENTE") redirect("/pedido");

  return (
    <RoleProvider>
      <div className="flex min-h-screen bg-elevated max-md:flex-col">
        <Sidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </RoleProvider>
  );
}
