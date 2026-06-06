"use client";

/**
 * @file useJobs.ts
 * @description Hook quản lý trạng thái của trang danh sách công việc (Jobs Page).
 * Đảm nhận các nhiệm vụ:
 * 1. Lưu trữ trạng thái bộ lọc (từ khóa, địa điểm, ngành nghề, hình thức làm việc, lương, kinh nghiệm, cấp bậc).
 * 2. Thực hiện lọc và tìm kiếm dữ liệu công việc dựa trên các tiêu chí người dùng chọn.
 * 3. Sắp xếp kết quả tìm kiếm theo thứ tự (mới nhất, lương cao, hạn nộp gần nhất, phù hợp nhất).
 * 4. Thực hiện chia trang (Pagination) để giao diện hiển thị gọn gàng.
 * 5. Quản lý trạng thái đánh dấu lưu công việc (Bookmark).
 *
 * DỮ LIỆU ĐẦU VÀO (INPUT):
 * - Nhập dữ liệu từ `@/mockData/jobs` (danh sách công việc mẫu mới cấu trúc).
 *
 * DỮ LIỆU ĐẦU RA (OUTPUT):
 * - Trả về danh sách công việc đã lọc và phân trang, thông tin trang hiện tại, các hàm xử lý sự kiện cập nhật bộ lọc, sắp xếp và lưu bookmark.
 */

import { useState, useMemo, useCallback } from "react";
// Import nguồn dữ liệu giả lập mới từ thư mục mockData
import { mockJobs } from "@/mocks/jobs";
import { JobType, JobFilters, SortOption, ContractType } from "@/types/job";

// Định nghĩa khoảng lương chi tiết để đối chiếu khi lọc (đơn vị: triệu đồng)
const SALARY_RANGES: Record<string, [number, number]> = {
  "Dưới 5 triệu": [0, 5],
  "5 - 10 triệu": [5, 10],
  "10 - 20 triệu": [10, 20],
  "20 - 30 triệu": [20, 30],
  "Trên 30 triệu": [30, 999],
};

/**
 * Hàm phân tích mức lương từ dạng văn bản sang số nguyên để so sánh (Lấy số nhỏ nhất trong chuỗi).
 * Ví dụ: "15 - 25 triệu" -> 15. "7 - 10 triệu" -> 7.
 *
 * @param salaryString Chuỗi hiển thị mức lương (ví dụ: '15 - 25 triệu')
 * @returns Số mức lương tối thiểu (ví dụ: 15)
 */
function parseSalaryMin(salaryString: string): number {
  // Tìm kiếm số xuất hiện đầu tiên trong chuỗi
  const matches = salaryString.match(/\d+/);
  if (matches) {
    // Trả về số đã phân tích dưới dạng số nguyên cơ số 10
    return parseInt(matches[0], 10);
  }
  // Nếu không tìm thấy số nào (Ví dụ lương 'Thỏa thuận'), trả về 0
  return 0;
}

/**
 * Hàm kiểm tra xem công việc có thỏa mãn các khoảng lương được chọn hay không.
 *
 * @param salaryText Chuỗi lương của công việc (Ví dụ: "15 - 25 triệu")
 * @param selectedRanges Mảng các khoảng lương người dùng đang lọc (Ví dụ: ["10 - 20 triệu", "20 - 30 triệu"])
 * @returns boolean true nếu công việc nằm trong khoảng lương được chọn, hoặc true nếu không chọn khoảng lương nào
 */
function matchesSalaryRange(
  salaryText: string,
  selectedRanges: string[],
): boolean {
  // Nếu người dùng không chọn khoảng lọc lương nào, mặc định là khớp tất cả
  if (selectedRanges.length === 0) {
    return true;
  }

  // Lấy giá trị mức lương tối thiểu của công việc hiện tại
  const salaryMin = parseSalaryMin(salaryText);

  // Duyệt qua từng khoảng lương được chọn lọc
  for (let i = 0; i < selectedRanges.length; i++) {
    const rangeName = selectedRanges[i];
    // Lấy khoảng min và max của khoảng lương đó từ hằng số cấu hình
    const rangeLimit = SALARY_RANGES[rangeName];

    if (rangeLimit) {
      const min = rangeLimit[0];
      const max = rangeLimit[1];

      // Nếu mức lương tối thiểu của công việc nằm trong khoảng [min, max], xem như khớp
      if (salaryMin >= min && salaryMin < max) {
        return true;
      }
    }
  }

  // Nếu duyệt qua toàn bộ khoảng lương được chọn mà không khớp, trả về false
  return false;
}

