"use client";

import React, { useEffect } from 'react';
import { Search, MapPin, Briefcase, Building, Users, Bell, ChevronRight, Target, Zap } from 'lucide-react';
import Header from '@/components/candidate/Header';
import Footer from '@/components/candidate/Footer';
import Link from 'next/link';
import { mockCategories, mockHomeJobs, mockHomeBlogs } from '@/mocks/mockData';
import JobCard from '@/components/candidate/JobCard';
import BlogCard from '@/components/candidate/BlogCard';
import SearchBar from '@/components/candidate/SearchBar';

export default function HomePage() {
  // ─── Schema Markup ─────────────────────────────────────────────────────────
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://pqjobs.vn/#organization',
        name: 'PQJobs Phú Quốc',
        url: 'https://pqjobs.vn',
        logo: 'https://pqjobs.vn/logo.png',
        description: 'Nền tảng kết nối ứng viên và nhà tuyển dụng hàng đầu tại đảo ngọc Phú Quốc.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://pqjobs.vn/#website',
        url: 'https://pqjobs.vn',
        name: 'PQJobs',
        publisher: { '@id': 'https://pqjobs.vn/#organization' },
      },
      {
        '@type': 'CollectionPage',
        '@id': 'https://pqjobs.vn/#webpage',
        url: 'https://pqjobs.vn',
        name: 'Trang tuyển dụng ứng viên Phú Quốc',
        isPartOf: { '@id': 'https://pqjobs.vn/#website' },
        description: 'Cổng tìm kiếm cơ hội việc làm resort, khách sạn hàng đầu tại Phú Quốc.',
      },
    ],
  };

  // ─── Intersection Observer for Scroll Animations ─────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    document.querySelectorAll(".fade-up").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex flex-col antialiased text-slate-800">
      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />

      {/* HEADER */}
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-x-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYSU3FOe5mZrMKWgfR44oj-alWSbbAxfoAopzwGpoOarw-9SlxelIdcsiyAdR4h9GsPw8BNgmp2T3uWGwD2a8zDm3csY4PbhC_-e8Ho-zZ-joRZcT_L8YMsNAFA3GD3XTEIaH-xLV3XZqX_0vReIlroKLFM1SRDQM-z6A6MtULtKZ9-Pts-HDGmgNtdNVB1SNaikJSv7puiBuNLCwlpqa9NRrFzMA3QbSirWSZ_R7A74OH_zrHTA-TPI4us9uGOeHfyr2idHaiP_Y"
            alt="Tropical island resort view with calm ocean at sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C2231]/75 via-[#0C2231]/55 to-[#0C2231]/45" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-8 text-center mt-8">
          <h1 className="text-[28px] md:text-[48px] font-bold text-white mb-5 drop-shadow-lg leading-tight tracking-tight fade-up">
            Tìm việc làm tại đảo ngọc Phú Quốc
          </h1>
          <p className="text-[15px] md:text-[18px] font-normal text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md fade-up stagger-1">
            Hàng trăm cơ hội tại resort, nhà hàng, du lịch &amp; nhiều lĩnh vực khác
          </p>

          {/* Search bar */}
          <div className="w-full fade-up stagger-2">
            <SearchBar />
          </div>

          {/* Stats pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-white fade-up stagger-3">
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-[13px] font-medium">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>1,200+ Việc làm</span>
            </div>
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-[13px] font-medium">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>300+ Công ty</span>
            </div>
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-[13px] font-medium">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>5,000+ Ứng viên</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── NGÀNH NGHỀ ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 fade-up">
          <h2 className="text-[28px] md:text-[32px] font-bold text-[#005a71]">
            Khám phá theo ngành nghề
          </h2>
          <p className="text-slate-500 text-[15px] mt-3 max-w-2xl mx-auto">
            Tìm kiếm cơ hội phù hợp nhất với kỹ năng và đam mê của bạn tại Phú Quốc.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {mockCategories.map((cat, index) => (
            <a
              key={cat.id}
              href="#"
              className={`bg-white p-5 sm:p-6 rounded-2xl border border-[#E0F5FB]
                shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                flex flex-col items-center text-center group fade-up stagger-${(index % 4) + 1}`}
            >
              <div className="w-16 h-16 bg-[#005a71]/10 group-hover:bg-[#005a71]/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                <span className="material-symbols-outlined text-[#005a71] text-[2.25rem]">
                  {cat.icon}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-[13px] sm:text-[14px] mb-1 line-clamp-1">
                {cat.name}
              </h3>
            </a>
          ))}
        </div>
      </section>

      {/* ── VIỆC LÀM NỔI BẬT ─────────────────────────────────────────────────── */}
      <section className="py-6 pb-24 bg-[#f0f7ff] border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10 pt-10 fade-up">
            <div>
              <h2 className="text-[28px] md:text-[32px] font-bold text-[#005a71]">
                Việc làm nổi bật hôm nay
              </h2>
              <p className="text-slate-400 text-[13px] mt-1.5">Cơ hội tốt nhất vừa được cập nhật</p>
            </div>
            <a href="#" className="hidden md:flex items-center gap-1 text-[13px] font-bold text-[#005a71] hover:opacity-75 transition-opacity">
              Xem tất cả việc làm <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mockHomeJobs.map((job, index) => (
              <div key={job.id} className={`fade-up stagger-${(index % 3) + 1}`}>
                <JobCard job={job} />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden fade-up">
            <a href="#" className="inline-flex items-center gap-2 text-[#005a71] text-[13px] font-bold border border-[#005a71]/50 px-6 py-3 rounded-full hover:bg-[#005a71]/5 transition-colors">
              Xem tất cả việc làm <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── TẠI SAO CHỌN PQJOBS ──────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E7490] to-[#0D9488]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white,_transparent)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center text-white">
            <div className="fade-up stagger-1">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Target className="w-7 h-7 text-[#FCD34D]" />
              </div>
              <h3 className="text-[20px] font-bold mb-3">Việc làm địa phương chính xác</h3>
              <p className="text-white/85 text-[15px] leading-relaxed">
                Hệ thống tập trung 100% vào thị trường việc làm tại Phú Quốc, mang đến cơ hội sát thực tế nhất.
              </p>
            </div>
            <div className="fade-up stagger-2">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Zap className="w-7 h-7 text-[#FCD34D]" />
              </div>
              <h3 className="text-[20px] font-bold mb-3">Ứng tuyển nhanh trong 1 phút</h3>
              <p className="text-white/85 text-[15px] leading-relaxed">
                Tạo hồ sơ trực tuyến đơn giản và gửi đến nhà tuyển dụng chỉ với một cú click chuột.
              </p>
            </div>
            <div className="fade-up stagger-3">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Bell className="w-7 h-7 text-[#FCD34D]" />
              </div>
              <h3 className="text-[20px] font-bold mb-3">Thông báo việc làm mới</h3>
              <p className="text-white/85 text-[15px] leading-relaxed">
                Nhận thông báo ngay lập tức qua email/Zalo khi có công việc phù hợp với tiêu chí của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CẨM NANG NGHỀ NGHIỆP ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-10 fade-up">
          <div>
            <h2 className="text-[28px] md:text-[32px] font-bold text-[#005a71]">
              Cẩm nang nghề nghiệp
            </h2>
            <p className="text-slate-400 text-[13px] mt-1.5">Kinh nghiệm, bí quyết xin việc tại Phú Quốc</p>
          </div>
          <Link href="/blog" className="hidden md:flex items-center gap-1 text-[13px] font-bold text-[#005a71] hover:opacity-75 transition-opacity">
            Xem tất cả bài viết <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockHomeBlogs.map((item, index) => (
            <div key={item.id} className={`fade-up stagger-${(index % 3) + 1}`}>
              <BlogCard
                blog={{ ...item, views: String(item.views) }}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden fade-up">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[#005a71] text-[13px] font-bold border border-[#005a71]/50 px-6 py-3 rounded-full hover:bg-[#005a71]/5 transition-colors">
            Xem tất cả bài viết <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
