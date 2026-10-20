import type { ReadCacheConfig, ReadMethod, ReadOptions } from './types.js';

interface Entry {
  expiresAt: number;
  value: unknown;
  pending: boolean;
}

/** Per-client bounded cache. Failed reads and caller-owned objects never enter it. */
export class ReadCache {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly config?: ReadCacheConfig) {
    if (!config?.enabled) return;
    for (const ttl of [config.ttlMs ?? 5_000, ...Object.values(config.methodTtlMs ?? {})]) {
      if (!Number.isFinite(ttl) || ttl < 0) throw new Error('Cache TTL must be a finite non-negative number');
    }
    if (!Number.isInteger(config.maxEntries ?? 1_000) || (config.maxEntries ?? 1_000) < 1) {
      throw new Error('Cache maxEntries must be a positive integer');
    }
  }

  private key(method: ReadMethod, args: readonly unknown[]): string {
    return `${method}:${JSON.stringify(args, (_, value) => typeof value === 'bigint' ? { bigint: String(value) } : value)}`;
  }

  invalidate(method?: ReadMethod, args?: readonly unknown[]): void {
    if (!method) this.entries.clear();
    else if (args) this.entries.delete(this.key(method, args));
    else for (const key of this.entries.keys()) if (key.startsWith(`${method}:`)) this.entries.delete(key);
  }

  async read<T>(method: ReadMethod, args: readonly unknown[], options: ReadOptions | undefined, request: () => Promise<T>): Promise<T> {
    const key = this.key(method, args);
    if (options?.invalidateCache) this.entries.delete(key);
    const ttl = this.config?.methodTtlMs?.[method] ?? this.config?.ttlMs ?? 5_000;
    if (!this.config?.enabled || options?.bypassCache || ttl === 0) return request();
    const hit = this.entries.get(key);
    if (hit && !hit.pending && hit.expiresAt > Date.now()) return structuredClone(hit.value) as T;
    this.entries.delete(key);
    // Reserve an entry so invalidation or a newer request can supersede this
    // read while it is in flight. TTL starts only once the RPC succeeds.
    const entry: Entry = { expiresAt: 0, value: undefined, pending: true };
    for (const [oldKey, oldEntry] of this.entries) {
      if (!oldEntry.pending && oldEntry.expiresAt <= Date.now()) this.entries.delete(oldKey);
    }
    if (this.entries.size >= (this.config.maxEntries ?? 1_000)) {
      this.entries.delete(this.entries.keys().next().value!);
    }
    this.entries.set(key, entry);
    try {
      const value = await request();
      if (this.entries.get(key) === entry) {
        entry.value = structuredClone(value);
        entry.expiresAt = Date.now() + ttl;
        entry.pending = false;
      }
      return value;
    } catch (error) {
      if (this.entries.get(key) === entry) this.entries.delete(key);
      throw error;
    }
  }
}
