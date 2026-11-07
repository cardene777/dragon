/**
 * 記録の列の描き方 (#3441)。
 *
 * 記録は新しい方から 3 つを左から古い順に並べ、記録が足されると左へ滑り、古い記録は消えて畳んだ印に数える。
 * 狭い枠で縦に組んだ形は上から古い順に積み、記録が足されると上へ滑る。機械の列と違って、記録の間につながりを引かない。
 * 記録の中の字は番号と、`all` を書いた記録の列の印と、中のチップの名前と欄の値の行だけで、prev と hash と SHA-256 を出さない。
 * 印と欄の値は、書き換えた段から新しい値に替わる。印は `yes` の印を部品の色、`no` の印を橙で出す。
 * 網の節の関門で止まった記録 (#3476) は、印の札に再試行できるかの印 (再試行できるは橙、直して送り直すは止まった色) を出し、
 * チップの行の下に止まった節の行とエラーの名前の行を分けて止まった色で出す (#3478)。
 * この file は試す図を描く部品 (`render/try.ts`) だけが読み、見本帳を開いた時に読む塊に入れない。
 */
import { recordKey, type TryLogPlaced, type TryMoment } from "../../kinds/try/layout";
import { hasWide, textBox } from "../../layout/measure";
import { TRY_LOOK } from "../../look/try";
import { LOOK, TYPE } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { esc, r1, sansOf, write } from "../../render/parts";
import type { TryKit, TryWindow } from "../../render/try";
import { cs } from "../color/draw";

const T = TRY_LOOK;
const B = T.block;
const C = T.chip;

/** 記録の列ごとの題と、記録と畳んだ印 */
export function logRows(k: TryKit): void {
  const { layout, title, base, node } = k;
  for (const log of layout.logs ?? []) {
    base.push(`<g data-part="${esc(log.id)}" style="${cs(T.color.part)}">${title(log.title)}</g>`);
    node.push(drawLog(k, log));
  }
}

