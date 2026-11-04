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
 *   queue <名札> [order: <欄>]                                        待ち行列。order の欄の値の高い順に並べる
 *   chain <名札> [edit: <欄>]                                         機械の列。edit の欄を読み手が書き換えられる
 *   ask <欄>, <欄> [into: <待ち行列>, via: <網>]                       入力の帯。図に 1 つまで。最初の欄の値がチップの名前
 *   press <名札> [from: <待ち行列>, into: <機械の列>, take: <数>, at: <部品>]   釦
 *   item <名札> [<欄>: <値>]                                          チップ。鍵は ask の欄 (最初の欄を除く)
 *
 * 段の中では `line <待ち行列か機械の列>: <チップ>, <チップ>` で中身を書き、`ask <値>, <値>` で送り、`press <釦>` で押し、
 * `item <チップ> [<欄>: <値>]` で書き換える。部品を名指す属性は全ての宣言を読んでから確かめ、誤りは名指した行に出す。
 * 段の中の出来事は段ごとの状態の手順 (`try-state.ts`) に 1 つずつ当て、空の待ち行列からの press と満杯の待ち行列への ask を断る。
 * 部品の行は試す図でだけ書け、試す図に箱と区画と線の行は書けない。
 *
 * 行の頭の語と同じ綴りの名札 (`end` や `step`) も書ける。名札の次に `->` が来る行は線と読む。
 * 誤りは最初の 1 つで止め、行と列を示す。誤りの文の言葉は呼ぶ側が渡す。
 */
import { type FigureDraft, type HeadReader, type ParseState, ranked, type StepDraft } from "./blocks/block";
import { EDGE, readEdgeLine, readLine } from "./blocks/edge/block";
import { BLOCKS } from "./blocks/index";
import { stepOf, viewOf } from "./blocks/step/block";
import { type Messages, messagesFor, type Shape } from "./messages";
import { type Attr, fail, ID, isOneOf, NotationError, readAttrs, readDeclared, readName, readQuoted, skipSpaces } from "./read-kit";
import {
  type Color,
  COLORS,
  type Diagram,
  type DiagramModel,
  type DiagramEvent,
  type GitBranch,
  type GitCommit,
  type LineupItem,
  type LineupRole,
  type StatePath,
  type Step,
  type TimePeriod,
  type TimePoint,
  type TimeRow,
  type TimeScale,
  type TryItem,
  type TryPart,
} from "./schema";
import { isBlankOrComment, type SourceLine, tokenize } from "./tokenize";
import { FORMAT_VERSION, fromModel, MODEL_VERSION } from "./model";
import { askFields, shortestPath, type TryFault, TryRun } from "./try-state";
import {
  AT,
  ATTRS,
  COPY,
  DEFAULT_LANG,
  FROM,
  HEAD,
  HEADS,
  KINDS,
  LABEL_MOST,
  LANE_MOST,
  LINEUP_HEADS,
  MERGE,
  type NotationLang,
  NOW,
  OF,
  OLD_HEADS,
  ON,
  SPAN_SHAPES,
  STATE_ENDS,
  TIME_EDGE_ATTRS,
  TIME_HEADS,
  TREE_HEADS,
  TRY_HEADS,
  TRY_SHARED_HEADS,
} from "./words";

export interface LineError {
  line: number;
  column: number;
  message: string;
}

export type Parsed = { ok: true; diagram: Diagram } | { ok: false; errors: LineError[] };

export interface ParseOptions {
  /** 誤りの文の言葉。既定は英語 (#3338) */
  lang?: NotationLang;
}

