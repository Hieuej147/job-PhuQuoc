"use client";

import Link from "next/link";
import CompanyCard from "@/components/company/CompanyCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Company } from "@/types/company";

interface CompanyListProps {
  mappedCompanies: Company[];
  totalPages: number;
  currentPage: number;
  savedCompanyIds: Set<string>;
  updateURL: (updates: Record<string, string>) => void;
}

export default function CompanyList({
  mappedCompanies,
  totalPages,
  currentPage,
  savedCompanyIds,
  updateURL,
}: CompanyListProps) {
  return (
    <>
      {/* Company grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {mappedCompanies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            isFollowed={savedCompanyIds.has(company.id)}
          />
        ))}
        {mappedCompanies.length === 0 && (
          <div className="col-span-4 text-center py-16 text-[#3f484c] dark:text-gray-400">
            Không tìm thấy công ty nào phù hợp.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => updateURL({ page: String(Math.max(1, currentPage - 1)) })}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
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
                  className={`w-9 h-9 rounded-xl text-sm font-semibold cursor-pointer ${
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
            onClick={() => updateURL({ page: String(Math.min(totalPages, currentPage + 1)) })}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            aria-label="Trang tiếp"
          >
            <ChevronRight className="w-4 h-4" />
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
            Đăng ký miễn phí, tiếp cận hơn 5,000 ứng viên chất lượng tại Phú Quốc.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold rounded-full shadow-lg whitespace-nowrap text-center"
          >
            Đăng ký công ty
          </Link>
        </div>
      </div>
    </>
  );
}
