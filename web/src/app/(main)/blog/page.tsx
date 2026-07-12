/**
 * @file page.tsx (Blog)
 * @description Trang chính của danh sách Blog/Cẩm nang.
 * @note [HuynhhThanh] Trao đổi dữ liệu: Lấy danh sách bài viết (blogs) và danh mục (blog-categories) từ Backend API (/api/v1/blogs) và truyền xuống component con BlogPageClient.
 */
import type { Metadata } from 'next';
import BlogPageClient from '@/components/blog/BlogPageClient';

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export const metadata: Metadata = {
    title: 'Cẩm Nang Việc Làm Phú Quốc | Blog Tuyển Dụng Resort & Du Lịch',
    description: 'Kinh nghiệm xin việc, bảng lương resort 5 sao, bí quyết phỏng vấn và đời sống làm việc tại Phú Quốc. Cập nhật mới nhất từ PQJobs.',
    alternates: { canonical: '/blog' },
    openGraph: {
        title: 'Cẩm Nang Việc Làm Phú Quốc | Blog PQJobs',
        description: 'Kinh nghiệm, bí quyết xin việc resort cao cấp và đời sống Phú Quốc từ các biên tập viên của PQJobs.',
        url: '/blog',
        siteName: 'PQJobs Phú Quốc',
        images: [{ url: 'https://images.unsplash.com/photo-1540206395-68808572332f?w=1200', width: 1200, height: 630, alt: 'Cẩm nang việc làm Phú Quốc - PQJobs Blog' }],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cẩm Nang Việc Làm Phú Quốc | Blog PQJobs',
        description: 'Kinh nghiệm xin việc, bảng lương resort, bí quyết phỏng vấn tại Phú Quốc.',
        images: ['https://images.unsplash.com/photo-1540206395-68808572332f?w=1200'],
    },
};

async function fetchBlogs(query: { search?: string; category?: string; sort?: string; page?: string } = {}) {
    try {
        const params = new URLSearchParams();
        params.set("limit", "12"); // Limit per page is now 12 instead of 50
        params.set("page", query.page || "1");
        
        if (query.search) params.set("search", query.search);
        if (query.category) params.set("category", query.category);
        if (query.sort) params.set("orderBy", query.sort);

        const res = await fetch(`${BACKEND_URL}/api/v1/blogs?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) return { items: [], totalPages: 0, total: 0 };
        const data = await res.json();
        return data.data || { items: [], totalPages: 0, total: 0 };
    } catch { return { items: [], totalPages: 0, total: 0 }; }
}

async function fetchBlogCategories() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/blog-categories`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data?.items || data.data || [];
    } catch { return []; }
}

import { Suspense } from "react";
import Loading from "./loading";

async function BlogPageContent({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; sort?: string; page?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const [blogsData, categories] = await Promise.all([
        fetchBlogs({
            search: resolvedSearchParams.search,
            category: resolvedSearchParams.category,
            sort: resolvedSearchParams.sort,
            page: resolvedSearchParams.page,
        }),
        fetchBlogCategories()
    ]);
    
    const blogs = blogsData.items || [];
    const totalPages = blogsData.totalPages || 0;


    const schemaMarkup = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Blog',
                '@id': 'https://pqjobs.vn/blog/#blog',
                'name': 'Cẩm nang việc làm Phú Quốc - PQJobs Blog',
                'url': 'https://pqjobs.vn/blog',
                'description': 'Kinh nghiệm xin việc, bảng lương resort 5 sao, bí quyết phỏng vấn và đời sống làm việc tại Phú Quốc.',
                publisher: { '@type': 'Organization', '@id': 'https://pqjobs.vn/#organization', name: 'PQJobs Phú Quốc' },
                blogPost: blogs.map((blog: any) => ({
                    '@type': 'BlogPosting',
                    headline: blog.title,
                    url: `https://pqjobs.vn/blog/${blog.slug}`,
                    description: blog.excerpt,
                    datePublished: blog.createdAt,
                    author: { '@type': 'Person', name: blog.author?.name || 'PQJobs' },
                    articleSection: blog.category?.name || 'Blog',
                })),
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://pqjobs.vn' },
                    { '@type': 'ListItem', position: 2, name: 'Cẩm nang Blog', item: 'https://pqjobs.vn/blog' },
                ],
            },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />
            <BlogPageClient 
                initialBlogs={blogs} 
                initialCategories={categories} 
                initialTotalPages={totalPages}
                initialSearchParams={{
                    page: resolvedSearchParams.page || "1",
                    search: resolvedSearchParams.search || "",
                    category: resolvedSearchParams.category || "all",
                    sort: resolvedSearchParams.sort || "newest"
                }}
            />
        </>
    );
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; sort?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <BlogPageContent searchParams={searchParams} />
    </Suspense>
  );
}
