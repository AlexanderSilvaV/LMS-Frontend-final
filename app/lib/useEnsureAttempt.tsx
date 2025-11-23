"use client";
import { useEffect, useRef, useState } from 'react';
import { ensureEvaluacionSession } from './attempt-util';

export function useEnsureAttempt(evaluacionId: number) {
  const startedRef = useRef(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!evaluacionId || startedRef.current) return;
    let mounted = true;
    startedRef.current = true;
    setLoading(true);

    (async () => {
      try {
        const info = await ensureEvaluacionSession(evaluacionId);
        if (!mounted) return;
        setSessionInfo(info);
      } catch (err: any) {
        console.error('Error ensuring evaluation session', err);
        if (!mounted) return;
        setError(err?.message || String(err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [evaluacionId]);

  return { sessionInfo, loading, error };
}
