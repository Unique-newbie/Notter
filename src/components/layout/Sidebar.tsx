'use client';

import React, { useEffect, useState } from 'react';
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
  Merge,
  Eye,
  Clock,
  Quote,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  bookTitle?: string;
}

interface QuoteData {
  q: string;
  a: string;
}

const QUOTE_CACHE_KEY = 'notter_quotes_cache';
const QUOTE_CACHE_TIME_KEY = 'notter_quotes_cache_time';
const QUOTE_CACHE_DURATION = 60 * 60 * 1000;

const FALLBACK_QUOTES: QuoteData[] = [
  {
    q: 'The first draft is just you telling yourself the story.',
    a: 'Terry Pratchett',
  },
  {
    q: 'You can always edit a bad page. You can’t edit a blank page.',
    a: 'Jodi Picoult',
  },
  {
    q: 'Start writing, no matter what. The water does not flow until the faucet is turned on.',
    a: 'Louis L’Amour',
  },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  bookTitle,
}: SidebarProps) {
  const pathname = usePathname();

  /*
   * The URL is the source of truth.
   *
   * /dashboard
   * /analytics
   * /settings
   *     → no book navigation
   *
   * /books/:bookId
   * /books/:bookId/chapters
   * /books/:bookId/graph
   *     → book navigation
   */
  const bookPathMatch =
    pathname.match(/^\/books\/([^/]+)/);

  const currentBookId = bookPathMatch?.[1];
  const isInsideBook = Boolean(currentBookId);

  const [quote, setQuote] =
    useState<QuoteData | null>(null);

  const [isRefreshingQuote, setIsRefreshingQuote] =
    useState(false);

  const mainNavItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
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
  ];

  const bookNavItems = currentBookId
    ? [
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
      ]
    : [];

  const loadQuotes = async (
    forceRefresh = false
  ) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const cachedQuotes =
        localStorage.getItem(QUOTE_CACHE_KEY);

      const cachedAt =
        localStorage.getItem(
          QUOTE_CACHE_TIME_KEY
        );

      const cacheAge = cachedAt
        ? Date.now() - Number(cachedAt)
        : Infinity;

      if (
        !forceRefresh &&
        cachedQuotes &&
        cacheAge < QUOTE_CACHE_DURATION
      ) {
        const parsed =
          JSON.parse(cachedQuotes) as QuoteData[];

        if (parsed.length > 0) {
          setQuote(
            parsed[
              Math.floor(
                Math.random() * parsed.length
              )
            ]
          );

          return;
        }
      }

      setIsRefreshingQuote(true);

      const response = await fetch(
        '/api/quotes',
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          'Failed to load quotes.'
        );
      }

      const data =
        (await response.json()) as QuoteData[];

      if (
        !Array.isArray(data) ||
        data.length === 0
      ) {
        throw new Error(
          'No quotes returned.'
        );
      }

      localStorage.setItem(
        QUOTE_CACHE_KEY,
        JSON.stringify(data)
      );

      localStorage.setItem(
        QUOTE_CACHE_TIME_KEY,
        Date.now().toString()
      );

      setQuote(
        data[
          Math.floor(
            Math.random() * data.length
          )
        ]
      );
    } catch {
      setQuote(
        FALLBACK_QUOTES[
          Math.floor(
            Math.random() *
              FALLBACK_QUOTES.length
          )
        ]
      );
    } finally {
      setIsRefreshingQuote(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const handleRefreshQuote = async () => {
    if (isRefreshingQuote) {
      return;
    }

    await loadQuotes(true);
  };

  return (
    <aside
      className={cn(
        'relative z-30 flex h-full shrink-0 flex-col',
        'border-r border-[#292932]',
        'bg-[#0d0d10] text-[#f4f4f5]',
        'transition-all duration-200',
        'select-none',
        collapsed
          ? 'w-[68px]'
          : 'w-[248px]'
      )}
    >
      {/* Header */}
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
            collapsed
              ? 'justify-center'
              : 'gap-2.5'
          )}
        >
          <img
            src="/logo-icon.png"
            alt="Notter Logo"
            className={cn(
              'object-contain transition-transform duration-200',
              collapsed
                ? 'h-8 w-8'
                : 'h-9 w-9',
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
            className="rounded-md p-1.5 text-[#52525b] transition-colors hover:bg-[#18181e] hover:text-[#a1a1aa]"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scrollable navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">

        {/* Workspace */}
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
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={cn(
                    'group relative flex items-center rounded-lg',
                    'transition-colors duration-150',
                    collapsed
                      ? 'h-10 justify-center'
                      : 'h-10 gap-3 px-3',
                    isActive
                      ? 'bg-[#18151f] text-[#f4f4f5]'
                      : 'text-[#696972] hover:bg-[#151519] hover:text-[#b4b4bc]'
                  )}
                >
                  {isActive && (
                    <span
                      className={cn(
                        'absolute left-0 h-5 w-0.5 rounded-full bg-[#8b5cf6]',
                        collapsed && 'left-1'
                      )}
                    />
                  )}

                  <Icon
                    className={cn(
                      'shrink-0',
                      collapsed
                        ? 'h-[15px] w-[15px]'
                        : 'h-[16px] w-[16px]',
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

        {/* Current Book */}
        {isInsideBook && currentBookId && (
          <div className="mt-6">
            {!collapsed && (
              <div className="mb-2 px-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525b]">
                  Current Book
                </div>

                <div className="mt-2 flex items-center gap-2 px-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#8b5cf6]" />

                  <span className="truncate text-[11px] font-medium text-[#71717a]">
                    {bookTitle ||
                      'Current Book'}
                  </span>
                </div>
              </div>
            )}

            <nav className="space-y-0.5">
              {bookNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={
                      collapsed
                        ? item.label
                        : undefined
                    }
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
                          collapsed && 'left-1'
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

      {/* Inspiration */}
      {!collapsed && (
        <div className="shrink-0 border-t border-[#202026] px-3 py-3">
          <div className="rounded-xl border border-[#232334] bg-[#111116] p-3">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Quote className="h-3.5 w-3.5 text-[#8b5cf6]" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#52525b]">
                  Inspiration
                </span>
              </div>

              <button
                onClick={handleRefreshQuote}
                disabled={isRefreshingQuote}
                className="rounded-md p-1 text-[#52525b] transition hover:bg-[#18181f] hover:text-[#a78bfa] disabled:cursor-not-allowed disabled:opacity-50"
                title="New quote"
                aria-label="Get a new quote"
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    isRefreshingQuote &&
                      'animate-spin'
                  )}
                />
              </button>
            </div>

            {quote ? (
              <>
                <p className="mt-2.5 text-[10px] leading-[1.4rem] text-[#a1a1aa]">
                  “{quote.q}”
                </p>

                <p className="mt-2 text-[9px] font-medium text-[#666672]">
                  — {quote.a}
                </p>
              </>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="h-2 w-full animate-pulse rounded bg-[#18181f]" />
                <div className="h-2 w-4/5 animate-pulse rounded bg-[#18181f]" />
                <div className="h-2 w-2/5 animate-pulse rounded bg-[#18181f]" />
              </div>
            )}

            <a
              href="https://zenquotes.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 block text-[8px] text-[#3f3f46] transition hover:text-[#71717a]"
            >
              Quotes by ZenQuotes
            </a>
          </div>
        </div>
      )}

      {/* Expand button */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-4 top-[40px] flex h-8 w-8 items-center justify-center rounded-full border border-[#292932] bg-[#151519] text-[#71717a] shadow-sm transition-colors hover:border-[#3f3f46] hover:bg-[#1c1c22] hover:text-[#d4d4d8]"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </aside>
  );
}