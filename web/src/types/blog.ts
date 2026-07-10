export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail?: string | null;
  views: number;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id?: string;
    name: string;
    image?: string | null;
  };
  category?: BlogCategory;
  categoryId?: string | null;
  content?: Record<string, unknown> | null;
  type?: string;
  isPublished?: boolean;
}
