"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/components/auth/auth-provider";
import {
  notificationKeys,
  type NotificationItem,
  type NotificationsList,
} from "@/features/notifications/queries";

type RealtimeStatus = "idle" | "connecting" | "connected" | "disconnected";

type RealtimeContextValue = {
  socket: Socket | null;
  status: RealtimeStatus;
};

const RealtimeContext = createContext<RealtimeContextValue>({ socket: null, status: "idle" });

function getRealtimeUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
}

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("idle");

  useEffect(() => {
    if (!user) {
      setStatus("idle");
      setSocket(null);
      return;
    }

    setStatus("connecting");
    const nextSocket = io(`${getRealtimeUrl()}/realtime`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      setStatus("connected");
      nextSocket.emit("notifications.subscribe");
      nextSocket.emit("dashboard.subscribe", { role: user.role });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });
    nextSocket.on("disconnect", () => setStatus("disconnected"));
    nextSocket.on("connect_error", (error) => {
      setStatus("disconnected");
      console.error("Realtime socket connection failed:", error);
    });

    nextSocket.on("notification.created", ({ notification }: { notification: NotificationItem }) => {
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, (current) =>
        prependNotification(current, notification),
      );
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, (current) =>
        prependNotification(current, notification),
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    nextSocket.on("notification.unread_count.changed", ({ count }: { count: number }) => {
      queryClient.setQueryData(notificationKeys.unreadCount, { count });
    });

    nextSocket.on("notification.read", ({ id, readAt }: { id: string; readAt?: string | null }) => {
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, (current) =>
        markNotificationRead(current, id, readAt),
      );
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, (current) =>
        markNotificationRead(current, id, readAt),
      );
    });

    nextSocket.on("notification.all_read", ({ readAt }: { readAt: string }) => {
      queryClient.setQueryData(notificationKeys.unreadCount, { count: 0 });
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, (current) =>
        markAllNotificationsRead(current, readAt),
      );
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, (current) =>
        markAllNotificationsRead(current, readAt),
      );
    });

    nextSocket.on("dashboard.invalidate", () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    return () => {
      nextSocket.disconnect();
      setSocket(null);
      setStatus("idle");
    };
  }, [queryClient, user]);

  const value = useMemo(() => ({ socket, status }), [socket, status]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeSocket() {
  return useContext(RealtimeContext);
}
