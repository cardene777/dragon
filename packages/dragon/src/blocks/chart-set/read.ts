/**
 * 量の図の値のブロックの読み方 (#3560)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 量の図の段の中の `set <項目>: <値>` の行を、行の形 (`take`) で読む。最初の `step` より前の行、宣言していない項目、
 * 0 以上の数でない値は、その字を指して止める
 */
import { fail } from "../../read-kit";
import { type BlockReading, none } from "../block";

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
    return true;
  },
  read: none("量の図の set の行は、中身の帯の欄の値の語なので行の形 (take) で読む"),
  print: { events: { set: (e) => `set ${e.item}: ${e.value}` } },
  messages: {
    ja: {
      chartSetShape: "量の図の値は段の中に set <項目>: <値> の形で書く",
      chartUndeclaredItem: (id) => `${id} という項目は宣言していない。最初の step より前に item ${id} の行で宣言する`,
      chartSetAmount: (value) => `${value} は量の図の値に書けない。値は 0 以上の数で、単位を付けずに書く`,
    },
    en: {
      chartSetShape: "Write a chart value inside a step as set <item>: <value>",
      chartUndeclaredItem: (id) => `No item named ${id} is declared. Declare it with an item ${id} line before the first step`,
      chartSetAmount: (value) => `${value} cannot be a chart value. Write a number of 0 or more, without a unit`,
    },
  },
};
