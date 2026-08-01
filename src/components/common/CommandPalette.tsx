'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, BookOpen, Layers, Users, Shield, Package, MapPin, GitBranch,
  Flame, Settings, Sparkles, Palette, Info, ChevronRight, X
} from 'lucide-react';
import { useTheme, ThemeId } from '@/lib/theme/ThemeContext';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Themes';
  icon: any;
  shortcut?: string;
  perform: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  activeBookId = 'book-1'
}: {
  isOpen: boolean;
  onClose: () => void;
  activeBookId?: string;
}) {
  const router = useRouter();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', title: 'Go to Dashboard', category: 'Navigation', icon: Layers, perform: () => router.push('/dashboard') },
    { id: 'nav-books', title: 'View All Books', category: 'Navigation', icon: BookOpen, perform: () => router.push('/books') },
    { id: 'nav-chapters', title: 'Open Chapters Manager', category: 'Navigation', icon: BookOpen, perform: () => router.push(`/books/${activeBookId}/chapters`) },
    { id: 'nav-characters', title: 'View Story Characters', category: 'Navigation', icon: Users, perform: () => router.push(`/books/${activeBookId}/characters`) },
    { id: 'nav-abilities', title: 'View Abilities & Magic System', category: 'Navigation', icon: Shield, perform: () => router.push(`/books/${activeBookId}/abilities`) },
    { id: 'nav-items', title: 'View Items & Relics', category: 'Navigation', icon: Package, perform: () => router.push(`/books/${activeBookId}/items`) },
    { id: 'nav-locations', title: 'View Map & Locations', category: 'Navigation', icon: MapPin, perform: () => router.push(`/books/${activeBookId}/locations`) },
    { id: 'nav-timeline', title: 'View Visual Timeline', category: 'Navigation', icon: GitBranch, perform: () => router.push(`/books/${activeBookId}/timeline`) },
    { id: 'nav-[#analytics]', title: 'Open Writing Analytics & Heatmap', category: 'Navigation', icon: Flame, perform: () => router.push('/analytics') },
    { id: 'nav-settings', title: 'Settings & BYOK API Keys', category: 'Navigation', icon: Settings, perform: () => router.push('/settings') },
    { id: 'nav-about', title: 'About Notter & Developer Diagnostics', category: 'Navigation', icon: Info, perform: () => router.push('/about') },

    // Actions
    { id: 'act-sprint', title: 'Launch Sprint Mode 2.0', category: 'Actions', icon: Flame, shortcut: 'Sprint', perform: () => router.push('/analytics') },
    { id: 'act-ai', title: 'Analyze Current Chapter with AI', category: 'Actions', icon: Sparkles, perform: () => router.push(`/books/${activeBookId}/chapters`) },

    // Themes
    { id: 'theme-obsidian', title: 'Switch Theme: Obsidian', category: 'Themes', icon: Palette, perform: () => theme.setTheme('obsidian') },
    { id: 'theme-amoled', title: 'Switch Theme: AMOLED Black', category: 'Themes', icon: Palette, perform: () => theme.setTheme('amoled') },
    { id: 'theme-dracula', title: 'Switch Theme: Dracula', category: 'Themes', icon: Palette, perform: () => theme.setTheme('dracula') },
    { id: 'theme-nord', title: 'Switch Theme: Nord', category: 'Themes', icon: Palette, perform: () => theme.setTheme('nord') },
    { id: 'theme-catppuccin', title: 'Switch Theme: Catppuccin Mocha', category: 'Themes', icon: Palette, perform: () => theme.setTheme('catppuccin') },
    { id: 'theme-sepia', title: 'Switch Theme: Sepia', category: 'Themes', icon: Palette, perform: () => theme.setTheme('sepia') },
    { id: 'theme-dark', title: 'Switch Theme: Dark Default', category: 'Themes', icon: Palette, perform: () => theme.setTheme('dark') }
  ];

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].perform();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-md p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Search Header */}
        <div className="px-4 py-3.5 border-b border-[#232334] bg-[#0c0c10] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#7c3aed]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g. 'chapters', 'sprint', 'obsidian')..."
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-[#52526b]"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#181820] text-[#8e8ea0] rounded border border-[#232334]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8e8ea0]">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.perform();
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-left transition-all ${
                    isSelected
                      ? 'bg-[#7c3aed] text-white shadow-purple'
                      : 'text-[#a1a1aa] hover:bg-[#181820] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{item.title}</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#181820] text-[#8e8ea0]'
                  }`}>
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 border-t border-[#232334] bg-[#0c0c10] flex items-center justify-between text-[11px] text-[#8e8ea0]">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-[#181820] px-1.5 py-0.5 rounded text-white border border-[#232334]">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-[#181820] px-1.5 py-0.5 rounded text-white border border-[#232334]">↵</kbd> Select</span>
          </div>
          <span>Notter Command Palette v2.2</span>
        </div>

      </div>
    </div>
  );
}
