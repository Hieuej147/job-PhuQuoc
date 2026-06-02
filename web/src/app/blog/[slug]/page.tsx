import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/candidate/Header';
import Footer from '@/components/candidate/Footer';
import { mockBlogs, mockBlogCategories, mockUsers } from '@/mocks/mockData';
import { Eye, Calendar, ArrowLeft, User, Tag } from 'lucide-react';
import { Metadata } from 'next';
import { InteractiveTOC } from '@/components/blog/InteractiveTOC';
import { LandingPageIframe } from '@/components/blog/LandingPageIframe';

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* NHÚNG SCHEMA MARKUP (JSON-LD) CHO GOOGLE SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
            />

            <Header />

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
                {/* Silo liên kết ngược (Breadcrumb / Back Link) */}
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-600 transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài viết
                </Link>

                {blog.type === 'NORMAL' ? (
                    /* ── BÀI VIẾT THƯỜNG ── */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        <div className="lg:col-span-8">
                            <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-10">
                                {blog.thumbnail && (
                                    <img src={blog.thumbnail} alt={blog.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-6" />
                                )}

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-600">
                                        {categoryName}
                                    </span>
                                </div>

                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-4">{blog.title}</h1>

                                <div className="flex flex-wrap gap-4 text-xs text-slate-500 pb-6 border-b border-slate-100 mb-6">
                                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{authorName}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formattedDate}</span>
                                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{viewCount} lượt xem</span>
                                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />{categoryName}</span>
                                </div>

                                <div
                                    className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-cyan-600 prose-img:rounded-xl"
                                    dangerouslySetInnerHTML={{ __html: blog.content || '' }}
                                />
                            </article>
                        </div>

                        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 self-start">
                            {/* Khối Mục lục Tương tác */}
                            {headings.length > 0 && (
                                <InteractiveTOC headings={headings} />
                            )}

                            {/* Khối Banner Tuyển dụng */}
                            <div className="bg-gradient-to-br from-[#025a70] to-[#0891b2] rounded-2xl p-6 text-center text-white shadow-sm flex flex-col items-center gap-4 relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />

                                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-[15px] leading-snug">Tìm việc tại resort ngay!</h4>
                                    <p className="text-[12px] text-teal-50/90 mt-1">350+ vị trí đang tuyển dụng tại Phú Quốc</p>
                                </div>

                                <Link href="/Candidate" className="w-full py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-[13px] rounded-xl transition-all shadow-sm active:scale-[0.98] block">
                                    Xem việc làm →
                                </Link>
                            </div>
                        </aside>

                    </div>
                ) : (
                    /* ── LANDING PAGE ── */
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
                )}

                {/* Bài viết liên quan */}
                {relatedBlogs.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Bài viết liên quan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedBlogs.map(rb => (
                                <Link key={rb.id} href={`/blog/${rb.slug}`} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-cyan-500 hover:shadow-sm transition-all flex flex-col h-full">
                                    {rb.thumbnail && <img src={rb.thumbnail} alt={rb.title} className="w-full h-32 object-cover rounded-lg mb-3" />}
                                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug hover:text-cyan-600 flex-grow">{rb.title}</h3>
                                    <div className="flex gap-3 mt-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {rb.views}</span>
                                        <span>{new Date(rb.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
}