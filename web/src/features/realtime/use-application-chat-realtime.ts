"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { applicationMessagesQueryKey, type ApplicationMessage } from "@/features/applications/hooks/use-application-chat";
import { useRealtimeSocket } from "./realtime-provider";

function sortMessages(messages: ApplicationMessage[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function mergeMessage(messages: ApplicationMessage[] | undefined, message: ApplicationMessage) {
  const current = messages ?? [];
  const existing = current.find((item) => item.id === message.id);
  if (existing) return current;
  return sortMessages([...current, message]);
}

export function useApplicationChatRealtime(applicationId: string | null, open: boolean) {
  const { socket } = useRealtimeSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !applicationId || !open) return;

    socket.emit("application.join", { applicationId });

    const handleMessageCreated = (payload: { applicationId: string; message: ApplicationMessage }) => {
      if (payload.applicationId !== applicationId) return;
      queryClient.setQueryData<ApplicationMessage[]>(
        applicationMessagesQueryKey(applicationId),
        (current) => mergeMessage(current, payload.message),
      );
    };

    const handleMessagesRead = (payload: { applicationId: string; readerId: string; readAt: string }) => {
      if (payload.applicationId !== applicationId) return;
      queryClient.setQueryData<ApplicationMessage[]>(applicationMessagesQueryKey(applicationId), (current = []) =>
        current.map((message) =>
          message.senderId !== payload.readerId && !message.readAt
            ? { ...message, readAt: payload.readAt }
            : message,
        ),
      );
    };

    socket.on("application.message.created", handleMessageCreated);
    socket.on("application.messages.read", handleMessagesRead);

    return () => {
      socket.off("application.message.created", handleMessageCreated);
      socket.off("application.messages.read", handleMessagesRead);
      socket.emit("application.leave", { applicationId });
    };
  }, [applicationId, open, queryClient, socket]);
}

