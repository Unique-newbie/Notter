'use client';

import React, { useState } from 'react';
import { ConsistencyReport, ConsistencyIssue } from '@/types';
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Zap, Bug, ArrowRight } from 'lucide-react';
import { repository } from '@/lib/store/repository';

interface ConsistencyReportViewProps {
  bookId: string;
}

export function ConsistencyReportView({ bookId }: ConsistencyReportViewProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ConsistencyReport | null>(null);

  const runConsistencyCheck = async () => {
    setLoading(true);
    try {
      const [chapters, characters, items, abilities, timelineEvents, relationships] = await Promise.all([
        repository.getChapters(bookId),
        repository.getCharacters(bookId),
        repository.getItems(bookId),
        repository.getAbilities(bookId),
        repository.getTimelineEvents(bookId),
        repository.getRelationships(bookId)
      ]);

      const res = await fetch('/api/check-consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          chapters,
          characters,
          items,
          abilities,
          timelineEvents,
          relationships
        })
      });

      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error("Consistency check error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Trigger */}
      <div className="p-6 rounded-xl bg-[#121218] border border-[#232334] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#7c3aed]" /> Narrative Consistency Auditor
          </h2>
          <p className="text-xs text-[#8e8ea0] mt-1 max-w-xl">
            Cross-validate your Story Bible for character contradictions, out-of-order timeline jumps, destroyed items reappearing, and ability mismatches.
          </p>
        </div>

        <button
          onClick={runConsistencyCheck}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs transition-all shadow-purple disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Story Bible...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" /> Run Consistency Analysis
            </>
          )}
        </button>
      </div>

      {/* Initial Empty State */}
      {!report && !loading && (
        <div className="p-12 text-center bg-[#121218] border border-[#232334] rounded-xl text-[#8e8ea0]">
          <Bug className="w-10 h-10 mx-auto mb-3 text-[#7c3aed] opacity-50" />
          <h3 className="text-sm font-semibold text-white">No Active Audit Report</h3>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Click "Run Consistency Analysis" to scan all chapters and entities in this book.
          </p>
        </div>
      )}

      {/* Audit Report Results */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#121218] border border-[#232334]">
              <div className="text-xs text-[#8e8ea0]">Chapters Audited</div>
              <div className="text-2xl font-bold text-white mt-1">{report.totalChaptersAudited}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#121218] border border-[#232334]">
              <div className="text-xs text-[#8e8ea0]">Issues Found</div>
              <div className={`text-2xl font-bold mt-1 ${report.issues.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {report.issues.length}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#121218] border border-[#232334]">
              <div className="text-xs text-[#8e8ea0]">Consistency Health</div>
              <div className="text-2xl font-bold text-[#a78bfa] mt-1">
                {report.issues.length === 0 ? '100% Clean' : `${Math.max(60, 100 - report.issues.length * 10)}%`}
              </div>
            </div>
          </div>

          {/* Clean Health Badge */}
          {report.issues.length === 0 && (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Perfect Narrative Consistency!</h4>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  No character contradictions, timeline jumps, or item anomalies were detected across your chapters.
                </p>
              </div>
            </div>
          )}

          {/* Issues List */}
          {report.issues.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                Consistency Warnings ({report.issues.length})
              </h3>

              <div className="space-y-3">
                {report.issues.map((issue) => {
                  const isHigh = issue.severity === 'High';
                  const isMedium = issue.severity === 'Medium';

                  return (
                    <div
                      key={issue.id}
                      className={`p-4 rounded-xl bg-[#121218] border ${
                        isHigh ? 'border-red-500/40 bg-red-500/5' : isMedium ? 'border-amber-500/40 bg-amber-500/5' : 'border-[#232334]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${isHigh ? 'text-red-400' : 'text-amber-400'}`} />
                          <h4 className="font-bold text-white text-sm">{issue.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#a78bfa]">
                            {issue.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              isHigh
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {issue.severity} Severity
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-[#232334] flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                        <div className="text-[11px] text-[#8e8ea0]">
                          Affected Chapters: <strong className="text-white">Ch {issue.affectedChapterNumbers.join(', Ch ')}</strong>
                        </div>

                        <div className="text-xs font-semibold text-[#a78bfa] flex items-center gap-1">
                          Fix: <span className="text-white font-normal">{issue.suggestedFix}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
