import { runLemmaAgent, extractJsonFromResponse } from '../services/lemma.service.js';

/**
 * Career Planning Agent
 * Generates personalized, milestone-based preparation roadmaps tailored to the candidate's
 * specific skill gaps and target role using Lemma Cloud AI Agents.
 */

export async function generateCareerPlan(candidateProfile, jobProfile, matchResult) {
  const missing = matchResult?.missingSkills || [];
  const partial = matchResult?.partialSkills || [];
  const targetRole = jobProfile?.roleTitle || 'Software Engineer';

  // 1. Try real Lemma AI Agent plan generation
  try {
    const systemPrompt = `You are the CareerPilot Career Planning Agent.
Generate a structured, actionable 5-phase career preparation roadmap tailored to close the candidate's specific skill gaps for their target role.
CRITICAL RULES:
1. Do not use generic, copy-pasted tasks. Every task must specifically target the missing and partial skills identified for this role.
2. Include concrete deliverables for every task (e.g. 'Optimized multi-stage Dockerfile and docker-compose.yml', 'GitHub Actions workflow with lint and test matrix').
3. Keep phases organized logically:
   - Phase 1: Core Fundamentals & Code Quality
   - Phase 2: High-Priority Missing Skill Deep Dive
   - Phase 3: Cloud Deployment & Distributed Infrastructure
   - Phase 4: Production Architecture & Scalability
   - Phase 5: Technical Interview Polish & Review
4. Return ONLY valid JSON with no markdown wrapping.

Schema:
{
  "phases": [
    {
      "id": "phase_1",
      "title": "Phase 1: Title",
      "description": "Overview of this phase's objective",
      "estimatedWeeks": "1-2 weeks",
      "tasks": [
        {
          "id": "task_1_1",
          "title": "Actionable Task Title",
          "skill": "Targeted Skill",
          "priority": "High | Medium",
          "estimatedHours": 6,
          "status": "todo | in_progress | completed",
          "description": "Clear instructions on what to implement or build",
          "deliverable": "Concrete artifact to produce"
        }
      ]
    }
  ],
  "overallSummary": "Summary of this custom preparation plan"
}`;

    const prompt = `Create a custom 5-phase career plan for this candidate targeting: ${targetRole}

Target Role: ${targetRole} (${jobProfile?.company || 'Target Employer'})
Candidate Skills: ${JSON.stringify((candidateProfile?.skills || []).slice(0, 10))}
Missing Skills (Priority Gaps): ${JSON.stringify(missing.map((s) => s.name || s))}
Partial Skills (Need Level-up): ${JSON.stringify(partial.map((s) => s.name || s))}
Candidate Experience: ${JSON.stringify((candidateProfile?.experience || []).slice(0, 2))}`;

    const rawResponse = await runLemmaAgent(prompt, systemPrompt, 'career-coach');
    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
      // Calculate overall metrics
      let totalTasks = 0;
      let completedTasks = 0;

      const phases = parsed.phases.map((phase, pIdx) => {
        const tasks = (phase.tasks || []).map((task, tIdx) => {
          totalTasks++;
          const status = task.status || (pIdx === 0 && tIdx === 0 ? 'completed' : 'todo');
          if (status === 'completed') completedTasks++;
          return {
            id: task.id || `task_${pIdx + 1}_${tIdx + 1}`,
            title: task.title,
            skill: task.skill || 'Core Skill',
            priority: task.priority || 'High',
            estimatedHours: task.estimatedHours || 5,
            status,
            description: task.description || 'Implement practical deliverable.',
            deliverable: task.deliverable || 'Working code commit',
          };
        });

        return {
          id: phase.id || `phase_${pIdx + 1}`,
          title: phase.title,
          description: phase.description,
          estimatedWeeks: phase.estimatedWeeks || '2 weeks',
          tasks,
        };
      });

      return {
        id: `plan_${Date.now()}`,
        userId: candidateProfile?.userId || candidateProfile?.id,
        jobId: jobProfile?.id || jobProfile?._id,
        targetRole,
        totalTasks,
        completedTasks,
        completionPercentage: Math.round((completedTasks / (totalTasks || 1)) * 100),
        phases,
        summary: parsed.overallSummary || `Tailored preparation plan for ${targetRole} closing ${missing.length} skill gaps.`,
        createdAt: new Date().toISOString(),
        planMethod: 'lemma_agent',
      };
    }
  } catch (err) {
    console.warn('Lemma AI Agent career plan generation encountered an error, falling back to dynamic plan:', err.message);
  }

  // 2. Dynamic Plan Engine
  return dynamicPlanEngine(candidateProfile, jobProfile, missing, partial, targetRole);
}

