'use client';

/**
 * @file JobFilter.tsx
 * @description Component bộ lọc hợp nhất phẳng phục vụ cho cả Desktop (Sidebar) và Mobile (Drawer).
 * 
 * Các thẻ / Component con bên trong:
 * 1. CheckboxGroup: Component trợ giúp hiển thị nhóm các hộp kiểm lựa chọn (như Ngành nghề, Cấp bậc, Kinh nghiệm).
 * 2. JobFilterSidebar: Khung bộ lọc chính dạng Sidebar hiển thị trên màn hình máy tính.
 * 3. JobFilterMobileDrawer: Khung bộ lọc dạng Drawer trượt từ dưới lên chuyên biệt cho màn hình di động.
 */

import { useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { JobFilters, ContractType } from '@/types/job';

// ==========================================
// CẤU HÌNH DỮ LIỆU BỘ LỌC MẪU
// ==========================================

// Cấu trúc danh sách các loại hợp đồng lao động kèm số lượng bài đăng mẫu
const CONTRACT_TYPES: { label: string; value: ContractType; count: number }[] = [
  { label: 'Full-time', value: 'Full-time', count: 487 },
  { label: 'Part-time', value: 'Part-time', count: 123 },
  { label: 'Remote', value: 'Remote', count: 56 },
  { label: 'Thực tập', value: 'Thực tập', count: 81 },
  { label: 'Hợp đồng', value: 'Hợp đồng', count: 99 },
  { label: 'Freelance', value: 'Freelance' as any, count: 24 },
];

// Danh sách các khoảng mức lương tuyển dụng để người dùng chọn nhanh
const SALARY_RANGES = [
  'Dưới 5 triệu',
  '5 - 10 triệu',
  '10 - 20 triệu',
  '20 - 30 triệu',
  'Trên 30 triệu',
];

// Yêu cầu kinh nghiệm làm việc kèm số lượng tin tuyển dụng tương ứng
const EXPERIENCES = [
  { label: 'Không yêu cầu', count: 145 },
  { label: 'Dưới 1 năm', count: 203 },
  { label: '1-3 năm', count: 389 },
  { label: '3-5 năm', count: 210 },
  { label: 'Trên 5 năm', count: 98 },
];

// Danh sách cấp bậc nhân sự trong doanh nghiệp tuyển dụng
const LEVELS = [
  'Thực tập sinh',
  'Fresher',
  'Junior',
  'Middle',
  'Senior',
  'Lead',
  'Manager',
  'Director',
];

// ==========================================
// COMPONENT HỖ TRỢ: CheckboxGroup
// ==========================================

/**
 * Component CheckboxGroup render một nhóm các checkbox lựa chọn.
 * Hỗ trợ generic type T kế thừa từ string để kiểm soát chặt chẽ kiểu dữ liệu.
 */
function CheckboxGroup<T extends string>({
  options,
  selected,
  onChange,
  getLabel,
  getCount,
}: {
  options: T[]; // Các lựa chọn khả dụng dưới dạng mảng
  selected: T[]; // Các lựa chọn hiện tại đang được chọn (active)
  onChange: (val: T[]) => void; // Hàm callback trả về mảng kết quả sau thay đổi
  getLabel: (opt: T) => string; // Hàm chuyển đổi giá trị option sang nhãn hiển thị tiếng Việt
  getCount?: (opt: T) => number | undefined; // Hàm tùy chọn lấy số lượng công việc của từng mục
}) {
  // Hàm xử lý bật/tắt khi người dùng click vào một checkbox cụ thể
  const toggleCheckbox = (val: T) => {
    if (selected.includes(val)) {
      // Nếu đã chọn thì loại bỏ ra khỏi mảng selected
      onChange(selected.filter((item) => item !== val));
    } else {
      // Nếu chưa chọn thì thêm vào mảng selected
      onChange([...selected, val]);
    }
  };

  return (
    <div className="space-y-2.5">
      {options.map((opt) => (
        <label
          key={String(opt)}
          className="flex items-center gap-3 text-sm text-gray-700 dark:text-[#cbd5e1] cursor-pointer hover:text-[#005a71] dark:hover:text-[#67e8f9] transition-colors"
        >
          {/* Hộp kiểm checkbox */}
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggleCheckbox(opt)}
            className="accent-[#0E7490] w-4 h-4 rounded cursor-pointer"
          />
          {/* Nhãn văn bản hiển thị */}
          <span>{getLabel(opt)}</span>
          {/* Số lượng công việc (nếu có cấu hình) */}
          {getCount && getCount(opt) !== undefined && (
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">({getCount(opt)})</span>
          )}
        </label>
      ))}
    </div>
  );
}

