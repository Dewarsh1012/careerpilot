import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Static Cohort Datastore (Pre-seeded with realistic institutional university telemetry)
const INITIAL_COHORTS = [
  {
    id: 'cohort_2026_cs',
    name: 'Class of 2026 — Computer Science & Software Track',
    department: 'Computer Science & Engineering',
    graduationYear: '2026',
    totalCandidates: 48,
    averageReadiness: 83.5,
    readyToHireCount: 34,
    placedCount: 12,
    topSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python', 'Git', 'REST APIs'],
    deficits: [
      {
        skill: 'Docker',
        category: 'DevOps',
        studentsMissing: 22,
        deficitPercentage: 46,
        impactLevel: 'Critical',
        recommendedWorkshop: 'Hands-on Multi-Stage Dockerfile & Container Runtime Hardening',
      },
      {
        skill: 'Kubernetes',
        category: 'Cloud',
        studentsMissing: 28,
        deficitPercentage: 58,
        impactLevel: 'Critical',
        recommendedWorkshop: 'Production Cluster Orchestration, Ingress & Helm Deployments',
      },
      {
        skill: 'System Design',
        category: 'Architecture',
        studentsMissing: 19,
        deficitPercentage: 40,
        impactLevel: 'Critical',
        recommendedWorkshop: 'High-Throughput Microservice Partitioning & Fault Tolerance Drill',
      },
      {
        skill: 'AWS',
        category: 'Cloud',
        studentsMissing: 17,
        deficitPercentage: 35,
        impactLevel: 'Moderate',
        recommendedWorkshop: 'Cloud Native AWS Architecture (ECS, S3, RDS, IAM Security)',
      },
      {
        skill: 'GraphQL',
        category: 'Backend',
        studentsMissing: 14,
        deficitPercentage: 29,
        impactLevel: 'Low',
        recommendedWorkshop: 'Apollo Federation & Schema Design Patterns',
      },
    ],
    funnel: {
      enrolled: 48,
      profileExtracted: 48,
      targetMatched: 44,
      roadmapActive: 38,
      interviewReady: 34,
      placed: 12,
    },
  },
  {
    id: 'cohort_2026_cloud',
    name: 'Cloud Infrastructure & SRE Accelerator',
    department: 'Systems & Distributed Computing',
    graduationYear: '2026',
    totalCandidates: 32,
    averageReadiness: 86.2,
    readyToHireCount: 24,
    placedCount: 9,
    topSkills: ['Kubernetes', 'Go', 'Linux', 'Docker', 'AWS', 'CI/CD', 'GitOps'],
    deficits: [
      {
        skill: 'Terraform',
        category: 'DevOps',
        studentsMissing: 12,
        deficitPercentage: 38,
        impactLevel: 'Moderate',
        recommendedWorkshop: 'Modular Infrastructure as Code with Remote State Lock',
      },
      {
        skill: 'Observability (Prometheus/Grafana)',
        category: 'Tools',
        studentsMissing: 14,
        deficitPercentage: 44,
        impactLevel: 'Critical',
        recommendedWorkshop: 'Telemetry Pipelines, Alertmanager SLOs & OpenTelemetry Tracing',
      },
      {
        skill: 'Service Mesh (Istio/Cilium)',
        category: 'Architecture',
        studentsMissing: 16,
        deficitPercentage: 50,
        impactLevel: 'Critical',
        recommendedWorkshop: 'mTLS Zero-Trust Routing and eBPF Packet Filtering',
      },
    ],
    funnel: {
      enrolled: 32,
      profileExtracted: 32,
      targetMatched: 30,
      roadmapActive: 28,
      interviewReady: 24,
      placed: 9,
    },
  },
];

