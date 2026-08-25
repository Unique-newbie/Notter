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
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-12">

      {/* ─────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8e8ea0]">
            Your writing workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back to{" "}
            <span className="text-[#a78bfa]">Notter.</span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#71717a]">
            Pick up where you left off or start something new.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 rounded-lg border border-[#292932] bg-[#121218] px-4 py-2.5 text-sm font-medium text-[#d4d4d8] transition hover:border-[#3f3f46] hover:bg-[#18181f]"
          >
            <BookOpen className="h-4 w-4 text-[#a78bfa]" />
            Books
          </Link>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8b5cf6]"
          >
            <Flame className="h-4 w-4" />
            Sprint Mode
          </Link>
        </div>
      </section>


      {/* ─────────────────────────────────────────────
          CONTINUE WRITING
      ───────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-[#292932] bg-[#101014]">

        <div className="flex flex-col lg:flex-row">

          <div className="flex-1 p-7 sm:p-9">

            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">
              <Clock className="h-3.5 w-3.5" />
              Continue writing
            </div>

            {lastEditedChapter ? (
              <>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                  {lastEditedChapter.title}
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-[#71717a]">
                  Resume your latest chapter and continue exactly where you
                  left off.
                </p>

                <Link
                  href={`/books/${lastEditedChapter.bookId}/chapters?id=${lastEditedChapter.chapterId}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8b5cf6]"
                >
                  <FileText className="h-4 w-4" />
                  Continue writing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                  Your next story starts here.
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-[#71717a]">
                  Create your first book and build your story, chapter by
                  chapter, without distractions.
                </p>

                <Link
                  href="/books"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8b5cf6]"
                >
                  <BookOpen className="h-4 w-4" />
                  Create a book
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {/* Quiet visual area */}
          <div className="flex min-h-[180px] w-full items-center justify-center border-t border-[#292932] bg-[#15151b] lg:w-[34%] lg:border-l lg:border-t-0">
            <div className="text-center">
              <BookOpen className="mx-auto h-10 w-10 text-[#3f3f46]" />

              <p className="mt-3 text-xs text-[#52525b]">
                Your writing space
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────
          AT A GLANCE
      ───────────────────────────────────────────── */}
      <section>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#e4e4e7]">
            At a glance
          </h2>

          <Link
            href="/analytics"
            className="text-xs font-medium text-[#71717a] transition hover:text-[#a78bfa]"
          >
            View analytics
          </Link>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#292932] bg-[#101014] lg:grid-cols-4">

          {/* Books */}
          <div className="border-b border-[#292932] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-[#71717a]">
              <BookOpen className="h-4 w-4 text-[#a78bfa]" />
              <span className="text-xs">Books</span>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {books.length}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Your stories
            </p>
          </div>


          {/* Chapters */}
          <div className="border-b border-[#292932] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-[#71717a]">
              <FileText className="h-4 w-4 text-[#71717a]" />
              <span className="text-xs">Chapters</span>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {totalChapters}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Tracked chapters
            </p>
          </div>


          {/* Words */}
          <div className="border-r border-[#292932] p-5">
            <div className="flex items-center gap-2 text-[#71717a]">
              <Layers className="h-4 w-4 text-[#71717a]" />
              <span className="text-xs">Words extracted</span>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {totalWords.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Across your books
            </p>
          </div>


          {/* Favorites */}
          <div className="p-5">
            <div className="flex items-center gap-2 text-[#71717a]">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-xs">Favorites</span>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {favoriteBooks.length}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Pinned books
            </p>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────
          BOOKS
      ───────────────────────────────────────────── */}
      <section>

        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#e4e4e7]">
              Your books
            </h2>

            <p className="mt-1 text-xs text-[#52525b]">
              Your writing projects
            </p>
          </div>

          <Link
            href="/books"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#71717a] transition hover:text-[#a78bfa]"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>


        {/* Tabs */}
        <div className="mb-5 flex items-center gap-1 border-b border-[#292932]">

          <button
            onClick={() => setActiveTab("all")}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === "all"
                ? "border-[#8b5cf6] text-white"
                : "border-transparent text-[#71717a] hover:text-[#d4d4d8]"
            }`}
          >
            All
            <span className="ml-1.5 text-[#52525b]">
              {activeBooks.length}
            </span>
          </button>


          <button
            onClick={() => setActiveTab("favorites")}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === "favorites"
                ? "border-[#8b5cf6] text-white"
                : "border-transparent text-[#71717a] hover:text-[#d4d4d8]"
            }`}
          >
            Favorites
            <span className="ml-1.5 text-[#52525b]">
              {favoriteBooks.length}
            </span>
          </button>


          <button
            onClick={() => setActiveTab("archived")}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === "archived"
                ? "border-[#8b5cf6] text-white"
                : "border-transparent text-[#71717a] hover:text-[#d4d4d8]"
            }`}
          >
            Archived
            <span className="ml-1.5 text-[#52525b]">
              {archivedBooks.length}
            </span>
          </button>

        </div>


        {/* Empty state / Books */}
        {displayBooks.length === 0 ? (

          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[#292932] bg-[#101014] px-6 text-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#292932] bg-[#15151b]">
              <BookOpen className="h-5 w-5 text-[#52525b]" />
            </div>

            <h3 className="mt-4 text-sm font-medium text-[#d4d4d8]">
              {activeTab === "favorites"
                ? "No favorite books yet"
                : activeTab === "archived"
                ? "No archived books"
                : "Your library is empty"}
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-[#52525b]">
              {activeTab === "favorites"
                ? "Pin a book to keep it close at hand."
                : activeTab === "archived"
                ? "Archived books will appear here."
                : "Create your first book and start building your story."}
            </p>

            {activeTab === "all" && (
              <Link
                href="/books"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#3f3f46] bg-[#18181f] px-4 py-2 text-xs font-medium text-[#d4d4d8] transition hover:border-[#7c3aed] hover:text-white"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#a78bfa]" />
                Create your first book
              </Link>
            )}

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

            {displayBooks.map((book) => (

              <div
                key={book.id}
                className="group rounded-xl border border-[#292932] bg-[#101014] p-5 transition hover:border-[#3f3f46] hover:bg-[#141419]"
              >

                <div className="flex items-start justify-between gap-4">

                  <Link
                    href={`/books/${book.id}`}
                    className="min-w-0 flex-1"
                  >

                    <div className="flex items-center gap-2">

                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: book.coverColor }}
                      />

                      <span className="truncate text-[11px] font-medium uppercase tracking-wider text-[#52525b]">
                        {book.genre}
                      </span>

                    </div>

                    <h3 className="mt-3 truncate text-base font-semibold text-[#f4f4f5] transition group-hover:text-[#c4b5fd]">
                      {book.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#71717a]">
                      {book.description}
                    </p>

                  </Link>


                  <div className="flex items-center gap-1">

                    <button
                      onClick={(e) =>
                        handleToggleFav(e, book.id, !!book.isFavorite)
                      }
                      className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-amber-400"
                      title={
                        book.isFavorite
                          ? "Unpin Favorite"
                          : "Pin Favorite"
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          book.isFavorite
                            ? "fill-amber-400 text-amber-400"
                            : ""
                        }`}
                      />
                    </button>


                    {book.status === "Archived" ? (

                      <button
                        onClick={(e) =>
                          handleRestore(e, book.id)
                        }
                        className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-[#d4d4d8]"
                        title="Restore Book"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>

                    ) : (

                      <button
                        onClick={(e) =>
                          handleArchive(e, book.id)
                        }
                        className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-[#d4d4d8]"
                        title="Archive Book"
                      >
                        <Archive className="h-4 w-4" />
                      </button>

                    )}

                  </div>

                </div>


                <div className="mt-5 flex items-center justify-between border-t border-[#292932] pt-3">

                  <span className="text-xs text-[#52525b]">
                    <strong className="font-medium text-[#71717a]">
                      {book.calculatedChapterCount}
                    </strong>{" "}
                    chapters
                  </span>

                  <Link
                    href={`/books/${book.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#71717a] transition hover:text-[#a78bfa]"
                  >
                    Open Bible
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}
