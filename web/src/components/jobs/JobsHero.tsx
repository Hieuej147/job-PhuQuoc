"use client";

/**
 * @file JobsHero.tsx
 * @description Component banner tìm kiếm chính của trang danh sách việc làm.
 * @note [HuynhhThanh] Đã loại bỏ các Quick Tags hardcode và thay bằng dữ liệu thực tế (categories) lấy từ cơ sở dữ liệu để đảm bảo tính đồng bộ và linh hoạt.
 * 
 * Các phân hệ chức năng:
 * 1. Tiêu đề & Thống kê: Tiêu đề động và thống kê số lượng bài đăng việc làm hiện có trên hệ thống.
 * 2. Form tìm kiếm (Search Form):
 *    - Ô nhập từ khóa (Từ khóa công việc, kỹ năng, tên công ty).
 *    - Ô chọn vị trí địa lý (Phú Quốc phân chia theo xã/phường/vùng).
 *    - Ô chọn nhóm ngành nghề tuyển dụng chính.
 *    - Nút kích hoạt tìm kiếm chính.
 * 3. Thẻ gợi ý tìm nhanh (Quick Tags): Danh sách các từ khóa hot nhất để người dùng click chọn tìm nhanh mà không cần gõ phím.
 */

import { useState, useEffect } from "react";
import { Search, MapPin, Briefcase } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho props của JobsHero
interface JobsHeroProps {
  totalJobs: number; // Tổng số việc làm hiển thị trên hệ thống để đưa vào nhãn thống kê
  categories: { id: string; name: string; slug: string }[];
  initialKeyword?: string;
  initialLocation?: string;
  initialIndustry?: string;
  onSearch: (keyword: string, location: string, industry: string) => void; // Hàm callback kích hoạt khi nhấn Tìm kiếm
}


export default function JobsHero({
  totalJobs,
  categories = [],
  initialKeyword = "",
  initialLocation = "",
  initialIndustry = "",
  onSearch,
}: JobsHeroProps) {
  // Quản lý trạng thái nhập liệu của từ khóa, khu vực và ngành nghề
  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [industry, setIndustry] = useState(initialIndustry);
  const [wards, setWards] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Đồng bộ hóa khi props thay đổi
  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  useEffect(() => {
    setIndustry(initialIndustry);
  }, [initialIndustry]);

  // Fetch wards dynamically from API
  useEffect(() => {
    fetch("/api/v1/address/wards?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const items = d.data?.items || d.data || [];
        setWards(items);
      })
      .catch(() => { });
  }, []);

  // Kích hoạt hàm tìm kiếm chính và truyền ngược lại cho trang chủ xử lý
  const handleSearch = () => {
    onSearch(keyword, location, industry);
  };

  // Hàm xử lý tìm kiếm nhanh khi người dùng click vào nhãn gợi ý (Quick Tag)
  const handleQuickTag = (tag: string) => {
    setKeyword(tag);
    onSearch(tag, location, industry);
  };

  return (
    <section className="bg-linear-to-b from-[#0E7490] to-[#0D9488] dark:from-[#002d3d] dark:to-[#003d38] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Tiêu đề chính của Banner */}
        <h1 className="text-white font-bold text-2xl md:text-3xl mb-2">
          Tìm việc làm tại Phú Quốc
        </h1>

        {/* Số lượng công việc hiện có (được định dạng số tiếng Việt) */}
        <p className="text-white/80 text-base mb-6">
          Đang hiển thị{" "}
          <span className="font-semibold text-white">
            {totalJobs.toLocaleString("vi-VN")}
          </span>{" "}
          việc làm
        </p>

        {/* Khung Thanh Công Cụ Tìm Kiếm */}
        <div className="bg-white dark:bg-[#0d2137] rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch overflow-hidden border border-transparent dark:border-[#1a3d5c] transition-colors duration-200">

          {/* Ô nhập từ khóa (Search Keyword) */}
          <div className="flex-1 flex items-center px-4 py-1 border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#1a3d5c]">
            <Search className="text-gray-400 dark:text-gray-500 mr-3 w-5 h-5 flex-shrink-0" />
            <input
              className="w-full border-none outline-none text-gray-800 dark:text-[#cbd5e1] placeholder-gray-400 dark:placeholder-gray-500 bg-transparent py-3 text-sm focus:ring-0 focus:outline-none"
              placeholder="Tên công việc, kỹ năng, công ty..."
              type="text"
              id="search-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>

          {/* Ô chọn khu vực địa lý (Location) */}
          <div className="flex items-center px-4 py-1 min-w-[180px] border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#1a3d5c]">
            <MapPin className="text-gray-400 dark:text-gray-500 mr-3 w-5 h-5 flex-shrink-0" />
            <select
              className="w-full border-none outline-none text-gray-800 dark:text-[#cbd5e1] bg-transparent py-3 text-sm cursor-pointer focus:ring-0 focus:outline-none"
              value={location}
              onChange={(e) => {
                const val = e.target.value;
                setLocation(val);
                onSearch(keyword, val, industry);
              }}
              id="search-location"
            >
              <option value="" className="dark:bg-[#0d2137]">Tất cả khu vực</option>
              {wards.map((loc) => (
                <option key={loc.id} value={loc.slug} className="dark:bg-[#0d2137]">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ô chọn ngành nghề tuyển dụng (Industry) */}
          <div className="flex items-center px-4 py-1 min-w-[160px]">
            <Briefcase className="text-gray-400 dark:text-gray-500 mr-3 w-5 h-5 flex-shrink-0" />
            <select
              className="w-full border-none outline-none text-gray-800 dark:text-[#cbd5e1] bg-transparent py-3 text-sm cursor-pointer focus:ring-0 focus:outline-none"
              value={industry}
              onChange={(e) => {
                const val = e.target.value;
                setIndustry(val);
                onSearch(keyword, location, val);
              }}
              id="search-industry"
            >
              <option value="" className="dark:bg-[#0d2137]">Tất cả ngành</option>
              {categories.map((ind) => (
                <option key={ind.id} value={ind.name} className="dark:bg-[#0d2137]">
                  {ind.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút bấm kích hoạt tìm kiếm */}
          <button
            onClick={handleSearch}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-8 py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-w-[140px] cursor-pointer"
            id="btn-search"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </button>
        </div>

        {/* Gợi ý Tìm nhanh (Quick Tags) */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-white/70 text-sm mr-1 self-center">
            Tìm nhanh:
          </span>
          {categories.slice(0, 7).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleQuickTag(cat.name)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition-colors border border-white/30 cursor-pointer"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
