/**
 * `gauge` のブロックの読み方 (#3880)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 *
 * 宣言の行は `gauge <名札> as <名前> [on: <箱>, limit: <数>, unit: <単位>, over: <字>]` で、最初の `step` より前に書く。
 * この読み方は手順の図と列の図の図を読む時だけ後から読み、ほかの種類の図に書いた行は読む処理 (`parser.ts`) が読み方を読まずに断る。
 * `on` の箱と、名札が中身の帯の欄と重ならないかは、全ての宣言を読んでから (最初の段を始める時か記法の終わりに) 確かめ、誤りは目盛りの行に出す。
 * 段の中の `set <目盛り>: <総量>` の行は、目盛りを 1 つでも宣言した図でだけ、行の形 (`take`) で中身の帯より先に読む。
 * 行の後ろの `[hold: <予約>]` は予約した量で、値を確定した量として読む。予約は上限を書いた目盛りにだけ書ける (#3895)。
 * 目盛りの名札でなく中身の帯の欄でもない名前の `set` の行は、目盛りが無いと断る。目盛りを宣言しない図の `set` の行は今どおり中身の帯が読む。
 */
import { attrs, name, num, quote, shown } from "../../print-kit";
import { fail, readDeclared, readQuoted, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import type { Gauge, GaugeDraft } from "./block";

export interface GaugeMessages {
  /** 段の中に書いた */
  gaugeInStep: string;
  /** `on` の箱 `box` を宣言していない */
  gaugeNoBox: (box: string) => string;
  /** 上限が 0 より大きい数でない */
  gaugeLimit: string;
  /** 上限を書かない目盛りに `over` を書いた */
  gaugeOverWithoutLimit: string;
  /** 名札 `id` が中身の帯の欄と同じ */
  gaugeClash: (id: string) => string;
  /** 層の見た目か階段の見た目の列の図に書いた */
  gaugeLayers: string;
  /** `set` の名前 `id` が目盛りでも中身の帯の欄でもない */
  noSuchGauge: (id: string) => string;
  /** 目盛り `id` の値が 0 以上の数でない */
  gaugeValue: (id: string) => string;
  /** 目盛りの `set` の行の形が違う */
  gaugeSetShape: string;
  /** 目盛り `id` の予約の量が 0 以上の数でない (#3895) */
  gaugeHold: (id: string) => string;
  /** 上限を書かない目盛りに予約を書いた (#3895) */
  gaugeHoldWithoutLimit: string;
}

/** 0 以上の数の字。値と上限の字の形 */
const NUMBER = /^[0-9]+(\.[0-9]+)?$/u;

/** `set` の行の後ろの予約の量の属性 (`[hold: <予約>]`)。1 つ目の組は予約の字 */
const HOLD = /^\[\s*hold\s*:\s*([^\],]*?)\s*\]$/u;

/** 書き戻す時に `set` の後ろに置く名札 */
const keyText = (text: string): string => (text.includes(":") || text.includes("[") || text.startsWith('"') ? quote(text) : text);

/** 読んでいる記法ごとの、宣言した目盛り。記法の状態の欄 (`figure.gauge`) に置く */
const declaredOf = (state: ParseState): GaugeDraft[] => (state.figure.gauge ??= []);

/** `gauge <名札> as <名前> [on: <箱>, limit: <数>, unit: <単位>, over: <字>]` の行 */
function readGauge(source: SourceLine, state: ParseState): void {
  const { m } = state;
  if (state.current()) throw fail(source, 0, m.gaugeInStep);
  state.beforeSteps(source);
  const read = readDeclared(source, "gauge", state.attrs.gauge ?? [], m);
  state.claim(source, read.id, read.idAt);
  const strip = state.figure.strip;
  if (strip?.fields.includes(read.id)) throw fail(source, read.idAt, m.gaugeClash(read.id));
  const limit = read.attrs.get("limit");
  if (limit && (!NUMBER.test(limit.value) || Number(limit.value) <= 0)) throw fail(source, limit.at, m.gaugeLimit);
  const over = read.attrs.get("over");
  if (over && !limit) throw fail(source, over.at, m.gaugeOverWithoutLimit);
  const on = read.attrs.get("on");
  const unit = read.attrs.get("unit")?.value;
  const gauge: Gauge = {
    id: read.id,
    name: read.name ?? read.id,
    ...(on ? { on: on.value } : {}),
    ...(limit ? { limit: Number(limit.value) } : {}),
    ...(unit !== undefined ? { unit } : {}),
    ...(over ? { over: over.value } : {}),
  };
  declaredOf(state).push({ gauge, source, idAt: read.idAt, ...(on ? { on } : {}) });
}

/**
 * 段の中の `set <目盛り>: <総量>` の行。目盛りの名札を書いた行を読んで true を返す。
 * 中身の帯の欄の行は読まずに false を返し、中身の帯のブロックが読む
 */
