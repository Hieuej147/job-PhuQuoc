'use client';

/**
 * @file JobContent.tsx
 * @description Component gộp phẳng chứa toàn bộ nội dung mô tả chi tiết của công việc.
 * 
 * Các component con được định nghĩa và xuất khẩu:
 * 1. JobDescription: Hiển thị chi tiết mô tả công việc (Hỗ trợ hiển thị thẻ HTML an toàn qua dangerouslySetInnerHTML).
 * 2. JobRequirements: Yêu cầu ứng viên (phân loại rõ rệt giữa điều kiện Bắt buộc và Ưu tiên).
 * 3. JobBenefits: Chế độ đãi ngộ & Quyền lợi phúc lợi (chuyển đổi biểu tượng động từ Mock sang SVG Lucide).
 * 4. JobApplySteps: Các bước hướng dẫn nộp hồ sơ xin việc chuẩn hóa của hệ thống.
 */

import { 
  FileText, 
  CheckSquare, 
  Gift, 
  Send,
  DollarSign,
  Home,
  Utensils,
  Shield
} from 'lucide-react';
import { BenefitItem } from '@/types/job';

// ==========================================
// COMPONENT 1: JobDescription
// ==========================================

interface JobDescriptionProps {
  description: string; // Chuỗi nội dung chi tiết công việc dạng HTML
}

