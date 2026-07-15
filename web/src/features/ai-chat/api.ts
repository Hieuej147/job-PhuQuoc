import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

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
    return apiPatch<ChatThread>(`/api/v1/chat-threads/${id}/generate-title`, { firstMessage });
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

export async function fetchThreadHistory(threadId: string): Promise<ThreadHistoryMessage[]> {
    const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8125";
    const response = await fetch(`${agentUrl}/threads/${threadId}/history`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.messages ?? [];
}