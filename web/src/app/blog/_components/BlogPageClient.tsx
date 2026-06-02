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

export default function BlogPageClient() {
    const [activeTab, setActiveTab] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [search, setSearch] = useState("");
    const [email, setEmail] = useState("");

    // 🌟 KHỞI TẠO STATE QUẢN LÝ TRANG HIỆN TẠI
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

    // ĐẾM SỐ LƯỢNG BÀI VIẾT CHO MỖI DANH MỤC (ĐÃ BỎ ICON)
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
                return b.id.localeCompare(a.id);
            });
    }, [activeTab, sortBy, search]);

    // 🌟 1. TỰ ĐỘNG TÍNH TOÁN TỔNG SỐ TRANG DỰA TRÊN KẾT QUẢ ĐÃ LỌC
    const totalPages = useMemo(() => {
        return Math.ceil(filtered.length / ITEMS_PER_PAGE);
    }, [filtered]);

    // 🌟 2. CẮT MẢNG DỮ LIỆU ĐỂ CHỈ HIỂN THỊ CÁC BÀI VIẾT THUỘC TRANG HIỆN TẠI
    const paginatedBlogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    // 🌟 3. RESET VỀ TRANG 1 MỖI KHI THAY ĐỔI BỘ LỌC HOẶC TỪ KHÓA TÌM KIẾM
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, sortBy, search]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* 1. HERO BANNER */}
            {featured && (
                <div className="relative w-full h-72 md:h-96 overflow-hidden">
                    <img
                        src={featured.thumbnail || "https://images.unsplash.com/photo-1540206395-68808572332f?w=1400&q=80"}
                        alt="hero"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                    <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-10">
                        <span className="bg-amber-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">🔥 NỔI BẬT</span>
                        <h1 className="text-2xl md:text-4xl font-bold text-white max-w-xl leading-tight mb-3">{featured.title}</h1>
                        <p className="text-sm text-gray-200 max-w-lg line-clamp-2 mb-4">{featured.excerpt}</p>
                        <Link href={`/blog/${featured.slug}`} className="bg-white text-gray-900 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-amber-50 w-fit inline-flex items-center gap-2 transition-colors">
                            Đọc ngay <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                    </div>
                </div>
            )}

            {/* 2. THANH CHỦ ĐỀ NẰM TRÊN (STICKY) */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${activeTab === "all"
                                ? "border-teal-600 text-teal-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                                }`}
                        >
                            Tất cả
                        </button>

                        {categoryList.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${activeTab === cat.id
                                    ? "border-teal-600 text-teal-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. LAYOUT CHÍNH: 2 CỘT */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* COL TRÁI: DANH SÁCH BÀI VIẾT (9/12) */}
                    <main className="lg:col-span-9 min-w-0 flex flex-col justify-between">
                        <div>
                            {/* Search & Sort Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-100 gap-4">
                                <h2 className="text-lg font-extrabold text-teal-900 tracking-tight flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-teal-600 rounded-full inline-block"></span>
                                    {activeCategoryLabel}
                                </h2>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Sắp xếp theo:</span>
                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="text-xs font-bold border-0 rounded-xl pl-4 pr-8 py-2.5 bg-blue-50/60 text-slate-700 outline-none appearance-none cursor-pointer hover:bg-blue-50 transition-colors min-w-[140px]"
                                        >
                                            <option value="newest">Mới nhất</option>
                                            <option value="views">Xem nhiều nhất</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RENDER GRID BÀI VIẾT SAU KHI PHÂN TRANG */}
                            {paginatedBlogs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {paginatedBlogs.map((blog) => (
                                        <BlogCard
                                            key={blog.id}
                                            {...blog}
                                            views={String(blog.views)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 text-gray-400">
                                    Không tìm thấy bài viết nào phù hợp 😔
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex flex-col items-center gap-3 mt-12 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    {/* Nút Prev */}
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Trang trước"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    {/* Số trang */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-9 h-9 text-xs font-semibold rounded-xl transition-all ${currentPage === page
                                                ? "bg-teal-700 text-teal-50 shadow-sm"
                                                : "border border-gray-200 text-gray-600 hover:bg-slate-100"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    {/* Nút Next */}
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Trang sau"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Dòng thông tin */}
                                <p className="text-xs text-gray-400">
                                    Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} trong {filtered.length} bài viết
                                </p>
                            </div>
                        )}
                    </main>

                    {/* COL PHẢI: SIDEBAR TIỆN ÍCH (3/12) */}
                    <aside className="hidden lg:flex lg:col-span-3 flex-col gap-5">

                        {/* 1. Hộp tìm kiếm bài viết */}
                        <div className="bg-white rounded-2xl border border-blue-50/50 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-teal-800 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Tìm bài viết
                            </h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Nhập từ khóa..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 text-xs border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300 bg-blue-50/60 placeholder:text-gray-400 text-gray-700"
                                />
                                <svg className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* 2. Bài viết phổ biến */}
                        <div className="bg-white rounded-2xl border border-blue-50/50 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-teal-800 mb-5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Bài viết phổ biến
                            </h3>
                            <div className="flex flex-col gap-5">
                                {popularBlogs.map((b) => (
                                    <Link key={b.id} href={`/blog/${b.slug}`} className="flex gap-3 group cursor-pointer items-start">
                                        <span className={`w-6 h-6 shrink-0 rounded-full text-xs font-bold flex items-center justify-center text-white transition-colors ${b.rank === 1 ? "bg-teal-700" : b.rank === 2 ? "bg-teal-600" : "bg-slate-500"}`}>
                                            {b.rank}
                                        </span>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                                                {b.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                {b.views} lượt xem
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* 3. Danh mục bài viết */}
                        <div className="bg-white rounded-2xl border border-blue-50/50 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-teal-800 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                Danh mục bài viết
                            </h3>
                            <div className="flex flex-col gap-3.5">
                                <div
                                    onClick={() => setActiveTab("all")}
                                    className={`flex justify-between items-center text-xs font-semibold cursor-pointer transition-colors ${activeTab === "all" ? "text-teal-700" : "text-slate-700 hover:text-teal-700"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>🗂️</span>
                                        <span>Tất cả bài viết</span>
                                    </div>
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[24px] text-center">
                                        {mockHomeBlogs.length}
                                    </span>
                                </div>

                                {categoryList.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => setActiveTab(c.id)}
                                        className={`flex justify-between items-center text-xs font-semibold cursor-pointer transition-colors ${activeTab === c.id ? "text-teal-700" : "text-slate-700 hover:text-teal-700"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{c.name}</span>
                                        </div>
                                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[24px] text-center">
                                            {c.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Đăng ký nhận bản tin */}
                        <div className="bg-gradient-to-br from-teal-700 to-cyan-600 rounded-2xl p-5 text-white shadow-md shadow-teal-100">
                            <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-300 animate-bounce" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.07 6.07 0 00-3.825-5.638M11 18v1a3 3 0 01-6 0v-1m6-1H5" />
                                </svg>
                                Nhận bài viết mới
                            </h3>
                            <p className="text-[11px] text-teal-50/90 mb-4 leading-relaxed">
                                Đăng ký nhận cẩm nang việc làm & tin tuyển dụng resort mỗi tuần.
                            </p>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email của bạn..."
                                className="w-full px-3 py-2.5 text-xs rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2.5 placeholder:text-gray-400"
                            />
                            <button className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 transition-colors text-slate-900 font-bold text-xs rounded-xl shadow">
                                Đăng ký ngay
                            </button>
                        </div>

                    </aside>

                </div>
            </div>
            <Footer />
        </div>
    );
}