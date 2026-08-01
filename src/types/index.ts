export type BookStatus = 'Drafting' | 'Editing' | 'Complete' | 'Archived';
export type ChapterStatus = 'Unprocessed' | 'Pending Review' | 'Analyzed';
export type CharacterStatus = 'Active' | 'Deceased' | 'Unknown' | 'Missing';
export type ItemStatus = 'Active' | 'Destroyed' | 'Lost' | 'Stored' | 'Hidden' | 'Borrowed';
export type PlotThreadStatus = 'Open' | 'Resolved' | 'Abandoned';
export type ForeshadowingStatus = 'Unfulfilled' | 'Fulfilled';
export type ExtractionStatus = 'Pending' | 'Approved' | 'Rejected';
export type IssueSeverity = 'High' | 'Medium' | 'Low';
export type IssueCategory = 'Character' | 'Timeline' | 'Item' | 'Ability' | 'Duplicate' | 'Relationship' | 'Dialogue';

export interface Book {
  id: string;
  title: string;
  description: string;
  coverColor: string;
  coverUrl?: string;
  genre: string;
  status: BookStatus;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  chapterCount?: number;
  totalWordCount?: number;
}

export interface ActivityLogItem {
  id: string;
  type: 'chapter_edit' | 'character_add' | 'timeline_update' | 'cover_update' | 'book_create';
  description: string;
  timestamp: string;
  bookId?: string;
  chapterId?: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  chapterNumber: number;
  content: string;
  wordCount: number;
  readingTimeMinutes: number;
  status: ChapterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterAppearance {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  summary: string;          // What happened to this character in this chapter
  statusInChapter?: string; // Their status as of this chapter (Active, Deceased, etc.)
  location?: string;
  emotionalState?: string;
  physicalChanges?: string;
  goals?: string;
}

export interface EntityHistoryEvent {
  id: string;
  chapterId: string;
  chapterNumber: number;
  date: string;
  type: string;             // e.g. "Created", "Item Lost", "Ability Learned", "Status Change", "Location Move"
  description: string;
}

export interface CharacterProgressionChange {
  id: string;
  chapterNumber: number;
  attribute: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export interface Character {
  id: string;
  bookId: string;
  name: string;
  aliases: string[];
  summary: string;
  status: CharacterStatus;
  occupation?: string;
  currentLocation?: string;
  emotionalState?: string;
  physicalInjuries?: string;
  physicalChanges?: string;
  clothing?: string;
  goals?: string;
  
  // Dynamic Fact Architecture & Canon Control
  isLocked?: boolean;
  citations?: FactCitation[];
  knownFacts?: string[];
  explicitAppearanceFacts?: string[];
  dynamicAttributes?: Record<string, string | number>;
  progressionHistory?: CharacterProgressionChange[];

  // Extended RPG & Physical Codex Attributes
  species?: string;
  race?: string;
  gender?: string;
  age?: string;
  birthday?: string;
  title?: string;
  affiliations?: string[];
  
  // Physical Appearance Details
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  height?: string;
  weight?: string;
  build?: string;
  scars?: string;
  tattoos?: string;
  distinguishingFeatures?: string;
  weaponsEquipped?: string[];

  // RPG Statistics
  level?: number;
  rank?: string;
  tier?: string;
  className?: string;
  cultivationRealm?: string;
  hp?: number;
  maxHp?: number;
  mana?: number;
  maxMana?: number;
  strength?: number;
  agility?: number;
  vitality?: number;
  customStats?: Record<string, string | number>;

  secretsRevealed?: string[];
  promisesMade?: string[];
  promisesBroken?: string[];
  decisions?: string[];
  knowledgeGained?: string[];
  knowledgeLost?: string[];
  firstAppearanceChapterId?: string;
  lastAppearanceChapterId?: string;
  appearedInChapterIds: string[];
  chapterAppearances?: ChapterAppearance[];
  history?: EntityHistoryEvent[];
  tags?: string[];
  authorNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MergeHistoryRecord {
  id: string;
  bookId: string;
  entityType: 'character' | 'ability' | 'item' | 'location' | 'organization' | 'event';
  canonicalEntityId: string;
  canonicalEntityName: string;
  mergedEntityId: string;
  mergedEntityName: string;
  impactCount: number;
  mergedAt: string;
}

export interface Ability {
  id: string;
  bookId: string;
  name: string;
  aliases?: string[];
  description: string;
  category?: string;
  userCharacterNames: string[];
  firstAppearanceChapterId?: string;
  lastUsedChapterId?: string;
  evolutionNotes?: string;
  history?: EntityHistoryEvent[];
  tags?: string[];
  authorNotes?: string[];
  createdAt: string;
}

export interface Item {
  id: string;
  bookId: string;
  name: string;
  aliases?: string[];
  description: string;
  type?: string;
  ownerCharacterName?: string;
  previousOwnerName?: string;
  currentLocationName?: string;
  condition?: 'Intact' | 'Damaged' | 'Repaired' | 'Unknown';
  status: ItemStatus;
  historyNotes?: string;
  appearedInChapterIds: string[];
  history?: EntityHistoryEvent[];
  tags?: string[];
  authorNotes?: string[];
  createdAt: string;
}

export interface LocationEntity {
  id: string;
  bookId: string;
  name: string;
  aliases?: string[];
  summary: string;
  type?: string;
  charactersPresentNames: string[];
  itemsLocatedNames?: string[];
  eventsOccurred: string[];
  appearedInChapterIds: string[];
  history?: EntityHistoryEvent[];
  tags?: string[];
  authorNotes?: string[];
  createdAt: string;
}

export interface Organization {
  id: string;
  bookId: string;
  name: string;
  aliases?: string[];
  description: string;
  alignment?: string;
  leaderName?: string;
  memberNames: string[];
  history?: EntityHistoryEvent[];
  tags?: string[];
  authorNotes?: string[];
  createdAt: string;
}

export interface Relationship {
  id: string;
  bookId: string;
  character1Name: string;
  character2Name: string;
  relationType: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface DialogueFactEntity {
  id: string;
  bookId: string;
  chapterId: string;
  chapterNumber: number;
  speaker: string;
  recipient?: string;
  type: 'Promise' | 'Threat' | 'Lie' | 'Confession' | 'Secret' | 'Agreement' | 'Decision' | 'Order' | 'Oath' | 'Revelation';
  fact: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  bookId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  description: string;
  location?: string;
  participants?: string[];
  winner?: string;
  loser?: string;
  deaths?: string[];
  injuries?: string[];
  itemsExchanged?: string[];
  abilitiesUsed?: string[];
  consequences?: string;
  timePassedNote?: string;
  currentArc?: string;
  significance: 'Minor' | 'Major' | 'Climactic';
  createdAt: string;
}

export interface PlotThread {
  id: string;
  bookId: string;
  chapterId: string;
  title: string;
  description: string;
  status: PlotThreadStatus;
  resolvedChapterId?: string;
  createdAt: string;
}

export interface Foreshadowing {
  id: string;
  bookId: string;
  chapterId: string;
  clueDescription: string;
  payoffTarget?: string;
  status: ForeshadowingStatus;
  fulfilledChapterId?: string;
  createdAt: string;
}

export interface StructuredExtractionJSON {
  summary: string;
  characters: {
    name: string;
    summary?: string;
    status?: string;
    occupation?: string;
    location?: string;
    emotional_state?: string;
    physical_injuries?: string;
    physical_changes?: string;
    clothing?: string;
    goals?: string;
    known_facts?: string[];
    explicit_appearance_facts?: string[];
    dynamic_attributes?: Record<string, string | number>;
    progression_changes?: {
      attribute: string;
      old_value: string;
      new_value: string;
      reason?: string;
    }[];
    secrets_revealed?: string[];
    promises_made?: string[];
    promises_broken?: string[];
    decisions?: string[];
    knowledge_gained?: string[];
    knowledge_lost?: string[];
  }[];
  new_characters: {
    name: string;
    summary: string;
    aliases?: string[];
    occupation?: string;
    status?: string;
  }[];
  events: {
    title: string;
    description: string;
    significance?: 'Minor' | 'Major' | 'Climactic';
    location?: string;
    participants?: string[];
    winner?: string;
    loser?: string;
    deaths?: string[];
    injuries?: string[];
    items_exchanged?: string[];
    abilities_used?: string[];
    consequences?: string;
  }[];
  abilities: {
    name: string;
    description: string;
    users?: string[];
    category?: string;
  }[];
  items: {
    name: string;
    description: string;
    type?: string;
    owner?: string;
    previous_owner?: string;
    location?: string;
    condition?: 'Intact' | 'Damaged' | 'Repaired';
    status?: 'Active' | 'Destroyed' | 'Lost' | 'Stored' | 'Hidden' | 'Borrowed';
  }[];
  locations: {
    name: string;
    summary: string;
    type?: string;
    characters_present?: string[];
    items_located?: string[];
    environmental_changes?: string;
  }[];
  organizations: {
    name: string;
    description: string;
    alignment?: string;
    leader?: string;
    members?: string[];
  }[];
  relationship_changes: {
    character1: string;
    character2: string;
    relationType: string;
    description: string;
  }[];
  dialogue_facts: {
    speaker: string;
    recipient?: string;
    type: 'Promise' | 'Threat' | 'Lie' | 'Confession' | 'Secret' | 'Agreement' | 'Decision' | 'Order' | 'Oath' | 'Revelation';
    fact: string;
  }[];
  timeline: {
    time_passed: string | null;
    current_arc: string | null;
    time_skips?: string | null;
    season?: string | null;
    is_flashback?: boolean;
  };
  plot_threads: {
    title: string;
    description: string;
  }[];
  foreshadowing: {
    clueDescription: string;
    payoffTarget?: string;
  }[];
  warnings: string[];
}

export interface AIExtraction {
  id: string;
  bookId: string;
  chapterId: string;
  extraction: StructuredExtractionJSON;
  status: ExtractionStatus;
  warnings: string[];
  createdAt: string;
}

export interface ConsistencyIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedChapterNumbers: number[];
  suggestedFix: string;
}

export interface ConsistencyReport {
  id: string;
  bookId: string;
  createdAt: string;
  issues: ConsistencyIssue[];
  totalChaptersAudited: number;
}

export interface SprintSession {
  id: string;
  bookId: string;
  chapterId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  wordsBefore: number;
  wordsAfter: number;
  wordsAdded: number;
  charactersTyped: number;
  averageWpm: number;
  peakWpm: number;
  longestBurstMinutes: number;
  pauseCount: number;
  averagePauseSeconds: number;
  deleteCount: number;
  completionPercent: number;
  goalType: 'time' | 'words';
  goalTarget: number;
  goalCompleted: boolean;
  themeUsed: string;
  createdAt: string;
}

export interface WritingStreakStats {
  currentStreakDays: number;
  longestStreakDays: number;
  totalWordsWritten: number;
  totalSprintSeconds: number;
  totalSessionsCompleted: number;
  dailyGoalWords: number;
  weeklyGoalWords: number;
  monthlyGoalWords: number;
}

export interface SprintAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
}

export interface AuthorProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  country?: string;
  favoriteGenre?: string;
  privacy: 'public' | 'friends' | 'private';
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  totalWords: number;
  streakDays: number;
  averageWpm: number;
  sprintCount: number;
  booksCount: number;
  joinedDate: string;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  genre: string;
  icon: string;
  memberCount: number;
  totalWordsWritten: number;
  weeklyGoalWords: number;
  isJoined?: boolean;
  leaderUsername: string;
  createdAt: string;
}

export interface ChallengeEvent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'official' | 'seasonal' | 'guild';
  targetWords: number;
  durationDays: number;
  badgeIcon: string;
  badgeName: string;
  joinedCount: number;
  isJoined?: boolean;
  currentProgressWords: number;
  startDate: string;
  endDate: string;
}

