"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ tất cả các trường mật khẩu");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới nhập lại không trùng khớp");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: false,
      });

      if (error) {
        toast.error(error.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại");
      } else {
        toast.success("Thay đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast.error("Lỗi kết nối hoặc hệ thống khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Bảo mật tài khoản</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Thay đổi mật khẩu đăng nhập để bảo vệ an toàn cho tài khoản của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mật khẩu hiện tại</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="bg-transparent border-border pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="bg-transparent border-border pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nhập lại mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận lại mật khẩu mới"
                className="bg-transparent border-border pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 h-10 flex items-center gap-2"
            >
              <Save className="size-4" />
              {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
