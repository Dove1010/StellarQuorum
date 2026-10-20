'use client';

import { useEffect } from 'react';
import { useRpcHealth } from './rpc-health';
import { createQuorumClient } from './config';

/**
 * Hook that checks RPC health once on mount by calling getLatestLedger.
 * This piggybacks on the same RPC call pattern that pages already use.
 * Does not add periodic polling to avoid extra RPC calls.
 *
 * The health check runs once when the component mounts, and updates
 * whenever the component re-mounts (e.g., on page navigation).
 */
export function useRpcHealthCheck() {
  const { recordSuccessfulRead } = useRpcHealth();

  useEffect(() => {
    let mounted = true;

    const checkRpcHealth = async () => {
      if (!mounted) return;

      try {
        const client = await createQuorumClient();
        const start = Date.now();
        await client.getLatestLedger();
        const latency = Date.now() - start;

        if (mounted) {
          recordSuccessfulRead(latency);
        }
      } catch (error) {
        // Failed reads are not recorded; the stale indicator will naturally
        // show when no successful reads occur
        console.debug('RPC health check failed:', error);
      }
    };

    // Single check on mount
    checkRpcHealth();

    return () => {
      mounted = false;
    };
  }, [recordSuccessfulRead]);
}