function takeSet(source: SourceLine, state: ParseState): boolean {
  const declared = declaredOf(state);
  if (declared.length === 0) return false;
  const { m } = state;
  const text = source.text;
  const start = skipSpaces(text, "set".length);
  let id: string;
  let at: number;
  if (text[start] === '"') {
    const quoted = readQuoted(source, start, m);
    id = quoted.value;
    at = skipSpaces(text, quoted.end);
  } else {
    at = start;
    while (at < text.length && text[at] !== ":" && text[at] !== "[") at++;
    id = text.slice(start, at).trim();
  }
  if (!declared.some((d) => d.gauge.id === id)) {
    if (state.figure.strip?.fields.includes(id)) return false;
    throw fail(source, start, m.noSuchGauge(id));
  }
  if (text[at] !== ":") throw fail(source, at, m.gaugeSetShape);
  const valueAt = skipSpaces(text, at + 1);
  const rest = text.slice(valueAt).trim();
  const bracket = rest.indexOf("[");
  const value = bracket < 0 ? rest : rest.slice(0, bracket).trim();
  if (!NUMBER.test(value)) throw fail(source, valueAt, m.gaugeValue(id));
  if (bracket < 0) {
    state.inStep(source).events.push({ type: "gauge", gauge: id, value: Number(value) });
    return true;
  }
  // 値の後ろの属性は予約の量 (`[hold: <予約>]`) だけを書ける
  const holdAt = valueAt + bracket;
  const hold = HOLD.exec(rest.slice(bracket));
  if (!hold) throw fail(source, holdAt, m.gaugeSetShape);
  if (declared.find((d) => d.gauge.id === id)?.gauge.limit === undefined) throw fail(source, holdAt, m.gaugeHoldWithoutLimit);
  if (!NUMBER.test(hold[1] ?? "")) throw fail(source, holdAt, m.gaugeHold(id));
  state.inStep(source).events.push({ type: "gauge", gauge: id, value: Number(value), hold: Number(hold[1]) });
  return true;
}

export const reading: BlockReading<GaugeMessages> = {
  read: { gauge: readGauge },
  take: takeSet,
  // `on` の箱は目盛りの行より後に宣言してもよく、中身の帯も後に宣言できるので、全ての宣言を読んでから確かめる
  settle: (state) => {
    const { m, figure } = state;
    for (const { gauge, source, idAt, on } of declaredOf(state)) {
      if (on && !figure.boxes.some((box) => box.id === on.value)) throw fail(source, on.at, m.gaugeNoBox(on.value));
      if (figure.strip?.fields.includes(gauge.id)) throw fail(source, idAt, m.gaugeClash(gauge.id));
      const look = figure.lineup.shape?.value;
      if (state.kind === "lineup" && (look === "layers" || look === "stairs")) throw fail(source, 0, m.gaugeLayers);
    }
  },
  print: {
    events: { gauge: (e) => `set ${keyText(e.gauge)}: ${e.value}${e.hold === undefined ? "" : ` [hold: ${e.hold}]`}` },
    figure: (diagram) =>
      (diagram.gauge ?? []).map(
        (g) => `gauge ${name(g.id)}${shown(g.id, g.name)}${attrs([["on", g.on], ["limit", num(g.limit)], ["unit", g.unit], ["over", g.over]])}`,
      ),
  },
  messages: {
    ja: {
      gaugeInStep: "gauge は最初の step より前に書く",
      gaugeNoBox: (box) => `${box} という箱は無い。gauge の on には宣言した箱の名札を書く`,
      gaugeLimit: "gauge の limit は 0 より大きい数で書く",
      gaugeOverWithoutLimit: "gauge の over は limit を書いた目盛りにだけ書ける",
      gaugeClash: (id) => `${id} は strip の欄と同じ名前なので、gauge の名札に使えない`,
      gaugeLayers: "gauge は層の見た目 (layers) と階段の見た目 (stairs) の列の図に書けない",
      noSuchGauge: (id) => `${id} という目盛りは無い。set の前に gauge ${id} as <名前> で宣言する`,
      gaugeValue: (id) => `${id} の値は 0 以上の数で書く`,
      gaugeSetShape: "目盛りの set は set <目盛り>: <総量> か set <目盛り>: <確定> [hold: <予約>] の形で書く",
      gaugeHold: (id) => `${id} の hold は 0 以上の数で書く`,
      gaugeHoldWithoutLimit: "gauge の hold は limit を書いた目盛りにだけ書ける",
    },
    en: {
      gaugeInStep: "Write gauge before the first step",
      gaugeNoBox: (box) => `There is no box named ${box}. Write a declared box in the on of gauge`,
      gaugeLimit: "Write the limit of gauge as a number above 0",
      gaugeOverWithoutLimit: "Write over only on a gauge that has a limit",
      gaugeClash: (id) => `${id} is also a strip field, so it cannot name a gauge`,
      gaugeLayers: "A lineup with shape layers or stairs cannot have a gauge",
      noSuchGauge: (id) => `There is no gauge named ${id}. Declare it with gauge ${id} as <name> before set`,
      gaugeValue: (id) => `Write the value of ${id} as a number of 0 or more`,
      gaugeSetShape: "Write set for a gauge as set <gauge>: <total> or set <gauge>: <confirmed> [hold: <held>]",
      gaugeHold: (id) => `Write the hold of ${id} as a number of 0 or more`,
      gaugeHoldWithoutLimit: "Write hold only on a gauge that has a limit",
    },
  },
};
