import type { Metadata } from "next"
import Header from "@/components/candidate/Header"
import Footer from "@/components/candidate/Footer"

export const metadata: Metadata = {
  title: "Công ty tuyển dụng tại Phú Quốc | PQ Jobs",
  description: "Khám phá hơn 300+ công ty đang tuyển dụng tại đảo ngọc Phú Quốc.",
  keywords: ["công ty Phú Quốc", "tuyển dụng Phú Quốc", "việc làm Phú Quốc", "resort Phú Quốc"],
  openGraph: {
    title: "Công ty tuyển dụng tại Phú Quốc | PQ Jobs",
    description: "Hơn 300+ công ty đang tuyển dụng trên đảo ngọc Phú Quốc",
    url: "https://pqjobs.vn/companies",
    siteName: "PQ Jobs",
    locale: "vi_VN",
    type: "website",
  },
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <div className="animate-fadeIn">
        {children}
      </div>
      <Footer />
    </>
  )
}