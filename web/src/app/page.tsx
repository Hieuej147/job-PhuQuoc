import { Metadata } from "next";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/structured-data";
import HomePageClient from "./HomePageClient";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "PQJobs | Tuyển Dụng & Việc Làm Phú Quốc Lương Cao 2026",
  description:
    "Tìm việc làm tại đảo ngọc Phú Quốc. Tuyển dụng resort, khách sạn, nhà hàng, du lịch, IT. 1,200+ việc làm mới lương cao.",
  keywords: ["việc làm phú quốc", "tuyển dụng phú quốc", "PQJobs", "việc làm đảo ngọc", "resort phú quốc"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "PQJobs | Việc Làm Phú Quốc Lương Cao 2026",
    description: "Tìm việc làm tại đảo ngọc Phú Quốc. 1,200+ việc làm mới.",
    url: "/",
    siteName: "PQJobs",
    locale: "vi_VN",
    type: "website",
  },
};

async function fetchCategories() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/categories?limit=8`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || data.data || [];
  } catch { return []; }
}

async function fetchJobs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs?limit=6`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || data.data || [];
  } catch { return []; }
}

async function fetchBlogs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/blogs?limit=3`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || data.data || [];
  } catch { return []; }
}

export default async function HomePage() {
  const [categories, jobs, blogs] = await Promise.all([
    fetchCategories(),
    fetchJobs(),
    fetchBlogs(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd()) }}
      />
      <HomePageClient
        categories={categories}
        jobs={jobs}
        blogs={blogs}
      />
    </>
  );
}
