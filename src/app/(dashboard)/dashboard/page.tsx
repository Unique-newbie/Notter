'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, Layers, Clock, ArrowRight, FileText } from 'lucide-react';
import { repository } from '@/lib/store/repository';
import { Book } from '@/types';

interface ProcessedBook extends Book {
  calculatedChapterCount: number;
  calculatedWordCount: number;
}

export default function DashboardPage() {
  const [books, setBooks] = useState<ProcessedBook[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = async () => {
    setLoading(true);
    const list = await repository.getBooks();

    const processed = await Promise.all(
      list.map(async (b) => {
        const chaps = await repository.getChapters(b.id);
        const calculatedWordCount = chaps.reduce((acc, c) => acc + (c.wordCount || 0), 0);
        return {
          ...b,
          calculatedChapterCount: chaps.length,
          calculatedWordCount
        };
      })
    );

    setBooks(processed);
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
    const handleDataChanged = () => loadBooks();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, []);

  const totalChapters = books.reduce((acc, b) => acc + b.calculatedChapterCount, 0);
  const totalWords = books.reduce((acc, b) => acc + b.calculatedWordCount, 0);
  const firstBookId = books.length > 0 ? books[0].id : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-[#121218] via-[#1a102f] to-[#121218] border border-[#7c3aed]/30 relative overflow-hidden shadow-purple">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Notter 2.1 Engine Active</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back to <span className="purple-gradient-text">Notter</span>
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-2 leading-relaxed">
            Your fiction knowledge management platform. Automatically extract structured characters, items, abilities, dialogue facts, and timelines across all your novels without ever writing or rewriting prose.
          </p>

          <div className="flex items-center gap-4 mt-6">
            <Link
              href="/books"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
            >
              <BookOpen className="w-4 h-4" /> Manage Books
            </Link>
            {firstBookId && (
              <Link
                href={`/books/${firstBookId}/chapters`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e1e2a] border border-[#232334] text-white font-semibold text-xs hover:bg-[#272738] transition-all"
              >
                <FileText className="w-4 h-4 text-[#a78bfa]" /> Open Chapter Editor
              </Link>
            )}
          </div>
        </div>
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
            <div className="text-xs font-medium text-[#8e8ea0]">BYOK Provider Engine</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">Active</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recently Updated Books Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#7c3aed]" /> Recently Updated Books
          </h2>
          <Link href="/books" className="text-xs font-semibold text-[#7c3aed] hover:text-[#a78bfa] flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#8e8ea0] rounded-xl bg-[#121218] border border-[#232334]">
            Loading story metrics...
          </div>
        ) : books.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8e8ea0] rounded-xl bg-[#121218] border border-[#232334]">
            No books found. Go to <Link href="/books" className="text-[#a78bfa] font-bold underline">Books</Link> to create your first novel!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="p-6 rounded-xl bg-[#121218] border border-[#232334] hover:border-[#7c3aed]/50 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: book.coverColor }} />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">{book.genre}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1e1e2a] text-[#a78bfa] border border-[#232334]">
                      {book.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white group-hover:text-[#a78bfa] transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#a1a1aa] mt-2 line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#232334] flex items-center justify-between text-xs text-[#8e8ea0]">
                  <div>
                    <strong>{book.calculatedChapterCount}</strong> Chapters • <strong>{book.calculatedWordCount.toLocaleString()}</strong> Words
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
  );
}
