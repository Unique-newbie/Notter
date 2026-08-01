import { SprintSession, WritingStreakStats, SprintAchievement } from '@/types';

export interface ActiveSprintSnapshot {
  sessionId: string;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  initialContent: string;
  currentContent: string;
  goalType: 'time' | 'words';
  goalTarget: number;
  startTime: string;
  lastUpdated: string;
}

const STORAGE_KEYS = {
  SESSIONS: 'notter_sprint_sessions',
  STREAK_STATS: 'notter_sprint_streak_stats',
  ACTIVE_SNAPSHOT: 'notter_sprint_active_snapshot',
  DAILY_GOAL: 'notter_daily_word_goal',
  ACHIEVEMENTS: 'notter_sprint_achievements'
};

export const INITIAL_ACHIEVEMENTS: SprintAchievement[] = [
  { id: 'first-sprint', title: 'First Sprint', description: 'Complete your very first writing sprint session.', icon: '🏆', progress: 0 },
  { id: '1k-words', title: '1,000 Words', description: 'Write 1,000 total words during sprints.', icon: '📝', progress: 0 },
  { id: '5k-words', title: '5,000 Words', description: 'Write 5,000 total words during sprints.', icon: '📚', progress: 0 },
  { id: '100k-words', title: '100,000 Words', description: 'Write 100,000 total words (a full novel!).', icon: '🚀', progress: 0 },
  { id: '7-day-streak', title: '7 Day Streak', description: 'Maintain a 7-day continuous writing streak.', icon: '🔥', progress: 0 },
  { id: '30-day-streak', title: '30 Day Streak', description: 'Maintain a 30-day continuous writing streak.', icon: '⚡', progress: 0 },
  { id: 'night-owl', title: 'Night Owl', description: 'Complete a sprint session between 10 PM and 4 AM.', icon: '🦉', progress: 0 },
  { id: 'early-bird', title: 'Early Bird', description: 'Complete a sprint session between 5 AM and 8 AM.', icon: '🌅', progress: 0 },
  { id: 'marathon', title: 'Marathon Writer', description: 'Complete a single sprint session of 60 minutes or more.', icon: '🏃', progress: 0 },
  { id: 'speed-demon', title: 'Speed Demon', description: 'Achieve a Peak WPM of 75 or higher.', icon: '⚡', progress: 0 },
  { id: 'consistency-king', title: 'Consistency King', description: 'Complete 25 writing sprint sessions.', icon: '👑', progress: 0 }
];

