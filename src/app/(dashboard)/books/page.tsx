'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, Edit3, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { repository } from '@/lib/store/repository';
import { Book, BookStatus } from '@/types';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Epic Fantasy');
  const [coverColor, setCoverColor] = useState('#7C3AED');
  const [status, setStatus] = useState<BookStatus>('Drafting');
  const [validationError, setValidationError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const refreshBooks = async () => {
    const list = await repository.getBooks();
    setBooks(list);
  };

  useEffect(() => {
    refreshBooks();
    const handleDataChanged = () => refreshBooks();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, []);

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Please enter a Book Title.');
      return;
    }

    if (editingBook) {
      await repository.updateBook(editingBook.id, {
        title: title.trim(),
        description: description.trim(),
        genre,
        coverColor,
        status
      });
      setSuccessToast(`Updated "${title.trim()}"!`);
    } else {
      const newBook = await repository.createBook({
        title: title.trim(),
        description: description.trim(),
        genre,
        coverColor,
        status
      });
      if (newBook) {
        setSuccessToast(`Created "${newBook.title}"!`);
      }
    }

    setTimeout(() => setSuccessToast(''), 3000);
    resetForm();
    await refreshBooks();
  };

  const handleDeleteBook = async (id: string, bookTitle: string) => {
    if (confirm(`Are you sure you want to delete "${bookTitle}"? All associated chapters and entities will be removed.`)) {
      await repository.deleteBook(id);
      await refreshBooks();
    }
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setDescription(book.description);
    setGenre(book.genre);
    setCoverColor(book.coverColor);
    setStatus(book.status);
    setValidationError('');
    setIsCreateModalOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGenre('Epic Fantasy');
    setCoverColor('#7C3AED');
    setStatus('Drafting');
    setValidationError('');
    setEditingBook(null);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#7c3aed]" /> Book Management
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Manage your novel projects. Each book maintains strict isolated data for characters, items, and timeline.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
        >
          <Plus className="w-4 h-4" /> Create New Book
        </button>
      </div>

      {/* Empty State */}
      {books.length === 0 && (
        <div className="p-12 text-center bg-[#121218] border border-[#232334] rounded-2xl text-[#8e8ea0] max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-[#7c3aed] opacity-40" />
          <h3 className="text-sm font-semibold text-white">No Books Found</h3>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Click <strong>&quot;Create New Book&quot;</strong> above to start organizing your novel!
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
          >
            + Create Your First Book
          </button>
        </div>
      )}

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="p-6 rounded-2xl bg-[#121218] border border-[#232334] hover:border-[#7c3aed]/50 transition-all flex flex-col justify-between group shadow-xl relative"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: book.coverColor }} />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">{book.genre}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(book)}
                    className="p-1.5 rounded-lg text-[#8e8ea0] hover:text-white hover:bg-[#1e1e2a] transition-colors"
                    title="Rename / Edit Book"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.id, book.title)}
                    className="p-1.5 rounded-lg text-[#8e8ea0] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Book"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-white group-hover:text-[#a78bfa] transition-colors">
                {book.title}
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-2 line-clamp-3 leading-relaxed">
                {book.description || 'No description provided.'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#232334] flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#1e1e2a] text-[#a78bfa] border border-[#232334]">
                {book.status}
              </span>

              <Link
                href={`/books/${book.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#a78bfa] font-bold text-xs hover:bg-[#7c3aed] hover:text-white transition-all shadow-purple"
              >
                Open Story Bible <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
              <h2 className="font-bold text-white text-base">
                {editingBook ? 'Edit Book Details' : 'Create New Book'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-4 text-xs">
              {validationError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {validationError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Book Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chronicles of Aethelgard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief synopsis of your novel..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Genre
                  </label>
                  <input
                    type="text"
                    placeholder="Epic Fantasy, Sci-Fi, Thriller..."
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookStatus)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Drafting">Drafting</option>
                    <option value="Editing">Editing</option>
                    <option value="Complete">Complete</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Cover Color Accent
                </label>
                <div className="flex items-center gap-3">
                  {['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCoverColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        coverColor === color ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#232334] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-purple"
                >
                  {editingBook ? 'Update Book' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
