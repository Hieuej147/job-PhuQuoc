"use client";

type UserInfo = {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

type ResumeInfo = {
  title?: string;
  address?: string;
  summary?: string;
  degree?: string;
  languages?: string;
  skills?: string;
  socialLinks?: Array<{ platform?: string; url?: string }>;
  education?: Array<Record<string, string>>;
  experience?: Array<Record<string, string>>;
  projects?: Array<Record<string, string>>;
};

const TEMPLATE_ACCENTS: Record<string, { primary: string; soft: string; text: string }> = {
  "tpl-modern-01": { primary: "#1d4ed8", soft: "#eff6ff", text: "#1e3a8a" },
  "tpl-classic-02": { primary: "#57534e", soft: "#f5f5f4", text: "#292524" },
  "tpl-creative-04": { primary: "#ea580c", soft: "#fff7ed", text: "#9a3412" },
  "tpl-dev-05": { primary: "#0891b2", soft: "#ecfeff", text: "#164e63" },
  "tpl-minimal-03": { primary: "#0f766e", soft: "#f0fdfa", text: "#134e4a" },
};

function splitList(value?: string) {
  if (!value) return [];
  return value
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <section className="break-inside-avoid">
      <h2
        className="mb-3 border-b pb-1 text-[15px] font-bold uppercase tracking-wide"
        style={{ color: accent, borderColor: `${accent}33` }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ResumePrintDocument({
  user,
  resume,
  templateId,
}: {
  user: UserInfo;
  resume: ResumeInfo;
  templateId?: string;
}) {
  const accent = TEMPLATE_ACCENTS[templateId || ""] || TEMPLATE_ACCENTS["tpl-minimal-03"];
  const skills = splitList(resume.skills);
  const languages = splitList(resume.languages);

  return (
    <article
      data-resume-print-ready="true"
      className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[16mm] text-slate-800 shadow-none"
    >
      <header className="mb-8 flex items-center gap-6">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || "Avatar"}
            className="h-28 w-28 rounded-2xl object-cover"
            style={{ border: `4px solid ${accent.soft}` }}
          />
        ) : (
          <div
            className="flex h-28 w-28 items-center justify-center rounded-2xl text-4xl font-bold"
            style={{ background: accent.soft, color: accent.text }}
          >
            {(user.name || "CV").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-extrabold leading-tight" style={{ color: accent.text }}>
            {user.name || "Họ và tên"}
          </h1>
          {resume.degree && <p className="mt-1 text-lg font-semibold text-slate-600">{resume.degree}</p>}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {user.email && <span>{user.email}</span>}
            {user.phone && <span>{user.phone}</span>}
            {resume.address && <span>{resume.address}</span>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_72mm] gap-8">
        <main className="space-y-6">
          {resume.summary && (
            <Section title="Tóm tắt" accent={accent.primary}>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{resume.summary}</p>
            </Section>
          )}

          {resume.experience && resume.experience.length > 0 && (
            <Section title="Kinh nghiệm" accent={accent.primary}>
              <div className="space-y-4">
                {resume.experience.map((item, index) => (
                  <div key={index} className="break-inside-avoid">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{item.position || "Vị trí"}</h3>
                        {item.company && <p className="text-sm font-semibold" style={{ color: accent.primary }}>{item.company}</p>}
                      </div>
                      {(item.startYear || item.endYear) && (
                        <p className="shrink-0 text-xs text-slate-500">
                          {item.startYear || ""} - {item.endYear || "Hiện tại"}
                        </p>
                      )}
                    </div>
                    {item.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{item.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {resume.projects && resume.projects.length > 0 && (
            <Section title="Dự án" accent={accent.primary}>
              <div className="space-y-4">
                {resume.projects.map((item, index) => (
                  <div key={index} className="break-inside-avoid">
                    <h3 className="font-bold text-slate-900">{item.name || "Dự án"}</h3>
                    {item.position && <p className="text-sm font-semibold" style={{ color: accent.primary }}>{item.position}</p>}
                    {item.link && <p className="text-xs text-slate-500">{item.link}</p>}
                    {item.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{item.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </main>

        <aside className="space-y-6">
          {skills.length > 0 && (
            <Section title="Kỹ năng" accent={accent.primary}>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: accent.soft, color: accent.text }}>
                    {skill}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {resume.education && resume.education.length > 0 && (
            <Section title="Học vấn" accent={accent.primary}>
              <div className="space-y-4">
                {resume.education.map((item, index) => (
                  <div key={index} className="break-inside-avoid text-sm">
                    <h3 className="font-bold text-slate-900">{item.school || "Trường học"}</h3>
                    <p className="text-slate-600">{[item.degree, item.field].filter(Boolean).join(" - ")}</p>
                    {(item.startYear || item.endYear) && (
                      <p className="text-xs text-slate-500">{item.startYear || ""} - {item.endYear || ""}</p>
                    )}
                    {item.description && <p className="mt-1 whitespace-pre-line text-slate-600">{item.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {languages.length > 0 && (
            <Section title="Ngôn ngữ" accent={accent.primary}>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {languages.map((language) => <li key={language}>{language}</li>)}
              </ul>
            </Section>
          )}

          {resume.socialLinks && resume.socialLinks.length > 0 && (
            <Section title="Liên kết" accent={accent.primary}>
              <div className="space-y-2 text-sm">
                {resume.socialLinks.map((item, index) => (
                  <div key={index}>
                    <p className="font-semibold text-slate-900">{item.platform || "Link"}</p>
                    {item.url && <p className="break-all text-xs text-slate-500">{item.url}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </aside>
      </div>
    </article>
  );
}
