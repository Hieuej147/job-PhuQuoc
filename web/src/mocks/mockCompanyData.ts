// Võ Thành Phú
// src/mocks/mockCompanyData.ts
// Dữ liệu giả định cho trang Công ty - do Võ Thành Phú tự tạo

export interface Company {
  id: string
  name: string
  slug: string
  logo?: string | null
  industry: string
  industryIcon: string
  category: string
  size: string
  jobCount: number
  location: string
  isHot: boolean
  isFeatured: boolean
  coverGradient: string
  initials: string
  logoColor: string
  website?: string
  foundedYear?: number
  rating?: number
  reviewCount?: number
  description?: string
}

export const mockCompanyList: Company[] = [
  {
    id: "co-001",
    name: "Vinpearl Resort Phú Quốc",
    slug: "vinpearl-resort-phu-quoc",
    initials: "VW",
    coverGradient: "linear-gradient(135deg,#0E7490,#0D9488)",
    logoColor: "#0E7490",
    industry: "Khách sạn & Resort",
    industryIcon: "🏨",
    category: "hotel-resort",
    size: "501-1000",
    jobCount: 28,
    location: "Gành Dầu, PQ",
    isHot: true,
    isFeatured: true,
    website: "vinpearl.com",
    foundedYear: 2005,
    rating: 4.6,
    reviewCount: 238,
    description: "Vinpearl Resort Phú Quốc là quần thể nghỉ dưỡng 5 sao đẳng cấp quốc tế, tọa lạc tại khu vực Gành Dầu – phía bắc đảo Phú Quốc.",
  },
  {
    id: "co-002",
    name: "Sunset Sanato Beach Club",
    slug: "sunset-sanato-beach-club",
    initials: "SS",
    coverGradient: "linear-gradient(135deg,#0D9488,#006a61)",
    logoColor: "#0D9488",
    industry: "Nhà hàng & F&B",
    industryIcon: "🍽️",
    category: "fb",
    size: "51-200",
    jobCount: 12,
    location: "Dương Tơ, PQ",
    isHot: true,
    isFeatured: false,
    website: "sunsetsanato.com",
    foundedYear: 2018,
    rating: 4.3,
    reviewCount: 87,
    description: "Beach club cao cấp với view biển hoàng hôn tuyệt đẹp tại Phú Quốc.",
  },
  {
    id: "co-003",
    name: "Saigon Tourist Phú Quốc",
    slug: "saigon-tourist-phu-quoc",
    initials: "SG",
    coverGradient: "linear-gradient(135deg,#F59E0B,#D97706)",
    logoColor: "#D97706",
    industry: "Du lịch & Lữ hành",
    industryIcon: "🌊",
    category: "tourism",
    size: "201-500",
    jobCount: 9,
    location: "Dương Đông, PQ",
    isHot: false,
    isFeatured: false,
    foundedYear: 2010,
    rating: 4.1,
    reviewCount: 124,
    description: "Công ty du lịch lữ hành hàng đầu tại Phú Quốc.",
  },
  {
    id: "co-004",
    name: "Premier Village Phú Quốc",
    slug: "premier-village-phu-quoc",
    initials: "PH",
    coverGradient: "linear-gradient(135deg,#6366f1,#4f46e5)",
    logoColor: "#4f46e5",
    industry: "Khách sạn & Resort",
    industryIcon: "🏨",
    category: "hotel-resort",
    size: "201-500",
    jobCount: 15,
    location: "Bãi Trường, PQ",
    isHot: true,
    isFeatured: false,
    foundedYear: 2016,
    rating: 4.7,
    reviewCount: 195,
    description: "Resort villa hướng biển sang trọng bậc nhất tại Bãi Trường, Phú Quốc.",
  },
  {
    id: "co-005",
    name: "InterContinental Phu Quoc",
    slug: "intercontinental-phu-quoc",
    initials: "IH",
    coverGradient: "linear-gradient(135deg,#059669,#047857)",
    logoColor: "#059669",
    industry: "Khách sạn & Resort",
    industryIcon: "🏨",
    category: "hotel-resort",
    size: "500+",
    jobCount: 22,
    location: "Bãi Dài, PQ",
    isHot: true,
    isFeatured: false,
    foundedYear: 2018,
    rating: 4.8,
    reviewCount: 312,
    description: "Khách sạn 5 sao quốc tế đẳng cấp thế giới tại Bãi Dài, Phú Quốc.",
  },
  {
    id: "co-006",
    name: "Phú Quốc Pearl Resort & Spa",
    slug: "phu-quoc-pearl-resort-spa",
    initials: "PQ",
    coverGradient: "linear-gradient(135deg,#dc2626,#b91c1c)",
    logoColor: "#dc2626",
    industry: "Khách sạn & Resort",
    industryIcon: "🏨",
    category: "hotel-resort",
    size: "51-200",
    jobCount: 6,
    location: "Dương Đông, PQ",
    isHot: false,
    isFeatured: false,
    foundedYear: 2015,
    rating: 4.0,
    reviewCount: 56,
    description: "Resort spa boutique yên tĩnh với dịch vụ chăm sóc sức khỏe cao cấp.",
  },
  {
    id: "co-007",
    name: "Nam Khánh Travel Phú Quốc",
    slug: "nam-khanh-travel-phu-quoc",
    initials: "NK",
    coverGradient: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    logoColor: "#7c3aed",
    industry: "Du lịch & Lữ hành",
    industryIcon: "🌊",
    category: "tourism",
    size: "1-50",
    jobCount: 4,
    location: "An Thới, PQ",
    isHot: false,
    isFeatured: false,
    foundedYear: 2020,
    rating: 3.9,
    reviewCount: 28,
    description: "Công ty lữ hành trẻ năng động chuyên tour biển đảo Phú Quốc.",
  },
  {
    id: "co-008",
    name: "Biển Mơ Spa & Wellness",
    slug: "bien-mo-spa-wellness",
    initials: "BM",
    coverGradient: "linear-gradient(135deg,#0891b2,#0e7490)",
    logoColor: "#0891b2",
    industry: "Y tế & Spa",
    industryIcon: "🏥",
    category: "health",
    size: "1-50",
    jobCount: 7,
    location: "Cửa Cạn, PQ",
    isHot: true,
    isFeatured: false,
    foundedYear: 2019,
    rating: 4.4,
    reviewCount: 73,
    description: "Trung tâm spa và chăm sóc sức khỏe toàn diện giữa thiên nhiên Phú Quốc.",
  },
]

export const industryTabs = [
  { label: "🏢 Tất cả", value: "" },
  { label: "🏨 Khách sạn & Resort", value: "hotel-resort" },
  { label: "🍽️ Nhà hàng & F&B", value: "fb" },
  { label: "🌊 Du lịch & Lữ hành", value: "tourism" },
  { label: "🛍️ Bán lẻ & Dịch vụ", value: "retail" },
  { label: "💻 IT & Công nghệ", value: "it" },
  { label: "🏥 Y tế & Spa", value: "health" },
]