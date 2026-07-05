'use client';

/**
 * @file JobStickyBarMobile.tsx
 * @description Component thanh hành động nộp đơn bám dính ở cạnh đáy màn hình trên di động.
 * 
 * Chức năng chính:
 * - Ghim (sticky) dưới đáy màn hình trên các thiết bị di động (md:hidden) để người dùng có thể
 *   thực hiện "Ứng tuyển ngay" hoặc "Lưu việc làm" bất cứ lúc nào khi cuộn trang đọc mô tả công việc.
 * - Chứa nút Bookmark hình tròn nhỏ và nút ứng tuyển chính với biểu tượng SVG Lucide gọn đẹp.
 */

import { Bookmark, Send } from 'lucide-react';

// Cấu hình các prop truyền vào component JobStickyBarMobile
interface JobStickyBarMobileProps {
  onApply: () => void; // Hàm callback kích hoạt hành động ứng tuyển
  onBookmark: () => void; // Hàm callback kích hoạt hành động lưu tin
  isBookmarked: boolean; // Trạng thái bài tuyển dụng đã được lưu hay chưa
  isApplied?: boolean; // Trạng thái đã ứng tuyển hay chưa
}

export default function JobStickyBarMobile({ onApply, onBookmark, isBookmarked, isApplied }: JobStickyBarMobileProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#071a2b]/95 backdrop-blur-md border-t border-[#005a71]/15 dark:border-[#67e8f9]/15 py-3 px-4 md:hidden animate-fadeUp transition-colors duration-200">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        
        {/* Nút Lưu việc làm (Bookmark) */}
        <button
          onClick={onBookmark}
          id="bookmark-sticky"
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] transition-all cursor-pointer ${
            isBookmarked
              ? 'bg-[#0e7490] text-white border-[#0e7490] dark:bg-[#67e8f9] dark:text-[#071a2b] dark:border-[#67e8f9]'
              : 'border-[#0e7490] text-[#0e7490] hover:bg-[#0e7490] hover:text-white dark:border-[#67e8f9] dark:text-[#67e8f9] dark:hover:bg-[#67e8f9] dark:hover:text-[#071a2b]'
          }`}
          aria-label={isBookmarked ? 'Bỏ lưu' : 'Lưu việc làm'}
        >
          <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>

        {/* Nút Ứng tuyển ngay chính */}
        <button
          onClick={isApplied ? undefined : onApply}
          disabled={isApplied}
          className={`flex-1 font-bold py-3 rounded-xl text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            isApplied
              ? 'bg-emerald-600 dark:bg-emerald-700 text-white opacity-90 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#005a71] to-[#0e7490] dark:from-[#0d9488] dark:to-[#0e7490] text-white dark:text-[#071a2b] hover:opacity-90'
          }`}
        >
          <Send className="w-4 h-4" />
          {isApplied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
        </button>
        
      </div>
    </div>
  );
}
