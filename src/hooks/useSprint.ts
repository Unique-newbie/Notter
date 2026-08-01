'use client';

import { useState, useEffect, useCallback } from 'react';
import { sprintStore, ActiveSprintSnapshot } from '@/lib/store/sprintStore';

export function useSprint(bookId: string) {
  const [activeSnapshot, setActiveSnapshot] = useState<ActiveSprintSnapshot | null>(null);

  useEffect(() => {
    const snap = sprintStore.getActiveSnapshot();
    if (snap && snap.bookId === bookId) {
      setActiveSnapshot(snap);
    }
  }, [bookId]);

  const clearSnapshot = useCallback(() => {
    sprintStore.clearActiveSnapshot();
    setActiveSnapshot(null);
  }, []);

  return {
    activeSnapshot,
    clearSnapshot
  };
}
