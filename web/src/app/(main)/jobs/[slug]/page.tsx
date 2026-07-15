import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
import { jobPostingJsonLd, breadcrumbJsonLd } from "@/features/seo/structured-data";
import JobDetailClient from "./JobDetailClient";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3006";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchJob(slug: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs/slug/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data;
  } catch {
    return null;
  }
}

async function fetchRelatedJobs(categorySlug: string, currentId: string) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/jobs?category=${categorySlug}&limit=4`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.items || []).filter((j: { id: string }) => j.id !== currentId).slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await fetchJob(slug);

  if (!job) {
    return { title: "Không tìm thấy việc làm | PQJobs" };
  }

  const salary = job.salaryMin && job.salaryMax
    ? `${(job.salaryMin / 1000000).toFixed(0)}-${(job.salaryMax / 1000000).toFixed(0)} triệu`
    : "Thỏa thuận";

  const title = `${job.title} tại ${job.company?.name || "Phú Quốc"} | ${salary}`;
  const description = `Tuyển dụng ${job.title} tại ${job.company?.name || "Phú Quốc"}. ${salary}. ${job.type === "FULL_TIME" ? "Toàn thời gian" : job.type}. Ứng tuyển ngay!`;

  return {
    title,
    description,
    keywords: [job.title, job.company?.name || "", "việc làm Phú Quốc", job.category?.name || ""].filter(Boolean),
    alternates: { canonical: `/jobs/${slug}` },
    openGraph: {
      title,
      description,
      url: `/jobs/${slug}`,
      siteName: "PQJobs",
      locale: "vi_VN",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await fetchJob(slug);

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] flex items-center justify-center">
        <div className="text-center p-6">
          <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-650 mx-auto mb-4 stroke-[1.5]" />
          <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">Không tìm thấy việc làm</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm">
            Việc làm này có thể đã hết hạn hoặc không tồn tại trên hệ thống.
          </p>
          <a
            href="/jobs"
            className="inline-block bg-[#0E7490] hover:bg-[#005a71] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-md"
          >
            Quay lại danh sách
          </a>
        </div>
      </div>
    );
  }

  const relatedJobs = job.category?.slug
    ? await fetchRelatedJobs(job.category.slug, job.id)
    : [];

  const jsonLd = jobPostingJsonLd({
    id: job.id,
    title: job.title,
    description: job.description || "",
    slug: job.slug,
    company: { name: job.company?.name || "Unknown", logo: job.company?.logo },
    ward: job.ward,
    addressDetail: job.addressDetail,
    type: job.type,
    experience: job.experience,
    level: job.level,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    createdAt: job.createdAt,
    deadline: job.deadline,
    quantity: job.quantity,
  });

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Việc làm", url: "/jobs" },
    { name: job.title, url: `/jobs/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <JobDetailClient job={job} relatedJobs={relatedJobs} />
    </>
  );
}
