export interface SocialLink {
  platform: string;
  url: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  description: string;
  GPA?: string;
}

export interface Experience {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface Project {
  name: string;
  position: string;
  link: string;
  description: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
  description?: string;
}

export interface ProfileInfo {
  avatar?: string;
  name: string;
  title: string;
  summary: string;
  degree?: string;
  languages?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  socialLinks: SocialLink[];
}

export interface AdditionalInfo {
  interests?: string;
  hobbies?: string;
  customSections?: { title: string; content: string }[];
}

export interface ResumeData {
  profile: ProfileInfo;
  contact: ContactInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: string; // Comma separated or string
  certifications: Certification[];
  additionalInfo?: AdditionalInfo;
}
