import Link from "next/link";
import type { DashboardNotification } from "../types";
import { getNotificationBg, getNotificationIcon } from "../utils";

interface NotificationsPanelProps {
  notifications: DashboardNotification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <div className="rounded-xl border border-[#e1efff] bg-white p-6 shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Thông báo</h2>
        {notifications.length > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {notifications.length} mới
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {notifications.map((notif) => (
          <div key={notif.id} className={`flex items-start gap-3 rounded-xl p-3 ${getNotificationBg(notif.type)}`}>
            {getNotificationIcon(notif.type)}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">{notif.title}</p>
              <p className="mt-0.5 text-xs text-[#3f484c] dark:text-[#94A3B8]">{notif.message}</p>
              <p className="mt-1 text-xs text-[#6f787d]">{notif.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center">
        <Link href="/employer/notifications" className="text-xs font-semibold text-[#005a71] hover:opacity-70 dark:text-[#67E8F9]">
          Xem tất cả thông báo →
        </Link>
      </div>
    </div>
  );
}
