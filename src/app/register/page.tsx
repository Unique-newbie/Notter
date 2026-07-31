'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, Key, HelpCircle, Copy, Check } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Recovery Setup
  const [recoveryType, setRecoveryType] = useState<'question' | 'code'>('question');
  const [selectedQuestion, setSelectedQuestion] = useState('What was the name of your first pet?');
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGenerateCode = () => {
    const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${rand()}-${rand()}-${rand()}-${rand()}`;
    setGeneratedCode(code);
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const finalQuestion = selectedQuestion === 'CUSTOM' ? customQuestionInput.trim() : selectedQuestion;

    if (recoveryType === 'question' && (!finalQuestion || !answer.trim())) {
      setError('Please provide a security recovery question and answer.');
      return;
    }

    setLoading(true);
    setError('');

    let codeToSave = generatedCode;
    if (recoveryType === 'code' && !codeToSave) {
      codeToSave = handleGenerateCode();
    }

    const res = await register(email, password, {
      type: recoveryType,
      question: recoveryType === 'question' ? finalQuestion : undefined,
      answer: recoveryType === 'question' ? answer : undefined,
      recoveryCode: recoveryType === 'code' ? codeToSave : undefined
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center p-4 text-[#f4f4f5] select-none py-12">
      <div className="w-full max-w-md bg-[#121218] border border-[#232334] rounded-2xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#7c3aed] mx-auto flex items-center justify-center text-white shadow-purple">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Notter Account</h1>
          <p className="text-xs text-[#8e8ea0]">
            Sign up to securely back up and organize your novel universe.
          </p>
        </div>

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
            <label className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[10px]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8e8ea0]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181820] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
              />
            </div>
          </div>

          {/* Password Recovery Configuration Section */}
          <div className="pt-2 border-t border-[#232334] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white text-xs flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#a78bfa]" /> Password Recovery Method
              </label>
            </div>
            <p className="text-[11px] text-[#8e8ea0]">
              Configure how you want to recover your password if you ever forget it.
            </p>

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
                onClick={() => {
                  setRecoveryType('code');
                  if (!generatedCode) handleGenerateCode();
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  recoveryType === 'code'
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#a78bfa]'
                    : 'bg-[#181820] border-[#232334] text-[#8e8ea0] hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Option B: Hash Code
              </button>
            </div>

            {/* Option A: Security Question */}
            {recoveryType === 'question' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[#181820] border border-[#232334]">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8e8ea0] uppercase">Select or Write Question</label>
                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#121218] border border-[#232334] text-xs text-white"
                  >
                    <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                    <option value="What is your childhood nickname?">What is your childhood nickname?</option>
                    <option value="What was the name of your favorite teacher?">What was the name of your favorite teacher?</option>
                    <option value="In what city were you born?">In what city were you born?</option>
                    <option value="CUSTOM">Write your own custom question...</option>
                  </select>
                </div>

                {selectedQuestion === 'CUSTOM' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8e8ea0] uppercase">Your Custom Security Question</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. What is the title of your favorite book?"
                      value={customQuestionInput}
                      onChange={(e) => setCustomQuestionInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#121218] border border-[#232334] text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8e8ea0] uppercase">Your Secret Answer</label>
                  <input
                    type="text"
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter answer..."
                    className="w-full px-3 py-2 rounded-lg bg-[#121218] border border-[#232334] text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>
            )}

            {/* Option B: Recovery Hash Code */}
            {recoveryType === 'code' && (
              <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] space-y-2.5">
                <div className="text-[11px] text-[#8e8ea0]">
                  Save this random recovery hash code. If you forget your password, this code is required:
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c0c10] border border-[#232334]">
                  <span className="font-mono font-bold text-amber-300 text-sm">{generatedCode || 'GENERATING...'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 3000);
                    }}
                    className="px-2.5 py-1 rounded bg-[#1e1e2a] text-[#a78bfa] hover:text-white text-[11px] font-semibold flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-purple transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? 'Creating Account...' : 'Register Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#8e8ea0] pt-2 border-t border-[#232334]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#a78bfa] font-bold hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
