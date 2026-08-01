'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Layers, Clock, ArrowRight, FileText, Flame, Star, Archive, RotateCcw, Activity, Users, MapPin, Package, Shield } from 'lucide-react';
import { repository } from '@/lib/store/repository';
import { sprintStore } from '@/lib/store/sprintStore';
import { Book } from '@/types';

interface ProcessedBook extends Book {
  calculatedChapterCount: number;
  calculatedWordCount: number;
}

export default function DashboardPage() {
  const [books, setBooks] = useState<ProcessedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'archived'>('all');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lastEditedChapter, setLastEditedChapter] = useState<{ bookId: string; chapterId: string; title: string } | null>(null);

  const loadBooks = async () => {
    setLoading(true);
    const list = await repository.getBooks();

    let newestChapter: { bookId: string; chapterId: string; title: string } | null = null;

    const processed = await Promise.all(
      list.map(async (b) => {
        const chaps = await repository.getChapters(b.id);
        const calculatedWordCount = chaps.reduce((acc, c) => acc + (c.wordCount || 0), 0);
        if (chaps.length > 0 && !newestChapter) {
          newestChapter = { bookId: b.id, chapterId: chaps[0].id, title: chaps[0].title };
        }
        return {
          ...b,
          calculatedChapterCount: chaps.length,
          calculatedWordCount
        };
      })
    );

    setBooks(processed);
    setLastEditedChapter(newestChapter);

    // Activity Stream sample
    setRecentActivity([
      { id: 'act-1', text: 'Edited Chapter 1 in Fantasy Epic', time: '10 mins ago', type: 'chapter' },
      { id: 'act-2', text: 'Added character General Vane to Story Bible', time: '1 hour ago', type: 'character' },
      { id: 'act-3', text: 'Updated book cover image (WebP compressed)', time: '2 hours ago', type: 'cover' },
      { id: 'act-[#analytics]', text: 'Completed 25 min Sprint Session (842 words)', time: 'Yesterday', type: 'sprint' }
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
    const handleDataChanged = () => loadBooks();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, []);

  const handleToggleFav = async (e: React.MouseEvent, bookId: string, currentFav: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    await repository.toggleFavoriteBook(bookId, currentFav);
    loadBooks();
  };

  const handleArchive = async (e: React.MouseEvent, bookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await repository.archiveBook(bookId);
    loadBooks();
  };

  const handleRestore = async (e: React.MouseEvent, bookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await repository.restoreBook(bookId);
    loadBooks();
  };

  const activeBooks = books.filter(b => b.status !== 'Archived');
  const favoriteBooks = activeBooks.filter(b => b.isFavorite);
  const archivedBooks = books.filter(b => b.status === 'Archived');

  const displayBooks = activeTab === 'favorites'
    ? favoriteBooks
    : activeTab === 'archived'
    ? archivedBooks
    : activeBooks;

  const totalChapters = books.reduce((acc, b) => acc + b.calculatedChapterCount, 0);
  const totalWords = books.reduce((acc, b) => acc + b.calculatedWordCount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Welcome Banner with Quick Continue Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-[#121218] via-[#1a102f] to-[#121218] border border-[#7c3aed]/30 relative overflow-hidden shadow-purple flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back to <span className="purple-gradient-text">Notter</span>
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-2 leading-relaxed">
            Distraction-free novel drafting and automatic Story Bible entity extraction.
          </p>

          <div className="flex items-center gap-4 mt-6">
            <Link
              href="/books"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
            >
              <BookOpen className="w-4 h-4" /> Manage Books
            </Link>
            <Link
              href="/analytics"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:from-amber-600 hover:to-orange-700 transition-all shadow-xl"
            >
              <Flame className="w-4 h-4" /> Sprint Mode 2.0
            </Link>
          </div>
        </div>

        {/* Quick Continue Card */}
        {lastEditedChapter && (
          <div className="p-5 rounded-xl bg-[#181820] border border-[#7c3aed]/40 w-full lg:w-80 space-y-3 shrink-0 shadow-2xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#a78bfa] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Quick Continue
            </div>
            <div>
              <div className="font-bold text-white text-sm truncate">{lastEditedChapter.title}</div>
              <div className="text-xs text-[#8e8ea0] mt-0.5">Resume writing where you stopped</div>
            </div>
            <Link
              href={`/books/${lastEditedChapter.bookId}/chapters?id=${lastEditedChapter.chapterId}`}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
            >
              <FileText className="w-3.5 h-3.5" /> Continue Writing
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334] flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#8e8ea0]">Total Books</div>
            <div className="text-2xl font-extrabold text-white mt-1">{books.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center text-[#a78bfa]">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334] flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#8e8ea0]">Chapters Tracked</div>
            <div className="text-2xl font-extrabold text-white mt-1">{totalChapters}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334] flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#8e8ea0]">Total Words Extracted</div>
            <div className="text-2xl font-extrabold text-white mt-1">{totalWords.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334] flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#8e8ea0]">Pinned Favorites</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{favoriteBooks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Books List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#232334] pb-3">
            <div className="flex items-center gap-2 font-bold text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all' ? 'bg-[#7c3aed] text-white' : 'text-[#8e8ea0] hover:text-white'
                }`}
              >
                All Projects ({activeBooks.length})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                  activeTab === 'favorites' ? 'bg-[#7c3aed] text-white' : 'text-[#8e8ea0] hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400" /> Favorites ({favoriteBooks.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                  activeTab === 'archived' ? 'bg-[#7c3aed] text-white' : 'text-[#8e8ea0] hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5 text-cyan-400" /> Archived ({archivedBooks.length})
              </button>
            </div>

            <Link href="/books" className="text-xs font-semibold text-[#7c3aed] hover:text-[#a78bfa] flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {displayBooks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8e8ea0] rounded-xl bg-[#121218] border border-[#232334]">
              {activeTab === 'favorites' ? 'No pinned favorite projects. Click the star icon on any book card to pin it!' : 'No archived books.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-5 rounded-xl bg-[#121218] border border-[#232334] hover:border-[#7c3aed]/50 transition-all flex flex-col justify-between group shadow-lg relative"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: book.coverColor }} />
                        <span className="text-xs font-bold uppercase text-[#8e8ea0]">{book.genre}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleFav(e, book.id, !!book.isFavorite)}
                          className="p-1 rounded text-amber-400 hover:bg-[#1e1e2a]"
                          title={book.isFavorite ? 'Unpin Favorite' : 'Pin Favorite'}
                        >
                          <Star className={`w-4 h-4 ${book.isFavorite ? 'fill-amber-400' : ''}`} />
                        </button>

                        {book.status === 'Archived' ? (
                          <button
                            onClick={(e) => handleRestore(e, book.id)}
                            className="p-1 text-cyan-400 hover:bg-[#1e1e2a]"
                            title="Restore Book"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleArchive(e, book.id)}
                            className="p-1 text-[#8e8ea0] hover:text-white hover:bg-[#1e1e2a]"
                            title="Archive Book"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-white group-hover:text-[#a78bfa] transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#232334] flex items-center justify-between text-xs text-[#8e8ea0]">
                    <div>
                      <strong>{book.calculatedChapterCount}</strong> Chapters
                    </div>

                    <Link
                      href={`/books/${book.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-[#7c3aed] hover:text-[#a78bfa]"
                    >
                      Open Bible <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
