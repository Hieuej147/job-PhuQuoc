/**
 * TÊN TRANG: Thông báo hệ thống (Employer Notifications)
 * MÔ TẢ: Hiển thị danh sách các thông báo dành cho nhà tuyển dụng (có người ứng tuyển, tin sắp hết hạn, tin được duyệt...). Cho phép đánh dấu đã đọc.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - GET `/api/v1/notifications`: Lấy danh sách thông báo từ bảng `Notification` của nhà tuyển dụng.
 * - PATCH `/api/v1/notifications/:id/read`: Đánh dấu một thông báo là đã đọc (isRead = true).
 * - PATCH `/api/v1/notifications/read-all`: Đánh dấu tất cả thông báo là đã đọc.
 */
"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, Clock, ShieldAlert, Info, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { timeAgo } from "@/lib/utils/date";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function getNotiIcon(type: string) {
  switch (type) {
    case "APPLICATION_RECEIVED": return { icon: <RefreshCw className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100 dark:bg-blue-900/30" };
    case "APPLICATION_ACCEPTED": return { icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, bg: "bg-green-100 dark:bg-green-900/30" };
    case "APPLICATION_REJECTED": return { icon: <ShieldAlert className="w-5 h-5 text-rose-600" />, bg: "bg-rose-100 dark:bg-rose-900/30" };
    case "JOB_DEADLINE": return { icon: <Clock className="w-5 h-5 text-amber-600" />, bg: "bg-amber-100 dark:bg-amber-900/30" };
    default: return { icon: <Info className="w-5 h-5 text-slate-600" />, bg: "bg-slate-100 dark:bg-slate-800" };
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/notifications?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setNotifications(d.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id: string) => {
    await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllAsRead = async () => {
    await fetch("/api/v1/notifications/read-all", { method: "PATCH", credentials: "include" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllAsRead} className="text-sm text-[#0E7490] hover:underline">Đọc tất cả</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có thông báo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const { icon, bg } = getNotiIcon(n.type);
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  n.isRead
                    ? "bg-white dark:bg-[#0d2d42] border-gray-200 dark:border-gray-700"
                    : "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? "text-gray-700 dark:text-gray-300" : "font-semibold text-gray-900 dark:text-white"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
