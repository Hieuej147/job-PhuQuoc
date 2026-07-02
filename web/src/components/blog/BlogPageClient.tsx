"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import BlogHero from "@/components/blog/BlogHero";
import BlogFilterBar from "@/components/blog/BlogFilterBar";
import BlogList from "@/components/blog/BlogList";
import { Blog, BlogCategory } from "@/types/blog";

export interface MappedBlog extends Blog {
  categoryName: string;
  categorySlug: string;
  authorName: string;
  uiIconName: string;
  uiCatBg: string;
  categoryId?: string;
  date: string;
}

const ITEMS_PER_PAGE = 6;

const parseViews = (viewsStr: string | number): number => {
  if (typeof viewsStr === "number") return viewsStr;
  const cleanStr = viewsStr.toLowerCase().trim();
  if (cleanStr.endsWith("k"))
    return parseFloat(cleanStr.replace("k", "")) * 1000;
  return parseFloat(cleanStr) || 0;
};

const getCategoryEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (
    lower.includes("kinh nghiệm") ||
    lower.includes("ứng tuyển") ||
    lower.includes("phỏng vấn")
  )
    return "💼";
  if (lower.includes("cv") || lower.includes("cẩm nang")) return "📝";
  if (lower.includes("đời sống") || lower.includes("phú quốc")) return "🏖️";
  if (
    lower.includes("du lịch") ||
    lower.includes("resort") ||
    lower.includes("khách sạn")
  )
    return "🏨";
  if (lower.includes("lương") || lower.includes("phúc lợi")) return "💰";
  if (lower.includes("phát triển") || lower.includes("bản thân")) return "🎓";
  if (lower.includes("xu hướng") || lower.includes("thị trường")) return "📈";
  return "📁";
};

function mapBlog(b: Blog): MappedBlog {
  return {
    ...b,
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt || "",
    thumbnail: b.thumbnail,
    date: new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(b.createdAt)),
    views: b.views || 0,
    categoryName: b.category?.name || "Blog",
    categorySlug: b.category?.slug || "blog",
    authorName: b.author?.name || "PQJobs",
    uiIconName: "article",
    uiCatBg: "bg-[#0D9488]/10 text-[#0D9488]",
    categoryId: (b as any).categoryId || b.category?.id,
  };
}

interface BlogPageClientProps {
  initialBlogs?: Blog[];
  initialCategories?: BlogCategory[];
  initialTotalPages?: number;
  initialSearchParams?: {
    page: string;
    search: string;
    category: string;
    sort: string;
  };
}

