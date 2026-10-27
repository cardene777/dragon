/**
 * dragon記法の誤りの文 (#2997、#3137)。
 *
 * 記法の語は英語だけで file から言葉が決まらないため、誤りの文は呼ぶ側が渡した言葉
 * (渡さなければ日本語) で出す。文の中の記法の語は語の表から引き、表と文で語が食い違わないようにする。
 */
import { COLORS } from "./schema";
import { CARRIES, HEADS, KINDS, type NotationLang, SIDES, VIEWS } from "./words";

/** 新しい形のどの行の書き方を示すか。前の形の行に当たった時に、誤りの文が書き方を示す */
export type Shape = "sequence" | "architecture" | "group" | "box" | "strip" | "view" | "step" | "say" | "code" | "act" | "note" | "set";

export interface Messages {
  noHead: string;
  badHead: string;
  /** 前の形の `word` を書いた行。`shape` の行の書き方を示す */
  oldForm: (word: string, shape: Shape) => string;
  unknownHead: (word: string) => string;
  duplicate: (id: string) => string;
  needsId: (word: string) => string;
  badId: (id: string) => string;
  afterId: string;
  undeclaredBox: (id: string) => string;
  noBody: (title: string) => string;
  emptyStepTitle: string;
  noBoxes: string;
  noSteps: string;
  emptySay: string;
  sayTwice: string;
  codeTwice: string;
  emptyCode: string;
  declarationInStep: string;
  stepLineBeforeStep: string;
  nestedGroup: string;
  strayEnd: string;
  endTakesNothing: string;
  unclosedGroup: (id: string) => string;
  regionReopened: (id: string) => string;
  emptyName: (id: string) => string;
  stripTwice: string;
  stripShape: string;
  emptyStripField: string;
  stripUndeclared: string;
  noSuchField: (field: string) => string;
  stripNeedsValue: string;
  actShape: string;
  noteShape: string;
  edgeShape: string;
  emptyLabel: string;
  quoteUnclosed: string;
  afterQuote: string;
  attrUnclosed: string;
  attrNoColon: (raw: string) => string;
  attrNoValue: (key: string) => string;
  attrTwice: (key: string) => string;
  badAttr: (key: string, allowed: readonly string[]) => string;
  badColor: string;
  badView: string;
  badCarry: string;
  badSide: string;
  carryTwice: string;
}

