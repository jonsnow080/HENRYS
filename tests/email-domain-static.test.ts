import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "..");

const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
  ".prisma",
  ".txt",
  ".env",
]);

const ignoredDirectories = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const bannedPatterns = [
  /@henrys\.house/i,
  /henrys\.house/i,
  /@henrys\.xyz/i,
  /henrys\.xyz/i,
];

function collectFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        return [];
      }
      return collectFiles(entryPath);
    }

    if (!entry.isFile()) {
      return [];
    }

    const extension = path.extname(entry.name);
    if (!allowedExtensions.has(extension)) {
      return [];
    }

    return [entryPath];
  });
}

describe("email domain hygiene", () => {
  it("does not reference deprecated email domains", () => {
    const filesToScan = collectFiles(repoRoot);
    const offenders: { file: string; matches: string[] }[] = [];

    for (const file of filesToScan) {
      const content = readFileSync(file, "utf8");
      const matches = bannedPatterns
        .map((pattern) => (pattern.test(content) ? pattern.source : null))
        .filter((pattern): pattern is string => Boolean(pattern));

      if (matches.length > 0) {
        offenders.push({ file: path.relative(repoRoot, file), matches });
      }
    }

    expect(offenders).toEqual([]);
  });
});
