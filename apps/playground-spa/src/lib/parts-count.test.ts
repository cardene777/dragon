import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { loadPartsItems, PARTS_COUNT_ESTIMATE } from "./catalog-items";

const repoRoot = new URL("../../../../", import.meta.url);

const 見本件数を固定する形 = [
  {
    file: "apps/playground-spa/src/lib/catalog-name-parity.test.ts",
    pattern: new RegExp(["const expected", "Record<string, number>"].join("[\\s\\S]{0,40}")),
  },
  {
    file: "packages/dragon/test/catalog-motion-coverage.test.ts",
    pattern: new RegExp(["動かす", "\\s*", ":", "\\s*\\d+"].join("")),
  },
  {
    file: "apps/playground-spa/src/lib/catalog-items.ts",
    pattern: new RegExp(["PARTS_COUNT_ESTIMATE", "\\s*=\\s*", "\\d+"].join("")),
  },
  {
    file: "apps/playground-spa/src/lib/parts-count.test.ts",
    pattern: new RegExp(["toBe", "\\(", "\\d{2,}", "\\)"].join("")),
  },
  {
    file: "apps/playground-spa/tests/catalog-pattern-switch.spec.ts",
    pattern: new RegExp(
      ["件数の札が", "\\s*\\d+", "|toHaveLength\\(19\\)", "|toBe\\(19\\)"].join(""),
    ),
  },
] as const;

async function 実物の見本件数(): Promise<number> {
  return (await loadPartsItems()).length;
}

/**
 * 名前表から導いた `PARTS_COUNT_ESTIMATE` が実物と一致することの検証 (#1341)。
 *
 * `CatalogIndexPage` は総数を出すために本 constant を使う。 parts は初期 chunk から外すため
 * 後から読む設計で (`CAR-1613`)、総数の表示のために全件を読み込むと分けた意味が消える。
 *
 * 数を数えるのは実際の catalog 一覧生成経路で、名前表と `loadPartsItems` のどちらかだけが
 * 変われば落ちる。これにより初期 chunk へ parts の見本 module を静的 import せずに済む。
 */

describe("parts の数が実物と揃っている (#1341)", () => {
  it("対象 file に見本件数の固定値が無い", () => {
    const found = 見本件数を固定する形.flatMap(({ file, pattern }) => {
      const source = readFileSync(new URL(file, repoRoot), "utf8");
      return pattern.test(source) ? [file] : [];
    });
    expect(found, `見本件数を固定している file:\n${found.join("\n")}`).toEqual([]);
  });

  it("実物を数えられている", async () => {
    // 数えられていなければ、一致の検査は通って当然になる
    expect(
      await 実物の見本件数(),
      "parts の実物の見本件数が 0 (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("名前表から導いた見本件数が実物と一致する", async () => {
    expect(
      PARTS_COUNT_ESTIMATE,
      "名前表から導いた見本件数が実物の見本件数と違う",
    ).toBe(await 実物の見本件数());
  });
});
