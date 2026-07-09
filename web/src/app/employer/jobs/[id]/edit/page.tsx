"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MarkdownRichEditor } from "@/components/ui/MarkdownRichEditor";
import { apiGet, apiPatch } from "@/lib/api-client";

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

type JobForm = {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  categoryId: string;
  type: string;
  experience: string;
  level: string;
  salaryMin: string;
  salaryMax: string;
  quantity: string;
};

function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const displayValue = value ? new Intl.NumberFormat("vi-VN").format(Number(value)) : "";

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          placeholder={placeholder}
          className="pr-12"
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          VNĐ
        </div>
      </div>
      {displayValue && (
        <p className="mt-1.5 text-xs font-medium tracking-wide text-blue-600 dark:text-blue-400">
          ~ {displayValue} VNĐ
        </p>
      )}
    </div>
  );
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<JobForm>({
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
    let mounted = true;

    async function load() {
      try {
        const [jobRes, categoriesRes] = await Promise.all([
          apiGet<any>(`/api/v1/jobs/manage/${jobId}`),
          apiGet<any>("/api/v1/categories").catch(() => null),
        ]);

        const job = jobRes;
        const categoriesBody = categoriesRes;

        if (!mounted) return;
        setCategories(categoriesBody?.items ?? categoriesBody ?? []);
        setStatus(job.status ?? "");
        setForm({
          title: job.title ?? "",
          description: job.description ?? "",
          requirements: job.requirements ?? "",
          benefits: job.benefits ?? "",
          categoryId: job.categoryId ?? job.category?.id ?? "",
          type: job.type ?? "FULL_TIME",
          experience: job.experience ?? "NO_EXPERIENCE",
          level: job.level ?? "JUNIOR",
          salaryMin: job.salaryMin ? String(job.salaryMin) : "",
          salaryMax: job.salaryMax ? String(job.salaryMax) : "",
          quantity: job.quantity ? String(job.quantity) : "1",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tải tin tuyển dụng");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const updateField = (field: keyof JobForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.categoryId) {
      toast.error("Vui lòng điền tiêu đề, mô tả và chọn ngành nghề");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        type: form.type,
        experience: form.experience,
        level: form.level,
        quantity: parseInt(form.quantity, 10) || 1,
      };

      if (form.requirements) body.requirements = form.requirements;
      if (form.benefits) body.benefits = form.benefits;
      if (form.salaryMin) body.salaryMin = parseInt(form.salaryMin, 10);
      if (form.salaryMax) body.salaryMax = parseInt(form.salaryMax, 10);

      await apiPatch(`/api/v1/jobs/${jobId}`, body);

      toast.success(status === "ACTIVE" ? "Đã cập nhật nội dung tin đang tuyển" : "Đã cập nhật tin tuyển dụng");
      router.push("/employer/jobs");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật tin tuyển dụng");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-7 animate-spin text-[#0E7490]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 size-4" /> Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sửa tin tuyển dụng</h1>
          {status === "ACTIVE" && (
            <p className="text-sm text-muted-foreground">
              Tin đang chạy chỉ cập nhật nội dung, không reset thanh toán, deadline hoặc lịch Inngest.
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tiêu đề</label>
              <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ngành nghề</label>
              <select
                value={form.categoryId}
                onChange={(event) => updateField("categoryId", event.target.value)}
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-[#0d2d42]"
              >
                <option value="">Chọn ngành nghề</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Mô tả công việc</label>
            <MarkdownRichEditor value={form.description} onChange={(value) => updateField("description", value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Yêu cầu</label>
            <MarkdownRichEditor value={form.requirements} onChange={(value) => updateField("requirements", value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Quyền lợi</label>
            <MarkdownRichEditor value={form.benefits} onChange={(value) => updateField("benefits", value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Loại hình</label>
              <select value={form.type} onChange={(event) => updateField("type", event.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-[#0d2d42]">
                {JOB_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kinh nghiệm</label>
              <select value={form.experience} onChange={(event) => updateField("experience", event.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-[#0d2d42]">
                {EXP_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cấp bậc</label>
              <select value={form.level} onChange={(event) => updateField("level", event.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-[#0d2d42]">
                {JOB_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Số lượng</label>
              <Input type="number" min="1" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Lương tối thiểu (VND)</label>
              <CurrencyInput value={form.salaryMin} onChange={(value) => updateField("salaryMin", value)} placeholder="VD: 10.000.000" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Lương tối đa (VND)</label>
              <CurrencyInput value={form.salaryMax} onChange={(value) => updateField("salaryMax", value)} placeholder="VD: 20.000.000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
