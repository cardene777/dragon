/**
 * チップのブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。最初の `step` より前の `item <名札>, <名札> [color: <色>, label: <字>]` の行で、列に並べるチップを宣言する。
 * 並べた名札ごとに同じ色と字のチップを宣言する。色を付けたチップは色で塗り、`label` の字は 4 字まで載る。
 * `item` の行の `note` の鍵は凡例のブロックの語で、同じ行に書くのでこのブロックが一緒に読み書きする (#3351)。
 * 列の図にチップが 1 つも無い誤りは、全ての行を読んだ後に、このブロックの読み方 (`read.ts`) の `finish` が確かめる。
 * 試す図の `item` の行は入力の帯の欄の値を持つチップなので、入力の帯のブロックが読む (#3337)。列の図でも試す図でもない図に書いた `item` と `line` の行の誤りの文 (`lineupOrTryOnly`) はこのブロックが持つ。
 */
import type { Block } from "../block";
import type { Color } from "../color/block";

export const LABEL_MOST = 4;

/**
 * 列の図の `box` の行に書ける属性。`limit` は箱に並べられる札の数の上限 (#3624)、`time` は階段の見た目 (`[shape: stairs]`) の層の時間 (#3640)。
 * 箱のブロックの読み方が列の図の箱を読む時に使い、層の見た目の読み方 (`layers.ts`) が層に書けない `order` と `limit` を見分ける時にも使う。
 * 箱のブロックの読み方は最初に読む塊に在り、層の見た目の読み方は後から読む塊に在るので、両方が既に読むこの定義に置き、後から読む塊が箱の読み方を引いて最初に読む塊を割らないようにする (#3625)
 */
export const LANE_ATTRS = ["note", "color", "order", "limit", "time"] as const;

/** 列の図のチップ。`color` を書かないチップは薄い色で、`label` を書かないチップは名前を出す。`note` は凡例に出す説明 (#3351) */
export interface LineupItem {
  id: string;
  color?: Color;
  label?: string;
  note?: string;
}

export const block: Block = {
  name: "item",
  rank: 99,
  attach: { how: "place", only: "lineup" },
  words: { heads: ["item"], attrs: { item: ["color", "label"] } },
  // 列の図にチップが要る決まりを持つ
  always: true,
};
