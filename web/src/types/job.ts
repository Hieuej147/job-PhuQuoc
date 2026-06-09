export interface JobType {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyInitials: string;
  logoColor: string;
  textColor: string;
  contractType: string;
  salary: string;
  experience: string;
  level: string;
  industry: string;
  location: string;
  isFeatured: boolean;
  isUrgent: boolean;
  daysLeft: number;
  postedDate: string;
  tags: string[];
}

export interface BenefitItem {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
}

export interface OverviewItem {
  icon: string;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string;
  valueColor?: string;
}

export interface JobDetailType extends JobType {
  deadline: string;
  views: number;
  applicants: number;
  startDate: string;
  totalSlots: number;
  companySize: string;
  companyWebsite: string;
  companyIndustry: string;
  companyAddress: string;
  description: string;
  required: string[];
  preferred: string[];
  benefits: BenefitItem[];
}

export interface RelatedJobType {
  id: string;
  slug: string;
  logoTextColor: string;
  companyInitials: string;
  title: string;
  company: string;
  contractType: string;
  salary: string;
  location: string;
}

export type ContractType = 'Full-time' | 'Part-time' | 'Remote' | 'Thực tập' | 'Hợp đồng';

export type SortOption = 'newest' | 'salary_high' | 'most_relevant' | 'expiring_soon';

export interface JobFilters {
  keyword: string;
  location: string;
  industries: string[];
  contractTypes: ContractType[];
  salaryRanges: string[];
  experiences: string[];
  levels: string[];
  [key: string]: unknown;
}
