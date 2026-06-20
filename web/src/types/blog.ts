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
    name: string;
  };
  category?: BlogCategory;
  content?: string;
  type?: string;
}
