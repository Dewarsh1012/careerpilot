import { runLemmaAgent, extractJsonFromResponse } from '../services/lemma.service.js';

/**
 * Matching & Skill Gap Agent
 * Performs dynamic side-by-side comparison between candidate profile and target job
 * using Lemma Cloud AI Agents.
 */

export async function matchProfileToJob(candidateProfile, jobProfile) {
  const candidateSkills = (candidateProfile?.skills || []).map((s) => (typeof s === 'string' ? s : s.name));
  const reqSkills = (jobProfile?.requiredSkills || []).map((s) => (typeof s === 'string' ? s : s.name));
  const prefSkills = (jobProfile?.preferredSkills || []).map((s) => (typeof s === 'string' ? s : s.name));

  // 1. Try real Lemma AI Agent matching
  try {
    const systemPrompt = `You are the CareerPilot Matching & Skill Gap Agent.
Your job is to compare a candidate's actual extracted career profile with a target job specification.
You must output an explainable, granular breakdown of matched skills, partial skills, and missing skills.
CRITICAL RULES:
1. Base your evaluation strictly on the candidate's actual skills, projects, and work history.
2. Provide concrete evidence for matched skills (referencing their actual project or role).
3. For partial skills, explain the exact difference between familiar knowledge and production expectation.
4. For missing skills, explain the impact on technical screening and provide a concrete learning action.
5. Return ONLY valid JSON with no markdown formatting.

Schema:
{
  "matchScore": number (integer between 0 and 100),
  "readinessLevel": "Interview Ready | Needs Target Prep | Foundational Gap",
  "matchedSkills": [
    {
      "name": "Skill Name",
      "category": "Language | Frontend | Backend | Database | DevOps | Cloud | Architecture | Tools",
      "status": "matched",
      "evidence": "Concrete evidence from candidate projects, roles, or resume",
      "isRequired": boolean
    }
  ],
  "partialSkills": [
    {
      "name": "Skill Name",
      "category": "Category",
      "status": "partial",
      "currentLevel": "e.g. Familiar / Related Stack",
      "requiredLevel": "e.g. Production Proficiency",
      "gapExplanation": "Why this is a partial match rather than full production match",
      "recommendation": "Concrete task to close this partial gap",
      "isRequired": boolean
    }
  ],
  "missingSkills": [
    {
      "name": "Skill Name",
      "category": "Category",
      "status": "missing",
      "importance": "High | Medium",
      "impactOnRole": "Why this missing skill matters for the role",
      "recommendation": "Actionable task or project to acquire and prove this skill",
      "isRequired": boolean
    }
  ],
  "nextMove": "Single high-impact immediate action the user should do next"
}`;

    const prompt = `Compare this candidate with this target job:

--- CANDIDATE PROFILE ---
Name: ${candidateProfile?.candidateName || 'Candidate'}
Current Role: ${candidateProfile?.currentRole || ''}
Skills: ${JSON.stringify(candidateSkills)}
Projects: ${JSON.stringify((candidateProfile?.projects || []).slice(0, 4))}
Experience: ${JSON.stringify((candidateProfile?.experience || []).slice(0, 3))}

--- TARGET JOB ---
Title: ${jobProfile?.roleTitle || 'Target Role'}
Company: ${jobProfile?.company || 'Target Company'}
Required Skills: ${JSON.stringify(reqSkills)}
Preferred Skills: ${JSON.stringify(prefSkills)}
Responsibilities: ${JSON.stringify((jobProfile?.responsibilities || []).slice(0, 4))}`;

    const rawResponse = await runLemmaAgent(prompt, systemPrompt, 'job-analyst');
    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed && typeof parsed.matchScore === 'number' && Array.isArray(parsed.matchedSkills)) {
      return {
        jobId: jobProfile?.id || jobProfile?._id,
        targetRole: jobProfile?.roleTitle || 'Target Role',
        matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore))),
        readinessLevel: parsed.readinessLevel || (parsed.matchScore >= 80 ? 'Interview Ready' : parsed.matchScore >= 60 ? 'Needs Target Prep' : 'Foundational Gap'),
        matchedSkills: parsed.matchedSkills,
        partialSkills: Array.isArray(parsed.partialSkills) ? parsed.partialSkills : [],
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
        nextMove: parsed.nextMove || 'Review your skill gaps and start interview practice.',
        analyzedAt: new Date().toISOString(),
        matchingMethod: 'lemma_agent',
      };
    }
  } catch (err) {
    console.warn('Lemma AI Agent matching encountered an error, falling back to dynamic algorithm:', err.message);
  }

  // 2. Dynamic Fallback Comparison
  return dynamicMatchingEngine(candidateProfile, jobProfile, candidateSkills, reqSkills, prefSkills);
}