// Giá trị bộ lọc mặc định khi chưa thiết lập gì
const DEFAULT_FILTERS: JobFilters = {
  contractTypes: [],
  salaryRanges: [],
  experiences: [],
  levels: [],
  industries: [],
  keyword: "",
  location: "",
};

export function useJobs() {
  // State lưu trữ các điều kiện bộ lọc hiện tại
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);

  // State lưu trữ cách sắp xếp kết quả (mặc định là 'newest' - mới nhất)
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // State lưu danh sách các ID công việc đã được người dùng đánh dấu lưu (bookmark)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // State quản lý số trang hiển thị hiện tại (phân trang bắt đầu từ trang 1)
  const [page, setPage] = useState(1);

  // Số lượng công việc hiển thị tối đa trên một trang
  const ITEMS_PER_PAGE = 6;

  /**
   * Hàm lưu hoặc bỏ lưu công việc (Bookmark).
   * Thực hiện đảo ngược trạng thái ID công việc trong danh sách lưu trữ.
   */
  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prevSet) => {
      // Sao chép Set hiện tại sang Set mới để React nhận diện sự thay đổi state
      const nextSet = new Set(prevSet);
      if (nextSet.has(id)) {
        // Nếu đã có thì xóa đi (bỏ lưu)
        nextSet.delete(id);
      } else {
        // Nếu chưa có thì thêm vào (lưu lại)
        nextSet.add(id);
      }
      return nextSet;
    });
  }, []);

  /**
   * Hàm cập nhật các điều kiện lọc mới.
   * Mỗi lần thay đổi bộ lọc, trang sẽ tự động reset về trang 1.
   */
  const updateFilters = useCallback((newFilters: Partial<JobFilters>) => {
    setFilters((prevFilters) => {
      return {
        ...prevFilters,
        ...newFilters,
      };
    });
    // Đưa trang về 1 khi cập nhật bộ lọc mới
    setPage(1);
  }, []);

  /**
   * Hàm xóa sạch các điều kiện lọc hiện tại, đưa về mặc định.
   */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  /**
   * Hàm cập nhật tiêu chí sắp xếp.
   * Đồng thời reset trang hiển thị về trang đầu tiên.
   */
  const updateSort = useCallback((sort: SortOption) => {
    setSortBy(sort);
    setPage(1);
  }, []);

  /**
   * Logic lọc danh sách công việc.
   * Sử dụng `useMemo` để tối ưu hiệu năng, tránh việc lọc lại danh sách khi các state khác thay đổi.
   */
  const filteredJobs = useMemo<JobType[]>(() => {
    // Duyệt qua từng công việc trong cơ sở dữ liệu giả lập và kiểm tra điều kiện lọc
    return mockJobs.filter((job) => {
      // 1. Kiểm tra Lọc theo Từ khóa (keyword)
      if (filters.keyword) {
        const lowercaseKeyword = filters.keyword.toLowerCase();

        // Tìm kiếm khớp trong tiêu đề công việc, tên công ty hoặc mảng các thẻ tags gắn kèm
        const matchesTitle = job.title.toLowerCase().includes(lowercaseKeyword);
        const matchesCompany = job.company
          .toLowerCase()
          .includes(lowercaseKeyword);
        const matchesTags = job.tags.some((tag) =>
          tag.toLowerCase().includes(lowercaseKeyword),
        );

        // Nếu không khớp với bất kỳ trường nào ở trên, loại bỏ công việc này
        if (!matchesTitle && !matchesCompany && !matchesTags) {
          return false;
        }
      }

      // 2. Kiểm tra Lọc theo Địa điểm (location)
      if (filters.location) {
        const jobLoc = job.location.toLowerCase();
        const filterLoc = filters.location.toLowerCase();

        // Nếu địa điểm của công việc không chứa từ khóa địa điểm được lọc, loại bỏ
        if (!jobLoc.includes(filterLoc)) {
          return false;
        }
      }

      // 3. Kiểm tra Lọc theo Loại hợp đồng (contractTypes - dạng mảng đa lựa chọn)
      if (filters.contractTypes.length > 0) {
        // Kiểm tra xem hình thức của công việc hiện tại có nằm trong mảng lựa chọn lọc hay không
        const isMatchedContract = filters.contractTypes.includes(
          job.contractType as ContractType,
        );
        if (!isMatchedContract) {
          return false;
        }
      }

      // 4. Kiểm tra Lọc theo Khoảng lương (salaryRanges)
      const isSalaryMatch = matchesSalaryRange(
        job.salary,
        filters.salaryRanges,
      );
      if (!isSalaryMatch) {
        return false;
      }

      // 5. Kiểm tra Lọc theo Yêu cầu kinh nghiệm (experiences)
      if (filters.experiences.length > 0) {
        // Kiểm tra xem mô tả kinh nghiệm có khớp với lựa chọn lọc nào không
        const isMatchedExperience = filters.experiences.some((exp) => {
          return job.experience.toLowerCase().includes(exp.toLowerCase());
        });

        if (!isMatchedExperience) {
          return false;
        }
      }

      // 6. Kiểm tra Lọc theo Cấp bậc (levels)
      if (filters.levels.length > 0 && job.level) {
        // Kiểm tra xem cấp bậc của công việc có khớp với lựa chọn lọc nào không
        const isMatchedLevel = filters.levels.some((lvl) => {
          return job.level!.toLowerCase().includes(lvl.toLowerCase());
        });

        if (!isMatchedLevel) {
          return false;
        }
      }

      // 7. Kiểm tra Lọc theo Ngành nghề (industries)
      if (filters.industries.length > 0) {
        // Kiểm tra xem ngành của công việc có khớp với lựa chọn lọc không
        const isMatchedIndustry = filters.industries.includes(job.industry);
        if (!isMatchedIndustry) {
          return false;
        }
      }

      // Công việc vượt qua toàn bộ bộ lọc
      return true;
    });
  }, [filters]);

  /**
   * Logic sắp xếp danh sách kết quả sau khi đã lọc.
   * Sử dụng `useMemo` để chỉ sắp xếp lại khi danh sách lọc hoặc cách sắp xếp thay đổi.
   */
  const sortedJobs = useMemo<JobType[]>(() => {
    // Tạo bản sao của mảng đã lọc để tránh biến đổi trực tiếp mảng gốc
    const result = [...filteredJobs];

    return result.sort((a, b) => {
      if (sortBy === "newest") {
        // Sắp xếp Mới nhất: So sánh timestamp ngày đăng tin (mới nhất lên đầu)
        const timeA = new Date(a.postedDate).getTime();
        const timeB = new Date(b.postedDate).getTime();
        return timeB - timeA;
      }

      if (sortBy === "salary_high") {
        // Sắp xếp Lương cao nhất: So sánh số mức lương tối thiểu (cao nhất lên đầu)
        const salaryA = parseSalaryMin(a.salary);
        const salaryB = parseSalaryMin(b.salary);
        return salaryB - salaryA;
      }

      if (sortBy === "expiring_soon") {
        // Sắp xếp Sắp hết hạn: So sánh số ngày còn lại (ít ngày còn lại lên đầu)
        return a.daysLeft - b.daysLeft;
      }

      // Sắp xếp Mặc định / Phù hợp nhất (most_relevant):
      // Ưu tiên các công việc nổi bật (isFeatured) lên đầu tiên
      const featuredA = a.isFeatured ? 1 : 0;
      const featuredB = b.isFeatured ? 1 : 0;
      return featuredB - featuredA;
    });
  }, [filteredJobs, sortBy]);

  // Tổng số lượng công việc thỏa mãn sau bộ lọc
  const totalJobs = sortedJobs.length;

  // Tính toán tổng số trang dựa trên số lượng công việc và giới hạn mỗi trang
  const totalPages = Math.ceil(totalJobs / ITEMS_PER_PAGE);

  /**
   * Lấy danh sách công việc hiển thị trên trang hiện tại.
   * Cắt (slice) mảng kết quả đã sắp xếp dựa trên chỉ số trang.
   */
  const paginatedJobs = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = page * ITEMS_PER_PAGE;
    return sortedJobs.slice(startIndex, endIndex);
  }, [sortedJobs, page]);

  /**
   * Tạo mảng nhãn hiệu (badges) đại diện cho các bộ lọc đang được kích hoạt.
   * Dùng để hiển thị ở thanh trạng thái và cho phép người dùng xóa nhanh bộ lọc đó.
   */
  const activeFilters = useMemo(() => {
    const badges: { key: string; label: string }[] = [];

    // Thêm các loại hợp đồng đang lọc vào danh sách badge
    filters.contractTypes.forEach((ct) => {
      badges.push({ key: `contractType:${ct}`, label: ct });
    });

    // Thêm khoảng lương đang lọc
    filters.salaryRanges.forEach((sr) => {
      badges.push({ key: `salary:${sr}`, label: sr });
    });

    // Thêm kinh nghiệm đang lọc
    filters.experiences.forEach((ex) => {
      badges.push({ key: `exp:${ex}`, label: ex });
    });

    // Thêm cấp bậc đang lọc
    filters.levels.forEach((lv) => {
      badges.push({ key: `level:${lv}`, label: lv });
    });

    // Thêm ngành nghề đang lọc
    filters.industries.forEach((ind) => {
      badges.push({ key: `industry:${ind}`, label: ind });
    });

    return badges;
  }, [filters]);

  /**
   * Hàm gỡ bỏ nhanh một bộ lọc dựa trên key định dạng "tên_bộ_lọc:giá_trị".
   */
  const removeFilter = useCallback((key: string) => {
    // Tách key thành loại bộ lọc và giá trị lọc
    const parts = key.split(":");
    const filterType = parts[0];
    const filterValue = parts[1];

    setFilters((prevFilters) => {
      const nextFilters = { ...prevFilters };

      if (filterType === "contractType") {
        // Loại bỏ hình thức làm việc tương ứng khỏi mảng lọc
        nextFilters.contractTypes = prevFilters.contractTypes.filter(
          (item) => item !== filterValue,
        );
      } else if (filterType === "salary") {
        // Loại bỏ khoảng lương tương ứng
        nextFilters.salaryRanges = prevFilters.salaryRanges.filter(
          (item) => item !== filterValue,
        );
      } else if (filterType === "exp") {
        // Loại bỏ mức kinh nghiệm tương ứng
        nextFilters.experiences = prevFilters.experiences.filter(
          (item) => item !== filterValue,
        );
      } else if (filterType === "level") {
        // Loại bỏ cấp bậc tương ứng
        nextFilters.levels = prevFilters.levels.filter(
          (item) => item !== filterValue,
        );
      } else if (filterType === "industry") {
        // Loại bỏ ngành nghề tương ứng
        nextFilters.industries = prevFilters.industries.filter(
          (item) => item !== filterValue,
        );
      }

      return nextFilters;
    });

    // Đưa trang về 1
    setPage(1);
  }, []);

  return {
    jobs: paginatedJobs, // Danh sách việc làm đã phân trang cho Client render
    allFilteredJobs: sortedJobs, // Toàn bộ danh sách việc làm sau lọc và sắp xếp
    totalJobs, // Tổng số công việc tìm thấy
    totalPages, // Tổng số trang hiển thị
    page, // Chỉ số trang hiện tại
    setPage, // Hàm nhảy trang
    filters, // Bộ lọc hiện tại
    updateFilters, // Hàm cập nhật bộ lọc
    clearFilters, // Hàm reset bộ lọc về trống
    sortBy, // Tiêu chí sắp xếp hiện tại
    updateSort, // Hàm cập nhật tiêu chí sắp xếp
    bookmarkedIds, // Set các ID việc làm đã bookmark
    toggleBookmark, // Hàm thêm/xóa bookmark
    activeFilters, // Danh sách nhãn bộ lọc đang bật
    removeFilter, // Hàm xóa một badge bộ lọc
  };
}
