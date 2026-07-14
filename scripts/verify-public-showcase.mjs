const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:8787");

if (!["http:", "https:"].includes(baseUrl.protocol)) {
  throw new Error("The showcase URL must use HTTP or HTTPS.");
}

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
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
const scriptTags = [...firstHome.matchAll(/<script\b([^>]*)>/g)];
const styleTags = [...firstHome.matchAll(/<style\b([^>]*)>/g)];

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
  requireCondition(
    response.headers.get("cache-control") === "no-store",
    `${path} is missing Cache-Control: no-store.`,
  );
  requireCondition(
    response.headers.get("content-security-policy") ===
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    `${path} is missing the strict API CSP.`,
  );
  requireCondition(
    body.includes("PUBLIC_SHOWCASE_API_DISABLED"),
    `${path} is missing the public boundary error.`,
  );
}

console.log(
  `Verified public showcase: ${scriptTags.length} scripts, ${styleTags.length} styles, strict nonces, and blocked APIs.`,
);
