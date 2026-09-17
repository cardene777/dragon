import { textDslToDiagram } from "@cardenelabs/dragon";

import { 部品の一覧を作る } from "../../lib/parts-catalog";
import * as 部品 from "./parts.cdl";

/**
 * Catalog - 部品を繋いで動かす見本 (#2125)。
 *
 * 部品を矢印で繋ぎ、**繋いだまま段で動かす**。 繋ぎ方だけを見せる頁 (`parts-in-box.cdl.ts`) は
 * 段を 1 つも持たず、動く部品の頁 (`parts.cdl.ts`) は矢印を 1 本も持たない。 どちらの頁でも
 * 「繋いだ先へ値が渡っていく」 絵は出ないため、その 1 点だけを見せる頁として分ける。
 *
 * ## 宿主の段が部品の中の値を動かす
 *
 * 部品を箱として置くと、部品の中の値は `{部品の名前}__{値の名前}` という名前で図に入る
 * (spec の § 2.5)。 宿主の段の `tween` にその名前を書くと、部品の中の値が宿主の段で動く。
 *
 * **部品の名前は英字で書く**。 値の名前は英字と `_` しか受け付けない
 * (`packages/dragon/src/value-syntax.ts` の `VALUE_NAME_RE`)。 日本語の名前を付けた部品は
 * 矢印で繋ぐことはできるが、`在庫__lv` は値の名前として読めないので宿主の段から動かせない。
 * 繋ぐだけの箱 (`受注` / `記録`) は日本語のままでよい。
 *
 * ## `phase: false` と組にする
 *
 * 部品は自分の段を持ち、既定では宿主の段と番号ごとに並行合成される。 宿主が同じ値を動かすと
 * 部品の段と宿主の段が同じ値を取り合うため、動かす部品には `phase: false` を書いて部品の段を
 * 空にする。 最後の切替だけは、この 2 つの形を並べて違いそのものを見せるので書かない。
 *
 * ## 図の種類は `swimlane`
 *
 * `flow` と `topology` は部品を他の箱の下の格子に置くため、矢印が間の箱を貫く (#1979 の実測)。
 * 繋ぎ方の頁と同じ理由で `swimlane` を使う。
 *
 * ## 5 つの切替
 *
 * | 切替 | 見せること |
 * |---|---|
 * | 流れに沿って動かす | 繋いだ順に値が渡る。 段ごとに矢印を光らせ、受け手の値を同じ段で動かす |
 * | 要素ごとに繋ぐ | 要素を 3 つ持つ部品で、上層と底層を名指しして繋ぎ、その層の値だけを動かす |
 * | 分ける | 1 つの箱から 2 つの部品へ分け、同じ段で 2 つの値を別々に動かす |
 * | 集める | 2 つの部品から 1 つの箱へ集め、集める段で 2 本の矢印を同時に光らせる |
 * | 部品の段を残す | 部品の段のままの部品と、宿主が動かす部品を並べる |
 *
 * ## 分けると集めるを 1 枚にまとめない
 *
 * 4 つの箱で「1 → 2 → 1」 を 1 枚に書くと、縦列が 4 本になって図が 2634 × 780 になり、
 * 一覧の器 (1150 × 630) に収めた時に箱の題が 9.6px まで縮む (下限 12px、実測)。
 * 3 本ずつの 2 枚に割ると 1 枚あたりの縦列が 3 本になり、どちらも指摘 0 件で収まる。
 *
 * 右側の計器に温度計 (`thermometer`) を使うと図の高さが 780 から 2279 に跳ね、
 * 矢印の札が隣の縦列の境を貫く (実測)。 幅 220 の部品と幅 360 の部品が横に並ぶ形を避け、
 * 同じ幅 (360) の `state-indicator` と `arc-gauge` を組にする。
 */

const 部品の一覧 = 部品の一覧を作る(Object.values(部品));

export const patternBase__partsMotion = "流れに沿って動かす";

export const subtitle__partsMotion =
  "部品を矢印で繋いだまま段で動かし、繋いだ先へ値を渡し、要素を名指しして層ごとに動かし、2 つの部品へ分け、2 つの部品から 1 つの箱へ集め、部品の段のままの部品と宿主が動かす部品を並べる";

