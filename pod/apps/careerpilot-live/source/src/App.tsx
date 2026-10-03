import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CareerProvider } from './context/CareerContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumePage } from './pages/ResumePage';
import { JobsPage } from './pages/JobsPage';
import { MatchPage } from './pages/MatchPage';
import { CareerPlanPage } from './pages/CareerPlanPage';
import { InterviewPage } from './pages/InterviewPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CampusPage } from './pages/CampusPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [viewState, setViewState] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="cp-page min-h-screen flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold cp-text font-heading">
          Starting CareerPilot Workspace...
        </p>
      </div>
    );
  }

  // If user is authenticated and hasn't finished onboarding
  if (user && !user.onboarded) {
    return <OnboardingPage onComplete={() => setViewState('app')} />;
  }

  // Not authenticated: always render LandingPage or AuthPage
  if (!user) {
    if (viewState === 'auth') {
      return (
        <AuthPage
          initialMode={authMode}
          onSuccess={() => setViewState('app')}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => {
          setAuthMode('register');
          setViewState('auth');
        }}
        onLogin={() => {
          setAuthMode('login');
          setViewState('auth');
        }}
      />
    );
  }

  // Authenticated Main Workspace Layout (PRD Section 2)
  return (
    <CareerProvider>
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
        {/* Top Navbar (64px) */}
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
          {/* Persistent Sidebar (240px) */}
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

          {/* Main Content Area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {currentTab === 'dashboard' && <DashboardPage setCurrentTab={setCurrentTab} />}
            {currentTab === 'resume' && <ResumePage />}
            {currentTab === 'jobs' && <JobsPage setCurrentTab={setCurrentTab} />}
            {currentTab === 'match' && <MatchPage setCurrentTab={setCurrentTab} />}
            {currentTab === 'roadmap' && <CareerPlanPage setCurrentTab={setCurrentTab} />}
            {currentTab === 'interview' && <InterviewPage setCurrentTab={setCurrentTab} />}
            {currentTab === 'applications' && <ApplicationsPage />}
            {currentTab === 'profile' && <ProfilePage setCurrentTab={setCurrentTab} />}
            {currentTab === 'campus' && <CampusPage setCurrentTab={setCurrentTab} />}
          </main>
        </div>
      </div>
    </CareerProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
