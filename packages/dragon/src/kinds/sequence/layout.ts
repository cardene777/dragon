/**
 * 時系列図の置き場所。#93 で選んだ試作の案C (パイプ図の部品) に揃える (Tracelyth #91、#93、#97、#107)。
 *
 * 列の頭を上に横 1 列に同じ幅で並べ、頭の下に hold の行の器と札と、2人をキーに持つ値の矢印を置く。
 * 段で起きる線と処理を起きる順に 1 行ずつ下へ積み、段ごとに今の段の帯 (`rows`) を置く。
 * 列の間は、列から右へ出す札が次の列の管に被らない幅まで広げる。中身の帯は一番下に置く。
 */
import { linkDelta, UNDONE_TAG } from "../../layout/amount";
import { textWidth } from "../../layout/measure";
import {
  boxColors,
  carrierHalf,
  carrierSeats,
  edgeColor,
  type Layout,
  layoutStrip,
  type Point,
  type Rect,
  type SceneAction,
  type SceneBadge,
  type SceneBox,
  type SceneEdge,
  type SceneLabel,
  stripNeed,
} from "../../layout/scene";
import { SEQ_BOLD, SEQ_CARD, SEQ_FONT, SEQ_LINK, SEQ_LINK_FONT, SEQ_LOOK, SEQ_SMALL, SEQC_N, SEQC_O, SEQC_O1, SEQC_F, SEQC_P, SEQC_V } from "../../look/sequence";
import { type ColorKey, LOOK, type TextStyle, TYPE } from "../../look/values";
import type { DiagramModel } from "../../schema";
import { USER_DASH, userBlock } from "../../user-blocks";
import type { NotationLang } from "../../words";

/** 札の字の 1 続き。`**` で囲んだ所は `bold` */
export interface SeqRun {
  text: string;
  bold: boolean;
}
/** 表の形の札の引数の 1 行 */
export interface SeqCardRow {
  name: string;
  value: string;
}
/** 呼び出しとログの表の形の札 (Tracelyth #97)。`owner` は呼び先かログの持ち主、`mark` はログの印 (印を持つ札がログの札) */
export interface SeqCard {
  owner: string;
  name: string;
  mark?: string;
  rows: SeqCardRow[];
}
/** 書き換えの札の字 (`<名前> <前の値> → <後の値> <単位>`) を分けた形 */
export interface SeqWrite {
  slot: string;
  old?: string;
  now: string;
  unit?: string;
}
/** ログの札。最初の太字を印 (`mark`) にし、残りの字を `rest` に持つ */
export interface SeqLog {
  mark: string;
  rest: SeqRun[];
}
/** 札の形。呼び出しの管の上の札、枠付きの札、リバートの×の横の札、生存線の横の札 */
export type SeqLabelKind = "call" | "chip" | "stop" | "self";
/** シーケンス図の札。`lines` は折った呼び出しの札の行、`card` と `headH` は表の形の札と見出しの高さ */
export interface SequenceLabel extends SceneLabel {
  runs: SeqRun[];
  kind: SeqLabelKind;
  write?: SeqWrite;
  log?: SeqLog;
  lines?: SeqRun[][];
  card?: SeqCard;
  headH?: number;
}
/** シーケンス図の線。`width` は線の太さ、`op` は線を起こした操作の番号、`tone` はお金の液のトークンの色の番号 */
export interface SequenceEdge extends SceneEdge {
  width: number;
  block?: string;
  dash?: string;
  op?: number;
  tone?: number;
}
/** シーケンス図の処理の札。字を太字の所とそれ以外に分けて持つ */
export interface SequenceAction extends SceneAction {
  runs: SeqRun[];
}
/** 器の値の 1 つ。`step` と `event` は値を変えた線で、始めの値は `-1`。`level` は水位の割合 */
export interface SeqTankState {
  step: number;
  event: number;
  text: string;
  level: number;
  undo?: boolean;
}
/** 列の頭の下の器 (Tracelyth #93)。hold の行の残高のトークンごとに置き、`tone` はトークンの色の番号 */
export interface SeqTank extends Rect {
  box: string;
  token: string;
  name: string;
  tone: number;
  states: SeqTankState[];
}
/** 札の値の 1 つ。`step` と `event` は値を変えた線で、始めの値は `-1` */
export interface SeqSlotState {
  step: number;
  event: number;
  text: string;
  undo?: boolean;
}
/** 列の頭の下の書き換える値の札 (Tracelyth #93)。`on` は1人をキーに持つ値の、札を置いた列の人 (#107) */
export interface SeqSlot extends Rect {
  box: string;
  on?: string;
  name: string;
  lines: string[];
  states: SeqSlotState[];
}
/** 2人をキーに持つ値の札の 1 つ。`delta` と `deltaW` は増減の札の字と幅、`undo` はリバートで戻った札 */
export interface SeqLinkState {
  step: number;
  event: number;
  text: string;
  delta?: string;
  deltaW?: number;
  undo?: boolean;
}
/** 2人をキーに持つ値の点線の矢印と札 (#107)。`right` は札と増減の札の組の右の端 */
export interface SeqLink {
  from: string;
  to: string;
  owner: string;
  name: string;
  x1: number;
  x2: number;
  y: number;
  label: Rect;
  right: number;
  states: SeqLinkState[];
}
/** 今の段の帯 */
export interface SeqRow extends Rect {
  step: number;
}
/** リバートの赤い×の丸 */
export interface SeqMark {
  step: number;
  event: number;
  box: string;
  x: number;
  y: number;
  op?: number;
}
/** 呼ばれた側の生存線に立てる、呼ばれてから戻るまでの帯 (Tracelyth #86) */
export interface SeqBar extends Rect {
  box: string;
  step: number;
  event: number;
  color: ColorKey;
}
/** リバートで戻った札に引く線 (Tracelyth #86)。`of` は線を引く札の `段/番号` */
export interface SeqStrike extends Rect {
  step: number;
  text: string;
  family: SceneLabel["family"];
  cx: number;
  cy: number;
  of?: string;
}
export interface SequenceLayout extends Layout {
  kind: "sequence";
  edges: SequenceEdge[];
  labels: SequenceLabel[];
  actions: SequenceAction[];
  tanks: SeqTank[];
  slots: SeqSlot[];
  links: SeqLink[];
  /** 列の頭と器と札の下の端。寄って追う形が留める帯の下の端 */
  shelf: number;
  rows: SeqRow[];
  marks: SeqMark[];
  bars: SeqBar[];
  strikes: SeqStrike[];
}

