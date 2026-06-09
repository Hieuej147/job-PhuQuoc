"use client";

/**
 * @file JobsHero.tsx
 * @description Component banner tìm kiếm chính của trang danh sách việc làm.
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

import { useState } from "react";
import { Search, MapPin, Briefcase } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho props của JobsHero
interface JobsHeroProps {
  totalJobs: number; // Tổng số việc làm hiển thị trên hệ thống để đưa vào nhãn thống kê
  onSearch: (keyword: string, location: string, industry: string) => void; // Hàm callback kích hoạt khi nhấn Tìm kiếm
}

// Danh sách các thẻ từ khóa tìm nhanh hỗ trợ người dùng click chọn nhanh
const QUICK_TAGS = [
  "Lễ tân khách sạn",
  "Bếp trưởng",
  "Hướng dẫn viên",
  "Kế toán",
  "Marketing",
  "Bảo vệ",
  "Bartender",
];

// Danh sách các xã/phường/khu vực tại Phú Quốc để đưa vào ô tuyển chọn địa điểm
const LOCATIONS = [
  { value: "", label: "Tất cả khu vực" },
  { value: "Dương Đông", label: "Dương Đông" },
  { value: "An Thới", label: "An Thới" },
  { value: "Gành Dầu", label: "Gành Dầu" },
  { value: "Bắc Đảo", label: "Bắc Đảo" },
  { value: "Bãi Trường", label: "Bãi Trường" },
  { value: "Dương Tơ", label: "Dương Tơ" },
  { value: "Hàm Ninh", label: "Hàm Ninh" },
  { value: "Cửa Cạn", label: "Cửa Cạn" },
  { value: "Bãi Dài", label: "Bãi Dài" },
];

// Danh sách các ngành nghề phổ biến phục vụ lựa chọn ngành nhanh
const INDUSTRIES = [
  { value: "", label: "Tất cả ngành" },
  { value: "Khách sạn & Resort", label: "Khách sạn & Resort" },
  { value: "Nhà hàng & F&B", label: "Nhà hàng & F&B" },
  { value: "Du lịch & Lữ hành", label: "Du lịch & Lữ hành" },
  { value: "Bán lẻ & Dịch vụ", label: "Bán lẻ & Dịch vụ" },
  { value: "IT & Công nghệ", label: "IT & Công nghệ" },
  { value: "Xây dựng", label: "Xây dựng" },
  { value: "Y tế & Spa", label: "Y tế & Spa" },
];

export default function JobsHero({ totalJobs, onSearch }: JobsHeroProps) {
  // Quản lý trạng thái nhập liệu của từ khóa, khu vực và ngành nghề
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");

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
              onChange={(e) => setLocation(e.target.value)}
              id="search-location"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value} className="dark:bg-[#0d2137]">
                  {loc.label}
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
              onChange={(e) => setIndustry(e.target.value)}
              id="search-industry"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value} className="dark:bg-[#0d2137]">
                  {ind.label}
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
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleQuickTag(tag)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition-colors border border-white/30 cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
