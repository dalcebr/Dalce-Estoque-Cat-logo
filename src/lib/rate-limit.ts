interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();
  private cleanupIntervalMs = 60_000;

  constructor(opts: { windowMs: number; maxRequests: number }) {
    this.windowMs = opts.windowMs;
    this.maxRequests = opts.maxRequests;
  }

  check(key: string): { success: boolean; remaining: number } {
    this.maybeCleanup();

    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { success: true, remaining: this.maxRequests - 1 };
    }

    entry.count += 1;

    if (entry.count > this.maxRequests) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: this.maxRequests - entry.count };
  }

  private maybeCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;
    this.lastCleanup = now;

    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
