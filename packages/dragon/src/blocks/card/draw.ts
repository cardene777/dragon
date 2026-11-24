/**
 * 持ち主ごとのカードの描き方 (#3846)。
 *
 * カードの写し 1 枚と、断られた札を描く。列と見出しと合計の帯と呼び出しの線は、持ち主ごとのカードの図を描く部品 (`render/cards.ts`) が描き、この file を呼ぶ。
 * カードは名前と量と印の札を持ち、段の中で作ったカードはその段の出来事の時刻に弾んで現れ、緑の縁と「できた」の札を出す。
 * 消したカードは地を薄くして名前と量に消し線を引き、消した段だけ「消えた」の札を出す。動いたカードは前の席から今の席へ滑り、青い縁を出す。
 * 呼び出しを受けたカードは線を引き始める時から線の色の縁を出す。
 * Tracelyth と約束した印 (`data-dragon` の `card`、`card-name`、`amount`、`reason` と、`data-card`、`data-state`、`data-mark`) を要素に付ける。
 * 色と字の大きさは値の表 (`look/cards.ts` と `look/values.ts`) から読む
 */
import type { CardsRefusal, CardsSeat, CardsWords } from "../../kinds/cards/layout";
import { hasWide, textBox, textWidth } from "../../layout/measure";
import { CARDS_LOOK, CARDS_TYPE } from "../../look/cards";
import { type ColorKey, EASE, MOTION, type TextStyle } from "../../look/values";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, r1 } from "../../render/parts";
import { cs } from "../color/draw";

const L = CARDS_LOOK;
const T = CARDS_TYPE;

/** 字の形の真ん中から基準線までの下がりの、字の大きさに対する割合 */
export const MIDDLE = 0.35;

/** 真ん中が (`cx`, `cy`) で、腕の長さが `s` の × の印の道筋。断られた札と断られた呼び出しの線に使う */
export const crossPath = (cx: number, cy: number, s: number): string => `M${r1(cx - s)} ${r1(cy - s)}L${r1(cx + s)} ${r1(cy + s)}M${r1(cx + s)} ${r1(cy - s)}L${r1(cx - s)} ${r1(cy + s)}`;

/**
 * 字を 1 つ描き、字の四角と見えている間を記録する。`attrs` は `text` の要素に足す属性で、前に空白を付けて渡す。
 * `anchor` が `end` の字は右の端を `x` に置く
 */
export function say(ctx: Ctx, cls: string, x: number, y: number, text: string, style: TextStyle, shown: Shown[], anchor: "start" | "middle" | "end" = "start", attrs = ""): string {
  const w = textWidth(text, style);
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  ctx.ink.push({ text, rect: textBox(text, left, y, style), shown, boxed: true });
  return `<text class="${cls}" x="${r1(left)}" y="${r1(y)}"${attrs}>${esc(text)}</text>`;
}

/** 写し 1 枚を描く時に渡す時刻。`at` は段の中で作ったか消したか動いた出来事の時刻、`window` は段の写しが見えている間、`call` は呼び出しの線を引き始める時刻と色 */
export interface CardTimes {
  at?: number;
  window: Shown;
  call?: { start: number; color: ColorKey };
}

/** 消し線を `at` から引く動き */
const strikeKf = (ctx: Ctx, at: number): string =>
  ctx.m.kf([
    [0, { "stroke-dashoffset": 1 }],
    [at, { "stroke-dashoffset": 1 }, EASE.inOut],
    [at + MOTION.fade + MOTION.untilFade, { "stroke-dashoffset": 0 }],
    [ctx.m.total, { "stroke-dashoffset": 0 }],
  ]);

/** 写しの縁に掛かる札 (「できた」と「消えた」)。右の端をカードの右の端から `inset` 内に置き、札の真ん中を上の縁に重ねる */
function tag(seat: CardsSeat, text: string, color: ColorKey, at: number, ctx: Ctx, shown: Shown[]): string {
  const w = textWidth(text, T.tag) + L.tag.padX * 2;
  const x = seat.x + seat.w - L.tag.inset - w;
  const y = seat.y - L.tag.h / 2;
  const body = say(ctx, "dg-cd-tagt", x + w / 2, seat.y + T.tag.size * MIDDLE, text, T.tag, shown, "middle");
  return `<g class="dg-popc dg-a" style="${cs(color)};${ctx.m.pop(at)}"><rect class="dg-cd-tag" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${L.tag.h}" rx="${partRadius(ctx.corner, L.tag.h / 2)}"/>${body}</g>`;
}

/** 写しの印の札。量の行の右の端に置く */
function mark(seat: CardsSeat, word: string, ctx: Ctx, shown: Shown[]): string {
  const w = textWidth(word, T.mark) + L.mark.padX * 2;
  const x = seat.x + seat.w - L.mark.inset - w;
  const mid = seat.y + L.card.amountY - T.amount.size * MIDDLE;
  const body = say(ctx, "dg-cd-markt", x + w / 2, mid + T.mark.size * MIDDLE, word, T.mark, shown, "middle");
  return `<g style="${cs("amber")}"><rect class="dg-cd-mark" x="${r1(x)}" y="${r1(mid - L.mark.h / 2)}" width="${r1(w)}" height="${L.mark.h}" rx="${partRadius(ctx.corner, L.mark.h / 2)}"/>${body}</g>`;
}

/**
 * カードの写し 1 枚。作った写しは出来事の時刻に弾んで現れ、動いた写しと席の変わった写しは前の席から滑る。
 * 消した写しは地を薄くして名前と量に消し線を引く
 */