function dynamicPlanEngine(candidateProfile, jobProfile, missing, partial, targetRole) {
  const topGaps = missing.map((s) => s.name || s);
  const partialGaps = partial.map((s) => s.name || s);

  const phase1Skills = candidateProfile?.skills?.slice(0, 2) || ['Core Architecture', 'API Development'];
  const phase2Skills = topGaps.slice(0, 2).length ? topGaps.slice(0, 2) : ['DevOps & Containers', 'CI/CD'];
  const phase3Skills = topGaps.slice(2, 4).length ? topGaps.slice(2, 4) : ['Cloud Deployment', 'Distributed Caching'];

  const phases = [
    {
      id: 'phase_1',
      title: 'Phase 1: Foundations & Architecture Alignment',
      description: 'Refine core code quality, type safety, and architectural modularity.',
      estimatedWeeks: '1-2 weeks',
      tasks: [
        {
          id: 'task_1_1',
          title: `Harden ${phase1Skills[0]} Architecture & Data Contracts`,
          skill: phase1Skills[0],
          priority: 'High',
          estimatedHours: 4,
          status: 'completed',
          description: `Define strict DTO boundaries and interface validation for ${phase1Skills[0]}.`,
          deliverable: 'Typed contract schema and validation tests',
        },
        {
          id: 'task_1_2',
          title: 'Implement Structured Error Handling & Logging Middleware',
          skill: phase1Skills[1] || 'Backend Systems',
          priority: 'High',
          estimatedHours: 6,
          status: 'completed',
          description: 'Build centralized HTTP error classes and correlation ID tracing.',
          deliverable: 'Reusable error handler pipeline',
        },
      ],
    },
    {
      id: 'phase_2',
      title: `Phase 2: Closing Priority Gaps (${phase2Skills.join(', ')})`,
      description: 'Address core missing requirements needed for technical evaluation.',
      estimatedWeeks: '2-3 weeks',
      tasks: [
        {
          id: 'task_2_1',
          title: `Build Hands-On Working Proof of Concept with ${phase2Skills[0]}`,
          skill: phase2Skills[0],
          priority: 'High',
          estimatedHours: 8,
          status: 'in_progress',
          description: `Implement and configure a production-ready module featuring ${phase2Skills[0]}.`,
          deliverable: `Tested implementation repository using ${phase2Skills[0]}`,
        },
        {
          id: 'task_2_2',
          title: `Integrate ${phase2Skills[1] || phase2Skills[0]} into CI Pipeline`,
          skill: phase2Skills[1] || phase2Skills[0],
          priority: 'Medium',
          estimatedHours: 6,
          status: 'todo',
          description: 'Automate build verification and lint checks on push.',
          deliverable: 'Automated CI/CD configuration file',
        },
      ],
    },
    {
      id: 'phase_3',
      title: `Phase 3: Cloud & Infrastructure (${phase3Skills.join(', ')})`,
      description: 'Demonstrate real-world deployment and scalability readiness.',
      estimatedWeeks: '2-3 weeks',
      tasks: [
        {
          id: 'task_3_1',
          title: `Deploy Service to Cloud Environment with ${phase3Skills[0]}`,
          skill: phase3Skills[0],
          priority: 'High',
          estimatedHours: 8,
          status: 'todo',
          description: 'Configure security groups, DNS, environment secrets, and monitoring.',
          deliverable: 'Live HTTPS deployment URL and runbook',
        },
        {
          id: 'task_3_2',
          title: `Performance Benchmark & Caching Layer with ${phase3Skills[1] || 'Redis'}`,
          skill: phase3Skills[1] || 'Redis',
          priority: 'Medium',
          estimatedHours: 5,
          status: 'todo',
          description: 'Measure latency before and after caching optimization.',
          deliverable: 'Benchmark report showing response latency reduction',
        },
      ],
    },
    {
      id: 'phase_4',
      title: 'Phase 4: High-Scale System Design & Production Readiness',
      description: 'Master architectural trade-offs expected in senior interviews.',
      estimatedWeeks: '2 weeks',
      tasks: [
        {
          id: 'task_4_1',
          title: `Design Distributed Architecture for ${targetRole}`,
          skill: 'System Design',
          priority: 'High',
          estimatedHours: 6,
          status: 'todo',
          description: 'Map out architecture for high availability, fault tolerance, and data partitioning.',
          deliverable: 'Architectural diagram and trade-off whitepaper',
        },
      ],
    },
    {
      id: 'phase_5',
      title: 'Phase 5: Technical Interview Polish & Model Answers',
      description: 'Practice context-aware technical screening questions.',
      estimatedWeeks: '1 week',
      tasks: [
        {
          id: 'task_5_1',
          title: `Complete Mock Technical Screening on ${topGaps[0] || 'Core Stack'}`,
          skill: topGaps[0] || 'Interview Prep',
          priority: 'High',
          estimatedHours: 4,
          status: 'todo',
          description: 'Answer deep-dive questions and review 4-pillar evaluation scores.',
          deliverable: 'Interview session scoring >= 80% across all pillars',
        },
      ],
    },
  ];

  let totalTasks = 0;
  let completedTasks = 0;
  phases.forEach((p) => {
    p.tasks.forEach((t) => {
      totalTasks++;
      if (t.status === 'completed') completedTasks++;
    });
  });

  return {
    id: `plan_${Date.now()}`,
    userId: candidateProfile?.userId || candidateProfile?.id,
    jobId: jobProfile?.id || jobProfile?._id,
    targetRole,
    totalTasks,
    completedTasks,
    completionPercentage: Math.round((completedTasks / totalTasks) * 100),
    phases,
    summary: `Structured roadmap to bridge ${topGaps.length} critical gaps and prepare for ${targetRole}.`,
    createdAt: new Date().toISOString(),
    planMethod: 'dynamic_heuristic',
  };
}