export function JobDescription({ description }: JobDescriptionProps) {
  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-6 shadow-sm transition-colors duration-200">
      {/* Tiêu đề mục mô tả */}
      <h2 className="font-bold text-[#005a71] dark:text-[#67e8f9] text-base mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#005a71] dark:text-[#67e8f9]" />
        Mô tả công việc
      </h2>
      
      <div className="border-t border-[#E0F5FB] dark:border-[#1a3d5c] mb-4" />
      
      {/* Hiển thị mã HTML an toàn (rich text editor output) và áp dụng style từ Tailwind Typography (prose) */}
      <div
        className="job-desc text-sm text-gray-700 dark:text-[#cbd5e1] leading-relaxed space-y-3 prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}

// ==========================================
// COMPONENT 2: JobRequirements
// ==========================================

interface JobRequirementsProps {
  required: string[]; // Mảng các điều kiện bắt buộc đối với ứng viên
  preferred: string[]; // Mảng các điều kiện ưu tiên tuyển dụng
}

export function JobRequirements({ required, preferred }: JobRequirementsProps) {
  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-6 shadow-sm transition-colors duration-200">
      {/* Tiêu đề mục yêu cầu */}
      <h2 className="font-bold text-[#005a71] dark:text-[#67e8f9] text-base mb-3 flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-[#005a71] dark:text-[#67e8f9]" />
        Yêu cầu ứng viên
      </h2>
      
      <div className="border-t border-[#E0F5FB] dark:border-[#1a3d5c] mb-4" />
      
      <div className="text-sm text-gray-700 dark:text-[#cbd5e1] leading-relaxed space-y-3">
        {/* Phân hệ các điều kiện bắt buộc */}
        {required.length > 0 && (
          <>
            <h4 className="font-bold text-[#005a71] dark:text-[#67e8f9] mt-2">Bắt buộc:</h4>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-[#005a71] dark:marker:text-[#67e8f9]">
              {required.map((item, index) => (
                <li key={`req-${index}`}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {/* Phân hệ các điều kiện ưu tiên */}
        {preferred.length > 0 && (
          <>
            <h4 className="font-bold text-[#005a71] dark:text-[#67e8f9] mt-4">Ưu tiên:</h4>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-[#005a71] dark:marker:text-[#67e8f9]">
              {preferred.map((item, index) => (
                <li key={`pref-${index}`}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 3: JobBenefits
// ==========================================

interface JobBenefitsProps {
  benefits: BenefitItem[]; // Mảng chứa thông tin các quyền lợi/phúc lợi
}

/**
 * Hàm trợ giúp ánh xạ tên icon string từ mockup dữ liệu sang Component Lucide tương ứng.
 * Giải quyết lỗi ligature Material Symbols hiển thị chữ thô.
 */
const getBenefitIcon = (iconName: string) => {
  switch (iconName) {
    case 'payments':
      return <DollarSign className="w-5 h-5" />;
    case 'home':
      return <Home className="w-5 h-5" />;
    case 'restaurant':
      return <Utensils className="w-5 h-5" />;
    case 'health_and_safety':
      return <Shield className="w-5 h-5" />;
    default:
      return <Gift className="w-5 h-5" />;
  }
};

/**
 * Hàm trợ giúp chuyển đổi class màu nền động sang biến thể dark mode tương ứng.
 */
const getBgColorClass = (bgClass: string) => {
  if (bgClass.includes('bg-[#005a71]/10')) return 'bg-[#005a71]/10 dark:bg-[#005a71]/25';
  if (bgClass.includes('bg-[#0d9488]/10')) return 'bg-[#0d9488]/10 dark:bg-[#0d9488]/25';
  if (bgClass.includes('bg-[#F59E0B]/10')) return 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/25';
  if (bgClass.includes('bg-red-50')) return 'bg-red-50 dark:bg-red-950/20';
  return `${bgClass} dark:bg-[#071a2b]/60`;
};

/**
 * Hàm trợ giúp chuyển đổi class màu sắc icon sang biến thể dark mode tương ứng.
 */
const getIconColorClass = (colorClass: string) => {
  if (colorClass.includes('text-[#005a71]')) return 'text-[#005a71] dark:text-[#67e8f9]';
  if (colorClass.includes('text-[#0d9488]')) return 'text-[#0d9488] dark:text-[#2dd4bf]';
  if (colorClass.includes('text-[#D97706]')) return 'text-[#D97706] dark:text-[#fbbf24]';
  if (colorClass.includes('text-red-500')) return 'text-red-500 dark:text-red-400';
  return colorClass;
};

export function JobBenefits({ benefits }: JobBenefitsProps) {
  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-6 shadow-sm transition-colors duration-200">
      {/* Tiêu đề mục phúc lợi */}
      <h2 className="font-bold text-[#005a71] dark:text-[#67e8f9] text-base mb-3 flex items-center gap-2">
        <Gift className="w-5 h-5 text-[#005a71] dark:text-[#67e8f9]" />
        Quyền lợi &amp; Phúc lợi
      </h2>
      
      <div className="border-t border-[#E0F5FB] dark:border-[#1a3d5c] mb-4" />
      
      {/* Lưới hiển thị các thẻ phúc lợi con */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {benefits.map((benefit, index) => (
          <div
            key={`benefit-${index}`}
            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${getBgColorClass(benefit.bgColor)}`}
          >
            {/* Render icon tương ứng đã chuyển đổi từ chuỗi */}
            <span className={`${getIconColorClass(benefit.iconColor)} flex-shrink-0 mt-0.5`}>
              {getBenefitIcon(benefit.icon)}
            </span>
            <div>
              {/* Tên quyền lợi */}
              <p className="text-xs font-bold text-gray-800 dark:text-[#f8fafc]">{benefit.title}</p>
              {/* Mô tả chi tiết quyền lợi */}
              <p className="text-xs text-gray-500 dark:text-[#94a3b8] mt-0.5">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 4: JobApplySteps
// ==========================================

export function JobApplySteps() {
  // Cấu hình danh sách các bước chuẩn bị hồ sơ ứng tuyển
  const steps = [
    { 
      num: '1', 
      color: 'bg-[#005a71] dark:bg-[#005a71]/80', 
      text: 'Đăng nhập hoặc tạo tài khoản trên PQJobs' 
    },
    { 
      num: '2', 
      color: 'bg-[#005a71] dark:bg-[#005a71]/80', 
      text: 'Chuẩn bị CV (tải lên file hoặc dùng công cụ tạo CV trực tuyến CV Builder)' 
    },
    { 
      num: '3', 
      color: 'bg-[#005a71] dark:bg-[#005a71]/80', 
      text: (
        <>Nhấn <strong>Ứng tuyển ngay</strong> và điền thư giới thiệu (tùy chọn)</>
      )
    },
    { 
      num: '✓', 
      color: 'bg-[#0d9488] dark:bg-[#0d9488]/80', 
      text: (
        <span className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold">
          Nhà tuyển dụng sẽ phản hồi trong vòng 3-5 ngày làm việc
        </span>
      )
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-6 shadow-sm transition-colors duration-200">
      {/* Tiêu đề cách thức ứng tuyển */}
      <h2 className="font-bold text-[#005a71] dark:text-[#67e8f9] text-base mb-3 flex items-center gap-2">
        <Send className="w-5 h-5 text-[#005a71] dark:text-[#67e8f9]" />
        Cách thức ứng tuyển
      </h2>
      
      <div className="border-t border-[#E0F5FB] dark:border-[#1a3d5c] mb-4" />
      
      {/* Danh sách các bước dạng danh sách số có thứ tự */}
      <ol className="space-y-3 text-sm text-gray-700 dark:text-[#cbd5e1]">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            {/* Hình tròn chứa số thứ tự bước */}
            <span className={`w-6 h-6 rounded-full ${step.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
              {step.num}
            </span>
            {/* Nội dung text tương ứng */}
            <span className="leading-relaxed">{step.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
