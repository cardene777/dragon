/**
 * 人が書く dragon記法を、図の原本の JSON へ変える (#3137)。
 *
 * 行の種類は行の頭の英語の語で決まり、線の行だけは箱の名札から始まる。最初の `step` より前に
 * 図の種類と題と区画と箱と帯を宣言し、`step` ごとに、その段で起きることを起きる順に並べる。
 *
 *   sequence <題> [view: fixed か follow]                書かなければ字の大きさで選ぶ。図の種類は sequence と architecture と state
 *   group <名札> as <名前> [note: <添え書き>, color: <色>, icon: <印>]
 *     box <名札> as <名前> [note: <下の小さな字>, color: <色>, icon: <印>]
 *   end                                                  同じ名札の group はもう一度開ける
 *   box <名札> as <名前> [...]                           as が無ければ名札を名前にする
 *   strip <題>: <欄>, <欄>
 *   step <段の題>
 *     say <段の本文>                                     say の下に字下げした行は本文の続き
 *     code <段で打つ命令>
 *     <名札> -> <名札>: <線の名前> [carry: <運ぶ物>, tag: <値>, side: <側>]
 *     act <名札>: <処理の名前>                           箱の中の処理
 *     note <名札>: <字>                                   箱の下の小さな字の書き換え
 *     set <欄>: <値> [tag: <札>]                          中身の帯の値
 *
 * 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べて行の終わりに置く。
 * 空白を含む名前と文は行の終わりか `[` の前に置き、`[` を含む名前と `,` か `]` を含む属性の値だけを
 * `"` で囲む。囲みの中では `\"` が `"`、`\\` が `\` になる。字下げは `say` の続きの行を見分ける時だけ意味を持つ。
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
 * 行の頭の語と同じ綴りの名札 (`end` や `step`) も書ける。名札の次に `->` が来る行は線と読む。
 * 誤りは最初の 1 つで止め、行と列を示す。誤りの文の言葉は呼ぶ側が渡す。
 */
import { type Messages, messagesFor, type Shape } from "./messages";
import {
  type Box,
  type Carry,
  type Color,
  COLORS,
  type Diagram,
  type DiagramEvent,
  type GitBranch,
  type GitCommit,
  type LabelSide,
  type Region,
  type StatePath,
  type Step,
  type StripMeter,
  type TimePeriod,
  type TimePoint,
  type TimeRow,
  type TimeScale,
  type ViewMode,
} from "./schema";
import { columnOf, isBlankOrComment, type SourceLine, tokenize } from "./tokenize";
import { FORMAT_VERSION } from "./version";
import {
  AS,
  AT,
  ATTRS,
  CARRIES,
  COPY,
  FROM,
  HEAD,
  HEADS,
  KINDS,
  MERGE,
  type NotationLang,
  NOW,
  OLD_HEADS,
  ON,
  SIDES,
  SPAN_SHAPES,
  STATE_ENDS,
  TIME_EDGE_ATTRS,
  TIME_HEADS,
  VIEWS,
} from "./words";

export interface LineError {
  line: number;
  column: number;
  message: string;
}

export type Parsed = { ok: true; diagram: Diagram } | { ok: false; errors: LineError[] };

export interface ParseOptions {
  /** 誤りの文の言葉。既定は日本語 */
  lang?: NotationLang;
}

class NotationError extends Error {
  constructor(
    readonly line: number,
    readonly column: number,
    message: string,
  ) {
    super(message);
  }
}

const fail = (source: SourceLine, index: number, message: string): NotationError =>
  new NotationError(source.line, columnOf(source, index), message);

