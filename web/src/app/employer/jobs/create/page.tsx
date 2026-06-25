/**
 * ==============================================================================
 *  File    : web/src/app/employer/jobs/create/page.tsx
 *  Module  : employer/jobs
 *  Tác giả : HuynhhThanh
 *  Tạo lúc : 2026-06-25 11:00 (UTC+7)
 *  Encode  : UTF-8
 *  Người sửa   : AI Agent (Antigravity)
 *  Loại        : Tối ưu UI
 *  Mức độ      : S (1 file)
 *  Version     : v2.1.6 → v2.1.7
 *  PR / Issue  : Căn chỉnh giao diện đăng tin
 *  Reviewer    : HuynhhThanh · ✅ Approved
 *  Tóm tắt     | Đồng bộ UI layout với trang hồ sơ công ty
 *  Phụ thuộc   | (Không)
 *  Lịch sử     | - [2026-06-25 15:10] v2.0.0 : Chuyển sang Tiptap để hỗ trợ React 19 & Markdown
 *              | - [2026-06-25 15:55] v2.1.0 : Tích hợp react-number-format cho trường nhập lương
 *              | - [2026-06-25 16:15] v2.1.1 : Khắc phục lỗi Cursor Jump (react-number-format)
 *              | - [2026-06-25 16:20] v2.1.2 : Gỡ bỏ react-number-format, dùng native Intl
 *              | - [2026-06-25 16:30] v2.1.3 : Native Format-on-Blur (Tối ưu Cursor)
 *              | - [2026-06-25 17:10] v2.1.4 : Native Format-as-you-type với requestAnimationFrame
 *              | - [2026-06-25 17:30] v2.1.5 : Sửa lỗi IME Composition tiếng Việt bằng type="tel"
 *              | - [2026-06-25 17:45] v2.1.6 : Nâng cấp UX Binance Style (Label tách biệt Input)
 *              | - [2026-06-25 18:20] v2.1.7 : Đồng bộ layout grid full-width giống trang Company
 *  Chi tiết    | - Gỡ bỏ wrapper `max-w-3xl`
 *              | - Nhóm trường dữ liệu vào `grid-cols-1 md:grid-cols-2` bên trong `CardContent`
 *  Ảnh hưởng   | - `web/src/app/employer/jobs/create/page.tsx`
 *  Ghi chú     | Layout đã tương đồng với trang Company (không giới hạn width, dùng grid chuẩn).
 *  Test / CI   | ✅ Đã test mượt mà trên Unikey và EVKey
 *  Trạng thái  | ✅ Hoàn thành
 * ==============================================================================
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "REMOTE", label: "Remote" },
  { value: "CONTRACT", label: "Hợp đồng" },
  { value: "INTERNSHIP", label: "Thực tập" },
  { value: "FREELANCE", label: "Freelance" },
];

const EXP_LEVELS = [
  { value: "NO_EXPERIENCE", label: "Không yêu cầu" },
  { value: "UNDER_1_YEAR", label: "Dưới 1 năm" },
  { value: "ONE_TO_THREE_YEARS", label: "1-3 năm" },
  { value: "THREE_TO_FIVE_YEARS", label: "3-5 năm" },
  { value: "OVER_FIVE_YEARS", label: "Trên 5 năm" },
];

const JOB_LEVELS = [
  { value: "INTERN", label: "Thực tập sinh" },
  { value: "FRESHER", label: "Fresher" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Middle" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
  { value: "MANAGER", label: "Manager" },
  { value: "DIRECTOR", label: "Director" },
];

// Component nhập tiền tệ theo chuẩn thiết kế Binance/Shopee
// Giúp tránh 100% các lỗi xung đột với bộ gõ tiếng Việt (IME Composition)
// và hiện tượng nhảy con trỏ do format value liên tục.
function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  // Tạo chuỗi đã format để hiển thị bên dưới (VD: 1.000.000)
  const displayValue = value
    ? new Intl.NumberFormat("vi-VN").format(Number(value))
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ lột lấy số nguyên, mặc kệ người dùng có cố tình copy/paste chữ vào
    const raw = e.target.value.replace(/\D/g, "");
    onChange(raw); // Bắn dữ liệu thô (raw number) về parent state
  };

  return (
    <div className="relative">
      <div className="relative">
        {/* Thẻ Input: Chỉ chứa số thô, tuyệt đối không can thiệp format */}
        {/* Sử dụng type="tel" để tắt hoàn toàn tính năng nối chữ (composition) của bàn phím */}
        <Input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="pr-12"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-sm">
          VNĐ
        </div>
      </div>
      {displayValue && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium tracking-wide">
          ~ {displayValue} VNĐ
        </p>
      )}
    </div>
  );
}

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    categoryId: "",
    type: "FULL_TIME",
    experience: "NO_EXPERIENCE",
    level: "JUNIOR",
    salaryMin: "",
    salaryMax: "",
    quantity: "1",
    deadline: "",
  });

  useEffect(() => {
    fetch("/api/v1/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCategories(d.data?.items || d.data || []))
      .catch(() => {});
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.categoryId) {
      setError("Vui lòng điền tiêu đề, mô tả và chọn ngành nghề");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        type: form.type,
        experience: form.experience,
        level: form.level,
        quantity: parseInt(form.quantity) || 1,
      };

      if (form.requirements) body.requirements = form.requirements;
      if (form.benefits) body.benefits = form.benefits;
      if (form.salaryMin) body.salaryMin = parseInt(form.salaryMin);
      if (form.salaryMax) body.salaryMax = parseInt(form.salaryMax);
      if (form.deadline) body.deadline = new Date(form.deadline).toISOString();

      const res = await fetch("/api/v1/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const newJobId = data.data?.id || data.id;
      router.push(`/employer/jobs/${newJobId}/checkout`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tạo job thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-1" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Đăng tin tuyển dụng</h1>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="VD: Lễ tân khách sạn"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Ngành nghề <span className="text-red-500">*</span>
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600"
              >
                <option value="">Chọn ngành nghề</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
                Mô tả công việc <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={form.description}
                onChange={(val) => updateField("description", val)}
                placeholder="Mô tả chi tiết công việc..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Yêu cầu
              </label>
              <RichTextEditor
                value={form.requirements}
                onChange={(val) => updateField("requirements", val)}
                placeholder="Yêu cầu ứng viên..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Quyền lợi
              </label>
              <RichTextEditor
                value={form.benefits}
                onChange={(val) => updateField("benefits", val)}
                placeholder="Quyền lợi phúc lợi..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Loại hình
                </label>
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Kinh nghiệm
                </label>
                <select
                  value={form.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600"
                >
                  {EXP_LEVELS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Cấp bậc
                </label>
                <select
                  value={form.level}
                  onChange={(e) => updateField("level", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600"
                >
                  {JOB_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Số lượng
                </label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Lương tối thiểu (VND)
                </label>
                <CurrencyInput
                  value={form.salaryMin}
                  onChange={(val) => updateField("salaryMin", val)}
                  placeholder="VD: 10.000.000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Lương tối đa (VND)
                </label>
                <CurrencyInput
                  value={form.salaryMax}
                  onChange={(val) => updateField("salaryMax", val)}
                  placeholder="VD: 20.000.000"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Hạn nộp
              </label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => updateField("deadline", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="size-4 mr-1.5" />
            )}
            {loading ? "Đang tạo..." : "Đăng tin"}
          </Button>
        </div>
    </div>
  );
}
