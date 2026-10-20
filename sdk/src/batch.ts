import { scValToNative, xdr } from '@stellar/stellar-sdk';

interface Pending {
  transaction: string;
  fallback: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

interface BatchResponse {
  jsonrpc: string;
  id: number;
  error?: { code: number; message?: string };
  result?: { error?: string; results?: { xdr: string }[] };
}

/** Coalesce simultaneous proposal simulations; never batch write operations. */
export class SimulationBatcher {
  private pending: Pending[] = [];
  private supported = true;

  constructor(
    private readonly send: (transactions: string[]) => Promise<unknown>,
    private readonly size: number,
  ) {
    if (!Number.isInteger(size) || size < 1 || size > 100) {
      throw new Error('simulationBatchSize must be an integer between 1 and 100');
    }
  }

  enqueue<T>(transaction: string, fallback: () => Promise<T>): Promise<T> {
    if (!this.supported) return fallback();
    return new Promise<T>((resolve, reject) => {
      this.pending.push({ transaction, fallback, resolve: value => resolve(value as T), reject });
      if (this.pending.length === 1) queueMicrotask(() => { void this.flush(); });
    });
  }

  private async flush(): Promise<void> {
    const pending = this.pending;
    this.pending = [];
    for (let start = 0; start < pending.length; start += this.size) {
      const chunk = pending.slice(start, start + this.size);
      // A single read gains nothing from a batch envelope.
      if (!this.supported || chunk.length === 1) {
        this.fallback(chunk);
        continue;
      }
      try {
        const raw = await this.send(chunk.map(item => item.transaction));
        // JSON-RPC permits out-of-order responses. Missing/duplicate ids and
        // non-array envelopes indicate an incompatible provider: retry reads
        // individually and stop probing for the lifetime of this client.
        if (!Array.isArray(raw) || raw.length !== chunk.length) {
          this.supported = false;
          this.fallback(chunk);
          continue;
        }
        const responses = raw as BatchResponse[];
        const ids = new Set(responses.map(item => item?.id));
        if (ids.size !== chunk.length || responses.some(item => !item || item.jsonrpc !== '2.0'
          || !Number.isInteger(item.id) || item.id < 0 || item.id >= chunk.length
          || item.error?.code === -32600 || item.error?.code === -32601)) {
          this.supported = false;
          this.fallback(chunk);
          continue;
        }
        for (const response of responses) {
          const item = chunk[response.id];
          try {
            if (response.error) throw response.error;
            if (response.result?.error) throw new Error(`Simulation of get_proposal failed: ${response.result.error}`);
            const retval = response.result?.results?.[0]?.xdr;
            if (!retval) throw new Error('Simulation of get_proposal returned no result');
            item.resolve(scValToNative(xdr.ScVal.fromXDR(retval, 'base64')));
          } catch (error) { item.reject(error); }
        }
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status && [400, 404, 405, 413, 415, 422, 501].includes(status)) {
          this.supported = false;
          this.fallback(chunk);
        } else {
          // A timeout, auth failure or exhausted transient retry is a real
          // failure, not evidence that the provider lacks batch support.
          for (const item of chunk) item.reject(error);
        }
      }
    }
  }

  private fallback(items: Pending[]): void {
    for (const item of items) void item.fallback().then(item.resolve, item.reject);
  }
}

/** Browser-native transport; abort also releases the underlying HTTP request. */
export async function postSimulationBatch(url: string, transactions: string[], timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(transactions.map((transaction, id) => ({
        jsonrpc: '2.0', id, method: 'simulateTransaction', params: { transaction },
      }))),
    });
    if (!response.ok) throw Object.assign(new Error(`Batch simulation HTTP ${response.status}`), { status: response.status });
    // A provider returning HTML or invalid JSON cannot accept our batch.
    try { return await response.json(); } catch (error) {
      if (controller.signal.aborted) throw error;
      return undefined;
    }
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Batch simulation timeout');
    throw error;
  } finally { clearTimeout(timer); }
}
