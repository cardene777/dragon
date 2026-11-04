/**
 * 組んだ親の描き方 (#3233、#3348)。
 *
 * 子から親への木の線は親を書いた段で引き始め、引き終えた後も最後まで残す。
 * 木の箱は親から子への線を引き終えた時に弾んで出る。根は左に枝の絵柄を持ち、字を絵柄の右に左揃えで並べ、ほかの箱は字を真ん中に揃える。
 * 線の両端になった木の箱は、その段の間だけ縁に色を付ける。木の箱と木の線を薄くする動きと弾む動きは、木の図を描く部品 (`render/tree.ts`) が掛ける。
 * この file は木の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { TreeLink, TreePlaced } from "../../kinds/tree/layout";
import { EASE, LOOK, TYPE } from "../../look/values";
import type { EdgeTime } from "../../timeline";
import { frameShape, partRadius } from "../../render/corner";
import { type Ctx, esc, pathOf, r1, write } from "../../render/parts";
import { glyph } from "../icon/draw";

/** 子から親への木の線 `l`。`time` の線の時刻で引き始め、引き終えた後も最後まで残す。線の跡を重なりの数えに足す */
export function treeLink(l: TreeLink, time: EdgeTime, ctx: Ctx): string {
  const { m } = ctx;
  ctx.traces.push({ from: l.from, to: l.to, points: l.points, shown: [[time.start, Number.POSITIVE_INFINITY]] });
  const kf = m.kf([
    [0, { opacity: 0, "stroke-dashoffset": 1 }],
    [time.start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
    [time.start + 0.05, { opacity: 1 }],
    [time.drawn, { "stroke-dashoffset": 0 }],
    [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
    [m.total, { opacity: 0, "stroke-dashoffset": 0 }],
  ]);
  return `<path class="dg-tree-l dg-a" data-tree-link="${esc(l.from)}" pathLength="1" d="${pathOf(l.points)}" style="${kf}"/>`;
}

/**
 * 木の箱 `n` の枠と根の絵柄と字。`act` は線の両端になった段の間に縁へ色を付ける動き (両端にならない箱は `undefined`)、
 * `at` は箱が現れる時刻で、字はその時刻から書く
 */
export function treeBox(n: TreePlaced, act: string | undefined, at: number, ctx: Ctx): string {
  const T = LOOK.tree;
  const B = LOOK.box;
  const radius = n.root ? T.root.radius : T.radius;
  const rect = (cls: string, extra = ""): string =>
    frameShape(ctx.corner, ` class="${cls}"${extra}`, n, `<rect class="${cls}" x="${r1(n.x)}" y="${r1(n.y)}" width="${r1(n.w)}" height="${n.h}" rx="${radius}"${extra}/>`);
  const frame = `${act ? `<g class="dg-a" style="${act}">${rect("dg-halo")}</g>` : ""}${rect("dg-st", ` ${ctx.sh}`)}${act ? `<g class="dg-a" style="${act}">${rect("dg-on")}</g>` : ""}`;
  const ix = n.x + T.root.iconX + B.icon / 2;
  const mark = n.root
    ? `<rect class="dg-ic" x="${r1(ix - B.icon / 2)}" y="${r1(n.cy - B.icon / 2)}" width="${B.icon}" height="${B.icon}" rx="${partRadius(ctx.corner, B.iconRadius)}"/>${glyph("tree", ix, n.cy, B.iconScale)}`
    : "";
  const shown: [number, number][] = [[at, Number.POSITIVE_INFINITY]];
  const texts = n.lines
    .map((line, k) => {
      const style = n.styles[k] ?? TYPE.boxName;
      const cls =
        style === TYPE.treeHash
          ? "dg-tree-hash"
          : style === TYPE.treeName
            ? "dg-tree-name"
            : style === TYPE.rootHash
              ? "dg-tree-rh"
              : style === TYPE.rootName
                ? "dg-tree-rn"
                : "dg-tree-one";
      const baseline = n.baselines[k] ?? n.cy;
      return n.root ? write(ctx.ink, cls, n.x + T.root.textX, baseline, line, style, shown) : write(ctx.ink, cls, n.cx, baseline, line, style, shown, "middle");
    })
    .join("");
  return `${frame}${mark}${texts}`;
}
