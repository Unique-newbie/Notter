'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { sprintStore } from '@/lib/store/sprintStore';
import {
  SprintAchievement,
  SprintSession,
  WritingStreakStats,
} from '@/types';

const GOAL_OPTIONS = [1000, 2000, 3000, 5000];

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<SprintSession[]>([]);
  const [stats, setStats] = useState<WritingStreakStats | null>(null);
  const [achievements, setAchievements] = useState<SprintAchievement[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2000);

  useEffect(() => {
    const loadedSessions = sprintStore.getSessions();
    const loadedStats = sprintStore.getStreakStats();

    setSessions(loadedSessions);
    setStats(loadedStats);
    setDailyGoal(loadedStats.dailyGoalWords || 2000);
    setAchievements(sprintStore.getAchievements());
  }, []);

  const todayWords = sprintStore.getTodayWords();

  const goalPercent =
    dailyGoal > 0
      ? Math.min(100, Math.round((todayWords / dailyGoal) * 100))
      : 0;

  const goalRemaining = Math.max(dailyGoal - todayWords, 0);

  /*
   * 28 days of writing activity.
   */
  const heatmapDays = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 27; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      const dateStr = date.toISOString().split('T')[0];

      const words = sessions
        .filter((session) => session.startTime.startsWith(dateStr))
        .reduce((total, session) => total + session.wordsAdded, 0);

      days.push({
        dateStr,
        shortDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        words,
      });
    }

    return days;
  }, [sessions]);

  const total28DayWords = heatmapDays.reduce(
    (total, day) => total + day.words,
    0
  );

  const activeDays = heatmapDays.filter(
    (day) => day.words > 0
  ).length;

  const averageWordsPerDay = Math.round(
    total28DayWords / Math.max(heatmapDays.length, 1)
  );

  const bestDayWords = Math.max(
    ...heatmapDays.map((day) => day.words),
    0
  );

  const averageWordsPerSession =
    stats?.totalSessionsCompleted &&
    stats.totalSessionsCompleted > 0
      ? Math.round(
          (stats.totalWordsWritten || 0) /
            stats.totalSessionsCompleted
        )
      : 0;

  const completedAchievements = achievements.filter(
    (achievement) => achievement.unlockedAt
  ).length;

  const updateDailyGoal = (value: number) => {
    setDailyGoal(value);
    sprintStore.setDailyGoal(value);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <section className="relative overflow-hidden rounded-2xl border border-[#232334] bg-[#101014]">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent" />

        <div className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">

          {/* Title */}
          <div className="flex min-w-0 items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>

            <div className="min-w-0">

              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400">
                  Writing Analytics
                </span>

                <span className="text-[#3f3f46]">
                  •
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8e8ea0]">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  {stats?.currentStreakDays || 0} day streak
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white">
                Your writing progress
              </h1>

              <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#71717a]">
                See how consistently you write, track your goals,
                and keep your momentum going.
              </p>

            </div>
          </div>

          {/* Daily Goal */}
          <div className="w-full rounded-xl border border-[#292932] bg-[#15151a] p-4 lg:max-w-sm">

            <div className="mb-3 flex items-center justify-between gap-4">

              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400" />

                <span className="text-xs font-semibold text-white">
                  Today&apos;s goal
                </span>
              </div>

              <span className="font-mono text-xs font-bold text-amber-400">
                {todayWords.toLocaleString()} /{' '}
                {dailyGoal.toLocaleString()}
              </span>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[#09090b]">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{
                  width: `${goalPercent}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">

              <span className="text-[11px] text-[#71717a]">
                {goalPercent >= 100
                  ? 'Goal completed'
                  : `${goalRemaining.toLocaleString()} words remaining`}
              </span>

              <select
                value={dailyGoal}
                onChange={(event) =>
                  updateDailyGoal(Number(event.target.value))
                }
                className="rounded-md border border-[#292932] bg-[#101014] px-2 py-1 text-[11px] font-medium text-[#a1a1aa] outline-none focus:border-amber-500/50"
              >
                {GOAL_OPTIONS.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal.toLocaleString()} / day
                  </option>
                ))}
              </select>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          METRICS
      ========================================================= */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

        <MetricCard
          icon={Zap}
          label="Words written"
          value={(stats?.totalWordsWritten || 0).toLocaleString()}
          detail="Lifetime"
        />

        <MetricCard
          icon={Clock3}
          label="Writing time"
          value={Math.round(
            (stats?.totalSprintSeconds || 0) / 60
          ).toLocaleString()}
          suffix="min"
          detail="Total sprint time"
        />

        <MetricCard
          icon={Target}
          label="Sessions"
          value={(stats?.totalSessionsCompleted || 0).toLocaleString()}
          detail="Completed sprints"
        />

        <MetricCard
          icon={Flame}
          label="Best streak"
          value={(stats?.longestStreakDays || 0).toString()}
          suffix="days"
          detail="Longest writing streak"
        />

      </section>

      {/* =========================================================
          WRITING ACTIVITY
      ========================================================= */}

      <section className="rounded-2xl border border-[#232334] bg-[#101014]">

        {/* Section header */}
        <div className="flex items-center justify-between border-b border-[#232334] px-6 py-4">

          <div className="flex items-center gap-2">

            <CalendarDays className="h-4 w-4 text-[#a1a1aa]" />

            <div>
              <h2 className="text-sm font-semibold text-white">
                Writing activity
              </h2>

              <p className="mt-0.5 text-[10px] text-[#62626c]">
                Your word output over the last 28 days.
              </p>
            </div>

          </div>

          {/* Heatmap legend */}
          <div className="hidden items-center gap-2 sm:flex">

            <span className="text-[10px] text-[#52525b]">
              Less
            </span>

            <div className="flex gap-1">
              <LegendCell className="bg-[#181820]" />
              <LegendCell className="bg-amber-500/20" />
              <LegendCell className="bg-amber-500/50" />
              <LegendCell className="bg-amber-400" />
            </div>

            <span className="text-[10px] text-[#52525b]">
              More
            </span>

          </div>

        </div>

        {/* Activity content */}
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">

          {/* =====================================================
              HEATMAP
          ===================================================== */}

          <div className="min-w-0">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold text-white">
                  Activity
                </p>

                <p className="mt-0.5 text-[10px] text-[#52525b]">
                  Daily writing consistency
                </p>
              </div>

              <span className="text-[10px] text-[#52525b]">
                28 days
              </span>

            </div>

            <div className="w-full">

              {/* 28 days → 7 columns × 4 rows */}
              <div className="grid grid-cols-7 gap-2">

                {heatmapDays.map((day) => (
                  <div
                    key={day.dateStr}
                    title={`${day.shortDate}: ${day.words.toLocaleString()} words`}
                    className={`group relative aspect-square w-full max-w-[60px] rounded-md border transition duration-150 hover:scale-105 ${getHeatmapClass(
                      day.words
                    )}`}
                  >

                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#292932] bg-[#18181d] px-2 py-1 text-[10px] text-white shadow-xl group-hover:block">
                      {day.shortDate} ·{' '}
                      {day.words.toLocaleString()} words
                    </div>

                  </div>
                ))}

              </div>

              {/* Date labels */}
              <div className="mt-3 grid max-w-[294px] grid-cols-5 text-[9px] text-[#52525b]">

                <span className="text-left">
                  {heatmapDays[0]?.shortDate}
                </span>

                <span className="text-center">
                  {heatmapDays[7]?.shortDate}
                </span>

                <span className="text-center">
                  {heatmapDays[14]?.shortDate}
                </span>

                <span className="text-center">
                  {heatmapDays[21]?.shortDate}
                </span>

                <span className="text-right">
                  {heatmapDays[27]?.shortDate}
                </span>

              </div>

            </div>
          </div>

          {/* =====================================================
              WRITING SUMMARY
          ===================================================== */}

          <div className="rounded-xl border border-[#232334] bg-[#15151a] p-5">

            <div className="flex items-center gap-2">

              <TrendingUp className="h-4 w-4 text-amber-400" />

              <div>
                <h3 className="text-xs font-semibold text-white">
                  Writing summary
                </h3>

                <p className="text-[10px] text-[#52525b]">
                  Your last 28 days
                </p>
              </div>

            </div>

            {/* Summary metrics */}
            <div className="mt-5 grid grid-cols-2 gap-3">

              <ActivityStat
                label="Words written"
                value={total28DayWords.toLocaleString()}
              />

              <ActivityStat
                label="Active days"
                value={activeDays.toString()}
              />

              <ActivityStat
                label="Average / day"
                value={averageWordsPerDay.toLocaleString()}
              />

              <ActivityStat
                label="Best day"
                value={bestDayWords.toLocaleString()}
              />

            </div>

            {/* Current streak */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-[#292932] bg-[#101014] px-3 py-3">

              <div className="flex items-center gap-2">

                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                </div>

                <div>

                  <p className="text-[10px] font-medium text-[#71717a]">
                    Current streak
                  </p>

                  <p className="text-xs font-semibold text-white">
                    {stats?.currentStreakDays || 0} days
                  </p>

                </div>

              </div>

              <TrendingUp className="h-4 w-4 text-[#52525b]" />

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          MILESTONES + MOTIVATION
      ========================================================= */}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Milestones */}
        <div className="rounded-2xl border border-[#232334] bg-[#101014] p-5">

          <div className="flex items-center gap-2">

            <Trophy className="h-4 w-4 text-[#a1a1aa]" />

            <h2 className="text-sm font-semibold text-white">
              Writing milestones
            </h2>

          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">

            <MiniStat
              label="Current streak"
              value={`${stats?.currentStreakDays || 0} days`}
            />

            <MiniStat
              label="Best streak"
              value={`${stats?.longestStreakDays || 0} days`}
            />

            <MiniStat
              label="Avg. session"
              value={`${averageWordsPerSession.toLocaleString()} words`}
            />

            <MiniStat
              label="Achievements"
              value={`${completedAchievements}/${achievements.length}`}
            />

          </div>
        </div>

        {/* Motivation */}
        <div className="rounded-2xl border border-[#232334] bg-[#101014] p-5">

          <div className="flex items-center gap-2">

            <Flame className="h-4 w-4 text-amber-400" />

            <h2 className="text-sm font-semibold text-white">
              Keep your streak alive
            </h2>

          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#71717a]">
            Consistency matters more than perfect days. A small
            writing session today is enough to keep the momentum
            going.
          </p>

          <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-[#a1a1aa]">

            <CheckCircle2 className="h-4 w-4 text-emerald-400" />

            {goalPercent >= 100
              ? "Today's goal is complete."
              : "You still have time to reach today's goal."}

          </div>

        </div>

      </section>

      {/* =========================================================
          ACHIEVEMENTS
      ========================================================= */}

      <section className="rounded-2xl border border-[#232334] bg-[#101014]">

        <div className="border-b border-[#232334] px-6 py-4">

          <div className="flex items-center gap-2">

            <Award className="h-4 w-4 text-[#a1a1aa]" />

            <h2 className="text-sm font-semibold text-white">
              Achievements
            </h2>

          </div>

          <p className="mt-0.5 text-[10px] text-[#62626c]">
            Milestones unlocked through consistent writing.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">

          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}

        </div>

      </section>

    </div>
  );
}

/* ===============================================================
   METRIC CARD
=============================================================== */

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[#232334] bg-[#101014] p-4 transition hover:border-[#30303a]">

      <div className="flex items-center justify-between">

        <span className="text-[11px] font-medium text-[#71717a]">
          {label}
        </span>

        <Icon className="h-4 w-4 text-[#52525b]" />

      </div>

      <div className="mt-2 flex items-baseline gap-1.5">

        <span className="text-xl font-bold tracking-tight text-white">
          {value}
        </span>

        {suffix && (
          <span className="text-[11px] font-medium text-[#71717a]">
            {suffix}
          </span>
        )}

      </div>

      <p className="mt-0.5 text-[10px] text-[#52525b]">
        {detail}
      </p>

    </div>
  );
}

/* ===============================================================
   MINI STAT
=============================================================== */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#232334] bg-[#15151a] p-3">

      <p className="text-[10px] text-[#62626c]">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-white">
        {value}
      </p>

    </div>
  );
}

/* ===============================================================
   ACTIVITY STAT
=============================================================== */

function ActivityStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#232334] bg-[#101014] p-3">

      <p className="text-[10px] text-[#62626c]">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white">
        {value}
      </p>

    </div>
  );
}

/* ===============================================================
   ACHIEVEMENT CARD
=============================================================== */

function AchievementCard({
  achievement,
}: {
  achievement: SprintAchievement;
}) {
  const unlocked = Boolean(achievement.unlockedAt);

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        unlocked
          ? 'border-amber-500/20 bg-[#15151a]'
          : 'border-[#232334] bg-[#101014] opacity-60'
      }`}
    >

      <div className="flex items-start gap-3">

        {/* Lucide icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#292932] bg-[#0c0c10]">

          {unlocked ? (
            <Trophy className="h-4 w-4 text-amber-400" />
          ) : (
            <Award className="h-4 w-4 text-[#52525b]" />
          )}

        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-2">

            <h3 className="truncate text-xs font-semibold text-white">
              {achievement.title}
            </h3>

            {unlocked && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            )}

          </div>

          <p className="mt-1 text-[10px] leading-relaxed text-[#62626c]">
            {achievement.description}
          </p>

        </div>

      </div>

      <div className="mt-3">

        <div className="mb-1.5 flex items-center justify-between text-[9px] text-[#52525b]">

          <span>
            Progress
          </span>

          <span>
            {Math.round(achievement.progress)}%
          </span>

        </div>

        <div className="h-1 overflow-hidden rounded-full bg-[#0c0c10]">

          <div
            className={`h-full rounded-full ${
              unlocked
                ? 'bg-amber-400'
                : 'bg-[#3f3f46]'
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.max(0, achievement.progress)
              )}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

/* ===============================================================
   HEATMAP LEGEND
=============================================================== */

function LegendCell({
  className,
}: {
  className: string;
}) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-sm ${className}`}
    />
  );
}

/* ===============================================================
   HEATMAP COLORS
=============================================================== */

function getHeatmapClass(words: number) {
  if (words >= 2000) {
    return 'border-amber-400/30 bg-amber-400';
  }

  if (words >= 1000) {
    return 'border-amber-500/20 bg-amber-500/50';
  }

  if (words >= 250) {
    return 'border-amber-500/10 bg-amber-500/20';
  }

  return 'border-[#232334] bg-[#15151a]';
}