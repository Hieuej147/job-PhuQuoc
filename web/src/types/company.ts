export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  industry: string;
  size: string;
  wardId?: string;
  isApproved: boolean;
  location: string;
  jobCount?: number;
  isHot?: boolean;
  isFeatured?: boolean;
  coverGradient?: string;
  initials?: string;
  logoColor?: string;
}
