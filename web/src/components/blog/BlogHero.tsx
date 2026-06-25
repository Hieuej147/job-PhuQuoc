// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE FILE HEADER & CHANGELOG — HuynhhThanh
// ─────────────────────────────────────────────────────────────────────────────
// ==============================================================================
//  File    : web/src/components/blog/BlogHero.tsx
//  Module  : blog
//  Tóm tắt : Component hiển thị bài viết nổi bật phần hero
//  Tác giả : HuynhhThanh
//  Tạo lúc : 2026-06-25 09:35 (UTC+7)
//  Encode  : UTF-8
//  Version : 1.1.0
//            · MAJOR → tăng khi: thay đổi không tương thích ngược (breaking)
//            · MINOR → tăng khi: thêm tính năng mới, không phá vỡ cũ
//            · PATCH → tăng khi: sửa lỗi, không thay đổi hành vi (behavior)
//  Lịch sử :
//  - [2026-06-25 09:35] v1.1.0 : Bỏ hiển thị phút đọc
// ------------------------------------------------------------------------------
//  Changelog — lần thay đổi gần nhất
// ------------------------------------------------------------------------------
//  | Trường          | Nội dung                                                |
//  |-----------------|----------------------------------------------------------|
//  | **Người sửa**   | HuynhhThanh                              |
//  | **Loại**        | Sửa lỗi / Tính năng                                      |
//  | **Mức độ**      | S (1 file)                                               |
//  | **Version**     | `v1.0.0 → v1.1.0`                                        |
//  | **PR / Issue**  | Không                                                    |
//  | **Reviewer**    | HuynhhThanh · ⏳ Pending                                 |
//  | **Tóm tắt**     | Bỏ hiển thị phút đọc trong BlogHero                    |
//  | **Phụ thuộc**   | Không                                                    |
//  | **Skill/Tool**  | Không                                                    |
//  | **Chi tiết**    | - Xóa thẻ span tĩnh hiển thị 8 phút đọc                  |
//  | **Ảnh hưởng**   | Không                                                    |
//  | **Ghi chú**     |                                                          |
//  | **Test / CI**   | ⏳ Chưa chạy                                               |
//  | **Trạng thái**  | ✅ Hoàn thành                                              |
// ==============================================================================
"use client";

import Link from "next/link";

import { MappedBlog } from "@/components/blog/BlogPageClient";

interface BlogHeroProps {
  featured?: MappedBlog;
  formatViews: (val: string | number) => string;
}

export default function BlogHero({ featured, formatViews }: BlogHeroProps) {
  if (!featured) return null;

  return (
    <section className="pt-0">
      <div className="relative overflow-hidden min-h-[480px] flex items-end border-b border-[#E0F5FB] dark:border-[#1E5F74]">
        <img
          src={
            featured.thumbnail ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80"
          }
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
                <p className="text-white text-sm font-semibold">
                  {featured.authorName}
                </p>
                <p className="text-white/60 text-xs">{featured.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  visibility
                </span>{" "}
                {formatViews(featured.views)} lượt xem
              </span>
            </div>
            <Link
              href={`/blog/${featured.slug}`}
              className="ml-auto flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-md"
            >
              Đọc ngay{" "}
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
