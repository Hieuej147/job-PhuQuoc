"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { Blog } from "@/types/blog";
import { BlogContentRender } from "./BlogContentRender";
import { trackBlogView } from "@/features/blog-detail/api";

interface BlogDetailClientProps {
  blog: Blog;
  categoryName: string;
  authorName: string;
  relatedBlogs: Blog[];
  popularBlogs: Blog[];
}

export default function BlogDetailClient({
  blog,
  categoryName,
  authorName,
  relatedBlogs,
  popularBlogs,
}: BlogDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [email, setEmail] = useState("");
  const [viewCount, setViewCount] = useState(blog.views || 0);
  const hasTrackedView = useRef(false);

  // Extract headings for TOC
  const headingsList = useMemo(() => {
    if (!blog.content) return [];
    return extractHeadingsFromTiptap(blog.content);
  }, [blog.content]);

  useEffect(() => {
    hasTrackedView.current = false;
    setViewCount(blog.views || 0);

    const timer = window.setTimeout(async () => {
      if (hasTrackedView.current) return;
      hasTrackedView.current = true;

      try {
        await trackBlogView(blog.slug);
        setViewCount((current) => current + 1);
      } catch (error) {
        console.error("Không thể ghi nhận lượt xem blog:", error);
      }
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [blog.slug, blog.views]);

  // Handle scroll for TOC active states, reading progress and scroll animations
  useEffect(() => {
    const handleScroll = () => {
      // Reading progress
      const article = document.getElementById("article-content");
      const bar = document.getElementById("reading-progress");
      if (article && bar) {
        const rect = article.getBoundingClientRect();
        const total = article.offsetHeight - window.innerHeight;
        const scrolled = Math.max(0, -rect.top);
        const pct = Math.min(1, scrolled / Math.max(1, total));
        bar.style.transform = `scaleX(${pct})`;
      }

      // TOC active highlights
      const headingElements = document.querySelectorAll(".article-body h2");
      let current = -1;
      headingElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          current = index;
        }
      });
      setActiveIndex(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [blog.content]);

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
  }, []);

  const scrollToHeading = (index: number) => {
    const headingElements = document.querySelectorAll(".article-body h2");
    if (headingElements[index]) {
      const y =
        headingElements[index].getBoundingClientRect().top +
        window.pageYOffset -
        100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    const article = document.getElementById("article-content");
    if (article) {
      const y =
        article.getBoundingClientRect().bottom + window.pageYOffset - 300;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleLike = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/blog/${blog.slug}`);
      return;
    }
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    if (!liked) toast.success("Đã thêm bài viết vào danh sách yêu thích!");
    else toast.info("Đã gỡ bài viết khỏi danh sách yêu thích.");
  };

  const handleSave = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/blog/${blog.slug}`);
      return;
    }
    toast.success("Đã lưu bài viết để đọc sau!");
  };

  const formattedDate = new Date(blog.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formatViews = (val: number): string => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + "k";
    }
    return String(val);
  };

  const authorInitials = authorName
    ? authorName.slice(0, 2).toUpperCase()
    : "BB";

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#001e30] dark:bg-[#071a2b] dark:text-[#e0f2fe] font-sans antialiased overflow-x-hidden">
      {/* Reading progress bar */}
      <div
        id="reading-progress"
        className="fixed top-16 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0e7490] to-[#0d9488] z-40 origin-left transition-transform duration-100"
        style={{ transform: "scaleX(0)" }}
      />

      {/* HERO */}
      <div className="pt-0">
        <div className="bg-gradient-to-br from-[#004d62] via-[#0e7490] to-[#0d9488] dark:from-[#001522] dark:via-[#00293a] dark:to-[#002e2a] py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8 fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-3">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-white/65 mb-6">
                  <Link href="/" className="hover:text-white transition-colors">
                    Trang chủ
                  </Link>
                  <span className="material-symbols-outlined text-[14px]">
                    chevron_right
                  </span>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                  <span className="material-symbols-outlined text-[14px]">
                    chevron_right
                  </span>
                  <span className="text-white font-medium">{categoryName}</span>
                </nav>

                {/* Category badge */}
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 mb-4">
                  <span className="material-symbols-outlined text-[14px]">
                    hotel
                  </span>{" "}
                  {categoryName}
                </span>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
                  {blog.title}
                </h1>

                {/* Excerpt */}
                <p className="text-white/80 text-sm leading-relaxed max-w-2xl mb-6">
                  {blog.excerpt}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-5 text-white/65 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                      {authorInitials}
                    </div>
                    <span className="text-white/85 font-semibold">
                      {authorName}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      calendar_today
                    </span>{" "}
                    {formattedDate}
                  </span>

                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      visibility
                    </span>{" "}
                    {formatViews(viewCount)} lượt xem
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* LEFT COLUMN: ARTICLE BODY */}
          <div className="lg:col-span-3">
            <article id="article-content" className="fade-up stagger-1">
              <BlogContentRender
                content={normalizeBlogContent(blog.content)}
                className="max-w-none"
              />

              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-[#e0f5fb] dark:border-[#1a3d5c]">
                <p className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8] mb-3">
                  Thẻ liên quan:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[0.72rem] bg-teal-500/10 dark:bg-cyan-500/12 text-[#0d9488] dark:text-[#67e8f9] font-semibold px-2.5 py-1 rounded-[6px]">
                    Resort 5 sao
                  </span>
                  <span className="text-[0.72rem] bg-teal-500/10 dark:bg-cyan-500/12 text-[#0d9488] dark:text-[#67e8f9] font-semibold px-2.5 py-1 rounded-[6px]">
                    Kỹ năng khách sạn
                  </span>
                  <span className="text-[0.72rem] bg-teal-500/10 dark:bg-cyan-500/12 text-[#0d9488] dark:text-[#67e8f9] font-semibold px-2.5 py-1 rounded-[6px]">
                    Phú Quốc
                  </span>
                  <span className="text-[0.72rem] bg-teal-500/10 dark:bg-cyan-500/12 text-[#0d9488] dark:text-[#67e8f9] font-semibold px-2.5 py-1 rounded-[6px]">
                    Tiếng Anh
                  </span>
                  <span className="text-[0.72rem] bg-teal-500/10 dark:bg-cyan-500/12 text-[#0d9488] dark:text-[#67e8f9] font-semibold px-2.5 py-1 rounded-[6px]">
                    Tuyển dụng
                  </span>
                  <span className="text-[0.72rem] bg-teal-500/10 dark:bg-cyan-500/12 text-[#0d9488] dark:text-[#67e8f9] font-semibold px-2.5 py-1 rounded-[6px]">
                    Nghề khách sạn
                  </span>
                </div>
              </div>

              {/* Engagement Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-[18px] py-2 border rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    liked
                      ? "border-pink-500 text-pink-500 bg-pink-50 dark:bg-pink-950/20"
                      : "border-[#e0f5fb] dark:border-[#1a3d5c] bg-white dark:bg-[#0d2137] text-slate-500 dark:text-[#94a3b8] hover:border-pink-500 hover:text-pink-500"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{
                      fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    favorite
                  </span>
                  <span>{likeCount}</span> Yêu thích
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Đã sao chép đường dẫn bài viết!");
                  }}
                  className="flex items-center gap-1.5 px-[18px] py-2 border border-[#e0f5fb] dark:border-[#1a3d5c] rounded-full text-xs font-semibold cursor-pointer bg-white dark:bg-[#0d2137] text-slate-500 dark:text-[#94a3b8] hover:border-[#0e7490] hover:text-[#0e7490] transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    share
                  </span>{" "}
                  Chia sẻ
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-[18px] py-2 border border-[#e0f5fb] dark:border-[#1a3d5c] rounded-full text-xs font-semibold cursor-pointer bg-white dark:bg-[#0d2137] text-slate-500 dark:text-[#94a3b8] hover:border-[#0e7490] hover:text-[#0e7490] transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    bookmark
                  </span>{" "}
                  Lưu bài
                </button>
              </div>

              {/* Author Card */}
              <div className="mt-8 bg-white dark:bg-[#0d2137] border border-[#e0f5fb] dark:border-[#1a3d5c] rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0e7490] to-[#0d9488] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {authorInitials}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#001e30] dark:text-[#e0f2fe]">
                    {authorName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-2">
                    Chuyên gia nhân sự ngành khách sạn & du lịch Phú Quốc
                  </p>
                  <p className="text-sm text-slate-600 dark:text-[#cbd5e1]">
                    Đội ngũ biên tập PQJobs với hơn 10 năm kinh nghiệm trong
                    lĩnh vực tuyển dụng và đào tạo nhân lực du lịch tại Phú
                    Quốc.
                  </p>
                </div>
              </div>
            </article>

            {/* Related Blogs */}
            <div className="mt-12">
              <h2 className="text-lg font-bold text-[#005a71] dark:text-[#67e8f9] mb-6 flex items-center gap-2 fade-up">
                <span className="material-symbols-outlined">auto_stories</span>{" "}
                Bài viết liên quan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {relatedBlogs.map((b, idx) => (
                  <div
                    key={b.id}
                    className={`fade-up stagger-${(idx % 2) + 1}`}
                  >
                    <Link
                      href={`/blog/${b.slug}`}
                      className="related-blog group bg-white dark:bg-[#0d2137] border border-[#e0f5fb] dark:border-[#1a3d5c] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
                    >
                      <div className="h-36 bg-gradient-to-br from-[#0EA5E9] to-[#006a61] relative flex items-center justify-center overflow-hidden">
                        {b.thumbnail ? (
                          <img
                            src={
                              b.thumbnail ||
                              "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"
                            }
                            alt={b.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <span
                            className="material-symbols-outlined text-white/25"
                            style={{ fontSize: "60px" }}
                          >
                            restaurant
                          </span>
                        )}
                        <span className="absolute top-3 left-3 bg-black/40 text-white text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {categoryName}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-sm text-[#001e30] dark:text-[#e0f2fe] group-hover:text-[#005a71] dark:group-hover:text-[#67e8f9] transition-colors line-clamp-2">
                          {b.title}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-[#94a3b8]">
                          <span>
                            {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                          <span>•</span>
                          <span>{formatViews(b.views)} lượt xem</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className="space-y-5 lg:col-span-1">
            {/* 1. Dynamic Table of Contents (TOC) */}
            {headingsList.length > 0 && (
              <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#e0f5fb] dark:border-[#1a3d5c] p-5 lg:sticky lg:top-20 shadow-sm fade-up stagger-1">
                <h3 className="font-bold text-sm text-[#005a71] dark:text-[#67e8f9] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    toc
                  </span>{" "}
                  Mục lục
                </h3>
                <div className="border-t border-[#e0f5fb] dark:border-[#1a3d5c] mb-3" />
                <nav className="space-y-0.5">
                  {headingsList.map((heading, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToHeading(i)}
                      className={`w-full text-left toc-link block text-xs py-1.5 px-2 rounded-lg transition-colors leading-relaxed ${
                        activeIndex === i
                          ? "bg-[#005a71]/10 text-[#005a71] dark:bg-[#67e8f9]/10 dark:text-[#67e8f9] font-semibold"
                          : "text-slate-500 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-[#67e8f9]/5 hover:text-[#005a71] dark:hover:text-[#67e8f9]"
                      }`}
                    >
                      {i + 1}. {heading}
                    </button>
                  ))}
                  <button
                    onClick={scrollToBottom}
                    className="w-full text-left toc-link text-slate-500 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-[#67e8f9]/5 hover:text-[#005a71] dark:hover:text-[#67e8f9] block text-xs py-1.5 px-2 rounded-lg transition-colors border-t border-[#e0f5fb] dark:border-[#1a3d5c] mt-2 pt-2"
                  >
                    Tổng kết
                  </button>
                </nav>
              </div>
            )}

            {/* 2. CTA: Find jobs */}
            <div className="bg-gradient-to-br from-[#004d62] to-[#0d9488] dark:from-[#001522] dark:to-[#002e2a] rounded-2xl p-5 text-center shadow-sm fade-up stagger-2">
              <span className="material-symbols-outlined text-[#67e8f9] text-4xl mb-3 block">
                work_history
              </span>
              <p className="font-bold text-white text-sm mb-1">
                Tìm việc tại resort ngay!
              </p>
              <p className="text-white/70 text-xs mb-4">
                Rất nhiều vị trí đang tuyển dụng tại Phú Quốc
              </p>
              <Link
                href="/"
                className="block w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-2.5 rounded-xl text-sm transition-colors text-center"
              >
                Xem việc làm →
              </Link>
            </div>

            {/* 3. Newsletter */}
            <div className="bg-white dark:bg-[#0d2137] border border-[#e0f5fb] dark:border-[#1a3d5c] rounded-2xl p-5 shadow-sm fade-up stagger-3">
              <h3 className="font-bold text-sm text-[#005a71] dark:text-[#67e8f9] mb-1">
                Nhận bài viết mới
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-3">
                Cẩm nang nghề nghiệp ngay trong hộp thư
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn..."
                className="w-full text-sm border border-slate-200 dark:border-[#1a3d5c] rounded-xl px-3 py-2 bg-[#f7f9ff] dark:bg-[#0a1e30] text-[#001e30] dark:text-[#e0f2fe] focus:ring-2 focus:ring-[#005a71]/30 focus:outline-none mb-2"
              />
              <button
                onClick={() => {
                  if (!email) return toast.error("Vui lòng nhập email hợp lệ!");
                  toast.success("Đăng ký nhận bài thành công!");
                  setEmail("");
                }}
                className="w-full bg-[#005a71] dark:bg-[#0e7490] text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Đăng ký nhận bài
              </button>
            </div>

            {/* 4. Popular posts */}
            <div className="bg-white dark:bg-[#0d2137] border border-[#e0f5fb] dark:border-[#1a3d5c] rounded-2xl p-5 shadow-sm fade-up stagger-4">
              <h3 className="font-bold text-sm text-[#005a71] dark:text-[#67e8f9] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  trending_up
                </span>{" "}
                Bài đọc nhiều
              </h3>
              <div className="space-y-3">
                {popularBlogs.map((b, idx) => (
                  <div key={b.id}>
                    <Link
                      href={`/blog/${b.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <span className="text-xl font-bold text-slate-300 dark:text-[#1a3d5c] w-6 shrink-0">
                        0{idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-[#001e30] dark:text-[#e0f2fe] group-hover:text-[#005a71] dark:group-hover:text-[#67e8f9] transition-colors line-clamp-2 leading-normal">
                        {b.title}
                      </p>
                    </Link>
                    {idx < popularBlogs.length - 1 && (
                      <div className="border-t border-[#e0f5fb] dark:border-[#1a3d5c] my-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractHeadingsFromTiptap(content: unknown) {
  const headings: string[] = [];

  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "heading" && node.attrs?.level === 2) {
      const text = collectText(node).replace(/^\d+\.\s*/, "").trim();
      if (text) headings.push(text);
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };

  walk(content);
  return headings;
}

function collectText(node: any): string {
  if (!node || typeof node !== "object") return "";
  if (typeof node.text === "string") return node.text;
  if (!Array.isArray(node.content)) return "";
  return node.content.map(collectText).join("");
}

function normalizeBlogContent(content: unknown) {
  if (!content) return null;
  if (typeof content === "object") return content as Record<string, unknown>;
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: String(content).replace(/<[^>]+>/g, " ").trim() }],
      },
    ],
  };
}
