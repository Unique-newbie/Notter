'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Calendar, TrendingUp, Clock, Award, BarChart3, Zap, CheckCircle2, Target } from 'lucide-react';
import { sprintStore } from '@/lib/store/sprintStore';
import { SprintSession, WritingStreakStats, SprintAchievement } from '@/types';

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<SprintSession[]>([]);
  const [stats, setStats] = useState<WritingStreakStats | null>(null);
  const [achievements, setAchievements] = useState<SprintAchievement[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(2000);

  useEffect(() => {
    const sList = sprintStore.getSessions();
    setSessions(sList);
    const st = sprintStore.getStreakStats();
    setStats(st);
    setDailyGoal(st.dailyGoalWords || 2000);
    setAchievements(sprintStore.getAchievements());
  }, []);

  const handleUpdateDailyGoal = (val: number) => {
    setDailyGoal(val);
    sprintStore.setDailyGoal(val);
  };

  const todayWords = sprintStore.getTodayWords();
  const goalPercent = Math.min(100, Math.round((todayWords / dailyGoal) * 100));

  // Generate 28-day Heatmap cells
  const generateHeatmapDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayWords = sessions
        .filter(s => s.startTime.startsWith(dateStr))
        .reduce((acc, s) => acc + s.wordsAdded, 0);

      days.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        words: dayWords
      });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-[#121218] via-[#1f140e] to-[#121218] border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shrink-0 flex items-center justify-center text-white shadow-2xl">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Writing Analytics</span>
              <span className="text-xs text-[#52526b]">|</span>
              <span className="text-xs text-amber-300 font-semibold">{stats?.currentStreakDays || 0} Day Streak 🔥</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Sprint Mode 2.0 Historical Statistics</h1>
            <p className="text-xs text-[#a1a1aa] mt-1 max-w-2xl leading-relaxed">
              Track your daily word count, average WPM, burst endurance, and unlocked achievements.
            </p>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] w-full md:w-72 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5"><Target className="w-4 h-4 text-amber-400" /> Today&apos;s Goal</span>
            <span className="font-mono text-amber-400 font-bold">{todayWords.toLocaleString()} / {dailyGoal.toLocaleString()}w</span>
          </div>
          <div className="w-full bg-[#0c0c10] h-2 rounded-full overflow-hidden border border-[#232334]">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-full transition-all duration-300" style={{ width: `${goalPercent}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#8e8ea0]">
            <span>{goalPercent}% Completed</span>
            <select
              value={dailyGoal}
              onChange={(e) => handleUpdateDailyGoal(parseInt(e.target.value))}
              className="bg-[#121218] border border-[#232334] rounded px-1.5 py-0.5 text-white font-mono text-[10px]"
            >
              <option value={1000}>1,000w/day</option>
              <option value={2000}>2,000w/day</option>
              <option value={3000}>3,000w/day</option>
              <option value={5000}>5,000w/day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Lifetime Words Written</div>
          <div className="text-2xl font-extrabold text-white mt-1">{(stats?.totalWordsWritten || 0).toLocaleString()}</div>
        </div>

        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Total Sprint Time</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {Math.round((stats?.totalSprintSeconds || 0) / 60)} mins
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Sessions Completed</div>
          <div className="text-2xl font-extrabold text-orange-400 mt-1">{stats?.totalSessionsCompleted || 0}</div>
        </div>

        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Longest Streak</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats?.longestStreakDays || 0} Days 🔥</div>
        </div>
      </div>

      {/* Writing Heatmap Calendar */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> 28-Day Writing Heatmap
          </h2>
          <span className="text-xs text-[#8e8ea0]">Darker orange indicates higher word output</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {heatmapDays.map((d) => {
            let bgClass = 'bg-[#181820] border-[#232334] text-[#8e8ea0]';
            if (d.words > 2000) bgClass = 'bg-amber-500 text-black font-extrabold border-amber-400';
            else if (d.words > 1000) bgClass = 'bg-amber-600/80 text-white font-bold border-amber-500';
            else if (d.words > 250) bgClass = 'bg-amber-800/50 text-amber-200 border-amber-700';

            return (
              <div
                key={d.dateStr}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${bgClass}`}
                title={`${d.dateStr}: ${d.words} words`}
              >
                <span className="text-[10px] uppercase">{d.dayName}</span>
                <span className="text-xs font-mono font-extrabold mt-1">{d.words > 0 ? `${d.words}w` : '-'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4">
        <h2 className="font-bold text-white text-base flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" /> Unlockable Achievements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                a.unlockedAt
                  ? 'bg-[#181820] border-amber-500/40 shadow-xl'
                  : 'bg-[#121218] border-[#232334] opacity-50'
              }`}
            >
              <div className="text-2xl shrink-0 p-2 rounded-xl bg-[#0c0c10] border border-[#232334]">
                {a.icon}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xs truncate">{a.title}</h3>
                  {a.unlockedAt && (
                    <span className="text-[9px] font-bold uppercase text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#8e8ea0] line-clamp-2 leading-relaxed">{a.description}</p>
                
                <div className="w-full bg-[#0c0c10] h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-400 h-full" style={{ width: `${a.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
