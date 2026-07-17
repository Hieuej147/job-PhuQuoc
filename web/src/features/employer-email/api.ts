import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

export interface EmailIntegrationStatus {
    connected: boolean;
    email?: string;
}

export interface SendEmailResult {
    messageId: string;
}

export function getEmailIntegrationStatus() {
    return apiGet<EmailIntegrationStatus>("/api/v1/email-integration/status");
}

export function getEmailIntegrationAuthorizeUrl() {
    return apiGet<{ url: string }>("/api/v1/email-integration/authorize");
}

export function disconnectEmailIntegration() {
    return apiDelete<{ message: string }>("/api/v1/email-integration");
}

/**
 * Gọi thẳng từ trình duyệt (dùng cookie session thật của nhà tuyển dụng đang
 * đăng nhập) — KHÔNG đi qua Python AI Agent. Đây là bước gửi email THẬT, chỉ
 * được gọi từ trong onClick "Xác nhận gửi" của SendEmailConfirmCard sau khi
 * nhà tuyển dụng đã tự tay bấm xác nhận, không phải do AI tự động gọi.
 */
export function sendEmailViaGmail(to: string, subject: string, body: string) {
    return apiPost<SendEmailResult>("/api/v1/email-integration/send", { to, subject, body });
}