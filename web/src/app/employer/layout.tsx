import { Navbar } from "@/components/layout/navbar";
import { EmployerSidebar } from "@/components/layout/employer-sidebar";
import { EmployerChatSidebar } from "@/components/chat/employer-chat-sidebar";

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar role="employer" />
      <div className="flex">
        <EmployerSidebar />
        <main className="flex-1 min-w-0">{children}</main>
        <EmployerChatSidebar />
      </div>
    </div>
  );
}
