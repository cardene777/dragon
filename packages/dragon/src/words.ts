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
export const KINDS = keys<Diagram["kind"]>({ sequence: true, architecture: true, state: true, git: true, time: true });

/**
 * 状態遷移図の始まりと終わりの印の名前 (#3163)。線の送る側に `start`、受ける側に `finish` を書き、
 * 状態遷移図では箱の名札に使えない。時系列図と構成図では、宣言して使う普通の名札
 */
export const STATE_ENDS = ["start", "finish"] as const;
export type StateEnd = (typeof STATE_ENDS)[number];

/**
 * 時間軸の図 (`time`、#3165) だけが書ける行の頭の語。目盛り、区切り、印の列、節目、拡大の範囲を最初の段より前に宣言し、
 * 段の中で印の色を変え (`mark`)、範囲に括弧か囲みを出す (`span`)
 */
export const TIME_HEADS = ["scale", "period", "row", "point", "zoom", "mark", "span"] as const;
/**
 * 時間軸の図で針を進める行 (`now -> <目盛り>`) の送る側の名前。線の行と同じ形なので行の頭の語に入れない。
 * 時間軸の図では名札に使えず、ほかの図では普通の名札のまま
 */
export const NOW = "now";

/**
 * 最初の行より後の行の頭の語。線の行だけは箱の名札から始まる。
 * `branch` と `commit` は枝分かれの図 (`git`) だけが書ける (#3164)
 */
export const HEADS = ["group", "end", "box", "strip", "step", "say", "code", "act", "note", "set", "branch", "commit", ...TIME_HEADS] as const;
type Head = (typeof HEADS)[number];

/** 箱と区画の名札の後ろに、見せる名前を続ける語 (`box <名札> as <名前>`) */
export const AS = "as";

/** 枝分かれの図 (#3164) の `commit` の行で、積む枝、当て直しの元、取り込む枝を続ける語 (`commit <名札> on <枝> copy <commit>`) */
export const ON = "on";
export const COPY = "copy";
export const MERGE = "merge";
/** 枝分かれの図で枝を切る行の、枝の後ろに切る commit を続ける語 (`<枝> from <commit>`) */
export const FROM = "from";
/** 枝分かれの図で今いる場所を指す札の名前。枝と commit と箱の名札に使えない */
export const HEAD = "HEAD";
/** 枝分かれの図の行の中の語のうち、行の頭の語でも属性でもない語。見本帳の部品が受け持つ語に数える (`on` は commit の行に必ず書くので数えない) */
export const GIT_WORDS = [FROM, COPY, MERGE] as const;

/** 時間軸の図の節目の行で、節目を置く目盛りを続ける語 (`point <名札> at <目盛り>`)。必ず書くので部品の語に数えない */
export const AT = "at";

/**
 * 行ごとに書ける属性の鍵。線の `at` と `into`、`note` の `color`、中身の帯の欄の `meter` は時間軸の図だけが書ける (#3165)。
 * `meter` は `strip` の行の欄ごとに、欄の名前の後ろに書く (`strip <題>: <欄> [meter: <割合>]`)
 */
export const ATTRS = {
  diagram: ["view"],
  group: ["note", "color", "icon"],
  box: ["note", "color", "icon"],
  edge: ["carry", "tag", "side", "at", "into"],
  note: ["color"],
  set: ["tag"],
  strip: ["meter"],
  branch: ["note"],
  commit: ["hash", "note"],
  scale: ["from"],
  period: ["from"],
  row: ["color", "empty"],
  mark: ["color"],
  span: ["shape", "color"],
} as const;

/** 線の属性のうち、時間軸の図だけが書ける鍵 */
export const TIME_EDGE_ATTRS = ["at", "into"] as const;
/** `span` の行の `shape` に書ける形。書かなければ括弧 */
export const SPAN_SHAPES = ["box"] as const;
/** 時間軸の図の目盛りの長さに書ける単位 */
export const DURATION_UNITS = ["ms", "s", "min", "h", "d"] as const;

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
