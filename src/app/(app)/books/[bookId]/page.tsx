'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { repository } from '@/lib/store/repository';
import { Book, Chapter, Character, TimelineEvent } from '@/types';
import { BookOpen, FileText, Users, GitBranch, ArrowRight } from 'lucide-react';

export default function BookOverviewPage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = async () => {
    const b = await repository.getBook(bookId);
    if (b) setBook(b);
    const chaps = await repository.getChapters(bookId);
    setChapters(chaps);
    const chars = await repository.getCharacters(bookId);
    setCharacters(chars);
    const evs = await repository.getTimelineEvents(bookId);
    setEvents(evs);
    setLoaded(true);
  };

  useEffect(() => {
    loadData();
    const handleDataChanged = () => loadData();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId]);

  if (!loaded) {
    return (
      <div className="p-12 text-center text-[#8e8ea0] text-xs">
        Loading Story Bible Overview...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-12 text-center bg-[#121218] border border-[#232334] rounded-2xl max-w-lg mx-auto text-[#8e8ea0]">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-[#7c3aed] opacity-40" />
        <h2 className="text-base font-bold text-white">Book Not Found</h2>
        <p className="text-xs text-[#8e8ea0] mt-1">
          The requested novel does not exist or has been deleted.
        </p>
        <Link
          href="/books"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
        >
          View All Books
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Book Header Banner */}
      <div className="p-8 rounded-2xl bg-[#121218] border border-[#232334] space-y-6 shadow-xl relative overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-20 h-28 rounded-xl object-cover border border-[#232334] shadow-purple shrink-0"
              />
            ) : (
              <div
                className="w-20 h-28 rounded-xl shrink-0 flex items-center justify-center text-white font-extrabold text-2xl shadow-purple"
                style={{ backgroundColor: book.coverColor }}
              >
                {book.title.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">{book.genre}</span>
                <span className="text-xs text-[#3f3f56]">•</span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#1e1e2a] text-emerald-400 border border-[#232334]">
                  {book.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{book.title}</h1>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={`/books/${bookId}/chapters`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
            >
              <FileText className="w-4 h-4" /> Open Chapter Manager
            </Link>
            <Link
              href={`/books/${bookId}/timeline`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e2a] border border-[#232334] text-white font-semibold text-xs hover:bg-[#272738] transition-all"
            >
              <GitBranch className="w-4 h-4 text-[#a78bfa]" /> Visual Timeline
            </Link>
            <Link
              href={`/books/${bookId}/duplicates`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs hover:bg-amber-500/20 transition-all"
            >
              Duplicate Review Center
            </Link>
          </div>
        </div>

        {/* Synopsis / Description Row */}
        {book.description && (
          <div className="pt-4 border-t border-[#232334]">
            <p className="text-xs text-[#a1a1aa] leading-relaxed max-w-5xl line-clamp-3">
              {book.description}
            </p>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Chapters</div>
          <div className="text-2xl font-extrabold text-white mt-1">{chapters.length}</div>
        </div>
        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Tracked Characters</div>
          <div className="text-2xl font-extrabold text-white mt-1">{characters.length}</div>
        </div>
        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Timeline Events</div>
          <div className="text-2xl font-extrabold text-[#a78bfa] mt-1">{events.length}</div>
        </div>
        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334]">
          <div className="text-xs text-[#8e8ea0]">Total Word Count</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Grid: Latest Chapters & Recent Characters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Latest Chapters */}
        <div className="p-6 rounded-xl bg-[#121218] border border-[#232334] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7c3aed]" /> Latest Chapters
            </h2>
            <Link href={`/books/${bookId}/chapters`} className="text-xs font-semibold text-[#7c3aed] hover:text-[#a78bfa] flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {chapters.length === 0 ? (
              <p className="text-xs text-[#8e8ea0] py-4 italic text-center">No chapters added yet.</p>
            ) : (
              chapters.slice(0, 4).map((chap) => (
                <div
                  key={chap.id}
                  className="p-3.5 rounded-lg bg-[#181820] border border-[#232334] flex items-center justify-between hover:border-[#7c3aed]/40 transition-all"
                >
                  <div>
                    <div className="font-bold text-white text-xs">
                      Chapter {chap.chapterNumber}: {chap.title}
                    </div>
                    <div className="text-[11px] text-[#8e8ea0] mt-0.5">
                      {chap.wordCount} words • {chap.readingTimeMinutes} min read
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                      chap.status === 'Analyzed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : chap.status === 'Pending Review'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[#1e1e2a] text-[#8e8ea0]'
                    }`}
                  >
                    {chap.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tracked Characters */}
        <div className="p-6 rounded-xl bg-[#121218] border border-[#232334] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#a78bfa] text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[#a78bfa]" /> Key Characters
            </h2>
            <Link href={`/books/${bookId}/characters`} className="text-xs font-semibold text-[#7c3aed] hover:text-[#a78bfa] flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {characters.length === 0 ? (
              <p className="text-xs text-[#8e8ea0] py-4 italic text-center">No characters extracted yet.</p>
            ) : (
              characters.slice(0, 4).map((char) => (
                <div
                  key={char.id}
                  className="p-3.5 rounded-lg bg-[#181820] border border-[#232334] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{char.name}</div>
                    <div className="text-[11px] text-[#8e8ea0] line-clamp-1 mt-0.5">{char.summary}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e1e2a] text-[#a78bfa]">
                    {char.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
