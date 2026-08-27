'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SupportBanner } from '@/components/layout/SupportBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Support Banner */}
      <SupportBanner />

      {/* Workspace */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() =>
            setCollapsed((prev) => !prev)
          }
        />

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-main)] p-6 text-[var(--text-main)] md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}