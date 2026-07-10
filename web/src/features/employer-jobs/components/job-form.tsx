"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MarkdownRichEditor } from "@/components/ui/MarkdownRichEditor";
import { EXP_LEVELS, JOB_LEVELS, JOB_TYPES } from "../constants";
import type { JobCategory, JobFormState } from "../types";

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

export function JobForm({
  form,
  categories,
  submitting,
  submitLabel,
  submittingLabel,
  onChange,
  onSubmit,
}: {
  form: JobFormState;
  categories: JobCategory[];
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onChange: (field: keyof JobFormState, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <Input value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="VD: Lễ tân khách sạn" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Ngành nghề <span className="text-red-500">*</span>
              </label>
              <select
                value={form.categoryId}
                onChange={(event) => onChange("categoryId", event.target.value)}
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
            <label className="mb-1.5 block text-sm font-medium">
              Mô tả công việc <span className="text-red-500">*</span>
            </label>
            <MarkdownRichEditor value={form.description} onChange={(value) => onChange("description", value)} placeholder="Mô tả chi tiết công việc..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Yêu cầu</label>
            <MarkdownRichEditor value={form.requirements} onChange={(value) => onChange("requirements", value)} placeholder="Yêu cầu ứng viên..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Quyền lợi</label>
            <MarkdownRichEditor value={form.benefits} onChange={(value) => onChange("benefits", value)} placeholder="Quyền lợi phúc lợi..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Loại hình</label>
              <select value={form.type} onChange={(event) => onChange("type", event.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-[#0d2d42]">
                {JOB_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kinh nghiệm</label>
              <select value={form.experience} onChange={(event) => onChange("experience", event.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-[#0d2d42]">
                {EXP_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cấp bậc</label>
              <select value={form.level} onChange={(event) => onChange("level", event.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-[#0d2d42]">
                {JOB_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Số lượng</label>
              <Input type="number" min="1" value={form.quantity} onChange={(event) => onChange("quantity", event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Lương tối thiểu (VND)</label>
              <CurrencyInput value={form.salaryMin} onChange={(value) => onChange("salaryMin", value)} placeholder="VD: 10.000.000" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Lương tối đa (VND)</label>
              <CurrencyInput value={form.salaryMax} onChange={(value) => onChange("salaryMax", value)} placeholder="VD: 20.000.000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </>
  );
}
