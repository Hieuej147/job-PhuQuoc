"use client";

/**
 * @file useJobDetail.ts
 * @description Custom hook quản lý dữ liệu và trạng thái chi tiết của một công việc cụ thể dựa trên ID.
 * Các chức năng chính:
 * 1. Tìm kiếm và truy xuất thông tin chi tiết đầy đủ của công việc từ `mockJobDetails`.
 * 2. Cung cấp cơ chế tự động tạo dữ liệu chi tiết cơ bản (fallback) nếu ID công việc chỉ tồn tại trong danh sách tóm tắt.
 * 3. Quản lý trạng thái lưu công việc (Bookmark/Save) cho trang chi tiết.
 * 4. Tính toán tỷ lệ phần trăm thời hạn nộp hồ sơ đã trôi qua để hiển thị trên thanh tiến độ (progress bar).
 * 5. Tải danh sách công việc liên quan/tương tự phục vụ gợi ý.
 *
 * DỮ LIỆU ĐẦU VÀO (INPUT):
 * - `id` (string): ID của công việc cần truy xuất chi tiết từ URL.
 *
 * DỮ LIỆU ĐẦU RA (OUTPUT):
 * - Trả về đối tượng chi tiết công việc `job`, danh sách công việc tương tự `relatedJobs`, trạng thái đã lưu `isSaved`, hàm đảo trạng thái lưu `toggleSave`, và tỷ lệ phần trăm thời hạn `deadlinePercent`.
 */

import { useMemo, useState, useCallback } from "react";
// Đổi import nguồn dữ liệu giả lập chi tiết sang thư mục mockData
import { mockJobDetails, getRelatedJobs } from "@/mocks/jobDetails";
import { mockJobs } from "@/mocks/jobs";
import { JobDetailType, RelatedJobType } from "@/types/job";

export function useJobDetail(id: string) {
  // State lưu trạng thái công việc này đã được lưu bởi người dùng hay chưa
  const [isSaved, setIsSaved] = useState(false);

  /**
   * Truy xuất và chuẩn bị thông tin chi tiết cho công việc theo ID.
   * Sử dụng `useMemo` để tính toán lại chỉ khi ID thay đổi.
   */
  const job = useMemo<JobDetailType | null>(() => {
    // Bước 1: Tìm kiếm trong danh sách chi tiết đầy đủ (mockJobDetails)
    const detail = mockJobDetails.find((item) => item.id === id);
    if (detail) {
      return detail;
    }

    // Bước 2: Cơ chế dự phòng (Fallback)
    // Nếu không tìm thấy trong danh sách chi tiết, tìm trong danh sách tổng quan (mockJobs)
    const basic = mockJobs.find((item) => item.id === id);
    if (!basic) {
      // Nếu hoàn toàn không tìm thấy công việc này ở bất kỳ đâu, trả về null
      return null;
    }

    // Tự động tạo một đối tượng dữ liệu chi tiết cơ bản từ thông tin tổng quan để tránh lỗi giao diện
    return {
      ...basic,
      views: 0,
      applicants: 0,
      startDate: basic.postedDate,
      totalSlots: 1,
      companySize: "100–500 nhân viên",
      companyWebsite: "#",
      companyIndustry: basic.industry,
      companyAddress: basic.location + ", Phú Quốc, Kiên Giang",
      description: "<p>Mô tả công việc chi tiết hiện đang được cập nhật.</p>",
      required: [
        "Yêu cầu công việc hiện đang được cập nhật từ nhà tuyển dụng.",
      ],
      preferred: [],
      benefits: [
        {
          icon: "payments",
          iconColor: "text-[#0e7490]",
          bgColor: "bg-[#0e7490]/5",
          title: "Mức lương",
          description: basic.salary,
        },
      ],
    } as JobDetailType;
  }, [id]);

  /**
   * Lấy danh sách các công việc liên quan thông qua hàm helper.
   * Danh sách này hiển thị ở dưới chân trang chi tiết công việc.
   */
  const relatedJobs = useMemo<RelatedJobType[]>(() => {
    return getRelatedJobs(id);
  }, [id]);

  /**
   * Hàm xử lý đảo trạng thái lưu công việc (Bookmark/Save).
   */
  const toggleSave = useCallback(() => {
    setIsSaved((prev) => !prev);
  }, []);

  /**
   * Tính toán tỷ lệ phần trăm thời hạn nộp hồ sơ đã trôi qua kể từ ngày đăng tuyển.
   * Kết quả nằm trong khoảng từ [0, 100] dùng để vẽ thanh tiến trình DeadlineBar.
   */
  const deadlinePercent = useMemo(() => {
    // Nếu không tìm thấy công việc, trả về 0%
    if (!job) {
      return 0;
    }

    // Đổi ngày bắt đầu, ngày hết hạn và thời gian hiện tại sang dạng mili-giây (Timestamp)
    const startTime = new Date(job.startDate).getTime();
    const endTime = new Date(job.deadline).getTime();
    const currentTime = Date.now();

    // Trường hợp 1: Thời gian hiện tại đã vượt quá hạn chót nộp đơn -> Trả về 100%
    if (currentTime >= endTime) {
      return 100;
    }

    // Trường hợp 2: Thời gian hiện tại nhỏ hơn thời gian bắt đầu (lỗi đồng hồ hệ thống) -> Trả về 0%
    if (currentTime <= startTime) {
      return 0;
    }

    // Trường hợp 3: Tính tỉ lệ phần trăm thời gian đã qua
    const timeElapsed = currentTime - startTime; // Khoảng thời gian đã trôi qua
    const totalDuration = endTime - startTime; // Tổng thời hạn cho phép nộp hồ sơ

    // Tính phần trăm và làm tròn số nguyên gần nhất
    return Math.round((timeElapsed / totalDuration) * 100);
  }, [job]);

  return {
    job, // Đối tượng thông tin công việc chi tiết
    relatedJobs, // Danh sách công việc liên quan gợi ý
    isSaved, // Trạng thái đã bookmark hay chưa
    toggleSave, // Hàm xử lý khi click nút bookmark
    deadlinePercent, // Tỷ lệ phần trăm thời hạn nộp hồ sơ
    isLoading: false, // Trạng thái đang tải dữ liệu (giả lập xong luôn)
  };
}
