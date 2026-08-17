/**
 * 動きが意味を持つ分類に静止した図を残さない (#1161 / #1164)。
 *
 * catalog 422 件のうち 194 件が完全に静止していた (値も注目先も変わらない)。 このうち
 * 動きが意味を持つ 6 分類は静止を残さないことを固定する。
 *
 * 「動く」 の判定は 3 通りのいずれか。 値が動く (`tweens` / `sets`)、 注目先が段ごとに
 * 変わる、 badge が段ごとに変わる。 3 つとも無い図は開いても静止画と区別が付かない。
 *
 * ## 見本帳 (形を見比べる 5 分類) は 3 つに分ける (#1172)
 *
 * かつては「見本帳は対象外」 の 1 行で全部を外していた。 その形だと **動かさないと決めた図と、
 * まだ動かしていない図が同じ扱い** になり、後者がいつまで残っているのか誰も分からない。
 *
 * | 一覧 | 中身 | 扱い |
 * |---|---|---|
 * | 動かすと決めた | `primitives-extra` 21 件 + `scene-*` 30 件 + `presets` 19 件 + `kind-*` 5 件 + `shape-*` 45 件 + `charts` 7 件 | 静止を残さない。 絵として動くことは `catalog-motion-render.test.tsx` が描画結果で見る |
 * | 動かさないと決めた | `styles` 10 件 + `lane-*` 3 件 + `stack-*` 2 件 | 並び方と色の見本。 値を足すと見せたいものが埋もれる |
 * | まだ動かしていない | 副題を描かない `shape-*` 4 件、 `charts` 2 件 | 別 Issue 待ち。 件数を固定して減り方を追う |
 *
 * 3 つの一覧は互いに重ならず、合わせて見本帳の全件になることを機械で見る。 分類から漏れた
 * 図が「どちらでもない」 まま残らないようにするため。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as Interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as Cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as Patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as TextDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as Animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as Primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as PrimitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as Presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as Charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";
import * as Styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";

/** 動きが意味を持つ分類。 見本帳 (primitives 等) は別の 3 一覧で扱う */
const 対象: Array<[string, Record<string, unknown>]> = [
  ["parts", Parts],
  ["interactive", Interactive],
  ["cookbook", Cookbook],
  ["patterns", Patterns],
  ["text-dsl", TextDsl],
  ["animation", Animation],
];

const diagramsOf = (mod: Record<string, unknown>): Array<[string, CdlDiagram]> =>
  Object.entries(mod)
    .filter(([, v]) => {
      if (!v || typeof v !== "object") return false;
      const d = v as Partial<CdlDiagram>;
      return typeof d.id === "string" && Array.isArray(d.nodes) && Array.isArray(d.phases);
    })
    .map(([k, v]) => [k, v as CdlDiagram]);

const key = (a: readonly string[] = []) => [...new Set(a)].sort().join(",");

/** 開いて何かが変わるか */
const moves = (d: CdlDiagram): boolean => {
  const 値 = d.phases.some((p) => (p.tweens?.length ?? 0) > 0 || (p.sets?.length ?? 0) > 0);
  const 注目 = new Set(d.phases.map((p) => key(p.activate))).size > 1;
  const badge = new Set(d.phases.map((p) => p.badge ?? "")).size > 1;
  return 値 || 注目 || badge;
};

/**
 * 動かさないと決めた図と、その理由 (#1172)。
 *
 * まだ動かしていない図と混ぜないために、1 件ずつ書く。 見せたいものが「並び方」 か「色」 で、
 * 値を足すとそれが埋もれる図に限る。
 */
const 動かさないと決めた: Record<string, string> = {
  "lane-single": "縦列 1 本の見本。 値を足すと縦列の形より値に目が行く",
  "lane-multi": "縦列を複数並べた見本。 同上",
  "lane-contain": "縦列で囲む見本。 同上",
  "stack-pair": "箱を 2 段に積む見本。 見せたいのは積み方",
  "stack-triple": "箱を 3 段に積む見本。 同上",
  "tone-accent": "色の見本。 値を足すと色の違いが埋もれる",
  "tone-teal": "色の見本。 同上",
  "tone-success": "色の見本。 同上",
  "tone-error": "色の見本。 同上",
  "tone-warning": "色の見本。 同上",
  "tone-info": "色の見本。 同上",
  "state-active": "強調の見本。 見せたいのは強調の有無",
  "state-inactive": "強調の見本。 同上",
  "style-solid": "線種の見本。 見せたいのは線の引き方",
  "style-dotted-flow": "線種の見本。 同上",
};