export interface FactCitation {
  sourceChapterId: string;
  sourceChapterNumber: number;
  sourceChapterTitle: string;
  sourceParagraphText?: string;
  sourceQuote: string;
  firstSeenDate: string;
  lastConfirmedDate: string;
  aiConfidence: 'Explicit' | 'Strong Match' | 'Possible Match' | 'Needs Review';
}

export interface StoryArc {
  id: string;
  bookId: string;
  title: string;
  description: string;
  startChapterNumber: number;
  endChapterNumber: number;
  status: 'Upcoming' | 'Active' | 'Completed';
  keyCharacterIds: string[];
  createdAt: string;
}

export interface RelationshipStage {
  id: string;
  chapterNumber: number;
  relationType: string;
  description: string;
  timestamp: string;
}

export interface ContinuityWarning {
  id: string;
  bookId: string;
  severity: 'Warning' | 'Contradiction' | 'Critical';
  title: string;
  description: string;
  entityName: string;
  chapterNumber: number;
  detectedAt: string;
  dismissed?: boolean;
}

export interface CustomEntity {
  id: string;
  bookId: string;
  name: string;
  customType: string; // e.g. "Kingdom", "Religion", "Currency", "Monster", "Spaceship", "Bloodline"
  summary: string;
  attributes: Record<string, string | number>;
  appearedInChapterIds: string[];
  tags?: string[];
  createdAt: string;
}

export interface GlossaryTerm {
  id: string;
  bookId: string;
  term: string;
  definition: string;
  category: 'World' | 'System' | 'Magic' | 'Culture' | 'Lore';
  manualEdit: boolean;
  createdAt: string;
}

export interface StoryBibleSnapshot {
  id: string;
  bookId: string;
  title: string;
  chapterCount: number;
  characterCount: number;
  createdAt: string;
  snapshotDataJson: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  metricValue: number;
  metricLabel: string;
  isCurrentUser?: boolean;
  flaggedAntiCheat?: boolean;
}
