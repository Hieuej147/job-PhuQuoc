import { Metadata } from "next";
import JobsPageClient from "./JobsPageClient";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Việc Làm Phú Quốc 2026 | Resort, Khách Sạn, Nhà Hàng | PQJobs",
  description:
    "Tìm việc làm tại Phú Quốc mới nhất. Tuyển dụng resort, khách sạn, nhà hàng, IT, du lịch. Ứng tuyển ngay!",
  keywords: ["việc làm phú quốc", "tuyển dụng phú quốc", "jobs phú quốc", "việc làm đảo ngọc"],
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: "Việc Làm Phú Quốc 2026 | PQJobs",
    description: "Tìm việc làm tại Phú Quốc mới nhất. Tuyển dụng resort, khách sạn, nhà hàng.",
    url: "/jobs",
    siteName: "PQJobs",
    locale: "vi_VN",
    type: "website",
  },
};

async function fetchJobs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs?limit=12&page=1`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { items: [], total: 0, totalPages: 0 };
    const data = await res.json();
    return data.data || { items: [], total: 0, totalPages: 0 };
  } catch {
    return { items: [], total: 0, totalPages: 0 };
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || data.data || [];
  } catch {
    return [];
  }
}

export default async function JobsPage() {
  const [jobsData, categories] = await Promise.all([fetchJobs(), fetchCategories()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Việc làm Phú Quốc",
    description: "Danh sách việc làm tại Phú Quốc",
    numberOfItems: jobsData.total,
    itemListElement: (jobsData.items || []).slice(0, 10).map((job: { title: string; slug: string }, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `/jobs/${job.slug}`,
      name: job.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobsPageClient
        initialJobs={jobsData.items || []}
        initialTotal={jobsData.total || 0}
        initialTotalPages={jobsData.totalPages || 0}
        categories={categories}
      />
    </>
  );
}
