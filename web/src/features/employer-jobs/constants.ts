import type { JobFormState, JobStats, JobStatus } from "./types";

export const EMPTY_JOB_FORM: JobFormState = {
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
};

export const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "REMOTE", label: "Remote" },
  { value: "CONTRACT", label: "Hợp đồng" },
  { value: "INTERNSHIP", label: "Thực tập" },
  { value: "FREELANCE", label: "Freelance" },
];

export const EXP_LEVELS = [
  { value: "NO_EXPERIENCE", label: "Không yêu cầu" },
  { value: "UNDER_1_YEAR", label: "Dưới 1 năm" },
  { value: "ONE_TO_THREE_YEARS", label: "1-3 năm" },
  { value: "THREE_TO_FIVE_YEARS", label: "3-5 năm" },
  { value: "OVER_FIVE_YEARS", label: "Trên 5 năm" },
];

export const JOB_LEVELS = [
  { value: "INTERN", label: "Thực tập sinh" },
  { value: "FRESHER", label: "Fresher" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Middle" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
  { value: "MANAGER", label: "Manager" },
  { value: "DIRECTOR", label: "Director" },
];

export const STATUS_FILTERS: { value: JobStatus; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang tuyển" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "DRAFT", label: "Nháp" },
  { value: "CLOSED", label: "Đã đóng" },
  { value: "EXPIRED", label: "Hết hạn" },
];

export const EMPTY_STATS: JobStats = {
  ALL: 0,
  ACTIVE: 0,
  PENDING: 0,
  DRAFT: 0,
  CLOSED: 0,
  EXPIRED: 0,
};
