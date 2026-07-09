import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EmployerApplication } from "../types";

interface ApplicationStatusDialogProps {
  dialog: { app: EmployerApplication; status: "ACCEPTED" | "REJECTED" } | null;
  message: string;
  submitting: boolean;
  setMessage: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ApplicationStatusDialog({
  dialog,
  message,
  submitting,
  setMessage,
  onClose,
  onConfirm,
}: ApplicationStatusDialogProps) {
  return (
    <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#071622] text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {dialog?.status === "ACCEPTED" ? "Chấp nhận hồ sơ" : "Từ chối hồ sơ"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Lời nhắn sẽ được lưu vào cuộc trò chuyện của đơn ứng tuyển để ứng viên đọc và phản hồi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Nhập lời nhắn gửi ứng viên..."
            className="border-slate-700 bg-[#0d2334] text-slate-100"
          />
          <p className="text-xs text-slate-500">{message.trim().length}/1000 ký tự</p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Đang cập nhật..." : "Xác nhận"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
