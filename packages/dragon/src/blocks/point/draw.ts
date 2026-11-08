/**
 * 節目の描き方 (#3165、#3348)。
 *
 * 節目は点線の丸で待ち、状態を変えるたびに色の丸を弾ませて、状態の字を書き換える。名札は最初の状態が来るまで薄く出す。
 * 節目どうしの線は軸の上に引き、引いた後も残す。拡大の帯の箱どうしの線は、線のブロックの描き方が描く。
 * 名札と状態の字は、時間軸の囲みの枠の内に収める部品として記録する。右端の節目の字が枠を越えると、崩れの確かめが段と字を名指す (#3527)。
 * この file は時間軸の図を描く部品 (`render/time.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { textBox } from "../../layout/measure";
import { EASE, LOOK, MOTION, TYPE } from "../../look/values";
import { arrowHead, esc, pathOf, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { glyph } from "../icon/draw";
import { frame, ja, type TimeKit } from "../scale/draw";

/** 節目ごとの、軸から丸への点線と、丸と旗の絵柄と、名札と状態の字 */
export function points(k: TimeKit): void {
  const P = LOOK.time.point;
  const { layout, ctx } = k;
  const { m, ink } = ctx;
  for (const point of layout.points) {
    const { cx, cy, r } = point;
    const times = point.changes.map((c) => k.at(c.step, c.event) ?? Number.POSITIVE_INFINITY);
    const first = times[0];
    k.base.push(`<path class="dg-tm-con" d="M ${r1(cx)} ${r1(k.rowsBottom + 3)} L ${r1(cx)} ${r1(cy - r - 2)}"/>`);
    const tx = point.text.x;
    const name = write(ink, ja("dg-tm-pn", point.id), tx, cy + P.nameY, point.id, TYPE.pointName);
    frame(k, { kind: "text", text: point.id }, textBox(point.id, tx, cy + P.nameY, TYPE.pointName));
    const grey = name.replace(/class="([^"]*)"/u, 'class="$1 dg-tm-pn-g"');
    const label =
      first === undefined || !Number.isFinite(first) ? grey : `<g class="dg-a" style="${m.until(first)}">${grey}</g><g class="dg-a" style="${m.vis(first)}">${name}</g>`;
    const states = point.changes
      .map((c, n) => {
        const t = times[n] as number;
        if (!Number.isFinite(t)) return "";
        const next = times[n + 1];
        const end = next !== undefined && Number.isFinite(next) ? next - MOTION.untilFade : undefined;
        const shown: [number, number][] = [[t, end ?? Number.POSITIVE_INFINITY]];
        const words = write(ink, ja("dg-tm-ps", c.text), tx, cy + P.stateY, c.text, TYPE.pointState, shown);
        frame(k, { kind: "text", text: c.text }, textBox(c.text, tx, cy + P.stateY, TYPE.pointState), shown);
        return `<g class="dg-a" style="${cs(c.color ?? "slate")};${end === undefined ? m.rise(t) : m.rise(t, end)}">${words}</g>`;
      })
      .join("");
    const rings = point.changes
      .map((c, n) => {
        const t = times[n] as number;
        if (!c.color || !Number.isFinite(t)) return "";
        return `<g class="dg-popc dg-a" style="${cs(c.color)};${m.pop(t)}"><circle class="dg-tm-pc" cx="${r1(cx)}" cy="${r1(cy)}" r="${r + 0.5}"/>${glyph("flag", cx, cy, P.glyph, "dg-tm-pcg")}</g>`;
      })
      .join("");
    k.node.push(`<g data-point="${esc(point.id)}"><circle class="dg-tm-pg" cx="${r1(cx)}" cy="${r1(cy)}" r="${r}"/>${glyph("flag", cx, cy, P.glyph, "dg-tm-pgl")}${rings}${label}${states}</g>`);
  }
}

/** 節目どうしの線。引いた後も残す。拡大の帯の箱どうしの線 (`layout.wires`) は描かない */
export function pointLines(k: TimeKit): void {
  const { layout, timeline, ctx } = k;
  const { m } = ctx;
  const wired = new Set(layout.wires.map((w) => `${w.step}/${w.event}`));
  for (const e of layout.edges) {
    if (wired.has(`${e.step}/${e.event}`)) continue;
    const time = timeline.edges.find((t) => t.step === e.step && t.event === e.event);
    if (!time) continue;
    ctx.traces.push({ from: e.from, to: e.to, points: e.points, shown: [[time.start, Number.POSITIVE_INFINITY]] });
    const kf = m.kf([
      [0, { opacity: 0, "stroke-dashoffset": 1 }],
      [time.start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
      [time.start + 0.05, { opacity: 1 }],
      [time.drawn, { "stroke-dashoffset": 0 }],
      [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
      [m.total, { opacity: 0, "stroke-dashoffset": 0 }],
    ]);
    const head = m.kf([
      [0, { opacity: 0 }],
      [time.drawn - 0.05, { opacity: 0 }],
      [time.drawn, { opacity: 1 }],
      [m.last, { opacity: 1 }, EASE.inOut],
      [m.total, { opacity: 0 }],
    ]);
    k.lit.push(
      `<g data-link="${esc(`${e.from}->${e.to}`)}" style="${cs(e.color)}"><path class="dg-tm-ln dg-a" pathLength="1" d="${pathOf(e.points, ctx.corner)}" style="${kf}"/><path class="dg-eh-on dg-a" d="${arrowHead(e.points)}" style="${head}"/></g>`,
    );
  }
}
