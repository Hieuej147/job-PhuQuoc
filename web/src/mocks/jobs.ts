/**
 * @file jobs.ts
 * @description Dữ liệu giả lập (mock data) cho danh sách công việc trên hệ thống PQJobs.
 * Mỗi công việc chứa các thông tin tổng quan phục vụ việc tìm kiếm, lọc, và hiển thị thẻ công việc.
 */

import { JobType } from '@/types/job';

/**
 * Danh sách các công việc mẫu giả định.
 * Các trường dữ liệu được thiết kế tương thích với kiểu JobType:
 * - id: Mã định danh duy nhất của công việc
 * - title: Tiêu đề công việc
 * - company: Tên công ty tuyển dụng
 * - companyInitials: Hai chữ cái đầu của công ty (dùng hiển thị logo dạng chữ nếu không có hình)
 * - logoColor: Lớp màu nền Tailwind cho khung logo
 * - textColor: Lớp màu chữ Tailwind cho chữ viết tắt logo
 * - contractType: Loại hình hợp đồng (Full-time, Part-time, Remote, Thực tập, Hợp đồng)
 * - salary: Khoảng lương hiển thị dạng chuỗi
 * - experience: Yêu cầu kinh nghiệm
 * - level: Cấp bậc công việc (Nhân viên, Chuyên viên, Quản lý,...)
 * - industry: Ngành nghề tuyển dụng
 * - location: Địa điểm làm việc (phường/xã tại Phú Quốc)
 * - isFeatured: Đánh dấu công việc nổi bật (được gắn sao và hiển thị lên đầu)
 * - isUrgent: Đánh dấu tuyển gấp (hiển thị tag cảnh báo gấp)
 * - daysLeft: Số ngày còn lại để ứng tuyển
 * - postedDate: Ngày đăng tin (định dạng ISO String)
 * - tags: Các từ khóa tìm kiếm nhanh liên quan đến công việc
 */
export const mockJobs: JobType[] = [
  {
    id: 'job-001',
    title: 'Quản Lý Tiền Sảnh (Front Office Manager)',
    company: 'Vinpearl Resort & Spa Phú Quốc',
    companyInitials: 'VR',
    logoColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    contractType: 'Full-time',
    salary: '15 - 25 triệu',
    experience: '3 - 5 năm',
    level: 'Quản lý',
    industry: 'Khách sạn & Resort',
    location: 'Gành Dầu',
    isFeatured: true,
    isUrgent: true,
    daysLeft: 12,
    postedDate: '2026-06-01T08:00:00Z',
    tags: ['Lễ tân', 'Tiền sảnh', 'Vinpearl', 'Quản lý']
  },
  {
    id: 'job-002',
    title: 'Bếp Trưởng (Head Chef) Nhà Hàng Hải Sản',
    company: 'Sunset Sanato Beach Club Phú Quốc',
    companyInitials: 'SS',
    logoColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    contractType: 'Full-time',
    salary: '20 - 30 triệu',
    experience: 'Trên 5 năm',
    level: 'Trưởng nhóm',
    industry: 'Nhà hàng & F&B',
    location: 'Dương Tơ',
    isFeatured: true,
    isUrgent: false,
    daysLeft: 7,
    postedDate: '2026-05-28T09:30:00Z',
    tags: ['Đầu bếp', 'Hải sản', 'Sunset', 'Bếp trưởng']
  },
  {
    id: 'job-003',
    title: 'Chuyên Viên Marketing Du Lịch',
    company: 'Saigontourist Phú Quốc Branch',
    companyInitials: 'SG',
    logoColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    contractType: 'Full-time',
    salary: '10 - 15 triệu',
    experience: '1 - 3 năm',
    level: 'Chuyên viên',
    industry: 'Du lịch & Lữ hành',
    location: 'Dương Đông',
    isFeatured: false,
    isUrgent: false,
    daysLeft: 20,
    postedDate: '2026-05-15T08:00:00Z',
    tags: ['Marketing', 'Tour', 'Quảng cáo', 'Saigontourist']
  },
  {
    id: 'job-004',
    title: 'Nhân Viên Lễ Tân (Front Desk Agent)',
    company: 'Premier Village Phú Quốc Resort',
    companyInitials: 'PH',
    logoColor: 'bg-sky-100',
    textColor: 'text-sky-700',
    contractType: 'Full-time',
    salary: '7 - 10 triệu',
    experience: 'Chưa có KN',
    level: 'Nhân viên',
    industry: 'Khách sạn & Resort',
    location: 'Bãi Trường',
    isFeatured: false,
    isUrgent: true,
    daysLeft: 3,
    postedDate: '2026-06-01T10:00:00Z',
    tags: ['Lễ tân', 'Front Desk', 'Resort', 'Giao tiếp']
  },
  {
    id: 'job-005',
    title: 'Hướng Dẫn Viên Du Lịch (Tour Guide)',
    company: 'InterContinental Phu Quoc Long Beach',
    companyInitials: 'IH',
    logoColor: 'bg-violet-100',
    textColor: 'text-violet-700',
    contractType: 'Part-time',
    salary: '8 - 12 triệu',
    experience: 'Dưới 1 năm',
    level: 'Nhân viên',
    industry: 'Du lịch & Lữ hành',
    location: 'Bãi Dài',
    isFeatured: false,
    isUrgent: false,
    daysLeft: 15,
    postedDate: '2026-05-20T14:30:00Z',
    tags: ['Tour Guide', 'Tiếng Anh', 'Dẫn đoàn', 'Part-time']
  },
  {
    id: 'job-006',
    title: 'Kế Toán Tổng Hợp',
    company: 'Phú Quốc Pearl Resort & Spa',
    companyInitials: 'PQ',
    logoColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    contractType: 'Full-time',
    salary: '12 - 18 triệu',
    experience: '1 - 3 năm',
    level: 'Chuyên viên',
    industry: 'Khách sạn & Resort',
    location: 'Dương Đông',
    isFeatured: false,
    isUrgent: false,
    daysLeft: 25,
    postedDate: '2026-05-25T11:00:00Z',
    tags: ['Kế toán', 'Tài chính', 'Thuế', 'Resort']
  }
];
