import React from 'react';
import { Chapter } from '@/types';
import { Sparkles, CheckSquare, Eye, RotateCcw } from 'lucide-react';

/**
 * Props for the ChapterStatusBar component.
 */
export interface ChapterStatusBarProps {
  currentWordCount: number;
  currentReadingTime: number;
  activeChapter: Chapter;
  isAnalyzing: boolean;
  batchAnalyzing: boolean;
  content: string;
  onRunAIAnalysis: () => void;
  onOpenPendingReview: () => void;
}

/**
 * Status bar showing word count, reading time, and status actions for the active chapter.
 */
export function ChapterStatusBar({
  currentWordCount,
  currentReadingTime,
  activeChapter,
  isAnalyzing,
  batchAnalyzing,
  content,
  onRunAIAnalysis,
  onOpenPendingReview,
}: ChapterStatusBarProps) {
  return (
    <div className="px-6 py-2 bg-[#09090b] border-b border-[#232334] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8e8ea0]">
      <div className="flex items-center gap-4">
        <span>Word Count: <strong className="text-white font-mono">{currentWordCount}</strong></span>
        <span>Reading Time: <strong className="text-white font-mono">{currentReadingTime} min</strong></span>
      </div>

      <div className="flex items-center gap-3">
        <span>Status:</span>
        <span
          className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
            activeChapter.status === 'Analyzed'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : activeChapter.status === 'Pending Review'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-[#1e1e2a] text-[#8e8ea0]'
          }`}
        >
          {activeChapter.status}
        </span>

        {/* Analyze Chapter CTA in sub-header when Unprocessed */}
        {activeChapter.status === 'Unprocessed' && (
          <button
            onClick={onRunAIAnalysis}
            disabled={isAnalyzing || batchAnalyzing || !content.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] hover:bg-[#7c3aed] hover:text-white font-bold text-[11px] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" /> Analyze with AI
          </button>
        )}

        {/* Clickable Review & Approve Button when Pending Review */}
        {activeChapter.status === 'Pending Review' && (
          <button
            onClick={onOpenPendingReview}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] transition-all shadow-lg animate-pulse"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Review &amp; Approve Now
          </button>
        )}

        {/* View Receipt & Re-extract Buttons for Analyzed Chapters */}
        {activeChapter.status === 'Analyzed' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPendingReview}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#181820] hover:bg-[#1e1e2a] border border-[#232334] text-[#a78bfa] font-bold text-[11px] transition-all"
              title="View Extraction Receipt"
            >
              <Eye className="w-3.5 h-3.5" /> View Analysis Receipt
            </button>

            <button
              onClick={onRunAIAnalysis}
              disabled={isAnalyzing || batchAnalyzing || !content.trim()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition-all disabled:opacity-50"
              title="Re-extract chapter text with AI to generate a fresh receipt"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-extract
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
