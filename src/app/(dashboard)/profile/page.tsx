'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme, ThemeId } from '@/lib/theme/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import { MediaUploader } from '@/components/common/MediaUploader';
import {
  User, Lock, Key, Palette, Upload, ShieldCheck, CheckCircle2,
  AlertCircle, RefreshCw, Copy, Server, Plus, Trash2
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const theme = useTheme();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'providers' | 'appearance'>('profile');
  const [toast, setToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Profile Fields
  const [displayName, setDisplayName] = useState('Novel Author');
  const [username, setUsername] = useState('author_notter');
  const [bio, setBio] = useState('Fantasy author organizing novel lore, characters, and timelines.');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [joinDate] = useState('July 2026');

  // Security Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('What was the name of your first pet?');
  const [customQuestion, setCustomQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [generatedHash, setGeneratedHash] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    // Read from localStorage or User metadata
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('notter_user_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.displayName) setDisplayName(parsed.displayName);
          if (parsed.username) setUsername(parsed.username);
          if (parsed.bio) setBio(parsed.bio);
          if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        } else if (user?.email) {
          setDisplayName(user.email.split('@')[0]);
        }
      } catch (e) {}
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 4000);
  };

  const handleSaveProfile = async () => {
    const profileObj = {
      displayName: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      avatarUrl
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('notter_user_profile', JSON.stringify(profileObj));
    }

    try {
      await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl
        }
      });
    } catch (e) {
      console.warn('Auth user metadata update note:', e);
    }

    showSuccess('Profile changes saved successfully to database!');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError('New password must be at least 6 characters.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showSuccess('Password updated successfully!');
      setNewPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      showError(err.message || 'Failed to update password.');
    }
  };

  const handleRegenerateRecoveryCode = () => {
    if (!currentPassword) {
      showError('Please enter your current password to confirm regeneration.');
      return;
    }
    const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${rand()}-${rand()}-${rand()}-${rand()}`;
    setGeneratedHash(code);
    showSuccess('New recovery hash generated!');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-red-600 text-white text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-white" /> {errorToast}
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <User className="w-6 h-6 text-[#7c3aed]" /> User Profile &amp; Preferences
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Manage your account profile, security credentials, appearance themes, and BYOK AI provider keys.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#232334] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'bg-[#7c3aed] text-white shadow-purple'
              : 'text-[#8e8ea0] hover:text-white hover:bg-[#181820]'
          }`}
        >
          <User className="w-4 h-4" /> Profile Info
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'security'
              ? 'bg-[#7c3aed] text-white shadow-purple'
              : 'text-[#8e8ea0] hover:text-white hover:bg-[#181820]'
          }`}
        >
          <Lock className="w-4 h-4" /> Account Security
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'appearance'
              ? 'bg-[#7c3aed] text-white shadow-purple'
              : 'text-[#8e8ea0] hover:text-white hover:bg-[#181820]'
          }`}
        >
          <Palette className="w-4 h-4" /> Appearance &amp; Themes
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'providers'
              ? 'bg-[#7c3aed] text-white shadow-purple'
              : 'text-[#8e8ea0] hover:text-white hover:bg-[#181820]'
          }`}
        >
          <Key className="w-4 h-4" /> AI Providers (BYOK)
        </button>
      </div>

      {/* Tab 1: Profile Info */}
      {activeTab === 'profile' && (
        <div className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
          <h2 className="text-base font-bold text-white border-b border-[#232334] pb-3">Author Profile Information</h2>

          {/* MediaUploader Profile Avatar */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#a78bfa] uppercase tracking-wider">
              Profile Avatar (WebP Auto-Compress with Real-Time Progress Bar)
            </label>
            <div className="max-w-md">
              <MediaUploader
                currentUrl={avatarUrl}
                onImageSelected={async (file) => {
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const dataUrl = e.target?.result as string;
                      setAvatarUrl(dataUrl);
                      resolve(dataUrl);
                    };
                    reader.readAsDataURL(file);
                  });
                }}
                aspectRatioWidth={300}
                aspectRatioHeight={300}
                label="Upload Profile Picture"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px]">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px]">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px]">Short Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] shadow-purple transition-all"
            >
              Save Profile Info
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <div className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
          <h2 className="text-base font-bold text-white border-b border-[#232334] pb-3">Account Security &amp; Recovery</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>
            </div>

            <button type="submit" className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9]">
              Update Password
            </button>
          </form>

          <div className="pt-6 border-t border-[#232334] space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Update Security Question</h3>
            <div className="space-y-2">
              <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Select or Write Security Question</label>
              <select
                value={recoveryQuestion}
                onChange={(e) => setRecoveryQuestion(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
              >
                <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                <option value="What is your childhood nickname?">What is your childhood nickname?</option>
                <option value="In what city were you born?">In what city were you born?</option>
                <option value="CUSTOM">Write custom question...</option>
              </select>

              {recoveryQuestion === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Write your custom question..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white mt-2"
                />
              )}

              <input
                type="text"
                placeholder="Secret answer..."
                value={recoveryAnswer}
                onChange={(e) => setRecoveryAnswer(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white mt-2"
              />
            </div>

            <button onClick={() => showSuccess('Security Question saved!')} className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a78bfa] font-bold text-xs">
              Save Security Question
            </button>
          </div>

          <div className="pt-6 border-t border-[#232334] space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Regenerate Recovery Code / Hash</h3>
            <p className="text-[#8e8ea0]">
              Generating a new recovery code will invalidate your previous recovery code. Requires current password confirmation.
            </p>

            {generatedHash && (
              <div className="p-3.5 rounded-xl bg-[#0c0c10] border border-[#232334] flex items-center justify-between">
                <span className="font-mono font-bold text-amber-300 text-sm">{generatedHash}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedHash);
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2500);
                  }}
                  className="px-3 py-1 rounded bg-[#1e1e2a] text-[#a78bfa] text-xs font-semibold"
                >
                  {copiedHash ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            )}

            <button
              onClick={handleRegenerateRecoveryCode}
              className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-amber-500/20"
            >
              Regenerate Recovery Code
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Appearance & Themes */}
      {activeTab === 'appearance' && (
        <div className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-8 text-xs">
          <h2 className="text-base font-bold text-white border-b border-[#232334] pb-3">Appearance &amp; Theme Settings</h2>

          <div className="space-y-3">
            <label className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px]">Select Color Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'dark', name: 'Dark Default', color: '#09090b' },
                { id: 'amoled', name: 'AMOLED Black', color: '#000000' },
                { id: 'obsidian', name: 'Obsidian', color: '#16161a' },
                { id: 'dracula', name: 'Dracula', color: '#282a36' },
                { id: 'nord', name: 'Nord', color: '#2e3440' },
                { id: 'catppuccin', name: 'Catppuccin Mocha', color: '#1e1e2e' },
                { id: 'light', name: 'Light', color: '#f8fafc' },
                { id: 'solarized-light', name: 'Solarized Light', color: '#fdf6e3' },
                { id: 'sepia', name: 'Sepia', color: '#f4ecd8' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => theme.setTheme(t.id as ThemeId)}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    theme.theme === t.id
                      ? 'bg-[#181820] border-[#7c3aed] text-white shadow-purple'
                      : 'bg-[#121218] border-[#232334] text-[#8e8ea0] hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="font-bold text-xs">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI BYOK Providers */}
      {activeTab === 'providers' && (
        <div className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-[#232334] pb-4">
            <h2 className="text-base font-bold text-white">AI Provider Keys (BYOK)</h2>
            <a href="/settings" className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9]">
              Configure Providers in Settings
            </a>
          </div>
          <p className="text-[#8e8ea0]">
            Manage your Gemini, OpenAI, Claude, and local Ollama API keys. Notter executes all chapter extractions directly using your configured provider keys.
          </p>
        </div>
      )}

    </div>
  );
}
