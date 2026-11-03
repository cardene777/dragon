/**
 * 線の名前の描き方 (#3345)。
 *
 * 線の名前は、その段の間だけ色付きの札で出し、済んだら消す。置き場所は並べ方 (`layout/`) が線の中ほどの上か右に決める。
 * 状態遷移図では段が終わった後も札を外した灰の字で薄く残し (#3171)、止め絵を選んだ図では最後の段の止め絵に全ての段の名前を出す (#3200)。
 */
import { textBox } from "../../layout/measure";
import type { SceneLabel } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import type { Shown } from "../../render/ink";
import { type Ctx, cs, esc, r1 } from "../../render/parts";
import type { LabelTime, Span } from "../../timeline";

/**
 * 同じ線の同じ名前を後の段が置く時は、薄く残した名前をその段が始まるまでで消す (#3184)。
 * 止め絵で全ての段の名前を出し直す間は、同じ所に出る後の段の名前に任せる (#3200)
 */
export function fadeBefore(l: SceneLabel, time: LabelTime, steps: Span[]): LabelTime {
  if (l.until === undefined) return time;
  const { after, again: _again, ...rest } = time;
  if (!after) return rest;
  const cut = (steps[l.until] as Span).start;
  return cut > after.start ? { ...rest, after: { start: after.start, end: Math.min(after.end, cut) } } : rest;
}

/**
 * 線の名前の札。その段の間だけ出し、段の終わりまでに消え終わる。時刻の表が `after` を持つ時は、その間だけ札を外した灰の字で薄く残す (#3171)。
 * `again` を持つ時は (止め絵を選んだ図、#3200)、その間に同じ札をもう 1 つ出す。
 */
export function label(l: SceneLabel, time: LabelTime, ctx: Ctx): string {
  const ja = l.family === "sans" ? " dg-capj" : "";
  const { radius } = LOOK.label;
  const shown: Shown[] = time.again ? [[time.start, time.end], [time.again.start, time.again.end]] : [[time.start, time.end]];
  // 札の間は札の四角を、薄く残す間は札を外した字の四角を記録する
  ctx.ink.push({ text: l.text, rect: l, shown, boxed: true });
  if (time.after) ctx.ink.push({ text: l.text, rect: textBox(l.text, l.x + l.w / 2, l.y + l.h / 2 + LOOK.baseline.label, l.family === "sans" ? TYPE.labelJa : TYPE.label, "middle"), shown: [[time.after.start, time.after.end]] });
  const x = r1(l.x + l.w / 2);
  const y = r1(l.y + l.h / 2 + LOOK.baseline.label);
  const past = time.after ? `<g class="dg-cap-past${l.family === "sans" ? " dg-cap-pastj" : ""} dg-a" style="${ctx.m.vis(time.after.start, time.after.end)}"><text x="${x}" y="${y}" text-anchor="middle">${esc(l.text)}</text></g>` : "";
  const caps = shown.map(([a, b]) => `<g class="dg-cap${ja} dg-a" style="${cs(l.color)};${ctx.m.rise(a, b, true)}"><rect x="${r1(l.x)}" y="${r1(l.y)}" width="${r1(l.w)}" height="${l.h}" rx="${radius}"/><text x="${x}" y="${y}" text-anchor="middle">${esc(l.text)}</text></g>`);
  return `${past}${caps.join("")}`;
}
