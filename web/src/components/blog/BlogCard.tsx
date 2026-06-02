// components/blog/BlogCard.tsx
import Link from "next/link";

interface BlogCardProps {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail?: string;
    date: string;
    views: string;
    categoryName: string;
    categorySlug: string;
    authorName: string;
    uiIconName: string;
    uiCatBg: string; // e.g. "bg-[#0e7490]" hoặc "bg-[#ea580c]"
}

export default function BlogCard({
    title,
    slug,
    excerpt,
    thumbnail = "https://images.unsplash.com/photo-1540206395-68808572332f?w=600&q=80",
    date,
    views,
    categoryName,
    uiCatBg,
}: BlogCardProps) {
    // Lấy 2 ký tự đầu tên tác giả làm avatar
    const initials = "AN"; // tạm dùng fixed, bạn có thể truyền authorInitials vào

    return (
        <Link href={`/blog/${slug}`}>
            <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col h-full border border-gray-100">

                {/* ── THUMBNAIL ── */}
                <div className="relative overflow-hidden aspect-[16/10] bg-gray-200 shrink-0">
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    {/* Category badge */}
                    <div className={`absolute top-3 left-3 ${uiCatBg} text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5`}>
                        <span className="text-[11px]">📌</span>
                        {categoryName}
                    </div>
                </div>

                {/* ── CONTENT ── */}
                <div className="flex flex-col flex-1 p-4 gap-2">

                    {/* Tiêu đề */}
                    <h3 className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                        {excerpt}
                    </p>

                    {/* ── FOOTER ── */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">

                        {/* Author + date */}
                        <div className="flex items-center gap-2 min-w-0">
                            {/* Avatar placeholder */}
                            <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-medium text-gray-800 truncate">
                                    Anh Nguyễn
                                </span>
                                <span className="text-[10px] text-gray-400">{date}</span>
                            </div>
                        </div>

                        {/* Views + Đọc thêm */}
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {views}
                            </span>
                            <span className="text-xs font-semibold text-teal-600 flex items-center gap-0.5 hover:gap-1.5 transition-all">
                                Đọc thêm
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}