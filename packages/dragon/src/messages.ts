/**
 * dragon記法の誤りの文 (#2997、#3137)。
 *
 * 記法の語は英語だけで file から言葉が決まらないため、誤りの文は呼ぶ側が渡した言葉
 * (渡さなければ英語) で出す。文の中の記法の語は語の表から引き、表と文で語が食い違わないようにする。
 * ブロックの置き場へ移した行の誤りの文はブロックが日英で持ち (`blocks/<名前>/block.ts` の `messages`)、ここで 1 つの表に束ねる (#3345)。
 */
import { ranked } from "./blocks/block";
import { BLOCKS } from "./blocks/index";
import { list } from "./read-kit";
import { DURATION_UNITS, HEADS, KINDS, type NotationLang, SPAN_SHAPES } from "./words";

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
  declarationInStep: string;
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
  /** 木の図だけの行 (`leaf` と `node`) を、別の種類の図に書いた (#3233) */
  treeOnly: (word: string) => string;
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
  /** 列の図と試す図だけの行 (`item` と `line`) を、どちらでもない図に書いた (#3337) */
  lineupOrTryOnly: (word: string) => string;
  /** 試す図だけの部品の行 (`route`、`queue`、`chain`、`ask`、`press`) を、別の種類の図に書いた (#3337) */
  tryOnly: (word: string) => string;
  /** 宣言だけの部品の行 (`route`、`queue`、`chain`) を段の中に書いた */
  tryPartInStep: (word: string) => string;
  /** 試す図に書けない行 (箱や区画や線など) を書いた */
  tryNoLine: (word: string) => string;
  tryNoEdge: string;
  /** 部品の行が 1 つも無い試す図 */
  noParts: string;
  routeShape: string;
  queueShape: string;
  chainShape: string;
  askShape: string;
  pressShape: string;
  tryItemShape: string;
  tryLineShape: string;
  askTwice: string;
  /** 部品の行に要る属性 `key` が無い */
  needsAttr: (word: string, key: string) => string;
  fewFields: string;
  fieldTwice: (field: string) => string;
  undeclaredPart: (id: string) => string;
  /** 部品 `id` が、名指した所に要る種類 `want` (`route` など) の部品でない */
  wrongPart: (id: string, want: readonly string[]) => string;
  /** 釦の置き場所 `at` に釦を名指した */
  pressAt: (id: string) => string;
  badTake: string;
  /** `field` が入力の帯の欄 (最初の欄を除く) に無い。`fields` は書ける欄 */
  notAskField: (field: string, fields: readonly string[]) => string;
  /** 欄か値を書いたのに、入力の帯 (`ask`) の宣言が無い */
  noAsk: string;
  /** 網の `from` か `to` が網の節に無い */
  notInRoute: (node: string, route: string) => string;
  /** 網の `from` から `to` へ道が無い */
  noPath: (from: string, to: string) => string;
  /** 段の中の `ask` の値の数が、欄の数 `count` と違う */
  askCount: (count: number) => string;
  /** チップ `id` が、もう部品 `part` に在る */
  chipElsewhere: (id: string, part: string) => string;
  /** 待ち行列 `part` が満杯 (`most` 枚) */
  queueFull: (part: string, most: number) => string;
  /** 機械の列 `part` のブロックに入れられるチップの上限 `most` を超えた */
  blockFull: (part: string, most: number) => string;
  /** 空の待ち行列 `part` から取り出す釦 `press` を押した */
  queueEmpty: (part: string, press: string) => string;
  /** `role` の行の形 */
  roleShape: string;
  /** 段の中の `role` の行に、宣言していない役を書いた */
  unknownRole: (id: string) => string;
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
    declarationInStep: "group と box と strip と branch と、scale と period と row と point と zoom は最初の step より前に書く",
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
    treeOnly: (word) => `${word} の行は tree (木の図) でだけ書ける`,
    noLeaves: "leaf の行で葉を 1 つ以上書く",
    leafShape: "leaf は leaf <名札> [hash: <hash>] の形で書く",
    nodeShape: "node は node <名札> of <子>, <子> [hash: <hash>] の形で書く",
    noTreeChild: (id) => `${id} という葉か親はまだ書いていない。子は前に leaf か node で書いた名札にする`,
    notTreeBox: (id) => `${id} は box の行で置いた箱で、木の箱でない。子は leaf か node で書いた名札にする`,
    twoParents: (id) => `${id} はもう別の親の子になっている。木の箱の親は 1 つだけ`,
    manyRoots: (id, root) => `${id} が親を持たないまま残る。木の根は 1 つだけで、${id} も ${root} も最後に 1 つの根へ組む`,
    lineupOnly: (word) => `${word} の行は lineup (列の図) でだけ書ける`,
    lineupOrTryOnly: (word) => `${word} の行は lineup (列の図) と try (試す図) でだけ書ける`,
    tryOnly: (word) => `${word} の行は try (試す図) でだけ書ける`,
    tryPartInStep: (word) => `${word} の行は部品の宣言なので、最初の step より前に書く`,
    tryNoLine: (word) => `try (試す図) には ${word} の行を書けない。部品は route と queue と chain と ask と press の行で書く`,
    tryNoEdge: "try (試す図) には線の行を書けない。チップは line と ask と press の行で動かす",
    noParts: "route と queue と chain と ask と press の行で部品を 1 つ以上書く",
    routeShape: "route は route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>] の形で書く",
    queueShape: "queue は queue <名札> [order: <欄>] の形で書く",
    chainShape: "chain は chain <名札> [edit: <欄>] の形で書く",
    askShape: "ask は最初の step より前なら ask <欄>, <欄> [into: <待ち行列>, via: <網>]、step の中なら ask <値>, <値> の形で書く",
    pressShape: "press は最初の step より前なら press <名札> [from: <待ち行列>, into: <機械の列>, take: <数>]、step の中なら press <名札> の形で書く",
    tryItemShape: "item は最初の step より前なら item <名札> [<欄>: <値>]、step の中なら item <チップ> [<欄>: <値>] の形で書く",
    tryLineShape: "line は line <待ち行列か機械の列>: <チップ>, <チップ> の形で書く",
    askTwice: "ask の行は図に 1 つまで",
    needsAttr: (word, key) => `${word} の行には [${key}: <値>] を書く`,
    fewFields: "ask の欄は , で区切って 2 つ以上書く",
    fieldTwice: (field) => `${field} の欄はもう書いた`,
    undeclaredPart: (id) => `${id} という部品は宣言していない`,
    wrongPart: (id, want) => `${id} は ${want.join(" か ")} の行で書いた部品でない`,
    pressAt: (id) => `${id} は釦なので、釦の置き場所にできない`,
    badTake: "take は 1 以上の整数にする",
    notAskField: (field, fields) => `${field} は ask の欄 (最初の欄を除く) に無い。書けるのは ${list(fields)}`,
    noAsk: "ask <欄>, <欄> [into: <待ち行列>] の行で入力の帯を宣言してから、欄と値を書く",
    notInRoute: (node, route) => `${node} は ${route} の網の節でない`,
    noPath: (from, to) => `${from} から ${to} へ網の道が無い`,
    askCount: (count) => `ask の値は欄と同じ ${count} つを , で区切って書く`,
    chipElsewhere: (id, part) => `${id} はもう ${part} に在る。チップは 1 か所にだけ置ける`,
    queueFull: (part, most) => `${part} は満杯で、チップは ${most} 枚までしか入らない`,
    blockFull: (part, most) => `${part} の 1 つのブロックに入れられるチップは ${most} 枚まで`,
    queueEmpty: (part, press) => `${part} が空なので、${press} を押しても取り出すチップが無い`,
    roleShape: "role は、最初の step より前なら role <名札> [note: <一言>]、step の中なら role <名札> の形で書く",
    unknownRole: (id) => `${id} という役は宣言していない。最初の step より前に role ${id} と書く`,
    noItems: "item の行でチップを 1 つ以上宣言する",
    itemShape: "item は item <名札>, <名札> [color: <色>, label: <字>, note: <説明>] の形で書く",
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
    declarationInStep: "Write group, box, strip, branch, scale, period, row, point and zoom before the first step",
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
    treeOnly: (word) => `${word} lines can be written only in tree diagrams`,
    noLeaves: "Write at least one leaf with a leaf line",
    leafShape: "Write a leaf as leaf <id> [hash: <hash>]",
    nodeShape: "Write a node as node <id> of <child>, <child> [hash: <hash>]",
    noTreeChild: (id) => `No leaf or node named ${id} has been written yet. A child must be an id written earlier with leaf or node`,
    notTreeBox: (id) => `${id} is a box from a box line, not a tree box. A child must be an id written with leaf or node`,
    twoParents: (id) => `${id} is already a child of another node. A tree box has only one parent`,
    manyRoots: (id, root) => `${id} is left without a parent. A tree has one root, so join ${id} and ${root} under one root by the end`,
    lineupOnly: (word) => `${word} lines can be written only in lineup diagrams`,
    lineupOrTryOnly: (word) => `${word} lines can be written only in lineup and try diagrams`,
    tryOnly: (word) => `${word} lines can be written only in try diagrams`,
    tryPartInStep: (word) => `A ${word} line declares a part, so write it before the first step`,
    tryNoLine: (word) => `A try diagram takes no ${word} lines. Write its parts with route, queue, chain, ask and press lines`,
    tryNoEdge: "A try diagram takes no edge lines. Chips move with line, ask and press lines",
    noParts: "Write at least one part with a route, queue, chain, ask or press line",
    routeShape: "Write a route as route <id>: <node> - <node>, <node> - <node> [from: <node>, to: <node>]",
    queueShape: "Write a queue as queue <id> [order: <field>]",
    chainShape: "Write a chain as chain <id> [edit: <field>]",
    askShape: "Write ask as ask <field>, <field> [into: <queue>, via: <route>] before the first step, or as ask <value>, <value> inside a step",
    pressShape: "Write press as press <id> [from: <queue>, into: <chain>, take: <count>] before the first step, or as press <id> inside a step",
    tryItemShape: "Write item as item <id> [<field>: <value>] before the first step, or as item <chip> [<field>: <value>] inside a step",
    tryLineShape: "Write a line as line <queue or chain>: <chip>, <chip>",
    askTwice: "A diagram takes at most one ask line",
    needsAttr: (word, key) => `A ${word} line needs [${key}: <value>]`,
    fewFields: "Write at least two ask fields, separated by ,",
    fieldTwice: (field) => `The field ${field} is already written`,
    undeclaredPart: (id) => `No part named ${id} is declared`,
    wrongPart: (id, want) => `${id} is not a part written with a ${want.join(" or ")} line`,
    pressAt: (id) => `${id} is a button, so a button cannot be placed at it`,
    badTake: "take is a whole number of 1 or more",
    notAskField: (field, fields) => `${field} is not an ask field other than the first. Write ${list(fields)}`,
    noAsk: "Declare the input strip with ask <field>, <field> [into: <queue>] before writing fields and values",
    notInRoute: (node, route) => `${node} is not a node of the route ${route}`,
    noPath: (from, to) => `The route has no path from ${from} to ${to}`,
    askCount: (count) => `Write ${count} ask values separated by ,, one for each field`,
    chipElsewhere: (id, part) => `${id} is already in ${part}. A chip sits in one place only`,
    queueFull: (part, most) => `${part} is full. It holds at most ${most} chips`,
    blockFull: (part, most) => `A block of ${part} holds at most ${most} chips`,
    queueEmpty: (part, press) => `${part} is empty, so pressing ${press} takes no chips`,
    roleShape: "Write a role as role <id> [note: <text>] before the first step, or as role <id> inside a step",
    unknownRole: (id) => `The role ${id} is not declared. Write role ${id} before the first step`,
    noItems: "Declare at least one chip with an item line",
    itemShape: "Write an item as item <id>, <id> [color: <color>, label: <text>, note: <text>]",
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
