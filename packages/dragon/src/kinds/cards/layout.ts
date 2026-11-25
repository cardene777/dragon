/**
 * 持ち主ごとのカードの図 (`cards`、#3846) の並べ方。
 *
 * 箱を書いた順に持ち主の列を左から並べ、列の見出しの下にカードを上から積む。カードは `in` に書いた全ての列に 1 枚ずつ写しが載る。
 * 写しの席は段ごとに決め (`cards`)、列の中はカードを作った順 (最初の段より前のカードは書いた順、段の中のカードはその後に作った順) に上から並べる。
 * 消したカードは消し線で同じ席に残り、動かしたカードは前の列から消えて動いた先の列に作った順の席で載る。
 * 断られた札は、断られたカードを呼んだ列 (呼び出しが無ければカードが載る最初の列) か、断られた列の、カードの下に置く。
 * 列の合計は、消えていないカードの量 (`total: none` のカードを除く) を単位ごとに足し、列の下の合計の帯に置く。段で変わった単位は前の量を添える。
 * 合計の帯は合計に足すカード (量を持ち `total: none` を持たないカード) が在る図だけが持ち、足すカードの無い列の合計はそのうち最初のカードの単位で 0 を出す。
 * 段の中の `<列> -> <カード>` の線は列の見出しの下から出て、列の最初のカードへは真っ直ぐ下り、2 枚目から後のカードへは列の左の端を下りて横から入る。
 * 描き方 (`render/cards.ts`) を読まない
 */
import { amountOf, type Amount, writeAmount } from "../../blocks/card/amount";
import type { CardItem } from "../../blocks/card/block";
import { textWidth } from "../../layout/measure";
import type { Layout, Point, Rect, SceneEdge } from "../../layout/scene";
import { CARDS_LOOK, CARDS_TYPE } from "../../look/cards";
import type { ColorKey } from "../../look/values";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";

const L = CARDS_LOOK;
const T = CARDS_TYPE;

/** 図に出す字。言葉ごとに持つ */
export const CARDS_TEXT = {
  ja: { made: "できた", gone: "消えた", refused: "断られた", empty: "カード無し", total: "合計" },
  en: { made: "New", gone: "Deleted", refused: "Refused", empty: "No cards", total: "Total" },
} as const;

/** 図に出す字の組 */
export type CardsWords = (typeof CARDS_TEXT)[NotationLang];

/** 持ち主の列。`head` は見出しの四角、`sub` は名前の脇の添え書き、`mark` は列で出す印の語 */
export interface CardsColumn extends Rect {
  id: string;
  name: string;
  sub?: string;
  mark?: string;
  head: Rect;
}

/**
 * 段 `step` の列 `column` に載るカードの写しの席。`state` は段の中で作ったカード (`created`)、消し線で残るカード (`removed`)、在り続けるカード (`kept`)。
 * `now` は段の中で消えたか動いたかで、その出来事の番号 (`event`) を持つ。`was` は前の段の同じ列の席の上の端で、前の段に同じ列に居なかった写しは持たない。
 * `from` は前の段の別の列の席で、段の中で動いてこの列に来た写しだけが持つ。`mark` はこの写しに出す印の語
 */
export interface CardsSeat extends Rect {
  id: string;
  column: string;
  step: number;
  name: string;
  amount?: string;
  mark?: string;
  state: "created" | "removed" | "kept";
  /** 段の中で作ったか消したか動かした出来事の番号。在り続ける写しは持たない */
  event?: number;
  moved?: true;
  was?: number;
  from?: Point;
}

/** 断られた札。`step` と `event` は原本の断る出来事、`column` は札を置く列、`reason` は理由 */
export interface CardsRefusal extends Rect {
  step: number;
  event: number;
  column: string;
  reason: string;
}

/** カードの無い列の点線の枠。段 `step` の列 `column` が 1 枚もカードを持たない時に置く */
export interface CardsEmpty extends Rect {
  step: number;
  column: string;
}

/** 合計の帯の 1 行。`now` は今の量、`was` は段で変わった単位の前の量 */
export interface CardsTotalRow {
  now: string;
  was?: string;
}

