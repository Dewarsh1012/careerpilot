import {
  User,
  ResumeRecord,
  JobRecord,
  MatchRecord,
  CareerPlanRecord,
  InterviewSession,
  ApplicationRecord,
} from '../types';

const STORAGE_KEYS = {
  USER: 'careerpilot_user',
  RESUMES: 'careerpilot_resumes',
  JOBS: 'careerpilot_jobs',
  MATCHES: 'careerpilot_matches',
  CAREER_PLAN: 'careerpilot_plan',
  INTERVIEWS: 'careerpilot_interviews',
  APPLICATIONS: 'careerpilot_applications',
};

// Seed Initial Data (only general target job templates, never fake candidate data)
export const seedInitialData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
    const defaultJobs: JobRecord[] = [
      {
        id: 'job_sample_1',
        userId: 'system',
        roleTitle: 'Full Stack Engineer',
        company: 'Stripe',
        location: 'Remote / San Francisco',
        seniority: 'Mid-Level',
        experienceRequired: '2-4 years',
        rawDescription: 'Building resilient payment dashboards and APIs with React, TypeScript, Node.js, Docker, and AWS.',
        analysis: {
          roleTitle: 'Full Stack Engineer',
          company: 'Stripe',
          seniority: 'Mid-Level',
          experienceRequired: '2-4 years',
          summary: 'Build high-scale payments UI and resilient backend services with strong typing and cloud deployment.',
          requiredSkills: [
            { name: 'React', category: 'Frontend', priority: 'High' },
            { name: 'TypeScript', category: 'Language', priority: 'High' },
            { name: 'Node.js', category: 'Backend', priority: 'High' },
            { name: 'PostgreSQL', category: 'Database', priority: 'High' },
            { name: 'Docker', category: 'DevOps', priority: 'High' },
          ],
          preferredSkills: [
            { name: 'AWS', category: 'Cloud' },
            { name: 'CI/CD', category: 'DevOps' },
            { name: 'Redis', category: 'Database' },
            { name: 'System Design', category: 'Architecture' },
          ],
          responsibilities: [
            'Develop responsive web interfaces with modern React patterns.',
            'Architect high-throughput REST APIs and transactional database queries.',
          ],
        },
      },
      {
        id: 'job_sample_2',
        userId: 'system',
        roleTitle: 'Frontend Engineer',
        company: 'Vercel',
        location: 'Remote',
        seniority: 'Senior',
        experienceRequired: '4+ years',
        rawDescription: 'Building high-performance UI tools with Next.js, React Server Components, and Tailwind CSS.',
        analysis: {
          roleTitle: 'Frontend Engineer',
          company: 'Vercel',
          seniority: 'Senior',
          experienceRequired: '4+ years',
          summary: 'Design high-speed reactive experiences for next-generation developer tooling.',
          requiredSkills: [
            { name: 'React', category: 'Frontend', priority: 'High' },
            { name: 'Next.js', category: 'Frontend', priority: 'High' },
            { name: 'TypeScript', category: 'Language', priority: 'High' },
            { name: 'Tailwind CSS', category: 'Frontend', priority: 'High' },
          ],
          preferredSkills: [
            { name: 'GraphQL', category: 'Backend' },
            { name: 'CI/CD', category: 'DevOps' },
          ],
          responsibilities: ['Ship performant components using React Server Components.'],
        },
      },
    ];
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(defaultJobs));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RESUMES)) {
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  }
};
