'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { CommandPalette } from '@/components/common/CommandPalette';
import { useParams, useRouter } from 'next/navigation';

import { OfflineBanner } from '@/components/common/OfflineBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const params = useParams();
  const router = useRouter();
  const activeBookId = (params?.bookId as string) || 'book-1';

  // Listen for Ctrl+K or Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
        <OfflineBanner />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            activeBookId={activeBookId}
          />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              activeBookId={activeBookId}
              onSelectBook={(bookId) => router.push(`/books/${bookId}`)}
            />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--bg-main)] text-[var(--text-main)]">
              {children}
            </main>
          </div>
        </div>

        {/* Global VS Code Style Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          activeBookId={activeBookId}
        />
      </div>
    </ThemeProvider>
  );
}
