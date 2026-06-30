import type { ComponentType } from "react";
import TemplateClassic from "./TemplateClassic";
import TemplateModern from "./TemplateModern";
import TemplateCreative from "./TemplateCreative";
import TemplateElegant from "./TemplateElegant";
import TemplateFuturistic from "./TemplateFuturistic";
import TemplateMinimalistModern from "./TemplateMinimalistModern";

// ── Types ──────────────────────────────────────────────────────

export interface UserData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  description: string;
  GPA?: string;
}

export interface Experience {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface Project {
  name: string;
  position: string;
  link: string;
  description: string;
}

export interface ResumeData {
  title: string;
  address: string;
  summary: string;
  degree: string;
  languages: string;
  skills: string;
  socialLinks: SocialLink[];
  /** @deprecated legacy alias for old template components */
  socicallink?: SocialLink[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
}

export interface TemplateProps {
  user: Partial<UserData>;
  resume: Partial<ResumeData>;
  resumeId?: string;
  readOnly?: boolean;
}

// ── Registry ───────────────────────────────────────────────────

export const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  "tpl-modern-01": TemplateModern,
  "tpl-classic-02": TemplateClassic,
  "tpl-creative-04": TemplateCreative,
  "tpl-dev-05": TemplateFuturistic,
  "tpl-minimal-03": TemplateMinimalistModern,
};

export const SLUG_TO_ID: Record<string, string> = {
  modern: "tpl-modern-01",
  classic: "tpl-classic-02",
  creative: "tpl-creative-04",
  futuristic: "tpl-dev-05",
  minimalist: "tpl-minimal-03",
};

export interface TemplateDisplay {
  name: string;
  slug: string;
  style: string;
}

export const TEMPLATE_DISPLAY: Record<string, TemplateDisplay> = {
  "tpl-modern-01": { name: "Modern Navy", slug: "modern", style: "Hiện đại, thanh lịch" },
  "tpl-classic-02": { name: "Classic Minimalist", slug: "classic", style: "Tối giản, cổ điển" },
  "tpl-creative-04": { name: "Creative Orange", slug: "creative", style: "Sáng tạo, nổi bật" },
  "tpl-dev-05": { name: "Tech Developer Pro", slug: "futuristic", style: "Công nghệ, hiện đại" },
  "tpl-minimal-03": { name: "Clean Teal", slug: "minimalist", style: "Sạch sẽ, tươi mới" },
};

export {
  TemplateClassic,
  TemplateModern,
  TemplateCreative,
  TemplateElegant,
  TemplateFuturistic,
  TemplateMinimalistModern,
};
