"use client";

/**
 * @file page.tsx (JobsPage)
 * @description Trang danh sách việc làm chính của hệ thống PQJobs.
 * 
 * Luồng hoạt động chính:
 * 1. Sử dụng custom hook `useJobs()` để lấy toàn bộ dữ liệu (jobs, filters, totalPages, totalJobs, v.v.) và các hàm trigger điều khiển.
 * 2. Đưa số liệu vào Banner Tìm kiếm (`JobsHero`).
 * 3. Tổ chức layout 2 cột:
 *    - Cột trái (Desktop): Sidebar bộ lọc nâng cao (`JobFilterSidebar`).
 *    - Cột phải (Desktop & Mobile): Thanh sắp xếp kết quả (`JobSortBar`) và Danh sách hiển thị (`JobList`).
 * 4. Tích hợp Drawer trượt trên Mobile (`JobFilterMobileDrawer`) khi click nút mở bộ lọc ở thanh sắp xếp.
 */

import { useState } from "react";
// Import custom hook xử lý toàn bộ logic nghiệp vụ của trang
import { useJobs } from "@/hooks/useJobs";
import JobsHero from "@/components/jobs/JobsHero";
import {
  JobFilterSidebar,
  JobFilterMobileDrawer,
} from "@/components/jobs/JobFilter";
import JobSortBar from "@/components/jobs/JobSortBar";
import JobList from "@/components/jobs/JobList";

export default function JobsPage() {
  // Trích xuất toàn bộ dữ liệu và các hàm điều khiển từ custom hook useJobs
  const {
    jobs, // Danh sách việc làm hiển thị trên trang hiện tại
    totalJobs, // Tổng số việc làm tìm thấy khớp với bộ lọc
    totalPages, // Tổng số trang sau phân trang
    page, // Số trang hiện tại đang xem
    setPage, // Hàm chuyển sang trang khác
    filters, // Trạng thái các bộ lọc hiện tại
    updateFilters, // Hàm cập nhật bộ lọc mới
    clearFilters, // Hàm xóa sạch tất cả bộ lọc
    sortBy, // Tiêu chí sắp xếp hiện tại
    updateSort, // Hàm đổi tiêu chí sắp xếp
    bookmarkedIds, // Set các ID việc làm người dùng đã lưu
    toggleBookmark, // Hàm lưu/hủy lưu việc làm
    activeFilters, // Mảng các badge bộ lọc đang được kích hoạt
    removeFilter, // Hàm gỡ bỏ một badge bộ lọc cụ thể
  } = useJobs();

  // State kiểm soát việc hiển thị bộ lọc dạng Drawer trượt trên thiết bị di động
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  /**
   * Hàm callback xử lý khi người dùng thực hiện hành động tìm kiếm trên Banner Hero.
   * Cập nhật các từ khóa, khu vực và ngành nghề vào bộ lọc chung.
   *
   * @param keyword Từ khóa tìm kiếm (tên công việc, công ty)
   * @param location Khu vực tuyển dụng tại Phú Quốc
   * @param industry Ngành nghề lựa chọn
   */
  const handleSearch = (
    keyword: string,
    location: string,
    industry: string,
  ) => {
    updateFilters({
      keyword,
      location,
      // Nếu có chọn ngành cụ thể thì cập nhật, ngược lại giữ nguyên mảng ngành nghề trong bộ lọc
      industries: industry ? [industry] : filters.industries,
    });
  };

  return (
    // Background sáng nhạt (#f7f9ff) tạo cảm giác dễ chịu, tự động chuyển nền tối ở chế độ dark mode
    <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] text-slate-800 dark:text-[#cbd5e1] transition-colors duration-200">
      
      {/* 1. Phần Banner Tìm Kiếm Đầu Trang */}
      <JobsHero totalJobs={totalJobs} onSearch={handleSearch} />

      {/* 2. Nội dung chính của trang (Layout chia cột) */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-6 items-start">
          
          {/* Cột trái: Bộ lọc chi tiết trên màn hình lớn (Desktop) */}
          {/* Ẩn trên mobile và tablet (hidden), chỉ hiển thị từ màn hình lg trở lên (lg:block) */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-20">
            <JobFilterSidebar
              filters={filters}
              onFilterChange={updateFilters}
              onClearAll={clearFilters}
            />
          </aside>

          {/* Cột phải: Thanh sắp xếp và Danh sách công việc */}
          {/* flex-1 chiếm trọn phần không gian còn lại */}
          <div className="flex-1 min-w-0">
            
            {/* Thanh công cụ sắp xếp & hiển thị các badge bộ lọc đang hoạt động */}
            <JobSortBar
              totalResults={totalJobs}
              activeFilters={activeFilters}
              sortBy={sortBy}
              onSortChange={updateSort}
              onRemoveFilter={removeFilter}
              // Khi bấm nút "Bộ lọc" trên mobile/tablet, mở Drawer lên
              onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            />

            {/* Danh sách các thẻ công việc và phân trang */}
            <JobList
              jobs={jobs}
              totalPages={totalPages}
              currentPage={page}
              onPageChange={setPage}
              bookmarkedIds={bookmarkedIds}
              onBookmark={toggleBookmark}
            />
          </div>
        </div>
      </main>

      {/* 3. Drawer Bộ lọc hiển thị trượt từ dưới lên trên Mobile */}
      <JobFilterMobileDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={updateFilters}
        onClearAll={clearFilters}
      />
    </div>
  );
}
