'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Chapter, AIExtraction } from '@/types';
import { BookOpen, Plus, Trash2, Sparkles, RefreshCw, CheckCircle2, Check, AlertTriangle, Play, FileJson, Copy, X, CheckSquare, Eye, Maximize2, Flame, RotateCcw } from 'lucide-react';
import { AIReviewModal } from '@/components/ai/AIReviewModal';
import { ZenWritingPad } from '@/components/editor/ZenWritingPad';
import { SprintLauncherModal } from '@/components/sprint/SprintLauncherModal';
import { SprintModePad } from '@/components/sprint/SprintModePad';
import { sprintStore } from '@/lib/store/sprintStore';
import { calculateWordCount, calculateReadingTime } from '@/lib/utils';
import { SYSTEM_EXTRACTION_PROMPT } from '@/lib/ai/prompt';
import { validateAndCleanExtraction } from '@/lib/ai/validator';

import { ChapterSidebar } from '@/components/chapters/ChapterSidebar';
import { ChapterEditorHeader } from '@/components/chapters/ChapterEditorHeader';
import { ChapterStatusBar } from '@/components/chapters/ChapterStatusBar';
import { ImportJsonModal } from '@/components/chapters/ImportJsonModal';

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

  // Refs to hold latest editor state without causing callback recreation
  const loadedChapterIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorStateRef = useRef({ title: '', chapterNumber: 1, content: '' });
  const activeChapterRef = useRef<Chapter | null>(null);
  const isSwitchingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { editorStateRef.current = { title, chapterNumber, content }; }, [title, chapterNumber, content]);
  useEffect(() => { activeChapterRef.current = activeChapter; }, [activeChapter]);

  // Zen & Sprint Mode State
  const [zenPadOpen, setZenPadOpen] = useState(false);
  const [sprintLauncherOpen, setSprintLauncherOpen] = useState(false);
  const [activeSprintConfig, setActiveSprintConfig] = useState<any | null>(null);

  // Manual JSON Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [copiedFullPrompt, setCopiedFullPrompt] = useState(false);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<AIExtraction | null>(null);

  // Stable selectChapter — reads latest editor state from refs, never causes re-creation
  const selectChapter = useCallback(async (chap: Chapter) => {
    if (isSwitchingRef.current) return;
    isSwitchingRef.current = true;

    try {
      // Flush pending auto-save for the PREVIOUS chapter using refs
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
        const prev = activeChapterRef.current;
        if (prev && loadedChapterIdRef.current === prev.id) {
          const s = editorStateRef.current;
          await repository.updateChapter(prev.id, {
            title: s.title,
            chapterNumber: s.chapterNumber,
            content: s.content
          });
        }
      }

      loadedChapterIdRef.current = chap.id;
      setActiveChapter(chap);
      setTitle(chap.title);
      setChapterNumber(chap.chapterNumber);
      setContent(chap.content);
      setSaveStatus('saved');
    } finally {
      isSwitchingRef.current = false;
    }
  }, []); // No dependencies — reads from refs

  // Stable refreshChapters — only depends on bookId (primitive) and stable selectChapter
  const refreshChapters = useCallback(async (targetChapterId?: string) => {
    const list = await repository.getChapters(bookId);
    setChapters(list);

    if (list.length > 0) {
      const preferredId = targetChapterId || loadedChapterIdRef.current || initialChapterId;
      const selected = list.find(c => c.id === preferredId) || list[0];
      await selectChapter(selected);
    } else {
      setActiveChapter(null);
      loadedChapterIdRef.current = null;
    }
  }, [bookId, initialChapterId, selectChapter]);

  // Initial load — runs only when bookId changes
  useEffect(() => {
    refreshChapters();
    const handleDataChanged = async () => {
      const list = await repository.getChapters(bookId);
      setChapters(list);
    };
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId, refreshChapters]);

  const handleCreateChapter = async () => {
    // Flush current chapter first
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
      const prev = activeChapterRef.current;
      if (prev && loadedChapterIdRef.current === prev.id) {
        const s = editorStateRef.current;
        await repository.updateChapter(prev.id, {
          title: s.title,
          chapterNumber: s.chapterNumber,
          content: s.content
        });
      }
    }

    const newChap = await repository.createChapter(bookId, `Chapter ${chapters.length + 1}`, '');
    if (newChap) {
      const list = await repository.getChapters(bookId);
      setChapters(list);
      await selectChapter(newChap);
    }
  };

  const handleDeleteChapter = async (id: string, chapTitle: string) => {
    if (confirm(`Delete "${chapTitle}"?`)) {
      await repository.deleteChapter(id);
      const remaining = await repository.getChapters(bookId);
      setChapters(remaining);
      if (remaining.length > 0) {
        await selectChapter(remaining[0]);
      } else {
        setActiveChapter(null);
        loadedChapterIdRef.current = null;
      }
    }
  };

  const handleSaveContent = useCallback(async () => {
    const ac = activeChapterRef.current;
    if (!ac || loadedChapterIdRef.current !== ac.id) return;
    setSaveStatus('saving');
    const s = editorStateRef.current;
    await repository.updateChapter(ac.id, {
      title: s.title,
      chapterNumber: s.chapterNumber,
      content: s.content
    });

    // Update the activeChapter object in place so dirty-check doesn't re-trigger
    setActiveChapter(prev => prev ? { ...prev, title: s.title, chapterNumber: s.chapterNumber, content: s.content } : prev);
    setSaveStatus('saved');
  }, []);

  // Safe Auto-save on content change with 1000ms debounce
  useEffect(() => {
    if (!activeChapter || loadedChapterIdRef.current !== activeChapter.id) return;
    if (isSwitchingRef.current) return;
    
    // Check if content actually modified from activeChapter baseline
    if (
      content === activeChapter.content &&
      title === activeChapter.title &&
      chapterNumber === activeChapter.chapterNumber
    ) {
      return;
    }

    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveContent();
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, title, chapterNumber, activeChapter, handleSaveContent]);

  // Open review modal for existing pending or approved extraction draft
  const handleOpenPendingReview = async (chapId?: string) => {
    const targetId = chapId || activeChapter?.id;
    if (!targetId) return;

    const draft = await repository.getExtractionForChapter(targetId);
    if (draft) {
      setCurrentDraft(draft);
      setReviewModalOpen(true);
    } else {
      setErrorToast('No extraction receipt found for this chapter.');
      setTimeout(() => setErrorToast(''), 3500);
    }
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
      const percent = Math.round(((i + 1) / unprocessed.length) * 100);
      setBatchProgress(`Processing Chapter ${chap.chapterNumber} (${i + 1}/${unprocessed.length} - ${percent}%)...`);
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
        const approved = await repository.approveExtraction(draft.id);
        if (approved) {
          setImportModalOpen(false);
          setRawJsonInput('');
          setSaveToast('Extracted JSON approved and saved to database!');
          setTimeout(() => setSaveToast(''), 3000);
          setActiveChapter(prev => prev ? { ...prev, status: 'Analyzed' } : prev);
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

  const handlePurgeChapterAnalysis = async () => {
    if (!activeChapter) return;
    if (confirm(`Purge analysis receipt for "${activeChapter.title}" and reset status to Unprocessed?`)) {
      await repository.purgeChapterAnalysisData(activeChapter.id);
      setActiveChapter(prev => prev ? { ...prev, status: 'Unprocessed' } : prev);
      setSaveToast('Chapter analysis data purged.');
      setTimeout(() => setSaveToast(''), 3000);
      await refreshChapters(activeChapter.id);
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

      <ChapterSidebar
        chapters={chapters}
        activeChapter={activeChapter}
        unprocessedCount={unprocessedCount}
        batchAnalyzing={batchAnalyzing}
        isAnalyzing={isAnalyzing}
        batchProgress={batchProgress}
        onSelectChapter={selectChapter}
        onCreateChapter={handleCreateChapter}
        onDeleteChapter={handleDeleteChapter}
        onProcessAllUnprocessed={handleProcessAllUnprocessed}
      />

      {/* Right Chapter Editor & Analysis Panel */}
      {activeChapter ? (
        <div className="flex-1 bg-[#121218] border border-[#232334] rounded-xl flex flex-col overflow-hidden">
          
          <ChapterEditorHeader
            chapterNumber={chapterNumber}
            title={title}
            saveStatus={saveStatus}
            isAnalyzing={isAnalyzing}
            batchAnalyzing={batchAnalyzing}
            content={content}
            activeChapter={activeChapter}
            copiedFullPrompt={copiedFullPrompt}
            onChapterNumberChange={setChapterNumber}
            onTitleChange={setTitle}
            onRunAIAnalysis={() => handleRunAIAnalysis()}
            onImportJsonOpen={() => setImportModalOpen(true)}
            onCopyFullPrompt={handleCopyFullPromptAndChapter}
            onSprintModeOpen={() => setSprintLauncherOpen(true)}
            onZenPadOpen={() => setZenPadOpen(true)}
          />

          <ChapterStatusBar
            currentWordCount={currentWordCount}
            currentReadingTime={currentReadingTime}
            activeChapter={activeChapter}
            isAnalyzing={isAnalyzing}
            batchAnalyzing={batchAnalyzing}
            content={content}
            onRunAIAnalysis={() => handleRunAIAnalysis()}
            onOpenPendingReview={() => handleOpenPendingReview()}
            onPurgeChapterAnalysis={handlePurgeChapterAnalysis}
          />

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

      <ImportJsonModal
        isOpen={importModalOpen}
        rawJsonInput={rawJsonInput}
        setRawJsonInput={setRawJsonInput}
        onClose={() => setImportModalOpen(false)}
        onCopyFullPrompt={handleCopyFullPromptAndChapter}
        onImportRawJson={handleImportRawJson}
      />

      {/* Human Review Screen Modal */}
      <AIReviewModal
        isOpen={reviewModalOpen}
        extractionDraft={currentDraft}
        onClose={() => setReviewModalOpen(false)}
        onApproved={() => {
          refreshChapters(activeChapter?.id);
        }}
      />

      {/* Distraction-Free Full-Screen Writing Pad */}
      <ZenWritingPad
        isOpen={zenPadOpen}
        chapterTitle={title}
        chapterNumber={chapterNumber}
        initialContent={content}
        onSave={async (newContent) => {
          setContent(newContent);
          if (activeChapter) {
            await repository.updateChapter(activeChapter.id, { content: newContent });
          }
        }}
        onClose={() => {
          setZenPadOpen(false);
          refreshChapters(activeChapter?.id);
        }}
      />

      {/* Sprint Mode 2.0 Launcher Modal */}
      <SprintLauncherModal
        isOpen={sprintLauncherOpen}
        onClose={() => setSprintLauncherOpen(false)}
        onStartSprint={(cfg) => {
          setActiveSprintConfig(cfg);
          setSprintLauncherOpen(false);
        }}
        defaultBookId={bookId}
        defaultChapterId={activeChapter?.id}
      />

      {/* Active Fullscreen Sprint Pad */}
      {activeSprintConfig && (
        <SprintModePad
          isOpen={!!activeSprintConfig}
          bookId={activeSprintConfig.bookId}
          chapterId={activeSprintConfig.chapterId}
          chapterTitle={title}
          chapterNumber={chapterNumber}
          initialContent={content}
          goalType={activeSprintConfig.goalType}
          goalTarget={activeSprintConfig.goalTarget}
          focusMode={activeSprintConfig.focusMode}
          typewriterMode={activeSprintConfig.typewriterMode}
          theme={activeSprintConfig.theme}
          onSaveChapterContent={async (newText) => {
            setContent(newText);
            if (activeChapter) {
              await repository.updateChapter(activeChapter.id, { content: newText });
            }
          }}
          onSprintFinish={(completedSession) => {
            sprintStore.saveSession(completedSession);
            setActiveSprintConfig(null);
            setSaveToast(`Sprint Complete! ${completedSession.wordsAdded} words written (${completedSession.averageWpm} WPM)`);
            setTimeout(() => setSaveToast(''), 4000);
          }}
          onClose={() => setActiveSprintConfig(null)}
        />
      )}
    </div>
  );
}
