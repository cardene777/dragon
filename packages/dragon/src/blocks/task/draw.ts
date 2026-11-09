/**
 * 作業の棒の描き方 (#3562)。
 *
 * 棒は作業の色を薄く混ぜた地と作業の色の縁で初めから見せ、針が通った分を作業の色で濃く塗る。
 * 濃く塗る所は棒の角の丸みで切り抜き、時刻の表の割合の動き (`timeline.tasks`) で左から伸ばす。繰り返す前に針と共に左端へ戻る。
 * 作業の名前は印の列の名前と同じく行の左に書く。期間の字は棒の中なら、濃く塗る所が字の真ん中に届いた時に塗った地の上の字の色へ替え、
 * 棒の外 (右か、軸の右端の近くでは左) なら作業の字の色のまま書く。期間の字は時間軸の囲みの枠の内に収める部品として記録する。
 * 見た目の規則は作業を持つ図の SVG にだけ書く (`TASK_CSS`)。作業を持たない時間軸の図の SVG を変えないため。
 * この file は時間軸の図を描く部品 (`render/time.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { EASE, LOOK, MOTION, TYPE } from "../../look/values";
import { partRadius } from "../../render/corner";
import { ALWAYS } from "../../render/ink";
import { cssFont, cssMix, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { frame, simplify, type TimeKit, valueAt } from "../scale/draw";

/** 作業の棒の見た目。作業を持つ時間軸の図の SVG にだけ書く */
export const TASK_CSS = [
  `.dg-tm-tb{fill:${cssMix(LOOK.mix.timeTask)};stroke:var(--c);stroke-width:${LOOK.stroke.timeTask}}`,
  ".dg-tm-tf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",
  `.dg-tm-tt{${cssFont(TYPE.timeTask)};fill:var(--ct)}`,
].join("");

/** 真っ直ぐ変わる動き `keys` が初めて `share` に届く時刻。届かなければ `undefined` */
function reachAt(keys: [number, number][], share: number): number | undefined {
  for (let k = 1; k < keys.length; k++) {
    const [t0, v0] = keys[k - 1] as [number, number];
    const [t1, v1] = keys[k] as [number, number];
    if (v0 < share && v1 >= share) return t0 + ((t1 - t0) * (share - v0)) / (v1 - v0);
  }
  return (keys[0]?.[1] ?? 0) >= share ? 0 : undefined;
}

/** 作業ごとの行の名前と、棒と、期間の字 */
export function taskBars(k: TimeKit): void {
  const T = LOOK.time.task;
  const { layout, timeline, ctx } = k;
  const { m, ink } = ctx;
  (layout.tasks ?? []).forEach((task, n) => {
    const { bar } = task;
    const box = `x="${r1(bar.x)}" y="${r1(bar.y)}" width="${r1(bar.w)}" height="${r1(bar.h)}" rx="${partRadius(ctx.corner, T.radius)}"`;
    const keys = simplify((timeline.tasks?.find((t) => t.task === task.id)?.keys ?? []).filter(([t]) => t < m.total));
    const scale = (v: number): string => `scaleX(${r1(v * 1000) / 1000})`;
    // 繰り返す前に針と共に左端へ戻る
    const grow = m.kf([...keys.map(([t, v]): [number, Record<string, string>] => [t, { transform: scale(v) }]), [m.last, { transform: scale(valueAt(keys, m.last)) }, EASE.inOut], [m.total, { transform: scale(0) }]]);
    const clip = `dg-tk${n}-${ctx.id}`;
    const parts = [
      `<clipPath id="${clip}"><rect ${box}/></clipPath>`,
      `<rect class="dg-tm-tb" ${box}/>`,
      `<g clip-path="url(#${clip})"><rect class="dg-tm-tf dg-a" x="${r1(bar.x)}" y="${r1(bar.y)}" width="${r1(bar.w)}" height="${r1(bar.h)}" style="${grow}"/></g>`,
    ];
    const r = task.textRect;
    ink.push({ text: task.text, rect: r, shown: ALWAYS });
    frame(k, { kind: "text", text: task.text }, r);
    // 棒の中の字は、濃く塗る所が字の真ん中に届いた時に塗った地の上の字の色へ替え、針が戻る間の半ばで元の色へ戻す
    const turn = task.inside ? reachAt(keys, (r.x + r.w / 2 - bar.x) / bar.w) : undefined;
    const tint =
      turn === undefined
        ? ""
        : ` style="${m.kf([
            [0, { fill: "var(--ct)" }],
            [turn, { fill: "var(--ct)" }],
            [turn + MOTION.time.turn, { fill: "var(--on-c)" }],
            [(m.last + m.total) / 2, { fill: "var(--on-c)" }],
            [(m.last + m.total) / 2 + MOTION.time.turn, { fill: "var(--ct)" }],
            [m.total, { fill: "var(--ct)" }],
          ])}"`;
    parts.push(`<text class="dg-tm-tt${turn === undefined ? "" : " dg-a"}" x="${r1(r.x)}" y="${r1(task.textY)}"${tint}>${esc(task.text)}</text>`);
    k.base.push(`<g data-task="${esc(task.id)}" style="${cs(task.color)}">${parts.join("")}</g>`);
    k.base.push(write(ink, "dg-tm-rn", LOOK.margin + LOOK.region.inset, task.y + task.h / 2 + LOOK.baseline.mark, task.name, TYPE.timeRow));
  });
}
