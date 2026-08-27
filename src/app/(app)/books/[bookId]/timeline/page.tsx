'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { TimelineEvent, Chapter } from '@/types';
import { TimelineVisualizer } from '@/components/timeline/TimelineVisualizer';
import { GitBranch } from 'lucide-react';

export default function TimelinePage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const loadTimelineData = async () => {
    const evs = await repository.getTimelineEvents(bookId);
    setTimelineEvents(evs);
    const chaps = await repository.getChapters(bookId);
    setChapters(chaps);
  };

  useEffect(() => {
    loadTimelineData();
    const handleDataChanged = () => loadTimelineData();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <GitBranch className="w-6 h-6 text-[#7c3aed]" /> Visual Interactive Timeline
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Chronological story sequence, arc markers, and time jumps extracted from chapters.
        </p>
      </div>

      <TimelineVisualizer
        bookId={bookId}
        timelineEvents={timelineEvents}
        chapters={chapters}
        onRefresh={loadTimelineData}
      />
    </div>
  );
}
