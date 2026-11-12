/**
 * 列の図の描く部品の組 (#3248、#3656)。並べ方は図の種類の置き場 (`kinds/lineup/layout.ts`、#3348)、列とチップと封と札と見た目の規則は `render/lineup.ts` が持つ (#3239)。
 * 見た目の規則は列の図の SVG にだけ書き、ほかの図の SVG と最初に読む script に入れない (#3351)
 */
import { drawLineup } from "../render/lineup";
import { layoutLineup, type LineupLayout } from "./lineup/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<LineupLayout> = {
  // 箱を横に並べると箱の名前が読めない幅では縦に組む (#3351)
  layout: (diagram, lang, options) => layoutLineup(diagram, { lang, ...(options.width === undefined ? {} : { width: options.width }) }),
  draw: (layout, diagram, ctx, _subs, follow) => {
    const lineup = drawLineup(layout, diagram, ctx.t, ctx);
    // 寄って追う窓は見出しの文 (図の題、段の題、説明) を描かない。図の幅で組んだ文は窓で切れ、段の題と説明は部品の帯が出すため (#3365)
    return {
      base: `${follow ? "" : lineup.heading}${lineup.lanes}`,
      node: lineup.chips,
      css: lineup.css,
      attrs: ` data-lineup-arrangement="${layout.arrangement}"`,
    };
  },
  // その段で変わる列を見る (#3239)
  focus: (layout, diagram, step) => {
    const changed = new Set((diagram.steps[step]?.events ?? []).flatMap((e) => ("box" in e ? [e.box] : [])));
    return layout.lanes.filter((lane) => changed.has(lane.id));
  },
  // 寄って追う窓は、描かない見出しの文 (図の題と、段ごとの題と説明) の下の端から見せ始める (#3365)
  top: (layout) => Math.max(...[layout.heading, ...layout.headlines.flatMap((h) => (h.say ? [h.title, h.say] : [h.title]))].map((t) => t.y + t.h)),
  ownBoxes: true,
};
