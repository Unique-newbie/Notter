'use client';

import React, { useState } from 'react';
import { Target, Trophy, Flame, Calendar, Award, CheckCircle2, Star } from 'lucide-react';
import { communityStore } from '@/lib/store/communityStore';
import { ChallengeEvent } from '@/types';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeEvent[]>(() => communityStore.getChallenges());

  const handleToggleChallenge = (cId: string) => {
    const updated = communityStore.toggleJoinChallenge(cId);
    setChallenges(updated);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="border-b border-[#232334] pb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Target className="w-6 h-6 text-amber-400" /> Writing Challenges &amp; Seasonal Events
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Participate in official writing challenges, reach word targets, and earn exclusive achievement badges.
        </p>
      </div>

      {/* Challenges List */}
      <div className="space-y-6">
        {challenges.map((c) => {
          const progressPercent = Math.min(100, Math.round((c.currentProgressWords / c.targetWords) * 100));

          return (
            <div
              key={c.id}
              className={`p-6 rounded-2xl border space-y-4 transition-all shadow-xl ${
                c.isJoined ? 'bg-[#181820] border-amber-500/50' : 'bg-[#121218] border-[#232334]'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-4xl p-3.5 rounded-2xl bg-[#0c0c10] border border-[#232334] shrink-0">
                    {c.badgeIcon}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-white text-lg">{c.title}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {c.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">{c.description}</p>
                    <div className="text-xs text-[#8e8ea0] font-mono pt-1">
                      Target: <strong className="text-amber-400">{c.targetWords.toLocaleString()} words</strong> | Duration: {c.durationDays} Days | {c.joinedCount.toLocaleString()} authors participating
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleChallenge(c.id)}
                  className={`px-6 py-2.5 rounded-xl font-extrabold text-xs transition-all shrink-0 ${
                    c.isJoined
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500 text-black hover:bg-amber-600 shadow-xl'
                  }`}
                >
                  {c.isJoined ? 'Challenge Active ✅' : 'Join Challenge'}
                </button>
              </div>

              {/* Progress Bar if Joined */}
              {c.isJoined && (
                <div className="pt-3 border-t border-[#232334] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8e8ea0]">Your Live Challenge Progress</span>
                    <span className="text-amber-400 font-bold">{c.currentProgressWords.toLocaleString()} / {c.targetWords.toLocaleString()} words ({progressPercent}%)</span>
                  </div>
                  <div className="w-full bg-[#0c0c10] h-2.5 rounded-full overflow-hidden border border-[#232334]">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-600 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Reaching 100% unlocks the exclusive &ldquo;{c.badgeName}&rdquo; profile badge!
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
