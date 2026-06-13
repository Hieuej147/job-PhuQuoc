/**
 * TÊN TRANG: Cài đặt hệ thống (Employer Settings)
 * MÔ TẢ: Trang cho phép nhà tuyển dụng cấu hình các thiết lập cá nhân như giao diện hiển thị (Dark Mode/Light Mode).
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - Hiện tại chỉ tương tác với local state (LocalStorage) thông qua Context API (useTheme) để chuyển đổi giao diện, chưa giao tiếp với Database.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

export default function EmployerSettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Giao diện</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Chế độ hiển thị</p>
              <p className="text-xs text-muted-foreground">Chế độ sáng hoặc tối</p>
            </div>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
            >
              {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
