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
}

// ── Registry ───────────────────────────────────────────────────

export const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  "tpl-modern-01": TemplateModern,
  "tpl-minimal-02": TemplateClassic,
  "tpl-creative-03": TemplateCreative,
  "tpl-it-04": TemplateFuturistic,
  "tpl-hotel-05": TemplateElegant,
  "tpl-corporate-06": TemplateElegant,
  "tpl-clean-07": TemplateMinimalistModern,
  "tpl-bold-08": TemplateModern,
  "tpl-infographic-09": TemplateCreative,
  "tpl-academic-10": TemplateClassic,
};

export const SLUG_TO_ID: Record<string, string> = {
  modern: "tpl-modern-01",
  classic: "tpl-minimal-02",
  creative: "tpl-creative-03",
  futuristic: "tpl-it-04",
  elegant: "tpl-hotel-05",
  corporate: "tpl-corporate-06",
  minimalist: "tpl-clean-07",
  bold: "tpl-bold-08",
  infographic: "tpl-infographic-09",
  academic: "tpl-academic-10",
};

export interface TemplateDisplay {
  name: string;
  slug: string;
  style: string;
}

export const TEMPLATE_DISPLAY: Record<string, TemplateDisplay> = {
  "tpl-modern-01": { name: "Modern Navy", slug: "modern", style: "Hiện đại, thanh lịch" },
  "tpl-minimal-02": { name: "Classic Minimalist", slug: "classic", style: "Tối giản, cổ điển" },
  "tpl-creative-03": { name: "Creative Orange", slug: "creative", style: "Sáng tạo, nổi bật" },
  "tpl-it-04": { name: "Tech Developer Pro", slug: "futuristic", style: "Công nghệ, hiện đại" },
  "tpl-hotel-05": { name: "Elegant Resort", slug: "elegant", style: "Khách sạn, du lịch" },
  "tpl-corporate-06": { name: "Corporate Executive", slug: "corporate", style: "Doanh nghiệp, chuyên nghiệp" },
  "tpl-clean-07": { name: "Clean Teal", slug: "minimalist", style: "Sạch sẽ, tươi mới" },
  "tpl-bold-08": { name: "Bold Typography", slug: "bold", style: "Ấn tượng, đậm nét" },
  "tpl-infographic-09": { name: "Marketing Infographic", slug: "infographic", style: "Tiếp thị, trực quan" },
  "tpl-academic-10": { name: "Academic CV", slug: "academic", style: "Học thuật, nghiên cứu" },
};

export {
  TemplateClassic,
  TemplateModern,
  TemplateCreative,
  TemplateElegant,
  TemplateFuturistic,
  TemplateMinimalistModern,
};
