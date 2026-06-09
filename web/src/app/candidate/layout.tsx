import { Navbar } from "@/components/layout/navbar";
import { CandidateSidebar } from "@/components/layout/candidate-sidebar";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
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
