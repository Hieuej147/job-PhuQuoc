"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Bookmark, Building2 } from "lucide-react";

interface StatsCardsProps {
  applicationsCount: number;
  savedJobsCount: number;
  resumesCount: number;
}

export function StatsCards({ applicationsCount, savedJobsCount, resumesCount }: StatsCardsProps) {
  const cards = [
    {
      icon: <FileText className="size-5 text-[#005a71] dark:text-[#67E8F9]" />,
      iconBg: "bg-[#005a71]/10",
      value: applicationsCount,
      label: "Đơn ứng tuyển",
      badge: `+${applicationsCount} tuần này`,
      badgeBg: "bg-green-50 dark:bg-green-900/20",
      badgeText: "text-green-600 dark:text-green-400",
    },
    {
      icon: <Bookmark className="size-5 text-[#F59E0B]" />,
      iconBg: "bg-[#F59E0B]/10",
      value: savedJobsCount,
      label: "Việc đã lưu",
      badge: `${savedJobsCount} việc làm`,
      badgeBg: "bg-gray-100 dark:bg-[#1E5F74]/30",
      badgeText: "text-gray-500 dark:text-[#94A3B8]",
    },
    {
      icon: <Building2 className="size-5 text-[#0d9488] dark:text-[#2DD4BF]" />,
      iconBg: "bg-[#0d9488]/10",
      value: 3,
      label: "Công ty theo dõi",
      badge: "3 công ty",
      badgeBg: "bg-gray-100 dark:bg-[#1E5F74]/30",
      badgeText: "text-gray-500 dark:text-[#94A3B8]",
    },
    {
      icon: <FileText className="size-5 text-blue-600" />,
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      value: resumesCount || 1,
      label: "CV đã tạo",
      badge: `${resumesCount || 1} CV`,
      badgeBg: "bg-gray-100 dark:bg-[#1E5F74]/30",
      badgeText: "text-gray-500 dark:text-[#94A3B8]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-[#e1efff] dark:border-[#1E5F74] dark:bg-[#0d2d42] rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex size-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                {card.icon}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${card.badgeBg} ${card.badgeText}`}>
                {card.badge}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-[#E0F2FE]">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
