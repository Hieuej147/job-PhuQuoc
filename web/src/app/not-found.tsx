import Link from "next/link";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-6">
          <span className="text-6xl animate-bounce">🏝️</span>
          <h1 className="text-5xl font-black text-[#025a70] tracking-tight">
            404
          </h1>
          <h2 className="text-lg font-bold text-slate-800 -mt-2">
            Không tìm thấy trang yêu cầu
          </h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Có vẻ đường dẫn bạn đang truy cập đã bị thay đổi, xóa bỏ hoặc không
            có thực trên bản đồ việc làm Phú Quốc (PQJobs).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/"
              className="flex-1 text-center py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              Trang tuyển dụng
            </Link>
            <Link
              href="/blog"
              className="flex-1 text-center py-2.5 bg-[#0891b2] hover:bg-[#025a70] text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              Xem cẩm nang blog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
