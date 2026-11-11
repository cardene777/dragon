/**
 * dragon記法の誤りの文 (#2997、#3137)。
 *
 * 記法の語は英語だけで file から言葉が決まらないため、誤りの文は呼ぶ側が渡した言葉
 * (渡さなければ英語) で出す。文の中の記法の語は語の表から引き、表と文で語が食い違わないようにする。
 * ブロックの置き場へ移した行の誤りの文はブロックが日英で持ち (`blocks/<名前>/read.ts` の `messages`)、ここで 1 つの表に束ねる (#3345)。
 * 軽い入口は個別ブロックの読み方を後から読むので、表は登録簿 (`blocks/reading.ts`) が持つ読み方から引く時に束ね、登録が変わった時に束ね直す (#3349)。
 * 読んでいないブロックの誤りの文は表に無いが、読む処理はそのブロックの行を読む前に、読んでいないブロックを名指す誤りで止める (`notLoaded`)。
 */
import { cachedByReadings, loadedReadings } from "./blocks/reading";
import type { READINGS } from "./blocks/readings";
import { list } from "./read-kit";
import { type UserBlockUseMessages, userBlockUseMessages } from "./user-blocks";
import { HEADS, KINDS, type NotationLang } from "./words";

/** 新しい形のどの行の書き方を示すか。前の形の行に当たった時に、誤りの文が書き方を示す */
export type Shape = "sequence" | "architecture" | "group" | "box" | "strip" | "view" | "step" | "say" | "code" | "act" | "note" | "set";

type Readings = typeof READINGS;
/** 日英の誤りの文の、日本語の表の型。持たない (`none`) ブロックは何も足さない */
type JaOf<X> = X extends { ja: infer M } ? M : never;
type Intersect<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never;
/** ブロックが持つ誤りの文の表。鍵はブロックの間で重ならない (`blocks.test.ts` の `block-message-keys-unique` が見る) */
export type BlockMessages = Intersect<JaOf<Readings[keyof Readings]["messages"]>>;

/** 誤りの文の表。どのブロックにも属さない行の文と、ブロックが持つ文 */
export type Messages = CoreMessages & BlockMessages;

/** どのブロックにも属さない行 (図の種類と題の行、名札、属性の書き方) の誤りの文 */
export interface CoreMessages {
  noHead: string;
  badHead: string;
  /** 前の形の `word` を書いた行。`shape` の行の書き方を示す */
  oldForm: (word: string, shape: Shape) => string;
  unknownHead: (word: string) => string;
  duplicate: (id: string) => string;
  needsId: (word: string) => string;
  badId: (id: string) => string;
  afterId: string;
  declarationInStep: string;
  /** 段を書かない短い記法の図で、最初の線より後に宣言の行を書いた (#3438) */
  declarationAfterLine: string;
  stepLineBeforeStep: string;
  emptyName: (id: string) => string;
  quoteUnclosed: string;
  afterQuote: string;
  attrUnclosed: string;
  attrNoColon: (raw: string) => string;
  attrNoValue: (key: string) => string;
  attrTwice: (key: string) => string;
  badAttr: (key: string, allowed: readonly string[]) => string;
  badHash: string;
  /** 時間軸の図だけの行か属性 (`word`) を、別の種類の図に書いた (#3165) */
  timeOnly: (word: string) => string;
  /** 枝分かれの図だけの行 (`word`) を、別の種類の図に書いた。後から読む個別ブロックの読み方を読まずに断るので、ここに持つ (#3349) */
  gitOnly: (word: string) => string;
  /** 木の図だけの行を、別の種類の図に書いた (#3349) */
  treeOnly: (word: string) => string;
  /** 列の図だけの行を、別の種類の図に書いた (#3349) */
  lineupOnly: (word: string) => string;
  /** 列の図と試す図だけの行 (`item` と `line`) を、別の種類の図に書いた (#3349) */
  lineupOrTryOnly: (word: string) => string;
  /** 列の図と試す図と量の図だけの `item` の行を、別の種類の図に書いた (#3560) */
  itemOnly: string;
  /** 量の図の図の種類の行だけの属性 (`shape`) を、別の種類の図の行に書いた (#3560) */
  chartOnlyAttr: (key: string) => string;
  /** 試す図だけの行を、別の種類の図に書いた (#3349) */
  tryOnly: (word: string) => string;
  /** 配管の図だけの行を、別の種類の図に書いた (#3389) */
  pipeOnly: (word: string) => string;
  /** 手順の図だけの行 (`choice`) を、別の種類の図に書いた (#3561) */
  flowOnly: (word: string) => string;
  /** 考えを広げる地図だけの行 (`idea`) を、別の種類の図に書いた (#3619) */
  mindOnly: (word: string) => string;
  /** 2つの軸で置く図だけの行 (`axis`) を、別の種類の図に書いた (#3622) */
  matrixOnly: (word: string) => string;
  /** 表どうしの関係の図だけの行 (`table` と `field`) を、別の種類の図に書いた (#3618) */
  erOnly: (word: string) => string;
  /** 配管の図の呼び出しの行だけの印 (`call`、`value`、`fold`) を、別の種類の図の線に書いた (#3389) */
  pipeOnlyAttr: (key: string) => string;
  /** 軽い入口で、まだ読んでいないブロック `block` の行か原本を読んだ。`loadFor` を待てば読める (#3349) */
  blockNotLoaded: (block: string) => string;
  /** 使う人が足すブロックの定義と、`+` の語の行の誤りの文 (#3399) */
  userBlocks: UserBlockUseMessages;
}

