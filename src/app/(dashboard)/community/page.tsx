'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Trophy, Shield, Flame, Target, Sparkles, ChevronRight, Award, Star, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { communityStore } from '@/lib/store/communityStore';
import { Guild, ChallengeEvent } from '@/types';

export default function CommunityPage() {
  const [guilds, setGuilds] = useState<Guild[]>(() => communityStore.getGuilds());
  const [challenges, setChallenges] = useState<ChallengeEvent[]>(() => communityStore.getChallenges());

  const handleToggleGuild = (gId: string) => {
    const updated = communityStore.toggleJoinGuild(gId);
    setGuilds(updated);
  };

  const handleToggleChallenge = (cId: string) => {
    const updated = communityStore.toggleJoinChallenge(cId);
    setChallenges(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Community Hero Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-[#121218] via-[#1f140e] to-[#121218] border border-amber-500/40 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5" /> Notter Author Community
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Write Together. Stay Consistent.
          </h1>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            Join writing guilds, participate in official writing challenges, track community leaderboards, and connect with authors worldwide.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/community/leaderboards"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:from-amber-600 hover:to-orange-700 shadow-xl flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" /> Global Leaderboards
            </Link>
            <Link
              href="/community/guilds"
              className="px-5 py-2.5 rounded-xl bg-[#181820] border border-[#232334] text-white font-bold text-xs hover:bg-[#20202c] flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-cyan-400" /> Explore Guilds
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181820] border border-[#232334] text-center w-full md:w-64 space-y-2 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="font-bold text-white text-xs">Anti-Cheat WPM Protection</div>
          <p className="text-[10px] text-[#8e8ea0] leading-normal">
            Pastes and instant burst scripts are excluded from rankings to protect fair competition.
          </p>
        </div>
      </div>

      {/* Featured Writing Challenges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" /> Official Writing Challenges
          </h2>
          <Link href="/community/challenges" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
            View All Challenges <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {challenges.map((c) => (
            <div
              key={c.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                c.isJoined ? 'bg-[#181820] border-amber-500/50 shadow-xl' : 'bg-[#121218] border-[#232334]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl p-2 rounded-xl bg-[#0c0c10] border border-[#232334]">{c.badgeIcon}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {c.durationDays} Days
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-base">{c.title}</h3>
                  <p className="text-xs text-[#8e8ea0] mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                </div>

                <div className="text-xs text-[#a1a1aa] font-mono">
                  Target: <strong className="text-amber-400">{c.targetWords.toLocaleString()} words</strong> | {c.joinedCount.toLocaleString()} authors joined
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#232334]">
                <button
                  onClick={() => handleToggleChallenge(c.id)}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                    c.isJoined
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500 text-black hover:bg-amber-600 shadow-xl'
                  }`}
                >
                  {c.isJoined ? 'Challenge Joined ✅' : 'Join Challenge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guilds Directory Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" /> Active Writing Guilds
          </h2>
          <Link href="/community/guilds" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
            Browse All Guilds <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {guilds.map((g) => (
            <div key={g.id} className="p-6 rounded-2xl bg-[#121218] border border-[#232334] flex items-start gap-4 hover:border-[#7c3aed]/50 transition-all">
              <span className="text-3xl p-3 rounded-2xl bg-[#181820] border border-[#232334] shrink-0">{g.icon}</span>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">{g.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      [{g.tag}]
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleGuild(g.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      g.isJoined ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#181820] border border-[#232334] text-white hover:border-[#7c3aed]'
                    }`}
                  >
                    {g.isJoined ? 'Member' : 'Join Guild'}
                  </button>
                </div>

                <p className="text-xs text-[#8e8ea0] line-clamp-2 leading-relaxed">{g.description}</p>

                <div className="flex items-center gap-4 text-xs font-mono text-[#a1a1aa] pt-1">
                  <span>Members: <strong className="text-white">{g.memberCount.toLocaleString()}</strong></span>
                  <span>Total Words: <strong className="text-amber-400">{(g.totalWordsWritten / 1000000).toFixed(1)}M</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
