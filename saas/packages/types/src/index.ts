export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface User {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter' | 'hiring_manager';
  createdAt: string;
}

export interface Job {
  id: string;
  orgId: string;
  title: string;
  description: string;
  location: string;
  type: 'full-time' | 'part-time' | 'remote' | 'contract';
  seniority: 'entry' | 'mid' | 'senior' | 'lead';
  skills: string[];
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
}

export interface Candidate {
  id: string;
  orgId: string;
  name: string;
  email: string;
  score: number;
  stage: 'screening' | 'interview' | 'offer' | 'hired';
  createdAt: string;
}
