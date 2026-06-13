"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import CompanyCard from "@/components/company/CompanyCard";

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
}

export default function CompaniesPageClient({
  initialCompanies,
  initialTotal,
  totalJobs,
}: CompaniesPageClientProps) {
  const [activeTab, setActiveTab] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("featured");

  const industryTabs = useMemo(() => {
    const unique = [
      ...new Set(
        initialCompanies.map((c) => c.industry).filter(Boolean) as string[]
      ),
    ];
    return [
      { value: "", label: "Tất cả" },
      ...unique.map((industry) => ({ value: industry, label: industry })),
    ];
  }, [initialCompanies]);

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

  const filtered = useMemo(() => {
    const result = initialCompanies.filter((c) => {
      const matchTab = activeTab === "" || c.industry === activeTab;
      const matchSearch =
        searchText === "" ||
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (c.industry || "").toLowerCase().includes(searchText.toLowerCase());
      return matchTab && matchSearch;
    });

    const sorted = [...result];
    if (sortBy === "jobs") {
      sorted.sort(
        (a, b) =>
          (b._count?.jobs || b.jobs?.length || 0) -
          (a._count?.jobs || a.jobs?.length || 0)
      );
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    // "featured" giữ thứ tự gốc

    return sorted;
  }, [initialCompanies, activeTab, searchText, sortBy]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedCompanies = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const mappedCompanies = paginatedCompanies.map((c: any) => ({
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
    <div className="bg-[#f7f9ff] dark:bg-[#0a1929] min-h-screen">
      {/* HERO */}
      <section className="pt-16 bg-linear-to-br from-[#0E7490] via-[#0D9488] to-[#005a71]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="fade-up stagger-1 text-center mb-8">
            <h1 className="text-white font-bold text-3xl md:text-4xl mb-3">
              Khám phá nhà tuyển dụng tại Phú Quốc
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              Hơn{" "}
              <span className="font-bold text-[#FCD34D]">{initialTotal}+</span>{" "}
              công ty đang tuyển dụng trên đảo ngọc
            </p>
          </div>
          <div className="fade-up stagger-2 bg-white dark:bg-[#0f2436] rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch overflow-hidden max-w-3xl mx-auto">
            <div className="flex-1 flex items-center px-5 border-b md:border-b-0 md:border-r border-[#bec8cd]/20">
              <span className="text-[#6f787d] dark:text-gray-400 mr-3">🔍</span>
              <input
                className="w-full border-none outline-none text-[#001e30] dark:text-white bg-transparent py-4 text-sm"
                placeholder="Tên công ty, ngành nghề..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex items-center px-5 min-w-[180px]">
              <span className="text-[#6f787d] dark:text-gray-400 mr-3">🏷️</span>
              <select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border-none outline-none text-[#001e30] dark:text-white bg-transparent py-4 text-sm cursor-pointer"
              >
                {industryTabs.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-8 py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-w-[130px]">
              🔍 Tìm kiếm
            </button>
          </div>
          {/* Stats bar */}
          <div className="fade-up stagger-3 flex flex-wrap justify-center gap-3 mt-6">
            <span className="bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-full">
              🏢 {initialTotal}+ Công ty
            </span>
            <span className="bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-full">
              💼 {totalJobs}+ Việc làm
            </span>
          </div>
        </div>
        <div className="relative h-10 -mb-1">
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-full block"
            style={{ transform: 'translateY(1px)' }}
          >
            <path
              d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z"
              className="fill-[#f7f9ff] dark:fill-[#0a1929]"
            />
          </svg>
        </div>
      </section>

      {/* MAIN */}
      <main className="bg-[#f7f9ff] dark:bg-[#0a1929] max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Industry tabs */}
        <div className="fade-up stagger-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {industryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.value ? "border-[#005a71] bg-[#005a71] text-white" : "border-[#E0F5FB] dark:border-[#1e3a4f] bg-white dark:bg-[#0f2436] text-[#3f484c] dark:text-gray-300 hover:border-[#005a71] hover:text-[#005a71]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort bar */}
        <div className="fade-up stagger-5 bg-white dark:bg-[#0f2436] rounded-2xl border border-[#E0F5FB] dark:border-[#1e3a4f] px-5 py-3 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-sm text-[#3f484c] dark:text-gray-300">
            Tìm thấy{" "}
            <strong className="text-[#005a71] dark:text-cyan-400">{filtered.length}</strong> công
            ty
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#3f484c] dark:text-gray-300">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-[#E0F5FB] dark:border-[#1e3a4f] dark:bg-[#0a1929] rounded-lg px-3 py-1.5 text-sm text-[#005a71] dark:text-cyan-400 font-semibold outline-none cursor-pointer"
            >
              <option value="featured">Nổi bật nhất</option>
              <option value="jobs">Nhiều việc làm nhất</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {mappedCompanies.map((company, index) => (
            <CompanyCard key={company.id} company={company} index={index} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-16 text-[#3f484c] dark:text-gray-400">
              Không tìm thấy công ty nào phù hợp.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-lg border border-[#E0F5FB] dark:border-[#1e3a4f] bg-white dark:bg-[#0f2436] flex items-center justify-center text-[#3f484c] dark:text-gray-300 hover:border-[#005a71] hover:text-[#005a71] transition-all disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from(
              { length: Math.min(totalPages, 5) },
              (_, i) => i + 1,
            ).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${currentPage === page ? "bg-[#005a71] border-[#005a71] text-white" : "bg-white dark:bg-[#0f2436] border-[#E0F5FB] dark:border-[#1e3a4f] text-[#3f484c] dark:text-gray-300 hover:border-[#005a71] hover:text-[#005a71]"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-lg border border-[#E0F5FB] dark:border-[#1e3a4f] bg-white dark:bg-[#0f2436] flex items-center justify-center text-[#3f484c] dark:text-gray-300 hover:border-[#005a71] hover:text-[#005a71] transition-all disabled:opacity-40"
            >
              ›
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-[#0E7490] to-[#0D9488] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Doanh nghiệp của bạn chưa có mặt?
            </h2>
            <p className="text-white/80 max-w-lg">
              Đăng ký miễn phí, tiếp cận hơn 5,000 ứng viên chất lượng tại Phú
              Quốc.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold rounded-full transition-colors shadow-lg whitespace-nowrap text-center"
            >
              Đăng ký công ty
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}