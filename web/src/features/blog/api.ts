import { apiGet, apiPatch, apiPost, unwrapApiPayload } from "@/lib/api-client";
import type { BlogCategoryOption, BlogEditorState, BlogPostPayload } from "./types";

export const EMPTY_BLOG_EDITOR_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function extractList<T>(payload: any): T[] {
  const data = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data?.items)
      ? payload.data.items
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
  return data as T[];
}

function toTiptapDoc(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text ? [{ type: "text", text: text.replace(/<[^>]+>/g, " ").trim() }] : undefined,
      },
    ],
  };
}

function normalizeContent(content: unknown): Record<string, unknown> {
  if (!content) return EMPTY_BLOG_EDITOR_DOC;
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    if (parsed && typeof parsed === "object" && (parsed as any).type === "doc") {
      return parsed as Record<string, unknown>;
    }
    return toTiptapDoc(String(content));
  } catch {
    return toTiptapDoc(String(content));
  }
}

export async function fetchBlogCategories() {
  const payload = await apiGet<any>("/api/v1/blog-categories");
  return extractList<BlogCategoryOption>(payload);
}

export async function fetchBlogBySlug(slug: string): Promise<BlogEditorState> {
  const payload = await apiGet<any>(`/api/v1/blogs/slug/${slug}`);
  const data = unwrapApiPayload<BlogPostPayload>(payload);
  return {
    id: data.id,
    title: data.title || "",
    slug: data.slug || "",
    excerpt: data.excerpt || "",
    coverImage: data.thumbnail || "",
    status: data.isPublished ? "PUBLISHED" : "DRAFT",
    categoryId: data.categoryId || "",
    content: normalizeContent(data.content),
  };
}

export function createBlogPost(state: BlogEditorState, status = state.status) {
  return apiPost<{ slug?: string }>("/api/v1/blogs", {
    title: state.title,
    slug: state.slug,
    excerpt: state.excerpt,
    thumbnail: state.coverImage,
    content: state.content,
    type: "NORMAL",
    categoryId: state.categoryId || undefined,
    isPublished: status === "PUBLISHED",
  });
}

export function updateBlogPost(id: string, state: BlogEditorState, status = state.status) {
  return apiPatch<{ slug?: string }>(`/api/v1/blogs/${id}`, {
    title: state.title,
    slug: state.slug,
    excerpt: state.excerpt,
    thumbnail: state.coverImage,
    content: state.content,
    categoryId: state.categoryId || undefined,
    isPublished: status === "PUBLISHED",
  });
}
