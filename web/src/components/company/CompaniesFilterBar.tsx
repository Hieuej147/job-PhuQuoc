"use client";

interface CompaniesFilterBarProps {
  industryTabs: { value: string; label: string }[];
  activeTab: string;
  sortBy: string;
  initialTotal: number;
  updateURL: (updates: Record<string, string>) => void;
}

export default function CompaniesFilterBar({
  industryTabs,
  activeTab,
  sortBy,
  initialTotal,
  updateURL,
}: CompaniesFilterBarProps) {
  return (
    <>
      {/* Industry tabs */}
      <div className="fade-up stagger-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {industryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateURL({ industry: tab.value, page: "1" })}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.value
                  ? "border-[#005a71] bg-[#005a71] text-white"
                  : "border-[#E0F5FB] dark:border-[#1e3a4f] bg-white dark:bg-[#0f2436] text-[#3f484c] dark:text-gray-300 hover:border-[#005a71] hover:text-[#005a71]"
              }`}
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
          <strong className="text-[#005a71] dark:text-cyan-400">
            {initialTotal}
          </strong>{" "}
          công ty
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#3f484c] dark:text-gray-300">
            Sắp xếp:
          </span>
          <select
            value={sortBy}
            onChange={(e) => updateURL({ sort: e.target.value, page: "1" })}
            className="border border-[#E0F5FB] dark:border-[#1e3a4f] dark:bg-[#0a1929] rounded-lg px-3 py-1.5 text-sm text-[#005a71] dark:text-cyan-400 font-semibold outline-none cursor-pointer"
          >
            <option value="featured">Nổi bật nhất</option>
            <option value="jobs">Nhiều việc làm nhất</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>
    </>
  );
}
