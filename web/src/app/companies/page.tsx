// Võ Thành Phú
"use client"

import { useScrollAnimation } from "@/hooks/useScrollAnimation"
import { useState } from "react"
import Link from "next/link"
import { mockCompanyList, industryTabs } from "@/mocks/mockCompanyData"
import CompanyCard from "@/components/company/CompanyCard"

export default function CompanyPage() {
  useScrollAnimation()
  const [activeTab, setActiveTab] = useState("")
  const [searchText, setSearchText] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = mockCompanyList.filter((c) => {
    const matchTab = activeTab === "" || c.category === activeTab
    const matchSearch =
      searchText === "" ||
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchText.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="bg-[#f7f9ff] min-h-screen">

      {/* HERO */}
      {/* HERO */}
<section className="pt-16 bg-gradient-to-br from-[#0E7490] via-[#0D9488] to-[#005a71]">
  <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
    <div className="fade-up stagger-1 text-center mb-8">
      <h1 className="text-white font-bold text-3xl md:text-4xl mb-3">
        Khám phá nhà tuyển dụng tại Phú Quốc
      </h1>
      <p className="text-white/80 text-lg max-w-xl mx-auto">
        Hơn <span className="font-bold text-[#FCD34D]">300+</span> công ty đang tuyển dụng trên đảo ngọc
      </p>
    </div>

          {/* Search bar */}
          <div className="fade-up stagger-2 bg-white rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch overflow-hidden max-w-3xl mx-auto">
            <div className="flex-1 flex items-center px-5 border-b md:border-b-0 md:border-r border-[#bec8cd]/20">
              <span className="text-[#6f787d] mr-3">🔍</span>
              <input
                className="w-full border-none outline-none text-[#001e30] bg-transparent py-4 text-sm"
                placeholder="Tên công ty, ngành nghề..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex items-center px-5 min-w-[180px]">
              <span className="text-[#6f787d] mr-3">🏷️</span>
              <select className="w-full border-none outline-none text-[#001e30] bg-transparent py-4 text-sm cursor-pointer">
                <option value="">Tất cả ngành</option>
                <option>Khách sạn & Resort</option>
                <option>Nhà hàng & F&B</option>
                <option>Du lịch & Lữ hành</option>
                <option>Y tế & Spa</option>
              </select>
            </div>
            <button className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-8 py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-w-[130px]">
              🔍 Tìm kiếm
            </button>
          </div>

          {/* Stats chips */}
          <div className="fade-up stagger-3 flex flex-wrap justify-center gap-3 mt-6">
            {[
              { icon: "🏢", text: "300+ Công ty" },
              { icon: "💼", text: "1,200+ Việc làm" },
              { icon: "🏨", text: "120+ Resort & Khách sạn" },
            ].map((chip) => (
              <div key={chip.text} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm px-4 py-2 rounded-full">
                {chip.icon} {chip.text}
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="relative h-10 -mb-1">
          <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" fill="#f7f9ff" />
          </svg>
        </div>
      </section>

      {/* MAIN */}
      <main className="bg-[#f7f9ff] max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Industry tabs */}
        <div className="fade-up stagger-4 overflow-x-auto pb-2 mb-6">
          <div className="flex gap-2 min-w-max">
            {industryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? "border-[#005a71] bg-[#005a71] text-white"
                    : "border-[#E0F5FB] bg-white text-[#3f484c] hover:border-[#005a71] hover:text-[#005a71]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort bar */}
        <div className="fade-up stagger-5 bg-white rounded-2xl border border-[#E0F5FB] px-5 py-3 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-sm text-[#3f484c]">
            Tìm thấy <strong className="text-[#005a71]">{filtered.length}</strong> công ty
          </span>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[#3f484c]">Sắp xếp:</label>
            <select className="border border-[#bec8cd]/30 rounded-lg px-3 py-2 text-sm font-semibold text-[#001e30] outline-none bg-transparent">
              <option>Nổi bật nhất</option>
              <option>Nhiều việc làm nhất</option>
              <option>Mới đăng ký</option>
              <option>A → Z</option>
            </select>
          </div>
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((company, index) => (
            <CompanyCard key={company.id} company={company} index={index} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-16 text-[#3f484c]">
              Không tìm thấy công ty nào phù hợp.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-10">
          <button className="w-10 h-10 rounded-lg border border-[#E0F5FB] bg-white flex items-center justify-center text-[#3f484c] hover:border-[#005a71] hover:text-[#005a71] transition-all">‹</button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${
                currentPage === page
                  ? "bg-[#005a71] border-[#005a71] text-white"
                  : "bg-white border-[#E0F5FB] text-[#3f484c] hover:border-[#005a71] hover:text-[#005a71]"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="text-[#3f484c] px-1">...</span>
          <button className="w-10 h-10 rounded-lg border border-[#E0F5FB] bg-white text-[#3f484c] hover:border-[#005a71] hover:text-[#005a71] transition-all text-sm flex items-center justify-center">13</button>
          <button className="w-10 h-10 rounded-lg border border-[#E0F5FB] bg-white flex items-center justify-center text-[#3f484c] hover:border-[#005a71] hover:text-[#005a71] transition-all">›</button>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-[#0E7490] to-[#0D9488] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Doanh nghiệp của bạn chưa có mặt?</h2>
            <p className="text-white/80 max-w-lg">Đăng ký miễn phí, tiếp cận hơn 5,000 ứng viên chất lượng tại Phú Quốc.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link href="/register" className="px-8 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold rounded-full transition-colors shadow-lg whitespace-nowrap text-center">
              Đăng ký công ty
            </Link>
            <Link href="#" className="px-8 py-3.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-full transition-colors border border-white/30 whitespace-nowrap text-center">
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}