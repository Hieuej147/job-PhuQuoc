/**
 * TÊN TRANG: Đăng Tin Tuyển Dụng Mới (Create Job)
 * MÔ TẢ: Form điền thông tin chi tiết (tiêu đề, mô tả, lương, yêu cầu, hạn nộp) để đăng tải một tin tuyển dụng mới.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - Fetch `/api/v1/categories`: Lấy danh sách ngành nghề (Categories) để hiển thị trong dropdown chọn ngành.
 * - POST `/api/v1/jobs`: Gửi dữ liệu form (thông tin job) xuống Backend để lưu vào bảng `Job` trong Database. Sau khi tạo thành công sẽ chuyển hướng sang trang thanh toán gói đăng tin.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE FILE HEADER & CHANGELOG — HuynhhThanh
// ─────────────────────────────────────────────────────────────────────────────
// ==============================================================================
//  File    : web/src/app/employer/jobs/create/page.tsx
//  Module  : employer/jobs
//  Tóm tắt : Form đăng tin tuyển dụng mới
//  Tác giả : HuynhhThanh
//  Tạo lúc : 2026-06-25 11:00 (UTC+7)
//  Encode  : UTF-8
//  Version : 1.1.0
//  Lịch sử :
//  - [2026-06-25 11:00] v1.1.0 : Tích hợp React Quill thay thế Textarea
// ------------------------------------------------------------------------------
//  Changelog — lần thay đổi gần nhất
// ------------------------------------------------------------------------------
//  | Trường          | Nội dung                                                |
//  |-----------------|----------------------------------------------------------|
//  | **Người sửa**   | HuynhhThanh                                  |
//  | **Loại**        | Tính năng                                                |
//  | **Mức độ**      | M (2-3 files)                                            |
//  | **Version**     | `v1.0.0 → v1.1.0`                                        |
//  | **PR / Issue**  | Không                                                    |
//  | **Reviewer**    | HuynhhThanh · ✅ Approved                                |
//  | **Tóm tắt**     | Tích hợp React Quill vào form tạo công việc              |
//  | **Phụ thuộc**   | `react-quill`                                            |
//  | **Skill/Tool**  | Không                                                    |
//  | **Chi tiết**    | - Import và sử dụng `RichTextEditor` thay vì `Textarea`  |
//  |                 | - Áp dụng cho trường description, requirements, benefits |
//  | **Ảnh hưởng**   | Không                                                    |
//  | **Test / CI**   | ✅ Build thành công                                        |
//  | **Trạng thái**  | ✅ Hoàn thành                                              |
// ==============================================================================
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

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tiêu đề <span className="text-red-500">*</span></label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="VD: Lễ tân khách sạn" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ngành nghề <span className="text-red-500">*</span></label>
              <select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600">
                <option value="">Chọn ngành nghề</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mô tả công việc <span className="text-red-500">*</span></label>
              <RichTextEditor value={form.description} onChange={(val) => updateField("description", val)} placeholder="Mô tả chi tiết công việc..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Yêu cầu</label>
              <RichTextEditor value={form.requirements} onChange={(val) => updateField("requirements", val)} placeholder="Yêu cầu ứng viên..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quyền lợi</label>
              <RichTextEditor value={form.benefits} onChange={(val) => updateField("benefits", val)} placeholder="Quyền lợi phúc lợi..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Chi tiết</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Loại hình</label>
              <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600">
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Kinh nghiệm</label>
              <select value={form.experience} onChange={(e) => updateField("experience", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600">
                {EXP_LEVELS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cấp bậc</label>
              <select value={form.level} onChange={(e) => updateField("level", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600">
                {JOB_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Số lượng</label>
              <Input type="number" value={form.quantity} onChange={(e) => updateField("quantity", e.target.value)} min="1" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lương tối thiểu (VND)</label>
              <Input type="number" value={form.salaryMin} onChange={(e) => updateField("salaryMin", e.target.value)} placeholder="VD: 10000000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lương tối đa (VND)</label>
              <Input type="number" value={form.salaryMax} onChange={(e) => updateField("salaryMax", e.target.value)} placeholder="VD: 20000000" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Hạn nộp</label>
              <Input type="date" value={form.deadline} onChange={(e) => updateField("deadline", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
            {loading ? "Đang tạo..." : "Đăng tin"}
          </Button>
        </div>
      </div>
    </div>
  );
}
