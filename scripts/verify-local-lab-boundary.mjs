import { spawn, spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { createServer, createConnection } from "node:net";
import { networkInterfaces } from "node:os";
import { setTimeout as delay } from "node:timers/promises";

const loopbackAddress = "127.0.0.1";
const startupTimeoutMs = 60_000;
const connectionTimeoutMs = 2_000;
const nextEnvPath = new URL("../next-env.d.ts", import.meta.url);

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function headerValue(headers, name) {
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(", ") : (value ?? null);
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
    headerValue(headers, "content-type")?.includes("application/json"),
    `${label} is missing the JSON Content-Type.`,
  );
  for (const [name, value] of Object.entries(expectations)) {
    requireCondition(
      headerValue(headers, name) === value,
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
      headerValue(headers, name) === null,
      `${label} must not include ${name}.`,
    );
  }
}

async function reservePort() {
  const server = createServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, loopbackAddress, resolve);
  });

  const address = server.address();
  requireCondition(
    address && typeof address === "object",
    "Could not reserve a local verification port.",
  );
  const port = address.port;

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return port;
}

function startDevelopmentServer(port) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? (process.env.ComSpec ?? "cmd.exe") : "npm";
  const args = isWindows
    ? ["/d", "/s", "/c", `npm run dev -- --port ${port}`]
    : ["run", "dev", "--", "--port", String(port)];
  const child = spawn(command, args, {
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      LAB_MODE: "local",
      NODE_ENV: "development",
      PUBLIC_SHOWCASE: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  // Consume output without publishing local paths or environment details.
  child.stdout.resume();
  child.stderr.resume();

  let spawnFailed = false;
  child.once("error", () => {
    spawnFailed = true;
  });

  return { child, spawnFailed: () => spawnFailed };
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) {
    return true;
  }

  return Promise.race([
    new Promise((resolve) => child.once("exit", () => resolve(true))),
    delay(timeoutMs, false),
  ]);
}

async function stopDevelopmentServer(child) {
  if (!child || child.exitCode !== null || child.pid === undefined) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    requireCondition(
      await waitForExit(child, 5_000),
      "The local development server process did not stop.",
    );
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }

  if (await waitForExit(child, 5_000)) {
    return;
  }

  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    child.kill("SIGKILL");
  }
  requireCondition(
    await waitForExit(child, 5_000),
    "The local development server process did not stop.",
  );
}

async function restoreNextEnv(originalContents) {
  const currentContents = await readFile(nextEnvPath, "utf8");
  const developmentContents = originalContents.replace(
    'import "./.next/types/routes.d.ts";',
    'import "./.next/dev/types/routes.d.ts";',
  );

  if (currentContents === originalContents) {
    return;
  }
  requireCondition(
    currentContents === developmentContents,
    "next-env.d.ts changed unexpectedly during local boundary verification.",
  );
  await writeFile(nextEnvPath, originalContents, "utf8");
}

async function waitForVulnerableHealth(serverProcess, port) {
  const { child } = serverProcess;
  const endpoint = `http://${loopbackAddress}:${port}/api/vulnerable/health`;
  const deadline = Date.now() + startupTimeoutMs;

  while (Date.now() < deadline) {
    requireCondition(
      !serverProcess.spawnFailed() && child.exitCode === null,
      "The local development server exited before becoming ready.",
    );

    let response;
    try {
      response = await fetch(endpoint, {
        redirect: "error",
        signal: AbortSignal.timeout(connectionTimeoutMs),
      });
    } catch {
      await delay(500);
      continue;
    }

    requireCondition(
      response.status === 200,
      `The loopback vulnerable health check returned ${response.status}.`,
    );
    verifyApiResponseHeaders(response.headers, "Vulnerable health response");
    const body = await response.json();
    requireCondition(
      body.ok === true &&
        body.meta?.routeType === "vulnerable" &&
        body.meta?.localOnly === true &&
        body.data?.safety?.vulnerableApisEnabled === true,
      "The loopback vulnerable health response did not confirm local-only mode.",
    );
    return;
  }

  throw new Error("The local development server did not become ready in time.");
}

