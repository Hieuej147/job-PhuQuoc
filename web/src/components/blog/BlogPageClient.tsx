"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import { mockHomeBlogs, mockBlogCategories } from "@/mocks/mockData";
import Header from "@/components/candidate/Header";
import Footer from "@/components/candidate/Footer";

// Số lượng bài viết hiển thị trên một trang
const ITEMS_PER_PAGE = 6;

// Hàm helper chuyển đổi chuỗi views (Ví dụ: "21.3k" -> 21300, "1.2k" -> 1200) để sắp xếp chuẩn xác
const parseViews = (viewsStr: string | number): number => {
    if (typeof viewsStr === "number") return viewsStr;
    const cleanStr = viewsStr.toLowerCase().trim();
    if (cleanStr.endsWith("k")) {
        return parseFloat(cleanStr.replace("k", "")) * 1000;
    }
    return parseFloat(cleanStr) || 0;
};

const getCategoryEmoji = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("kinh nghiệm") || lower.includes("ứng tuyển") || lower.includes("phỏng vấn")) return "💼";
    if (lower.includes("cv") || lower.includes("cẩm nang")) return "📝";
    if (lower.includes("đời sống") || lower.includes("phú quốc")) return "🏖️";
    if (lower.includes("du lịch") || lower.includes("resort") || lower.includes("khách sạn")) return "🏨";
    if (lower.includes("lương") || lower.includes("phúc lợi")) return "💰";
    if (lower.includes("phát triển") || lower.includes("bản thân")) return "🎓";
    if (lower.includes("xu hướng") || lower.includes("thị trường")) return "📈";
    return "📁";
};

