export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInMs: number;
};

const rateLimitWindowMs = 60_000;
const safeRequestLimit = 3;
export const RATE_LIMIT_MAX_BUCKETS = 100;

const buckets = new Map<string, { count: number; resetAt: number }>();

function removeExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function evictOldestBucketAtCapacity() {
  if (buckets.size < RATE_LIMIT_MAX_BUCKETS) {
    return;
  }

  let oldestKey: string | undefined;
  let oldestResetAt = Number.POSITIVE_INFINITY;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < oldestResetAt) {
      oldestKey = key;
      oldestResetAt = bucket.resetAt;
    }
  }

  if (oldestKey) {
    buckets.delete(oldestKey);
  }
}

export function unsafeSearch(userId: string, query: string) {
  return {
    userId,
    query,
    limitApplied: false,
    resultLabel: `unlimited-result-for-${query}`,
  };
}

export function checkRateLimit(
  userId: string,
  route: string,
  now = Date.now(),
): RateLimitDecision {
  const key = `${route}:${userId}`;
  removeExpiredBuckets(now);
  const current = buckets.get(key);

  if (!current) {
    evictOldestBucketAtCapacity();
    buckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return {
      allowed: true,
      limit: safeRequestLimit,
      remaining: safeRequestLimit - 1,
      resetInMs: rateLimitWindowMs,
    };
  }

  if (current.count >= safeRequestLimit) {
    return {
      allowed: false,
      limit: safeRequestLimit,
      remaining: 0,
      resetInMs: current.resetAt - now,
    };
  }

  current.count += 1;

  return {
    allowed: true,
    limit: safeRequestLimit,
    remaining: safeRequestLimit - current.count,
    resetInMs: current.resetAt - now,
  };
}

export function resetRateLimitBuckets() {
  buckets.clear();
}

export function getRateLimitBucketCount() {
  return buckets.size;
}