class SprintStore {
  // Save active rolling snapshot every 3s
  saveActiveSnapshot(snapshot: ActiveSprintSnapshot) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SNAPSHOT, JSON.stringify(snapshot));
    } catch (e) {}
  }

  getActiveSnapshot(): ActiveSprintSnapshot | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SNAPSHOT);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  clearActiveSnapshot() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SNAPSHOT);
  }

  // Get all historical sprint sessions
  getSessions(): SprintSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveSession(session: SprintSession) {
    if (typeof window === 'undefined') return;
    const existing = this.getSessions();
    const updated = [session, ...existing].slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    } catch (e) {
      try {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated.slice(0, 15)));
      } catch (err) {}
    }
    this.clearActiveSnapshot();
    this.updateStreakAndAchievements(session, updated);
  }

  getStreakStats(): WritingStreakStats {
    if (typeof window === 'undefined') {
      return { currentStreakDays: 0, longestStreakDays: 0, totalWordsWritten: 0, totalSprintSeconds: 0, totalSessionsCompleted: 0, dailyGoalWords: 2000, weeklyGoalWords: 10000, monthlyGoalWords: 40000 };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STREAK_STATS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    return {
      currentStreakDays: 0,
      longestStreakDays: 0,
      totalWordsWritten: 0,
      totalSprintSeconds: 0,
      totalSessionsCompleted: 0,
      dailyGoalWords: 2000,
      weeklyGoalWords: 10000,
      monthlyGoalWords: 40000
    };
  }

  saveStreakStats(stats: WritingStreakStats) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.STREAK_STATS, JSON.stringify(stats));
  }

  setDailyGoal(words: number) {
    const stats = this.getStreakStats();
    stats.dailyGoalWords = words;
    this.saveStreakStats(stats);
  }

  getTodayWords(): number {
    const sessions = this.getSessions();
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions
      .filter(s => s.startTime.startsWith(todayStr))
      .reduce((acc, s) => acc + s.wordsAdded, 0);
  }

  private updateStreakAndAchievements(session: SprintSession, allSessions: SprintSession[]) {
    const stats = this.getStreakStats();
    stats.totalWordsWritten += session.wordsAdded;
    stats.totalSprintSeconds += session.durationSeconds;
    stats.totalSessionsCompleted += 1;

    // Calculate streak
    const dates = Array.from(new Set(allSessions.map(s => s.startTime.split('T')[0]))).sort();
    let currentStreak = 0;
    let maxStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates.includes(today) || dates.includes(yesterday)) {
      currentStreak = 1;
      let checkDate = new Date(dates.includes(today) ? today : yesterday);

      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dates.includes(dateStr)) {
          currentStreak += 1;
        } else {
          break;
        }
      }
    }

    stats.currentStreakDays = currentStreak;
    stats.longestStreakDays = Math.max(stats.longestStreakDays, currentStreak);
    this.saveStreakStats(stats);

    // Evaluate Achievements
    this.evaluateAchievements(session, stats);
  }

  getAchievements(): SprintAchievement[] {
    if (typeof window === 'undefined') return INITIAL_ACHIEVEMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (stored) {
        const saved: SprintAchievement[] = JSON.parse(stored);
        return INITIAL_ACHIEVEMENTS.map(initial => {
          const found = saved.find(s => s.id === initial.id);
          return found || initial;
        });
      }
    } catch (e) {}
    return INITIAL_ACHIEVEMENTS;
  }

  private evaluateAchievements(session: SprintSession, stats: WritingStreakStats) {
    const list = this.getAchievements();
    const nowStr = new Date().toISOString();
    const sessionHour = new Date(session.startTime).getHours();

    list.forEach(a => {
      let shouldUnlock = false;
      let progress = 0;

      if (a.id === 'first-sprint') {
        progress = Math.min(100, stats.totalSessionsCompleted * 100);
        shouldUnlock = stats.totalSessionsCompleted >= 1;
      } else if (a.id === '1k-words') {
        progress = Math.min(100, (stats.totalWordsWritten / 1000) * 100);
        shouldUnlock = stats.totalWordsWritten >= 1000;
      } else if (a.id === '5k-words') {
        progress = Math.min(100, (stats.totalWordsWritten / 5000) * 100);
        shouldUnlock = stats.totalWordsWritten >= 5000;
      } else if (a.id === '100k-words') {
        progress = Math.min(100, (stats.totalWordsWritten / 100000) * 100);
        shouldUnlock = stats.totalWordsWritten >= 100000;
      } else if (a.id === '7-day-streak') {
        progress = Math.min(100, (stats.currentStreakDays / 7) * 100);
        shouldUnlock = stats.currentStreakDays >= 7;
      } else if (a.id === '30-day-streak') {
        progress = Math.min(100, (stats.currentStreakDays / 30) * 100);
        shouldUnlock = stats.currentStreakDays >= 30;
      } else if (a.id === 'night-owl') {
        shouldUnlock = sessionHour >= 22 || sessionHour <= 4;
        progress = shouldUnlock ? 100 : 0;
      } else if (a.id === 'early-bird') {
        shouldUnlock = sessionHour >= 5 && sessionHour <= 8;
        progress = shouldUnlock ? 100 : 0;
      } else if (a.id === 'marathon') {
        shouldUnlock = session.durationSeconds >= 3600;
        progress = shouldUnlock ? 100 : 0;
      } else if (a.id === 'speed-demon') {
        shouldUnlock = session.peakWpm >= 75;
        progress = shouldUnlock ? 100 : 0;
      } else if (a.id === 'consistency-king') {
        progress = Math.min(100, (stats.totalSessionsCompleted / 25) * 100);
        shouldUnlock = stats.totalSessionsCompleted >= 25;
      }

      a.progress = Math.round(progress);
      if (shouldUnlock && !a.unlockedAt) {
        a.unlockedAt = nowStr;
      }
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(list));
    }
  }
}

export const sprintStore = new SprintStore();
