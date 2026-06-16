import React from "react";
import { Eye, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

// Định nghĩa Interface khớp 100% với cấu trúc dữ liệu trả về từ selector mockHomeBlogs
interface BlogCardProps {
  blog: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    views: string;
    date: string;
    categoryName: string;
    categorySlug: string;
    authorName: string;
    uiIconName: string;
    uiCatBg: string;
  };
}

export default function BlogCard({ blog }: BlogCardProps) {
  return (
    <div className="bg-primary-foreground rounded-xl border border-secondary-foreground shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full group relative">
      {/* LINK ẨN PHỦ TOÀN BỘ CARD (z-10): Bấm vào đâu trên card cũng nhảy trang mượt mà */}
      <Link
        href={`/blog/${blog.slug}`}
        className="absolute inset-0 z-10 text-secondary-foreground"
        aria-label={blog.title}
      />

      {/* PHẦN ẢNH THUMBNAIL & TAG DANH MỤC */}
      <div className="h-44 w-full bg-secondary-foreground overflow-hidden relative">
        {/* Tag danh mục đẩy lên z-20 để nổi hẳn trên lớp kính Link nếu sau này cần bắt click riêng */}
        <span
          className={`absolute top-3 left-3 text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md z-20 flex items-center gap-1 ${blog.uiCatBg}`}
        >
          {blog.categorySlug === "bi-quyet-tim-viec" ? "🎓" : "📈"}{" "}
          {blog.categoryName}
        </span>
        <img
          src="https://images.unsplash.com/photo-1540206395-68808572332f"
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* PHẦN NỘI DUNG TEXT */}
      <div className="p-4 flex flex-col flex-grow justify-between relative z-0">
        <div>
          <h3 className="font-bold text-slate-800 text-[14px] leading-snug group-hover:text-secondary-foreground transition-colors line-clamp-2 min-h-[40px]">
            {blog.title}
          </h3>
          <p className="text-slate-500 text-[12px] mt-2 line-clamp-3 leading-relaxed">
            {blog.excerpt}
          </p>
        </div>

        {/* PHẦN FOOTER CHỨA META-DATA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 relative z-20">
          <div className="flex items-center justify-between text-secondary-foreground text-[11px]">
            {/* Avatar tác giả giả lập */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-cyan-600 text-secondary-foreground flex items-center justify-center font-bold text-[9px]">
                {blog.authorName.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-medium text-secondary-foreground">
                {blog.authorName}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" /> {blog.views}
              </span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {blog.date}
              </span>
            </div>
          </div>

          {/* Nút đọc thêm trực quan */}
          <span className="text-[12px] font-bold text-[#0891b2] group-hover:text-secondary-foreground mt-1 inline-flex items-center gap-0.5 transition-colors">
            Đọc thêm <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
