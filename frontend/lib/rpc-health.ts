'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Time threshold (in milliseconds) after which the RPC is considered stale.
 * 30 seconds is chosen as a reasonable threshold for detecting slow/behind nodes.
 */
const STALE_THRESHOLD_MS = 30_000;

export interface RpcHealthMetrics {
  /** Timestamp of the last successful RPC read */
  lastSuccessfulRead: number | null;
  /** Latency of the last successful RPC read in milliseconds */
  lastLatencyMs: number | null;
  /** Whether the RPC is considered stale (last read older than threshold) */
  isStale: boolean;
}

interface RpcHealthContextValue {
  metrics: RpcHealthMetrics;
  recordSuccessfulRead: (latencyMs: number) => void;
}

const RpcHealthContext = createContext<RpcHealthContextValue | null>(null);

export function RpcHealthProvider({ children }: { children: ReactNode }) {
  const [lastSuccessfulRead, setLastSuccessfulRead] = useState<number | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  const recordSuccessfulRead = useCallback((latencyMs: number) => {
    const now = Date.now();
    setLastSuccessfulRead(now);
    setLastLatencyMs(latencyMs);
  }, []);

  const isStale = lastSuccessfulRead === null 
    ? false 
    : Date.now() - lastSuccessfulRead > STALE_THRESHOLD_MS;

  const metrics: RpcHealthMetrics = {
    lastSuccessfulRead,
    lastLatencyMs,
    isStale,
  };

  return (
    <RpcHealthContext.Provider value={{ metrics, recordSuccessfulRead }}>
      {children}
    </RpcHealthContext.Provider>
  );
}

export function useRpcHealth(): RpcHealthContextValue {
  const context = useContext(RpcHealthContext);
  if (!context) {
    throw new Error('useRpcHealth must be used within RpcHealthProvider');
  }
  return context;
}

/**
 * Wraps an async function to record RPC health metrics on success.
 * Measures latency and records the timestamp when the call succeeds.
 */
export function withRpcHealthTracking<T>(
  fn: () => Promise<T>,
  recordSuccessfulRead: (latencyMs: number) => void
): () => Promise<T> {
  return async () => {
    const start = Date.now();
    try {
      const result = await fn();
      const latency = Date.now() - start;
      recordSuccessfulRead(latency);
      return result;
    } catch (error) {
      // Don't record failed reads as successful
      throw error;
    }
  };
}
