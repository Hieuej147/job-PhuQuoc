'use client';

/**
 * @file JobCard.tsx
 * @description Component thẻ hiển thị tóm tắt thông tin việc làm trong danh sách.
 * 
 * Các thẻ / Component con bên trong:
 * 1. Thẻ Nhãn Nổi bật (Featured Badge): Hiển thị ở góc trên bên trái nếu công việc thuộc dạng đặc sắc.
 * 2. Khung Logo Công ty (Company Logo): Hiển thị chữ viết tắt của tên công ty với nền màu động.
 * 3. Khối nội dung chính (Job Title & Company): Chứa tên công việc (liên kết đến trang chi tiết), tên công ty và nút Lưu tin (Bookmark).
 * 4. Hàng nhãn đặc tính (Badges / Tags): Hiển thị các thông tin nhanh như loại hợp đồng, mức lương, kinh nghiệm và nhãn "Tuyển gấp".
 * 5. Hàng thông tin phụ (Metadata / Footer): Địa điểm làm việc, số ngày còn lại để ứng tuyển và nút "Ứng tuyển" (giao diện máy tính).
 * 6. Nút Ứng tuyển di động (Mobile Apply Button): Hiển thị dưới cùng khi ở màn hình nhỏ.
 */

import Link from 'next/link';
import { Bookmark, MapPin, Clock } from 'lucide-react';
import { JobType } from '@/types/job';
import { CompanyLogo } from '@/components/company/company-logo';

// Định nghĩa kiểu dữ liệu cho các props đầu vào của component JobCard
interface JobCardProps {
  job: JobType; // Đối tượng chứa đầy đủ thông tin tóm tắt của một công việc
  onBookmark: (id: string) => void; // Hàm callback kích hoạt khi người dùng lưu/hủy lưu tin
  isBookmarked: boolean; // Trạng thái cho biết công việc hiện tại đã được lưu hay chưa
}

export default function JobCard({ job, onBookmark, isBookmarked }: JobCardProps) {
  // Xác định công việc sắp hết hạn ứng tuyển nếu số ngày còn lại nhỏ hơn hoặc bằng 3 ngày
  const isExpiring = job.daysLeft !== null && job.daysLeft <= 3;

  return (
    <div
      className="group bg-white dark:bg-[#0d2137] rounded-2xl p-5 border border-[#E0F5FB] dark:border-[#1a3d5c] shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden"
      id={`job-card-${job.id}`}
    >
      {/* Absolute overlay link covering the entire card */}
      <Link href={`/jobs/${job.slug}`} className="absolute inset-0 z-0" aria-label={`Xem chi tiết ${job.title}`} />

      {/* 1. Nhãn "NỔI BẬT" - Chỉ hiển thị khi thuộc tính isFeatured là true */}
      {job.isFeatured && (
        <div className="absolute top-0 left-0 bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1 rounded-br-xl z-10">
          ⭐ NỔI BẬT
        </div>
      )}

      {/* Căn lề padding phía trên nếu có nhãn Nổi bật để tránh bị đè chữ */}
      <div className={`flex gap-4 ${job.isFeatured ? 'pt-3' : ''}`}>

        {/* 2. Logo đại diện của công ty tuyển dụng */}
        <CompanyLogo
          name={job.company}
          logo={job.companyLogo}
          className="w-14 h-14 rounded-xl border border-gray-100 dark:border-[#1a3d5c] flex-shrink-0 shadow-sm"
          textClassName="text-xl"
        />

        {/* 3. Khối nội dung thông tin chi tiết */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              {/* Tiêu đề công việc */}
              <h3 className="job-title font-bold text-[#0C4A6E] dark:text-[#e0f2fe] text-base mb-0.5 group-hover:text-[#005a71] dark:group-hover:text-[#67e8f9] transition-colors line-clamp-2">
                {job.title}
              </h3>
              {/* Tên công ty tuyển dụng */}
              <p className="text-sm text-gray-500 dark:text-[#cbd5e1]/70">{job.company}</p>
            </div>

            {/* Nút lưu tin tuyển dụng (Bookmark) */}
            <button
              onClick={() => onBookmark(job.id)}
              className={`flex-shrink-0 p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer relative z-10 ${isBookmarked
                ? 'text-[#F59E0B] bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20'
                : 'text-gray-400 dark:text-gray-500 hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 dark:hover:bg-[#F59E0B]/20'
                }`}
              aria-label={isBookmarked ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
              id={`bookmark-${job.id}`}
            >
              <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* 4. Nhãn thông tin đặc tính (Badges / Tags) */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Loại hình hợp đồng (Full-time, Part-time...) */}
            <span className="bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2dd4bf] font-semibold px-2.5 py-1 rounded-md text-xs">
              {job.contractType}
            </span>
            {/* Mức lương của công việc */}
            <span className="bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2dd4bf] font-semibold px-2.5 py-1 rounded-md text-xs">
              {job.salary}
            </span>
            {/* Yêu cầu kinh nghiệm */}
            <span className="bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2dd4bf] font-semibold px-2.5 py-1 rounded-md text-xs">
              {job.experience}
            </span>
            {/* Cấp bậc công việc nếu có */}
            {job.level && (
              <span className="bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2dd4bf] font-semibold px-2.5 py-1 rounded-md text-xs">
                {job.level}
              </span>
            )}
            {/* Nhãn Tuyển gấp nếu có trạng thái isUrgent */}
            {job.isUrgent && (
              <span className="bg-[#F59E0B]/10 text-[#D97706] dark:bg-[#F59E0B]/20 dark:text-[#fbbf24] font-semibold px-2.5 py-1 rounded-md text-xs animate-pulse">
                🔥 Tuyển gấp
              </span>
            )}
          </div>

          {/* 5. Hàng thông tin phụ (Địa điểm, Hạn nộp) và nút Ứng tuyển máy tính */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[#94a3b8]">
              {/* Địa điểm làm việc */}
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
              {/* Số ngày còn lại (đổi màu đỏ cảnh báo nếu sắp hết hạn) */}
              {job.daysLeft !== null ? (
                <span className={`flex items-center gap-1 ${isExpiring ? 'text-red-500 dark:text-red-400 font-semibold' : ''}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {isExpiring ? `⚠️ Còn ${job.daysLeft} ngày` : `Còn ${job.daysLeft} ngày`}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Luôn tuyển dụng
                </span>
              )}
              <span>{job.applicants ?? 0} ứng viên</span>
            </div>

            {/* Nút ứng tuyển nhanh - Chỉ hiển thị trên thiết bị máy tính */}
            <Link
              href={`/jobs/${job.slug}`}
              className="hidden sm:block bg-[#005a71] dark:bg-[#0e7490] hover:bg-[#0E7490] dark:hover:bg-[#0d9488] text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors relative z-10"
              id={`apply-${job.id}`}
            >
              Ứng tuyển
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Nút Ứng tuyển di động - Chỉ hiển thị ở dưới cùng trên thiết bị màn hình nhỏ */}
      <Link
        href={`/jobs/${job.slug}`}
        className="sm:hidden mt-3 block w-full text-center bg-[#005a71] dark:bg-[#0e7490] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors hover:bg-[#0E7490] dark:hover:bg-[#0d9488] relative z-10"
      >
        Ứng tuyển ngay
      </Link>
    </div>
  );
}
