/**
 * 時間軸の図 (#3165) を描く部品。見本帳の試作 `docs/design/base/scenes/finality.js` の時間軸と拡大の帯と節目を写す。
 *
 * 印は枠を初めから見せ、針が目盛りを過ぎた時に塗る。拡大した目盛りの印は、その列で印の列と同じ名札の箱へ線が届いた時に塗る。
 * 印の色を変える出来事は、その時刻に色を重ねる。空きの印は、針が過ぎた時に小さな点を出す。
 * 拡大の帯の箱は列ごとに描き、印の列と同じ名札の箱は線が届くまで点線の枠で待ち、届いた時に弾んで出る。空きの目盛りの列では空きの枠を出す。
 * 節目は点線の丸で待ち、状態を変えるたびに色の丸を弾ませて、状態の字を書き換える。節目どうしの線は引いた後も残す。
 * 範囲の括弧は次の括弧が来る段まで、範囲の囲みは最後まで出す。拡大の枠と点線は、拡大した範囲を囲む範囲の囲みが出る時に消す。
 * 針は時刻の表の針の動きを辿り、繰り返す前に左端へ戻る。
 */
import type { TimeBox, TimeLayout } from "../layout/time";
import { hasWide } from "../layout/measure";
import { EASE, LOOK, MOTION, type TextStyle, TYPE } from "../look/values";
import type { Diagram } from "../schema";
import type { Span, Timeline } from "../timeline";
import { ALWAYS, type Shown } from "./ink";
import { arrowHead, card, type Ctx, cs, esc, glyph, pathOf, type SubChange, write } from "./parts";

const r1 = (v: number): number => Math.round(v * 100) / 100;

/** 和文を含む字に、同じ大きさと太さの和文の字の class を足す */
const ja = (cls: string, text: string): string => (hasWide(text) ? `${cls} ${cls}j` : cls);

/** 和文を含む字の、和文の字で描く時の字の形 */
export const sansOf = (t: TextStyle): TextStyle => ({ ...t, family: "sans" });

/** 真っ直ぐ進む動きの並びから、向きの変わらない間の点を除く。keyframes の数を減らすため */
export function simplify(keys: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const key of keys) {
    const a = out[out.length - 2];
    const b = out[out.length - 1];
    if (a && b) {
      const s1 = b[0] === a[0] ? Number.NaN : (b[1] - a[1]) / (b[0] - a[0]);
      const s2 = key[0] === b[0] ? Number.NaN : (key[1] - b[1]) / (key[0] - b[0]);
      if (Number.isFinite(s1) && Number.isFinite(s2) && Math.abs(s1 - s2) < 1e-9) out[out.length - 1] = key;
      else out.push(key);
    } else out.push(key);
  }
  return out;
}

