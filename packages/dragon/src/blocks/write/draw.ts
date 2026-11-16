/**
 * 値の札の描き方 (#3389、#3398)。
 *
 * 残高でない値は値の札で描く。トークンの Contract が持つ値は、トークンの箱の中の名前の下に値の名前と値を 1 行ずつ書き、
 * 書き替えた値は前の値を消し線で残して矢印で今の値へつなぐ。ほかの関係者の値は、持ち主の槽の並びに札を置き、名前と大きな値を書き、
 * 書き替えた値は札の下に前の値を消し線で残して暫定か確定か取り消しの語を添える。確定した札は緑の縁、取り消した札は桃色の縁で描く。
 * `write` の段では、書いた者の名札から書き替えた札まで書き込む管を引く。処理を借りる呼び出しの内側の書き込みは、呼んだ側の札へ向く。
 * この file は配管の図を描く部品 (`render/pipe.ts`) と配管の図のブロックの描き方だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeBadge, PipeLink, PipePlate, PipeWrite } from "../../kinds/pipe/layout";
import type { Rect } from "../../layout/scene";
import { LINK, PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { frameShape, partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, pathOf, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { shortened, STATE_COLOR } from "../hold/draw";

const P = PIPE_LOOK;
const T = PIPE_TYPE;

/** 和文を含む字に足す class。等幅の字は和文を持たないので、和文の字で描く */
export const wide = (text: string): string => ([...text].some((ch) => (ch.codePointAt(0) ?? 0) >= 0x2e80) ? " dg-pp-j" : "");

const strike = (r: Rect): string => `<rect class="dg-pp-strike" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}"/>`;

/** 値の札。`attrs` は部品の印 (段の始まりの写しは持たない) */
export function plate(p: PipePlate, ctx: Ctx, shown: Shown[], attrs: string): string {
  const changed = p.was !== undefined;
  if (p.boxed) {
    // トークンの箱の中の行 (Tracelyth #175)。区切りの線、札、頭の印、名前か頭の字、前の値と矢印、今の値の順に重ねる
    const badge = (b: PipeBadge): string =>
      `<circle class="dg-pp-tbadge" cx="${r1(b.cx)}" cy="${r1(b.cy)}" r="${b.r}"/><text class="dg-pp-tini" x="${r1(b.cx)}" y="${r1(b.cy + T.badge.size * 0.35)}" text-anchor="middle">${esc(b.text)}</text>`;
    const sep = p.divider ? `<line class="dg-pp-tsep" x1="${r1(p.divider.x1)}" y1="${r1(p.divider.y)}" x2="${r1(p.divider.x2)}" y2="${r1(p.divider.y)}"/>` : "";
    const pill = p.pill ? `<rect class="dg-pp-tpill" x="${r1(p.pill.x)}" y="${r1(p.pill.y)}" width="${r1(p.pill.w)}" height="${r1(p.pill.h)}" rx="${r1(partRadius(ctx.corner, p.pill.h / 2))}"/>` : "";
    const badges =
      [...(p.badge ? [p.badge] : []), ...(p.badges ?? [])].map(badge).join("") +
      (p.keyArrow ? write(ctx.ink, "dg-pp-tva", p.keyArrow.x, p.keyArrow.base, p.keyArrow.text, T.rowWas, shown) : "");
    const label = p.row
      ? write(ctx.ink, `dg-pp-tname${wide(p.label.text)}`, p.label.x, p.label.base, p.label.text, T.rowName, shown)
      : write(ctx.ink, `dg-pp-tcap${wide(p.label.text)}`, p.label.x, p.label.base, p.label.text, T.boxSub, shown);
    const was =
      p.was && p.arrow
        ? write(ctx.ink, "dg-pp-tvw", p.was.x, p.was.base, p.was.text, T.rowWas, shown) +
          (p.strike ? strike(p.strike) : "") +
          write(ctx.ink, "dg-pp-tva", p.arrow.x, p.arrow.base, p.arrow.text, T.rowWas, shown)
        : "";
    return (
      `<g${attrs} class="dg-pp-tplate dg-pp-tplate-${p.state}" style="${cs(STATE_COLOR[p.state])}">` +
      sep +
      pill +
      badges +
      label +
      was +
      write(ctx.ink, `dg-pp-tval${changed ? " dg-pp-tval-on" : ""}${wide(p.text.text)}`, p.text.x, p.text.base, p.text.text, changed ? T.rowNow : T.rowValue, shown) +
      `</g>`
    );
  }
  const sub =
    p.was && p.tag
      ? write(ctx.ink, `dg-pp-was${wide(p.was.text)}`, p.was.x, p.was.base, p.was.text, T.sub, shown) +
        (p.strike ? strike(p.strike) : "") +
        write(ctx.ink, "dg-pp-tagw", p.tag.x, p.tag.base, p.tag.text, T.tag, shown)
      : "";
  // 札の名前と値の字は、札の枠と一緒に描いた四角で記録する。崩れの確かめが、札の枠に接する字を探す (#3526)
  const frame = { name: p.name, rect: { x: p.x, y: p.y, w: p.w, h: p.h } };
  for (const t of [p.label, p.text]) ctx.ink.push({ text: t.text, rect: { x: t.x, y: t.y, w: t.w, h: t.h }, shown, frame });
  return (
    `<g${attrs} class="dg-pp-plate dg-pp-plate-${p.state}" style="${cs(STATE_COLOR[p.state])}">` +
    frameShape(ctx.corner, ' class="dg-pp-pbox"', p, `<rect class="dg-pp-pbox" x="${r1(p.x)}" y="${r1(p.y)}" width="${r1(p.w)}" height="${r1(p.h)}" rx="${P.plate.radius}"/>`) +
    write(undefined, `dg-pp-tok${wide(p.label.text)}`, p.label.x, p.label.base, p.label.text, T.tankTitle, shown) +
    write(undefined, `dg-pp-pv${wide(p.text.text)}`, p.text.x, p.text.base, p.text.text, T.plateValue, shown) +
    `${sub}</g>`
  );
}

