/**
 * 作業の棒の描き方 (#3562)。
 *
 * 棒は作業の色を薄く混ぜた地と作業の色の縁で初めから見せ、針が通った分を作業の色で濃く塗る。
 * 濃く塗る所は棒の角の丸みで切り抜き、時刻の表の割合の動き (`timeline.tasks`) で左から伸ばす。繰り返す前に針と共に左端へ戻る。
 * 作業の名前は印の列の名前と同じく行の左に書く。棒の中の期間の字は 2 回描く。作業の字の色の字を濃く塗る所の下に、塗った地の上の字の色の字を、
 * 濃く塗る所と同じ動きの切り抜きで上に描く。塗りの端が字の途中で止まっても、塗られた所は明るい字、まだ塗られない所は濃い字で読める。
 * 棒の外 (右か、軸の右端の近くでは左) の字には塗りが届かないので、作業の字の色で 1 回だけ描く。期間の字は時間軸の囲みの枠の内に収める部品として記録する。
 * 見た目の規則は作業を持つ図の SVG にだけ書く (`TASK_CSS`)。作業を持たない時間軸の図の SVG を変えないため。
 * この file は時間軸の図を描く部品 (`render/time.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { EASE, LOOK, TYPE } from "../../look/values";
import { frameShape } from "../../render/corner";
import { ALWAYS } from "../../render/ink";
import { cssFont, cssMix, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { frame, simplify, type TimeKit, valueAt } from "../scale/draw";

/** 作業の棒の見た目。作業を持つ時間軸の図の SVG にだけ書く */
export const TASK_CSS = [
  `.dg-tm-tb{fill:${cssMix(LOOK.mix.timeTask)};stroke:var(--c);stroke-width:${LOOK.stroke.timeTask}}`,
  ".dg-tm-tf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",
  `.dg-tm-tt{${cssFont(TYPE.timeTask)};fill:var(--ct)}`,
  `.dg-tm-to{${cssFont(TYPE.timeTask)};fill:var(--on-c)}`,
].join("");

/** 作業ごとの行の名前と、棒と、期間の字 */
export function taskBars(k: TimeKit): void {
  const T = LOOK.time.task;
  const { layout, timeline, ctx } = k;
  const { m, ink } = ctx;
  (layout.tasks ?? []).forEach((task, n) => {
    const { bar } = task;
    const box = `x="${r1(bar.x)}" y="${r1(bar.y)}" width="${r1(bar.w)}" height="${r1(bar.h)}" rx="${T.radius}"`;
    const keys = simplify((timeline.tasks?.find((t) => t.task === task.id)?.keys ?? []).filter(([t]) => t < m.total));
    const scale = (v: number): string => `scaleX(${r1(v * 1000) / 1000})`;
    // 繰り返す前に針と共に左端へ戻る
    const grow = m.kf([...keys.map(([t, v]): [number, Record<string, string>] => [t, { transform: scale(v) }]), [m.last, { transform: scale(valueAt(keys, m.last)) }, EASE.inOut], [m.total, { transform: scale(0) }]]);
    const clip = `dg-tk${n}-${ctx.id}`;
    const fill = `x="${r1(bar.x)}" y="${r1(bar.y)}" width="${r1(bar.w)}" height="${r1(bar.h)}"`;
    const r = task.textRect;
    ink.push({ text: task.text, rect: r, shown: ALWAYS });
    frame(k, { kind: "text", text: task.text }, r);
    const at = `x="${r1(r.x)}" y="${r1(task.textY)}"`;
    // 棒は図の箱と同じく、角を落とす色味では棒と窓を右上と左下を落とした形で描く。塗りはその窓で切り抜くので、棒の角まで同じ形で塗る
    const barBox = { x: bar.x, y: bar.y, w: bar.w, h: bar.h };
    const parts = [
      `<clipPath id="${clip}">${frameShape(ctx.corner, "", barBox, `<rect ${box}/>`)}</clipPath>`,
      frameShape(ctx.corner, ` class="dg-tm-tb"`, barBox, `<rect class="dg-tm-tb" ${box}/>`),
      // 濃く塗る所の下に置く字。塗られた所では塗りに隠れる
      `<text class="dg-tm-tt" ${at}>${esc(task.text)}</text>`,
      `<g clip-path="url(#${clip})"><rect class="dg-tm-tf dg-a" ${fill} style="${grow}"/></g>`,
    ];
    if (task.inside) {
      // 塗った地の上の字。濃く塗る所と同じ動きの四角で切り抜くので、切り分ける位置が塗りの端と共に動く
      const edge = `dg-tke${n}-${ctx.id}`;
      const edgeShape = frameShape(ctx.corner, ` class="dg-tm-tf dg-a" style="${grow}"`, barBox, `<rect class="dg-tm-tf dg-a" ${fill} style="${grow}"/>`);
      parts.push(`<clipPath id="${edge}">${edgeShape}</clipPath>`, `<text class="dg-tm-to" clip-path="url(#${edge})" ${at}>${esc(task.text)}</text>`);
    }
    k.base.push(`<g data-task="${esc(task.id)}" style="${cs(task.color)}">${parts.join("")}</g>`);
    k.base.push(write(ink, "dg-tm-rn", LOOK.margin + LOOK.region.inset, task.y + task.h / 2 + LOOK.baseline.mark, task.name, TYPE.timeRow));
  });
}