const INITIAL_CANDIDATES = [
  {
    id: 'cand_1',
    name: 'Archi Jain',
    email: 'archi@careerpilot.io',
    cohortId: 'cohort_2026_cs',
    cohortName: 'Class of 2026 — CS Track',
    targetRole: 'Full Stack Developer',
    university: 'MIT College of Engineering',
    careerReadiness: 88,
    atsScore: 92,
    interviewScore: 8.5,
    placementStatus: 'Ready to Hire',
    verifiedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Express', 'MongoDB', 'Git'],
    badges: ['✓ Lemma AI Verified', 'Staff Interview Verified', 'ATS Top 5%'],
    recentProject: 'Full Stack Cloud Workspace & Distributed Event API',
    voiceInterviewWpm: 136,
    interviewFeedback: 'Exceptional full-stack architecture depth and clean async handling.',
    outreachSent: false,
  },
  {
    id: 'cand_2',
    name: 'Marcus Vance',
    email: 'marcus.vance@campus.edu',
    cohortId: 'cohort_2026_cloud',
    cohortName: 'Cloud & SRE Accelerator',
    targetRole: 'Site Reliability Engineer',
    university: 'State University of Technology',
    careerReadiness: 95,
    atsScore: 94,
    interviewScore: 9.2,
    placementStatus: 'Ready to Hire',
    verifiedSkills: ['Kubernetes', 'Go', 'Terraform', 'Docker', 'AWS', 'Prometheus', 'Istio'],
    badges: ['✓ Lemma AI Verified', 'Staff Interview Verified', 'SRE Honors'],
    recentProject: 'KubeSentinel Kubernetes Operator for Automated Remediation',
    voiceInterviewWpm: 142,
    interviewFeedback: 'Demonstrated mastery of distributed consensus, SLOs, and multi-region resilience.',
    outreachSent: true,
  },
  {
    id: 'cand_3',
    name: 'Sarah Connor',
    email: 's.connor@campus.edu',
    cohortId: 'cohort_2026_cloud',
    cohortName: 'Cloud & SRE Accelerator',
    targetRole: 'Cloud Platform Architect',
    university: 'Austin Institute of Technology',
    careerReadiness: 92,
    atsScore: 91,
    interviewScore: 8.8,
    placementStatus: 'Interviewing',
    verifiedSkills: ['AWS', 'Kubernetes', 'Terraform', 'Python', 'Go', 'Grafana', 'Microservices'],
    badges: ['✓ Lemma AI Verified', 'AWS Cloud Architect'],
    recentProject: 'Global Observability Mesh with OpenTelemetry & Prometheus',
    voiceInterviewWpm: 134,
    interviewFeedback: 'Very strong platform reliability focus; articulates failure recovery clearly.',
    outreachSent: true,
  },
  {
    id: 'cand_4',
    name: 'Alex Rivera',
    email: 'alex.rivera@campus.edu',
    cohortId: 'cohort_2026_cs',
    cohortName: 'Class of 2026 — CS Track',
    targetRole: 'Senior Frontend Engineer',
    university: 'MIT College of Engineering',
    careerReadiness: 86,
    atsScore: 89,
    interviewScore: 8.4,
    placementStatus: 'Ready to Hire',
    verifiedSkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'GraphQL'],
    badges: ['✓ Lemma AI Verified', 'Frontend Core Specialist'],
    recentProject: 'Next.js 14 App Router Migration cutting LCP by 45%',
    voiceInterviewWpm: 138,
    interviewFeedback: 'Clear communication of reactive rendering, component architecture, and web performance.',
    outreachSent: false,
  },
  {
    id: 'cand_5',
    name: 'Jordan Lee',
    email: 'jordan.lee@campus.edu',
    cohortId: 'cohort_2026_cs',
    cohortName: 'Class of 2026 — CS Track',
    targetRole: 'Backend Systems Engineer',
    university: 'National Science Academy',
    careerReadiness: 84,
    atsScore: 88,
    interviewScore: 8.1,
    placementStatus: 'Ready to Hire',
    verifiedSkills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Kafka', 'System Design', 'gRPC'],
    badges: ['✓ Lemma AI Verified', 'High-Scale Backend'],
    recentProject: 'Real-Time Transaction Processing Engine handling 12,000 req/sec',
    voiceInterviewWpm: 128,
    interviewFeedback: 'Solid understanding of caching hierarchies, transactional isolation, and event queues.',
    outreachSent: false,
  },
  {
    id: 'cand_6',
    name: 'Priya Sharma',
    email: 'priya.sharma@campus.edu',
    cohortId: 'cohort_2026_cs',
    cohortName: 'Class of 2026 — CS Track',
    targetRole: 'Distributed Systems Engineer',
    university: 'State University of Technology',
    careerReadiness: 90,
    atsScore: 93,
    interviewScore: 8.7,
    placementStatus: 'Placed',
    verifiedSkills: ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Docker', 'Kubernetes', 'Redis'],
    badges: ['✓ Lemma AI Verified', 'Placed at Tier-1 FinTech'],
    recentProject: 'Event-Driven Ledger with Exactly-Once Processing Semantics',
    voiceInterviewWpm: 140,
    interviewFeedback: 'Flawless explanation of partition consumer lag, commit offsets, and distributed locks.',
    outreachSent: true,
  },
  {
    id: 'cand_7',
    name: 'Daniel Chen',
    email: 'daniel.chen@campus.edu',
    cohortId: 'cohort_2026_cloud',
    cohortName: 'Cloud & SRE Accelerator',
    targetRole: 'Cloud Security Engineer',
    university: 'Austin Institute of Technology',
    careerReadiness: 82,
    atsScore: 85,
    interviewScore: 7.9,
    placementStatus: 'Upskilling',
    verifiedSkills: ['Linux', 'Docker', 'Python', 'AWS', 'Network Security', 'CI/CD', 'Bash'],
    badges: ['✓ Lemma AI Verified'],
    recentProject: 'Automated Container Vulnerability Scanner & SBOM Pipeline',
    voiceInterviewWpm: 126,
    interviewFeedback: 'Good practical security mindset; needs more depth in Kubernetes network policies.',
    outreachSent: false,
  },
  {
    id: 'cand_8',
    name: 'Emily Watson',
    email: 'emily.watson@campus.edu',
    cohortId: 'cohort_2026_cs',
    cohortName: 'Class of 2026 — CS Track',
    targetRole: 'Full Stack & AI Engineer',
    university: 'MIT College of Engineering',
    careerReadiness: 91,
    atsScore: 92,
    interviewScore: 8.9,
    placementStatus: 'Interviewing',
    verifiedSkills: ['TypeScript', 'React', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'OpenAI'],
    badges: ['✓ Lemma AI Verified', 'Staff Interview Verified', 'AI Pioneer'],
    recentProject: 'Collaborative Multi-Agent Workspace with Real-Time Vector Search',
    voiceInterviewWpm: 144,
    interviewFeedback: 'Superb blend of full-stack engineering and pragmatic AI agent integration.',
    outreachSent: false,
  },
];

