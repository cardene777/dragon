/**
 * 量の図の項目のブロックの読み方 (#3560)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 量の図の `item <名札> as <名前> [color: <色>]` の行を、行の形 (`take`) で読む。量の図に書ける行は項目と値と段の行だけで、
 * ほかの行の頭の語 (`checkHead`) と線の行は誤りで止める。項目が 1 つも無い図は読み終えた時 (`finish`) に止める。
 * `none` (#3635) は漏斗のほかの見た目でどの項目にも入らない数を書く語 (`set none: <値>`) なので、その見た目では項目の名札に使えない
 */
import { attrs, shown } from "../../print-kit";
import { fail, isOneOf, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState, ranked } from "../block";
import { type Color, COLORS } from "../color/block";
import { BLOCKS } from "../index";
import type { ChartShape } from "../chart-shape/block";
import { CHART_ITEMS_MOST, type ChartItem } from "./block";

/** 量の図の `item` の行に書ける属性の鍵 */
const CHART_ITEM_ATTRS: readonly string[] = ["color"];

/** 量の図に書ける行の頭の語。量の図だけのブロックの語と、項目と値の行と、段の行 */
const CHART_LINES: readonly string[] = [
  ...ranked(BLOCKS).flatMap((block) => (block.attach.only === "chart" ? (block.words.heads ?? []) : [])),
  ...["item", "set", "step", "say", "code", "source"],
];

/** どの項目にも入らない数を書く語 (#3635)。漏斗のほかの見た目の量の図では項目の名札に使えない */
export const CHART_NONE = "none";

export interface ChartItemMessages {
  /** `item` の行が 1 つも無い量の図 */
  chartNoItems: string;
  /** 上限 `most` 個を超えて項目を宣言した */
  chartTooManyItems: (most: number) => string;
  /** 量の図に書けない行 (箱、区画、帯など) を書いた */
  chartNoLine: (word: string) => string;
  /** 量の図に線の行を書いた */
  chartNoEdge: string;
  /** 漏斗のほかの見た目の量の図で、項目の名札に `none` を書いた (#3635) */
  chartNoneId: string;
}

/**
 * 宣言した項目と、宣言した行と名札の位置。漏斗の見た目 (#3621) で値を書かないまま終わった項目を、値の行を読む所 (`blocks/chart-set/read.ts`) が
 * 読み終えた時に宣言の行の名札を指して断るのに使う
 */
export const ITEM_LINES = new WeakMap<ChartItem, { source: SourceLine; at: number }>();

/** 量の図の `item <名札> as <名前> [color: <色>]` の行。名前を書かない項目は名札を名前にする */
function readChartItem(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const declared = readDeclared(source, "item", CHART_ITEM_ATTRS, m);
  const color = declared.attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  state.claim(source, declared.id, declared.idAt);
  const { items } = state.figure.chart;
  if (items.length >= CHART_ITEMS_MOST) throw fail(source, 0, m.chartTooManyItems(CHART_ITEMS_MOST));
  const item: ChartItem = { id: declared.id, name: declared.name ?? declared.id, ...(color ? { color: color.value as Color } : {}) };
  ITEM_LINES.set(item, { source, at: declared.idAt });
  items.push(item);
}

/** 項目の宣言の行。名前が名札と同じ項目は `as` を書かない */
const itemLine = (item: ChartItem): string => `item ${item.id}${shown(item.id, item.name)}${attrs([["color", item.color]])}`;

export const reading: BlockReading<ChartItemMessages> = {
  take: (source, state, view) => {
    if (view.edgeFrom !== undefined) throw fail(source, 0, state.m.chartNoEdge);
    readChartItem(source, state);
    return true;
  },
  checkHead: (source, word, state) => {
    if (!CHART_LINES.includes(word)) throw fail(source, 0, state.m.chartNoLine(word));
  },
  reserved: (source, id, at, state) => {
    if (id === CHART_NONE && state.figure.chart.shape?.value !== "funnel") throw fail(source, at, state.m.chartNoneId);
  },
  finish: (state, head) => {
    const { chart } = state.figure;
    if (chart.items.length === 0) throw fail(head, 0, state.m.chartNoItems);
    // 見た目は見た目のブロックが `donut` か `bar` か `funnel` か `dots` と、1 点の件数は 0 より大きい数と確かめた
    state.figure.root = { ...state.figure.root, chart: { shape: chart.shape?.value as ChartShape, ...(chart.unit ? { unit: Number(chart.unit.value) } : {}), items: chart.items } };
  },
  read: none("量の図の item の行は、列の図のチップの語なので行の形 (take) で読む"),
  print: {
    // 図の種類の行の直ぐ後ろ、最初の step より前に、宣言した順に 1 行ずつ書く
    declare: (diagram) => (diagram.chart ? [diagram.chart.items.map(itemLine).join("\n")] : []),
  },
  messages: {
    ja: {
      chartNoItems: "item の行で項目を 1 つ以上宣言する",
      chartTooManyItems: (most) => `chart (量の図) の項目は ${most} 個までにする`,
      chartNoLine: (word) => `chart (量の図) には ${word} の行を書けない。項目は item の行で、値は段の中の set の行で書く`,
      chartNoEdge: "chart (量の図) には線の行を書けない。値は段の中の set の行で書く",
      chartNoneId: "none は項目の名札にできない。none はどの項目にも入らない数を set none: <値> で書く語",
    },
    en: {
      chartNoItems: "Declare at least one item with an item line",
      chartTooManyItems: (most) => `A chart takes at most ${most} items`,
      chartNoLine: (word) => `A chart takes no ${word} lines. Declare items with item lines and write values with set lines inside steps`,
      chartNoEdge: "A chart takes no edge lines. Write values with set lines inside steps",
      chartNoneId: "none cannot be an item id. none is the word for the count in no item, written as set none: <value>",
    },
  },
};
