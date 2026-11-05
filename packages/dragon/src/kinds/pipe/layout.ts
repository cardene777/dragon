/**
 * 配管の図の置き場所 (#3389)。見た目の元は Tracelyth の第8回の試作 (`pipes2`)。
 *
 * 関係者は段の中に出てきた順に左から 1 列に並び、出てこない関係者は宣言した順に後ろへ足す。
 * 関係者の種類は行から導く。残高の単位に名前を書かれた関係者はトークンの Contract、最初の呼び出しを呼んだ者は送り手、
 * ほかに呼ぶか呼ばれる者は Contract、どちらでもない者は口座。
 *
 * 上から順に、確認の印と今の段の変更の札の行、イベントの札の列、呼び出しの管、関係者の名札、名札の下の札 (計器、換算、取り消し、畳んだ箱)、
 * 値の札、槽、トークンごとの管を置く。呼び出しの管は深さごとに 1 段下がり、呼んだ者の名札の上から出て、呼ばれた者の名札の上に入る。
 * 槽の水位はトークンごとに量に比例させ、0 より多い量は最小の帯 (`PIPE_LOOK.tank.least`) より低くしない。
 *
 * 段の中の出来事は記法を読む所と同じ手順 (`PipeRun`) に当て、段ごとの残高と値と、変更が暫定か確定か取り消しかを作る。
 * 変更は一番外の呼び出しが戻った段で確定し、落ちた呼び出しの内側の変更は、落ちた段で取り消しの印を付けて元の値へ戻る。
 *
 * 枠の幅 (`width`) を渡し、全員を同じ幅で並べると名前が `READABLE_PX` に届かない時は、段ごとに関わらない関係者の列を細い帯に畳む。
 * `[fold]` の呼び出しの内側の段は、描く前に 1 つの段へまとめる (`foldPipe`)。まとめた段は呼び出しの管を描かず、畳んだ箱を出す。
 * 畳んだ間は、内側の段にしか出ない関係者の列と槽と値の札を描かず、内側にしか出ないトークンの管も描かない。
 * まとめた段は内側の流れを描かず、見えている関係者の槽に内側の出来事を全て当てた後の量を出す。
 * 同じトークンの管を同じ段に流れる分は、横に重なるものを管の下へ 1 本ずつずらし、槽の口も流れごとに分ける。
 * 並べ方は描き方を読まない。描く部品は `render/pipe.ts` が持つ。
 */
import type { CheckOp, PipeCheck } from "../../blocks/check/block";
import { ETH, type PipeCallKind } from "../../blocks/return/block";
import { textWidth } from "../../layout/measure";
import type { Layout, Point, Rect } from "../../layout/scene";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { READABLE_PX, type TextStyle } from "../../look/values";
import { checkPasses, isFault, keyOf, PipeRun, rateOf } from "../../pipe-run";
import type { DiagramModel, PipeFold, Step } from "../../schema";
import { DEFAULT_LANG, type NotationLang } from "../../words";

const P = PIPE_LOOK;
const T = PIPE_TYPE;

/** 変更の印。`none` は変わっていない、`provisional` は暫定、`final` は確定、`rolled` は取り消し */
export type PipeState = "none" | "provisional" | "final" | "rolled";
/** 関係者の種類 */
export type PipeRole = "sender" | "contract" | "token" | "account";

/** 配管の図の言葉。図の原本は語を持たないので、描く時の言葉で引く */
export interface PipeWords {
  checks: string;
  events: string;
  tags: Record<Exclude<PipeState, "none">, string>;
  pending: (n: number) => string;
  final: string;
  rolled: string;
  partial: (n: number) => string;
  check: string;
  convert: (rate: string) => string;
  undo: string;
  fold: (steps: number, parties: number) => string;
  open: string;
  foldTitle: (name: string) => string;
  join: (titles: readonly string[]) => string;
}

export const PIPE_TEXT: Record<NotationLang, PipeWords> = {
  ja: {
    checks: "確認",
    events: "イベント",
    tags: { provisional: "暫定", final: "確定", rolled: "取り消し" },
    pending: (n) => `暫定の変更${n}件`,
    final: "全て確定",
    rolled: "全て取り消し",
    partial: (n) => `${n}件を取り消し`,
    check: "確認",
    convert: (rate) => `換算 ${rate}`,
    undo: "取り消し",
    fold: (steps, parties) => `内側の${steps}段と${parties}人`,
    open: "押すと開く",
    foldTitle: (name) => `${name}の内側をまとめて進む`,
    join: (titles) => `${titles.join("。")}。`,
  },
  en: {
    checks: "Checks",
    events: "Events",
    tags: { provisional: "Pending", final: "Final", rolled: "Undone" },
    pending: (n) => `${n} pending ${n === 1 ? "change" : "changes"}`,
    final: "All final",
    rolled: "All undone",
    partial: (n) => `${n} undone`,
    check: "Check",
    convert: (rate) => `Convert ${rate}`,
    undo: "Undone",
    fold: (steps, parties) => `${steps} ${steps === 1 ? "step" : "steps"} and ${parties} ${parties === 1 ? "party" : "parties"} inside`,
    open: "Click to open",
    foldTitle: (name) => `Inside ${name}, folded`,
    join: (titles) => `${titles.join(". ")}.`,
  },
};

/** 比べ方の字。`>=` は `≥` のように、読む時の字にする */
export const OP_TEXT: Record<CheckOp, string> = { ">=": "≥", "<=": "≤", "==": "=", "!=": "≠", ">": ">", "<": "<" };

/** 字。`base` は基準線で、字は `x` から左寄せで書く */
export interface PipeText extends Rect {
  text: string;
  base: number;
}

/** 段の中の出来事の場所。その段で起きた物だけが持ち、描く所はこの出来事の時刻に出す */
export interface PipeAt {
  step: number;
  event?: number;
}

