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
        // QUAN TRỌNG: đây là mutation gọi thường xuyên nhất (mỗi khi thread có tin
        // nhắn mới — xem ThreadActivityTracker/WidgetThreadTracker). Backend cập
        // nhật đúng updatedAt (đã ORDER BY updatedAt desc), nhưng nếu thiếu
        // invalidateQueries ở đây, danh sách threads trong cache React Query sẽ
        // "đứng hình" ở thứ tự cũ cho tới khi có 1 mutation khác (tạo/xoá/đổi
        // tên/sinh tiêu đề) tình cờ làm mới nó — đây chính là nguyên nhân sidebar
        // hiển thị sai thứ tự, và khi cache đột ngột được làm mới đúng lúc
        // activeThreadId bị reset (ví dụ khi quay lại tab), người dùng thấy như
        // bị "nhảy" sang thread khác.
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
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