"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatAgentType } from "./api";
import { useChatThreads } from "./use-chat-threads";

export function useAiChatThreadSession(agentType: ChatAgentType) {
  const threadApi = useChatThreads(agentType);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const isCreatingRef = useRef(false);

  const createNewThread = () => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    setIsCreatingThread(true);
    threadApi
      .createThread(undefined)
      .then((thread) => setActiveThreadId(thread.id))
      .catch(() => {})
      .finally(() => {
        isCreatingRef.current = false;
        setIsCreatingThread(false);
      });
  };

  useEffect(() => {
    if (activeThreadId || isCreatingRef.current || threadApi.isLoading) return;
    if (threadApi.threads.length > 0) {
      setActiveThreadId(threadApi.threads[0].id);
      return;
    }
    createNewThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, threadApi.isLoading, threadApi.threads]);

  const deleteThreadAndSelectNext = async (id: string) => {
    await threadApi.deleteThread(id).catch(() => {});
    if (activeThreadId === id) {
      setActiveThreadId(undefined);
    }
  };

  return {
    ...threadApi,
    activeThreadId,
    setActiveThreadId,
    isCreatingThread,
    createNewThread,
    deleteThreadAndSelectNext,
  };
}
