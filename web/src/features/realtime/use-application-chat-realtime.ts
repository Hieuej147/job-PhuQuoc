"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import {
  DEFAULT_APPLICATION_MESSAGE_USAGE,
  applicationMessagesQueryKey,
  type ApplicationMessage,
  type ApplicationMessagesState,
} from "@/features/applications/hooks/use-application-chat";
import { getRealtimeUrl } from "./config";

function sortMessages(messages: ApplicationMessage[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function mergeMessage(state: ApplicationMessagesState | undefined, message: ApplicationMessage): ApplicationMessagesState {
  const current = state ?? { messages: [], usage: DEFAULT_APPLICATION_MESSAGE_USAGE };
  const messages = current.messages;
  const existing = messages.find((item) => item.id === message.id);
  if (existing) return current;
  return {
    ...current,
    messages: sortMessages([...messages, message]),
    usage: {
      ...current.usage,
      used: current.usage.used + 1,
      remaining: Math.max(0, current.usage.remaining - 1),
    },
  };
}

export function useApplicationChatRealtime(applicationId: string | null, open: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!applicationId || !open) return;

    const socket = io(`${getRealtimeUrl()}/realtime`, {
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      socket.emit("application.join", { applicationId });
    });

    const handleMessageCreated = (payload: { applicationId: string; message: ApplicationMessage }) => {
      if (payload.applicationId !== applicationId) return;
      queryClient.setQueryData<ApplicationMessagesState>(
        applicationMessagesQueryKey(applicationId),
        (current) => mergeMessage(current, payload.message),
      );
    };

    const handleMessagesRead = (payload: { applicationId: string; readerId: string; readAt: string }) => {
      if (payload.applicationId !== applicationId) return;
      queryClient.setQueryData<ApplicationMessagesState>(applicationMessagesQueryKey(applicationId), (current) => {
        const currentState = current ?? { messages: [], usage: DEFAULT_APPLICATION_MESSAGE_USAGE };
        return {
          ...currentState,
          messages: currentState.messages.map((message) =>
            message.senderId !== payload.readerId && !message.readAt
              ? { ...message, readAt: payload.readAt }
              : message,
          ),
        };
      });
    };

    socket.on("application.message.created", handleMessageCreated);
    socket.on("application.messages.read", handleMessagesRead);

    return () => {
      socket.off("application.message.created", handleMessageCreated);
      socket.off("application.messages.read", handleMessagesRead);
      socket.emit("application.leave", { applicationId });
      socket.disconnect();
    };
  }, [applicationId, open, queryClient]);
}
