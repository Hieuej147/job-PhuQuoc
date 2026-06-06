'use client';

/**
 * @file JobList.tsx
 * @description Component quản lý hiển thị danh sách các thẻ công việc (JobCard).
 * 
 * Các phân hệ chức năng chính:
 * 1. Trạng thái Đang tải (Skeleton Loading): Hiển thị khung giả lập xương cá (SkeletonCard) khi dữ liệu đang được fetch.
 * 2. Trạng thái Trống (Empty State): Hiển thị hình vẽ và thông báo bằng tiếng Việt khi không có công việc nào khớp bộ lọc.
 * 3. Danh sách JobCard: Duyệt mảng `jobs` và render các thẻ công việc thành phần.
 * 4. Thanh phân trang (Pagination): Các nút bấm Tiến/Lùi và số trang để phân chia kết quả tìm kiếm.
 */

import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { JobType } from '@/types/job';
import JobCard from './JobCard';

// Định nghĩa kiểu dữ liệu cho props đầu vào của component JobList
interface JobListProps {
  jobs: JobType[]; // Mảng các công việc hiển thị trên trang hiện thời
  totalPages: number; // Tổng số trang sau khi phân trang
  currentPage: number; // Vị trí trang hiện tại người dùng đang xem
  onPageChange: (page: number) => void; // Hàm callback chuyển trang
  isLoading?: boolean; // Cờ báo hiệu trạng thái đang tải dữ liệu
  bookmarkedIds: Set<string>; // Tập hợp ID của các bài tuyển dụng đã lưu
  onBookmark: (id: string) => void; // Callback kích hoạt lưu tin
}

/**
 * Component SkeletonCard render một khung hình chữ nhật mờ, giật nhấp nháy 
 * để giả lập cấu trúc của thẻ JobCard trong lúc chờ tải dữ liệu.
 */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl p-5 border border-[#E0F5FB] dark:border-[#1a3d5c] animate-pulse transition-colors duration-200">
      <div className="flex gap-4">
        {/* Khung logo giả */}
        <div className="w-14 h-14 bg-gray-100 dark:bg-[#071a2b] rounded-xl flex-shrink-0" />
        {/* Khung dòng tiêu đề và mô tả giả */}
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-100 dark:bg-[#071a2b] rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-[#071a2b] rounded w-1/2" />
          {/* Nhãn tag giả */}
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-100 dark:bg-[#071a2b] rounded-md" />
            <div className="h-5 w-20 bg-gray-100 dark:bg-[#071a2b] rounded-md" />
            <div className="h-5 w-14 bg-gray-100 dark:bg-[#071a2b] rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobList({
  jobs,
  totalPages,
  currentPage,
  onPageChange,
  isLoading = false,
  bookmarkedIds,
  onBookmark,
}: JobListProps) {
  
  // 1. Trường hợp đang tải dữ liệu: Render 4 SkeletonCard chạy hiệu ứng nhấp nháy
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // 2. Trường hợp danh sách công việc trống: Hiển thị giao diện thông báo
  if (jobs.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-12 text-center flex flex-col items-center justify-center transition-colors duration-200">
        <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-1">Không tìm thấy việc làm</h3>
        <p className="text-sm text-gray-400 dark:text-[#94a3b8] max-w-sm">
          Hãy thử thay đổi hoặc xóa bớt các tiêu chí bộ lọc để mở rộng tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 3. Hiển thị danh sách các thẻ việc làm JobCard */}
      <div className="space-y-4" id="job-list">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onBookmark={onBookmark}
            isBookmarked={bookmarkedIds.has(job.id)}
          />
        ))}
      </div>

      {/* 4. Thanh phân trang: Chỉ xuất hiện khi tổng số trang lớn hơn 1 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          
          {/* Nút lùi về trang trước */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            id="prev-page"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Duyệt qua mảng số trang để vẽ các nút số tương ứng */}
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === currentPage;
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                id={`page-${pageNumber}`}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0E7490] text-white dark:bg-[#67e8f9] dark:text-[#071a2b] shadow-md'
                    : 'border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9]'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* Nút tiến tới trang tiếp theo */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#1a3d5c] text-gray-600 dark:text-[#cbd5e1] hover:border-[#0E7490] dark:hover:border-[#67e8f9] hover:text-[#0E7490] dark:hover:text-[#67e8f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            id="next-page"
            aria-label="Trang tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
