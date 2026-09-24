import type { NodeKind } from "@cardenelabs/cdl";

import { DSL_ONLY_KINDS } from "../v05/parser";
import type { PresetType } from "../types";
/**
 * 記法に書く種類を描画側の種類へ読み替える (#2030 で `compile.ts` から移した)。
 *
 * 記法は描画側に無い種類 (`contract` / `eoa` 等) を受け付けるため、渡す前に読み替える。
 * 読み替えずに渡すと描画側が大きさを引けず、図の組み立てが落ちる。
 */

/**
 * 記法だけが持つ種類を、描画できる種類へ読み替える (#1420)。
 *
 * 記法は `contract` / `eoa` のような **描画側に無い種類** を受け付ける
 * (`v05/parser.ts` の `DSL_ONLY_KINDS`)。 図種ごとの役割分け (`solidity` の縦列の並べ替え
 * など) に使うためで、記法としては正しい。
 *
 * **そのまま描画側へ渡すと図の組み立てが落ちる**。 描画側は知らない種類の大きさを引けず、
 * `Cannot read properties of undefined (reading 'h')` で止まる (実測)。
 *
 * `solidity` と `er` は組み立ての中で別の種類に置き換えていたが、`flow` / `swimlane` /
 * `state` / `topology` は `a.kind` をそのまま渡していた。 記法が受ける値で図が出ない状態
 * だったので、渡す手前で必ず通す。
 *
 * ## 読み替え先
 *
 * | 種類 | 読み替え先 | なぜ |
 * |---|---|---|
 * | `entity` | `storage` | 表を持つ = ER 図の実体 |
 * | `state` | `card` | 状態は札で表す |
 * | `contract` / `proxy` / `library` / `interface` | `card` | 契約は札で表す (`solidity` の置き換え先に合わせた) |
 * | `eoa` | `person` | 人が持つ財布 |
 * | `multisig` | `signer` | 複数人で署名する (`solidity` の置き換え先に合わせた) |
 *
 * **表は `DSL_ONLY_KINDS` を鍵にして書く**。 種類を足した時に読み替え先が無いと
 * 型検査が落ちるので、足し忘れが残らない。
 */
export const 記法だけの種類の読み替え: Readonly<Record<(typeof DSL_ONLY_KINDS)[number], NodeKind>> =
  {
    entity: "storage",
    state: "card",
    contract: "card",
    proxy: "card",
    library: "card",
    interface: "card",
    eoa: "person",
    multisig: "signer",
  };

/** 描画側へ渡せる種類にする。 記法だけの種類はここで読み替わる (#1420) */
export function 描ける種別(kind: string | undefined): NodeKind {
  if (kind === undefined) return "actor";
  const 読み替え先 = (記法だけの種類の読み替え as Record<string, NodeKind | undefined>)[kind];
  return 読み替え先 ?? (kind as NodeKind);
}

/**
 * 図種ごとの図の作り (#1219 / #1220)。
 *
 * 2 つの判断がここから決まる。 解決できない矢印を中央で落とすか (#1219) と、 名前が同じ id に
 * 潰れる登場人物を作り替えるか (#1220)。 どちらも **登場人物の名前が箱や枠の id になる図種**
 * でだけ要る。
 *
 * `#1209` は動きを書いた 2 経路だけを塞いだ。 残る経路では **知らせは出るのに図まで壊れる**
 * 状態だった (実測 = 8 図種が `compile` の `unknown-ref` で落ちる)。
 *
 * | 作り | 解決できない矢印 | 同じ id に潰れる名前 |
 * |---|---|---|
 * | 登場人物ごとに箱 | 中央で落とす | 名前を作り替えて id を分ける |
 * | 図全体を 1 箱 | 図種に任せる | 触らない |
 *
 * **1 箱で描く図種を中央で落とさない**。 これらは矢印そのものを描かず、 書かれた本数を数えて
 * 独自の知らせを出す (`chart-edge-dropped` / 木の親子の知らせ)。 中央で外すと本数が変わり、
 * 全部が解決できない図では知らせごと消える。 同じ id に潰れる名前も、 中身を payload が
 * 持つため箱の id にならず、 木と放射は独自の知らせを出す。
 *
 * `Record<PresetType, ...>` にしてあるので、 図種を足した時にどちらかを決めないと型検査が
 * 落ちる (`rules/quality.md § 多層 SSOT 経路の全 registration 保証` と同じ形)。
 */
