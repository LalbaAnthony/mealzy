import { readFileSync } from 'node:fs';
import {
  isProbablyBinary,
  positionOf,
  reportAndExit,
  toRepositoryPath,
  walkFiles,
} from './lib/files.ts';

const EM_DASH_CODE_POINT = 0x2014;
const EM_DASH = String.fromCodePoint(EM_DASH_CODE_POINT);

const problems: string[] = [];

for (const filePath of walkFiles(['.'])) {
  if (isProbablyBinary(filePath)) {
    continue;
  }
  const contents = readFileSync(filePath, 'utf8');
  let index = contents.indexOf(EM_DASH);
  while (index !== -1) {
    const position = positionOf(contents, index);
    problems.push(
      `${toRepositoryPath(filePath)}:${String(position.line)}:${String(position.column)} em dash U+2014 is not allowed, use a hyphen or a comma`,
    );
    index = contents.indexOf(EM_DASH, index + 1);
  }
}

reportAndExit('check-no-em-dash', problems);
