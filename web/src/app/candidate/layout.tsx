import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { CandidateSidebar } from "@/components/layout/candidate-sidebar";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.role) {
    redirect("/auth/select-role");
  }

  if (user.role === "EMPLOYER") {
    redirect("/employer/dashboard");
  }

  if (user.role === "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="candidate" />
      <div className="flex">
        <CandidateSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
