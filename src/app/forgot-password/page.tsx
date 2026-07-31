'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, Key, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { recoverPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryType, setRecoveryType] = useState<'question' | 'code'>('question');
  const [answer, setAnswer] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword) return;

    setLoading(true);
    setError('');

    const res = await recoverPassword(email, newPassword, {
      type: recoveryType,
      answer: recoveryType === 'question' ? answer : undefined,
      recoveryCode: recoveryType === 'code' ? recoveryCode : undefined
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center p-4 text-[#f4f4f5] select-none py-12">
      <div className="w-full max-w-md bg-[#121218] border border-[#232334] rounded-2xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo-icon.png"
            alt="Notter Logo"
            className="w-16 h-16 object-contain mx-auto drop-shadow-xl"
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Password Recovery</h1>
          <p className="text-xs text-[#8e8ea0]">
            Reset your password using your configured Security Question or Recovery Hash.
          </p>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="p-6 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-white text-sm">Password Reset Successfully</h3>
            <p className="text-xs text-[#a1a1aa]">Your password has been updated. You can now sign in.</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9]"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[10px]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8e8ea0]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="author@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181820] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[10px]">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8e8ea0]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181820] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              {/* Recovery Method Selection */}
              <div className="space-y-3 pt-2 border-t border-[#232334]">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryType('question')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      recoveryType === 'question'
                        ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#a78bfa]'
                        : 'bg-[#181820] border-[#232334] text-[#8e8ea0] hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Option A: Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryType('code')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      recoveryType === 'code'
                        ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#a78bfa]'
                        : 'bg-[#181820] border-[#232334] text-[#8e8ea0] hover:text-white'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" /> Option B: Hash Code
                  </button>
                </div>

                {recoveryType === 'question' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8e8ea0] uppercase">Answer to Security Question</label>
                    <input
                      type="text"
                      required
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter security answer..."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#181820] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8e8ea0] uppercase">Random Recovery Code (XXXX-XXXX-XXXX-XXXX)</label>
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="e.g. 7D92-KP81-4MNQ-XA11"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#181820] border border-[#232334] text-amber-300 font-mono text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email || !newPassword}
                className="w-full py-3 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-purple transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <div className="text-center text-xs text-[#8e8ea0] pt-2 border-t border-[#232334]">
          Remember your password?{' '}
          <Link href="/login" className="text-[#a78bfa] font-bold hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
