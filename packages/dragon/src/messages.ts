/**
 * dragon記法の誤りの文 (#2997、#3137)。
 *
 * 記法の語は英語だけで file から言葉が決まらないため、誤りの文は呼ぶ側が渡した言葉
 * (渡さなければ英語) で出す。文の中の記法の語は語の表から引き、表と文で語が食い違わないようにする。
 * ブロックの置き場へ移した行の誤りの文はブロックが日英で持ち (`blocks/<名前>/block.ts` の `messages`)、ここで 1 つの表に束ねる (#3345)。
 */
import { ranked } from "./blocks/block";
import { BLOCKS } from "./blocks/index";
import { nearest } from "./nearest";
import { list } from "./read-kit";
import { COLORS, ICON_NAMES } from "./schema";
import { CARRIES, DURATION_UNITS, HEADS, KINDS, type NotationLang, SPAN_SHAPES, VIEWS } from "./words";

/** 新しい形のどの行の書き方を示すか。前の形の行に当たった時に、誤りの文が書き方を示す */
export type Shape = "sequence" | "architecture" | "group" | "box" | "strip" | "view" | "step" | "say" | "code" | "act" | "note" | "set";

type Blocks = typeof BLOCKS;
/** 日英の誤りの文の、日本語の表の型。持たない (`none`) ブロックは何も足さない */
type JaOf<X> = X extends { ja: infer M } ? M : never;
type Intersect<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never;
/** ブロックが持つ誤りの文の表。鍵はブロックの間で重ならない (`blocks.test.ts` の `block-message-keys-unique` が見る) */
export type BlockMessages = Intersect<JaOf<Blocks[keyof Blocks]["messages"]>>;

/** 誤りの文の表。ブロックの置き場へ移していない行の文と、ブロックが持つ文 */
export type Messages = CoreMessages & BlockMessages;

