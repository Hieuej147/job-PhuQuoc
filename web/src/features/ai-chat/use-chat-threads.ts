import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChatAgentType,
    createChatThread,
    deleteChatThread,
    fetchChatThreads,
    renameChatThread,
    touchChatThread,
    generateThreadTitle,
    streamThreadTitle,
    type ChatThread,
} from "./api";

export function useChatThreads(agentType: ChatAgentType) {
    const queryClient = useQueryClient();
    const queryKey = ["chat-threads", agentType];

    const query = useQuery({
        queryKey,
        queryFn: () => fetchChatThreads(agentType),
    });

    const setThreadTitle = (id: string, title: string) => {
        queryClient.setQueryData<ChatThread[]>(queryKey, (threads) =>
            threads?.map((thread) => (thread.id === id ? { ...thread, title } : thread)) ?? threads,
        );
    };

    const setThread = (nextThread: ChatThread) => {
        queryClient.setQueryData<ChatThread[]>(queryKey, (threads) =>
            threads?.map((thread) => (thread.id === nextThread.id ? nextThread : thread)) ?? threads,
        );
    };

    const createMutation = useMutation({
        mutationFn: (title?: string) => createChatThread(agentType, title),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const renameMutation = useMutation({
        mutationFn: ({ id, title }: { id: string; title: string }) => renameChatThread(id, title),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteChatThread(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const touchMutation = useMutation({
        mutationFn: (id: string) => touchChatThread(id),
    });

    const generateTitleMutation = useMutation({
        mutationFn: ({ id, firstMessage }: { id: string; firstMessage: string }) =>
            generateThreadTitle(id, firstMessage),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const streamTitleMutation = useMutation({
        mutationFn: async ({ id, firstMessage }: { id: string; firstMessage: string }) => {
            try {
                const finalThread = await streamThreadTitle(id, firstMessage, {
                    onPartial: (title) => setThreadTitle(id, title),
                    onFinal: (thread) => setThread(thread),
                });
                return finalThread;
            } catch {
                const fallbackThread = await generateThreadTitle(id, firstMessage);
                setThread(fallbackThread);
                return fallbackThread;
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    return {
        threads: query.data ?? [],
        isLoading: query.isLoading,
        createThread: createMutation.mutateAsync,
        renameThread: renameMutation.mutateAsync,
        deleteThread: deleteMutation.mutateAsync,
        touchThread: touchMutation.mutateAsync,
        generateTitle: generateTitleMutation.mutateAsync,
        generateTitleStream: streamTitleMutation.mutateAsync,
    };
}