/** 段 `step` の列 `column` の合計。`rows` は単位ごとの行で、量を持つカードが無い列は 0 の行を 1 つ持つ */
export interface CardsTotal extends Rect {
  step: number;
  column: string;
  rows: CardsTotalRow[];
  changed: boolean;
}

/** 呼び出しの線の名前の札。`step` と `event` は原本の線、`color` は線の色 */
export interface CardsCall extends Rect {
  step: number;
  event: number;
  text: string;
  color: ColorKey;
}

export interface CardsLayout extends Layout {
  kind: "cards";
  columns: CardsColumn[];
  cards: CardsSeat[];
  refusals: CardsRefusal[];
  empties: CardsEmpty[];
  calls: CardsCall[];
  /** 合計の帯。合計に足すカード (量を持ち `total: none` を持たないカード) が 1 枚も無い図は持たない */
  band?: Rect;
  totals: CardsTotal[];
  /** カードの幅 */
  cardW: number;
  words: CardsWords;
}

/** カード 1 枚の今。`order` は作った順、`made` は作った段、`gone` は消した段 */
interface Live {
  card: CardItem;
  in: string[];
  order: number;
  made?: number;
  gone?: number;
}

/** 段ごとの列の合計。単位ごとの量の和と、単位の書き方の手本 */
type Sums = Map<string, { value: number; like: Amount }>;

/** カードの量のうち、列の合計に足す物 */
const counted = (live: Live): Amount | undefined => (live.gone !== undefined || live.card.total === "none" || live.card.amount === undefined ? undefined : amountOf(live.card.amount));

/** 列 `column` に載る、合計に足すカードの単位ごとの和。小数の桁は足したカードの最も多い桁に揃える */
function sumsOf(cards: Live[], column: string): Sums {
  const sums: Sums = new Map();
  for (const live of cards) {
    const amount = live.in.includes(column) ? counted(live) : undefined;
    if (!amount) continue;
    const had = sums.get(amount.unit);
    sums.set(amount.unit, had ? { value: had.value + amount.value, like: { ...had.like, places: Math.max(had.like.places, amount.places), comma: had.like.comma || amount.comma } } : { value: amount.value, like: amount });
  }
  return sums;
}

/** 合計の行。単位は図の中で初めて出た順に並べ、段で変わった単位は前の量を添える。前に在って今は無い単位は 0 にして前の量を添える */
function totalRows(now: Sums, before: Sums, units: string[], zero: Amount | undefined): CardsTotalRow[] {
  const rows: CardsTotalRow[] = [];
  for (const unit of units) {
    const a = before.get(unit);
    const b = now.get(unit);
    if (!a && !b) continue;
    const like = (b ?? a)?.like as Amount;
    const value = b?.value ?? 0;
    const changed = a === undefined || Math.abs(a.value - value) > 1e-9;
    rows.push({ now: writeAmount(value, like), ...(a && changed ? { was: writeAmount(a.value, { ...like, places: Math.max(like.places, a.like.places) }) } : {}) });
  }
  if (rows.length === 0 && zero) rows.push({ now: writeAmount(0, { ...zero, places: 0 }) });
  return rows;
}

/** 段の出来事を当てた後のカードの今。`movedFrom` は段の中で動いたカードの前の列、`changedAt` は段の中で作ったか消したか動かした出来事の番号 */
interface Moment {
  lives: Live[];
  movedFrom: Map<string, string[]>;
  changedAt: Map<string, number>;
}

