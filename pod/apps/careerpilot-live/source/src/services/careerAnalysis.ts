import type {
  InterviewEvaluation,
  JobRecord,
  MatchRecord,
  ResumeAnalysis,
  ResumeRecord,
} from '../types';

const TECH_CATALOG: Array<{ name: string; category: string; aliases?: string[] }> = [
  { name: 'React', category: 'Frontend', aliases: ['react.js', 'reactjs'] },
  { name: 'Next.js', category: 'Frontend', aliases: ['nextjs'] },
  { name: 'TypeScript', category: 'Language' },
  { name: 'JavaScript', category: 'Language', aliases: ['js'] },
  { name: 'Node.js', category: 'Backend', aliases: ['nodejs', 'node'] },
  { name: 'Express', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Database', aliases: ['postgres', 'psql'] },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps', aliases: ['k8s'] },
  { name: 'AWS', category: 'Cloud', aliases: ['amazon web services', 'ec2', 's3'] },
  { name: 'GCP', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'GraphQL', category: 'Backend' },
  { name: 'REST', category: 'Backend', aliases: ['rest apis', 'rest api'] },
  { name: 'Redis', category: 'Database' },
  { name: 'Git', category: 'Tools' },
  { name: 'CI/CD', category: 'DevOps', aliases: ['github actions', 'jenkins'] },
  { name: 'Tailwind CSS', category: 'Frontend', aliases: ['tailwind'] },
  { name: 'Python', category: 'Language' },
  { name: 'Java', category: 'Language' },
  { name: 'Go', category: 'Language', aliases: ['golang'] },
  { name: 'System Design', category: 'Architecture' },
];

function normalize(text: string): string {
  return text.toLowerCase();
}

function findSkillsInText(text: string): string[] {
  const hay = normalize(text);
  const found = new Set<string>();
  for (const item of TECH_CATALOG) {
    const terms = [item.name, ...(item.aliases ?? [])].map(normalize);
    if (terms.some((t) => hay.includes(t))) {
      found.add(item.name);
    }
  }
  return [...found];
}