// ==========================================
// COMPONENT 1: JobFilterSidebar (Desktop)
// ==========================================

interface JobFilterSidebarProps {
  filters: JobFilters; // Trạng thái bộ lọc hiện tại của trang
  onFilterChange: (updated: Partial<JobFilters>) => void; // Hàm callback cập nhật một phần bộ lọc
  onClearAll: () => void; // Hàm callback xóa toàn bộ bộ lọc đang áp dụng
  categories: { id: string; name: string; slug: string; jobCount?: number }[];
  stats?: {
    type: Record<string, number>;
    experience: Record<string, number>;
    level: Record<string, number>;
    salary: Record<string, number>;
  } | null;
}

export function JobFilterSidebar({
  filters,
  onFilterChange,
  onClearAll,
  categories,
  stats,
}: JobFilterSidebarProps) {
  // Định nghĩa các biến class dùng chung để giao diện thống nhất và dễ bảo trì
  const dividerClass = 'border-t border-[#E0F5FB] dark:border-[#1a3d5c]';
  const headingClass = 'font-semibold text-[#005a71] dark:text-[#67e8f9] mb-3 uppercase tracking-wide text-xs';

  const getContractTypeCount = (value: string) => {
    if (!stats?.type) return 0;
    const typeMap: Record<string, string> = { "Full-time": "FULL_TIME", "Part-time": "PART_TIME", "Remote": "REMOTE", "Hợp đồng": "CONTRACT", "Thực tập": "INTERNSHIP", "Freelance": "FREELANCE" };
    const dbKey = typeMap[value] || value;
    return stats.type[dbKey] || 0;
  };

  const getSalaryRangeCount = (value: string) => {
    if (!stats?.salary) return 0;
    const salaryMap: Record<string, string> = {
      'Dưới 5 triệu': 'under_5',
      '5 - 10 triệu': '5_10',
      '10 - 20 triệu': '10_20',
      '20 - 30 triệu': '20_30',
      'Trên 30 triệu': 'over_30',
    };
    const dbKey = salaryMap[value];
    return stats.salary[dbKey] || 0;
  };

  const getExperienceCount = (value: string) => {
    if (!stats?.experience) return 0;
    const expMap: Record<string, string> = { "Không yêu cầu": "NO_EXPERIENCE", "Dưới 1 năm": "UNDER_1_YEAR", "1-3 năm": "ONE_TO_THREE_YEARS", "3-5 năm": "THREE_TO_FIVE_YEARS", "Trên 5 năm": "OVER_FIVE_YEARS" };
    const dbKey = expMap[value];
    return stats.experience[dbKey] || 0;
  };

  const getLevelCount = (value: string) => {
    if (!stats?.level) return 0;
    const lvlMap: Record<string, string> = { "Thực tập sinh": "INTERN", "Fresher": "FRESHER", "Junior": "JUNIOR", "Middle": "MID", "Senior": "SENIOR", "Lead": "LEAD", "Manager": "MANAGER", "Director": "DIRECTOR" };
    const dbKey = lvlMap[value];
    return stats.level[dbKey] || 0;
  };

  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] shadow-sm overflow-hidden transition-colors duration-200">

      {/* Tiêu đề Header của thanh bộ lọc */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-[#E0F5FB] dark:border-[#1a3d5c]">
        <h2 className="font-bold text-[#005a71] dark:text-[#67e8f9] flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-[#005a71] dark:text-[#67e8f9]" /> Bộ lọc
        </h2>
        {/* Nút Xóa tất cả bộ lọc */}
        <button
          onClick={onClearAll}
          className="text-xs text-[#0D9488] dark:text-[#2dd4bf] font-semibold hover:opacity-70 transition-opacity cursor-pointer"
          id="clear-filters"
        >
          Xóa tất cả
        </button>
      </div>

      {/* Nội dung danh mục bộ lọc */}
      <div className="px-5 py-4 space-y-5">

        {/* 1. Lọc theo Loại hợp đồng */}
        <div>
          <h3 className={headingClass}>Loại hợp đồng</h3>
          <CheckboxGroup
            options={CONTRACT_TYPES.map((c) => c.value)}
            selected={filters.contractTypes}
            onChange={(val) => onFilterChange({ contractTypes: val })}
            getLabel={(opt) => CONTRACT_TYPES.find((c) => c.value === opt)?.label ?? opt}
            getCount={getContractTypeCount}
          />
        </div>

        <div className={dividerClass} />

        {/* 2. Lọc theo Mức lương */}
        <div>
          <h3 className={headingClass}>Mức lương (triệu/tháng)</h3>
          <CheckboxGroup
            options={SALARY_RANGES}
            selected={filters.salaryRanges}
            onChange={(val) => onFilterChange({ salaryRanges: val })}
            getLabel={(opt) => opt}
            getCount={getSalaryRangeCount}
          />
        </div>

        <div className={dividerClass} />

        {/* 3. Lọc theo Yêu cầu kinh nghiệm */}
        <div>
          <h3 className={headingClass}>Kinh nghiệm</h3>
          <CheckboxGroup
            options={EXPERIENCES.map((e) => e.label)}
            selected={filters.experiences}
            onChange={(val) => onFilterChange({ experiences: val })}
            getLabel={(opt) => opt}
            getCount={getExperienceCount}
          />
        </div>

        <div className={dividerClass} />

        {/* 4. Lọc theo Cấp bậc */}
        <div>
          <h3 className={headingClass}>Cấp bậc</h3>
          <CheckboxGroup
            options={LEVELS}
            selected={filters.levels}
            onChange={(val) => onFilterChange({ levels: val })}
            getLabel={(opt) => opt}
            getCount={getLevelCount}
          />
        </div>

        <div className={dividerClass} />

        {/* 5. Lọc theo Ngành nghề */}
        <div>
          <h3 className={headingClass}>Ngành nghề</h3>
          <CheckboxGroup
            options={categories.map((c) => c.name)}
            selected={filters.industries}
            onChange={(val) => onFilterChange({ industries: val })}
            getLabel={(opt) => opt}
            getCount={(opt) => categories.find((c) => c.name === opt)?.jobCount}
          />
        </div>

        {/* Nút bấm xem kết quả lọc nhanh */}
        <button
          onClick={() => {
            // Bộ lọc tự động áp dụng khi thay đổi các checkbox (Live Filter)
          }}
          className="w-full bg-[#0E7490] dark:bg-[#0e7490] hover:bg-[#005a71] dark:hover:bg-[#0d9488] text-white font-semibold py-3 rounded-xl transition-colors shadow-md text-sm cursor-pointer"
        >
          Áp dụng bộ lọc
        </button>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 2: JobFilterMobileDrawer (Mobile)
// ==========================================

interface JobFilterMobileDrawerProps {
  isOpen: boolean; // Trạng thái đóng/mở của Drawer trên điện thoại
  onClose: () => void; // Hàm đóng bộ lọc Drawer
  filters: JobFilters; // Trạng thái bộ lọc hiện thời
  onFilterChange: (updated: Partial<JobFilters>) => void; // Callback cập nhật bộ lọc
  onClearAll: () => void; // Callback xóa toàn bộ
  categories: { id: string; name: string; slug: string }[];
  stats?: {
    type: Record<string, number>;
    experience: Record<string, number>;
    level: Record<string, number>;
    salary: Record<string, number>;
  } | null;
}

export function JobFilterMobileDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearAll,
  categories,
  stats,
}: JobFilterMobileDrawerProps) {

  // Khóa thanh cuốn (scroll) của trang chính phía dưới khi đang hiển thị bộ lọc trượt
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 1. Lớp phủ nền mờ phía sau (Backdrop Overlay) */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 2. Thân Drawer trượt từ dưới lên */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0d2137] rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl transition-transform duration-300 border-t dark:border-[#1a3d5c]"
        id="mobile-filter-drawer"
      >
        {/* Thanh gờ nhỏ giả lập kéo trượt phía trên cùng của drawer */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Thanh header tiêu đề trên Mobile */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-[#E0F5FB] dark:border-[#1a3d5c]">
          <h2 className="font-bold text-[#005a71] dark:text-[#67e8f9] text-base flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#005a71] dark:text-[#67e8f9]" />
            Bộ lọc
          </h2>
          {/* Nút đóng X */}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#071a2b] transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
            id="close-mobile-filter"
            aria-label="Đóng bộ lọc"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3. Tái sử dụng component JobFilterSidebar (Desktop) để tránh lặp code */}
        <div className="px-2 py-2">
          <JobFilterSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            onClearAll={onClearAll}
            categories={categories}
          />
        </div>

        {/* 4. Nút hành động cố định dưới chân Drawer (Sticky Bottom Action) */}
        <div className="sticky bottom-0 bg-white dark:bg-[#0d2137] border-t border-[#E0F5FB] dark:border-[#1a3d5c] px-5 py-4">
          <button
            onClick={onClose}
            className="w-full bg-[#0E7490] dark:bg-[#0e7490] hover:bg-[#005a71] dark:hover:bg-[#0d9488] text-white dark:text-[#071a2b] font-bold py-3.5 rounded-2xl transition-colors shadow-md cursor-pointer"
            id="apply-mobile-filter"
          >
            Xem kết quả
          </button>
        </div>
      </div>
    </>
  );
}
