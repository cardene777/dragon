/**
 * 表と結びの線と式の札の描き方 (#3618)。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 表は影を落とした札に、色の役を薄く混ぜた見出しと、項目の行を重ねる。行は左に鍵と結びの印 (PK と FK)、真ん中に項目の名前、右に値を書く。
 * 行を選ぶ段 (`pick`) は、その行の地をその段の間だけ表の色で塗り、表の枠を太く光らせる。表の枠は最初に行を選んだ段から後も細く色を残す。
 * 値を書き換える段 (`set`) は、行の値をその段から新しい値に替え、替えた値を表の色で書く。値は 1 つの値ごとに 1 つの部品 (`data-value`) にまとめる。
 * 結びの線は細い灰の線で引き、何件もの側の端に三つ叉、1 件の側の端に縦の棒を置く。段の中の線の札が走ると、線はその段から受ける側の表の色で光り、
 * 後の段でも光ったまま残る。札が走る段の間は、線を太く描く。
 * 式の札 (`note`) は、書いた段から表の真下に出して後の段も残し、上の表へ矢じりを向ける。最後の段の絵にも、値をどう出したかが残る。
 * 字は描いた所と見えている間を字の記録 (`ink`) に、結びの線は線の記録 (`traces`) に残し、`dragon check --layout` が字の重なりと線の崩れを数える。
 * この file は表どうしの関係の図を描く部品 (`render/er.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { type ErLayout, type ErLink, type ErNote, type ErTableBox, ER_MARKS, erMarksOf, erMarkWidth, erNoteStyle, erValueStyle } from "../../kinds/er/layout";
import { textBox, textWidth } from "../../layout/measure";
import type { Point, Rect } from "../../layout/scene";
import { ER_LOOK, ER_TYPE } from "../../look/er";
import { type Corner, EASE, LOOK, MOTION, type TextStyle } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import { ALWAYS, type Shown } from "../../render/ink";
import type { Frame } from "../../render/motion";
import { type Ctx, esc, r1 } from "../../render/parts";
import type { DiagramModel } from "../../schema";
import { cs } from "../color/draw";

/** 字の基準線。字の四角の真ん中を `cy` に置く (`layout/measure.ts` の `textBox` と同じ字の高さで測る) */
const baseline = (cy: number, style: TextStyle): number => cy + style.size * 0.3;