function firstMatch(text: string, patterns: RegExp | RegExp[]): string | undefined {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  for (const re of list) {
    const m = text.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return undefined;
}

export function analyzeResumeText(text: string, fileName?: string): ResumeAnalysis {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const head = lines.slice(0, 8).join(' ');
  const candidateName =
    firstMatch(head, [/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/, /^([^\n|–-]{3,40})/]) ||
    fileName?.replace(/\.[^.]+$/, '').replace(/_/g, ' ') ||
    'Candidate';
  const email = firstMatch(text, [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/]);
  const phone = firstMatch(text, [/(\+?\d[\d\s().-]{8,}\d)/]);
  const skills = findSkillsInText(text);
  const technologies = skills.map((name) => {
    const meta = TECH_CATALOG.find((t) => t.name === name);
    return { name, category: meta?.category ?? 'General' };
  });

  const projectBlocks = text.split(/projects?/i).slice(1).join(' ').slice(0, 1200);
  const projectTitle =
    firstMatch(projectBlocks, [/([A-Z][\w\s]{4,40}(?:App|Platform|System|Canvas|Portal))/]) ||
    (skills.length ? `${skills[0]} Portfolio Project` : 'Capstone Project');

  const experienceTitle =
    firstMatch(text, /(software engineer|developer|intern|analyst)/i)?.replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Software Developer';

  const missingFromCatalog = ['Docker', 'AWS', 'Kubernetes'].filter((s) => !skills.includes(s));

  return {
    candidateName,
    email,
    phone,
    summary:
      lines.find((l) => l.length > 40 && !l.includes('@'))?.slice(0, 220) ||
      `Early-career professional with strengths in ${skills.slice(0, 4).join(', ') || 'modern software delivery'}.`,
    skills: skills.length ? skills : ['JavaScript', 'Git'],
    technologies,
    experience: [
      {
        title: experienceTitle,
        company: firstMatch(text, /(?:at|@)\s+([A-Z][\w\s&]{2,30})/) || 'Recent Experience',
        duration: firstMatch(text, /(20\d{2}\s*[-–]\s*(?:Present|20\d{2}))/i) || 'Recent',
        description:
          lines.find((l) => /built|developed|engineered|implemented/i.test(l))?.slice(0, 200) ||
          'Delivered features across frontend and backend with measurable user impact.',
      },
    ],
    projects: [
      {
        title: projectTitle,
        technologies: skills.slice(0, 5),
        description:
          lines.find((l) => /project|github|repository/i.test(l))?.slice(0, 180) ||
          'Hands-on project demonstrating end-to-end feature delivery.',
      },
    ],
    education: [
      {
        degree: firstMatch(text, /(B\.?\s*S\.?|Bachelor|M\.?\s*S\.?|Master)[^,\n]*/i) || 'B.S. Computer Science',
        institution: firstMatch(text, /(University|Institute|College)[^,\n]*/i) || 'University',
        year: firstMatch(text, /(20\d{2})/) || '2024',
      },
    ],
    strengths: skills.slice(0, 3).map((s) => `Demonstrated ${s} in projects or experience`),
    growthAreas: missingFromCatalog.length
      ? missingFromCatalog.map((s) => `Add production evidence for ${s}`)
      : ['Deepen system design storytelling'],
    domains: ['Software Engineering'],
  };
}

export function analyzeJobDescription(
  jobText: string,
  hints: { roleTitle?: string; company?: string; location?: string; sourceUrl?: string },
): Omit<JobRecord, 'id' | 'userId'> {
  const text = jobText.trim();
  const skills = findSkillsInText(text);
  const required = skills.slice(0, 8).map((name) => {
    const meta = TECH_CATALOG.find((t) => t.name === name);
    const priority =
      /required|must|strong/i.test(text.slice(Math.max(0, text.toLowerCase().indexOf(name.toLowerCase()) - 40), text.length))
        ? 'High'
        : 'Medium';
    return { name, category: meta?.category ?? 'General', priority };
  });
  if (required.length === 0) {
    ['React', 'TypeScript', 'Node.js', 'Docker'].forEach((name) => {
      required.push({ name, category: 'General', priority: 'High' });
    });
  }
  const preferred = ['AWS', 'CI/CD', 'System Design', 'Redis']
    .filter((n) => !required.some((r) => r.name === n) && normalize(text).includes(n.toLowerCase()))
    .map((name) => ({ name, category: TECH_CATALOG.find((t) => t.name === name)?.category ?? 'General' }));

  const seniority = /senior|staff|lead/i.test(text)
    ? 'Senior'
    : /junior|intern|entry/i.test(text)
      ? 'Entry-Level'
      : 'Mid-Level';
  const roleTitle =
    hints.roleTitle ||
    firstMatch(text, /(?:title|role)[:\s]+([^\n]+)/i) ||
    firstMatch(text, /(full[\s-]?stack|frontend|backend|software)[^\n]{0,30}engineer/i) ||
    'Software Engineer';
  const company = hints.company || firstMatch(text, /(?:company|at)\s+([A-Z][\w\s&]{2,40})/) || 'Target Company';

  const responsibilities = text
    .split(/\n|•|-/)
    .map((l) => l.trim())
    .filter((l) => l.length > 25 && /build|design|develop|collaborate|ship|maintain/i.test(l))
    .slice(0, 5);
  if (responsibilities.length === 0) {
    responsibilities.push('Build reliable product features with modern web and cloud tooling.');
  }

  return {
    roleTitle,
    company,
    location: hints.location || firstMatch(text, /(remote|[A-Z][a-z]+,\s*[A-Z]{2})/i) || 'Remote',
    seniority,
    experienceRequired: /(\d+\+?\s*years?)/i.test(text)
      ? (text.match(/(\d+\+?\s*years?)/i)?.[1] ?? '2-4 years')
      : seniority === 'Senior'
        ? '4+ years'
        : '0-2 years',
    rawDescription: text,
    sourceUrl: hints.sourceUrl,
    analysis: {
      roleTitle,
      company,
      seniority,
      experienceRequired: /(\d+\+?\s*years?)/i.test(text)
        ? (text.match(/(\d+\+?\s*years?)/i)?.[1] ?? '2-4 years')
        : '2-4 years',
      summary: responsibilities[0]?.slice(0, 200) || `Role focused on ${required.map((r) => r.name).slice(0, 3).join(', ')}.`,
      requiredSkills: required,
      preferredSkills: preferred,
      responsibilities,
    },
  };
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const parts: string[] = [];
  for (let page = 1; page <= doc.numPages; page++) {
    const pageDoc = await doc.getPage(page);
    const content = await pageDoc.getTextContent();
    const line = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (line) parts.push(line);
  }
  const text = parts.join('\n').trim();
  if (text.length < 20) {
    throw new Error('Could not extract enough text from this PDF — paste resume text instead.');
  }
  return text;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfText(file);
  }
  if (file.type.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.md')) {
    return file.text();
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    throw new Error('Word documents are not parsed here — paste resume text or save as .txt.');
  }
  const asText = await file.text();
  if (asText && asText.replace(/\s/g, '').length > 30 && !/[\x00-\x08\x0e-\x1f]/.test(asText.slice(0, 200))) {
    return asText;
  }
  throw new Error('Could not read this file — paste resume text instead.');
}

