/**
 * 使い方の頁とカタログの頁を、頁が最初に読む script から外して後から読む (#3280)。
 * 更新履歴の頁と見つからない頁も、最初の画面に要らないので後から読む (#3832)。
 * 更新履歴の頁と見つからない頁と組み込みの見本の頁だけが使う字も、頁と一緒に後から読む (#3880)。
 *
 * 最初に読む script は、build した頁の `index.html` が名指す script と CSS (`firstLoadFiles`)。
 * 頁の部品が script の中にあるかは、部品が描く要素の目印 (build が `"data-docs":"hero"` の形で残す) が現れるかで決める。
 * 頁の見た目の決まりが CSS の中にあるかは、頁だけが使う class の名前 (`.release-crumb`) が現れるかで決める。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { builtDir, firstLoadFiles } from "./playground-support";

/** 使い方の頁の部品が描く要素の目印 */
const DOCS_MARKS = ['"data-docs":"hero"', '"data-docs":"section"'] as const;
/** 一覧と分類と部品の頁の部品が描く要素の目印 */
const CATALOG_MARKS = ['"data-catalog":"index"', '"data-catalog":"stage"', '"data-catalog":"part-figure"'] as const;
/** 更新履歴の頁の部品が描く要素の目印と、頁だけが使う class の名前 */
const RELEASE_MARKS = ['"data-release":"hero"', '"data-release":"crumb"'] as const;
const RELEASE_STYLES = [".release-crumb", ".release-eyebrow"] as const;
/** 見つからない頁の部品が描く要素の目印と、頁だけが使う class の名前 */
const NOT_FOUND_MARKS = ['"data-not-found":"code"', '"data-not-found":"cta"'] as const;
const NOT_FOUND_STYLES = [".not-found-code", ".not-found-cta"] as const;
/** 更新履歴の頁と見つからない頁と組み込みの見本の頁だけが使う日本語の字の一部。各頁の `text.ts` が持つ (#3880) */
const LATER_PAGE_TEXTS = ["版ごとの詳しい変更は", "お探しの頁は移動または削除されたか", "外の頁に置く4つの置き方で並べた"] as const;

const assets = (): string => join(builtDir(), "assets");
const read = (name: string): string => readFileSync(join(assets(), name), "utf8");
const firstScripts = (): string[] => firstLoadFiles(builtDir()).filter((name) => name.endsWith(".js"));
const laterScripts = (): string[] => {
  const first = new Set(firstLoadFiles(builtDir()));
  return readdirSync(assets())
    .filter((name) => name.endsWith(".js") && !first.has(name))
    .sort();
};
const firstStyles = (): string[] => firstLoadFiles(builtDir()).filter((name) => name.endsWith(".css"));
const laterStyles = (): string[] => {
  const first = new Set(firstLoadFiles(builtDir()));
  return readdirSync(assets())
    .filter((name) => name.endsWith(".css") && !first.has(name))
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

describe.for([
  { test: "first-load-carries-no-release-notes-page", page: "更新履歴の頁", marks: RELEASE_MARKS, styles: RELEASE_STYLES },
  { test: "first-load-carries-no-not-found-page", page: "見つからない頁", marks: NOT_FOUND_MARKS, styles: NOT_FOUND_STYLES },
] as const)("$page を後から読む (#3832)", ({ test, page, marks, styles }) => {
  it(test, () => {
    expect(firstScripts().length, "build した頁が最初に読む script が無い").toBeGreaterThan(0);
    expect(firstStyles().length, "build した頁が最初に読む CSS が無い").toBeGreaterThan(0);
    expect(missingFrom(firstScripts(), marks), `最初に読む script に残っている${page}の目印`).toEqual([...marks]);
    expect(missingFrom(laterScripts(), marks), `後から読む塊に無い${page}の目印`).toEqual([]);
    expect(missingFrom(firstStyles(), styles), `最初に読む CSS に残っている${page}の見た目の決まり`).toEqual([...styles]);
    expect(missingFrom(laterStyles(), styles), `後から読む CSS に無い${page}の見た目の決まり`).toEqual([]);
  });
});

// 3 つの頁を後から読んでも、頁だけが使う字を最初に読む言葉の表に置くと、字の分だけ最初に読む script が重くなる (#3880)
describe("後から読む頁だけが使う字を最初に読まない (#3880)", () => {
  it("first-load-carries-no-later-page-text", () => {
    expect(firstScripts().length, "build した頁が最初に読む script が無い").toBeGreaterThan(0);
    expect(missingFrom(firstScripts(), LATER_PAGE_TEXTS), "最初に読む script に残っている後から読む頁の字").toEqual([...LATER_PAGE_TEXTS]);
    expect(missingFrom(laterScripts(), LATER_PAGE_TEXTS), "後から読む塊に無い後から読む頁の字").toEqual([]);
  });
});