async function verifySecureHealth(port) {
  const response = await fetch(
    `http://${loopbackAddress}:${port}/api/secure/health`,
    {
      redirect: "error",
      signal: AbortSignal.timeout(connectionTimeoutMs),
    },
  );
  const body = await response.json();

  requireCondition(
    response.status === 200 &&
      body.ok === true &&
      body.meta?.routeType === "secure",
    "The loopback secure health response was not successful.",
  );
  verifyApiResponseHeaders(response.headers, "Secure health response");
}

async function requestWithHostHeader(port, host) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        headers: { Host: host },
        hostname: loopbackAddress,
        method: "GET",
        path: "/api/vulnerable/health",
        port,
      },
      (response) => {
        const chunks = [];
        let size = 0;

        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 64 * 1024) {
            request.destroy(
              new Error("The Host rejection response was unexpectedly large."),
            );
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          try {
            resolve({
              body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
              headers: response.headers,
              status: response.statusCode,
            });
          } catch {
            reject(new Error("The Host rejection response was not JSON."));
          }
        });
      },
    );

    request.setTimeout(connectionTimeoutMs, () => {
      request.destroy(new Error("The Host rejection request timed out."));
    });
    request.once("error", reject);
    request.end();
  });
}

async function verifyHostHeaderRejection(port) {
  const { body, headers, status } = await requestWithHostHeader(
    port,
    "non-loopback.example",
  );

  requireCondition(
    status === 403 &&
      body.ok === false &&
      body.error?.code === "VULNERABLE_API_DISABLED",
    "A non-loopback Host header was not rejected by the vulnerable API.",
  );
  verifyApiResponseHeaders(headers, "Non-loopback Host rejection");
}

function nonLoopbackIpv4Addresses() {
  return [
    ...new Set(
      Object.values(networkInterfaces())
        .flatMap((entries) => entries ?? [])
        .filter(
          (entry) =>
            entry.family === "IPv4" &&
            !entry.internal &&
            entry.address !== loopbackAddress,
        )
        .map((entry) => entry.address),
    ),
  ];
}

function canConnect(address, port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: address, port });

    socket.setTimeout(connectionTimeoutMs);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function verifyNonLoopbackBinding(port) {
  const addresses = nonLoopbackIpv4Addresses();
  requireCondition(
    addresses.length > 0,
    "No non-loopback IPv4 interface was available for binding verification.",
  );

  for (const address of addresses) {
    requireCondition(
      !(await canConnect(address, port)),
      "The local development server accepted a non-loopback connection.",
    );
  }

  return addresses.length;
}

const port = await reservePort();
const originalNextEnv = await readFile(nextEnvPath, "utf8");
const serverProcess = startDevelopmentServer(port);
let cleanupPromise;

function cleanup() {
  cleanupPromise ??= (async () => {
    try {
      await stopDevelopmentServer(serverProcess.child);
    } finally {
      await restoreNextEnv(originalNextEnv);
    }
  })();
  return cleanupPromise;
}

let handlingSignal = false;
function handleSignal(exitCode) {
  if (handlingSignal) {
    return;
  }
  handlingSignal = true;
  void cleanup().finally(() => process.exit(exitCode));
}

process.once("SIGINT", () => handleSignal(130));
process.once("SIGTERM", () => handleSignal(143));

try {
  await waitForVulnerableHealth(serverProcess, port);
  await verifySecureHealth(port);
  await verifyHostHeaderRejection(port);
  const checkedAddressCount = await verifyNonLoopbackBinding(port);

  console.log(
    `Verified local lab boundary: protected secure and vulnerable health responses, non-loopback Host rejection, and ${checkedAddressCount} unreachable non-loopback IPv4 interface(s).`,
  );
} finally {
  await cleanup();
}
