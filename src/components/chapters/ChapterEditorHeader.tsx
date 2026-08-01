import React from 'react';
import { Chapter } from '@/types';
import { RefreshCw, Check, Sparkles, RotateCcw, FileJson, Copy, Flame, Maximize2 } from 'lucide-react';

/**
 * Props for the ChapterEditorHeader component.
 */
export interface ChapterEditorHeaderProps {
  chapterNumber: number;
  title: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isAnalyzing: boolean;
  batchAnalyzing: boolean;
  content: string;
  activeChapter: Chapter;
  copiedFullPrompt: boolean;
  onChapterNumberChange: (num: number) => void;
  onTitleChange: (title: string) => void;
  onRunAIAnalysis: () => void;
  onImportJsonOpen: () => void;
  onCopyFullPrompt: () => void;
  onSprintModeOpen: () => void;
  onZenPadOpen: () => void;
}

/**
 * Header component for the chapter editor, containing inputs and action buttons.
 */
export function ChapterEditorHeader({
  chapterNumber,
  title,
  saveStatus,
  isAnalyzing,
  batchAnalyzing,
  content,
  activeChapter,
  copiedFullPrompt,
  onChapterNumberChange,
  onTitleChange,
  onRunAIAnalysis,
  onImportJsonOpen,
  onCopyFullPrompt,
  onSprintModeOpen,
  onZenPadOpen,
}: ChapterEditorHeaderProps) {
  return (
    <div className="p-3.5 border-b border-[#232334] bg-[#0c0c10] flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
        <input
          type="number"
          value={chapterNumber}
          onChange={(e) => onChapterNumberChange(parseInt(e.target.value) || 1)}
          className="w-14 bg-[#181820] border border-[#232334] rounded-lg px-2 py-1 text-center font-bold text-xs text-[#a78bfa] focus:outline-none focus:border-[#7c3aed]"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Chapter Title..."
          className="flex-1 bg-[#181820] border border-[#232334] rounded-lg px-3 py-1 text-sm font-bold text-white focus:outline-none focus:border-[#7c3aed] min-w-[120px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Save Status Indicator */}
        <div className="flex items-center gap-1 text-xs text-[#8e8ea0] mr-1">
          {saveStatus === 'saving' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#a78bfa]" />}
          {saveStatus === 'saved' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          <span className={saveStatus === 'saved' ? 'text-emerald-400 font-semibold' : 'text-[#8e8ea0]'}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
          </span>
        </div>

        {/* Main AI Extraction Button */}
        <button
          onClick={onRunAIAnalysis}
          disabled={isAnalyzing || batchAnalyzing || !content.trim()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-extrabold transition-all shadow-purple disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extracting...
            </>
          ) : activeChapter.status === 'Analyzed' ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" /> Re-extract
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Analyze Chapter with AI
            </>
          )}
        </button>

        {/* Import Raw JSON Button */}
        <button
          onClick={onImportJsonOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs font-semibold text-[#06b6d4] hover:text-white hover:border-[#06b6d4]/40 transition-all"
          title="Paste raw JSON extracted manually from Gemini Web"
        >
          <FileJson className="w-3.5 h-3.5" /> Import JSON
        </button>

        {/* Copy Full Prompt Button */}
        <button
          onClick={onCopyFullPrompt}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs font-semibold text-[#a78bfa] hover:text-white hover:border-[#7c3aed]/40 transition-all"
          title="Copy System Prompt + Chapter Text to paste into Gemini Web"
        >
          {copiedFullPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedFullPrompt ? 'Copied!' : 'Copy Prompt'}
        </button>

        {/* Start Sprint Mode Button */}
        <button
          onClick={onSprintModeOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 text-xs font-extrabold transition-all shadow-xl"
          title="Start Offline Sprint Writing Session"
        >
          <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-300" /> Sprint
        </button>

        {/* Zen Writing Pad Button */}
        <button
          onClick={onZenPadOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] hover:bg-[#7c3aed] hover:text-white text-xs font-bold transition-all shadow-purple"
          title="Open Zen Writing Pad"
        >
          <Maximize2 className="w-3.5 h-3.5" /> Zen Pad
        </button>
      </div>
    </div>
  );
}
