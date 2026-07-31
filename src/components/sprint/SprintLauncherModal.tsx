'use client';

import React, { useState, useEffect } from 'react';
import { X, Flame, Clock, Target, BookOpen, Sparkles, Sliders, Zap } from 'lucide-react';
import { repository } from '@/lib/store/repository';
import { Book, Chapter } from '@/types';

interface SprintLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSprint: (config: {
    bookId: string;
    chapterId: string;
    goalType: 'time' | 'words';
    goalTarget: number;
    focusMode: boolean;
    typewriterMode: boolean;
    theme: string;
  }) => void;
  defaultBookId?: string;
  defaultChapterId?: string;
}

export function SprintLauncherModal({
  isOpen,
  onClose,
  onStartSprint,
  defaultBookId,
  defaultChapterId
}: SprintLauncherModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [selectedBookId, setSelectedBookId] = useState(defaultBookId || '');
  const [selectedChapterId, setSelectedChapterId] = useState(defaultChapterId || '');

  const [goalType, setGoalType] = useState<'time' | 'words'>('time');
  const [timePreset, setTimePreset] = useState<number>(25); // 25 min default
  const [customTime, setCustomTime] = useState('');

  const [wordPreset, setWordPreset] = useState<number>(500); // 500 words default
  const [customWord, setCustomWord] = useState('');

  const [focusMode, setFocusMode] = useState(true);
  const [typewriterMode, setTypewriterMode] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (!isOpen) return;
    repository.getBooks().then((bList) => {
      setBooks(bList);
      const activeB = defaultBookId || (bList.length > 0 ? bList[0].id : '');
      setSelectedBookId(activeB);

      if (activeB) {
        repository.getChapters(activeB).then((cList) => {
          setChapters(cList);
          const activeC = defaultChapterId || (cList.length > 0 ? cList[0].id : '');
          setSelectedChapterId(activeC);
        });
      }
    });
  }, [isOpen, defaultBookId, defaultChapterId]);

  const handleBookChange = async (bId: string) => {
    setSelectedBookId(bId);
    const cList = await repository.getChapters(bId);
    setChapters(cList);
    if (cList.length > 0) setSelectedChapterId(cList[0].id);
  };

  if (!isOpen) return null;

  const getFinalTarget = () => {
    if (goalType === 'time') {
      return timePreset === -1 ? (parseInt(customTime) || 25) : timePreset;
    } else {
      return wordPreset === -1 ? (parseInt(customWord) || 500) : wordPreset;
    }
  };

  const handleLaunch = () => {
    if (!selectedBookId || !selectedChapterId) return;

    onStartSprint({
      bookId: selectedBookId,
      chapterId: selectedChapterId,
      goalType,
      goalTarget: getFinalTarget(),
      focusMode,
      typewriterMode,
      theme
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                Sprint Mode 2.0 Launcher
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Offline First
                </span>
              </h2>
              <p className="text-xs text-[#8e8ea0] mt-0.5">
                Set targets, eliminate all distractions, and write consistently without AI interruptions.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8e8ea0] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* Target Selection: Book & Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px]">Select Book</label>
              <select
                value={selectedBookId}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px]">Target Chapter</label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white"
              >
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>Ch {c.chapterNumber}: {c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Goal Type Switcher */}
          <div className="space-y-3 pt-2 border-t border-[#232334]">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white text-xs flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" /> Sprint Goal Metric
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGoalType('time')}
                className={`py-2.5 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  goalType === 'time'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#181820] border-[#232334] text-[#8e8ea0] hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" /> Time Duration Goal
              </button>

              <button
                type="button"
                onClick={() => setGoalType('words')}
                className={`py-2.5 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  goalType === 'words'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#181820] border-[#232334] text-[#8e8ea0] hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Word Target Goal
              </button>
            </div>

            {/* Time Presets */}
            {goalType === 'time' && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 25, 30, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimePreset(mins)}
                      className={`py-2 rounded-lg border font-mono font-bold transition-all ${
                        timePreset === mins
                          ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                          : 'bg-[#181820] border-[#232334] text-[#8e8ea0] hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTimePreset(-1)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold ${
                      timePreset === -1 ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-[#181820] text-[#8e8ea0] border-[#232334]'
                    }`}
                  >
                    Custom Minutes:
                  </button>
                  {timePreset === -1 && (
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-24 bg-[#181820] border border-[#232334] rounded-lg px-2.5 py-1 text-center text-white font-mono"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Word Presets */}
            {goalType === 'words' && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {[250, 500, 1000, 2000].map(words => (
                    <button
                      key={words}
                      type="button"
                      onClick={() => setWordPreset(words)}
                      className={`py-2 rounded-lg border font-mono font-bold transition-all ${
                        wordPreset === words
                          ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                          : 'bg-[#181820] border-[#232334] text-[#8e8ea0] hover:text-white'
                      }`}
                    >
                      {words}w
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWordPreset(-1)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold ${
                      wordPreset === -1 ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-[#181820] text-[#8e8ea0] border-[#232334]'
                    }`}
                  >
                    Custom Words:
                  </button>
                  {wordPreset === -1 && (
                    <input
                      type="number"
                      placeholder="e.g. 750"
                      value={customWord}
                      onChange={(e) => setCustomWord(e.target.value)}
                      className="w-28 bg-[#181820] border border-[#232334] rounded-lg px-2.5 py-1 text-center text-white font-mono"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preferences Toggles */}
          <div className="pt-4 border-t border-[#232334] space-y-3">
            <h4 className="font-bold text-white text-xs">Writing Environment Modes</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#181820] border border-[#232334] cursor-pointer">
                <input
                  type="checkbox"
                  checked={focusMode}
                  onChange={(e) => setFocusMode(e.target.checked)}
                  className="w-4 h-4 rounded text-[#7c3aed] bg-[#0c0c10]"
                />
                <div>
                  <div className="font-bold text-white text-xs">Focus Mode</div>
                  <div className="text-[10px] text-[#8e8ea0]">Highlight active paragraph</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#181820] border border-[#232334] cursor-pointer">
                <input
                  type="checkbox"
                  checked={typewriterMode}
                  onChange={(e) => setTypewriterMode(e.target.checked)}
                  className="w-4 h-4 rounded text-[#7c3aed] bg-[#0c0c10]"
                />
                <div>
                  <div className="font-bold text-white text-xs">Typewriter Scrolling</div>
                  <div className="text-[10px] text-[#8e8ea0]">Keep cursor centered</div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Footer Launch Action */}
        <div className="px-6 py-4 border-t border-[#232334] bg-[#0c0c10] flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] font-bold text-xs hover:text-white">
            Cancel
          </button>

          <button
            onClick={handleLaunch}
            disabled={!selectedBookId || !selectedChapterId}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:from-amber-600 hover:to-orange-700 shadow-xl transition-all disabled:opacity-40"
          >
            <Flame className="w-4 h-4" /> Enter Sprint Mode ({goalType === 'time' ? `${getFinalTarget()}m` : `${getFinalTarget()}w`})
          </button>
        </div>

      </div>
    </div>
  );
}
