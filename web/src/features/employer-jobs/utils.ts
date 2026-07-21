import { EMPTY_JOB_FORM } from "./constants";
import type { EmployerJob, EmployerJobsResponse, JobFormState } from "./types";

export function unwrapJobs(payload: EmployerJobsResponse) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
}

export function jobToForm(job: Partial<EmployerJob>): JobFormState {
  return {
    ...EMPTY_JOB_FORM,
    title: job.title ?? "",
    description: job.description ?? "",
    requirements: job.requirements ?? "",
    benefits: job.benefits ?? "",
    wardId: job.wardId ?? job.ward?.id ?? "",
    addressDetail: job.addressDetail ?? "",
    categoryId: job.categoryId ?? job.category?.id ?? "",
    type: job.type ?? EMPTY_JOB_FORM.type,
    experience: job.experience ?? EMPTY_JOB_FORM.experience,
    level: job.level ?? EMPTY_JOB_FORM.level,
    salaryMin: job.salaryMin ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax ? String(job.salaryMax) : "",
    quantity: job.quantity ? String(job.quantity) : EMPTY_JOB_FORM.quantity,
  };
}

export function buildJobPayload(form: JobFormState) {
  const body: Record<string, unknown> = {
    title: form.title.trim(),
    description: form.description,
    categoryId: form.categoryId,
    type: form.type,
    experience: form.experience,
    level: form.level,
    quantity: parseInt(form.quantity, 10) || 1,
    wardId: form.wardId,
    addressDetail: form.addressDetail.trim(),
  };

  if (form.requirements) body.requirements = form.requirements;
  if (form.benefits) body.benefits = form.benefits;
  if (form.salaryMin) body.salaryMin = parseInt(form.salaryMin, 10);
  if (form.salaryMax) body.salaryMax = parseInt(form.salaryMax, 10);

  return body;
}

export function validateJobForm(form: JobFormState) {
  if (!form.title.trim() || !form.description.trim() || !form.categoryId) {
    return "Vui lòng điền tiêu đề, mô tả và chọn ngành nghề";
  }
  if (!form.wardId) {
    return "Vui lòng chọn khu vực làm việc";
  }
  if (!form.addressDetail.trim()) {
    return "Vui lòng nhập địa chỉ làm việc chi tiết";
  }
  return null;
}

export function getLocation(job: EmployerJob) {
  if (!job.ward) return "Chưa cập nhật địa điểm";
  return [job.ward.name, job.ward.district?.name].filter(Boolean).join(", ");
}

export function getBoostLabel(job: Pick<EmployerJob, "boostLevel" | "featuredUntil">) {
  const isBoosted = Boolean(
    job.boostLevel &&
      job.boostLevel > 0 &&
      (!job.featuredUntil || new Date(job.featuredUntil).getTime() >= Date.now()),
  );
  return isBoosted ? `Top ${4 - Math.min(Math.max(job.boostLevel || 0, 1), 3)}` : null;
}
