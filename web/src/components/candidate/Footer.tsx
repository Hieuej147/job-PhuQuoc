import { Globe, Link2 } from "lucide-react";

export default function Footer(){
    return (
      <footer className="bg-[#e6f0fa] text-slate-600 text-[12px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
            <div className="flex items-center gap-0.5 text-[18px] font-black">
              <span className="text-[#f59e0b]">PQ</span>
              <span className="text-[#0891b2]">Jobs</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Nền tảng tuyển dụng chuyên biệt dành riêng cho đảo ngọc Phú Quốc. Kết nối nhân tài với cơ hội tốt nhất.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-[26px] h-[26px] rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 cursor-pointer text-slate-500 hover:text-[#0891b2] transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="w-[26px] h-[26px] rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 cursor-pointer text-slate-500 hover:text-[#0891b2] transition-colors">
                <Link2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-bold text-[#025a70] mb-3 text-[13px]">Về PQJobs</h5>
            <ul className="space-y-2 text-slate-500 text-[12px]">
              <li className="hover:text-[#0891b2] cursor-pointer">Giới thiệu</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Liên hệ</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Bảo mật thông tin</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Quy định sử dụng</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-[#025a70] mb-3 text-[13px]">Ứng viên</h5>
            <ul className="space-y-2 text-slate-500 text-[12px]">
              <li className="hover:text-[#0891b2] cursor-pointer">Tìm việc làm</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Tạo CV online</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Công ty nổi bật</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Blog cẩm nang</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-[#025a70] mb-3 text-[13px]">Nhà tuyển dụng</h5>
            <ul className="space-y-2 text-slate-500 text-[12px]">
              <li className="hover:text-[#0891b2] cursor-pointer">Đăng tin tuyển dụng</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Tìm kiếm hồ sơ</li>
              <li className="hover:text-[#0891b2] cursor-pointer">Bảng giá dịch vụ</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-200/40 text-[11px] text-slate-400 bg-slate-100/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-auto sm:h-12 py-3 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <span>© 2026 PQ Jobs. Coastal Professional Recruitment.</span>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <span>Hotline: <strong className="text-slate-600 font-semibold">0123 456 789</strong></span>
              <span>Email: <strong className="text-slate-600 font-semibold">hi@pqjobs.vn</strong></span>
            </div>
          </div>
        </div>
      </footer>
    )
}