export function buildInterviewQuestion(ctx: {
  focusTopic?: string;
  match?: MatchRecord | null;
  resume?: ResumeRecord | null;
  job?: JobRecord | null;
}): {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
  hint: string;
  expectedKeyPoints: string[];
} {
  const gap =
    ctx.focusTopic ||
    ctx.match?.missingSkills?.[0]?.name ||
    ctx.match?.partialSkills?.[0]?.name ||
    ctx.job?.analysis.requiredSkills?.[0]?.name ||
    'System Design';
  const project = ctx.resume?.analysis.projects?.[0];
  const role = ctx.job?.roleTitle || ctx.resume?.analysis.candidateName || 'this role';

  let question = `For ${role}, explain how you would approach a production scenario involving ${gap}.`;
  if (project?.title) {
    question = `In your project "${project.title}", how did you apply ${gap}? What tradeoffs did you consider and how would you scale it for ${role}?`;
  }

  return {
    id: `q_${Date.now()}`,
    question,
    topic: gap,
    difficulty: ctx.match && ctx.match.matchScore >= 80 ? 'Hard' : 'Medium',
    hint: `Structure: context → your approach → tradeoffs → measurable outcome.`,
    expectedKeyPoints: [
      `${gap} fundamentals tied to the job description`,
      'Concrete example from resume or project',
      'Tradeoffs, failure modes, or scaling note',
    ],
  };
}

function interviewNum(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function interviewStr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function interviewStrList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

/** Normalize pod / LLM evaluation payloads (camelCase or snake_case) for the UI. */
export function normalizeInterviewEvaluation(raw: unknown): InterviewEvaluation | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const overall = interviewNum(o.overallScore ?? o.overall_score, NaN);
  if (!Number.isFinite(overall)) return null;
  const breakdownRaw = (o.breakdown ?? {}) as Record<string, unknown>;
  return {
    overallScore: overall,
    grade: interviewStr(o.grade, 'Evaluated'),
    breakdown: {
      correctness: interviewNum(breakdownRaw.correctness, overall),
      completeness: interviewNum(breakdownRaw.completeness, overall),
      technicalDepth: interviewNum(breakdownRaw.technicalDepth ?? breakdownRaw.technical_depth, overall),
      clarity: interviewNum(breakdownRaw.clarity, overall),
    },
    strengths: interviewStrList(o.strengths),
    missingConcepts: interviewStrList(o.missingConcepts ?? o.missing_concepts),
    suggestedImprovement: interviewStr(o.suggestedImprovement ?? o.suggested_improvement, ''),
    modelAnswer: interviewStr(o.modelAnswer ?? o.model_answer, ''),
    followUpQuestion: interviewStr(o.followUpQuestion ?? o.follow_up_question) || undefined,
    feedback: interviewStr(o.feedback) || undefined,
    evaluatedAt: interviewStr(o.evaluatedAt ?? o.evaluated_at, new Date().toISOString()),
  };
}

export function evaluateInterviewAnswer(input: {
  question: string;
  answer: string;
  topic?: string;
  expectedKeyPoints?: string[];
}): InterviewEvaluation {
  const answer = input.answer.trim();
  const words = answer.split(/\s+/).filter(Boolean);
  const topic = input.topic || 'General';
  const expected = input.expectedKeyPoints ?? [];
  const lower = normalize(answer);

  let hits = 0;
  for (const point of expected) {
    const tokens = point.toLowerCase().split(/\s+/).filter((t) => t.length > 4);
    if (tokens.some((t) => lower.includes(t))) hits++;
  }
  if (normalize(topic).split(/\s+/).some((t) => t.length > 3 && lower.includes(t))) hits++;

  const lengthScore = Math.min(10, Math.max(4, words.length / 18));
  const coverageScore = expected.length ? Math.min(10, 4 + (hits / expected.length) * 6) : 7;
  const overall = Math.round(((lengthScore + coverageScore) / 2) * 10) / 10;
  const grade =
    overall >= 8.5 ? 'Strong Answer' : overall >= 7 ? 'Good Answer' : overall >= 5.5 ? 'Needs Depth' : 'Keep Practicing';

  return {
    overallScore: overall,
    grade,
    breakdown: {
      correctness: Math.min(10, coverageScore + 0.5),
      completeness: Math.min(10, lengthScore),
      technicalDepth: Math.min(10, coverageScore),
      clarity: Math.min(10, words.length > 25 ? 8.5 : 6),
    },
    strengths:
      hits > 0
        ? [`Connected answer to ${topic} and key expectations.`]
        : ['Clear attempt with room to add technical specifics.'],
    missingConcepts:
      hits < expected.length
        ? expected.slice(hits).map((p) => `Expand on: ${p}`)
        : ['Add metrics or a concrete deployment example.'],
    suggestedImprovement: 'Use Problem → Approach → Tradeoff → Result, with one metric.',
    modelAnswer: `A strong answer names the ${topic} concept, walks through your implementation choices, and closes with impact or scale.`,
    followUpQuestion: `What would break first at 10x traffic, and how would you mitigate it?`,
    evaluatedAt: new Date().toISOString(),
  };
}
