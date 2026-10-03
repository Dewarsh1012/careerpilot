import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB schema
const initialDb = {
  users: [],
  resumes: [],
  jobs: [],
  matches: [],
  careerPlans: [],
  interviewSessions: [],
  applications: [],
  tailoredResumes: [],
};

// In-memory cache + file sync
let dbData = { ...initialDb };

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbData = { ...initialDb, ...JSON.parse(content) };
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading DB file, initializing clean database:', err);
    dbData = { ...initialDb };
    saveDb();
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

loadDb();

/**
 * Universal Repository interface mimicking Mongoose/MongoDB query patterns
 */
export class Repository {
  constructor(collectionName) {
    this.collectionName = collectionName;
    if (!dbData[collectionName]) {
      dbData[collectionName] = [];
      saveDb();
    }
  }

  get items() {
    return dbData[this.collectionName] || [];
  }

  async find(filter = {}) {
    return this.items.filter((item) => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  async findOne(filter = {}) {
    return this.items.find((item) => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    }) || null;
  }

  async findById(id) {
    return this.items.find((item) => item.id === id || item._id === id) || null;
  }

  async create(data) {
    const now = new Date().toISOString();
    const id = data.id || data._id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newDoc = {
      ...data,
      id,
      _id: id,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    dbData[this.collectionName].push(newDoc);
    saveDb();
    return newDoc;
  }

  async findByIdAndUpdate(id, updates) {
    const index = this.items.findIndex((item) => item.id === id || item._id === id);
    if (index === -1) return null;

    const updatedDoc = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    dbData[this.collectionName][index] = updatedDoc;
    saveDb();
    return updatedDoc;
  }

  async findOneAndUpdate(filter, updates) {
    const doc = await this.findOne(filter);
    if (!doc) return null;
    return this.findByIdAndUpdate(doc.id, updates);
  }

  async findByIdAndDelete(id) {
    const index = this.items.findIndex((item) => item.id === id || item._id === id);
    if (index === -1) return null;
    const [deleted] = dbData[this.collectionName].splice(index, 1);
    saveDb();
    return deleted;
  }
}

/**
 * SaaS Tier Configurations and Quotas
 */
export const PLAN_LIMITS = {
  free: {
    tier: 'free',
    name: 'Free Starter',
    monthlyPrice: 0,
    resumeAnalyses: 3,
    jobMatches: 5,
    tailoredResumes: 2,
    interviewSessions: 5,
    voiceInterviews: 2,
    features: ['Standard AI Matching', 'Core 5-Phase Roadmap', 'Text-Based Mock Interview'],
  },
  pro: {
    tier: 'pro',
    name: 'Pro Career Navigator',
    monthlyPrice: 19,
    resumeAnalyses: 999,
    jobMatches: 999,
    tailoredResumes: 999,
    interviewSessions: 999,
    voiceInterviews: 999,
    features: [
      'Unlimited ATS Tailored Resumes & PDF Export',
      'Real-Time Spoken AI Voice Mock Interview',
      'AI Cover Letter & Cold InMail Pitcher',
      'Telegram/WhatsApp Micro-Drills via Lemma Surface',
      'Company Specific Interview Packs',
    ],
  },
  campus: {
    tier: 'campus',
    name: 'Campus / Enterprise',
    monthlyPrice: 499,
    resumeAnalyses: 9999,
    jobMatches: 9999,
    tailoredResumes: 9999,
    interviewSessions: 9999,
    voiceInterviews: 9999,
    features: [
      'Everything in Pro',
      'Cohort Readiness Dashboard',
      'Recruiter Verification Badges',
      'Batch Job Matching & Placement Analytics',
    ],
  },
};

export function getDefaultQuota(plan = 'free') {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return {
    plan,
    resumeAnalyses: { used: 0, limit: limits.resumeAnalyses },
    jobMatches: { used: 0, limit: limits.jobMatches },
    tailoredResumes: { used: 0, limit: limits.tailoredResumes },
    interviewSessions: { used: 0, limit: limits.interviewSessions },
    voiceInterviews: { used: 0, limit: limits.voiceInterviews },
  };
}

export async function checkAndIncrementQuota(userId, featureKey) {
  const user = await db.users.findById(userId);
  if (!user) throw new Error('User not found');

  const plan = user.plan || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const currentQuota = user.quota || getDefaultQuota(plan);

  const feature = currentQuota[featureKey] || { used: 0, limit: limits[featureKey] || 10 };
  if (feature.used >= feature.limit) {
    return {
      allowed: false,
      reason: `Quota limit reached for ${featureKey} (${feature.used}/${feature.limit}). Upgrade to Pro for unlimited access.`,
      plan,
      quota: currentQuota,
    };
  }

  feature.used += 1;
  currentQuota[featureKey] = feature;
  await db.users.findByIdAndUpdate(userId, { quota: currentQuota });

  return {
    allowed: true,
    plan,
    quota: currentQuota,
  };
}

export const db = {
  users: new Repository('users'),
  resumes: new Repository('resumes'),
  jobs: new Repository('jobs'),
  matches: new Repository('matches'),
  careerPlans: new Repository('careerPlans'),
  interviewSessions: new Repository('interviewSessions'),
  applications: new Repository('applications'),
  tailoredResumes: new Repository('tailoredResumes'),
};
