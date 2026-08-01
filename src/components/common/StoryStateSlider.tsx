'use client';

import React from 'react';
import { History, Play, Sliders } from 'lucide-react';

interface StoryStateSliderProps {
  currentChapter: number;
  totalChapters: number;
  onChapterChange: (chapterNum: number) => void;
}

export function StoryStateSlider({
  currentChapter,
  totalChapters,
  onChapterChange
}: StoryStateSliderProps) {
  if (totalChapters <= 1) return null;

  return (
    <div className="p-4 rounded-2xl bg-[#0c0c10] border border-[#7c3aed]/40 shadow-xl space-y-2 select-none">
      <div className="flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2 text-[#a78bfa]">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Living Story State Reconstruction</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] border border-amber-500/30">
          Reconstructed as of Chapter {currentChapter} / {totalChapters}
        </span>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <span className="text-[10px] font-mono font-bold text-[#8e8ea0]">Ch. 1</span>
        <input
          type="range"
          min={1}
          max={Math.max(1, totalChapters)}
          value={currentChapter}
          onChange={(e) => onChapterChange(parseInt(e.target.value))}
          className="flex-1 accent-amber-500 h-2 bg-[#181820] rounded-lg cursor-pointer border border-[#232334]"
        />
        <span className="text-[10px] font-mono font-bold text-[#8e8ea0]">Ch. {totalChapters}</span>
      </div>
    </div>
  );
}
