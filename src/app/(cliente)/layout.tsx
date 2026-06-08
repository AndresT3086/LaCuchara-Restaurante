import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ClienteSidebar from "@/components/layout/ClienteSidebar";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) redirect("/auth");
  if (user.role !== "CLIENTE") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-maiz max-md:flex-col">
      <ClienteSidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
