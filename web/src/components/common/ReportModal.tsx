"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/lib/api-client";
import { useAuth } from "@/components/auth/auth-provider";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";

export type EntityType = "job" | "company" | "blog";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
}

export function ReportModal({ isOpen, onClose, entityType, entityId, entityTitle }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thực hiện báo cáo.");
      return;
    }
    if (!reason) {
      toast.error("Vui lòng chọn lý do báo cáo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = `/api/v1/reports/${entityType}/${entityId}`;
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reason, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đã có lỗi xảy ra");
      }

      toast.success("Báo cáo của bạn đã được gửi thành công. Chúng tôi sẽ xem xét sớm nhất.");
      onClose();
      setReason("");
      setDescription("");
    } catch (error: any) {
      toast.error(error.message || "Gửi báo cáo thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntityName = () => {
    if (entityType === "job") return "việc làm";
    if (entityType === "company") return "công ty";
    return "bài viết";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Báo cáo {getEntityName()}</DialogTitle>
          <DialogDescription>
            Bạn đang báo cáo: <strong>{entityTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do báo cáo <span className="text-destructive">*</span></Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger id="reason" className="w-full">
                <SelectValue placeholder="Chọn lý do" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPAM">Spam, quảng cáo trái phép</SelectItem>
                <SelectItem value="FRAUD">Lừa đảo, đa cấp</SelectItem>
                <SelectItem value="INAPPROPRIATE">Nội dung không phù hợp</SelectItem>
                <SelectItem value="FAKE_INFO">Thông tin sai sự thật</SelectItem>
                <SelectItem value="OTHER">Lý do khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết (không bắt buộc)</Label>
            <Textarea
              id="description"
              placeholder="Cung cấp thêm thông tin giúp chúng tôi xử lý nhanh hơn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Đang gửi...
                </>
              ) : (
                "Gửi báo cáo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
