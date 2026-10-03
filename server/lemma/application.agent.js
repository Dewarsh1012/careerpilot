import { runLemmaAgent, extractJsonFromResponse } from '../services/lemma.service.js';

/**
 * Application Preparation Agent
 * Generates tailored interview prep packs, talking points, and company-specific focus areas
 * using Lemma Cloud AI Agents.
 */

export async function generateApplicationPrep({
  company = 'Target Tech Company',
  role = 'Software Engineer',
  matchScore = 75,
  missingSkills = [],
  projects = [],
}) {
  const topGaps = missingSkills.slice(0, 3).map((s) => (typeof s === 'string' ? s : s.name));

  // 1. Try real Lemma AI Agent generation
  try {
    const systemPrompt = `You are the CareerPilot Application Intelligence Agent.
Generate a company-specific technical interview preparation pack for a candidate applying to ${company} for the role of ${role}.
CRITICAL RULES:
1. Tailor the advice, talking points, and questions specifically to ${company}'s known engineering culture, scale, and products.
2. Formulate practical talking points using the candidate's actual projects.
3. Return ONLY valid JSON with no markdown wrapping.

Schema:
{
  "keySkillsToRevise": [
    {
      "skill": "Skill Name",
      "reason": "Why ${company} specifically tests this in interviews",
      "priority": "High | Medium"
    }
  ],
  "recommendedProjectsToHighlight": [
    {
      "name": "Project Name",
      "talkingPoint": "Concrete architectural narrative and metrics the candidate should highlight"
    }
  ],
  "companySpecificQuestions": [
    "3 realistic technical or behavioral questions ${company} interviewers often ask"
  ],
  "prepChecklist": [
    { "item": "Actionable prep step", "done": false }
  ],
  "coverLetter": "Tailored 3-paragraph cover letter for this company",
  "coldInMail": "150-word LinkedIn outreach message for this company's hiring lead"
}`;

    const prompt = `Generate a customized interview prep pack and outreach pitch for:
Company: ${company}
Role: ${role}
Candidate Skill Gaps: ${JSON.stringify(topGaps)}
Candidate Projects: ${JSON.stringify(projects.slice(0, 2))}
Match Score: ${matchScore}%`;

    const rawResponse = await runLemmaAgent(prompt, systemPrompt, 'career-coach');
    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed && Array.isArray(parsed.companySpecificQuestions) && parsed.companySpecificQuestions.length > 0) {
      return {
        company,
        role,
        matchScore,
        keySkillsToRevise: Array.isArray(parsed.keySkillsToRevise) ? parsed.keySkillsToRevise : [],
        recommendedProjectsToHighlight: Array.isArray(parsed.recommendedProjectsToHighlight) ? parsed.recommendedProjectsToHighlight : [],
        companySpecificQuestions: parsed.companySpecificQuestions,
        prepChecklist: Array.isArray(parsed.prepChecklist) ? parsed.prepChecklist : [],
        coverLetter: parsed.coverLetter || `Dear Hiring Team at ${company},\n\nI am thrilled to apply for the ${role} position. With my background in modern web engineering and building resilient platforms, I am eager to contribute to ${company}'s ongoing success.\n\nWarm regards.`,
        coldInMail: parsed.coldInMail || `Hi [Name] — I noticed ${company}'s opening for ${role}. Having recently built production applications with modern stacks, I'd love to connect and share my work. Best regards.`,
        generatedAt: new Date().toISOString(),
        generationMethod: 'lemma_agent',
      };
    }
  } catch (err) {
    console.warn('Lemma AI Agent prep pack generation encountered an error, falling back to dynamic pack:', err.message);
  }

  // 2. Dynamic Fallback
  return {
    company,
    role,
    matchScore,
    keySkillsToRevise: [
      {
        skill: topGaps[0] || 'Core Architecture',
        reason: `${company} tests systems thinking and practical code quality during technical screens.`,
        priority: 'High',
      },
      {
        skill: topGaps[1] || 'Cloud & DevOps',
        reason: `Infrastructure resilience and distributed deployments are core to ${company}'s stack.`,
        priority: 'High',
      },
    ],
    recommendedProjectsToHighlight: [
      {
        name: projects[0]?.title || 'Recent Technical Project',
        talkingPoint: `Emphasize architectural trade-offs, how you structured APIs, and data integrity safeguards.`,
      },
    ],
    companySpecificQuestions: [
      `How would you architect a core feature at ${company} to ensure sub-100ms response times under peak traffic?`,
      `Describe a challenging bug or outage you diagnosed in a past project. What tools and telemetry did you use?`,
      `How do you collaborate across product and infrastructure teams when delivering high-impact releases?`,
    ],
    prepChecklist: [
      { item: `Review ${company}'s tech blog and recent architectural announcements`, done: false },
      { item: `Prepare structured STAR story for ${projects[0]?.title || 'primary project'}`, done: true },
      { item: `Practice technical mock interview on ${topGaps.join(', ') || 'core stack'}`, done: false },
      { item: `Draft 3 insightful reverse-interview questions about ${company}'s roadmap`, done: false },
    ],
    coverLetter: `Dear Hiring Team at ${company},

I am writing to express my strong enthusiasm for the ${role} opening. Having followed ${company}'s technical innovations and commitment to engineering excellence, I am confident that my hands-on background building performant applications makes me a natural fit for your team.

In my recent projects, including ${projects[0]?.title || 'my full-stack platforms'}, I focused on delivering robust REST APIs, clean UI state management, and reliable deployment workflows. My experience directly maps to the requirements of the ${role} position, and I would love the chance to bring this same energy and standard of craftsmanship to ${company}.

Thank you for your consideration, and I look forward to the opportunity to discuss my qualifications further.

Sincerely,
Candidate`,
    coldInMail: `Hi [Name],

I noticed ${company} is currently looking for a ${role}. 

I recently developed production-grade projects focusing on scalable architectures, cutting response latency by over 30% and implementing automated delivery pipelines. Given ${company}'s high standards for technical excellence, I would love to connect and share a 2-minute walkthrough of my work.

Would you be open to a brief chat this week?

Best regards,
Candidate`,
    generatedAt: new Date().toISOString(),
    generationMethod: 'dynamic_heuristic',
  };
}
