/**
 * 走査の指摘の本文を、開いた言語で出す (#2460 の札と同じ趣旨、 本 file は #2464)。
 *
 * 軸の呼び名は画面の側が持っている (`axis-names.ts`) が、本文は engine
 * (`@cardenelabs/cdl`) が日本語で返す。 engine は別 repo で言語を選ぶ口を持たないので、
 * 画面の側で英語に組み直す。
 *
 * ## 本文を読み直すのは、engine が形を約束しているから
 *
 * 散文の語を判定材料にするのは普通は誤りだが、ここは例外にあたる。
 * engine の型宣言が `detail` について「`どの 2 つが何 px か` を固定の形で持ち、
 * 消費側がそこから id を読み取っている」 と書いており、既にこの repo の自動修正
 * (`auto-fix-offsets.ts`) が同じ前提で id を読んでいる。
 *
 * それでも **読めなかった時に推測しない**。 形が変わったら当たらないので、
 * その時は軸の呼び名だけを出す。 日本語の文をそのまま英語の画面へ出すことはしない。
 *
 * ## 引用の中は訳さない
 *
 * 本文に出る `"受付"` のような字は **図を書いた人の言葉** で、画面の飾りではない。
 * 訳すと図の中の字と指摘の字が食い違い、どこを直せばよいか分からなくなる。
 * そのまま移す。
 *
 * ## 型の母集団は実物から導く
 *
 * 型を書く軸は、実物の見本と編集画面の見本を走らせて出た軸に限る。
 * 検査が同じ走査を回し、型を持たない軸が 1 つでも出れば落ちる。
 *
 * **読めない見本を黙って飛ばさない**。 検査側で `try` に包んでいた間、編集画面の見本は
 * 1 枚も走っておらず、軸を 1 つ取りこぼしていた (`arrow-endpoint-center`)。
 */

import type { Violation } from "@cardenelabs/cdl";
import { AXIS_NAMES } from "./axis-names";
import type { Locale } from "./i18n";

/** 1 軸ぶんの読み直し。 当たらなければ `null` を返して、呼ぶ側が軸の呼び名へ落とす */
interface 型 {
  形: RegExp;
  英語: (m: RegExpMatchArray) => string | null;
}

/** 向きを表す語。 型に出てくるものだけを持つ = 知らない語が来たら当てずに落とす */
const 向き: Record<string, string> = {
  横: "width",
  縦: "height",
  幅: "width",
  高さ: "height",
};

/**
 * 軸ごとの本文の型。
 *
 * **1 つの軸に 1 つの形**。 実物を走らせて出た本文は、軸ごとに 1 つの形へ収まっている
 * (変わるのは名前と数だけ)。 形が 2 つに割れた軸が出たら、その時に足す。
 * 軸の数はこの表が SSOT で、実物に出た軸を全部持っているかは検査が見る。
 */
