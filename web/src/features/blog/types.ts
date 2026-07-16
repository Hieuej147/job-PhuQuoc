export type BlogPostStatus = "DRAFT" | "PUBLISHED";

export interface BlogCategoryOption {
  id: string;
  name: string;
}

export interface BlogEditorState {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  status: BlogPostStatus;
  categoryId: string;
  content: Record<string, unknown> | null;
}

export interface BlogPostPayload {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  categoryId?: string | null;
  content?: unknown;
  isPublished?: boolean;
}
