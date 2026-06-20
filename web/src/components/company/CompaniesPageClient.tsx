"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CompaniesHero from "@/components/company/CompaniesHero";
import CompaniesFilterBar from "@/components/company/CompaniesFilterBar";
import CompanyList from "@/components/company/CompanyList";
import { useAuth } from "@/components/auth/auth-provider";
import { Company } from "@/types/company";

const SIZE_LABELS: Record<string, string> = {
  SIZE_1_50: "1-50",
  SIZE_51_200: "51-200",
  SIZE_201_500: "201-500",
  SIZE_500_PLUS: "500+",
};

interface CompaniesPageClientProps {
  initialCompanies: any[];
  initialTotal: number;
  totalJobs: number;
  initialTotalPages?: number;
  industries?: string[];
  initialSearchParams?: { page: string; search: string; industry: string; sort: string; };
}

export default function CompaniesPageClient({
  initialCompanies,
  initialTotal,
  totalJobs,
  initialTotalPages = 1,
  industries = [],
  initialSearchParams = { page: "1", search: "", industry: "", sort: "featured" },
}: CompaniesPageClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(initialSearchParams.industry);
  const [searchText, setSearchText] = useState(initialSearchParams.search);
  const [currentPage, setCurrentPage] = useState(Number(initialSearchParams.page));
  const [sortBy, setSortBy] = useState(initialSearchParams.sort);
  const [savedCompanyIds, setSavedCompanyIds] = useState<Set<string>>(new Set());

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || (key === 'page' && value === "1") || (key === 'sort' && value === 'featured')) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setActiveTab(initialSearchParams.industry || "");
    setSortBy(initialSearchParams.sort || "featured");
    setSearchText(initialSearchParams.search || "");
    setCurrentPage(Number(initialSearchParams.page) || 1);
  }, [initialSearchParams]);

  // Fetch saved companies only when the user is logged in.
  useEffect(() => {
    if (!user) {
      setSavedCompanyIds(new Set());
      return;
    }

    const cacheKey = `savedCompanyIds:${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setSavedCompanyIds(new Set(JSON.parse(cached)));
    }

    fetch("/api/v1/saved/companies", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const items = d.data?.items ?? d.data ?? [];
        const ids = items
          .map((s: { companyId?: string; company?: { id: string } }) => s.companyId ?? s.company?.id ?? "")
          .filter(Boolean);
        sessionStorage.setItem(cacheKey, JSON.stringify(ids));
        setSavedCompanyIds(new Set(ids));
      })
      .catch(() => { });
  }, [user]);

  const industryTabs = useMemo(() => {
    return [
      { value: "", label: "Tất cả" },
      ...industries.map((ind) => ({ value: ind, label: ind })),
    ];
  }, [industries]);

  // IntersectionObserver for fade-up animations
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
  }, [currentPage, activeTab, sortBy, searchText]);

  const filtered = initialCompanies;
  const totalPages = initialTotalPages;
  const paginatedCompanies = initialCompanies;

  const mappedCompanies: Company[] = paginatedCompanies.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    logo: c.logo,
    industry: c.industry || "",
    size: SIZE_LABELS[c.size] || c.size || "",
    wardId: c.wardId,
    isApproved: c.isApproved,
    jobCount: c._count?.jobs || c.jobs?.length || 0,
    location: c.ward?.name
      ? `${c.ward.name}, Phú Quốc`
      : c.addressDetail || "Phú Quốc",
  }));

  return (
    <div className="bg-background text-foreground min-h-screen">
      <CompaniesHero
        initialTotal={initialTotal}
        totalJobs={totalJobs}
        searchText={searchText}
        setSearchText={setSearchText}
        activeTab={activeTab}
        industryTabs={industryTabs}
        updateURL={updateURL}
      />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <CompaniesFilterBar
          industryTabs={industryTabs}
          activeTab={activeTab}
          sortBy={sortBy}
          initialTotal={initialTotal}
          updateURL={updateURL}
        />
        <CompanyList
          mappedCompanies={mappedCompanies}
          totalPages={totalPages}
          currentPage={currentPage}
          savedCompanyIds={savedCompanyIds}
          updateURL={updateURL}
        />
      </main>
    </div>
  );
}