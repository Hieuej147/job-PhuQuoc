"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/features/employer-jobs/components/job-form";
import { EMPTY_JOB_FORM } from "@/features/employer-jobs/constants";
import { createJob, getCategories, getManagedJob } from "@/features/employer-jobs/api";
import { buildJobPayload, jobToForm, validateJobForm } from "@/features/employer-jobs/utils";
import { getWorkLocations, type WorkLocation } from "@/features/locations/api";
import type { JobCategory, JobFormState } from "@/features/employer-jobs/types";

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneSourceTitle, setCloneSourceTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [form, setForm] = useState<JobFormState>(EMPTY_JOB_FORM);

  useEffect(() => {
    Promise.all([
      getCategories(),
      getWorkLocations().catch(() => []),
    ])
      .then(([categoriesPayload, locationsPayload]) => {
        setCategories(Array.isArray(categoriesPayload) ? categoriesPayload : categoriesPayload.items || []);
        setWorkLocations(Array.isArray(locationsPayload) ? locationsPayload : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cloneJobId = new URLSearchParams(window.location.search).get("cloneJobId");
    if (!cloneJobId) return;

    setCloneLoading(true);
    getManagedJob(cloneJobId)
      .then((job) => {
        setCloneSourceTitle(job.title || null);
        setForm(jobToForm(job));
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Không thể tải tin cần nhân bản";
        setError(message);
        toast.error(message);
      })
      .finally(() => setCloneLoading(false));
  }, []);

  const updateField = (field: keyof JobFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const validationError = validateJobForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const job = await createJob(buildJobPayload(form));
      toast.success("Đã tạo bản nháp tin tuyển dụng");
      router.push(`/employer/jobs/${job.id}/checkout`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo job thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 size-4" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold">{cloneSourceTitle ? "Nhân bản tin tuyển dụng" : "Đăng tin tuyển dụng"}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {cloneSourceTitle && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
          Đang nhân bản từ tin "{cloneSourceTitle}". Hệ thống chỉ sao chép nội dung, không sao chép trạng thái, thanh toán, deadline hoặc gói hiển thị.
        </div>
      )}

      {cloneLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải dữ liệu tin cần nhân bản...
        </div>
      )}

      <JobForm
        form={form}
        categories={categories}
        workLocations={workLocations}
        submitting={loading}
        submitLabel="Đăng tin"
        submittingLabel="Đang tạo..."
        onChange={updateField}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
