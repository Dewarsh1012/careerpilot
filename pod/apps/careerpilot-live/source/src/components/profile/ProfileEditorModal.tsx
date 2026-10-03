import React, { useEffect, useState } from 'react';
import { X, Save, User as UserIcon } from 'lucide-react';
import type { User } from '../../types';

const STATUS_OPTIONS = [
  'Student / Fresher',
  'Early Career Engineer',
  'Experienced Developer',
  'Career Switcher',
];

const EXPERIENCE_OPTIONS = ['Fresher (0-1 yrs)', '1 - 3 years', '3+ years'];

const INTEREST_OPTIONS = [
  'Web Development',
  'Backend Systems',
  'Cloud Systems',
  'AI Applications',
  'Mobile Development',
  'DevOps',
];

export interface ProfileFormValues {
  name: string;
  email: string;
  currentStatus: string;
  experienceLevel: string;
  targetRole: string;
  interests: string[];
  verifiedSkills: string[];
}

interface ProfileEditorModalProps {
  open: boolean;
  initial: ProfileFormValues;
  onClose: () => void;
  onSave: (values: ProfileFormValues) => Promise<void>;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  open,
  initial,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<ProfileFormValues>(initial);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial);
      setError('');
      setSkillInput('');
    }
  }, [open, initial]);

  if (!open) {
    return null;
  }

  const toggleInterest = (item: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(item)
        ? prev.interests.filter((i) => i !== item)
        : [...prev.interests, item],
    }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill || form.verifiedSkills.includes(skill)) {
      return;
    }
    setForm((prev) => ({ ...prev, verifiedSkills: [...prev.verifiedSkills, skill] }));
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      verifiedSkills: prev.verifiedSkills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        targetRole: form.targetRole.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full p-2.5 bg-[var(--control-hover,#F8F8F6)] border border-[var(--border-subtle,#E7E7E4)] focus:border-[var(--accent-primary,#62A7FF)] rounded-xl text-xs text-[var(--text-primary,#171717)] focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-labelledby="profile-editor-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--surface,#fff)] border border-[var(--border-subtle,#E7E7E4)] rounded-2xl shadow-2xl card-subtle"
      >
        <div className="sticky top-0 bg-[var(--surface,#fff)] border-b border-[var(--border-subtle,#E7E7E4)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[var(--accent-primary,#62A7FF)]" />
            <h2 id="profile-editor-title" className="font-heading font-bold text-base text-[var(--text-primary,#171717)]">
              Edit career profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary,#6B6B6B)] hover:bg-[var(--control-hover,#F3F4F6)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-[var(--text-primary,#171717)]">Full name</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-[var(--text-primary,#171717)]">Email</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-[var(--text-primary,#171717)]">Target role</label>
              <input
                className={inputClass}
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                placeholder="e.g. Full Stack Developer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary,#171717)]">Current status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setForm({ ...form, currentStatus: status })}
                  className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all ${
                    form.currentStatus === status
                      ? 'border-[var(--accent-primary,#62A7FF)] bg-[var(--accent-primary,#62A7FF)]/10 text-[var(--accent-primary,#62A7FF)]'
                      : 'border-[var(--border-subtle,#E7E7E4)] text-[var(--text-primary,#171717)] hover:bg-[var(--control-hover,#F8F8F6)]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary,#171717)]">Experience level</label>
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_OPTIONS.map((exp) => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setForm({ ...form, experienceLevel: exp })}
                  className={`p-2.5 rounded-xl border text-center text-[10px] font-bold transition-all ${
                    form.experienceLevel === exp
                      ? 'border-[var(--accent-primary,#62A7FF)] bg-[var(--accent-primary,#62A7FF)]/10 text-[var(--accent-primary,#62A7FF)]'
                      : 'border-[var(--border-subtle,#E7E7E4)] text-[var(--text-primary,#171717)] hover:bg-[var(--control-hover,#F8F8F6)]'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary,#171717)]">Career interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleInterest(item)}
                  className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                    form.interests.includes(item)
                      ? 'border-[var(--accent-primary,#62A7FF)] bg-[var(--accent-primary,#62A7FF)]/10 text-[var(--accent-primary,#62A7FF)]'
                      : 'border-[var(--border-subtle,#E7E7E4)] text-[var(--text-secondary,#6B6B6B)]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary,#171717)]">Verified skills</label>
            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {form.verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--control-hover,#F8F8F6)] border border-[var(--border-subtle,#E7E7E4)] text-[11px] font-bold"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-[var(--text-secondary,#6B6B6B)] hover:text-red-600">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-2 rounded-xl border border-[var(--border-subtle,#E7E7E4)] text-xs font-bold hover:border-[var(--accent-primary,#62A7FF)]"
              >
                Add
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle,#E7E7E4)] text-xs font-bold text-[var(--text-primary,#171717)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-accent flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export function userToProfileForm(user: User | null): ProfileFormValues {
  return {
    name: user?.name || '',
    email: user?.email || '',
    currentStatus: user?.currentStatus || 'Student / Fresher',
    experienceLevel: user?.experienceLevel || 'Fresher (0-1 yrs)',
    targetRole: user?.targetRole || 'Full Stack Developer',
    interests: user?.interests?.length ? [...user.interests] : ['Web Development'],
    verifiedSkills: user?.verifiedSkills?.length
      ? [...user.verifiedSkills]
      : ['React', 'TypeScript', 'Node.js'],
  };
}
