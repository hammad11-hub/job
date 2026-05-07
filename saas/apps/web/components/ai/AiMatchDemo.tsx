"use client";

import { useEffect, useState } from 'react';
import { Button } from '@hireos/ui';

interface MatchResponse {
  summary: string;
  confidence: number;
}

export default function AiMatchDemo() {
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMatch = async () => {
    setLoading(true);
    setError('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiBase}/ai/match/demo`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch AI summary');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, []);

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-soft">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">AI Match demo</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Candidate fit at a glance</h2>
        </div>
        <Button variant="secondary" onClick={fetchMatch} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh summary'}
        </Button>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 min-h-[220px]">
        {loading ? (
          <p className="text-slate-400">Loading AI summary…</p>
        ) : error ? (
          <p className="text-sm text-rose-300">{error}</p>
        ) : result ? (
          <>
            <p className="text-sm text-slate-400">Confidence score</p>
            <p className="mt-2 text-3xl font-semibold text-white">{Math.round(result.confidence * 100)}%</p>
            <div className="mt-6 text-slate-300 whitespace-pre-wrap">{result.summary}</div>
          </>
        ) : (
          <p className="text-slate-400">No AI summary available yet.</p>
        )}
      </div>
    </div>
  );
}
