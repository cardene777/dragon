/**
 * 量の帯と量の棒の描き方 (#3626)。
 *
 * 帯は真ん中の曲線を帯の幅の太さで引き、その段で出どころの縁から行き先の縁へ伸ばす。伸びた段の間は濃く、後の段では薄くして残す。
 * 出どころの無い箱の棒と名前は初めから出し、行き先の棒は入る帯が伸び終えた時に帯の幅の分ずつ現れ、名前と量は最初の帯が着いた時に出る。
 * 帯の所と棒の所と字の所は並べ方 (`kinds/sankey/layout.ts`) が持つ。
 * 段ごとの帯の見た目 (`[shape: rows]`、#3641) は、行をその段が始まる時に出し、下りる帯をその段の線が伸びる間に出す。行と下りる帯の所は並べ方 (`kinds/sankey/layout.ts` の `layoutRows`) が持つ。
 * 面積で割る四角の見た目 (`[shape: treemap]`、#3642) は、切る線をその段の線が伸びる間に引き、区画を線が伸び終えた時に出す。区画と切る線の所は並べ方の `layoutTreemap` が持つ。
 * この file は量の行き先の図の描く部品 (`kinds/sankey.ts`) が出し、見本帳を開いた時に読む塊に入れない
 */
import type { SankeyBand, SankeyLayout, SankeyNode, SankeyRow, SankeyRowSection, SankeyTile } from "../../kinds/sankey/layout";
import type { Rect } from "../../layout/scene";
import { SANKEY_LOOK, SANKEY_ROWS, SANKEY_ROWS_TYPE, SANKEY_TREEMAP, SANKEY_TREEMAP_TYPE, SANKEY_TYPE } from "../../look/sankey";
import { EASE, MOTION } from "../../look/values";
import { partRadius } from "../../render/corner";
import { ALWAYS, type Shown } from "../../render/ink";
import type { Frame } from "../../render/motion";
import { type Ctx, r1, write } from "../../render/parts";
import { cs } from "../color/draw";

const B = SANKEY_LOOK.band;

/** 帯の真ん中の曲線。両端で水平になる 3 次の曲線 */
function centre(band: SankeyBand): string {
  const ca = (band.a[0] + band.a[1]) / 2;
  const cb = (band.b[0] + band.b[1]) / 2;
  const m = (band.x1 + band.x2) / 2;
  return `M${r1(band.x1)} ${r1(ca)}C${r1(m)} ${r1(ca)} ${r1(m)} ${r1(cb)} ${r1(band.x2)} ${r1(cb)}`;
}

/** 帯の段の時刻。引き始め、伸び終わり、段の終わり */
function timesOf(band: Pick<SankeyBand, "step" | "event">, ctx: Ctx): { start: number; drawn: number; end: number } {
  const { t } = ctx;
  const time = t.edges.find((e) => e.step === band.step && e.event === band.event);
  const span = t.steps[band.step];
  const start = time?.start ?? span?.start ?? 0;
  const drawn = time?.drawn ?? start;
  return { start, drawn, end: span?.end ?? drawn };
}

