export type RateLimitDecision = {
  allowed: boolean;
  key: string;
  limit: number;
  remaining: number;
  resetInMs: number;
};

const rateLimitWindowMs = 60_000;
const safeRequestLimit = 3;

const buckets = new Map<string, { count: number; resetAt: number }>();

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
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return {
      allowed: true,
      key,
      limit: safeRequestLimit,
      remaining: safeRequestLimit - 1,
      resetInMs: rateLimitWindowMs,
    };
  }

  if (current.count >= safeRequestLimit) {
    return {
      allowed: false,
      key,
      limit: safeRequestLimit,
      remaining: 0,
      resetInMs: current.resetAt - now,
    };
  }

  current.count += 1;

  return {
    allowed: true,
    key,
    limit: safeRequestLimit,
    remaining: safeRequestLimit - current.count,
    resetInMs: current.resetAt - now,
  };
}

export function resetRateLimitBuckets() {
  buckets.clear();
}
