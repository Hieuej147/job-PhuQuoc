"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
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
import { QuotaUpgradeDialog } from "@/components/quota/quota-upgrade-dialog";
import { ApiError } from "@/lib/api-client";
import {
  ApplicationChatComposer,
  ApplicationChatUsageBanner,
  ApplicationMessageList,
} from "@/components/applications/application-chat-parts";
import {
  type ApplicationMessage,
  type ApplicationMessageSenderRole,
  DEFAULT_APPLICATION_MESSAGE_USAGE,
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
  const messagesState = messagesQuery.data ?? { messages: [], usage: DEFAULT_APPLICATION_MESSAGE_USAGE };
  const messages = messagesState.messages;
  const usage = messagesState.usage;
  useApplicationChatRealtime(applicationId, open);

  const readonlyMessage = useMemo(() => {
    if (readOnlyReason) return readOnlyReason;
    if (chatClosedAt) return "Cuộc trò chuyện đã đóng. Bạn vẫn có thể xem lại lịch sử trao đổi.";
    if (applicationStatus === "REJECTED") return "Hồ sơ đã bị từ chối. Lời nhắn của nhà tuyển dụng chỉ ở chế độ xem.";
    if (applicationStatus && applicationStatus !== "ACCEPTED") return "Chỉ có thể nhắn tin sau khi hồ sơ được chấp nhận.";
    return "Cuộc trò chuyện đang ở chế độ xem.";
  }, [applicationStatus, chatClosedAt, readOnlyReason]);

  const canSend = useMemo(
    () => !readOnly && usage.remaining > 0 && draft.trim().length > 0 && draft.trim().length <= usage.maxLength,
    [draft, readOnly, usage.maxLength, usage.remaining],
  );
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
        const details = error.details as { resource?: string; used?: number; limit?: number; remaining?: number } | undefined;
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
      <DialogContent className="max-w-2xl gap-4 p-0">
        <DialogHeader>
          <div className="border-b px-6 py-4 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2">
              <span className="rounded-full bg-[#0e7490]/10 p-2 text-[#0e7490]">
                <MessageCircle className="h-5 w-5" />
              </span>
              {title}
            </DialogTitle>
            {description && <DialogDescription className="mt-1">{description}</DialogDescription>}
          </div>
        </DialogHeader>

        <div className="space-y-3 px-6">
          <ApplicationChatUsageBanner usage={usage} readOnly={readOnly} />
          <ApplicationMessageList messages={messages} currentRole={currentRole} loading={loading} listRef={listRef} />
          <ApplicationChatComposer
            draft={draft}
            maxLength={usage.maxLength}
            canSend={canSend}
            sending={sending}
            loading={loading}
            applicationId={applicationId}
            readOnly={readOnly}
            readOnlyMessage={readonlyMessage}
            onDraftChange={setDraft}
            onKeyDown={handleDraftKeyDown}
            onRefresh={() => {
                shouldScrollRef.current = isNearBottom();
                messagesQuery.refetch();
              }}
            onSend={handleSend}
          />
        </div>

        <DialogFooter className="border-t px-6 py-4 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
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
