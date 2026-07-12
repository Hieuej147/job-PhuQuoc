'use client';

/**
 * @file JobDetailSidebar.tsx
 * @description Component gộp phẳng hiển thị các tiện ích thanh bên (Sidebar widgets) ở trang chi tiết việc làm.
 * 
 * Các component widget thanh bên con:
 * 1. JobApplySidebar: Widget nộp đơn ứng tuyển nhanh và nút Lưu tin dán nhãn thông tin bảo mật.
 * 2. JobOverviewSidebar: Widget tổng quan thông số công việc (Loại hợp đồng, mức lương, kinh nghiệm, địa điểm, hạn nộp, số lượng tuyển).
 * 3. JobCompanySidebar: Widget tóm tắt hồ sơ công ty tuyển dụng (Tên, ngành nghề, quy mô nhân sự, địa chỉ, liên kết website).
 * 4. JobShareSidebar: Widget chia sẻ tin tuyển dụng nhanh lên mạng xã hội phổ biến (Facebook, LinkedIn, Zalo) qua các nút tròn gọn gàng.
 */

import { 
  Lock, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Award, 
  MapPin, 
  Calendar, 
  Users, 
  Building2, 
  Globe, 
  Facebook, 
  Linkedin,
  MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { OverviewItem } from '@/types/job';
import { CompanyLogo } from '@/components/company/company-logo';

// ==========================================
// COMPONENT 1: JobApplySidebar
// ==========================================

interface JobApplySidebarProps {
  onApply: () => void; // Hàm callback nộp hồ sơ ứng tuyển
  onSave: () => void; // Hàm callback lưu việc làm
  isSaved: boolean; // Trạng thái tin đã được lưu hay chưa
  isApplied?: boolean; // Trạng thái đã ứng tuyển hay chưa
}

export function JobApplySidebar({ onApply, onSave, isSaved, isApplied }: JobApplySidebarProps) {
  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-6 shadow-sm transition-colors duration-200">
      {/* Nút ứng tuyển lớn */}
      <button
        onClick={isApplied ? undefined : onApply}
        disabled={isApplied}
        id="btn-apply"
        className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg text-sm mb-3 cursor-pointer ${
          isApplied
            ? "bg-emerald-600 text-white dark:bg-emerald-700 opacity-90 cursor-not-allowed"
            : "btn-apply-pulse bg-gradient-to-r from-[#005a71] to-[#0e7490] dark:from-[#0d9488] dark:to-[#0e7490] hover:opacity-95 text-white"
        }`}
      >
        {isApplied ? "✓ Đã ứng tuyển" : "Ứng tuyển ngay"}
      </button>

      {/* Nút lưu việc làm nhanh */}
      <button
        onClick={onSave}
        id="btn-save"
        className={`w-full border font-semibold py-3 rounded-xl transition-colors text-sm cursor-pointer ${
          isSaved
            ? 'bg-[#005a71]/5 border-[#005a71] text-[#005a71] dark:bg-[#67e8f9]/10 dark:border-[#67e8f9] dark:text-[#67e8f9]'
            : 'border-[#005a71] text-[#005a71] hover:bg-[#005a71]/5 dark:border-[#67e8f9] dark:text-[#67e8f9] dark:hover:bg-[#67e8f9]/10'
        }`}
      >
        {isSaved ? '✓ Đã lưu việc làm' : 'Lưu việc làm'}
      </button>

      {/* Nhãn văn bản thông báo tính bảo mật thông tin */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-center gap-1">
        <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        Thông tin của bạn được bảo mật hoàn toàn
      </p>
    </div>
  );
}

// ==========================================
// COMPONENT 2: JobOverviewSidebar
// ==========================================

interface JobOverviewSidebarProps {
  items: OverviewItem[]; // Mảng các mục cấu hình tổng quan công việc
}

/**
 * Hàm trợ giúp điều chỉnh màu nền động phù hợp cho cả light mode và dark mode trong phần tổng quan.
 */
const getOverviewBgColor = (bgClass: string) => {
  if (bgClass.includes('bg-[#005a71]/10')) return 'bg-[#005a71]/10 dark:bg-[#005a71]/25';
  if (bgClass.includes('bg-[#0d9488]/10')) return 'bg-[#0d9488]/10 dark:bg-[#0d9488]/25';
  if (bgClass.includes('bg-[#F59E0B]/10')) return 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/25';
  if (bgClass.includes('bg-[#8b5cf6]/10')) return 'bg-[#8b5cf6]/10 dark:bg-[#8b5cf6]/25';
  if (bgClass.includes('bg-[#0ea5e9]/10')) return 'bg-[#0ea5e9]/10 dark:bg-[#0ea5e9]/25';
  if (bgClass.includes('bg-red-100')) return 'bg-red-100 dark:bg-red-950/20';
  return `${bgClass} dark:bg-[#071a2b]/60`;
};

/**
 * Hàm trợ giúp điều chỉnh màu icon phù hợp cho cả light mode và dark mode trong phần tổng quan.
 */
const getOverviewIconColor = (colorClass: string) => {
  if (colorClass.includes('text-[#005a71]')) return 'text-[#005a71] dark:text-[#67e8f9]';
  if (colorClass.includes('text-[#0d9488]')) return 'text-[#0d9488] dark:text-[#2dd4bf]';
  if (colorClass.includes('text-[#D97706]')) return 'text-[#D97706] dark:text-[#fbbf24]';
  if (colorClass.includes('text-[#8b5cf6]')) return 'text-[#8b5cf6] dark:text-[#a78bfa]';
  if (colorClass.includes('text-[#0ea5e9]')) return 'text-[#0ea5e9] dark:text-[#38bdf8]';
  if (colorClass.includes('text-red-500')) return 'text-red-500 dark:text-red-400';
  return colorClass;
};

/**
 * Hàm trợ giúp điều chỉnh màu chữ giá trị phù hợp cho cả light mode và dark mode.
 */
const getValueColor = (colorClass?: string) => {
  if (!colorClass) return 'text-gray-800 dark:text-[#f8fafc]';
  if (colorClass.includes('text-red-500')) return 'text-red-500 dark:text-red-400';
  return colorClass;
};

export function JobOverviewSidebar({ items }: JobOverviewSidebarProps) {
  // Hàm ánh xạ tên icon dạng chuỗi sang Component Lucide tương ứng
  const renderLucideIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'work':
        return <Briefcase className={className} />;
      case 'payments':
        return <DollarSign className={className} />;
      case 'timeline':
        return <TrendingUp className={className} />;
      case 'leaderboard':
        return <Award className={className} />;
      case 'location_on':
        return <MapPin className={className} />;
      case 'calendar_today':
        return <Calendar className={className} />;
      case 'people':
        return <Users className={className} />;
      default:
        return <Briefcase className={className} />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-5 shadow-sm transition-colors duration-200">
      {/* Tiêu đề widget tổng quan */}
      <h3 className="font-bold text-sm text-[#005a71] dark:text-[#67e8f9] mb-4">Tổng quan công việc</h3>
      
      {/* Danh sách các mục thống số */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-sm">
            {/* Vòng tròn nền chứa icon được map động */}
            <div className={`w-8 h-8 rounded-lg ${getOverviewBgColor(item.bgColor)} flex items-center justify-center flex-shrink-0`}>
              {renderLucideIcon(item.icon, `w-4 h-4 ${getOverviewIconColor(item.iconColor)}`)}
            </div>
            <div>
              {/* Nhãn thông số (ví dụ: Địa điểm, Hạn nộp) */}
              <p className="text-xs text-gray-400 dark:text-[#cbd5e1]">{item.label}</p>
              {/* Giá trị tương ứng */}
              <p className={`font-semibold text-sm ${getValueColor(item.valueColor)} mt-0.5`}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 3: JobCompanySidebar
// ==========================================

interface JobCompanySidebarProps {
  companyLogo?: string | null;
  companyName: string;
  companySlug?: string;
  industry: string;
  size: string;
  address: string;
  website: string;
}

export function JobCompanySidebar({
  companyLogo,
  companyName,
  companySlug,
  industry,
  size,
  address,
  website,
}: JobCompanySidebarProps) {
  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-5 shadow-sm transition-colors duration-200">
      {/* Tiêu đề về công ty */}
      <h3 className="font-bold text-sm text-[#005a71] dark:text-[#67e8f9] mb-4">Về công ty</h3>

      {/* Header thông tin công ty */}
      <div className="flex items-center gap-3 mb-4">
        <CompanyLogo
          name={companyName}
          logo={companyLogo}
          className="w-12 h-12 rounded-xl border border-gray-100 dark:border-[#1a3d5c] flex-shrink-0"
          textClassName="text-base"
        />
        <div>
          {/* Tên công ty đầy đủ */}
          <p className="font-bold text-sm text-gray-800 dark:text-[#f8fafc] line-clamp-1">{companyName}</p>
          {/* Ngành nghề hoạt động */}
          <p className="text-xs text-gray-400 dark:text-[#cbd5e1] mt-0.5">{industry}</p>
        </div>
      </div>

      {/* Danh sách thông tin nhanh công ty */}
      <div className="space-y-2 text-xs text-gray-500 dark:text-[#94a3b8]">
        {/* Quy mô nhân sự */}
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span>Quy mô: {size}</span>
        </div>
        
        {/* Địa chỉ công ty */}
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="line-clamp-2 leading-relaxed">{address}</span>
        </div>
        
        {/* Địa chỉ trang web */}
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="truncate">{website}</span>
        </div>
      </div>

      {/* Nút xem trang công ty */}
      <a
        href={companySlug ? `/companies/${companySlug}` : "#"}
        className="mt-4 w-full block text-center text-xs font-semibold text-[#005a71] dark:text-[#67e8f9] border border-[#005a71]/30 dark:border-[#67e8f9]/30 py-2.5 rounded-xl hover:bg-[#005a71]/5 dark:hover:bg-[#67e8f9]/10 transition-colors"
      >
        Xem trang công ty →
      </a>
    </div>
  );
}

// ==========================================
// COMPONENT 4: JobShareSidebar
// ==========================================

interface JobShareSidebarProps {
  jobUrl?: string; // URL liên kết trực tiếp bài tuyển dụng (nếu có, mặc định là window.location.href)
  jobTitle?: string; // Tiêu đề công việc phục vụ chia sẻ tin
}

export function JobShareSidebar({ jobUrl, jobTitle }: JobShareSidebarProps) {
  const [shareUrl, setShareUrl] = useState(jobUrl || '');
  const title = jobTitle || '';

  useEffect(() => {
    if (!jobUrl) {
      setShareUrl(window.location.href);
    }
  }, [jobUrl]);

  // Hàm chia sẻ nhanh qua Facebook
  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  // Hàm chia sẻ nhanh qua LinkedIn
  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  // Hàm chia sẻ nhanh qua Zalo
  const handleZaloShare = () => {
    const url = `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#E0F5FB] dark:border-[#1a3d5c] p-5 shadow-sm transition-colors duration-200">
      {/* Tiêu đề chia sẻ */}
      <h3 className="font-bold text-sm text-[#005a71] dark:text-[#67e8f9] mb-3">Chia sẻ tin tuyển dụng</h3>
      
      {/* Hàng nút chứa các biểu tượng vòng tròn đại diện thương hiệu sạch sẽ */}
      <div className="flex gap-3 justify-center items-center py-1">
        {/* Nút Facebook */}
        <button
          onClick={handleFacebookShare}
          className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          title="Chia sẻ qua Facebook"
        >
          <Facebook className="w-5 h-5" />
        </button>
 
        {/* Nút LinkedIn */}
        <button
          onClick={handleLinkedInShare}
          className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          title="Chia sẻ qua LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
        </button>

        {/* Nút Zalo (Sử dụng biểu tượng MessageSquare màu xanh Zalo đặc trưng) */}
        <button
          onClick={handleZaloShare}
          className="w-10 h-10 rounded-full bg-[#0068ff] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          title="Chia sẻ qua Zalo"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
