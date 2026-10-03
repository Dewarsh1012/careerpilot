import express from 'express';
import { db, checkAndIncrementQuota } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { analyzeJob, scrapeJobFromUrl } from '../lemma/job.agent.js';

const router = express.Router();

const DEFAULT_SAMPLE_JOBS = [
  {
    id: 'job_sample_1',
    roleTitle: 'Full Stack Engineer',
    company: 'Stripe',
    location: 'Remote / San Francisco',
    seniority: 'Mid-Level',
    experienceRequired: '2-4 years',
    rawDescription: `We are looking for a Full Stack Engineer to join our Payments Platform team.
Requirements:
- Strong proficiency in modern JavaScript, TypeScript, and React.
- Solid background building reliable backend services in Node.js or Python.
- Hands-on experience with SQL databases (PostgreSQL) and caching layers (Redis).
- Familiarity with containerization (Docker) and CI/CD automation pipelines.
- Experience with Cloud deployments (AWS - EC2, S3, RDS) is strongly preferred.
- Passion for clean API architecture, security, and developer ergonomics.`,
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
        'Maintain automated test coverage and zero-downtime deployment pipelines.',
      ],
    },
  },
  {
    id: 'job_sample_2',
    roleTitle: 'Frontend Engineer',
    company: 'Vercel',
    location: 'Remote',
    seniority: 'Senior',
    experienceRequired: '4+ years',
    rawDescription: `Join Vercel to craft the future of web development tools.
You will build world-class user interfaces using Next.js, React Server Components, TypeScript, and Tailwind CSS.
Knowledge of web performance optimization, core web vitals, and accessibility standards is essential.`,
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
      responsibilities: [
        'Ship performant components using React Server Components.',
        'Optimize Core Web Vitals across millions of pageviews.',
      ],
    },
  },
  {
    id: 'job_sample_3',
    roleTitle: 'Cloud Platform & DevOps Engineer',
    company: 'Datadog',
    location: 'New York / Hybrid',
    seniority: 'Mid-Level',
    experienceRequired: '3+ years',
    rawDescription: `Datadog is seeking a Cloud Platform Engineer to scale telemetry ingest pipelines.
Must have deep experience with Docker, Kubernetes, AWS infrastructure (IAM, VPC, EKS, S3), CI/CD automation, and infrastructure as code.`,
    analysis: {
      roleTitle: 'Cloud Platform & DevOps Engineer',
      company: 'Datadog',
      seniority: 'Mid-Level',
      experienceRequired: '3+ years',
      summary: 'Automate container pipelines, configure cloud telemetry, and guarantee 99.99% uptime.',
      requiredSkills: [
        { name: 'Docker', category: 'DevOps', priority: 'High' },
        { name: 'Kubernetes', category: 'DevOps', priority: 'High' },
        { name: 'AWS', category: 'Cloud', priority: 'High' },
        { name: 'CI/CD', category: 'DevOps', priority: 'High' },
      ],
      preferredSkills: [
        { name: 'Python', category: 'Language' },
        { name: 'System Design', category: 'Architecture' },
      ],
      responsibilities: [
        'Manage multi-region Kubernetes clusters.',
        'Ensure continuous integration and security compliance.',
      ],
    },
  },
];

