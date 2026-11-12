/**
 * 量の図の描く部品の組 (#3560、#3656)。並べ方は図の種類の置き場 (`kinds/chart/layout.ts`)、輪と弧と棒と漏斗の段と字の描き方は `render/chart.ts` が持つ。
 * 漏斗の見た目 (#3621) は、去った数と最後の段の行の名前を記法の言葉で書くので、並べ方に記法の言葉を渡す
 */
import { drawChart } from "../render/chart";
import { type ChartLayout, layoutChart } from "./chart/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<ChartLayout> = {
  // 凡例を輪の右に置けない幅では輪の下に置き、横棒を枠に入る長さまで縮める
  layout: (diagram, lang, options) => layoutChart(diagram, { lang, ...(options.width === undefined ? {} : { width: options.width }) }),
  draw: drawChart,
};
