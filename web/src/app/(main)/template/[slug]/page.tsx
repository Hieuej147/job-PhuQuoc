/**
 * app/template/[slug]/page.tsx
 *
 * Route: /template/classic  →  TemplateClassic
 *        /template/modern   →  TemplateModern
 *
 * Trong thực tế bạn sẽ fetch user + resume từ DB bằng server action / prisma.
 * Ở đây có sẵn mock data để preview template ngay mà không cần DB.
 */

import { notFound } from "next/navigation";
import { TEMPLATE_MAP } from "@/template";

// ── Kiểu dữ liệu ─────────────────────────────────────────────
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ resumeId?: string }>;
}

// ── generateStaticParams (tuỳ chọn, dùng khi export static) ──
export async function generateStaticParams() {
  return Object.keys(TEMPLATE_MAP).map((slug) => ({ slug }));
}

// ── Mock data — thay bằng fetch DB thật ──────────────────────
async function getData(slug: string, resumeId?: string) {
  // TODO: thay đoạn này bằng prisma / fetch API thật
  // const resume = await prisma.resumes.findUnique({ where: { id: resumeId }, include: { user: true } });
  // if (!resume) return null;
  // return { user: resume.user, resume };

  const mockUser = {
    name: "",
    email: "",
    phone: "",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  };

  const mockResume = {
    title: "",
    address: "",
    summary: "",
    degree: "",
    languages: "",
    socicallink: [],
    education: [],
    experience: [],
    projects: [],
  };

  return { user: mockUser, resume: mockResume };
}

// ── Page component ────────────────────────────────────────────
export default async function TemplatePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  // Kiểm tra slug hợp lệ
  const TemplateComponent = TEMPLATE_MAP[slug as keyof typeof TEMPLATE_MAP];
  if (!TemplateComponent) notFound();

  const data = await getData(slug, resolvedSearchParams?.resumeId);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex flex-col">
      <main className="grow">
        <TemplateComponent user={data.user} resume={data.resume} />
      </main>
    </div>
  );
}
