import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/candidate/Header';
import Footer from '@/components/candidate/Footer';
import { mockBlogs, mockBlogCategories, mockUsers } from '@/mocks/mockData';
import { Eye, Calendar, ArrowLeft, User, Tag } from 'lucide-react';
import { Metadata } from 'next';
import { InteractiveTOC } from '@/components/blog/InteractiveTOC';
import { LandingPageIframe } from '@/components/blog/LandingPageIframe';
import BlogDetailClient from '@/components/blog/BlogDetailClient';

interface RouteProps {
    params: Promise<{ slug: string }>;
}

// 1. TẠO THẺ META SEO ĐỘNG (DỰA TRÊN DỮ LIỆU BÀI VIẾT)
export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const blog = mockBlogs.find(b => b.slug === slug);
    if (!blog || !blog.isPublished) return {};

    const category = mockBlogCategories.find(c => c.id === blog.categoryId);
    const domain = 'https://pqjobs.vn'; // Domain chính thức giả lập

    return {
        title: `${blog.title} | Cẩm Nang Việc Làm Phú Quốc`,
        description: blog.excerpt || `Đọc bài viết ${blog.title} tại PQJobs để nhận các kinh nghiệm tuyển dụng resort và đời sống mới nhất tại đảo ngọc Phú Quốc.`,
        alternates: {
            canonical: `${domain}/blog/${blog.slug}`,
        },
        openGraph: {
            title: blog.title,
            description: blog.excerpt || '',
            url: `${domain}/blog/${blog.slug}`,
            siteName: 'PQJobs Phú Quốc',
            images: [
                {
                    url: blog.thumbnail || 'https://images.unsplash.com/photo-1540206395-68808572332f',
                    width: 1200,
                    height: 630,
                    alt: blog.title,
                },
            ],
            type: 'article',
            publishedTime: blog.createdAt,
            modifiedTime: blog.updatedAt || blog.createdAt,
            section: category?.name || 'Cẩm nang tuyển dụng',
        },
        twitter: {
            card: 'summary_large_image',
            title: blog.title,
            description: blog.excerpt || '',
            images: [blog.thumbnail || 'https://images.unsplash.com/photo-1540206395-68808572332f'],
        },
    };
}

// 2. SERVER COMPONENT CHÍNH
export default async function BlogDetailPage({ params }: RouteProps) {
    const { slug } = await params;
    const blog = mockBlogs.find(b => b.slug === slug);

    if (!blog || !blog.isPublished) notFound();

    const category = mockBlogCategories.find(c => c.id === blog.categoryId);
    const categoryName = category?.name ?? 'Cẩm nang';
    const author = mockUsers.find(u => u.id === blog.authorId);
    const authorName = author?.name ?? 'Ban biên tập';

    const relatedBlogs = mockBlogs.filter(
        b => b.categoryId === blog.categoryId && b.id !== blog.id && (b as any).isPublished
    ).slice(0, 3);

    // Trích xuất tự động mục lục h2
    const headings = (() => {
        if (!blog.content) return [];
        const matches = Array.from(blog.content.matchAll(/<h2>(.*?)<\/h2>/g));
        return matches.map(match => match[1].replace(/^\d+\.\s*/, ''));
    })();

    const formattedDate = new Date(blog.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const viewCount = blog.views >= 1000 ? `${(blog.views / 1000).toFixed(1)}k` : blog.views;

    // Cấu trúc dữ liệu Schema Markup Article cho Google bot đọc
    const schemaMarkup = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': blog.title,
        'description': blog.excerpt,
        'image': [blog.thumbnail || 'https://images.unsplash.com/photo-1540206395-68808572332f'],
        'datePublished': blog.createdAt,
        'dateModified': blog.updatedAt || blog.createdAt,
        'author': {
            '@type': 'Person',
            'name': authorName,
            'url': 'https://pqjobs.vn'
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'PQJobs Phú Quốc',
            'logo': {
                '@type': 'ImageObject',
                'url': 'https://pqjobs.vn/logo.png'
            }
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `https://pqjobs.vn/blog/${blog.slug}`
        }
    };

    // Top popular blogs for sidebar
    const parseViews = (viewsStr: string | number): number => {
        if (typeof viewsStr === 'number') return viewsStr;
        const cleanStr = viewsStr.toLowerCase().trim();
        if (cleanStr.endsWith('k')) {
            return parseFloat(cleanStr.replace('k', '')) * 1000;
        }
        return parseFloat(cleanStr) || 0;
    };
    const popularBlogs = [...mockBlogs]
        .sort((a, b) => parseViews(b.views) - parseViews(a.views))
        .slice(0, 3);

    return (
        <div className={`min-h-screen flex flex-col font-sans text-slate-800 ${blog.type === 'NORMAL' ? 'bg-[#f7f9ff] dark:bg-[#071a2b]' : 'bg-white'}`}>
            {/* NHÚNG SCHEMA MARKUP (JSON-LD) CHO GOOGLE SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
            />

            {blog.type === 'NORMAL' ? (
                /* ── BÀI VIẾT THƯỜNG ── */
                <BlogDetailClient
                    blog={blog as any}
                    categoryName={categoryName}
                    authorName={authorName}
                    relatedBlogs={relatedBlogs}
                    popularBlogs={popularBlogs}
                />
            ) : (
                /* ── LANDING PAGE ── */
                (() => {
                    const isFullHtml = blog.landing_content?.html.trim().startsWith('<!DOCTYPE html>') || blog.landing_content?.html.includes('<html') || blog.landing_content?.html.includes('<HTML');
                    if (isFullHtml) {
                        return blog.landing_content ? (
                            <div className="w-screen h-screen overflow-hidden">
                                <LandingPageIframe
                                    css={blog.landing_content.css}
                                    html={blog.landing_content.html}
                                    js={blog.landing_content.js}
                                    fullScreen={true}
                                />
                            </div>
                        ) : (
                            <p className="text-center py-10 text-slate-400 italic">Landing page chưa có nội dung.</p>
                        );
                    }

                    return (
                        <>
                            <Header />
                            <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
                                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-600 transition-colors mb-6">
                                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài viết
                                </Link>
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                                        <span className="inline-block bg-violet-50 text-violet-600 border border-violet-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                                            Landing Page
                                        </span>
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-4">{blog.title}</h1>
                                        <p className="text-slate-500 text-sm">{blog.excerpt}</p>
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-4">
                                            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{authorName}</span>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formattedDate}</span>
                                            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{viewCount} lượt xem</span>
                                        </div>
                                    </div>
                                    {blog.landing_content ? (
                                        <LandingPageIframe
                                            css={blog.landing_content.css}
                                            html={blog.landing_content.html}
                                            js={blog.landing_content.js}
                                        />
                                    ) : (
                                        <p className="text-center py-10 text-slate-400 italic">Landing page chưa có nội dung.</p>
                                    )}
                                </div>
                            </main>
                            <Footer />
                        </>
                    );
                })()
            )}
        </div>
    );
}