"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/features/employer-jobs/components/job-form";
import { EMPTY_JOB_FORM } from "@/features/employer-jobs/constants";
import { getCategories, getManagedJob, updateJob } from "@/features/employer-jobs/api";
import { buildJobPayload, jobToForm, validateJobForm } from "@/features/employer-jobs/utils";
import type { JobCategory, JobFormState } from "@/features/employer-jobs/types";

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<JobFormState>(EMPTY_JOB_FORM);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [job, categoriesPayload] = await Promise.all([
          getManagedJob(jobId),
          getCategories().catch(() => null),
        ]);
        if (!mounted) return;
        setCategories(categoriesPayload ? (Array.isArray(categoriesPayload) ? categoriesPayload : categoriesPayload.items || []) : []);
        setStatus(job.status ?? "");
        setForm(jobToForm(job));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tải tin tuyển dụng");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const updateField = (field: keyof JobFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const validationError = validateJobForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      await updateJob(jobId, buildJobPayload(form));
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

      <JobForm
        form={form}
        categories={categories}
        submitting={saving}
        submitLabel="Lưu thay đổi"
        submittingLabel="Đang lưu..."
        onChange={updateField}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
