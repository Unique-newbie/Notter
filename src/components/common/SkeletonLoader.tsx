'use client';

import React from 'react';

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-[#121218] border border-[#232334] animate-pulse space-y-4">
      <div className="w-full h-40 bg-[#181820] rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 bg-[#181820] rounded w-3/4" />
        <div className="h-3 bg-[#181820] rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-[#121218] border border-[#232334] rounded-xl" />
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-[#121218] border border-[#232334] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#181820]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#181820] rounded w-1/3" />
            <div className="h-3 bg-[#181820] rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
