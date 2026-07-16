const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:8787");

if (!["http:", "https:"].includes(baseUrl.protocol)) {
  throw new Error("The showcase URL must use HTTP or HTTPS.");
}

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyApiResponseHeaders(headers, label) {
  const expectations = {
    "cache-control": "no-store",
    "content-security-policy":
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "permissions-policy": "camera=(), geolocation=(), microphone=()",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  };

  requireCondition(
    headers.get("content-type")?.includes("application/json"),
    `${label} is missing the JSON Content-Type.`,
  );
  for (const [name, value] of Object.entries(expectations)) {
    requireCondition(
      headers.get(name) === value,
      `${label} has an unexpected ${name} header.`,
    );
  }
  for (const name of [
    "access-control-allow-credentials",
    "access-control-allow-headers",
    "access-control-allow-methods",
    "access-control-allow-origin",
    "access-control-allow-private-network",
    "access-control-expose-headers",
    "access-control-max-age",
    "x-powered-by",
  ]) {
    requireCondition(
      headers.get(name) === null,
      `${label} must not include ${name}.`,
    );
  }
}

async function request(path, init) {
  return fetch(new URL(path, baseUrl), {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
}

function nonceFrom(policy) {
  return policy.match(/'nonce-([^']+)'/)?.[1];
}

function attributeFrom(attributes, name) {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`),
  );
  return match?.[1] ?? match?.[2];
}

const firstHomeResponse = await request("/");
const firstHome = await firstHomeResponse.text();
const secondHomeResponse = await request("/");
const secondHome = await secondHomeResponse.text();
const firstPolicy =
  firstHomeResponse.headers.get("content-security-policy") ?? "";
const secondPolicy =
  secondHomeResponse.headers.get("content-security-policy") ?? "";
const firstNonce = nonceFrom(firstPolicy);
const secondNonce = nonceFrom(secondPolicy);
const scriptDirective =
  firstPolicy
    .split(";")
    .find((directive) => directive.trim().startsWith("script-src ")) ?? "";
const styleDirective =
  firstPolicy
    .split(";")
    .find((directive) => directive.trim().startsWith("style-src ")) ?? "";
const scriptTags = [...firstHome.matchAll(/<script\b([^>]*)>/gi)];
const styleTags = [...firstHome.matchAll(/<style\b([^>]*)>/gi)];
const linkTags = [...firstHome.matchAll(/<link\b([^>]*)>/gi)];
const scriptPaths = [
  ...new Set(
    scriptTags.map((match) => attributeFrom(match[1], "src")).filter(Boolean),
  ),
];
const stylesheetPaths = [
  ...new Set(
    linkTags
      .map((match) => attributeFrom(match[1], "href"))
      .filter(
        (path) => path && new URL(path, baseUrl).pathname.endsWith(".css"),
      ),
  ),
];

requireCondition(
  firstHomeResponse.status === 200,
  "The showcase did not return 200.",
);
requireCondition(
  secondHomeResponse.status === 200,
  "The second showcase request did not return 200.",
);
requireCondition(
  firstHomeResponse.headers.get("cache-control") === "no-store",
  "The nonce-bearing HTML response must not be cached.",
);
requireCondition(
  firstNonce && secondNonce && firstNonce !== secondNonce,
  "The document nonce must be present and unique per request.",
);
requireCondition(
  scriptDirective.includes("'strict-dynamic'") &&
    !scriptDirective.includes("'unsafe-inline'") &&
    !scriptDirective.includes("'unsafe-eval'"),
  "The production script-src directive is not strict.",
);
requireCondition(
  firstPolicy.includes("script-src-attr 'none'"),
  "Inline script attributes are not disabled.",
);
requireCondition(
  styleDirective.includes(`'nonce-${firstNonce}'`) &&
    !styleDirective.includes("'unsafe-inline'"),
  "The production style-src directive is not nonce-based.",
);
requireCondition(
  firstPolicy.includes("style-src-attr 'none'"),
  "Inline style attributes are not disabled.",
);
requireCondition(scriptTags.length > 0, "No script tags were rendered.");
requireCondition(scriptPaths.length > 0, "No external scripts were rendered.");
requireCondition(
  scriptPaths.every((path) => {
    const url = new URL(path, baseUrl);
    return (
      url.origin === baseUrl.origin &&
      url.pathname.startsWith("/_next/static/") &&
      url.pathname.endsWith(".js")
    );
  }),
  "A rendered external script is not a self-hosted Next.js static asset.",
);
requireCondition(
  scriptTags.every((match) => match[1].includes(`nonce="${firstNonce}"`)),
  "A rendered script is missing the response nonce.",
);
requireCondition(
  styleTags.every((match) => match[1].includes(`nonce="${firstNonce}"`)),
  "A rendered style element is missing the response nonce.",
);
requireCondition(
  !/<[^>]+\sstyle=/.test(firstHome),
  "The document contains an inline style attribute.",
);
requireCondition(
  secondHome.includes(`nonce="${secondNonce}"`),
  "The second document does not contain its response nonce.",
);
requireCondition(
  firstHome.includes("リクエスト結果を表示") &&
    firstHome.indexOf('class="public-showcase-notice"') >
      firstHome.indexOf('class="comparison-grid"'),
  "The public showcase controls are missing or misplaced.",
);
requireCondition(stylesheetPaths.length > 0, "No stylesheets were rendered.");

for (const path of scriptPaths) {
  const response = await request(path);
  const cacheControl = response.headers.get("cache-control") ?? "";

  requireCondition(response.status === 200, `${path} did not return 200.`);
  requireCondition(
    cacheControl.includes("max-age=31536000") &&
      cacheControl.includes("immutable"),
    `${path} is not cached as an immutable content-identified script.`,
  );
}

for (const path of stylesheetPaths) {
  const response = await request(path);
  const cacheControl = response.headers.get("cache-control") ?? "";

  requireCondition(response.status === 200, `${path} did not return 200.`);
  requireCondition(
    cacheControl.includes("max-age=0") &&
      cacheControl.includes("must-revalidate") &&
      !cacheControl.includes("immutable"),
    `${path} can retain stale CSS without revalidation.`,
  );
}

const apiCases = [
  ["/api/secure/health", undefined],
  [
    "/api/vulnerable/health",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  ],
  ["/api/not-defined", { method: "OPTIONS" }],
  ["/api", undefined],
];

for (const [path, init] of apiCases) {
  const response = await request(path, init);
  const body = await response.text();

  requireCondition(response.status === 403, `${path} did not return 403.`);
  verifyApiResponseHeaders(response.headers, path);
  requireCondition(
    body.includes("PUBLIC_SHOWCASE_API_DISABLED"),
    `${path} is missing the public boundary error.`,
  );
}

console.log(
  `Verified public showcase: ${scriptPaths.length} immutable scripts, ${styleTags.length} styles, ${stylesheetPaths.length} revalidated stylesheets, strict nonces, and blocked APIs.`,
);
