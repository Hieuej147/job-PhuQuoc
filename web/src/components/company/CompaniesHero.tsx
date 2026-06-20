"use client";

interface CompaniesHeroProps {
  initialTotal: number;
  totalJobs: number;
  searchText: string;
  setSearchText: (val: string) => void;
  activeTab: string;
  industryTabs: { value: string; label: string }[];
  updateURL: (updates: Record<string, string>) => void;
}

export default function CompaniesHero({
  initialTotal,
  totalJobs,
  searchText,
  setSearchText,
  activeTab,
  industryTabs,
  updateURL,
}: CompaniesHeroProps) {
  return (
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateURL({ search: searchText, page: "1" });
                }
              }}
            />
          </div>
          <div className="flex items-center px-5 min-w-[180px]">
            <span className="text-[#6f787d] dark:text-gray-400 mr-3">🏷️</span>
            <select
              value={activeTab}
              onChange={(e) => {
                updateURL({ industry: e.target.value, page: "1" });
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
          <button
            onClick={() => updateURL({ search: searchText, page: "1" })}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-8 py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-w-[130px]"
          >
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
          style={{ transform: "translateY(1px)" }}
        >
          <path
            d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