function dynamicMatchingEngine(candidateProfile, jobProfile, candidateSkills, reqSkills, prefSkills) {
  const candidateLower = candidateSkills.map((s) => s.toLowerCase());
  const allJobSkills = Array.from(new Set([...reqSkills, ...prefSkills]));

  const matchedSkills = [];
  const partialSkills = [];
  const missingSkills = [];

  allJobSkills.forEach((jobSkill) => {
    const isRequired = reqSkills.includes(jobSkill);
    const jLower = jobSkill.toLowerCase();

    const exactMatch = candidateLower.includes(jLower);
    const relatedMatch = candidateLower.some((c) => c.includes(jLower) || jLower.includes(c) || isRelated(c, jLower));

    if (exactMatch) {
      matchedSkills.push({
        name: jobSkill,
        category: getCategory(jobSkill),
        status: 'matched',
        evidence: `Demonstrated in candidate profile and project experience.`,
        isRequired,
      });
    } else if (relatedMatch) {
      partialSkills.push({
        name: jobSkill,
        category: getCategory(jobSkill),
        status: 'partial',
        currentLevel: 'Familiar / Related Stack',
        requiredLevel: 'Production Proficiency',
        gapExplanation: `Candidate has related competency but needs deeper hands-on production depth in ${jobSkill}.`,
        recommendation: `Build a focused component or service highlighting ${jobSkill}.`,
        isRequired,
      });
    } else {
      missingSkills.push({
        name: jobSkill,
        category: getCategory(jobSkill),
        status: 'missing',
        importance: isRequired ? 'High' : 'Medium',
        impactOnRole: isRequired ? 'Critical gate for technical screening' : 'Differentiator for hiring decision',
        recommendation: `Complete targeted implementation module using ${jobSkill}.`,
        isRequired,
      });
    }
  });

  const totalWeight = reqSkills.length * 2 + prefSkills.length * 1 || 10;
  let earnedScore = 0;
  matchedSkills.forEach((s) => (earnedScore += s.isRequired ? 2 : 1));
  partialSkills.forEach((s) => (earnedScore += s.isRequired ? 1 : 0.5));

  let matchScore = Math.round((earnedScore / totalWeight) * 100);
  if (matchScore > 98) matchScore = 98;
  if (matchScore < 35 && candidateSkills.length > 2) matchScore = 48;

  let nextMove = 'Review your profile and start interview practice.';
  if (missingSkills.length > 0) {
    nextMove = `Target high-impact gap: Build and deploy a test component using ${missingSkills[0].name}.`;
  } else if (partialSkills.length > 0) {
    nextMove = `Elevate ${partialSkills[0].name} to production standard with a practical project milestone.`;
  }

  return {
    jobId: jobProfile?.id || jobProfile?._id,
    targetRole: jobProfile?.roleTitle || 'Target Role',
    matchScore,
    readinessLevel: matchScore >= 80 ? 'Interview Ready' : matchScore >= 60 ? 'Needs Target Prep' : 'Foundational Gap',
    matchedSkills,
    partialSkills,
    missingSkills,
    nextMove,
    analyzedAt: new Date().toISOString(),
    matchingMethod: 'dynamic_heuristic',
  };
}

function isRelated(skillA, skillB) {
  const relatedMap = {
    javascript: ['typescript', 'node.js', 'react'],
    typescript: ['javascript', 'node.js'],
    react: ['next.js', 'vue.js', 'frontend'],
    'node.js': ['express', 'nestjs', 'backend'],
    docker: ['kubernetes', 'devops', 'containerization'],
    aws: ['gcp', 'azure', 'cloud'],
    postgresql: ['mysql', 'sql', 'database'],
    mongodb: ['nosql', 'redis', 'database'],
  };
  return (relatedMap[skillA] || []).includes(skillB) || (relatedMap[skillB] || []).includes(skillA);
}

function getCategory(skill) {
  const s = skill.toLowerCase();
  if (['react', 'next.js', 'vue', 'tailwind', 'html', 'css'].some((k) => s.includes(k))) return 'Frontend';
  if (['node', 'express', 'python', 'go', 'rust', 'api'].some((k) => s.includes(k))) return 'Backend';
  if (['sql', 'postgres', 'mongo', 'redis'].some((k) => s.includes(k))) return 'Database';
  if (['docker', 'k8s', 'kubernetes', 'ci/cd', 'jenkins'].some((k) => s.includes(k))) return 'DevOps';
  if (['aws', 'cloud', 'gcp', 'azure'].some((k) => s.includes(k))) return 'Cloud';
  return 'Technical';
}
