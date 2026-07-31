'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { useParams, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const params = useParams();
  const router = useRouter();
  const activeBookId = (params?.bookId as string) || 'book-1';

  return (
    <ThemeProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
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
    </ThemeProvider>
  );
}
