import React from 'react';
import { Search, MapPin, Briefcase, Building, Users, Bell, ChevronDown, ChevronRight, Target, Zap } from 'lucide-react';
import Header from '@/components/candidate/Header';
import Footer from '@/components/candidate/Footer';
import Link from 'next/link';
import { mockWards, mockCategories, mockHomeJobs, mockHomeBlogs } from '@/mocks/mockData';
import JobCard from '@/components/candidate/JobCard';
import BlogCard from '@/components/candidate/BlogCard';
import { Metadata } from 'next';

// 1. THẺ META SEO CHO TRANG CHỦ TUYỂN DỤNG
export const metadata: Metadata = {
  title: 'PQJobs | Tuyển Dụng & Việc Làm Phú Quốc Lương Cao 2026',
  description: 'Nền tảng tìm việc làm hàng đầu tại đảo ngọc Phú Quốc. Hàng trăm việc làm resort 5 sao, nhà hàng, F&B, khách sạn du lịch tuyển dụng nhanh, ứng tuyển dễ dàng.',
  alternates: {
    canonical: 'https://pqjobs.vn/Candidate',
  },
  openGraph: {
    title: 'PQJobs | Tuyển Dụng & Việc Làm Phú Quốc Lương Cao 2026',
    description: 'Nền tảng tìm việc làm hàng đầu tại Phú Quốc. Resort, khách sạn, nhà hàng tuyển dụng liên tục.',
    url: 'https://pqjobs.vn/Candidate',
    siteName: 'PQJobs Phú Quốc',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540206395-68808572332f?w=1200',
        width: 1200,
        height: 630,
        alt: 'PQJobs Phú Quốc',
      },
    ],
    type: 'website',
  },
};

