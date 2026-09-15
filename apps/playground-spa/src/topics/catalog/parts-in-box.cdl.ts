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
 * 矢印が間の箱を貫く (絵の検査で実測)。
 *
 * ## 部品を 2 つ置いて矢印を引く (#2010)
 *
 * 1 つの箱から **2 つの部品へ分ける** 形と、**部品から部品へ繋ぐ** 形を見せる。 部品は箱と同じ
 * 繋ぎ方をするので、部品を繋ぎ先にも繋ぎ元にも書ける。 分ける方は種類の違う部品
 * (`state-indicator` と `thermometer`) を並べ、大きさの違う部品にも同じ書き方で繋がることを見せる。
 *
 * 繋ぐ方は同じ種類の部品どうしと、**高さの違う部品どうし** の 2 枚を見せる。 高さが違うと繋ぎ口の
 * 高さが 10 ずれ、矢印は横に走ってから縦に 10 動く形になる。 この 10 は角の丸み (14) の 2 倍より
 * 短く、描画エンジンが丸みを頭打ちにしていなかった頃は角が行き過ぎて線が戻っていた (#2012)。
 * `@cardenelabs/cdl` 0.65.0 で丸みを走りの長さで頭打ちにしたので、同じ書き方で繋がる。
 *
 * ## 矢印を集める (#2011)
 *
 * 2 つの部品から同じ箱へ矢印を集める。 部品は高さ 380-400 で普通の箱 (68) より深い位置に置かれる
 * ため、縦列を 1 本飛ばす矢印が間の部品の中を通っていた (実測 = `edge-node-cross` の指摘 2 件)。
 *
 * 描画エンジンは L 字の折れる位置を左右に退けて箱を避けるが、退いた分だけ横に走る線が伸びる。
 * その線が同じ箱を横切るかを見ていなかったため、避けたはずの部品を貫いていた。
 * `@cardenelabs/cdl` 0.66.0 で退く向きを横に走る線で決めるようにしたので、同じ書き方で集められる。
 *
 * ## 流れの途中に置く (#1987)
 *
 * 静止した `flow` は登場人物を書いた順に矢印で繋ぐが、どの行にも書かれていない部品は繋ぐ並びに入れず、
 * 図の下の格子に置く。 部品を 2 つの箱の間に書いても、前後の箱が矢印で繋がることを見せる。
 *
 * ## 並べる (#1990)
 *
 * 位置を書かない部品は格子に並び、登場人物の名前は部品のすぐ上に 1 つだけ出る。 部品を 5 つ置いて
 * 2 段目に並ぶ部品を作り、2 段目の名前も自分の部品の上に出ることを見せる。
 *
 * 5 つ目には縦列を 2 本持つ `bandwidth-meter` (上り / 下り) を置き、図に置いても部品の中の要素が
 * 部品の頁と同じ間 (横 90) で並ぶことを見せる (#1992)。 直す前は部品が書いた縦列の位置で置いて
 * いたため間が 60 になり、間隔の検査 (70) に掛かっていた。 名前を縦列ごとに繰り返さないことは
 * 組み立て側のテスト (`part-name-label.test.ts`) が見る。
 *
 * 縦列を 3 本持つ `gauge-cluster` は使わない。 格子の列の幅は最も広い部品で決まるため図が横に広がり、
 * 画面の器に収めた時の箱の題が 11.6px から 9.7px に縮む (`responsive-viewport` の実測)。
 */

const 部品の一覧 = 部品の一覧を作る(Object.values(部品));

export const patternBase__partInBox = "書かない";

export const subtitle__partInBox =
  "部品の名前を種類に書いて箱として置き、状態と倍率と色番号を書き換え、縦列に置き、部品の中の要素へ矢印を繋ぎ、2 つの部品へ矢印を分け、部品どうしを繋ぎ、高さの違う部品どうしも繋ぎ、2 つの部品から同じ箱へ集め、流れの途中に置き、名前を添えて並べる";

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

export const sourceYaml__pattern__partInBox__矢印を分ける = `title: "検査の結果を設備の稼働と炉の温度へ分けて送る"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 乾燥炉の温度: { kind: thermometer }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 検査 -> 乾燥炉の温度: "温度を読む"
`;

export const sourceJson__pattern__partInBox__矢印を分ける = `{
  "title": "検査の結果を設備の稼働と炉の温度へ分けて送る",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "乾燥炉の温度", "kind": "thermometer" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "検査", "to": "乾燥炉の温度", "label": "温度を読む" }
  ]
}`;

export const pattern__partInBox__矢印を分ける = textDslToDiagram(
  sourceYaml__pattern__partInBox__矢印を分ける,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__部品どうしを繋ぐ = `title: "成形機の稼働から塗装機の稼働へ、部品どうしを矢印で繋ぐ"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 塗装機: { kind: state-indicator }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 成形機 -> 塗装機: "次の工程へ回す"
`;

export const sourceJson__pattern__partInBox__部品どうしを繋ぐ = `{
  "title": "成形機の稼働から塗装機の稼働へ、部品どうしを矢印で繋ぐ",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "塗装機", "kind": "state-indicator" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "成形機", "to": "塗装機", "label": "次の工程へ回す" }
  ]
}`;

export const pattern__partInBox__部品どうしを繋ぐ = textDslToDiagram(
  sourceYaml__pattern__partInBox__部品どうしを繋ぐ,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__高さの違う部品どうしを繋ぐ = `title: "成形機の稼働から乾燥炉の温度へ、高さの違う部品どうしを矢印で繋ぐ"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 乾燥炉の温度: { kind: thermometer }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 成形機 -> 乾燥炉の温度: "炉の温度を読む"
`;

export const sourceJson__pattern__partInBox__高さの違う部品どうしを繋ぐ = `{
  "title": "成形機の稼働から乾燥炉の温度へ、高さの違う部品どうしを矢印で繋ぐ",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "乾燥炉の温度", "kind": "thermometer" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "成形機", "to": "乾燥炉の温度", "label": "炉の温度を読む" }
  ]
}`;

export const pattern__partInBox__高さの違う部品どうしを繋ぐ = textDslToDiagram(
  sourceYaml__pattern__partInBox__高さの違う部品どうしを繋ぐ,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__矢印を集める = `title: "成形機と塗装機の稼働を、どちらも記録へ集める"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 塗装機: { kind: state-indicator }
  - 記録: { kind: card }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 検査 -> 塗装機: "稼働を確かめる"
  - 成形機 -> 記録: "稼働を残す"
  - 塗装機 -> 記録: "稼働を残す"
`;

export const sourceJson__pattern__partInBox__矢印を集める = `{
  "title": "成形機と塗装機の稼働を、どちらも記録へ集める",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "塗装機", "kind": "state-indicator" },
    { "name": "記録", "kind": "card" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "検査", "to": "塗装機", "label": "稼働を確かめる" },
    { "from": "成形機", "to": "記録", "label": "稼働を残す" },
    { "from": "塗装機", "to": "記録", "label": "稼働を残す" }
  ]
}`;

export const pattern__partInBox__矢印を集める = textDslToDiagram(
  sourceYaml__pattern__partInBox__矢印を集める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__流れの途中に置く = `title: "注文を受けてから出荷するまでの間に設備の稼働を置く"
type: flow

actors:
  - 注文を受ける: { kind: card }
  - 設備の稼働: { kind: state-indicator }
  - 出荷する: { kind: card }

flow:
  - 注文を受ける -> 出荷する: "引き渡す"
`;

export const sourceJson__pattern__partInBox__流れの途中に置く = `{
  "title": "注文を受けてから出荷するまでの間に設備の稼働を置く",
  "type": "flow",
  "actors": [
    { "name": "注文を受ける", "kind": "card" },
    { "name": "設備の稼働", "kind": "state-indicator" },
    { "name": "出荷する", "kind": "card" }
  ],
  "flow": [
    { "from": "注文を受ける", "to": "出荷する", "label": "引き渡す" }
  ]
}`;

export const pattern__partInBox__流れの途中に置く = textDslToDiagram(
  sourceYaml__pattern__partInBox__流れの途中に置く,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partInBox__並べる = `title: "製造ラインの設備 3 台と乾燥炉の温度、工場の回線を並べる"
type: flow

actors:
  - 成形機: { kind: state-indicator }
  - 塗装機: { kind: state-indicator }
  - 乾燥炉: { kind: state-indicator, color: "#d9534f" }
  - 乾燥炉の温度: { kind: thermometer }
  - 工場の回線: { kind: bandwidth-meter }
`;

export const sourceJson__pattern__partInBox__並べる = `{
  "title": "製造ラインの設備 3 台と乾燥炉の温度、工場の回線を並べる",
  "type": "flow",
  "actors": [
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "塗装機", "kind": "state-indicator" },
    { "name": "乾燥炉", "kind": "state-indicator", "color": "#d9534f" },
    { "name": "乾燥炉の温度", "kind": "thermometer" },
    { "name": "工場の回線", "kind": "bandwidth-meter" }
  ],
  "flow": []
}`;

export const pattern__partInBox__並べる = textDslToDiagram(sourceYaml__pattern__partInBox__並べる, {
  partsCatalog: 部品の一覧,
});
