'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delayMs?: number;
}

export function useAutoSave<T>({ data, onSave, delayMs = 1000 }: UseAutoSaveOptions<T>) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T>(data);

  dataRef.current = data;

  const triggerSave = useCallback(async () => {
    setSaveStatus('saving');
    await onSave(dataRef.current);
    setSaveStatus('saved');
  }, [onSave]);

  useEffect(() => {
    setSaveStatus('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      triggerSave();
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delayMs, triggerSave]);

  const flushSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      await triggerSave();
    }
  }, [triggerSave]);

  return { saveStatus, flushSave };
}
