'use client';

import { useRpcHealth } from '@/lib/rpc-health';
import { Activity } from 'lucide-react';

/**
 * Formats a time duration in milliseconds to a human-readable string.
 * E.g., 120000 -> "2m", 5000 -> "5s", 500 -> "500ms"
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60_000) {
    return `${Math.floor(ms / 1000)}s`;
  }
  return `${Math.floor(ms / 60_000)}m`;
}

/**
 * Status indicator showing RPC health metrics.
 * Displays time since last successful read and latency, with warning color when stale.
 */
export default function RpcHealthIndicator() {
  const { metrics } = useRpcHealth();
  const { lastSuccessfulRead, lastLatencyMs, isStale } = metrics;

  // Don't show anything until we have at least one successful read
  if (lastSuccessfulRead === null) {
    return null;
  }

  const timeSinceLastRead = Date.now() - lastSuccessfulRead;
  const latencyText = lastLatencyMs !== null ? `${formatDuration(lastLatencyMs)}` : null;
  const timeText = formatDuration(timeSinceLastRead);

  return (
    <div
      className={`flex items-center gap-2 text-xs ${
        isStale ? 'text-amber-400' : 'text-slate-500'
      }`}
      title={`RPC: Last successful read ${timeText} ago, latency ${latencyText || 'unknown'}`}
    >
      <Activity size={14} className={isStale ? 'animate-pulse' : ''} />
      <span>
        {timeText} ago
        {latencyText && (
          <>
            {' · '}
            <span className={isStale ? 'text-amber-300' : 'text-slate-400'}>
              {latencyText}
            </span>
          </>
        )}
      </span>
    </div>
  );
}