const list = (words: readonly string[]): string => words.join(" / ");

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
    noHead: `最初の行に図の種類 (${list(KINDS)}) と題を書く`,
    badHead: `最初の行は ${KINDS.join(" か ")} で始め、続けて題を書く`,
    oldForm: (word, shape) => `${word} は前の形の書き方。新しい形では ${shapes[shape]} と書く`,
    unknownHead: (word) => `${word} は行の頭に書けない。行は ${list(HEADS)} か、<名札> -> <名札> で始める`,
    duplicate: (id) => `${id} は既に宣言した名札`,
    needsId: (word) => `${word} の後ろに名札を書く`,
    badId: (id) => `${id} は名札に使えない。名札には空白と [ ] 「 」 = : を含めない`,
    afterId: "名札の後ろには as <名前> か属性を書く",
    undeclaredBox: (id) => `${id} という箱は宣言していない`,
    noBody: (title) => `段「${title}」に本文 (say の行) が要る`,
    emptyStepTitle: "step の後ろに段の題を書く",
    noBoxes: "箱を 1 つ以上宣言する",
    noSteps: "段 (step の行) を 1 つ以上書く",
    emptySay: "say の後ろか、その下に字下げした行に段の本文を書く",
    sayTwice: "1 つの段に say は 1 つまで。長い本文は say の下に字下げして続ける",
    codeTwice: "1 つの段に code は 1 行まで",
    emptyCode: "code の後ろに命令を書く",
    declarationInStep: "group と box と strip は最初の step より前に書く",
    stepLineBeforeStep: "線と say と code と act と note と set は step の下に書く",
    nestedGroup: "group の中に group は書けない。先に end で閉じる",
    strayEnd: "end の前に、閉じる group が無い",
    endTakesNothing: "end の後ろには何も書かない",
    unclosedGroup: (id) => `group ${id} を end で閉じていない`,
    regionReopened: (id) => `group ${id} は宣言済み。もう一度開く時は group ${id} だけを書き、名前と属性は最初の宣言に書く`,
    emptyName: (id) => `${id} の名前が空`,
    stripTwice: "strip は 1 つだけ宣言する",
    stripShape: "strip は strip <題>: <欄>, <欄> の形で書く",
    emptyStripField: "strip の欄の名前が空",
    stripUndeclared: "set を書く前に、strip <題>: <欄>, <欄> で帯を宣言する",
    noSuchField: (field) => `${field} という欄は strip に無い`,
    stripNeedsValue: "set は set <欄>: <値> か set <欄> [tag: <札>] の形で書く",
    actShape: "act は act <名札>: <処理の名前> の形で書く",
    noteShape: "note は note <名札>: <下の小さな字> の形で書く",
    edgeShape: "線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く",
    emptyLabel: "線の : の後ろに線の名前を書く。名前を書かない時は : も書かない",
    quoteUnclosed: '" で始めた字を " で閉じていない',
    afterQuote: '" で閉じた字の後ろには、属性か次の , だけを書く',
    attrUnclosed: "属性は [ で始めて ] で閉じ、行の終わりに置く",
    attrNoColon: (raw) => `[${raw}] は書けない。属性は [<鍵>: <値>] の形で書く`,
    attrNoValue: (key) => `${key}: の後ろに値を書く`,
    attrTwice: (key) => `${key} は 1 つの行に 1 つまで`,
    badAttr: (key, allowed) => `${key} はこの行に書けない属性。書けるのは ${list(allowed)}`,
    badColor: `color は ${list(COLORS)} のどれか`,
    badView: `view は ${list(VIEWS)} のどれか`,
    badCarry: `carry は ${list(CARRIES)} のどれか。札は tag: <値> で書く`,
    badSide: `side は ${list(SIDES)} のどれか`,
    carryTwice: "運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない",
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
    noHead: `Write the diagram kind (${list(KINDS)}) and a title on the first line`,
    badHead: `Start the first line with ${KINDS.join(" or ")}, followed by the title`,
    oldForm: (word, shape) => `${word} is the old notation. Write ${shapes[shape]} instead`,
    unknownHead: (word) => `A line cannot start with ${word}. Start a line with ${list(HEADS)}, or <id> -> <id>`,
    duplicate: (id) => `${id} is already declared`,
    needsId: (word) => `Write an id after ${word}`,
    badId: (id) => `${id} cannot be an id. An id has no spaces and none of [ ] 「 」 = :`,
    afterId: "Write as <name> or attributes after the id",
    undeclaredBox: (id) => `No box named ${id} is declared`,
    noBody: (title) => `Step "${title}" needs a body (a say line)`,
    emptyStepTitle: "Write a title after step",
    noBoxes: "Declare at least one box",
    noSteps: "Write at least one step (a step line)",
    emptySay: "Write the step body after say, or on indented lines below it",
    sayTwice: "A step takes one say. Continue a long body on indented lines below it",
    codeTwice: "A step takes at most one code line",
    emptyCode: "Write the command after code",
    declarationInStep: "Write group, box and strip before the first step",
    stepLineBeforeStep: "Write lines, say, code, act, note and set under a step",
    nestedGroup: "A group cannot hold another group. Close it with end first",
    strayEnd: "There is no group for this end to close",
    endTakesNothing: "Write nothing after end",
    unclosedGroup: (id) => `group ${id} is not closed with end`,
    regionReopened: (id) => `group ${id} is already declared. To open it again, write only group ${id}; put the name and attributes on the first one`,
    emptyName: (id) => `${id} has an empty name`,
    stripTwice: "Declare only one strip",
    stripShape: "Write a strip as strip <title>: <field>, <field>",
    emptyStripField: "A strip field name is empty",
    stripUndeclared: "Declare the strip as strip <title>: <field>, <field> before writing set",
    noSuchField: (field) => `The strip has no field named ${field}`,
    stripNeedsValue: "Write set as set <field>: <value> or set <field> [tag: <tag>]",
    actShape: "Write act as act <id>: <action>",
    noteShape: "Write note as note <id>: <caption>",
    edgeShape: "Write a line as <id> -> <id>: <label> [<attributes>]",
    emptyLabel: "Write the label after the : of a line, or leave out the : as well",
    quoteUnclosed: 'A value that starts with " is not closed with "',
    afterQuote: 'After a value closed with ", write only attributes or the next ,',
    attrUnclosed: "Start attributes with [, close them with ], and put them at the end of the line",
    attrNoColon: (raw) => `[${raw}] cannot be read. Write an attribute as [<key>: <value>]`,
    attrNoValue: (key) => `Write a value after ${key}:`,
    attrTwice: (key) => `Write ${key} only once on a line`,
    badAttr: (key, allowed) => `${key} cannot be written on this line. Write ${list(allowed)}`,
    badColor: `color is one of ${list(COLORS)}`,
    badView: `view is one of ${list(VIEWS)}`,
    badCarry: `carry is one of ${list(CARRIES)}. Write a tag as tag: <value>`,
    badSide: `side is one of ${list(SIDES)}`,
    carryTwice: "A line carries one thing. Do not write carry and tag together",
  };
};

const MESSAGES: Record<NotationLang, Messages> = { ja: ja(), en: en() };

export const messagesFor = (lang: NotationLang): Messages => MESSAGES[lang];
