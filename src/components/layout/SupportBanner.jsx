'use client';

import React, { useEffect, useState } from 'react';
import { Github, KoFi } from '@thesvg/react';
import { Heart, X } from 'lucide-react';


const DISMISS_KEY = 'notter-support-banner-dismissed';
const DISMISS_DAYS = 1;

export function SupportBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);

    if (!dismissedAt) {
      setVisible(true);
      return;
    }

    const dismissedTime = Number(dismissedAt);
    const daysSinceDismissed =
      (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    if (daysSinceDismissed >= DISMISS_DAYS) {
      localStorage.removeItem(DISMISS_KEY);
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="shrink-0 border-b border-[#292932] bg-[#101014]">
      <div className="mx-auto flex min-h-[44px] w-full items-center gap-3 px-4 py-2 md:px-6">

        {/* Message */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 ml-5">
          <Heart className="h-6 w-6 shrink-0 text-[#b50f33] hover:fill-red-600" />

          <p className="truncate text-m text-[#a1a1aa] hover:text-[#ffffff]">
            Enjoying Notter?
            <span className="ml-1 text-[#71717a] hover:text-[#ffffff]">
              Consider supporting its development.
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 mr-5">

          <a
            href="https://github.com/Unique-newbie/Notter"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-1.5
              rounded-md
              px-2.5 py-1.5
              text-xs font-medium
              bg-[#424246]
              text-[#bcbcc6]
              transition
              hover:bg-[#fffcff]
              hover:text-[#000000]
            "
          >
            <Github variant="light" className="h-6 w-6" />
            <span className="hidden sm:inline">
              Star on GitHub
            </span>
            <span className="sm:hidden">
              GitHub
            </span>
          </a>

          <a
            href="https://ko-fi.com/Zeromoney"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-1.5
              rounded-md
              bg-[#424246]
              px-2.5 py-1.5
              text-xs font-medium
              text-white
              transition
              hover:bg-[#fffcff]
              hover:text-[#000000]
            "
          >
            <KoFi className="h-6 w-6" />
            Support
          </a>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss support banner"
            className="
              ml-1
              rounded-md
              p-1.5
              text-[#82828a]
              transition
              hover:bg-[#535354]
              hover:text-[#ffffff]
            "
          >
            <X className="h-3.5 w-3.5" />
          </button>

        </div>
      </div>
    </div>
  );
}