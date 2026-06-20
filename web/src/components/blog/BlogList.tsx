"use client";

import BlogCard from "@/components/blog/BlogCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MappedBlog } from "@/components/blog/BlogPageClient";

interface BlogListProps {
  paginatedBlogs: MappedBlog[];
  totalPages: number;
  currentPage: number;
  updateURL: (updates: Record<string, string>) => void;
}

export default function BlogList({
  paginatedBlogs,
  totalPages,
  currentPage,
  updateURL,
}: BlogListProps) {
  return (
    <div className="flex-1 min-w-0 w-full">
      {paginatedBlogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedBlogs.map((blog, idx) => (
            <div key={blog.id} className={`fade-up stagger-${(idx % 3) + 1}`}>
              <BlogCard {...blog} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#0F3347] rounded-3xl border border-dashed border-slate-300 dark:border-[#1E5F74] text-slate-400 fade-up">
          Không tìm thấy bài viết nào phù hợp 😔
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 fade-up">
          <button
            onClick={() => updateURL({ page: String(Math.max(currentPage - 1, 1)) })}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {(() => {
            const getPageNumbers = () => {
              const pages: (number | string)[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                pages.push(1);
                if (currentPage > 3) {
                  pages.push("...");
                }
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
                if (currentPage < totalPages - 2) {
                  pages.push("...");
                }
                pages.push(totalPages);
              }
              return pages;
            };

            return getPageNumbers().map((pageNumber, idx) => {
              if (pageNumber === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-600 font-semibold"
                  >
                    ...
                  </span>
                );
              }
              const isActive = pageNumber === currentPage;
              return (
                <button
                  key={pageNumber}
                  onClick={() => updateURL({ page: String(pageNumber) })}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#0E7490] text-white dark:bg-[#67e8f9] dark:text-[#071a2b] shadow-md"
                      : "border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9]"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            });
          })()}

          <button
            onClick={() => updateURL({ page: String(Math.min(currentPage + 1, totalPages)) })}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            aria-label="Trang tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
