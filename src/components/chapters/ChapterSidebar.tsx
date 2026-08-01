import React from 'react';
import { Chapter } from '@/types';
import { BookOpen, Plus, Trash2, RefreshCw, Play } from 'lucide-react';

/**
 * Props for the ChapterSidebar component.
 */
export interface ChapterSidebarProps {
  chapters: Chapter[];
  activeChapter: Chapter | null;
  unprocessedCount: number;
  batchAnalyzing: boolean;
  isAnalyzing: boolean;
  batchProgress: string;
  onSelectChapter: (chap: Chapter) => void;
  onCreateChapter: () => void;
  onDeleteChapter: (id: string, title: string) => void;
  onProcessAllUnprocessed: () => void;
}

/**
 * Sidebar component that lists chapters, allows creating/deleting, and batch processing.
 */
export function ChapterSidebar({
  chapters,
  activeChapter,
  unprocessedCount,
  batchAnalyzing,
  isAnalyzing,
  batchProgress,
  onSelectChapter,
  onCreateChapter,
  onDeleteChapter,
  onProcessAllUnprocessed,
}: ChapterSidebarProps) {
  return (
    <div className="w-80 bg-[#121218] border border-[#232334] rounded-xl flex flex-col overflow-hidden shrink-0">
      <div className="p-4 border-b border-[#232334] bg-[#0c0c10] space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-bold text-white text-xs flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#7c3aed]" /> Chapters ({chapters.length})
          </div>
          <button
            onClick={onCreateChapter}
            className="p-1.5 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
            title="Add New Chapter"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Batch Process All Unprocessed Button */}
        {unprocessedCount > 0 && (
          <button
            onClick={onProcessAllUnprocessed}
            disabled={batchAnalyzing || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] hover:bg-[#7c3aed] hover:text-white transition-all text-xs font-bold disabled:opacity-50"
          >
            {batchAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {batchProgress || 'Analyzing...'}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Analyze All Unprocessed ({unprocessedCount})
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chapters.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8e8ea0]">
            No chapters yet. Click <strong className="text-white">+</strong> to add your first chapter.
          </div>
        ) : (
          chapters.map((chap) => {
            const isSelected = activeChapter?.id === chap.id;
            return (
              <div
                key={chap.id}
                onClick={() => onSelectChapter(chap)}
                className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#1e1e2a] border border-[#7c3aed]/40 text-white shadow-purple'
                    : 'text-[#a1a1aa] hover:bg-[#181820] hover:text-white'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-[#a78bfa] uppercase">Ch {chap.chapterNumber}</span>
                    <span className="font-bold text-xs truncate">{chap.title}</span>
                  </div>
                  <div className="text-[10px] text-[#8e8ea0] mt-0.5 flex items-center gap-2">
                    <span>{chap.wordCount} words</span>
                    <span>•</span>
                    <span
                      className={`font-semibold ${
                        chap.status === 'Analyzed' ? 'text-emerald-400' : chap.status === 'Pending Review' ? 'text-amber-400 font-bold underline' : 'text-[#8e8ea0]'
                      }`}
                    >
                      {chap.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChapter(chap.id, chap.title);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8e8ea0] hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
