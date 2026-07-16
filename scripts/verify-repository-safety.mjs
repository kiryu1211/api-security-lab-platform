import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";

const sensitiveDirectories = new Set([
  "audit-logs",
  "credentials",
  "logs",
  "private",
  "private-docs",
  "secrets",
  "storage",
  "uploads",
]);
const sensitiveExtensions = new Set([
  ".cer",
  ".crt",
  ".db",
  ".jks",
  ".key",
  ".keystore",
  ".log",
  ".p12",
  ".p8",
  ".pem",
  ".pfx",
  ".sqlite",
  ".sqlite3",
]);
const sensitiveNames = new Set(["agents.md", "id_rsa", "id_rsa.pub"]);
const privateKeyMarkers = [
  "PRIVATE KEY",
  "RSA PRIVATE KEY",
  "EC PRIVATE KEY",
  "OPENSSH PRIVATE KEY",
  "PGP PRIVATE KEY BLOCK",
].map((label) => Buffer.from(`-----BEGIN ${label}-----`));

function pathViolation(file) {
  const normalized = file.replaceAll("\\", "/").toLowerCase();
  const segments = normalized.split("/");
  const name = segments.at(-1) ?? "";

  if (normalized === ".env.example") {
    return null;
  }
  if (name === ".env" || name.startsWith(".env.")) {
    return "environment file";
  }
  if (name.startsWith(".dev.vars")) {
    return "local Worker variables file";
  }
  if (sensitiveNames.has(name)) {
    return "developer-only or key file";
  }
  if (segments.some((segment) => sensitiveDirectories.has(segment))) {
    return "developer-only or local-data directory";
  }
  if ([...sensitiveExtensions].some((extension) => name.endsWith(extension))) {
    return "secret, log, or local database file";
  }

  return null;
}

const gitResult = spawnSync("git", ["ls-files", "-z"], {
  maxBuffer: 16 * 1024 * 1024,
});

if (gitResult.error || gitResult.status !== 0) {
  const detail = gitResult.stderr?.toString("utf8").trim();
  console.error(
    `Repository safety verification could not list tracked files${detail ? `: ${detail}` : "."}`,
  );
  process.exit(1);
}

const trackedFiles = gitResult.stdout
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const violations = [];

for (const file of trackedFiles) {
  const reason = pathViolation(file);
  if (reason) {
    violations.push({ file, reason });
    continue;
  }

  if (!lstatSync(file).isFile()) {
    continue;
  }

  const contents = readFileSync(file);
  if (privateKeyMarkers.some((marker) => contents.includes(marker))) {
    violations.push({ file, reason: "private key material" });
  }
}

if (violations.length > 0) {
  console.error("Repository safety verification failed:");
  for (const { file, reason } of violations) {
    console.error(`- ${JSON.stringify(file)}: ${reason}`);
  }
  process.exit(1);
}

console.log(
  `Verified repository safety: ${trackedFiles.length} tracked files contain no prohibited local or secret material.`,
);
