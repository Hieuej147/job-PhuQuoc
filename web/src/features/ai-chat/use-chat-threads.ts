import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChatAgentType,
    createChatThread,
    deleteChatThread,
    fetchChatThreads,
    renameChatThread,
    touchChatThread,
    generateThreadTitle,
} from "./api";

export function useChatThreads(agentType: ChatAgentType) {
    const queryClient = useQueryClient();
    const queryKey = ["chat-threads", agentType];

    const query = useQuery({
        queryKey,
        queryFn: () => fetchChatThreads(agentType),
    });

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

    return {
        threads: query.data ?? [],
        isLoading: query.isLoading,
        createThread: createMutation.mutateAsync,
        renameThread: renameMutation.mutateAsync,
        deleteThread: deleteMutation.mutateAsync,
        touchThread: touchMutation.mutateAsync,
        generateTitle: generateTitleMutation.mutateAsync,
    };
}