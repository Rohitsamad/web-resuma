export type ChapterId =
  | 'overview'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'credentials';

export type CameraViewId = 'gallery' | ChapterId;

export type MaterialFinish = 'titanium' | 'brass' | 'obsidian';

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  impactMetric: string;
  summary: string;
  highlights: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  category: string;
  year: string;
  metric: string;
  description: string;
  stack: string;
  linkLabel?: string;
  linkUrl?: string;
}

export interface SkillGroup {
  id: string;
  domain: string;
  proficiency: string;
  items: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  period: string;
  honors: string;
}

export interface ResumeProfile {
  name: string;
  headline: string;
  location: string;
  availability: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  yearsExperience: string;
  bio: string;
  keyMetrics: {
    label: string;
    value: string;
  }[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  education: EducationItem[];
  workshops: string[];
  languages: string[];
  softSkills: string[];
  interests: string[];
}