/**
 * 図の型の見本のうち、まだ動かしていない図と、その理由 (#1194)。
 *
 * **cdl 0.7.0 で空になった**。 木と放射は「中身が状態を読む経路を持たない」 ことを理由に
 * 残していたが、cdl 側で名前が状態を読むようになった (cdl #467)。 一覧は残す = 次に
 * 動かせない型が出た時の置き場所で、空であること自体が「全部動かした」 の証跡になる。
 */
const 型の見本で残す: Record<string, string> = {};

/**
 * 1 箱の見本のうち、まだ動かしていない図と、その理由 (#1196)。
 *
 * 形の見本 54 件のうち 50 件は副題 (or 値の欄 / 行) に数を置いて動かした。 残る 4 件は
 * **種別が副題を描かない**。 1 件は題 / 目次も読まず絵の文字を丸ごと固定しており、残り 3 件は
 * 題と目次だけを自前で描く。 どちらも数を置ける欄が識別の文字しか残らず、形の見本としての
 * 説明を潰すことになる (cdl #469)。
 *
 * この 4 件は **描画結果で見つけた** = 副題に数を置いても絵の文字が変わらないことを
 * `catalog-motion-render.test.tsx` の検査が落として教えた。 宣言だけを見ていると通っていた。
 */
/**
 * 図表の見本のうち、まだ動かしていない図と、その理由 (#1198)。
 *
 * 数の欄は記法で `{名前}` を書けるようにした。 残る 4 件は数以外の欄を動かす必要がある。
 */
const 図表で残す: Record<string, string> = {
  公開までの段取り: "期間の欄。 数でも語でもなく目盛りの名前を書く欄で、状態を通す経路がまだ無い",
  配布物の構成: "階層を箱 1 つに載せる型。 中身が状態を読む経路を cdl が持たない (cdl #467)",
};

const 形の見本で残す: Record<string, string> = {
  "shape-blockchain-block": "連鎖の箱。 種別が絵の文字を固定していて、書き手の値を読まない (cdl #469)",
  "shape-terminal": "端末の箱。 種別が副題を描かず、数を置ける欄が識別の文字しか残らない (cdl #469)",
  "shape-code-block": "コードの箱。 同上",
  "shape-kanban-card": "付箋の箱。 同上",
};

/** 見本帳の図を 3 つの一覧に振り分ける (#1172)。 どれにも入らない図は `未分類` に落ちる */
function 見本帳の振り分け(): {
  動かす: string[];
  動かさない: string[];
  まだ: string[];
  未分類: string[];
} {
  const 動かす: string[] = [];
  const 動かさない: string[] = [];
  const まだ: string[] = [];
  const 未分類: string[] = [];

  for (const [, d] of diagramsOf(PrimitivesExtra)) 動かす.push(d.id);
  for (const [, d] of diagramsOf(Styles)) 動かさない.push(d.id);
  // 図の型の見本は cdl 側に経路がある型だけ動かす (#1194)
  for (const [, d] of diagramsOf(Presets)) (型の見本で残す[d.id] ? まだ : 動かす).push(d.id);
  // 図表の見本は数の欄に状態を書けるようになった分だけ動かす (#1198)
  for (const [, d] of diagramsOf(Charts)) (図表で残す[d.id] ? まだ : 動かす).push(d.id);
  // `primitives` は 1 file の中に 2 つの扱いが混ざる。 並び方の見本 (`lane-*` / `stack-*`) は
  // 動かさないと決めた側、 種別と図形の見本は まだ動かしていない側
  for (const [, d] of diagramsOf(Primitives)) {
    if (d.id.startsWith("lane-") || d.id.startsWith("stack-")) 動かさない.push(d.id);
    // 場面の見本は箱を 1 つずつ光らせて流れとして読ませる (#1192)
    else if (d.id.startsWith("scene-")) 動かす.push(d.id);
    // 形と種別の見本は数を動かす。 cdl 側が値を読まない 1 件だけ残る (#1196)
    else if (d.id.startsWith("kind-") || d.id.startsWith("shape-"))
      (形の見本で残す[d.id] ? まだ : 動かす).push(d.id);
    else 未分類.push(d.id);
  }
  return { 動かす, 動かさない, まだ, 未分類 };
}

