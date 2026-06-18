import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "Về PQJobs | Nền Tảng Tuyển Dụng Phú Quốc",
  description:
    "PQJobs là nền tảng kết nối ứng viên và nhà tuyển dụng hàng đầu tại đảo ngọc Phú Quốc.",
  alternates: { canonical: "/about" },
};

async function getStats() {
  try {
    const [companiesRes, jobsRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/companies?limit=1`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/jobs?limit=1`, { cache: "no-store" }),
    ]);

    let companiesTotal = 0;
    let jobsTotal = 0;

    if (companiesRes.status === "fulfilled" && companiesRes.value.ok) {
      const d = await companiesRes.value.json();
      companiesTotal = d.data?.total ?? d.total ?? 0;
    }
    if (jobsRes.status === "fulfilled" && jobsRes.value.ok) {
      const d = await jobsRes.value.json();
      jobsTotal = d.data?.total ?? d.total ?? 0;
    }

    return { companiesTotal, jobsTotal };
  } catch {
    return { companiesTotal: 0, jobsTotal: 0 };
  }
}

export default async function AboutPage() {
  const { companiesTotal, jobsTotal } = await getStats();
  return <AboutPageClient companiesTotal={companiesTotal} jobsTotal={jobsTotal} />;
}