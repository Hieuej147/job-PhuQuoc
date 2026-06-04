import { MetadataRoute } from 'next';
import { mockBlogs } from '@/mocks/mockData';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pqjobs.vn'; // Domain chính thức giả định của bạn

  // 1. Các trang tĩnh chính (Silo bậc 1 & 2)
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // 2. Các trang chi tiết bài viết động (Silo bậc 3)
  const blogRoutes = mockBlogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt || blog.createdAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
