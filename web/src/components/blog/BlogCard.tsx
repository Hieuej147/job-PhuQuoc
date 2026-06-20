/**
 * @file BlogCard.tsx
 * @description Component Card hiển thị tóm tắt một bài viết Blog.
 * @note [HuynhhThanh] Trao đổi dữ liệu: Nhận các props (title, excerpt, views, date, author...) từ BlogPageClient, đây đều là dữ liệu thực tế từ Database.
 */
// components/blog/BlogCard.tsx
import Link from "next/link";

interface BlogCardProps {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail?: string | null;
    date: string;
    views: string | number;
    categoryName: string;
    categorySlug: string;
    authorName: string;
    uiIconName: string;
    uiCatBg: string; // e.g. "bg-[#0e7490]" hoặc "bg-[#ea580c]"
}

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

const getAuthorInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

export default function BlogCard({
    title,
    slug,
    excerpt,
    thumbnail = "https://images.unsplash.com/photo-1540206395-68808572332f?w=600&q=80",
    date,
    views,
    categoryName,
    authorName,
    uiCatBg,
}: BlogCardProps) {
    const initials = getAuthorInitials(authorName);
    const emoji = getCategoryEmoji(categoryName);

    // Format views: e.g. 12480 -> 12.4k
    const formatViews = (val: string | number): string => {
        const num = typeof val === "number" ? val : parseFloat(val) || 0;
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "k";
        }
        return String(num);
    };

    return (
        <article className="blog-card group bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
            <Link href={`/blog/${slug}`} className="block relative overflow-hidden h-48">
                <img
                    src={thumbnail || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"}
                    alt={title}
                    className="thumb-img w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                />
                <div className="thumb-overlay absolute inset-0 bg-gradient-to-t from-black/40 to-transparent dark:from-[#0c2231]/70"></div>
                <span className={`cat-badge absolute top-3 left-3 ${uiCatBg || "bg-[#0D9488]/90"} text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm`}>
                    {emoji} {categoryName}
                </span>
            </Link>
            <div className="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <Link href={`/blog/${slug}`}>
                        <h2 className="blog-title font-bold text-[#0C4A6E] dark:text-[#E0F2FE] text-base mb-2 line-clamp-2 group-hover:text-[#005a71] dark:group-hover:text-[#67E8F9] transition-colors">
                            {title}
                        </h2>
                    </Link>
                    <p className="blog-excerpt text-sm text-slate-500 dark:text-[#94A3B8] line-clamp-2 mb-4">
                        {excerpt}
                    </p>
                </div>
                <div>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <div className="author-avatar w-7 h-7 rounded-full bg-[#0E7490] dark:bg-[#1E5F74] flex items-center justify-center text-white text-[11px] font-bold">
                                {initials}
                            </div>
                            <div>
                                <p className="blog-meta text-[11px] text-slate-600 dark:text-[#94A3B8] font-semibold leading-tight">
                                    {authorName}
                                </p>
                                <p className="blog-meta text-[10px] text-slate-400 dark:text-[#94A3B8]">
                                    {date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 blog-meta text-[11px] text-slate-400 dark:text-[#94A3B8]">
                            <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">visibility</span> {formatViews(views)}
                            </span>
                        </div>
                    </div>
                    <Link
                        href={`/blog/${slug}`}
                        className="read-more mt-4 flex items-center gap-1 text-[#005a71] dark:text-[#67E8F9] text-sm font-semibold hover:opacity-70 transition-opacity"
                    >
                        Đọc thêm <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </article>
    );
}