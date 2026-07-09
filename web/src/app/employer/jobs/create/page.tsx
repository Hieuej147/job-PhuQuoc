"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MarkdownRichEditor } from "@/components/ui/MarkdownRichEditor";
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

function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  // Keep formatting outside the input to avoid cursor jumps with Vietnamese IME.
  const displayValue = value
    ? new Intl.NumberFormat("vi-VN").format(Number(value))
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(raw);
  };

  return (
    <div className="relative">
      <div className="relative">
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
              <MarkdownRichEditor
                value={form.description}
                onChange={(val) => updateField("description", val)}
                placeholder="Mô tả chi tiết công việc..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Yêu cầu
              </label>
              <MarkdownRichEditor
                value={form.requirements}
                onChange={(val) => updateField("requirements", val)}
                placeholder="Yêu cầu ứng viên..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Quyền lợi
              </label>
              <MarkdownRichEditor
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
