"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import {
  notificationKeys,
  type NotificationItem,
  type NotificationsList,
} from "@/features/notifications/queries";
import { getRealtimeUrl } from "./config";

type RealtimeStatus = "idle" | "connecting" | "connected" | "disconnected";

type RealtimeContextValue = {
  status: RealtimeStatus;
};

const RealtimeContext = createContext<RealtimeContextValue>({ status: "idle" });

function prependNotification(payload: NotificationsList | undefined, notification: NotificationItem) {
  if (!payload?.items) return payload;
  if (payload.items.some((item) => item.id === notification.id)) return payload;
  return {
    ...payload,
    total: payload.total + 1,
    items: [notification, ...payload.items].slice(0, payload.limit),
  };
}

function markNotificationRead(payload: NotificationsList | undefined, id: string, readAt?: string | null) {
  if (!payload?.items) return payload;
  return {
    ...payload,
    items: payload.items.map((item) =>
      item.id === id ? { ...item, isRead: true, readAt: readAt ?? item.createdAt } : item,
    ),
  };
}

function markAllNotificationsRead(payload: NotificationsList | undefined, readAt: string) {
  if (!payload?.items) return payload;
  return {
    ...payload,
    items: payload.items.map((item) => ({ ...item, isRead: true, readAt })),
  };
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("idle");

  useEffect(() => {
    if (!user) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    const eventSource = new EventSource(`${getRealtimeUrl()}/api/v1/realtime/events`, {
      withCredentials: true,
    });

    eventSource.addEventListener("realtime.ready", () => {
      setStatus("connected");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    eventSource.onerror = (error) => {
      setStatus("disconnected");
      console.error("Realtime SSE connection failed:", error);
    };

    const handleNotificationCreated = (event: MessageEvent) => {
      const { notification } = JSON.parse(event.data) as { notification: NotificationItem };
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, (current) =>
        prependNotification(current, notification),
      );
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, (current) =>
        prependNotification(current, notification),
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    const handleUnreadCountChanged = (event: MessageEvent) => {
      const { count } = JSON.parse(event.data) as { count: number };
      queryClient.setQueryData(notificationKeys.unreadCount, { count });
    };

    const handleNotificationRead = (event: MessageEvent) => {
      const { id, readAt } = JSON.parse(event.data) as { id: string; readAt?: string | null };
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, (current) =>
        markNotificationRead(current, id, readAt),
      );
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, (current) =>
        markNotificationRead(current, id, readAt),
      );
    };

    const handleAllNotificationsRead = (event: MessageEvent) => {
      const { readAt } = JSON.parse(event.data) as { readAt: string };
      queryClient.setQueryData(notificationKeys.unreadCount, { count: 0 });
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, (current) =>
        markAllNotificationsRead(current, readAt),
      );
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, (current) =>
        markAllNotificationsRead(current, readAt),
      );
    };

    const handleDashboardInvalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    eventSource.addEventListener("notification.created", handleNotificationCreated);
    eventSource.addEventListener("notification.unread_count.changed", handleUnreadCountChanged);
    eventSource.addEventListener("notification.read", handleNotificationRead);
    eventSource.addEventListener("notification.all_read", handleAllNotificationsRead);
    eventSource.addEventListener("dashboard.invalidate", handleDashboardInvalidate);

    return () => {
      eventSource.close();
      setStatus("idle");
    };
  }, [queryClient, user]);

  const value = useMemo(() => ({ status }), [status]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeSocket() {
  return useContext(RealtimeContext);
}
