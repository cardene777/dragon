/**
 * `cdl-theme.css` を読む test/spec の文字列・template・正規表現を構文木で調べ、
 * `data-cdl-*` を含む選択子断片を CSS 規則の探索へ使う形を数える。
 * `locator` / `querySelector(All)` / `matches` / `closest` など DOM 探索の引数は数えない。
 *
 * 静的な literal だけが対象。変数の連結、関数の返り値、別 file から import した選択子、
 * 実行時に組み立てた正規表現は追跡できない。この制限を越える selector は test 本文へ
 * 足さず、共有の値表 helper または契約 data へ置く。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const scanRoots = [
  "apps/playground-spa/tests",
  "packages/dragon/test",
  "apps/playground-spa/src",
] as const;

const allowedFiles = new Set([
  "apps/playground-spa/src/lib/theme-css-test-shape.test.ts",
  "apps/playground-spa/src/lib/theme-role-table-contract-data.ts",
  "apps/playground-spa/src/lib/theme-role-table-test-helpers.ts",
]);

// 書き出し道具へ小さな CSS fixture を渡し、返された CSS を検査する境界 test。
// 実物の規則を選択子で探していないため、本検査の対象から外す。
const generatedCssBoundaryFiles = new Set([
  "packages/dragon/test/design-theme.test.ts",
]);

const notMigratedYet = [] as const;

const domSelectorMethods = new Set([
  "closest",
  "getAttribute",
  "hasAttribute",
  "locator",
  "matches",
  "querySelector",
  "querySelectorAll",
  "removeAttribute",
  "setAttribute",
  "waitForSelector",
]);

function readsThemeCss(source: string, fileName: string): boolean {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let reads = false;
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node) && node.text.includes("cdl-theme.css")) reads = true;
    if (!reads) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return reads;
}

function testFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return testFiles(path);
    return /(?:\.test\.ts|\.spec\.ts)$/.test(entry.name) ? [path] : [];
  });
}

function literalText(node: ts.Node): string | undefined {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isRegularExpressionLiteral(node)) return node.getText();
  if (ts.isTemplateExpression(node)) return node.getText();
  return undefined;
}

function isDomSelectorArgument(node: ts.Node): boolean {
  for (let current: ts.Node | undefined = node; current !== undefined; current = current.parent) {
    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
      const call = current.parent;
      if (
        ts.isCallExpression(call) &&
        ts.isPropertyAccessExpression(call.expression) &&
        ["evaluate", "evaluateAll"].includes(call.expression.name.text)
      ) return true;
    }
    if (!ts.isCallExpression(current)) continue;
    const expression = current.expression;
    const method = ts.isPropertyAccessExpression(expression) ? expression.name.text : undefined;
    return method !== undefined && domSelectorMethods.has(method) &&
      current.arguments.some((argument) => argument === node || argument.getStart() <= node.getStart() && argument.getEnd() >= node.getEnd());
  }
  return false;
}

export function cssSelectorLiteralCount(source: string, fileName = "fixture.ts"): number {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let count = 0;
  const visit = (node: ts.Node): void => {
    const text = literalText(node);
    if (
      text !== undefined &&
      /(?:\[|\\\[)?data-cdl-[a-z-]+(?:\s*[*^$|~]?=|\]|\\\])/i.test(text) &&
      !isDomSelectorArgument(node)
    ) {
      count += 1;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return count;
}

describe("cdl-theme.css を読む検査は選択子の文字で規則を探さない", () => {
  const candidates = scanRoots
    .flatMap((directory) => testFiles(resolve(root, directory)))
    .filter((file) => readFileSync(file, "utf8").includes("cdl-theme.css"));
  const relativeCandidates = candidates.map((file) => relative(root, file));
  const violations = candidates.flatMap((file) => {
    const name = relative(root, file);
    if (allowedFiles.has(name)) return [];
    if (generatedCssBoundaryFiles.has(name)) return [];
    const source = readFileSync(file, "utf8");
    if (!readsThemeCss(source, name)) return [];
    const count = cssSelectorLiteralCount(source, name);
    return count === 0 ? [] : [{ name, count }];
  });

  it("実物から導いた対象 file は 0 件ではない", () => {
    expect(relativeCandidates.length).toBeGreaterThan(0);
  });

  it("選択子の文字で CSS を探す小さな見本を 1 件と数える", () => {
    const fixture = `const found = cssText.includes('svg[data-cdl-stage][data-cdl-palette="blueprint"]');`;
    expect(cssSelectorLiteralCount(fixture)).toBe(1);
  });

  it("未移行一覧は実際に見つかった file と一致する", () => {
    expect(violations.map(({ name }) => name).sort()).toEqual([...notMigratedYet].sort());
  });

  it("移行済み file の選択子文字依存は 0 件", () => {
    const remaining = violations.filter(({ name }) => !notMigratedYet.includes(name as never));
    expect(remaining).toEqual([]);
  });
});
