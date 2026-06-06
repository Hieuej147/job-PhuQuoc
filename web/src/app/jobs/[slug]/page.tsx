"use client";

/**
 * @file page.tsx (JobDetailPage)
 * @description Trang chi tiết việc làm của hệ thống PQJobs.
 * Chức năng:
 * 1. Hiển thị banner chi tiết công việc gồm tiêu đề, logo, nút lưu tin, hạn nộp.
 * 2. Hiển thị tiến trình thời gian nộp hồ sơ (JobDeadlineBar).
 * 3. Hiển thị mô tả công việc (JobDescription), yêu cầu ứng viên (JobRequirements), quyền lợi (JobBenefits), và các bước hướng dẫn (JobApplySteps).
 * 4. Cung cấp các thanh bên phải (Sidebar) hỗ trợ nộp đơn nhanh, tổng quan công việc, thông tin công ty tuyển dụng và chia sẻ lên mạng xã hội.
 * 5. Hiển thị các công việc tương tự ở cuối trang (RelatedJobs).
 * 6. Hiển thị thanh nộp đơn cố định dưới cùng màn hình trên thiết bị di động (JobStickyBarMobile).
 *
 * DỮ LIỆU ĐẦU VÀO (INPUT):
 * - URL Parameter `id`: Lấy ID của công việc từ URL động `/jobs/[id]`.
 * - Gọi hook `useJobDetail(id)` để lấy thông tin chi tiết và tính toán liên quan.
 *
 * DỮ LIỆU ĐẦU RA / THAO TÁC (OUTPUT / ACTIONS):
 * - Khi click Ứng tuyển: Gọi hàm `handleApply` hiển thị thông báo.
 * - Khi click Lưu việc làm: Đồng bộ trạng thái lưu tin thông qua `toggleSave`.
 */

import { use } from "react";
// Import hook xử lý chi tiết công việc
import { useJobDetail } from "@/hooks/useJobDetail";
import { OverviewItem } from "@/types/job";
import { Briefcase } from "lucide-react";

import JobDetailHero from "@/components/jobs/JobDetailHero";
import {
  JobDescription,
  JobRequirements,
  JobBenefits,
  JobApplySteps,
} from "@/components/jobs/JobContent";
import {
  JobApplySidebar,
  JobOverviewSidebar,
  JobCompanySidebar,
  JobShareSidebar,
} from "@/components/jobs/JobDetailSidebar";
import RelatedJobs from "@/components/jobs/RelatedJobs";
import JobStickyBarMobile from "@/components/jobs/JobStickyBarMobile";

interface PageProps {
  // params là một Promise chứa thuộc tính slug trong App Router động
  params: Promise<{ slug: string }>;
}

