import { textDslToDiagram } from "@cardenelabs/dragon";

import { 部品の一覧を作る } from "../../lib/parts-catalog";
import * as 部品 from "./parts.cdl";

/**
 * Catalog - 部品を箱に使う見本 (#1973)。
 *
 * 部品 (`parts.cdl.ts`) を別の図の箱として置き、状態の上書き・描画倍率・色番号を書き換える。
 *
 * ## 部品の頁と一緒に後から読む
 *
 * 組み立てに部品の一覧を渡さないと、部品の箱は中身の無い既定の箱になる。 一覧は部品の図から
 * 作るため、この file は `parts.cdl.ts` を読み込む。 基本パーツの頁 (`primitives.cdl.ts`) に置くと
 * 最初に読む束へ部品の図 80 枚が入り、部品の頁を後から読む設計 (CAR-1613) が崩れる。
 * そこで部品の頁と同じく `loadPartsItems` が後から読む。
 *
 * ## 使う部品
 *
 * `state-indicator` を使う。 塗りの色 (`stFill`) を状態に持つので色番号が効き、塗りの割合 (`lvl`) を
 * 状態の上書きで変えられる。 塗りを図形に直接書いた部品 (`arc-gauge` 等) は色番号が効かない。
 *
 * **状態の上書きは `phase: false` と組にする**。 部品は自分の段で状態を動かす (`lvl` を 0 から 1 へ)
 * ため、初期値だけを上書きしても段が終わると 1 に戻る。 部品の段を外すと上書きした値のまま止まる。
 *
 * ## 縦列に置く (#1980)
 *
 * 位置を書かない部品に `lane:` を書くと、その縦列の中心に置き、縦列の他の箱の下に並べる。
 * 同じ縦列に普通の箱 (`梱包する`) を置き、部品が縦列の中に収まって普通の箱と縦にそろうことを見せる。
 *
 * ## 部品へ矢印を引く (#1979)
 *
 * 矢印は部品の中の要素に繋がる。 `state-indicator` は要素を 1 つだけ持つので何も足さずに繋がる。
 * 要素を 2 つ以上持つ部品 (`stacked-layer` の上層 / 中層 / 底層) は、矢印に `toPartNode` /
 * `fromPartNode` で要素の id を書いて繋ぐ層を選ぶ。
 *
 * 矢印を引く 2 つの切替は `swimlane` で書く。 `flow` と `topology` は部品を他の箱の下の格子に置くため、
 * 矢印が間の箱を貫く (絵の検査で実測)。 `traffic-light-stack` のように要素を縦に詰めた部品は、図に
 * 取り込むと要素の間が 60px になり間隔の検査 (70px) に掛かるので、層の間が広い `stacked-layer` を使う。
 */

const 部品の一覧 = 部品の一覧を作る(Object.values(部品));

export const patternBase__partInBox = "書かない";

export const subtitle__partInBox =
  "部品の名前を種類に書いて箱として置き、状態と倍率と色番号を書き換え、縦列に置き、部品の中の要素へ矢印を繋ぐ";

export const sourceYaml__partInBox = `title: "部品を箱に置き何も書き換えない"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator }
`;

export const sourceJson__partInBox = `{
  "title": "部品を箱に置き何も書き換えない",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator" }
  ],
  "flow": []
}`;

export const partInBox = textDslToDiagram(sourceYaml__partInBox, { partsCatalog: 部品の一覧 });

export const sourceYaml__pattern__partInBox__状態を上書き = `title: "部品の塗りの割合を 4 割で止める"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator, state: { lvl: 0.4, phase: false } }
`;

export const sourceJson__pattern__partInBox__状態を上書き = `{
  "title": "部品の塗りの割合を 4 割で止める",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator", "state": { "lvl": 0.4, "phase": false } }
  ],
  "flow": []
}`;

