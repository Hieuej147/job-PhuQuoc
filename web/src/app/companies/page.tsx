import { Metadata } from "next";
import CompaniesPageClient from "./CompaniesPageClient";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

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

async function fetchCompanies() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/companies?limit=100`, { next: { revalidate: 60 } });
    if (!res.ok) return { items: [], total: 0 };
    const data = await res.json();
    return data.data || { items: [], total: 0 };
  } catch { return { items: [], total: 0 }; }
}

async function fetchJobsCount() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs?limit=1`, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.log("fetchJobsCount: res not ok", res.status);
      return 0;
    }
    const data = await res.json();
    console.log("fetchJobsCount data:", JSON.stringify(data));
    return data.data?.total || 0;
  } catch (e) {
    console.log("fetchJobsCount error:", e);
    return 0;
  }
}

export default async function CompaniesPage() {
  const companiesData = await fetchCompanies();
  const totalJobs = await fetchJobsCount();

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
        totalJobs={totalJobs}
      />
    </>
  );
}
