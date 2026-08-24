import { readFileSync } from 'node:fs';
import {
  isProbablyBinary,
  positionOf,
  reportAndExit,
  toRepositoryPath,
  walkFiles,
} from './lib/files.ts';

const EMOJI_PATTERN = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F1E6}-\u{1F1FF}]/gu;
const ALLOWED_CODE_POINTS = new Set(['©', '®', '™']);

const problems: string[] = [];

for (const filePath of walkFiles(['.'])) {
  if (isProbablyBinary(filePath)) {
    continue;
  }
  const contents = readFileSync(filePath, 'utf8');
  EMOJI_PATTERN.lastIndex = 0;
  let match = EMOJI_PATTERN.exec(contents);
  while (match !== null) {
    const found = match[0];
    if (!ALLOWED_CODE_POINTS.has(found)) {
      const position = positionOf(contents, match.index);
      const codePoint = found.codePointAt(0) ?? 0;
      problems.push(
        `${toRepositoryPath(filePath)}:${String(position.line)}:${String(position.column)} emoji codepoint U+${codePoint.toString(16).toUpperCase()} is not allowed`,
      );
    }
    match = EMOJI_PATTERN.exec(contents);
  }
}

reportAndExit('check-no-emoji', problems);
