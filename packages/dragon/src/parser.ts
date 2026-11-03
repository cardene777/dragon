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
 * `item`、`line`、`seal`、`open`、`pick`、`stamp` の行は列の図でだけ書ける。
 *
 * 行の頭の語と同じ綴りの名札 (`end` や `step`) も書ける。名札の次に `->` が来る行は線と読む。
 * 誤りは最初の 1 つで止め、行と列を示す。誤りの文の言葉は呼ぶ側が渡す。
 */
import { type FigureDraft, type HeadReader, type ParseState, ranked, type StepDraft } from "./blocks/block";
import { BLOCKS } from "./blocks/index";
import { type Messages, messagesFor, type Shape } from "./messages";
import { type Attr, fail, ID, isOneOf, NotationError, readAttrs, readDeclared, readName, skipSpaces, urlOf } from "./read-kit";
import {
  type Box,
  type Carry,
  type Color,
  COLORS,
  type Diagram,
  type DiagramEvent,
  type GitBranch,
  type GitCommit,
  ICON_NAMES,
  type LabelSide,
  type LineupItem,
  type Region,
  type StatePath,
  type Step,
  type TimePeriod,
  type TimePoint,
  type TimeRow,
  type TimeScale,
  type ViewMode,
} from "./schema";
import { isBlankOrComment, type SourceLine, tokenize } from "./tokenize";
import { FORMAT_VERSION } from "./version";
import {
  AT,
  ATTRS,
  CARRIES,
  COPY,
  DEFAULT_LANG,
  FROM,
  HEAD,
  HEADS,
  KINDS,
  LABEL_MOST,
  LANE_ATTRS,
  LANE_MOST,
  LINEUP_HEADS,
  MERGE,
  type NotationLang,
  NOW,
  OF,
  OLD_HEADS,
  ON,
  SIDES,
  SPAN_SHAPES,
  STATE_ENDS,
  TIME_EDGE_ATTRS,
  TIME_HEADS,
  TREE_HEADS,
  VIEWS,
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

/** 線の行。名札、`->`、名札 */
const EDGE = /^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du;
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
 * 区画と箱の属性 (`note` と `color` と `icon`)。
 * 色の役とアイコン名の一覧は原本の形の検査 (`schema.ts`) が持ち、読む下請け (`read-kit.ts`) は `schema.ts` を読まないので、ここに置く
 */
function lookOf(source: SourceLine, attrs: Map<string, Attr>, m: Messages): { note?: string; color?: Color; icon?: string } {
  const color = attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  const icon = attrs.get("icon");
  if (icon && !ICON_NAMES.includes(icon.value)) throw fail(source, icon.at, m.badIcon(icon.value));
  const note = attrs.get("note")?.value;
  return {
    ...(note !== undefined ? { note } : {}),
    ...(color ? { color: color.value as Color } : {}),
    ...(icon ? { icon: icon.value } : {}),
  };
}

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

function parseLines(lines: SourceLine[], m: Messages): Diagram {
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
  const shown = titled.rest < head.text.length ? readAttrs(head, titled.rest, ATTRS.diagram, m).get("view") : undefined;
  if (shown && !isOneOf(VIEWS, shown.value)) throw fail(head, shown.at, m.badView);
  const view = shown?.value as ViewMode | undefined;

  const isState = kind === "state";
  const isGit = kind === "git";
  const isTime = kind === "time";
  const isTree = kind === "tree";
  const isLineup = kind === "lineup";
  /** 列の図で宣言したチップと、今封をしている列 (#3239) */
  const items: LineupItem[] = [];
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
  /** 最初に宣言した箱の行。時間軸の図で拡大の範囲が無い時に名指す */
  let firstBox: SourceLine | undefined;
  /** 針が今いる目盛りの境 (0 から数える) */
  let needle = 0;
  const branches: GitBranch[] = [];
  /** 枝分かれの図で積んだ commit と、枝の札が今指す commit (まだ何も指さない枝は `null`) */
  const commits = new Set<string>();
  const tips = new Map<string, string | null>();
  const regions: Region[] = [];
  const boxes: Box[] = [];
  const paths: StatePath[] = [];
  const ids = new Set<string>();
  /** 宣言の行でブロックが組む欄 (中身の帯と、時間軸の図の物差しの欄) */
  const figure: FigureDraft = { meters: [] };
  const steps: Step[] = [];
  let building: StepDraft | undefined;
  /** 開いている `group` */
  let group: { source: SourceLine; id: string } | undefined;

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
  /** 段の中に書く行の、書き先の段。最初の `step` より前なら誤り */
  const inStep = (source: SourceLine): StepDraft => {
    if (!building) throw fail(source, 0, m.stepLineBeforeStep);
    return building;
  };
  /** 宣言の行。最初の `step` より後なら誤り */
  const beforeSteps = (source: SourceLine): void => {
    if (building) throw fail(source, 0, m.declarationInStep);
  };
  /** ブロックの読む処理が受ける、読んでいる記法の状態 */
  const state: ParseState = { m, kind, inStep, beforeSteps, boxAt, figure };
  const finish = (): void => {
    if (!building) return;
    if (building.body === undefined) throw fail(building.source, 0, m.noBody(building.title));
    steps.push({
      title: building.title,
      body: building.body.join("\n"),
      ...(building.code !== undefined ? { code: building.code } : {}),
      ...(building.sources.length > 0 ? { sources: building.sources } : {}),
      events: building.events,
    });
  };

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
      if (isLineup) throw fail(source, 0, m.lineupNoEdge);
      // 状態遷移図の最初の step より前の線は、移れる道の地図
      if (isState && !building) paths.push(readPath(source, edge));
      else inStep(source).events.push(readEdge(source, edge));
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
    if (!isLineup && isOneOf(LINEUP_HEADS, word)) throw fail(source, 0, m.lineupOnly(word));
    if (!isOneOf(HEADS, word)) {
      const old = oldForm(text, building !== undefined);
      throw fail(source, 0, old ? m.oldForm(old.word, old.shape) : m.unknownHead(word));
    }
    // 時間軸の図の `note` の行は節目にも書けて丸の色を持つので、下の字のブロックでなく時間軸の図の読み方で読む
    if (isTime && word === "note") {
      inStep(source).events.push(readTimeNote(source));
      continue;
    }
    const reader = HEAD_READERS.get(word);
    if (reader) {
      reader(source, state);
      continue;
    }
    switch (word) {
      case "group":
        readGroup(source);
        break;
      case "end":
        if (text !== word) throw fail(source, word.length, m.endTakesNothing);
        if (!group) throw fail(source, 0, m.strayEnd);
        group = undefined;
        break;
      case "box":
        readBox(source);
        break;
      case "step": {
        if (group) throw fail(group.source, 0, m.unclosedGroup(group.id));
        settle();
        finish();
        const stepTitle = text.slice(word.length).trim();
        if (stepTitle === "") throw fail(source, 0, m.emptyStepTitle);
        building = { source, title: stepTitle, sources: [], events: [] };
        break;
      }
      case "say":
        i = readSay(source, i);
        break;
      case "code": {
        const step = inStep(source);
        if (step.code !== undefined) throw fail(source, 0, m.codeTwice);
        const command = text.slice(word.length).trim();
        if (command === "") throw fail(source, 0, m.emptyCode);
        step.code = command;
        break;
      }
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
  if (group) throw fail(group.source, 0, m.unclosedGroup(group.id));
  settle();
  finish();

  if (isGit && branches.length === 0) throw fail(head, 0, m.noBranches);
  if (isTree && trees.size === 0) throw fail(head, 0, m.noLeaves);
  if (isLineup && items.length === 0) throw fail(head, 0, m.noItems);
  if (boxes.length === 0 && !isGit && !isTime && !isTree) throw fail(head, 0, m.noBoxes);
  if (steps.length === 0) throw fail(head, 0, m.noSteps);
  // 木の形は全ての行を読んでから確かめる。親を持たない木の箱が 2 つ以上なら、書いた順で 2 つ目を示す
  const roots = [...trees.keys()].filter((id) => !parents.has(id));
  const [root, stray] = roots;
  const strayAt = stray === undefined ? undefined : trees.get(stray);
  if (root !== undefined && stray !== undefined && strayAt) throw fail(strayAt.source, strayAt.at, m.manyRoots(stray, root));

  return {
    version: FORMAT_VERSION,
    kind,
    title,
    ...(view ? { view } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    boxes,
    ...(figure.strip ? { strip: figure.meters.length > 0 ? { ...figure.strip, meters: figure.meters } : figure.strip } : {}),
    steps,
    ...(kind === "sequence" ? { sequence: { lifelines: boxes.map((box) => box.id) } } : {}),
    ...(paths.length > 0 ? { state: { paths } } : {}),
    ...(isGit ? { git: { branches } } : {}),
    ...(isLineup ? { lineup: { items } } : {}),
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
    if (firstBox && !zoom) throw fail(firstBox, 0, m.boxNeedsZoom);
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

  /** `group` の行。同じ名札をもう一度開いた時は、名前も属性も書かない */
  function readGroup(source: SourceLine): void {
    beforeSteps(source);
    if (isGit) throw fail(source, 0, m.gitNoGroup);
    if (isTree) throw fail(source, 0, m.treeNoGroup);
    if (isLineup) throw fail(source, 0, m.lineupNoGroup);
    if (group) throw fail(source, 0, m.nestedGroup);
    const declared = readDeclared(source, "group", ATTRS.group, m);
    if (regions.some((region) => region.id === declared.id)) {
      if (declared.name !== undefined || declared.attrs.size > 0) throw fail(source, 0, m.regionReopened(declared.id));
    } else {
      notReserved(source, declared.id, declared.idAt);
      declare(source, declared.id, declared.idAt);
      regions.push({ id: declared.id, name: declared.name ?? declared.id, ...lookOf(source, declared.attrs, m) });
    }
    group = { source, id: declared.id };
  }

  /** `box` の行。開いている `group` の中なら、その区画に置く */
  function readBox(source: SourceLine): void {
    beforeSteps(source);
    const declared = readDeclared(source, "box", isLineup ? LANE_ATTRS : ATTRS.box, m);
    notReserved(source, declared.id, declared.idAt);
    declare(source, declared.id, declared.idAt);
    firstBox ??= source;
    const { note, ...look } = lookOf(source, declared.attrs, m);
    const link = declared.attrs.get("link");
    boxes.push({
      id: declared.id,
      name: declared.name ?? declared.id,
      ...(note !== undefined ? { sub: note } : {}),
      ...look,
      ...(group ? { region: group.id } : {}),
      ...(link ? { link: urlOf(source, "link", link, m) } : {}),
    });
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
    for (const { value, at } of namesAt(source, "item".length, end, m.itemShape)) {
      declare(source, value, at);
      items.push({ id: value, ...(color ? { color: color.value as Color } : {}), ...(label ? { label: label.value } : {}) });
    }
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

  /**
   * `say` の行と、その下に `say` より深く字下げして続けた行を段の本文にする。
   * 続きの行の間の空行は本文の空の行になる。返すのは読み終えた最後の行の番号。
   */
  function readSay(source: SourceLine, index: number): number {
    const step = inStep(source);
    if (step.body !== undefined) throw fail(source, 0, m.sayTwice);
    const inline = source.text.slice("say".length).trim();
    const body = inline === "" ? [] : [inline];
    let blanks = 0;
    let last = index;
    for (let j = index + 1; j < rest.length; j++) {
      const next = rest[j];
      if (!next) break;
      if (next.text === "") {
        blanks++;
        continue;
      }
      if (next.indent <= source.indent) break;
      body.push(...Array.from({ length: blanks }, () => ""), next.text);
      blanks = 0;
      last = j;
    }
    if (body.length === 0) throw fail(source, 0, m.emptySay);
    step.body = body;
    return last;
  }

  /** 線の行の両端と、`:` の後ろの線の名前。`at` は名前の後ろの位置 */
  function readLine(source: SourceLine, edge: RegExpExecArray): { from: string; to: string; label?: string; at: number } {
    const text = source.text;
    const from = endAt(source, edge[1] ?? "", edge.indices?.[1]?.[0] ?? 0, "from");
    const to = endAt(source, edge[2] ?? "", edge.indices?.[2]?.[0] ?? 0, "to");
    const at = skipSpaces(text, edge[0].length);
    if (text[at] !== ":") return { from, to, at };
    const named = readName(source, at + 1, m);
    if (named.value === "") throw fail(source, at, m.emptyLabel);
    return { from, to, label: named.value, at: named.rest };
  }

  /** 状態遷移図の最初の `step` より前の `<名札> -> <名札>: <線の名前>` の行。属性は書けない */
  function readPath(source: SourceLine, edge: RegExpExecArray): StatePath {
    const { from, to, label, at } = readLine(source, edge);
    if (at < source.text.length) throw fail(source, at, source.text[at] === "[" ? m.pathNoAttrs : m.edgeShape);
    return { from, to, ...(label !== undefined ? { label } : {}) };
  }

  /** `<名札> -> <名札>: <線の名前> [<属性>]` の行 */
  function readEdge(source: SourceLine, edge: RegExpExecArray): DiagramEvent {
    const text = source.text;
    const { from, to, label, at } = readLine(source, edge);
    if (at < text.length && text[at] !== "[") throw fail(source, at, m.edgeShape);
    const attrs = at < text.length ? readAttrs(source, at, ATTRS.edge, m) : new Map<string, Attr>();
    const tag = attrs.get("tag");
    const carried = attrs.get("carry");
    if (tag && carried) throw fail(source, Math.max(tag.at, carried.at), m.carryTwice);
    if (carried && !isOneOf(CARRIES, carried.value)) throw fail(source, carried.at, m.badCarry);
    const side = attrs.get("side");
    if (side && !isOneOf(SIDES, side.value)) throw fail(source, side.at, m.badSide);
    const columns = readColumns(source, from, to, attrs, at);
    // 枝分かれの図の線は札を動かす線で、書かなければ送る側の名前の札を運ぶ
    let carry: Carry = isGit ? { kind: "tag", text: from } : { kind: "envelope" };
    if (tag) carry = { kind: "tag", text: tag.value };
    else if (carried) carry = carried.value === "coin" ? { kind: "coin" } : { kind: "none" };
    if (isGit && from !== HEAD) tips.set(from, to);
    return {
      type: "edge",
      from,
      to,
      ...(label !== undefined ? { label } : {}),
      carry,
      ...(side ? { labelSide: side.value as LabelSide } : {}),
      ...columns,
    };
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
    return { ok: true, diagram: parseLines(tokenize(notation), messagesFor(options.lang ?? DEFAULT_LANG)) };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