export const 図種の作り: Record<PresetType, "登場人物ごとに箱" | "図全体を 1 箱"> = {
  // 矢印の端と登場人物の名前が、 そのまま箱や枠の id になる
  sequence: "登場人物ごとに箱",
  flow: "登場人物ごとに箱",
  flowchart: "登場人物ごとに箱",
  swimlane: "登場人物ごとに箱",
  er: "登場人物ごとに箱",
  state: "登場人物ごとに箱",
  topology: "登場人物ごとに箱",
  solidity: "登場人物ごとに箱",
  class: "登場人物ごとに箱",
  c4: "登場人物ごとに箱",
  // 中身は payload が持ち、 図そのものは 1 箱。 矢印は描かず本数を数えて知らせる
  gantt: "図全体を 1 箱",
  pie: "図全体を 1 箱",
  bar: "図全体を 1 箱",
  line: "図全体を 1 箱",
  gauge: "図全体を 1 箱",
  radial: "図全体を 1 箱",
  stat: "図全体を 1 箱",
  waffle: "図全体を 1 箱",
  stacked: "図全体を 1 箱",
  slope: "図全体を 1 箱",
  funnel: "図全体を 1 箱",
  tree: "図全体を 1 箱",
  journey: "図全体を 1 箱",
  quadrant: "図全体を 1 箱",
  mind: "図全体を 1 箱",
};

/**
 * 図全体を 1 つの箱で描く種別。
 *
 * これらは中身 (扇 / 帯 / 枝) を payload で受け取り、 1 node で図全体を描く。 登場人物ごとの箱を
 * 持たないので、 段の `focus:` で名前を指しても引く先が無い。 `injectPhasesFallback` が
 * この一覧を使って「実在する名前ならその箱を光らせる」 に読み替える (#1076 / #1077)。
 *
 * `mind-map` は一時期 **記法から到達しなかった** (`#1174`)。 この種別を作っていたのは
 * `compileRadial` だけで `#1170` で消え、 記法の `type: mind` は `card` を 3 列に並べる
 * 別実装だった。
 *
 * それでも一覧に残すのは、 ここが「1 箱で図全体を描く種別」 という **性質の一覧** だから。
 * `mind-map` は engine 側でその性質を持ち続けており、 記法が到達しないのは当時の
 * `compileMind` の実装によるものだった。 `#1177` で `compileMind` を `mind-map` に寄せたため、
 * **今は記法からも到達する** (一覧へ戻す作業が要らなかったのはこのため)。
 *
 * ## 図表の種別は 1 つ残らず載せる (#1668)
 *
 * 弧と帯で量を表す 3 種 (`chart-gauge` / `chart-radial` / `chart-stacked-bar`) と、
 * 値 1 つを大きく示す 2 種 (`chart-stat` / `chart-waffle`) が抜けていた。 5 種とも中身を
 * payload で受け取って 1 箱で描く = この一覧が言う性質をそのまま持つ。
 *
 * 抜けている間、段の `draw:` を書いても指す先が引けず **書けるのに動かない** 状態になる
 * (`draw` の解決は「1 箱で描く箱がちょうど 1 つ」 を条件にしている)。 `focus:` で登場人物の
 * 名前を書いた時に何も光らないのも同じ穴で、載せると図の箱が光るようになる。
 */
export const SINGLE_BOX_KINDS: ReadonlySet<string> = new Set([
  "chart-pie",
  "chart-line",
  "chart-bar",
  "gantt-timeline",
  "mind-map",
  "funnel-stages",
  "quadrant-matrix",
  "tree-hierarchy",
  "journey-map",
  // 2 時点を直線でつなぐ図も 1 箱で全体を描く (#1647)
  "chart-slope",
  // 弧と帯で量を表す 3 種も 1 箱で全体を描く (#1668)
  "chart-gauge",
  "chart-radial",
  "chart-stacked-bar",
  // 値 1 つを大きく示す図と、1 個 = 1% の印を埋める図も同じ (#1668)。
  // 段の `draw:` は受けない (描画側が起点から描く動きを持たない) が、性質は同じなので載せる
  "chart-stat",
  "chart-waffle",
]);