export const sourceYaml__partsMotion = `title: "入ってくる量を溜めて送り出す"
type: swimlane

# 部品の名前は英字。 宿主の段が動かす値の名前 (inflow__pv) が英字しか受け付けないため
actors:
  - inflow: { kind: horizontal-bar, phase: false }
  - tank: { kind: wave-gauge, phase: false }
  - outflow: { kind: arc-gauge, phase: false }

flow:
  - inflow -> tank: "溜める"
  - tank -> outflow: "送り出す"

animation:
  - step: "1. 入ってくる" 1.2s
    focus: [inflow]
    badge: "流量"
    tween:
      inflow__pv: 0 -> 85
    body: "受け入れの棒が 85% まで伸びる。 まだ溜めていない。"
  - step: "2. 溜まる" 1.2s
    focus: [inflow, tank, "inflow -> tank"]
    badge: "水位"
    tween:
      tank__lv: 0 -> 72
    body: "入ってきた分が槽に移る。 水位が 72% まで上がる。"
  - step: "3. 送り出す" 1.2s
    focus: [tank, outflow, "tank -> outflow"]
    badge: "放出"
    tween:
      tank__lv: 72 -> 28
      outflow__v: 0 -> 95
    body: "槽が 28% まで減り、送り出しの弧が 95% まで回る。"
  - step: "4. 落ち着く" 1.2s
    focus: [inflow, tank, outflow]
    badge: "定常"
    tween:
      inflow__pv: 85 -> 35
      outflow__v: 95 -> 35
    body: "入る量と出る量が 35% で釣り合い、水位が動かなくなる。"
`;

export const sourceJson__partsMotion = `{
  "title": "入ってくる量を溜めて送り出す",
  "type": "swimlane",
  "actors": [
    { "name": "inflow", "kind": "horizontal-bar", "phase": false },
    { "name": "tank", "kind": "wave-gauge", "phase": false },
    { "name": "outflow", "kind": "arc-gauge", "phase": false }
  ],
  "flow": [
    { "from": "inflow", "to": "tank", "label": "溜める" },
    { "from": "tank", "to": "outflow", "label": "送り出す" }
  ],
  "animation": [
    {
      "step": "1. 入ってくる",
      "duration": 1.2,
      "focus": ["inflow"],
      "badge": "流量",
      "tween": { "inflow__pv": [0, 85] },
      "body": "受け入れの棒が 85% まで伸びる。 まだ溜めていない。"
    },
    {
      "step": "2. 溜まる",
      "duration": 1.2,
      "focus": ["inflow", "tank", "inflow -> tank"],
      "badge": "水位",
      "tween": { "tank__lv": [0, 72] },
      "body": "入ってきた分が槽に移る。 水位が 72% まで上がる。"
    },
    {
      "step": "3. 送り出す",
      "duration": 1.2,
      "focus": ["tank", "outflow", "tank -> outflow"],
      "badge": "放出",
      "tween": { "tank__lv": [72, 28], "outflow__v": [0, 95] },
      "body": "槽が 28% まで減り、送り出しの弧が 95% まで回る。"
    },
    {
      "step": "4. 落ち着く",
      "duration": 1.2,
      "focus": ["inflow", "tank", "outflow"],
      "badge": "定常",
      "tween": { "inflow__pv": [85, 35], "outflow__v": [95, 35] },
      "body": "入る量と出る量が 35% で釣り合い、水位が動かなくなる。"
    }
  ]
}`;

export const partsMotion = textDslToDiagram(sourceYaml__partsMotion, {
  partsCatalog: 部品の一覧,
});

export const sourceYaml__pattern__partsMotion__要素ごとに繋ぐ = `title: "在庫の上層へ積み、底層から出荷する"
type: swimlane

actors:
  - 受注: { kind: card }
  - stock: { kind: stacked-layer, phase: false }
  - 出荷: { kind: card }

flow:
  - 受注 -> stock: "上層へ積む" { toPartNode: topL }
  - stock -> 出荷: "底層から出す" { fromPartNode: botL }

animation:
  - step: "1. 受ける" 1.0s
    focus: [受注]
    badge: "受注"
    body: "注文が届く。 在庫はまだ動かない。"
  - step: "2. 上層へ積む" 1.2s
    focus: [受注, stock, "受注 -> stock"]
    badge: "入庫"
    tween:
      stock__top: 20 -> 55
    body: "矢印が上層に刺さり、上層だけが 20 から 55 へ増える。"
  - step: "3. 中層へ回す" 1.2s
    focus: [stock]
    badge: "移動"
    tween:
      stock__top: 55 -> 30
      stock__mid: 15 -> 40
    body: "上層から中層へ 25 だけ移る。 合計は変わらない。"
  - step: "4. 底層から出す" 1.2s
    focus: [stock, 出荷, "stock -> 出荷"]
    badge: "出庫"
    tween:
      stock__bot: 40 -> 12
    body: "矢印が底層から出る。 底層だけが 40 から 12 へ減る。"
`;

