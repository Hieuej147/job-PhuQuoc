// Võ Thành Phú
"use client"

import { useState } from "react"
import Link from "next/link"
import { Company } from "@/mocks/mockCompanyData"

const mockJobs = [
  { id: 1, title: "Quản Lý Tiền Sảnh (Front Office Manager)", type: "Full-time", salary: "15-25tr", location: "Gành Dầu", daysAgo: "3 ngày trước", deadline: "30/06", isHot: true },
  { id: 2, title: "Bếp Trưởng Nhà Hàng Fine Dining", type: "Full-time", salary: "Thỏa thuận", location: "Gành Dầu", daysAgo: "5 ngày trước", deadline: "15/07", isHot: false },
  { id: 3, title: "Giám Sát Spa & Wellness", type: "Full-time", salary: "12-18tr", location: "Gành Dầu", daysAgo: "1 tuần trước", deadline: "20/07", isHot: false },
  { id: 4, title: "Lễ Tân (Receptionist) - Ca Xoay", type: "Full-time", salary: "8-12tr", location: "Gành Dầu", daysAgo: "2 tuần trước", deadline: "31/07", isHot: false },
  { id: 5, title: "Nhân Viên Buồng Phòng (Housekeeping)", type: "Full-time", salary: "6-9tr", location: "Gành Dầu", daysAgo: "2 tuần trước", deadline: "10/06", isUrgent: true },
]

const mockReviews = [
  { id: 1, name: "Nguyễn Thanh H.", initials: "NT", role: "Lễ tân", duration: "2 năm làm việc", date: "Tháng 04/2026", rating: 5, comment: "Môi trường làm việc chuyên nghiệp, đồng nghiệp thân thiện. Được đào tạo bài bản và có nhiều cơ hội thăng tiến." },
  { id: 2, name: "Trần L.", initials: "TL", role: "Bếp trưởng", duration: "3 năm làm việc", date: "Tháng 02/2026", rating: 4, comment: "Công việc thú vị, được tiếp xúc với ẩm thực quốc tế. Áp lực khá cao vào mùa cao điểm nhưng thu nhập tốt." },
]

const similarCompanies = [
  { initials: "IC", name: "InterContinental Phú Quốc", jobCount: 8, color: "#005a71", slug: "intercontinental-phu-quoc" },
  { initials: "NV", name: "Novotel Phú Quốc", jobCount: 5, color: "#006a61", slug: "novotel-phu-quoc" },
  { initials: "PV", name: "Premier Village Phu Quoc", jobCount: 3, color: "#794602", slug: "premier-village-phu-quoc" },
]

