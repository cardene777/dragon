import { describe, it, expect } from "vitest";

import { PARTS_COUNT_ESTIMATE } from "./catalog-items";

/**
 * `PARTS_COUNT_ESTIMATE` が実物と一致することの検証 (#1341)。
 *
 * `CatalogIndexPage` は総数を出すために本 constant を使う。 parts は初期 chunk から外すため
 * 後から読む設計で (`CAR-1613`)、総数の表示のために全件を読み込むと分けた意味が消える。
 *
 * ## 「人が忘れずに直す」 に依存していた
 *
 * 以前は `parts.cdl.ts` と `catalog-items.ts` の両方に「同期更新する」 と書いてあるだけで、
 * 揃っているかを確かめる経路が無かった。 実際に片方だけ直された記述が残っていた
 * (`catalog-items.ts` の注記が 60 個のまま、実物は 80 個)。
 *
 * 数を数えるのは検査の側で、書いた数を信じない。
 */

/** 図として数えるもの (`nodes` を持つ top-level export) */
function 図の数(mod: Record<string, unknown>): number {
  return Object.values(mod).filter((v) => v !== null && typeof v === "object" && "nodes" in v).length;
}

describe("parts の数が実物と揃っている (#1341)", () => {
  it("実物を数えられている", async () => {
    // 数えられていなければ、一致の検査は通って当然になる
    const parts = await import("@/topics/catalog/parts.cdl");
    expect(図の数(parts), "parts の図を 1 件も数えられていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("宣言した数が実物と一致する", async () => {
    const parts = await import("@/topics/catalog/parts.cdl");
    expect(
      PARTS_COUNT_ESTIMATE,
      `parts.cdl.ts の図の数と PARTS_COUNT_ESTIMATE がずれている (画面の件数表示が実物と食い違う)`,
    ).toBe(図の数(parts));
  });

  it("図でないものを数えていない (陰性対照)", () => {
    // 何でも数える実装だと、上の一致は偶然でも通る
    expect(図の数({ a: "文字", b: 1, c: null, d: () => 0 }), "図でないものを数えている").toBe(0);
    expect(図の数({ a: { nodes: [] } }), "図を数えられていない").toBe(1);
  });
});