/** 持っている読み方が持つ `lang` の誤りの文を 1 つの表に束ねる */
const fromBlocks = (lang: NotationLang): BlockMessages =>
  Object.assign({}, ...loadedReadings().map(({ reading }) => ("none" in reading.messages ? {} : reading.messages[lang]))) as BlockMessages;

const ja = (): Messages => {
  const shapes: Record<Shape, string> = {
    sequence: "sequence <題>",
    architecture: "architecture <題>",
    group: "group <名札> as <名前> [note: <添え書き>] から end まで",
    box: "box <名札> as <名前> [note: <下の小さな字>]",
    strip: "strip <題>: <欄>, <欄>",
    view: "sequence <題> [view: follow]",
    step: "step <段の題>",
    say: "say <段の本文>",
    code: "code <命令>",
    act: "act <名札>: <処理の名前>",
    note: "note <名札>: <下の小さな字>",
    set: "set <欄>: <値> [tag: <札>]",
  };
  return {
    ...fromBlocks("ja"),
    noHead: `最初の行に図の種類 (${list(KINDS)}) と題を書く`,
    badHead: `最初の行は ${KINDS.join(" か ")} で始め、続けて題を書く`,
    oldForm: (word, shape) => `${word} は前の形の書き方。新しい形では ${shapes[shape]} と書く`,
    unknownHead: (word) => `${word} は行の頭に書けない。行は ${list(HEADS)} か、<名札> -> <名札> で始める`,
    duplicate: (id) => `${id} は既に宣言した名札`,
    needsId: (word) => `${word} の後ろに名札を書く`,
    badId: (id) => `${id} は名札に使えない。名札には空白と [ ] 「 」 = : を含めない`,
    afterId: "名札の後ろには as <名前> か属性を書く",
    declarationInStep: "group と box と strip と branch と、scale と period と row と task と point と zoom は最初の step より前に書く",
    declarationAfterLine: "段を書かない図では、group と box と strip を最初の線より前に書く",
    stepLineBeforeStep: "線と say と code と source と act と note と set と commit と枝を切る行と、now と mark と span と、leaf と node の行は step の下に書く",
    emptyName: (id) => `${id} の名前が空`,
    quoteUnclosed: '" で始めた字を " で閉じていない',
    afterQuote: '" で閉じた字の後ろには、属性か次の , だけを書く',
    attrUnclosed: "属性は [ で始めて ] で閉じ、行の終わりに置く",
    attrNoColon: (raw) => `[${raw}] は書けない。属性は [<鍵>: <値>] の形で書く`,
    attrNoValue: (key) => `${key}: の後ろに値を書く`,
    attrTwice: (key) => `${key} は 1 つの行に 1 つまで`,
    badAttr: (key, allowed) => `${key} はこの行に書けない属性。書けるのは ${list(allowed)}`,
    badHash: "hash は 0 から 9 と a から f の字で 4 から 40 字にする",
    timeOnly: (word) => `${word} は time (時間軸の図) でだけ書ける`,
    gitOnly: (word) => `${word} の行は git (枝分かれの図) でだけ書ける`,
    treeOnly: (word) => `${word} の行は tree (木の図) でだけ書ける`,
    lineupOnly: (word) => `${word} の行は lineup (列の図) でだけ書ける`,
    lineupOrTryOnly: (word) => `${word} の行は lineup (列の図) と try (試す図) でだけ書ける`,
    itemOnly: "item の行は lineup (列の図) と try (試す図) と chart (量の図) でだけ書ける",
    chartOnlyAttr: (key) => `最初の行の ${key} は chart (量の図) にだけ書ける`,
    tryOnly: (word) => `${word} の行は try (試す図) でだけ書ける`,
    pipeOnly: (word) => `${word} の行は pipe (配管の図) でだけ書ける`,
    flowOnly: (word) => `${word} の行は flow (手順の図) でだけ書ける`,
    mindOnly: (word) => `${word} の行は mind (考えを広げる地図) でだけ書ける`,
    matrixOnly: (word) => `${word} の行は matrix (2つの軸で置く図) でだけ書ける`,
    erOnly: (word) => `${word} の行は er (表どうしの関係の図) でだけ書ける`,
    pipeOnlyAttr: (key) => `${key} は pipe (配管の図) の呼び出しの行にだけ書ける`,
    blockNotLoaded: (block) => `${block} のブロックの読み方を読んでいない。読む前に loadFor を待つ`,
    userBlocks: userBlockUseMessages("ja"),
  };
};

