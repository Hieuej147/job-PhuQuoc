export interface ResumeInfo {
  id: string;
  title: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  address?: string | null;
  summary?: string | null;
  degree?: string | null;
  languages?: string | null;
  socialLinks?: any;
  projects?: any;
  experience?: any;
  education?: any;
  skills?: string | null;
  template?: { id: string; name: string } | null;
  user?: { name: string; email: string; phone?: string | null; image?: string | null } | null;
}

export interface ApplicationMessage {
  id: string;
  body: string;
  senderId: string;
  senderRole: "CANDIDATE" | "EMPLOYER";
  createdAt: string;
  readAt?: string | null;
}

export interface EmployerApplication {
  id: string;
  status: string;
  createdAt: string;
  cvUrl?: string | null;
  resumeId?: string | null;
  coverLetter?: string | null;
  employerMessage?: string | null;
  chatClosedAt?: string | null;
  chatClosedBy?: string | null;
  chatCloseReason?: string | null;
  messages?: ApplicationMessage[];
  isBookmarked?: boolean;
  user: { id: string; name: string; email: string; phone?: string | null };
  job: { id: string; title: string; company?: { name: string } };
  resume?: ResumeInfo | null;
}

export type CvViewerPayload =
  | { type: "uploaded"; url: string }
  | { type: "resume"; resume: ResumeInfo };

export interface ApplicationCounts {
  total: number;
  pending: number;
  reviewing: number;
  accepted: number;
  rejected: number;
  bookmarked: number;
}

export interface StatusConfig {
  label: string;
  class: string;
  dot: string;
}
