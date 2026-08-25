/**
 * 検査の対象を突き合わせる道具の検査 (#1409)。
 *
 * この道具は 4 つの検査が呼ぶ。 ここが壊れると 4 つとも「漏れが無い」 と誤って報告する
 * ため、道具そのものの性質を固定する。
 */
import { describe, it, expect } from "vitest";

import { 一覧の図, 一覧の記法つき, 差分 } from "./catalog-scope";

describe("差分は重複数を落とさない (#1409)", () => {
  it("右に 1 つしか無い名前が左に 2 つあれば 1 件返す", () => {
    // 集合の差では 0 件になる。 module を足し忘れても既存の 1 件が id を覆い隠す形を落とす
    expect(差分(["same", "same"], ["same"])).toEqual(["same"]);
  });

  it("右に無い名前をそのまま返す", () => {
    expect(差分(["a", "b"], ["b"])).toEqual(["a"]);
  });

  it("右が覆っていれば空を返す", () => {
    expect(差分(["a", "b"], ["a", "b", "c"])).toEqual([]);
  });

  it("並び順に依らない (結果は並べ替える)", () => {
    expect(差分(["b", "a"], [])).toEqual(["a", "b"]);
  });
});

describe("一覧の図は遅延読み込みの分も集める (#1409)", () => {
  it("図を 1 件以上集められている", async () => {
    // 空振り防止。 空を返すと、これを呼ぶ 4 つの検査が全て「差が無い」 で通る
    const 図 = await 一覧の図();
    expect(図.length, "一覧から図を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("`parts` の図が入っている", async () => {
    /*
     * `parts` は `CATALOG_ITEMS` で空配列 (画面が後から読み込む)。 足さないと 80 図が
     * 範囲から漏れ、それらを対象に持つ検査が「一覧に無い図を見ている」 と誤って落ちる。
     */
    const 図 = await 一覧の図();
    const parts = 図.filter((id) => id.startsWith("parts-"));
    expect(parts.length, "`parts` の図が 1 件も入っていない").toBeGreaterThan(0);
  });

  it("`CATALOG_ITEMS` 側の図も入っている", async () => {
    // `parts` だけを集めて満足しないことを見る
    const 図 = await 一覧の図();
    const その他 = 図.filter((id) => !id.startsWith("parts-"));
    expect(その他.length, "`parts` 以外の図が 1 件も入っていない").toBeGreaterThan(0);
  });
});

describe("一覧の記法つきは記法を持つ見本だけを返す (#1409)", () => {
  it("見本を 1 件以上集められている", async () => {
    const 記法 = await 一覧の記法つき();
    expect(記法.length, "一覧から記法つきの見本を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("`parts` の見本が入っている", async () => {
    const 記法 = await 一覧の記法つき();
    const parts = 記法.filter((k) => k.startsWith("parts"));
    expect(parts.length, "`parts` の記法つき見本が 1 件も入っていない").toBeGreaterThan(0);
  });

  it("図の id ではなく export の名前を返す", async () => {
    /*
     * 記法の一致を見る検査は module の export 名で対象を引く。 id を返すと、名前が
     * ずれている見本 (id が `parts-bind-gauge` で export 名が `partsBindGauge` の形) が
     * 全て漏れとして落ちる。
     */
    const 記法 = await 一覧の記法つき();
    const id風 = 記法.filter((k) => k.includes("-"));
    expect(id風.length, `export 名に見えない値が混ざっている: ${id風.slice(0, 5).join(", ")}`).toBe(
      0,
    );
  });
});
