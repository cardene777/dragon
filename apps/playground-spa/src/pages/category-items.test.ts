// @vitest-environment jsdom

/**
 * 頁に出す見本の一覧が、同じ入力で同じ配列を返すことを見る (#2016)。
 *
 * この一覧は絞り込みと選んでいる項目の 2 つが依存に持つ。 呼ぶたびに別の配列になると、
 * その 2 つが描き直しのたびにやり直される。
 *
 * **見るのは配列の同一性であって中身ではない**。 中身が等しいことは `toEqual` で通るが、
 * やり直しを止めているのは同一性の方で、中身だけを見ると覚えさせるのをやめても通る。
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import { useCategoryItems, 部品の読込を見せる, 部品の頁 } from "./category-items";
import { CATALOG_ITEMS, type CatalogItem } from "../lib/catalog-items";

/** 部品の頁以外で、実際に見本を持つ縦列の名前 */
const 見本を持つ縦列 = Object.keys(CATALOG_ITEMS).filter(
  (k) => k !== 部品の頁 && (CATALOG_ITEMS[k]?.length ?? 0) > 0,
);

describe("頁に出す見本の一覧 (#2016)", () => {
  it("見本を持つ縦列が 1 つ以上ある (空振り防止)", () => {
    // 0 件だと下の「束ねてある一覧を返す」 が空配列どうしの比較になり、何も測らない
    expect(
      見本を持つ縦列.length,
      "見本を持つ縦列が 1 つも無い (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("縦列の名前が無い時は空のまま、描き直しても同じ配列を返す", () => {
    // 部品の一覧は毎回同じものを渡す = 画面では `useState` が持つ値で、
    // 書き換えない限り同じ配列が来る。 検査で作り直すと入力が変わったことになる
    const 部品: CatalogItem[] = [];
    const { result, rerender } = renderHook(
      ({ 縦列 }: { 縦列: string | undefined }) => useCategoryItems(縦列, 部品),
      { initialProps: { 縦列: undefined as string | undefined } },
    );
    const 最初 = result.current;
    expect(最初).toEqual([]);
    rerender({ 縦列: undefined });
    expect(result.current, "描き直しで別の配列になった").toBe(最初);
  });

  it("束ねてある一覧を持たない縦列でも、描き直して同じ配列を返す", () => {
    /*
     * `CATALOG_ITEMS[縦列] ?? []` は当たらなかった時に毎回新しい空配列を返す。
     * 覚えさせていないと、ここが描き直しのたびに別の配列になる。
     */
    const 無い縦列 = "この名前の縦列は束ねてある一覧に無い";
    expect(CATALOG_ITEMS[無い縦列], "前提が崩れた (その名前の縦列が在る)").toBeUndefined();
    const 部品: CatalogItem[] = [];
    const { result, rerender } = renderHook(
      ({ 縦列 }: { 縦列: string | undefined }) => useCategoryItems(縦列, 部品),
      { initialProps: { 縦列: 無い縦列 } },
    );
    const 最初 = result.current;
    expect(最初).toEqual([]);
    rerender({ 縦列: 無い縦列 });
    expect(result.current, "描き直しで別の配列になった").toBe(最初);
  });

  it("束ねてある一覧を持つ縦列は、その一覧をそのまま返す", () => {
    const 名 = 見本を持つ縦列[0]!;
    const 部品: CatalogItem[] = [];
    const { result, rerender } = renderHook(
      ({ 縦列 }: { 縦列: string | undefined }) => useCategoryItems(縦列, 部品),
      { initialProps: { 縦列: 名 } },
    );
    expect(result.current).toBe(CATALOG_ITEMS[名]);
    rerender({ 縦列: 名 });
    expect(result.current, "描き直しで別の配列になった").toBe(CATALOG_ITEMS[名]);
  });

  it("部品の頁では後から読んだ一覧を返す", () => {
    const 後から読んだ: CatalogItem[] = [];
    const { result } = renderHook(
      ({ 縦列 }: { 縦列: string | undefined }) => useCategoryItems(縦列, 後から読んだ),
      { initialProps: { 縦列: 部品の頁 } },
    );
    expect(result.current).toBe(後から読んだ);
    // 束ねてある一覧の `parts` は空の置き場で、こちらを返してはいけない
    expect(result.current).not.toBe(CATALOG_ITEMS[部品の頁]);
  });

  it("入力が変われば別の配列を返す (恒真でないことの確認)", () => {
    /*
     * 上の 4 件は「同じ配列が返る」 を期待する。 いつでも同じものを返す実装
     * (例 = 常に 1 つの空配列を返す) でも通るため、入力を変えた時に別の配列になることを見る。
     */
    const 縦列 = 見本を持つ縦列[0]!;
    const { result, rerender } = renderHook(
      ({ 縦列, 部品 }: { 縦列: string | undefined; 部品: CatalogItem[] }) =>
        useCategoryItems(縦列, 部品),
      { initialProps: { 縦列: undefined as string | undefined, 部品: [] as CatalogItem[] } },
    );
    const 空の時 = result.current;
    rerender({ 縦列, 部品: [] });
    expect(result.current, "縦列を変えても同じ配列が返った").not.toBe(空の時);

    const 別の部品: CatalogItem[] = [];
    rerender({ 縦列: 部品の頁, 部品: 別の部品 });
    expect(result.current).toBe(別の部品);
  });
});

describe("一覧の欄に出す読み込みの状態 (#2018)", () => {
  it("部品の頁で結果がまだ無ければ読み込み中", () => {
    expect(部品の読込を見せる(部品の頁, null)).toBe("loading");
  });

  it("部品の頁では読み込みの結果をそのまま出す", () => {
    expect(部品の読込を見せる(部品の頁, "loaded")).toBe("loaded");
    expect(部品の読込を見せる(部品の頁, "error")).toBe("error");
  });

  it("部品の頁でなければ、結果が残っていても何もしていない", () => {
    // 結果は部品の頁を離れる時に空へ戻すが、戻す前の描画で残っていても一覧の欄に出さない
    expect(部品の読込を見せる("charts", "error")).toBe("idle");
    expect(部品の読込を見せる("charts", null)).toBe("idle");
    expect(部品の読込を見せる(undefined, "loaded")).toBe("idle");
  });
});
