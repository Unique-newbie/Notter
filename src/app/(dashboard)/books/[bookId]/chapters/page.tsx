'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Chapter, AIExtraction } from '@/types';
import { BookOpen, Plus, Trash2, Sparkles, RefreshCw, CheckCircle2, Check, AlertTriangle, Play, FileJson, Copy, X, CheckSquare, Eye } from 'lucide-react';
import { AIReviewModal } from '@/components/ai/AIReviewModal';
import { calculateWordCount, calculateReadingTime } from '@/lib/utils';
import { SYSTEM_EXTRACTION_PROMPT } from '@/lib/ai/prompt';
import { validateAndCleanExtraction } from '@/lib/ai/validator';

export default function ChaptersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialChapterId = searchParams.get('id');

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  // Editor Fields
  const [title, setTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [saveToast, setSaveToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Manual JSON Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [copiedFullPrompt, setCopiedFullPrompt] = useState(false);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<AIExtraction | null>(null);

  const selectChapter = (chap: Chapter) => {
    setActiveChapter(chap);
    setTitle(chap.title);
    setChapterNumber(chap.chapterNumber);
    setContent(chap.content);
    setSaveStatus('saved');
  };

  const refreshChapters = useCallback(async (targetChapterId?: string) => {
    const list = await repository.getChapters(bookId);
    setChapters(list);

    if (list.length > 0) {
      const preferredId = targetChapterId || activeChapter?.id || initialChapterId;
      const selected = list.find(c => c.id === preferredId) || list[0];
      selectChapter(selected);
    }
  }, [bookId, initialChapterId, activeChapter?.id]);

  useEffect(() => {
    refreshChapters();
    const handleDataChanged = async () => {
      const list = await repository.getChapters(bookId);
      setChapters(list);
      if (activeChapter) {
        const freshActive = list.find(c => c.id === activeChapter.id);
        if (freshActive) {
          setActiveChapter(freshActive);
        }
      }
    };
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId, refreshChapters]);

  const handleCreateChapter = async () => {
    const newChap = await repository.createChapter(bookId, `Chapter ${chapters.length + 1}`, '');
    if (newChap) {
      const list = await repository.getChapters(bookId);
      setChapters(list);
      selectChapter(newChap);
    }
  };

  const handleDeleteChapter = async (id: string, chapTitle: string) => {
    if (confirm(`Delete "${chapTitle}"?`)) {
      await repository.deleteChapter(id);
      const remaining = await repository.getChapters(bookId);
      setChapters(remaining);
      if (remaining.length > 0) {
        selectChapter(remaining[0]);
      } else {
        setActiveChapter(null);
      }
    }
  };

  const handleSaveContent = async () => {
    if (!activeChapter) return;
    setSaveStatus('saving');
    await repository.updateChapter(activeChapter.id, {
      title,
      chapterNumber,
      content
    });
    setSaveStatus('saved');
    setSaveToast('Chapter saved to Story Bible!');
    setTimeout(() => setSaveToast(''), 2500);
  };

  // Auto-save on content change with 800ms debounce
  useEffect(() => {
    if (!activeChapter) return;
    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      handleSaveContent();
    }, 800);

    return () => clearTimeout(timer);
  }, [content, title, chapterNumber]);

  // Open review modal for existing pending extraction
  const handleOpenPendingReview = async (chapId?: string) => {
    const targetId = chapId || activeChapter?.id;
    if (!targetId) return;
    await repository.updateChapter(targetId, { status: 'Analyzed' });
    setSaveToast('Chapter status updated to Analyzed.');
    setTimeout(() => setSaveToast(''), 3000);
    refreshChapters(targetId);
  };

  const handleRunAIAnalysis = async (targetChapter?: Chapter) => {
    const chapToAnalyze = targetChapter || activeChapter;
    if (!chapToAnalyze || !chapToAnalyze.content.trim()) {
      setErrorToast('Chapter text is empty. Please enter text before analyzing.');
      setTimeout(() => setErrorToast(''), 3500);
      return;
    }

    if (!targetChapter) await handleSaveContent();
    setIsAnalyzing(true);
    setErrorToast('');

    try {
      const res = await fetch('/api/analyze-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterText: chapToAnalyze.content,
          chapterTitle: chapToAnalyze.title,
          chapterNumber: chapToAnalyze.chapterNumber
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errorMsg = data.error || (data.validationErrors ? data.validationErrors.join(', ') : 'Extraction failed');
        setErrorToast(errorMsg);
        setTimeout(() => setErrorToast(''), 5000);
        return;
      }

      if (data.extraction) {
        const draft = await repository.saveDraftExtraction(bookId, chapToAnalyze.id, data.extraction);
        setCurrentDraft(draft);
        setReviewModalOpen(true);
      }
    } catch (err: any) {
      console.error("AI Extraction Error:", err);
      setErrorToast(err.message || 'Failed to connect to AI engine.');
      setTimeout(() => setErrorToast(''), 5000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Process All Unprocessed Chapters Batch Action
  const handleProcessAllUnprocessed = async () => {
    const unprocessed = chapters.filter(c => c.status === 'Unprocessed' && c.content.trim().length > 0);
    if (unprocessed.length === 0) {
      setSaveToast('All chapters are already processed!');
      setTimeout(() => setSaveToast(''), 2500);
      return;
    }

    setBatchAnalyzing(true);
    setErrorToast('');

    for (let i = 0; i < unprocessed.length; i++) {
      const chap = unprocessed[i];
      setBatchProgress(`Processing Chapter ${chap.chapterNumber} (${i + 1}/${unprocessed.length})...`);
      await handleRunAIAnalysis(chap);
    }

    setBatchAnalyzing(false);
    setBatchProgress('');
    setSaveToast(`Finished analyzing ${unprocessed.length} unprocessed chapters!`);
    setTimeout(() => setSaveToast(''), 3000);
  };

  // Copy Full System Prompt + Chapter Text
  const handleCopyFullPromptAndChapter = () => {
    if (!activeChapter) return;
    const fullText = `${SYSTEM_EXTRACTION_PROMPT}

Chapter Title: ${title || `Chapter ${chapterNumber}`}

Chapter Text:
"""
${content}
"""`;
    navigator.clipboard.writeText(fullText);
    setCopiedFullPrompt(true);
    setTimeout(() => setCopiedFullPrompt(false), 2500);
  };

  // Validate and Import Manually Pasted Raw JSON
  const handleImportRawJson = async (directApprove: boolean = false) => {
    if (!activeChapter || !rawJsonInput.trim()) return;

    const existingCharacters = (await repository.getCharacters(bookId)).map(c => c.name);
    const existingAbilities = (await repository.getAbilities(bookId)).map(a => a.name);
    const existingItems = (await repository.getItems(bookId)).map(i => i.name);
    const existingLocations = (await repository.getLocations(bookId)).map(l => l.name);

    const validation = validateAndCleanExtraction(rawJsonInput, content, {
      characters: existingCharacters,
      abilities: existingAbilities,
      items: existingItems,
      locations: existingLocations,
      organizations: []
    });

    if (!validation.valid) {
      setErrorToast(validation.errors.join(' | '));
      setTimeout(() => setErrorToast(''), 5000);
      return;
    }

    if (validation.data) {
      const draft = await repository.saveDraftExtraction(bookId, activeChapter.id, validation.data);
      
      if (draft && directApprove) {
        const approved = await repository.approveExtraction(draft.id, validation.data);
        if (approved) {
          setImportModalOpen(false);
          setRawJsonInput('');
          setSaveToast('Extracted JSON approved and saved to database!');
          setTimeout(() => setSaveToast(''), 3000);
          await refreshChapters(activeChapter.id);
        } else {
          setErrorToast('Failed to approve extraction.');
          setTimeout(() => setErrorToast(''), 3000);
        }
      } else if (draft) {
        setCurrentDraft(draft);
        setImportModalOpen(false);
        setRawJsonInput('');
        setReviewModalOpen(true);
      }
    }
  };

  const currentWordCount = calculateWordCount(content);
  const currentReadingTime = calculateReadingTime(currentWordCount);
  const unprocessedCount = chapters.filter(c => c.status === 'Unprocessed' && c.content.trim().length > 0).length;

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-6 max-w-7xl mx-auto relative">
      
      {/* Toast Notifications */}
      {saveToast && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 max-w-md shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Left Chapter List Sidebar */}
      <div className="w-80 bg-[#121218] border border-[#232334] rounded-xl flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-[#232334] bg-[#0c0c10] space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#7c3aed]" /> Chapters ({chapters.length})
            </div>
            <button
              onClick={handleCreateChapter}
              className="p-1.5 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
              title="Add New Chapter"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Batch Process All Unprocessed Button */}
          {unprocessedCount > 0 && (
            <button
              onClick={handleProcessAllUnprocessed}
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
                  onClick={() => selectChapter(chap)}
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
                      handleDeleteChapter(chap.id, chap.title);
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

      {/* Right Chapter Editor & Analysis Panel */}
      {activeChapter ? (
        <div className="flex-1 bg-[#121218] border border-[#232334] rounded-xl flex flex-col overflow-hidden">
          
          {/* Header Control Bar */}
          <div className="p-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <input
                type="number"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                className="w-16 bg-[#181820] border border-[#232334] rounded-lg px-2.5 py-1 text-center font-bold text-xs text-[#a78bfa] focus:outline-none focus:border-[#7c3aed]"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter Title..."
                className="flex-1 bg-[#181820] border border-[#232334] rounded-lg px-3.5 py-1 text-sm font-bold text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Save Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-[#8e8ea0] mr-2">
                {saveStatus === 'saving' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#a78bfa]" />}
                {saveStatus === 'saved' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                <span className={saveStatus === 'saved' ? 'text-emerald-400 font-semibold' : 'text-[#8e8ea0]'}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
                </span>
              </div>

              {/* Copy Full Prompt Button */}
              <button
                onClick={handleCopyFullPromptAndChapter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs font-semibold text-[#a78bfa] hover:text-white hover:border-[#7c3aed]/40 transition-all"
                title="Copy System Prompt + Chapter Text to paste into Gemini Web"
              >
                {copiedFullPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFullPrompt ? 'Copied Prompt!' : 'Copy Prompt'}
              </button>

              {/* Import Raw JSON Button */}
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs font-semibold text-[#06b6d4] hover:text-white hover:border-[#06b6d4]/40 transition-all"
                title="Paste raw JSON extracted manually from Gemini Web"
              >
                <FileJson className="w-3.5 h-3.5" /> Import JSON
              </button>

              <button
                onClick={() => handleRunAIAnalysis()}
                disabled={isAnalyzing || batchAnalyzing || !content.trim()}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold transition-all shadow-purple disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Analyze Chapter with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub-Header Stats & Status Bar */}
          <div className="px-6 py-2 bg-[#09090b] border-b border-[#232334] flex items-center justify-between text-xs text-[#8e8ea0]">
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

              {/* Clickable Review & Approve Button when Pending Review */}
              {activeChapter.status === 'Pending Review' && (
                <button
                  onClick={() => handleOpenPendingReview()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] transition-all shadow-lg animate-pulse"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Review & Approve Now
                </button>
              )}

              {/* View Receipt Button for Analyzed Chapters */}
              {activeChapter.status === 'Analyzed' && (
                <button
                  onClick={() => handleOpenPendingReview()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#181820] hover:bg-[#1e1e2a] border border-[#232334] text-[#a78bfa] font-bold text-[11px] transition-all"
                  title="View Extraction Receipt"
                >
                  <Eye className="w-3.5 h-3.5" /> View Analysis Receipt
                </button>
              )}
            </div>
          </div>

          {/* Text Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw chapter text here..."
              className="w-full h-full bg-transparent text-[#f4f4f5] text-sm leading-relaxed focus:outline-none resize-none font-sans"
            />
          </div>

        </div>
      ) : (
        <div className="flex-1 bg-[#121218] border border-[#232334] rounded-xl flex items-center justify-center text-[#8e8ea0] text-xs">
          Select or create a chapter to begin editing.
        </div>
      )}

      {/* Import Raw JSON Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#121218] border border-[#232334] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <FileJson className="w-5 h-5 text-[#06b6d4]" /> Import Raw Extracted JSON
              </h2>
              <button onClick={() => setImportModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#a1a1aa] leading-relaxed">
                Paste JSON extracted manually from Gemini Web, ChatGPT, or Claude. Click <strong>Directly Approve & Save</strong> to instantly create entities and mark as Analyzed!
              </p>

              <textarea
                rows={10}
                placeholder='Paste raw JSON here e.g. { "summary": "...", "characters": [] }'
                value={rawJsonInput}
                onChange={(e) => setRawJsonInput(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#06b6d4]"
              />

              <div className="flex items-center justify-between pt-2 border-t border-[#232334]">
                <button
                  type="button"
                  onClick={handleCopyFullPromptAndChapter}
                  className="flex items-center gap-1.5 text-xs text-[#a78bfa] hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy System Prompt + Chapter Text
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleImportRawJson(false)}
                    disabled={!rawJsonInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] hover:text-white font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review First
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImportRawJson(true)}
                    disabled={!rawJsonInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-purple disabled:opacity-50"
                  >
                    <CheckSquare className="w-4 h-4" /> Directly Approve & Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Human Review Screen Modal */}
      <AIReviewModal
        isOpen={reviewModalOpen}
        extractionDraft={currentDraft}
        onClose={() => setReviewModalOpen(false)}
        onApproved={() => {
          refreshChapters(activeChapter?.id);
        }}
      />
    </div>
  );
}
