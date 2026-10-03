export type PlanTier = 'free' | 'pro' | 'campus';

export interface QuotaItem {
  used: number;
  limit: number;
}

export interface UserQuota {
  plan: PlanTier;
  resumeAnalyses: QuotaItem;
  jobMatches: QuotaItem;
  tailoredResumes: QuotaItem;
  interviewSessions: QuotaItem;
  voiceInterviews: QuotaItem;
}

export interface PlanDetails {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  resumeAnalyses: number;
  jobMatches: number;
  tailoredResumes: number;
  interviewSessions: number;
  voiceInterviews: number;
  features: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentStatus: string;
  targetRole: string;
  experienceLevel: string;
  interests?: string[];
  verifiedSkills?: string[];
  summary?: string;
  currentRole?: string;
  phone?: string;
  location?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    location?: string;
    description: string;
  }>;
  projects?: ProjectItem[];
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  strengths?: string[];
  growthAreas?: string[];
  careerReadiness: number;
  onboarded: boolean;
  resumeId?: string;
  activeResumeId?: string;
  activeMatchId?: string;
  activeJobId?: string;
  plan?: PlanTier;
  quota?: UserQuota;
  connectorAccount?: ConnectorAccount;
}

export interface ConnectorAccount {
  id: string;
  connector_id: string;
  status: string;
  display_name?: string;
  email?: string;
  connector?: {
    id: string;
    title: string;
    description?: string;
    icon?: string;
  };
}

export interface SkillItem {
  name: string;
  category: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface ProjectItem {
  title: string;
  technologies: string[];
  description: string;
}

export interface ResumeAnalysis {
  candidateName: string;
  currentRole?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary: string;
  skills: string[];
  technologies: SkillItem[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    location?: string;
    description: string;
  }>;
  projects: ProjectItem[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  strengths: string[];
  growthAreas: string[];
  domains: string[];
}

export interface ResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  title?: string;
  isPrimary?: boolean;
  targetDomain?: string;
  extractedText: string;
  analysis: ResumeAnalysis;
  processingStatus: string;
  createdAt: string;
}

export interface JobRecord {
  id: string;
  userId: string;
  roleTitle: string;
  company: string;
  location?: string;
  seniority: string;
  experienceRequired: string;
  rawDescription: string;
  sourceUrl?: string;
  isScraped?: boolean;
  isSimulated?: boolean;
  analysis: {
    roleTitle: string;
    company: string;
    seniority: string;
    experienceRequired: string;
    summary: string;
    requiredSkills: Array<{ name: string; category: string; priority: string }>;
    preferredSkills: Array<{ name: string; category: string }>;
    responsibilities: string[];
  };
}

export interface TailoredResume {
  id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  atsScore: number;
  keywordMatches: Array<{ keyword: string; matched: boolean; inTarget: boolean }>;
  tailoredSummary: string;
  tailoredExperience: Array<{
    title: string;
    company: string;
    originalBullets: string[];
    tailoredBullets: string[];
    diffHighlights: string[];
  }>;
  tailoredSkills: {
    core: string[];
    additional: string[];
    missingHighlighted: string[];
  };
  previousScore?: number;
  coverLetter?: string;
  coverLetterSnippet?: string;
  coldInMail?: string;
  createdAt: string;
}

export interface MatchedSkill {
  name: string;
  category: string;
  status: 'matched';
  evidence: string;
  isRequired: boolean;
}

export interface PartialSkill {
  name: string;
  category: string;
  status: 'partial';
  currentLevel: string;
  requiredLevel: string;
  gapExplanation: string;
  recommendation: string;
  isRequired: boolean;
}

export interface MissingSkill {
  name: string;
  category: string;
  status: 'missing';
  importance: 'High' | 'Medium';
  impactOnRole: string;
  recommendation: string;
  isRequired: boolean;
}

export interface MatchRecord {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchedSkills: MatchedSkill[];
  partialSkills: PartialSkill[];
  missingSkills: MissingSkill[];
  readinessLevel: string;
  nextMove: string;
  analyzedAt: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  status: 'todo' | 'in_progress' | 'completed';
  description: string;
  deliverable?: string;
  completedAt?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  estimatedWeeks: string;
  tasks: RoadmapTask[];
}

export interface CareerPlanRecord {
  id: string;
  userId: string;
  targetRole: string;
  targetJobId?: string;
  skillGaps: string[];
  phases: RoadmapPhase[];
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  currentPhase: string;
  nextTask: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceAudioTelemetry {
  wpm: number;
  durationSeconds: number;
  fillerWordCount: number;
  fillerWords: Array<{ word: string; count: number }>;
  pacingRating: 'Too Slow' | 'Optimal Pace' | 'Too Fast';
  speechDeliveryScore: number;
  deliveryFeedback: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  grade: string;
  breakdown: {
    correctness: number;
    completeness: number;
    technicalDepth: number;
    clarity: number;
  };
  strengths: string[];
  missingConcepts: string[];
  suggestedImprovement: string;
  feedback?: string;
  modelAnswer: string;
  followUpQuestion?: string;
  voiceTelemetry?: VoiceAudioTelemetry;
  evaluatedAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  question: string;
  answer: string;
  topic: string;
  mode: string;
  isVoiceSession?: boolean;
  voiceTelemetry?: VoiceAudioTelemetry;
  evaluation: InterviewEvaluation;
  createdAt: string;
}

export interface ApplicationPrepPack {
  company: string;
  role: string;
  matchScore: number;
  keySkillsToRevise: Array<{ skill: string; reason: string; priority: string }>;
  recommendedProjectsToHighlight: Array<{ name: string; talkingPoint: string }>;
  companySpecificQuestions: string[];
  prepChecklist: Array<{ item: string; done: boolean }>;
  coverLetter?: string;
  coldInMail?: string;
}

export interface ApplicationRecord {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  matchScore: number;
  salary?: string;
  location?: string;
  appliedDate?: string | null;
  interviewDate?: string | null;
  notes?: string;
  prepPack?: ApplicationPrepPack | null;
}

export interface CohortSkillDeficit {
  skill: string;
  category: string;
  studentsMissing: number;
  deficitPercentage: number;
  impactLevel: 'Critical' | 'Moderate' | 'Low';
  recommendedWorkshop: string;
}

export interface PlacementFunnel {
  enrolled: number;
  profileExtracted: number;
  targetMatched: number;
  roadmapActive: number;
  interviewReady: number;
  placed: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  cohortId: string;
  cohortName: string;
  targetRole: string;
  university?: string;
  careerReadiness: number;
  atsScore: number;
  interviewScore: number;
  placementStatus: 'Ready to Hire' | 'Interviewing' | 'Placed' | 'Upskilling';
  verifiedSkills: string[];
  badges: string[];
  recentProject: string;
  voiceInterviewWpm?: number;
  interviewFeedback?: string;
  outreachSent?: boolean;
}

export interface CampusCohort {
  id: string;
  name: string;
  department: string;
  graduationYear: string;
  totalCandidates: number;
  averageReadiness: number;
  readyToHireCount: number;
  placedCount: number;
  topSkills: string[];
  deficits: CohortSkillDeficit[];
  funnel: PlacementFunnel;
}
