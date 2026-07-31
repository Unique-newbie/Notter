'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="p-12 rounded-2xl bg-[#121218] border border-[#232334] text-center space-y-4 max-w-lg mx-auto my-8 select-none shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-[#181820] border border-[#232334] flex items-center justify-center text-[#a78bfa] mx-auto shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="font-bold text-white text-base">{title}</h3>
        <p className="text-xs text-[#8e8ea0] mt-1 leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] shadow-purple transition-all"
        >
          <Plus className="w-4 h-4" /> {actionLabel}
        </button>
      )}
    </div>
  );
}
