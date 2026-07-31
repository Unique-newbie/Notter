'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useParams, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const params = useParams();
  const router = useRouter();
  const activeBookId = (params?.bookId as string) || 'book-1';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b]">
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
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#09090b] text-[#f4f4f5]">
          {children}
        </main>
      </div>
    </div>
  );
}
