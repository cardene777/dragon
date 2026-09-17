/**
 * 動きが意味を持つ分類に静止した図を残さない (#1161 / #1164)。
 *
 * catalog 417 件のうち 194 件が完全に静止していた (値も注目先も変わらない)。 このうち
 * 動きが意味を持つ 6 分類は静止を残さないことを固定する。
 *
 * 「動く」 の判定は 2 通りのいずれか。 値が動く (`tweens` / `sets`) か、注目先が段ごとに
 * 変わる。 どちらも無い図は、badge の切替自体を見せる名指しの例外を除いて静止とみなす。
 *
 * ## カタログ (形を見比べる 5 分類) は 3 つに分ける (#1172)
 *
 * かつては「カタログは対象外」 の 1 行で全部を外していた。 その形だと **動かさないと決めた図と、
 * まだ動かしていない図が同じ扱い** になり、後者がいつまで残っているのか誰も分からない。
 *
 * | 一覧 | 中身 | 扱い |
 * |---|---|---|
 * | 動かすと決めた | `primitives-extra` + `scene-*` + `presets` + `kind-*` + `shape-*` + `charts` + `parts-in-box` の部品の段で動く見本 | 静止を残さない。 絵として動くことは `catalog-motion-render.test.tsx` が描画結果で見る |
 * | 動かさないと決めた | `styles` + `lane-*` + `stack-*` + `parts-in-box` の状態を上書きして止める変種 | 並び方と色の見本。 値を足すと見せたいものが埋もれる |
 * | まだ動かしていない | 副題を描かない `shape-*`、 `charts` | 別 Issue 待ち。 件数を固定して減り方を追う |
 *
 * **件数はここに書かない**。 一覧ごとの数は下の `一覧ごとの件数が分かる` が SSOT で、
 * ここに写すと見本を足すたびに片方だけ古くなる (実測で `presets` と `charts` の 2 群が
 * ずれ、表の合計が実物と 16 件違っていた)。
 *
 * 3 つの一覧は互いに重ならず、合わせてカタログの全件になることを機械で見る。 分類から漏れた
 * 図が「どちらでもない」 まま残らないようにするため。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as PartsInBox from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";
import * as PartsMotion from "../../../apps/playground-spa/src/topics/catalog/parts-motion.cdl";
import * as Interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as Cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as Patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as TextDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as Ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as Animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as Primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as PrimitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as Presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as Charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";
import * as Styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";

/** 動きが意味を持つ分類。 カタログ (primitives 等) は別の 3 一覧で扱う */
const 対象: Array<[string, Record<string, unknown>]> = [
  ["parts", Parts],
  // 部品を繋いで動かす見本 (#2125)。 5 件とも段で値が動くので、動きが意味を持つ側に入る
  ["parts-motion", PartsMotion],
  ["interactive", Interactive],
  ["cookbook", Cookbook],
  ["patterns", Patterns],
  ["text-dsl", TextDsl],
  ["animation", Animation],
  ["ethereum", Ethereum],
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

/**
 * 開いて何かが変わるか。
 *
 * **badge は条件に入れない** (#1168)。 badge だけが変わる図は図そのものが 1 mm も変わらず、
 * 開いても静止画と区別が付かない。 条件に入れると「動く」 の保証が緩み、値も注目先も持たない
 * 図が緑のまま通る。
 *
 * 元は `badgePerPhase` (badge の見本) を通すために入れていた。 実測すると 417 図のうち
 * badge だけに頼っていたのはその 1 件だけで、他の図は値か注目先で判定できている。
 * 特別な 1 件のために全体の条件を緩めるのではなく、名指しの例外に置く。
 */
const moves = (d: CdlDiagram): boolean => {
  const 値 = d.phases.some((p) => (p.tweens?.length ?? 0) > 0 || (p.sets?.length ?? 0) > 0);
  const 注目 = new Set(d.phases.map((p) => key(p.activate))).size > 1;
  return 値 || 注目;
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
  // 欄が取る値を全て並べる見本 (#1966)。 見せたいのは値ごとの形の違いで、動かすとそちらに目が行く
  "節の色-6-種": "節の色の見本。 色の違いを並べて見せる",
  "矢印の先端の矢じり-5-形": "矢印の端の形の見本。 見せたいのは端に置いた形",
  "矢印の先端の多重度-4-形": "矢印の端の形の見本。 同上",
  "矢印の根元の矢じり-5-形": "矢印の端の形の見本。 同上",
  "矢印の根元の多重度-4-形": "矢印の端の形の見本。 同上",
  矢印の出る辺を書かない: "矢印の出る辺の見本。 見せたいのは線の道筋",
  矢印を上の辺から出す: "矢印の出る辺の見本。 同上",
  矢印を右の辺から出す: "矢印の出る辺の見本。 同上",
  矢印を下の辺から出す: "矢印の出る辺の見本。 同上",
  矢印を左の辺から出す: "矢印の出る辺の見本。 同上",
  受付の右に確認を置く: "位置を相対で書く見本。 見せたいのは 2 つの箱の位置の関係",
  受付の左に確認を置く: "位置を相対で書く見本。 同上",
  受付の上に確認を置く: "位置を相対で書く見本。 同上",
  受付の下に確認を置く: "位置を相対で書く見本。 同上",
  間隔を書かずに受付の右へ置く: "位置を相対で書く見本。 同上",
  "形の満ちる向き-4-種": "満ちる向きの見本。 同じ値で塗りの寄る向きだけを比べる",
  // 記法で書ける値を全て見せる見本 (#1969)。 見せたいのは線の有無と間隔で、動かすとそちらに目が行く
  縦列に縦の点線を引かない: "縦列の縦の点線の見本。 見せたいのは線の有無",
  縦列の中心に縦の点線を引く: "縦列の縦の点線の見本。 同上",
  図全体の間隔を書かない: "図全体の間隔の見本。 見せたいのは箱と縦列の間の広さ",
  縦列の間を広げる: "図全体の間隔の見本。 同上",
  同じ縦列の箱の間を広げる: "図全体の間隔の見本。 同上",
  矢印の名札の余白を広げる: "図全体の間隔の見本。 同上",
  間隔をまとめて広げる: "図全体の間隔の見本。 同上",
  全ての縦列の幅を揃える: "図全体の間隔の見本。 同上",
  図を描く広さを決める: "図全体の大きさの見本。 見せたいのは描く広さ",
  図を大きく描く: "図全体の大きさの見本。 見せたいのは描く倍率",
  流れ図の並ぶ向きを書かない: "流れ図の並ぶ向きの見本。 見せたいのは箱の並ぶ向き",
  流れ図を縦に積む: "流れ図の並ぶ向きの見本。 同上",
  流れ図を横に並べる: "流れ図の並ぶ向きの見本。 同上",
  流れ図の矢印を書いた端のとおりに繋ぐ: "流れ図の並ぶ向きの見本。 見せたいのは矢印を引く端",
  状態の始まりと終わりを書かない: "状態の始まりと終わりの見本。 見せたいのはどの箱に札が付くか",
  状態の始まりと終わりを書く: "状態の始まりと終わりの見本。 同上",
  // スタイルの欄を別の書き方や値で書く変種 (#1969)。 元の見本と同じく値ごとの形の違いを見せる
  "節の色-6-種を色の欄で書く": "節の色の見本。 色の違いを並べて見せる",
  "矢印の先端の塗り-2-種": "矢印の端の塗りの見本。 見せたいのは塗る形と中空の形",
  "矢印の根元の塗り-2-種": "矢印の端の塗りの見本。 同上",
  "形の満ちる向き-4-種に線の色を付ける": "満ちる向きの見本。 見せたいのは外枠の色",
  // 位置のずらしの見本 (#1971)。 見せたいのは箱と縦列と名前の置き場所で、値を動かすとそちらに目が行く
  位置をずらさない: "位置のずらしの見本。 見せたいのは置き場所",
  箱を自動で決まった位置からずらす: "位置のずらしの見本。 同上",
  縦列を自動で決まった位置からずらす: "位置のずらしの見本。 同上",
  矢印の名前を自動で決まった位置からずらす: "位置のずらしの見本。 同上",
  // 縦列の組の見本 (#1972)。 見せたいのは枠がどの縦列を囲むかで、値を動かすとそちらに目が行く
  縦列を組で束ねない: "縦列の組の見本。 見せたいのは枠の囲む範囲",
  "処理と保存の縦列を-1-つの組で囲む": "縦列の組の見本。 同上",
  "組を-2-つ書いて縦列を分けて囲む": "縦列の組の見本。 同上",
  // 部品を箱に使う見本 (#1973)。 部品の段を外し、上書きした値で止めて見せる
  "部品の塗りの割合を-4-割で止める":
    "部品の状態の上書きの見本。 部品の段を外して上書きした値のまま止める",
};

/**
 * `primitives` のうち並び方を見せる見本の書き出し名 (#1969)。
 *
 * 並び方の見本は id の頭 (`lane-` / `stack-`) で振り分けてきたが、記法で書く見本は id が題から
 * 決まるため頭を揃えられない。 書き出し名と、その切替 (`pattern__<名>__*`) で振り分ける。
 */
const 並び方の見本の書き出し名 = [
  "laneLifeline",
  "viewportSpacing",
  "flowDirection",
  "stateStartEnd",
  "layoutOffset",
  "laneGroup",
] as const;

const 並び方の見本か = (exportName: string): boolean =>
  並び方の見本の書き出し名.some(
    (名) => exportName === 名 || exportName.startsWith(`pattern__${名}__`),
  );

/**
 * 図そのものは変わらないが、それが見せたいものである図 (#1168)。
 *
 * `moves()` は値と注目先の 2 つだけを見る。 badge だけが変わる図はそこに引っかからないが、
 * **badge が変わること自体が見せたいもの** なので静止した図として扱うのは誤りになる。
 *
 * 元は `moves()` の条件に badge を足して通していた。 その形だと **図そのものが 1 mm も
 * 変わらない図が全群で緑になる** = 「動く」 の保証が緩む。 実測で 417 図のうち badge だけに
 * 頼っていたのは下の 1 件だけだったので、条件を戻して名指しの例外に置いた。
 *
 * `動かさないと決めた` と分けるのは対象群が違うため。 あちらは `primitives` 群の振り分けと
 * 1:1 で結ばれており、別群の図を混ぜると振り分けの検査が落ちる。
 */
const 図は変わらないが意図どおり: Record<string, string> = {
  badgePerPhase: "badge の見本。 段ごとに badge が変わることを見せる図で、図そのものは変わらない",
};

const badgeが段ごとに変わる = (d: CdlDiagram): boolean =>
  new Set(d.phases.map((p) => p.badge ?? "")).size > 1;

const 意図どおりの例外 = (exportName: string, d: CdlDiagram): boolean =>
  Boolean(図は変わらないが意図どおり[exportName]) && badgeが段ごとに変わる(d);

/**
 * 図の型の見本のうち、まだ動かしていない図と、その理由 (#1194)。
 *
 * **cdl 0.7.0 で空になった**。 木と放射は「中身が状態を読む経路を持たない」 ことを理由に
 * 残していたが、cdl 側で名前が状態を読むようになった (cdl #467)。 一覧は残す = 次に
 * 動かせない型が出た時の置き場所で、空であること自体が「全部動かした」 の証跡になる。
 */
const 型の見本で残す: Record<string, string> = {};

/**
 * 図表の見本のうち、まだ動かしていない図と、その理由 (#1198)。
 *
 * 数の欄は記法で `{名前}` を書けるようにした。 ここに残る図は数以外の欄を動かす必要がある。
 */
const 図表で残す: Record<string, string> = {
  公開までの段取り: "期間の欄。 数でも語でもなく目盛りの名前を書く欄で、状態を通す経路がまだ無い",
  配布物の構成: "階層を箱 1 つに載せる型。 中身が状態を読む経路を cdl が持たない (cdl #467)",
};

/**
 * 1 箱の見本のうち、まだ動かしていない図と、その理由 (#1196)。
 *
 * 形の見本の多くは副題 (or 値の欄 / 行) に数を置いて動かした。 ここに残る図は
 * **種別が副題を描かない**。 連鎖の箱は題 / 目次も読まず絵の文字を丸ごと固定しており、残りは
 * 題と目次だけを自前で描く。 どちらも数を置ける欄が識別の文字しか残らず、形の見本としての
 * 説明を潰すことになる (cdl #469)。
 *
 * ここに残る図は **描画結果で見つけた** = 副題に数を置いても絵の文字が変わらないことを
 * `catalog-motion-render.test.tsx` の検査が落として教えた。 宣言だけを見ていると通っていた。
 */
const 形の見本で残す: Record<string, string> = {
  "shape-blockchain-block":
    "連鎖の箱。 種別が絵の文字を固定していて、書き手の値を読まない (cdl #469)",
  "shape-terminal":
    "端末の箱。 種別が副題を描かず、数を置ける欄が識別の文字しか残らない (cdl #469)",
  "shape-code-block": "コードの箱。 同上",
  "shape-kanban-card": "付箋の箱。 同上",
};

/** カタログの図を 3 つの一覧に振り分ける (#1172)。 どれにも入らない図は `未分類` に落ちる */
function カタログの振り分け(): {
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
  // 部品を箱に使う見本 (#1973) は部品の段で動く。 状態を上書きして止める変種だけ動かさない
  for (const [, d] of diagramsOf(PartsInBox))
    (動かさないと決めた[d.id] ? 動かさない : 動かす).push(d.id);
  // 図の型の見本は cdl 側に経路がある型だけ動かす (#1194)
  for (const [, d] of diagramsOf(Presets)) (型の見本で残す[d.id] ? まだ : 動かす).push(d.id);
  // 図表の見本は数の欄に状態を書けるようになった分だけ動かす (#1198)
  for (const [, d] of diagramsOf(Charts)) (図表で残す[d.id] ? まだ : 動かす).push(d.id);
  // `primitives` は 1 file の中に 2 つの扱いが混ざる。 並び方の見本 (`lane-*` / `stack-*`) は
  // 動かさないと決めた側、 種別と図形の見本は まだ動かしていない側
  for (const [k, d] of diagramsOf(Primitives)) {
    if (d.id.startsWith("lane-") || d.id.startsWith("stack-") || 並び方の見本か(k))
      動かさない.push(d.id);
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
      parts: 86,
      // 部品を繋いで動かす見本 5 件 (#2125)
      "parts-motion": 5,
      // 135 = 129 図 + `formulaTextBind` の名札を書かない変種 (#1916)
      //   + `buildStatusTrafficLight` と `clickToggle` の名前を書かない変種 (#1920)
      //   + 矢印や縦列や図全体で操作を受け取る `eventTargets` (#1969)
      //   + 速さの選択肢を変えた `timelineDrive` と日時の入力に替えた `inputVariety` の変種 (#1969)
      //   + 札の色を札の字と別の状態で引く `readoutVariety` の変種 2 つ (#1974)
      interactive: 137,
      cookbook: 26,
      patterns: 12,
      // ER 図に多重度を全て並べる変種を足して 16 → 17 (#2105)
      "text-dsl": 17,
      // 数え上げの時間を延ばした `richPipelineDemo` の変種を足して 10 → 11 (#1969)
      animation: 11,
      ethereum: 4,
    });
  });

  for (const [name, mod] of 対象) {
    it(`${name} に静止した図が無い`, () => {
      const 静止 = diagramsOf(mod)
        .filter(([, d]) => !moves(d))
        .filter(([k, d]) => !意図どおりの例外(k, d))
        .map(([k]) => k);
      expect(静止, `静止している図: ${静止.join(", ")}`).toEqual([]);
    });
  }

  it("図は変わらないが意図どおりの図が実物と一致する", () => {
    // 一覧が実物とずれると、動かすべき図が例外に紛れて静止したまま残る。
    // 実物側で動くようになったら一覧から外す
    const 実物 = 対象
      .flatMap(([, mod]) => diagramsOf(mod))
      .filter(([k, d]) => !moves(d) && 意図どおりの例外(k, d))
      .map(([k]) => k);
    expect([...実物].sort()).toEqual(Object.keys(図は変わらないが意図どおり).sort());
  });
});

