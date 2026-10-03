import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Settings,
  CheckCircle2,
  ExternalLink,
  X,
  ShieldCheck,
  Check,
  Globe,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface AuthPageProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number | string;
            }
          ) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [name, setName] = useState('Archi Jain');
  const [email, setEmail] = useState('archi@careerpilot.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Google OAuth Config & Modal States
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('dewarsh.jain@google.com');
  const [googleNameInput, setGoogleNameInput] = useState('Dewarsh Jain');
  const [customClientId, setCustomClientId] = useState(
    () => localStorage.getItem('careerpilot_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [savedClientIdMsg, setSavedClientIdMsg] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const { login, register, googleLogin } = useAuth();

  const effectiveClientId = customClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Initialize official Google Identity Services (GIS) if Client ID is configured
  useEffect(() => {
    if (!effectiveClientId) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: effectiveClientId,
            callback: async (response: { credential: string }) => {
              if (response?.credential) {
                setSubmitting(true);
                setError('');
                try {
                  await googleLogin({ credential: response.credential });
                  onSuccess();
                } catch (err: any) {
                  setError(err?.message || 'Google authentication failed');
                } finally {
                  setSubmitting(false);
                }
              }
            },
          });

          // Render official Google button
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              shape: 'rectangular',
              text: 'continue_with',
              width: 380,
            });
          }
          clearInterval(interval);
        } catch (e) {
          console.warn('[GIS] Error initializing Google button:', e);
        }
      }
      if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [effectiveClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignInClick = () => {
    if (effectiveClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (e) {
        // Fallback to modal
      }
    }
    setGoogleModalOpen(true);
  };

  const handleExecuteGoogleLogin = async (targetEmail: string, targetName: string) => {
    setSubmitting(true);
    setError('');
    try {
      await googleLogin({
        email: targetEmail,
        name: targetName,
        picture: 'https://lh3.googleusercontent.com/a/default-user',
      });
      setGoogleModalOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customClientId.trim();
    localStorage.setItem('careerpilot_google_client_id', trimmed);
    setCustomClientId(trimmed);
    setSavedClientIdMsg(true);
    setTimeout(() => setSavedClientIdMsg(false), 3000);
  };

  return (
    <div className="cp-page min-h-screen flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      <div className="cp-panel w-full max-w-md rounded-3xl p-8 card-subtle shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#62A7FF] mx-auto flex items-center justify-center text-white shadow-md shadow-[#62A7FF]/25">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-[#171717]">
            {isRegister ? 'Create your CareerPilot account' : 'Welcome back to CareerPilot'}
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            {isRegister
              ? 'Start building your personalized career roadmap today.'
              : 'Sign in to view your career plan, skill gaps, and interview prep.'}
          </p>
        </div>

        {/* GOOGLE AUTHENTICATION */}
        <div className="space-y-2">
          {/* Official Google Identity Services container if Client ID is configured */}
          {effectiveClientId && (
            <div className="flex justify-center w-full min-h-[44px]">
              <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
            </div>
          )}

          {/* Standard Sign In with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white border border-[#E7E7E4] hover:bg-[#F8F8F6] hover:border-gray-300 rounded-xl text-xs font-bold text-[#171717] transition-all shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick config link */}
          <div className="flex justify-between items-center px-1 text-[11px] text-[#6B6B6B]">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${effectiveClientId ? 'bg-green-500' : 'bg-blue-400'}`}
              />
              <span>{effectiveClientId ? 'Google OAuth Active' : 'Google Auth Ready'}</span>
            </span>
            <button
              type="button"
              onClick={() => setGoogleModalOpen(true)}
              className="text-[#62A7FF] hover:underline font-semibold flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              <span>Google Account Options</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#E7E7E4]" />
          <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider relative">
            Or with email
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#171717]">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Archi Jain"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#171717]">Work / University Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-4 py-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#171717]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-accent w-full py-3 rounded-xl text-white text-xs font-bold shadow-md shadow-[#62A7FF]/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-[#6B6B6B] hover:text-[#171717] font-semibold transition-colors"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account yet? Create one"}
          </button>
        </div>
      </div>

      {/* GOOGLE SIGN-IN MODAL */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E7E7E4] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-left relative">
            <button
              onClick={() => setGoogleModalOpen(false)}
              className="absolute top-5 right-5 text-[#6B6B6B] hover:text-[#171717] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 pr-6">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E7E7E4] shadow-xs flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#171717]">
                  Sign in with Google
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Choose an account to continue to CareerPilot
                </p>
              </div>
            </div>

            {/* Quick Profile Selection */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleExecuteGoogleLogin('dewarsh.jain@google.com', 'Dewarsh Jain')}
                disabled={submitting}
                className="w-full p-3 bg-white border border-[#E7E7E4] hover:border-[#62A7FF] hover:bg-[#F8F8F6] rounded-2xl text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    DJ
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#171717]">Dewarsh Jain</p>
                    <p className="text-[11px] text-[#6B6B6B]">dewarsh.jain@google.com</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#62A7FF] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleExecuteGoogleLogin('archi@careerpilot.io', 'Archi Jain')}
                disabled={submitting}
                className="w-full p-3 bg-white border border-[#E7E7E4] hover:border-[#62A7FF] hover:bg-[#F8F8F6] rounded-2xl text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    AJ
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#171717]">Archi Jain</p>
                    <p className="text-[11px] text-[#6B6B6B]">archi@careerpilot.io</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#62A7FF] transition-colors" />
              </button>
            </div>

            {/* Custom Google Account Input */}
            <div className="pt-2 border-t border-[#E7E7E4] space-y-2">
              <label className="text-[11px] font-bold text-[#6B6B6B] block">
                Use another Google Account:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => {
                    setGoogleEmailInput(e.target.value);
                    const prefix = e.target.value.split('@')[0];
                    if (prefix) setGoogleNameInput(prefix.charAt(0).toUpperCase() + prefix.slice(1));
                  }}
                  placeholder="your.email@gmail.com"
                  className="flex-1 p-2 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#62A7FF]"
                />
                <button
                  type="button"
                  onClick={() => handleExecuteGoogleLogin(googleEmailInput, googleNameInput)}
                  disabled={submitting || !googleEmailInput}
                  className="px-4 py-2 bg-[#171717] hover:bg-[#2b2b2b] text-white text-xs font-bold rounded-xl shrink-0 transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Optional GCP Client ID Configuration */}
            <div className="pt-2 border-t border-[#E7E7E4] space-y-2">
              <details className="text-[11px] text-[#6B6B6B] cursor-pointer">
                <summary className="font-semibold hover:text-[#171717] flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  <span>Google Cloud Console Client ID (Optional)</span>
                </summary>
                <form onSubmit={handleSaveClientId} className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="Enter GCP OAuth Client ID"
                    className="w-full p-2 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-xs font-mono text-[#171717] focus:outline-none"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#62A7FF] text-white text-[11px] font-bold rounded-lg"
                    >
                      Save ID
                    </button>
                    {savedClientIdMsg && (
                      <span className="text-green-600 font-semibold text-[10px]">Saved!</span>
                    )}
                  </div>
                </form>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
