import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const verifier = resolve("scripts/verify-repository-safety.mjs");

function withRepository(run: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), "repository-safety-"));
  execFileSync("git", ["init", "--quiet"], { cwd: directory });

  try {
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function runVerifier(directory: string) {
  return spawnSync(process.execPath, [verifier], {
    cwd: directory,
    encoding: "utf8",
  });
}

describe("repository safety verification", () => {
  it("allows normal tracked files and the documented environment example", () => {
    withRepository((directory) => {
      writeFileSync(join(directory, "README.md"), "Public documentation\n");
      writeFileSync(join(directory, ".env.example"), "LAB_MODE=disabled\n");
      execFileSync("git", ["add", "README.md", ".env.example"], {
        cwd: directory,
      });

      const result = runVerifier(directory);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("2 tracked files");
    });
  });

  it("rejects environment files and developer-only directories", () => {
    withRepository((directory) => {
      mkdirSync(join(directory, "private-docs"));
      writeFileSync(join(directory, ".env.local"), "SECRET=do-not-print\n");
      writeFileSync(
        join(directory, "private-docs", "roadmap.md"),
        "Internal notes\n",
      );
      execFileSync(
        "git",
        ["add", "--force", ".env.local", "private-docs/roadmap.md"],
        { cwd: directory },
      );

      const result = runVerifier(directory);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('".env.local": environment file');
      expect(result.stderr).toContain(
        '"private-docs/roadmap.md": developer-only or local-data directory',
      );
      expect(result.stderr).not.toContain("do-not-print");
    });
  });

  it("rejects private key material without printing its contents", () => {
    withRepository((directory) => {
      const marker = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
      writeFileSync(join(directory, "notes.txt"), `${marker}\ndo-not-print\n`);
      execFileSync("git", ["add", "notes.txt"], { cwd: directory });

      const result = runVerifier(directory);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('"notes.txt": private key material');
      expect(result.stderr).not.toContain("do-not-print");
    });
  });
});
