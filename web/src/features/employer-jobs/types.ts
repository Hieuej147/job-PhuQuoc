export type JobStatus = "ALL" | "ACTIVE" | "PENDING" | "DRAFT" | "CLOSED" | "EXPIRED";
export type JobSort = "newest" | "most-apps" | "expiring";

export type JobFormState = {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  categoryId: string;
  type: string;
  experience: string;
  level: string;
  salaryMin: string;
  salaryMax: string;
  quantity: string;
};

export type JobCategory = {
  id: string;
  name: string;
};

export type EmployerJob = {
  id: string;
  title: string;
  slug: string;
  status: Exclude<JobStatus, "ALL">;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  level?: string | null;
  experience?: string | null;
  createdAt: string;
  deadline?: string | null;
  boostLevel?: number | null;
  featuredUntil?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  ward?: { name: string; district?: { name: string } | null } | null;
  requirements?: string | null;
  benefits?: string | null;
  description?: string | null;
  quantity?: number | null;
  archivedAt?: string | null;
  _count?: { applications: number };
};

export type EmployerJobsResponse = { items?: EmployerJob[] } | EmployerJob[];
export type JobStats = Record<JobStatus, number>;

export type PricingPackage = {
  id: string;
  name: string;
  days: number;
  price: number;
};