const galleryItems = [
  { icon: "🏨", gradient: "linear-gradient(135deg,#0e7490,#0d9488)" },
  { icon: "🍽️", gradient: "linear-gradient(135deg,#F59E0B,#D97706)" },
  { icon: "💆", gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  { icon: "🏊", gradient: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
  { icon: "🏖️", gradient: "linear-gradient(135deg,#ec4899,#be185d)" },
  { icon: "🎭", gradient: "linear-gradient(135deg,#0d9488,#0f766e)" },
]

export default function CompanyDetailClient({ company }: { company: Company }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [following, setFollowing] = useState(false)

  const tabs = [
    { key: "overview", label: "Tổng quan" },
    { key: "jobs", label: `Việc làm (${mockJobs.length})` },
    { key: "gallery", label: "Hình ảnh" },
    { key: "reviews", label: "Đánh giá" },
  ]

  return (
    <div className="bg-[#f7f9ff] min-h-screen">

      {/* HERO COVER */}
      <div className="pt-16">
        <div className="h-52 md:h-64 relative overflow-hidden"
          style={{ background: company.coverGradient }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%,#67e8f9 0%,transparent 50%),radial-gradient(circle at 80% 20%,#fcd34d 0%,transparent 40%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f7f9ff] to-transparent" />
          <div className="absolute top-4 left-4 md:left-8 flex items-center gap-2 text-xs text-white/70">
            <Link href="/" className="hover:text-white">Trang chủ</Link>
            <span>›</span>
            <Link href="/companies" className="hover:text-white">Công ty</Link>
            <span>›</span>
            <span className="text-white">{company.name}</span>
          </div>
        </div>

        {/* Company header */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl border-2 border-white flex-shrink-0">
                <span className="text-2xl font-black" style={{ color: company.logoColor }}>
                  {company.initials}
                </span>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-[#001e30]">{company.name}</h1>
                  <span className="bg-[#0d9488]/10 text-[#0d9488] text-xs font-bold px-2 py-0.5 rounded-full">
                    ✓ Đã xác minh
                  </span>
                </div>
                <p className="text-sm text-[#3f484c] mt-0.5">{company.industry} · {company.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <button
                onClick={() => setFollowing(!following)}
                className={`flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                  following ? "bg-[#0d9488] text-white border-[#0d9488]" : "bg-transparent text-[#005a71] border-[#005a71]"
                }`}
              >
                {following ? "✓ Đang theo dõi" : "+ Theo dõi"}
              </button>
              <button className="p-2.5 rounded-full border border-[#bec8cd]/50 text-[#3f484c] hover:bg-[#e1efff] transition-colors">
                🔗
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: company.jobCount, label: "Việc đang tuyển", color: "text-[#005a71]" },
              { value: company.size, label: "Nhân viên", color: "text-[#0d9488]" },
              { value: `${company.rating}★`, label: `Đánh giá (${company.reviewCount})`, color: "text-[#F59E0B]" },
              { value: company.foundedYear, label: "Năm thành lập", color: "text-[#8b5cf6]" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-[#E0F5FB] rounded-[0.875rem] p-5 text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-[#3f484c] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                  activeTab === tab.key ? "bg-[#005a71] text-white" : "text-[#6f787d] hover:bg-[#005a71]/10 hover:text-[#005a71]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="border-t border-[#E0F5FB] mb-8" />
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="bg-white border border-[#E0F5FB] rounded-2xl p-6">
                  <h2 className="text-base font-bold text-[#005a71] mb-3">ℹ️ Giới thiệu công ty</h2>
                  <div className="border-t border-[#E0F5FB] mb-4" />
                  <div className="text-sm text-[#001e30] leading-relaxed space-y-3">
                    <p>{company.description}</p>
                    <p>Là một trong những nhà tuyển dụng hàng đầu tại Phú Quốc, chúng tôi không ngừng mở rộng đội ngũ với môi trường làm việc chuyên nghiệp, năng động và đầy cơ hội phát triển.</p>
                    <p>Chúng tôi tự hào mang đến cho nhân viên chế độ đãi ngộ cạnh tranh và lộ trình thăng tiến rõ ràng.</p>
                  </div>
                </div>
                <div className="bg-white border border-[#E0F5FB] rounded-2xl p-6">
                  <h2 className="text-base font-bold text-[#005a71] mb-3">⭐ Lĩnh vực & Chuyên môn</h2>
                  <div className="border-t border-[#E0F5FB] mb-4" />
                  <div className="flex flex-wrap gap-2">
                    {["Khách sạn 5 sao", "Resort cao cấp", "F&B quốc tế", "Du lịch nghỉ dưỡng", "Spa & Wellness", "MICE & Events"].map((tag) => (
                      <span key={tag} className="bg-[#0D9488]/10 text-[#0d9488] text-xs font-semibold px-3 py-1.5 rounded-md">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-[#E0F5FB] rounded-2xl p-6">
                  <h2 className="text-base font-bold text-[#005a71] mb-3">🏆 Văn hóa & Môi trường làm việc</h2>
                  <div className="border-t border-[#E0F5FB] mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: "🎓", title: "Đào tạo liên tục", desc: "Đào tạo bài bản & chuyên nghiệp", bg: "bg-[#0e7490]/5" },
                      { icon: "📈", title: "Thăng tiến nhanh", desc: "Lộ trình rõ ràng & minh bạch", bg: "bg-[#F59E0B]/5" },
                      { icon: "🌍", title: "Đội ngũ đa dạng", desc: "Môi trường quốc tế năng động", bg: "bg-[#0d9488]/5" },
                    ].map((item) => (
                      <div key={item.title} className={`flex flex-col items-center text-center p-4 rounded-xl ${item.bg}`}>
                        <span className="text-3xl mb-2">{item.icon}</span>
                        <p className="text-xs font-bold text-[#001e30]">{item.title}</p>
                        <p className="text-xs text-[#3f484c] mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* JOBS */}
            {activeTab === "jobs" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-[#001e30]">{mockJobs.length} vị trí đang tuyển dụng</p>
                  <select className="text-xs border border-[#bec8cd]/30 rounded-lg px-3 py-1.5 bg-white text-[#001e30] outline-none">
                    <option>Tất cả bộ phận</option>
                    <option>Tiền sảnh</option>
                    <option>F&B</option>
                    <option>Buồng phòng</option>
                  </select>
                </div>
                {mockJobs.map((job) => (
                  <Link key={job.id} href="/jobs"
                    className="flex items-center justify-between gap-4 bg-white border border-[#E0F5FB] rounded-xl px-5 py-4 hover:shadow-md hover:translate-x-1 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#001e30] group-hover:text-[#005a71] transition-colors">{job.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-[#0D9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-md">{job.type}</span>
                        <span className="bg-[#0D9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-md">{job.salary}</span>
                        <span className="bg-[#0D9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-md">{job.location}</span>
                        {job.isHot && <span className="text-xs font-bold text-[#F59E0B]">🔥 HOT</span>}
                        {"isUrgent" in job && job.isUrgent && <span className="text-xs font-bold text-[#0d9488]">Tuyển gấp</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-[#3f484c]">{job.daysAgo}</p>
                      <p className="text-xs text-red-400 mt-1 font-semibold">HN: {job.deadline}</p>
                    </div>
                  </Link>
                ))}
                <div className="text-center pt-4">
                  <button className="px-6 py-2.5 border border-[#005a71] text-[#005a71] font-semibold text-sm rounded-full hover:bg-[#005a71]/5 transition-colors">
                    Xem thêm việc làm khác
                  </button>
                </div>
              </div>
            )}

            {/* GALLERY */}
            {activeTab === "gallery" && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryItems.map((item, i) => (
                    <div key={i} className="rounded-xl overflow-hidden h-36 flex items-center justify-center text-5xl"
                      style={{ background: item.gradient }}>
                      <span className="opacity-40">{item.icon}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-[#3f484c] mt-4">Hình ảnh minh hoạ</p>
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="flex items-center gap-6 bg-white border border-[#E0F5FB] rounded-2xl p-5">
                  <div className="text-center flex-shrink-0">
                    <p className="text-5xl font-bold text-[#F59E0B]">{company.rating}</p>
                    <div className="text-[#F59E0B] mt-1">{"★".repeat(Math.floor(company.rating!))}</div>
                    <p className="text-xs text-[#3f484c] mt-1">{company.reviewCount} đánh giá</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[{ star: "5 ★", pct: 72 }, { star: "4 ★", pct: 18 }, { star: "3 ★", pct: 7 }, { star: "1-2 ★", pct: 3 }].map((r) => (
                      <div key={r.star} className="flex items-center gap-2 text-xs">
                        <span className="w-12">{r.star}</span>
                        <div className="flex-1 h-2 bg-[#e1efff] rounded-full overflow-hidden">
                          <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${r.pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-[#3f484c]">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {mockReviews.map((review) => (
                  <div key={review.id} className="bg-white border border-[#E0F5FB] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#005a71]/10 flex items-center justify-center text-xs font-bold text-[#005a71]">
                          {review.initials}
                        </div>
                        <p className="text-sm font-semibold text-[#001e30]">{review.name}</p>
                      </div>
                      <div className="text-[#F59E0B] text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                    </div>
                    <p className="text-xs text-[#3f484c]">{review.role} · {review.duration} · {review.date}</p>
                    <p className="text-sm text-[#001e30] mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5">
            <div className="bg-white border border-[#E0F5FB] rounded-2xl p-5">
              <h3 className="font-bold text-sm text-[#005a71] mb-4">Thông tin công ty</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: "🏢", label: "Loại hình", value: "Doanh nghiệp tư nhân" },
                  { icon: "👥", label: "Quy mô", value: `${company.size} nhân viên` },
                  { icon: "🏷️", label: "Ngành nghề", value: company.industry },
                  { icon: "📍", label: "Địa chỉ", value: `${company.location}, Phú Quốc` },
                  { icon: "🌐", label: "Website", value: company.website || "—", isLink: true },
                  { icon: "📅", label: "Thành lập", value: company.foundedYear?.toString() || "—" },
                ].map((info) => (
                  <div key={info.label} className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{info.icon}</span>
                    <div>
                      <p className="text-xs text-[#3f484c]">{info.label}</p>
                      {info.isLink && info.value !== "—" ? (
                        <a href={`https://${info.value}`} className="font-semibold text-[#005a71] hover:underline">{info.value}</a>
                      ) : (
                        <p className="font-semibold text-[#001e30]">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#E0F5FB] rounded-2xl p-5">
              <h3 className="font-bold text-sm text-[#005a71] mb-4">Công ty tương tự</h3>
              <div className="space-y-3">
                {similarCompanies.map((sc) => (
                  <Link key={sc.name} href={`/companies/${sc.slug}`}
                    className="flex items-center gap-3 hover:bg-[#e1efff] p-2 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${sc.color}20`, color: sc.color }}>
                      {sc.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#001e30] group-hover:text-[#005a71] transition-colors">{sc.name}</p>
                      <p className="text-xs text-[#3f484c]">{sc.jobCount} vị trí đang tuyển</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}