export function drawCard(seat: CardsSeat, words: CardsWords, ctx: Ctx, times: CardTimes): string {
  const { m } = ctx;
  const at = times.at ?? times.window[0];
  const created = seat.state === "created";
  const removedNow = seat.state === "removed" && seat.event !== undefined;
  const shown: Shown[] = created ? [[at, times.window[1]]] : [times.window];
  const rx = partRadius(ctx.corner, L.card.radius);
  const box = `x="${r1(seat.x)}" y="${r1(seat.y)}" width="${r1(seat.w)}" height="${r1(seat.h)}" rx="${rx}"`;
  const nameY = seat.y + (seat.amount === undefined ? L.card.soloY : L.card.nameY);
  const amountY = seat.y + L.card.amountY;
  const tx = seat.x + L.card.padX;
  const parts = [
    `<rect class="dg-cd-card" ${box} ${ctx.sh}/>`,
    say(ctx, "dg-cd-cn", tx, nameY, seat.name, T.card, shown, "start", ' data-dragon="card-name"'),
    seat.amount === undefined ? "" : say(ctx, hasWide(seat.amount) ? "dg-cd-am dg-cd-amj" : "dg-cd-am", tx, amountY, seat.amount, T.amount, shown, "start", ' data-dragon="amount"'),
    seat.mark === undefined ? "" : mark(seat, seat.mark, ctx, shown),
  ];
  if (seat.state === "removed") {
    // 消した写しは地を薄くし、名前と量の行に消し線を引く。消した段では出来事の時刻から薄くして線を引く
    const veil = removedNow ? ` class="dg-cd-veil dg-a" style="${m.vis(at, m.last)}"` : ' class="dg-cd-veil"';
    const lines = [nameY, ...(seat.amount === undefined ? [] : [amountY])]
      .map((y) => `<path class="dg-cd-strike${removedNow ? " dg-a" : ""}" pathLength="1" d="M${r1(seat.x + L.card.padX / 2)} ${r1(y - T.card.size * MIDDLE)}H${r1(seat.x + seat.w - L.card.padX / 2)}"${removedNow ? ` style="${strikeKf(ctx, at)}"` : ""}/>`)
      .join("");
    parts.push(`<rect${veil} ${box}/><g style="${cs("rose")}">${lines}</g>`);
  }
  // 段の中で作った写しは緑、動いた写しは青の縁を出来事の時刻から出し、呼び出しを受けた写しは線を引き始める時から線の色の縁を出す。
  // 縁は繰り返す前まで残し、段の写しの組が隠す
  const outline = (color: ColorKey, a: number): string => `<rect class="dg-cd-on dg-a" ${box} style="${cs(color)};${m.vis(a, m.last)}"/>`;
  if (created) parts.push(outline("green", at));
  else if (seat.moved) parts.push(outline("blue", at));
  if (times.call) parts.push(outline(times.call.color, times.call.start));
  if (created) parts.push(tag(seat, words.made, "green", at, ctx, shown));
  if (removedNow) parts.push(tag(seat, words.gone, "rose", at, ctx, [[at, times.window[1]]]));
  const attrs = ` data-dragon="card" data-card="${esc(seat.id)}" data-state="${seat.state}"${seat.mark === undefined ? "" : ` data-mark="${esc(seat.mark)}"`}`;
  // 作った写しは弾んで現れ、前の席を持つ写しは前の席から今の席へ滑る
  const back = seat.from ? [seat.from[0] - seat.x, seat.from[1] - seat.y] : seat.was !== undefined && Math.abs(seat.was - seat.y) > 0.5 ? [0, seat.was - seat.y] : undefined;
  if (created) return `<g${attrs} class="dg-popc dg-a" style="${m.pop(at)}">${parts.join("")}</g>`;
  if (back) {
    const [dx = 0, dy = 0] = back;
    const frames: [number, number, number, number?, string?][] = [
      [0, dx, dy],
      [at, dx, dy, 1, EASE.inOut],
      [at + MOTION.lineup.slide, 0, 0],
      [m.total, 0, 0],
    ];
    return `<g${attrs} class="dg-a" style="${m.move(frames)}">${parts.join("")}</g>`;
  }
  return `<g${attrs}>${parts.join("")}</g>`;
}

/** 断られた札。断る出来事の時刻に弾んで現れ、× の印と「断られた」の字と、理由の札 (`data-dragon="reason"`) を持つ */
export function drawRefusal(refusal: CardsRefusal, words: CardsWords, ctx: Ctx, at: number, window: Shown): string {
  const R = L.refusal;
  const { x, y, w, h } = refusal;
  const shown: Shown[] = [[at, window[1]]];
  const cx = x + R.crossX;
  const cy = y + R.titleY - T.refused.size * MIDDLE;
  const chipW = Math.min(w - R.padX * 2, textWidth(refusal.reason, T.reason) + R.padX * 2);
  const chipX = x + (w - chipW) / 2;
  const chipY = y + R.chipY - R.chip / 2;
  const reason = say(ctx, "dg-cd-whyt", x + w / 2, y + R.chipY + T.reason.size * MIDDLE, refusal.reason, T.reason, shown, "middle");
  return (
    `<g class="dg-popc dg-a" style="${cs("rose")};${ctx.m.pop(at)}">` +
    `<rect class="dg-cd-ref" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${partRadius(ctx.corner, R.radius)}" ${ctx.sh}/>` +
    `<path class="dg-cd-x" d="${crossPath(cx, cy, R.cross)}"/>` +
    say(ctx, "dg-cd-reft", x + R.textX, y + R.titleY, words.refused, T.refused, shown) +
    `<g data-dragon="reason"><rect class="dg-cd-why" x="${r1(chipX)}" y="${r1(chipY)}" width="${r1(chipW)}" height="${R.chip}" rx="${partRadius(ctx.corner, R.chip / 2)}"/>${reason}</g>` +
    "</g>"
  );
}