/** 時刻の範囲を、間が消える長さより短い範囲どうしで 1 つにまとめる。続く段で同じ物を光らせる時に、間で消えて点滅しないため */
function merged(ranges: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const [a, b] of [...ranges].sort((p, q) => p[0] - q[0])) {
    const last = out.at(-1);
    if (last && a <= last[1] + MOTION.fade + 1e-6) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/** 時刻の範囲の間だけ出る。範囲の始まりで出始め、範囲の終わりまで出たまま、終わってから消える */
function spans(ctx: Ctx, ranges: [number, number][]): string {
  const { m } = ctx;
  const f = MOTION.fade;
  const pts: Frame[] = [[0, { opacity: 0 }]];
  for (const [a, b] of merged(ranges)) pts.push([a, { opacity: 0 }, EASE.out], [a + f, { opacity: 1 }], [b, { opacity: 1 }, EASE.inOut], [Math.min(b + f, m.total), { opacity: 0 }]);
  pts.push([m.total, { opacity: 0 }]);
  return m.kf(pts);
}

/** 段 `s` の出来事 `k` が起きる時刻。時刻の表に無ければ段の始まり */
const eventAt = (ctx: Ctx, s: number, k: number): number => ctx.t.events.find((t) => t.step === s && t.event === k)?.at ?? ctx.t.steps[s]?.start ?? 0;
const stepEnd = (ctx: Ctx, s: number): number => ctx.t.steps[s]?.end ?? ctx.end;

/** 字を 1 つ書き、字の四角と見えている間を、表か札の枠と一緒に字の記録に残す */
function text(ctx: Ctx, cls: string, x: number, y: number, value: string, style: TextStyle, frame: { name: string; rect: Rect }, shown: Shown[] = ALWAYS, anchor?: "middle", boxed?: true): string {
  ctx.ink.push({ text: value, rect: textBox(value, x, y, style, anchor), shown, frame, ...(boxed ? { boxed } : {}) });
  return `<text class="${cls}" x="${r1(x)}" y="${r1(y)}"${anchor ? ` text-anchor="${anchor}"` : ""}>${esc(value)}</text>`;
}

/** 見出しの地。表の上の角の形 (丸めた角か、右上を落とした角) に沿わせる */
function headShape(corner: Corner, t: ErTableBox): string {
  const h = ER_LOOK.table.headH;
  const { x, y, w } = t;
  if (corner === "cut") {
    const c = Math.min(LOOK.corner.cut, w / 4, t.h / 4);
    return `<path class="dg-er-head" d="M${r1(x)} ${r1(y + h)}V${r1(y)}H${r1(x + w - c)}L${r1(x + w)} ${r1(y + c)}V${r1(y + h)}Z"/>`;
  }
  const r = ER_LOOK.table.radius;
  return `<path class="dg-er-head" d="M${r1(x)} ${r1(y + h)}V${r1(y + r)}A${r} ${r} 0 0 1 ${r1(x + r)} ${r1(y)}H${r1(x + w - r)}A${r} ${r} 0 0 1 ${r1(x + w)} ${r1(y + r)}V${r1(y + h)}Z"/>`;
}

/** 表の枠の形。`cls` は枠の class */
const outline = (corner: Corner, t: Rect, cls: string, extra = ""): string =>
  frameShape(corner, ` class="${cls}"${extra}`, t, `<rect class="${cls}" x="${r1(t.x)}" y="${r1(t.y)}" width="${r1(t.w)}" height="${r1(t.h)}" rx="${ER_LOOK.table.radius}"${extra}/>`);

/** 表 1 つ。札と見出しと行と、選んだ段の枠 */
function drawTable(t: ErTableBox, diagram: DiagramModel, ctx: Ctx): string {
  const T = ER_LOOK.table;
  const M = ER_LOOK.mark;
  const frame = { name: t.name, rect: t as Rect };
  const source = diagram.er?.tables.find((s) => s.id === t.id);
  const parts: string[] = [outline(ctx.corner, t, "dg-st", ` ${ctx.sh}`), headShape(ctx.corner, t)];
  parts.push(`<path class="dg-er-sep" d="M${r1(t.x)} ${r1(t.y + T.headH)}H${r1(t.x + t.w)}"/>`);
  parts.push(text(ctx, "dg-er-t", t.x + T.padX, baseline(t.y + T.headH / 2, ER_TYPE.title), t.name, ER_TYPE.title, frame));
  // 行を選んだ段と、項目ごとの値の書き換え
  const picks = new Map<string, [number, number][]>();
  const cells = new Map<string, { at: number; value: string }[]>();
  diagram.steps.forEach((step, s) =>
    step.events.forEach((e, k) => {
      if (e.type === "lookup" && e.field.startsWith(`${t.id}.`)) picks.set(e.field, [...(picks.get(e.field) ?? []), [eventAt(ctx, s, k), stepEnd(ctx, s)]]);
      if (e.type === "cell" && e.field.startsWith(`${t.id}.`)) cells.set(e.field, [...(cells.get(e.field) ?? []), { at: eventAt(ctx, s, k), value: e.value }]);
    }),
  );
  t.rows.forEach((row, k) => {
    const field = source?.fields[k];
    if (!field) return;
    const ref = `${t.id}.${row.field}`;
    const out: string[] = [];
    const lit = picks.get(ref);
    if (lit) {
      const inset = T.pickInset;
      out.push(`<rect class="dg-er-pick dg-a" style="${spans(ctx, lit)}" x="${r1(row.x + inset)}" y="${r1(row.y + 1)}" width="${r1(row.w - inset * 2)}" height="${r1(row.h - 2)}" rx="${partRadius(ctx.corner, T.pickRadius)}"/>`);
    }
    if (k > 0) out.push(`<path class="dg-er-sep" d="M${r1(t.x + T.padX)} ${r1(row.y)}H${r1(t.x + t.w - T.padX)}"/>`);
    // 鍵と結びの印
    let mx = t.markX;
    for (const mark of erMarksOf(field)) {
      const w = erMarkWidth(mark);
      const y = row.cy - M.h / 2;
      out.push(
        `<g data-mark="${mark}"><rect class="dg-er-mk" x="${r1(mx)}" y="${r1(y)}" width="${r1(w)}" height="${M.h}" rx="${partRadius(ctx.corner, M.radius)}"/>` +
          `${text(ctx, "dg-er-mkt", mx + w / 2, baseline(row.cy, ER_TYPE.mark), ER_MARKS[mark], ER_TYPE.mark, frame, ALWAYS, "middle", true)}</g>`,
      );
      mx += w + M.gap;
    }
    out.push(text(ctx, "dg-er-f", t.nameX, baseline(row.cy, ER_TYPE.field), row.field, ER_TYPE.field, frame));
    // 値は右に揃える。書き換えた値は、書き換えた段から次に書き換える段まで出す
    const changes = cells.get(ref) ?? [];
    const valueAt = (value: string, cls: string, shown: Shown[], style?: string): string => {
      const s = erValueStyle(value);
      const x = t.valueX - textWidth(value, s);
      const wide = s === ER_TYPE.valueJa ? " dg-er-vj" : "";
      return `<g data-value="${esc(ref)}"${style ? ` class="dg-a" style="${style}"` : ""}>${text(ctx, `${cls}${wide}`, x, baseline(row.cy, s), value, s, frame, shown)}</g>`;
    };
    const first = changes[0];
    out.push(first ? valueAt(field.value, "dg-er-v", [[0, first.at]], ctx.m.until(first.at)) : valueAt(field.value, "dg-er-v", ALWAYS));
    changes.forEach((c, i) => {
      const next = changes[i + 1]?.at;
      out.push(valueAt(c.value, "dg-er-v dg-er-vc", [[c.at, next ?? Number.POSITIVE_INFINITY]], ctx.m.vis(c.at, next ?? ctx.m.last)));
    });
    parts.push(`<g data-row="${esc(ref)}">${out.join("")}</g>`);
  });
  // 行を選んだ段は表の枠を太く光らせ、最初に選んだ段から後も細く色を残す
  const now = [...picks.values()].flat();
  if (now.length > 0) {
    const since = Math.min(...now.map(([a]) => a));
    parts.push(`<g class="dg-er-lit dg-a" style="${ctx.m.vis(since)}">${outline(ctx.corner, t, "dg-er-frame")}</g>`);
    parts.push(`<g class="dg-er-now dg-a" style="${spans(ctx, now)}">${outline(ctx.corner, t, "dg-er-frame")}</g>`);
  }
  return `<g data-table="${esc(t.id)}" style="${cs(t.color)}">${parts.join("")}</g>`;
}

/** 線の端の印。`at` は表の縁の所、`dir` は線が縁から出ていく向き */
function endMark(kind: "many" | "one", at: Point, dir: 1 | -1): string {
  const E = ER_LOOK.end;
  const [x, y] = at;
  if (kind === "one") {
    const bx = x + dir * E.bar;
    return `<path data-end="one" d="M${r1(bx)} ${r1(y - E.barHalf)}V${r1(y + E.barHalf)}"/>`;
  }
  const root = x + dir * E.fork;
  return `<path data-end="many" d="M${r1(root)} ${r1(y)}L${r1(x)} ${r1(y - E.spread)}M${r1(root)} ${r1(y)}L${r1(x)} ${r1(y)}M${r1(root)} ${r1(y)}L${r1(x)} ${r1(y + E.spread)}"/>`;
}

const pathOf = (points: Point[]): string => points.map(([x, y], k) => `${k === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`).join("");

/** 結びの線 1 本。灰の線と端の印、光った線、札が走る段の太い線の順に重ねる */
function drawLink(link: ErLink, layout: ErLayout, ctx: Ctx): string {
  const { m, t } = ctx;
  ctx.traces.push({ from: link.from, to: link.to, points: link.points, shown: ALWAYS });
  const d = pathOf(link.points);
  const first = link.points[0] as Point;
  const last = link.points[link.points.length - 1] as Point;
  const ends = `${endMark("many", first, link.manyDir)}${endMark("one", last, link.oneDir)}`;
  const runs = layout.edges.flatMap((e) => {
    if (!((e.from === link.from && e.to === link.to) || (e.from === link.to && e.to === link.from))) return [];
    const time = t.edges.find((x) => x.step === e.step && x.event === e.event);
    const span = t.steps[e.step];
    return time && span ? [{ start: time.start, end: span.end, color: e.color }] : [];
  });
  const lit = runs[0]
    ? `<g class="dg-er-lit-ln dg-a" style="${cs(runs[0].color)};${m.vis(runs[0].start)}"><path d="${d}"/>${ends}</g>` +
      runs.map((run) => `<g class="dg-er-run dg-a" style="${cs(run.color)};${m.vis(run.start, run.end, { within: true })}"><path d="${d}"/></g>`).join("")
    : "";
  return `<g data-link="${esc(link.from)}>${esc(link.to)}"><g class="dg-er-ln"><path d="${d}"/>${ends}</g>${lit}</g>`;
}

/** 式の札 1 枚。書いた段から最後まで出し、表に一番近い札は上の表へ矢じりを向ける */
function drawNote(note: ErNote, ctx: Ctx): string {
  const N = ER_LOOK.note;
  const frame = { name: note.caption, rect: note as Rect };
  const at = eventAt(ctx, note.step, note.event);
  const shown: Shown[] = [[at, Number.POSITIVE_INFINITY]];
  const [ax, ay] = note.anchor;
  const arrow = !note.arrow
    ? ""
    : `<path class="dg-er-arrow" d="M${r1(ax)} ${r1(note.y)}V${r1(ay + 1)}M${r1(ax - N.half)} ${r1(ay + N.head)}L${r1(ax)} ${r1(ay + 1)}L${r1(ax + N.half)} ${r1(ay + N.head)}"/>`;
  const card = frameShape(
    ctx.corner,
    ` class="dg-er-note" ${ctx.sh}`,
    note,
    `<rect class="dg-er-note" x="${r1(note.x)}" y="${r1(note.y)}" width="${r1(note.w)}" height="${r1(note.h)}" rx="${ER_LOOK.table.radius}" ${ctx.sh}/>`,
  );
  const style = erNoteStyle(note.text);
  const cx = note.x + note.w / 2;
  const caption = text(ctx, "dg-er-nc", cx, note.y + N.captionY, note.caption, ER_TYPE.caption, frame, shown, "middle");
  const body = text(ctx, `dg-er-nt${style === ER_TYPE.noteJa ? " dg-er-ntj" : ""}`, cx, note.y + N.textY, note.text, style, frame, shown, "middle");
  return `<g data-note="${esc(note.field)}" class="dg-a" style="${cs(note.color)};${ctx.m.vis(at)}">${arrow}${card}${caption}${body}</g>`;
}

/** 結びの線を全て描く。表の下に描き、線の端を表の縁で止める */
export const drawLinks = (layout: ErLayout, ctx: Ctx): string => layout.links.map((link) => drawLink(link, layout, ctx)).join("");

/** 表を全て描く */
export const drawTables = (layout: ErLayout, diagram: DiagramModel, ctx: Ctx): string => layout.tables.map((t) => drawTable(t, diagram, ctx)).join("");

/** 式の札を全て描く */
export const drawNotes = (layout: ErLayout, ctx: Ctx): string => layout.notes.map((note) => drawNote(note, ctx)).join("");
