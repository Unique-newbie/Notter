'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  GitBranch,
  Layers,
  Users,
  Package,
  MapPin,
  Shield,
  Flame,
  Info,
  Merge,
  Eye,
  HardDrive,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeBookId?: string;
  bookTitle?: string;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeBookId,
}: SidebarProps) {
  const pathname = usePathname();

  const currentBookId = activeBookId || 'book-1';

  const mainNavItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Books',
      href: '/books',
      icon: BookOpen,
    },
    {
      label: 'Writing Analytics',
      href: '/analytics',
      icon: Flame,
    },
    {
      label: 'Settings & Keys',
      href: '/settings',
      icon: Settings,
    },
    {
      label: 'About & Diagnostics',
      href: '/about',
      icon: Info,
    },
  ];

  const bookNavItems = [
    {
      label: 'Overview',
      href: `/books/${currentBookId}`,
      icon: Layers,
    },
    {
      label: 'Chapters',
      href: `/books/${currentBookId}/chapters`,
      icon: BookOpen,
    },
    {
      label: 'Characters',
      href: `/books/${currentBookId}/characters`,
      icon: Users,
    },
    {
      label: 'Abilities',
      href: `/books/${currentBookId}/abilities`,
      icon: Shield,
    },
    {
      label: 'Items & Relics',
      href: `/books/${currentBookId}/items`,
      icon: Package,
    },
    {
      label: 'Locations',
      href: `/books/${currentBookId}/locations`,
      icon: MapPin,
    },
    {
      label: 'Interactive Graph',
      href: `/books/${currentBookId}/graph`,
      icon: GitBranch,
    },
    {
      label: 'Story Timeline',
      href: `/books/${currentBookId}/timeline`,
      icon: Clock,
    },
    {
      label: 'AI Playground',
      href: `/books/${currentBookId}/playground`,
      icon: Sparkles,
    },
    {
      label: 'Manuscript Reader',
      href: `/books/${currentBookId}/read`,
      icon: Eye,
    },
    {
      label: 'Consistency Audit',
      href: `/books/${currentBookId}/audit`,
      icon: ShieldAlert,
    },
    {
      label: 'Duplicate Review',
      href: `/books/${currentBookId}/duplicates`,
      icon: Merge,
    },
  ];

  return (
    <aside
      className={cn(
        'relative z-30 flex h-screen shrink-0 flex-col',
        'border-r border-[#292932]',
        'bg-[#0d0d10] text-[#f4f4f5]',
        'transition-all duration-200',
        'select-none',
        collapsed ? 'w-[68px]' : 'w-[248px]'
      )}
    >
      {/* ─────────────────────────────────────────
          BRAND
      ───────────────────────────────────────── */}
      <div
        className={cn(
          'flex h-[68px] shrink-0 items-center',
          collapsed
            ? 'justify-center px-2'
            : 'justify-between px-4'
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            'group flex items-center',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          <img
            src="/logo-icon.png"
            alt="Notter Logo"
            className={cn(
              'object-contain transition-transform duration-200',
              collapsed ? 'h-8 w-8' : 'h-9 w-9',
              'group-hover:scale-[1.03]'
            )}
          />

          {!collapsed && (
            <div className="leading-none">
              <span className="block text-[15px] font-semibold tracking-tight text-[#f4f4f5]">
                Notter
              </span>

              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b5cf6]">
               Stories, Organized.  
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="
              rounded-md p-1.5
              text-[#52525b]
              transition-colors
              hover:bg-[#18181e]
              hover:text-[#a1a1aa]
            "
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>


      {/* ─────────────────────────────────────────
          NAVIGATION
      ───────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-0">

        {/* Main */}
        <div>
          {!collapsed && (
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525b]">
              Workspace
            </div>
          )}

          <nav className="space-y-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href === '/books' &&
                  pathname.startsWith('/books') &&
                  !pathname.includes(`/books/${currentBookId}`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center rounded-lg',
                    'transition-colors duration-150',
                    collapsed
                      ? 'h-10 justify-center'
                      : 'h-10 gap-3 px-3',
                    isActive
                      ? 'bg-[#19151f] text-[#e9d5ff]'
                      : 'text-[#8e8e98] hover:bg-[#151519] hover:text-[#e4e4e7]'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span
                      className={cn(
                        'absolute left-0 h-5 w-0.5 rounded-full bg-[#8b5cf6]',
                        collapsed ? 'left-1' : 'left-0'
                      )}
                    />
                  )}

                  <Icon
                    className={cn(
                      'shrink-0',
                      collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4',
                      isActive
                        ? 'text-[#a78bfa]'
                        : 'text-[#666671] group-hover:text-[#a1a1aa]'
                    )}
                  />

                  {!collapsed && (
                    <span className="truncate text-[13px] font-medium">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>


        {/* ───────────────────────────────────────
            ACTIVE BOOK
        ─────────────────────────────────────── */}
        {pathname.includes('/books/') && (
          <div className="mt-7">

            {!collapsed && (
              <div className="mb-2 px-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525b]">
                    Current book
                  </span>

                  <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                </div>
              </div>
            )}

            <nav className="space-y-0.5">
              {bookNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center rounded-lg',
                      'transition-colors duration-150',
                      collapsed
                        ? 'h-9 justify-center'
                        : 'h-9 gap-3 px-3',
                      isActive
                        ? 'bg-[#18181d] text-[#d4d4d8]'
                        : 'text-[#696972] hover:bg-[#151519] hover:text-[#b4b4bc]'
                    )}
                  >
                    {isActive && (
                      <span
                        className={cn(
                          'absolute left-0 h-4 w-0.5 rounded-full bg-[#8b5cf6]',
                          collapsed ? 'left-1' : 'left-0'
                        )}
                      />
                    )}

                    <Icon
                      className={cn(
                        'shrink-0',
                        collapsed
                          ? 'h-[15px] w-[15px]'
                          : 'h-[14px] w-[14px]',
                        isActive
                          ? 'text-[#a78bfa]'
                          : 'text-[#55555f] group-hover:text-[#85858e]'
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate text-xs font-medium">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────
          EXPAND BUTTON
      ───────────────────────────────────────── */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="
            absolute -right-4 top-[40px]
            flex h-8 w-8 items-center justify-center
            rounded-full
            border border-[#292932]
            bg-[#151519]
            text-[#71717a]
            shadow-sm
            transition-colors
            hover:border-[#3f3f46]
            hover:bg-[#1c1c22]
            hover:text-[#d4d4d8]
          "
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </aside>
  );
}