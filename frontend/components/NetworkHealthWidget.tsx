'use client';

import { useRpcHealth } from '@/lib/rpc-health';
import { Activity, Clock, Database } from 'lucide-react';

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
 * Formats a number with commas for thousands.
 * E.g., 1234567 -> "1,234,567"
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Comprehensive network health widget showing RPC latency and ledger lag.
 * Displays time since last successful read, latency, ledger number, and ledger lag,
 * with warning colors when data is stale.
 */
export default function NetworkHealthWidget() {
  const { metrics } = useRpcHealth();
  const { lastSuccessfulRead, lastLatencyMs, isStale, lastLedger, ledgerLag } = metrics;

  // Don't show anything until we have at least one successful read
  if (lastSuccessfulRead === null) {
    return null;
  }

  const timeSinceLastRead = Date.now() - lastSuccessfulRead;
  const latencyText = lastLatencyMs !== null ? formatDuration(lastLatencyMs) : null;
  const timeText = formatDuration(timeSinceLastRead);
  const ledgerText = lastLedger !== null ? formatNumber(lastLedger) : null;
  const lagText = ledgerLag !== null ? `${ledgerLag} ledgers` : null;

  // Determine status color based on health
  const statusColor = isStale ? 'text-amber-400' : 'text-slate-500';
  const iconColor = isStale ? 'text-amber-400' : 'text-slate-500';

  return (
    <div
      className={`flex items-center gap-3 text-xs ${statusColor}`}
      title={`Network Health - Last sync: ${timeText} ago, Latency: ${latencyText || 'unknown'}, Ledger: ${ledgerText || 'unknown'}, Lag: ${lagText || 'unknown'}`}
    >
      <Activity size={14} className={isStale ? 'animate-pulse' : ''} />
      
      <div className="flex items-center gap-2">
        <span>RPC:</span>
        <span className="text-slate-400">{latencyText || 'unknown'}</span>
      </div>

      <div className="flex items-center gap-2">
        <Clock size={12} />
        <span className="text-slate-400">{timeText} ago</span>
      </div>

      {ledgerText && (
        <div className="flex items-center gap-2">
          <Database size={12} />
          <span className="text-slate-400">{ledgerText}</span>
          {lagText && (
            <>
              <span className="text-slate-600">·</span>
              <span className={isStale ? 'text-amber-300' : 'text-slate-400'}>
                {lagText} behind
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