export const sourceJson__pattern__partsMotion__要素ごとに繋ぐ = `{
  "title": "在庫の上層へ積み、底層から出荷する",
  "type": "swimlane",
  "actors": [
    { "name": "受注", "kind": "card" },
    { "name": "stock", "kind": "stacked-layer", "phase": false },
    { "name": "出荷", "kind": "card" }
  ],
  "flow": [
    { "from": "受注", "to": "stock", "label": "上層へ積む", "toPartNode": "topL" },
    { "from": "stock", "to": "出荷", "label": "底層から出す", "fromPartNode": "botL" }
  ],
  "animation": [
    {
      "step": "1. 受ける",
      "duration": 1.0,
      "focus": ["受注"],
      "badge": "受注",
      "body": "注文が届く。 在庫はまだ動かない。"
    },
    {
      "step": "2. 上層へ積む",
      "duration": 1.2,
      "focus": ["受注", "stock", "受注 -> stock"],
      "badge": "入庫",
      "tween": { "stock__top": [20, 55] },
      "body": "矢印が上層に刺さり、上層だけが 20 から 55 へ増える。"
    },
    {
      "step": "3. 中層へ回す",
      "duration": 1.2,
      "focus": ["stock"],
      "badge": "移動",
      "tween": { "stock__top": [55, 30], "stock__mid": [15, 40] },
      "body": "上層から中層へ 25 だけ移る。 合計は変わらない。"
    },
    {
      "step": "4. 底層から出す",
      "duration": 1.2,
      "focus": ["stock", "出荷", "stock -> 出荷"],
      "badge": "出庫",
      "tween": { "stock__bot": [40, 12] },
      "body": "矢印が底層から出る。 底層だけが 40 から 12 へ減る。"
    }
  ]
}`;

