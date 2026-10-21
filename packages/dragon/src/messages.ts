/**
 * 記法の誤りの文 (#2997)。
 *
 * 誤りの文は file の言葉で出す。file の言葉は最初の行の図の種類の語で決まり、
 * 最初の行が読めず決まらない時は、呼ぶ側が渡した言葉 (渡さなければ日本語) で出す。
 * 文の中の記法の語は語の表から引き、表と文で語が食い違わないようにする。
 */
import { COLORS } from "./schema";
import { type NotationLang, type WordGroup, type WORDS, wordOf } from "./words";

export interface Messages {
  noHead: string;
  badHead: string;
  duplicate: (id: string) => string;
  undeclaredBox: (id: string) => string;
  noBody: (title: string) => string;
  emptyStepTitle: string;
  noBoxes: string;
  noSteps: string;
  viewTwice: string;
  badView: string;
  stripTwice: string;
  emptyStripField: string;
  stepLineBeforeStep: string;
  unreadableDeclaration: string;
  emptyName: (id: string) => string;
  badColor: string;
  regionFirst: (id: string) => string;
  badAttr: (raw: string) => string;
  codeTwice: string;
  declarationInStep: string;
  emptySwap: string;
  unreadableStepLine: string;
  edgeShape: string;
  carryTwice: string;
  tagNeedsValue: string;
  carryTakesNoValue: (key: string) => string;
  stripUndeclared: string;
  stripTagOnce: string;
  noSuchField: (field: string) => string;
  stripNeedsValue: string;
  /** 違う言葉の語 `word` を書いた時。`own` はこの file の言葉の同じ役割の語 */
  otherLanguageWord: (word: string, own: string) => string;
}

const ja = (): Messages => {
  const w = <G extends WordGroup>(group: G, value: keyof (typeof WORDS)[G]): string => wordOf(group, value, "ja");
  return {
    noHead: `最初の行に図の種類 (${w("kind", "sequence")} か ${w("kind", "architecture")}) と題を書く`,
    badHead: `最初の行は ${w("kind", "sequence")} か ${w("kind", "architecture")} で始め、続けて題を書く`,
    duplicate: (id) => `${id} は既に宣言した名札`,
    undeclaredBox: (id) => `${id} という箱は宣言していない`,
    noBody: (title) => `段「${title}」に本文 (> で始まる行) が要る`,
    emptyStepTitle: "段の見出し (#) に題を書く",
    noBoxes: "箱を 1 つ以上宣言する",
    noSteps: "段 (# で始まる行) を 1 つ以上書く",
    viewTwice: `${w("head", "view")}は 1 行だけ書く`,
    badView: `${w("head", "view")}は ${w("view", "fixed")} か ${w("view", "follow")}`,
    stripTwice: "中身の帯は 1 つだけ宣言する",
    emptyStripField: "帯の欄の名前が空",
    stepLineBeforeStep: "線や処理は段の見出し (#) の下に書く",
    unreadableDeclaration: "読めない行。箱の宣言は <名札> = <名前>「<下の小さな字>」 の形で書く",
    emptyName: (id) => `${id} の名前が空`,
    badColor: `${w("attr", "color")}は ${COLORS.join(" / ")} のどれか`,
    regionFirst: (id) => `${w("attr", "region")} ${id} を先に宣言する`,
    badAttr: (raw) => `[${raw}] は書けない指定`,
    codeTwice: "1 つの段に命令 (` で囲んだ行) は 1 行まで",
    declarationInStep: "箱の宣言は最初の段の見出し (#) より前に書く",
    emptySwap: "「」の中に書き換える字を書く",
    unreadableStepLine: "読めない行。線は <名札> -> <名札> : <線の名前>、処理は <名札> : <処理の名前> の形で書く",
    edgeShape: "線は <名札> -> <名札> : <線の名前> の形で書く",
    carryTwice: "運ぶ物は 1 本の線に 1 つまで",
    tagNeedsValue: `${w("carry", "tag")}には値を書く ([${w("carry", "tag")} <値>])`,
    carryTakesNoValue: (key) => `[${key}] には値を書かない`,
    stripUndeclared: `帯の値を書く前に、帯を宣言する (${w("head", "strip")} <題> = <欄>, <欄>)`,
    stripTagOnce: "帯の札は 1 つまで",
    noSuchField: (field) => `${field} という欄は帯に無い`,
    stripNeedsValue: "帯の欄には = <値> か [<札>] を書く",
    otherLanguageWord: (word, own) => `この図は日本語の語で書く。${word} ではなく ${own} と書く`,
  };
};

const en = (): Messages => {
  const w = <G extends WordGroup>(group: G, value: keyof (typeof WORDS)[G]): string => wordOf(group, value, "en");
  return {
    noHead: `Write the diagram kind (${w("kind", "sequence")} or ${w("kind", "architecture")}) and a title on the first line`,
    badHead: `Start the first line with ${w("kind", "sequence")} or ${w("kind", "architecture")}, followed by the title`,
    duplicate: (id) => `${id} is already declared`,
    undeclaredBox: (id) => `No box named ${id} is declared`,
    noBody: (title) => `Step "${title}" needs a body (a line starting with >)`,
    emptyStepTitle: "Write a title after the step heading (#)",
    noBoxes: "Declare at least one box",
    noSteps: "Write at least one step (a line starting with #)",
    viewTwice: `Write ${w("head", "view")} only once`,
    badView: `${w("head", "view")} is ${w("view", "fixed")} or ${w("view", "follow")}`,
    stripTwice: `Declare only one ${w("head", "strip")}`,
    emptyStripField: `A ${w("head", "strip")} field name is empty`,
    stepLineBeforeStep: "Write lines and actions under a step heading (#)",
    unreadableDeclaration: 'Cannot read this line. Declare a box as <id> = <name> "<caption>"',
    emptyName: (id) => `${id} has an empty name`,
    badColor: `${w("attr", "color")} is one of ${COLORS.join(" / ")}`,
    regionFirst: (id) => `Declare ${w("attr", "region")} ${id} first`,
    badAttr: (raw) => `[${raw}] cannot be written here`,
    codeTwice: "A step takes at most one command (a line in backticks)",
    declarationInStep: "Declare boxes before the first step heading (#)",
    emptySwap: 'Write the new caption inside "…"',
    unreadableStepLine: "Cannot read this line. Write a line as <id> -> <id> : <label>, or an action as <id> : <action>",
    edgeShape: "Write a line as <id> -> <id> : <label>",
    carryTwice: "A line carries at most one thing",
    tagNeedsValue: `${w("carry", "tag")} needs a value ([${w("carry", "tag")} <value>])`,
    carryTakesNoValue: (key) => `[${key}] takes no value`,
    stripUndeclared: `Declare the ${w("head", "strip")} before writing its values (${w("head", "strip")} <title> = <field>, <field>)`,
    stripTagOnce: `A ${w("head", "strip")} value takes at most one tag`,
    noSuchField: (field) => `The ${w("head", "strip")} has no field named ${field}`,
    stripNeedsValue: `Write = <value> or [<tag>] after the ${w("head", "strip")} field`,
    otherLanguageWord: (word, own) => `This diagram uses English words. Write ${own} instead of ${word}`,
  };
};

const MESSAGES: Record<NotationLang, Messages> = { ja: ja(), en: en() };

export const messagesFor = (lang: NotationLang): Messages => MESSAGES[lang];
