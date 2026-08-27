'use client';

import { createPortal } from 'react-dom';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  ArrowRight,
  X,
  CheckCircle2,
  Flame,
  FileText,
  Layers,
  Clock,
  Star,
  Archive,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';

import { repository } from '@/lib/store/repository';
import { Book, BookStatus } from '@/types';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { MediaUploader } from '@/components/common/MediaUploader';

interface ProcessedBook extends Book {
  calculatedChapterCount: number;
  calculatedWordCount: number;
  latestChapterId?: string;
  latestChapterTitle?: string;
}

type BookFilter = 'all' | 'favorites' | 'archived';

export default function DashboardPage() {
  const [books, setBooks] = useState<ProcessedBook[]>([]);
  const [featuredBook, setFeaturedBook] =
    useState<ProcessedBook | null>(null);

  const [activeTab, setActiveTab] =
    useState<BookFilter>('all');

  // Create / Edit
  const [isBookModalOpen, setIsBookModalOpen] =
    useState(false);
  const [editingBook, setEditingBook] =
    useState<Book | null>(null);

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);
  const [bookToDelete, setBookToDelete] =
    useState<{ id: string; title: string } | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');
  const [genre, setGenre] =
    useState('Epic Fantasy');
  const [coverColor, setCoverColor] =
    useState('#7C3AED');
  const [coverUrl, setCoverUrl] =
    useState<string | undefined>();
  const [status, setStatus] =
    useState<BookStatus>('Drafting');

  const [validationError, setValidationError] =
    useState('');
  const [successToast, setSuccessToast] =
    useState('');
  const [isCompressingCover, setIsCompressingCover] =
    useState(false);

  const showSuccess = (message: string) => {
    setSuccessToast(message);

    setTimeout(() => {
      setSuccessToast('');
    }, 3000);
  };

  const loadBooks = async () => {
    const list = await repository.getBooks();

    const processed = await Promise.all(
      list.map(async (book) => {
        const chapters =
          await repository.getChapters(book.id);

        const calculatedWordCount =
          chapters.reduce(
            (total, chapter) =>
              total + (chapter.wordCount || 0),
            0
          );

        const latestChapter = chapters[0];

        return {
          ...book,
          calculatedChapterCount:
            chapters.length,
          calculatedWordCount,
          latestChapterId:
            latestChapter?.id,
          latestChapterTitle:
            latestChapter?.title,
        };
      })
    );

    setBooks(processed);

    /*
     * Only choose a new featured book when the current
     * featured book no longer exists.
     *
     * This prevents the card from changing every time
     * another part of the dashboard updates.
     */
    setFeaturedBook((current) => {
      const availableBooks = processed.filter(
        (book) => book.status !== 'Archived'
      );

      if (availableBooks.length === 0) {
        return null;
      }

      if (
        current &&
        availableBooks.some(
          (book) => book.id === current.id
        )
      ) {
        return (
          availableBooks.find(
            (book) => book.id === current.id
          ) || null
        );
      }

      const randomIndex = Math.floor(
        Math.random() * availableBooks.length
      );

      return availableBooks[randomIndex];
    });
  };

  useEffect(() => {
    loadBooks();

    const handleDataChanged = () => {
      loadBooks();
    };

    window.addEventListener(
      'storybible_data_changed',
      handleDataChanged
    );

    return () => {
      window.removeEventListener(
        'storybible_data_changed',
        handleDataChanged
      );
    };
  }, []);

  const resetBookForm = () => {
    setTitle('');
    setDescription('');
    setGenre('Epic Fantasy');
    setCoverColor('#7C3AED');
    setCoverUrl(undefined);
    setStatus('Drafting');
    setValidationError('');
    setEditingBook(null);
    setIsCompressingCover(false);
  };

  const openCreateModal = () => {
    resetBookForm();
    setIsBookModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setDescription(book.description);
    setGenre(book.genre);
    setCoverColor(book.coverColor);
    setCoverUrl(book.coverUrl);
    setStatus(book.status);
    setValidationError('');
    setIsBookModalOpen(true);
  };

  const closeBookModal = () => {
    setIsBookModalOpen(false);
    resetBookForm();
  };

  const handleSaveBook = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError(
        'Please enter a Book Title.'
      );
      return;
    }

    try {
      if (editingBook) {
        await repository.updateBook(
          editingBook.id,
          {
            title: title.trim(),
            description: description.trim(),
            genre,
            coverColor,
            coverUrl,
            status,
          }
        );

        closeBookModal();
        await loadBooks();

        showSuccess(
          `Updated "${title.trim()}"!`
        );

        return;
      }

      const newBook =
        await repository.createBook({
          title: title.trim(),
          description: description.trim(),
          genre,
          coverColor,
          coverUrl,
          status,
        });

      if (!newBook) {
        throw new Error(
          'Failed to create book.'
        );
      }

      closeBookModal();
      await loadBooks();

      showSuccess(
        `Created "${newBook.title}"!`
      );

      setTimeout(() => {
        window.location.href =
          `/books/${newBook.id}`;
      }, 500);
    } catch (error: any) {
      setValidationError(
        error?.message ||
          'Failed to save book.'
      );
    }
  };

  const handleDeleteBook = (
    id: string,
    bookTitle: string
  ) => {
    setBookToDelete({
      id,
      title: bookTitle,
    });

    setDeleteModalOpen(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    const deletedTitle =
      bookToDelete.title;

    await repository.deleteBook(
      bookToDelete.id
    );

    setDeleteModalOpen(false);
    setBookToDelete(null);

    await loadBooks();

    showSuccess(
      `Deleted "${deletedTitle}"`
    );
  };

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    bookId: string,
    currentFavorite: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();

    await repository.toggleFavoriteBook(
      bookId,
      currentFavorite
    );

    await loadBooks();
  };

  const handleArchive = async (
    e: React.MouseEvent,
    bookId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    await repository.archiveBook(bookId);
    await loadBooks();
  };

  const handleRestore = async (
    e: React.MouseEvent,
    bookId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    await repository.restoreBook(bookId);
    await loadBooks();
  };

  const handleCoverUpload = async (
    file: File
  ): Promise<string> => {
    if (
      !file ||
      !file.type.startsWith('image/')
    ) {
      throw new Error(
        'Please select a valid image file.'
      );
    }

    setIsCompressingCover(true);
    setValidationError('');

    try {
      const result =
        await new Promise<string>(
          (resolve, reject) => {
            const reader =
              new FileReader();

            reader.onload = (event) => {
              const image =
                new Image();

              image.onload = () => {
                const canvas =
                  document.createElement(
                    'canvas'
                  );

                canvas.width = 600;
                canvas.height = 800;

                const context =
                  canvas.getContext('2d');

                if (!context) {
                  reject(
                    new Error(
                      'Canvas processing failed.'
                    )
                  );
                  return;
                }

                context.fillStyle =
                  coverColor ||
                  '#121218';

                context.fillRect(
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

                const scale =
                  Math.max(
                    canvas.width /
                      image.width,
                    canvas.height /
                      image.height
                  );

                const x =
                  (canvas.width -
                    image.width *
                      scale) /
                  2;

                const y =
                  (canvas.height -
                    image.height *
                      scale) /
                  2;

                context.drawImage(
                  image,
                  x,
                  y,
                  image.width *
                    scale,
                  image.height *
                    scale
                );

                let output =
                  canvas.toDataURL(
                    'image/webp',
                    0.85
                  );

                if (
                  !output.startsWith(
                    'data:image/webp'
                  )
                ) {
                  output =
                    canvas.toDataURL(
                      'image/jpeg',
                      0.82
                    );
                }

                resolve(output);
              };

              image.onerror = () => {
                reject(
                  new Error(
                    'Failed to load image.'
                  )
                );
              };

              image.src =
                event.target
                  ?.result as string;
            };

            reader.onerror = () => {
              reject(
                new Error(
                  'Failed to read image.'
                )
              );
            };

            reader.readAsDataURL(file);
          }
        );

      setCoverUrl(result);

      return result;
    } finally {
      setIsCompressingCover(false);
    }
  };

  const activeBooks = books.filter(
    (book) =>
      book.status !== 'Archived'
  );

  const favoriteBooks =
    activeBooks.filter(
      (book) => book.isFavorite
    );

  const archivedBooks =
    books.filter(
      (book) =>
        book.status === 'Archived'
    );

  const displayBooks =
    activeTab === 'favorites'
      ? favoriteBooks
      : activeTab === 'archived'
      ? archivedBooks
      : activeBooks;

  const totalChapters =
    books.reduce(
      (total, book) =>
        total +
        book.calculatedChapterCount,
      0
    );

  const totalWords =
    books.reduce(
      (total, book) =>
        total +
        book.calculatedWordCount,
      0
    );

  const featuredChapterLink =
    featuredBook?.latestChapterId
      ? `/books/${featuredBook.id}/chapters?id=${featuredBook.latestChapterId}`
      : `/books/${featuredBook?.id}`;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-12">

      {/* Success Toast */}
      {successToast && (
        <div className="fixed right-8 top-20 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-4 text-xs font-bold text-emerald-300 shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {successToast}
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8e8ea0]">
            Your writing workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back to{' '}
            <span className="text-[#a78bfa]">
              Notter.
            </span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#71717a]">
            Pick up where you left off or start something new.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8b5cf6]"
          >
            <Plus className="h-4 w-4" />
            New Book
          </button>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-lg border border-[#292932] bg-[#121218] px-4 py-2.5 text-sm font-medium text-[#d4d4d8] transition hover:border-[#3f3f46] hover:bg-[#18181f]"
          >
            <Flame className="h-4 w-4 text-[#a78bfa]" />
            Sprint Mode
          </Link>
        </div>
      </section>

      {/* Continue Writing */}
      <section className="overflow-hidden rounded-2xl border border-[#292932] bg-[#101014]">
        {featuredBook ? (
          <div className="flex min-h-[320px] flex-col lg:flex-row">

            {/* Text */}
            <div className="flex flex-1 flex-col justify-center p-7 sm:p-10">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">
                <Clock className="h-3.5 w-3.5" />
                Continue writing
              </div>

              <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {featuredBook.title}
              </h2>

              {featuredBook.latestChapterTitle ? (
                <p className="mt-2 text-sm text-[#71717a]">
                  Continue with{' '}
                  <span className="text-[#a1a1aa]">
                    {featuredBook.latestChapterTitle}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#71717a]">
                  Your story is ready. Start writing your first chapter.
                </p>
              )}

              <Link
                href={featuredChapterLink}
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8b5cf6]"
              >
                <FileText className="h-4 w-4" />

                {featuredBook.latestChapterId
                  ? 'Continue writing'
                  : 'Open book'}

                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="mt-5 flex items-center gap-4 text-xs text-[#52525b]">
                <span>
                  {featuredBook.calculatedChapterCount}{' '}
                  chapters
                </span>

                <span>•</span>

                <span>
                  {featuredBook.calculatedWordCount.toLocaleString()}{' '}
                  words
                </span>
              </div>
            </div>

            {/* Cover */}
            <Link
              href={`/books/${featuredBook.id}`}
              className="group relative flex w-full items-center justify-center overflow-hidden border-t border-[#292932] bg-[#15151b] p-8 lg:w-[34%] lg:border-l lg:border-t-0"
            >
              {featuredBook.coverUrl ? (
                <>
                  <div className="absolute inset-0">
                    <img
                      src={featuredBook.coverUrl}
                      alt=""
                      className="h-full w-full object-cover opacity-20 blur-2xl transition duration-700 group-hover:opacity-30"
                    />
                  </div>

                  <img
                    src={featuredBook.coverUrl}
                    alt={`${featuredBook.title} cover`}
                    className="relative z-10 max-h-[270px] w-auto max-w-[75%] rounded-lg object-contain shadow-2xl transition duration-300 group-hover:scale-[1.02]"
                  />
                </>
              ) : (
                <div
                  className="relative flex aspect-[3/4] w-40 items-center justify-center overflow-hidden rounded-lg shadow-2xl"
                  style={{
                    backgroundColor:
                      featuredBook.coverColor ||
                      '#7C3AED',
                  }}
                >
                  <BookOpen className="h-12 w-12 text-white/70" />
                </div>
              )}
            </Link>

          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col lg:flex-row">

            <div className="flex flex-1 flex-col justify-center p-7 sm:p-10">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">
                <Clock className="h-3.5 w-3.5" />
                Continue writing
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Your next story starts here.
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-[#71717a]">
                Create your first book and build your story, chapter by chapter, without distractions.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8b5cf6]"
              >
                <BookOpen className="h-4 w-4" />
                Create a book
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-[180px] w-full items-center justify-center border-t border-[#292932] bg-[#15151b] lg:w-[34%] lg:border-l lg:border-t-0">
              <div className="text-center">
                <BookOpen className="mx-auto h-10 w-10 text-[#3f3f46]" />

                <p className="mt-3 text-xs text-[#52525b]">
                  Your writing space
                </p>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* At a Glance */}
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

          <div className="border-b border-[#292932] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-[#71717a]">
              <BookOpen className="h-4 w-4 text-[#a78bfa]" />
              <span className="text-xs">
                Books
              </span>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {books.length}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Your stories
            </p>
          </div>

          <div className="border-b border-[#292932] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-[#71717a]">
              <FileText className="h-4 w-4" />
              <span className="text-xs">
                Chapters
              </span>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {totalChapters}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Tracked chapters
            </p>
          </div>

          <div className="border-b border-[#292932] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-[#71717a]">
              <Layers className="h-4 w-4" />
              <span className="text-xs">
                Words
              </span>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {totalWords.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Across your books
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2 text-[#71717a]">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-xs">
                Favorites
              </span>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {favoriteBooks.length}
            </p>

            <p className="mt-1 text-xs text-[#52525b]">
              Pinned books
            </p>
          </div>

        </div>
      </section>

      {/* Your Books */}
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

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#71717a] transition hover:text-[#a78bfa]"
          >
            <Plus className="h-3.5 w-3.5" />
            New book
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 flex items-center gap-1 border-b border-[#292932]">
          <button
            onClick={() =>
              setActiveTab('all')
            }
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'all'
                ? 'border-[#8b5cf6] text-white'
                : 'border-transparent text-[#71717a] hover:text-[#d4d4d8]'
            }`}
          >
            All
            <span className="ml-1.5 text-[#52525b]">
              {activeBooks.length}
            </span>
          </button>

          <button
            onClick={() =>
              setActiveTab('favorites')
            }
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'favorites'
                ? 'border-[#8b5cf6] text-white'
                : 'border-transparent text-[#71717a] hover:text-[#d4d4d8]'
            }`}
          >
            Favorites
            <span className="ml-1.5 text-[#52525b]">
              {favoriteBooks.length}
            </span>
          </button>

          <button
            onClick={() =>
              setActiveTab('archived')
            }
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'archived'
                ? 'border-[#8b5cf6] text-white'
                : 'border-transparent text-[#71717a] hover:text-[#d4d4d8]'
            }`}
          >
            Archived
            <span className="ml-1.5 text-[#52525b]">
              {archivedBooks.length}
            </span>
          </button>
        </div>

        {displayBooks.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[#292932] bg-[#101014] px-6 text-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#292932] bg-[#15151b]">
              <BookOpen className="h-5 w-5 text-[#52525b]" />
            </div>

            <h3 className="mt-4 text-sm font-medium text-[#d4d4d8]">
              {activeTab === 'favorites'
                ? 'No favorite books yet'
                : activeTab === 'archived'
                ? 'No archived books'
                : 'Your library is empty'}
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-[#52525b]">
              {activeTab === 'favorites'
                ? 'Pin a book to keep it close at hand.'
                : activeTab === 'archived'
                ? 'Archived books will appear here.'
                : 'Create your first book and start building your story.'}
            </p>

            {activeTab === 'all' && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#3f3f46] bg-[#18181f] px-4 py-2 text-xs font-medium text-[#d4d4d8] transition hover:border-[#7c3aed] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5 text-[#a78bfa]" />
                Create your first book
              </button>
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
                        style={{
                          backgroundColor:
                            book.coverColor,
                        }}
                      />

                      <span className="truncate text-[11px] font-medium uppercase tracking-wider text-[#52525b]">
                        {book.genre}
                      </span>

                    </div>

                    <h3 className="mt-3 truncate text-base font-semibold text-[#f4f4f5] transition group-hover:text-[#c4b5fd]">
                      {book.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#71717a]">
                      {book.description ||
                        'No description provided.'}
                    </p>
                  </Link>

                  <div className="flex items-center gap-1">

                    <button
                      onClick={() =>
                        openEditModal(book)
                      }
                      className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-white"
                      title="Edit Book"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) =>
                        handleToggleFavorite(
                          e,
                          book.id,
                          !!book.isFavorite
                        )
                      }
                      className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-amber-400"
                      title={
                        book.isFavorite
                          ? 'Unpin Favorite'
                          : 'Pin Favorite'
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          book.isFavorite
                            ? 'fill-amber-400 text-amber-400'
                            : ''
                        }`}
                      />
                    </button>

                    {book.status ===
                    'Archived' ? (
                      <button
                        onClick={(e) =>
                          handleRestore(
                            e,
                            book.id
                          )
                        }
                        className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-[#d4d4d8]"
                        title="Restore Book"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) =>
                          handleArchive(
                            e,
                            book.id
                          )
                        }
                        className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-[#d4d4d8]"
                        title="Archive Book"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleDeleteBook(
                          book.id,
                          book.title
                        )
                      }
                      className="rounded-md p-1.5 text-[#52525b] transition hover:bg-[#1c1c23] hover:text-red-400"
                      title="Delete Book"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#292932] pt-3">

                  <span className="text-xs text-[#52525b]">
                    <strong className="font-medium text-[#71717a]">
                      {book.calculatedChapterCount}
                    </strong>{' '}
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

      {/* Create / Edit Modal */}
      {isBookModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeBookModal();
              }
            }}
          >
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#232334] bg-[#121218] shadow-2xl">

              {/* Modal Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-[#232334] bg-[#0c0c10] px-6 py-4">
                <h2 className="text-base font-bold text-white">
                  {editingBook
                    ? 'Edit Book Details'
                    : 'Create New Book'}
                </h2>

                <button
                  type="button"
                  onClick={closeBookModal}
                  className="rounded-lg p-1 text-[#8e8ea0] transition hover:bg-[#181820] hover:text-white"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={handleSaveBook}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 text-xs"
              >
                {validationError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 font-semibold text-red-400">
                    {validationError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">
                    Book Title{' '}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Chronicles of Aethelgard"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    className="w-full rounded-xl border border-[#232334] bg-[#181820] px-3.5 py-2.5 text-white placeholder-[#8e8ea0] focus:border-[#7c3aed] focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    placeholder="Brief synopsis of your novel..."
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    className="w-full resize-none rounded-xl border border-[#232334] bg-[#181820] p-3 text-white placeholder-[#8e8ea0] focus:border-[#7c3aed] focus:outline-none"
                  />
                </div>

                {/* Cover */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#a78bfa]">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Book Cover
                  </label>

                  <MediaUploader
                    currentUrl={coverUrl}
                    onImageSelected={handleCoverUpload}
                    aspectRatioWidth={600}
                    aspectRatioHeight={800}
                    label="Upload Book Cover"
                  />

                  {isCompressingCover && (
                    <p className="text-[10px] text-[#8e8ea0]">
                      Processing cover image...
                    </p>
                  )}
                </div>

                {/* Genre / Status */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">
                      Genre
                    </label>

                    <input
                      type="text"
                      placeholder="Epic Fantasy, Sci-Fi, Thriller..."
                      value={genre}
                      onChange={(e) =>
                        setGenre(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#232334] bg-[#181820] px-3.5 py-2.5 text-white focus:border-[#7c3aed] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">
                      Status
                    </label>

                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target.value as BookStatus
                        )
                      }
                      className="w-full rounded-xl border border-[#232334] bg-[#181820] px-3.5 py-2.5 text-white focus:border-[#7c3aed] focus:outline-none"
                    >
                      <option value="Drafting">
                        Drafting
                      </option>

                      <option value="Editing">
                        Editing
                      </option>

                      <option value="Complete">
                        Complete
                      </option>

                      <option value="Archived">
                        Archived
                      </option>
                    </select>
                  </div>

                </div>

                {/* Accent */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">
                    Fallback Accent Color
                  </label>

                  <div className="flex items-center gap-3">
                    {[
                      '#7C3AED',
                      '#06B6D4',
                      '#10B981',
                      '#F59E0B',
                      '#EF4444',
                      '#EC4899',
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setCoverColor(color)
                        }
                        className={`h-7 w-7 rounded-full border-2 transition-transform ${
                          coverColor === color
                            ? 'scale-110 border-white'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: color,
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-[#232334] pt-4">

                  <button
                    type="button"
                    onClick={closeBookModal}
                    className="rounded-xl border border-[#232334] bg-[#181820] px-4 py-2 font-semibold text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isCompressingCover}
                    className="rounded-xl bg-[#7c3aed] px-5 py-2 font-bold text-white shadow-purple transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editingBook
                      ? 'Update Book'
                      : 'Create Book'}
                  </button>

                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Book & Project"
        itemTitle={bookToDelete?.title}
        description="Are you sure you want to delete this book? All associated chapters, entity appearances, and Story Bible records will be removed."
        onConfirm={confirmDeleteBook}
        onClose={() => {
          setDeleteModalOpen(false);
          setBookToDelete(null);
        }}
      />

    </div>
  );
}