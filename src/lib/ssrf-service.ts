const allowedHosts = new Set(["api.example.test"]);

const privateHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^::1$/,
];

export function unsafeFetchPreview(url: string) {
  return {
    accepted: true,
    wouldFetch: url,
    networkAccessPerformed: false,
  };
}

export function safeFetchPreview(url: string) {
  const parsed = new URL(url);
  const hostname = parsed.hostname;

  if (parsed.protocol !== "https:") {
    return { allowed: false, reason: "protocol-not-allowed" as const };
  }

  if (privateHostPatterns.some((pattern) => pattern.test(hostname))) {
    return { allowed: false, reason: "private-host-rejected" as const };
  }

  if (!allowedHosts.has(hostname)) {
    return { allowed: false, reason: "host-not-allowed" as const };
  }

  return {
    allowed: true,
    wouldFetch: url,
    redirectPolicy: "manual",
    timeoutMs: 2000,
    networkAccessPerformed: false,
  };
}
