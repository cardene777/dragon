/**
 * 描いた字の記録と、字どうしの重なり (#3175)。
 *
 * 字を描く部品 (`parts.ts`) は、字を描く時に、その字が占める四角と見えている時間をここへ 1 件ずつ記録する。
 * 描いた結果は、段ごとの止め絵の時刻に同時に見えている字どうしの重なりを返す。
 * 字の幅は置き場所と同じ字の幅の表 (`layout/measure.ts`) で測るので、ブラウザを使わず、node でも頁の中でも同じ結果になる。
 *
 * 札に入った字 (線の名前、処理、段の番号、帯の札、運ぶ物の札) は、札の形が人に見える物なので札の四角を記録する。
 * 走っている途中の運ぶ物は数えず、着いて留まっている間だけ記録する。
 */
import { crossesRect, type Point, type Rect } from "../layout/scene";

/** 見えている間。`[出る時刻, 消える時刻)` */
export type Shown = [number, number];

/** 初めから最後まで見えている字と線 */
export const ALWAYS: Shown[] = [[0, Number.POSITIVE_INFINITY]];

export interface Ink {
  text: string;
  rect: Rect;
  shown: Shown[];
  /** 札に入った字。札の地が下の線を隠すので、線が横切っても重なりに数えない */
  boxed?: boolean;
}

/** 描いた線。`from` と `to` は線の両端の箱の名札 */
export interface Trace {
  from: string;
  to: string;
  points: Point[];
  shown: Shown[];
}

/**
 * 重なり。`step` は重なりが見える段 (0 から数える)。
 * `texts` は重なる 2 つの字、`line` は札を持たない字 `text` を横切る線の両端の名札
 */
export type Overlap = { kind: "texts"; step: number; texts: [string, string] } | { kind: "line"; step: number; text: string; line: { from: string; to: string } };

/** 重なりに数える食い込みの下限 (px)。縁が触れただけの字を数えない */
const BITE = 0.5;

const visible = (item: { shown: Shown[] }, t: number): boolean => item.shown.some(([a, b]) => a <= t && t < b);

/** 段ごとの止め絵の時刻 `stills` で、同時に見えている字どうしの重なりと、札を持たない字を横切る線を、段の順と記録した順に並べる。 */
export function findOverlaps(inks: Ink[], stills: number[], traces: Trace[] = []): Overlap[] {
  const out: Overlap[] = [];
  stills.forEach((t, step) => {
    const seen = inks.filter((ink) => visible(ink, t));
    seen.forEach((a, i) => {
      for (const b of seen.slice(i + 1)) {
        const w = Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - Math.max(a.rect.x, b.rect.x);
        const h = Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - Math.max(a.rect.y, b.rect.y);
        if (w > BITE && h > BITE) out.push({ kind: "texts", step, texts: [a.text, b.text] });
      }
    });
    const lines = traces.filter((trace) => visible(trace, t));
    for (const ink of seen) {
      if (ink.boxed) continue;
      for (const line of lines) if (crossesRect(line.points, ink.rect, BITE)) out.push({ kind: "line", step, text: ink.text, line: { from: line.from, to: line.to } });
    }
  });
  return out;
}
