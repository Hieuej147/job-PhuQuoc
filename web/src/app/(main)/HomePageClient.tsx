"use client";

import React, { useEffect, useMemo } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeCategories from "@/components/home/HomeCategories";
import HomeFeaturedJobs from "@/components/home/HomeFeaturedJobs";
import HomeWhyChoose from "@/components/home/HomeWhyChoose";
import HomeBlogs from "@/components/home/HomeBlogs";
import { formatSalary, jobTypeLabel } from "@/lib/utils/format";

const EXP_MAP: Record<string, string> = {
  NO_EXPERIENCE: "Không KN",
  UNDER_1_YEAR: "<1 năm",
  ONE_TO_THREE_YEARS: "1-3 năm",
  THREE_TO_FIVE_YEARS: "3-5 năm",
  OVER_FIVE_YEARS: ">5 năm",
};

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface JobItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  experience?: string | null;
  addressDetail?: string | null;
  company?: {
    name: string;
    logo?: string | null;
    slug: string;
  };
  ward?: {
    name: string;
  } | null;
  category?: {
    name: string;
    slug: string;
    icon?: string | null;
  } | null;
}

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  views?: number | null;
  createdAt: string;
  category?: {
    name: string;
    slug: string;
  } | null;
  author?: {
    name: string;
  } | null;
}

interface HomePageProps {
  categories: CategoryItem[];
  jobs: JobItem[];
  blogs: BlogItem[];
}

export default function HomePageClient({
  categories = [],
  jobs = [],
  blogs = [],
}: HomePageProps) {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://pqjobs.vn/#organization",
        name: "PQJobs Phú Quốc",
        url: "https://pqjobs.vn",
        logo: "https://pqjobs.vn/logo.png",
        description:
          "Nền tảng kết nối ứng viên và nhà tuyển dụng hàng đầu tại đảo ngọc Phú Quốc.",
      },
      {
        "@type": "WebSite",
        "@id": "https://pqjobs.vn/#website",
        url: "https://pqjobs.vn",
        name: "PQJobs",
        publisher: { "@id": "https://pqjobs.vn/#organization" },
      },
      {
        "@type": "CollectionPage",
        "@id": "https://pqjobs.vn/#webpage",
        url: "https://pqjobs.vn",
        name: "Trang tuyển dụng ứng viên Phú Quốc",
        isPartOf: { "@id": "https://pqjobs.vn/#website" },
        description:
          "Cổng tìm kiếm cơ hội việc làm resort, khách sạn hàng đầu tại Phú Quốc.",
      },
    ],
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 },
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const mappedJobs = useMemo(
    () =>
      jobs.map((j: JobItem) => {
        return {
          id: j.id,
          title: j.title,
          slug: j.slug,
          companyLogo: j.company?.logo || "",
          companyName: j.company?.name || "",
          companySlug: j.company?.slug || "",
          categorySlug: j.category?.slug || "",
          categoryName: j.category?.name || "",
          categoryIcon: j.category?.icon || "💼",
          location: j.ward?.name
            ? `${j.ward.name}, Phú Quốc`
            : j.addressDetail || "Phú Quốc",
          uiTagText: jobTypeLabel(j.type) || "Full-time",
          uiTagStyle:
            "bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2DD4BF]",
          uiLogoBg: "bg-[#0E7490]",
          labels: [
            jobTypeLabel(j.type),
            formatSalary(j.salaryMin, j.salaryMax),
            EXP_MAP[j.experience || ""] || "",
          ],
        };
      }),
    [jobs],
  );

  const mappedBlogs = useMemo(
    () =>
      blogs.map((b: BlogItem) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt || "",
        views: String(b.views || 0),
        date: b.createdAt,
        categoryName: b.category?.name || "Blog",
        categorySlug: b.category?.slug || "blog",
        authorName: b.author?.name || "PQJobs",
        uiIconName: "article",
        uiCatBg: "bg-[#0D9488]/10 text-[#0D9488]",
      })),
    [blogs],
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <HomeHero />

      <HomeCategories categories={categories} />

      <HomeFeaturedJobs jobs={mappedJobs} />

      <HomeWhyChoose />

      <HomeBlogs blogs={mappedBlogs} />
    </div>
  );
}
