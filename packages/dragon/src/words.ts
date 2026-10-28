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
 */
import type { Carry, Diagram, LabelSide, ViewMode } from "./schema";

export type NotationLang = "ja" | "en";

const keys = <K extends string>(table: Record<K, true>): K[] => Object.keys(table) as K[];

/** 図の種類。最初の行の頭の語 */
export const KINDS = keys<Diagram["kind"]>({ sequence: true, architecture: true, state: true });

/**
 * 状態遷移図の始まりと終わりの印の名前 (#3163)。線の送る側に `start`、受ける側に `finish` を書き、
 * 状態遷移図では箱の名札に使えない。時系列図と構成図では、宣言して使う普通の名札
 */
export const STATE_ENDS = ["start", "finish"] as const;
export type StateEnd = (typeof STATE_ENDS)[number];

/** 最初の行より後の行の頭の語。線の行だけは箱の名札から始まる */
export const HEADS = ["group", "end", "box", "strip", "step", "say", "code", "act", "note", "set"] as const;
type Head = (typeof HEADS)[number];

/** 箱と区画の名札の後ろに、見せる名前を続ける語 (`box <名札> as <名前>`) */
export const AS = "as";

/** 行ごとに書ける属性の鍵 */
export const ATTRS = {
  diagram: ["view"],
  group: ["note", "color", "icon"],
  box: ["note", "color", "icon"],
  edge: ["carry", "tag", "side"],
  set: ["tag"],
} as const;

/** `carry` に書ける運ぶ物。封筒は書かない時、札は `tag` で書く */
export const CARRIES = keys<Exclude<Carry["kind"], "envelope" | "tag">>({ coin: true, none: true });
export const VIEWS = keys<ViewMode>({ fixed: true, follow: true });
export const SIDES = keys<LabelSide>({ above: true, below: true, left: true, right: true });

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
} as const satisfies Record<string, Diagram["kind"] | Head | "view">;
