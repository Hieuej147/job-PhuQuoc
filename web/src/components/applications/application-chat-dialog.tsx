"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { QuotaUpgradeDialog } from "@/components/quota/quota-upgrade-dialog";
import { ApiError } from "@/lib/api-client";
import {
  type ApplicationMessage,
  type ApplicationMessageSenderRole,
  useApplicationMessages,
  useMarkApplicationMessagesRead,
  useSendApplicationMessage,
} from "@/features/applications/hooks/use-application-chat";
import { useApplicationChatRealtime } from "@/features/realtime/use-application-chat-realtime";

interface ApplicationChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  currentRole: ApplicationMessageSenderRole;
  applicationStatus?: string | null;
  chatClosedAt?: string | null;
  readOnly?: boolean;
  readOnlyReason?: string;
  title: string;
  description?: string;
  onMessageSent?: (message: ApplicationMessage) => void;
}

export function ApplicationChatDialog({
  open,
  onOpenChange,
  applicationId,
  currentRole,
  applicationStatus,
  chatClosedAt,
  readOnly = false,
  readOnlyReason,
  title,
  description,
  onMessageSent,
}: ApplicationChatDialogProps) {
  const [draft, setDraft] = useState("");
  const [quota, setQuota] = useState<{ resource?: string; used?: number; limit?: number } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(true);
  const lastMarkedReadKeyRef = useRef("");
  const messagesQuery = useApplicationMessages(applicationId, open);
  const markReadMutation = useMarkApplicationMessagesRead(applicationId);
  const sendMessageMutation = useSendApplicationMessage(applicationId, currentRole);
  const messages = messagesQuery.data ?? [];
  useApplicationChatRealtime(applicationId, open);

  const readonlyMessage = useMemo(() => {
    if (readOnlyReason) return readOnlyReason;
    if (chatClosedAt) return "Cuộc trò chuyện đã đóng. Bạn vẫn có thể xem lại lịch sử trao đổi.";
    if (applicationStatus === "REJECTED") return "Hồ sơ đã bị từ chối. Lời nhắn của nhà tuyển dụng chỉ ở chế độ xem.";
    if (applicationStatus && applicationStatus !== "ACCEPTED") return "Chỉ có thể nhắn tin sau khi hồ sơ được chấp nhận.";
    return "Cuộc trò chuyện đang ở chế độ xem.";
  }, [applicationStatus, chatClosedAt, readOnlyReason]);

  const canSend = useMemo(() => !readOnly && draft.trim().length > 0 && draft.trim().length <= 2000, [draft, readOnly]);
  const loading = messagesQuery.isLoading;
  const sending = sendMessageMutation.isPending;

  const isNearBottom = () => {
    const node = listRef.current;
    if (!node) return true;
    return node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  };

  useEffect(() => {
    if (!open) return;
    setDraft("");
    lastMarkedReadKeyRef.current = "";
  }, [open, applicationId]);

  useEffect(() => {
    if (!open) return;
    if (!shouldScrollRef.current) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [open, messages.length]);

  useEffect(() => {
    if (!open || !applicationId || messages.length === 0) return;
    const unreadIncomingIds = messages
      .filter((message) => message.senderRole !== currentRole && !message.readAt)
      .map((message) => message.id);
    if (unreadIncomingIds.length === 0) return;

    const readKey = unreadIncomingIds.join(":");
    if (lastMarkedReadKeyRef.current === readKey) return;
    lastMarkedReadKeyRef.current = readKey;
    markReadMutation.mutate();
  }, [applicationId, currentRole, markReadMutation, messages, open]);

  useEffect(() => {
    if (messagesQuery.isError) {
      toast.error(messagesQuery.error instanceof Error ? messagesQuery.error.message : "Không thể tải tin nhắn");
    }
  }, [messagesQuery.error, messagesQuery.isError]);

  const handleSend = async () => {
    if (!applicationId || !canSend) return;
    const text = draft.trim();

    shouldScrollRef.current = true;
    setDraft("");
    try {
      const message = await sendMessageMutation.mutateAsync(text);
      onMessageSent?.(message);
      toast.success("Đã gửi tin nhắn");
    } catch (error) {
      if (error instanceof ApiError && error.code === "QUOTA_EXCEEDED") {
        const details = error.details as { resource?: string; used?: number; limit?: number } | undefined;
        setQuota({ resource: details?.resource, used: details?.used, limit: details?.limit });
        toast.error("Dung lượng đã đầy, cần nâng gói để tiếp tục.");
      }
      setDraft(text);
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn");
    }
  };

  const handleDraftKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!canSend || sending) return;
    handleSend();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#005a71]" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div
          ref={listRef}
          className="max-h-[420px] min-h-[260px] space-y-3 overflow-y-auto rounded-lg border bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
        >
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Đang tải tin nhắn...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">
              Chưa có tin nhắn nào trong đơn ứng tuyển này.
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.senderRole === currentRole;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? "bg-[#005a71] text-white"
                        : "border bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                      {new Date(message.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2">
          {readOnly ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
              {readonlyMessage}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100">
                Hãy trao đổi ngắn trong app vì số lượt chat có giới hạn. Nếu cần trao đổi dài hoặc chính thức hơn, hãy chuyển sang Email.
              </div>
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                placeholder="Nhập tin nhắn ngắn về lịch phỏng vấn hoặc thông tin bổ sung..."
                maxLength={2000}
                rows={3}
              />
            </>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{readOnly ? "Chế độ chỉ xem" : `${draft.trim().length}/2000 ký tự`}</span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                shouldScrollRef.current = isNearBottom();
                messagesQuery.refetch();
              }}
              disabled={loading || !applicationId}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Làm mới
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {!readOnly && (
            <Button type="button" onClick={handleSend} disabled={!canSend || sending}>
              <Send className="h-4 w-4" />
              {sending ? "Đang gửi..." : "Gửi"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      <QuotaUpgradeDialog
        open={Boolean(quota)}
        onOpenChange={(nextOpen) => !nextOpen && setQuota(null)}
        resource={quota?.resource}
        used={quota?.used}
        limit={quota?.limit}
      />
    </Dialog>
  );
}
