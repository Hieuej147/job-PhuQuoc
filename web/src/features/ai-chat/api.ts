import { apiGet, apiPost, apiPatch, apiDelete, apiUrl } from "@/lib/api-client";

export type ChatAgentType = "CANDIDATE" | "RECRUITER";

export interface ChatThread {
    id: string;
    userId: string;
    agentType: ChatAgentType;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export function fetchChatThreads(agentType: ChatAgentType) {
    return apiGet<ChatThread[]>(`/api/v1/chat-threads?agentType=${agentType}`);
}

export function createChatThread(agentType: ChatAgentType, title?: string) {
    return apiPost<ChatThread>(`/api/v1/chat-threads`, { agentType, title });
}

export function renameChatThread(id: string, title: string) {
    return apiPatch<ChatThread>(`/api/v1/chat-threads/${id}`, { title });
}

export function touchChatThread(id: string) {
    return apiPatch<ChatThread>(`/api/v1/chat-threads/${id}/touch`);
}

export function deleteChatThread(id: string) {
    return apiDelete<{ message: string }>(`/api/v1/chat-threads/${id}`);
}

export function generateThreadTitle(id: string, firstMessage: string) {
    return apiPatch<ChatThread>(`/api/v1/chat-threads/${id}/generate-title`, { firstMessage: firstMessage.trim() });
}

export async function streamThreadTitle(
    id: string,
    firstMessage: string,
    callbacks: {
        onPartial?: (title: string) => void;
        onFinal?: (thread: ChatThread) => void;
        onError?: (message: string) => void;
    } = {},
) {
    const response = await fetch(apiUrl(`/api/v1/chat-threads/${id}/generate-title/stream`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstMessage: firstMessage.trim() }),
    });

    if (!response.ok || !response.body) {
        throw new Error(`Title stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "message";
    let finalThread: ChatThread | undefined;
    let streamError: string | undefined;

    const handleEvent = (event: string, data: string) => {
        if (!data.trim()) return;
        let payload: { title?: string; thread?: ChatThread; message?: string };
        try {
            payload = JSON.parse(data) as { title?: string; thread?: ChatThread; message?: string };
        } catch {
            return;
        }
        if (event === "partial" && payload.title) callbacks.onPartial?.(payload.title);
        if (event === "final" && payload.thread) {
            finalThread = payload.thread;
            callbacks.onFinal?.(payload.thread);
        }
        if (event === "error") {
            streamError = payload.message || "Không thể tạo tiêu đề cuộc trò chuyện.";
            callbacks.onError?.(streamError);
        }
    };

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
            currentEvent = "message";
            const dataLines: string[] = [];
            for (const line of chunk.split("\n")) {
                if (line.startsWith("event:")) currentEvent = line.slice(6).trim();
                if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
            }
            if (dataLines.length > 0) handleEvent(currentEvent, dataLines.join("\n"));
        }
    }

    if (streamError) throw new Error(streamError);
    return finalThread;
}

// "text": tin nhắn user/assistant thường. "tool": 1 lượt gọi tool (giống thẻ hiển thị lúc
// đang chat live), nằm đúng vị trí thời gian thật của nó thay vì bị dồn xuống cuối.
export interface ThreadHistoryMessage {
    id: string;
    kind: "text" | "tool";
    role?: "user" | "assistant";
    content: string;
    toolName?: string;
    toolArgs?: unknown;
    toolCallId?: string;
}

const threadHistoryCache = new Map<string, ThreadHistoryMessage[]>();
const threadHistoryRequests = new Map<string, Promise<ThreadHistoryMessage[]>>();

export function invalidateThreadHistory(threadId?: string) {
    if (!threadId) {
        threadHistoryCache.clear();
        threadHistoryRequests.clear();
        return;
    }
    threadHistoryCache.delete(threadId);
    threadHistoryRequests.delete(threadId);
}

export async function fetchThreadHistory(threadId: string): Promise<ThreadHistoryMessage[]> {
    const cached = threadHistoryCache.get(threadId);
    if (cached) return cached;

    const pending = threadHistoryRequests.get(threadId);
    if (pending) return pending;

    const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8125";
    const request = fetch(`${agentUrl}/threads/${threadId}/history`)
        .then(async (response) => {
            if (!response.ok) return [];
            const data = await response.json();
            const messages = data.messages ?? [];
            threadHistoryCache.set(threadId, messages);
            return messages;
        })
        .catch(() => [])
        .finally(() => {
            threadHistoryRequests.delete(threadId);
        });

    threadHistoryRequests.set(threadId, request);
    return request;
}
