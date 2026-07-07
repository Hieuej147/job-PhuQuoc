const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=12";

export const DEFAULT_RESUME_DRAFT = {
  title: "Hồ sơ mới tạo",
  address: "Phú Quốc, Kiên Giang",
  degree: "Cử nhân / Vị trí ứng tuyển",
  summary: "Bản tóm tắt nghề nghiệp giới thiệu năng lực bản thân bạn...",
  languages: "Tiếng Việt, Tiếng Anh",
  skills: "Lập trình, Giao tiếp",
  socialLinks: [],
  education: [],
  experience: [
    {
      company: "Tên công ty",
      position: "Chức vụ",
      startYear: "2023",
      endYear: "Hiện tại",
      description: "Mô tả công việc và thành tựu...",
    },
  ],
  projects: [],
};

export function toTemplateUser(source: any = {}) {
  return {
    name: source.name || source.user?.name || "Họ và Tên",
    email: source.email || source.user?.email || "",
    phone: source.phone || source.user?.phone || "",
    avatar: source.avatar || source.image || source.user?.image || DEFAULT_AVATAR,
  };
}

export function toTemplateResume(source: any = {}) {
  return {
    title: source.title || "Hồ sơ của tôi",
    address: source.address || "",
    summary: source.summary || "",
    degree: source.degree || "",
    languages: source.languages || "",
    skills: source.skills || "",
    socialLinks: source.socialLinks || source.socicallink || [],
    education: source.education || [],
    experience: source.experience || [],
    projects: source.projects || [],
  };
}

export function toNewTemplateResume(profile: any = {}) {
  return {
    ...DEFAULT_RESUME_DRAFT,
    address: profile.address || DEFAULT_RESUME_DRAFT.address,
    degree: profile.degree || DEFAULT_RESUME_DRAFT.degree,
    summary: profile.summary || DEFAULT_RESUME_DRAFT.summary,
    languages: profile.languages || DEFAULT_RESUME_DRAFT.languages,
    skills: profile.skills || DEFAULT_RESUME_DRAFT.skills,
    socialLinks: profile.socialLinks || DEFAULT_RESUME_DRAFT.socialLinks,
    education: Array.isArray(profile.education) && profile.education.length > 0
      ? profile.education
      : DEFAULT_RESUME_DRAFT.education,
    experience: Array.isArray(profile.experience) && profile.experience.length > 0
      ? profile.experience
      : DEFAULT_RESUME_DRAFT.experience,
    projects: Array.isArray(profile.projects) && profile.projects.length > 0
      ? profile.projects
      : DEFAULT_RESUME_DRAFT.projects,
  };
}