export interface PipeParty extends Rect {
  id: string;
  name: string;
  role: PipeRole;
  icon?: string;
}
export interface PipeColumn extends Rect {
  party: string;
  step: number;
  folded: boolean;
}
/** 段ごとの名札。`active` は段の終わりにいちばん内側で開いている呼び出しの呼ばれた者 */
export interface PipePill extends Rect {
  party: string;
  step: number;
  folded: boolean;
  active: boolean;
}
export interface PipeTank extends Rect {
  party: string;
  token: string;
  title: PipeText;
}
/** 段ごとの槽のガラス。`stub` は槽の下から管までの縦の管 */
export interface PipeGlass extends PipeTank {
  step: number;
  stub: { x: number; y1: number; y2: number };
}
export interface PipeLevel extends Rect, PipeAt {
  party: string;
  token: string;
  amount: string;
  state: PipeState;
  text: PipeText;
  was?: PipeText;
  /** ガラスの上の端の印の札 */
  tag?: PipeText & { box: Rect };
  /** 段の始まりの水位。この段で変わった槽だけが持つ */
  from?: Rect;
  /** 前の量 (`was`) の水位。前の量を持つ槽だけが持つ */
  base?: Rect;
}
export interface PipeBus {
  token: string;
  y: number;
  x1: number;
  x2: number;
  valve?: { party: string; x: number };
}
export interface PipeBusAt extends PipeBus {
  step: number;
  /** 弁から名札の下の端までの縦の点線の上の端 */
  top?: number;
}
export interface PipeBusChip extends Rect {
  token: string;
  text: PipeText;
}
export interface PipeFlow extends PipeAt {
  /** 流れた分の番号。同じ流れた分を段をまたいで引く */
  id: number;
  step: number;
  token: string;
  from: string;
  to: string;
  amount: string;
  state: PipeState;
  points: Point[];
  /** 向きの印の場所と向き (右へ流れる時 1、左へ -1) */
  arrow: { x: number; y: number; dir: 1 | -1 };
}
export interface PipeCallLane {
  index: number;
  step: number;
  event: number;
  from: string;
  to: string;
  depth: number;
  y: number;
  kind: "call" | PipeCallKind;
  width: number;
  points: Point[];
  value?: string;
  close?: { step: number; event: number; how: "return" | "revert" };
}
/** 段ごとの呼び出しの管。`opened` はこの段で開いた出来事、`shut` はこの段で閉じた出来事 */
export interface PipeLane {
  call: number;
  step: number;
  kind: "call" | PipeCallKind;
  width: number;
  points: Point[];
  state: "open" | "closed";
  how?: "return" | "revert";
  opened?: number;
  shut?: number;
}
/** 管の上の字の札。`call` は札を出す呼び出しの番号、`kind` は呼び出しの字か戻る値か */
export interface PipeTag extends Rect {
  step: number;
  event: number;
  call: number;
  kind: "call" | "return";
  text: string;
  label: PipeText;
}
export interface PipePlate extends Rect, PipeAt {
  party: string;
  name: string;
  value: string;
  state: PipeState;
  label: PipeText;
  text: PipeText;
  was?: PipeText;
  strike?: Rect;
  /** 段の始まりの値。この段で変わった札だけが持つ */
  before?: { text: PipeText; state: PipeState };
}
export interface PipeWrite {
  step: number;
  event: number;
  from: string;
  to: string;
  name: string;
  points: Point[];
}
/** 名札の下の札 (計器、換算、取り消し、畳んだ箱) の共通の欄。`title` は上の小さな字、`value` は下の大きな字 */
export interface PipeCardBox extends Rect {
  party: string;
  step: number;
  title: PipeText;
  value: PipeText;
}
export interface PipeGauge extends PipeCardBox {
  event: number;
  ok: boolean;
}
export interface PipeLamp extends Rect {
  party: string;
  step: number;
  event: number;
  ok: boolean;
  /** その段で確かめた印か */
  fresh: boolean;
}
export interface PipeCheckMark extends Rect {
  step: number;
  event: number;
  ok: boolean;
  fresh: boolean;
}
export interface PipeEventChip extends Rect, PipeAt {
  /** 出した順の番号。同じ札を段をまたいで引く */
  id: number;
  party: string;
  name: string;
  emitted: number;
  state: PipeState;
  text: PipeText;
  args?: PipeText;
}
export interface PipeConverter extends PipeCardBox {
  calc: number;
  event?: number;
  in: string;
  out: string;
  rate: string;
}
export interface PipeUndo extends PipeCardBox {
  event: number;
}
export interface PipeFoldBox extends PipeCardBox {
  call: number;
  steps: number;
  parties: number;
  text: PipeText;
}
export interface PipeRing {
  party: string;
  step: number;
  event: number;
}
/** 段ごとの右上の変更の札。`event` は確定か取り消しを起こした出来事 */
export interface PipeStatus extends Rect, PipeAt {
  kind: "pending" | "final" | "rolled" | "partial";
  text: PipeText;
}

export interface PipeLayout extends Layout {
  kind: "pipe";
  /** 列を畳んだか。畳んだ図は段ごとに関わらない関係者の列を細い帯にする */
  arrangement: "wide" | "narrow";
  parties: PipeParty[];
  columns: PipeColumn[];
  pills: PipePill[];
  tanks: PipeTank[];
  glasses: PipeGlass[];
  levels: PipeLevel[];
  buses: PipeBus[];
  pipes: PipeBusAt[];
  busChips: PipeBusChip[];
  flows: PipeFlow[];
  calls: PipeCallLane[];
  lanes: PipeLane[];
  tags: PipeTag[];
  returns: PipeTag[];
  plates: PipePlate[];
  writes: PipeWrite[];
  gauges: PipeGauge[];
  lamps: PipeLamp[];
  checks: PipeCheckMark[];
  events: PipeEventChip[];
  converters: PipeConverter[];
  undos: PipeUndo[];
  folds: PipeFoldBox[];
  rings: PipeRing[];
  statuses: PipeStatus[];
  /** 図の上の端の行の字 (「確認」と「イベント」)。その印を持つ図だけが持つ */
  heads: { checks?: PipeText; events?: PipeText };
  /** 段ごとに動く関係者の列を囲む所。寄って追う窓が段ごとに見る */
  focus: (Rect & { step: number })[];
}

export interface PipeLayoutOptions {
  lang?: NotationLang;
  /** 描く枠の幅。全員を横に並べると名前が読めない幅では、段ごとに関わらない列を畳む */
  width?: number;
}

// ---- 字

function textAt(text: string, x: number, base: number, style: TextStyle, anchor: "start" | "middle" = "start"): PipeText {
  const w = textWidth(text, style);
  return { text, x: anchor === "middle" ? x - w / 2 : x, y: base - style.size * 0.8, w, h: style.size, base };
}

/** 高さ `h` の札の上の端 `top` から、字の真ん中を札の真ん中に置く基準線 */
const middleBase = (top: number, h: number, style: TextStyle): number => top + h / 2 + style.size * 0.35;

// ---- 畳む

/**
 * `[fold]` の呼び出しの内側の段を 1 つの段にまとめる。内側の段は、畳んだ呼び出しを開いた段の次の段から閉じた段の前の段まで。
 * `open` に番号 (出てきた順) を持つ呼び出しは畳まない。まとめた段は内側の段の出来事を順に持ち、題と本文は描く時の言葉で作る。
 * 畳んだ呼び出しの内側の `[fold]` の呼び出しは、外の箱に入るので畳まない。
 * 箱ごとに、内側の段にだけ出て、まとめなかった段に出ない関係者を `hidden` に持つ。宣言しただけで段に出ない関係者は内側に数えない
 */
export function foldPipe(diagram: DiagramModel, open: readonly number[] = [], lang: NotationLang = DEFAULT_LANG): DiagramModel {
  interface Opened {
    index: number;
    step: number;
    from: string;
    to: string;
    fold: boolean;
    close?: number;
  }
  const calls: Opened[] = [];
  const stack: Opened[] = [];
  diagram.steps.forEach((step, s) => {
    for (const e of step.events) {
      if (e.type === "call") {
        const call: Opened = { index: calls.length, step: s, from: e.from, to: e.to, fold: e.fold === true };
        calls.push(call);
        stack.push(call);
      } else if (e.type === "return" || e.type === "revert") {
        const closed = stack.pop();
        if (closed) closed.close = s;
      }
    }
  });
  const words = PIPE_TEXT[lang];
  const names = new Map(diagram.boxes.map((b) => [b.id, b.name]));
  const steps: Step[] = [];
  const folds: PipeFold[] = [];
  let s = 0;
  while (s < diagram.steps.length) {
    steps.push(diagram.steps[s] as Step);
    const folded = calls.find((c) => c.fold && c.step === s && c.close !== undefined && c.close - s >= 2 && !open.includes(c.index));
    if (!folded || folded.close === undefined) {
      s++;
      continue;
    }
    const inner = diagram.steps.slice(s + 1, folded.close);
    folds.push({ call: folded.index, step: steps.length, from: s + 1, to: folded.close - 1, hidden: [] });
    steps.push({
      title: words.foldTitle(names.get(folded.to) ?? folded.to),
      body: words.join(inner.map((step) => step.title)),
      events: inner.flatMap((step) => step.events),
    });
    s = folded.close;
  }
  if (folds.length === 0) return diagram;
  const boxed = new Set(folds.map((f) => f.step));
  const outside = new Set(steps.flatMap((step, k) => (boxed.has(k) ? [] : step.events.flatMap(partiesOf))));
  for (const fold of folds) fold.hidden = [...new Set((steps[fold.step] as Step).events.flatMap(partiesOf))].filter((id) => !outside.has(id));
  return { ...diagram, steps, pipe: { holds: diagram.pipe?.holds ?? [], folds } };
}

/** 出来事に出る関係者。呼び出しの両端と、行の頭の者と、`move` の送り手と受け手 */
function partiesOf(e: Step["events"][number]): string[] {
  if (e.type === "call") return [e.from, e.to];
  if (!("box" in e)) return [];
  return e.type === "move" ? [e.box, e.from, e.to] : [e.box];
}

// ---- 段ごとの値を当てる

