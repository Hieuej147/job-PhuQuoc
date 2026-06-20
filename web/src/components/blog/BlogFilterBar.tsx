"use client";

import { BlogCategory } from "@/types/blog";

interface BlogFilterBarProps {
  categoryList: (BlogCategory & { count: number })[];
  activeTab: string;
  sortBy: string;
  filteredCount: number;
  updateURL: (updates: Record<string, string>) => void;
  getCategoryEmoji: (name: string) => string;
}

export default function BlogFilterBar({
  categoryList,
  activeTab,
  sortBy,
  filteredCount,
  updateURL,
  getCategoryEmoji,
}: BlogFilterBarProps) {
  return (
    <>
      {/* Category tabs */}
      <div className="overflow-x-auto pb-2 mb-6 fade-up stagger-1">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => updateURL({ category: "all", page: "1" })}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
              activeTab === "all"
                ? "bg-[#005a71] dark:bg-[#0E7490] text-white border-[#005a71] dark:border-[#0E7490]"
                : "bg-white dark:bg-[#0F3347] border-[#E0F5FB] dark:border-[#1E5F74] text-slate-600 dark:text-[#94A3B8] hover:border-[#005a71] dark:hover:text-[#67E8F9] dark:hover:border-[#67E8F9]"
            }`}
          >
            🗂️ Tất cả
          </button>
          {categoryList.map((cat) => {
            const emoji = getCategoryEmoji(cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => updateURL({ category: cat.slug, page: "1" })}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  activeTab === cat.slug
                    ? "bg-[#005a71] dark:bg-[#0E7490] text-white border-[#005a71] dark:border-[#0E7490]"
                    : "bg-white dark:bg-[#0F3347] border-[#E0F5FB] dark:border-[#1E5F74] text-slate-600 dark:text-[#94A3B8] hover:border-[#005a71] dark:hover:text-[#67E8F9] dark:hover:border-[#67E8F9]"
                }`}
              >
                {emoji} {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort bar */}
      <div className="sort-bar bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] px-5 py-3 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 fade-up stagger-2">
        <span className="text-sm text-slate-600 dark:text-[#94A3B8]">
          Hiển thị{" "}
          <strong className="text-[#005a71] dark:text-[#67E8F9]">
            {filteredCount}
          </strong>{" "}
          bài viết
        </span>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 dark:text-[#94A3B8]">
            Sắp xếp:
          </label>
          <select
            value={sortBy}
            onChange={(e) => updateURL({ sort: e.target.value, page: "1" })}
            className="sort-select border border-slate-200 dark:border-[#1E5F74] rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-[#E0F2FE] bg-transparent dark:bg-[#0C2231] focus:ring-1 focus:ring-[#005a71] outline-none"
          >
            <option value="newest" className="dark:bg-[#0F3347]">
              Mới nhất
            </option>
            <option value="views" className="dark:bg-[#0F3347]">
              Xem nhiều nhất
            </option>
            <option value="oldest" className="dark:bg-[#0F3347]">
              Cũ nhất
            </option>
          </select>
        </div>
      </div>
    </>
  );
}