export default function JobDetailPage({ params }: PageProps) {
  // Giải nén Promise params bằng hàm `use` của React để lấy giá trị slug công việc
  const { slug } = use(params);

  // Gọi custom hook để lấy toàn bộ dữ liệu chi tiết công việc tương ứng
  const { job, relatedJobs, isSaved, toggleSave, deadlinePercent } =
    useJobDetail(slug);

  // Trường hợp không tìm thấy công việc (ID sai hoặc công việc không còn tồn tại)
  if (!job) {
    return (
      <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] flex items-center justify-center transition-colors duration-200">
        <div className="text-center p-6">
          <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-650 mx-auto mb-4 stroke-[1.5]" />
          <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
            Không tìm thấy việc làm
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm">
            Việc làm này có thể đã hết hạn hoặc không tồn tại trên hệ thống.
          </p>
          <a
            href="/jobs"
            className="inline-block bg-[#0E7490] hover:bg-[#005a71] dark:bg-[#67e8f9] dark:hover:bg-[#22d3ee] text-white dark:text-[#071a2b] font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-md"
          >
            Quay lại danh sách
          </a>
        </div>
      </div>
    );
  }

  // Xây dựng mảng dữ liệu tổng quan công việc để truyền vào thanh bên JobOverviewSidebar
  const overviewItems: OverviewItem[] = [
    {
      icon: "work",
      iconColor: "text-[#005a71]",
      bgColor: "bg-[#005a71]/10",
      label: "Loại hình",
      value: job.contractType,
    },
    {
      icon: "payments",
      iconColor: "text-[#0d9488]",
      bgColor: "bg-[#0d9488]/10",
      label: "Mức lương",
      value: job.salary,
    },
    {
      icon: "timeline",
      iconColor: "text-[#D97706]",
      bgColor: "bg-[#F59E0B]/10",
      label: "Kinh nghiệm",
      value: job.experience,
    },
    {
      icon: "leaderboard",
      iconColor: "text-[#8b5cf6]",
      bgColor: "bg-[#8b5cf6]/10",
      label: "Cấp bậc",
      value: job.level || "Chưa cập nhật",
    },
    {
      icon: "location_on",
      iconColor: "text-[#0ea5e9]",
      bgColor: "bg-[#0ea5e9]/10",
      label: "Địa điểm",
      value: job.location,
    },
    {
      icon: "calendar_today",
      iconColor: "text-red-500",
      bgColor: "bg-red-100",
      label: "Hạn nộp",
      value: new Date(job.deadline).toLocaleDateString("vi-VN"),
      valueColor: "text-red-500",
    },
    {
      icon: "people",
      iconColor: "text-[#0d9488]",
      bgColor: "bg-[#0d9488]/10",
      label: "Số lượng",
      value: `${job.totalSlots} người`,
    },
  ];

  /**
   * Hàm xử lý khi ứng viên click nút ứng tuyển công việc.
   * Hiện tại do chưa có API thật nên sẽ hiển thị thông báo alert nhắc nhở.
   */
  const handleApply = () => {
    alert("Chức năng ứng tuyển sẽ được cập nhật khi tích hợp API chính thức!");
  };

  return (
    // Thêm pb-24 trên màn hình nhỏ để chừa chỗ trống cho thanh StickyBar di động dưới cùng
    <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] text-slate-800 dark:text-[#e0f2fe] pb-24 md:pb-0 transition-colors duration-200">
      {/* 1. Phần Banner Hero hiển thị thông tin chung công việc ở trên cùng */}
      <JobDetailHero
        job={job}
        onBookmark={toggleSave}
        isBookmarked={isSaved}
        deadlinePercent={deadlinePercent}
      />

      {/* 2. Phần nội dung chính (Grid Layout) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI (Chiếm 2/3 không gian màn hình lớn) - Hiển thị chi tiết nội dung */}
          <div className="lg:col-span-2 space-y-5">
            {/* Chi tiết mô tả công việc */}
            <JobDescription description={job.description} />
            {/* Các yêu cầu bắt buộc và ưu tiên */}
            <JobRequirements
              required={job.required}
              preferred={job.preferred}
            />
            {/* Các phúc lợi và chế độ đãi ngộ */}
            <JobBenefits benefits={job.benefits} />
            {/* Hướng dẫn các bước ứng tuyển */}
            <JobApplySteps />
          </div>

          {/* CỘT PHẢI (Chiếm 1/3 không gian màn hình lớn) - Thanh bên chứa các Widget tiện ích */}
          <div className="space-y-5">
            {/* Sidebar nút Nộp đơn & Lưu việc làm nhanh */}
            <JobApplySidebar
              onApply={handleApply}
              onSave={toggleSave}
              isSaved={isSaved}
            />
            {/* Sidebar tóm tắt các thuộc tính tổng quan công việc */}
            <JobOverviewSidebar items={overviewItems} />
            {/* Sidebar thông tin công ty tuyển dụng */}
            <JobCompanySidebar
              companyInitials={job.companyInitials}
              textColor={job.textColor}
              companyName={job.company}
              industry={job.companyIndustry}
              size={job.companySize}
              address={job.companyAddress}
              website={job.companyWebsite}
            />
            {/* Sidebar hỗ trợ chia sẻ tin lên các mạng xã hội */}
            <JobShareSidebar jobTitle={job.title} />
          </div>
        </div>

        {/* 3. Danh sách các việc làm liên quan được hiển thị dưới cùng */}
        <RelatedJobs jobs={relatedJobs} />
      </div>

      {/* 4. Thanh hành động nộp đơn bám dính dưới màn hình điện thoại di động */}
      <JobStickyBarMobile
        onApply={handleApply}
        onBookmark={toggleSave}
        isBookmarked={isSaved}
      />
    </div>
  );
}