interface CallRec {
  index: number;
  step: number;
  event: number;
  from: string;
  to: string;
  depth: number;
  kind: "call" | PipeCallKind;
  label?: string;
  value?: string;
  inner: boolean;
  close?: { step: number; event: number; how: "return" | "revert" };
}
interface FlowRec {
  id: number;
  step: number;
  event: number;
  token: string;
  from: string;
  to: string;
  amount: string;
}
interface EmitRec {
  id: number;
  step: number;
  event: number;
  party: string;
  name: string;
  args?: string[];
}
interface CheckRec {
  step: number;
  event: number;
  party: string;
  ok: boolean;
  check: Pick<PipeCheck, "left" | "op" | "right">;
}
interface CalcRec {
  step: number;
  event: number;
  party: string;
  input: string;
  output: string;
  rate: string;
}
interface Snap {
  balances: Map<string, string>;
  values: Map<string, string>;
  /** 鍵の印。鍵は `b<持ち主>|<トークン>`、`v<持ち主>|<名前>`、`e<イベントの番号>`、`f<流れた分の番号>` */
  states: Map<string, PipeState>;
  was: Map<string, string>;
  /** この段で変わった鍵と、変えた出来事 */
  changed: Map<string, number>;
  emitted: number[];
  active?: string;
  status?: { kind: PipeStatus["kind"]; count: number; event?: number };
}

interface Simulated {
  calls: CallRec[];
  flows: FlowRec[];
  emits: EmitRec[];
  checks: CheckRec[];
  calcs: CalcRec[];
  writes: { step: number; event: number; from: string; to: string; name: string }[];
  reverts: { step: number; event: number; party: string; reason?: string }[];
  returns: { step: number; event: number; call: number; value: string }[];
  snaps: Snap[];
  tokens: Map<string, string>;
}

function simulate(diagram: DiagramModel, foldSteps: ReadonlySet<number>): Simulated {
  const holds = diagram.pipe?.holds ?? [];
  const run = new PipeRun(diagram.boxes, holds);
  const out: Simulated = { calls: [], flows: [], emits: [], checks: [], calcs: [], writes: [], reverts: [], returns: [], snaps: [], tokens: new Map(run.tokens) };
  const base = new Map<string, string>();
  for (const [k, v] of run.balances) base.set(`b${k}`, v);
  for (const [k, v] of run.values) base.set(`v${k}`, v);
  const prevBase = new Map<string, string>();
  const sets: Set<string>[] = [new Set()];
  const finals = new Set<string>();
  const opened: CallRec[] = [];
  const valueOf = (k: string): string | undefined => (k.startsWith("b") ? run.balances.get(k.slice(1)) : k.startsWith("v") ? run.values.get(k.slice(1)) : undefined);
  const stored = (k: string): boolean => k.startsWith("b") || k.startsWith("v");

  diagram.steps.forEach((step, s) => {
    const rolled = new Map<string, string>();
    const finalNow = new Set<string>();
    const changed = new Map<string, number>();
    let statusEvent: number | undefined;
    const touch = (k: string, e: number): void => {
      (sets[sets.length - 1] as Set<string>).add(k);
      finals.delete(k);
      rolled.delete(k);
      if (!changed.has(k)) changed.set(k, e);
    };
    step.events.forEach((e, ei) => {
      switch (e.type) {
        case "call": {
          const rec: CallRec = {
            index: out.calls.length,
            step: s,
            event: ei,
            from: e.from,
            to: e.to,
            depth: run.frames.length,
            kind: e.call ?? "call",
            inner: foldSteps.has(s),
            ...(e.label !== undefined ? { label: e.label } : {}),
            ...(e.value !== undefined ? { value: e.value } : {}),
          };
          out.calls.push(rec);
          if (run.call(e)) break;
          opened.push(rec);
          sets.push(new Set());
          if (e.value !== undefined) {
            const id = out.flows.length;
            out.flows.push({ id, step: s, event: ei, token: ETH, from: e.from, to: e.to, amount: e.value });
            touch(`b${keyOf(e.from, ETH)}`, ei);
            touch(`b${keyOf(e.to, ETH)}`, ei);
            touch(`f${id}`, ei);
          }
          break;
        }
        case "return":
        case "revert": {
          const before = run.snapshot();
          const closed = run.close(e.box, e.type);
          if (isFault(closed)) break;
          const rec = opened.pop();
          if (rec) rec.close = { step: s, event: ei, how: e.type };
          const inside = sets.pop() ?? new Set<string>();
          if (e.type === "return") {
            for (const k of inside) (sets[sets.length - 1] as Set<string>).add(k);
            if (e.value !== undefined && rec) out.returns.push({ step: s, event: ei, call: rec.index, value: e.value });
            if (run.frames.length === 0) {
              const root = sets[0] as Set<string>;
              if ([...root].some(stored)) statusEvent = ei;
              for (const k of root) {
                finalNow.add(k);
                finals.add(k);
                if (stored(k)) {
                  prevBase.set(k, base.get(k) ?? "");
                  base.set(k, valueOf(k) ?? "");
                }
                if (!changed.has(k)) changed.set(k, ei);
              }
              root.clear();
            }
          } else {
            for (const k of inside) {
              rolled.set(k, k.startsWith("b") ? (before.balances.get(k.slice(1)) ?? "") : k.startsWith("v") ? (before.values.get(k.slice(1)) ?? "") : "");
              changed.set(k, ei);
            }
            if ([...inside].some(stored)) statusEvent = ei;
            out.reverts.push({ step: s, event: ei, party: e.box, ...(e.reason !== undefined ? { reason: e.reason } : {}) });
          }
          break;
        }
        case "move": {
          if (run.move(e)) break;
          const token = run.tokens.get(e.box) ?? "";
          const id = out.flows.length;
          out.flows.push({ id, step: s, event: ei, token, from: e.from, to: e.to, amount: e.amount });
          touch(`b${keyOf(e.from, token)}`, ei);
          touch(`b${keyOf(e.to, token)}`, ei);
          touch(`f${id}`, ei);
          break;
        }
        case "write": {
          const owner = run.write(e);
          if (isFault(owner)) break;
          touch(`v${keyOf(owner, e.name)}`, ei);
          out.writes.push({ step: s, event: ei, from: e.box, to: owner, name: e.name });
          break;
        }
        case "emit": {
          const id = run.emit();
          if (isFault(id)) break;
          touch(`e${id}`, ei);
          out.emits.push({ id, step: s, event: ei, party: e.box, name: e.name, ...(e.args ? { args: e.args } : {}) });
          break;
        }
        case "check":
          out.checks.push({ step: s, event: ei, party: e.box, ok: checkPasses(e), check: e });
          break;
        case "calc":
          out.calcs.push({ step: s, event: ei, party: e.box, input: e.in, output: e.out, rate: rateOf(e.in, e.out) });
          break;
        default:
          break;
      }
    });
    const pending = (k: string): boolean => sets.some((set) => set.has(k));
    const stateOf = (k: string): PipeState => (rolled.has(k) ? "rolled" : pending(k) ? "provisional" : finals.has(k) ? "final" : "none");
    const states = new Map<string, PipeState>();
    const was = new Map<string, string>();
    const keys = [
      ...[...run.balances.keys()].map((k) => `b${k}`),
      ...[...run.values.keys()].map((k) => `v${k}`),
      ...out.emits.map((x) => `e${x.id}`),
      ...out.flows.map((x) => `f${x.id}`),
    ];
    for (const k of keys) {
      const state = stateOf(k);
      states.set(k, state);
      if (!stored(k)) continue;
      const now = valueOf(k);
      const old = state === "rolled" ? rolled.get(k) : state === "provisional" ? base.get(k) : state === "final" ? prevBase.get(k) : undefined;
      if (old !== undefined && old !== now) was.set(k, old);
    }
    const rolledStored = [...rolled.keys()].filter(stored).length;
    const pendingStored = keys.filter((k) => stored(k) && pending(k)).length;
    const status: Snap["status"] =
      rolledStored > 0
        ? { kind: run.frames.length === 0 ? "rolled" : "partial", count: rolledStored, ...(statusEvent !== undefined ? { event: statusEvent } : {}) }
        : [...finalNow].some(stored)
          ? { kind: "final", count: 0, ...(statusEvent !== undefined ? { event: statusEvent } : {}) }
          : pendingStored > 0
            ? { kind: "pending", count: pendingStored }
            : undefined;
    const top = run.frames[run.frames.length - 1];
    out.snaps.push({
      balances: new Map(run.balances),
      values: new Map(run.values),
      states,
      was,
      changed,
      emitted: [...new Set([...run.emitted, ...[...rolled.keys()].filter((k) => k.startsWith("e")).map((k) => Number(k.slice(1)))])].sort((a, b) => a - b),
      ...(top ? { active: top.to } : {}),
      ...(status ? { status } : {}),
    });
  });
  return out;
}

