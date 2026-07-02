import { redirect } from "next/navigation";
import { EmployerSidebar } from "@/components/layout/employer-sidebar";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (!user.role) {
    redirect("/auth/select-role");
  }
  if (user.role === "CANDIDATE") {
    redirect("/candidate/dashboard");
  }
  if (user.role === "ADMIN") {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <EmployerSidebar />
        <main className="flex-1 min-w-0 lg:ml-72 px-4 md:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}