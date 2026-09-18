/**
 * 代表的な図の実寸が、宣言した値と一致することを見る (#2214)。
 *
 * ## なぜ要るか
 *
 * 読みにくさの度合いを伝える数字 (viewBox と箱の題の大きさ) は、図を 1 箇所直すだけで動く。
 * 動いても誰も測り直さないため、注釈に書いた数字が実物から離れていった。
 *
 * | どこに書いてあったか | 書いてあった値 | 実物 |
 * |---|---|---|
 * | `catalog-inline-zoom.spec.ts` | `er-complex-demo` は 2190×2904 で一覧の枠で 8.8px | 2310×2904 で 8.3px |
 * | `catalog-modal-zoom.spec.ts` | 同じ図が一覧の並びで 8.8px | 8.3px |
 * | `responsive-viewport-width-1738.test.ts` | 同じ図が 2190×2904 | 2310×2904 |
 * | `diagram-zoom.ts` | `swim-demo` は一覧の枠で 10.4px | 10.0px |
 *
 * 値は `support/responsive-accepted.ts` の `代表的な図` に 1 箇所だけ置き、ここで描き直す。
 *
 * ## 境の値は engine の文面から読み取る
 *
 * 「下限 12px」 のような境そのものは書き写さない (`responsive-viewport-width-1738.test.ts`
 * と同じ方針)。 engine が器を変えたらこの検査だけが古い値で通る形になる。
 *
 * ## 境の内側の器は `null` で持つ
 *
 * 「割らない」 を大きな数で代用すると、「測っていない」 と区別が付かなくなる。
 * `null` なら、その器で注意が出た時に落ちる。
 */
import { describe, it, expect } from "vitest";
import { visualValidateAll, layout } from "@cardenelabs/cdl";
import type { CdlDiagram, ValidateOptions } from "@cardenelabs/cdl";

import { 全図, 一覧の器, 代表的な図, type 器 as 器の種類 } from "./support/responsive-accepted";

/** id から図を引く */
const 図を引く = (id: string): CdlDiagram | undefined => 全図.find((d) => d.id === id);

/**
 * 器ごとの呼び出し方。
 *
 * 拡大表示は engine の既定なので器を渡さない (`responsive-viewport-accepted.test.ts` と同じ形)。
 */
const 器ごと: ReadonlyArray<[器の種類, ValidateOptions | undefined]> = [
  ["拡大", undefined],
  ["一覧", { container: 一覧の器 }],
];

/** その器で出た箱の題の大きさ (px)。 注意が出なければ `null` */
const 測った大きさ = (d: CdlDiagram, opts: ValidateOptions | undefined): number | null => {
  const 注意 = visualValidateAll([d], opts)
    .reports.flatMap((r) => r.violations)
    .find((v) => v.axis === "responsive-viewport");
  if (!注意) return null;
  const m = 注意.detail.match(/箱の題が ([0-9.]+)px/);
  if (!m) throw new Error(`注意の文面から箱の題の大きさを読み取れない: ${注意.detail}`);
  return Number(m[1]);
};

describe("代表的な図の実寸 (#2214)", () => {
  it("カタログの図を 1 枚以上集められている (空振り防止)", () => {
    expect(全図.length, "カタログの図を 1 枚も集められていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("表が空でなく、行の項目が全て埋まっている", () => {
    expect(代表的な図.length, "代表的な図が 1 行も無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const 行 of 代表的な図) {
      expect(行.役目.trim(), `${行.id} の役目が空`).not.toBe("");
      expect(行.viewBox.w, `${行.id} の viewBox 幅が 0 以下`).toBeGreaterThan(0);
      expect(行.viewBox.h, `${行.id} の viewBox 高さが 0 以下`).toBeGreaterThan(0);
    }
  });

  it("両方の器で境の内側に入る行を置いていない", () => {
    // どちらも null なら、その行は読みにくさの度合いを何も示さない
    const 何も示さない = 代表的な図.filter((行) => 行.拡大 === null && 行.一覧 === null);
    expect(何も示さない.map((行) => 行.id), "どちらの器でも下限を割らない行がある").toEqual([]);
  });

  it("表の図が全てカタログに実在する", () => {
    const 実在しない = 代表的な図.map((行) => 行.id).filter((id) => 図を引く(id) === undefined);
    expect(実在しない, `カタログに無い名前がある (図 ${全図.length} 枚を走査)`).toEqual([]);
  });
});

describe.each(代表的な図)("$id の実寸", (行) => {
  const 図 = 図を引く(行.id)!;

  it("viewBox が宣言と一致する", () => {
    const { w, h } = layout(図).viewBox;
    expect(
      { w, h },
      `${行.id} の viewBox が動いた。 代表的な図 の行を実測値に直す`,
    ).toEqual(行.viewBox);
  });

  it.each(器ごと)("%s の器で箱の題の大きさが宣言と一致する", (器, opts) => {
    const 実測 = 測った大きさ(図, opts);
    const 宣言 = 器 === "拡大" ? 行.拡大 : 行.一覧;
    if (宣言 === null) {
      expect(実測, `${行.id} は ${器} の器で下限を割らないと宣言しているが、注意が出た`).toBeNull();
      return;
    }
    expect(実測, `${行.id} が ${器} の器で下限を割らなくなった。 代表的な図 の行を null に直す`).not.toBeNull();
    // engine は小数 1 桁で出す。 丸めの 1 桁ぶんだけ許す
    expect(
      Math.abs(実測! - 宣言),
      `${行.id} の ${器} の器での箱の題が ${実測}px に動いた (宣言は ${宣言}px)`,
    ).toBeLessThanOrEqual(0.05);
  });
});

describe("突き合わせが効いている (植え込み対照)", () => {
  it("viewBox を 1 だけずらすと差が出る", () => {
    const 行 = 代表的な図[0]!;
    const { w, h } = layout(図を引く(行.id)!).viewBox;
    expect({ w, h }).not.toEqual({ w: 行.viewBox.w + 1, h: 行.viewBox.h });
  });

  it("箱の題の大きさを 1px ずらすと帯を超える", () => {
    const 行 = 代表的な図.find((x) => x.拡大 !== null)!;
    const 実測 = 測った大きさ(図を引く(行.id)!, undefined);
    expect(Math.abs(実測! - (行.拡大! + 1))).toBeGreaterThan(0.05);
  });
});
