/**
 * `band` のブロックの読み方 (#3626)。量の行き先の図の決まりを、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 段の中の線は、書いた所で量と向きを確かめる。箱に入る量と出る量は、全ての線を読んでから記法の終わりに確かめる。
 */
import { fail, readAttrs, skipSpaces } from "../../read-kit";
import { type BlockReading, none } from "../block";
import { EDGE, type EdgeEvent } from "../edge/block";
import { amountOf } from "./amount";

export interface BandMessages {
  /** 線の名前の無い線 */
  sankeyNoAmount: string;
  /** 線の名前が数で始まらない線 */
  sankeyBadAmount: string;
  /** 行き先から前の列の箱へ戻る線 */
  sankeyBack: (from: string, to: string) => string;
  /** 同じ 2 つの箱を結ぶ 2 本目の線 */
  sankeyTwice: (from: string, to: string) => string;
  /** 入る量より出る量の和が大きい箱 */
  sankeyOver: (box: string, out: string, inflow: string) => string;
  /** 線に書いた札と置く側 */
  sankeyNoChip: string;
  /** 量の行き先の図に書けない行 */
  sankeyNoLine: (word: string) => string;
  /** 箱に書けない属性 */
  sankeyNoBoxAttr: (key: string) => string;
}

/** 量の行き先の図に書けない行の頭の語 */
const NO_LINES: readonly string[] = ["act", "group", "end", "strip", "set", "note"];

/** 量の行き先の図の箱に書けない属性 */
const NO_BOX_ATTRS: readonly string[] = ["note", "icon", "link"];

/** 小数の足し算の端数を丸めた数の字 */
const num = (value: number): string => String(Number(value.toFixed(10)));

/** 線 `flows` を辿って、箱 `start` から箱 `goal` へ着けるか */
function reaches(flows: readonly { from: string; to: string }[], start: string, goal: string): boolean {
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const at = queue.shift() as string;
    if (at === goal) return true;
    if (seen.has(at)) continue;
    seen.add(at);
    for (const f of flows) if (f.from === at) queue.push(f.to);
  }
  return false;
}

export const reading: BlockReading<BandMessages> = {
  checkHead: (source, word, state) => {
    if (NO_LINES.includes(word)) throw fail(source, 0, state.m.sankeyNoLine(word));
    if (word !== "box") return;
    const open = source.text.indexOf("[");
    if (open < 0) return;
    const attrs = readAttrs(source, open, state.attrs.box ?? [], state.m);
    for (const key of NO_BOX_ATTRS) {
      const attr = attrs.get(key);
      if (attr) throw fail(source, attr.at, state.m.sankeyNoBoxAttr(key));
    }
  },
  afterEdge: (edge, state, source) => {
    const read = edge as EdgeEvent;
    const { m } = state;
    const text = source.text;
    const found = EDGE.exec(text);
    const end = found?.[0].length ?? 0;
    const toAt = found?.indices?.[2]?.[0] ?? 0;
    if (read.carry.kind !== "envelope" || read.labelSide !== undefined) {
      const open = text.indexOf("[", end);
      throw fail(source, open < 0 ? end : open, m.sankeyNoChip);
    }
    if (read.label === undefined) throw fail(source, end, m.sankeyNoAmount);
    const at = skipSpaces(text, skipSpaces(text, end) + 1);
    const amount = amountOf(read.label);
    if (amount === undefined) throw fail(source, at, m.sankeyBadAmount);
    const { flows } = (state.figure.sankey ??= { flows: [] });
    if (flows.some((f) => f.from === read.from && f.to === read.to)) throw fail(source, toAt, m.sankeyTwice(read.from, read.to));
    if (reaches(flows, read.to, read.from)) throw fail(source, toAt, m.sankeyBack(read.from, read.to));
    flows.push({ from: read.from, to: read.to, amount, source, at });
  },
  finish: (state) => {
    const flows = state.figure.sankey?.flows ?? [];
    const inflow = new Map<string, number>();
    for (const f of flows) inflow.set(f.to, (inflow.get(f.to) ?? 0) + f.amount);
    const out = new Map<string, number>();
    for (const f of flows) {
      const total = (out.get(f.from) ?? 0) + f.amount;
      out.set(f.from, total);
      const into = inflow.get(f.from);
      // 出どころの無い箱は出る量の和を量にするので比べない
      if (into !== undefined && total > into + Math.max(into, 1) * 1e-9) throw fail(f.source, f.at, state.m.sankeyOver(f.from, num(total), num(into)));
    }
  },
  read: none("量の帯の行は無い。出どころと行き先は box の行で、線は線のブロックが読み、ここは決まりだけを確かめる"),
  print: none("量の帯は箱と線から並べるので、箱と線のブロックが書く"),
  messages: {
    ja: {
      sankeyNoAmount: "量の行き先の図の線は、: の後ろに 40% や 1,200円 のように量を書く",
      sankeyBadAmount: "量の行き先の図の線の名前は、40% や 1,200円 のように量の数で始める",
      sankeyBack: (from, to) => `${from} から ${to} へは線を引けない。量の行き先の図の線は、出どころから右の列の行き先へ流し、前の列の箱へ戻さない`,
      sankeyTwice: (from, to) => `${from} から ${to} への線は 1 本だけ書ける。量は 1 本の線の名前にまとめて書く`,
      sankeyOver: (box, out, inflow) => `${box} から出る量の和 ${out} が、${box} に入る量の和 ${inflow} より大きい。出る量は入る量の内に収める`,
      sankeyNoChip: "量の行き先の図の線は、札と置く側 (tag、carry、side) を書けない。量の札は線の名前を出す",
      sankeyNoLine: (word) => `sankey (量の行き先の図) には ${word} の行を書けない`,
      sankeyNoBoxAttr: (key) => `量の行き先の図の箱には ${key} を書けない。箱は名前と色だけを持つ`,
    },
    en: {
      sankeyNoAmount: "A line in a sankey diagram takes its amount after the :, like 40% or 1,200",
      sankeyBadAmount: "A line label in a sankey diagram starts with its amount, like 40% or 1,200",
      sankeyBack: (from, to) => `A line cannot go from ${from} to ${to}. In a sankey diagram a line flows from a box to one in a column to its right, never back`,
      sankeyTwice: (from, to) => `Only one line can go from ${from} to ${to}. Put the whole amount on one line label`,
      sankeyOver: (box, out, inflow) => `The amounts leaving ${box} add up to ${out}, more than the ${inflow} that comes into ${box}. Keep what leaves a box within what comes in`,
      sankeyNoChip: "Lines in a sankey diagram take no tag, carry or side. The amount chip shows the line label",
      sankeyNoLine: (word) => `A sankey diagram takes no ${word} lines`,
      sankeyNoBoxAttr: (key) => `A box in a sankey diagram takes no ${key}. A box has only a name and a color`,
    },
  },
};
