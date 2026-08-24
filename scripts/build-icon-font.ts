import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import * as fontkit from 'fontkit';
import subsetFont from 'subset-font';

const ICON_TYPES_FILE = 'src/types/icons.ts';
const ICON_TYPE_NAME = 'IconName';
const SOURCE_FONT = 'node_modules/@material-symbols/font-400/material-symbols-rounded.woff2';
const OUTPUT_DIRECTORY = 'src/assets/icons';
const OUTPUT_FONT_NAME = 'material-symbols-subset.woff2';
const OUTPUT_CSS_NAME = 'material-symbols-subset.css';
const FONT_FAMILY = 'Material Symbols Rounded Subset';
const SIZE_BUDGET_BYTES = 500 * 1024;

function readIconNames(): string[] {
  const contents = readFileSync(ICON_TYPES_FILE, 'utf8');
  const sourceFile = ts.createSourceFile(
    ICON_TYPES_FILE,
    contents,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );

  const names: string[] = [];
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isTypeAliasDeclaration(node) || node.name.text !== ICON_TYPE_NAME) {
      return;
    }
    if (!ts.isUnionTypeNode(node.type)) {
      return;
    }
    for (const member of node.type.types) {
      if (ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal)) {
        names.push(member.literal.text);
      }
    }
  });

  if (names.length === 0) {
    throw new Error(`No icon names were found in ${ICON_TYPES_FILE}.`);
  }
  return names;
}

function isSingleFont(candidate: fontkit.Font | fontkit.FontCollection): candidate is fontkit.Font {
  return 'layout' in candidate;
}

function buildCodePointMap(iconNames: readonly string[]): Map<string, number> {
  const source = readFileSync(SOURCE_FONT);
  const opened = fontkit.create(source);
  if (!isSingleFont(opened)) {
    throw new Error('The Material Symbols font was read as a collection rather than a font.');
  }

  const glyphIdToCodePoint = new Map<number, number>();
  for (const codePoint of opened.characterSet) {
    const glyph = opened.glyphForCodePoint(codePoint);
    if (!glyphIdToCodePoint.has(glyph.id)) {
      glyphIdToCodePoint.set(glyph.id, codePoint);
    }
  }

  const resolved = new Map<string, number>();
  const unresolved: string[] = [];
  for (const name of iconNames) {
    const glyphs = opened.layout(name).glyphs;
    const firstGlyph = glyphs[0];
    if (glyphs.length !== 1 || firstGlyph === undefined) {
      unresolved.push(name);
      continue;
    }
    const codePoint = glyphIdToCodePoint.get(firstGlyph.id);
    if (codePoint === undefined) {
      unresolved.push(name);
      continue;
    }
    resolved.set(name, codePoint);
  }

  if (unresolved.length > 0) {
    throw new Error(
      `These icon names do not exist in Material Symbols Rounded: ${unresolved.join(', ')}`,
    );
  }

  return resolved;
}

function buildStylesheet(codePoints: ReadonlyMap<string, number>): string {
  const rules = [...codePoints.entries()]
    .map(
      ([name, codePoint]) =>
        `.md-icon--${name}::before {\n  content: "\\${codePoint.toString(16)}";\n}`,
    )
    .join('\n\n');

  return `@font-face {
  font-family: "${FONT_FAMILY}";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("./${OUTPUT_FONT_NAME}") format("woff2");
}

.md-icon {
  display: inline-block;
  flex: none;
  inline-size: 1em;
  block-size: 1em;
  font-family: "${FONT_FAMILY}";
  font-size: var(--md-sys-size-icon);
  font-style: normal;
  font-weight: 400;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizelegibility;
}

${rules}
`;
}

async function main(): Promise<void> {
  const iconNames = readIconNames();
  const codePoints = buildCodePointMap(iconNames);

  const subsetText = [...codePoints.values()]
    .map((codePoint) => String.fromCodePoint(codePoint))
    .join('');
  const source = readFileSync(SOURCE_FONT);
  const subset = await subsetFont(source, subsetText, { targetFormat: 'woff2' });

  if (subset.length > SIZE_BUDGET_BYTES) {
    throw new Error(
      `The subset font is ${String(subset.length)} bytes, above the ${String(SIZE_BUDGET_BYTES)} byte budget.`,
    );
  }

  mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  writeFileSync(join(OUTPUT_DIRECTORY, OUTPUT_FONT_NAME), subset);
  writeFileSync(join(OUTPUT_DIRECTORY, OUTPUT_CSS_NAME), buildStylesheet(codePoints), 'utf8');

  console.log(
    `build-icon-font: ${String(iconNames.length)} icons, ${String(subset.length)} bytes (source ${String(source.length)} bytes)`,
  );
}

await main();
