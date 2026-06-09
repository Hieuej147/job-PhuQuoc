import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về PQJobs | Nền Tảng Tuyển Dụng Phú Quốc",
  description: "PQJobs là nền tảng kết nối ứng viên và nhà tuyển dụng hàng đầu tại đảo ngọc Phú Quốc.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] text-slate-800 dark:text-[#e0f2fe] transition-colors">
      <section className="bg-gradient-to-r from-[#0E7490] to-[#0D9488] py-16 text-white text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Về PQJobs</h1>
        <p className="text-lg opacity-90">Nền tảng tuyển dụng hàng đầu tại đảo ngọc Phú Quốc</p>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-xl bg-white dark:bg-[#0F3347] shadow-sm">
            <p className="text-3xl font-bold text-[#0E7490] dark:text-[#67e8f9]">1,200+</p>
            <p className="text-sm text-gray-500">Việc làm</p>
          </div>
          <div className="p-6 rounded-xl bg-white dark:bg-[#0F3347] shadow-sm">
            <p className="text-3xl font-bold text-[#0E7490] dark:text-[#67e8f9]">300+</p>
            <p className="text-sm text-gray-500">Công ty</p>
          </div>
          <div className="p-6 rounded-xl bg-white dark:bg-[#0F3347] shadow-sm">
            <p className="text-3xl font-bold text-[#0E7490] dark:text-[#67e8f9]">5,000+</p>
            <p className="text-sm text-gray-500">Ứng viên</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h2>Sứ mệnh</h2>
          <p>
            PQJobs được xây dựng với sứ mệnh kết nối nguồn nhân lực chất lượng cao với các doanh nghiệp
            tại Phú Quốc — hòn đảo du lịch hàng đầu Việt Nam.
          </p>

          <h2>Giá trị cốt lõi</h2>
          <ul>
            <li><strong>Minh bạch:</strong> Thông tin tuyển dụng rõ ràng, đáng tin cậy</li>
            <li><strong>Hiệu quả:</strong> Kết nối nhanh chóng giữa ứng viên và nhà tuyển dụng</li>
            <li><strong>Chuyên nghiệp:</strong> Trải nghiệm tuyển dụng hiện đại, thân thiện</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
