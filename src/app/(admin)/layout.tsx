import { RoleProvider } from "@/contexts/RoleContext";
import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen bg-elevated max-md:flex-col">
        <Sidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </RoleProvider>
  );
}