// List jobs (user jobs + sample jobs)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let userJobs = await db.jobs.find({ userId: req.user.id });
    if (userJobs.length === 0) {
      // Seed default sample jobs for this user
      for (const sample of DEFAULT_SAMPLE_JOBS) {
        await db.jobs.create({
          ...sample,
          userId: req.user.id,
        });
      }
      userJobs = await db.jobs.find({ userId: req.user.id });
    }
    res.json(userJobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Auto-scrape and analyze a job from public URL
router.post('/scrape', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'A job posting URL is required' });
    }

    // Check SaaS quota
    const quotaCheck = await checkAndIncrementQuota(req.user.id, 'jobMatches');
    if (!quotaCheck.allowed) {
      return res.status(403).json({ error: quotaCheck.reason, quota: quotaCheck.quota });
    }

    const scrapedData = await scrapeJobFromUrl(url);

    const newJob = await db.jobs.create({
      userId: req.user.id,
      roleTitle: scrapedData.roleTitle,
      company: scrapedData.company,
      location: 'Remote / Target Location',
      seniority: scrapedData.analysis.seniority,
      experienceRequired: scrapedData.analysis.experienceRequired,
      rawDescription: scrapedData.rawDescription,
      sourceUrl: scrapedData.sourceUrl,
      isScraped: true,
      isSimulated: scrapedData.isSimulated || false,
      analysis: scrapedData.analysis,
    });

    // Automatically set as active target job
    await db.users.findByIdAndUpdate(req.user.id, {
      activeJobId: newJob.id,
      targetRole: newJob.roleTitle,
    });

    // Auto-sync into Job Tracker applications
    await db.applications.create({
      userId: req.user.id,
      company: newJob.company,
      role: newJob.roleTitle,
      status: 'saved',
      matchScore: 82,
      salary: '$135k - $175k',
      location: newJob.location || 'Remote',
      appliedDate: null,
      notes: `Scraped target job: ${url}`,
      jobId: newJob.id,
    }).catch(() => undefined);

    res.status(201).json({
      job: newJob,
      quota: quotaCheck.quota,
      message: scrapedData.isSimulated
        ? 'Job extracted using domain blueprint (source page was shielded by anti-bot)'
        : 'Job successfully scraped and analyzed with Lemma AI Agent',
    });
  } catch (err) {
    console.error('Job scraping error:', err);
    res.status(500).json({ error: err.message || 'Failed to scrape job posting' });
  }
});

// Add and analyze a new job manually
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { jobText, roleTitle, company, location, sourceUrl } = req.body;
    if (!jobText && !roleTitle) {
      return res.status(400).json({ error: 'Job text or role title is required' });
    }

    // Check SaaS quota
    const quotaCheck = await checkAndIncrementQuota(req.user.id, 'jobMatches');
    if (!quotaCheck.allowed) {
      return res.status(403).json({ error: quotaCheck.reason, quota: quotaCheck.quota });
    }

    const analysis = await analyzeJob(jobText || roleTitle, roleTitle);
    if (company) analysis.company = company;

    const newJob = await db.jobs.create({
      userId: req.user.id,
      roleTitle: analysis.roleTitle,
      company: company || analysis.company,
      location: location || 'Remote / Hybrid',
      seniority: analysis.seniority,
      experienceRequired: analysis.experienceRequired,
      rawDescription: jobText || `${analysis.roleTitle} at ${analysis.company}`,
      sourceUrl: sourceUrl || null,
      analysis,
    });

    // Set as active target job
    await db.users.findByIdAndUpdate(req.user.id, {
      activeJobId: newJob.id,
      targetRole: newJob.roleTitle,
    });

    // Auto-sync into Job Tracker applications
    await db.applications.create({
      userId: req.user.id,
      company: newJob.company,
      role: newJob.roleTitle,
      status: 'saved',
      matchScore: 82,
      salary: '$135k - $175k',
      location: newJob.location || 'Remote / Hybrid',
      appliedDate: null,
      notes: `Target job created in Studio (${newJob.seniority || 'Full Time'}).`,
      jobId: newJob.id,
    }).catch(() => undefined);

    res.status(201).json(newJob);
  } catch (err) {
    console.error('Job analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze job description' });
  }
});

// Set as active job track
router.patch('/:id/active', authMiddleware, async (req, res) => {
  try {
    const job = await db.jobs.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    await db.users.findByIdAndUpdate(req.user.id, {
      activeJobId: job.id,
      targetRole: job.roleTitle,
    });

    res.json({ success: true, activeJobId: job.id, targetRole: job.roleTitle });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch active job track' });
  }
});

// Delete target job
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await db.jobs.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    await db.jobs.findByIdAndDelete(req.params.id);

    // If active job was deleted, clear activeJobId
    const user = await db.users.findById(req.user.id);
    if (user?.activeJobId === req.params.id) {
      await db.users.findByIdAndUpdate(req.user.id, { activeJobId: null });
    }

    res.json({ success: true, message: 'Job removed from target tracks' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get single job
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await db.jobs.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve job' });
  }
});

export default router;
