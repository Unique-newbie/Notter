'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ChevronDown, User, Zap } from 'lucide-react';
import { repository } from '@/lib/store/repository';
import { GlobalSearchModal } from './GlobalSearchModal';
import { StoryBibleAIModal } from '@/components/ai/StoryBibleAIModal';
import { Book } from '@/types';

interface HeaderProps {
  activeBookId?: string;
  onSelectBook?: (bookId: string) => void;
}

export function Header({ activeBookId = 'book-1', onSelectBook }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isBookMenuOpen, setIsBookMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);

  const loadBooks = async () => {
    const list = await repository.getBooks();
    setBooks(list);
  };

  useEffect(() => {
    setMounted(true);
    loadBooks();
    const handleDataChanged = () => loadBooks();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, []);

  const currentBook = books.find(b => b.id === activeBookId) || books[0];

  return (
    <>
      <header className="h-16 border-b border-[#232334] bg-[#09090b]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Active Book Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsBookMenuOpen(!isBookMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#121218] border border-[#232334] hover:border-[#7c3aed]/50 transition-all text-sm font-medium text-white shadow-sm"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: (mounted && currentBook?.coverColor) || '#7c3aed' }}
            />
            <span className="max-w-[200px] truncate">
              {mounted ? (currentBook?.title || 'Select Book') : 'Select Book'}
            </span>
            <ChevronDown className="w-4 h-4 text-[#8e8ea0]" />
          </button>

          {/* Book Dropdown Menu */}
          {isBookMenuOpen && mounted && (
            <div className="absolute left-0 mt-2 w-72 bg-[#121218] border border-[#232334] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8e8ea0] px-2 py-1">
                Your Books ({books.length})
              </div>
              <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                {books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (onSelectBook) onSelectBook(b.id);
                      setIsBookMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      b.id === activeBookId
                        ? 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/40'
                        : 'text-[#a1a1aa] hover:bg-[#1a1a24] hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.coverColor }} />
                    <div className="flex-1 truncate">
                      <div className="font-semibold truncate">{b.title}</div>
                      <div className="text-[10px] text-[#8e8ea0]">{b.genre} • {b.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Search & Ask AI Trigger Buttons */}
        <div className="flex items-center gap-3 flex-1 max-w-xl mx-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#121218] border border-[#232334] text-[#8e8ea0] hover:text-white hover:border-[#7c3aed]/40 transition-all text-xs flex-1 shadow-inner"
          >
            <Search className="w-4 h-4 text-[#7c3aed]" />
            <span className="flex-1 text-left">Search Story Bible (Ctrl+K)...</span>
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#1e1e2a] text-[#a78bfa] rounded border border-[#232334]">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#a78bfa] hover:bg-[#7c3aed] hover:text-white transition-all text-xs font-bold shrink-0 shadow-purple"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181820] border border-[#232334] text-[11px] text-[#a78bfa]">
            <Zap className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>BYOK Engine</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#1e1e2a] border border-[#232334] flex items-center justify-center text-[#a1a1aa]">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        activeBookId={activeBookId}
      />

      {/* Ask Story Bible AI RAG Modal */}
      <StoryBibleAIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        activeBookId={activeBookId}
      />
    </>
  );
}