/** 名札に使える字。原本の JSON の名札の形と同じ */
const ID = /^[^\s[\]「」=:]+$/u;
/** 線の行。名札、`->`、名札 */
const EDGE = /^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du;
/** 枝分かれの図の `commit` の行。名札と、`on` の枝と、`copy` の当て直しの元と、`merge` の取り込む枝 */
const COMMIT = new RegExp(`^commit\\s+([^\\s[]+)(?:\\s+${ON}\\s+([^\\s[]+))?(?:\\s+${COPY}\\s+([^\\s[]+))?(?:\\s+${MERGE}\\s+([^\\s[]+))?`, "du");
/** 枝分かれの図の、枝を切る行。枝と `from` と切る commit */
const CUT = new RegExp(`^([^\\s[]+)\\s+${FROM}(?:\\s+([^\\s[]+))?\\s*$`, "du");
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
/** 割合。原本の JSON の割合の形と同じ */
const RATIO = /^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?%)$/u;
/** 1 以上の整数と、0 以上の整数 */
const COUNT = /^[1-9][0-9]*$/u;
const NUMBER = /^(0|[1-9][0-9]*)$/u;
/** 目盛りの範囲。`0-31` か `0` */
const RANGE = /^(0|[1-9][0-9]*)(?:-(0|[1-9][0-9]*))?$/u;

const isOneOf = <T extends string>(list: readonly T[], word: string): word is T => (list as readonly string[]).includes(word);

/** `at` から空白を飛ばした位置 */
function skipSpaces(text: string, at: number): number {
  let i = at;
  while (i < text.length && /\s/u.test(text[i] ?? "")) i++;
  return i;
}

/** `[<鍵>: <値>]` の 1 つ。`at` は鍵の位置 */
interface Attr {
  value: string;
  at: number;
}

/** `at` の `"` から閉じる `"` までを読む。`end` は閉じた `"` の次 */
function readQuoted(source: SourceLine, at: number, m: Messages): { value: string; end: number } {
  const text = source.text;
  let value = "";
  for (let i = at + 1; i < text.length; i++) {
    const c = text[i] ?? "";
    const next = text[i + 1] ?? "";
    if (c === "\\" && (next === '"' || next === "\\")) {
      value += next;
      i++;
    } else if (c === '"') {
      return { value, end: i + 1 };
    } else {
      value += c;
    }
  }
  throw fail(source, at, m.quoteUnclosed);
}

/**
 * `at` から名前か文を読む。`"` で始まれば囲みの中、そうでなければ `[` の前か行の終わりまで。
 * `rest` は名前の後ろの位置で、行の終わりか属性の `[` を指す。
 */
function readName(source: SourceLine, at: number, m: Messages): { value: string; rest: number } {
  const text = source.text;
  const start = skipSpaces(text, at);
  if (text[start] === '"') {
    const quoted = readQuoted(source, start, m);
    const rest = skipSpaces(text, quoted.end);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.afterQuote);
    return { value: quoted.value, rest };
  }
  const open = text.indexOf("[", start);
  const rest = open < 0 ? text.length : open;
  return { value: text.slice(start, rest).trim(), rest };
}

/** `at` の `[` から行の終わりの `]` までの属性を読む。`allowed` に無い鍵は誤り */
function readAttrs(source: SourceLine, at: number, allowed: readonly string[], m: Messages): Map<string, Attr> {
  const text = source.text;
  if (!text.endsWith("]")) throw fail(source, at, m.attrUnclosed);
  const close = text.length - 1;
  const attrs = new Map<string, Attr>();
  for (let i = at + 1; ; ) {
    const start = skipSpaces(text, i);
    let colon = start;
    while (colon < close && text[colon] !== ":" && text[colon] !== ",") colon++;
    if (colon >= close || text[colon] !== ":") throw fail(source, start, m.attrNoColon(text.slice(start, colon).trim()));
    const key = text.slice(start, colon).trim();
    if (!allowed.includes(key)) throw fail(source, start, m.badAttr(key, allowed));
    if (attrs.has(key)) throw fail(source, start, m.attrTwice(key));
    let end = skipSpaces(text, colon + 1);
    let value: string;
    if (text[end] === '"') {
      const quoted = readQuoted(source, end, m);
      value = quoted.value;
      end = skipSpaces(text, quoted.end);
      if (end < close && text[end] !== ",") throw fail(source, end, m.afterQuote);
    } else {
      const comma = text.indexOf(",", end);
      const stop = comma < 0 || comma > close ? close : comma;
      value = text.slice(end, stop).trim();
      end = stop;
    }
    if (value === "") throw fail(source, start, m.attrNoValue(key));
    attrs.set(key, { value, at: start });
    if (end >= close) return attrs;
    i = end + 1;
  }
}

