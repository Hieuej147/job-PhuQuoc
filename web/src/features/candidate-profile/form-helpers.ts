import type { Education, Experience } from "./types";

export const EMPTY_EXPERIENCE: Experience = {
  company: "",
  position: "",
  startYear: "",
  endYear: "",
  description: "",
};

export const EMPTY_EDUCATION: Education = {
  school: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
};

export function getMissingExperienceFields(experience: Experience) {
  const missing: string[] = [];
  if (!experience.company) missing.push("Tên công ty");
  if (!experience.position) missing.push("Chức danh");
  if (!experience.startYear) missing.push("Năm bắt đầu");
  if (!experience.endYear) missing.push("Năm kết thúc");
  if (!experience.description) missing.push("Mô tả công việc");
  return missing;
}

export function getMissingEducationFields(education: Education) {
  const missing: string[] = [];
  if (!education.school) missing.push("Tên trường");
  if (!education.degree) missing.push("Bằng cấp");
  if (!education.field) missing.push("Ngành học");
  if (!education.startYear) missing.push("Năm bắt đầu");
  if (!education.endYear) missing.push("Năm kết thúc");
  return missing;
}
