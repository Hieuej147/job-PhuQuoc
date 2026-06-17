/**
 * @file page.tsx (Blog Detail)
 * @description Trang hiển thị chi tiết một bài viết Blog.
 * @note [HuynhhThanh] Trao đổi dữ liệu: Nhận `slug` từ URL, gọi API Backend (`/api/v1/blogs/slug/:slug`) để lấy dữ liệu thực tế của bài viết, đồng thời gọi thêm API lấy danh sách bài viết liên quan và phổ biến.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Eye, Calendar, ArrowLeft, User } from "lucide-react";
import { Metadata } from "next";
import { LandingPageIframe } from "@/components/blog/LandingPageIframe";
import BlogDetailClient from "@/components/blog/BlogDetailClient";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

async function fetchBlog(slug: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/blogs/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data;
  } catch {
    return null;
  }
}

async function fetchRelatedBlogs(categoryId: string, currentId: string) {
  // should search li,it and not hard code
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/blogs?limit=4`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.items || [])
      .filter((b: any) => b.id !== currentId)
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function fetchPopularBlogs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/blogs?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await fetchBlog(slug);

  if (!blog) return { title: "Không tìm thấy bài viết | PQJobs" };

  return {
    title: `${blog.title} | Cẩm Nang Việc Làm Phú Quốc`,
    description: blog.excerpt || `Đọc bài viết ${blog.title} tại PQJobs.`,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: blog.title,
      description: blog.excerpt || "",
      url: `/blog/${slug}`,
      siteName: "PQJobs Phú Quốc",
      images: blog.thumbnail
        ? [{ url: blog.thumbnail, width: 1200, height: 630 }]
        : [],
      type: "article",
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt || "",
    },
  };
}

export default async function BlogDetailPage({ params }: RouteProps) {
  const { slug } = await params;
  const blog = await fetchBlog(slug);

  if (!blog) notFound();

  const categoryName = blog.category?.name ?? "Cẩm nang";
  const authorName = blog.author?.name ?? "Ban biên tập";

  const [relatedBlogs, popularBlogs] = await Promise.all([
    blog.categoryId ? fetchRelatedBlogs(blog.categoryId, blog.id) : [],
    fetchPopularBlogs(),
  ]);

  // Extract h2 headings for TOC
  const headings = (() => {
    if (!blog.content) return [];
    const matches = Array.from(blog.content.matchAll(/<h2[^>]*>(.*?)<\/h2>/g));
    return matches.map((match: any) => match[1].replace(/^\d+\.\s*/, ""));
  })();

  const formattedDate = new Date(blog.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const viewCount =
    blog.views >= 1000
      ? `${(blog.views / 1000).toFixed(1)}k`
      : String(blog.views || 0);

  // JSON-LD
  const articleJson = articleJsonLd({
    title: blog.title,
    description: blog.excerpt || "",
    slug: blog.slug,
    thumbnail: blog.thumbnail,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    author: blog.author ? { name: blog.author.name } : null,
  });

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: blog.title, url: `/blog/${slug}` },
  ]);

  const isLandingPage = blog.type === "LANDING_PAGE";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans text-slate-800 ${isLandingPage ? "bg-white" : "bg-[#f7f9ff] dark:bg-[#071a2b]"}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {isLandingPage ? (
        (() => {
          const isFullHtml =
            blog.landingContent?.html?.trim().startsWith("<!DOCTYPE html>") ||
            blog.landingContent?.html?.includes("<html");
          if (isFullHtml && blog.landingContent) {
            return (
              <div className="w-screen h-screen overflow-hidden">
                <LandingPageIframe
                  css={blog.landingContent.css}
                  html={blog.landingContent.html}
                  js={blog.landingContent.js}
                  fullScreen={true}
                />
              </div>
            );
          }
          return (
            <>
              <Header />
              <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-600 transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài viết
                </Link>
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                    <span className="inline-block bg-violet-50 text-violet-600 border border-violet-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                      Landing Page
                    </span>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
                      {blog.title}
                    </h1>
                    <p className="text-slate-500 text-sm">{blog.excerpt}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-4">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {authorName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {viewCount} lượt xem
                      </span>
                    </div>
                  </div>
                  <p className="text-center py-10 text-slate-400 italic">
                    Landing page chưa có nội dung.
                  </p>
                </div>
              </main>
              <Footer />
            </>
          );
        })()
      ) : (
        <BlogDetailClient
          blog={blog as any}
          categoryName={categoryName}
          authorName={authorName}
          relatedBlogs={relatedBlogs}
          popularBlogs={popularBlogs}
        />
      )}
    </div>
  );
}