describe("カタログは 3 つの一覧に分かれる (#1172)", () => {
  it("どの図もいずれか 1 つの一覧に入る", () => {
    // 分類から漏れた図があると、動かす対象なのか動かさないのか誰も判断できないまま残る
    const { 動かす, 動かさない, まだ, 未分類 } = カタログの振り分け();
    expect(未分類, `どの一覧にも入らない図: ${未分類.join(", ")}`).toEqual([]);

    const 全件 = [...動かす, ...動かさない, ...まだ];
    expect(new Set(全件).size, "同じ図が 2 つの一覧に入っている").toBe(全件.length);
    expect(全件.length).toBe(
      diagramsOf(Primitives).length +
        diagramsOf(PrimitivesExtra).length +
        diagramsOf(Presets).length +
        diagramsOf(Charts).length +
        diagramsOf(Styles).length +
        diagramsOf(PartsInBox).length,
    );
  });

  it("一覧ごとの件数が分かる", () => {
    // まだ動かしていない図の件数を固定して、減り方を追えるようにする。
    // 動かす作業が進むと この数が減り、検査が「更新しろ」 と言う
    const { 動かす, 動かさない, まだ } = カタログの振り分け();
    expect({ 動かす: 動かす.length, 動かさない: 動かさない.length, まだ: まだ.length }).toEqual({
      // #1966 で体験の道筋に 5 つの気持ちの変種 (動かす) と、スタイルに値を並べる見本 11 枚 (動かさない) を足した
      // #1969 で棒を 4 割で伸ばし終える変種 (動かす) と、縦列の縦の点線と図全体の間隔の見本 10 枚 (動かさない) を足した
      // #1969 で流れ図の並ぶ向きと状態の始まりと終わりの見本 5 枚と、スタイルの変種 4 枚 (動かさない) を足した
      // #1971 で位置のずらしの見本 4 枚 (動かさない) を足した
      // #1972 で縦列の組の見本 3 枚 (動かさない) を足した
      // #1973 で部品を箱に使う見本 3 枚 (動かす) と、状態を上書きして止める変種 1 枚 (動かさない) を足した
      // #1980 で部品を縦列に置く変種 1 枚 (動かす) を足した
      // #1979 で部品へ矢印を繋ぐ変種 2 枚 (動かす) を足した
      // #1986 で向きを書いた流れ図が書いた端のとおりに繋ぐ変種 1 枚 (動かさない) を足した
      // #1987 で部品を流れの途中に置く変種 1 枚 (動かす) を足した
      // #1990 で部品を並べる変種 1 枚 (動かす) を足した
      // #2010 で部品 2 つへ矢印を分ける変種と、部品どうしを繋ぐ変種の 2 枚 (動かす) を足した
      // #2012 で高さの違う部品どうしを繋ぐ変種 1 枚 (動かす) を足した (描画エンジン 0.65.0 で角の行き過ぎが直った)
      // #2011 で 2 つの部品から同じ箱へ集める変種 1 枚 (動かす) を足した (描画エンジン 0.66.0 で貫通が直った)
      // #2039 で位置を相対で書く見本 5 枚 (動かさない) と、部品を基準にする変種 1 枚 (動かす) を足した
      動かす: 161,
      動かさない: 59,
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
    const 部品を箱に = diagramsOf(PartsInBox).filter(([, d]) => !動かさないと決めた[d.id]);
    const 静止 = [...diagramsOf(PrimitivesExtra), ...場面, ...型, ...形, ...部品を箱に]
      .filter(([, d]) => !moves(d))
      .map(([k]) => k);
    expect(静止, `静止している図: ${静止.join(", ")}`).toEqual([]);
  });

  it("まだ動かしていない図表は 1 件ずつ理由を持つ", () => {
    const 残った = diagramsOf(Charts)
      .filter(([, d]) => 図表で残す[d.id])
      .map(([, d]) => d.id);
    expect([...残った].sort()).toEqual(Object.keys(図表で残す).sort());
  });

  it("まだ動かしていない形の見本は 1 件ずつ理由を持つ", () => {
    // 動かせないのか手が回っていないだけなのかを、後から見た人が判断できる形にする
    const 残った = diagramsOf(Primitives)
      .filter(
        ([, d]) => (d.id.startsWith("shape-") || d.id.startsWith("kind-")) && 形の見本で残す[d.id],
      )
      .map(([, d]) => d.id);
    expect([...残った].sort()).toEqual(Object.keys(形の見本で残す).sort());
  });

  it("まだ動かしていない図の型は 1 件ずつ理由を持つ", () => {
    // 動かせないのか手が回っていないだけなのかを、後から見た人が判断できる形にする。
    // 一覧が実物とずれたら落とす
    const 残った = diagramsOf(Presets)
      .filter(([, d]) => 型の見本で残す[d.id])
      .map(([, d]) => d.id);
    expect([...残った].sort()).toEqual(Object.keys(型の見本で残す).sort());
  });

  it("動かさないと決めた図は 1 件ずつ理由を持つ", () => {
    // **まだ動かしていない図と区別が付く形にする**。 件数だけで分けると、後から見た人が
    // 「これは動かさない図なのか、手が回っていないだけなのか」 を判断できない。
    // 1 件ずつ理由を書き、一覧が実物とずれたら落とす
    const { 動かさない } = カタログの振り分け();
    expect([...動かさない].sort()).toEqual(Object.keys(動かさないと決めた).sort());
  });
});

/**
 * 一覧に載る図が 1 つ残らずどちらかの系統に入っているか (#1407)。
 *
 * 本 file は図を 2 系統に分ける。 動きが意味を持つ分類 (`対象`) と、形を見比べるカタログ
 * (`カタログの振り分け`) の 2 つ。
 *
 * カタログ側は 3 一覧が互いに重ならず全件を覆うことを見ている。 一方 **2 系統を合わせて
 * 一覧の全 module を覆うか** は誰も見ていなかった。
 *
 * 実際 `ethereum` の 4 図がどちらにも現れず、静止の判定を 1 度も通っていなかった。
 *
 * ## 突き合わせは図の id で行う
 *
 * ページ名で比べてはいけない。 `primitives-extra` は一覧では `primitives` に畳まれるため、
 * 名前で比べると実在する module が「一覧に無い」 と誤って落ちる。
 *
 * ## 突き合わせの道具は共有する
 *
 * 一覧を集める形と差分の取り方は `apps/playground-spa/src/lib/catalog-scope.ts` が持つ
 * (#1409)。 4 つの検査が同じ道具を呼び、道具そのものの性質 (重複数を落とさない /
 * `parts` を漏らさない) は catalog-scope 側の検査が固定する。
 *
 * ## 件数を書かない
 *
 * どれだけ漏れているかは下の検査が名指しで並べる。 数を書くと module が増えた時にずれる
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。
 */
describe("一覧に載る図が 1 つ残らずどちらかの系統に入っている (#1407)", () => {
  /** 一覧を読む道具は 4 つの検査で共有する (#1409)。 定義と検査は catalog-scope が持つ */
  const 一覧の図 = async (): Promise<string[]> => (await import("@/lib/catalog-scope")).一覧の図();
  const 差分 = async (l: readonly string[], r: readonly string[]): Promise<string[]> =>
    (await import("@/lib/catalog-scope")).差分(l, r);

  /** 2 系統が覆う図の id */
  function 系統の図(): string[] {
    const { 動かす, 動かさない, まだ } = カタログの振り分け();
    return [
      ...対象.flatMap(([, mod]) => diagramsOf(mod).map(([, d]) => d.id)),
      ...動かす,
      ...動かさない,
      ...まだ,
    ];
  }

  it("一覧の図と系統の図を 1 件以上集められている", async () => {
    // 空振り防止。 どちらかが空だと下の 2 件が両方とも「差が無い」 で通る
    const [一覧, 系統] = [await 一覧の図(), 系統の図()];
    expect(一覧.length, "一覧から図を 1 件も集められていない").toBeGreaterThan(0);
    expect(系統.length, "2 系統から図を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("一覧にあってどちらの系統にも入らない図が無い", async () => {
    const [一覧, 系統] = [await 一覧の図(), 系統の図()];
    const 漏れ = await 差分(一覧, 系統);
    expect(漏れ, "一覧に出るのに動きの分類に入っていない図").toEqual([]);
  });

  it("系統に入るが一覧に無い図が無い", async () => {
    const [一覧, 系統] = [await 一覧の図(), 系統の図()];
    const 余り = await 差分(系統, 一覧);
    expect(余り, "動きの分類に入っているが一覧に出ない図").toEqual([]);
  });
});