const 型たち: Record<string, 型> = {
  "structured-data-extraction": {
    形: /^diagram "(.*)" 有名 node 数 (\d+) < (\d+)、 structured-data 抽出に必要な最小要素不足$/,
    // 図の題は出さない = 編集画面が見ているのは開いている 1 枚だけで、題を足しても指す先が増えない
    英語: (m) =>
      `Only ${m[2]} of the ${m[3]} well-known boxes are here, so a machine cannot read the diagram`,
  },
  "responsive-viewport": {
    形: /^viewBox (\d+)×(\d+) は器 (\d+)×(\d+)px で ([\d.]+) 倍に縮み、 箱の題が ([\d.]+)px になる \(下限 (\d+)px、 倍率を決めたのは (.+?)、 (.+?) (\d+) 以下にすると届く\)$/,
    英語: (m) => {
      const 決め手 = 向き[m[8]!];
      const 直す先 = 向き[m[9]!];
      if (決め手 === undefined || 直す先 === undefined) return null;
      return `The ${m[1]}×${m[2]} drawing shrinks to ${m[5]}× inside the ${m[3]}×${m[4]}px frame, so box titles come out at ${m[6]}px (floor ${m[7]}px, ${決め手} sets the scale, and a ${直す先} of ${m[10]} or less reaches it)`;
    },
  },
  "edge-label-proximity": {
    形: /^edge "(.*)" label の箱が線から (\d+)px 離れている \((.+?)、 label 位置調整推奨、 warn 閾値 (\d+)px\)$/,
    英語: (m) =>
      `The label for line "${m[1]}" sits ${m[2]}px away from it (${m[3]}, move the label, warning threshold ${m[4]}px)`,
  },
  "text-readability": {
    形: /^名札 "(.*)" title "(.*)" が node 幅 (\d+)px を超過する可能性 \(期待 (\d+)px\)$/,
    英語: (m) =>
      `The title "${m[2]}" on box "${m[1]}" may not fit the box width ${m[3]}px (it needs ${m[4]}px)`,
  },
  "node-visibility": {
    形: /^node "(.*)" size ([\d.]+)x([\d.]+) 未満 \(要 ([\d.]+)x([\d.]+) 以上\)$/,
    英語: (m) =>
      `Box "${m[1]}" is ${m[2]}x${m[3]}, under the required ${m[4]}x${m[5]}`,
  },
  "edge-node-cross": {
    形: /^edge "(.*)" \(from=(.*) to=(.*)\) が関係ない 名札 "(.*)" を貫通$/,
    英語: (m) => `Line "${m[1]}" (from=${m[2]} to=${m[3]}) runs through the unrelated box "${m[4]}"`,
  },
  "column-gap-uniform": {
    形: /^lane "(.*)" 内 node 間の端間 gap variance ([\d.]+) world が spec ([\d.]+) 超過 \(min=(-?[\d.]+) max=(-?[\d.]+)\)$/,
    英語: (m) =>
      `In lane "${m[1]}", the end-to-end gap variance is ${m[2]} world, over the ${m[3]} allowed (min=${m[4]} max=${m[5]})`,
  },
  clearance: {
    形: /^(.+?) ↔ (.+?) gap=(-?[\d.]+)px \(need ([\d.]+)px\)$/,
    英語: (m) =>
      `"${m[1]}" and "${m[2]}" have a ${m[3]}px gap, under the ${m[4]}px required`,
  },
  "arrow-endpoint-anchoring": {
    形: /^edge "(.*)" to endpoint が node "(.*)" 内側に沈み込み \(pt=(-?[\d.]+),(-?[\d.]+)、 node bbox=(-?[\d.]+),(-?[\d.]+)\+([\d.]+)x([\d.]+)\)$/,
    英語: (m) =>
      `The end of line "${m[1]}" at (${m[3]},${m[4]}) sinks inside box "${m[2]}" with bounds ${m[5]},${m[6]}+${m[7]}x${m[8]}`,
  },
  "arrow-marker-clearance": {
    形: /^edge "(.*)" arrow head が node "(.*)" 内側に ([\d.]+) world 食い込み$/,
    英語: (m) =>
      `The arrow head on line "${m[1]}" reaches ${m[3]} world inside box "${m[2]}"`,
  },
  "node-vertical-clearance": {
    形: /^lane "(.*)" 内 名札 "(.*)" ↔ "(.*)" の垂直 gap (-?\d+) world が (\d+) 未満$/,
    英語: (m) =>
      `In lane "${m[1]}", the vertical gap between "${m[2]}" and "${m[3]}" is ${m[4]} world, under the ${m[5]} required`,
  },
  "arrow-endpoint-center": {
    形: /^edge "(.*)" 終点 \((-?\d+),(-?\d+)\) が 名札 "(.*)" toSide=(\w+) 辺中央 \((-?\d+),(-?\d+)\) から ([\d.]+) world 離れ、 4 隅 zone 判定 \(許容 ([\d.]+)\)$/,
    英語: (m) =>
      `The end of line "${m[1]}" at (${m[2]},${m[3]}) sits ${m[8]} world from the middle of the ${m[5]} side of box "${m[4]}" at (${m[6]},${m[7]}), which reads as a corner (allowed ${m[9]})`,
  },
  "detour-slot-distinct": {
    形: /^edge "(.*)" と "(.*)" が同 obstacle を(上方|下方) detour \((peak X 差|crest 区間の重なり) ([\d.]+) world\)、 peak Y 差 ([\d.]+) world が spec ([\d.]+) 未満 \(path 重なり\)$/,
    英語: (m) =>
      `Lines "${m[1]}" and "${m[2]}" detour ${m[3] === "上方" ? "above" : "below"} the same obstacle (${m[4] === "peak X 差" ? "peak X difference" : "crest overlap"} ${m[5]} world), but their peak Y positions are only ${m[6]} world apart, under the ${m[7]} required`,
  },
  "group-boundary-clearance": {
    形: /^lane "(.*)" 内 名札 "(.*)" が lane 幅から水平方向に (-?\d+) world はみ出し$/,
    英語: (m) =>
      `In lane "${m[1]}", box "${m[2]}" sticks out ${m[3]} world past the lane width`,
  },
};

/** 型を持つ軸の一覧。 検査が母集団と突き合わせる */
export const 本文の型を持つ軸 = Object.keys(型たち);

/**
 * 指摘の本文を、開いた言語で返す。
 *
 * 日本語では engine の本文をそのまま出す (訳す前と 1 字も変えない)。
 * 英語では型で読み直し、読めなければ軸の呼び名を出す。
 */
export function 指摘の本文(指摘: Violation, locale: Locale): string {
  if (locale === "ja") return 指摘.detail;
  const 型 = 型たち[指摘.axis];
  if (型 !== undefined) {
    const m = 指摘.detail.match(型.形);
    if (m !== null) {
      const 文 = 型.英語(m);
      if (文 !== null) return 文;
    }
  }
  return AXIS_NAMES[指摘.axis]?.en ?? 指摘.axis;
}
