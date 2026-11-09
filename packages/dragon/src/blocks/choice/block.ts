/**
 * 判断のブロック (#3561)。
 *
 * 手順の図の部品 (`only: flow`)。`choice <名札> as <問い>` の行で判断を宣言し、判断はひし形で描く。
 * 判断から出る線は 2 本までで、どれも線の名前 (「はい」「いいえ」) を持つ。
 * 手順の図の決まりもこのブロックが持つ。線の送る側に始まりの印 `start`、受ける側に終わりの印 `finish` を書け、2 つは名札に使えない。
 * 最初の `step` より前に書いた線は今回は通らない道になり、点線で引く。本筋で前に置いた箱へ戻る線と、`group` の行は書けない。
 * 最初の段より前の線は線の行と同じ形なので行の頭の語を持たず、定義の `lines` で名指し、読み方 (`read.ts`) の `take` が読む。
 * 原本の欄は判断の `blocks.choice` と、骨組み (`schemas/base.schema.json`) が持つ道の `blocks.path`。
 * 判断から同じ段に書いた 2 本の線は同時に走り出し、先に書いた線が本筋を進み、後に書いた線は横へ分かれる (#3579)。
 */
import type { SourceLine } from "../../tokenize";
import type { Block } from "../block";
import { STATE_ENDS } from "../start-finish/block";

/** 本筋を読み進める途中の形。`main` は本筋の順、`side` は本筋から横へ分かれた箱、`forked` は今の段で線を出した判断 */
export interface MainWalk {
  main: string[];
  side: string[];
  forked: string[];
}

/**
 * 段の線を 1 本読んで本筋を進める (#3579)。本筋は段の線が初めて辿り着く順の箱と判断で、始まりと終わりの印は入れない。
 * 判断から同じ段に書いた 2 本目の線と、横へ分かれた箱から出る線は本筋を進めず、線の先の箱を横へ分かれた箱にする。
 * 段の変わり目で `forked` を空にするのは呼ぶ側が持つ
 */
export function walkLine(walk: MainWalk, line: { from: string; to: string }, isChoice: (id: string) => boolean): void {
  const isEnd = (id: string): boolean => (STATE_ENDS as readonly string[]).includes(id);
  const fork = walk.forked.includes(line.from);
  if (isChoice(line.from) && !fork) walk.forked.push(line.from);
  if (fork || (walk.side.includes(line.from) && !walk.main.includes(line.from))) {
    if (!isEnd(line.to) && !walk.main.includes(line.to) && !walk.side.includes(line.to)) walk.side.push(line.to);
    return;
  }
  for (const id of [line.from, line.to]) if (!isEnd(id) && !walk.main.includes(id)) walk.main.push(id);
}

/** 判断。名札と問い */
export interface FlowChoice {
  id: string;
  name: string;
}

/** 読んだ線。書いた行と、受ける側の名札の列と、段の中の線か。記法を読み終えた時に、最初の段より前の線を確かめるために積む */
export interface FlowLine {
  source: SourceLine;
  from: string;
  to: string;
  toAt: number;
  inStep: boolean;
}

/** 判断が出せる線の数。「はい」と「いいえ」の 2 本 */
export const CHOICE_WAYS = 2;

export interface ChoiceFieldMessages {
  /** 手順の図の原本の箱と判断の名札に、始まりか終わりの印の名前を書いた */
  flowReserved: (names: readonly string[]) => string;
}

export const block: Block<ChoiceFieldMessages> = {
  name: "choice",
  rank: 135,
  attach: { how: "place", only: "flow" },
  words: { heads: ["choice"] },
  // 最初の段より前の線は今回は通らない道で、行の形で読む
  lines: [{ edges: "before-steps" }],
  // 手順の図の線の端と、名札に使えない名前と、読み終えた時の線の確かめを持つ
  always: true,
  fieldMessages: {
    ja: { flowReserved: (names) => `${names.join(" と ")} は手順の図の始まりと終わりの印の名前で、箱と判断の名札に使えない` },
    en: { flowReserved: (names) => `${names.join(" and ")} name the start and end marks of a flow diagram and cannot be box or choice ids` },
  },
};
