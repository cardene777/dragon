/**
 * dragon記法の語 (#3137)。
 *
 * 行の種類は行の頭の英語の語で決まり、属性は `[<鍵>: <値>]` で書く。
 * 語は英語だけで、原本の JSON が使う名前に揃え、記法と JSON で覚える語を 1 組にする。
 *
 * 言葉の型 (`NotationLang`) は、誤りの文と図の中の字の言葉を選ぶために持つ。
 * 語が英語だけなので、記法の file から言葉は決めず、呼ぶ側が渡す。
 *
 * 型が欠けを止める。原本の JSON の値 (図の種類、運ぶ物、見せ方、名前の側) に語が無い時は、型の検査が落ちる。
 *
 * ブロックの置き場へ移した行の語はブロックが持ち (`blocks/<名前>/block.ts` の `words`)、ここでブロックの並び (`rank`) の順に混ぜる (#3345)。
 * 行の頭の語と属性の一覧の並びは誤りの文に出るので、混ぜても今の並びを変えない (`blocks.test.ts` の `notation-words-order-unchanged` が見る)。
 */
import { ranked } from "./blocks/block";
import { FROM } from "./blocks/branch/block";
import { CARRIES } from "./blocks/carry/block";
import { HEAD, ON } from "./blocks/commit/block";
import { COPY } from "./blocks/copy/block";
import { SIDES } from "./blocks/edge-label/block";
import type { GROUP_HEADS } from "./blocks/group/block";
import { BLOCKS } from "./blocks/index";
import { LABEL_MOST } from "./blocks/item/block";
import { LANE_MOST } from "./blocks/line/block";
import { AT } from "./blocks/point/block";
import { DURATION_UNITS, NOW, SPAN_SHAPES } from "./blocks/scale/block";
import { MERGE } from "./blocks/merge/block";
import { OF } from "./blocks/node/block";
import { STATE_ENDS, type StateEnd } from "./blocks/start-finish/block";
import { VIEWS } from "./blocks/step/block";
import { TIME_EDGE_ATTRS } from "./blocks/zoom/block";
import type { Diagram } from "./schema";

export type NotationLang = "ja" | "en";

/**
 * `lang` を渡さない時の言葉 (#3338)。外の人が例のまま使っても読める文が出るように英語にする。
 * 日本語の文が要る時は `lang: "ja"` (命令は `--lang ja`) を渡す
 */
export const DEFAULT_LANG: NotationLang = "en";

/** 仮名か漢字 */
const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/**
 * 図の字の言葉 (#3516)。図の題か段の本文 (`say`) に仮名か漢字があれば日本語、無ければ英語。
 * 置く頁を持たない書き出しが、言葉を渡されない時に図に足す字 (状態遷移図の脇道、始まりと終わりの印など) の言葉を決めるために使う。
 * 箱の名前と線の名前は数えない。英語の図が日本語の会社の名前を箱に持つことがあるため
 */
export function textLang(diagram: Pick<Diagram, "title" | "steps">): NotationLang {
  return [diagram.title, ...diagram.steps.map((step) => step.body)].some((text) => KANA_KANJI.test(text)) ? "ja" : "en";
}

const keys = <K extends string>(table: Record<K, true>): K[] => Object.keys(table) as K[];

/** 図の種類。最初の行の頭の語 */
export const KINDS = keys<Diagram["kind"]>({ sequence: true, architecture: true, state: true, git: true, time: true, tree: true, lineup: true, try: true, pipe: true, chart: true, flow: true });

/**
 * 状態遷移図の始まりと終わりの印の名前 (#3163)。線の送る側に `start`、受ける側に `finish` を書き、
 * 状態遷移図では箱の名札に使えない。時系列図と構成図では、宣言して使う普通の名札。始まりと終わりのブロックが持つ (#3347)
 */
export { STATE_ENDS, type StateEnd };

/**
 * 時間軸の図 (`time`、#3165) で針を進める行 (`now -> <目盛り>`) の送る側の名前。線の行と同じ形なので行の頭の語に入れない。
 * 時間軸の図では名札に使えず、ほかの図では普通の名札のまま。目盛りと針のブロックが持つ (#3348)
 */
export { NOW };