export const pattern__partsMotion__要素ごとに繋ぐ = textDslToDiagram(
  sourceYaml__pattern__partsMotion__要素ごとに繋ぐ,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__分ける = `title: "検査の結果を 2 つの計器へ分けて送る"
type: swimlane

actors:
  - 検査: { kind: card }
  - press: { kind: state-indicator, phase: false }
  - oven: { kind: arc-gauge, phase: false }

flow:
  - 検査 -> press: "稼働を確かめる"
  - 検査 -> oven: "温度を読む"

animation:
  - step: "1. 検査する" 1.0s
    focus: [検査]
    badge: "検査"
    body: "検査が始まる。 2 つの計器はまだ動かない。"
  - step: "2. 2 つへ分かれる" 1.3s
    focus: [検査, press, oven, "検査 -> press", "検査 -> oven"]
    badge: "測定"
    tween:
      press__lvl: 0 -> 0.9
      oven__v: 0 -> 62
    body: "1 つの段で 2 つの計器が別々に動く。 稼働は 90%、炉は 62%。"
`;

export const sourceJson__pattern__partsMotion__分ける = `{
  "title": "検査の結果を 2 つの計器へ分けて送る",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "press", "kind": "state-indicator", "phase": false },
    { "name": "oven", "kind": "arc-gauge", "phase": false }
  ],
  "flow": [
    { "from": "検査", "to": "press", "label": "稼働を確かめる" },
    { "from": "検査", "to": "oven", "label": "温度を読む" }
  ],
  "animation": [
    {
      "step": "1. 検査する",
      "duration": 1.0,
      "focus": ["検査"],
      "badge": "検査",
      "body": "検査が始まる。 2 つの計器はまだ動かない。"
    },
    {
      "step": "2. 2 つへ分かれる",
      "duration": 1.3,
      "focus": ["検査", "press", "oven", "検査 -> press", "検査 -> oven"],
      "badge": "測定",
      "tween": { "press__lvl": [0, 0.9], "oven__v": [0, 62] },
      "body": "1 つの段で 2 つの計器が別々に動く。 稼働は 90%、炉は 62%。"
    }
  ]
}`;

export const pattern__partsMotion__分ける = textDslToDiagram(
  sourceYaml__pattern__partsMotion__分ける,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__集める = `title: "2 つの計器の値をどちらも記録へ集める"
type: swimlane

actors:
  - press: { kind: state-indicator, phase: false }
  - oven: { kind: arc-gauge, phase: false }
  - 記録: { kind: card }

flow:
  - press -> 記録: "稼働を残す"
  - oven -> 記録: "温度を残す"

animation:
  - step: "1. 測る" 1.3s
    focus: [press, oven]
    badge: "測定"
    tween:
      press__lvl: 0 -> 0.9
      oven__v: 0 -> 62
    body: "2 つの計器が別々に動く。 まだどちらも記録していない。"
  - step: "2. 記録へ集める" 1.3s
    focus: [press, oven, 記録, "press -> 記録", "oven -> 記録"]
    badge: "記録"
    tween:
      oven__v: 62 -> 48
    body: "2 本の矢印が同じ箱へ入る。 炉は記録の間に 48% まで下がる。"
`;

export const sourceJson__pattern__partsMotion__集める = `{
  "title": "2 つの計器の値をどちらも記録へ集める",
  "type": "swimlane",
  "actors": [
    { "name": "press", "kind": "state-indicator", "phase": false },
    { "name": "oven", "kind": "arc-gauge", "phase": false },
    { "name": "記録", "kind": "card" }
  ],
  "flow": [
    { "from": "press", "to": "記録", "label": "稼働を残す" },
    { "from": "oven", "to": "記録", "label": "温度を残す" }
  ],
  "animation": [
    {
      "step": "1. 測る",
      "duration": 1.3,
      "focus": ["press", "oven"],
      "badge": "測定",
      "tween": { "press__lvl": [0, 0.9], "oven__v": [0, 62] },
      "body": "2 つの計器が別々に動く。 まだどちらも記録していない。"
    },
    {
      "step": "2. 記録へ集める",
      "duration": 1.3,
      "focus": ["press", "oven", "記録", "press -> 記録", "oven -> 記録"],
      "badge": "記録",
      "tween": { "oven__v": [62, 48] },
      "body": "2 本の矢印が同じ箱へ入る。 炉は記録の間に 48% まで下がる。"
    }
  ]
}`;

export const pattern__partsMotion__集める = textDslToDiagram(
  sourceYaml__pattern__partsMotion__集める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__部品の段を残す = `title: "部品の段のまま置く形と、宿主の段で動かす形を並べる"
type: swimlane

actors:
  - own: { kind: horizontal-bar }
  - host: { kind: horizontal-bar, phase: false }

flow:
  - own -> host: "同じ部品"

animation:
  - step: "1. 部品の段で満ちる" 1.2s
    focus: [own]
    badge: "部品の段"
    body: "左は部品が持つ段で 0% から 100% まで満ちる。 右はまだ 0%。"
  - step: "2. 宿主の段で満ちる" 1.2s
    focus: [own, host, "own -> host"]
    badge: "宿主の段"
    tween:
      host__pv: 0 -> 85
    body: "右は部品の段を外したので、この段に書いた 85% まで満ちる。"
  - step: "3. 右だけ戻す" 1.2s
    focus: [host]
    badge: "宿主の段"
    tween:
      host__pv: 85 -> 20
    body: "宿主が動かす側は 20% まで戻せる。 左は部品の段が終わった 100% で止まる。"
`;

export const sourceJson__pattern__partsMotion__部品の段を残す = `{
  "title": "部品の段のまま置く形と、宿主の段で動かす形を並べる",
  "type": "swimlane",
  "actors": [
    { "name": "own", "kind": "horizontal-bar" },
    { "name": "host", "kind": "horizontal-bar", "phase": false }
  ],
  "flow": [{ "from": "own", "to": "host", "label": "同じ部品" }],
  "animation": [
    {
      "step": "1. 部品の段で満ちる",
      "duration": 1.2,
      "focus": ["own"],
      "badge": "部品の段",
      "body": "左は部品が持つ段で 0% から 100% まで満ちる。 右はまだ 0%。"
    },
    {
      "step": "2. 宿主の段で満ちる",
      "duration": 1.2,
      "focus": ["own", "host", "own -> host"],
      "badge": "宿主の段",
      "tween": { "host__pv": [0, 85] },
      "body": "右は部品の段を外したので、この段に書いた 85% まで満ちる。"
    },
    {
      "step": "3. 右だけ戻す",
      "duration": 1.2,
      "focus": ["host"],
      "badge": "宿主の段",
      "tween": { "host__pv": [85, 20] },
      "body": "宿主が動かす側は 20% まで戻せる。 左は部品の段が終わった 100% で止まる。"
    }
  ]
}`;

export const pattern__partsMotion__部品の段を残す = textDslToDiagram(
  sourceYaml__pattern__partsMotion__部品の段を残す,
  { partsCatalog: 部品の一覧 },
);
