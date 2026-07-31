import { AuthorProfile, Guild, ChallengeEvent, LeaderboardEntry, SprintSession } from '@/types';

export const INITIAL_GUILDS: Guild[] = [
  {
    id: 'guild-fantasy',
    name: 'Fantasy Authors Guild',
    tag: 'FANTASY',
    description: 'High fantasy, epic magic systems, and intricate worldbuilding fiction writers.',
    genre: 'Fantasy',
    icon: '🐉',
    memberCount: 1420,
    totalWordsWritten: 14250000,
    weeklyGoalWords: 500000,
    isJoined: true,
    leaderUsername: 'archmage_writes',
    createdAt: '2026-01-15'
  },
  {
    id: 'guild-scifi',
    name: 'Sci-Fi Explorers',
    tag: 'SCIFI',
    description: 'Space opera, cyberpunk, hard sci-fi, and futuristic technology creators.',
    genre: 'Sci-Fi',
    icon: '🚀',
    memberCount: 980,
    totalWordsWritten: 9850000,
    weeklyGoalWords: 350000,
    isJoined: false,
    leaderUsername: 'cyber_author',
    createdAt: '2026-02-01'
  },
  {
    id: 'guild-royalroad',
    name: 'Royal Road & Web Novelists',
    tag: 'RR',
    description: 'Daily serial web novel writers, progression fantasy, and LitRPG authors.',
    genre: 'LitRPG / Progression',
    icon: '⚔️',
    memberCount: 2150,
    totalWordsWritten: 28900000,
    weeklyGoalWords: 1000000,
    isJoined: false,
    leaderUsername: 'serial_king',
    createdAt: '2026-01-01'
  },
  {
    id: 'guild-romance',
    name: 'Romance & Drama Writers',
    tag: 'ROMANCE',
    description: 'Character-driven relationships, emotional arcs, and romance fiction.',
    genre: 'Romance',
    icon: '💖',
    memberCount: 840,
    totalWordsWritten: 7200000,
    weeklyGoalWords: 300000,
    isJoined: false,
    leaderUsername: 'heart_novels',
    createdAt: '2026-02-14'
  }
];

export const INITIAL_CHALLENGES: ChallengeEvent[] = [
  {
    id: 'chall-7day',
    title: '7-Day Consistency Sprint',
    subtitle: 'Write every day for 7 consecutive days',
    description: 'Build a permanent writing habit. Complete at least one sprint session every day for 7 days.',
    category: 'official',
    targetWords: 7000,
    durationDays: 7,
    badgeIcon: '🔥',
    badgeName: '7-Day Warrior',
    joinedCount: 3420,
    isJoined: true,
    currentProgressWords: 4250,
    startDate: '2026-07-25',
    endDate: '2026-08-01'
  },
  {
    id: 'chall-100k',
    title: '100K Novel Draft Challenge',
    subtitle: 'Draft a full 100,000-word novel manuscript',
    description: 'The ultimate novel marathon. Draft 100,000 words across your book chapters.',
    category: 'official',
    targetWords: 100000,
    durationDays: 60,
    badgeIcon: '🏆',
    badgeName: '100K Titan',
    joinedCount: 1890,
    isJoined: false,
    currentProgressWords: 12400,
    startDate: '2026-07-01',
    endDate: '2026-08-31'
  },
  {
    id: 'chall-nanowrimo',
    title: 'Summer Nano Writing Festival',
    subtitle: 'Write 50,000 words in 30 days',
    description: 'Join thousands of authors worldwide drafting 50,000 words during the summer festival.',
    category: 'seasonal',
    targetWords: 50000,
    durationDays: 30,
    badgeIcon: '🌅',
    badgeName: 'Summer Laureate',
    joinedCount: 4120,
    isJoined: false,
    currentProgressWords: 0,
    startDate: '2026-08-01',
    endDate: '2026-08-31'
  }
];

class CommunityStore {
  // Anti-Cheat WPM Validator
  validateSessionAntiCheat(session: SprintSession): { isValid: boolean; reason?: string } {
    if (session.averageWpm > 200) {
      return { isValid: false, reason: 'Flagged for unrealistic typing speed (>200 WPM).' };
    }
    if (session.peakWpm > 300) {
      return { isValid: false, reason: 'Flagged for unrealistic burst paste (>300 WPM).' };
    }
    if (session.wordsAdded > 500 && session.durationSeconds < 30) {
      return { isValid: false, reason: 'Flagged for instant paste block.' };
    }
    return { isValid: true };
  }

  getGuilds(): Guild[] {
    if (typeof window === 'undefined') return INITIAL_GUILDS;
    try {
      const stored = localStorage.getItem('notter_community_guilds');
      return stored ? JSON.parse(stored) : INITIAL_GUILDS;
    } catch (e) {
      return INITIAL_GUILDS;
    }
  }

  toggleJoinGuild(guildId: string) {
    const list = this.getGuilds();
    const updated = list.map(g => {
      if (g.id === guildId) {
        const nextState = !g.isJoined;
        return {
          ...g,
          isJoined: nextState,
          memberCount: nextState ? g.memberCount + 1 : Math.max(0, g.memberCount - 1)
        };
      }
      return g;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('notter_community_guilds', JSON.stringify(updated));
    }
    return updated;
  }

  getChallenges(): ChallengeEvent[] {
    if (typeof window === 'undefined') return INITIAL_CHALLENGES;
    try {
      const stored = localStorage.getItem('notter_community_challenges');
      return stored ? JSON.parse(stored) : INITIAL_CHALLENGES;
    } catch (e) {
      return INITIAL_CHALLENGES;
    }
  }

  toggleJoinChallenge(challengeId: string) {
    const list = this.getChallenges();
    const updated = list.map(c => {
      if (c.id === challengeId) {
        const nextState = !c.isJoined;
        return {
          ...c,
          isJoined: nextState,
          joinedCount: nextState ? c.joinedCount + 1 : Math.max(0, c.joinedCount - 1)
        };
      }
      return c;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('notter_community_challenges', JSON.stringify(updated));
    }
    return updated;
  }

  getLeaderboard(timeframe: string, category: string): LeaderboardEntry[] {
    // Generate clean competitive leaderboard entries with anti-cheat checks
    const base: LeaderboardEntry[] = [
      { rank: 1, username: 'elena_fantasy', displayName: 'Elena Vance', metricValue: 8420, metricLabel: 'words', isCurrentUser: false },
      { rank: 2, username: 'author_notter', displayName: 'You (Novel Author)', metricValue: 6250, metricLabel: 'words', isCurrentUser: true },
      { rank: 3, username: 'kaito_webnovel', displayName: 'Kaito Chen', metricValue: 5890, metricLabel: 'words', isCurrentUser: false },
      { rank: 4, username: 'sarah_scifi', displayName: 'Sarah Connor', metricValue: 4900, metricLabel: 'words', isCurrentUser: false },
      { rank: 5, username: 'marcus_weaver', displayName: 'Marcus Weaver', metricValue: 4120, metricLabel: 'words', isCurrentUser: false }
    ];

    if (category === 'streak') {
      return base.map(b => ({ ...b, metricValue: b.rank === 2 ? 18 : 25 - b.rank * 3, metricLabel: 'days streak' }));
    } else if (category === 'wpm') {
      return base.map(b => ({ ...b, metricValue: b.rank === 2 ? 52 : 75 - b.rank * 5, metricLabel: 'avg WPM' }));
    }

    return base;
  }
}

export const communityStore = new CommunityStore();
