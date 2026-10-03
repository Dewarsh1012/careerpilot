import { runLemmaAgent, extractJsonFromResponse } from '../services/lemma.service.js';

/**
 * Job Analysis Agent
 * Extracts structured job requirements, core skills, seniority, and responsibilities
 * dynamically using Lemma Cloud AI Agents.
 */

export async function analyzeJob(jobText, customTitle = '') {
  const cleanText = (jobText || '').trim();
  if (!cleanText) {
    throw new Error('Job description text is empty');
  }

  // 1. Run real Lemma AI Agent
  try {
    const systemPrompt = `You are an expert Technical Job Analysis Agent.
Analyze the provided job description and decompose it into structured requirements JSON.
CRITICAL RULES:
1. Do not invent requirements that are not requested in the job description.
2. Separate mandatory/hard requirements into requiredSkills and nice-to-haves into preferredSkills.
3. Extract real responsibilities from the text.
4. Return ONLY valid JSON. No markdown backticks or commentary.

Schema:
{
  "roleTitle": "Normalized Job Title (e.g. Senior Backend Engineer)",
  "company": "Company Name if present, else 'Target Company'",
  "seniority": "Entry-Level / Fresher | Mid-Level | Senior | Lead / Staff",
  "experienceRequired": "e.g. 3+ years",
  "summary": "2-3 sentence overview of this role and the core mission",
  "requiredSkills": [
    { "name": "Skill Name", "category": "Language | Frontend | Backend | Database | DevOps | Cloud | Architecture | Tools", "priority": "High | Medium" }
  ],
  "preferredSkills": [
    { "name": "Skill Name", "category": "Language | Frontend | Backend | Database | DevOps | Cloud | Architecture | Tools" }
  ],
  "responsibilities": [
    "Specific core responsibilities extracted directly from the job posting"
  ],
  "domain": "Primary domain (e.g. Backend Infrastructure, Full Stack, DevOps)"
}`;

    const prompt = `Decompose this job posting into structured technical requirements:
Target Title hint (if any): ${customTitle || 'Infer from text'}

--- JOB DESCRIPTION ---
${cleanText.slice(0, 10000)}
--- END JOB DESCRIPTION ---`;

    const rawResponse = await runLemmaAgent(prompt, systemPrompt, 'job-analyst');
    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed && parsed.roleTitle && Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length > 0) {
      return {
        roleTitle: parsed.roleTitle || customTitle || 'Software Engineer',
        company: parsed.company || 'Target Company',
        seniority: parsed.seniority || 'Mid-Level',
        experienceRequired: parsed.experienceRequired || '2+ years',
        summary: parsed.summary || 'Analyze requirements and build production-grade features.',
        requiredSkills: parsed.requiredSkills,
        preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
        responsibilities: Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0
          ? parsed.responsibilities
          : ['Design and build reliable software components', 'Participate in code reviews and architectural planning'],
        domain: parsed.domain || 'Software Engineering',
        extractedAt: new Date().toISOString(),
        analysisMethod: 'lemma_agent',
      };
    }
  } catch (err) {
    console.warn('Lemma AI Agent job analysis encountered an error, falling back to dynamic parser:', err.message);
  }

  // 2. Dynamic Fallback Parser
  return dynamicJobParser(cleanText, customTitle);
}

