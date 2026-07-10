import { apiDelete, apiGet } from "@/lib/api-client";

export function getMyBlogs(queryString: string) {
  return apiGet<any>(`/api/v1/blogs/my?${queryString}`);
}

export function deleteBlogPost(id: string) {
  return apiDelete(`/api/v1/blogs/${id}`);
}
