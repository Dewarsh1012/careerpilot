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

// Seed Initial Data
export const seedInitialData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    const defaultUser: User = {
      id: 'user_default_1',
      name: 'Archi Jain',
      email: 'archi@careerpilot.io',
      currentStatus: 'Student / Fresher',
      targetRole: 'Full Stack Developer',
      experienceLevel: 'Fresher (0-1 yrs)',
      interests: ['Web Development', 'Cloud Systems', 'AI Applications'],
      careerReadiness: 88,
      onboarded: true,
      verifiedSkills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
      plan: 'pro',
      quota: {
        plan: 'pro',
        resumeAnalyses: { used: 1, limit: 999 },
        jobMatches: { used: 3, limit: 999 },
        tailoredResumes: { used: 1, limit: 999 },
        interviewSessions: { used: 2, limit: 999 },
        voiceInterviews: { used: 1, limit: 999 },
      },
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
  }

  if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
    const defaultJobs: JobRecord[] = [
      {
        id: 'job_sample_1',
        userId: 'user_default_1',
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
        userId: 'user_default_1',
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
    const defaultResume: ResumeRecord = {
      id: 'res_default_1',
      userId: 'user_default_1',
      fileName: 'Archi_Jain_Resume.pdf',
      extractedText: 'Archi Jain - Full Stack Developer. React, TypeScript, Node.js, Express, PostgreSQL, Git.',
      processingStatus: 'completed',
      createdAt: new Date().toISOString(),
      analysis: {
        candidateName: 'Archi Jain',
        summary: 'Software engineer experienced in modern web development, reactive UI architecture, and API design.',
        skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Git', 'HTML5/CSS3'],
        technologies: [
          { name: 'React', category: 'Frontend' },
          { name: 'TypeScript', category: 'Language' },
          { name: 'Node.js', category: 'Backend' },
        ],
        experience: [
          {
            title: 'Full Stack Developer',
            company: 'Tech Solutions',
            duration: '2023 - Present',
            description: 'Engineered responsive web client and backend services with token auth and database caching.',
          },
        ],
        projects: [
          {
            title: 'Cloud Collaboration Canvas',
            technologies: ['React', 'Node.js', 'WebSockets', 'PostgreSQL'],
            description: 'Engineered real-time interface with sub-100ms sync and state persistence.',
          },
        ],
        education: [
          { degree: 'B.S. in Computer Science', institution: 'University', year: '2024' },
        ],
        strengths: ['Solid web foundations', 'Modern component architecture'],
        growthAreas: ['Production containerization (Docker)', 'Cloud deployments (AWS)'],
        domains: ['Frontend Engineering', 'Backend Systems'],
      },
    };
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify([defaultResume]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
    const defaultMatch: MatchRecord = {
      id: 'match_default_1',
      userId: 'user_default_1',
      jobId: 'job_sample_1',
      jobTitle: 'Full Stack Engineer',
      company: 'Stripe',
      matchScore: 78,
      readinessLevel: 'Needs Target Prep',
      nextMove: 'Complete Multi-Stage Dockerfile Milestone (Phase 2)',
      analyzedAt: new Date().toISOString(),
      matchedSkills: [
        { name: 'React', category: 'Frontend', status: 'matched', evidence: 'Verified in resume projects', isRequired: true },
        { name: 'TypeScript', category: 'Language', status: 'matched', evidence: 'Demonstrated typing discipline in codebase', isRequired: true },
        { name: 'Node.js', category: 'Backend', status: 'matched', evidence: 'Built production Express microservices', isRequired: true },
        { name: 'PostgreSQL', category: 'Database', status: 'matched', evidence: 'Schema design and relational indexing', isRequired: true },
      ],
      partialSkills: [
        {
          name: 'Docker',
          category: 'DevOps',
          status: 'partial',
          currentLevel: 'Familiar',
          requiredLevel: 'Production Proficiency',
          gapExplanation: 'Needs hands-on experience with multi-stage builds and container networking.',
          recommendation: 'Build and deploy optimized Docker image (<120MB).',
          isRequired: true,
        },
      ],
      missingSkills: [
        {
          name: 'AWS Cloud',
          category: 'Cloud',
          status: 'missing',
          importance: 'High',
          impactOnRole: 'Critical gate for infrastructure screening',
          recommendation: 'Configure EC2, S3 bucket storage, and IAM policies.',
          isRequired: true,
        },
        {
          name: 'CI/CD Automation',
          category: 'DevOps',
          status: 'missing',
          importance: 'Medium',
          impactOnRole: 'Expected for deployment automation',
          recommendation: 'Automate lint, test, and container build via GitHub Actions.',
          isRequired: false,
        },
      ],
    };
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify([defaultMatch]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CAREER_PLAN)) {
    const defaultPlan: CareerPlanRecord = {
      id: 'plan_default_1',
      userId: 'user_default_1',
      targetRole: 'Full Stack Engineer',
      targetJobId: 'job_sample_1',
      skillGaps: ['Docker', 'AWS', 'CI/CD'],
      progressPercent: 22,
      totalTasks: 9,
      completedTasks: 2,
      currentPhase: 'Phase 2: Containerization & Modern DevOps',
      nextTask: 'Complete Multi-Stage Dockerfile for Microservices',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase_1',
          title: 'Phase 1: Foundations & Architecture Alignment',
          description: 'Strengthen core fundamentals, typing discipline, and API resilience.',
          estimatedWeeks: '1-2 weeks',
          tasks: [
            {
              id: 'task_1_1',
              title: 'Architect Clean TypeScript Contracts & Interfaces',
              skill: 'TypeScript',
              priority: 'High',
              estimatedHours: 4,
              status: 'completed',
              description: 'Define strong types and strict DTO interfaces for all data transfer boundaries.',
              deliverable: 'Typed schema definitions for API payloads',
            },
            {
              id: 'task_1_2',
              title: 'Refactor REST API Endpoints with Centralized Error Handling',
              skill: 'Node.js',
              priority: 'High',
              estimatedHours: 6,
              status: 'completed',
              description: 'Implement structured HTTP error classes and response wrappers with request correlation IDs.',
              deliverable: 'Middleware error pipeline in Express/Node',
            },
          ],
        },
        {
          id: 'phase_2',
          title: 'Phase 2: Containerization & Modern DevOps',
          description: 'Close missing containerization and pipeline requirements.',
          estimatedWeeks: '2-3 weeks',
          tasks: [
            {
              id: 'task_2_1',
              title: 'Build Multi-Stage Dockerfile for Microservices',
              skill: 'Docker',
              priority: 'High',
              estimatedHours: 8,
              status: 'in_progress',
              description: 'Build optimized multi-stage Docker images separating build environment from production runner.',
              deliverable: 'Optimized Dockerfile (<120MB) and docker-compose.yml',
            },
            {
              id: 'task_2_2',
              title: 'Automate CI/CD Workflows with GitHub Actions',
              skill: 'CI/CD',
              priority: 'Medium',
              estimatedHours: 6,
              status: 'todo',
              description: 'Set up automated linting, test execution, and image build triggers on push to main.',
              deliverable: 'Production .github/workflows/ci.yml pipeline',
            },
          ],
        },
        {
          id: 'phase_3',
          title: 'Phase 3: Cloud Infrastructure & Deployment (AWS)',
          description: 'Bridge critical cloud deployment gaps identified in job requirements.',
          estimatedWeeks: '3-4 weeks',
          tasks: [
            {
              id: 'task_3_1',
              title: 'Deploy Production Services to AWS (EC2 & S3)',
              skill: 'AWS',
              priority: 'High',
              estimatedHours: 10,
              status: 'todo',
              description: 'Configure security groups, IAM roles, S3 bucket storage, and Nginx reverse proxy on EC2.',
              deliverable: 'Live HTTPS deployment URL with custom domain',
            },
          ],
        },
        {
          id: 'phase_4',
          title: 'Phase 4: High-Scale System Design & Database Optimization',
          description: 'Master scalability concepts expected in senior technical screenings.',
          estimatedWeeks: '2 weeks',
          tasks: [
            {
              id: 'task_4_1',
              title: 'Design Scalable Microservices Architecture for Target Domain',
              skill: 'System Design',
              priority: 'High',
              estimatedHours: 8,
              status: 'todo',
              description: 'Draft architecture diagram covering load balancing, database sharding, and event queues.',
              deliverable: 'System design doc + architecture diagram',
            },
          ],
        },
        {
          id: 'phase_5',
          title: 'Phase 5: Technical Interview Polish & Role Mocking',
          description: 'Simulate company-specific technical rounds and defend resume decisions.',
          estimatedWeeks: '1 week',
          tasks: [
            {
              id: 'task_5_1',
              title: 'Defend Architecture Decisions in Practice AI Coach',
              skill: 'Interview Readiness',
              priority: 'High',
              estimatedHours: 5,
              status: 'todo',
              description: 'Answer deep-dive questions on state management, database schema design, and trade-offs.',
              deliverable: 'Score 8.5+ on 3 consecutive interview sessions',
            },
          ],
        },
      ],
    };
    localStorage.setItem(STORAGE_KEYS.CAREER_PLAN, JSON.stringify(defaultPlan));
  }

  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    const defaultApps: ApplicationRecord[] = [
      {
        id: 'app_1',
        userId: 'user_default_1',
        company: 'Stripe',
        role: 'Full Stack Engineer',
        status: 'interview',
        matchScore: 82,
        appliedDate: '2026-09-15',
        interviewDate: '2026-10-04',
        salary: '$140k - $175k',
        location: 'San Francisco, CA / Hybrid',
        notes: 'Technical screen passed. Preparing for system design round.',
      },
      {
        id: 'app_2',
        userId: 'user_default_1',
        company: 'Vercel',
        role: 'Frontend Infrastructure Engineer',
        status: 'applied',
        matchScore: 88,
        appliedDate: '2026-09-22',
        salary: '$150k - $185k',
        location: 'Remote',
      },
      {
        id: 'app_3',
        userId: 'user_default_1',
        company: 'Datadog',
        role: 'Cloud Platform Engineer',
        status: 'saved',
        matchScore: 74,
        salary: '$145k - $180k',
        location: 'New York, NY',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(defaultApps));
  }
};
