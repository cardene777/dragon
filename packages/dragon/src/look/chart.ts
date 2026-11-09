/**
 * 量の図 (`chart`、#3560) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと色をここと `values.ts` から読む。
 * 量の図の配置と描画 (`kinds/chart/layout.ts` と `render/chart.ts` と量の図のブロックの描き方) は後から読む塊にあるので、
 * 列の図と配管の図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、量の図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作 (ドーナツと横棒)。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 量の図の字。段の名前 (ドーナツの輪の真ん中と横棒の上)、項目の名前 (凡例と棒の左)、ドーナツの凡例の割合、横棒の端の値。
 * 割合と値は数字なので等幅の字で描き、桁が揃って比べやすくする
 */
export const CHART_TYPE = {
  title: text(15, 700),
  name: text(13, 500),
  share: text(13, 600, "mono"),
  value: text(12, 600, "mono"),
} as const;

/**
 * 図の外周の余白 `pad`。段の番号は左上の角に、図の端から `pad` の所に丸の縁が来るよう置く。
 * `donut` はドーナツで、輪の線の真ん中の半径 `r`、輪の太さ `width`、隣の弧との隙間の長さ `gap`、輪と凡例の間 `legendGap`、
 * 凡例の行の送り `row`、色の見本の一辺 `swatch` と角の丸み `swatchRadius`、見本と名前の間 `swatchGap`、名前と割合の間 `shareGap`、
 * 図の枠が凡例を輪の右に置けない狭さの時に輪と凡例の間を縦に空ける `below`。輪の真ん中の段の名前の基準線は、字の大きさの `titleDrop` の割合だけ真ん中より下げる。
 * `bar` は横棒で、棒の高さ `h`、棒どうしの間 `gap`、角の丸み `radius`、名前と棒の間 `nameGap`、一番大きい値の棒の長さ `track` と、狭い枠で縮める下限 `trackMin`、
 * 棒の端と値の間 `valueGap`、段の番号と段の名前の間 `titleGap`、段の名前の行と最初の棒の間 `top`。名前と値の基準線は、棒の真ん中から字の大きさの `textDrop` の割合だけ下げる
 */
export const CHART_LOOK = {
  pad: 24,
  donut: {
    r: 70,
    width: 28,
    gap: 2,
    legendGap: 36,
    row: 30,
    swatch: 12,
    swatchRadius: 3,
    swatchGap: 8,
    shareGap: 18,
    below: 28,
    titleDrop: 0.35,
  },
  bar: {
    h: 22,
    gap: 14,
    radius: 3,
    nameGap: 12,
    track: 240,
    trackMin: 120,
    valueGap: 6,
    titleGap: 10,
    top: 18,
    textDrop: 0.35,
  },
} as const;
