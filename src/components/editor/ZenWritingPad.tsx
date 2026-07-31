'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Undo, Redo, Eye, Maximize2, Minimize2, Check, Save,
  Sparkles, AlignLeft, Sliders, Type
} from 'lucide-react';
import { calculateWordCount, calculateReadingTime } from '@/lib/utils';

interface ZenWritingPadProps {
  isOpen: boolean;
  chapterTitle: string;
  chapterNumber: number;
  initialContent: string;
  onSave: (newContent: string) => Promise<void>;
  onClose: () => void;
}

export function ZenWritingPad({
  isOpen,
  chapterTitle,
  chapterNumber,
  initialContent,
  onSave,
  onClose
}: ZenWritingPadProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [focusMode, setFocusMode] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [typewriterScroll, setTypewriterScroll] = useState(true);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(initialContent);
    setHistory([initialContent]);
    setHistoryIdx(0);
    setSaveStatus('saved');
  }, [initialContent, isOpen]);

  // Auto-save with 1000ms debounce
  useEffect(() => {
    if (!isOpen) return;
    setSaveStatus('unsaved');
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      await onSave(content);
      setSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, isOpen]);

  // Keyboard Shortcuts (Ctrl+S, Ctrl+F, Esc)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSaveStatus('saving');
        onSave(content).then(() => setSaveStatus('saved'));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFocusMode(prev => !prev);
      } else if (e.key === 'Escape') {
        if (zenMode) setZenMode(false);
        else handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, content, zenMode]);

  if (!isOpen) return null;

  const pushHistory = (newVal: string) => {
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(newVal);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
    setContent(newVal);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setContent(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setContent(history[nextIdx]);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    pushHistory(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 50);
  };

  const handleExit = () => {
    if (saveStatus === 'unsaved') {
      if (confirm('You have unsaved changes. Exit full-screen writing pad?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const wordCount = calculateWordCount(content);
  const charCount = content.length;
  const readingTime = calculateReadingTime(wordCount);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-[#f4f4f5] flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Controls Header (Hidden in Zen Mode) */}
      {!zenMode && (
        <div className="px-8 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-[#a78bfa] text-xs uppercase tracking-wider">Chapter {chapterNumber}</span>
            <span className="text-[#52526b]">|</span>
            <h2 className="font-bold text-white text-sm">{chapterTitle || `Chapter ${chapterNumber}`}</h2>
            
            <div className="ml-4 flex items-center gap-1.5 text-xs text-[#8e8ea0]">
              <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className={saveStatus === 'saved' ? 'text-emerald-400 font-semibold' : 'text-[#8e8ea0]'}>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Auto-Saved' : 'Unsaved'}
              </span>
            </div>
          </div>

          {/* Minimal Formatting Toolbar */}
          <div className="flex items-center gap-1 bg-[#181820] border border-[#232334] rounded-xl p-1">
            <button onClick={() => insertFormatting('**', '**')} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334]" title="Bold (Ctrl+B)">
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('*', '*')} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334]" title="Italic (Ctrl+I)">
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('# ')} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334]" title="Heading 1">
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('## ')} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334]" title="Heading 2">
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('- ')} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334]" title="Bullet List">
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('> ')} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334]" title="Quote Block">
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('\n---\n')} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334]" title="Horizontal Divider">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-4 bg-[#232334] mx-1" />
            <button onClick={handleUndo} disabled={historyIdx <= 0} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334] disabled:opacity-30" title="Undo">
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleRedo} disabled={historyIdx >= history.length - 1} className="p-1.5 rounded text-[#8e8ea0] hover:text-white hover:bg-[#232334] disabled:opacity-30" title="Redo">
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                focusMode ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-[#181820] text-[#a1a1aa] border-[#232334] hover:text-white'
              }`}
              title="Focus Mode (Spotlight paragraph)"
            >
              <Eye className="w-3.5 h-3.5" /> Focus Mode
            </button>

            <button
              onClick={() => setZenMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181820] border border-[#232334] text-[#a78bfa] hover:text-white text-xs font-semibold transition-all"
              title="Zen Mode (Hide all toolbars)"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Zen Mode
            </button>

            <button
              onClick={handleExit}
              className="p-2 rounded-xl bg-[#181820] text-[#8e8ea0] hover:text-white hover:bg-red-500/20 transition-all ml-2"
              title="Exit Full Screen Pad"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Writing Canvas */}
      <div
        ref={editorContainerRef}
        className="flex-1 overflow-y-auto p-8 md:p-16 flex justify-center selection:bg-[#7c3aed]/40"
      >
        <div className="w-full max-w-3xl space-y-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              pushHistory(e.target.value);
            }}
            placeholder="Begin writing your novel chapter without distraction..."
            className={`w-full h-[80vh] bg-transparent text-[#f4f4f5] text-base md:text-lg leading-relaxed focus:outline-none resize-none font-serif tracking-wide ${
              focusMode ? 'opacity-90' : 'opacity-100'
            }`}
          />
        </div>
      </div>

      {/* Bottom Live Metrics Bar */}
      <div className="px-8 py-3 border-t border-[#232334] bg-[#0c0c10] flex items-center justify-between text-xs text-[#8e8ea0]">
        <div className="flex items-center gap-6 font-mono">
          <span>Words: <strong className="text-white">{wordCount.toLocaleString()}</strong></span>
          <span>Characters: <strong className="text-white">{charCount.toLocaleString()}</strong></span>
          <span>Reading Time: <strong className="text-white">{readingTime} min</strong></span>
        </div>

        {zenMode && (
          <button
            onClick={() => setZenMode(false)}
            className="flex items-center gap-1.5 text-xs text-[#a78bfa] hover:underline"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Exit Zen Mode (Esc)
          </button>
        )}
      </div>

    </div>
  );
}
