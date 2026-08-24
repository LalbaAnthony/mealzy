import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const REPOSITORY_ROOT = process.cwd();

const ALWAYS_SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist-ssr',
  'dev-dist',
  'coverage',
  '.idea',
  '.vscode',
]);

const SKIPPED_FILES = new Set([
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]);

export function walkFiles(roots: readonly string[]): string[] {
  const found: string[] = [];
  for (const root of roots) {
    collect(root, found);
  }
  return found.sort();
}

function collect(directory: string, found: string[]): void {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (ALWAYS_SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      collect(fullPath, found);
      continue;
    }
    if (SKIPPED_FILES.has(entry.name)) {
      continue;
    }
    found.push(fullPath);
  }
}

export function isProbablyBinary(filePath: string): boolean {
  const size = statSync(filePath).size;
  if (size === 0) {
    return false;
  }
  const buffer = readFileSync(filePath);
  const sampleLength = Math.min(buffer.length, 4096);
  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) {
      return true;
    }
  }
  return false;
}

export function toRepositoryPath(filePath: string): string {
  return relative(REPOSITORY_ROOT, filePath).split(sep).join('/');
}

export function positionOf(contents: string, offset: number): { line: number; column: number } {
  const before = contents.slice(0, offset);
  const lines = before.split('\n');
  const line = lines.length;
  const lastLine = lines[lines.length - 1] ?? '';
  return { line, column: lastLine.length + 1 };
}

export function reportAndExit(guardName: string, problems: readonly string[]): void {
  if (problems.length === 0) {
    console.log(`${guardName}: ok`);
    return;
  }
  for (const problem of problems) {
    console.error(problem);
  }
  console.error(`${guardName}: ${String(problems.length)} problem(s) found`);
  process.exitCode = 1;
}
