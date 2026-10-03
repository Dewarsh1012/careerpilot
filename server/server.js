import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import jobRoutes from './routes/job.routes.js';
import matchRoutes from './routes/match.routes.js';
import careerRoutes from './routes/career.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import applicationRoutes from './routes/application.routes.js';
import tailorRoutes from './routes/tailor.routes.js';
import campusRoutes from './routes/campus.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/career-plans', careerRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tailor', tailorRoutes);
app.use('/api/campus', campusRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CareerPilot AI API Server',
    lemmaLayer: 'Active',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 CareerPilot Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