/** ブロックの置き場へ移していない行の誤りの文 */
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
  edgeShape: string;
  quoteUnclosed: string;
  afterQuote: string;
  attrUnclosed: string;
  attrNoColon: (raw: string) => string;
  attrNoValue: (key: string) => string;
  attrTwice: (key: string) => string;
  badAttr: (key: string, allowed: readonly string[]) => string;
  badColor: string;
  /** 知らないアイコン名 `value`。近い名前が在ればそれだけを、無ければ使える名前を全て挙げる (#3315) */
  badIcon: (value: string) => string;
  badView: string;
  badCarry: string;
  /** 箱の飛び先 (`link`) か段の出典 (`url`) に、頁を移る形でない URL を書いた (#3199) */
  badUrl: (key: string) => string;
  carryTwice: string;
  /** 状態遷移図の箱の名札に、始まりか終わりの印の名前を書いた */
  reservedId: (id: string) => string;
  intoStart: string;
  outOfFinish: string;
  /** 状態遷移図の最初の step より前の線に、属性を書いた */
  pathNoAttrs: string;
  /** 枝分かれの図だけの行 (`branch` と `commit`) を、別の種類の図に書いた (#3164) */
  gitOnly: (word: string) => string;
  gitNoGroup: string;
  noBranches: string;
  branchShape: string;
  commitShape: string;
  fromShape: string;
  undeclaredBranch: (id: string) => string;
  /** 札を動かす線の送る側が、枝の名札でも HEAD でもない */
  undeclaredRef: (id: string) => string;
  noCommit: (id: string) => string;
  /** 取り込む枝が、まだどの commit も指していない */
  emptyBranch: (id: string) => string;
  mergeSelf: (id: string) => string;
  /** 枝分かれの図で、今いる場所の札の名前 (`name`) を名札にした */
  headReserved: (name: string) => string;
  badHash: string;
  /** 時間軸の図だけの行か属性 (`word`) を、別の種類の図に書いた (#3165) */
  timeOnly: (word: string) => string;
  /** 木の図だけの行 (`leaf` と `node`) を、別の種類の図に書いた (#3233) */
  treeOnly: (word: string) => string;
  treeNoGroup: string;
  noLeaves: string;
  leafShape: string;
  nodeShape: string;
  /** 親の子に、まだ書いていない名札を書いた */
  noTreeChild: (id: string) => string;
  /** 親の子に、木の箱でない箱 (`box`) を書いた */
  notTreeBox: (id: string) => string;
  /** もう親を持つ箱を、別の親の子にした */
  twoParents: (id: string) => string;
  /** 最後の段を終えて、親を持たない箱が根の外に残った */
  manyRoots: (id: string, root: string) => string;
  /** 列の図だけの行 (`item`、`line`、`seal`、`open`、`pick`、`stamp`) を、別の種類の図に書いた (#3239) */
  lineupOnly: (word: string) => string;
  lineupNoGroup: string;
  lineupNoEdge: string;
  noItems: string;
  itemShape: string;
  lineShape: string;
  /** `seal`、`open`、`pick` の行の形 */
  laneShape: (word: string) => string;
  stampShape: string;
  /** チップの字が上限の字数を超えた */
  labelTooLong: (limit: number) => string;
  /** `line` の行に、宣言していないチップを書いた */
  noSuchItem: (id: string) => string;
  /** 同じ `line` の行に、同じチップを 2 度書いた */
  itemTwice: (id: string) => string;
  /** `line` の行のチップが、1 列の上限を超えた */
  laneFull: (lane: string, limit: number) => string;
  lineOnSealed: (lane: string) => string;
  sealTwice: (lane: string) => string;
  openUnsealed: (lane: string) => string;
  /** 時間軸の図の宣言の行を 2 つ書いた */
  timeTwice: (word: string) => string;
  noScale: string;
  noRows: string;
  scaleShape: string;
  periodShape: string;
  rowShape: string;
  pointShape: string;
  zoomShape: string;
  nowShape: string;
  markShape: string;
  spanShape: string;
  badLength: string;
  badCount: (word: string) => string;
  /** 目盛りの位置か範囲 (`text`) が、0 から `count - 1` の外か、範囲の形でない */
  badUnit: (text: string, count: number) => string;
  /** 針を前の時刻 (`at` の目盛りの終わり) より先へ進めない `now` */
  nowBack: (text: string, at: number) => string;
  /** 拡大の帯の外の列 */
  outOfZoom: (from: number, to: number) => string;
  noZoom: string;
  /** 時間軸の図の箱を宣言したのに、拡大の帯 (`zoom`) が無い */
  boxNeedsZoom: string;
  boxLineNeedsAt: string;
  pointLineNoAt: string;
  mixedLine: string;
  undeclaredRow: (id: string) => string;
  /** 時間軸の図の note の行の名札が、箱でも節目でもない */
  undeclaredNote: (id: string) => string;
  nowReserved: (name: string) => string;
  noteColorPointOnly: string;
  badShape: string;
}

/** 書いたアイコン名に近い名前が在れば `near` の文、無ければ `none` の文 (#3315) */
const withNear = (value: string, near: (name: string) => string, none: string): string => {
  const name = nearest(value, ICON_NAMES);
  return name === undefined ? none : near(name);
};

