'use client';

/**
 * @file JobSortBar.tsx
 * @description Component thanh sắp xếp kết quả và hiển thị các nhãn bộ lọc đang áp dụng.
 * 
 * Các phân hệ chức năng:
 * 1. Số lượng kết quả: Thống kê số lượng việc làm tìm thấy.
 * 2. Active Badges: Các nhãn bộ lọc đang hoạt động (như tên ngành, loại công việc). Cho phép người dùng click nút X để xóa nhanh bộ lọc đó.
 * 3. Mobile Filter Trigger: Nút bấm mở Drawer bộ lọc trên thiết bị di động (ẩn trên desktop).
 * 4. Dropdown Sắp xếp: Bộ chọn tiêu chí sắp xếp (mới nhất, lương cao, sắp hết hạn, v.v.).
 */

import { SlidersHorizontal, X } from 'lucide-react';
import { SortOption } from '@/types/job';

// Định nghĩa cấu trúc cho các badge bộ lọc đang active
interface ActiveFilter {
  key: string; // Khóa định danh của bộ lọc (ví dụ: 'keyword', 'location')
  label: string; // Nhãn hiển thị tiếng Việt của bộ lọc (ví dụ: 'Dương Đông')
}

// Cấu hình các props truyền vào component JobSortBar
interface JobSortBarProps {
  totalResults: number; // Tổng số kết quả công việc tìm thấy
  activeFilters: ActiveFilter[]; // Danh sách các badge lọc đang active
  sortBy: SortOption; // Tiêu chí sắp xếp hiện tại
  onSortChange: (sort: SortOption) => void; // Hàm callback khi đổi tiêu chí sắp xếp
  onRemoveFilter: (key: string) => void; // Hàm callback khi xóa một badge lọc cụ thể
  onOpenMobileFilter: () => void; // Hàm callback mở Drawer bộ lọc trên di động
}

// Cấu hình các lựa chọn sắp xếp hiển thị trong dropdown select
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'salary_low', label: 'Lương thấp nhất' },
  { value: 'salary_high', label: 'Lương cao nhất' },
  { value: 'expiring_soon', label: 'Sắp hết hạn' },
];

export default function JobSortBar({
  totalResults,
  activeFilters,
  sortBy,
  onSortChange,
  onRemoveFilter,
  onOpenMobileFilter,
}: JobSortBarProps) {
  return (
    <div className="bg-white dark:bg-[#0d2137] border border-[#E0F5FB] dark:border-[#1a3d5c] px-5 py-3 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors duration-200">

      {/* 1. Phần Bên Trái: Số lượng kết quả và danh sách nhãn bộ lọc đang bật */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Số lượng công việc thống kê */}
        <span className="text-sm text-gray-500 dark:text-[#cbd5e1]">
          Tìm thấy{' '}
          <strong className="text-[#005a71] dark:text-[#67e8f9]">
            {totalResults.toLocaleString('vi-VN')}
          </strong>{' '}
          việc làm
        </span>

        {/* Duyệt qua và hiển thị các badge bộ lọc đang được chọn */}
        {activeFilters.map((filter) => (
          <span
            key={filter.key}
            className="inline-flex items-center gap-1 bg-[#E0F5FB] dark:bg-[#005a71]/30 text-[#005a71] dark:text-[#67e8f9] text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-200"
          >
            {filter.label}
            {/* Nút X để gỡ nhanh bộ lọc này */}
            <button
              onClick={() => onRemoveFilter(filter.key)}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity leading-none cursor-pointer flex items-center justify-center"
              aria-label={`Xóa bộ lọc ${filter.label}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* 2. Phần Bên Phải: Nút mở bộ lọc mobile và dropdown Sắp xếp */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Nút mở bộ lọc trên Mobile/Tablet (ẩn trên màn hình lg) */}
        <button
          onClick={onOpenMobileFilter}
          id="open-filter"
          className="lg:hidden flex items-center gap-2 text-sm font-semibold text-[#005a71] dark:text-[#67e8f9] border border-[#005a71]/50 dark:border-[#67e8f9]/50 px-3 py-2 rounded-lg hover:bg-[#005a71]/5 dark:hover:bg-[#67e8f9]/10 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
        </button>

        {/* Dropdown sắp xếp công việc */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-[#cbd5e1] whitespace-nowrap">Sắp xếp:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            id="sort-select"
            className="border border-gray-200 dark:border-[#1a3d5c] rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-[#cbd5e1] focus:ring-2 focus:ring-[#0E7490]/30 focus:border-[#0E7490] dark:focus:border-[#67e8f9] bg-white dark:bg-[#0d2137] outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="dark:bg-[#0d2137]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
}
