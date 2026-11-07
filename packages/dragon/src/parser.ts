/**
 * 人が書く dragon記法を、図の原本の JSON へ変える (#3137)。
 *
 * 行の種類は行の頭の英語の語で決まり、線の行だけは箱の名札から始まる。最初の `step` より前に
 * 図の種類と題と区画と箱と帯を宣言し、`step` ごとに、その段で起きることを起きる順に並べる。
 *
 *   sequence <題> [view: fixed か follow]                書かなければ字の大きさで選ぶ。図の種類は sequence と architecture と state
 *   group <名札> as <名前> [note: <添え書き>, color: <色>, icon: <印>]
 *     box <名札> as <名前> [note: <下の小さな字>, color: <色>, icon: <印>, link: <飛び先>]
 *   end                                                  同じ名札の group はもう一度開ける
 *   box <名札> as <名前> [...]                           as が無ければ名札を名前にする
 *   strip <題>: <欄>, <欄>
 *   step <段の題>
 *     say <段の本文>                                     say の下に字下げした行は本文の続き
 *     code <段で打つ命令>
 *     source <出典の名前> [url: <URL>]                   1 つの段に何行でも書ける
 *     <名札> -> <名札>: <線の名前> [carry: <運ぶ物>, tag: <値>, side: <側>]
 *     act <名札>: <処理の名前>                           箱の中の処理
 *     note <名札>: <字>                                   箱の下の小さな字の書き換え
 *     set <欄>: <値> [tag: <札>]                          中身の帯の値
 *
 * 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べて行の終わりに置く。
 * 空白を含む名前と文は行の終わりか `[` の前に置き、`[` を含む名前と `,` か `]` を含む属性の値だけを
 * `"` で囲む。囲みの中では `\"` が `"`、`\\` が `\` になる。字下げは `say` の続きの行を見分ける時だけ意味を持つ。
 *
 * 箱の飛び先 (`link`) と段の出典の `url` は描いた図と段の一覧の link にそのまま入るため、頁を移る形
 * (`/` で始まる path か、`http://` か `https://` で始まる URL) だけを受ける (#3199)。
 *
 * 状態遷移図 (`state`) では、線の送る側に始まりの印 `start`、受ける側に終わりの印 `finish` を書ける。
 * 最初の `step` より前に書いた線は、移れるが段で通るとは限らない道 (`state.paths`) になり、属性を持たない (#3163)。
 * 状態遷移図の `start` と `finish` は箱の名札に使えない。時系列図と構成図では宣言して使う普通の名札のまま。
 *
 * 枝分かれの図 (`git`、#3164) は、最初の `step` より前に `branch <名札> [note: <添え書き>]` で枝を上から順に宣言し、
 * 段の中に `commit <名札> on <枝> [hash: <hash>, note: <一言>]` で commit を積み、`<枝> from <commit>` で枝を切る。
 * 当て直しは `on <枝>` の後ろに `copy <commit>` を、merge commit は `merge <枝>` を続ける。
 * 線の行は札を動かす行になり、送る側に枝の名札か `HEAD`、受ける側に積んだ commit を書く。運ぶ物は書かなければ送る側の名前の札。
 * 枝分かれの図では `HEAD` を名札に使えず、区画 (`group`) は書けない。`branch` と `commit` の行は枝分かれの図でだけ書ける。
 * 状態遷移図の道と、枝分かれの図の枝と commit と枝を切る行は、脇道と枝と commit のブロックが読む (#3347)。
 * 道の行と枝を切る行は行の頭の語を持たないので、ここで見分けてブロックの読む処理を呼ぶ。
 *
 * 時間軸の図 (`time`、#3165) は、最初の `step` より前に目盛りと区切りと印の列と節目と拡大の範囲を宣言する。
 *
 *   scale <単位> <長さ> <数> [from: <最初の番号>]       長さは数と単位 (ms、s、min、h、d) の組 (`12s`)
 *   period <名前> <目盛りの数> [from: <最初の番号>]
 *   row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>]
 *   point <名札> at <目盛り>
 *   zoom <目盛り>-<目盛り>
 *
 * 段の中では `now -> <目盛り>` で針をその目盛りの終わりまで進め、`mark <列> <範囲> [color: <色>]` で印の色を変え、
 * `span <範囲>: <字> [shape: box, color: <色>]` で範囲に括弧か囲みを出す。目盛りは 0 から数え、範囲は `0-31` か `0` と書く。
 * 箱は拡大の帯に置き、箱どうしの線は `[at: <目盛り>]` で列を選び、受ける箱を別の列から選ぶ時は `[into: <目盛り>]` を足す。
 * 節目どうしの線は軸の上に引き、`note <節目>: <状態> [color: <色>]` で節目の状態と丸の色を変える。
 * 中身の帯の欄の名前の後ろに `[meter: <割合>]` を書くと物差しになり、`set` の値を割合 (`97%` か `2/3`) で書く。
 * 印の列と箱は同じ名札を持てる (空いた目盛りの列でその箱を空きの枠にするため)。時間軸の図では `now` を名札に使えない。
 *
 * 木の図 (`tree`、#3233) は、段の中に `leaf <名札> [hash: <hash>]` で葉を出し、`node <名札> of <子>, <子> [hash: <hash>]` で
 * 前に書いた葉か親を子にして親を組む。箱は書いた段で現れ、親は 1 つだけ持てる。最後の段を終えた時に親を持たない木の箱は根の 1 つだけ。
 * 線の端には木の箱も `box` の箱も書ける。木の図に区画 (`group`) は書けず、`leaf` と `node` の行は木の図でだけ書ける。
 *
 * 列の図 (`lineup`、#3239) は、`box` の行が列になり、最初の `step` より前に `item <名札>, <名札> [color: <色>, label: <字>]` でチップを宣言する。
 * 段の中で `line <列>: <チップ>, <チップ>` と書くと列の並びが替わり、`seal <列>` で封をし、`open <列>` で開け、`pick <列>` で列を選び、
 * `stamp <列>: <字>` で札を押す。列の図に区画 (`group`) と線と `act` の行は書けない。封をした列の並びは、開けるまで書けない。
 * `item`、`line`、`seal`、`open`、`pick`、`stamp`、`role` の行は列の図でだけ書ける。
 * 卓の形 (#3351) で、`box` の行の `[order: none]` は箱を順番の無い置き場にし、`item` の行の `[note: <説明>]` は凡例の説明を持たせる。
 * 最初の `step` より前の `role <名札> [note: <一言>]` は役を宣言し、段の中の `role <名札>` はその段で動く役を名指す。
 *
 * 試す図 (`try`、#3337) は、最初の `step` より前に部品の行を上から積む順に書く。
 *
 *   route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>]     網。from から to へ最短の道でチップを運ぶ
 *   queue <名札> [order: <欄>, accept: <名前>]                        待ち行列。order の欄の値の高い順に並べ、accept の名前のチップだけを入れる
 *   chain <名札> [edit: <欄>]                                         機械の列。edit の欄を読み手が書き換えられる
 *   ask <欄>, <欄> [into: <待ち行列>, via: <網>]                       入力の帯。図に 1 つまで。最初の欄の値がチップの名前
 *   press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <数>, at: <部品>]   釦。from: "<待ち行列>, <待ち行列>" はそれぞれから take 件ずつ集める
 *   item <名札> [<欄>: <値>]                                          チップ。鍵は ask の欄 (最初の欄を除く)
 *
 * 段の中では `line <待ち行列か機械の列>: <チップ>, <チップ>` で中身を書き、`ask <値>, <値>` で送り、`press <釦>` で押し、
 * `item <チップ> [<欄>: <値>]` で書き換える。部品を名指す属性は全ての宣言を読んでから確かめ、誤りは名指した行に出す。
 * 段の中の出来事は段ごとの状態の手順 (`try-state.ts`) に 1 つずつ当て、空の待ち行列からの press と満杯の待ち行列への ask を断る。
 * 受け入れない名前の ask と、2 つ以上の待ち行列のどれかが take 件に満たない press も断る (#3453)。
 * 部品の行は試す図でだけ書け、試す図に箱と区画と線の行は書けない。
 *
 * 配管の図 (`pipe`、#3389) は、`box` の行が関係者になり、最初の `step` より前に `hold <持ち主>: <量> <トークン>, ...` で残高を、
 * `hold <持つ Contract>: <名前> <値>` で残高でない値を宣言する。線の行は呼び出しになり、属性の `value` と `call` と `fold` を持つ。
 * 段の中では `move`、`write`、`check`、`return`、`revert`、`emit`、`calc` を書き、呼び出しの開け閉めと残高は
 * 段ごとの状態の手順 (`pipe-run.ts`) に 1 つずつ当てる。これらの行は配管の図でだけ書け、配管の図に区画のような配管の図の持たない行は書けない。
 *
 * 時系列図と構成図と状態遷移図 (種類の定義が `short` を名乗る図) は、宣言と段を省いた短い記法も読む (#3438)。
 * 1 行目は図の種類の語だけでよく、原本の題は図の種類の語にする。`step` の行を 1 つも書かない図は、線 1 本を 1 段にして書いた順に並べ、
 * 状態遷移図でもその線を道にしない。`say` を書かない段は、段の線の名前から本文を導く (`short-form.ts`)。
 * 箱を 1 つも宣言しない図は、線に出た名前を出た順に箱にし、前に出た名前と 1 字だけ違う名前を、図を描いたまま知らせ (`notices`) で返す。
 * 段を書いた図の段の外の線と、箱を 1 つでも宣言した図の宣言の無い名前は、省いた形と読まずに誤りで止める。
 *
 * 行の頭の語と同じ綴りの名札 (`end` や `step`) も書ける。名札の次に `->` が来る行は線と読む。
 * 誤りは最初の 1 つで止め、行と列を示す。誤りの文の言葉は呼ぶ側が渡す。
 *
 * 行はブロックの読み方 (`blocks/<名前>/read.ts`) が読み、ここは行をブロックへ振り分ける (#3345、#3349)。
 * どの行をどのブロックが読むかはブロックの定義 (`block.ts`) の語と `lines` の宣言から引き (`blocks/used.ts`)、読み方は登録簿 (`blocks/reading.ts`) から引く。
 * 軽い入口で読み方をまだ読んでいないブロックの行は、黙って別の行と読まず、ブロックの名前を名指す誤りで止める。
 * 図の種類の決まり (名札に使えない名前、線の端、読み終えた時の確かめ) は、その種類の図が必ず使うブロック (定義の `always`) の読み方の手続きが持つ。
 */
