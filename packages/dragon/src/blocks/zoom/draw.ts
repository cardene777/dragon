/**
 * 拡大の帯の描き方 (#3165、#3348)。
 *
 * 帯の列の区切りと上の字を描き、宣言した箱を列ごとに描く。印の列と同じ名札の箱は線が届くまで点線の枠で待ち、届いた時に弾んで出る。
 * 空きの目盛りの列では、印の列と同じ名札の箱を空きの枠にする。拡大した範囲の枠と点線は、拡大した範囲に掛かる範囲の囲みが出る時に消す。
 * この file は時間軸の図を描く部品 (`render/time.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { TimeBox } from "../../kinds/time/layout";
import { LOOK, TYPE } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import { ALWAYS } from "../../render/ink";
import { esc, pathOf, r1, write } from "../../render/parts";
import { card } from "../box/draw";
import { linkTo } from "../link/draw";
import { ja, type TimeKit } from "../scale/draw";

/** 拡大の帯の目盛り `unit` の列の箱 `box`。空きの枠、点線の枠で待つ箱、すぐに描く箱のどれか */
function columnBox(k: TimeKit, box: TimeBox, unit: number): string {
  const { layout, diagram, ctx } = k;
  const { m, ink } = ctx;
  const on = [...new Set(layout.wires.filter((w) => w.from === box || w.to === box).map((w) => w.step))].sort((a, b) => a - b);
  const frame = (cls: string): string =>
    frameShape(ctx.corner, ` class="${cls}"`, box, `<rect class="${cls}" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${box.h}" rx="${LOOK.box.radius}"/>`);
  if (box.empty) {
    const shown = k.passed.get(unit);
    const word = layout.zoom?.empty ?? "";
    const mark =
      shown === undefined
        ? ""
        : `<g class="dg-a" style="${m.vis(shown)}">${frame("dg-tm-ex")}${write(ink, "dg-tm-ext", box.cx, box.cy + LOOK.baseline.mark, word, TYPE.emptyText, [[shown, Number.POSITIVE_INFINITY]], "middle")}</g>`;
    return `<g data-empty="${esc(box.id)}">${frame("dg-tm-ph")}${mark}</g>`;
  }
  const drawn = linkTo(
    diagram.boxes.find((b) => b.id === box.id)?.link,
    card(box, ctx, on, k.subs.get(box.id) ?? []),
  );
  if (!box.row) return drawn;
  // 印の列と同じ名札の箱は、線が届くまで点線の枠で待つ
  const shown = k.filled(box.row, unit);
  if (shown === undefined) return frame("dg-tm-ph");
  return `<g class="dg-a" style="${m.until(shown)}">${frame("dg-tm-ph")}</g><g class="dg-popc dg-a" style="${m.pop(shown)}">${drawn}</g>`;
}

/** 拡大の帯の列の区切りと上の字と、列ごとの箱 */
export function zoomColumns(k: TimeKit): void {
  const z = k.layout.zoom;
  if (!z) return;
  const T = LOOK.time;
  z.columns.forEach((c, n) => {
    if (n > 0) k.base.push(`<line class="dg-tm-sep" x1="${r1(c.x)}" y1="${r1(c.y + T.sep)}" x2="${r1(c.x)}" y2="${r1(c.y + c.h - T.sep)}"/>`);
    k.base.push(write(k.ctx.ink, ja("dg-tm-hd", c.head), c.x + c.w / 2, z.headY, c.head, TYPE.timeHead, ALWAYS, "middle"));
    for (const box of c.boxes) k.node.push(columnBox(k, box, c.unit));
  });
}

/** 拡大した範囲の枠と点線。拡大した範囲に掛かる範囲の囲みが出る時に消す */
export function zoomLens(k: TimeKit): void {
  const z = k.layout.zoom;
  if (!z) return;
  const { m } = k.ctx;
  const hide = k.layout.spans
    .filter((s) => s.kind === "box" && s.from <= z.to && z.from <= s.to)
    .map((s) => k.at(s.step, s.event))
    .filter((t): t is number => t !== undefined)
    .sort((a, b) => a - b)[0];
  const guides = z.guides.map((g) => `<path class="dg-tm-gd" d="${pathOf(g, k.ctx.corner)}"/>`).join("");
  const lens = `<rect class="dg-tm-fr" x="${r1(z.frame.x)}" y="${r1(z.frame.y)}" width="${r1(z.frame.w)}" height="${r1(z.frame.h)}" rx="${partRadius(k.ctx.corner, 4)}"/>${guides}`;
  k.base.push(hide === undefined ? lens : `<g class="dg-a" style="${m.until(hide)}">${lens}</g>`);
}
