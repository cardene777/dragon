/**
 * 量の図の漏斗の見た目 (#3621) の値の決まり。
 *
 * 漏斗は宣言した順に段を進むほど数が減るので、どの段の後も、値を書いた項目の値を前の項目の値より大きくしない。
 * まだ値を書いていない前の項目は 0 と数える。前の項目より大きい値は、去った数が負になって漏斗に描けない。
 * 記法を読む処理 (`blocks/chart-set/read.ts`) と原本の検査 (`schemas/validator.ts`) が共に使い、誤りの文も両方が同じ文を出す。
 * どちらも後から読む塊なので、描く時と見本帳を開いた時に読む塊に入れない。
 */
import type { FieldError } from "../../schema";
import type { NotationLang } from "../../words";

/** 漏斗の見た目の誤りの文 */
export interface FunnelText {
  /** 項目 `item` の値 `value` が、前の項目 `before` の値 `beforeValue` より大きい */
  rises: (item: string, value: number, before: string, beforeValue: number) => string;
  /** 項目 `item` の値をどの段にも書いていない */
  unset: (item: string) => string;
}

export const FUNNEL_TEXT: Readonly<Record<NotationLang, FunnelText>> = {
  ja: {
    rises: (item, value, before, beforeValue) =>
      `漏斗の見た目 (shape: funnel) では、${item} の値 ${value} を前の項目 ${before} の値 ${beforeValue} より大きくできない。項目は減っていく順に宣言する`,
    unset: (item) => `漏斗の見た目 (shape: funnel) では、${item} の値をどれかの段の set の行で書く。値の無い項目は漏斗の段に出ない`,
  },
  en: {
    rises: (item, value, before, beforeValue) =>
      `A funnel (shape: funnel) cannot give ${item} the value ${value}, which is larger than ${beforeValue} of the item before it, ${before}. Declare the items in the order they shrink`,
    unset: (item) => `A funnel (shape: funnel) needs a set line for ${item} in some step. An item without a value has no stage in the funnel`,
  },
};

/** 宣言した順の名札 `order` と項目ごとの今の値 `values` で、前の項目より大きい値を持つ最初の項目の番号 (0 から)。無ければ `undefined` */
export function risesAt(order: readonly string[], values: ReadonlyMap<string, number>): number | undefined {
  for (let i = 1; i < order.length; i++) {
    const value = values.get(order[i] as string);
    if (value !== undefined && value > (values.get(order[i - 1] as string) ?? 0)) return i;
  }
  return undefined;
}

interface SetLike {
  type?: unknown;
  item?: unknown;
  value?: unknown;
}

/**
 * 原本の JSON の漏斗の見た目の量の図で、前の項目より大きい値を初めて持った段の誤り。誤りの場所はその段の値の欄で、
 * 大きい値を持った項目をその段で書いた時はその項目の、書かずに前の項目を小さくした時は前の項目の `set` を指す。
 * 形の検査が断る原本 (欄の型の違い) は見ない
 */
export function funnelErrors(input: unknown, lang: NotationLang): FieldError[] {
  const d = input as { kind?: unknown; chart?: { shape?: unknown; items?: unknown }; steps?: unknown } | null;
  if (d?.kind !== "chart" || d.chart?.shape !== "funnel" || !Array.isArray(d.chart.items) || !Array.isArray(d.steps)) return [];
  const order = (d.chart.items as { id?: unknown }[]).flatMap((item) => (typeof item?.id === "string" ? [item.id] : []));
  const values = new Map<string, number>();
  for (const [s, step] of (d.steps as { events?: unknown }[]).entries()) {
    const written = new Map<string, number>();
    const events: SetLike[] = Array.isArray(step?.events) ? (step.events as SetLike[]) : [];
    events.forEach((event, e) => {
      if (event?.type !== "set" || typeof event.item !== "string" || typeof event.value !== "number") return;
      values.set(event.item, event.value);
      written.set(event.item, e);
    });
    const i = risesAt(order, values);
    if (i === undefined) continue;
    const item = order[i] as string;
    const before = order[i - 1] as string;
    const e = written.get(item) ?? written.get(before);
    return [{ pointer: `/steps/${s}/events/${e ?? 0}/value`, message: FUNNEL_TEXT[lang].rises(item, values.get(item) ?? 0, before, values.get(before) ?? 0) }];
  }
  return [];
}