import type { BlockReading, FigureDraft, HeadReader, KindName, LineView, ParseState, StepDraft } from "./blocks/block";
import { EDGE, EDGE_WITHOUT_TARGET, type EdgeEvent } from "./blocks/edge/block";
import { readEdgeLine } from "./blocks/edge/read";
import { BLOCKS } from "./blocks/index";
import { cachedByReadings, loadedReadings, readingLoaded } from "./blocks/reading";
import { stepOf, viewOf } from "./blocks/step/read";
import { fits } from "./blocks/usable";
import { kindNeeds, lineNeeds, lineView, matches } from "./blocks/used";
import { TIME_EDGE_ATTRS } from "./blocks/zoom/block";
import { KIND_FOLDERS } from "./kinds/index";
import type { Kind } from "./kinds/kind";
import { type Messages, messagesFor, type Shape } from "./messages";
import { fail, isOneOf, NotationError, readAttrs, readName } from "./read-kit";
import type { Diagram, DiagramModel, Step } from "./schema";
import { columnOf, isBlankOrComment, type SourceLine, tokenize } from "./tokenize";
import { FORMAT_VERSION, fromModel, MODEL_VERSION } from "./model";
import { markParsed } from "./parsed";
import { similarNames } from "./nearest";
import { derivedBody, lineText } from "./short-form";
import { defineUserBlocks, sharedBlocksUsed, type UserBlock, UserBlockFailure, type UserBlocks, userBlock, userBlockReader, versionLine, withUserBlocks } from "./user-blocks";
import { ATTRS, DEFAULT_LANG, HEADS, KINDS, type NotationLang, OLD_HEADS } from "./words";

