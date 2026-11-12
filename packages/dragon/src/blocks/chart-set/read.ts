/**
 * 量の図の値のブロックの読み方 (#3560)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 量の図の段の中の `set <項目>: <値>` の行を、行の形 (`take`) で読む。最初の `step` より前の行、宣言していない項目、
 * 0 以上の数でない値は、その字を指して止める。
 *
 * 漏斗の見た目 (#3621) は段を進むほど値が減る図なので、段を閉じるたびに、値を書いた項目の値が前の項目の値より大きくないかを確かめる (`blocks/chart-shape/funnel.ts`)。
 * 同じ段の中では書く順を問わないよう、段の値を全て読んでから確かめ、大きくなった項目の値の字を指して止める。
 * 読み終えた時に、どの段にも値を書かなかった項目は漏斗の段に出ないので、宣言の行の名札を指して止める
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { ITEM_LINES } from "../chart-item/read";
import { FUNNEL_TEXT, risesAt } from "../chart-shape/funnel";

/** `set <項目>: <値>` の行。項目と値の位置を取る */
const SET = /^set\s+([^\s:[\]]+)\s*:\s*(.*)$/du;
/** 0 以上の数。小数も書ける */
const AMOUNT = /^[0-9]+(?:\.[0-9]+)?$/u;

export interface ChartSetMessages {
  /** `set` の行の形 */
  chartSetShape: string;
  /** 宣言していない項目 `id` の値を書いた */
  chartUndeclaredItem: (id: string) => string;
  /** 値 `value` が 0 以上の数でない */
  chartSetAmount: (value: string) => string;
  /** 漏斗の見た目で、項目 `item` の値 `value` が前の項目 `before` の値 `beforeValue` より大きい (#3621) */
  chartFunnelRises: (item: string, value: number, before: string, beforeValue: number) => string;
  /** 漏斗の見た目で、項目 `item` の値をどの段にも書いていない (#3621) */
  chartFunnelUnset: (item: string) => string;
}

/** 漏斗の見た目の、読んだ段までの項目の値と、書いている段の値の行 */
interface FunnelDraft {
  values: Map<string, number>;
  sets: { id: string; value: number; source: SourceLine; at: number }[];
}

/** 読んでいる量の図ごとの漏斗の値。鍵は読んでいる記法の量の図の欄 */
const FUNNELS = new WeakMap<object, FunnelDraft>();

/** 漏斗の見た目の量の図なら、その図の漏斗の値。ほかの見た目では `undefined` */
function funnelOf(state: ParseState): FunnelDraft | undefined {
  const { chart } = state.figure;
  if (chart.shape?.value !== "funnel") return undefined;
  const found = FUNNELS.get(chart);
  if (found) return found;
  const draft: FunnelDraft = { values: new Map(), sets: [] };
  FUNNELS.set(chart, draft);
  return draft;
}

/** 書いていた段の値を足し、前の項目より大きい値を持った項目が在れば、その項目か前の項目をその段で書いた値の字を指して止める */
function closeFunnelStep(state: ParseState): void {
  const draft = funnelOf(state);
  if (!draft) return;
  for (const set of draft.sets) draft.values.set(set.id, set.value);
  const order = state.figure.chart.items.map((item) => item.id);
  const i = risesAt(order, draft.values);
  if (i !== undefined) {
    const item = order[i] as string;
    const before = order[i - 1] as string;
    const latest = [...draft.sets].reverse();
    const blamed = latest.find((set) => set.id === item) ?? latest.find((set) => set.id === before);
    if (blamed) throw fail(blamed.source, blamed.at, state.m.chartFunnelRises(item, draft.values.get(item) ?? 0, before, draft.values.get(before) ?? 0));
  }
  draft.sets = [];
}

export const reading: BlockReading<ChartSetMessages> = {
  take: (source, state) => {
    const { m } = state;
    const step = state.inStep(source);
    const found = SET.exec(source.text);
    const id = found?.[1];
    const idAt = found?.indices?.[1]?.[0];
    const raw = (found?.[2] ?? "").trim();
    const rawAt = found?.indices?.[2]?.[0];
    if (!found || id === undefined || idAt === undefined || rawAt === undefined || raw === "") throw fail(source, 0, m.chartSetShape);
    if (!state.figure.chart.items.some((item) => item.id === id)) throw fail(source, idAt, m.chartUndeclaredItem(id));
    if (!AMOUNT.test(raw)) throw fail(source, rawAt, m.chartSetAmount(raw));
    step.events.push({ type: "set", item: id, value: Number(raw) });
    funnelOf(state)?.sets.push({ id, value: Number(raw), source, at: rawAt });
    return true;
  },
  beginStep: closeFunnelStep,
  finish: (state) => {
    closeFunnelStep(state);
    const draft = funnelOf(state);
    const unset = draft && state.figure.chart.items.find((item) => !draft.values.has(item.id));
    const line = unset && ITEM_LINES.get(unset);
    if (unset && line) throw fail(line.source, line.at, state.m.chartFunnelUnset(unset.id));
  },
  read: none("量の図の set の行は、中身の帯の欄の値の語なので行の形 (take) で読む"),
  print: { events: { set: (e) => `set ${e.item}: ${e.value}` } },
  messages: {
    ja: {
      chartSetShape: "量の図の値は段の中に set <項目>: <値> の形で書く",
      chartUndeclaredItem: (id) => `${id} という項目は宣言していない。最初の step より前に item ${id} の行で宣言する`,
      chartSetAmount: (value) => `${value} は量の図の値に書けない。値は 0 以上の数で、単位を付けずに書く`,
      chartFunnelRises: FUNNEL_TEXT.ja.rises,
      chartFunnelUnset: FUNNEL_TEXT.ja.unset,
    },
    en: {
      chartSetShape: "Write a chart value inside a step as set <item>: <value>",
      chartUndeclaredItem: (id) => `No item named ${id} is declared. Declare it with an item ${id} line before the first step`,
      chartSetAmount: (value) => `${value} cannot be a chart value. Write a number of 0 or more, without a unit`,
      chartFunnelRises: FUNNEL_TEXT.en.rises,
      chartFunnelUnset: FUNNEL_TEXT.en.unset,
    },
  },
};
