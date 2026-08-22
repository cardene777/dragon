import { describe, it, expect } from "vitest";

import { loadPartsItems, PARTS_COUNT_ESTIMATE } from "./catalog-items";

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
 * 数を数えるのは実際の catalog 一覧生成経路で、書いた数を信じない。
 */

describe("parts の数が実物と揃っている (#1341)", () => {
  it("実物を数えられている", async () => {
    // 数えられていなければ、一致の検査は通って当然になる
    const items = await loadPartsItems();
    expect(items, "parts の図を 1 件も数えられていない (検査が空振りしている)").not.toHaveLength(0);
  });

  it("宣言した数が実物と一致する", async () => {
    const items = await loadPartsItems();
    expect(
      PARTS_COUNT_ESTIMATE,
      `parts.cdl.ts の図の数と PARTS_COUNT_ESTIMATE がずれている (画面の件数表示が実物と食い違う)`,
    ).toBe(items.length);
  });
});
