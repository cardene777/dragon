/**
 * 量の図の描く部品の組 (#3560、#3656)。並べ方は図の種類の置き場 (`kinds/chart/layout.ts`)、輪と弧と棒と漏斗の段と字の描き方は `render/chart.ts` が持つ。
 * 漏斗の見た目 (#3621) は、去った数と最後の段の行の名前を記法の言葉で書くので、並べ方に記法の言葉を渡す。
 * 折れ線の見た目 (#3802) は、止めて置く図で図の上の行に図の題を出すので、並べ方に止めて置く図かを渡す
 */
import { drawChart } from "../render/chart";
import { type ChartLayout, layoutChart, chartOverview } from "./chart/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<ChartLayout> = {
  // 凡例を輪の右に置けない幅では輪の下に置き、横棒を枠に入る長さまで縮める
  layout: (diagram, lang, options) => layoutChart(diagram, { lang, ...(options.width === undefined ? {} : { width: options.width }), ...(options.figure ? { figure: true } : {}) }),
  draw: drawChart,
  // 全体図に折れ線と点、漏斗と棒の段、点で数える点を描く (#3849)
  overview: chartOverview,
  // 止めて置く図は段を送らないので、最後の段の名前より図の題で何の図かを伝える (#3801)。
  // 折れ線の見た目は段の題が横の軸の名前なので替えず、並べ方が図の上の行に図の題を出す (#3802)
  figure: (model) => (model.title && model.chart?.shape !== "line" ? { ...model, steps: model.steps.map((step) => ({ ...step, title: model.title })) } : model),
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    chart: typeof import("./chart");
  }
}
