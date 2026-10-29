/**
 * 描いた字の記録と、字どうしの重なり (#3175)。
 *
 * 字を描く部品 (`parts.ts`) は、字を描く時に、その字が占める四角と見えている時間をここへ 1 件ずつ記録する。
 * 描いた結果は、段ごとの止め絵の時刻に同時に見えている字どうしの重なりを返す。
 * 字の幅は置き場所と同じ字の幅の表 (`layout/measure.ts`) で測るので、ブラウザを使わず、node でも頁の中でも同じ結果になる。
 *
 * 札に入った字 (線の名前、処理、段の番号、帯の札、運ぶ物の札) は、札の形が人に見える物なので札の四角を記録する。
 * 走っている途中の運ぶ物は数えず、着いて留まっている間だけ記録する。
 *
 * 重なりは重なる字ごとに字の四角と段の番号かどうか (`spots`) を持ち、編集画面はその四角を図の上で囲む (#3178)。
 * 知らせる文は `describeOverlap` が作り、編集画面と書き出しの命令が同じ文を出す。
 * 書き手が書いていない図の部品 (箱の絵柄、運ぶ物の硬貨と封筒) は部品の種類 (`part`) を記録し、知らせる文の言葉で呼ぶ (#3184)。
 */
import { FIGURE_TEXT } from "../figure-text";
import { crossesRect, type Point, type Rect } from "../layout/scene";
import type { NotationLang } from "../words";

/** 見えている間。`[出る時刻, 消える時刻)` */
export type Shown = [number, number];

/** 初めから最後まで見えている字と線 */
export const ALWAYS: Shown[] = [[0, Number.POSITIVE_INFINITY]];

/** 書き手が書いていない図の部品。`icon` は箱 `box` の絵柄、`coin` と `envelope` は運ぶ物の硬貨と封筒 (#3184) */
export type InkPart = { kind: "icon"; box: string } | { kind: "coin" } | { kind: "envelope" };

export interface Ink {
  text: string;
  rect: Rect;
  shown: Shown[];
  /** 札に入った字。札の地が下の線を隠すので、線が横切っても重なりに数えない */
  boxed?: boolean;
  /** 段の番号の丸の字。字だけでは何か分からないので、知らせる文で段の番号と呼ぶ */
  badge?: boolean;
  /** 図の部品。`text` は日本語の名前なので、知らせる文は部品の種類から言葉ごとに呼び方を作る */
  part?: InkPart;
}

/** 描いた線。`from` と `to` は線の両端の箱の名札 */
export interface Trace {
  from: string;
  to: string;
  points: Point[];
  shown: Shown[];
}

/** 重なる字。`rect` は字 (札に入った字は札) の四角、`badge` は段の番号の丸の字か、`part` は図の部品の種類 (部品の時だけ持つ) */
export interface OverlapSpot {
  text: string;
  rect: Rect;
  badge: boolean;
  part?: InkPart;
}

/**
 * 重なり。`step` は重なりが見える段 (0 から数える)。
 * `texts` は重なる 2 つの字、`line` は札を持たない字 `text` を横切る線の両端の名札。
 * `spots` は重なる字で、`texts` は 2 つの字を同じ順に、`line` は横切られる字を 1 つ持つ
 */
export type Overlap =
  | { kind: "texts"; step: number; texts: [string, string]; spots: [OverlapSpot, OverlapSpot] }
  | { kind: "line"; step: number; text: string; line: { from: string; to: string }; spots: [OverlapSpot] };

/** 重なりに数える食い込みの下限 (px)。縁が触れただけの字を数えない */
const BITE = 0.5;

const visible = (item: { shown: Shown[] }, t: number): boolean => item.shown.some(([a, b]) => a <= t && t < b);

/** 重なる字。札の四角は札の字の名札などを持つので、四角だけを写す */
const spotOf = (ink: Ink): OverlapSpot => ({ text: ink.text, rect: { x: ink.rect.x, y: ink.rect.y, w: ink.rect.w, h: ink.rect.h }, badge: ink.badge === true, ...(ink.part ? { part: ink.part } : {}) });

/** 段ごとの止め絵の時刻 `stills` で、同時に見えている字どうしの重なりと、札を持たない字を横切る線を、段の順と記録した順に並べる。 */
export function findOverlaps(inks: Ink[], stills: number[], traces: Trace[] = []): Overlap[] {
  const out: Overlap[] = [];
  stills.forEach((t, step) => {
    const seen = inks.filter((ink) => visible(ink, t));
    seen.forEach((a, i) => {
      for (const b of seen.slice(i + 1)) {
        const w = Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - Math.max(a.rect.x, b.rect.x);
        const h = Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - Math.max(a.rect.y, b.rect.y);
        if (w > BITE && h > BITE) out.push({ kind: "texts", step, texts: [a.text, b.text], spots: [spotOf(a), spotOf(b)] });
      }
    });
    const lines = traces.filter((trace) => visible(trace, t));
    for (const ink of seen) {
      if (ink.boxed) continue;
      for (const line of lines) if (crossesRect(line.points, ink.rect, BITE)) out.push({ kind: "line", step, text: ink.text, line: { from: line.from, to: line.to }, spots: [spotOf(ink)] });
    }
  });
  return out;
}

/**
 * 重なりを知らせる文 (#3178)。段の番号は「段の番号 N」と呼び、図の部品は言葉ごとの呼び方で呼び (#3184)、ほかの字は鉤括弧か引用符で囲む。
 * 段の番号は文に含めない
 */
export function describeOverlap(overlap: Overlap, lang: NotationLang = "ja"): string {
  const t = FIGURE_TEXT[lang];
  const partName = (part: InkPart): string => (part.kind === "icon" ? t.iconOf(part.box) : part.kind === "coin" ? t.coin : t.envelope);
  const name = (spot: OverlapSpot): string => (spot.badge ? t.badgeName(spot.text) : spot.part ? partName(spot.part) : t.quoted(spot.text));
  if (overlap.kind === "texts") return t.textsOverlap(name(overlap.spots[0]), name(overlap.spots[1]));
  return t.lineCrosses(overlap.line.from, overlap.line.to, name(overlap.spots[0]));
}