export default function BlogPageClient() {
    const [activeTab, setActiveTab] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [search, setSearch] = useState("");
    const [email, setEmail] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Bài viết đầu tiên làm tiêu điểm nổi bật (Featured Banner)
    const featured = mockHomeBlogs[0];

    // TỰ ĐỘNG LẤY TOP 3 BÀI VIẾT PHỔ BIẾN DỰA TRÊN VIEWS THẬT
    const popularBlogs = useMemo(() => {
        return [...mockHomeBlogs]
            .sort((a, b) => parseViews(b.views) - parseViews(a.views))
            .slice(0, 3)
            .map((blog, idx) => ({
                ...blog,
                rank: idx + 1
            }));
    }, []);

    // ĐẾM SỐ LƯỢNG BÀI VIẾT CHO MỖI DANH MỤC
    const categoryList = useMemo(() => {
        return mockBlogCategories.map((cat) => {
            const count = mockHomeBlogs.filter(blog => blog.categoryId === cat.id).length;
            return {
                ...cat,
                count
            };
        });
    }, []);

    // Tiêu đề động hiển thị theo danh mục đang chọn
    const activeCategoryLabel = useMemo(() => {
        if (activeTab === "all") return "Tất cả bài viết";
        return mockBlogCategories.find(cat => cat.id === activeTab)?.name || "Bài viết";
    }, [activeTab]);

    // LOGIC LỌC & SẮP XẾP TRÊN GRID CHÍNH
    const filtered = useMemo(() => {
        return mockHomeBlogs
            .filter((b) => {
                if (activeTab !== "all" && b.categoryId !== activeTab) return false;
                return true;
            })
            .filter((b) => {
                if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "views") {
                    return parseViews(b.views) - parseViews(a.views);
                }
                if (sortBy === "oldest") {
                    return a.id.localeCompare(b.id);
                }
                return b.id.localeCompare(a.id);
            });
    }, [activeTab, sortBy, search]);

    // TỰ ĐỘNG TÍNH TOÁN TỔNG SỐ TRANG DỰA TRÊN KẾT QUẢ ĐÃ LỌC
    const totalPages = useMemo(() => {
        return Math.ceil(filtered.length / ITEMS_PER_PAGE);
    }, [filtered]);

    // CẮT MẢNG DỮ LIỆU ĐỂ CHỈ HIỂN THỊ CÁC BÀI VIẾT THUỘC TRANG HIỆN TẠI
    const paginatedBlogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    // RESET VỀ TRANG 1 MỖI KHI THAY ĐỔI BỘ LỌC HOẶC TỪ KHÓA TÌM KIẾM
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, sortBy, search]);

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
            { threshold: 0.05 }
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
        <div className="min-h-screen bg-[#f7f9ff] text-[#001e30] dark:bg-[#0C2231] dark:text-[#E0F2FE] font-sans antialiased overflow-x-hidden">
            <Header />

            {/* 1. HERO FEATURED POST */}
            {featured && (
                <section className="pt-0">
                    <div className="relative overflow-hidden min-h-[480px] flex items-end border-b border-[#E0F5FB] dark:border-[#1E5F74]">
                        <img
                            src={featured.thumbnail || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80"}
                            alt={featured.title}
                            className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#001e30]/90 via-[#001e30]/40 to-transparent dark:from-[#091a27]/95 dark:via-[#091a27]/50" />

                        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full pb-12 pt-32 fade-up">
                            <span className="inline-block bg-[#F59E0B] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                                📌 Nổi bật
                            </span>
                            <h1 className="text-white font-bold text-2xl md:text-4xl max-w-3xl mb-4 leading-snug">
                                {featured.title}
                            </h1>
                            <p className="text-white/80 text-base max-w-2xl mb-6 line-clamp-2">
                                {featured.excerpt}
                            </p>
                            <div className="flex flex-wrap items-center gap-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#0E7490] dark:bg-[#1E5F74] flex items-center justify-center text-white font-bold text-sm">
                                        {featured.authorName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold">{featured.authorName}</p>
                                        <p className="text-white/60 text-xs">{featured.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-white/70 text-sm">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">visibility</span> {formatViews(featured.views)} lượt xem
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">schedule</span> 8 phút đọc
                                    </span>
                                </div>
                                <Link
                                    href={`/blog/${featured.slug}`}
                                    className="ml-auto flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-md"
                                >
                                    Đọc ngay <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* MAIN */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

                {/* Category tabs */}
                <div className="overflow-x-auto pb-2 mb-6 fade-up stagger-1">
                    <div className="flex gap-2 min-w-max">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${activeTab === "all"
                                ? "bg-[#005a71] dark:bg-[#0E7490] text-white border-[#005a71] dark:border-[#0E7490]"
                                : "bg-white dark:bg-[#0F3347] border-[#E0F5FB] dark:border-[#1E5F74] text-slate-600 dark:text-[#94A3B8] hover:border-[#005a71] dark:hover:text-[#67E8F9] dark:hover:border-[#67E8F9]"
                                }`}
                        >
                            🗂️ Tất cả
                        </button>
                        {categoryList.map((cat) => {
                            const emoji = getCategoryEmoji(cat.name);
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${activeTab === cat.id
                                        ? "bg-[#005a71] dark:bg-[#0E7490] text-white border-[#005a71] dark:border-[#0E7490]"
                                        : "bg-white dark:bg-[#0F3347] border-[#E0F5FB] dark:border-[#1E5F74] text-slate-600 dark:text-[#94A3B8] hover:border-[#005a71] dark:hover:text-[#67E8F9] dark:hover:border-[#67E8F9]"
                                        }`}
                                >
                                    {emoji} {cat.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sort bar */}
                <div className="sort-bar bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] px-5 py-3 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 fade-up stagger-2">
                    <span className="text-sm text-slate-600 dark:text-[#94A3B8]">
                        Hiển thị <strong className="text-[#005a71] dark:text-[#67E8F9]">{filtered.length}</strong> bài viết
                    </span>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600 dark:text-[#94A3B8]">Sắp xếp:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select border border-slate-200 dark:border-[#1E5F74] rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-[#E0F2FE] bg-transparent dark:bg-[#0C2231] focus:ring-1 focus:ring-[#005a71] outline-none"
                        >
                            <option value="newest" className="dark:bg-[#0F3347]">Mới nhất</option>
                            <option value="views" className="dark:bg-[#0F3347]">Xem nhiều nhất</option>
                            <option value="oldest" className="dark:bg-[#0F3347]">Cũ nhất</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* LEFT: Blog Cards */}
                    <div className="flex-1 min-w-0 w-full">
                        {paginatedBlogs.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {paginatedBlogs.map((blog, idx) => (
                                    <div key={blog.id} className={`fade-up stagger-${(idx % 3) + 1}`}>
                                        <BlogCard {...blog} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-[#0F3347] rounded-3xl border border-dashed border-slate-300 dark:border-[#1E5F74] text-slate-400 fade-up">
                                Không tìm thấy bài viết nào phù hợp 😔
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-10 fade-up">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="page-btn w-10 h-10 rounded-lg border border-[#E0F5FB] dark:border-[#1E5F74] bg-white dark:bg-[#0F3347] flex items-center justify-center text-slate-600 dark:text-[#E0F2FE] hover:border-[#005a71] dark:hover:border-[#67E8F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${currentPage === page
                                            ? "bg-[#005a71] dark:bg-[#0E7490] border-[#005a71] dark:border-[#0E7490] text-white"
                                            : "bg-white dark:bg-[#0F3347] border-[#E0F5FB] dark:border-[#1E5F74] text-slate-600 dark:text-[#E0F2FE] hover:border-[#005a71] dark:hover:border-[#67E8F9]"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="page-btn w-10 h-10 rounded-lg border border-[#E0F5FB] dark:border-[#1E5F74] bg-white dark:bg-[#0F3347] flex items-center justify-center text-slate-600 dark:text-[#E0F2FE] hover:border-[#005a71] dark:hover:border-[#67E8F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Sidebar */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-20">

                        {/* 1. Hộp tìm kiếm bài viết */}
                        <div className="sidebar-box bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 fade-up stagger-1">
                            <h3 className="font-bold text-[#005a71] dark:text-[#67E8F9] mb-3 flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-[18px]">search</span> Tìm bài viết
                            </h3>
                            <div className="flex items-center bg-[#ecf4ff] dark:bg-[#0C2231] rounded-xl border border-[#E0F5FB] dark:border-[#1E5F74] px-3 py-2 gap-2">
                                <span className="material-symbols-outlined text-slate-400 dark:text-[#67E8F9] text-[18px]">search</span>
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
                                <span className="material-symbols-outlined text-[18px]">trending_up</span> Bài viết phổ biến
                            </h3>
                            <div className="space-y-3">
                                {popularBlogs.map((b) => (
                                    <Link
                                        key={b.id}
                                        href={`/blog/${b.slug}`}
                                        className="flex items-start gap-3 p-2 rounded-xl hover:border-[#E0F5FB] border border-transparent dark:hover:bg-[#1e5f74]/30 transition-all group"
                                    >
                                        <span className={`w-6 h-6 shrink-0 rounded-full text-white text-[11px] font-black flex items-center justify-center mt-0.5 ${b.rank === 1 ? "bg-[#0E7490]" : b.rank === 2 ? "bg-[#0D9488]" : "bg-[#64748B]"
                                            } dark:bg-[#1E5F74] dark:text-[#67E8F9]`}>
                                            {b.rank}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#E0F2FE] group-hover:text-[#005a71] dark:group-hover:text-[#67E8F9] transition-colors line-clamp-2 leading-snug">
                                                {b.title}
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">visibility</span> {formatViews(b.views)} lượt xem
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* 3. Danh mục */}
                        <div className="sidebar-box bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 fade-up stagger-3">
                            <h3 className="font-bold text-[#005a71] dark:text-[#67E8F9] mb-4 flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-[18px]">folder_open</span> Danh mục
                            </h3>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setActiveTab("all")}
                                        className={`w-full flex justify-between items-center py-2 px-3 rounded-xl transition-colors text-left group ${activeTab === "all" ? "bg-slate-100 dark:bg-[#1E5F74]/30 text-[#005a71] dark:text-[#67E8F9]" : "hover:bg-slate-50 dark:hover:bg-[#67E8F9]/10"
                                            }`}
                                    >
                                        <span className="text-sm font-medium text-slate-700 dark:text-[#E0F2FE] group-hover:text-[#005a71] dark:group-hover:text-[#67E8F9]">
                                            🗂️ Tất cả bài viết
                                        </span>
                                        <span className="text-xs bg-[#e1efff] dark:bg-[#1E5F74] text-slate-600 dark:text-[#67E8F9] px-2 py-0.5 rounded-full font-bold">
                                            {mockHomeBlogs.length}
                                        </span>
                                    </button>
                                </li>
                                {categoryList.map((c) => {
                                    const emoji = getCategoryEmoji(c.name);
                                    return (
                                        <li key={c.id}>
                                            <button
                                                onClick={() => setActiveTab(c.id)}
                                                className={`w-full flex justify-between items-center py-2 px-3 rounded-xl transition-colors text-left group ${activeTab === c.id ? "bg-slate-100 dark:bg-[#1E5F74]/30 text-[#005a71] dark:text-[#67E8F9]" : "hover:bg-slate-50 dark:hover:bg-[#67E8F9]/10"
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
                        <div className="bg-gradient-to-br from-[#005a71] to-[#0E7490] dark:bg-gradient-to-br dark:from-[#0F3347] dark:to-[#091A27] rounded-2xl p-5 text-white shadow-md shadow-[#005a71]/10 dark:shadow-none border border-transparent dark:border-[#1E5F74] fade-up stagger-4">
                            <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-amber-300 animate-bounce">notifications</span> Nhận bài viết mới
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
            <Footer />
        </div>
    );
}
