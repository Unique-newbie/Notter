'use client';

import React, { useState } from 'react';
import { Info, Code2, Database, HardDrive, Terminal, ShieldCheck, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AboutPage() {
  const { user } = useAuth();
  const [devMode, setDevMode] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* App Header Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-[#121218] via-[#1a102f] to-[#121218] border border-[#7c3aed]/40 shadow-purple flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Notter Release v2.2.0
          </div>
          <h1 className="text-3xl font-extrabold text-white">Notter – Fiction Knowledge Engine</h1>
          <p className="text-xs text-[#a1a1aa] max-w-xl leading-relaxed">
            The distraction-free novel writing platform and Story Bible extraction system. Built for fantasy, sci-fi, and fiction authors.
          </p>
        </div>

        <img src="/logo-icon.png" alt="Notter 3D Logo" className="w-24 h-24 object-contain drop-shadow-2xl hidden sm:block" />
      </div>

      {/* Tech Stack & Open Source Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#7c3aed]" /> Core Technology Stack
          </h2>
          <ul className="space-y-2 text-[#8e8ea0]">
            <li className="flex items-center justify-between">
              <span>Framework</span>
              <strong className="text-white font-mono">Next.js 16 (Turbopack)</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Backend &amp; Auth</span>
              <strong className="text-white font-mono">Supabase PostgreSQL</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Image Compression</span>
              <strong className="text-white font-mono">HTML5 Canvas WebP &amp; AVIF</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Theme Engine</span>
              <strong className="text-white font-mono">9 CSS Dynamic Variable Tokens</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>License</span>
              <strong className="text-emerald-400 font-mono">MIT Open Source</strong>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Core Philosophy
          </h2>
          <blockquote className="italic text-[#a1a1aa] bg-[#181820] p-3 rounded-xl border border-[#232334] leading-relaxed">
            &ldquo;AI extracts. Notter organizes. The author writes.&rdquo;
          </blockquote>
          <p className="text-[#8e8ea0] leading-relaxed">
            Notter never generates or continues prose on your behalf. Sprint Mode and full-screen writing pads are sacred environments designed for raw human creativity.
          </p>
        </div>
      </div>

      {/* Developer Diagnostics Toggle */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" /> Developer Diagnostics Mode
            </h2>
            <p className="text-[11px] text-[#8e8ea0] mt-0.5">Inspect system connection states, User ID, and database status.</p>
          </div>

          <button
            onClick={() => setDevMode(!devMode)}
            className={`px-4 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              devMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-[#181820] text-[#8e8ea0] border-[#232334] hover:text-white'
            }`}
          >
            {devMode ? 'Developer Mode Active' : 'Enable Developer Mode'}
          </button>
        </div>

        {devMode && (
          <div className="p-4 rounded-xl bg-[#0c0c10] border border-amber-500/30 space-y-3 font-mono text-[11px] text-[#a1a1aa] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#232334] pb-2">
              <span>User ID:</span>
              <span className="text-amber-300 font-bold">{user?.id || 'offline-guest-mode'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#232334] pb-2">
              <span>Email:</span>
              <span className="text-white font-bold">{user?.email || 'author@notter.app'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#232334] pb-2">
              <span>Database Connection:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Connected
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#232334] pb-2">
              <span>Storage Buckets:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> covers / avatars Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>LocalStorage Cache:</span>
              <span className="text-white font-bold">sprintStore &amp; themePrefs Healthy</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
