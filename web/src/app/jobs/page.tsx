import { Metadata } from "next";
import { Suspense } from "react";
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

async function fetchJobs(query: { search?: string; wardId?: string; categoryId?: string } = {}) {
  try {
    const params = new URLSearchParams();
    params.set("limit", "12");
    params.set("page", "1");
    if (query.search) params.set("search", query.search);
    if (query.wardId) params.set("wardId", query.wardId);
    if (query.categoryId) params.set("categoryId", query.categoryId);

    const res = await fetch(`${BACKEND_URL}/api/v1/jobs?${params.toString()}`, {
      cache: "no-store",
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

async function fetchStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs/stats`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; wardId?: string; category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [categories, stats] = await Promise.all([fetchCategories(), fetchStats()]);

  let categoryId = "";
  if (resolvedSearchParams.category) {
    const cat = categories.find((c: any) => c.slug === resolvedSearchParams.category);
    if (cat) categoryId = cat.id;
  }
  // should use slug and not use cateid for search params
  const jobsData = await fetchJobs({
    search: resolvedSearchParams.search,
    wardId: resolvedSearchParams.wardId,
    categoryId,
  });

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
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E7490]" />
        </div>
      }>
        <JobsPageClient
          initialJobs={jobsData.items || []}
          initialTotal={jobsData.total || 0}
          initialTotalPages={jobsData.totalPages || 0}
          categories={categories}
          stats={stats}
        />
      </Suspense>
    </>
  );
}
