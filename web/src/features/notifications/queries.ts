"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api-client";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  refId?: string | null;
  refType?: string | null;
}

export interface NotificationsList {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationKeys = {
  all: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  recent: (limit: number) => ["notifications", "recent", limit] as const,
  list: (limit: number) => ["notifications", "list", limit] as const,
};

function markItemRead<T>(payload: T, id: string): T {
  if (!payload || typeof payload !== "object") return payload;
  const value = payload as { items?: NotificationItem[] };
  if (!Array.isArray(value.items)) return payload;

  return {
    ...value,
    items: value.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
  } as T;
}

function markAllItemsRead<T>(payload: T): T {
  if (!payload || typeof payload !== "object") return payload;
  const value = payload as { items?: NotificationItem[] };
  if (!Array.isArray(value.items)) return payload;

  return {
    ...value,
    items: value.items.map((item) => ({ ...item, isRead: true })),
  } as T;
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => apiGet<{ count: number }>("/api/v1/notifications/unread-count"),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled,
  });
}

export function useRecentNotifications(enabled = true, limit = 5) {
  return useQuery({
    queryKey: notificationKeys.recent(limit),
    queryFn: () => apiGet<NotificationsList>(`/api/v1/notifications?limit=${limit}`),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled,
  });
}

export function useNotificationsList(enabled = true, limit = 50) {
  return useQuery({
    queryKey: notificationKeys.list(limit),
    queryFn: () => apiGet<NotificationsList>(`/api/v1/notifications?limit=${limit}`),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiPatch<NotificationItem>(`/api/v1/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousUnread = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount);
      const previousRecent = queryClient.getQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] });
      const previousLists = queryClient.getQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] });

      queryClient.setQueryData<{ count: number }>(notificationKeys.unreadCount, (current) => ({
        count: Math.max((current?.count ?? 0) - 1, 0),
      }));
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, (current) => markItemRead(current, id));
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, (current) => markItemRead(current, id));

      return { previousUnread, previousRecent, previousLists };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      queryClient.setQueryData(notificationKeys.unreadCount, context.previousUnread);
      context.previousRecent.forEach(([key, value]) => queryClient.setQueryData(key, value));
      context.previousLists.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPatch<{ message: string }>("/api/v1/notifications/read-all"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousUnread = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount);
      const previousRecent = queryClient.getQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] });
      const previousLists = queryClient.getQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] });

      queryClient.setQueryData<{ count: number }>(notificationKeys.unreadCount, { count: 0 });
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "recent"] }, markAllItemsRead);
      queryClient.setQueriesData<NotificationsList>({ queryKey: ["notifications", "list"] }, markAllItemsRead);

      return { previousUnread, previousRecent, previousLists };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(notificationKeys.unreadCount, context.previousUnread);
      context.previousRecent.forEach(([key, value]) => queryClient.setQueryData(key, value));
      context.previousLists.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
