import { Sparkles } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardHeaderProps {
  companyName?: string;
}

export function DashboardHeader({ companyName }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">
          Xin chào, {companyName || "Công ty"} 👋
        </h1>
        <p className="mt-1 text-sm text-[#3f484c] dark:text-[#94A3B8]">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          • Phú Quốc
        </p>
      </div>
      <TabsList className="w-full md:w-fit">
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        <TabsTrigger value="ai">
          <Sparkles className="size-4" />
          AI Co-worker
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