export const isSequenceLayout = (layout: Layout): layout is SequenceLayout => layout.kind === "sequence" && "rows" in layout;

/** ログの印の幅 */
export const seqCardPill = (mark: string): number => Math.max(30, textWidth(mark, SEQC_P) + SEQ_CARD.pillPadX * 2);

/** 一番外の区切り (`,`) で引数を分ける。括弧と引用符の中の区切りでは分けない */
function seqSplitArgs(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let from = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (quote !== "") {
      if (c === quote && raw[i - 1] !== "\\") quote = "";
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[" || c === "{") depth += 1;
    else if (c === ")" || c === "]" || c === "}") depth -= 1;
    else if (c === "," && depth === 0) {
      out.push(raw.slice(from, i).trim());
      from = i + 1;
    }
  }
  out.push(raw.slice(from).trim());
  return out.filter((a) => a !== "");
}

/** 字が `most` の幅に収まらない時は、真ん中を「…」で縮める */
function seqFit(raw: string, font: TextStyle, most: number): string {
  if (textWidth(raw, font) <= most) return raw;
  const chars = [...raw];
  const cut = (keep: number): string => `${chars.slice(0, Math.ceil(keep / 2)).join("")}…${chars.slice(chars.length - Math.floor(keep / 2)).join("")}`;
  let keep = chars.length - 1;
  while (keep > 2 && textWidth(cut(keep), font) > most) keep -= 1;
  return cut(keep);
}

/**
 * `名前(引数: 値, ...)` の字を札の表にする。形が違う時は undefined。値が列の id なら列の名前で書き、配列の中の id も名前にする。
 * 名前の無い引数は、何番目かを名前にする
 */
function seqCard(raw: string, owner: string, mark: string | undefined, names: Map<string, string>): SeqCard | undefined {
  const found = /^([^\s(]+)\(([\s\S]*)\)$/u.exec(raw.trim());
  if (!found) return undefined;
  const show = (v: string): string => {
    const t = v.trim();
    const named = names.get(t);
    if (named !== undefined) return named;
    if (/^\[[\s\S]*\]$/u.test(t)) return `[${seqSplitArgs(t.slice(1, -1))
      .map((x) => show(x))
      .join(", ")}]`;
    return t;
  };
  const rows = seqSplitArgs(found[2] ?? "").map((arg, i): SeqCardRow => {
    const k = arg.indexOf(": ");
    const named = k > 0 && /^[\w$.]+$/u.test(arg.slice(0, k));
    return { name: named ? arg.slice(0, k) : `#${i + 1}`, value: show(named ? arg.slice(k + 2) : arg) };
  });
  const C = SEQ_CARD;
  const nameW = Math.max(0, ...rows.map((r) => textWidth(r.name, SEQC_N)));
  const fitted = rows.map((r) => ({ name: r.name, value: seqFit(r.value, SEQC_V, C.most - C.padX * 2 - nameW - C.valueGap) }));
  return { owner, name: found[1] ?? "", ...(mark !== undefined ? { mark } : {}), rows: fitted };
}

/** 札の幅と高さと見出しの高さ */
function seqCardSize(card: SeqCard): { w: number; h: number; headH: number } {
  const C = SEQ_CARD;
  const log = card.mark !== undefined;
  const head =
    card.mark !== undefined
      ? seqCardPill(card.mark) + C.pillGap + textWidth(`${card.owner}.`, SEQC_O1) + textWidth(card.name, SEQC_F)
      : Math.max(textWidth(card.owner, SEQC_O), textWidth(card.name, SEQC_F));
  const rowW = Math.max(0, ...card.rows.map((r) => textWidth(r.name, SEQC_N) + C.valueGap + textWidth(r.value, SEQC_V)));
  const headH = log ? C.oneHead : C.twoHead;
  return { w: Math.max(head, rowW) + C.padX * 2, h: headH + (card.rows.length > 0 ? card.rows.length * C.rowH + C.rowsPad : 0), headH };
}

/** 札の字を、`**` で囲んだ太字の所とそれ以外に分ける */
function seqRuns(raw: string): SeqRun[] {
  return raw.split("**").flatMap((t, i) => (t === "" ? [] : [{ text: t, bold: i % 2 === 1 }]));
}
const seqRunsWidth = (runs: readonly SeqRun[]): number => runs.reduce((w, r) => w + textWidth(r.text, r.bold ? SEQ_BOLD : SEQ_FONT), 0);

/** 10 進の数を、桁を全て持つ整数 `n` と小数の桁の数 `scale` で表す */
interface SeqDecimal {
  n: bigint;
  scale: number;
}
/** 3 桁ごとの区切りを含む 10 進の字を、整数と小数の桁の数に分ける。読めない字は undefined */
function seqDec(raw: string): SeqDecimal | undefined {
  const found = /^(-?)(\d+)(?:\.(\d+))?$/u.exec(raw.replace(/,/gu, ""));
  if (!found) return undefined;
  const frac = found[3] ?? "";
  return { n: BigInt(`${found[1] ?? ""}${found[2] ?? ""}${frac}`), scale: frac.length };
}
function seqDecAdd(a: SeqDecimal, b: SeqDecimal, sign: 1 | -1): SeqDecimal {
  const scale = Math.max(a.scale, b.scale);
  const up = (d: SeqDecimal): bigint => d.n * 10n ** BigInt(scale - d.scale);
  return { n: up(a) + BigInt(sign) * up(b), scale };
}
/** 10 進の数を字にする。小数の終わりの 0 を落とし、整数の所は 3 桁ごとに区切る */
function seqDecText(d: SeqDecimal): string {
  const neg = d.n < 0n;
  const digits = (neg ? -d.n : d.n).toString().padStart(d.scale + 1, "0");
  const int = d.scale > 0 ? digits.slice(0, -d.scale) : digits;
  const frac = d.scale > 0 ? digits.slice(-d.scale).replace(/0+$/u, "") : "";
  return `${neg ? "-" : ""}${int.replace(/\B(?=(\d{3})+(?!\d))/gu, ",")}${frac ? `.${frac}` : ""}`;
}
const seqDecNum = (d: SeqDecimal): number => Number(seqDecText(d).replace(/,/gu, ""));

/** 書き換えの札の字 (`<名前> <前の値> → <後の値> <単位>`) を分ける。形が違う時は undefined */
function seqWrite(plain: string): SeqWrite | undefined {
  const found = /^(\S+) (?:(\S+) )?→ (\S+)(?: (\S+))?$/u.exec(plain);
  if (!found) return undefined;
  return {
    slot: found[1] ?? "",
    ...(found[2] !== undefined ? { old: found[2] } : {}),
    now: found[3] ?? "",
    ...(found[4] !== undefined ? { unit: found[4] } : {}),
  };
}
/** 札の字の間の空白の幅 */
export const seqSpace = (): number => textWidth(" ", SEQ_FONT);
const seqWriteWidth = (w: SeqWrite): number =>
  textWidth(w.slot, SEQ_FONT) +
  (w.old !== undefined ? seqSpace() + textWidth(w.old, SEQ_FONT) + seqSpace() + textWidth("→", SEQ_FONT) : 0) +
  seqSpace() +
  textWidth(w.now, SEQ_BOLD) +
  (w.unit !== undefined ? seqSpace() + textWidth(w.unit, SEQ_FONT) : 0);
/** 枠付きの札の中のログの印の幅 */
export const seqPillWidth = (mark: string): number => textWidth(mark, SEQ_SMALL) + SEQ_LOOK.pillPadX * 2;
const seqLogWidth = (log: SeqLog): number => seqPillWidth(log.mark) + SEQ_LOOK.pillGap + seqRunsWidth(log.rest);

/**
 * 長い呼び出しの札を、一番外の括弧の中の引数の区切り (`, `) で行に分ける (Tracelyth #93)。`[usdc, weth]` のような中の括弧の区切りでは折らない。
 * 1 行は `most` の幅に収め、収まらない引数は次の行の頭に置く
 */
function seqWrap(runs: readonly SeqRun[], most: number): SeqRun[][] {
  const pieces: SeqRun[] = [];
  let depth = 0;
  for (const r of runs) {
    if (r.bold) {
      pieces.push(r);
      continue;
    }
    let from = 0;
    for (let i = 0; i < r.text.length; i++) {
      const c = r.text[i];
      if (c === "(" || c === "[") depth += 1;
      if (c === ")" || c === "]") depth -= 1;
      if (c === "," && depth === 1 && r.text[i + 1] === " ") {
        pieces.push({ text: r.text.slice(from, i + 2), bold: false });
        from = i + 2;
      }
    }
    if (from < r.text.length) pieces.push({ text: r.text.slice(from), bold: false });
  }
  // 何行に折るかを先に決め、1 行を全体の幅を行の数で割った幅の近くで折る
  const widths = pieces.map((piece) => textWidth(piece.text, piece.bold ? SEQ_BOLD : SEQ_FONT));
  const total = widths.reduce((a, b) => a + b, 0);
  const aim = Math.min(most, total / Math.ceil(total / most));
  const lines: SeqRun[][] = [[]];
  let width = 0;
  for (const [k, piece] of pieces.entries()) {
    const w = widths[k] ?? 0;
    if (width > 0 && (width + w > most || width + w / 2 > aim)) {
      lines.push([]);
      width = 0;
    }
    lines[lines.length - 1]?.push(piece);
    width += w;
  }
  return lines.map((line) => line.map((r, i) => (i === line.length - 1 ? { ...r, text: r.text.replace(/\s+$/u, "") } : r)));
}

/** ストレージの値の札の名前の行。`allowance[alice][router]` は変数の名前とキーの 2 行にする */
function seqSlotLines(name: string): string[] {
  const k = name.indexOf("[");
  return k > 0 ? [name.slice(0, k), name.slice(k)] : [name];
}

/** 線の種類と札の字と札の形 */
interface SeqShape {
  self: boolean;
  money: boolean;
  kind: SeqLabelKind;
  runs: SeqRun[];
  plain: string;
  write: SeqWrite | undefined;
  log: SeqLog | undefined;
  card: SeqCard | undefined;
  size: { w: number; h: number; headH: number } | undefined;
  wrapped: SeqRun[][] | undefined;
  tw: number;
}

type EdgeEvent = Extract<DiagramModel["steps"][number]["events"][number], { type: "edge" }>;

export function layoutSequence(diagram: DiagramModel, lang: NotationLang = "ja"): SequenceLayout {
  const { sequence: Q, margin, gap } = LOOK;
  const S = SEQ_LOOK;
  const colors = boxColors(diagram);
  const listed = diagram.sequence?.lifelines ?? [];
  const order = [...listed, ...diagram.boxes.map((b) => b.id).filter((id) => !listed.includes(id))];
  const column = new Map(order.map((id, i) => [id, i]));
  const source = (id: string): DiagramModel["boxes"][number] | undefined => diagram.boxes.find((b) => b.id === id);
  const idByName = new Map(diagram.boxes.map((b) => [b.name, b.id]));
  // 列の頭の下の器と札 (Tracelyth #93)。器は hold の行の残高のトークンごと、札は hold の行の名前つきの値ごとに置く
  const holds = diagram.pipe?.holds ?? [];
  const tokens: string[] = [];
  for (const h of holds) {
    const id = "token" in h ? (idByName.get(h.token) ?? h.token) : undefined;
    if (id !== undefined && !tokens.includes(id)) tokens.push(id);
  }
  const heldTanks = order.flatMap((box) =>
    holds.flatMap((h) => ("token" in h && h.box === box ? [{ box, token: idByName.get(h.token) ?? h.token, name: h.token, start: seqDec(h.amount) }] : [])),
  );
  // 1人をキーに持つ値 (`[on: alice]`) の札は、その人の列の下に置く。書き換えの線は持ち主の列から出るので、札は持ち主を覚えておく (#107)
  const heldSlots = order.flatMap((box) =>
    holds.flatMap((h) =>
      "name" in h && h.box === box ? [{ box, col: h.link?.on !== undefined && column.has(h.link.on) ? h.link.on : box, name: h.name, start: h.value }] : [],
    ),
  );
  const heldLinks = holds.flatMap((h) =>
    "name" in h && h.link?.from !== undefined && column.has(h.link.from) && column.has(h.link.to) ? [{ ...h, link: h.link }] : [],
  );
  // 列の頭は全て同じ幅にする。頭の幅は名前と、器と札が入る幅にする
  const headW = Math.min(
    S.headMaxW,
    Math.max(
      S.headMinW,
      ...order.map((id) => {
        const b = source(id);
        const name = textWidth(b?.name ?? id, TYPE.boxName);
        const sub = b?.sub !== undefined ? textWidth(b.sub, TYPE.boxSub) : 0;
        const count = heldTanks.filter((t) => t.box === id).length;
        const shelf = count > 0 ? count * S.tankW + (count - 1) * S.tankGap + 8 : 0;
        const slot = Math.max(0, ...heldSlots.filter((x) => x.col === id).flatMap((x) => seqSlotLines(x.name).map((l) => textWidth(l, SEQ_SMALL) + 18)));
        return Math.max(S.headPadX * 2 + S.markW + S.markGap + Math.max(name, sub), shelf, slot);
      }),
    ),
  );
  const half = S.pipeW / 2;
  const names = new Map(order.map((id) => [id, source(id)?.name ?? id]));
  // 線の種類と札の字と札の形。呼び出しとログは、名前と引数の字なら表の形の札にする (Tracelyth #97)
  const shapeOf = (event: EdgeEvent): SeqShape => {
    const self = event.from === event.to;
    const block = event.block;
    const money = block === "+money" || event.carry.kind === "coin";
    const back = block === "+ret" || block === "+revert";
    const kind: SeqLabelKind = self && block === "+revert" ? "stop" : self ? "self" : money || back ? "chip" : "call";
    const runs = event.label === undefined ? [] : seqRuns(event.label);
    const plain = runs.map((r) => r.text).join("");
    // 書き換えの札は前の値と後の値を分けて描き、ログの札は最初の太字を印にする (Tracelyth #93)
    const write = block === "+write" ? seqWrite(plain) : undefined;
    const first = runs[0];
    const log =
      block === "+log" && first?.bold && runs.length > 1
        ? { mark: first.text.trim(), rest: runs.slice(1).map((r, i) => (i === 0 ? { ...r, text: r.text.replace(/^\s+/u, "") } : r)) }
        : undefined;
    const card =
      kind === "call" && runs.length > 0
        ? seqCard(plain, names.get(event.to) ?? event.to, undefined, names)
        : log && self
          ? seqCard(log.rest.map((r) => r.text).join(""), names.get(event.from) ?? event.from, log.mark, names)
          : undefined;
    const size = card ? seqCardSize(card) : undefined;
    const wrapped = !card && kind === "call" && seqRunsWidth(runs) > S.callMax ? seqWrap(runs, S.callMax) : undefined;
    const tw = write ? seqWriteWidth(write) : log ? seqLogWidth(log) : wrapped ? Math.max(...wrapped.map(seqRunsWidth)) : seqRunsWidth(runs);
    return { self, money, kind, runs, plain, write, log, card, size, wrapped, tw };
  };
  // 列の間は、列から右へ出す札 (呼び出しと戻りの札、ログと記録の書き換えとrequireの札、計算の札) が次の列の管に被らない幅まで広げる (Tracelyth #97)。
  // お金の札は送った列から受け取った列へ渡る管の上に置くので数えない
  const reach = order.map(() => 0);
  const out = (id: string, extent: number): void => {
    const i = column.get(id) ?? 0;
    reach[i] = Math.max(reach[i] ?? 0, extent);
  };
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type === "action") {
        out(event.box, half + S.noteGap + seqRunsWidth(seqRuns(event.label)) + S.chipPadX * 2);
        continue;
      }
      if (event.type !== "edge") continue;
      const sh = shapeOf(event);
      if (sh.runs.length === 0 || sh.money) continue;
      const lo = (column.get(event.from) ?? 0) <= (column.get(event.to) ?? 0) ? event.from : event.to;
      const chipW = sh.tw + S.chipPadX * 2;
      if (sh.kind === "call") out(lo, half + S.callPad + (sh.size ? sh.size.w : sh.tw + S.chipPadX / 2));
      else if (sh.kind === "chip") out(lo, half + S.callPad + chipW);
      else if (sh.kind === "stop") out(event.from, S.markR + S.selfGap + chipW);
      else out(event.from, half + S.stubW + (sh.size ? sh.size.w : chipW));
    }
  }
  const xs: number[] = [];
  order.forEach((_, i) => {
    xs.push(i === 0 ? margin + S.gutter + headW / 2 : (xs[i - 1] ?? 0) + Math.max(headW + S.columnGap, Math.ceil((reach[i - 1] ?? 0) + SEQ_CARD.clear + half)));
  });
  const xOf = (id: string): number => xs[column.get(id) ?? 0] ?? 0;
  const boxes: SceneBox[] = order.map((id, i) => {
    const b = source(id);
    const cx = xs[i] ?? 0;
    return {
      id,
      name: b?.name ?? id,
      ...(b?.sub !== undefined ? { sub: b.sub } : {}),
      ...(b?.icon !== undefined ? { icon: b.icon } : {}),
      color: colors.get(id) ?? "slate",
      x: cx - headW / 2,
      y: margin,
      w: headW,
      h: S.headH,
      cx,
      cy: margin + S.headH / 2,
    };
  });
  const headBottom = margin + S.headH;
  const tanks: SeqTank[] = [];
  const slots: SeqSlot[] = [];
  const starts = new Map<SeqTank, SeqDecimal | undefined>();
  let shelf = headBottom;
  order.forEach((id, i) => {
    const cx = xs[i] ?? 0;
    let y = headBottom + S.shelfGap;
    const mine = heldTanks.filter((t) => t.box === id);
    if (mine.length > 0) {
      const total = mine.length * S.tankW + (mine.length - 1) * S.tankGap;
      mine.forEach((t, k) => {
        const tank: SeqTank = {
          box: id,
          token: t.token,
          name: t.name,
          tone: tokens.indexOf(t.token),
          x: cx - total / 2 + k * (S.tankW + S.tankGap),
          y,
          w: S.tankW,
          h: S.tankTop + S.tankH + S.tankBottom,
          states: [],
        };
        starts.set(tank, t.start);
        tanks.push(tank);
      });
      y += S.tankTop + S.tankH + S.tankBottom + S.slotGap;
    }
    for (const x of heldSlots.filter((v) => v.col === id)) {
      const lines = seqSlotLines(x.name);
      const h = 10 + lines.length * S.slotLine + 16;
      slots.push({
        box: x.box,
        ...(x.col !== x.box ? { on: x.col } : {}),
        name: x.name,
        lines,
        x: cx - (headW - 8) / 2,
        y,
        w: headW - 8,
        h,
        states: [{ step: -1, event: -1, text: x.start }],
      });
      y += h + S.slotGap;
    }
    if (y > headBottom + S.shelfGap) shelf = Math.max(shelf, y - S.slotGap);
  });
  // 2人をキーに持つ値は、器と札の下の段に1つ目のキーの人の列から2つ目のキーの人の列への点線の矢印を引き、矢印の上の札に値を書く (#107)。
  // 横に重なる矢印は別の段に積む。札と増減の札の組が矢印の両端の間に収まらない時は、札を矢印の上に持ち上げて矢印の先を見せる。
  // 札の字は書き換えの線の札 (`allowance[Alice][Bob] 0 → 5`) から前もって読み、最初のリバートの線で始めの値に戻す
  const links: SeqLink[] = [];
  {
    const statesOf = (h: (typeof heldLinks)[number], head: string, unit: string): SeqLinkState[] => {
      const states: SeqLinkState[] = [{ step: -1, event: -1, text: `${head} ${h.value}${unit}` }];
      let now = h.value;
      let undone = false;
      diagram.steps.forEach((step, s) =>
        step.events.forEach((e, ei) => {
          if (e.type !== "edge") return;
          if (e.block === "+revert") {
            if (undone) return;
            undone = true;
            // リバートで戻った値は、書いた値から始めの値へ戻ったと書き、差の札の代わりにリバートの札を出す (Tracelyth #111)
            if (states.length > 1) states.push({ step: s, event: ei, text: `${head} ${now} → ${h.value}${unit}`, delta: UNDONE_TAG[lang], undo: true });
            return;
          }
          if (e.block !== "+write" || e.from !== h.box || e.label === undefined) return;
          const w = seqWrite(
            seqRuns(e.label)
              .map((r) => r.text)
              .join(""),
          );
          if (!w || w.slot !== h.name) return;
          const was = w.old ?? now;
          now = w.now;
          const d = linkDelta(was, now);
          states.push({ step: s, event: ei, text: `${head} ${was} → ${now}${unit}`, ...(d ? { delta: `${d}${unit}` } : {}) });
        }),
      );
      return states.map((st) => (st.delta ? { ...st, deltaW: textWidth(st.delta, SEQ_LINK_FONT) + SEQ_LINK.padX * 2 } : st));
    };
    const used: [number, number][][] = [];
    const laneH: number[] = [];
    const placed: { link: SeqLink; lane: number; lift: boolean }[] = [];
    for (const h of heldLinks) {
      const a = xOf(h.link.from);
      const b = xOf(h.link.to);
      const dir = Math.sign(b - a) || 1;
      const head = h.name.includes("[") ? h.name.slice(0, h.name.indexOf("[")) : h.name;
      const unit = h.link.unit ? ` ${h.link.unit}` : "";
      const states = statesOf(h, head, unit);
      const x1 = a + dir * half;
      const x2 = b - dir * (half + 1);
      const lo = Math.min(x1, x2);
      const hi = Math.max(x1, x2);
      const w = Math.max(...states.map((st) => textWidth(st.text, SEQ_LINK_FONT) + SEQ_LINK.padX * 2));
      const group = w + Math.max(0, ...states.map((st) => (st.deltaW ? SEQ_LINK.deltaGap + st.deltaW : 0)));
      const mid = (x1 + x2) / 2;
      const lift = hi - lo - SEQ_LINK.side * 2 < group;
      const span: [number, number] = [Math.min(lo, mid - group / 2), Math.max(hi, mid + group / 2)];
      let k = used.findIndex((lane) => lane.every(([u, v]) => span[1] + SEQ_LINK.side < u || span[0] - SEQ_LINK.side > v));
      if (k < 0) k = used.push([]) - 1;
      used[k]?.push(span);
      laneH[k] = Math.max(laneH[k] ?? 0, SEQ_LINK.h + (lift ? SEQ_LINK.lift : 0));
      const link: SeqLink = { from: h.link.from, to: h.link.to, owner: h.box, name: h.name, x1, x2, y: 0, label: { x: mid - group / 2, y: 0, w, h: SEQ_LINK.h }, right: mid + group / 2, states };
      placed.push({ link, lane: k, lift });
      links.push(link);
    }
    let top = shelf + S.slotGap + SEQ_LINK.gap;
    const tops = laneH.map((h) => {
      const at = top;
      top += h + SEQ_LINK.gap;
      return at;
    });
    for (const { link, lane, lift } of placed) {
      const at = tops[lane] ?? 0;
      link.label.y = at;
      link.y = lift ? at + SEQ_LINK.h + SEQ_LINK.lift - 2 : at + SEQ_LINK.h / 2;
    }
    if (laneH.length > 0) shelf = Math.max(shelf, top - SEQ_LINK.gap);
  }
  const shelfBottom = shelf + S.shelfGap;
  const edges: SequenceEdge[] = [];
  const labels: SequenceLabel[] = [];
  const actions: SequenceAction[] = [];
  const rows: (SeqRow & { first: number })[] = [];
  const marks: SeqMark[] = [];
  let y = shelfBottom + S.firstRow;
  let lastEnd = shelfBottom;
  diagram.steps.forEach((step, s) => {
    const top = y;
    let firstY: number | undefined;
    step.events.forEach((event, e) => {
      if (event.type === "action") {
        const runs = seqRuns(event.label);
        const line = y + S.chipH / 2;
        firstY ??= line;
        actions.push({
          step: s,
          event: e,
          box: event.box,
          text: runs.map((r) => r.text).join(""),
          runs,
          color: "violet",
          x: xOf(event.box) + half + S.noteGap,
          y: line - S.chipH / 2,
          w: seqRunsWidth(runs) + S.chipPadX * 2,
          h: S.chipH,
        });
        y = line + S.chipH / 2 + S.rowGap;
        return;
      }
      if (event.type !== "edge") return;
      const xf = xOf(event.from);
      const xt = xOf(event.to);
      const { self, money, kind, runs, plain, write, log, card, size, wrapped, tw } = shapeOf(event);
      const block = event.block;
      const added = block === undefined ? undefined : userBlock(block, "edge");
      const color = added?.color ?? edgeColor(event, colors);
      const callH = S.callH * (wrapped?.length ?? 1);
      const line =
        kind === "call"
          ? y + (size ? size.h + SEQ_CARD.lift : runs.length > 0 ? callH + S.callLift : 0)
          : kind === "stop"
            ? y + S.markR
            : size
              ? y + size.headH / 2
              : y + S.chipH / 2;
      firstY ??= line;
      const dir = Math.sign(xt - xf) || 1;
      // 線の端は生存線の管の縁で止める。管の中心まで引くと線が管の上を横切る
      const points: Point[] =
        kind === "stop"
          ? [
              [xf, line],
              [xf + S.markR, line],
            ]
          : self
            ? [
                [xf + half, line],
                [xf + half + S.stubW, line],
              ]
            : [
                [xf + dir * half, line],
                [xt - dir * (half + 1), line],
              ];
      // 線の破線は並べる時に持たせる。描く時に線の種類の登録が無くても (寄って追う形を外から描く時) 同じ線になる
      const dash = added?.shape === undefined ? undefined : USER_DASH[added.shape];
      const width = money ? S.moneyW : kind === "call" ? S.callW : LOOK.stroke.edgeOn;
      // 運ぶ物は着いた生存線の向こう側に留まって矢印の先を隠さず、出る生存線の手前側で走り出しを待つ (#3176)
      const seats: Pick<SceneEdge, "settle" | "wait"> = {};
      if (event.carry.kind !== "none") {
        const room = LOOK.slot.lifeline + carrierHalf(event.carry)[0];
        const [p0, p1] = points as [Point, Point];
        const out = Math.sign(p1[0] - p0[0]) || 1;
        seats.wait = [xf - out * room, p0[1]];
        seats.settle = [xt + out * room, p1[1]];
      }
      edges.push({
        step: s,
        event: e,
        from: event.from,
        to: event.to,
        points,
        color,
        carry: event.carry,
        ...seats,
        width,
        ...(block === undefined ? {} : { block }),
        ...(dash === undefined ? {} : { dash }),
        ...(event.op === undefined ? {} : { op: event.op }),
      });
      if (kind === "stop") marks.push({ step: s, event: e, box: event.from, x: xf, y: line, ...(event.op === undefined ? {} : { op: event.op }) });
      if (runs.length > 0) {
        const chipW = tw + S.chipPadX * 2;
        // 表の形の札は、呼び出しなら線の上に、ログなら生存線の右に置く。戻りの札は戻る先と戻った元の左の列の右に置き、列の管に被せない (Tracelyth #97)
        const rect: Rect = size
          ? { x: kind === "call" ? Math.min(xf, xt) + half + S.callPad : xf + half + S.stubW, y, w: size.w, h: size.h }
          : kind === "call"
            ? { x: Math.min(xf, xt) + half + S.callPad - S.chipPadX / 2, y: line - S.callLift - callH, w: tw + S.chipPadX, h: callH }
            : kind === "chip"
              ? { x: money ? (xf + xt) / 2 - chipW / 2 : Math.min(xf, xt) + half + S.callPad, y: line - S.chipH / 2, w: chipW, h: S.chipH }
              : kind === "stop"
                ? { x: xf + S.markR + S.selfGap, y: line - S.chipH / 2, w: chipW, h: S.chipH }
                : { x: xf + half + S.stubW, y: line - S.chipH / 2, w: chipW, h: S.chipH };
        labels.push({
          step: s,
          event: e,
          ...rect,
          text: plain,
          runs,
          family: "sans",
          color,
          kind,
          ...(write ? { write } : {}),
          ...(log ? { log } : {}),
          ...(wrapped ? { lines: wrapped } : {}),
          ...(card && size ? { card, headH: size.headH } : {}),
        });
      }
      const bottom = kind === "stop" ? line + S.markR : kind === "call" ? line + S.callW : size ? y + size.h : line + S.chipH / 2;
      y = bottom + S.rowGap;
    });
    const end = y - S.rowGap;
    lastEnd = end;
    rows.push({ step: s, x: 0, y: top - S.rowPad, w: 0, h: Math.max(0, end - top) + S.rowPad * 2, first: firstY ?? top + LOOK.badge.r });
    y = end + S.rowPad * 2 + S.stepGap;
  });
  // 器と札の値の移り (Tracelyth #93)。お金の線で送った側と受け取った側の器が、書き換えの線で札が変わり、最初のリバートの線で全部が前の値へ戻る
  const values = new Map<SeqTank, { step: number; event: number; value: SeqDecimal | undefined; undo?: boolean }[]>(
    tanks.map((t) => [t, [{ step: -1, event: -1, value: starts.get(t) }]]),
  );
  const tankNow = new Map(tanks.map((t) => [t, starts.get(t)]));
  let undone = false;
  for (const edge of edges) {
    if (edge.block === "+revert") {
      if (undone) continue;
      undone = true;
      for (const t of tanks) {
        const list = values.get(t) ?? [];
        if (list.length > 1) list.push({ step: edge.step, event: edge.event, value: starts.get(t), undo: true });
      }
      for (const x of slots) if (x.states.length > 1) x.states.push({ step: edge.step, event: edge.event, text: x.states[0]?.text ?? "", undo: true });
      continue;
    }
    const label = labels.find((l) => l.step === edge.step && l.event === edge.event);
    if (edge.block === "+money" || edge.carry.kind === "coin") {
      const found = /^([\d,]+(?:\.\d+)?) (\S+)$/u.exec(label?.text ?? "");
      const amount = found ? seqDec(found[1] ?? "") : undefined;
      const token = found ? (idByName.get(found[2] ?? "") ?? found[2]) : undefined;
      if (token !== undefined && tokens.includes(token)) edge.tone = tokens.indexOf(token);
      if (!amount) continue;
      for (const [box, sign] of [
        [edge.from, -1],
        [edge.to, 1],
      ] as const) {
        const t = tanks.find((x) => x.box === box && x.token === token);
        const now = t && tankNow.get(t);
        if (!t || !now) continue;
        const next = seqDecAdd(now, amount, sign);
        tankNow.set(t, next);
        values.get(t)?.push({ step: edge.step, event: edge.event, value: next });
      }
    }
    const written = label?.write;
    if (edge.block === "+write" && written) {
      const x = slots.find((v) => v.box === edge.from && v.name === written.slot);
      if (x) x.states.push({ step: edge.step, event: edge.event, text: written.now });
    }
  }
  // 水位は、同じトークンの器が持った一番多い量に対する割合。持っている器は少なくても見える高さにする
  for (const token of tokens) {
    const mine = tanks.filter((t) => t.token === token);
    const most = Math.max(0, ...mine.flatMap((t) => (values.get(t) ?? []).map((x) => (x.value ? seqDecNum(x.value) : 0))));
    for (const t of mine) {
      t.states = (values.get(t) ?? []).map(({ value, ...rest }) => {
        const n = value ? seqDecNum(value) : 0;
        const level = most > 0 && n > 0 ? Math.max(S.tankLeast, n / most) : 0;
        return { ...rest, text: value ? seqDecText(value) : "?", level };
      });
    }
  }
  const bottom = lastEnd + S.rowPad + Q.tail;
  const lifelines = order.map((id, i) => ({ id, x: xs[i] ?? 0, y1: shelfBottom, y2: bottom }));
  // 段の番号は段の帯の最初の行の高さで、左の列に置く。今の段の番号は紺の丸で描く
  const badges: SceneBadge[] = rows.map((r) => ({ step: r.step, x: margin + LOOK.badge.r, y: r.first, color: "blue" }));
  const layout: SequenceLayout = {
    kind: "sequence",
    width: 0,
    height: 0,
    regions: [],
    boxes,
    lifelines,
    edges,
    labels,
    actions,
    badges,
    paths: [],
    ends: [],
    tanks,
    slots,
    links,
    shelf: shelfBottom,
    rows: [],
    marks,
    bars: [],
    strikes: [],
  };
  const rights = [
    ...boxes.map((b) => b.x + b.w),
    ...links.map((l) => l.right),
    ...labels.map((l) => l.x + l.w),
    ...actions.map((a) => a.x + a.w),
    ...edges.flatMap((edge) => edge.points.map((p) => p[0])),
    ...carrierSeats(edges).map((r) => r.x + r.w),
  ];
  const width = Math.max(Math.max(...rights) + margin, stripNeed(diagram) + margin * 2);
  const strip = layoutStrip(diagram, margin, bottom + gap, width - margin * 2);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  layout.rows = rows.map(({ first: _first, ...r }) => ({ ...r, x: margin / 2, w: width - margin }));
  layout.bars = sequenceBars(layout);
  layout.strikes = sequenceStrikes(layout);
  return layout;
}