// ---- 並べる

/** 段ごとの列。`x` は列の左端、`w` は列の幅 */
interface Col {
  x: number;
  w: number;
  folded: boolean;
}

/** 名札の下の札の大きさ */
interface CardSize {
  party: string;
  w: number;
}

const amountNumber = (amount: string): number => Number(amount);

export function layoutPipe(diagram: DiagramModel, options: PipeLayoutOptions = {}): PipeLayout {
  const lang = options.lang ?? DEFAULT_LANG;
  const words = PIPE_TEXT[lang];
  const folds = diagram.pipe?.folds ?? [];
  const foldSteps = new Set(folds.map((f) => f.step));
  const hidden = new Set(folds.flatMap((f) => f.hidden));
  const sim = simulate(diagram, foldSteps);
  const steps = diagram.steps.length;
  const stepList = Array.from({ length: steps }, (_, s) => s);
  const holds = diagram.pipe?.holds ?? [];
  const names = new Map(diagram.boxes.map((b) => [b.id, b.name]));
  const nameOf = (id: string): string => names.get(id) ?? id;

  // 関係者の並びと種類。畳んだ箱の内側にしか出ない関係者は並べない
  const order: string[] = [];
  const declared = new Set(diagram.boxes.map((b) => b.id));
  const see = (id: string): void => {
    if (declared.has(id) && !hidden.has(id) && !order.includes(id)) order.push(id);
  };
  for (const step of diagram.steps) for (const e of step.events) for (const id of partiesOf(e)) see(id);
  for (const b of diagram.boxes) see(b.id);
  const callers = new Set(sim.calls.flatMap((c) => [c.from, c.to]));
  const sender = sim.calls[0]?.from;
  const roleOf = (id: string): PipeRole => (sim.tokens.has(id) ? "token" : id === sender ? "sender" : callers.has(id) ? "contract" : "account");

  // 槽と値の札の並びと幅
  const tanksOf = new Map<string, string[]>(order.map((id) => [id, []]));
  const platesOf = new Map<string, string[]>(order.map((id) => [id, []]));
  for (const h of holds) {
    if ("token" in h) tanksOf.get(h.box)?.push(h.token);
    else platesOf.get(h.box)?.push(h.name);
  }
  // 畳んだ間は、Contract が内側にしか出ず、見えている関係者の量も変えないトークンの槽と管を描かない
  const tokenParty = new Map([...sim.tokens].map(([id, token]) => [token, id]));
  const varies = (party: string, token: string): boolean => {
    const initial = holds.flatMap((h) => ("token" in h && h.box === party && h.token === token ? [h.amount] : []))[0];
    return new Set([initial, ...sim.snaps.map((snap) => snap.balances.get(keyOf(party, token)))]).size > 1;
  };
  const gone = new Set(
    [...tokenParty].filter(([token, id]) => hidden.has(id) && !order.some((party) => (tanksOf.get(party) ?? []).includes(token) && varies(party, token))).map(([token]) => token),
  );
  for (const [party, list] of tanksOf) tanksOf.set(party, list.filter((token) => !gone.has(token)));
  const tokens = [...new Set(holds.flatMap((h) => ("token" in h && !hidden.has(h.box) && !gone.has(h.token) ? [h.token] : [])))];
  const historyOf = (key: string): string[] => {
    const all = new Set<string>();
    for (const snap of sim.snaps) {
      const now = key.startsWith("b") ? snap.balances.get(key.slice(1)) : snap.values.get(key.slice(1));
      if (now !== undefined) all.add(now);
      const was = snap.was.get(key);
      if (was !== undefined) all.add(was);
    }
    for (const h of holds) {
      if ("token" in h && key === `b${keyOf(h.box, h.token)}`) all.add(h.amount);
      if ("name" in h && key === `v${keyOf(h.box, h.name)}`) all.add(h.value);
    }
    return [...all];
  };
  const widest = (texts: readonly string[], style: TextStyle): number => Math.max(0, ...texts.map((t) => textWidth(t, style)));
  const tagWidest = Math.max(...Object.values(words.tags).map((t) => textWidth(t, T.tag))) + P.tank.tagPadX * 2;
  const tankW = new Map<string, number>();
  for (const [party, list] of tanksOf)
    for (const token of list) {
      const history = historyOf(`b${keyOf(party, token)}`);
      tankW.set(keyOf(party, token), Math.max(P.tank.w, textWidth(token, T.tankTitle), widest(history, T.amount), widest(history, T.was), tagWidest));
    }
  const plateW = new Map<string, number>();
  for (const [party, list] of platesOf) {
    if (list.length === 0) continue;
    const need = list.map((name) => {
      const history = historyOf(`v${keyOf(party, name)}`);
      return Math.max(textWidth(name, T.plateName), widest(history, T.plateValue) + P.plate.wasGap + widest(history, T.was));
    });
    plateW.set(party, Math.max(...need) + P.plate.padX * 2);
  }
  const groupW = (party: string): number => {
    const list = tanksOf.get(party) ?? [];
    return list.reduce((sum, token) => sum + (tankW.get(keyOf(party, token)) ?? P.tank.w), 0) + Math.max(0, list.length - 1) * P.tank.gap;
  };
  const pillW = new Map(order.map((id) => [id, P.pill.padX * 2 + P.pill.avatar + P.pill.gap + textWidth(nameOf(id), T.party)]));
  const colW = new Map(order.map((id) => [id, Math.max(pillW.get(id) ?? 0, groupW(id), plateW.get(id) ?? 0)]));

  // 名札の下の札。段ごとに、確認の計器、換算、取り消し、畳んだ箱を出す
  const cardW = (title: string, value: string, titleStyle: TextStyle = T.cardTitle, valueStyle: TextStyle = T.cardValue): number =>
    P.card.padX * 2 + P.card.icon + P.card.gap + Math.max(textWidth(title, titleStyle), textWidth(value, valueStyle));
  const gaugeValue = (c: CheckRec): string => `${c.check.left} ${OP_TEXT[c.check.op]} ${c.check.right}`;
  const converterUntil = (c: CalcRec): number =>
    sim.checks.find((k) => k.party === c.party && (k.step > c.step || (k.step === c.step && k.event > c.event)))?.step ?? c.step;
  const cardsAt = stepList.map((): (CardSize & { make: (x: number, y: number) => void })[] => []);
  const gauges: PipeGauge[] = [];
  const converters: PipeConverter[] = [];
  const undos: PipeUndo[] = [];
  const foldBoxes: PipeFoldBox[] = [];
  const cardRect = (x: number, y: number, w: number): Rect => ({ x, y, w, h: P.card.h });
  const cardTexts = (x: number, y: number, title: string, value: string, valueStyle: TextStyle = T.cardValue): { title: PipeText; value: PipeText } => {
    const left = x + P.card.padX + P.card.icon + P.card.gap;
    return { title: textAt(title, left, y + P.card.titleY, T.cardTitle), value: textAt(value, left, y + P.card.valueY, valueStyle) };
  };
  for (const s of stepList) {
    const list = cardsAt[s] as (CardSize & { make: (x: number, y: number) => void })[];
    const fold = folds.find((f) => f.step === s);
    if (fold) {
      const call = sim.calls[fold.call];
      const party = call?.to ?? "";
      const count = fold.to - fold.from + 1;
      const text = words.fold(count, fold.hidden.length);
      const w = cardW(words.open, text, T.hint, T.fold);
      list.push({
        party,
        w,
        make: (x, y) => {
          const t = cardTexts(x, y, words.open, text, T.fold);
          foldBoxes.push({ ...cardRect(x, y, w), party, step: s, call: fold.call, steps: count, parties: fold.hidden.length, title: t.title, value: t.value, text: t.value });
        },
      });
      continue;
    }
    for (const c of sim.checks.filter((k) => k.step === s)) {
      const w = cardW(words.check, gaugeValue(c)) + P.card.icon;
      list.push({
        party: c.party,
        w,
        make: (x, y) => gauges.push({ ...cardRect(x, y, w), ...cardTexts(x, y, words.check, gaugeValue(c)), party: c.party, step: s, event: c.event, ok: c.ok }),
      });
    }
    for (const c of sim.calcs.filter((k) => k.step <= s && converterUntil(k) >= s && !foldSteps.has(k.step))) {
      const value = `${c.input} → ${c.output}`;
      const title = words.convert(c.rate);
      const w = cardW(title, value);
      list.push({
        party: c.party,
        w,
        make: (x, y) =>
          converters.push({
            ...cardRect(x, y, w),
            ...cardTexts(x, y, title, value),
            party: c.party,
            step: s,
            calc: c.step,
            ...(c.step === s ? { event: c.event } : {}),
            in: c.input,
            out: c.output,
            rate: c.rate,
          }),
      });
    }
    for (const r of sim.reverts.filter((k) => k.step === s)) {
      const value = r.reason ?? "revert";
      const w = cardW(words.undo, value);
      list.push({
        party: r.party,
        w,
        make: (x, y) => undos.push({ ...cardRect(x, y, w), ...cardTexts(x, y, words.undo, value), party: r.party, step: s, event: r.event }),
      });
    }
  }

  // 段ごとに関わる関係者。呼び出しの両端と行の頭の者と、move の送り手と受け手と、書き替えた札の持ち主
  const involved = diagram.steps.map((step, s) => {
    const set = new Set(step.events.flatMap(partiesOf));
    for (const w of sim.writes.filter((x) => x.step === s)) set.add(w.to);
    return set;
  });

  // 横の並び
  const busChipW = new Map(tokens.map((t) => [t, P.bus.chipPadX * 2 + P.bus.chip / 2 + P.bus.chipPadX + textWidth(t, T.bus)]));
  const gutter = tokens.length > 0 ? P.margin + Math.max(...busChipW.values()) + P.bus.chipGap : P.margin;
  const place = (folded: (id: string) => boolean): { cols: Map<string, Col>; right: number } => {
    const cols = new Map<string, Col>();
    let x = gutter;
    order.forEach((id, i) => {
      const fold = folded(id);
      const w = fold ? P.pill.strip : (colW.get(id) ?? 0);
      cols.set(id, { x, w, folded: fold });
      const next = order[i + 1];
      x += w + (fold || (next !== undefined && folded(next)) ? P.lane.port / 2 : P.colGap);
    });
    return { cols, right: x };
  };
  const wide = place(() => false);
  // 札が左の端からはみ出す分だけ列を右へずらす
  const centerOf = (col: Col | undefined): number => (col ? col.x + col.w / 2 : 0);
  const shift = Math.max(0, ...stepList.flatMap((s) => (cardsAt[s] ?? []).map((c) => P.margin - (centerOf(wide.cols.get(c.party)) - c.w / 2))));
  for (const col of wide.cols.values()) col.x += shift;
  const checksLabelW = sim.checks.length > 0 ? textWidth(words.checks, T.head) + P.head.labelGap : 0;
  const markCount = sim.checks.length;
  const statusW = (status: Snap["status"]): number =>
    status === undefined ? 0 : P.status.padX * 2 + P.status.icon + P.status.gap + textWidth(statusText(status), T.status);
  const statusText = (status: NonNullable<Snap["status"]>): string =>
    status.kind === "pending" ? words.pending(status.count) : status.kind === "final" ? words.final : status.kind === "rolled" ? words.rolled : words.partial(status.count);
  const headNeed = P.margin * 2 + checksLabelW + markCount * (P.head.mark + P.head.gap) + P.colGap + Math.max(0, ...sim.snaps.map((snap) => statusW(snap.status)));
  const eventsLabelW = sim.emits.length > 0 ? textWidth(words.events, T.head) + P.head.labelGap : 0;
  const chipTextOf = (e: EmitRec): string => `${nameOf(e.party)}.${e.name}`;
  const argsOf = (e: EmitRec): string | undefined => (e.args && e.args.length > 0 ? e.args.join(", ") : undefined);
  const chipW = (e: EmitRec, withArgs: boolean): number => {
    const args = withArgs ? argsOf(e) : undefined;
    return P.chip.padX * 2 + textWidth(chipTextOf(e), T.chip) + (args ? P.chip.argsGap + textWidth(args, T.args) : 0);
  };
  const chipNeed = P.margin * 2 + eventsLabelW + Math.max(0, ...sim.emits.map((e) => chipW(e, true)));
  const cardRight = Math.max(0, ...stepList.flatMap((s) => (cardsAt[s] ?? []).map((c) => centerOf(wide.cols.get(c.party)) + c.w / 2 + P.margin)));
  const fullWidth = Math.max(wide.right + shift - P.colGap + P.margin, cardRight, headNeed, chipNeed);
  const narrow = options.width !== undefined && (options.width / fullWidth) * T.party.size < READABLE_PX;
  const geometry = stepList.map((s) => (narrow ? place((id) => !(involved[s] as Set<string>).has(id)) : wide));
  const width = narrow ? Math.max(headNeed, chipNeed, ...geometry.map((g) => g.right - P.lane.port / 2 + P.margin)) : fullWidth;
  const colAt = (s: number, id: string): Col => (geometry[s] as { cols: Map<string, Col> }).cols.get(id) ?? { x: 0, w: 0, folded: true };
  const midAt = (s: number, id: string): number => centerOf(colAt(s, id));
  const tankX = (s: number, party: string, token: string): number => {
    const col = colAt(s, party);
    const list = tanksOf.get(party) ?? [];
    let x = col.x + (col.w - groupW(party)) / 2;
    for (const t of list) {
      if (t === token) return x;
      x += (tankW.get(keyOf(party, t)) ?? P.tank.w) + P.tank.gap;
    }
    return x;
  };
  const mouthAt = (s: number, party: string, token: string): number => tankX(s, party, token) + (tankW.get(keyOf(party, token)) ?? P.tank.w) / 2;

  // 流れた分の道筋。段ごとに、暫定と取り消しの分と、その段で確定した分を描く。まとめた段の内側の流れと、畳んだ列に触れる流れは描かない。
  // 同じトークンの流れは、槽の口を分ける。口は左へ行く分を短い順に、右へ行く分を長い順に、左から並べる。
  // 横に重なる流れは短い順に管から下へ 1 本ずつずらし、内に収まる流れより外の流れを下に置く。外の流れの縦の線は、内の流れの横の線を横切らない
  const routes = new Map<string, { fx: number; tx: number; track: number }>();
  const shownAt = stepList.map((s) => {
    const snap = sim.snaps[s] as Snap;
    return sim.flows.filter((f) => {
      const state = snap.states.get(`f${f.id}`);
      if (foldSteps.has(f.step) || f.step > s || colAt(s, f.from).folded || colAt(s, f.to).folded) return false;
      return state === "provisional" || state === "rolled" || (state === "final" && snap.changed.has(`f${f.id}`));
    });
  });
  const deepest = new Map<string, number>();
  for (const s of stepList)
    for (const token of new Set((shownAt[s] ?? []).map((f) => f.token))) {
      const same = (shownAt[s] ?? []).filter((f) => f.token === token);
      const ends = new Map<string, { key: string; other: number }[]>();
      for (const f of same) {
        ends.set(f.from, [...(ends.get(f.from) ?? []), { key: `${f.id}>`, other: mouthAt(s, f.to, token) }]);
        ends.set(f.to, [...(ends.get(f.to) ?? []), { key: `${f.id}<`, other: mouthAt(s, f.from, token) }]);
      }
      const xs = new Map<string, number>();
      for (const [party, list] of ends) {
        const mid = mouthAt(s, party, token);
        const sorted = [...list].sort((a, b) => Number(a.other >= mid) - Number(b.other >= mid) || b.other - a.other);
        const room = (tankW.get(keyOf(party, token)) ?? P.tank.w) - P.tank.inner * 2 - P.flow.width;
        const gap = sorted.length > 1 ? Math.min(P.flow.track, room / (sorted.length - 1)) : 0;
        sorted.forEach((e, k) => xs.set(e.key, mid + (k - (sorted.length - 1) / 2) * gap));
      }
      const placed: { lo: number; hi: number; track: number }[] = [];
      const spans = same.map((f) => {
        const fx = xs.get(`${f.id}>`) ?? 0;
        const tx = xs.get(`${f.id}<`) ?? 0;
        return { id: f.id, fx, tx, lo: Math.min(fx, tx), hi: Math.max(fx, tx) };
      });
      for (const span of [...spans].sort((a, b) => a.hi - a.lo - (b.hi - b.lo) || a.id - b.id)) {
        const near = placed.filter((p) => p.lo < span.hi + P.flow.track && span.lo < p.hi + P.flow.track);
        let track = Math.max(0, ...near.filter((p) => p.lo >= span.lo && p.hi <= span.hi).map((p) => p.track + 1));
        while (near.some((p) => p.track === track)) track++;
        placed.push({ lo: span.lo, hi: span.hi, track });
        routes.set(`${s}|${span.id}`, { fx: span.fx, tx: span.tx, track });
        deepest.set(token, Math.max(deepest.get(token) ?? 0, track));
      }
    }

  // 縦の帯
  const headY = P.margin;
  let y = headY + P.head.h;
  const chipsTop = y + P.zoneGap;
  const chipLeft = P.margin + eventsLabelW;
  const chipRows = stepList.map((s) => {
    const shown = (sim.snaps[s] as Snap).emitted;
    const rows: { id: number; x: number; row: number; w: number }[] = [];
    let x = chipLeft;
    let row = 0;
    for (const id of shown) {
      const e = sim.emits[id] as EmitRec;
      const w = chipW(e, e.step === s);
      if (x > chipLeft && x + w > width - P.margin) {
        row++;
        x = chipLeft;
      }
      rows.push({ id, x, row, w });
      x += w + P.chip.gap;
    }
    return rows;
  });
  const rowCount = Math.max(0, ...chipRows.map((rows) => Math.max(0, ...rows.map((r) => r.row + 1))));
  if (rowCount > 0) y = chipsTop + rowCount * P.chip.h + (rowCount - 1) * P.chip.rowGap;
  const shownCalls = sim.calls.filter((c) => !c.inner);
  const laneTop = y + P.zoneGap + P.lane.room;
  const maxDepth = Math.max(0, ...shownCalls.map((c) => c.depth));
  const pillY = shownCalls.length > 0 ? laneTop + maxDepth * P.lane.pitch + P.lane.below : y + P.zoneGap;
  const pillBottom = pillY + P.pill.h;
  const cardTop = pillBottom + P.card.top;

  // 名札の下の札を段ごとに行へ置く。前の札と横に重なる札は次の行へ
  let cardRows = 0;
  for (const s of stepList) {
    const placed: { x: number; w: number; row: number }[] = [];
    for (const card of cardsAt[s] ?? []) {
      const x = Math.min(width - P.margin - card.w, Math.max(P.margin, midAt(s, card.party) - card.w / 2));
      let row = 0;
      while (placed.some((p) => p.row === row && x < p.x + p.w + P.card.gap && p.x < x + card.w + P.card.gap)) row++;
      placed.push({ x, w: card.w, row });
      cardRows = Math.max(cardRows, row + 1);
      card.make(x, cardTop + row * (P.card.h + P.card.gap));
    }
  }
  const plateTop = cardTop + cardRows * (P.card.h + P.card.gap);
  const plateRows = Math.max(0, ...[...platesOf.values()].map((list) => list.length));
  const tankTop = plateTop + plateRows * (P.plate.h + P.plate.gap);
  const glassY = tankTop + P.tank.wasY + P.tank.below;
  const anyTank = [...tanksOf.values()].some((list) => list.length > 0);
  const glassBottom = glassY + P.tank.h;
  // トークンごとの管。下へずらした流れの分だけ、次の管を下げる
  const busY = new Map<string, number>();
  let busNext = glassBottom + P.bus.top;
  for (const token of tokens) {
    busY.set(token, busNext);
    busNext += P.bus.pitch + Math.max(0, (deepest.get(token) ?? 0) - 1) * P.flow.track;
  }
  const lastToken = tokens[tokens.length - 1] ?? "";
  const busBottom = (busY.get(lastToken) ?? 0) + Math.max(P.bus.width / 2, (deepest.get(lastToken) ?? 0) * P.flow.track + P.flow.width / 2);
  const height = anyTank ? busBottom + P.margin : Math.max(plateTop, tankTop - P.plate.gap) + P.margin;

  // 段ごとの名札と列
  const roles = new Map(order.map((id) => [id, roleOf(id)]));
  const pillAt = (s: number, id: string): Rect => {
    const col = colAt(s, id);
    const w = col.folded ? col.w : (pillW.get(id) ?? 0);
    return { x: col.x + (col.w - w) / 2, y: pillY, w, h: P.pill.h };
  };
  const columns: PipeColumn[] = [];
  const pills: PipePill[] = [];
  for (const s of stepList)
    for (const id of order) {
      const col = colAt(s, id);
      columns.push({ party: id, step: s, x: col.x, y: pillY, w: col.w, h: height - P.margin - pillY, folded: col.folded });
      pills.push({ ...pillAt(s, id), party: id, step: s, folded: col.folded, active: (sim.snaps[s] as Snap).active === id });
    }
  const parties: PipeParty[] = order.map((id) => {
    const box = diagram.boxes.find((b) => b.id === id);
    return { ...pillAt(0, id), id, name: nameOf(id), role: roles.get(id) ?? "account", ...(box?.icon ? { icon: box.icon } : {}) };
  });

  // 槽と水位
  // 水位の物差しは、並べた関係者の量だけで作る
  const scale = new Map(
    tokens.map((token) => {
      const amounts = sim.snaps.flatMap((snap) =>
        [...snap.balances].filter(([k]) => k.endsWith(`|${token}`) && !hidden.has(k.slice(0, -token.length - 1))).map(([, v]) => amountNumber(v)),
      );
      const initial = holds.flatMap((h) => ("token" in h && h.token === token && !hidden.has(h.box) ? [amountNumber(h.amount)] : []));
      return [token, Math.max(0, ...amounts, ...initial)];
    }),
  );
  const room = P.tank.h - P.tank.inner * 2;
  const levelH = (token: string, amount: string): number => {
    const most = scale.get(token) ?? 0;
    const n = amountNumber(amount);
    if (!(n > 0) || most <= 0) return 0;
    return Math.min(room, Math.max(P.tank.least, (n / most) * room));
  };
  const glassAt = (s: number, party: string, token: string): Rect => ({ x: tankX(s, party, token), y: glassY, w: tankW.get(keyOf(party, token)) ?? P.tank.w, h: P.tank.h });
  const liquid = (glass: Rect, token: string, amount: string): Rect => {
    const h = levelH(token, amount);
    return { x: glass.x + P.tank.inner, y: glass.y + glass.h - P.tank.inner - h, w: glass.w - P.tank.inner * 2, h };
  };
  const tanks: PipeTank[] = [];
  const glasses: PipeGlass[] = [];
  const levels: PipeLevel[] = [];
  for (const party of order)
    for (const token of tanksOf.get(party) ?? []) {
      const key = `b${keyOf(party, token)}`;
      for (const s of stepList) {
        const glass = glassAt(s, party, token);
        const mid = glass.x + glass.w / 2;
        const title = textAt(token, mid, tankTop + P.tank.titleY, T.tankTitle, "middle");
        if (s === 0) tanks.push({ ...glass, party, token, title });
        glasses.push({ ...glass, party, token, title, step: s, stub: { x: mid, y1: glass.y + glass.h, y2: busY.get(token) ?? glass.y + glass.h } });
        const snap = sim.snaps[s] as Snap;
        const amount = snap.balances.get(keyOf(party, token)) ?? "0";
        const state = snap.states.get(key) ?? "none";
        const old = snap.was.get(key);
        const changedAt = snap.changed.get(key);
        const prev = s > 0 ? (sim.snaps[s - 1] as Snap).balances.get(keyOf(party, token)) : undefined;
        const tagText = state === "none" ? undefined : words.tags[state];
        const tagW = tagText ? textWidth(tagText, T.tag) + P.tank.tagPadX * 2 : 0;
        const tagBox: Rect = { x: mid - tagW / 2, y: glass.y - P.tank.tag / 2, w: tagW, h: P.tank.tag };
        levels.push({
          ...liquid(glass, token, amount),
          party,
          token,
          step: s,
          amount,
          state,
          text: textAt(amount, mid, tankTop + P.tank.amountY, T.amount, "middle"),
          ...(old !== undefined ? { was: textAt(old, mid, tankTop + P.tank.wasY, T.was, "middle"), base: liquid(glass, token, old) } : {}),
          ...(tagText ? { tag: { ...textAt(tagText, mid, middleBase(tagBox.y, tagBox.h, T.tag), T.tag, "middle"), box: tagBox } } : {}),
          ...(changedAt !== undefined ? { event: changedAt } : {}),
          ...(changedAt !== undefined && prev !== undefined && prev !== amount ? { from: liquid(glass, token, prev) } : {}),
        });
      }
    }

  // 管と弁
  const busAt = (s: number, token: string): PipeBusAt => {
    const owners = order.filter((id) => (tanksOf.get(id) ?? []).includes(token));
    const centers = owners.map((id) => {
      const g = glassAt(s, id, token);
      return g.x + g.w / 2;
    });
    const valveParty = token === ETH ? undefined : tokenParty.get(token);
    const valveX = valveParty !== undefined && order.includes(valveParty) ? midAt(s, valveParty) : undefined;
    const right = Math.max(...centers, valveX ?? Number.NEGATIVE_INFINITY) + P.lane.port;
    return {
      token,
      step: s,
      y: busY.get(token) ?? 0,
      x1: gutter - P.bus.chipGap / 2,
      x2: Math.min(width - P.margin, right),
      ...(valveParty !== undefined && valveX !== undefined ? { valve: { party: valveParty, x: valveX }, top: pillBottom } : {}),
    };
  };
  const pipes: PipeBusAt[] = anyTank ? stepList.flatMap((s) => tokens.map((t) => busAt(s, t))) : [];
  const buses: PipeBus[] = pipes.filter((b) => b.step === 0).map(({ token, y: by, x1, x2, valve }) => ({ token, y: by, x1, x2, ...(valve ? { valve } : {}) }));
  const busChips: PipeBusChip[] = anyTank
    ? tokens.map((token) => {
        const by = busY.get(token) ?? 0;
        const w = busChipW.get(token) ?? 0;
        const box: Rect = { x: P.margin, y: by - P.bus.chip / 2, w, h: P.bus.chip };
        return { ...box, token, text: textAt(token, box.x + P.bus.chipPadX + P.bus.chip / 2, middleBase(box.y, box.h, T.bus), T.bus) };
      })
    : [];

  // 流れた分
  const flows: PipeFlow[] = stepList.flatMap((s) =>
    (shownAt[s] ?? []).map((f): PipeFlow => {
      const snap = sim.snaps[s] as Snap;
      const { fx, tx, track } = routes.get(`${s}|${f.id}`) ?? { fx: mouthAt(s, f.from, f.token), tx: mouthAt(s, f.to, f.token), track: 0 };
      const from = glassAt(s, f.from, f.token);
      const to = glassAt(s, f.to, f.token);
      const by = (busY.get(f.token) ?? 0) + track * P.flow.track;
      const changedAt = snap.changed.get(`f${f.id}`);
      return {
        id: f.id,
        step: s,
        token: f.token,
        from: f.from,
        to: f.to,
        amount: f.amount,
        state: snap.states.get(`f${f.id}`) ?? "none",
        points: [
          [fx, from.y + from.h],
          [fx, by],
          [tx, by],
          [tx, to.y + to.h],
        ],
        arrow: { x: (fx + tx) / 2, y: by, dir: tx >= fx ? 1 : -1 },
        ...(changedAt !== undefined ? { event: changedAt } : {}),
      };
    }),
  );

  // 呼び出しの管。名札ごとに口を呼び出しの順に並べ、名札の上の端に等しく割る
  const ports = new Map<string, string[]>();
  for (const c of shownCalls) {
    ports.set(c.from, [...(ports.get(c.from) ?? []), `${c.index}>`]);
    ports.set(c.to, [...(ports.get(c.to) ?? []), `${c.index}<`]);
  }
  const portX = (s: number, party: string, key: string): number => {
    const pill = pillAt(s, party);
    const list = ports.get(party) ?? [];
    const k = list.indexOf(key);
    if (list.length <= 1 || pill.w <= P.lane.port * 2) return pill.x + pill.w / 2;
    return pill.x + P.lane.port + (k * (pill.w - P.lane.port * 2)) / (list.length - 1);
  };
  const laneY = (depth: number): number => laneTop + depth * P.lane.pitch;
  const lanePoints = (s: number, c: CallRec): Point[] => {
    const fx = portX(s, c.from, `${c.index}>`);
    const tx = portX(s, c.to, `${c.index}<`);
    const ly = laneY(c.depth);
    return [
      [fx, pillY],
      [fx, ly],
      [tx, ly],
      [tx, pillY],
    ];
  };
  const widthOf = (kind: CallRec["kind"]): number => (kind === "static" ? P.lane.width / 2 : P.lane.width);
  const calls: PipeCallLane[] = shownCalls.map((c) => ({
    index: c.index,
    step: c.step,
    event: c.event,
    from: c.from,
    to: c.to,
    depth: c.depth,
    y: laneY(c.depth),
    kind: c.kind,
    width: widthOf(c.kind),
    points: lanePoints(c.step, c),
    ...(c.value !== undefined ? { value: c.value } : {}),
    ...(c.close ? { close: c.close } : {}),
  }));
  const lanes: PipeLane[] = [];
  for (const s of stepList)
    for (const c of shownCalls) {
      if (c.step > s) continue;
      const closed = c.close !== undefined && c.close.step <= s;
      lanes.push({
        call: c.index,
        step: s,
        kind: c.kind,
        width: widthOf(c.kind),
        points: lanePoints(s, c),
        state: closed ? "closed" : "open",
        ...(closed && c.close ? { how: c.close.how } : {}),
        ...(c.step === s ? { opened: c.event } : {}),
        ...(c.close?.step === s ? { shut: c.close.event } : {}),
      });
    }

  // 管の上の字の札。呼び出しの字と ETH、戻る値
  const tags: PipeTag[] = [];
  const tagOn = (s: number, c: CallRec, event: number, kind: PipeTag["kind"], text: string): void => {
    const pts = lanePoints(s, c);
    const [fx] = pts[0] as Point;
    const [tx] = pts[3] as Point;
    const w = textWidth(text, T.lane) + P.lane.tagPadX * 2;
    const x = Math.min(width - P.margin - w, Math.max(P.margin, (fx + tx) / 2 - w / 2));
    const top = laneY(c.depth) - P.lane.tagGap - P.lane.tagH;
    tags.push({ x, y: top, w, h: P.lane.tagH, step: s, event, call: c.index, kind, text, label: textAt(text, x + P.lane.tagPadX, middleBase(top, P.lane.tagH, T.lane), T.lane) });
  };
  for (const c of shownCalls) {
    const text = [c.label, c.value !== undefined ? `+${c.value} ${ETH}` : undefined].filter((t) => t !== undefined && t !== "").join(" ");
    if (text !== "") tagOn(c.step, c, c.event, "call", text);
  }
  for (const r of sim.returns) {
    const c = sim.calls[r.call];
    if (c && !c.inner) tagOn(r.step, c, r.event, "return", r.value);
  }
  tags.sort((a, b) => a.step - b.step || a.event - b.event);
  const returns = tags.filter((t) => t.kind === "return");

  // 値の札
  const plates: PipePlate[] = [];
  const plateX = (s: number, party: string): number => {
    const col = colAt(s, party);
    return col.x + (col.w - (plateW.get(party) ?? 0)) / 2;
  };
  const plateAt = (s: number, party: string, name: string): Rect => ({
    x: plateX(s, party),
    y: plateTop + (platesOf.get(party) ?? []).indexOf(name) * (P.plate.h + P.plate.gap),
    w: plateW.get(party) ?? 0,
    h: P.plate.h,
  });
  for (const party of order)
    for (const name of platesOf.get(party) ?? []) {
      const key = `v${keyOf(party, name)}`;
      for (const s of stepList) {
        const snap = sim.snaps[s] as Snap;
        const box = plateAt(s, party, name);
        const value = snap.values.get(keyOf(party, name)) ?? "";
        const state = snap.states.get(key) ?? "none";
        const old = snap.was.get(key);
        const left = box.x + P.plate.padX;
        const text = textAt(value, left, box.y + P.plate.valueY, T.plateValue);
        const was = old !== undefined ? textAt(old, text.x + text.w + P.plate.wasGap, box.y + P.plate.valueY, T.was) : undefined;
        const changedAt = snap.changed.get(key);
        const prevSnap = s > 0 ? (sim.snaps[s - 1] as Snap) : undefined;
        const prev = prevSnap?.values.get(keyOf(party, name));
        plates.push({
          ...box,
          party,
          name,
          step: s,
          value,
          state,
          label: textAt(name, left, box.y + P.plate.nameY, T.plateName),
          text,
          ...(was ? { was, strike: { x: was.x - 1, y: was.y + was.h * 0.55, w: was.w + 2, h: 1.25 } } : {}),
          ...(changedAt !== undefined ? { event: changedAt } : {}),
          ...(changedAt !== undefined && prev !== undefined && prevSnap
            ? { before: { text: textAt(prev, left, box.y + P.plate.valueY, T.plateValue), state: prevSnap.states.get(key) ?? "none" } }
            : {}),
        });
      }
    }
  const writes: PipeWrite[] = sim.writes
    .filter((w) => !foldSteps.has(w.step))
    .map((w) => {
      const plate = plateAt(w.step, w.to, w.name);
      const wx = midAt(w.step, w.from);
      const px = plate.x + plate.w / 2;
      const turn = pillBottom + P.card.top / 2;
      return {
        ...w,
        points:
          w.from === w.to
            ? [
                [wx, pillBottom],
                [wx, plate.y],
              ]
            : [
                [wx, pillBottom],
                [wx, turn],
                [px, turn],
                [px, plate.y],
              ],
      };
    });

  // 確認の印。行う者の名札の右上の角に印を並べ、図の上の端の行にも並べる
  const lamps: PipeLamp[] = [];
  const checks: PipeCheckMark[] = [];
  const marksLeft = P.margin + checksLabelW;
  for (const s of stepList) {
    const done = sim.checks.filter((c) => c.step <= s);
    done.forEach((c, i) => {
      checks.push({ x: marksLeft + i * (P.head.mark + P.head.gap), y: headY + (P.head.h - P.head.mark) / 2, w: P.head.mark, h: P.head.mark, step: s, event: c.event, ok: c.ok, fresh: c.step === s });
    });
    for (const party of order) {
      const own = done.filter((c) => c.party === party);
      if (own.length === 0) continue;
      const pill = pillAt(s, party);
      const span = Math.max(0, pill.w / 3 - P.pill.lamp);
      const stepX = own.length > 1 ? Math.min(P.pill.lampStep, span / (own.length - 1)) : 0;
      own.forEach((c, i) => {
        const right = pill.x + pill.w - P.pill.lamp / 2 - (own.length - 1 - i) * stepX;
        lamps.push({ x: right - P.pill.lamp / 2, y: pill.y - P.pill.lamp / 2 + P.pill.lampY, w: P.pill.lamp, h: P.pill.lamp, party, step: s, event: c.event, ok: c.ok, fresh: c.step === s && !foldSteps.has(s) });
      });
    }
  }

  // イベントの札
  const events: PipeEventChip[] = [];
  for (const s of stepList) {
    const snap = sim.snaps[s] as Snap;
    for (const r of chipRows[s] ?? []) {
      const e = sim.emits[r.id] as EmitRec;
      const top = chipsTop + r.row * (P.chip.h + P.chip.rowGap);
      const text = textAt(chipTextOf(e), r.x + P.chip.padX, middleBase(top, P.chip.h, T.chip), T.chip);
      const args = e.step === s ? argsOf(e) : undefined;
      const changedAt = snap.changed.get(`e${e.id}`);
      events.push({
        id: e.id,
        x: r.x,
        y: top,
        w: r.w,
        h: P.chip.h,
        party: e.party,
        name: e.name,
        step: s,
        emitted: e.step,
        state: snap.states.get(`e${e.id}`) ?? "none",
        text,
        ...(args ? { args: textAt(args, text.x + text.w + P.chip.argsGap, middleBase(top, P.chip.h, T.args), T.args) } : {}),
        ...(changedAt !== undefined ? { event: changedAt } : {}),
      });
    }
  }
  const rings: PipeRing[] = sim.emits.filter((e) => !foldSteps.has(e.step)).map((e) => ({ party: e.party, step: e.step, event: e.event }));

  // 右上の変更の札
  const statuses: PipeStatus[] = stepList.flatMap((s) => {
    const status = (sim.snaps[s] as Snap).status;
    if (!status) return [];
    const w = statusW(status);
    const box: Rect = { x: width - P.margin - w, y: headY + (P.head.h - P.status.h) / 2, w, h: P.status.h };
    return [
      {
        ...box,
        step: s,
        kind: status.kind,
        text: textAt(statusText(status), box.x + P.status.padX + P.status.icon + P.status.gap, middleBase(box.y, box.h, T.status), T.status),
        ...(status.event !== undefined ? { event: status.event } : {}),
      },
    ];
  });
  const heads: PipeLayout["heads"] = {
    ...(sim.checks.length > 0 ? { checks: textAt(words.checks, P.margin, middleBase(headY, P.head.h, T.head), T.head) } : {}),
    ...(sim.emits.length > 0 ? { events: textAt(words.events, P.margin, middleBase(chipsTop, P.chip.h, T.head), T.head) } : {}),
  };
  const focus = stepList.flatMap((s) => {
    const cols = order.filter((id) => (involved[s] as Set<string>).has(id)).map((id) => colAt(s, id));
    if (cols.length === 0) return [];
    const x = Math.min(...cols.map((c) => c.x));
    return [{ step: s, x, y: P.margin, w: Math.max(...cols.map((c) => c.x + c.w)) - x, h: height - P.margin * 2 }];
  });

  return {
    kind: "pipe",
    arrangement: narrow ? "narrow" : "wide",
    width,
    height,
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    parties,
    columns,
    pills,
    tanks,
    glasses,
    levels,
    buses,
    pipes,
    busChips,
    flows,
    calls,
    lanes,
    tags,
    returns,
    plates,
    writes,
    gauges,
    lamps,
    checks,
    events,
    converters,
    undos,
    folds: foldBoxes,
    rings,
    statuses,
    heads,
    focus,
  };
}
