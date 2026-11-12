/** 木の図の描く部品の組 (#3248、#3656)。並べ方は図の種類の置き場 (`kinds/tree/layout.ts`、#3348)、木の線と通った跡と木の箱と札の描き方は `render/tree.ts` が持つ (#3233) */
import type { Rect } from "../layout/scene";
import { MOTION } from "../look/values";
import { drawTree } from "../render/tree";
import type { KindParts } from "./parts";
import { layoutTree, type TreeLayout } from "./tree/layout";

export const parts: KindParts<TreeLayout> = {
  layout: layoutTree,
  // 運ぶ物は着いた所で消える。通った跡が行き先を残し、兄弟の箱から同じ親へ着いた運ぶ物が重ならないため
  carried: (timeline) => timeline.carriers.map((time) => ({ ...time, start: time.depart, end: time.arrive + MOTION.fade })),
  draw: (layout, diagram, ctx) => {
    const tree = drawTree(layout, diagram, ctx.t, ctx);
    // 木の線を走る線は通った跡が見せるので、ほかの線と同じ線で描かない。
    // 木の箱は段ごとに現れるので、木の線を走らない線の点線は、両端の木の箱が現れてから出す (#3240)
    const runs = new Set(layout.runs.map((r) => `${r.step}/${r.event}`));
    return {
      base: tree.links,
      lit: tree.trails,
      node: tree.nodes,
      edge: (e) => (runs.has(`${e.step}/${e.event}`) ? undefined : Math.max(tree.appear.get(e.from) ?? 0, tree.appear.get(e.to) ?? 0)),
    };
  },
  // その段で現れる木の箱と木の線と、線の両端の木の箱を見る
  focus: (layout, diagram, step) => {
    const ends = new Set((diagram.steps[step]?.events ?? []).flatMap((e) => (e.type === "edge" ? [e.from, e.to] : [])));
    const links = layout.links.filter((l) => l.step === step).map((l): Rect => {
      const xs = l.points.map((p) => p[0]);
      const ys = l.points.map((p) => p[1]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    });
    return [...layout.nodes.filter((n) => n.step === step || ends.has(n.id)), ...links];
  },
  overview: (layout) => layout.nodes.map((node) => ({ rect: node, band: false, color: node.color })),
};
