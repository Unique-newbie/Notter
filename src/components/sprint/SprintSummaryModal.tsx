'use client';

import React from 'react';
import { Trophy, Flame, Zap, Clock, CheckCircle2, Award, ArrowUpRight, TrendingUp, Sparkles, X } from 'lucide-react';
import { SprintSession } from '@/types';
import { sprintStore } from '@/lib/store/sprintStore';

interface SprintSummaryModalProps {
  isOpen: boolean;
  session: SprintSession | null;
  onClose: () => void;
  onRunAIAnalysis?: () => void;
}

export function SprintSummaryModal({
  isOpen,
  session,
  onClose,
  onRunAIAnalysis
}: SprintSummaryModalProps) {
  if (!isOpen || !session) return null;

  const stats = sprintStore.getStreakStats();
  const allSessions = sprintStore.getSessions();
  const prevSession = allSessions.length > 1 ? allSessions[1] : null;

  // Comparisons
  let wpmComparison = 0;
  if (prevSession && prevSession.averageWpm > 0) {
    wpmComparison = Math.round(((session.averageWpm - prevSession.averageWpm) / prevSession.averageWpm) * 100);
  }

  const isPersonalBestWpm = session.averageWpm > (prevSession?.averageWpm || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-xl bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="p-8 text-center bg-gradient-to-b from-amber-500/20 via-[#121218] to-[#121218] border-b border-[#232334] relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-[#8e8ea0] hover:text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 mx-auto flex items-center justify-center text-white shadow-2xl mb-3">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">🏆 Sprint Complete!</h2>
          <p className="text-xs text-amber-300 font-semibold mt-1">
            {session.goalCompleted ? 'Goal Completed Successfully! ✅' : 'Sprint Finished! Work Saved Offline.'}
          </p>

          {/* Comparison Pill */}
          {wpmComparison !== 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold mt-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{wpmComparison > 0 ? `+${wpmComparison}% Faster than previous sprint` : `${wpmComparison}% WPM delta`}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] text-center">
              <div className="text-[10px] font-bold text-[#8e8ea0] uppercase">Words Written</div>
              <div className="text-2xl font-extrabold text-white mt-0.5">{session.wordsAdded}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] text-center">
              <div className="text-[10px] font-bold text-[#8e8ea0] uppercase">Average WPM</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-0.5">{session.averageWpm}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] text-center">
              <div className="text-[10px] font-bold text-[#8e8ea0] uppercase">Peak WPM</div>
              <div className="text-2xl font-extrabold text-orange-400 mt-0.5">{session.peakWpm}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] space-y-1">
              <div className="flex items-center justify-between text-[#8e8ea0]">
                <span>Duration</span>
                <strong className="text-white font-mono">{Math.round(session.durationSeconds / 60)} mins</strong>
              </div>
              <div className="flex items-center justify-between text-[#8e8ea0]">
                <span>Writing Streak</span>
                <strong className="text-amber-400 font-mono">{stats.currentStreakDays} Days 🔥</strong>
              </div>
              <div className="flex items-center justify-between text-[#8e8ea0]">
                <span>Longest Burst</span>
                <strong className="text-white font-mono">{session.longestBurstMinutes} mins</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] space-y-1">
              <div className="flex items-center justify-between text-[#8e8ea0]">
                <span>Total Characters</span>
                <strong className="text-white font-mono">{session.charactersTyped.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between text-[#8e8ea0]">
                <span>Pauses (&gt;4s)</span>
                <strong className="text-white font-mono">{session.pauseCount}</strong>
              </div>
              <div className="flex items-center justify-between text-[#8e8ea0]">
                <span>Saved Offline</span>
                <strong className="text-emerald-400 font-mono">100% Secured</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#232334] bg-[#0c0c10] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] font-bold text-xs hover:text-white"
          >
            Back to Chapter Editor
          </button>

          {onRunAIAnalysis && (
            <button
              onClick={() => {
                onClose();
                onRunAIAnalysis();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] shadow-purple"
            >
              <Sparkles className="w-4 h-4" /> Analyze Chapter with AI
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
