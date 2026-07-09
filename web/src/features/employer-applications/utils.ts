import type { EmployerApplication, StatusConfig } from "./types";
import { timeAgo } from "@/lib/utils/date";

export const statusMap: Record<string, StatusConfig> = {
  PENDING: { label: "Chờ xem", class: "bg-amber-500/10 text-amber-500 border-amber-500/20", dot: "bg-amber-500" },
  REVIEWING: { label: "Đang xem xét", class: "bg-blue-500/10 text-blue-500 border-blue-500/20", dot: "bg-blue-500" },
  ACCEPTED: { label: "Chấp nhận", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dot: "bg-emerald-500" },
  REJECTED: { label: "Từ chối", class: "bg-rose-500/10 text-rose-500 border-rose-500/20", dot: "bg-rose-500" },
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

export function getSkillsList(skillsStr?: string | null) {
  if (!skillsStr) return ["Giao tiếp", "Làm việc nhóm", "Thích ứng"];
  return skillsStr.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 4);
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

export function getApplicationEducation(app: EmployerApplication) {
  if (!app.resume?.education) return "Chưa cập nhật học vấn";
  try {
    const list = Array.isArray(app.resume.education) ? app.resume.education : JSON.parse(app.resume.education as string);
    return list.length > 0 && list[0].school ? list[0].school : "Chưa cập nhật học vấn";
  } catch {
    return "Chưa cập nhật học vấn";
  }
}

export function getApplicationExperience(app: EmployerApplication) {
  if (!app.resume?.experience) return "Chưa cập nhật kinh nghiệm";
  try {
    const list = Array.isArray(app.resume.experience) ? app.resume.experience : JSON.parse(app.resume.experience as string);
    if (list.length === 0 || !list[0].position) return "Chưa cập nhật kinh nghiệm";
    const years = list[0].years || (list[0].startYear && list[0].endYear ? Number(list[0].endYear) - Number(list[0].startYear) : 2);
    return `${years} năm kinh nghiệm`;
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
