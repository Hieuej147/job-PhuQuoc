'use client';

/**
 * @file RelatedJobs.tsx
 * @description Component hiển thị danh sách các việc làm tương tự hoặc liên quan ở chân trang chi tiết.
 * 
 * Chức năng:
 * - Nhận danh sách các công việc tương đồng từ trang chi tiết (do hook tính toán tìm cùng ngành nghề/địa điểm).
 * - Render tối đa 3 thẻ việc làm rút gọn chứa Logo chữ viết tắt, tiêu đề, tên công ty và các badge đặc trưng.
 * - Nhấp chuột vào thẻ sẽ điều hướng thẳng sang trang chi tiết công việc đó.
 */

import Link from 'next/link';
import { History, MapPin, Briefcase, DollarSign } from 'lucide-react';
import { RelatedJobType } from '@/types/job';

// Cấu hình prop đầu vào của component RelatedJobs
interface RelatedJobsProps {
  jobs: RelatedJobType[]; // Mảng các công việc liên quan rút gọn
}

export default function RelatedJobs({ jobs }: RelatedJobsProps) {
  // Tránh render tiêu đề nếu không tìm thấy bất kỳ công việc liên quan nào
  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 animate-fadeUp">
      
      {/* Tiêu đề mục Việc làm tương tự */}
      <h2 className="text-lg font-bold text-[#005a71] dark:text-[#67e8f9] mb-6 flex items-center gap-2">
        <History className="w-5 h-5 text-[#005a71] dark:text-[#67e8f9]" />
        Việc làm tương tự
      </h2>

      {/* Lưới hiển thị các thẻ công việc (3 cột trên màn hình rộng) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.slug}`}
            className="group bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-5 block hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            {/* Hàng trên: Logo, Tiêu đề, Công ty */}
            <div className="flex items-center gap-3 mb-3">
              {/* Logo viết tắt */}
              <div className="w-10 h-10 bg-gray-50 dark:bg-[#071a2b] rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border border-gray-100 dark:border-[#1a3d5c]">
                <span className={job.logoTextColor}>{job.companyInitials}</span>
              </div>
              <div className="min-w-0">
                {/* Tiêu đề công việc với hiệu ứng đổi màu hover */}
                <p className="font-bold text-sm text-gray-800 dark:text-[#f8fafc] group-hover:text-[#005a71] dark:group-hover:text-[#67e8f9] transition-colors line-clamp-1">
                  {job.title}
                </p>
                {/* Tên doanh nghiệp */}
                <p className="text-xs text-gray-400 dark:text-[#cbd5e1] mt-0.5">{job.company}</p>
              </div>
            </div>

            {/* Hàng dưới: Các nhãn badge đặc trưng rút gọn */}
            <div className="flex flex-wrap gap-2 text-xs">
              {/* Loại hợp đồng */}
              <span className="bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2dd4bf] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#0D9488] dark:text-[#2dd4bf]" />
                {job.contractType}
              </span>
              {/* Mức lương */}
              <span className="bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2dd4bf] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#0D9488] dark:text-[#2dd4bf]" />
                {job.salary}
              </span>
              {/* Vị trí địa lý */}
              <span className="bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2dd4bf] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0D9488] dark:text-[#2dd4bf]" />
                {job.location}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
