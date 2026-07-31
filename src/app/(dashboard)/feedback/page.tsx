'use client';

import React, { useState } from 'react';
import { HelpCircle, Sparkles, Bug, MessageSquare, Heart, Github, Mail, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<'feature' | 'bug' | 'complaint' | 'general'>('feature');
  const [toast, setToast] = useState('');

  // Feature Form
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [featureCategory, setFeatureCategory] = useState('Editor & Writing');

  // Bug Form
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');

  // General Form
  const [generalFeedback, setGeneralFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Thank you! Your feedback has been recorded successfully.');
    setTimeout(() => setToast(''), 4000);

    setFeatureTitle('');
    setFeatureDesc('');
    setBugTitle('');
    setBugDesc('');
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
    setGeneralFeedback('');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-xs font-bold shadow-2xl animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-[#7c3aed]" /> User Feedback &amp; Community Support
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Have an idea for Notter, found a bug, or want to share feedback? We value your input.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#232334] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('feature')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'feature' ? 'bg-[#7c3aed] text-white shadow-purple' : 'text-[#8e8ea0] hover:text-white hover:bg-[#181820]'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Feature Requests
        </button>

        <button
          onClick={() => setActiveTab('bug')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'bug' ? 'bg-[#7c3aed] text-white shadow-purple' : 'text-[#8e8ea0] hover:text-white hover:bg-[#181820]'
          }`}
        >
          <Bug className="w-4 h-4" /> Bug Reports
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'general' ? 'bg-[#7c3aed] text-white shadow-purple' : 'text-[#8e8ea0] hover:text-white hover:bg-[#181820]'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> General Feedback
        </button>
      </div>

      {/* Feature Request Form */}
      {activeTab === 'feature' && (
        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-5 text-xs">
          <h2 className="font-bold text-white text-sm">Submit a Feature Request</h2>
          
          <div className="space-y-1.5">
            <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Feature Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Export Story Bible to PDF/EPUB"
              value={featureTitle}
              onChange={(e) => setFeatureTitle(e.target.value)}
              className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Category</label>
            <select
              value={featureCategory}
              onChange={(e) => setFeatureCategory(e.target.value)}
              className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
            >
              <option value="Editor & Writing">Editor &amp; Writing</option>
              <option value="Story Bible Extractions">Story Bible Extractions</option>
              <option value="Sprint Mode & Stats">Sprint Mode &amp; Stats</option>
              <option value="Themes & Customization">Themes &amp; Customization</option>
              <option value="BYOK AI Integration">BYOK AI Integration</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Description &amp; Use Case</label>
            <textarea
              rows={4}
              required
              placeholder="Describe how this feature will help your novel writing workflow..."
              value={featureDesc}
              onChange={(e) => setFeatureDesc(e.target.value)}
              className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white"
            />
          </div>

          <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] shadow-purple">
            Submit Feature Idea
          </button>
        </form>
      )}

      {/* Bug Report Form */}
      {activeTab === 'bug' && (
        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-5 text-xs">
          <h2 className="font-bold text-white text-sm">Report a Bug</h2>
          
          <div className="space-y-1.5">
            <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Bug Summary</label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter timeline events do not sort chronologically"
              value={bugTitle}
              onChange={(e) => setBugTitle(e.target.value)}
              className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Steps to Reproduce</label>
              <textarea
                rows={3}
                placeholder="1. Go to timeline page&#10;2. Add event..."
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Expected vs Actual Behavior</label>
              <textarea
                rows={3}
                placeholder="Expected: Sorted by chapter number&#10;Actual: Rendered randomly..."
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-xl">
            Submit Bug Report
          </button>
        </form>
      )}

      {/* General Feedback */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-5 text-xs">
          <h2 className="font-bold text-white text-sm">General Feedback &amp; Suggestions</h2>
          
          <div className="space-y-1.5">
            <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Feedback Content</label>
            <textarea
              rows={5}
              required
              placeholder="Tell us what you love or what we can improve in Notter..."
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white"
            />
          </div>

          <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9]">
            Send Feedback
          </button>
        </form>
      )}

      {/* Community Links Section */}
      <div className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-4">
        <h3 className="font-bold text-white text-sm">Developer &amp; Community Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <a
            href="https://github.com/Unique-newbie/Notter"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-[#181820] border border-[#232334] hover:border-[#7c3aed]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Github className="w-5 h-5 text-[#a78bfa]" />
              <span className="font-bold text-white">GitHub Repo</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8e8ea0]" />
          </a>

          <a
            href="mailto:support@notter.app"
            className="p-4 rounded-xl bg-[#181820] border border-[#232334] hover:border-[#7c3aed]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white">Email Support</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8e8ea0]" />
          </a>

          <a
            href="https://ko-fi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-[#181820] border border-[#232334] hover:border-[#7c3aed]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-rose-400" />
              <span className="font-bold text-white">Support on Ko-fi</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8e8ea0]" />
          </a>
        </div>
      </div>

    </div>
  );
}