/** `at` から `,` で区切った字の並びを行の終わりまで読む */
function readList(source: SourceLine, at: number, m: Messages): string[] {
  const text = source.text;
  const items: string[] = [];
  for (let i = at; ; ) {
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
    if (value === "") throw fail(source, start, m.emptyStripField);
    items.push(value);
    if (end >= text.length) return items;
    i = end + 1;
  }
}

/** `group` と `box` の行の、名札と `as` の後ろの名前と属性 */
interface Declared {
  id: string;
  idAt: number;
  name?: string;
  attrs: Map<string, Attr>;
}

function readDeclared(source: SourceLine, word: string, allowed: readonly string[], m: Messages): Declared {
  const text = source.text;
  const start = skipSpaces(text, word.length);
  const id = /^[^\s[]+/u.exec(text.slice(start))?.[0];
  if (id === undefined) throw fail(source, 0, m.needsId(word));
  if (!ID.test(id)) throw fail(source, start, m.badId(id));
  let rest = skipSpaces(text, start + id.length);
  let name: string | undefined;
  if (text.startsWith(AS, rest) && /^(\s|$)/u.test(text.slice(rest + AS.length, rest + AS.length + 1))) {
    const named = readName(source, rest + AS.length, m);
    if (named.value === "") throw fail(source, rest, m.emptyName(id));
    name = named.value;
    rest = named.rest;
  }
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.afterId);
  const attrs = rest < text.length ? readAttrs(source, rest, allowed, m) : new Map<string, Attr>();
  return { id, idAt: start, ...(name !== undefined ? { name } : {}), attrs };
}