/** 読み方の手続きの名前 */
type Hook = "take" | "checkHead" | "settle" | "beginStep" | "endAt" | "reserved" | "columns" | "afterEdge" | "finish" | "verify";

export interface LineError {
  line: number;
  column: number;
  message: string;
}

/**
 * 読んだ結果。読めた図は、図を描いたまま書き手に知らせる事 (`notices`) を持つことがある (#3438)。
 * 知らせは箱を宣言しない図の似た名前の箱で、誤りと同じく行と列と文を持つ。知らせが無い時は欄を持たない
 */
export type Parsed = { ok: true; diagram: Diagram; notices?: LineError[] } | { ok: false; errors: LineError[] };

export interface ParseOptions {
  /** 誤りの文の言葉。既定は英語 (#3338) */
  lang?: NotationLang;
  /** 図の頭に書かずに渡す、使う人が足すブロックの定義 (#3399)。`readBlocks` が読んだ物 */
  blocks?: UserBlocks;
}

/** 段の中の、足した線のブロックで結ぶ線の行。名札、`+<名前>`、名札 (#3399) */
const USER_EDGE = /^([^\s:[\]]+?)\s+(\+[^\s:[\]]*)\s+([^\s:[\]]+)/du;
/** 足した線のブロックで結ぶ線の行のうち、先の名札を書き忘れた行 (#3468) */
const USER_EDGE_WITHOUT_TARGET = /^([^\s:[\]]+?)\s+(\+[^\s:[\]]*)\s*(?=$|[:[])/du;
/** 行の頭の `+` で始まる語 (#3399) */
const USER_HEAD = /^\+[^\s:[\]]*/u;

/**
 * 前の形 (#2997 まで) の行なら、その印と、新しい形で書く行の形。`inStep` は段の中の行か。
 * 新しい形で読めない行の誤りの文で、書き直し方を示すために引く。
 */
function oldForm(text: string, inStep: boolean): { word: string; shape: Shape } | undefined {
  const first = text.split(/\s/u)[0] ?? "";
  if (first === "帯") return { word: first, shape: inStep ? "set" : "strip" };
  if (Object.hasOwn(OLD_HEADS, first)) return { word: first, shape: OLD_HEADS[first as keyof typeof OLD_HEADS] };
  if (text.startsWith("#")) return { word: "#", shape: "step" };
  if (text.startsWith(">")) return { word: ">", shape: "say" };
  if (text.startsWith("`")) return { word: "`", shape: "code" };
  if (text.includes("「")) return { word: "「」", shape: inStep ? "note" : "box" };
  if (/^[^\s=:]+\s*=(?!>)/u.test(text)) return { word: "=", shape: "box" };
  if (inStep && /^[^\s:]+\s*:/u.test(text)) return { word: ":", shape: "act" };
  return undefined;
}

/**
 * 持っている読み方の、行の頭の語ごとの読む処理 (#3345、#3349)。
 * 行の頭の語の誤り (図の種類だけの語と、知らない語) を確かめた後に、ここに在る語はブロックの読む処理で読む
 */
const headReaders = cachedByReadings(
  (): ReadonlyMap<string, HeadReader> => new Map(loadedReadings().flatMap(({ reading }) => ("none" in reading.read ? [] : Object.entries(reading.read)))),
);
/**
 * 図の種類だけのブロック (`attach.only`) が持つ行の頭の語と、その図の種類 (#3164、#3347、#3348)。
 * ほかの種類の図に書いた行は、その図の種類だけの語の誤りで止める。読み方を読まずに断れるよう、ブロックの定義から引く
 */
const ONLY_HEADS: ReadonlyMap<string, KindName> = new Map(
  Object.values(BLOCKS).flatMap((block) => {
    const only = block.attach.only;
    return only === undefined ? [] : (block.words.heads ?? []).map((head) => [head, only] as const);
  }),
);
/** 列の図と試す図の両方に書ける行の頭の語 (#3337)。ほかの種類の図に書いた行は、2 つの図の種類だけの語の誤りで止める */
const LINEUP_OR_TRY = ["item", "line"];
/** 箱を持たずに描ける図の種類。ほかの種類の図は箱が 1 つも無いと止める */
const BOXLESS: readonly KindName[] = ["git", "time", "tree", "try"];

/** 記法を読んで、描く処理の形 (版1と同じ欄と並び) に組む。原本 (版2) へは `parseNotation` が `fromModel` で移す (#3346) */
function parseLines(lines: SourceLine[], m: Messages, lang: NotationLang, notices: LineError[]): DiagramModel {
  const headAt = lines.findIndex((source) => !isBlankOrComment(source));
  const head = lines[headAt];
  if (!head) throw new NotationError(1, 1, m.noHead);
  const kind = head.text.split(/\s/u)[0] ?? "";
  if (!isOneOf(KINDS, kind)) {
    const old = oldForm(head.text, false);
    throw fail(head, 0, old ? m.oldForm(old.word, old.shape) : m.badHead);
  }
  const kindFolder = (KIND_FOLDERS as unknown as Readonly<Record<string, Kind>>)[kind] as Kind;
  /** 宣言と段を省いた短い記法を読む図の種類か (#3438) */
  const short = kindFolder.short === true;
  const titled = readName(head, kind.length, m);
  if (titled.value === "" && !short) throw fail(head, 0, m.badHead);
  // 短い記法の 1 行目は図の種類の語だけでよい。原本の題は空にできないので、図の種類の語を題にする
  const title = titled.value === "" ? kind : titled.value;
  const view = viewOf(head, titled.rest < head.text.length ? readAttrs(head, titled.rest, ATTRS.diagram ?? [], m).get("view") : undefined, m);

  // 図の種類の決まりを持つブロック (定義の `always`) の読み方は、行が無くても要る
  const always = kindNeeds(kind).find((name) => !readingLoaded(name));
  if (always !== undefined) throw fail(head, 0, m.blockNotLoaded(always));
  /** この図の種類で使える、持っている読み方。ブロックの並び (`rank`) の順 */
  const own = loadedReadings().filter(({ block }) => fits(block, kindFolder));
  /** この図の種類で使える読み方が持つ、名前 `key` の手続き。ブロックの並びの順 */
  const hooks = <K extends Hook>(key: K): NonNullable<BlockReading[K]>[] =>
    own.flatMap(({ reading }) => (reading[key] === undefined ? [] : [reading[key] as NonNullable<BlockReading[K]>]));
  const isGit = kind === "git";
  const isTime = kind === "time";
  const isLineup = kind === "lineup";
  const isTry = kind === "try";
  const ids = new Set<string>();
  /** 宣言の行でブロックが組む欄 (区画と箱と、中身の帯と、時間軸の図の物差しの欄と、状態遷移図の道と、枝分かれの図の枝と札) */
  const figure: FigureDraft = {
    regions: [],
    boxes: [],
    meters: [],
    paths: [],
    branches: [],
    git: { commits: new Set(), tips: new Map() },
    time: { rows: [], points: [], pending: [], settled: false, needle: 0 },
    tree: { boxes: new Map(), parents: new Map() },
    lineup: { items: [], roles: [], sealed: new Set() },
    try: { parts: [], items: [], sides: [], pending: [] },
    pipe: { holds: [], opened: [] },
  };
  const { regions, boxes, paths, branches, time } = figure;
  const steps: Step[] = [];
  let building: StepDraft | undefined;
  const rest = lines.slice(headAt + 1);
  /** `step` の行を 1 つも書かない短い記法の図か。線 1 本を 1 段にする (#3438) */
  const lineSteps = short && !rest.some((source) => !isBlankOrComment(source) && !EDGE.test(source.text) && /^step(?:\s|$)/u.test(source.text));
  /** 箱を宣言しない図で、線に出た名前から最初に導いた箱の行と位置 (#3438)。導いた後に宣言の行が来たら、ここを宣言の無い名前の誤りとして示す */
  let inferred: { source: SourceLine; at: number; id: string } | undefined;
  /** 名札から箱の名前を引く。箱でない端は名札のまま */
  const nameOf = (id: string): string => boxes.find((box) => box.id === id)?.name ?? id;
  /** 全ての宣言を読んでから確かめる宣言を、もう確かめたか */
  let settled = false;

  const declare = (source: SourceLine, id: string, at: number): void => {
    // 箱を導いた後の宣言は、箱を宣言した図の宣言の無い名前として、最初に導いた名前を示して止める (#3438)
    if (inferred) throw fail(inferred.source, inferred.at, m.undeclaredBox(inferred.id));
    if (ids.has(id)) throw fail(source, at, m.duplicate(id));
    ids.add(id);
  };
  /**
   * 線の端などに書いた箱の名札。箱を 1 つも宣言しない短い記法の図は、出た名前を出た順に箱にし (#3438)、
   * 前に導いた箱と 1 字だけ違う名前は、図を描いたまま知らせる
   */
  const boxAt = (source: SourceLine, id: string, at: number): string => {
    if (boxes.some((box) => box.id === id)) return id;
    if (!short || (boxes.length > 0 && !inferred)) throw fail(source, at, m.undeclaredBox(id));
    notReserved(source, id, at);
    const like = boxes.find((box) => similarNames(id, box.id));
    if (like) notices.push({ line: source.line, column: columnOf(source, at), message: m.similarBox(id, like.id) });
    inferred ??= { source, at, id };
    ids.add(id);
    boxes.push({ id, name: id });
    return id;
  };
  /**
   * 線の端。図の種類が箱のほかに書ける名札 (状態遷移図の始まりと終わりの印、枝分かれの図の枝と commit、時間軸の図の節目、木の図の木の箱) は、
   * その決まりを持つブロックが確かめる
   */
  const endAt = (source: SourceLine, id: string, at: number, side: "from" | "to"): string => {
    for (const end of hooks("endAt")) {
      const found = end(source, id, at, side, state);
      if (found !== undefined) return found;
    }
    return boxAt(source, id, at);
  };
  /** 図の種類が名札に使えない名前 (状態遷移図の始まりと終わりの印、枝分かれの図の `HEAD`、時間軸の図の `now`) は、その決まりを持つブロックが止める */
  const notReserved = (source: SourceLine, id: string, at: number): void => {
    for (const reserved of hooks("reserved")) reserved(source, id, at, state);
  };
  /** 宣言の行の名札を、使えない名前でも宣言済みでもない名札として取る */
  const claim = (source: SourceLine, id: string, at: number): void => {
    notReserved(source, id, at);
    declare(source, id, at);
  };
  /** 段の中に書く行の、書き先の段。最初の `step` より前なら誤り */
  const inStep = (source: SourceLine): StepDraft => {
    if (!building) throw fail(source, 0, m.stepLineBeforeStep);
    return building;
  };
  /** 宣言の行。最初の `step` より後か、段を書かない図の最初の線より後なら誤り */
  const beforeSteps = (source: SourceLine): void => {
    if (building) throw fail(source, 0, m.declarationInStep);
    if (lineSteps && steps.length > 0) throw fail(source, 0, m.declarationAfterLine);
  };
  /** 全ての宣言を読んでから確かめる宣言を、最初の段を始める時か記法の終わりに 1 度だけ確かめる */
  const settle = (): void => {
    if (settled) return;
    settled = true;
    for (const check of hooks("settle")) check(state, head);
  };
  /** 書いている段を閉じる。開いたままの区画と、全ての宣言を読んでから確かめる宣言を確かめてから、段を段の並びへ足す */
  const closeStep = (): void => {
    if (figure.group) throw fail(figure.group.source, 0, m.unclosedGroup(figure.group.id));
    settle();
    if (!building) return;
    // 短い記法の図の `say` を書かない段は、段の線の名前から本文を導く (#3438)。線も無ければ本文の無い段の誤りになる
    if (short && building.body === undefined) building.body = derivedBody(building.events, nameOf);
    steps.push(stepOf(building, m));
  };
  const openStep = (draft: StepDraft): void => {
    building = draft;
    for (const begin of hooks("beginStep")) begin(state);
  };
  /** 段を書かない図の線の行を 1 段にして始める (#3438)。題は線を読んだ後に `closeLineStep` が付ける */
  const openLineStep = (source: SourceLine): void => {
    closeStep();
    openStep({ source, title: "", sources: [], events: [] });
  };
  /** 線 1 本の段を、線から導いた題で閉じる。次の行は段の外の行として読む */
  const closeLineStep = (edge: EdgeEvent): void => {
    if (building) building.title = lineText(edge, nameOf);
    closeStep();
    building = undefined;
  };
  /** ブロックの読む処理が受ける、読んでいる記法の状態 */
  const declared = (id: string): boolean => ids.has(id);
  const current = (): StepDraft | undefined => building;
  /**
   * 図の種類だけの行の頭の語を、ほかの種類の図に書いた時の誤りの文。
   * 区画の行のように、図の種類だけのブロックが読む処理で自分で断る語の図の種類は持たない
   */
  const onlyIn: Partial<Record<KindName, (word: string) => string>> = { git: m.gitOnly, time: m.timeOnly, tree: m.treeOnly, lineup: m.lineupOnly, try: m.tryOnly, pipe: m.pipeOnly };
  /** 線の列。持つ図の種類 (時間軸の図) のブロックが読み、ほかの種類の図に書いた列は誤りで止める */
  const columns: ParseState["columns"] = (source, from, to, attrs, end) => {
    const [read] = hooks("columns");
    if (read) return read(source, from, to, attrs, end, state);
    const given = TIME_EDGE_ATTRS.flatMap((name) => {
      const attr = attrs.get(name);
      return attr ? [{ name, attr }] : [];
    })[0];
    if (given) throw fail(source, given.attr.at, m.timeOnly(given.name));
    return {};
  };
  const state: ParseState = { m, kind, attrs: ATTRS, inStep, current, closeStep, openStep, beforeSteps, boxAt, declare, declared, notReserved, claim, endAt, columns, figure };
  /** 行が使うブロックの読み方を持っているか確かめる。持っていなければ、ブロックの名前を名指して止める */
  const needed = (source: SourceLine, line: LineView): void => {
    const missing = lineNeeds(line, kind).find((name) => !readingLoaded(name));
    if (missing !== undefined) throw fail(source, 0, m.blockNotLoaded(missing));
  };
  /** 行の形で読む行を、定義の `lines` が当たるブロックの読み方で読む。読んだら true */
  const taken = (source: SourceLine, line: LineView): boolean =>
    own.some(({ block, reading }) => reading.take !== undefined && (block.lines ?? []).some((match) => matches(match, line)) && reading.take(source, state, line));

  /** 図の頭に書いた、使う人が足すブロックの定義 (#3399) */
  const define: UserBlock[] = [];
  /** 名前 `name` の足したブロックの定義。無いか、元のブロックが `want` でなければ、行の `at` の字を指して止める */
  const added = (source: SourceLine, name: string, at: number, want: UserBlock["base"]): UserBlock => {
    const found = userBlock(name);
    if (!found) throw fail(source, at, m.userBlocks.undefinedBlock(name));
    if (found.base !== want) throw fail(source, at, m.userBlocks.wrongBase(name, found.base, want));
    return found;
  };

  for (let i = 0; i < rest.length; i++) {
    const source = rest[i];
    if (!source || isBlankOrComment(source)) continue;
    const text = source.text;
    // 使う人が足すブロック (#3399)。定義の並びと、`+` の語で書いた箱と線の行は、行の頭の語より先に読む。
    // `block` と `blocks` は名札にも書けるので、名札の次に `->` が来る行は線と読む (CCIP の見本の `block -> Verifier`)
    const named = EDGE.test(text);
    if (!named && versionLine(source) !== undefined) {
      beforeSteps(source);
      // 定義を読む処理は後から読む (軽い入口は `loadFor` が読む)。読んでいなければ止める
      const reader = userBlockReader();
      if (reader === undefined) throw fail(source, 0, m.blockNotLoaded("blocks"));
      const read = reader.readBlockLines(rest, i, lang, new Set(define.map((b) => b.name)));
      define.push(...read.blocks);
      defineUserBlocks(read.blocks);
      i = read.next - 1;
      continue;
    }
    if (!named && /^block(?:\s|$)/u.test(text)) throw fail(source, 0, m.userBlocks.versionMissing);
    // 段を書かない短い記法の図は、線の行ごとに 1 段を始める (#3438)。状態遷移図でも道にせず、段として読む
    const lineStep = lineSteps && (named || USER_EDGE.test(text));
    if (lineStep) openLineStep(source);
    const userHead = USER_HEAD.exec(text)?.[0];
    if (userHead !== undefined) {
      added(source, userHead, 0, "box");
      // 箱の行として読む。名前の分だけ列をずらし、後ろの字の誤りが元の行の列を指すようにする
      const asBox: SourceLine = { ...source, text: `box${text.slice(userHead.length)}`, column: source.column + Array.from(userHead).length - "box".length };
      const before = boxes.length;
      headReaders().get("box")?.(asBox, state, (offset) => rest[i + offset]);
      for (const box of boxes.slice(before)) box.block = userHead;
      continue;
    }
    const userEdge = USER_EDGE.exec(text);
    if (userEdge) {
      const [from, name] = [userEdge[1] ?? "", userEdge[2] ?? ""];
      const at = userEdge.indices?.[2]?.[0] ?? from.length;
      added(source, name, at, "edge");
      // 線の行として読む。名前を同じ長さの矢印に替え、後ろの字の誤りが元の行の列を指すようにする
      const arrow = `->${" ".repeat(Math.max(0, name.length - 2))}`;
      const asEdge: SourceLine = { ...source, text: `${text.slice(0, at)}${arrow}${text.slice(at + name.length)}` };
      const edge = EDGE.exec(asEdge.text);
      if (!edge) throw fail(source, at, m.edgeShape);
      const read = readEdgeLine(asEdge, edge, state);
      read.block = name;
      for (const after of hooks("afterEdge")) after(read, state);
      if (lineStep) closeLineStep(read);
      continue;
    }
    const line = lineView(text, building !== undefined);
    needed(source, line);
    // 行の頭の語でなく行の形で読む行 (時間軸の図の針、状態遷移図の道、枝を切る行、試す図のチップと中身と線) は、その行を読むブロックが先に読む
    if (taken(source, line)) continue;
    // 名札の次に `->` が来る行は、名札が行の頭の語と同じ綴りでも線と読む
    const edge = EDGE.exec(text);
    if (edge) {
      const read = readEdgeLine(source, edge, state);
      for (const after of hooks("afterEdge")) after(read, state);
      if (lineStep) closeLineStep(read);
      continue;
    }
    const { word } = line;
    // 列の図のチップと並びの語は試す図でも書け、ほかの種類の図に書いた行は 2 つの図の種類だけの語の誤りで止める (#3337)
    if (LINEUP_OR_TRY.includes(word) && !isLineup && !isTry) throw fail(source, 0, m.lineupOrTryOnly(word));
    const only = ONLY_HEADS.get(word);
    const refuse = only === undefined || only === kind ? undefined : onlyIn[only];
    if (refuse) throw fail(source, 0, refuse(word));
    if (!isOneOf(HEADS, word)) {
      const old = oldForm(text, building !== undefined);
      if (old) throw fail(source, 0, m.oldForm(old.word, old.shape));
      // 矢印の先を書き忘れた線の行は、行の頭の語でなく線の行の形で断る。頭の名札は正しく、直す所は矢印の後ろなので (#3468)
      const cut = EDGE_WITHOUT_TARGET.exec(text);
      const userCut = cut ? null : USER_EDGE_WITHOUT_TARGET.exec(text);
      const missing = cut ?? userCut;
      if (missing) {
        if (isLineup) throw fail(source, 0, m.lineupNoEdge);
        if (userCut) added(source, userCut[2] ?? "", userCut.indices?.[2]?.[0] ?? 0, "edge");
        throw fail(source, missing[0].length, m.edgeShape);
      }
      throw fail(source, 0, m.unknownHead(word));
    }
    for (const check of hooks("checkHead")) check(source, word, state);
    const reader = headReaders().get(word);
    if (reader) {
      // 下の行まで続けて読んだ処理は、読み終えた続きの行の数を返す
      const read = reader(source, state, (offset) => rest[i + offset]);
      if (typeof read === "number") i += read;
      continue;
    }
  }
  closeStep();

  for (const finish of hooks("finish")) finish(state, head);
  if (boxes.length === 0 && !BOXLESS.includes(kind)) throw fail(head, 0, m.noBoxes);
  if (steps.length === 0) throw fail(head, 0, m.noSteps);
  for (const verify of hooks("verify")) verify(state, head);
  // 共有のブロック集から引いた定義も原本の定義の欄に入れ、原本だけを受け取った側でも同じ図を描けるようにする (#3455)
  define.push(...sharedBlocksUsed().filter((b) => !define.some((own) => own.name === b.name)));

  return {
    version: MODEL_VERSION,
    kind,
    title,
    ...(view ? { view } : {}),
    ...(define.length > 0 ? { define: { format: 1, blocks: define } } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    boxes,
    ...(figure.strip ? { strip: figure.meters.length > 0 ? { ...figure.strip, meters: figure.meters } : figure.strip } : {}),
    steps,
    ...(paths.length > 0 ? { state: { paths } } : {}),
    ...(isGit ? { git: { branches } } : {}),
    ...(isLineup ? { lineup: { items: figure.lineup.items, ...(figure.lineup.roles.length > 0 ? { roles: figure.lineup.roles } : {}) } } : {}),
    ...(isTry ? { try: { parts: figure.try.parts, items: figure.try.items, ...(figure.try.sides.length > 0 ? { sides: figure.try.sides } : {}) } } : {}),
    ...(figure.pipe.holds.length > 0 ? { pipe: { holds: figure.pipe.holds } } : {}),
    ...(isTime && time.scale
      ? {
          time: {
            scale: time.scale,
            ...(time.period ? { period: time.period } : {}),
            rows: time.rows,
            ...(time.points.length > 0 ? { points: time.points } : {}),
            ...(time.zoom ? { zoom: time.zoom } : {}),
          },
        }
      : {}),
  };
}

export function parseNotation(notation: string, options: ParseOptions = {}): Parsed {
  const lang = options.lang ?? DEFAULT_LANG;
  try {
    // 引数で渡した定義と図の頭の定義は、読んでいる間だけ有効にする (#3399)
    // 読んだ図には印を付け、描く時の原本の形の検査を省く (#3400)
    // 知らせ (#3438) は図を描いたまま返し、無ければ欄を持たない
    const notices: LineError[] = [];
    return withUserBlocks([options.blocks], (): Parsed => {
      const diagram = markParsed(fromModel(parseLines(tokenize(notation), messagesFor(lang), lang, notices), FORMAT_VERSION));
      return notices.length > 0 ? { ok: true, diagram, notices } : { ok: true, diagram };
    });
  } catch (error) {
    if (!(error instanceof NotationError) && !(error instanceof UserBlockFailure)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
