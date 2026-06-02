import type { Metadata } from 'next';
import { mockHomeBlogs, mockBlogCategories } from '@/mocks/mockData';
import BlogPageClient from './_components/BlogPageClient';

// ── SEO META ĐỘNG CHO TRANG DANH SÁCH BLOG ──────────────────────────────────
export const metadata: Metadata = {
    title: 'Cẩm Nang Việc Làm Phú Quốc | Blog Tuyển Dụng Resort & Du Lịch',
    description: 'Kinh nghiệm xin việc, bảng lương resort 5 sao, bí quyết phỏng vấn và đời sống làm việc tại Phú Quốc. Cập nhật mới nhất từ PQJobs.',
    alternates: {
        canonical: 'https://pqjobs.vn/blog',
    },
    openGraph: {
        title: 'Cẩm Nang Việc Làm Phú Quốc | Blog PQJobs',
        description: 'Kinh nghiệm, bí quyết xin việc resort cao cấp và đời sống Phú Quốc từ các biên tập viên của PQJobs.',
        url: 'https://pqjobs.vn/blog', //mẫu thui 
        siteName: 'PQJobs Phú Quốc',
        images: [
            {
                url: 'https://images.unsplash.com/photo-1540206395-68808572332f?w=1200',
                width: 1200,
                height: 630,
                alt: 'Cẩm nang việc làm Phú Quốc - PQJobs Blog',
            },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cẩm Nang Việc Làm Phú Quốc | Blog PQJobs',
        description: 'Kinh nghiệm xin việc, bảng lương resort, bí quyết phỏng vấn tại Phú Quốc.',
        images: ['https://images.unsplash.com/photo-1540206395-68808572332f?w=1200'],
    },
};

export default function BlogPage() {
    // ── SCHEMA JSON-LD CHO TRANG DANH SÁCH BLOG ─────────────────────────────
    const schemaMarkup = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Blog',
                '@id': 'https://pqjobs.vn/blog/#blog',
                'name': 'Cẩm nang việc làm Phú Quốc - PQJobs Blog',
                'url': 'https://pqjobs.vn/blog',
                'description': 'Kinh nghiệm xin việc, bảng lương resort 5 sao, bí quyết phỏng vấn và đời sống làm việc tại Phú Quốc.',
                'publisher': {
                    '@type': 'Organization',
                    '@id': 'https://pqjobs.vn/#organization',
                    'name': 'PQJobs Phú Quốc',
                },
                'blogPost': mockHomeBlogs.map(blog => ({
                    '@type': 'BlogPosting',
                    'headline': blog.title,
                    'url': `https://pqjobs.vn/blog/${blog.slug}`,
                    'description': blog.excerpt,
                    'datePublished': blog.date,
                    'author': {
                        '@type': 'Person',
                        'name': blog.authorName,
                    },
                    'articleSection': blog.categoryName,
                })),
            },
            {
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': 'Trang chủ',
                        'item': 'https://pqjobs.vn/Candidate',
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': 'Cẩm nang Blog',
                        'item': 'https://pqjobs.vn/blog',
                    },
                ],
            },
        ],
    };

    return (
        <>
            {/* NHÚNG SCHEMA JSON-LD (SERVER SIDE — KHÔNG CẦN JS ĐỂ ĐỌC) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
            />
            {/* PHẦN TƯƠNG TÁC (useState, filter, search...) TÁCH THÀNH CLIENT */}
            <BlogPageClient />
        </>
    );
}