/** 最初の段より前のカードの今 (`start`) と、段ごとに出来事を当てた後のカードの今 (`moments`)。どちらも作った順に並べた写し */
function replay(diagram: DiagramModel): { start: Live[]; moments: Moment[] } {
  const all = new Map<string, Live>();
  let made = 0;
  for (const card of diagram.cards?.items ?? []) all.set(card.id, { card, in: card.in, order: made++ });
  const now = (): Live[] => [...all.values()].map((live) => ({ ...live })).sort((a, b) => a.order - b.order);
  const start = now();
  const moments = diagram.steps.map((step, s): Moment => {
    const movedFrom = new Map<string, string[]>();
    const changedAt = new Map<string, number>();
    step.events.forEach((e, event) => {
      if (e.type === "card") {
        const { type: _type, ...card } = e;
        all.set(e.id, { card, in: e.in, order: made++, made: s });
        changedAt.set(e.id, event);
      } else if (e.type === "card-move") {
        const live = all.get(e.card);
        if (!live) return;
        if (!movedFrom.has(e.card)) movedFrom.set(e.card, live.in);
        all.set(e.card, { ...live, in: e.in });
        changedAt.set(e.card, event);
      } else if (e.type === "card-delete") {
        const live = all.get(e.card);
        if (live) all.set(e.card, { ...live, gone: s });
        changedAt.set(e.card, event);
      }
    });
    return { lives: now(), movedFrom, changedAt };
  });
  return { start, moments };
}

