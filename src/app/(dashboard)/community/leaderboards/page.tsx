'use client';

import React, { useState } from 'react';
import { Trophy, Flame, Zap, ShieldCheck, Users, Filter, Star, Clock } from 'lucide-react';
import { communityStore } from '@/lib/store/communityStore';
import { LeaderboardEntry } from '@/types';

export default function LeaderboardsPage() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');
  const [category, setCategory] = useState<'words' | 'streak' | 'wpm'>('words');
  const [friendMode, setFriendMode] = useState(false);

  const entries: LeaderboardEntry[] = communityStore.getLeaderboard(timeframe, category);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#232334] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" /> Global &amp; Friend Leaderboards
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Compare word count, continuous writing streaks, and WPM with authors worldwide. Fair Play anti-cheat enabled.
          </p>
        </div>

        {/* Friend Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#121218] border border-[#232334] rounded-xl p-1 text-xs font-bold">
          <button
            onClick={() => setFriendMode(false)}
            className={`px-4 py-2 rounded-lg transition-all ${
              !friendMode ? 'bg-[#7c3aed] text-white shadow-purple' : 'text-[#8e8ea0] hover:text-white'
            }`}
          >
            Global Rankings
          </button>
          <button
            onClick={() => setFriendMode(true)}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              friendMode ? 'bg-[#7c3aed] text-white shadow-purple' : 'text-[#8e8ea0] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Following Only
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121218] border border-[#232334] text-xs">
        
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1.5 font-bold">
          {['daily', 'weekly', 'monthly', 'alltime'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-3.5 py-1.5 rounded-xl capitalize transition-all ${
                timeframe === tf
                  ? 'bg-amber-500 text-black font-extrabold shadow-lg'
                  : 'bg-[#181820] text-[#8e8ea0] hover:text-white border border-[#232334]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Category Buttons */}
        <div className="flex items-center gap-1.5 font-bold">
          <button
            onClick={() => setCategory('words')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              category === 'words' ? 'bg-[#7c3aed] text-white' : 'bg-[#181820] text-[#8e8ea0] border border-[#232334]'
            }`}
          >
            Most Words
          </button>
          <button
            onClick={() => setCategory('streak')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              category === 'streak' ? 'bg-[#7c3aed] text-white' : 'bg-[#181820] text-[#8e8ea0] border border-[#232334]'
            }`}
          >
            Longest Streak
          </button>
          <button
            onClick={() => setCategory('wpm')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              category === 'wpm' ? 'bg-[#7c3aed] text-white' : 'bg-[#181820] text-[#8e8ea0] border border-[#232334]'
            }`}
          >
            Highest WPM
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-[#121218] border border-[#232334] overflow-hidden shadow-2xl">
        <div className="px-6 py-3 border-b border-[#232334] bg-[#0c0c10] grid grid-cols-12 text-[10px] font-extrabold uppercase tracking-wider text-[#8e8ea0]">
          <div className="col-span-2">Rank</div>
          <div className="col-span-6">Author</div>
          <div className="col-span-4 text-right">{category.toUpperCase()} STATS</div>
        </div>

        <div className="divide-y divide-[#232334]">
          {entries.map((item) => (
            <div
              key={item.rank}
              className={`px-6 py-4 grid grid-cols-12 items-center text-xs transition-all ${
                item.isCurrentUser ? 'bg-[#7c3aed]/15 border-l-4 border-[#7c3aed]' : 'hover:bg-[#181820]'
              }`}
            >
              {/* Rank */}
              <div className="col-span-2 flex items-center gap-2">
                {item.rank === 1 ? (
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-black font-extrabold flex items-center justify-center shadow-lg">1</span>
                ) : item.rank === 2 ? (
                  <span className="w-7 h-7 rounded-xl bg-slate-300 text-black font-extrabold flex items-center justify-center shadow-lg">2</span>
                ) : item.rank === 3 ? (
                  <span className="w-7 h-7 rounded-xl bg-amber-700 text-white font-extrabold flex items-center justify-center shadow-lg">3</span>
                ) : (
                  <span className="font-mono text-[#8e8ea0] font-bold pl-2">#{item.rank}</span>
                )}
              </div>

              {/* Author Info */}
              <div className="col-span-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1e1e2a] border border-[#232334] flex items-center justify-center font-extrabold text-[#a78bfa]">
                  {item.displayName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-extrabold text-white flex items-center gap-2">
                    {item.displayName}
                    {item.isCurrentUser && (
                      <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#7c3aed] text-white">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8e8ea0] font-mono">@{item.username}</div>
                </div>
              </div>

              {/* Metric Value */}
              <div className="col-span-4 text-right">
                <span className="font-mono font-extrabold text-base text-amber-400">
                  {item.metricValue.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#8e8ea0] ml-1 uppercase">{item.metricLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
