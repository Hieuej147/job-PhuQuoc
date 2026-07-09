export interface DashboardJob {
  id: string;
  title: string;
  status: string;
  jobType?: string;
  level?: string;
  applicationCount?: number;
  newApplicationCount?: number;
  deadline?: string;
}

export interface DashboardApplicant {
  id: string;
  name: string;
  initials: string;
  jobTitle: string;
  timeAgo: string;
  status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";
  coverPreview?: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface DashboardNotification {
  id: string;
  type: "APPLICATION_RECEIVED" | "JOB_APPROVED" | "JOB_DEADLINE" | "COMPANY_APPROVED";
  title: string;
  message: string;
  timeAgo: string;
}

export interface DashboardStats {
  activeJobs: number;
  totalApplicants: number;
  pendingCount: number;
}