/** 帯を全て描く。帯ごとに 1 つの部品 (`data-band="<出どころ>><行き先>"`) にまとめ、行き先の色で塗る */
export function drawBands(layout: SankeyLayout, ctx: Ctx): string {
  const { m } = ctx;
  return layout.bands
    .map((band) => {
      const { start, drawn, end } = timesOf(band, ctx);
      const style = m.kf([
        [0, { opacity: 0, "stroke-dashoffset": 1, "stroke-opacity": B.now }],
        [start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
        [start + 0.05, { opacity: 1 }],
        [drawn, { "stroke-dashoffset": 0 }],
        [end, { "stroke-opacity": B.now }, EASE.inOut],
        [end + MOTION.fade, { "stroke-opacity": B.lit }],
        [m.last, { opacity: 1, "stroke-dashoffset": 0, "stroke-opacity": B.lit }],
        [Math.min(m.last + MOTION.fade, m.total), { opacity: 0 }],
        [m.total, { opacity: 0, "stroke-dashoffset": 1 }],
      ]);
      const w = band.a[1] - band.a[0];
      return `<g data-band="${band.from}>${band.to}" style="${cs(band.color)}"><path class="dg-sk-band dg-a" pathLength="1" d="${centre(band)}" stroke-width="${r1(w)}" style="${style}"/></g>`;
    })
    .join("");
}

/** 箱の名前と量の字。`shown` の間だけ字の四角を記録する */
function labelOf(node: SankeyNode, ctx: Ctx, shown: Shown[]): string {
  const { name, amount, place } = node.label;
  const T = SANKEY_TYPE;
  const lead = place === "above";
  return (
    write(ctx.ink, "dg-sk-name", name.x, name.y, name.text, T.name, shown) +
    (amount ? write(ctx.ink, lead ? "dg-sk-lead" : "dg-sk-amt", amount.x, amount.y, amount.text, lead ? T.lead : T.amount, shown) : "")
  );
}

/**
 * 量の棒と名前と量を全て描く。箱ごとに 1 つの部品 (`data-node="<名札>"`) にまとめる。
 * 行き先の棒は入る帯ごとに帯の幅の分を、その帯が伸び終えた時に出す
 */
export function drawNodes(layout: SankeyLayout, ctx: Ctx): string {
  const { m } = ctx;
  const { radius } = SANKEY_LOOK.bar;
  return layout.nodes
    .map((node) => {
      // 角を落とす色味 (arcade) では棒の角を丸めない
      const bar = (y: number, h: number, rounded: boolean, style?: string): string => {
        const rx = rounded ? partRadius(ctx.corner, Math.min(radius, h / 2)) : 0;
        return `<rect class="dg-sk-bar${style ? " dg-a" : ""}" x="${r1(node.x)}" y="${r1(y)}" width="${r1(node.w)}" height="${r1(h)}"${rx > 0 ? ` rx="${r1(rx)}"` : ""}${style ? ` style="${style}"` : ""}/>`;
      };
      const head = `<g data-node="${node.id}" style="${cs(node.color)}">`;
      if (node.root) return `${head}${bar(node.y, node.h, true)}${labelOf(node, ctx, ALWAYS)}</g>`;
      const ins = layout.bands.filter((b) => b.to === node.id).sort((p, q) => p.b[0] - q.b[0]);
      const times = ins.map((band) => timesOf(band, ctx).drawn);
      const appear = Math.min(...times);
      const slices = ins.map((band, i) => bar(band.b[0], band.b[1] - band.b[0], ins.length === 1, m.vis(times[i] as number))).join("");
      return `${head}${slices}<g class="dg-a" style="${m.rise(appear)}">${labelOf(node, ctx, [[appear, Number.POSITIVE_INFINITY]])}</g></g>`;
    })
    .join("");
}

/** 区画の中の名前と量の字。`shown` の間だけ字の四角を記録する */
function sectionText(s: SankeyRowSection, ctx: Ctx, shown: Shown[]): string {
  const T = SANKEY_ROWS_TYPE;
  const rest = s.kind === "rest";
  return (
    (s.name ? write(ctx.ink, "dg-sk-rname", s.name.x, s.name.y, s.name.text, T.name, shown) : "") +
    (s.value ? write(ctx.ink, rest ? "dg-sk-rrest" : "dg-sk-rval", s.value.x, s.value.y, s.value.text, rest ? T.rest : T.value, shown) : "")
  );
}

/**
 * 段ごとの帯の見た目の行と下りる帯を全て描く。行ごとに 1 つの部品 (`data-sankey-row="<段>"`) にまとめ、その段が始まる時に出す。
 * 区画は `data-sankey-section="<名札>"` と種類の `data-sankey-kind` を持ち、残りは `data-sankey-rest="<出どころの無い箱>"` も持つ。
 * 下りる帯 (`data-sankey-drop="<行き先>"`) は、その段の線が伸びる間に現れる
 */
export function drawRows(layout: SankeyLayout, ctx: Ctx): string {
  const { m, t } = ctx;
  const R = SANKEY_ROWS;
  const T = SANKEY_ROWS_TYPE;
  const rect = (r: { x: number; y: number; w: number; h: number }, cls: string, radius: number): string => {
    const rx = partRadius(ctx.corner, Math.min(radius, r.h / 2));
    return `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}"${rx > 0 ? ` rx="${r1(rx)}"` : ""}/>`;
  };
  const rowOf = (row: SankeyRow): string => {
    const start = t.steps[row.step]?.start ?? 0;
    const shown: Shown[] = [[start, Number.POSITIVE_INFINITY]];
    const style = m.kf([
      [0, { opacity: 0 }],
      [start, { opacity: 0 }, EASE.inOut],
      [start + MOTION.fade, { opacity: 1 }],
      [m.last, { opacity: 1 }],
      [Math.min(m.last + MOTION.fade, m.total), { opacity: 0 }],
      [m.total, { opacity: 0 }],
    ]);
    const sections = row.sections
      .map((s) => {
        const rest = s.kind === "rest" ? ` data-sankey-rest="${s.box}"` : "";
        return `<g data-sankey-section="${s.id}" data-sankey-kind="${s.kind}"${rest} style="${cs(s.color)}">${rect(s, `dg-sk-cell dg-sk-${s.kind}`, R.bar.radius)}${sectionText(s, ctx, shown)}</g>`;
      })
      .join("");
    const names =
      row.names.length === 0
        ? ""
        : `<g data-sankey-names="${row.step}">${row.names
            .map((n) => `<g style="${cs(n.color)}">${rect(n.mark, "dg-sk-mark", R.names.markRadius)}${write(ctx.ink, "dg-sk-rlist", n.name.x, n.name.y, n.name.text, T.list, shown)}</g>`)
            .join("")}</g>`;
    return `<g data-sankey-row="${row.step}" class="dg-a" style="${style}">${sections}${names}</g>`;
  };
  const drops = (layout.drops ?? [])
    .map((d) => {
      const { start, drawn } = timesOf(d, ctx);
      const style = m.kf([
        [0, { opacity: 0 }],
        [start, { opacity: 0 }, EASE.inOut],
        [Math.max(drawn, start + MOTION.fade), { opacity: 1 }],
        [m.last, { opacity: 1 }],
        [Math.min(m.last + MOTION.fade, m.total), { opacity: 0 }],
        [m.total, { opacity: 0 }],
      ]);
      return `<g data-sankey-drop="${d.to}" style="${cs(d.color)}"><rect class="dg-sk-drop dg-a" x="${r1(d.x)}" y="${r1(d.y1)}" width="${r1(d.w)}" height="${r1(d.y2 - d.y1)}" style="${style}"/></g>`;
    })
    .join("");
  return `${drops}${(layout.rows ?? []).map(rowOf).join("")}`;
}

/**
 * 面積で割る四角の見た目の区画と切る線と図の四角の下の名前を全て描く。区画ごとに 1 つの部品 (`data-sankey-tile="<名札>"`) にまとめ、
 * 種類の `data-sankey-kind` を持ち、残りは `data-sankey-rest="<出どころの無い箱>"` も持つ。区画は切り出した線が伸び終えた時に出て、
 * 残りは次の残りに替える線が伸び終えた時に消える。子の区画に分けた区画は、その時に地を薄くして枠と名前の札を出す。
 * 切る線 (`data-sankey-cut="<段>:<番号>"`) はその段の線が伸びる間に引き、段の終わりに消える
 */
export function drawTreemap(layout: SankeyLayout, ctx: Ctx): string {
  const { m, t } = ctx;
  const TM = SANKEY_TREEMAP;
  const TT = SANKEY_TREEMAP_TYPE;
  const N = Number.POSITIVE_INFINITY;
  /** 段 `step` の線 `event` が伸び終える時刻。線を持たない区画 (出どころの無い箱) はその段の始まり */
  const at = (step: number, event: number | undefined): number => (event === undefined ? (t.steps[step]?.start ?? 0) : timesOf({ step, event }, ctx).drawn);
  const rect = (r: Rect, cls: string, style = "", radius: number = TM.radius): string => {
    const rx = partRadius(ctx.corner, Math.min(radius, r.h / 2, r.w / 2));
    return `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}"${rx > 0 ? ` rx="${r1(rx)}"` : ""}${style ? ` style="${style}"` : ""}/>`;
  };
  const appearOf = new Map<string, number>();
  /** 区画の地の濃さ。切り出した段の間は濃く、後の段では薄く、子の区画に分けた時に枠の中の濃さ (出どころの無い箱は 0) にする */
  const tint = (tile: SankeyTile, end: number, splitAt: number | undefined): string => {
    const T = TM.tint;
    const pts: Frame[] = [[0, { "fill-opacity": T.now }]];
    let now: number = T.now;
    if (splitAt === undefined || end < splitAt) {
      pts.push([end, { "fill-opacity": T.now }, EASE.inOut], [splitAt === undefined ? end + MOTION.fade : Math.min(end + MOTION.fade, splitAt), { "fill-opacity": T.lit }]);
      now = T.lit;
    }
    if (splitAt !== undefined) {
      pts.push([splitAt, { "fill-opacity": now }, EASE.inOut], [splitAt + MOTION.fade, { "fill-opacity": tile.event === undefined ? 0 : T.frame }]);
      now = tile.event === undefined ? 0 : T.frame;
    }
    // 最後の点が無いと、keyframes の終わりへ向けて規則の濃さへ戻っていく
    pts.push([m.total, { "fill-opacity": now }]);
    return m.kf(pts);
  };
  const tiles = (layout.tiles ?? [])
    .map((tile) => {
      const appear = at(tile.step, tile.event);
      appearOf.set(tile.id, appear);
      const gone = tile.until === undefined ? undefined : at(tile.until, tile.cutBy);
      const splitAt = tile.split === undefined ? undefined : at(tile.split, tile.cutBy);
      const rest = tile.kind === "rest";
      const shown: Shown[] = [[appear, splitAt ?? gone ?? N]];
      const value = tile.value ? write(ctx.ink, rest ? "dg-sk-trest-v" : "dg-sk-tval", tile.value.x, tile.value.y, tile.value.text, rest ? TT.rest : TT.value, shown) : "";
      const name = tile.name ? write(ctx.ink, "dg-sk-tname", tile.name.x, tile.name.y, tile.name.text, TT.name, shown) : "";
      const fill = rest ? rect(tile, "dg-sk-trest") : rect(tile, "dg-sk-tile dg-a", tint(tile, t.steps[tile.step]?.end ?? appear, splitAt));
      // 子の区画に分けた区画は、字を消して枠と名前の札を出す
      const texts =
        splitAt === undefined
          ? name + value
          : `<g class="dg-a" style="${m.kf([
              [0, { opacity: 1 }],
              [splitAt, { opacity: 1 }, EASE.inOut],
              [splitAt + MOTION.fade, { opacity: 0 }],
              [m.total, { opacity: 0 }],
            ])}">${name}${value}</g>`;
      const nested =
        splitAt === undefined || tile.event === undefined
          ? ""
          : `<g class="dg-a" style="${m.vis(splitAt)}">${rect(tile, "dg-sk-frame")}${tile.chip ? write(ctx.ink, "dg-sk-tchip", tile.chip.x, tile.chip.y, tile.chip.text, TT.chip, [[splitAt, N]]) : ""}</g>`;
      const restAttr = rest ? ` data-sankey-rest="${tile.box}"` : "";
      return `<g data-sankey-tile="${tile.id}" data-sankey-kind="${tile.kind}"${restAttr} class="dg-a" style="${m.vis(appear, gone ?? m.last)}"><g style="${cs(tile.color)}">${fill}${texts}${nested}</g></g>`;
    })
    .join("");
  const cuts = (layout.cuts ?? [])
    .map((c, i) => {
      const { start, drawn, end } = timesOf(c, ctx);
      const style = m.kf([
        [0, { opacity: 0, "stroke-dashoffset": 1 }],
        [start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
        [start + 0.05, { opacity: TM.cut.opacity }],
        [drawn, { "stroke-dashoffset": 0 }],
        [end, { opacity: TM.cut.opacity, "stroke-dashoffset": 0 }, EASE.inOut],
        [end + MOTION.fade, { opacity: 0, "stroke-dashoffset": 0 }],
        [m.total, { opacity: 0, "stroke-dashoffset": 0 }],
      ]);
      return `<path data-sankey-cut="${c.step}:${i}" class="dg-sk-cut dg-a" pathLength="1" d="M${r1(c.x1)} ${r1(c.y1)}L${r1(c.x2)} ${r1(c.y2)}" style="${style}"/>`;
    })
    .join("");
  const names = (layout.names ?? [])
    .map((n) => {
      const appear = appearOf.get(n.id) ?? 0;
      return `<g class="dg-a" style="${cs(n.color)};${m.vis(appear)}">${rect(n.mark, "dg-sk-mark", "", TM.names.markRadius)}${write(ctx.ink, "dg-sk-tlist", n.name.x, n.name.y, n.name.text, TT.list, [[appear, N]])}</g>`;
    })
    .join("");
  return `${tiles}${cuts}${names === "" ? "" : `<g data-sankey-names="treemap">${names}</g>`}`;
}