/** ブロックが持つ `lang` の誤りの文を 1 つの表に束ねる */
const fromBlocks = (lang: NotationLang): BlockMessages =>
  Object.assign({}, ...ranked(BLOCKS).map((block) => ("none" in block.messages ? {} : block.messages[lang]))) as BlockMessages;

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
    undeclaredBox: (id) => `${id} という箱は宣言していない`,
    noBody: (title) => `段「${title}」に本文 (say の行) が要る`,
    emptyStepTitle: "step の後ろに段の題を書く",
    noBoxes: "箱を 1 つ以上宣言する",
    noSteps: "段 (step の行) を 1 つ以上書く",
    emptySay: "say の後ろか、その下に字下げした行に段の本文を書く",
    sayTwice: "1 つの段に say は 1 つまで。長い本文は say の下に字下げして続ける",
    codeTwice: "1 つの段に code は 1 行まで",
    emptyCode: "code の後ろに命令を書く",
    declarationInStep: "group と box と strip と branch と、scale と period と row と point と zoom は最初の step より前に書く",
    stepLineBeforeStep: "線と say と code と source と act と note と set と commit と枝を切る行と、now と mark と span と、leaf と node の行は step の下に書く",
    nestedGroup: "group の中に group は書けない。先に end で閉じる",
    strayEnd: "end の前に、閉じる group が無い",
    endTakesNothing: "end の後ろには何も書かない",
    unclosedGroup: (id) => `group ${id} を end で閉じていない`,
    regionReopened: (id) => `group ${id} は宣言済み。もう一度開く時は group ${id} だけを書き、名前と属性は最初の宣言に書く`,
    emptyName: (id) => `${id} の名前が空`,
    edgeShape: "線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く",
    quoteUnclosed: '" で始めた字を " で閉じていない',
    afterQuote: '" で閉じた字の後ろには、属性か次の , だけを書く',
    attrUnclosed: "属性は [ で始めて ] で閉じ、行の終わりに置く",
    attrNoColon: (raw) => `[${raw}] は書けない。属性は [<鍵>: <値>] の形で書く`,
    attrNoValue: (key) => `${key}: の後ろに値を書く`,
    attrTwice: (key) => `${key} は 1 つの行に 1 つまで`,
    badAttr: (key, allowed) => `${key} はこの行に書けない属性。書けるのは ${list(allowed)}`,
    badColor: `color は ${list(COLORS)} のどれか`,
    badIcon: (value) => withNear(value, (near) => `${value} という icon は無い。近い名前は ${near}`, `icon は ${list(ICON_NAMES)} のどれか`),
    badView: `view は ${list(VIEWS)} のどれか`,
    badCarry: `carry は ${list(CARRIES)} のどれか。札は tag: <値> で書く`,
    badUrl: (key) => `${key} には / で始まる path か、http:// か https:// で始まる URL を書く`,
    carryTwice: "運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない",
    reservedId: (id) => `${id} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,
    intoStart: "start へ入る線は書けない。start は始まりの印で、線は start から出る",
    outOfFinish: "finish から出る線は書けない。finish は終わりの印で、線は finish へ入る",
    pathNoAttrs: "最初の step より前の線は今回は通らない道なので、属性 (carry と tag と side) を書けない",
    gitOnly: (word) => `${word} の行は git (枝分かれの図) でだけ書ける`,
    gitNoGroup: "git (枝分かれの図) には group を書けない。枝は branch の行で宣言する",
    noBranches: "branch の行で枝を 1 つ以上宣言する",
    branchShape: "branch は branch <名札> [note: <添え書き>] の形で書く",
    commitShape: "commit は commit <名札> on <枝> [hash: <hash>, note: <一言>] の形で書く。当て直しは copy <commit> を、取り込みは merge <枝> を on <枝> の後ろに書く",
    fromShape: "枝を切る行は <枝> from <commit> の形で書く",
    undeclaredBranch: (id) => `${id} という枝は宣言していない`,
    undeclaredRef: (id) => `${id} という枝は宣言していない。札を動かす線は枝の名札か HEAD から引く`,
    noCommit: (id) => `${id} という commit はまだ積んでいない`,
    emptyBranch: (id) => `${id} の枝はまだどの commit も指していないので取り込めない`,
    mergeSelf: (id) => `${id} は積む枝なので、取り込む枝にできない`,
    headReserved: (name) => `${name} は枝分かれの図で今いる場所の札の名前で、名札に使えない`,
    badHash: "hash は 0 から 9 と a から f の字で 4 から 40 字にする",
    timeOnly: (word) => `${word} は time (時間軸の図) でだけ書ける`,
    treeOnly: (word) => `${word} の行は tree (木の図) でだけ書ける`,
    treeNoGroup: "tree (木の図) には group を書けない。木の箱は leaf と node の行で書く",
    noLeaves: "leaf の行で葉を 1 つ以上書く",
    leafShape: "leaf は leaf <名札> [hash: <hash>] の形で書く",
    nodeShape: "node は node <名札> of <子>, <子> [hash: <hash>] の形で書く",
    noTreeChild: (id) => `${id} という葉か親はまだ書いていない。子は前に leaf か node で書いた名札にする`,
    notTreeBox: (id) => `${id} は box の行で置いた箱で、木の箱でない。子は leaf か node で書いた名札にする`,
    twoParents: (id) => `${id} はもう別の親の子になっている。木の箱の親は 1 つだけ`,
    manyRoots: (id, root) => `${id} が親を持たないまま残る。木の根は 1 つだけで、${id} も ${root} も最後に 1 つの根へ組む`,
    lineupOnly: (word) => `${word} の行は lineup (列の図) でだけ書ける`,
    lineupNoGroup: "lineup (列の図) には group を書けない。列は box の行で宣言する",
    lineupNoEdge: "lineup (列の図) には線の行を書けない。チップは line の行で列の並びを書くと動く",
    noItems: "item の行でチップを 1 つ以上宣言する",
    itemShape: "item は item <名札>, <名札> [color: <色>, label: <字>] の形で書く",
    lineShape: "line は line <列>: <チップ>, <チップ> の形で書く",
    laneShape: (word) => `${word} は ${word} <列> の形で書く`,
    stampShape: "stamp は stamp <列>: <字> の形で書く",
    labelTooLong: (limit) => `label は ${limit} 字までにする`,
    noSuchItem: (id) => `${id} というチップは宣言していない`,
    itemTwice: (id) => `${id} はこの行に 2 度書いている。同じ列に同じチップは 1 枚だけ`,
    laneFull: (lane, limit) => `${lane} の列に並べられるチップは ${limit} 枚まで`,
    lineOnSealed: (lane) => `${lane} の列は封をしているので並びを書けない。先に open で開ける`,
    sealTwice: (lane) => `${lane} の列にはもう封をしている`,
    openUnsealed: (lane) => `${lane} の列には封をしていない`,
    timeTwice: (word) => `${word} は 1 つだけ宣言する`,
    noScale: "scale の行で目盛りを宣言する",
    noRows: "row の行で印の列を 1 つ以上宣言する",
    scaleShape: "scale は scale <単位> <長さ> <数> [from: <番号>] の形で書く",
    periodShape: "period は period <名前> <目盛りの数> [from: <番号>] の形で書く",
    rowShape: "row は row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>] の形で書く",
    pointShape: "point は point <名札> at <目盛り> の形で書く",
    zoomShape: "zoom は zoom <目盛り>-<目盛り> の形で書く",
    nowShape: "針を進める行は now -> <目盛り> の形で書く",
    markShape: "mark は mark <列> <目盛り>-<目盛り> [color: <色>] の形で書く",
    spanShape: `span は span <目盛り>-<目盛り>: <字> [shape: ${list(SPAN_SHAPES)}, color: <色>] の形で書く`,
    badLength: `長さは数と単位 (${list(DURATION_UNITS)}) の組で書く (12s など)`,
    badCount: (word) => `${word} の目盛りの数は 1 以上の整数にする`,
    badUnit: (text, count) => `${text} は目盛りの位置にできない。0 から ${count - 1} の数か、その範囲 (0-3 など) を書く`,
    nowBack: (text, at) => `now -> ${text} は針を進めない。前の now (${at}) より後の目盛りを書く`,
    outOfZoom: (from, to) => `拡大の帯の列は ${from} から ${to} の目盛りから選ぶ`,
    noZoom: "at と into は、zoom で拡大の帯を宣言した図の箱どうしの線にだけ書ける",
    boxNeedsZoom: "時間軸の図の箱は拡大の帯に置く。zoom <目盛り>-<目盛り> で拡大の範囲を書く",
    boxLineNeedsAt: "拡大の帯の箱どうしの線には [at: <目盛り>] で列を書く",
    pointLineNoAt: "節目どうしの線は軸の上に引くので、at と into を書けない",
    mixedLine: "線は箱どうしか、節目どうしで引く",
    undeclaredRow: (id) => `${id} という印の列は宣言していない`,
    undeclaredNote: (id) => `${id} という箱か節目は宣言していない`,
    nowReserved: (name) => `${name} は時間軸の図で針を進める行の語で、名札に使えない`,
    noteColorPointOnly: "note の color は節目の丸の色で、節目の note にだけ書ける",
    badShape: `shape は ${list(SPAN_SHAPES)} だけ書ける。括弧は shape を書かない`,
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
    undeclaredBox: (id) => `No box named ${id} is declared`,
    noBody: (title) => `Step "${title}" needs a body (a say line)`,
    emptyStepTitle: "Write a title after step",
    noBoxes: "Declare at least one box",
    noSteps: "Write at least one step (a step line)",
    emptySay: "Write the step body after say, or on indented lines below it",
    sayTwice: "A step takes one say. Continue a long body on indented lines below it",
    codeTwice: "A step takes at most one code line",
    emptyCode: "Write the command after code",
    declarationInStep: "Write group, box, strip, branch, scale, period, row, point and zoom before the first step",
    stepLineBeforeStep: "Write lines, say, code, source, act, note, set, commit, branch cuts, now, mark, span, leaf and node under a step",
    nestedGroup: "A group cannot hold another group. Close it with end first",
    strayEnd: "There is no group for this end to close",
    endTakesNothing: "Write nothing after end",
    unclosedGroup: (id) => `group ${id} is not closed with end`,
    regionReopened: (id) => `group ${id} is already declared. To open it again, write only group ${id}; put the name and attributes on the first one`,
    emptyName: (id) => `${id} has an empty name`,
    edgeShape: "Write a line as <id> -> <id>: <label> [<attributes>]",
    quoteUnclosed: 'A value that starts with " is not closed with "',
    afterQuote: 'After a value closed with ", write only attributes or the next ,',
    attrUnclosed: "Start attributes with [, close them with ], and put them at the end of the line",
    attrNoColon: (raw) => `[${raw}] cannot be read. Write an attribute as [<key>: <value>]`,
    attrNoValue: (key) => `Write a value after ${key}:`,
    attrTwice: (key) => `Write ${key} only once on a line`,
    badAttr: (key, allowed) => `${key} cannot be written on this line. Write ${list(allowed)}`,
    badColor: `color is one of ${list(COLORS)}`,
    badIcon: (value) => withNear(value, (near) => `There is no icon named ${value}. The closest is ${near}`, `icon is one of ${list(ICON_NAMES)}`),
    badView: `view is one of ${list(VIEWS)}`,
    badCarry: `carry is one of ${list(CARRIES)}. Write a tag as tag: <value>`,
    badUrl: (key) => `Write a path that starts with / or a URL that starts with http:// or https:// for ${key}`,
    carryTwice: "A line carries one thing. Do not write carry and tag together",
    reservedId: (id) => `${id} names the start or end mark of a state diagram and cannot be a box id`,
    intoStart: "A line cannot go into start. start is the start mark, and lines leave it",
    outOfFinish: "A line cannot leave finish. finish is the end mark, and lines go into it",
    pathNoAttrs: "A line before the first step is a path not taken, so it takes no attributes (carry, tag, side)",
    gitOnly: (word) => `${word} lines can be written only in git diagrams`,
    gitNoGroup: "A git diagram takes no group. Declare branches with branch lines",
    noBranches: "Declare at least one branch with a branch line",
    branchShape: "Write a branch as branch <id> [note: <note>]",
    commitShape: "Write a commit as commit <id> on <branch> [hash: <hash>, note: <note>]. For a replayed commit add copy <commit>, and for a merge commit add merge <branch>, after on <branch>",
    fromShape: "Write a branch cut as <branch> from <commit>",
    undeclaredBranch: (id) => `No branch named ${id} is declared`,
    undeclaredRef: (id) => `No branch named ${id} is declared. A line that moves a ref starts from a branch id or HEAD`,
    noCommit: (id) => `No commit named ${id} has been made yet`,
    emptyBranch: (id) => `Branch ${id} does not point at any commit yet, so it cannot be merged`,
    mergeSelf: (id) => `${id} is the branch being committed to, so it cannot be the branch merged in`,
    headReserved: (name) => `${name} names where you are in a git diagram and cannot be an id`,
    badHash: "Write a hash as 4 to 40 characters of 0-9 and a-f",
    timeOnly: (word) => `${word} can be written only in time diagrams`,
    treeOnly: (word) => `${word} lines can be written only in tree diagrams`,
    treeNoGroup: "A tree diagram takes no group. Write the tree boxes with leaf and node lines",
    noLeaves: "Write at least one leaf with a leaf line",
    leafShape: "Write a leaf as leaf <id> [hash: <hash>]",
    nodeShape: "Write a node as node <id> of <child>, <child> [hash: <hash>]",
    noTreeChild: (id) => `No leaf or node named ${id} has been written yet. A child must be an id written earlier with leaf or node`,
    notTreeBox: (id) => `${id} is a box from a box line, not a tree box. A child must be an id written with leaf or node`,
    twoParents: (id) => `${id} is already a child of another node. A tree box has only one parent`,
    manyRoots: (id, root) => `${id} is left without a parent. A tree has one root, so join ${id} and ${root} under one root by the end`,
    lineupOnly: (word) => `${word} lines can be written only in lineup diagrams`,
    lineupNoGroup: "A lineup diagram takes no group. Declare the lanes with box lines",
    lineupNoEdge: "A lineup diagram takes no edge lines. Chips move when a line line rewrites a lane",
    noItems: "Declare at least one chip with an item line",
    itemShape: "Write an item as item <id>, <id> [color: <color>, label: <text>]",
    lineShape: "Write a line as line <lane>: <chip>, <chip>",
    laneShape: (word) => `Write ${word} as ${word} <lane>`,
    stampShape: "Write a stamp as stamp <lane>: <text>",
    labelTooLong: (limit) => `A label is at most ${limit} characters`,
    noSuchItem: (id) => `The chip ${id} is not declared`,
    itemTwice: (id) => `${id} is written twice on this line. A lane holds one of each chip`,
    laneFull: (lane, limit) => `The lane ${lane} holds at most ${limit} chips`,
    lineOnSealed: (lane) => `The lane ${lane} is sealed, so its order cannot be written. Open it first`,
    sealTwice: (lane) => `The lane ${lane} is already sealed`,
    openUnsealed: (lane) => `The lane ${lane} is not sealed`,
    timeTwice: (word) => `Declare only one ${word}`,
    noScale: "Declare the scale with a scale line",
    noRows: "Declare at least one row with a row line",
    scaleShape: "Write a scale as scale <unit> <length> <count> [from: <number>]",
    periodShape: "Write a period as period <name> <units> [from: <number>]",
    rowShape: "Write a row as row <id> as <name> [color: <color>, empty: <unit> <unit>]",
    pointShape: "Write a point as point <id> at <unit>",
    zoomShape: "Write a zoom as zoom <unit>-<unit>",
    nowShape: "Write a needle line as now -> <unit>",
    markShape: "Write a mark as mark <row> <unit>-<unit> [color: <color>]",
    spanShape: `Write a span as span <unit>-<unit>: <text> [shape: ${list(SPAN_SHAPES)}, color: <color>]`,
    badLength: `Write a length as a number and a unit (${list(DURATION_UNITS)}), such as 12s`,
    badCount: (word) => `The unit count of ${word} is a whole number of 1 or more`,
    badUnit: (text, count) => `${text} cannot be a unit. Write a number from 0 to ${count - 1}, or a range such as 0-3`,
    nowBack: (text, at) => `now -> ${text} does not move the needle forward. Write a unit after the previous now (${at})`,
    outOfZoom: (from, to) => `Pick a zoom column from units ${from} to ${to}`,
    noZoom: "at and into are allowed only on lines between boxes in a diagram that declares a zoom",
    boxNeedsZoom: "Boxes of a time diagram sit in the zoom band. Write the zoom range as zoom <unit>-<unit>",
    boxLineNeedsAt: "Write the column of a line between zoom boxes as [at: <unit>]",
    pointLineNoAt: "A line between points runs along the axis, so it takes no at or into",
    mixedLine: "Draw a line between two boxes or between two points",
    undeclaredRow: (id) => `No row named ${id} is declared`,
    undeclaredNote: (id) => `No box or point named ${id} is declared`,
    nowReserved: (name) => `${name} starts the needle line of a time diagram and cannot be an id`,
    noteColorPointOnly: "The color of a note colors the circle of a point, so write it only on the note of a point",
    badShape: `shape takes only ${list(SPAN_SHAPES)}. A bracket takes no shape`,
  };
};

const MESSAGES: Record<NotationLang, Messages> = { ja: ja(), en: en() };

export const messagesFor = (lang: NotationLang): Messages => MESSAGES[lang];
