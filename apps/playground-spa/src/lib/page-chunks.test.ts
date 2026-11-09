/**
 * 使い方の頁とカタログの頁を、頁が最初に読む script から外して後から読む (#3280)。
 *
 * 最初に読む script は、build した頁の `index.html` が名指す script と CSS (`firstLoadFiles`)。
 * 頁の部品が script の中にあるかは、部品が描く要素の目印 (build が `"data-docs":"hero"` の形で残す) が現れるかで決める。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { builtDir, firstLoadFiles } from "./playground-support";

/** 使い方の頁の部品が描く要素の目印 */
const DOCS_MARKS = ['"data-docs":"hero"', '"data-docs":"section"'] as const;
/** 一覧と分類と部品の頁の部品が描く要素の目印 */
const CATALOG_MARKS = ['"data-catalog":"index"', '"data-catalog":"stage"', '"data-catalog":"part-figure"'] as const;

const assets = (): string => join(builtDir(), "assets");
const read = (name: string): string => readFileSync(join(assets(), name), "utf8");
const firstScripts = (): string[] => firstLoadFiles(builtDir()).filter((name) => name.endsWith(".js"));
const laterScripts = (): string[] => {
  const first = new Set(firstLoadFiles(builtDir()));
  return readdirSync(assets())
    .filter((name) => name.endsWith(".js") && !first.has(name))
    .sort();
};

/** 目印のうち、渡した script のどれにも無い物 */
const missingFrom = (names: string[], marks: readonly string[]): string[] => {
  const code = names.map(read).join("\n");
  return marks.filter((mark) => !code.includes(mark));
};

describe("使い方の頁とカタログの頁を後から読む (#3280)", () => {

  it("first-load-carries-no-docs-page", () => {
    const first = firstScripts();
    expect(first.length, "build した頁が最初に読む script が無い").toBeGreaterThan(0);
    expect(missingFrom(first, DOCS_MARKS), "最初に読む script に残っている使い方の頁の目印").toEqual([...DOCS_MARKS]);
    expect(missingFrom(laterScripts(), DOCS_MARKS), "後から読む塊に無い使い方の頁の目印").toEqual([]);
  });

  it("first-load-carries-no-catalog-pages", () => {
    const first = firstScripts();
    expect(first.length, "build した頁が最初に読む script が無い").toBeGreaterThan(0);
    expect(missingFrom(first, CATALOG_MARKS), "最初に読む script に残っているカタログの頁の目印").toEqual([...CATALOG_MARKS]);
    expect(missingFrom(laterScripts(), CATALOG_MARKS), "後から読む塊に無いカタログの頁の目印").toEqual([]);
  });
});
