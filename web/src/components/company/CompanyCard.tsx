// Võ Thành Phú
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

import { Company } from "@/types/company"

interface CompanyCardProps {
  company: Company
  index?: number
  isFollowed?: boolean
}

export default function CompanyCard({ company, index = 0, isFollowed = false }: CompanyCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [followed, setFollowed] = useState(isFollowed)

  useEffect(() => {
    setFollowed(isFollowed);
  }, [isFollowed]);
  const [followLoading, setFollowLoading] = useState(false)

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?redirect=/companies/${company.slug}`);
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/v1/saved/companies/${company.id}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) setFollowed(prev => !prev);
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const gradient = company.coverGradient || "linear-gradient(135deg,#0E7490,#0D9488)"
  const initials = company.initials || company.name.slice(0, 2).toUpperCase()
  const logoColor = company.logoColor || "#0E7490"
  const location = company.location || "Phú Quốc"
  const jobCount = company.jobCount || 0
  const isHot = company.isHot || false
  const isFeatured = company.isFeatured || false
  const staggerClass = `stagger-${(index % 8) + 1}`

  return (
    <Link
      href={`/companies/${company.slug}`}
      className={`fade-up ${staggerClass} relative bg-white dark:bg-[#0f2436] rounded-2xl border border-[#E0F5FB] dark:border-[#1e3a4f] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block cursor-pointer`}
    >
      {/* Featured ribbon */}
      {isFeatured && (
        <div
          className="absolute top-0 right-0 bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white text-[10px] font-bold px-3 py-1 z-10"
          style={{ borderRadius: "0 1rem 0 0.75rem" }}
        >
          ⭐ NỔI BẬT
        </div>
      )}

      {/* Cover */}
      <div
        className="h-20 rounded-t-2xl relative overflow-hidden"
        style={{ background: gradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Logo */}
      <div className="px-5 -mt-7 mb-3 relative z-10">
        <div className="w-14 h-14 bg-white dark:bg-[#0a1929] rounded-xl border-2 border-white dark:border-[#1e3a4f] shadow-md flex items-center justify-center">
          {company.logo ? (
            <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain rounded-lg" />
          ) : (
            <span className="text-xl font-black" style={{ color: logoColor }}>
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        <h3 className="font-bold text-[#0C4A6E] dark:text-white text-base mb-0.5 line-clamp-1">{company.name}</h3>
        <p className="text-xs text-[#3f484c] dark:text-gray-400 mb-3">{company.industry}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-semibold px-2 py-0.5 rounded-md">
            {company.size} nhân viên
          </span>
          {isHot ? (
            <span className="bg-[#F59E0B]/10 text-[#D97706] text-[11px] font-semibold px-2 py-0.5 rounded-md">
              🔥 {jobCount} vị trí
            </span>
          ) : (
            <span className="bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-semibold px-2 py-0.5 rounded-md">
              {jobCount} vị trí
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-[#3f484c] dark:text-gray-400">
            📍 {location}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all border whitespace-nowrap disabled:opacity-60 ${followed
                ? "bg-[#67E8F9] text-[#0C2231] border-[#67E8F9]"
                : "border-[#bec8cd]/40 dark:border-gray-600 text-[#3f484c] dark:text-gray-300 hover:border-[#005a71] hover:text-[#005a71]"
                }`}
            >
              {followLoading ? "..." : followed ? "✓ Đang theo" : "+ Theo dõi"}
            </button>
            <span className="text-[11px] font-semibold bg-[#005a71] text-white px-2.5 py-1 rounded-lg hover:bg-[#0e7490] transition-all whitespace-nowrap">
              Xem
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}