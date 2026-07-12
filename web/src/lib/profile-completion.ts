export type ProfileLike = Record<string, unknown> | null | undefined;

export interface ProfileCompletionItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ProfileCompletionResult {
  completionPct: number;
  items: ProfileCompletionItem[];
}

const labels: Record<string, string> = {
  basic: "Thông tin cơ bản (tên, email, SĐT)",
  avatar: "Ảnh đại diện",
  experience: "Kinh nghiệm làm việc",
  education: "Học vấn & bằng cấp",
  summary: "Tóm tắt bản thân (resume summary)",
  socials: "Liên kết mạng xã hội",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function computeProfileCompletion(profile: ProfileLike): ProfileCompletionResult {
  const p = asRecord(profile);
  const socialLinks = asRecord(p.socialLinks);
  const experience = Array.isArray(p.experience) ? p.experience : [];
  const education = Array.isArray(p.education) ? p.education : [];

  const sectionFields: Record<string, boolean[]> = {
    basic: [
      Boolean(p.name),
      Boolean(p.phone),
      Boolean(p.email),
      Boolean(p.address),
      Boolean(p.degree),
      Boolean(p.languages),
      Boolean(p.skills),
    ],
    avatar: [Boolean(p.avatar || p.image)],
    experience: [experience.length > 0],
    education: [education.length > 0],
    summary: [Boolean(p.summary)],
    socials: [
      Boolean(socialLinks.facebook),
      Boolean(socialLinks.linkedin),
      Boolean(socialLinks.github),
      Boolean(socialLinks.website),
    ],
  };

  const allFields = Object.values(sectionFields).flat();
  const completionPct = Math.round((allFields.filter(Boolean).length / allFields.length) * 100);

  const items = Object.entries(labels).map(([id, label]) => ({
    id,
    label,
    done: sectionFields[id]?.every(Boolean) ?? false,
  }));

  return { completionPct, items };
}
