import { apiPost } from "@/lib/api-client";

export function trackBlogView(slug: string) {
  return apiPost(`/api/v1/blogs/slug/${slug}/view`);
}