export const pattern__partInBox__状態を上書き = textDslToDiagram(
  sourceYaml__pattern__partInBox__状態を上書き,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__倍率を変える = `title: "部品を 0.6 倍に縮めて置く"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator, scale: 0.6 }
`;

export const sourceJson__pattern__partInBox__倍率を変える = `{
  "title": "部品を 0.6 倍に縮めて置く",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator", "scale": 0.6 }
  ],
  "flow": []
}`;

export const pattern__partInBox__倍率を変える = textDslToDiagram(
  sourceYaml__pattern__partInBox__倍率を変える,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__色番号を変える = `title: "部品の塗りを赤の色番号にする"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator, color: "#d9534f" }
`;

export const sourceJson__pattern__partInBox__色番号を変える = `{
  "title": "部品の塗りを赤の色番号にする",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator", "color": "#d9534f" }
  ],
  "flow": []
}`;

export const pattern__partInBox__色番号を変える = textDslToDiagram(
  sourceYaml__pattern__partInBox__色番号を変える,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__縦列に置く = `title: "設備の稼働を出荷の縦列に置く"
type: swimlane

lanes:
  受付: { label: "受付" }
  出荷: { label: "出荷" }

actors:
  - 注文を受ける: { kind: card, lane: 受付 }
  - 梱包する: { kind: card, lane: 出荷 }
  - 設備の稼働: { kind: state-indicator, lane: 出荷 }
`;

export const sourceJson__pattern__partInBox__縦列に置く = `{
  "title": "設備の稼働を出荷の縦列に置く",
  "type": "swimlane",
  "lanes": {
    "受付": { "label": "受付" },
    "出荷": { "label": "出荷" }
  },
  "actors": [
    { "name": "注文を受ける", "kind": "card", "lane": "受付" },
    { "name": "梱包する", "kind": "card", "lane": "出荷" },
    { "name": "設備の稼働", "kind": "state-indicator", "lane": "出荷" }
  ],
  "flow": []
}`;

export const pattern__partInBox__縦列に置く = textDslToDiagram(
  sourceYaml__pattern__partInBox__縦列に置く,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__矢印を繋ぐ = `title: "点検の結果を部品に送り、部品から保全へ知らせる"
type: swimlane

actors:
  - 点検: { kind: card }
  - 設備の稼働: { kind: state-indicator }
  - 保全: { kind: card }

flow:
  - 点検 -> 設備の稼働: "結果を送る"
  - 設備の稼働 -> 保全: "異常を知らせる"
`;

export const sourceJson__pattern__partInBox__矢印を繋ぐ = `{
  "title": "点検の結果を部品に送り、部品から保全へ知らせる",
  "type": "swimlane",
  "actors": [
    { "name": "点検", "kind": "card" },
    { "name": "設備の稼働", "kind": "state-indicator" },
    { "name": "保全", "kind": "card" }
  ],
  "flow": [
    { "from": "点検", "to": "設備の稼働", "label": "結果を送る" },
    { "from": "設備の稼働", "to": "保全", "label": "異常を知らせる" }
  ]
}`;

export const pattern__partInBox__矢印を繋ぐ = textDslToDiagram(
  sourceYaml__pattern__partInBox__矢印を繋ぐ,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__繋ぐ要素を名指しする = `title: "受注から在庫の上層へ、在庫の底層から出荷へ矢印を繋ぐ"
type: swimlane

actors:
  - 受注: { kind: card }
  - 在庫の内訳: { kind: stacked-layer }
  - 出荷: { kind: card }

flow:
  - 受注 -> 在庫の内訳: "上層から引き当てる" { toPartNode: topL }
  - 在庫の内訳 -> 出荷: "底層を出す" { fromPartNode: botL }
`;

export const sourceJson__pattern__partInBox__繋ぐ要素を名指しする = `{
  "title": "受注から在庫の上層へ、在庫の底層から出荷へ矢印を繋ぐ",
  "type": "swimlane",
  "actors": [
    { "name": "受注", "kind": "card" },
    { "name": "在庫の内訳", "kind": "stacked-layer" },
    { "name": "出荷", "kind": "card" }
  ],
  "flow": [
    { "from": "受注", "to": "在庫の内訳", "label": "上層から引き当てる", "toPartNode": "topL" },
    { "from": "在庫の内訳", "to": "出荷", "label": "底層を出す", "fromPartNode": "botL" }
  ]
}`;

export const pattern__partInBox__繋ぐ要素を名指しする = textDslToDiagram(
  sourceYaml__pattern__partInBox__繋ぐ要素を名指しする,
  { partsCatalog: 部品の一覧 },
);
