# CareerPilot — AI Career Companion

> **"Your career, finally with a plan."**  
> An intelligent full-stack career workspace powered by the **Lemma Agent Orchestration Architecture**.

---

## 🌟 Overview & Product Philosophy

CareerPilot is built around a single, continuous user journey:
```
Understand Me → Understand the Job → Measure the Gap → Build the Plan → Practice & Polish → Measure Progress
```

Rather than treating career preparation as disjointed AI prompts, CareerPilot is a persistent workspace where the output of one intelligent agent directly fuels downstream workflows:
- **Resume Agent** → Extracts verified telemetry (skills, projects, domains) into structured data.
- **Job Agent** → Breaks down job descriptions into required vs. preferred competencies.
- **Match Agent** → Compares candidate evidence with job requirements, outputting matched, partial, and missing skills.
- **Career Planner** → Transforms skill gaps into an interactive 5-phase execution roadmap.
- **Interview Coach** → Generates context-aware technical screening questions based on resume projects and target gaps, scoring answers across 4 pillars.
- **Application Tracker** → Organizes target roles in a Kanban board and produces company-specific AI interview prep packs.

---

## 🎨 UI/UX Design System (PRD Specification)

- **Canvas & Palette**:
  - Background Canvas: `#F8F8F6` (Warm off-white)
  - Card Surfaces: `#FFFFFF`
  - Subtle Borders: `#E7E7E4`
  - Typography: `#171717` (Deep Charcoal) & `#6B6B6B` (Secondary)
  - Accent Color: `#F05A28` (Energetic coral/orange representing movement & progress)
  - Semantic Status:
    - Green (`#16A34A`): Verified / Matched / Completed
    - Amber (`#D97706`): Partial / In Progress / Related Stack
    - Red (`#DC2626`): Critical Skill Gap
- **Signature UI Elements**:
  - **The "Next Move" Card**: Prominently answers *"What should I do next?"* on every screen.
  - **"YOU ARE HERE" Journey Bar**: Compact horizontal pipeline tracking progress (`PROFILE ─── RESUME ─── MATCH ─── GAP ─── PLAN ─── INTERVIEW`).
  - **Skill Match Matrix**: Animated side-by-side comparison between candidate profile and target requirements.

---

## 🏗️ Architecture

```
careerpilot/
├── server/
│   ├── config/
│   │   └── db.js            # Universal Repository layer (dual-mode in-memory/file & MongoDB)
│   ├── lemma/
│   │   ├── resume.agent.js   # Resume extraction & skill profiling
│   │   ├── job.agent.js      # Job posting decomposition
│   │   ├── matching.agent.js # 3-way skill matching & gap scoring
│   │   ├── career.agent.js   # 5-phase career plan generation
│   │   ├── interview.agent.js# Contextual Q&A and 4-pillar evaluation
│   │   └── application.agent.js # Company-specific prep pack generator
│   ├── routes/              # Express REST API endpoints
│   ├── middleware/          # Auth JWT & Multer PDF upload handlers
│   └── server.js            # Express server (Port 4000)
└── client/
    ├── src/
    │   ├── components/      # Navbar, Sidebar, JourneyBar, NextMoveCard
    │   ├── pages/           # Dashboard, Resume, Jobs, Match, Roadmap, Interview, Applications, Profile
    │   ├── context/         # AuthContext & CareerContext
    │   └── services/api.ts  # REST client service
    ├── vite.config.ts       # Vite + Tailwind with /api proxy
    └── index.html           # Manrope + Inter Google Fonts
```

---

## 🚀 Running CareerPilot Locally

### 1. Prerequisites
- **Node.js**: v18+ (Verified on v20.20.2)
- **npm**: v10+

### 2. Start Backend API Server
```bash
cd "/Users/dewarshjain/Desktop/Lemma platform/careerpilot/server"
npm run dev
# Server boots on http://localhost:4000
# Health check: http://localhost:4000/api/health
```

### 3. Start Frontend Client
```bash
cd "/Users/dewarshjain/Desktop/Lemma platform/careerpilot/client"
npm run dev
# Client runs on http://localhost:5173
```

---

## 🧪 Key Workflows Demonstrated
1. **Interactive Dashboard**: Follows the 6-question hierarchy (*Where Am I, Where Am I Going, What Should I Do Now, What Am I Missing, How Am I Improving, Am I Ready*).
2. **Resume Telemetry**: Drag & drop PDF resume upload with multi-step animated progress indicators and instant sample presets.
3. **Target Job Intelligence**: Select from curated industry targets (Stripe Full Stack, Vercel Frontend, Datadog Platform) or paste custom job specs.
4. **Side-by-Side Match Matrix**: Visual breakdown showing verified skills (✓), partial matches (⚠), and missing critical requirements (❌).
5. **Interactive 5-Phase Roadmap**: Check off milestone tasks, celebrate completion with confetti, and trigger **"Re-Analyze My Readiness"** to update career telemetry.
6. **AI Technical Interview Coach**: Experience dynamic question prompts tailored to your resume projects and weak areas, with structured 4-pillar scoring (Depth, Correctness, Completeness, Clarity) and senior model answers.
7. **Job Application Tracker**: Kanban stages (*Saved, Applied, Interview, Offer*) with one-click **Company-Specific AI Prep Pack** generation.

---

## 🌐 Cloud Deployment (Lemma Pod)

- **Dedicated Pod**: `careerpilot` (`01a0e97d-0079-77d5-88d3-5b56d6c87198`)
- **Live URL**: [https://careerpilot-live.apps.lemma.work](https://careerpilot-live.apps.lemma.work)
- **Status**: `READY` (Active Release)
- **CLI Commands**:
  ```bash
  # Check pod apps
  lemma apps list --pod 01a0e97d-0079-77d5-88d3-5b56d6c87198

  # Re-deploy frontend bundle
  lemma app deploy careerpilot-live ./client --dist-dir ./client/dist --pod 01a0e97d-0079-77d5-88d3-5b56d6c87198 --yes
  ```