/** 区画と箱の属性 (`note` と `color` と `icon`) */
function lookOf(source: SourceLine, attrs: Map<string, Attr>, m: Messages): { note?: string; color?: Color; icon?: string } {
  const color = attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  const note = attrs.get("note")?.value;
  const icon = attrs.get("icon")?.value;
  return {
    ...(note !== undefined ? { note } : {}),
    ...(color ? { color: color.value as Color } : {}),
    ...(icon !== undefined ? { icon } : {}),
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

/** 読んでいる段。`body` は `say` を読むまで無い */
interface Building {
  source: SourceLine;
  title: string;
  body?: string[];
  code?: string;
  events: DiagramEvent[];
}

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
  /** 時間軸の図の目盛りと区切りと印の列と節目と拡大の範囲 (#3165) */
  let scale: TimeScale | undefined;
  let period: TimePeriod | undefined;
  const rows: TimeRow[] = [];
  const points: TimePoint[] = [];
  let zoom: { from: number; to: number } | undefined;
  const meters: StripMeter[] = [];
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
  let strip: { title: string; fields: string[] } | undefined;
  const steps: Step[] = [];
  let building: Building | undefined;
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
  const inStep = (source: SourceLine): Building => {
    if (!building) throw fail(source, 0, m.stepLineBeforeStep);
    return building;
  };
  /** 宣言の行。最初の `step` より後なら誤り */
  const beforeSteps = (source: SourceLine): void => {
    if (building) throw fail(source, 0, m.declarationInStep);
  };
  const finish = (): void => {
    if (!building) return;
    if (building.body === undefined) throw fail(building.source, 0, m.noBody(building.title));
    steps.push({
      title: building.title,
      body: building.body.join("\n"),
      ...(building.code !== undefined ? { code: building.code } : {}),
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
    if (!isOneOf(HEADS, word)) {
      const old = oldForm(text, building !== undefined);
      throw fail(source, 0, old ? m.oldForm(old.word, old.shape) : m.unknownHead(word));
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
      case "strip":
        readStrip(source);
        break;
      case "step": {
        if (group) throw fail(group.source, 0, m.unclosedGroup(group.id));
        settle();
        finish();
        const stepTitle = text.slice(word.length).trim();
        if (stepTitle === "") throw fail(source, 0, m.emptyStepTitle);
        building = { source, title: stepTitle, events: [] };
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
      case "act": {
        const step = inStep(source);
        const on = readOnBox(source, word, m.actShape);
        step.events.push({ type: "action", box: on.box, label: on.text });
        break;
      }
      case "note": {
        const step = inStep(source);
        if (isTime) {
          step.events.push(readTimeNote(source));
          break;
        }
        const on = readOnBox(source, word, m.noteShape);
        step.events.push({ type: "swap", box: on.box, text: on.text });
        break;
      }
      case "set":
        inStep(source).events.push(readSet(source));
        break;
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
    }
  }
  if (group) throw fail(group.source, 0, m.unclosedGroup(group.id));
  settle();
  finish();

  if (isGit && branches.length === 0) throw fail(head, 0, m.noBranches);
  if (boxes.length === 0 && !isGit && !isTime) throw fail(head, 0, m.noBoxes);
  if (steps.length === 0) throw fail(head, 0, m.noSteps);

  return {
    version: FORMAT_VERSION,
    kind,
    title,
    ...(view ? { view } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    boxes,
    ...(strip ? { strip: meters.length > 0 ? { ...strip, meters } : strip } : {}),
    steps,
    ...(kind === "sequence" ? { sequence: { lifelines: boxes.map((box) => box.id) } } : {}),
    ...(paths.length > 0 ? { state: { paths } } : {}),
    ...(isGit ? { git: { branches } } : {}),
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
    const declared = readDeclared(source, "box", ATTRS.box, m);
    notReserved(source, declared.id, declared.idAt);
    declare(source, declared.id, declared.idAt);
    firstBox ??= source;
    const { note, ...look } = lookOf(source, declared.attrs, m);
    boxes.push({
      id: declared.id,
      name: declared.name ?? declared.id,
      ...(note !== undefined ? { sub: note } : {}),
      ...look,
      ...(group ? { region: group.id } : {}),
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

  /** `strip <題>: <欄>, <欄>` の行 */
  function readStrip(source: SourceLine): void {
    beforeSteps(source);
    if (strip) throw fail(source, 0, m.stripTwice);
    const text = source.text;
    const start = skipSpaces(text, "strip".length);
    let stripTitle: string;
    let colon: number;
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      stripTitle = quoted.value;
      colon = skipSpaces(text, quoted.end);
    } else {
      colon = text.indexOf(":", start);
      stripTitle = colon < 0 ? "" : text.slice(start, colon).trim();
    }
    if (stripTitle === "" || text[colon] !== ":") throw fail(source, 0, m.stripShape);
    if (isTime) {
      strip = { title: stripTitle, fields: readFields(source, colon + 1) };
      return;
    }
    const fields = readList(source, colon + 1, m);
    // 物差しは時間軸の図だけが書ける。ほかの図では欄の名前の一部として読んでいた形なので、欄が属性の形で終わる時だけ断る
    const metered = /\[\s*meter\s*:/u.exec(text);
    if (metered && fields.some((f) => /\[\s*meter\s*:[^\]]*\]$/u.test(f))) throw fail(source, metered.index + 1, m.timeOnly("meter"));
    strip = { title: stripTitle, fields };
  }

  /**
   * 時間軸の図の `strip` の行の欄。`,` で区切り、欄の名前の後ろに `[meter: <割合>]` を書いた欄は物差しにする。
   * `[` を含む名前は `"` で囲む
   */
  function readFields(source: SourceLine, at: number): string[] {
    const text = source.text;
    const items: string[] = [];
    for (let i = at; ; ) {
      const start = skipSpaces(text, i);
      let value: string;
      let end: number;
      if (text[start] === '"') {
        const quoted = readQuoted(source, start, m);
        value = quoted.value;
        end = skipSpaces(text, quoted.end);
      } else {
        end = start;
        while (end < text.length && text[end] !== "," && text[end] !== "[") end++;
        value = text.slice(start, end).trim();
      }
      if (value === "") throw fail(source, start, m.emptyStripField);
      if (text[end] === "[") {
        const close = text.indexOf("]", end);
        if (close < 0) throw fail(source, end, m.attrUnclosed);
        const inside = text.slice(end + 1, close);
        const inner = /^\s*([a-z]*)\s*:\s*(.*?)\s*$/u.exec(inside);
        if (!inner) throw fail(source, end + 1, m.attrNoColon(inside.trim()));
        const key = inner[1] ?? "";
        if (!(ATTRS.strip as readonly string[]).includes(key)) throw fail(source, end + 1, m.badAttr(key, ATTRS.strip));
        if (!RATIO.test(inner[2] ?? "")) throw fail(source, end + 1, m.badRatio);
        meters.push({ field: value, line: inner[2] ?? "" });
        end = skipSpaces(text, close + 1);
      }
      if (end < text.length && text[end] !== ",") throw fail(source, end, m.afterQuote);
      items.push(value);
      if (end >= text.length) return items;
      i = end + 1;
    }
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

  /** `act <名札>: <字>` と `note <名札>: <字>` の行の、箱と字 */
  function readOnBox(source: SourceLine, word: "act" | "note", shape: string): { box: string; text: string } {
    const found = new RegExp(`^${word}\\s+([^\\s:]+)\\s*:\\s*(.*)$`, "du").exec(source.text);
    const idAt = found?.indices?.[1]?.[0];
    if (!found || idAt === undefined || (found[2] ?? "") === "") throw fail(source, 0, shape);
    return { box: boxAt(source, found[1] ?? "", idAt), text: found[2] ?? "" };
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

  /** `set <欄>: <値> [tag: <札>]` か `set <欄> [tag: <札>]` の行 */
  function readSet(source: SourceLine): DiagramEvent {
    const declared = strip;
    if (!declared) throw fail(source, 0, m.stripUndeclared);
    const text = source.text;
    const start = skipSpaces(text, "set".length);
    let field: string;
    let at: number;
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      field = quoted.value;
      at = skipSpaces(text, quoted.end);
    } else {
      at = start;
      while (at < text.length && text[at] !== ":" && text[at] !== "[") at++;
      field = text.slice(start, at).trim();
    }
    if (!declared.fields.includes(field)) throw fail(source, start, m.noSuchField(field));
    let value: string | undefined;
    if (text[at] === ":") {
      const named = readName(source, at + 1, m);
      if (named.value === "") throw fail(source, at, m.stripNeedsValue);
      value = named.value;
      at = named.rest;
    }
    if (at < text.length && text[at] !== "[") throw fail(source, at, m.stripNeedsValue);
    const tag = at < text.length ? readAttrs(source, at, ATTRS.set, m).get("tag")?.value : undefined;
    if (value === undefined && tag === undefined) throw fail(source, 0, m.stripNeedsValue);
    if (value !== undefined && meters.some((meter) => meter.field === field) && !RATIO.test(value)) throw fail(source, start, m.meterValue(field));
    return {
      type: "strip",
      field,
      ...(value !== undefined ? { value } : {}),
      ...(tag !== undefined ? { tag } : {}),
    };
  }
}

export function parseNotation(notation: string, options: ParseOptions = {}): Parsed {
  try {
    return { ok: true, diagram: parseLines(tokenize(notation), messagesFor(options.lang ?? "ja")) };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
