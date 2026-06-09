/**
 * @file layout.tsx
 * @description Layout dùng chung cho phân hệ Việc làm (Jobs).
 * Đảm nhận nhiệm vụ bọc các trang Danh sách việc làm (/jobs) và Chi tiết việc làm (/jobs/[id])
 * trong cấu trúc giao diện chung bao gồm Thanh điều hướng (Header) và Chân trang (Footer).
 */

import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import type { Metadata } from "next";

// Định nghĩa Metadata phục vụ tối ưu SEO cho toàn bộ các trang việc làm thuộc phân hệ /jobs
export const metadata: Metadata = {
  title: "Việc Làm Phú Quốc - PQ Jobs",
  description:
    "Tìm kiếm việc làm nhanh chóng, uy tín tại Phú Quốc. Nền tảng kết nối ứng viên và nhà tuyển dụng chất lượng cao tại Đảo Ngọc.",
};

export default function JobsLayout({
  children, // Các trang con (page.tsx hoặc [id]/page.tsx) được truyền vào thông qua prop children
}: {
  children: React.ReactNode;
}) {
  return (
    // Sử dụng flex-col và min-h-screen để đảm bảo Footer luôn nằm ở cuối màn hình ngay cả khi trang có ít nội dung
    <div className="flex flex-col min-h-screen">
      {/* 1. Header: Thanh menu điều hướng chính của trang web */}
      <Header />

      {/* 2. Main Content: Khu vực hiển thị nội dung động của từng trang con */}
      <main className="flex-grow">{children}</main>

      {/* 3. Footer: Chân trang hiển thị thông tin liên hệ và liên kết bản quyền */}
      <Footer />
    </div>
  );
}
