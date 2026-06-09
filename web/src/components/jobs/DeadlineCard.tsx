'use client';

import { Clock } from 'lucide-react';

interface DeadlineCardProps {
  daysLeft: number;
  startDate: string;
  deadline: string;
  deadlinePercent: number;
}

export default function DeadlineCard({ daysLeft, startDate, deadline, deadlinePercent }: DeadlineCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-5 shadow-sm transition-colors duration-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-[#3f484c] dark:text-[#94A3B8]">
          Thời hạn nộp hồ sơ
        </span>
        <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Còn {daysLeft} ngày
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[6px] bg-[#e1efff] dark:bg-[#1a3d5c] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0e7490] to-[#0d9488] rounded-full transition-all duration-700"
          style={{ width: `${Math.min(deadlinePercent, 100)}%` }}
        />
      </div>

      {/* Dates */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-[#3f484c] dark:text-[#94A3B8]">
          {formatDate(startDate)}
        </span>
        <span className="text-[11px] text-[#3f484c] dark:text-[#94A3B8]">
          {formatDate(deadline)}
        </span>
      </div>
    </div>
  );
}
