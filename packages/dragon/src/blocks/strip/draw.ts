/**
 * 中身の帯の描き方 (#3345)。
 *
 * 帯は図の下に 1 本置き、左に印と題、欄は細い線で区切り、上に欄の名前、下に値を出す。
 * 段で書いた値と札 (`set`) の移り変わりを欄ごとに組み (`fieldChanges`)、帯を描く部品 (`strip`) が出す。
 * 時間軸の図の物差しの欄は、時間軸の図を描く部品が渡す `meter` が描く。
 */
import { hasWide, textBox, textWidth } from "../../layout/measure";
import type { Layout, SceneField, SceneStrip } from "../../layout/scene";
import { type ColorKey, LOOK, MOTION, TYPE } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import { type Ctx, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { glyph } from "../icon/draw";
import type { DiagramModel } from "../../schema";
import type { Span, Timeline } from "../../timeline";

/** 中身の帯の 1 欄の移り変わり。値と札は、次の値か札が来るまで出る。 */
export interface FieldChange {
  at: number;
  value?: string;
  tag?: string;
  color: ColorKey;
  /** 変わった段と、その段の終わり */
  step: number;
  until: number;
}

/** 段で書いた値と札 (`strip` の出来事) を、欄ごとの移り変わりにする。色はその段の番号の色 */
export function fieldChanges(
  diagram: DiagramModel,
  timeline: Timeline,
  layout: Layout,
): Map<string, FieldChange[]> {
  const out = new Map<string, FieldChange[]>();
  for (const time of timeline.events) {
    const event = diagram.steps[time.step]?.events[time.event];
    if (event?.type !== "strip") continue;
    const color: ColorKey = layout.badges[time.step]?.color ?? "slate";
    const list = out.get(event.field) ?? [];
    const until = (timeline.steps[time.step] as Span).end;
    list.push({
      at: time.at,
      color,
      step: time.step,
      until,
      ...(event.value !== undefined ? { value: event.value } : {}),
      ...(event.tag !== undefined ? { tag: event.tag } : {}),
    });
    out.set(event.field, list);
  }
  return out;
}

/**
 * 中身の帯。`now` を立てると (状態遷移図、#3171)、段の中で変わった値をその段の終わりまで線の色 (今の状態の色) で描き、
 * 欄の名前の横に同じ色の点を置く。帯の通った状態の欄は、`arrivals` が持つ着いた時刻に点を塗る。
 * `meter` を渡すと (時間軸の図、#3165)、物差しの欄は値の字の代わりに `meter` が描く物差しを置く
 */
export function strip(
  s: SceneStrip,
  changes: Map<string, FieldChange[]>,
  ctx: Ctx,
  now = false,
  arrivals = new Map<string, number>(),
  meter?: (field: SceneField) => string | undefined,
): string {
  const { m, sh } = ctx;
  const S = LOOK.strip;
  const my = s.y + S.h / 2;
  const parts = [
    frameShape(
      ctx.corner,
      ` class="dg-strip" ${sh}`,
      { x: s.x + 0.5, y: s.y + 0.5, w: s.w - 1, h: s.h - 1 },
      `<rect class="dg-strip" x="${r1(s.x + 0.5)}" y="${r1(s.y + 0.5)}" width="${r1(s.w - 1)}" height="${r1(s.h - 1)}" rx="${LOOK.region.radius}" ${sh}/>`,
    ),
    `<g style="${cs("slate")}"><rect class="dg-bi" x="${r1(s.x + S.pad)}" y="${r1(my - S.icon / 2)}" width="${S.icon}" height="${S.icon}" rx="${partRadius(ctx.corner, LOOK.box.iconRadius)}"/>${glyph("env", s.x + S.pad + S.icon / 2, my, 0.78)}</g>`,
    write(
      ctx.ink,
      "dg-sh",
      s.x + S.titleX,
      my + LOOK.baseline.stripTitle,
      s.title,
      TYPE.stripTitle,
    ),
  ];
  s.fields.forEach((field, i) => {
    const prev = s.fields[i - 1];
    if (prev && prev.y === field.y) {
      const sx = field.x - S.fieldGap / 2;
      parts.push(
        `<line class="dg-sep" x1="${r1(sx)}" y1="${r1(field.y + S.sepInset)}" x2="${r1(sx)}" y2="${r1(field.y + S.h - S.sepInset)}"/>`,
      );
    }
    parts.push(write(ctx.ink, "dg-fl", field.x, field.y + S.nameY, field.name, TYPE.fieldName));
    const gauge = meter?.(field);
    if (gauge !== undefined) {
      parts.push(gauge);
      return;
    }
    const list = changes.get(field.name) ?? [];
    const values = list.filter((c) => c.value !== undefined);
    const tags = list.filter((c) => c.tag !== undefined);
    values.forEach((c, k) => {
      const next = values[k + 1]?.at;
      const value = c.value as string;
      const cls = hasWide(value) ? "dg-fvj" : "dg-fv";
      // 値は、次の値が来るまで (色を付けた間と墨に戻した間を合わせて) 1 件で記録する
      ctx.ink.push({
        text: value,
        rect: textBox(
          value,
          field.x,
          field.y + S.valueY,
          hasWide(value) ? TYPE.fieldValueJa : TYPE.fieldValue,
        ),
        shown: [[c.at, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade]],
      });
      const textOf = (c: string): string =>
        `<text class="${c}" x="${r1(field.x)}" y="${r1(field.y + S.valueY)}">${esc(value)}</text>`;
      const text = textOf(cls);
      if (!now) {
        const anim = next === undefined ? m.rise(c.at) : m.rise(c.at, next - MOTION.untilFade);
        parts.push(`<g class="dg-a" style="${anim}">${text}</g>`);
        return;
      }
      // 変わった段の間は今の状態の色で、段が終わると墨に戻す
      const until = Math.min(c.until, next ?? c.until);
      const dot = `<circle class="dg-fl-now" cx="${r1(field.x + textWidth(field.name, TYPE.fieldName) + S.now.gap)}" cy="${r1(field.y + S.nameY - TYPE.fieldName.size / 3)}" r="${S.now.r}"/>`;
      parts.push(
        `<g class="dg-fv-now dg-a" data-step="${c.step}" style="${cs(c.color)};${m.rise(c.at, until - MOTION.untilFade)}">${textOf(`${cls} dg-fv-c`)}${dot}</g>`,
      );
      if (next === undefined || next > until)
        parts.push(
          `<g class="dg-a" style="${m.vis(until - MOTION.untilFade, next === undefined ? m.last : next - MOTION.untilFade)}">${text}</g>`,
        );
    });
    tags.forEach((c, k) => {
      const next = tags[k + 1]?.at;
      const tag = c.tag as string;
      // 札は、その時に出ている値の右に置く
      const shown = [...values].reverse().find((v) => v.at <= c.at + 1e-9)?.value;
      const x =
        field.x +
        (shown
          ? textWidth(shown, hasWide(shown) ? TYPE.fieldValueJa : TYPE.fieldValue) + S.tagGap
          : 0);
      const w = textWidth(tag, TYPE.tag) + S.tagPadX * 2;
      const y = field.y + S.valueY - S.tagH / 2 - LOOK.baseline.tag;
      ctx.ink.push({
        text: tag,
        rect: { x, y, w, h: S.tagH },
        shown: [[c.at, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade]],
        boxed: true,
      });
      parts.push(
        `<g class="dg-tg dg-popc dg-a" style="${cs(c.color)};${next === undefined ? m.pop(c.at) : m.pop(c.at, next - MOTION.untilFade)}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${S.tagH}" rx="${partRadius(ctx.corner, S.tagH / 2)}"/><text x="${r1(x + w / 2)}" y="${r1(y + S.tagH / 2 + LOOK.baseline.tag)}" text-anchor="middle">${esc(tag)}</text></g>`,
      );
    });
  });
  if (s.trail) {
    const t = s.trail;
    const last = s.fields[s.fields.length - 1];
    if (last && last.y === t.y) {
      const sx = t.x - S.fieldGap / 2;
      parts.push(
        `<line class="dg-sep" x1="${r1(sx)}" y1="${r1(t.y + S.sepInset)}" x2="${r1(sx)}" y2="${r1(t.y + S.h - S.sepInset)}"/>`,
      );
    }
    parts.push(write(ctx.ink, "dg-fl", t.x, t.y + S.nameY, t.title, TYPE.fieldName));
    const dy = t.y + S.valueY - TYPE.fieldValue.size / 3;
    t.states.forEach((state, k) => {
      const cx = r1(t.x + S.trail.r + k * S.trail.step);
      const at = arrivals.get(state.box);
      const fill =
        at === undefined
          ? ""
          : `<circle class="dg-tr-fill dg-a" cx="${cx}" cy="${r1(dy)}" r="${S.trail.r}" style="${m.pop(at)}"/>`;
      parts.push(
        `<g data-trail="${esc(state.box)}" style="${cs(state.color)}"><circle class="dg-tr-ring" cx="${cx}" cy="${r1(dy)}" r="${S.trail.r}"/>${fill}</g>`,
      );
    });
  }
  return parts.join("");
}
