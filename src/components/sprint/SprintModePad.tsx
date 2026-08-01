'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Clock, Target, Maximize2, Minimize2, Check, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { calculateWordCount, calculateReadingTime } from '@/lib/utils';
import { sprintStore, ActiveSprintSnapshot } from '@/lib/store/sprintStore';
import { SprintSession } from '@/types';

interface SprintModePadProps {
  isOpen: boolean;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  initialContent: string;
  goalType: 'time' | 'words';
  goalTarget: number;
  focusMode: boolean;
  typewriterMode: boolean;
  theme: string;
  onSaveChapterContent: (newContent: string) => Promise<void>;
  onSprintFinish: (session: SprintSession) => void;
  onClose: () => void;
}

export function SprintModePad({
  isOpen,
  bookId,
  chapterId,
  chapterTitle,
  chapterNumber,
  initialContent,
  goalType,
  goalTarget,
  focusMode,
  typewriterMode,
  theme,
  onSaveChapterContent,
  onSprintFinish,
  onClose
}: SprintModePadProps) {
  const [content, setContent] = useState(initialContent);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerDisplayMode, setTimerDisplayMode] = useState<'countdown' | 'elapsed'>(goalType === 'time' ? 'countdown' : 'elapsed');
  const [fullscreenExited, setFullscreenExited] = useState(false);
  const [milestoneToast, setMilestoneToast] = useState('');

  // Performance Trackers
  const [wordsBefore] = useState(() => calculateWordCount(initialContent));
  const [peakWpm, setPeakWpm] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [totalPauseSeconds, setTotalPauseSeconds] = useState(0);
  const [deleteCount, setDeleteCount] = useState(0);
  const [longestBurstSeconds, setLongestBurstSeconds] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number | null>(null);
  const totalPausedDurationRef = useRef<number>(0);
  const contentRef = useRef<string>(content);
  const lastKeyTimeRef = useRef<number>(Date.now());
  const wordsWindowRef = useRef<{ timestamp: number; wordCount: number }[]>([]);
  const currentBurstRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Initialize & Enter Fullscreen
  useEffect(() => {
    if (!isOpen) return;
    setContent(initialContent);
    contentRef.current = initialContent;
    setElapsedSeconds(0);
    setFullscreenExited(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = null;
    totalPausedDurationRef.current = 0;
    lastKeyTimeRef.current = Date.now();

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenExited(true);
        pausedTimeRef.current = Date.now();
      } else {
        if (pausedTimeRef.current) {
          totalPausedDurationRef.current += (Date.now() - pausedTimeRef.current);
          pausedTimeRef.current = null;
        }
        setFullscreenExited(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isOpen, initialContent]);

  // Handle Tab Focus/Visibility Changes
  useEffect(() => {
    if (!isOpen) return;
    const handleVisibility = () => {
      if (!document.hidden && !fullscreenExited) {
        const now = Date.now();
        const activeMs = now - startTimeRef.current - totalPausedDurationRef.current;
        setElapsedSeconds(Math.floor(Math.max(0, activeMs) / 1000));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isOpen, fullscreenExited]);

  // Accurate Timer & Metrics Engine
  useEffect(() => {
    if (!isOpen || fullscreenExited) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const activeMs = now - startTimeRef.current - totalPausedDurationRef.current;
      const currentElapsed = Math.floor(Math.max(0, activeMs) / 1000);
      setElapsedSeconds(currentElapsed);

      const idleMs = now - lastKeyTimeRef.current;
      if (idleMs > 4000) {
        setPauseCount(p => p + 1);
        setTotalPauseSeconds(ps => ps + 1);
        currentBurstRef.current = 0;
      } else {
        currentBurstRef.current += 1;
        setLongestBurstSeconds(lb => Math.max(lb, currentBurstRef.current));
      }

      // Calculate sliding Peak WPM
      const currentWords = calculateWordCount(contentRef.current);
      const addedWords = Math.max(0, currentWords - wordsBefore);
      wordsWindowRef.current.push({ timestamp: now, wordCount: addedWords });
      wordsWindowRef.current = wordsWindowRef.current.filter(w => now - w.timestamp <= 15000);

      if (wordsWindowRef.current.length > 2) {
        const oldest = wordsWindowRef.current[0];
        const newest = wordsWindowRef.current[wordsWindowRef.current.length - 1];
        const timeDiffMin = (newest.timestamp - oldest.timestamp) / 60000;
        const wordDiff = newest.wordCount - oldest.wordCount;
        if (timeDiffMin > 0 && wordDiff > 0) {
          const instantWpm = Math.round(wordDiff / timeDiffMin);
          setPeakWpm(pw => Math.max(pw, instantWpm));
        }
      }

      // Rolling Active Snapshot Auto-Save
      const snapshot: ActiveSprintSnapshot = {
        sessionId: `sprint-${startTimeRef.current}`,
        bookId,
        chapterId,
        chapterTitle,
        chapterNumber,
        initialContent,
        currentContent: contentRef.current,
        goalType,
        goalTarget,
        startTime: new Date(startTimeRef.current).toISOString(),
        lastUpdated: new Date().toISOString()
      };
      sprintStore.saveActiveSnapshot(snapshot);

    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, fullscreenExited, bookId, chapterId, chapterTitle, chapterNumber, initialContent, goalType, goalTarget, wordsBefore]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      sprintStore.saveActiveSnapshot({
        sessionId: `sprint-${startTimeRef.current}`,
        bookId,
        chapterId,
        chapterTitle,
        chapterNumber,
        initialContent,
        currentContent: contentRef.current,
        goalType,
        goalTarget,
        startTime: new Date(startTimeRef.current).toISOString(),
        lastUpdated: new Date().toISOString()
      });
      return;
    }
    lastKeyTimeRef.current = Date.now();
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setDeleteCount(d => d + 1);
    }
  };

  const resumeFullscreen = () => {
    if (pausedTimeRef.current) {
      totalPausedDurationRef.current += (Date.now() - pausedTimeRef.current);
      pausedTimeRef.current = null;
    }
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setFullscreenExited(false);
  };

  const handleFinishSprint = async () => {
    const currentWords = calculateWordCount(content);
    const wordsAdded = Math.max(0, currentWords - wordsBefore);
    const durationMins = Math.max(0.1, elapsedSeconds / 60);
    const averageWpm = Math.round(wordsAdded / durationMins);

    let completionPercent = 0;
    let goalCompleted = false;

    if (goalType === 'time') {
      completionPercent = Math.min(100, Math.round((elapsedSeconds / (goalTarget * 60)) * 100));
      goalCompleted = elapsedSeconds >= goalTarget * 60;
    } else {
      completionPercent = Math.min(100, Math.round((wordsAdded / goalTarget) * 100));
      goalCompleted = wordsAdded >= goalTarget;
    }

    const session: SprintSession = {
      id: `sprint-${Date.now()}`,
      bookId,
      chapterId,
      startTime: new Date(startTimeRef.current).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      wordsBefore,
      wordsAfter: currentWords,
      wordsAdded,
      charactersTyped: content.length,
      averageWpm,
      peakWpm: Math.max(peakWpm, averageWpm),
      longestBurstMinutes: parseFloat((longestBurstSeconds / 60).toFixed(1)),
      pauseCount,
      averagePauseSeconds: pauseCount > 0 ? Math.round(totalPauseSeconds / pauseCount) : 0,
      deleteCount,
      completionPercent,
      goalType,
      goalTarget,
      goalCompleted,
      themeUsed: theme,
      createdAt: new Date().toISOString()
    };

    await onSaveChapterContent(content);
    sprintStore.saveSession(session);
    onSprintFinish(session);
    onClose();
  };

  if (!isOpen) return null;

  const currentWords = calculateWordCount(content);
  const wordsAdded = Math.max(0, currentWords - wordsBefore);
  const progressPercent = goalType === 'time'
    ? Math.min(100, Math.round((elapsedSeconds / (goalTarget * 60)) * 100))
    : Math.min(100, Math.round((wordsAdded / goalTarget) * 100));

  // Time & Countdown Display Formatter
  const formatTimerDisplay = () => {
    if (timerDisplayMode === 'countdown' && goalType === 'time') {
      const targetSecs = goalTarget * 60;
      const remainingSecs = targetSecs - elapsedSeconds;
      if (remainingSecs >= 0) {
        const m = Math.floor(remainingSecs / 60);
        const s = remainingSecs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s} remaining`;
      } else {
        const overSecs = Math.abs(remainingSecs);
        const m = Math.floor(overSecs / 60);
        const s = overSecs % 60;
        return `+${m}:${s < 10 ? '0' : ''}${s} extra`;
      }
    } else {
      const m = Math.floor(elapsedSeconds / 60);
      const s = elapsedSeconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s} elapsed`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-[#f4f4f5] flex flex-col overflow-hidden animate-in fade-in duration-200 select-none">
      
      {/* Milestone Toast */}
      {milestoneToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-amber-500 text-black font-extrabold text-xs shadow-2xl animate-in fade-in slide-in-from-top-4">
          {milestoneToast}
        </div>
      )}

      {/* Focus Protection Exited Warning Modal */}
      {fullscreenExited && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="p-8 rounded-2xl bg-[#121218] border border-amber-500/40 text-center max-w-md space-y-4 shadow-2xl animate-in zoom-in-95">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Fullscreen Mode Exited</h3>
            <p className="text-xs text-[#8e8ea0] leading-relaxed">
              Your writing progress is auto-saved locally. Timer is paused while in break menu.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleFinishSprint}
                className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] text-xs font-bold hover:text-white"
              >
                End &amp; View Stats
              </button>
              <button
                onClick={resumeFullscreen}
                className="px-5 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-600 shadow-xl"
              >
                Resume Sprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Header Stats Bar */}
      <div className="px-8 py-3.5 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-400" /> Ch {chapterNumber}
          </span>
          <span className="text-[#52526b]">|</span>
          <h2 className="font-bold text-white text-sm truncate max-w-xs">{chapterTitle || `Chapter ${chapterNumber}`}</h2>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-4 max-w-md flex-1 mx-8">
          <div className="flex-1 bg-[#181820] h-2 rounded-full overflow-hidden border border-[#232334]">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="font-mono text-[11px] text-amber-400 font-bold w-12 text-right">{progressPercent}%</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Clickable Timer Mode Switcher */}
          <button
            onClick={() => setTimerDisplayMode(prev => prev === 'countdown' ? 'elapsed' : 'countdown')}
            className="flex items-center gap-1.5 font-mono text-xs font-bold text-white bg-[#181820] hover:bg-[#232334] px-3 py-1 rounded-lg border border-[#232334] transition-all cursor-pointer"
            title="Click to toggle between Countdown & Elapsed Time"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" /> {formatTimerDisplay()}
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
            <span>+{wordsAdded} words</span>
          </div>

          <button
            onClick={handleFinishSprint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:from-amber-600 hover:to-orange-700 shadow-xl transition-all"
          >
            Finish Sprint
          </button>
        </div>
      </div>

      {/* Main Writing Canvas */}
      <div className="flex-1 overflow-y-auto p-8 md:p-16 flex justify-center selection:bg-amber-500/30">
        <div className="w-full max-w-3xl space-y-4">
          <textarea
            ref={textareaRef}
            value={content}
            onKeyDown={handleKeyDown}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write continuously..."
            className="w-full h-[82vh] bg-transparent text-[#f4f4f5] text-base md:text-lg leading-relaxed focus:outline-none resize-none font-serif tracking-wide opacity-100"
          />
        </div>
      </div>

    </div>
  );
}