/** 持ち主ごとのカードの図を並べる */
export function layoutCards(diagram: DiagramModel, lang: NotationLang): CardsLayout {
  const words = CARDS_TEXT[lang];
  const boxes = diagram.boxes;
  // カードの今を段ごとに進める。消したカードも残し、作った順を持つ
  const { start, moments } = replay(diagram);
  // 最初の段より前のカードと段の中で作ったカード。量の単位を出た順に集め、カードの幅を決める
  const everyCard: CardItem[] = start.map((live) => live.card);
  for (const step of diagram.steps) for (const e of step.events) if (e.type === "card") everyCard.push(e);
  const parsed = everyCard.flatMap((card) => {
    const amount = card.amount === undefined ? undefined : amountOf(card.amount);
    return amount ? [amount] : [];
  });
  const units = [...new Set(parsed.map((amount) => amount.unit))];
  // 合計の帯と、足すカードの無い列の 0 の単位は、合計に足すカードから決める。足さないカードから決めると、足すカードが無い図にも全員の残高が 0 と読ませる帯が出る (#3944)
  const zero = everyCard.map((card) => (card.total === "none" || card.amount === undefined ? undefined : amountOf(card.amount))).find((amount) => amount !== undefined);

  // 字の幅からカードと列の幅を決める。列は全て同じ幅にする
  const markW = (word: string): number => textWidth(word, T.mark) + L.mark.padX * 2;
  const tagW = Math.max(...[words.made, words.gone].map((w) => textWidth(w, T.tag) + L.tag.padX * 2));
  const markOf = new Map(boxes.map((box) => [box.id, box.mark]));
  let cardW = 0;
  for (const card of everyCard) {
    const marks = (card.mark ?? []).map((id) => markOf.get(id) ?? "");
    const mark = Math.max(0, ...marks.map(markW));
    const amount = card.amount === undefined ? 0 : textWidth(card.amount, T.amount);
    cardW = Math.max(cardW, textWidth(card.name, T.card) + L.card.padX * 2 + tagW / 2, amount + (mark > 0 ? mark + L.mark.inset + L.card.padX : L.card.padX * 2));
  }
  const reasons = diagram.steps.flatMap((step) => step.events.flatMap((e) => (e.type === "refuse" ? [e.reason] : [])));
  const refusalW = Math.max(0, ...reasons.map((r) => textWidth(r, T.reason) + L.refusal.padX * 4), ...(reasons.length > 0 ? [L.refusal.textX + textWidth(words.refused, T.refused) + L.refusal.padX] : []));
  // 列の合計は並べる前に段ごとに数え、合計の帯の字の幅も列の幅に入れる
  const sumsBefore = new Map(boxes.map((box) => [box.id, sumsOf(start, box.id)]));
  const rowsAt = moments.map((moment) =>
    boxes.map((box) => {
      const sums = sumsOf(moment.lives, box.id);
      const rows = totalRows(sums, sumsBefore.get(box.id) ?? new Map(), units, zero);
      sumsBefore.set(box.id, sums);
      return rows;
    }),
  );
  const rowW = (row: CardsTotalRow): number => textWidth(row.now, T.total) + (row.was === undefined ? 0 : L.total.gap + textWidth(row.was, T.was));
  const totalW = zero === undefined ? 0 : L.total.padX * 2 + textWidth(words.total, T.totalLabel) + L.total.gap * 2 + Math.max(0, ...rowsAt.flat(2).map(rowW));
  const headW = Math.max(...boxes.map((box) => L.column.nameX * 2 + textWidth(box.name, T.name) + (box.sub ? L.column.subGap + textWidth(box.sub, T.sub) : 0)));
  const colW = Math.max(L.column.minW, cardW + L.column.padX * 2, refusalW + L.column.padX * 2, headW, totalW);
  cardW = colW - L.column.padX * 2;

  const calls = diagram.steps.some((step) => step.events.some((e) => e.type === "edge"));
  const top = L.margin;
  const headBottom = top + L.column.headH;
  const cardsTop = headBottom + (calls ? L.call.room : L.column.top);
  const xOf = (i: number): number => L.margin + i * (colW + L.column.gap);
  const index = new Map(boxes.map((box, i) => [box.id, i]));
  const seatY = (k: number): number => cardsTop + k * (L.card.h + L.card.gap);

  const seats: CardsSeat[] = [];
  const refusals: CardsRefusal[] = [];
  const empties: CardsEmpty[] = [];
  const callTags: CardsCall[] = [];
  const edges: SceneEdge[] = [];
  const totals: { step: number; column: string; rows: CardsTotalRow[]; changed: boolean }[] = [];
  let bottom = cardsTop;
  /** 前の段の写しの席の上の端。鍵は `<列>/<カード>` */
  let last = new Map<string, number>();
  for (const box of boxes) start.filter((live) => live.in.includes(box.id)).forEach((live, k) => last.set(`${box.id}/${live.card.id}`, seatY(k)));

  diagram.steps.forEach((step, s) => {
    const { lives: ordered, movedFrom, changedAt } = moments[s] as Moment;
    const all = new Map(ordered.map((live) => [live.card.id, live]));
    const now = new Map<string, number>();
    const filled = new Map<string, number>();
    for (const box of boxes) {
      const x = xOf(index.get(box.id) ?? 0);
      const here = ordered.filter((live) => live.in.includes(box.id));
      here.forEach((live, k) => {
        const y = seatY(k);
        const key = `${box.id}/${live.card.id}`;
        const was = last.get(key);
        const from = movedFrom.get(live.card.id);
        const fromColumn = from && !from.includes(box.id) ? from[0] : undefined;
        const fromY = fromColumn === undefined ? undefined : last.get(`${fromColumn}/${live.card.id}`);
        const mark = live.card.mark?.includes(box.id) ? box.mark : undefined;
        const event = changedAt.get(live.card.id);
        seats.push({
          id: live.card.id,
          column: box.id,
          step: s,
          x: x + L.column.padX,
          y,
          w: cardW,
          h: L.card.h,
          name: live.card.name,
          ...(live.card.amount !== undefined ? { amount: live.card.amount } : {}),
          ...(mark !== undefined ? { mark } : {}),
          state: live.gone !== undefined ? "removed" : live.made === s ? "created" : "kept",
          ...(event !== undefined && (live.made === s || live.gone === s || movedFrom.has(live.card.id)) ? { event } : {}),
          ...(movedFrom.has(live.card.id) && live.gone === undefined ? { moved: true as const } : {}),
          ...(was !== undefined ? { was } : {}),
          ...(fromColumn !== undefined && fromY !== undefined ? { from: [xOf(index.get(fromColumn) ?? 0) + L.column.padX, fromY] as Point } : {}),
        });
        now.set(key, y);
      });
      // カードの無い列は、カードの無い列の点線の枠 1 枚の下までを埋まった所にする
      filled.set(box.id, seatY(Math.max(1, here.length)) - L.card.gap);
      if (here.length === 0) empties.push({ step: s, column: box.id, x: x + L.column.padX, y: seatY(0), w: cardW, h: L.card.h });
    }
    // 断られた札は、カードを呼んだ列か、カードが載る最初の列か、断られた列の、カードの下に置く
    step.events.forEach((e, event) => {
      if (e.type !== "refuse") return;
      const live = all.get(e.target);
      const caller = step.events.find((c) => c.type === "edge" && c.to === e.target && (live?.in.includes(c.from) ?? false));
      const column = live ? (caller?.type === "edge" ? caller.from : live.in[0]) : e.target;
      if (column === undefined) return;
      const y = (filled.get(column) ?? cardsTop) + L.refusal.gap + L.card.gap;
      refusals.push({ step: s, event, column, reason: e.reason, x: xOf(index.get(column) ?? 0) + L.column.padX, y, w: cardW, h: L.refusal.h });
      filled.set(column, y + L.refusal.h);
    });
    for (const y of filled.values()) bottom = Math.max(bottom, y);
    // 呼び出しの線。列の最初のカードへは真っ直ぐ下ろし、2 枚目から後のカードと左の列のカードへは列の左の端を下りて横から入る。
    // 右の列のカードへは列の右の端を下りるので、線は呼んだ列のカードを横切らない
    const refused = new Set(step.events.flatMap((e) => (e.type === "refuse" ? [e.target] : [])));
    step.events.forEach((e, event) => {
      if (e.type !== "edge") return;
      const x = xOf(index.get(e.from) ?? 0);
      const own = seats.find((seat) => seat.step === s && seat.column === e.from && seat.id === e.to);
      const target = own ?? seats.find((seat) => seat.step === s && seat.id === e.to);
      if (!target) return;
      const first = own !== undefined && own.y <= cardsTop + 0.5;
      const right = own === undefined && target.x > x;
      const down = first ? target.x + L.call.x : right ? x + colW - L.call.rail : x + L.call.rail;
      const mid = target.y + target.h / 2;
      const points: Point[] = first
        ? [
            [down, headBottom],
            [down, target.y],
          ]
        : [
            [down, headBottom],
            [down, mid],
            [target.x < down ? target.x + target.w : target.x, mid],
          ];
      const color: ColorKey = refused.has(e.to) || refused.has(e.from) ? "rose" : "blue";
      edges.push({ step: s, event, from: e.from, to: e.to, points, color, carry: e.carry });
      if (e.label !== undefined) {
        const w = textWidth(e.label, T.call) + L.call.padX * 2;
        // 名前の札は線の右に置き、列の右の端を下りる線では線の左に置く
        callTags.push({ step: s, event, text: e.label, color, x: right ? down - L.call.gap - w : down + L.call.gap, y: headBottom + (L.call.room - L.call.h) / 2, w, h: L.call.h });
      }
    });
    boxes.forEach((box, i) => {
      const rows = rowsAt[s]?.[i] ?? [];
      totals.push({ step: s, column: box.id, rows, changed: rows.some((row) => row.was !== undefined) });
    });
    last = now;
  });

  const colH = bottom + L.column.bottom - top;
  const columns: CardsColumn[] = boxes.map((box, i) => ({
    id: box.id,
    name: box.name,
    ...(box.sub !== undefined ? { sub: box.sub } : {}),
    ...(box.mark !== undefined ? { mark: box.mark } : {}),
    x: xOf(i),
    y: top,
    w: colW,
    h: colH,
    head: { x: xOf(i), y: top, w: colW, h: L.column.headH },
  }));
  const width = xOf(boxes.length) - L.column.gap + L.margin;
  const rows = Math.max(1, ...totals.map((total) => total.rows.length));
  const band = zero === undefined ? undefined : { x: L.margin, y: top + colH + L.total.top, w: width - L.margin * 2, h: rows * L.total.row + L.total.padY * 2 };
  const height = (band ? band.y + band.h : top + colH) + L.margin;
  return {
    kind: "cards",
    width,
    height,
    regions: [],
    boxes: [],
    lifelines: [],
    edges,
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    columns,
    cards: seats,
    refusals,
    empties,
    calls: callTags,
    ...(band ? { band } : {}),
    totals: band ? totals.map((total) => ({ ...total, x: xOf(index.get(total.column) ?? 0), y: band.y, w: colW, h: band.h })) : [],
    cardW,
    words,
  };
}