export default function HomePage() {
  // Cấu trúc dữ liệu Schema cho Trang Chủ Tuyển Dụng (Organization & WebSite)
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://pqjobs.vn/#organization',
        'name': 'PQJobs Phú Quốc',
        'url': 'https://pqjobs.vn',
        'logo': 'https://pqjobs.vn/logo.png',
        'description': 'Nền tảng kết nối ứng viên và nhà tuyển dụng hàng đầu tại đảo ngọc Phú Quốc.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://pqjobs.vn/#website',
        'url': 'https://pqjobs.vn',
        'name': 'PQJobs',
        'publisher': { '@id': 'https://pqjobs.vn/#organization' },
      },
      {
        '@type': 'CollectionPage',
        '@id': 'https://pqjobs.vn/Candidate/#webpage',
        'url': 'https://pqjobs.vn/Candidate',
        'name': 'Trang tuyển dụng ứng viên Phú Quốc',
        'isPartOf': { '@id': 'https://pqjobs.vn/#website' },
        'description': 'Cổng tìm kiếm cơ hội việc làm resort, khách sạn hàng đầu tại Phú Quốc.',
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#fff] flex flex-col font-sans antialiased text-slate-800">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

      {/* SCHEMA MARKUP CHO GOOGLE */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* HEADER */}
      <Header />

      {/* HERO SECTION */}
      <section
        className="relative bg-cover bg-center bg-no-repeat pt-16 pb-14 flex flex-col items-center justify-center text-center px-4"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.45)), url('https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1200')`
        }}
      >
        <div className="max-w-4xl mx-auto z-10 w-full">
          <h1 className="text-[24px] md:text-[36px] font-extrabold text-white tracking-tight leading-tight">
            Tìm việc làm tại đảo ngọc Phú Quốc
          </h1>
          <p className="text-white/80 text-[12px] md:text-[14px] mt-2 mb-8 font-normal">
            Hàng trăm cơ hội tại resort, nhà hàng, du lịch & nhiều lĩnh vực khác
          </p>

          {/* Ô Tìm kiếm tương thích Mobile */}
          <div className="bg-white p-1.5 rounded-2xl md:rounded-full shadow-xl flex flex-col md:flex-row items-stretch md:items-center max-w-3xl mx-auto border border-white/10 gap-2 md:gap-0">
            <div className="flex items-center gap-2 pl-4 pr-2 py-2 md:py-1 flex-grow border-b md:border-b-0 md:border-r border-slate-100 md:border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="text" placeholder="Tên công việc, kỹ năng..." className="w-full text-[13px] text-slate-700 outline-none bg-transparent" />
            </div>

            {/* Thẻ select lấy dữ liệu từ mockWards */}
            <div className="flex items-center gap-1.5 px-4 py-2 md:py-1 shrink-0 text-slate-500 md:min-w-[180px] relative border-b md:border-b-0 md:border-r border-slate-100 md:border-slate-200">
              <MapPin className="w-4 h-4 text-slate-400 pointer-events-none absolute left-4" />
              <select
                className="w-full bg-transparent pl-6 pr-6 py-1 text-[13px] text-slate-700 outline-none appearance-none cursor-pointer font-medium"
                defaultValue=""
              >
                <option value="" disabled hidden>Khu vực</option>
                <option value="all">Tất cả khu vực</option>
                {mockWards.map((ward) => (
                  <option key={ward.id} value={ward.slug}>{ward.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-4" />
            </div>

            <button className="bg-[#f59e0b] hover:bg-[#d97706] text-white text-[13px] font-bold px-6 py-3 md:py-2.5 rounded-xl md:rounded-full transition-colors flex items-center justify-center gap-1.5 shrink-0">
              <Search className="w-3.5 h-3.5" />
              Tìm kiếm
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mt-8">
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-[11px] font-medium">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>1,200+ Việc làm</span>
            </div>
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-[11px] font-medium">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>300+ Công ty</span>
            </div>
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-[11px] font-medium">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>5,000+ Ứng viên</span>
            </div>
          </div>
        </div>
      </section>

      {/* KHÁM PHÁ THEO NGÀNH NGHỀ */}
      <section className="bg-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-[22px] font-bold text-[#025a70]">Khám phá theo ngành nghề</h2>
            <p className="text-slate-500 text-[13px] mt-1.5">Tìm kiếm cơ hội phù hợp nhất với kỹ năng và đam mê của bạn tại Phú Quốc.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {mockCategories.map((cat) => (
              <a
                key={cat.id}
                href="#"
                className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E0F5FB] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 bg-[#0891b2]/10 group-hover:bg-[#0891b2]/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <span className="material-symbols-outlined text-[#0891b2] text-[2.25rem]">
                    {cat.icon}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-[13px] sm:text-[14px] mb-1 line-clamp-1">{cat.name}</h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* VIỆC LÀM NỔI BẬT HÔM NAY */}
      <section className="bg-white pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-[22px] font-bold text-[#025a70]">Việc làm nổi bật hôm nay</h2>
              <p className="text-slate-400 text-[12px] mt-1">Cơ hội tốt nhất vừa được cập nhật</p>
            </div>
            <a href="#" className="text-[12px] font-bold text-[#0891b2] hover:underline flex items-center gap-0.5">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Vòng lặp Job */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mockHomeJobs.map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </div>
        </div>
      </section>

      {/* BANNER TÍNH NĂNG 3 CỘT */}
      <section className="bg-gradient-to-r from-[#0f766e] via-[#0d9488] to-[#0891b2] py-10 px-6 text-white text-center md:text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-amber-300" />
            </div>
            <h4 className="font-bold text-[15px]">Việc làm địa phương chính xác</h4>
            <p className="text-teal-50/70 text-[11px] mt-1.5 leading-relaxed">Hệ thống tập trung 100% vào thị trường việc làm tại Phú Quốc, mang đến cơ hội sát thực tế nhất.</p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <h4 className="font-bold text-[15px]">Ứng tuyển nhanh trong 1 phút</h4>
            <p className="text-teal-50/70 text-[11px] mt-1.5 leading-relaxed">Tạo hồ sơ trực tuyến đơn giản và gửi đến nhà tuyển dụng chỉ với một cú click chuột.</p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <h4 className="font-bold text-[15px]">Thông báo việc làm mới</h4>
            <p className="text-teal-50/70 text-[11px] mt-1.5 leading-relaxed">Nhận thông báo ngay lập tức qua email/Zalo khi có công việc phù hợp với tiêu chí của bạn.</p>
          </div>
        </div>
      </section>

      {/* CẨM NANG NGHỀ NGHIỆP - ĐÃ SỬA TRUYỀN PROPS TƯỜNG MINH BỎ VIEWS */}
      <section className="bg-[#f8fafc] py-14 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-[22px] font-bold text-[#025a70]">Cẩm nang nghề nghiệp</h2>
              <p className="text-slate-400 text-[12px] mt-1">Kinh nghiệm, bí quyết xin việc tại Phú Quốc</p>
            </div>
            <a href="/blog" className="text-[12px] font-bold text-[#0891b2] hover:underline flex items-center gap-0.5">
              Xem tất cả bài viết <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockHomeBlogs.map((item) => (
                <BlogCard
                  key={item.id}
                  blog={{
                    ...item,
                    // Ép kiểu views thành string trực tiếp trong object để dập tắt lỗi TypeScript
                    views: String(item.views)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}