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
 */

const 部品の一覧 = 部品の一覧を作る(Object.values(部品));

export const patternBase__partInBox = "書かない";

export const subtitle__partInBox =
  "部品の名前を種類に書いて箱として置き、状態と倍率と色番号を書き換え、縦列に置く";

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
