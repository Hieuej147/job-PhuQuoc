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

interface MessageListResponse {
  items?: ApplicationMessage[];
}

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

export function useApplicationMessages(applicationId: string | null, open: boolean) {
  return useQuery({
    queryKey: applicationMessagesQueryKey(applicationId),
    queryFn: async () => {
      if (!applicationId) return [];
      const payload = await apiGet<MessageListResponse | ApplicationMessage[]>(
        `/api/v1/applications/${applicationId}/messages`,
      );
      const items = Array.isArray(payload) ? payload : payload.items ?? [];
      return sortMessages(items);
    },
    enabled: open && Boolean(applicationId),
    refetchInterval: open ? 3000 : false,
    refetchIntervalInBackground: false,
    staleTime: 1000,
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
      if (!applicationId) return { previousMessages: [] as ApplicationMessage[], optimisticId: "" };

      await queryClient.cancelQueries({ queryKey });
      const previousMessages = queryClient.getQueryData<ApplicationMessage[]>(queryKey) ?? [];
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: ApplicationMessage = {
        id: optimisticId,
        applicationId,
        senderId: "me",
        senderRole: currentRole,
        body,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ApplicationMessage[]>(queryKey, sortMessages([...previousMessages, optimisticMessage]));
      return { previousMessages, optimisticId };
    },
    onError: (_error, _body, context) => {
      if (!applicationId || !context) return;
      queryClient.setQueryData(queryKey, context.previousMessages);
    },
    onSuccess: (message, _body, context) => {
      if (!applicationId) return;
      queryClient.setQueryData<ApplicationMessage[]>(queryKey, (current = []) =>
        sortMessages(current.map((item) => (item.id === context?.optimisticId ? message : item))),
      );
    },
    onSettled: () => {
      if (!applicationId) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