/** 記録の列 1 つ。記録は左上を原点に描いて出来事ごとの位置へ動かす */
function drawLog(k: TryKit, log: TryLogPlaced): string {
  const { ctx, layout, diagram, moments, windows, spanOf, track, phasesOf, shownKf, phased, record, cls } = k;
  const { m } = ctx;
  const part = diagram.try?.parts.find((p) => p.type === "log" && p.id === log.id);
  const all = part?.type === "log" ? part.all : undefined;
  const numbers = [
    ...new Set(moments.flatMap((mo) => (mo.state.logs?.[log.id] ?? []).map((r) => r.number))),
  ].sort((a, b) => a - b);
  const recordOf = (mo: TryMoment, n: number) =>
    (mo.state.logs?.[log.id] ?? []).find((r) => r.number === n);
  const pitch = C.h + C.gap;
  const baseline = C.h / 2 + LOOK.baseline.tag;
  const rowW = log.w - B.padX * 2;

  const records = numbers.map((n) => {
    const moved = track(moments.map((mo) => mo.records?.[recordKey(log.id, n)] ?? null));
    const box = { x: 0, y: 0, w: log.w, h: log.h };
    const frame = frameShape(
      ctx.corner,
      ` class="dg-try-blk" ${ctx.sh}`,
      box,
      `<rect class="dg-try-blk" width="${r1(log.w)}" height="${r1(log.h)}" rx="${B.radius}" ${ctx.sh}/>`,
    );
    const loggedAt = moments.findIndex((mo) => mo.logged?.log === log.id && mo.logged.number === n);
    const ring =
      loggedAt < 0
        ? ""
        : `<g class="dg-a" style="${m.vis((windows[loggedAt] as TryWindow).b, spanOf(moments[loggedAt]?.step ?? 0).end)}">${frameShape(ctx.corner, ' class="dg-halo"', box, `<rect class="dg-halo" width="${r1(log.w)}" height="${r1(log.h)}" rx="${B.radius}"/>`)}${frameShape(ctx.corner, ' class="dg-on"', box, `<rect class="dg-on" width="${r1(log.w)}" height="${r1(log.h)}" rx="${B.radius}"/>`)}</g>`;
    const label = log.labels[n] ?? String(n);
    const noY = log.noBaseline - log.top;
    const no = write(undefined, cls("dg-try-no", label), B.padX, noY, label, TYPE.tryBlockNo);
    record(label, hasWide(label) ? sansOf(TYPE.tryBlockNo) : TYPE.tryBlockNo, moved.rests, B.padX, noY);

    // 印の札。印が替わる時刻で区切り、yes の印と no の印で色を替える。関門で止まった記録は再試行できるかの印を出す (#3476)
    let mark = "";
    const markW = log.mark;
    const stop = log.stops?.[n];
    if ((all || stop) && markW !== undefined) {
      const marks = moments.map((mo) => (all ? (recordOf(mo, n)?.mark ?? "") : recordOf(mo, n) && stop ? stop.mark : ""));
      const phases = phasesOf(marks).filter((p) => p.value !== "");
      const x = log.w - B.padX - markW;
      const y = log.markY - log.top;
      const rect = { x, y, w: markW, h: T.fold.h };
      const textY = y + T.fold.h / 2 + LOOK.baseline.tag;
      const kinds = [...new Set(phases.map((p) => p.value))];
      mark = kinds
        .map((kind) => {
          const ranges: Shown[] = phases.filter((p) => p.value === kind).map((p) => [p.from, p.to]);
          const color = all ? (kind === all.yes ? T.color.part : T.color.broken) : stop?.retry ? T.color.broken : T.color.stop;
          const style = hasWide(kind) ? sansOf(TYPE.tryChipValue) : TYPE.tryChipValue;
          for (const [from, to] of ranges)
            record(kind, style, moved.rests, x + markW / 2, textY, "middle", [from, to]);
          const anim = kinds.length > 1 ? ` class="dg-a" style="${cs(color)};${shownKf(ranges)}"` : ` style="${cs(color)}"`;
          return (
            `<g data-mark="${esc(kind)}"${anim}>` +
            frameShape(ctx.corner, ' class="dg-try-mb"', rect, `<rect class="dg-try-mb" x="${r1(x)}" y="${r1(y)}" width="${r1(markW)}" height="${T.fold.h}" rx="${partRadius(ctx.corner, C.radius)}"/>`) +
            `<text class="${cls("dg-try-mk", kind)}" x="${r1(x + markW / 2)}" y="${r1(textY)}" text-anchor="middle">${esc(kind)}</text></g>`
          );
        })
        .join("");
    }

    // 中のチップの行。名前を左に、欄の値を右に出す。記録の中身は作った後に変わらず、欄の値だけが書き換えで替わる
    const items = recordOf(moments.find((mo) => recordOf(mo, n)) ?? (moments[0] as TryMoment), n)?.items ?? [];
    const rows = items
      .map((id, i) => {
        const y = log.rowTop - log.top + i * pitch;
        const name = layout.names[id] ?? id;
        const nameStyle = hasWide(name) ? sansOf(TYPE.tryChip) : TYPE.tryChip;
        const nameText = write(undefined, cls("dg-try-cn", name), B.padX + C.padX, y + baseline, name, TYPE.tryChip);
        record(name, nameStyle, moved.rests, B.padX + C.padX, y + baseline);
        const field = log.field;
        const values = field === undefined ? [] : moments.map((mo) => mo.state.items[id]?.[field] ?? "");
        const valueX = log.w - B.padX - C.padX;
        const valueText = field === undefined ? "" : phased(values, valueX, y + baseline, cls("dg-try-cv", values.join("")), "end");
        for (const p of phasesOf(values)) {
          const style = hasWide(p.value) ? sansOf(TYPE.tryChipValue) : TYPE.tryChipValue;
          record(p.value, style, moved.rests, valueX - textBox(p.value, 0, 0, style).w, y + baseline, "start", [p.from, p.to]);
        }
        return `<g data-item="${esc(id)}"><rect class="dg-try-row" x="${B.padX}" y="${r1(y)}" width="${r1(rowW)}" height="${C.h}" rx="${partRadius(ctx.corner, C.radius)}"/>${nameText}${valueText}</g>`;
      })
      .join("");
    // 関門で止まった記録の、止まった節の行とエラーの名前の行。チップの行の下に 1 行ずつ分けて止まった色で出す (#3476、#3478)
    const stopRows = stop
      ? `<g style="${cs(T.color.stop)}">${[
          { text: stop.at, base: "dg-try-cn", style: TYPE.tryChip },
          { text: stop.error, base: "dg-try-cv", style: TYPE.tryChipValue },
        ]
          .map(({ text, base, style }, k) => {
            const y = log.rowTop - log.top + (items.length + k) * pitch;
            record(text, hasWide(text) ? sansOf(style) : style, moved.rests, B.padX + C.padX, y + baseline);
            return `<rect class="dg-try-hrow" x="${B.padX}" y="${r1(y)}" width="${r1(rowW)}" height="${C.h}" rx="${partRadius(ctx.corner, C.radius)}"/>${write(undefined, cls(base, text), B.padX + C.padX, y + baseline, text, style)}`;
          })
          .join("")}</g>`
      : "";
    return `<g class="dg-a" data-record="${n}" style="${moved.style}">${frame}${ring}${no}${mark}${rows}${stopRows}</g>`;
  });

  // 畳んだ印。畳んだ数ごとに字を替え、畳んだ記録が無い間は出さない
  const counts = moments.map((mo) => (mo.state.logs?.[log.id] ?? []).filter((r) => !r.shown).length);
  const foldPhases = phasesOf(counts).filter((p) => p.value > 0);
  const fold =
    foldPhases.length === 0
      ? ""
      : `<g data-fold="${esc(log.id)}">${foldPhases
          .map((p) => {
            const text = log.folds[p.value] ?? String(p.value);
            const style = hasWide(text) ? sansOf(TYPE.tryHint) : TYPE.tryHint;
            const w = textBox(text, 0, 0, style).w + T.fold.padX * 2;
            const x = log.fold.right - w;
            const rect = { x, y: log.fold.y, w, h: T.fold.h };
            const label = write(ctx.ink, cls("dg-try-ft", text), x + T.fold.padX, log.fold.y + T.fold.h / 2 + LOOK.baseline.tag, text, style, [[p.from, p.to]]);
            return `<g class="dg-a" style="${shownKf([[p.from, p.to]])}">${frameShape(ctx.corner, ' class="dg-try-fold"', rect, `<rect class="dg-try-fold" x="${r1(x)}" y="${r1(rect.y)}" width="${r1(w)}" height="${T.fold.h}" rx="${partRadius(ctx.corner, C.radius)}"/>`)}${label}</g>`;
          })
          .join("")}</g>`;
  return `<g data-log="${esc(log.id)}" style="${cs(T.color.part)}">${records.join("")}${fold}</g>`;
}
