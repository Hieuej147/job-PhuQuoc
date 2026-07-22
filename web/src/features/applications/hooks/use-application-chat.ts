"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type ApplicationMessageSenderRole = "CANDIDATE" | "EMPLOYER";

export interface ApplicationMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderRole: ApplicationMessageSenderRole;
  body: string;
  readAt?: string | null;
  createdAt: string;
  sender?: { id: string; name?: string | null; image?: string | null };
}

export interface ApplicationMessageUsage {
  used: number;
  limit: number;
  remaining: number;
  maxLength: number;
}

export interface ApplicationMessagesState {
  messages: ApplicationMessage[];
  usage: ApplicationMessageUsage;
}

interface MessageListResponse {
  items?: ApplicationMessage[];
  total?: number;
  usage?: Partial<ApplicationMessageUsage>;
}

export const DEFAULT_APPLICATION_MESSAGE_USAGE: ApplicationMessageUsage = {
  used: 0,
  limit: 100,
  remaining: 100,
  maxLength: 2000,
};

export const applicationMessagesQueryKey = (applicationId: string | null | undefined) => [
  "applications",
  applicationId,
  "messages",
];

function sortMessages(messages: ApplicationMessage[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function normalizeUsage(usage: Partial<ApplicationMessageUsage> | undefined, used: number): ApplicationMessageUsage {
  const limit = usage?.limit ?? DEFAULT_APPLICATION_MESSAGE_USAGE.limit;
  return {
    used: usage?.used ?? used,
    limit,
    remaining: usage?.remaining ?? Math.max(0, limit - used),
    maxLength: usage?.maxLength ?? DEFAULT_APPLICATION_MESSAGE_USAGE.maxLength,
  };
}

function normalizeMessagesState(payload: MessageListResponse | ApplicationMessage[]): ApplicationMessagesState {
  const items = Array.isArray(payload) ? payload : payload.items ?? [];
  const messages = sortMessages(items);
  return {
    messages,
    usage: normalizeUsage(Array.isArray(payload) ? undefined : payload.usage, messages.length),
  };
}

export function useApplicationMessages(applicationId: string | null, open: boolean) {
  return useQuery({
    queryKey: applicationMessagesQueryKey(applicationId),
    queryFn: async () => {
      if (!applicationId) {
        return { messages: [], usage: DEFAULT_APPLICATION_MESSAGE_USAGE };
      }
      const payload = await apiGet<MessageListResponse | ApplicationMessage[]>(
        `/api/v1/applications/${applicationId}/messages`,
      );
      return normalizeMessagesState(payload);
    },
    enabled: open && Boolean(applicationId),
    staleTime: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useMarkApplicationMessagesRead(applicationId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!applicationId) return null;
      return apiPatch(`/api/v1/applications/${applicationId}/messages/read`);
    },
  });
}

export function useSendApplicationMessage(
  applicationId: string | null,
  currentRole: ApplicationMessageSenderRole,
) {
  const queryClient = useQueryClient();
  const queryKey = applicationMessagesQueryKey(applicationId);

  return useMutation({
    mutationFn: async (body: string) => {
      if (!applicationId) throw new Error("Thiếu đơn ứng tuyển để gửi tin nhắn");
      return apiPost<ApplicationMessage>(`/api/v1/applications/${applicationId}/messages`, { body });
    },
    onMutate: async (body) => {
      if (!applicationId) return { previousState: undefined as ApplicationMessagesState | undefined, optimisticId: "" };

      await queryClient.cancelQueries({ queryKey });
      const previousState = queryClient.getQueryData<ApplicationMessagesState>(queryKey);
      const previousMessages = previousState?.messages ?? [];
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: ApplicationMessage = {
        id: optimisticId,
        applicationId,
        senderId: "me",
        senderRole: currentRole,
        body,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ApplicationMessagesState>(queryKey, {
        messages: sortMessages([...previousMessages, optimisticMessage]),
        usage: previousState
          ? {
              ...previousState.usage,
              used: previousState.usage.used + 1,
              remaining: Math.max(0, previousState.usage.remaining - 1),
            }
          : DEFAULT_APPLICATION_MESSAGE_USAGE,
      });
      return { previousState, optimisticId };
    },
    onError: (_error, _body, context) => {
      if (!applicationId || !context) return;
      queryClient.setQueryData(queryKey, context.previousState);
    },
    onSuccess: (message, _body, context) => {
      if (!applicationId) return;
      queryClient.setQueryData<ApplicationMessagesState>(queryKey, (current) => {
        const currentState = current ?? { messages: [], usage: DEFAULT_APPLICATION_MESSAGE_USAGE };
        const withoutOptimistic = currentState.messages.filter((item) => item.id !== context?.optimisticId);
        if (withoutOptimistic.some((item) => item.id === message.id)) {
          return { ...currentState, messages: sortMessages(withoutOptimistic) };
        }
        return {
          ...currentState,
          messages: sortMessages([...withoutOptimistic, message]),
        };
      });
    },
    onSettled: () => {
      if (!applicationId) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
