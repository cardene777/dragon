/** 量の図の描く部品の組 (#3560、#3656)。並べ方は図の種類の置き場 (`kinds/chart/layout.ts`)、輪と弧と棒と字の描き方は `render/chart.ts` が持つ */
import { drawChart } from "../render/chart";
import { type ChartLayout, layoutChart } from "./chart/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<ChartLayout> = {
  // 凡例を輪の右に置けない幅では輪の下に置き、横棒を枠に入る長さまで縮める
  layout: (diagram, _lang, options) => layoutChart(diagram, options.width === undefined ? {} : { width: options.width }),
  draw: drawChart,
};
