/**
 * 量の行き先の図の描く部品の組 (#3626、#3656)。並べ方は図の種類の置き場 (`kinds/sankey/layout.ts`)、見た目の規則は `render/sankey.ts`、
 * 帯と棒と字の描き方は量の帯のブロックの置き場が持つ。
 * 量の札は帯を伸ばし始める時に出てその段の終わりに消える。伸びた帯は残るので札は残さず、回り続ける図と表どうしの関係の図と同じ札の時刻の直しを使う。
 * 段ごとの帯の見た目 (`[shape: rows]`、#3641) は並べ方の `layoutRows` が並べ、量の札は上の行から下の行へ落ちる。
 * 面積で割る四角の見た目 (`[shape: treemap]`、#3642) は並べ方の `layoutTreemap` が並べ、量の札を出さない
 */
import { stepCarriers } from "../blocks/carry/step-times";
import type { Rect } from "../layout/scene";
import { followEnds } from "../render/follow-ends";
import { drawSankey } from "../render/sankey";
import type { KindParts } from "./parts";
import { layoutRows, layoutSankey, layoutTreemap, type SankeyLayout, type SankeyNode } from "./sankey/layout";
import { sankeyOverview } from "./sankey/overview";

/** 棒と、その上か横の名前と量を囲む所。`low` は囲む所の下の端 */
function around(n: SankeyNode, low: number): Rect {
  const r = n.label.rect;
  const x = Math.min(r.x, n.x);
  const y = Math.min(r.y, n.y);
  return { x, y, w: Math.max(r.x + r.w, n.x + n.w) - x, h: Math.max(r.y + r.h, low) - y };
}

export const parts: KindParts<SankeyLayout> = {
  layout: (diagram, lang, options) => {
    const shape = diagram.sankey?.shape;
    if (shape === "rows") return layoutRows(diagram, lang, options.width);
    if (shape === "treemap") return layoutTreemap(diagram, lang, options.width);
    return layoutSankey(diagram);
  },
  times: stepCarriers,
  // 出どころと行き先を結ぶ線は帯が描くので、共通の線は描かない
  draw: (layout, _diagram, ctx) => ({ ...drawSankey(layout, ctx), edge: () => undefined }),
  // 段で伸ばした帯の出どころの名前と棒の上の端を線の端の箱に挙げ、行き先の棒と名前と量を足した物に入れる (#3836)。
  // 段ごとの帯と面積で割る四角の見た目は帯の出どころを持たないので挙げない
  ends: followEnds((layout, _diagram, step) => {
    if (layout.arrangement) return { added: [], ends: [] };
    const bands = layout.bands.filter((band) => band.step === step);
    const to = new Set(bands.map((band) => band.to));
    return {
      added: layout.nodes.filter((n) => to.has(n.id)).map((n) => around(n, n.y + n.h)),
      blocks: layout.nodes.map((n) => around(n, n.y + n.h)),
      ends: layout.nodes
        .filter((n) => !to.has(n.id) && bands.some((band) => band.from === n.id))
        .map((n) => ({
          rect: around(n, n.y),
          name: n.name,
          color: n.color,
          paths: bands
            .filter((band) => band.from === n.id)
            .map((band): [number, number][] => [
              [band.x1, (band.a[0] + band.a[1]) / 2],
              [band.x2, (band.b[0] + band.b[1]) / 2],
            ]),
        })),
    };
  }),
  // 全体図に帯を元の図と同じ曲線のまま塗り、棒を札で描く (#3849)
  overview: sankeyOverview,
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    sankey: typeof import("./sankey");
  }
}