const en = (): Messages => {
  const shapes: Record<Shape, string> = {
    sequence: "sequence <title>",
    architecture: "architecture <title>",
    group: "group <id> as <name> [note: <note>] through end",
    box: "box <id> as <name> [note: <caption>]",
    strip: "strip <title>: <field>, <field>",
    view: "sequence <title> [view: follow]",
    step: "step <step title>",
    say: "say <step body>",
    code: "code <command>",
    act: "act <id>: <action>",
    note: "note <id>: <caption>",
    set: "set <field>: <value> [tag: <tag>]",
  };
  return {
    ...fromBlocks("en"),
    noHead: `Write the diagram kind (${list(KINDS)}) and a title on the first line`,
    badHead: `Start the first line with ${KINDS.join(" or ")}, followed by the title`,
    oldForm: (word, shape) => `${word} is the old notation. Write ${shapes[shape]} instead`,
    unknownHead: (word) => `A line cannot start with ${word}. Start a line with ${list(HEADS)}, or <id> -> <id>`,
    duplicate: (id) => `${id} is already declared`,
    needsId: (word) => `Write an id after ${word}`,
    badId: (id) => `${id} cannot be an id. An id has no spaces and none of [ ] 「 」 = :`,
    afterId: "Write as <name> or attributes after the id",
    declarationInStep: "Write group, box, strip, branch, scale, period, row, task, point and zoom before the first step",
    declarationAfterLine: "In a diagram without steps, write group, box and strip before the first line",
    stepLineBeforeStep: "Write lines, say, code, source, act, note, set, commit, branch cuts, now, mark, span, leaf and node under a step",
    emptyName: (id) => `${id} has an empty name`,
    quoteUnclosed: 'A value that starts with " is not closed with "',
    afterQuote: 'After a value closed with ", write only attributes or the next ,',
    attrUnclosed: "Start attributes with [, close them with ], and put them at the end of the line",
    attrNoColon: (raw) => `[${raw}] cannot be read. Write an attribute as [<key>: <value>]`,
    attrNoValue: (key) => `Write a value after ${key}:`,
    attrTwice: (key) => `Write ${key} only once on a line`,
    badAttr: (key, allowed) => `${key} cannot be written on this line. Write ${list(allowed)}`,
    badHash: "Write a hash as 4 to 40 characters of 0-9 and a-f",
    timeOnly: (word) => `${word} can be written only in time diagrams`,
    gitOnly: (word) => `${word} lines can be written only in git diagrams`,
    treeOnly: (word) => `${word} lines can be written only in tree diagrams`,
    lineupOnly: (word) => `${word} lines can be written only in lineup diagrams`,
    lineupOrTryOnly: (word) => `${word} lines can be written only in lineup and try diagrams`,
    itemOnly: "item lines can be written only in lineup, try and chart diagrams",
    chartOnlyAttr: (key) => `${key} on the first line can be written only in charts`,
    tryOnly: (word) => `${word} lines can be written only in try diagrams`,
    pipeOnly: (word) => `${word} lines can be written only in pipe diagrams`,
    flowOnly: (word) => `${word} lines can be written only in flow diagrams`,
    mindOnly: (word) => `${word} lines can be written only in mind maps`,
    matrixOnly: (word) => `${word} lines can be written only in two-axis matrices`,
    erOnly: (word) => `${word} lines can be written only in table relation diagrams (er)`,
    pipeOnlyAttr: (key) => `${key} can be written only on call lines of pipe diagrams`,
    blockNotLoaded: (block) => `The ${block} block is not loaded. Await loadFor before reading`,
    userBlocks: userBlockUseMessages("en"),
  };
};

/** 誤りの文の表。読み方の登録が変わった時に束ね直す */
const MESSAGES = cachedByReadings((): Record<NotationLang, Messages> => ({ ja: ja(), en: en() }));

export const messagesFor = (lang: NotationLang): Messages => MESSAGES()[lang];