/**
 * 呼ばれた側の生存線に、呼ばれてから戻るまでの帯を立てる (Tracelyth #86)。
 * 呼び出しの線 (自分への線、お金の線、戻りの線とリバートの線でない線) が呼ばれた側に帯を開き、呼ばれた側から出る戻りの線 (+ret) かリバートの線 (+revert) が、その列で最後に開いた帯を閉じる。
 * 戻らずに終わった帯は、最後の線の下まで伸ばす。帯は、帯を開いた呼び出しの線と同じ時に見せる。
 */
function sequenceBars(layout: SequenceLayout): SeqBar[] {
  const half = LOOK.sequence.bar / 2;
  const xOf = new Map(layout.lifelines.map((l) => [l.id, l.x]));
  const open: Omit<SeqBar, "h">[] = [];
  const bars: SeqBar[] = [];
  for (const e of layout.edges) {
    if (e.from === e.to) continue;
    const y = (e.points[0] as Point)[1];
    if (e.block === "+ret" || e.block === "+revert") {
      const k = open.map((o) => o.box).lastIndexOf(e.from);
      const [o] = k >= 0 ? open.splice(k, 1) : [];
      if (o) bars.push({ ...o, h: y - o.y });
      continue;
    }
    if (e.carry.kind === "coin" || e.block === "+money") continue;
    open.push({ box: e.to, step: e.step, event: e.event, color: e.color, x: (xOf.get(e.to) ?? 0) - half, y, w: half * 2 });
  }
  const end = Math.max(0, ...layout.edges.flatMap((e) => e.points.map((p) => p[1]))) + LOOK.sequence.tail;
  for (const o of open) bars.push({ ...o, h: end - o.y });
  return bars;
}

