import type { Metadata } from "next"
import { notFound } from "next/navigation"
import CompanyDetailClient from "./CompanyDetailClient"
import { organizationJsonLd, breadcrumbJsonLd } from "@/lib/structured-data"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000"

async function fetchCompany(slug: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/companies/slug/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.data || data
  } catch { return null }
}

async function fetchCompanyJobs(companyId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs?companyId=${companyId}&limit=20`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data?.items || []
  } catch { return [] }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const company = await fetchCompany(slug)
  if (!company) return { title: "Không tìm thấy | PQ Jobs" }

  return {
    title: `${company.name} - Tuyển dụng tại Phú Quốc | PQ Jobs`,
    description: `${company.description || ""} Xem việc làm tại ${company.name}.`,
    keywords: [company.name, company.industry || "", "tuyển dụng Phú Quốc", "việc làm Phú Quốc"],
    alternates: { canonical: `/companies/${slug}` },
    openGraph: {
      title: `${company.name} | PQ Jobs`,
      description: company.description || "",
      url: `/companies/${slug}`,
      siteName: "PQ Jobs",
      locale: "vi_VN",
      type: "website",
    },
  }
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const company = await fetchCompany(slug)
  if (!company) notFound()

  const jobs = await fetchCompanyJobs(company.id)

  const orgJson = organizationJsonLd()
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Công ty", url: "/companies" },
    { name: company.name, url: `/companies/${slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <CompanyDetailClient company={company} jobs={jobs} />
    </>
  )
}
