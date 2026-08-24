import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { positionOf, reportAndExit, toRepositoryPath, walkFiles } from './lib/files.ts';

const SCANNED_ROOTS = ['src', 'tests'];
const ALLOWED_DIRECTORY = 'src/types/';
const ALLOWED_SUFFIX = '.d.ts';

function findDeclarations(contents: string, offset: number): number[] {
  const sourceFile = ts.createSourceFile(
    'scan.ts',
    contents,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const positions: number[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      positions.push(node.getStart(sourceFile) + offset);
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return positions;
}

function isAllowed(repositoryPath: string): boolean {
  return repositoryPath.startsWith(ALLOWED_DIRECTORY) || repositoryPath.endsWith(ALLOWED_SUFFIX);
}

const problems: string[] = [];

for (const filePath of walkFiles(SCANNED_ROOTS)) {
  const repositoryPath = toRepositoryPath(filePath);
  if (isAllowed(repositoryPath)) {
    continue;
  }

  const contents = readFileSync(filePath, 'utf8');
  const offsets: number[] = [];

  if (filePath.endsWith('.ts')) {
    offsets.push(...findDeclarations(contents, 0));
  } else if (filePath.endsWith('.vue')) {
    const { descriptor } = parseSfc(contents, { filename: filePath });
    for (const block of [descriptor.script, descriptor.scriptSetup]) {
      if (block !== null) {
        offsets.push(...findDeclarations(block.content, block.loc.start.offset));
      }
    }
  } else {
    continue;
  }

  for (const offset of offsets.sort((left, right) => left - right)) {
    const position = positionOf(contents, offset);
    problems.push(
      `${repositoryPath}:${String(position.line)}:${String(position.column)} type and interface declarations must live under src/types/`,
    );
  }
}

reportAndExit('check-type-locations', problems);