/**
 * リバートで戻ったお金と書き換えの札に引く線 (Tracelyth #86)。最初のリバートの線 (+revert) のステップより前の、お金の線と書き換えの線 (+write) の札に引き、requireの札には引かない。
 * 線はリバートのステップから見せる。
 */
function sequenceStrikes(layout: SequenceLayout): SeqStrike[] {
  const red = layout.edges.find((e) => e.block === "+revert");
  if (!red) return [];
  const undone = new Set(
    layout.edges
      .filter((e) => e.step < red.step && (e.carry.kind === "coin" || e.block === "+money" || e.block === "+write" || e.block === "+log"))
      .map((e) => `${e.step}/${e.event}`),
  );
  const notes = layout.actions.filter((a) => a.step < red.step);
  const strike = (l: Rect & { step: number; event: number; text: string; family?: SceneLabel["family"]; card?: SeqCard; headH?: number }, of: boolean): SeqStrike => {
    const mid = l.card ? l.y + (l.headH ?? 0) / 2 : l.y + l.h / 2;
    return {
      step: red.step,
      x: l.x + 3,
      y: mid - 0.8,
      w: l.w - 6,
      h: 1.6,
      text: l.text,
      family: l.family ?? "sans",
      cx: l.x + l.w / 2,
      cy: mid,
      ...(of ? { of: `${l.step}/${l.event}` } : {}),
    };
  };
  return [...layout.labels.filter((l) => undone.has(`${l.step}/${l.event}`)).map((l) => strike(l, true)), ...notes.map((a) => strike(a, false))];
}