/** 枝分かれの図の `commit` の行。名札と、`on` の枝と、`copy` の当て直しの元と、`merge` の取り込む枝 */
const COMMIT = new RegExp(`^commit\\s+([^\\s[]+)(?:\\s+${ON}\\s+([^\\s[]+))?(?:\\s+${COPY}\\s+([^\\s[]+))?(?:\\s+${MERGE}\\s+([^\\s[]+))?`, "du");
/** 枝分かれの図の、枝を切る行。枝と `from` と切る commit */
const CUT = new RegExp(`^([^\\s[]+)\\s+${FROM}(?:\\s+([^\\s[]+))?\\s*$`, "du");
/** 木の図の `leaf` の行の名札と、`node` の行の名札と `of` */
const LEAF = /^leaf\s+([^\s[]+)/du;
const NODE = new RegExp(`^node\\s+([^\\s[]+)\\s+${OF}\\s+`, "du");
/** 列の図の、`line <列>:` と `stamp <列>:` の行の列と、`seal`、`open`、`pick` の行の列 */
const ORDER = /^line\s+([^\s:[]+)\s*:/du;
const STAMP = /^stamp\s+([^\s:[]+)\s*:/du;
const ON_LANE = /^(?:seal|open|pick)\s+(\S+)\s*$/du;
/** 試す図 (#3337) の `route <名札>:` の行と、段の中の `press <釦>` の行 */
const ROUTE = /^route\s+([^\s:[]+)\s*:/du;
const PUSH = /^press\s+(\S+)\s*$/du;
/** 試す図の `item <名札>` の行の名札 */
const TRY_ITEM = /^item\s+([^\s[]+)/du;
/** 試す図に書ける行の頭の語。部品の行とチップと並びの行と、段の行 */
const TRY_LINES: readonly string[] = [...TRY_HEADS, ...TRY_SHARED_HEADS, "step", "say", "code", "source"];
/** 段の中の `role <名札>` の行 (#3351) */
const ACT_ROLE = /^role\s+(\S+)\s*$/du;
/** commit の hash。原本の JSON の hash の形と同じ */
const HASH = /^[0-9a-f]{4,40}$/u;
/** 時間軸の図の宣言の行。`scale <単位> <長さ> <数>`、`period <名前> <数>`、`point <名札> at <目盛り>`、`zoom <範囲>` */
const SCALE = /^scale\s+(\S+)\s+(\S+)\s+([^\s[]+)/du;
const PERIOD = /^period\s+(\S+)\s+([^\s[]+)/du;
const POINT = new RegExp(`^point\\s+(\\S+)\\s+${AT}\\s+(\\S+)\\s*$`, "du");
const ZOOM = /^zoom\s+(\S+)\s*$/du;
/** 時間軸の図の段の中の行。`now -> <目盛り>`、`mark <列> <範囲>`、`span <範囲>:` */
const NEEDLE = new RegExp(`^${NOW}\\s*->`, "u");
const NOW_LINE = new RegExp(`^${NOW}\\s*->\\s*(\\S+)\\s*$`, "du");
const MARK = /^mark\s+([^\s[]+)\s+([^\s[]+)/du;
const SPAN = /^span\s+([^\s:[]+)\s*:/du;
/** 目盛りの長さ。原本の JSON の長さの形と同じ */
const LENGTH = /^[0-9]+(\.[0-9]+)?(ms|s|min|h|d)$/u;
/** 1 以上の整数と、0 以上の整数 */
const COUNT = /^[1-9][0-9]*$/u;
const NUMBER = /^(0|[1-9][0-9]*)$/u;
/** 目盛りの範囲。`0-31` か `0` */
const RANGE = /^(0|[1-9][0-9]*)(?:-(0|[1-9][0-9]*))?$/u;

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
 * ブロックが受け持つ行の頭の語と、その読む処理 (#3345)。
 * 行の頭の語の誤り (図の種類だけの語と、知らない語) を確かめた後に、ここに在る語はブロックの読む処理で読む
 */
const HEAD_READERS: ReadonlyMap<string, HeadReader> = new Map(ranked(BLOCKS).flatMap((block) => ("none" in block.read ? [] : Object.entries(block.read))));

/** 記法を読んで、描く処理の形 (版1と同じ欄と並び) に組む。原本 (版2) へは `parseNotation` が `fromModel` で移す (#3346) */
function parseLines(lines: SourceLine[], m: Messages): DiagramModel {
  const headAt = lines.findIndex((source) => !isBlankOrComment(source));
  const head = lines[headAt];
  if (!head) throw new NotationError(1, 1, m.noHead);
  const kind = head.text.split(/\s/u)[0] ?? "";
  if (!isOneOf(KINDS, kind)) {
    const old = oldForm(head.text, false);
    throw fail(head, 0, old ? m.oldForm(old.word, old.shape) : m.badHead);
  }
  const titled = readName(head, kind.length, m);
  if (titled.value === "") throw fail(head, 0, m.badHead);
  const title = titled.value;
  const view = viewOf(head, titled.rest < head.text.length ? readAttrs(head, titled.rest, ATTRS.diagram ?? [], m).get("view") : undefined, m);

  const isState = kind === "state";
  const isGit = kind === "git";
  const isTime = kind === "time";
  const isTree = kind === "tree";
  const isLineup = kind === "lineup";
  const isTry = kind === "try";
  /** 試す図 (#3337) の部品とチップ。部品を名指す属性と欄を名指す鍵は、全ての宣言を読んでから確かめる */
  const tryParts: TryPart[] = [];
  const tryItems: TryItem[] = [];
  const tryPending: (() => void)[] = [];
  /** 試す図の段の中の出来事を当てる状態。最初の step で作る */
  let run: TryRun | undefined;
  /** 列の図で宣言したチップと、今封をしている列 (#3239) */
  const items: LineupItem[] = [];
  const roles: LineupRole[] = [];
  const sealed = new Set<string>();
  /** 木の図で書いた木の箱と、書いた行と名札の位置。子の箱から親の名札 */
  const trees = new Map<string, { source: SourceLine; at: number }>();
  const parents = new Map<string, string>();
  /** 時間軸の図の目盛りと区切りと印の列と節目と拡大の範囲 (#3165) */
  let scale: TimeScale | undefined;
  let period: TimePeriod | undefined;
  const rows: TimeRow[] = [];
  const points: TimePoint[] = [];
  let zoom: { from: number; to: number } | undefined;
  /** 目盛りの数が決まってから確かめる、宣言の行の目盛り。最初の step で確かめる */
  const pending: (() => void)[] = [];
  let settled = false;
  /** 針が今いる目盛りの境 (0 から数える) */
  let needle = 0;
  const branches: GitBranch[] = [];
  /** 枝分かれの図で積んだ commit と、枝の札が今指す commit (まだ何も指さない枝は `null`) */
  const commits = new Set<string>();
  const tips = new Map<string, string | null>();
  const paths: StatePath[] = [];
  const ids = new Set<string>();
  /** 宣言の行でブロックが組む欄 (区画と箱と、中身の帯と、時間軸の図の物差しの欄) */
  const figure: FigureDraft = { regions: [], boxes: [], meters: [] };
  const { regions, boxes } = figure;
  const steps: Step[] = [];
  let building: StepDraft | undefined;

  const declare = (source: SourceLine, id: string, at: number): void => {
    if (ids.has(id)) throw fail(source, at, m.duplicate(id));
    ids.add(id);
  };
  const boxAt = (source: SourceLine, id: string, at: number): string => {
    if (!boxes.some((box) => box.id === id)) throw fail(source, at, m.undeclaredBox(id));
    return id;
  };
  const branchAt = (source: SourceLine, id: string, at: number): string => {
    if (!tips.has(id)) throw fail(source, at, m.undeclaredBranch(id));
    return id;
  };
  const commitAt = (source: SourceLine, id: string, at: number): string => {
    if (!commits.has(id)) throw fail(source, at, m.noCommit(id));
    return id;
  };
  /**
   * 線の端。状態遷移図では送る側に `start`、受ける側に `finish` を書ける。
   * 枝分かれの図では送る側が枝の名札か `HEAD`、受ける側が積んだ commit
   */
  const endAt = (source: SourceLine, id: string, at: number, side: "from" | "to"): string => {
    if (isGit) {
      if (side === "to") return commitAt(source, id, at);
      if (id !== HEAD && !tips.has(id)) throw fail(source, at, m.undeclaredRef(id));
      return id;
    }
    if (isTime) {
      if (!boxes.some((box) => box.id === id) && !points.some((point) => point.id === id)) throw fail(source, at, m.undeclaredNote(id));
      return id;
    }
    if (isTree && trees.has(id)) return id;
    if (!isState || !isOneOf(STATE_ENDS, id)) return boxAt(source, id, at);
    if ((id === "start") !== (side === "from")) throw fail(source, at, id === "start" ? m.intoStart : m.outOfFinish);
    return id;
  };
  /** 状態遷移図の箱と区画の名札に、始まりと終わりの印の名前は使えない。枝分かれの図の名札に、今いる場所の札の名前は使えない */
  const notReserved = (source: SourceLine, id: string, at: number): void => {
    if (isState && isOneOf(STATE_ENDS, id)) throw fail(source, at, m.reservedId(id));
    if (isGit && id === HEAD) throw fail(source, at, m.headReserved(id));
    if (isTime && id === NOW) throw fail(source, at, m.nowReserved(id));
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
  /** 宣言の行。最初の `step` より後なら誤り */
  const beforeSteps = (source: SourceLine): void => {
    if (building) throw fail(source, 0, m.declarationInStep);
  };
  /** 書いている段を閉じる。開いたままの区画と時間軸の図の宣言を確かめてから、段を段の並びへ足す */
  const closeStep = (): void => {
    if (figure.group) throw fail(figure.group.source, 0, m.unclosedGroup(figure.group.id));
    settle();
    settleTry();
    if (building) steps.push(stepOf(building, m));
  };
  const openStep = (draft: StepDraft): void => {
    building = draft;
    run?.beginStep();
  };
  /** ブロックの読む処理が受ける、読んでいる記法の状態 */
  const state: ParseState = { m, kind, attrs: ATTRS, inStep, closeStep, openStep, beforeSteps, boxAt, claim, endAt, columns: readColumns, figure };

  const rest = lines.slice(headAt + 1);
  for (let i = 0; i < rest.length; i++) {
    const source = rest[i];
    if (!source || isBlankOrComment(source)) continue;
    const text = source.text;
    // 時間軸の図の `now -> <目盛り>` は針を進める行で、線と同じ形でも箱どうしの線と読まない
    if (isTime && NEEDLE.test(text)) {
      inStep(source).events.push(readNow(source));
      continue;
    }
    // 名札の次に `->` が来る行は、名札が行の頭の語と同じ綴りでも線と読む
    const edge = EDGE.exec(text);
    if (edge) {
      if (isTry) throw fail(source, 0, m.tryNoEdge);
      // 状態遷移図の最初の step より前の線は、移れる道の地図
      if (isState && !building) paths.push(readPath(source, edge));
      else {
        const read = readEdgeLine(source, edge, state);
        // 枝分かれの図の線は、送る側の枝の札を受ける側の commit へ動かす
        if (isGit && read.from !== HEAD) tips.set(read.from, read.to);
      }
      continue;
    }
    const [word = "", second] = text.split(/\s+/u);
    // 枝分かれの図で、宣言した枝の名札の次に `from` が来る行は、枝を切る行
    if (isGit && tips.has(word) && second === FROM) {
      const step = inStep(source);
      step.events.push(readCut(source));
      continue;
    }
    if (!isGit && (word === "branch" || word === "commit")) throw fail(source, 0, m.gitOnly(word));
    if (!isTime && isOneOf(TIME_HEADS, word)) throw fail(source, 0, m.timeOnly(word));
    if (!isTree && isOneOf(TREE_HEADS, word)) throw fail(source, 0, m.treeOnly(word));
    if (!isTry && isOneOf(TRY_HEADS, word)) throw fail(source, 0, m.tryOnly(word));
    if (!isLineup && isOneOf(LINEUP_HEADS, word) && !(isTry && isOneOf(TRY_SHARED_HEADS, word)))
      throw fail(source, 0, isOneOf(TRY_SHARED_HEADS, word) ? m.lineupOrTryOnly(word) : m.lineupOnly(word));
    if (!isOneOf(HEADS, word)) {
      const old = oldForm(text, building !== undefined);
      throw fail(source, 0, old ? m.oldForm(old.word, old.shape) : m.unknownHead(word));
    }
    // 試す図は部品とチップと並びの行と段の行だけを書ける。部品とチップと並びの行は試す図の読み方で読む
    if (isTry && !TRY_LINES.includes(word)) throw fail(source, 0, m.tryNoLine(word));
    if (isTry && (isOneOf(TRY_HEADS, word) || isOneOf(TRY_SHARED_HEADS, word))) {
      readTry(source, word);
      continue;
    }
    // 時間軸の図の `note` の行は節目にも書けて丸の色を持つので、下の字のブロックでなく時間軸の図の読み方で読む
    if (isTime && word === "note") {
      inStep(source).events.push(readTimeNote(source));
      continue;
    }
    const reader = HEAD_READERS.get(word);
    if (reader) {
      // 下の行まで続けて読んだ処理は、読み終えた続きの行の数を返す
      const read = reader(source, state, (offset) => rest[i + offset]);
      if (typeof read === "number") i += read;
      continue;
    }
    switch (word) {
      case "branch":
        readBranch(source);
        break;
      case "commit": {
        const step = inStep(source);
        step.events.push(readCommit(source));
        break;
      }
      case "scale":
        readScale(source);
        break;
      case "period":
        readPeriod(source);
        break;
      case "row":
        readRow(source);
        break;
      case "point":
        readPoint(source);
        break;
      case "zoom":
        readZoom(source);
        break;
      case "mark":
        inStep(source).events.push(readMark(source));
        break;
      case "span":
        inStep(source).events.push(readSpan(source));
        break;
      case "leaf": {
        const step = inStep(source);
        step.events.push(readLeaf(source));
        break;
      }
      case "node": {
        const step = inStep(source);
        step.events.push(readNode(source));
        break;
      }
      case "item":
        readItem(source);
        break;
      case "role":
        readRole(source);
        break;
      case "line": {
        const step = inStep(source);
        step.events.push(readOrder(source));
        break;
      }
      case "seal":
      case "open":
      case "pick": {
        const step = inStep(source);
        step.events.push(readOnLane(source, word));
        break;
      }
      case "stamp": {
        const step = inStep(source);
        step.events.push(readStamp(source));
        break;
      }
    }
  }
  closeStep();

  if (isGit && branches.length === 0) throw fail(head, 0, m.noBranches);
  if (isTree && trees.size === 0) throw fail(head, 0, m.noLeaves);
  if (isLineup && items.length === 0) throw fail(head, 0, m.noItems);
  if (isTry && tryParts.length === 0) throw fail(head, 0, m.noParts);
  if (boxes.length === 0 && !isGit && !isTime && !isTree && !isTry) throw fail(head, 0, m.noBoxes);
  if (steps.length === 0) throw fail(head, 0, m.noSteps);
  // 木の形は全ての行を読んでから確かめる。親を持たない木の箱が 2 つ以上なら、書いた順で 2 つ目を示す
  const roots = [...trees.keys()].filter((id) => !parents.has(id));
  const [root, stray] = roots;
  const strayAt = stray === undefined ? undefined : trees.get(stray);
  if (root !== undefined && stray !== undefined && strayAt) throw fail(strayAt.source, strayAt.at, m.manyRoots(stray, root));

  return {
    version: MODEL_VERSION,
    kind,
    title,
    ...(view ? { view } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    boxes,
    ...(figure.strip ? { strip: figure.meters.length > 0 ? { ...figure.strip, meters: figure.meters } : figure.strip } : {}),
    steps,
    ...(paths.length > 0 ? { state: { paths } } : {}),
    ...(isGit ? { git: { branches } } : {}),
    ...(isLineup ? { lineup: { items, ...(roles.length > 0 ? { roles } : {}) } } : {}),
    ...(isTry ? { try: { parts: tryParts, items: tryItems } } : {}),
    ...(isTime && scale
      ? {
          time: {
            scale,
            ...(period ? { period } : {}),
            rows,
            ...(points.length > 0 ? { points } : {}),
            ...(zoom ? { zoom } : {}),
          },
        }
      : {}),
  };

  /**
   * 時間軸の図の宣言を、目盛りの数が決まってから確かめる。最初の step と記法の終わりで 1 度だけ呼ぶ。
   * 目盛りと印の列が無い図と、拡大の範囲の無い図の箱は誤り
   */
  function settle(): void {
    if (!isTime || settled) return;
    settled = true;
    if (!scale) throw fail(head as SourceLine, 0, m.noScale);
    if (rows.length === 0) throw fail(head as SourceLine, 0, m.noRows);
    for (const check of pending) check();
    if (figure.firstBox && !zoom) throw fail(figure.firstBox, 0, m.boxNeedsZoom);
  }

  /** 目盛りの数。目盛りを宣言する前は 0 */
  function countOf(): number {
    return scale?.count ?? 0;
  }

  /** `text` を目盛りの位置として読む。0 から目盛りの数より 1 小さい数まで */
  function unitAt(source: SourceLine, at: number, text: string): number {
    if (!NUMBER.test(text) || Number(text) >= countOf()) throw fail(source, at, m.badUnit(text, countOf()));
    return Number(text);
  }

  /** `text` を目盛りの範囲として読む。`0-31` か `0` */
  function rangeAt(source: SourceLine, at: number, text: string): { from: number; to: number } {
    const found = RANGE.exec(text);
    const from = Number(found?.[1]);
    const to = Number(found?.[2] ?? found?.[1]);
    if (!found || from > to || to >= countOf()) throw fail(source, at, m.badUnit(text, countOf()));
    return { from, to };
  }

  /** `scale <単位> <長さ> <数> [from: <最初の番号>]` の行 */
  function readScale(source: SourceLine): void {
    beforeSteps(source);
    if (scale) throw fail(source, 0, m.timeTwice("scale"));
    const text = source.text;
    const found = SCALE.exec(text);
    const at = (k: number): number => found?.indices?.[k]?.[0] ?? 0;
    if (!found) throw fail(source, 0, m.scaleShape);
    const rest = skipSpaces(text, found[0].length);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.scaleShape);
    const length = found[2] ?? "";
    if (!LENGTH.test(length)) throw fail(source, at(2), m.badLength);
    const count = found[3] ?? "";
    if (!COUNT.test(count)) throw fail(source, at(3), m.badCount("scale"));
    const first = rest < text.length ? readAttrs(source, rest, ATTRS.scale, m).get("from") : undefined;
    if (first && !NUMBER.test(first.value)) throw fail(source, first.at, m.scaleShape);
    scale = { unit: found[1] ?? "", length, count: Number(count), ...(first ? { from: Number(first.value) } : {}) };
  }

  /** `period <名前> <目盛りの数> [from: <最初の番号>]` の行 */
  function readPeriod(source: SourceLine): void {
    beforeSteps(source);
    if (period) throw fail(source, 0, m.timeTwice("period"));
    const text = source.text;
    const found = PERIOD.exec(text);
    if (!found) throw fail(source, 0, m.periodShape);
    const rest = skipSpaces(text, found[0].length);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.periodShape);
    const length = found[2] ?? "";
    if (!COUNT.test(length)) throw fail(source, found.indices?.[2]?.[0] ?? 0, m.badCount("period"));
    const first = rest < text.length ? readAttrs(source, rest, ATTRS.period, m).get("from") : undefined;
    if (first && !NUMBER.test(first.value)) throw fail(source, first.at, m.periodShape);
    period = { name: found[1] ?? "", length: Number(length), ...(first ? { from: Number(first.value) } : {}) };
  }

  /** `row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>]` の行。箱と同じ名札を持てる */
  function readRow(source: SourceLine): void {
    beforeSteps(source);
    const declared = readDeclared(source, "row", ATTRS.row, m);
    notReserved(source, declared.id, declared.idAt);
    if (rows.some((row) => row.id === declared.id) || points.some((point) => point.id === declared.id)) throw fail(source, declared.idAt, m.duplicate(declared.id));
    const color = declared.attrs.get("color");
    if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
    const empty = declared.attrs.get("empty");
    const row: TimeRow = { id: declared.id, name: declared.name ?? declared.id, ...(color ? { color: color.value as Color } : {}) };
    rows.push(row);
    if (empty) {
      const words = empty.value.split(/\s+/u);
      // 目盛りの数が決まってから確かめる。欄の並びを宣言の形で残すため、先に空の並びを置く
      row.empty = [];
      pending.push(() => {
        row.empty = words.map((word) => unitAt(source, empty.at, word));
      });
    }
  }

  /** `point <名札> at <目盛り>` の行。箱と印の列と同じ名札は持てない */
  function readPoint(source: SourceLine): void {
    beforeSteps(source);
    const found = POINT.exec(source.text);
    const id = found?.[1];
    const unit = found?.[2];
    if (!found || id === undefined || unit === undefined) throw fail(source, 0, m.pointShape);
    const idAt = found.indices?.[1]?.[0] ?? 0;
    const unitStart = found.indices?.[2]?.[0] ?? 0;
    if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
    notReserved(source, id, idAt);
    if (rows.some((row) => row.id === id)) throw fail(source, idAt, m.duplicate(id));
    declare(source, id, idAt);
    const point: TimePoint = { id, at: 0 };
    points.push(point);
    pending.push(() => {
      point.at = unitAt(source, unitStart, unit);
    });
  }

  /** `zoom <目盛り>-<目盛り>` の行 */
  function readZoom(source: SourceLine): void {
    beforeSteps(source);
    if (zoom) throw fail(source, 0, m.timeTwice("zoom"));
    const found = ZOOM.exec(source.text);
    const range = found?.[1];
    if (!found || range === undefined) throw fail(source, 0, m.zoomShape);
    const rangeStart = found.indices?.[1]?.[0] ?? 0;
    const placed = { from: 0, to: 0 };
    zoom = placed;
    pending.push(() => {
      Object.assign(placed, rangeAt(source, rangeStart, range));
    });
  }

  /** `now -> <目盛り>` の行。針をその目盛りの終わりまで進める。前の針より後の目盛りに限る */
  function readNow(source: SourceLine): DiagramEvent {
    const found = NOW_LINE.exec(source.text);
    const unit = found?.[1];
    if (!found || unit === undefined) throw fail(source, 0, m.nowShape);
    const at = found.indices?.[1]?.[0] ?? 0;
    const to = unitAt(source, at, unit);
    if (to + 1 <= needle) throw fail(source, at, m.nowBack(unit, needle - 1));
    needle = to + 1;
    return { type: "now", to };
  }

  /** `mark <列> <範囲> [color: <色>]` の行 */
  function readMark(source: SourceLine): DiagramEvent {
    const text = source.text;
    const found = MARK.exec(text);
    const row = found?.[1];
    const range = found?.[2];
    if (!found || row === undefined || range === undefined) throw fail(source, 0, m.markShape);
    if (!rows.some((r) => r.id === row)) throw fail(source, found.indices?.[1]?.[0] ?? 0, m.undeclaredRow(row));
    const { from, to } = rangeAt(source, found.indices?.[2]?.[0] ?? 0, range);
    const rest = skipSpaces(text, found[0].length);
    if (rest >= text.length || text[rest] !== "[") throw fail(source, rest, m.markShape);
    const color = readAttrs(source, rest, ATTRS.mark, m).get("color");
    if (!color) throw fail(source, rest, m.markShape);
    if (!isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
    return { type: "mark", row, from, to, color: color.value };
  }

  /** `span <範囲>: <字> [shape: box, color: <色>]` の行 */
  function readSpan(source: SourceLine): DiagramEvent {
    const found = SPAN.exec(source.text);
    const range = found?.[1];
    if (!found || range === undefined) throw fail(source, 0, m.spanShape);
    const { from, to } = rangeAt(source, found.indices?.[1]?.[0] ?? 0, range);
    const named = readName(source, found[0].length, m);
    if (named.value === "") throw fail(source, 0, m.spanShape);
    const attrs = named.rest < source.text.length ? readAttrs(source, named.rest, ATTRS.span, m) : new Map<string, Attr>();
    const shape = attrs.get("shape");
    if (shape && !isOneOf(SPAN_SHAPES, shape.value)) throw fail(source, shape.at, m.badShape);
    const color = attrs.get("color");
    if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
    return { type: "span", from, to, text: named.value, ...(shape ? { shape: "box" as const } : {}), ...(color ? { color: color.value as Color } : {}) };
  }

  /** 時間軸の図の `note <箱か節目>: <字> [color: <色>]` の行。色は節目の丸の色 */
  function readTimeNote(source: SourceLine): DiagramEvent {
    const found = /^note\s+([^\s:]+)\s*:/du.exec(source.text);
    const id = found?.[1];
    if (!found || id === undefined) throw fail(source, 0, m.noteShape);
    const idAt = found.indices?.[1]?.[0] ?? 0;
    const isPoint = points.some((point) => point.id === id);
    if (!isPoint && !boxes.some((box) => box.id === id)) throw fail(source, idAt, m.undeclaredNote(id));
    const named = readName(source, found[0].length, m);
    if (named.value === "") throw fail(source, 0, m.noteShape);
    const color = named.rest < source.text.length ? readAttrs(source, named.rest, ATTRS.note, m).get("color") : undefined;
    if (color && !isPoint) throw fail(source, color.at, m.noteColorPointOnly);
    if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
    return { type: "swap", box: id, text: named.value, ...(color ? { color: color.value as Color } : {}) };
  }

  /** 枝分かれの図の `branch <名札> [note: <添え書き>]` の行。枝は宣言した順に上から帯に並ぶ */
  function readBranch(source: SourceLine): void {
    beforeSteps(source);
    const declared = readDeclared(source, "branch", ATTRS.branch, m);
    if (declared.name !== undefined) throw fail(source, 0, m.branchShape);
    notReserved(source, declared.id, declared.idAt);
    declare(source, declared.id, declared.idAt);
    const note = declared.attrs.get("note")?.value;
    branches.push({ id: declared.id, ...(note !== undefined ? { note } : {}) });
    tips.set(declared.id, null);
  }

  /**
   * 枝分かれの図の `commit <名札> on <枝> [copy <commit>] [merge <枝>] [hash: <hash>, note: <一言>]` の行。
   * 積んだ枝の札は新しい commit へ進む。当て直しは枝の札を動かさない
   */
  function readCommit(source: SourceLine): GitCommit {
    const text = source.text;
    const found = COMMIT.exec(text);
    const at = (k: number): number => found?.indices?.[k]?.[0] ?? 0;
    const id = found?.[1];
    const on = found?.[2];
    if (!found || id === undefined || on === undefined) throw fail(source, 0, m.commitShape);
    const rest = skipSpaces(text, found[0].length);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.commitShape);
    if (!ID.test(id)) throw fail(source, at(1), m.badId(id));
    notReserved(source, id, at(1));
    declare(source, id, at(1));
    const branch = branchAt(source, on, at(2));
    const copy = found[3] === undefined ? undefined : commitAt(source, found[3], at(3));
    const merge = found[4] === undefined ? undefined : mergedAt(source, found[4], at(4), branch);
    const attrs = rest < text.length ? readAttrs(source, rest, ATTRS.commit, m) : new Map<string, Attr>();
    const hash = attrs.get("hash");
    if (hash && !HASH.test(hash.value)) throw fail(source, hash.at, m.badHash);
    const note = attrs.get("note")?.value;
    commits.add(id);
    if (copy === undefined) tips.set(branch, id);
    return {
      type: "commit",
      id,
      branch,
      ...(copy !== undefined ? { copy } : {}),
      ...(merge !== undefined ? { merge } : {}),
      ...(hash ? { hash: hash.value } : {}),
      ...(note !== undefined ? { note } : {}),
    };
  }

  /** merge commit が取り込む枝。積む枝と別の、もう commit を指している枝 */
  function mergedAt(source: SourceLine, id: string, at: number, into: string): string {
    branchAt(source, id, at);
    if (id === into) throw fail(source, at, m.mergeSelf(id));
    if (tips.get(id) === null) throw fail(source, at, m.emptyBranch(id));
    return id;
  }

  /** 枝分かれの図の `<枝> from <commit>` の行。枝の札を commit へ置く */
  function readCut(source: SourceLine): DiagramEvent {
    const found = CUT.exec(source.text);
    const branch = found?.[1];
    const from = found?.[2];
    if (!found || branch === undefined || from === undefined) throw fail(source, 0, m.fromShape);
    commitAt(source, from, found.indices?.[2]?.[0] ?? 0);
    tips.set(branch, from);
    return { type: "branch", branch, from };
  }

  /** 木の図の `leaf <名札> [hash: <hash>]` の行 */
  function readLeaf(source: SourceLine): DiagramEvent {
    const text = source.text;
    const found = LEAF.exec(text);
    const id = found?.[1];
    if (!found || id === undefined) throw fail(source, 0, m.leafShape);
    const idAt = found.indices?.[1]?.[0] ?? 0;
    if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
    declare(source, id, idAt);
    trees.set(id, { source, at: idAt });
    const rest = skipSpaces(text, found[0].length);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.leafShape);
    const hash = treeHash(source, rest, ATTRS.leaf);
    return { type: "leaf", id, ...(hash !== undefined ? { hash } : {}) };
  }

  /**
   * 木の図の `node <名札> of <子>, <子> [hash: <hash>]` の行。子は前に書いた葉か親で、まだ親を持たない箱に限る。
   * 子は `,` で区切り、`[` か行の終わりで終わる
   */
  function readNode(source: SourceLine): DiagramEvent {
    const text = source.text;
    const found = NODE.exec(text);
    const id = found?.[1];
    if (!found || id === undefined) throw fail(source, 0, m.nodeShape);
    const idAt = found.indices?.[1]?.[0] ?? 0;
    if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
    declare(source, id, idAt);
    const children: string[] = [];
    let end = found[0].length;
    for (;;) {
      const start = skipSpaces(text, end);
      end = start;
      while (end < text.length && text[end] !== "," && text[end] !== "[") end++;
      const child = text.slice(start, end).trim();
      if (child === "" || !ID.test(child)) throw fail(source, start, m.nodeShape);
      if (!trees.has(child)) throw fail(source, start, ids.has(child) && child !== id ? m.notTreeBox(child) : m.noTreeChild(child));
      if (parents.has(child)) throw fail(source, start, m.twoParents(child));
      parents.set(child, id);
      children.push(child);
      if (text[end] !== ",") break;
      end++;
    }
    const hash = treeHash(source, end, ATTRS.node);
    trees.set(id, { source, at: idAt });
    return { type: "node", id, children, ...(hash !== undefined ? { hash } : {}) };
  }

  /** 葉と親の行の名札の後ろの `[hash: <hash>]`。`at` は `[` か行の終わり */
  function treeHash(source: SourceLine, at: number, keys: readonly string[]): string | undefined {
    if (at >= source.text.length) return undefined;
    const hash = readAttrs(source, at, keys, m).get("hash");
    if (hash && !HASH.test(hash.value)) throw fail(source, hash.at, m.badHash);
    return hash?.value;
  }

  /** `from` から `to` の前までの、`,` で区切った名札と、それぞれの位置 */
  function namesAt(source: SourceLine, from: number, to: number, shape: string): { value: string; at: number }[] {
    const text = source.text;
    const names: { value: string; at: number }[] = [];
    for (let i = from; ; ) {
      const start = skipSpaces(text, i);
      const comma = text.indexOf(",", start);
      const end = comma < 0 || comma > to ? to : comma;
      const value = text.slice(start, end).trim();
      if (value === "") throw fail(source, start, shape);
      if (!ID.test(value)) throw fail(source, start, m.badId(value));
      names.push({ value, at: start });
      if (end >= to) return names;
      i = end + 1;
    }
  }

  /** 列の図の `item <名札>, <名札> [color: <色>, label: <字>]` の行。並べた名札ごとに、同じ色と字のチップを宣言する */
  function readItem(source: SourceLine): void {
    beforeSteps(source);
    const open = source.text.indexOf("[");
    const end = open < 0 ? source.text.length : open;
    const attrs = open < 0 ? new Map<string, Attr>() : readAttrs(source, open, ATTRS.item, m);
    const color = attrs.get("color");
    if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
    const label = attrs.get("label");
    if (label && [...label.value].length > LABEL_MOST) throw fail(source, label.at, m.labelTooLong(LABEL_MOST));
    const note = attrs.get("note")?.value;
    for (const { value, at } of namesAt(source, "item".length, end, m.itemShape)) {
      declare(source, value, at);
      items.push({ id: value, ...(color ? { color: color.value as Color } : {}), ...(label ? { label: label.value } : {}), ...(note !== undefined ? { note } : {}) });
    }
  }

  /**
   * 列の図の `role` の行 (#3351)。最初の `step` より前なら `role <名札> [note: <一言>]` で役を宣言し、
   * 段の中なら `role <名札>` でその段で動く役を名指す。段の中で名指す役は宣言した役だけ
   */
  function readRole(source: SourceLine): void {
    if (!building) {
      const declared = readDeclared(source, "role", ATTRS.role, m);
      if (declared.name !== undefined) throw fail(source, 0, m.roleShape);
      declare(source, declared.id, declared.idAt);
      const note = declared.attrs.get("note")?.value;
      roles.push({ id: declared.id, ...(note !== undefined ? { note } : {}) });
      return;
    }
    const found = ACT_ROLE.exec(source.text);
    const id = found?.[1];
    if (!found || id === undefined) throw fail(source, 0, m.roleShape);
    const at = found.indices?.[1]?.[0] ?? 0;
    if (!roles.some((role) => role.id === id)) throw fail(source, at, m.unknownRole(id));
    building.events.push({ type: "role", role: id });
  }

  /** 列の図の `line <列>: <チップ>, <チップ>` の行。チップは宣言したチップで、列に 1 枚ずつ、上限まで。封をした列には書けない */
  function readOrder(source: SourceLine): DiagramEvent {
    const found = ORDER.exec(source.text);
    const lane = found?.[1];
    if (!found || lane === undefined) throw fail(source, 0, m.lineShape);
    const at = found.indices?.[1]?.[0] ?? 0;
    const box = boxAt(source, lane, at);
    if (sealed.has(box)) throw fail(source, at, m.lineOnSealed(box));
    const chips = namesAt(source, found[0].length, source.text.length, m.lineShape);
    const seen = new Set<string>();
    chips.forEach(({ value, at: chipAt }, k) => {
      if (!items.some((item) => item.id === value)) throw fail(source, chipAt, m.noSuchItem(value));
      if (seen.has(value)) throw fail(source, chipAt, m.itemTwice(value));
      if (k >= LANE_MOST) throw fail(source, chipAt, m.laneFull(box, LANE_MOST));
      seen.add(value);
    });
    return { type: "line", box, items: chips.map((chip) => chip.value) };
  }

  /** 列の図の `seal <列>`、`open <列>`、`pick <列>` の行。封は 1 列に 1 つで、封をした列だけを開けられる */
  function readOnLane(source: SourceLine, word: "seal" | "open" | "pick"): DiagramEvent {
    const found = ON_LANE.exec(source.text);
    const lane = found?.[1];
    if (!found || lane === undefined) throw fail(source, 0, m.laneShape(word));
    const at = found.indices?.[1]?.[0] ?? 0;
    const box = boxAt(source, lane, at);
    if (word === "seal") {
      if (sealed.has(box)) throw fail(source, at, m.sealTwice(box));
      sealed.add(box);
    }
    if (word === "open" && !sealed.delete(box)) throw fail(source, at, m.openUnsealed(box));
    return { type: word, box };
  }

  /** 列の図の `stamp <列>: <字>` の行 */
  function readStamp(source: SourceLine): DiagramEvent {
    const found = STAMP.exec(source.text);
    const lane = found?.[1];
    if (!found || lane === undefined) throw fail(source, 0, m.stampShape);
    const box = boxAt(source, lane, found.indices?.[1]?.[0] ?? 0);
    const named = readName(source, found[0].length, m);
    if (named.value === "" || named.rest < source.text.length) throw fail(source, 0, m.stampShape);
    return { type: "stamp", box, text: named.value };
  }

  /** 試す図の宣言を、全ての宣言を読んでから確かめる。最初の step と記法の終わりで 1 度だけ呼び、段の中の出来事を当てる状態を作る */
  function settleTry(): void {
    if (!isTry || run) return;
    for (const check of tryPending) check();
    run = new TryRun({ parts: tryParts, items: tryItems });
  }

  /** 試す図の部品とチップと並びの行。部品の行は最初の step より前にだけ書け、ask と press と item は段の中では出来事になる */
  function readTry(source: SourceLine, word: string): void {
    const inside = building !== undefined;
    if (inside && (word === "route" || word === "queue" || word === "chain")) throw fail(source, 0, m.tryPartInStep(word));
    switch (word) {
      case "route":
        return readRoute(source);
      case "queue":
      case "chain":
        return readStore(source, word);
      case "ask":
        return inside ? readSend(source) : readAsk(source);
      case "press":
        return inside ? readPush(source) : readPress(source);
      case "item":
        return inside ? readEdit(source) : readTryItem(source);
      case "line":
        return readTryLine(source);
    }
  }

  /** 属性 `attr` の値の位置。値が見つからなければ鍵の位置 */
  function valueAt(source: SourceLine, attr: Attr): number {
    const at = source.text.indexOf(attr.value, attr.at);
    return at < 0 ? attr.at : at;
  }

  /** 属性 `attr` が名指す部品が、種類 `want` のどれかの部品か。全ての宣言を読んでから確かめる */
  function refer(source: SourceLine, attr: Attr, want: readonly TryPart["type"][]): void {
    tryPending.push(() => {
      const part = tryParts.find((p) => p.id === attr.value);
      if (!part) throw fail(source, valueAt(source, attr), m.undeclaredPart(attr.value));
      if (!want.includes(part.type)) throw fail(source, valueAt(source, attr), m.wrongPart(attr.value, want));
    });
  }

  /** `field` が入力の帯の欄 (最初の欄を除く) か。`at` は誤りを出す位置 */
  function fieldAt(source: SourceLine, field: string, at: number): void {
    const fields = askFields(tryParts).slice(1);
    if (fields.length === 0) throw fail(source, at, m.noAsk);
    if (!fields.includes(field)) throw fail(source, at, m.notAskField(field, fields));
  }

  /** 部品の行に要る属性。無ければ行の終わりか属性の `[` を示して断る */
  function needed(source: SourceLine, attrs: Map<string, Attr>, word: string, key: string, at: number): Attr {
    const attr = attrs.get(key);
    if (!attr) throw fail(source, at, m.needsAttr(word, key));
    return attr;
  }

  /** `route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>]` の行。from と to は網の節で、from から to へ道が要る */
  function readRoute(source: SourceLine): void {
    const text = source.text;
    const found = ROUTE.exec(text);
    const id = found?.[1];
    if (!found || id === undefined) throw fail(source, 0, m.routeShape);
    const idAt = found.indices?.[1]?.[0] ?? 0;
    if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
    declare(source, id, idAt);
    const open = text.indexOf("[", found[0].length);
    const end = open < 0 ? text.length : open;
    const paths: string[][] = [];
    for (let i = found[0].length; i <= end; ) {
      const comma = text.indexOf(",", i);
      const stop = comma < 0 || comma > end ? end : comma;
      const start = skipSpaces(text, i);
      const nodes = text.slice(start, stop).trim().split(/\s+-\s+/u);
      if (nodes.length < 2 || nodes.some((node) => node === "")) throw fail(source, start, m.routeShape);
      for (const node of nodes) if (!ID.test(node)) throw fail(source, start, m.badId(node));
      paths.push(nodes);
      i = stop + 1;
    }
    if (open < 0) throw fail(source, text.length, m.needsAttr("route", "from"));
    const attrs = readAttrs(source, open, ATTRS.route, m);
    const from = needed(source, attrs, "route", "from", open);
    const to = needed(source, attrs, "route", "to", open);
    const known = new Set(paths.flat());
    for (const side of [from, to]) if (!known.has(side.value)) throw fail(source, valueAt(source, side), m.notInRoute(side.value, id));
    const route: TryPart = { type: "route", id, paths, from: from.value, to: to.value };
    if (shortestPath(route).length < 2) throw fail(source, valueAt(source, to), m.noPath(from.value, to.value));
    tryParts.push(route);
  }

  /** `queue <名札> [order: <欄>]` と `chain <名札> [edit: <欄>]` の行。欄は入力の帯の欄 (最初の欄を除く) */
  function readStore(source: SourceLine, word: "queue" | "chain"): void {
    const declared = readDeclared(source, word, ATTRS[word], m);
    if (declared.name !== undefined) throw fail(source, 0, word === "queue" ? m.queueShape : m.chainShape);
    declare(source, declared.id, declared.idAt);
    const key = word === "queue" ? "order" : "edit";
    const field = declared.attrs.get(key);
    if (field) tryPending.push(() => fieldAt(source, field.value, valueAt(source, field)));
    if (word === "queue") tryParts.push({ type: "queue", id: declared.id, ...(field ? { order: field.value } : {}) });
    else tryParts.push({ type: "chain", id: declared.id, ...(field ? { edit: field.value } : {}) });
  }

  /** 最初の step より前の `ask <欄>, <欄> [into: <待ち行列>, via: <網>]` の行。図に 1 つまでで、欄は 2 つ以上 */
  function readAsk(source: SourceLine): void {
    if (tryParts.some((p) => p.type === "ask")) throw fail(source, 0, m.askTwice);
    const text = source.text;
    const open = text.indexOf("[");
    const fields = namesAt(source, "ask".length, open < 0 ? text.length : open, m.askShape);
    if (fields.length < 2) throw fail(source, fields[0]?.at ?? 0, m.fewFields);
    fields.forEach(({ value, at }, k) => {
      if (fields.findIndex((f) => f.value === value) < k) throw fail(source, at, m.fieldTwice(value));
    });
    declare(source, "ask", 0);
    if (open < 0) throw fail(source, text.length, m.needsAttr("ask", "into"));
    const attrs = readAttrs(source, open, ATTRS.ask, m);
    const into = needed(source, attrs, "ask", "into", open);
    refer(source, into, ["queue"]);
    const via = attrs.get("via");
    if (via) refer(source, via, ["route"]);
    tryParts.push({ type: "ask", id: "ask", fields: fields.map((f) => f.value), into: into.value, ...(via ? { via: via.value } : {}) });
  }

  /** 最初の step より前の `press <名札> [from: <待ち行列>, into: <機械の列>, take: <数>, at: <部品>]` の行 */
  function readPress(source: SourceLine): void {
    const declared = readDeclared(source, "press", ATTRS.press, m);
    if (declared.name !== undefined) throw fail(source, 0, m.pressShape);
    declare(source, declared.id, declared.idAt);
    const { attrs } = declared;
    const rest = source.text.indexOf("[");
    const at = rest < 0 ? source.text.length : rest;
    const from = needed(source, attrs, "press", "from", at);
    const into = needed(source, attrs, "press", "into", at);
    const take = needed(source, attrs, "press", "take", at);
    if (!COUNT.test(take.value)) throw fail(source, valueAt(source, take), m.badTake);
    refer(source, from, ["queue"]);
    refer(source, into, ["chain"]);
    const place = attrs.get("at");
    if (place) {
      refer(source, place, ["route", "queue", "chain", "ask"]);
      if (place.value === declared.id) throw fail(source, valueAt(source, place), m.pressAt(place.value));
    }
    tryParts.push({ type: "press", id: declared.id, from: from.value, into: into.value, take: Number(take.value), ...(place ? { at: place.value } : {}) });
  }

  /** 最初の step より前の `item <名札> [<欄>: <値>]` の行。鍵は入力の帯の欄 (最初の欄を除く) で、全ての宣言を読んでから確かめる */
  function readTryItem(source: SourceLine): void {
    const { id, idAt, attrs } = chipLine(source, false);
    declare(source, id, idAt);
    const values: Record<string, string> = {};
    for (const [key, attr] of attrs) {
      values[key] = attr.value;
      tryPending.push(() => fieldAt(source, key, attr.at));
    }
    tryItems.push({ id, values });
  }

  /** `item` の行のチップの名札と属性。段の中の行は属性を 1 つ以上持つ */
  function chipLine(source: SourceLine, inside: boolean): { id: string; idAt: number; attrs: Map<string, Attr> } {
    const text = source.text;
    const found = TRY_ITEM.exec(text);
    const id = found?.[1];
    if (!found || id === undefined || id.includes(",")) throw fail(source, 0, m.tryItemShape);
    const idAt = found.indices?.[1]?.[0] ?? 0;
    if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
    const rest = skipSpaces(text, found[0].length);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.tryItemShape);
    if (inside && rest >= text.length) throw fail(source, text.length, m.tryItemShape);
    return { id, idAt, attrs: rest < text.length ? readAttrs(source, rest, undefined, m) : new Map<string, Attr>() };
  }

  /** 段の中の出来事を当てられなかった訳を、行の誤りにする。`chips` は `line` の行のチップの位置 */
  function faultOf(source: SourceLine, fault: TryFault, chips: { at: number }[] = [], press = ""): NotationError {
    switch (fault.kind) {
      case "noChip":
        return fail(source, chips[fault.index]?.at ?? 0, m.noSuchItem(fault.item));
      case "twice":
        return fail(source, chips[fault.index]?.at ?? 0, m.itemTwice(fault.item));
      case "elsewhere":
        return fail(source, chips[fault.index]?.at ?? 0, m.chipElsewhere(fault.item, fault.part));
      case "full":
        return fail(source, 0, m.queueFull(fault.part, fault.most));
      case "blockFull":
        return fail(source, 0, m.blockFull(fault.part, fault.most));
      case "empty":
        return fail(source, 0, m.queueEmpty(fault.part, press));
      case "count":
        return fail(source, 0, m.askCount(fault.want));
      case "part":
        return fail(source, 0, m.undeclaredPart(fault.part));
    }
  }

  /** 段の中の `line <待ち行列か機械の列>: <チップ>, <チップ>` の行 */
  function readTryLine(source: SourceLine): void {
    const step = inStep(source);
    const found = ORDER.exec(source.text);
    const part = found?.[1];
    if (!found || part === undefined) throw fail(source, 0, m.tryLineShape);
    const partAt = found.indices?.[1]?.[0] ?? 0;
    const declared = tryParts.find((p) => p.id === part);
    if (!declared) throw fail(source, partAt, m.undeclaredPart(part));
    if (declared.type !== "queue" && declared.type !== "chain") throw fail(source, partAt, m.wrongPart(part, ["queue", "chain"]));
    const chips = namesAt(source, found[0].length, source.text.length, m.tryLineShape);
    const items = chips.map((chip) => chip.value);
    const fault = run?.line(part, items).fault;
    if (fault) throw faultOf(source, fault, chips);
    step.events.push({ type: "line", part, items });
  }

  /** 段の中の `ask <値>, <値>` の行。値の数は入力の帯の欄の数と同じで、満杯の待ち行列へは送れない */
  function readSend(source: SourceLine): void {
    const step = inStep(source);
    const ask = tryParts.find((p) => p.type === "ask");
    if (!ask) throw fail(source, 0, m.noAsk);
    const values = valuesOf(source, "ask".length);
    if (values.length !== ask.fields.length) throw fail(source, 0, m.askCount(ask.fields.length));
    const fault = run?.ask(values).fault;
    if (fault) throw faultOf(source, fault);
    step.events.push({ type: "ask", values });
  }

  /** 段の中の `press <釦>` の行。空の待ち行列から取り出す釦は押せない */
  function readPush(source: SourceLine): void {
    const step = inStep(source);
    const found = PUSH.exec(source.text);
    const id = found?.[1];
    if (!found || id === undefined) throw fail(source, 0, m.pressShape);
    const at = found.indices?.[1]?.[0] ?? 0;
    const declared = tryParts.find((p) => p.id === id);
    if (!declared) throw fail(source, at, m.undeclaredPart(id));
    if (declared.type !== "press") throw fail(source, at, m.wrongPart(id, ["press"]));
    const fault = run?.press(id).fault;
    if (fault) throw faultOf(source, fault, [], id);
    step.events.push({ type: "press", press: id });
  }

  /** 段の中の `item <チップ> [<欄>: <値>]` の行。チップの欄の値を書き換える */
  function readEdit(source: SourceLine): void {
    const step = inStep(source);
    const { id, idAt, attrs } = chipLine(source, true);
    const values: Record<string, string> = {};
    for (const [key, attr] of attrs) {
      fieldAt(source, key, attr.at);
      values[key] = attr.value;
    }
    if (!run?.has(id)) throw fail(source, idAt, m.noSuchItem(id));
    run.edit(id, values);
    step.events.push({ type: "item", item: id, values });
  }

  /** `from` から行の終わりまでの、`,` で区切った値。値は `"` で囲める */
  function valuesOf(source: SourceLine, from: number): string[] {
    const text = source.text;
    const values: string[] = [];
    for (let i = from; ; ) {
      const start = skipSpaces(text, i);
      let value: string;
      let end: number;
      if (text[start] === '"') {
        const quoted = readQuoted(source, start, m);
        value = quoted.value;
        end = skipSpaces(text, quoted.end);
        if (end < text.length && text[end] !== ",") throw fail(source, end, m.afterQuote);
      } else {
        const comma = text.indexOf(",", start);
        end = comma < 0 ? text.length : comma;
        value = text.slice(start, end).trim();
      }
      if (value === "") throw fail(source, start, m.askShape);
      values.push(value);
      if (end >= text.length) return values;
      i = end + 1;
    }
  }

  /** 状態遷移図の最初の `step` より前の `<名札> -> <名札>: <線の名前>` の行。属性は書けない */
  function readPath(source: SourceLine, edge: RegExpExecArray): StatePath {
    const { from, to, label, at } = readLine(source, edge, state);
    if (at < source.text.length) throw fail(source, at, source.text[at] === "[" ? m.pathNoAttrs : m.edgeShape);
    return { from, to, ...(label !== undefined ? { label } : {}) };
  }

  /**
   * 線の列 (`at` と `into`)。時間軸の図の箱どうしの線は `at` で拡大の帯の列を選び、節目どうしの線は列を持たない。
   * ほかの図の種類には書けない
   */
  function readColumns(source: SourceLine, from: string, to: string, attrs: Map<string, Attr>, end: number): { at?: number; into?: number } {
    const given = TIME_EDGE_ATTRS.flatMap((key) => {
      const attr = attrs.get(key);
      return attr ? [{ key, attr }] : [];
    });
    const first = given[0];
    if (!isTime) {
      if (first) throw fail(source, first.attr.at, m.timeOnly(first.key));
      return {};
    }
    const isBox = (id: string): boolean => boxes.some((box) => box.id === id);
    if (isBox(from) !== isBox(to)) throw fail(source, 0, m.mixedLine);
    if (!isBox(from)) {
      if (first) throw fail(source, first.attr.at, zoom ? m.pointLineNoAt : m.noZoom);
      return {};
    }
    const column = (attr: Attr | undefined): number | undefined => {
      if (!attr) return undefined;
      const unit = unitAt(source, attr.at, attr.value);
      if (!zoom || unit < zoom.from || unit > zoom.to) throw fail(source, attr.at, zoom ? m.outOfZoom(zoom.from, zoom.to) : m.noZoom);
      return unit;
    };
    const at = column(attrs.get("at"));
    if (at === undefined) throw fail(source, end, m.boxLineNeedsAt);
    const into = column(attrs.get("into"));
    return { at, ...(into !== undefined ? { into } : {}) };
  }
}

export function parseNotation(notation: string, options: ParseOptions = {}): Parsed {
  try {
    return { ok: true, diagram: fromModel(parseLines(tokenize(notation), messagesFor(options.lang ?? DEFAULT_LANG)), FORMAT_VERSION) };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