let candidatesStore = [...INITIAL_CANDIDATES];

// Get Cohorts & Aggregate University Placement Analytics
router.get('/cohorts', authMiddleware, async (req, res) => {
  try {
    const totalCandidates = candidatesStore.length;
    const readyToHire = candidatesStore.filter((c) => c.careerReadiness >= 80).length;
    const placed = candidatesStore.filter((c) => c.placementStatus === 'Placed').length;
    const interviewing = candidatesStore.filter((c) => c.placementStatus === 'Interviewing').length;
    const avgReadiness = Math.round(
      candidatesStore.reduce((acc, c) => acc + c.careerReadiness, 0) / totalCandidates
    );

    res.json({
      success: true,
      overview: {
        totalEnrolled: totalCandidates,
        readyToHireCount: readyToHire,
        readyToHireRate: Math.round((readyToHire / totalCandidates) * 100),
        placedCount: placed,
        placementRate: Math.round((placed / totalCandidates) * 100),
        interviewingCount: interviewing,
        averageCohortReadiness: avgReadiness,
        activeCohortsCount: INITIAL_COHORTS.length,
      },
      cohorts: INITIAL_COHORTS,
    });
  } catch (err) {
    console.error('Campus cohorts retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve cohort analytics' });
  }
});

// Search & Filter Candidate Talent Directory
router.get('/candidates', authMiddleware, async (req, res) => {
  try {
    const { cohortId, skill, status, minReadiness, search } = req.query;

    let filtered = [...candidatesStore];

    if (cohortId && cohortId !== 'all') {
      filtered = filtered.filter((c) => c.cohortId === cohortId);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((c) => c.placementStatus === status);
    }

    if (minReadiness) {
      const min = parseInt(minReadiness, 10);
      if (!isNaN(min)) {
        filtered = filtered.filter((c) => c.careerReadiness >= min);
      }
    }

    if (skill && skill !== 'all') {
      const sLower = skill.toLowerCase();
      filtered = filtered.filter((c) =>
        c.verifiedSkills.some((s) => s.toLowerCase().includes(sLower))
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.targetRole.toLowerCase().includes(q) ||
          c.recentProject.toLowerCase().includes(q) ||
          c.verifiedSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Sort by readiness score descending
    filtered.sort((a, b) => b.careerReadiness - a.careerReadiness);

    res.json({
      success: true,
      totalMatches: filtered.length,
      candidates: filtered,
    });
  } catch (err) {
    console.error('Campus candidates search error:', err);
    res.status(500).json({ error: 'Failed to search candidate talent directory' });
  }
});

// Recruiter Outreach / Request Interview
router.post('/outreach', authMiddleware, async (req, res) => {
  try {
    const { candidateId, company = 'Acme Corp', role = 'Software Engineer', message } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    const candidate = candidatesStore.find((c) => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    candidate.outreachSent = true;
    if (candidate.placementStatus === 'Ready to Hire') {
      candidate.placementStatus = 'Interviewing';
    }

    res.json({
      success: true,
      message: `Interview invitation successfully delivered to ${candidate.name} (${candidate.email}) on behalf of ${company} for ${role}.`,
      candidate,
    });
  } catch (err) {
    console.error('Campus outreach error:', err);
    res.status(500).json({ error: 'Failed to dispatch recruiter outreach' });
  }
});

// Export Placement Telemetry Report
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const exportData = {
      generatedAt: new Date().toISOString(),
      institution: 'University Engineering Placement Office',
      metrics: {
        totalGraduatingCandidates: candidatesStore.length,
        readyToHireRate: `${Math.round((candidatesStore.filter((c) => c.careerReadiness >= 80).length / candidatesStore.length) * 100)}%`,
        averageReadinessScore: Math.round(candidatesStore.reduce((a, b) => a + b.careerReadiness, 0) / candidatesStore.length),
      },
      candidates: candidatesStore.map((c) => ({
        Name: c.name,
        Email: c.email,
        Cohort: c.cohortName,
        TargetRole: c.targetRole,
        CareerReadiness: `${c.careerReadiness}%`,
        ATSScore: `${c.atsScore}%`,
        InterviewScore: `${c.interviewScore}/10`,
        SpeakingPaceWPM: c.voiceInterviewWpm || 135,
        PlacementStatus: c.placementStatus,
        VerifiedSkills: c.verifiedSkills.join(', '),
      })),
    };

    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export placement report' });
  }
});

export default router;