/** 真っ直ぐ進む動き `keys` の、時刻 `t` の値 */
export function valueAt(keys: [number, number][], t: number): number {
  const first = keys[0];
  if (!first) return 0;
  if (t <= first[0]) return first[1];
  for (let k = 1; k < keys.length; k++) {
    const [t1, v1] = keys[k] as [number, number];
    const [t0, v0] = keys[k - 1] as [number, number];
    if (t <= t1) return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return (keys[keys.length - 1] as [number, number])[1];
}

export function drawTime(layout: TimeLayout, diagram: Diagram, timeline: Timeline, ctx: Ctx, subs: Map<string, SubChange[]>): { base: string; lit: string; node: string; top: string } {
  const { m, ink } = ctx;
  const T = LOOK.time;
  const { axis } = layout;
  const passed = new Map((timeline.units ?? []).map((u) => [u.unit, u.passed]));
  const at = (step: number, event: number): number | undefined => timeline.events.find((t) => t.step === step && t.event === event)?.at;
  const drawnOf = (step: number, event: number): number | undefined => timeline.edges.find((t) => t.step === step && t.event === event)?.drawn;
  const base: string[] = [];
  const lit: string[] = [];
  const node: string[] = [];
  const top: string[] = [];
  const rowsTop = Math.min(...layout.rows.map((r) => r.y));
  const rowsBottom = Math.max(...layout.rows.map((r) => r.y + r.h));

  // 拡大の帯の箱へ、線が初めて届く時刻
  const arrivals = new Map<TimeBox, number>();
  for (const w of layout.wires) {
    const drawn = drawnOf(w.step, w.event);
    if (drawn !== undefined) arrivals.set(w.to, Math.min(arrivals.get(w.to) ?? Number.POSITIVE_INFINITY, drawn));
  }
  /** 印の列 `row` の目盛り `u` の印を塗る時刻。同じ名札の箱へ線が届くか、針が目盛りを過ぎるか、早い方 */
  const filled = (row: string, u: number): number | undefined => {
    const box = layout.zoom?.columns.find((c) => c.unit === u)?.boxes.find((b) => b.id === row);
    const times = [passed.get(u), box ? arrivals.get(box) : undefined].filter((t): t is number => t !== undefined);
    return times.length > 0 ? Math.min(...times) : undefined;
  };

  // 区切りの地。1 つおきに薄く塗る
  for (const p of layout.periods) if (p.index % 2 === 1) base.push(`<rect class="dg-tm-ep" x="${r1(p.x)}" y="${r1(rowsTop - T.shade)}" width="${r1(p.w)}" height="${r1(rowsBottom - rowsTop + T.shade * 2)}" rx="4"/>`);

  // 拡大の帯の列の区切りと上の字と箱
  if (layout.zoom) {
    const z = layout.zoom;
    z.columns.forEach((c, k) => {
      if (k > 0) base.push(`<line class="dg-tm-sep" x1="${r1(c.x)}" y1="${r1(c.y + T.sep)}" x2="${r1(c.x)}" y2="${r1(c.y + c.h - T.sep)}"/>`);
      base.push(write(ink, ja("dg-tm-hd", c.head), c.x + c.w / 2, z.headY, c.head, TYPE.timeHead, ALWAYS, "middle"));
      for (const box of c.boxes) node.push(columnBox(box, c.unit));
    });
  }

  function columnBox(box: TimeBox, unit: number): string {
    const on = [...new Set(layout.wires.filter((w) => w.from === box || w.to === box).map((w) => w.step))].sort((a, b) => a - b);
    const frame = (cls: string): string => `<rect class="${cls}" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${box.h}" rx="${LOOK.box.radius}"/>`;
    if (box.empty) {
      const shown = passed.get(unit);
      const word = layout.zoom?.empty ?? "";
      const mark = shown === undefined ? "" : `<g class="dg-a" style="${m.vis(shown)}">${frame("dg-tm-ex")}${write(ink, "dg-tm-ext", box.cx, box.cy + LOOK.baseline.mark, word, TYPE.emptyText, [[shown, Number.POSITIVE_INFINITY]], "middle")}</g>`;
      return `<g data-empty="${esc(box.id)}">${frame("dg-tm-ph")}${mark}</g>`;
    }
    const drawn = card(box, ctx, on, subs.get(box.id) ?? []);
    if (!box.row) return drawn;
    // 印の列と同じ名札の箱は、線が届くまで点線の枠で待つ
    const shown = filled(box.row, unit);
    if (shown === undefined) return frame("dg-tm-ph");
    return `<g class="dg-a" style="${m.until(shown)}">${frame("dg-tm-ph")}</g><g class="dg-popc dg-a" style="${m.pop(shown)}">${drawn}</g>`;
  }

  // 印。枠を初めから見せ、塗る時刻に塗り、色を変える出来事で色を重ねる
  for (const row of layout.rows) {
    const parts: string[] = [];
    for (const mark of layout.marks.filter((x) => x.row === row.id)) {
      const rect = (cls: string, extra = ""): string => `<rect class="${cls}" x="${r1(mark.x)}" y="${r1(mark.y)}" width="${r1(mark.w)}" height="${r1(mark.h)}" rx="${T.markRadius}"${extra}/>`;
      parts.push(rect("dg-tm-slot"));
      if (mark.empty) {
        const shown = passed.get(mark.unit);
        if (shown !== undefined) parts.push(`<circle class="dg-tm-x dg-a" cx="${r1(mark.x + mark.w / 2)}" cy="${r1(mark.y + mark.h / 2)}" r="${T.emptyR}" style="${m.vis(shown, m.last, { f: 0.2 })}"/>`);
        continue;
      }
      const shown = filled(row.id, mark.unit);
      if (shown !== undefined) parts.push(rect("dg-tm-m dg-a", ` style="${m.vis(shown, m.last, { f: 0.2 })}"`));
      mark.colors.forEach((c, k) => {
        const t = at(c.step, c.event);
        if (t === undefined) return;
        const next = mark.colors[k + 1];
        const until = next ? at(next.step, next.event) : undefined;
        parts.push(`<g style="${cs(c.color)}">${rect("dg-tm-m dg-a", ` style="${m.vis(t, until ?? m.last, { f: 0.35 })}"`)}</g>`);
      });
    }
    base.push(`<g data-row="${esc(row.id)}" style="${cs(row.color)}">${parts.join("")}</g>`);
    base.push(write(ink, "dg-tm-rn", LOOK.margin + LOOK.region.inset, row.y + row.h / 2 + LOOK.baseline.mark, row.name, TYPE.timeRow));
  }

  // 拡大した範囲の枠と点線。拡大した範囲に掛かる範囲の囲みが出る時に消す
  if (layout.zoom) {
    const z = layout.zoom;
    const hide = layout.spans
      .filter((s) => s.kind === "box" && s.from <= z.to && z.from <= s.to)
      .map((s) => at(s.step, s.event))
      .filter((t): t is number => t !== undefined)
      .sort((a, b) => a - b)[0];
    const guides = z.guides.map((g) => `<path class="dg-tm-gd" d="${pathOf(g)}"/>`).join("");
    const lens = `<rect class="dg-tm-fr" x="${r1(z.frame.x)}" y="${r1(z.frame.y)}" width="${r1(z.frame.w)}" height="${r1(z.frame.h)}" rx="4"/>${guides}`;
    base.push(hide === undefined ? lens : `<g class="dg-a" style="${m.until(hide)}">${lens}</g>`);
  }

  // 時刻の目盛りの線と字と区切り
  const x = (u: number): number => r1(axis.x + u * axis.unit);
  const majors = layout.ticks.map((t) => `M ${x(t.at)} ${r1(axis.line - T.major / 2)} V ${r1(axis.line + T.major / 2)}`);
  const minors = layout.minor.map((u) => `M ${x(u)} ${r1(axis.line - T.minor / 2)} V ${r1(axis.line + T.minor / 2)}`);
  base.push(`<path class="dg-tm-ax" d="M ${x(0)} ${r1(axis.line)} H ${x(axis.count)} ${[...majors, ...minors].join(" ")}"/>`);
  for (const t of layout.ticks) base.push(write(ink, ja("dg-tm-tk", t.text), t.left, t.y, t.text, TYPE.timeTick));
  for (const p of layout.periods) {
    base.push(write(ink, ja("dg-tm-en", p.name), p.x + p.w / 2, p.nameY, p.name, TYPE.timePeriod, ALWAYS, "middle"));
    base.push(write(ink, ja("dg-tm-er", p.range), p.x + p.w / 2, p.rangeY, p.range, TYPE.timeRange, ALWAYS, "middle"));
  }

  // 範囲の括弧と囲み
  for (const span of layout.spans) {
    const a = at(span.step, span.event);
    if (a === undefined) continue;
    const until = span.until === undefined ? undefined : (timeline.steps[span.until] as Span).start;
    const shown: Shown[] = [[a, until ?? Number.POSITIVE_INFINITY]];
    const vis = until === undefined ? m.vis(a) : m.vis(a, until, { within: true });
    if (span.kind === "bracket") {
      const [x0, x1, y0, y1] = [r1(span.x + 1), r1(span.x + span.w - 1), r1(span.y), r1(span.y + span.h)];
      const words = write(ink, ja("dg-tm-bt", span.text), span.textRect.x + span.textRect.w / 2, span.textY, span.text, TYPE.spanText, shown, "middle");
      base.push(`<g class="dg-a" data-span="${span.step}" style="${cs(span.color)};${vis}"><path class="dg-tm-br" d="M ${x0} ${y0} L ${x0} ${y1} L ${x1} ${y1} L ${x1} ${y0}"/>${words}</g>`);
      continue;
    }
    base.push(`<g class="dg-a" data-span="${span.step}" style="${cs(span.color)};${vis}"><rect class="dg-tm-bx" x="${r1(span.x)}" y="${r1(span.y)}" width="${r1(span.w)}" height="${r1(span.h)}" rx="6"/></g>`);
    const tag = span.textRect;
    ink.push({ text: span.text, rect: tag, shown, boxed: true });
    top.push(
      `<g class="dg-tg dg-popc dg-a" style="${cs(span.color)};${until === undefined ? m.pop(a) : m.pop(a, until)}"><rect x="${r1(tag.x)}" y="${r1(tag.y)}" width="${r1(tag.w)}" height="${tag.h}" rx="${tag.h / 2}"/><text x="${r1(tag.x + tag.w / 2)}" y="${r1(span.textY)}" text-anchor="middle">${esc(span.text)}</text></g>`,
    );
  }

  // 節目。点線の丸で待ち、状態を変えるたびに色の丸を弾ませ、状態の字を書き換える
  const P = T.point;
  for (const point of layout.points) {
    const { cx, cy, r } = point;
    const times = point.changes.map((c) => at(c.step, c.event) ?? Number.POSITIVE_INFINITY);
    const first = times[0];
    base.push(`<path class="dg-tm-con" d="M ${r1(cx)} ${r1(rowsBottom + 3)} L ${r1(cx)} ${r1(cy - r - 2)}"/>`);
    const tx = point.text.x;
    const name = write(ink, ja("dg-tm-pn", point.id), tx, cy + P.nameY, point.id, TYPE.pointName);
    const grey = name.replace(/class="([^"]*)"/u, 'class="$1 dg-tm-pn-g"');
    const label = first === undefined || !Number.isFinite(first) ? grey : `<g class="dg-a" style="${m.until(first)}">${grey}</g><g class="dg-a" style="${m.vis(first)}">${name}</g>`;
    const states = point.changes
      .map((c, k) => {
        const t = times[k] as number;
        if (!Number.isFinite(t)) return "";
        const next = times[k + 1];
        const end = next !== undefined && Number.isFinite(next) ? next - MOTION.untilFade : undefined;
        const words = write(ink, ja("dg-tm-ps", c.text), tx, cy + P.stateY, c.text, TYPE.pointState, [[t, end ?? Number.POSITIVE_INFINITY]]);
        return `<g class="dg-a" style="${cs(c.color ?? "slate")};${end === undefined ? m.rise(t) : m.rise(t, end)}">${words}</g>`;
      })
      .join("");
    const rings = point.changes
      .map((c, k) => {
        const t = times[k] as number;
        if (!c.color || !Number.isFinite(t)) return "";
        return `<g class="dg-popc dg-a" style="${cs(c.color)};${m.pop(t)}"><circle class="dg-tm-pc" cx="${r1(cx)}" cy="${r1(cy)}" r="${r + 0.5}"/>${glyph("flag", cx, cy, P.glyph, "dg-tm-pcg")}</g>`;
      })
      .join("");
    node.push(`<g data-point="${esc(point.id)}"><circle class="dg-tm-pg" cx="${r1(cx)}" cy="${r1(cy)}" r="${r}"/>${glyph("flag", cx, cy, P.glyph, "dg-tm-pgl")}${rings}${label}${states}</g>`);
  }

  // 節目どうしの線。引いた後も残す
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
    lit.push(`<g data-link="${esc(`${e.from}->${e.to}`)}" style="${cs(e.color)}"><path class="dg-tm-ln dg-a" pathLength="1" d="${pathOf(e.points)}" style="${kf}"/><path class="dg-eh-on dg-a" d="${arrowHead(e.points)}" style="${head}"/></g>`);
  }

  // 針。時刻の表の針の動きを辿り、繰り返す前に左端へ戻る
  const keys = timeline.needle ?? [];
  const moved = simplify(keys.filter(([t]) => t < m.total));
  const end = moved[moved.length - 1]?.[1] ?? 0;
  const path: [number, number, number][] = [...moved.map(([t, u]): [number, number, number] => [t, axis.x + u * axis.unit, 0]), [m.last, axis.x + end * axis.unit, 0], [m.total, axis.x, 0]];
  const { y1, y2 } = layout.needle;
  const N = T.needle;
  top.push(
    `<g class="dg-a" data-needle="" style="${m.move(path)}"><line class="dg-tm-nd" x1="0" y1="${r1(y1)}" x2="0" y2="${r1(y2)}"/><path class="dg-tm-nh" d="M ${-N.head * 0.75} ${r1(y1 - N.head)} L ${N.head * 0.75} ${r1(y1 - N.head)} L 0 ${r1(y1)} Z"/><circle class="dg-tm-nh" cy="${r1(axis.line)}" r="${N.dot}"/></g>`,
  );
  return { base: base.join(""), lit: lit.join(""), node: node.join(""), top: top.join("") };
}

