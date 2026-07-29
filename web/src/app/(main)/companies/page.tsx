import { Metadata } from "next";
import { Suspense } from "react";
import CompaniesPageClient from "@/components/company/CompaniesPageClient";
import Loading from "./loading";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3006";

export const metadata: Metadata = {
  title: "Công Ty Tuyển Dụng Phú Quốc | Nhà Tuyển Dụng Hàng Đầu | PQJobs",
  description: "Danh sách công ty tuyển dụng tại Phú Quốc. Resort, khách sạn, nhà hàng, du lịch, IT. 300+ doanh nghiệp đang tuyển dụng.",
  alternates: { canonical: "/companies" },
  openGraph: {
    title: "Công Ty Tuyển Dụng Phú Quốc | PQJobs",
    description: "Danh sách công ty tuyển dụng tại Phú Quốc. 300+ doanh nghiệp.",
    url: "/companies",
    siteName: "PQJobs",
    locale: "vi_VN",
    type: "website",
  },
};

async function fetchCompanies(query: { search?: string; industry?: string; sort?: string; page?: string } = {}) {
  try {
    const params = new URLSearchParams();
    params.set("limit", "12"); // server-side pagination with limit 12
    params.set("page", query.page || "1");

    if (query.search) params.set("search", query.search);
    if (query.industry) params.set("industry", query.industry);
    if (query.sort) params.set("orderBy", query.sort);

    const res = await fetch(`${BACKEND_URL}/api/v1/companies?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return { items: [], totalPages: 0, total: 0 };
    const data = await res.json();
    return data.data || { items: [], totalPages: 0, total: 0 };
  } catch { return { items: [], totalPages: 0, total: 0 }; }
}

async function fetchJobsCount() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs?limit=1`, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.log("fetchJobsCount: res not ok", res.status);
      return 0;
    }
    const data = await res.json();
    return data.data?.total || 0;
  } catch (e) {
    return 0;
  }
}

async function fetchIndustries() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/companies?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.data?.items || data.data || [];
    const uniqueIndustries = [...new Set(items.map((c: any) => c.industry).filter(Boolean))] as string[];
    return uniqueIndustries;
  } catch {
    return [];
  }
}

async function CompaniesListStream({
  searchParams,
  totalJobs,
  industries
}: {
  searchParams: Promise<{ search?: string; industry?: string; sort?: string; page?: string }>;
  totalJobs: number;
  industries: string[];
}) {
  const resolvedSearchParams = await searchParams;
  const companiesData = await fetchCompanies({
    search: resolvedSearchParams.search,
    industry: resolvedSearchParams.industry,
    sort: resolvedSearchParams.sort,
    page: resolvedSearchParams.page,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Công ty tuyển dụng Phú Quốc",
    numberOfItems: companiesData.total || 0,
    itemListElement: (companiesData.items || []).slice(0, 10).map((c: { name: string; slug: string }, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `/companies/${c.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CompaniesPageClient
        initialCompanies={companiesData.items || []}
        initialTotal={companiesData.total || 0}
        initialTotalPages={companiesData.totalPages || 0}
        totalJobs={totalJobs}
        industries={industries}
        initialSearchParams={{
          page: resolvedSearchParams.page || "1",
          search: resolvedSearchParams.search || "",
          industry: resolvedSearchParams.industry || "",
          sort: resolvedSearchParams.sort || "featured"
        }}
      />
    </>
  );
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; industry?: string; sort?: string; page?: string }>;
}) {
  const [totalJobs, industries] = await Promise.all([
    fetchJobsCount(),
    fetchIndustries()
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <CompaniesListStream searchParams={searchParams} totalJobs={totalJobs} industries={industries} />
    </Suspense>
  );
}