function dynamicJobParser(text, customTitle) {
  const normalized = text.toLowerCase();

  let roleTitle = customTitle;
  if (!roleTitle) {
    const titleMatch = text.match(/(?:title|role|position):\s*([^\n\r]+)/i);
    if (titleMatch) {
      roleTitle = titleMatch[1].trim();
    } else if (normalized.includes('full stack') || normalized.includes('fullstack')) {
      roleTitle = 'Full Stack Engineer';
    } else if (normalized.includes('frontend') || normalized.includes('front-end')) {
      roleTitle = 'Frontend Engineer';
    } else if (normalized.includes('backend') || normalized.includes('back-end')) {
      roleTitle = 'Backend Engineer';
    } else if (normalized.includes('devops') || normalized.includes('sre') || normalized.includes('cloud')) {
      roleTitle = 'DevOps / Cloud Engineer';
    } else if (normalized.includes('ai') || normalized.includes('machine learning')) {
      roleTitle = 'AI / ML Engineer';
    } else {
      roleTitle = 'Software Engineer';
    }
  }

  let seniority = 'Mid-Level';
  if (/senior|lead|principal|staff/i.test(normalized)) {
    seniority = 'Senior';
  } else if (/junior|intern|entry|fresher|graduate/i.test(normalized)) {
    seniority = 'Entry-Level / Fresher';
  }

  const expMatch = text.match(/(\d+\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?))/i);
  const experienceRequired = expMatch ? expMatch[0] : (seniority === 'Senior' ? '5+ years' : '2+ years');

  const technicalKeywords = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'JavaScript', category: 'Language' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Python', category: 'Language' },
    { name: 'Go', category: 'Language' },
    { name: 'Rust', category: 'Language' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Redis', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'GCP', category: 'Cloud' },
    { name: 'CI/CD', category: 'DevOps' },
    { name: 'System Design', category: 'Architecture' },
    { name: 'GraphQL', category: 'Backend' },
    { name: 'REST APIs', category: 'Backend' },
    { name: 'Kafka', category: 'Tools' },
  ];

  const requiredSkills = [];
  const preferredSkills = [];

  technicalKeywords.forEach((tk) => {
    const reg = new RegExp(`\\b${tk.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (reg.test(text)) {
      if (['System Design', 'Kubernetes', 'Redis', 'Kafka', 'GraphQL'].includes(tk.name)) {
        preferredSkills.push({ name: tk.name, category: tk.category });
      } else {
        requiredSkills.push({ name: tk.name, category: tk.category, priority: 'High' });
      }
    }
  });

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const responsibilities = lines.filter((l) => (l.startsWith('•') || l.startsWith('-') || l.startsWith('*')) && l.length > 20).map((l) => l.replace(/^[-•*]\s*/, '')).slice(0, 5);

  return {
    roleTitle,
    company: 'Target Company',
    seniority,
    experienceRequired,
    summary: `Looking for a ${seniority} ${roleTitle} to contribute to development and operational scalability.`,
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : [{ name: 'Software Development', category: 'Technical', priority: 'High' }],
    preferredSkills,
    responsibilities: responsibilities.length > 0 ? responsibilities : ['Build resilient production features', 'Collaborate on engineering standards'],
    domain: 'Engineering',
    extractedAt: new Date().toISOString(),
    analysisMethod: 'dynamic_heuristic_nlp',
  };
}

/**
 * Scrape and extract job posting from any public URL (Greenhouse, Lever, LinkedIn, Indeed, etc.)
 */
export async function scrapeJobFromUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid job posting URL is required');
  }

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  let extractedTitle = '';
  let companyHint = '';
  let rawText = '';
  let isSimulated = false;

  // Infer company and title hints from URL slug if possible
  try {
    const parsedUrl = new URL(formattedUrl);
    const hostnameParts = parsedUrl.hostname.split('.');
    if (hostnameParts.length >= 2) {
      const brand = hostnameParts[hostnameParts.length - 2];
      if (!['jobs', 'careers', 'boards', 'lever', 'greenhouse', 'ashbyhq', 'workday'].includes(brand.toLowerCase())) {
        companyHint = brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const lastSlug = decodeURIComponent(pathSegments[pathSegments.length - 1]).replace(/[-_]/g, ' ');
      if (lastSlug.length > 4 && !/^\d+$/.test(lastSlug)) {
        extractedTitle = lastSlug
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
  } catch (e) {
    // continue
  }

  // Attempt live HTTP fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();

      // Extract title tag
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const rawTitle = titleMatch[1].trim();
        // Often "Role at Company - Careers"
        const parts = rawTitle.split(/[-–|·]/);
        if (parts.length > 0 && !extractedTitle) {
          extractedTitle = parts[0].trim();
        }
        if (parts.length > 1 && !companyHint) {
          companyHint = parts[1].replace(/careers|jobs|hiring/gi, '').trim();
        }
      }

      // Strip unwanted HTML tags
      let cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\r\n|\r/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 2)
        .join('\n');

      if (cleaned.length > 200) {
        rawText = cleaned.slice(0, 15000);
      }
    }
  } catch (err) {
    console.warn(`Live fetch for ${formattedUrl} failed (${err.message}), falling back to URL slug decomposition.`);
  }

  // If page was blocked (e.g. LinkedIn authwall / Cloudflare 403), synthesize a high-fidelity template from URL metadata
  if (!rawText || rawText.length < 150) {
    isSimulated = true;
    const inferredRole = extractedTitle || 'Software Engineer';
    const inferredCompany = companyHint || 'Target Tech Co';
    rawText = `${inferredRole} at ${inferredCompany}
Requirements:
- 3+ years experience designing, building, and maintaining modern production software.
- High proficiency with TypeScript, React, Node.js, and modern REST or GraphQL APIs.
- Experience with relational and NoSQL databases (PostgreSQL, MongoDB) and distributed caching.
- Familiarity with containerization (Docker, Kubernetes) and CI/CD pipelines.
- Hands-on experience with cloud infrastructure (AWS or GCP).
- Strong system design fundamentals, technical communication, and collaborative spirit.
Responsibilities:
- Build high-availability frontend interfaces and scalable backend microservices.
- Write resilient automated test suites and maintain zero-downtime deployment pipelines.
- Collaborate with product and design leads on product specifications and architectural reviews.`;
  }

  // Decompose via Lemma Job Analysis Agent
  const analysis = await analyzeJob(rawText, extractedTitle);
  if (companyHint && (!analysis.company || analysis.company === 'Target Company')) {
    analysis.company = companyHint;
  }

  return {
    sourceUrl: formattedUrl,
    roleTitle: analysis.roleTitle || extractedTitle || 'Software Engineer',
    company: analysis.company || companyHint || 'Target Company',
    rawDescription: rawText,
    analysis,
    isScraped: true,
    isSimulated,
  };
}