/** 中身の帯の物差しの欄 (#3165)。棒を満ち具合の動きで伸ばし、`line` の割合の所に線の印と字を置く */
export function meterField(field: { x: number; y: number; meter: { line: number; text: string; x: number; w: number } }, keys: [number, number][], ctx: Ctx): string {
  const { m } = ctx;
  const M = LOOK.time.meter;
  const { x, w, line, text } = field.meter;
  const y = field.y + M.y;
  const kf = m.kf([
    ...simplify(keys).map(([t, v]): [number, Record<string, string>] => [t, { transform: `scaleX(${r1(v * 1000) / 1000})` }]),
    [m.last, { transform: `scaleX(${r1(valueAt(keys, m.last) * 1000) / 1000})` }, EASE.inOut],
    [m.total, { transform: "scaleX(0)" }],
  ]);
  const lx = x + w * line;
  return (
    `<rect class="dg-tm-mt" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${M.h}" rx="${M.h / 2}"/>` +
    `<rect class="dg-tm-mf dg-a" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${M.h}" rx="${M.h / 2}" style="${cs(M.color)};${kf}"/>` +
    `<line class="dg-tm-mk" x1="${r1(lx)}" y1="${r1(y - M.mark)}" x2="${r1(lx)}" y2="${r1(y + M.h + M.mark)}"/>` +
    write(ctx.ink, "dg-tm-ml", lx, field.y + M.textY, text, TYPE.meterLine, ALWAYS, "middle")
  );
}

