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
import { type FigureDraft, type HeadReader, type KindName, type ParseState, ranked, type StepDraft } from "./blocks/block";
import { isCut, readCut } from "./blocks/branch/block";
import { commitAt } from "./blocks/commit/block";
import { EDGE, readEdgeLine } from "./blocks/edge/block";
import { BLOCKS } from "./blocks/index";
import { readTimeNote } from "./blocks/point/block";
import { isNeedle, readNow } from "./blocks/scale/block";
import { readPath } from "./blocks/side-path/block";
import { stepOf, viewOf } from "./blocks/step/block";
import { readTryChip } from "./blocks/ask/block";
import { readTryLine } from "./blocks/queue/block";
import { readColumns } from "./blocks/zoom/block";
import { type Messages, messagesFor, type Shape } from "./messages";
import { fail, isOneOf, NotationError, readAttrs, readName } from "./read-kit";
import type { Diagram, DiagramModel, Step } from "./schema";
import { isBlankOrComment, type SourceLine, tokenize } from "./tokenize";
import { settleTry } from "./try-read";
import { FORMAT_VERSION, fromModel, MODEL_VERSION } from "./model";
import { ATTRS, DEFAULT_LANG, HEAD, HEADS, KINDS, type NotationLang, NOW, OLD_HEADS, STATE_ENDS } from "./words";

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
/**
 * 図の種類だけのブロック (`attach.only`) が持つ行の頭の語と、その図の種類 (#3164、#3347、#3348)。
 * ほかの種類の図に書いた行は、その図の種類だけの語の誤りで止める
 */
const ONLY_HEADS: ReadonlyMap<string, KindName> = new Map(
  ranked(BLOCKS).flatMap((block) => {
    const only = block.attach.only;
    return only === undefined ? [] : (block.words.heads ?? []).map((head) => [head, only] as const);
  }),
);

/**
 * 列の図のチップと並びの語のうち、試す図でも書ける語と、試す図での読む処理 (#3337、#3348)。
 * 試す図の `item` はチップの欄の値を、`line` は待ち行列か機械の列の中身を書くので、列の図のブロックでなく試す図の部品のブロックが読む
 */
