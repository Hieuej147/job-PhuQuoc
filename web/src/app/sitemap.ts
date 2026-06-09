import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pqjobs.vn";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

async function fetchJson(path: string) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/jobs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/companies`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const [jobsData, companiesData, blogsData] = await Promise.all([
    fetchJson("/api/v1/jobs?limit=500"),
    fetchJson("/api/v1/companies?limit=500"),
    fetchJson("/api/v1/blogs?limit=500"),
  ]);

  const jobRoutes: MetadataRoute.Sitemap = (jobsData?.data?.items || []).map(
    (job: { slug: string; updatedAt?: string; createdAt: string }) => ({
      url: `${BASE_URL}/jobs/${job.slug}`,
      lastModified: new Date(job.updatedAt || job.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  const companyRoutes: MetadataRoute.Sitemap = (
    companiesData?.data?.items || []
  ).map(
    (company: { slug: string; updatedAt?: string; createdAt: string }) => ({
      url: `${BASE_URL}/companies/${company.slug}`,
      lastModified: new Date(company.updatedAt || company.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  const blogRoutes: MetadataRoute.Sitemap = (blogsData?.data?.items || []).map(
    (blog: { slug: string; updatedAt?: string; createdAt: string }) => ({
      url: `${BASE_URL}/blog/${blog.slug}`,
      lastModified: new Date(blog.updatedAt || blog.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  return [...staticRoutes, ...jobRoutes, ...companyRoutes, ...blogRoutes];
}