/** 時間軸の図で、寄って追う窓が段の終わりに見せる所。針と印の列を必ず入れ、段の番号と段で動く物を窓に収まる間だけ足す */
export function timeFocus(layout: TimeLayout, timeline: Timeline, step: number, parts: { x: number; y: number; w: number; h: number }[], vw: number, vh: number): { x: number; y: number; w: number; h: number } {
  const span = timeline.steps[step] as Span;
  const position = valueAt(timeline.needle ?? [], span.end - MOTION.still);
  const nx = layout.axis.x + position * layout.axis.unit;
  const top = Math.min(...layout.rows.map((r) => r.y));
  const bottom = Math.max(...layout.rows.map((r) => r.y + r.h));
  let held = { x: nx - 1, y: top, w: 2, h: bottom - top };
  const badge = layout.badges.find((b) => b.step === step);
  const near = (p: { x: number; y: number; w: number; h: number }): number => Math.hypot(Math.max(0, p.x - nx, nx - p.x - p.w), Math.max(0, p.y - top, top - p.y - p.h));
  const extra = [...(badge ? [{ x: badge.x - LOOK.badge.r, y: badge.y - LOOK.badge.r, w: LOOK.badge.r * 2, h: LOOK.badge.r * 2 }] : []), ...[...parts].sort((a, b) => near(a) - near(b))];
  for (const p of extra) {
    const x = Math.min(held.x, p.x);
    const y = Math.min(held.y, p.y);
    const next = { x, y, w: Math.max(held.x + held.w, p.x + p.w) - x, h: Math.max(held.y + held.h, p.y + p.h) - y };
    if (next.w <= vw && next.h <= vh) held = next;
  }
  return held;
}

