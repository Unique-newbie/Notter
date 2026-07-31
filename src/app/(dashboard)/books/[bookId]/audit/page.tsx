'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ConsistencyReportView } from '@/components/audit/ConsistencyReportView';

export default function AuditPage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <ConsistencyReportView bookId={bookId} />
    </div>
  );
}
