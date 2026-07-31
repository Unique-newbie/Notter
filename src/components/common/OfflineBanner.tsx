'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (!navigator.onLine) setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-black px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-200">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Working Offline – All drafting &amp; sprint snapshots are saved locally to your browser.</span>
    </div>
  );
}
