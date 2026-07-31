'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, Settings, Sparkles, ChevronLeft, ChevronRight, ShieldAlert, GitBranch, Layers, LogOut, Users, Package, MapPin, Shield, User, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeBookId?: string;
  bookTitle?: string;
}

export function Sidebar({ collapsed, onToggleCollapse, activeBookId }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const currentBookId = activeBookId || 'book-1';

  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Books', href: '/books', icon: BookOpen },
    { label: 'Writing Analytics', href: '/analytics', icon: Flame },
    { label: 'Profile & Themes', href: '/profile', icon: User },
    { label: 'Settings & Keys', href: '/settings', icon: Settings },
  ];

  const bookNavItems = [
    { label: 'Overview', href: `/books/${currentBookId}`, icon: Layers },
    { label: 'Chapters', href: `/books/${currentBookId}/chapters`, icon: BookOpen },
    { label: 'Characters', href: `/books/${currentBookId}/characters`, icon: Users },
    { label: 'Abilities', href: `/books/${currentBookId}/abilities`, icon: Shield },
    { label: 'Items & Relics', href: `/books/${currentBookId}/items`, icon: Package },
    { label: 'Locations', href: `/books/${currentBookId}/locations`, icon: MapPin },
    { label: 'Visual Timeline', href: `/books/${currentBookId}/timeline`, icon: GitBranch },
    { label: 'Consistency Audit', href: `/books/${currentBookId}/audit`, icon: ShieldAlert },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r border-[#232334] bg-[#0c0c10] text-[#f4f4f5] transition-all duration-300 z-30 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#232334] bg-[#09090b]">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center text-white shadow-purple group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base">Notter</span>
              <span className="text-[10px] font-semibold tracking-wider text-[#a78bfa] block -mt-1 uppercase">Fiction Engine</span>
            </div>
          </Link>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center text-white mx-auto shadow-purple">
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#1e1e2a] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!collapsed && (
            <h3 className="px-2 text-[10px] font-bold tracking-wider uppercase text-[#8e8ea0] mb-2">Main Menu</h3>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#7c3aed] text-white shadow-purple"
                      : "text-[#a1a1aa] hover:bg-[#1a1a24] hover:text-white"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Current Active Book Navigation */}
        {pathname.includes('/books/') && (
          <div>
            {!collapsed && (
              <div className="px-2 mb-2">
                <h3 className="text-[10px] font-bold tracking-wider uppercase text-[#8e8ea0]">Active Book</h3>
              </div>
            )}
            <nav className="space-y-1">
              {bookNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      isActive
                        ? "bg-[#1e1e2a] text-[#a78bfa] border-l-2 border-[#7c3aed] font-semibold"
                        : "text-[#a1a1aa] hover:bg-[#1a1a24] hover:text-white"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Info & Logout */}
      {!collapsed && (
        <div className="p-3 border-t border-[#232334] bg-[#09090b] text-[11px] text-[#8e8ea0] flex items-center justify-between">
          <div className="truncate max-w-[140px] text-white font-medium">
            {user?.email || 'Logged in'}
          </div>
          <button
            onClick={logout}
            className="p-1 text-[#8e8ea0] hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