/** 1 列に並べられるチップの上限は列の並びのブロックが、チップの字の上限はチップのブロックが持つ (#3239、#3348) */
export { LABEL_MOST, LANE_MOST };

/** ブロックの並び (`rank`) の順のブロック */
const RANKED = ranked(BLOCKS);

/**
 * 最初の行より後の行の頭の語。線の行だけは箱の名札から始まる。
 * `branch` と `commit` は枝分かれの図 (`git`) だけが書け (#3164)、枝と commit のブロックが持つ (#3347)。段の出典の `source` は出典のブロックが持つ (#3199、#3345)。
 * ブロックの語は、`words.headRanks` に番号を書いた語はその番号で、ほかはブロックの並びの番号で並べる
 */
export const HEADS: readonly string[] = RANKED.flatMap((block) => (block.words.heads ?? []).map((head) => [block.words.headRanks?.[head] ?? block.rank, head] as const))
  .sort(([a], [b]) => a - b)
  .map(([, head]) => head);

/**
 * 枝分かれの図 (#3164) の `commit` の行で、積む枝、当て直しの元、取り込む枝を続ける語 (`commit <名札> on <枝> copy <commit>`)、
 * 枝を切る行の `from` と、今いる場所を指す札の名前 `HEAD`。commit と当て直しと merge commit と枝のブロックが持つ (#3347)
 */
export { COPY, FROM, HEAD, MERGE, ON };
/** 枝分かれの図の行の中の語のうち、行の頭の語でも属性でもない語。見本帳の部品が受け持つ語に数える (`on` は commit の行に必ず書くので数えない) */
export const GIT_WORDS = [FROM, COPY, MERGE] as const;

/** 時間軸の図の節目の行で、節目を置く目盛りを続ける語 (`point <名札> at <目盛り>`)。節目のブロックが持つ (#3348) */
export { AT };

/** 木の図の `node` の行で、親の名札の後ろに子を続ける語 (`node <名札> of <子>, <子>`)。組んだ親のブロックが持つ (#3348) */
export { OF };

/** 属性の鍵の表の型。鍵は行の頭の語で、線の行は `edge` */
type Attrs = Readonly<Record<string, readonly string[]>>;

/**
 * 行ごとに書ける属性の鍵。線の `at` と `into`、`note` の `color`、中身の帯の欄の `meter` は時間軸の図だけが書ける (#3165)。
 * `meter` は `strip` の行の欄ごとに、欄の名前の後ろに書く (`strip <題>: <欄> [meter: <割合>]`)
 * 箱の `link` は飛び先、段の出典の `url` は出典の在り処 (#3199)。
 * 鍵は全てブロックが持ち、並びの番号の小さい順に並べる (#3345、#3348)
 */
export const ATTRS: Attrs = (() => {
  const all: Record<string, readonly string[]> = {};
  for (const block of RANKED) for (const [line, keys] of Object.entries(block.words.attrs ?? {})) all[line] = [...(all[line] ?? []), ...keys];
  return all;
})();

/**
 * 線の属性のうち時間軸の図だけが書ける鍵は拡大の帯のブロックが、`span` の行の `shape` に書ける形と目盛りの長さに書ける単位は
 * 目盛りと針のブロックが持つ (#3348)
 */
export { DURATION_UNITS, SPAN_SHAPES, TIME_EDGE_ATTRS };

/** `carry` に書ける運ぶ物は運ぶ物のブロック、`side` に書ける側は線の名前のブロック、`view` に書ける見せ方は段のブロックが持つ (#3345) */
export { CARRIES, SIDES, VIEWS };

/**
 * 前の形の行 (#2997 まで) が、新しい形のどの行に当たるか。誤りの文で新しい行の形を示すために引く。
 * 鍵は前の形の行の頭の語で、記号 (`#` など) で始まる行と、名札の後ろに `=` や「」が来る行は読む側が見分ける。
 */
export const OLD_HEADS = {
  時系列図: "sequence",
  構成図: "architecture",
  区画: "group",
  見せ方: "view",
  region: "group",
  view: "view",
} as const satisfies Record<string, Diagram["kind"] | (typeof GROUP_HEADS)[number] | "view">;