const TRY_SHARED_READERS: ReadonlyMap<string, (source: SourceLine, state: ParseState) => void> = new Map([
  ["item", readTryChip],
  ["line", readTryLine],
]);
/** 試す図に書ける行の頭の語。試す図だけのブロック (`attach.only` が try) の語と、チップと並びの行と、段の行 (#3337) */
const TRY_LINES: readonly string[] = [
  ...ranked(BLOCKS).flatMap((block) => (block.attach.only === "try" ? (block.words.heads ?? []) : [])),
  ...TRY_SHARED_READERS.keys(),
  "step",
  "say",
  "code",
  "source",
];

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
    try: { parts: [], items: [], pending: [] },
  };
  const { regions, boxes, paths, branches, time } = figure;
  const { tips } = figure.git;
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
  /**
   * 線の端。状態遷移図では送る側に `start`、受ける側に `finish` を書ける。
   * 枝分かれの図では送る側が枝の名札か `HEAD`、受ける側が積んだ commit
   */
  const endAt = (source: SourceLine, id: string, at: number, side: "from" | "to"): string => {
    if (isGit) {
      if (side === "to") return commitAt(state, source, id, at);
      if (id !== HEAD && !tips.has(id)) throw fail(source, at, m.undeclaredRef(id));
      return id;
    }
    if (isTime) {
      if (!boxes.some((box) => box.id === id) && !time.points.some((point) => point.id === id)) throw fail(source, at, m.undeclaredNote(id));
      return id;
    }
    if (isTree && figure.tree.boxes.has(id)) return id;
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
    settleTry(state);
    if (building) steps.push(stepOf(building, m));
  };
  const openStep = (draft: StepDraft): void => {
    building = draft;
    figure.try.run?.beginStep();
  };
  /** ブロックの読む処理が受ける、読んでいる記法の状態 */
  const declared = (id: string): boolean => ids.has(id);
  const current = (): StepDraft | undefined => building;
  /**
   * 図の種類だけの行の頭の語を、ほかの種類の図に書いた時の誤りの文。
   * 区画の行のように、図の種類だけのブロックが読む処理で自分で断る語の図の種類は持たない
   */
  const onlyIn: Partial<Record<KindName, (word: string) => string>> = { git: m.gitOnly, time: m.timeOnly, tree: m.treeOnly, lineup: m.lineupOnly, try: m.tryOnly };
  const columns: ParseState["columns"] = (source, from, to, attrs, end) => readColumns(source, from, to, attrs, end, state);
  const state: ParseState = { m, kind, attrs: ATTRS, inStep, current, closeStep, openStep, beforeSteps, boxAt, declare, declared, notReserved, claim, endAt, columns, figure };

  const rest = lines.slice(headAt + 1);
  for (let i = 0; i < rest.length; i++) {
    const source = rest[i];
    if (!source || isBlankOrComment(source)) continue;
    const text = source.text;
    // 時間軸の図の `now -> <目盛り>` は針を進める行で、線と同じ形でも箱どうしの線と読まない
    if (isTime && isNeedle(text)) {
      inStep(source).events.push(readNow(source, state));
      continue;
    }
    // 名札の次に `->` が来る行は、名札が行の頭の語と同じ綴りでも線と読む
    const edge = EDGE.exec(text);
    if (edge) {
      if (isTry) throw fail(source, 0, m.tryNoEdge);
      // 状態遷移図の最初の step より前の線は、移れる道の地図
      if (isState && !building) paths.push(readPath(source, edge, state));
      else {
        const read = readEdgeLine(source, edge, state);
        // 枝分かれの図の線は、送る側の枝の札を受ける側の commit へ動かす
        if (isGit && read.from !== HEAD) tips.set(read.from, read.to);
      }
      continue;
    }
    const [word = "", second] = text.split(/\s+/u);
    // 枝分かれの図で、宣言した枝の名札の次に `from` が来る行は、枝を切る行
    if (isCut(state, word, second)) {
      readCut(source, state);
      continue;
    }
    // 列の図のチップと並びの語は試す図でも書け、試す図ではチップの欄の値と部品の中身を書くので、試す図の部品のブロックの読み方で読む (#3337)
    const shared = TRY_SHARED_READERS.get(word);
    if (shared && !isLineup) {
      if (!isTry) throw fail(source, 0, m.lineupOrTryOnly(word));
      shared(source, state);
      continue;
    }
    const only = ONLY_HEADS.get(word);
    const refuse = only === undefined || only === kind ? undefined : onlyIn[only];
    if (refuse) throw fail(source, 0, refuse(word));
    if (!isOneOf(HEADS, word)) {
      const old = oldForm(text, building !== undefined);
      throw fail(source, 0, old ? m.oldForm(old.word, old.shape) : m.unknownHead(word));
    }
    // 試す図は部品の行と段の行だけを書ける
    if (isTry && !TRY_LINES.includes(word)) throw fail(source, 0, m.tryNoLine(word));
    // 時間軸の図の `note` の行は節目にも書けて丸の色を持つので、下の字のブロックでなく節目のブロックの読み方で読む
    if (isTime && word === "note") {
      inStep(source).events.push(readTimeNote(source, state));
      continue;
    }
    const reader = HEAD_READERS.get(word);
    if (reader) {
      // 下の行まで続けて読んだ処理は、読み終えた続きの行の数を返す
      const read = reader(source, state, (offset) => rest[i + offset]);
      if (typeof read === "number") i += read;
      continue;
    }
  }
  closeStep();

  if (isGit && branches.length === 0) throw fail(head, 0, m.noBranches);
  if (isTree && figure.tree.boxes.size === 0) throw fail(head, 0, m.noLeaves);
  if (isLineup && figure.lineup.items.length === 0) throw fail(head, 0, m.noItems);
  if (isTry && figure.try.parts.length === 0) throw fail(head, 0, m.noParts);
  if (boxes.length === 0 && !isGit && !isTime && !isTree && !isTry) throw fail(head, 0, m.noBoxes);
  if (steps.length === 0) throw fail(head, 0, m.noSteps);
  // 木の形は全ての行を読んでから確かめる。親を持たない木の箱が 2 つ以上なら、書いた順で 2 つ目を示す
  const roots = [...figure.tree.boxes.keys()].filter((id) => !figure.tree.parents.has(id));
  const [root, stray] = roots;
  const strayAt = stray === undefined ? undefined : figure.tree.boxes.get(stray);
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
    ...(isLineup ? { lineup: { items: figure.lineup.items, ...(figure.lineup.roles.length > 0 ? { roles: figure.lineup.roles } : {}) } } : {}),
    ...(isTry ? { try: { parts: figure.try.parts, items: figure.try.items } } : {}),
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

  /**
   * 時間軸の図の宣言を、目盛りの数が決まってから確かめる。最初の step と記法の終わりで 1 度だけ呼ぶ。
   * 目盛りと印の列が無い図と、拡大の範囲の無い図の箱は誤り
   */
  function settle(): void {
    if (!isTime || time.settled) return;
    time.settled = true;
    if (!time.scale) throw fail(head as SourceLine, 0, m.noScale);
    if (time.rows.length === 0) throw fail(head as SourceLine, 0, m.noRows);
    for (const check of time.pending) check();
    if (figure.firstBox && !time.zoom) throw fail(figure.firstBox, 0, m.boxNeedsZoom);
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