describe("動きが意味を持つ分類に静止した図を残さない (#1161)", () => {
  it("対象がそろっている", () => {
    // import を書き間違えると以下が素通りする
    const 件数 = Object.fromEntries(対象.map(([n, m]) => [n, diagramsOf(m).length]));
    expect(件数).toEqual({
      parts: 80,
      interactive: 129,
      cookbook: 25,
      patterns: 12,
      "text-dsl": 13,
      animation: 10,
    });
  });

  for (const [name, mod] of 対象) {
    it(`${name} に静止した図が無い`, () => {
      const 静止 = diagramsOf(mod).filter(([, d]) => !moves(d)).map(([k]) => k);
      expect(静止, `静止している図: ${静止.join(", ")}`).toEqual([]);
    });
  }
});

describe("見本帳は 3 つの一覧に分かれる (#1172)", () => {
  it("どの図もいずれか 1 つの一覧に入る", () => {
    // 分類から漏れた図があると、動かす対象なのか動かさないのか誰も判断できないまま残る
    const { 動かす, 動かさない, まだ, 未分類 } = 見本帳の振り分け();
    expect(未分類, `どの一覧にも入らない図: ${未分類.join(", ")}`).toEqual([]);

    const 全件 = [...動かす, ...動かさない, ...まだ];
    expect(new Set(全件).size, "同じ図が 2 つの一覧に入っている").toBe(全件.length);
    expect(全件.length).toBe(
      diagramsOf(Primitives).length +
        diagramsOf(PrimitivesExtra).length +
        diagramsOf(Presets).length +
        diagramsOf(Charts).length +
        diagramsOf(Styles).length,
    );
  });

  it("一覧ごとの件数が分かる", () => {
    // まだ動かしていない図の件数を固定して、減り方を追えるようにする。
    // 動かす作業が進むと この数が減り、検査が「更新しろ」 と言う
    const { 動かす, 動かさない, まだ } = 見本帳の振り分け();
    expect({ 動かす: 動かす.length, 動かさない: 動かさない.length, まだ: まだ.length }).toEqual({
      動かす: 127,
      動かさない: 15,
      まだ: 6,
    });
  });

  it("動かすと決めた見本に静止した図が無い", () => {
    // 絵として動くかは `apps/playground-spa/src/lib/catalog-motion-render.test.tsx` が
    // 描画結果で見る。 ここでは宣言の層で静止が混ざっていないことを見る
    const 場面 = diagramsOf(Primitives).filter(([, d]) => d.id.startsWith("scene-"));
    const 型 = diagramsOf(Presets).filter(([, d]) => !型の見本で残す[d.id]);
    const 形 = diagramsOf(Primitives).filter(
      ([, d]) => (d.id.startsWith("shape-") || d.id.startsWith("kind-")) && !形の見本で残す[d.id],
    );
    const 静止 = [...diagramsOf(PrimitivesExtra), ...場面, ...型, ...形]
      .filter(([, d]) => !moves(d))
      .map(([k]) => k);
    expect(静止, `静止している図: ${静止.join(", ")}`).toEqual([]);
  });

  it("まだ動かしていない図表は 1 件ずつ理由を持つ", () => {
    const 残った = diagramsOf(Charts).filter(([, d]) => 図表で残す[d.id]).map(([, d]) => d.id);
    expect([...残った].sort()).toEqual(Object.keys(図表で残す).sort());
  });

  it("まだ動かしていない形の見本は 1 件ずつ理由を持つ", () => {
    // 動かせないのか手が回っていないだけなのかを、後から見た人が判断できる形にする
    const 残った = diagramsOf(Primitives)
      .filter(([, d]) => (d.id.startsWith("shape-") || d.id.startsWith("kind-")) && 形の見本で残す[d.id])
      .map(([, d]) => d.id);
    expect([...残った].sort()).toEqual(Object.keys(形の見本で残す).sort());
  });

  it("まだ動かしていない図の型は 1 件ずつ理由を持つ", () => {
    // 動かせないのか手が回っていないだけなのかを、後から見た人が判断できる形にする。
    // 一覧が実物とずれたら落とす
    const 残った = diagramsOf(Presets).filter(([, d]) => 型の見本で残す[d.id]).map(([, d]) => d.id);
    expect([...残った].sort()).toEqual(Object.keys(型の見本で残す).sort());
  });

  it("動かさないと決めた図は 1 件ずつ理由を持つ", () => {
    // **まだ動かしていない図と区別が付く形にする**。 件数だけで分けると、後から見た人が
    // 「これは動かさない図なのか、手が回っていないだけなのか」 を判断できない。
    // 1 件ずつ理由を書き、一覧が実物とずれたら落とす
    const { 動かさない } = 見本帳の振り分け();
    expect([...動かさない].sort()).toEqual(Object.keys(動かさないと決めた).sort());
  });
});