/**
 * 2人をキーに持つ値の点線の矢印 (#107)。線は1つ目のキーの人から列の上の段を通って2つ目のキーの人の頭に着く。
 * `lit` はその段で値が変わった線で、濃く描く。リバートで戻った線は値の札のリバートと同じ赤で描く
 */
export function linkLine(l: PipeLink, lit: boolean): string {
  const pts = l.points.map((p): [number, number] => [p[0], p[1]]);
  const tip = pts[pts.length - 1] as [number, number];
  const a = LINK.arrow;
  pts[pts.length - 1] = [tip[0], tip[1] - a];
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${r1(p[0])} ${r1(p[1])}`).join(" ");
  const head = `M ${r1(tip[0] - a)} ${r1(tip[1] - a * 1.6)} L ${r1(tip[0])} ${r1(tip[1])} L ${r1(tip[0] + a)} ${r1(tip[1] - a * 1.6)} Z`;
  return `<g class="dg-pp-rel${lit ? " dg-pp-rel-on" : ""}" style="${cs(l.undo ? "rose" : "violet")}"><path class="dg-pp-rell" d="${d}"/><path class="dg-pp-relh" d="${head}"/></g>`;
}

/** 2人を結ぶ線の札と増減の札 (#107)。札は段の上に値を書き、増減の札は札の右に並べる */
export function linkLabel(l: PipeLink, ctx: Ctx, shown: Shown[], attrs: string): string {
  const r = l.label;
  const base = (box: Rect): number => box.y + box.h / 2 + T.keyValue.size * 0.36;
  const delta = l.delta
    ? `<g class="dg-pp-reld"><rect x="${r1(l.delta.x)}" y="${r1(l.delta.y)}" width="${r1(l.delta.w)}" height="${r1(l.delta.h)}" rx="${r1(partRadius(ctx.corner, l.delta.h / 2))}"/>` +
      write(ctx.ink, "dg-pp-reldt", l.delta.x + l.delta.w / 2, base(l.delta), l.delta.text, T.delta, shown, "middle") +
      `</g>`
    : "";
  // リバートで戻った線の札は、値の札のリバートと同じ赤で描く (Tracelyth #111)
  return (
    `<g${attrs} class="dg-pp-relp" style="${cs(l.undo ? "rose" : "violet")}"><rect class="dg-pp-relb" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}" rx="${r1(partRadius(ctx.corner, r.h / 2))}"/>` +
    write(ctx.ink, `dg-pp-relt${wide(r.text)}`, r.x + r.w / 2, base(r), r.text, T.keyValue, shown, "middle") +
    delta +
    `</g>`
  );
}

/** 書き込む管。書いた者の名札の下から、書き替えた札の上の端まで。始まりと終わりが同じ点の管は描かない */
export function writePipe(w: PipeWrite, ctx: Ctx, attrs: string): string {
  const a = P.flow.chevron;
  const [ex, ey] = w.points[w.points.length - 1] ?? [0, 0];
  const [sx, sy] = w.points[0] ?? [0, 0];
  if (Math.abs(sx - ex) < 0.5 && Math.abs(sy - ey) < 0.5) return "";
  return (
    `<g${attrs} style="${cs("amber")}"><path class="dg-pp-wr" d="${pathOf(shortened(w.points, a), ctx.corner)}"/>` +
    `<path class="dg-pp-wh" d="M ${r1(ex - a)} ${r1(ey - a)} L ${r1(ex)} ${r1(ey)} L ${r1(ex + a)} ${r1(ey - a)} Z"/></g>`
  );
}
