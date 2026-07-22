"use client";

import { AlertTriangle, Mail, MessageCircle, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  ApplicationMessage,
  ApplicationMessageSenderRole,
  ApplicationMessageUsage,
} from "@/features/applications/hooks/use-application-chat";

export function ApplicationMessageList({
  messages,
  currentRole,
  loading,
  listRef,
}: {
  messages: ApplicationMessage[];
  currentRole: ApplicationMessageSenderRole;
  loading: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={listRef}
      className="max-h-[460px] min-h-[300px] space-y-4 overflow-y-auto rounded-xl border bg-gradient-to-b from-slate-50 to-white p-4 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900"
    >
      {loading ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin text-[#0e7490]" />
          Đang tải tin nhắn...
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
          <div className="rounded-full bg-[#0e7490]/10 p-3 text-[#0e7490]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">Chưa có tin nhắn nào</p>
            <p className="mt-1">Bắt đầu trao đổi ngắn về lịch phỏng vấn hoặc thông tin bổ sung.</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <ApplicationMessageBubble key={message.id} message={message} mine={message.senderRole === currentRole} />
        ))
      )}
    </div>
  );
}

function ApplicationMessageBubble({ message, mine }: { message: ApplicationMessage; mine: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[82%] flex-col ${mine ? "items-end" : "items-start"}`}>
        {!mine && message.sender?.name && (
          <span className="mb-1 text-[11px] font-medium text-muted-foreground">{message.sender.name}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
            mine
              ? "rounded-br-md bg-[#005a71] text-white"
              : "rounded-bl-md border bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          }`}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
        </div>
        <p className={`mt-1 text-[11px] ${mine ? "text-muted-foreground" : "text-muted-foreground"}`}>
          {new Date(message.createdAt).toLocaleString("vi-VN")}
          {mine && message.readAt ? " · Đã đọc" : ""}
        </p>
      </div>
    </div>
  );
}

export function ApplicationChatUsageBanner({ usage, readOnly }: { usage: ApplicationMessageUsage; readOnly: boolean }) {
  const warning = usage.remaining <= 10;
  const exhausted = usage.remaining <= 0;

  if (readOnly) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
        exhausted || warning
          ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100"
          : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100"
      }`}
    >
      {warning ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Mail className="mt-0.5 h-4 w-4 shrink-0" />}
      <div className="space-y-0.5">
        <p className="font-medium">Còn {usage.remaining}/{usage.limit} tin nhắn trong cuộc trò chuyện này.</p>
        <p className="text-xs opacity-80">
          {warning
            ? "Số lượt chat gần hết. Sau này có thể chuyển trao đổi dài hoặc chính thức sang Email."
            : "Chat trong app phù hợp cho trao đổi ngắn; các luồng Email có thể bổ sung ở dashboard sau."}
        </p>
      </div>
    </div>
  );
}

export function ApplicationChatComposer({
  draft,
  maxLength,
  canSend,
  sending,
  loading,
  applicationId,
  readOnly,
  readOnlyMessage,
  onDraftChange,
  onKeyDown,
  onRefresh,
  onSend,
}: {
  draft: string;
  maxLength: number;
  canSend: boolean;
  sending: boolean;
  loading: boolean;
  applicationId: string | null;
  readOnly: boolean;
  readOnlyMessage: string;
  onDraftChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onRefresh: () => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-2">
      {readOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
          {readOnlyMessage}
        </div>
      ) : (
        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập tin nhắn ngắn về lịch phỏng vấn hoặc thông tin bổ sung..."
          maxLength={maxLength}
          rows={3}
          className="resize-none rounded-xl"
        />
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{readOnly ? "Chế độ chỉ xem" : `${draft.trim().length}/${maxLength} ký tự`}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="xs" onClick={onRefresh} disabled={loading || !applicationId}>
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>
          {!readOnly && (
            <Button type="button" size="sm" onClick={onSend} disabled={!canSend || sending}>
              <Send className="h-4 w-4" />
              {sending ? "Đang gửi..." : "Gửi"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
