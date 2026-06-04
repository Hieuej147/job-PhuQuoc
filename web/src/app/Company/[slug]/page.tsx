import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { mockCompanyList } from "@/mocks/mockCompanyData"
import CompanyDetailClient from "./CompanyDetailClient"

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const company = mockCompanyList.find((c) => c.slug === slug)
  if (!company) return { title: "Không tìm thấy | PQ Jobs" }

  return {
    title: `${company.name} - Tuyển dụng tại Phú Quốc | PQ Jobs`,
    description: `${company.description} Xem ${company.jobCount} vị trí đang tuyển tại ${company.location}.`,
    keywords: [company.name, company.industry, "tuyển dụng Phú Quốc", "việc làm Phú Quốc"],
    openGraph: {
      title: `${company.name} | PQ Jobs`,
      description: company.description,
      url: `https://pqjobs.vn/Company/${company.slug}`,
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
  const company = mockCompanyList.find((c) => c.slug === slug)
  if (!company) notFound()
  return <CompanyDetailClient company={company!} />
}