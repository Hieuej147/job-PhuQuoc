import type { EmployerApplication, StatusConfig } from "./types";
import { timeAgo } from "@/lib/utils/date";

export const statusMap: Record<string, StatusConfig> = {
  PENDING: {
    label: "Chờ xem",
    class: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-500",
  },
  REVIEWING: {
    label: "Đang xem xét",
    class: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dot: "bg-blue-500",
  },
  ACCEPTED: {
    label: "Chấp nhận",
    class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Từ chối",
    class: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    dot: "bg-rose-500",
  },
};

export const cardGradients = [
  "from-cyan-600 to-teal-500",
  "from-amber-500 to-orange-600",
  "from-emerald-600 to-teal-600",
  "from-indigo-600 to-violet-600",
];

export function formatTimeAgo(dateStr: string) {
  return `Nộp ${timeAgo(dateStr).toLowerCase()}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function parseList(value: unknown): Record<string, any>[] {
  if (!value) return [];
  const parsed = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? JSON.parse(value)
      : [];
  return Array.isArray(parsed)
    ? parsed.filter((item) => item && typeof item === "object")
    : [];
}

function firstText(...values: unknown[]) {
  return values.find((value) => typeof value === "string" && value.trim()) as string | undefined;
}

function parseYear(value: unknown) {
  if (value === "Hiện tại" || value === "Present" || value === "Now") {
    return new Date().getFullYear();
  }
  const year = Number(value);
  return Number.isFinite(year) && year > 0 ? year : null;
}

export function getApplicationEducation(app: EmployerApplication) {
  if (!app.resume?.education) return "Chưa cập nhật học vấn";
  try {
    const list = parseList(app.resume.education);
    const item = list.find((education) =>
      firstText(education.school, education.institution, education.name, education.degree, education.field),
    );
    if (!item) return "Chưa cập nhật học vấn";

    const school = firstText(item.school, item.institution, item.name);
    const degree = firstText(item.degree, item.field);
    return school || degree || "Chưa cập nhật học vấn";
  } catch {
    return "Chưa cập nhật học vấn";
  }
}

export function getApplicationExperience(app: EmployerApplication) {
  if (!app.resume?.experience) return "Chưa cập nhật kinh nghiệm";
  try {
    const list = parseList(app.resume.experience);
    const item = list.find((experience) =>
      firstText(experience.position, experience.title, experience.role, experience.company, experience.companyName),
    );
    if (!item) return "Chưa cập nhật kinh nghiệm";

    const position = firstText(item.position, item.title, item.role);
    const company = firstText(item.company, item.companyName);
    const explicitYears = Number(item.years);
    const startYear = parseYear(item.startYear);
    const endYear = parseYear(item.endYear) ?? new Date().getFullYear();
    const years = Number.isFinite(explicitYears) && explicitYears > 0
      ? explicitYears
      : startYear
        ? Math.max(0, endYear - startYear)
        : null;

    const title = position || company;
    if (title && years && years > 0) return `${title} • ${years} năm`;
    if (title) return title;
    return "Chưa cập nhật kinh nghiệm";
  } catch {
    return "Chưa cập nhật kinh nghiệm";
  }
}

export function getLatestMessage(app: EmployerApplication) {
  return app.messages?.[0]?.body || app.employerMessage || "";
}

export function buildResumeDocumentData(resume: EmployerApplication["resume"]) {
  if (!resume) return { selectedResumeUser: null, selectedResumeData: null };

  return {
    selectedResumeUser: {
      name: resume.name || resume.user?.name || "Họ và Tên",
      email: resume.email || resume.user?.email || "",
      phone: resume.phone || resume.user?.phone || "",
      avatar: resume.avatar || resume.user?.image || "",
    },
    selectedResumeData: {
      title: resume.title || "CV ứng viên",
      address: resume.address || "",
      summary: resume.summary || "",
      degree: resume.degree || "",
      languages: resume.languages || "",
      skills: resume.skills || "",
      socialLinks: resume.socialLinks || [],
      education: resume.education || [],
      experience: resume.experience || [],
      projects: resume.projects || [],
    },
  };
}
