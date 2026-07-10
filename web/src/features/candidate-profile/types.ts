export interface Experience {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

export type CandidateProfilePayload = {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  address: string;
  degree: string;
  languages: string;
  skills: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  socialLinks: {
    facebook: string;
    linkedin: string;
    github: string;
    website: string;
  };
};
