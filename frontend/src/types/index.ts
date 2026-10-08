export interface User {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
}

export interface Internship {
  id: number;
  job_title: string;
  company_name: string;
  description: string;
  location?: string;
  stipend_min?: number;
  stipend_max?: number;
  required_skills: string[];
  status: string;
  source: string;
}

export interface Application {
  id: number;
  internship: Internship;
  status: string;
  notes?: string;
  interview_date?: string;
  follow_up_date?: string;
}

export interface ApplicationSummaryCounts {
  pending: number;
  selected: number;
  rejected: number;
  withdrawn: number;
  total: number;
}

export interface AdminStudentSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  cgpa?: number;
  application_summary: ApplicationSummaryCounts;
}

export interface AdminStudentDetail extends AdminStudentSummary {
  applications: {
    internship_id: number;
    job_title: string;
    company_name: string;
    status: string;
    applied_date?: string;
    interview_date?: string;
    follow_up_date?: string;
    notes?: string;
  }[];
}

export interface StudentProfile {
  id: number;
  college?: string;
  degree?: string;
  branch?: string;
  current_year?: number;
  graduation_year?: number;
  cgpa?: number;
  skills: any[];
  projects: any[];
  certifications: any[];
  experience: any[];
  resume?: any;
}