export default function BlogPageClient({
  initialBlogs = [],
  initialCategories = [],
  initialTotalPages = 1,
  initialSearchParams = {
    page: "1",
    search: "",
    category: "all",
    sort: "newest",
  },
}: BlogPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(initialSearchParams.category);
  const [sortBy, setSortBy] = useState(initialSearchParams.sort);
  const [search, setSearch] = useState(initialSearchParams.search);
  const [email, setEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(
    Number(initialSearchParams.page),
  );

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === "" ||
        value === "all" ||
        value === "newest" ||
        (key === "page" && value === "1")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setActiveTab(initialSearchParams.category || "all");
    setSortBy(initialSearchParams.sort || "newest");
    setSearch(initialSearchParams.search || "");
    setCurrentPage(Number(initialSearchParams.page) || 1);
  }, [initialSearchParams]);

  const mappedBlogs = useMemo(() => initialBlogs.map(mapBlog), [initialBlogs]);
  const featured = mappedBlogs[0];

  const popularBlogs = useMemo(() => {
    return [...mappedBlogs]
      .sort((a, b) => parseViews(b.views) - parseViews(a.views))
      .slice(0, 3)
      .map((blog, idx) => ({ ...blog, rank: idx + 1 }));
  }, [mappedBlogs]);

  const categoryList = useMemo(() => {
    return initialCategories.map((cat: BlogCategory) => ({
      ...cat,
      count: mappedBlogs.filter((blog) => blog.categoryId === cat.id).length,
    }));
  }, [initialCategories, mappedBlogs]);

  const activeCategoryLabel = useMemo(() => {
    if (activeTab === "all") return "Tất cả bài viết";
    return (
      initialCategories.find((cat: BlogCategory) => cat.id === activeTab)
        ?.name || "Bài viết"
    );
  }, [activeTab, initialCategories]);

  const filtered = mappedBlogs;
  const totalPages = initialTotalPages;
  const paginatedBlogs = mappedBlogs;

  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== initialSearchParams.search) {
        updateURL({ search, page: "1" });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Intersection Observer for scroll animation
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
      { threshold: 0.05 },
    );

    document.querySelectorAll(".fade-up").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [paginatedBlogs, activeTab]);

  const formatViews = (val: string | number): string => {
    const num = typeof val === "number" ? val : parseFloat(val) || 0;
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return String(num);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden transition-colors duration-200">
      {/* 1. HERO FEATURED POST */}
      <BlogHero featured={featured} formatViews={formatViews} />

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <BlogFilterBar
          categoryList={categoryList}
          activeTab={activeTab}
          sortBy={sortBy}
          filteredCount={filtered.length}
          updateURL={updateURL}
          getCategoryEmoji={getCategoryEmoji}
        />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: Blog Cards */}
          <BlogList
            paginatedBlogs={paginatedBlogs}
            totalPages={totalPages}
            currentPage={currentPage}
            updateURL={updateURL}
          />

          {/* RIGHT: Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-20">
            {/* 1. Hộp tìm kiếm bài viết */}
            <div className="sidebar-box bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 fade-up stagger-1">
              <h3 className="font-bold text-[#005a71] dark:text-[#67E8F9] mb-3 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>{" "}
                Tìm bài viết
              </h3>
              <div className="flex items-center bg-[#ecf4ff] dark:bg-[#0C2231] rounded-xl border border-[#E0F5FB] dark:border-[#1E5F74] px-3 py-2 gap-2">
                <span className="material-symbols-outlined text-slate-400 dark:text-[#67E8F9] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Nhập từ khóa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 border-none focus:ring-0 bg-transparent text-sm text-[#001e30] dark:text-[#E0F2FE] placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* 2. Bài viết phổ biến */}
            <div className="sidebar-box bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 fade-up stagger-2">
              <h3 className="font-bold text-[#005a71] dark:text-[#67E8F9] mb-4 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">
                  trending_up
                </span>{" "}
                Bài viết phổ biến
              </h3>
              <div className="space-y-3">
                {popularBlogs.map((b) => (
                  <Link
                    key={b.id}
                    href={`/blog/${b.slug}`}
                    className="flex items-start gap-3 p-2 rounded-xl hover:border-[#E0F5FB] border border-transparent dark:hover:bg-[#1e5f74]/30 transition-all group"
                  >
                    <span
                      className={`w-6 h-6 shrink-0 rounded-full text-white text-[11px] font-black flex items-center justify-center mt-0.5 ${
                        b.rank === 1
                          ? "bg-[#0E7490]"
                          : b.rank === 2
                            ? "bg-[#0D9488]"
                            : "bg-[#64748B]"
                      } dark:bg-[#1E5F74] dark:text-[#67E8F9]`}
                    >
                      {b.rank}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#E0F2FE] group-hover:text-[#005a71] dark:group-hover:text-[#67E8F9] transition-colors line-clamp-2 leading-snug">
                        {b.title}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">
                          visibility
                        </span>{" "}
                        {formatViews(b.views)} lượt xem
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Danh mục */}
            <div className="sidebar-box bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 fade-up stagger-3">
              <h3 className="font-bold text-[#005a71] dark:text-[#67E8F9] mb-4 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">
                  folder_open
                </span>{" "}
                Danh mục
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => updateURL({ category: "all", page: "1" })}
                    className={`w-full flex justify-between items-center py-2 px-3 rounded-xl transition-colors text-left group ${
                      activeTab === "all"
                        ? "bg-slate-100 dark:bg-[#1E5F74]/30 text-[#005a71] dark:text-[#67E8F9]"
                        : "hover:bg-slate-50 dark:hover:bg-[#67E8F9]/10"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-[#E0F2FE] group-hover:text-[#005a71] dark:group-hover:text-[#67E8F9]">
                      🗂️ Tất cả bài viết
                    </span>
                    <span className="text-xs bg-[#e1efff] dark:bg-[#1E5F74] text-slate-600 dark:text-[#67E8F9] px-2 py-0.5 rounded-full font-bold">
                      {mappedBlogs.length}
                    </span>
                  </button>
                </li>
                {categoryList.map((c) => {
                  const emoji = getCategoryEmoji(c.name);
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() =>
                          updateURL({ category: c.slug, page: "1" })
                        }
                        className={`w-full flex justify-between items-center py-2 px-3 rounded-xl transition-colors text-left group ${
                          activeTab === c.slug
                            ? "bg-slate-100 dark:bg-[#1E5F74]/30 text-[#005a71] dark:text-[#67E8F9]"
                            : "hover:bg-slate-50 dark:hover:bg-[#67E8F9]/10"
                        }`}
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-[#E0F2FE] group-hover:text-[#005a71] dark:group-hover:text-[#67E8F9]">
                          {emoji} {c.name}
                        </span>
                        <span className="text-xs bg-[#e1efff] dark:bg-[#1E5F74] text-slate-600 dark:text-[#67E8F9] px-2 py-0.5 rounded-full font-bold">
                          {c.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 4. Bản tin đăng ký */}
            <div className="bg-linear-to-br from-[#005a71] to-[#0E7490] dark:bg-linear-to-br dark:from-[#0F3347] dark:to-[#091A27] rounded-2xl p-5 text-white shadow-md shadow-[#005a71]/10 dark:shadow-none border border-transparent dark:border-[#1E5F74] fade-up stagger-4">
              <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-300 animate-bounce">
                  notifications
                </span>{" "}
                Nhận bài viết mới
              </h3>
              <p className="text-[11px] text-slate-200 dark:text-[#94A3B8] mb-4 leading-relaxed">
                Đăng ký nhận cẩm nang việc làm & tin tuyển dụng resort mỗi tuần.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn..."
                className="w-full px-3 py-2.5 text-xs rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2.5 placeholder:text-gray-400 dark:bg-[#0C2231] dark:border dark:border-[#1E5F74] dark:text-[#E0F2FE] dark:placeholder-slate-500"
              />
              <button className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#D97706] transition-colors text-white font-bold text-xs rounded-xl shadow">
                Đăng ký ngay
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
