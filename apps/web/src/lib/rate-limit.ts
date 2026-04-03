import { NextResponse } from 'next/server';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
};

const globalStore = globalThis as typeof globalThis & {
  __talepsatRateLimitStore?: Map<string, RateLimitBucket>;
  __talepsatRateLimitSweep?: number;
};

function getStore() {
  if (!globalStore.__talepsatRateLimitStore) {
    globalStore.__talepsatRateLimitStore = new Map<string, RateLimitBucket>();
  }
  return globalStore.__talepsatRateLimitStore;
}

function sweepExpiredBuckets(now: number) {
  const lastSweep = globalStore.__talepsatRateLimitSweep || 0;
  if (now - lastSweep < 30000) return;

  const store = getStore();
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }

  globalStore.__talepsatRateLimitSweep = now;
}

export function consumeRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweepExpiredBuckets(now);

  const store = getStore();
  const bucket = store.get(options.key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      success: true,
      limit: options.limit,
      remaining: Math.max(options.limit - 1, 0),
      retryAfter: Math.ceil(options.windowMs / 1000),
    };
  }

  if (bucket.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      retryAfter: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1),
    };
  }

  bucket.count += 1;
  store.set(options.key, bucket);

  return {
    success: true,
    limit: options.limit,
    remaining: Math.max(options.limit - bucket.count, 0),
    retryAfter: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1),
  };
}

export function createRateLimitResponse(result: RateLimitResult, message = 'Cok fazla istek gonderildi.') {
  return NextResponse.json(
    {
      error: message,
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  );
}
