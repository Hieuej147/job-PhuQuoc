"use client";

/**
 * @file JobDetailHero.tsx
 * @description Component banner đầu trang chi tiết việc làm tích hợp thanh tiến trình deadline.
 *
 * Các phân hệ giao diện chính:
 * 1. Breadcrumb: Định tuyến dẫn đường nhanh từ Trang chủ -> Việc làm -> Tên công việc (loại bỏ thông tin đóng mở ngoặc).
 * 2. Khối tiêu đề chính: Chứa tên công việc, tên công ty tuyển dụng, logo viết tắt và các nút hành động (Lưu tin, Chia sẻ).
 * 3. Hàng nhãn đặc tính nhanh: Nhãn Địa điểm, Loại hợp đồng, Mức lương, Yêu cầu kinh nghiệm, và Nhãn "HOT" nếu công việc gấp/đặc sắc.
 * 4. Hàng chỉ số phụ: Số lượt xem, Số ứng viên nộp hồ sơ, Ngày đăng tuyển, Hạn nộp hồ sơ.
 * 5. Thanh tiến độ Deadline: Hiển thị trực quan tiến trình thời hạn nộp hồ sơ bằng Glassmorphism.
 */

import Link from "next/link";
import {
  ChevronRight,
  Building2,
  Bookmark,
  Share2,
  MapPin,
  Briefcase,
  DollarSign,
  TrendingUp,
  Flame,
  Eye,
  Users,
  Clock,
  Calendar,
} from "lucide-react";
import { JobDetailType } from "@/types/job";

// Định nghĩa kiểu dữ liệu cho props của component JobDetailHero
interface JobDetailHeroProps {
  job: JobDetailType;
  onBookmark: () => void;
  isBookmarked: boolean;
}

export default function JobDetailHero({
  job,
  onBookmark,
  isBookmarked,
}: JobDetailHeroProps) {
  // Hàm trợ giúp định dạng chuỗi ngày tháng sang dạng vi-VN (DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Nền gradient rực rỡ từ xanh đậm qua xanh biển sáng dịu (#004d62 -> #0e7490 -> #0d9488) hỗ trợ dark mode */}
      <div className="bg-gradient-to-br from-[#004d62] via-[#0e7490] to-[#0d9488] dark:from-[#001b29] dark:via-[#002d3d] dark:to-[#003d38] py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 1. Breadcrumb dẫn đường */}
          <nav className="flex items-center gap-2 text-xs text-white/65 animate-fadeUp">
            <Link href="/" className="hover:text-white transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/jobs" className="hover:text-white transition-colors">
              Việc làm
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {/* Rút gọn tên công việc nếu quá dài (cắt bớt phần mô tả phụ trong dấu ngoặc) */}
            <span className="text-white">{job.title.split("(")[0].trim()}</span>
          </nav>

          {/* 2. Tiêu đề công việc, logo và các nút thao tác chính */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 animate-fadeUp animation-delay-100">
            <div className="flex items-start gap-4">
              {/* Logo công ty viết tắt với màu chữ động */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-[#0d2137] rounded-2xl flex items-center justify-center shadow-lg border border-transparent dark:border-[#1a3d5c] flex-shrink-0">
                <span className={`text-2xl font-bold ${job.textColor}`}>
                  {job.companyInitials}
                </span>
              </div>

              {/* Tiêu đề công việc & tên công ty */}
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1 leading-tight">
                  {job.title}
                </h1>
                <Link
                  href="#"
                  className="text-[#67E8F9] hover:underline font-semibold text-sm flex items-center gap-1"
                >
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </Link>
              </div>
            </div>

            {/* Các nút hành động: Lưu tin và Chia sẻ */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Nút lưu tin (Bookmark) */}
              <button
                onClick={onBookmark}
                id="bookmark-btn"
                className={`w-11 h-11 rounded-full flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                  isBookmarked
                    ? "bg-[#0e7490] text-white border-[#0e7490] dark:bg-[#67e8f9] dark:text-[#071a2b] dark:border-[#67e8f9]"
                    : "border-[#0e7490] text-[#0e7490] hover:bg-[#0e7490] hover:text-white dark:border-[#67e8f9] dark:text-[#67e8f9] dark:hover:bg-[#67e8f9] dark:hover:text-[#071a2b]"
                }`}
                aria-label={isBookmarked ? "Bỏ lưu việc làm" : "Lưu việc làm"}
              >
                <Bookmark
                  className="w-5 h-5"
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              </button>

              {/* Nút chia sẻ */}
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 text-white text-sm hover:bg-white/10 transition-colors cursor-pointer">
                <Share2 className="w-4 h-4" /> Chia sẻ
              </button>
            </div>
          </div>

          {/* 3. Danh sách các thẻ từ khóa thông tin nhanh */}
          <div className="flex flex-wrap gap-2 animate-fadeUp animation-delay-200">
            {/* Địa điểm */}
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
              <MapPin className="w-3.5 h-3.5 text-[#67E8F9]" />
              {job.location}
            </span>
            {/* Loại hợp đồng */}
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
              <Briefcase className="w-3.5 h-3.5 text-[#FCD34D]" />
              {job.contractType}
            </span>
            {/* Mức lương */}
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
              <DollarSign className="w-3.5 h-3.5 text-[#86efac]" />
              {job.salary}
            </span>
            {/* Kinh nghiệm */}
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
              <TrendingUp className="w-3.5 h-3.5 text-[#fca5a5]" />
              {job.experience}
            </span>
            {/* Nhãn HOT nếu nổi bật hoặc gấp */}
            {(job.isFeatured || job.isUrgent) && (
              <span className="flex items-center gap-1.5 bg-[#F59E0B]/85 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                <Flame className="w-3.5 h-3.5" />
                HOT
              </span>
            )}
          </div>

          {/* 4. Hàng thống kê số liệu tin tuyển dụng */}
          <div className="flex flex-wrap gap-5 text-xs text-white/65 animate-fadeUp animation-delay-300">
            {/* Số lượt xem */}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {job.views.toLocaleString("vi-VN")} lượt xem
            </span>
            {/* Số hồ sơ đã nộp */}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {job.applicants} ứng viên đã nộp đơn
            </span>
            {/* Ngày đăng tuyển */}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Đăng ngày{" "}
              {job.postedDate
                ? new Date(job.postedDate).toLocaleDateString("vi-VN")
                : "N/A"}
            </span>
            {/* Hạn tuyển dụng */}
            <span className="flex items-center gap-1 text-[#FCD34D] font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              Hạn nộp:{" "}
              {job.deadline
                ? new Date(job.deadline).toLocaleDateString("vi-VN")
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
