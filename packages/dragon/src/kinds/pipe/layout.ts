/**
 * 配管の図の置き場所 (#3389)。見た目の元は Tracelyth の第6回の試作の「4 配管」(#3398)。
 *
 * 関係者の種類は行から導く。残高の単位に名前を書かれた関係者はトークンの Contract、最初の呼び出しを呼んだ者は送り手、
 * ほかに呼ぶか呼ばれる者は Contract、どちらでもない者は口座。
 * 送り手と呼ばれない口座は丸の名札で一番上の行に、呼ばれる Contract は最初に呼ばれた深さの行に箱で置き、トークンの Contract はトークンの箱にする。
 *
 * 下の段に、槽か値の札を持つ関係者 (送り手を左の端に、ほかは宣言した順) の槽と値の札をまとめて左から並べ、持ち主の名札をその真上に置く。
 * 槽を持たない関係者は、呼ぶ相手と呼ばれる相手の真ん中に置き、同じ行の名札と重なれば空いた所へずらす。
 * 槽の水位はトークンごとに量に比例させ、一番多い量を高さの 8 割にし、0 より多い量は最小の帯 (`PIPE_LOOK.tank.least`) より低くしない。
 *
 * 値の管は、流れが全て隣の槽どうしを結ぶ図では槽の横を結ぶ管にし、トークンの箱をその管の弁の真上に置く。
 * ほかの図は、トークンごとの本管を槽の上に通し、トークンの箱を本管の上に並べる。
 * 呼び出しの管は、呼んだ者ごとに 1 本の本管を引き、呼ぶ相手ごとに枝を分け、枝の根元に弁を置く。確かめる者の計器は、その者を呼んだ枝の上に載せる。
 * 段ごとに 1 つの吹き出しで、その段の動きを大きな字で出す。吹き出しは名札と槽と槽の下の数に重ならない所に置く。
 *
 * 段の中の出来事は記法を読む所と同じ手順 (`PipeRun`) に当て、段ごとの残高と値と、変更が暫定か確定か取り消しかを作る。
 * 変更は一番外の呼び出しが戻った段で確定し、落ちた呼び出しの内側の変更は、落ちた段で取り消しの印を付けて元の値へ戻る。
 *
 * 図は縮めずに横に長いまま並べる。枠より広い図は、再生の部品が枠の中を横に送って見せる (#3398)。
 * `[fold]` の呼び出しの内側の段は、描く前に 1 つの段へまとめる (`foldPipe`)。まとめた段は内側の呼び出しの管を描かず、畳んだ箱を出す。
 * 畳んだ間は、内側の段にしか出ない関係者の名札と槽と値の札を描かず、内側にしか出ないトークンの管も描かない。
 * まとめた段は内側の流れを描かず、見えている関係者の槽に内側の出来事を全て当てた後の量を出す。
 * 並べ方は描き方を読まない。描く部品は `render/pipe.ts` とブロックの描き方が持つ。
 */
import { ETH } from "../../blocks/return/block";
import { textWidth } from "../../layout/measure";
import type { Layout, Point, Rect } from "../../layout/scene";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import type { TextStyle } from "../../look/values";
import { checkPasses, isFault, keyOf, PipeRun, rateOf } from "../../pipe-run";
import type { CheckOp, DiagramModel, PipeCallKind, PipeCheck, PipeFold, Step } from "../../schema";
import { DEFAULT_LANG, type NotationLang } from "../../words";

const P = PIPE_LOOK;
const T = PIPE_TYPE;

/** 変更の印。`none` は変わっていない、`provisional` は暫定、`final` は確定、`rolled` は取り消し */
export type PipeState = "none" | "provisional" | "final" | "rolled";
/** 関係者の種類 */
export type PipeRole = "sender" | "contract" | "token" | "account";
/** 名札の形。`round` は丸の名札、`cabinet` は Contract の箱、`token` はトークンの箱 */
export type PipeShape = "round" | "cabinet" | "token";

/** 配管の図の言葉。図の原本は語を持たないので、描く時の言葉で引く */
export interface PipeWords {
  events: string;
  tags: Record<Exclude<PipeState, "none">, string>;
  undo: string;
  call: string;
  back: string;
  returned: string;
  moves: (name: string) => string;
  emitted: string;
  fold: (steps: number, parties: number) => string;
  open: string;
  foldTitle: (name: string) => string;
  join: (titles: readonly string[]) => string;
}

export const PIPE_TEXT: Record<NotationLang, PipeWords> = {
  ja: {
    events: "イベント",
    tags: { provisional: "暫定", final: "確定", rolled: "取り消し" },
    undo: "取り消し",
    call: "呼び出し",
    back: "戻り",
    returned: "戻った",
    moves: (name) => `${name}が移す`,
    emitted: "イベント",
    fold: (steps, parties) => `内側の${steps}段と${parties}人`,
    open: "押すと開く",
    foldTitle: (name) => `${name}の内側をまとめて進む`,
    join: (titles) => `${titles.join("。")}。`,
  },
  en: {
    events: "Events",
    tags: { provisional: "Pending", final: "Final", rolled: "Undone" },
    undo: "Undone",
    call: "Call",
    back: "Return",
    returned: "Returned",
    moves: (name) => `${name} moves`,
    emitted: "Event",
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
  shape: PipeShape;
  /** 名札の行。一番上が 0。トークンの箱は持たない */
  row?: number;
  /** 名前の字。丸の名札は丸の下、箱は箱の中に書く */
  label: PipeText;
  /** 槽か値の札を持つか */
  holder: boolean;
}
export interface PipeColumn extends Rect {
  party: string;
  step: number;
  folded: boolean;
}
/** 段ごとの名札。`active` は段の終わりにいちばん内側で開いている呼び出しの呼ばれた者、`involved` はその段の出来事に出る者 */
export interface PipePill extends Rect {
  party: string;
  step: number;
  folded: boolean;
  active: boolean;
  involved: boolean;
}
export interface PipeTank extends Rect {
  party: string;
  token: string;
  title: PipeText;
  /** 液の色の番号。トークンごとに 3 つの色を順に使う */
  tone: number;
}
/** 段ごとの槽 */
export interface PipeGlass extends PipeTank {
  step: number;
}
export interface PipeLevel extends Rect, PipeAt {
  party: string;
  token: string;
  amount: string;
  state: PipeState;
  /** 槽の下の大きな数。3 桁ごとに区切る */
  text: PipeText;
  /** 前の数。変わった段から確定するまでと、確定と取り消しの段に出す */
  was?: PipeText;
  /** 前の数の消し線 */
  strike?: Rect;
  /** 前の数に添える暫定か確定か取り消しの語 */
  tag?: PipeText;
  /** 前の量の水位。前の数を持つ槽だけが持つ */
  base?: Rect;
  /** 段の始まりの水位。この段で変わった槽だけが持つ */
  from?: Rect;
}
export interface PipeBus {
  token: string;
  y: number;
  x1: number;
  x2: number;
  /** 値の管の通し方。`side` は隣の槽の横を結ぶ管、`main` は槽の上に通す本管 */
  mode: "side" | "main";
  /** トークンの Contract の弁。`ETH` の管と、トークンの箱を描かない管は持たない */
  valve?: { party: string; x: number; y: number };
  /** 本管から槽へ下りる管。`x` に下りて `y` で槽に入る */
  drops: { x: number; y: number }[];
}
export interface PipeBusAt extends PipeBus {
  step: number;
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
  tone: number;
  /** この段で流れたか。流れた段は斜線の液の塊が管を通り抜ける */
  fresh: boolean;
}
export interface PipeCallLane {
  index: number;
  step: number;
  event: number;
  from: string;
  to: string;
  depth: number;
  /** 呼んだ者の本管の高さ */
  y: number;
  kind: "call" | PipeCallKind;
  width: number;
  /** 呼んだ者の真ん中から本管を通り、枝の端まで */
  points: Point[];
  /** 光る管の道。呼んだ者の名札を出た所から、枝の端まで */
  lit: Point[];
  value?: string;
  close?: { step: number; event: number; how: "return" | "revert" };
}
/** 本管の枝。弁 (`valve`) は枝の根元の近くに置き、`vertical` は枝が縦に走るか */
export interface PipeBranch {
  to: string;
  points: Point[];
  valve: { x: number; y: number; vertical: boolean };
}
/** 同じ関係者から出る呼び出しの本管 */
export interface PipeMain {
  from: string;
  y: number;
  points: Point[];
  branches: PipeBranch[];
}
/** 段ごとの開いている呼び出し。`opened` はこの段で開いた出来事、`shut` はこの段で閉じた出来事 */
export interface PipeLane {
  call: number;
  step: number;
  from: string;
  to: string;
  kind: "call" | PipeCallKind;
  width: number;
  points: Point[];
  opened?: number;
  shut?: number;
}
export interface PipePlate extends Rect, PipeAt {
  party: string;
  name: string;
  value: string;
  state: PipeState;
  /** トークンの箱の中の値か */
  boxed: boolean;
  label: PipeText;
  text: PipeText;
  was?: PipeText;
  strike?: Rect;
  /** 前の値と今の値の間の矢印。トークンの箱の中の値だけが持つ */
  arrow?: PipeText;
  /** 前の値に添える語。トークンの箱の外の値だけが持つ */
  tag?: PipeText;
}
export interface PipeWrite {
  step: number;
  event: number;
  from: string;
  to: string;
  name: string;
  points: Point[];
}
/** 計器。`on` は載せる管 (`call` は呼び出しの管、`value` は値の管、`party` は呼ばれない者の名札の横) */
export interface PipeGauge extends Rect {
  party: string;
  step: number;
  event: number;
  ok: boolean;
  on: "call" | "value" | "party";
  cx: number;
  cy: number;
  r: number;
  /** その段で確かめたか。確かめた段は針が振れて印が付く */
  fresh: boolean;
  /** 段の始まりと終わりの針の向き (度) */
  from: number;
  angle: number;
  /** 通ったかの印 */
  lamp: { x: number; y: number; r: number };
  /** 値の管から計器までの軸 */
  stem?: { y1: number; y2: number };
  /** 確かめた後に計器の上に残す式。値の管の計器だけが持つ */
  read?: PipeText;
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
/** 変換器。`calc` を行う関係者の 2 つの槽の間に、全ての段で置き、計算した段だけ `active` */
export interface PipeConverter extends Rect {
  party: string;
  step: number;
  calc: number;
  event?: number;
  in: string;
  out: string;
  rate: string;
  active: boolean;
  cx: number;
  cy: number;
  r: number;
  /** 左の槽の右の縁と右の槽の左の縁。変換器と槽を短い管で結ぶ */
  left: number;
  right: number;
}
/** 2 つ以上の槽を持つ関係者の槽の点線の囲い */
export interface PipeHousing extends Rect {
  party: string;
}
/** 名札から自分の槽へ下りる点線 */
export interface PipeTie {
  party: string;
  x: number;
  y1: number;
  y2: number;
}
export interface PipeFoldBox extends Rect {
  party: string;
  step: number;
  call: number;
  steps: number;
  parties: number;
  title: PipeText;
  value: PipeText;
  text: PipeText;
}
export interface PipeRing {
  party: string;
  step: number;
  event: number;
}
/** 吹き出しの色の役。呼び出しと戻り、確かめる、値の動き、確定、取り消しと落ちた確認、イベント */
export type PipeTone = "call" | "check" | "value" | "good" | "bad" | "event";
/** 段ごとの吹き出し。`kind` はその段で吹き出しが出す出来事の種類、`tag` は上の小さな語、`text` は下の大きな字 */
export interface PipeCallout extends Rect, PipeAt {
  kind: string;
  tone: PipeTone;
  mono: boolean;
  tag: PipeText;
  text: PipeText;
}

export interface PipeLayout extends Layout {
  kind: "pipe";
  /** 縮めずに横に長いまま並べる */
  arrangement: "wide";
  parties: PipeParty[];
  columns: PipeColumn[];
  pills: PipePill[];
  tanks: PipeTank[];
  glasses: PipeGlass[];
  levels: PipeLevel[];
  buses: PipeBus[];
  pipes: PipeBusAt[];
  flows: PipeFlow[];
  calls: PipeCallLane[];
  mains: PipeMain[];
  lanes: PipeLane[];
  plates: PipePlate[];
  writes: PipeWrite[];
  gauges: PipeGauge[];
  /** 図の上の確認の印。第6回の形は計器に結果を残すので、図の上には描かない */
  checks: [];
  events: PipeEventChip[];
  converters: PipeConverter[];
  housings: PipeHousing[];
  ties: PipeTie[];
  folds: PipeFoldBox[];
  rings: PipeRing[];
  callouts: PipeCallout[];
  /** 図の上の端の行の字 (「イベント」)。イベントを出す図だけが持つ */
  heads: { events?: PipeText };
  /** 段ごとに動く関係者を囲む所。再生の部品が横に送る時と、寄って追う窓が段ごとに見る */
  focus: (Rect & { step: number })[];
}

export interface PipeLayoutOptions {
  lang?: NotationLang;
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
  status?: { kind: "pending" | "final" | "rolled" | "partial"; count: number; event?: number };
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

/** 量の字を 3 桁ごとに区切る (#3398)。数でない字はそのまま */
export function grouped(amount: string): string {
  const m = /^(-?)(\d+)(\.\d+)?$/u.exec(amount);
  return m ? `${m[1] ?? ""}${(m[2] ?? "").replace(/\B(?=(\d{3})+(?!\d))/gu, ",")}${m[3] ?? ""}` : amount;
}

const amountNumber = (amount: string | undefined): number => {
  const n = Number(amount);
  return Number.isFinite(n) ? n : 0;
};
const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
/** 2 つの四角が離れているか。触れているだけの物も重なりに数える */
const clear = (a: Rect, b: Rect): boolean => a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h;

/** 槽と値の札をまとめた関係者の列 */
interface Col {
  id: string;
  left: number;
  right: number;
  cx: number;
  tanks: { token: string; x: number; w: number }[];
  plates: { name: string; x: number; w: number }[];
}
/** 値の管を横に通す区間。`a` が左、`b` が右の関係者 */
interface Seg {
  a: string;
  b: string;
  token: string;
}

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
  const declaredAt = new Map(diagram.boxes.map((b, i) => [b.id, i]));
  const snapOf = (s: number): Snap => sim.snaps[s] as Snap;

  // 関係者の並びと種類と形。畳んだ箱の内側にしか出ない関係者は並べない
  const order: string[] = [];
  const declared = new Set(diagram.boxes.map((b) => b.id));
  const see = (id: string): void => {
    if (declared.has(id) && !hidden.has(id) && !order.includes(id)) order.push(id);
  };
  for (const step of diagram.steps) for (const e of step.events) for (const id of partiesOf(e)) see(id);
  for (const b of diagram.boxes) see(b.id);
  const visible = new Set(order);
  const isBox = (id: string): boolean => sim.tokens.has(id);
  const callers = new Set(sim.calls.flatMap((c) => [c.from, c.to]));
  const callees = new Set(sim.calls.map((c) => c.to));
  const sender = sim.calls[0]?.from;
  const roleOf = (id: string): PipeRole => (isBox(id) ? "token" : id === sender ? "sender" : callers.has(id) ? "contract" : "account");
  const shapeOf = (id: string): PipeShape => (isBox(id) ? "token" : id === sender || !callees.has(id) ? "round" : "cabinet");
  const depthOf = new Map<string, number>(sender === undefined ? [] : [[sender, 0]]);
  for (const c of sim.calls) if (!depthOf.has(c.to)) depthOf.set(c.to, c.depth);
  const rowOf = (id: string): number => (shapeOf(id) === "cabinet" ? (depthOf.get(id) ?? 0) : 0);

  // 槽と値の札。トークンの箱は槽を持たず、箱の中に値を書く
  const tanksOf = new Map<string, string[]>(order.map((id) => [id, []]));
  const platesOf = new Map<string, string[]>(order.map((id) => [id, []]));
  for (const h of holds) {
    if ("token" in h) tanksOf.get(h.box)?.push(h.token);
    else platesOf.get(h.box)?.push(h.name);
  }
  for (const snap of sim.snaps)
    for (const k of snap.balances.keys()) {
      const cut = k.indexOf("|");
      const list = tanksOf.get(k.slice(0, cut));
      if (list && !list.includes(k.slice(cut + 1))) list.push(k.slice(cut + 1));
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
  for (const [party, list] of tanksOf) tanksOf.set(party, isBox(party) ? [] : list.filter((token) => !gone.has(token)));
  const has = (party: string, token: string): boolean => (tanksOf.get(party) ?? []).includes(token);
  const holders = order.filter((id) => !isBox(id) && ((tanksOf.get(id) ?? []).length > 0 || (platesOf.get(id) ?? []).length > 0));
  holders.sort((a, b) => (a === sender ? -1 : b === sender ? 1 : (declaredAt.get(a) ?? 0) - (declaredAt.get(b) ?? 0)));
  const holding = new Set(holders);
  const tokens = [...new Set(order.flatMap((id) => tanksOf.get(id) ?? []))].sort(
    (a, b) => holds.findIndex((h) => "token" in h && h.token === a) - holds.findIndex((h) => "token" in h && h.token === b),
  );
  const toneOf = (token: string): number => Math.max(0, tokens.indexOf(token)) % 3;
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

  // 値の管の通し方。流れが全て隣の槽どうしを結び、トークンの箱を全て横の管に置ける時だけ、槽の横を結ぶ
  const seq = holders.flatMap((h) => tokens.filter((t) => has(h, t)).map((t) => keyOf(h, t)));
  const moving = sim.flows.filter((f) => !foldSteps.has(f.step) && has(f.from, f.token) && has(f.to, f.token));
  const apartOf = (f: FlowRec): number => Math.abs(seq.indexOf(keyOf(f.from, f.token)) - seq.indexOf(keyOf(f.to, f.token)));
  const segs: Seg[] = [];
  for (const f of moving) {
    const [a, b] = seq.indexOf(keyOf(f.from, f.token)) < seq.indexOf(keyOf(f.to, f.token)) ? [f.from, f.to] : [f.to, f.from];
    if (!segs.some((s) => s.a === a && s.b === b && s.token === f.token)) segs.push({ a, b, token: f.token });
  }
  const boxOf = (token: string): string | undefined => {
    const id = tokenParty.get(token);
    return id !== undefined && visible.has(id) ? id : undefined;
  };
  // 値を払う前の確認は、払う値の管に計器を載せる (#3398)。試作の4配管は Pool の最低額の確認を WETH の管に置き、確かめた式を計器の上に書く。
  // 確かめる式がトークンの単位を持ち、確かめた者がその段から後にそのトークンを払う時に限る。トークンの Contract が自分の管で確かめる時は、管をその Contract に譲る
  const paysOn = (party: string): string | undefined => {
    if (sim.tokens.has(party)) return undefined;
    const own = sim.checks.filter((c) => c.party === party);
    const first = Math.min(...own.map((c) => c.step));
    const unitOf = (s: string): string | undefined => s.trim().split(/\s+/u).pop();
    const units = new Set(own.flatMap((c) => [unitOf(c.check.left), unitOf(c.check.right)]));
    const pay = moving.find((f) => f.from === party && f.step >= first && units.has(f.token));
    const box = pay ? boxOf(pay.token) : undefined;
    return pay && box !== undefined && !sim.checks.some((c) => c.party === box) ? pay.token : undefined;
  };
  const side =
    moving.length > 0 &&
    moving.every((f) => apartOf(f) === 1) &&
    segs.every((s) => holders.indexOf(s.b) === holders.indexOf(s.a) + 1) &&
    order.filter(isBox).every((id) => segs.some((s) => s.token === sim.tokens.get(id)));
  const segOf = (f: FlowRec): Seg | undefined => segs.find((s) => s.token === f.token && ((s.a === f.from && s.b === f.to) || (s.a === f.to && s.b === f.from)));

  // 名札の大きさ
  const many = holders.length > 5;
  const nameW = (id: string): number => textWidth(nameOf(id), T.party);
  const boxValues = (id: string): string[] => platesOf.get(id) ?? [];
  const arrowW = textWidth("→", T.keyValue);
  const tokenW = (id: string): number =>
    Math.max(
      P.token.w,
      nameW(id) + P.token.nameW,
      ...boxValues(id).flatMap((name) => {
        const history = historyOf(`v${keyOf(id, name)}`);
        return [textWidth(name, T.key) + P.token.keyW, widest(history, T.keyValue) * 2 + arrowW + P.token.arrowGap * 2 + P.token.keyW];
      }),
    );
  const tokenH = (id: string): number => P.token.h + P.token.line * boxValues(id).length;
  const sizeOf = (id: string): { w: number; h: number } => {
    const shape = shapeOf(id);
    if (shape === "token") return { w: tokenW(id), h: tokenH(id) };
    if (shape === "round") return { w: P.avatar.size, h: P.avatar.size };
    const big = rowOf(id) === 0;
    return { w: (big ? P.cabinet.pad : P.cabinet.padSmall) + nameW(id) + P.cabinet.end, h: big ? P.cabinet.h : P.cabinet.hSmall };
  };
  /** 置き場を探す時に避ける幅。丸の名札は下に書く名前の幅まで */
  const roomOf = (id: string): number => (shapeOf(id) === "round" ? Math.max(P.avatar.size, nameW(id) + 8) : sizeOf(id).w);

  // 下の段。槽と値の札を関係者ごとにまとめて左から並べる
  const tankW1 = many ? P.tank.w1Small : P.tank.w1;
  const tankW2 = many ? P.tank.w2Small : P.tank.w2;
  const inner = many ? P.tank.innerSmall : P.tank.inner;
  const tankH = many ? P.tank.hSmall : P.tank.h;
  const cols: Col[] = [];
  let x = P.edge;
  holders.forEach((h, i) => {
    const prev = cols[i - 1];
    if (prev) {
      const seg = side ? segs.find((s) => s.a === prev.id && s.b === h) : undefined;
      const box = seg ? boxOf(seg.token) : undefined;
      x += seg ? (box ? Math.max(P.column.segment, tokenW(box) + P.column.segmentBox) : P.column.segmentPlain) : many ? P.column.gapSmall : P.column.gap;
    }
    const list = tokens.filter((t) => has(h, t));
    const col: Col = { id: h, left: x, right: x, cx: x, tanks: [], plates: [] };
    if (list.length > 1) x += P.tank.housing;
    list.forEach((t, j) => {
      if (j > 0) x += inner;
      const w = Math.max(list.length > 1 ? tankW2 : tankW1, widest(historyOf(`b${keyOf(h, t)}`).map(grouped), T.amount) + P.tank.pad * 2);
      col.tanks.push({ token: t, x, w });
      x += w;
    });
    for (const name of platesOf.get(h) ?? []) {
      if (col.tanks.length > 0 || col.plates.length > 0) x += P.plate.gap;
      const w = Math.max(P.plate.w, textWidth(name, T.tankTitle) + P.plate.padX, widest(historyOf(`v${keyOf(h, name)}`), T.plateValue) + P.plate.padX);
      col.plates.push({ name, x, w });
      x += w;
    }
    if (list.length > 1) x += P.tank.housing;
    col.right = x;
    col.cx = (col.left + col.right) / 2;
    cols.push(col);
  });
  const colOf = new Map(cols.map((c) => [c.id, c]));
  const tankAt = new Map(cols.flatMap((c) => c.tanks.map((t) => [keyOf(c.id, t.token), t] as const)));
  const tankOf = (party: string, token: string): { x: number; w: number } => tankAt.get(keyOf(party, token)) ?? { x: 0, w: 0 };
  let width = x + P.edge;

  // 横の置き場。槽を持つ関係者は自分の槽の真上、横の管のトークンの箱は管の上、ほかは呼ぶ相手と呼ばれる相手の真ん中
  const xOf = new Map<string, number>(cols.map((c) => [c.id, c.cx]));
  const shown = sim.calls.filter((c) => !c.inner && visible.has(c.from) && visible.has(c.to));
  const callersOf = (id: string): string[] => [...new Set(shown.filter((c) => c.to === id).map((c) => c.from))];
  const calleesOf = (id: string): string[] => [...new Set(shown.filter((c) => c.from === id).map((c) => c.to))];
  const nearOf = (id: string): number[] =>
    [...callersOf(id), ...calleesOf(id)].filter((n) => n !== id).flatMap((n) => {
      const at = xOf.get(n);
      return at === undefined ? [] : [at];
    });
  if (side)
    for (const id of order.filter(isBox)) {
      const seg = segs.find((s) => s.token === sim.tokens.get(id));
      if (!seg) continue;
      const a = tankOf(seg.a, seg.token);
      const b = tankOf(seg.b, seg.token);
      xOf.set(id, Math.max((a.x + a.w + b.x) / 2 + P.side.boxRight, b.x - P.side.boxLeft - tokenW(id) / 2));
    }
  /** 同じ行の名札と、上の行から槽へ下りる点線を避けて、`want` に一番近い所 */
  const freeX = (want: number, w: number, row: number, skip: string): number => {
    const occ: [number, number][] = [];
    for (const [id, cx] of xOf) {
      if (id === skip || isBox(id)) continue;
      if (rowOf(id) === row) occ.push([cx - roomOf(id) / 2 - P.cabinet.gap, cx + roomOf(id) / 2 + P.cabinet.gap]);
      if (holding.has(id) && rowOf(id) < row) occ.push([cx - P.tie.room, cx + P.tie.room]);
    }
    const ok = (cx: number): boolean => cx - w / 2 >= P.margin && occ.every(([a, b]) => cx + w / 2 < a || cx - w / 2 > b);
    for (let d = 0; d < 1e5; d += 6) {
      if (ok(want + d)) return want + d;
      if (ok(want - d)) return want - d;
    }
    return want;
  };
  const others = order.filter((id) => !isBox(id) && !holding.has(id));
  const placeOther = (id: string): void => {
    const near = nearOf(id);
    let want = near.length > 0 ? mean(near) : width / 2;
    // 呼ぶトークンの箱が真下にあれば、まっすぐ下ろせる所へ寄せる
    if (side)
      for (const t of calleesOf(id)) {
        const tx = xOf.get(t);
        if (isBox(t) && tx !== undefined && Math.abs(tx - want) < sizeOf(id).w / 2 + 60) want = tx;
      }
    xOf.set(id, freeX(want, roomOf(id), rowOf(id), id));
  };
  const later = others.filter((id) => nearOf(id).length === 0);
  for (const id of others) if (!later.includes(id)) placeOther(id);
  for (const id of later) placeOther(id);
  if (!side)
    for (const id of order.filter(isBox)) {
      const near = nearOf(id);
      const want = near.length > 0 ? mean(near) : width / 2;
      const w = tokenW(id);
      const occ: [number, number][] = [];
      for (const [other, cx] of xOf) if (isBox(other) && other !== id) occ.push([cx - tokenW(other) / 2 - 30, cx + tokenW(other) / 2 + 30]);
      for (const t of tankAt.values()) occ.push([t.x + t.w / 2 - 14, t.x + t.w / 2 + 14]);
      const ok = (cx: number): boolean => cx - w / 2 >= P.margin && occ.every(([a, b]) => cx + w / 2 < a || cx - w / 2 > b);
      let got = want;
      for (let d = 0; d < 1e5; d += 6) {
        if (ok(want + d)) {
          got = want + d;
          break;
        }
        if (ok(want - d)) {
          got = want - d;
          break;
        }
      }
      xOf.set(id, got);
    }
  for (const id of order) width = Math.max(width, (xOf.get(id) ?? 0) + roomOf(id) / 2 + P.edge);

  // 流れた分の道筋 (横だけ)。段ごとに、暫定と取り消しの分と、その段で確定した分を描く。
  // 本管を通す図は、同じトークンの流れの槽の口を分け、横に重なる流れを本管から上へ 1 本ずつずらす。横の管の図は管の中で上下にずらす
  const shownAt = stepList.map((s) => {
    const snap = snapOf(s);
    return moving.filter((f) => {
      if (f.step > s) return false;
      const state = snap.states.get(`f${f.id}`);
      return state === "provisional" || state === "rolled" || (state === "final" && snap.changed.has(`f${f.id}`));
    });
  });
  const mid = (party: string, token: string): number => {
    const t = tankOf(party, token);
    return t.x + t.w / 2;
  };
  const routes = new Map<string, { fx: number; tx: number; track: number }>();
  const deepest = new Map<string, number>();
  for (const s of stepList) {
    const groups = new Map<string, FlowRec[]>();
    for (const f of shownAt[s] ?? []) {
      const key = side ? `${segOf(f)?.a}|${segOf(f)?.b}|${f.token}` : f.token;
      groups.set(key, [...(groups.get(key) ?? []), f]);
    }
    for (const [, same] of groups) {
      const xs = new Map<string, number>();
      if (side)
        for (const f of same) {
          const seg = segOf(f) as Seg;
          const left = tankOf(seg.a, f.token);
          const right = tankOf(seg.b, f.token);
          xs.set(`${f.id}>`, f.from === seg.a ? left.x + left.w : right.x);
          xs.set(`${f.id}<`, f.to === seg.a ? left.x + left.w : right.x);
        }
      else {
        const ends = new Map<string, { key: string; other: number }[]>();
        for (const f of same) {
          ends.set(f.from, [...(ends.get(f.from) ?? []), { key: `${f.id}>`, other: mid(f.to, f.token) }]);
          ends.set(f.to, [...(ends.get(f.to) ?? []), { key: `${f.id}<`, other: mid(f.from, f.token) }]);
        }
        const token = same[0]?.token ?? "";
        for (const [party, list] of ends) {
          const center = mid(party, token);
          const sorted = [...list].sort((a, b) => Number(a.other >= center) - Number(b.other >= center) || b.other - a.other);
          const room = tankOf(party, token).w - P.tank.pad * 2 - P.flow.width * 2;
          const gap = sorted.length > 1 ? Math.min(P.flow.track * 2, room / (sorted.length - 1)) : 0;
          sorted.forEach((e, k) => xs.set(e.key, center + (k - (sorted.length - 1) / 2) * gap));
        }
      }
      const placed: { lo: number; hi: number; track: number }[] = [];
      const spans = same.map((f) => {
        const fx = xs.get(`${f.id}>`) ?? 0;
        const tx = xs.get(`${f.id}<`) ?? 0;
        return { f, fx, tx, lo: Math.min(fx, tx), hi: Math.max(fx, tx) };
      });
      for (const span of [...spans].sort((a, b) => a.hi - a.lo - (b.hi - b.lo) || a.f.id - b.f.id)) {
        const near = placed.filter((p) => p.lo < span.hi + P.flow.track && span.lo < p.hi + P.flow.track);
        let track = side ? 0 : Math.max(0, ...near.filter((p) => p.lo >= span.lo && p.hi <= span.hi).map((p) => p.track + 1));
        while (near.some((p) => p.track === track)) track++;
        placed.push({ lo: span.lo, hi: span.hi, track });
        routes.set(`${s}|${span.f.id}`, { fx: span.fx, tx: span.tx, track });
        deepest.set(span.f.token, Math.max(deepest.get(span.f.token) ?? 0, track));
      }
    }
  }
  /** 横の管の中で流れをずらす量。真ん中から上と下へ交互に */
  const sideShift = (track: number): number => (track === 0 ? 0 : (track % 2 === 1 ? -1 : 1) * Math.ceil(track / 2) * P.flow.track);

  // 縦の帯。上から、イベントの札、吹き出しの帯、名札の行、(本管の図は) トークンの箱と本管、槽
  const eventsLabelW = sim.emits.length > 0 ? textWidth(words.events, T.head) + P.chip.labelGap : 0;
  const chipTextOf = (e: EmitRec): string => `${nameOf(e.party)}.${e.name}`;
  const argsOf = (e: EmitRec): string | undefined => (e.args && e.args.length > 0 ? e.args.join(", ") : undefined);
  const chipW = (e: EmitRec, withArgs: boolean): number => {
    const args = withArgs ? argsOf(e) : undefined;
    return P.chip.padX * 2 + textWidth(chipTextOf(e), T.chip) + (args ? P.chip.argsGap + textWidth(args, T.args) : 0);
  };
  width = Math.max(width, P.margin * 2 + eventsLabelW + Math.max(0, ...sim.emits.map((e) => chipW(e, true))));
  const chipsTop = P.margin;
  const chipLeft = P.margin + eventsLabelW;
  const chipRows = stepList.map((s) => {
    const rows: { id: number; x: number; row: number; w: number }[] = [];
    let cx = chipLeft;
    let row = 0;
    for (const id of snapOf(s).emitted) {
      const e = sim.emits[id] as EmitRec;
      const w = chipW(e, e.step === s);
      if (cx > chipLeft && cx + w > width - P.margin) {
        row++;
        cx = chipLeft;
      }
      rows.push({ id, x: cx, row, w });
      cx += w + P.chip.gap;
    }
    return rows;
  });
  const rowCount = Math.max(0, ...chipRows.map((rows) => Math.max(0, ...rows.map((r) => r.row + 1))));
  const bandTop = rowCount > 0 ? chipsTop + rowCount * P.chip.h + (rowCount - 1) * P.chip.rowGap + P.callout.gap : P.margin;
  // 名札の行。計器を載せた縦の枝が入る行は、弁と計器が並ぶ高さを空ける
  const rowParties = order.filter((id) => !isBox(id));
  const maxRow = Math.max(0, ...rowParties.map(rowOf));
  const pitch = Array.from({ length: maxRow }, (): number => P.row.pitch);
  const checkers = [...new Set(sim.checks.map((c) => c.party))].filter((id) => visible.has(id));
  for (const id of checkers) {
    const first = shown.find((c) => c.to === id);
    if (isBox(id) || paysOn(id) !== undefined || !first || isBox(first.from) || rowOf(first.from) === rowOf(id)) continue;
    const lo = Math.min(rowOf(first.from), rowOf(id));
    if (lo < maxRow) pitch[lo] = P.row.gauge;
  }
  const rowY = [bandTop + P.callout.h + P.callout.gap + P.row.top];
  for (let r = 1; r <= maxRow; r++) rowY.push((rowY[r - 1] as number) + (pitch[r - 1] ?? P.row.pitch));
  const lowRow = rowY[maxRow] as number;
  const anyBox = order.some(isBox);
  const boxBand = anyBox ? Math.max(...order.filter(isBox).map(tokenH)) : 0;
  const tokenTop = lowRow + P.band.tokens;
  // 本管。一番上の本管はトークンの箱の下、ほかは上の本管から、上へずらした流れの分だけ離して下に置く
  const mainY = new Map<string, number>();
  if (!side && tokens.length > 0) {
    let y = tokenTop + (anyBox ? boxBand + P.band.mains : 0) + (deepest.get(tokens[tokens.length - 1] ?? "") ?? 0) * P.flow.track;
    for (let k = tokens.length - 1; k >= 0; k--) {
      const token = tokens[k] ?? "";
      if (k < tokens.length - 1) y += P.bus.pitch + (deepest.get(token) ?? 0) * P.flow.track;
      mainY.set(token, y);
    }
  }
  const anyRow = holders.length > 0;
  const tankTop = side ? lowRow + P.band.side : tokens.length > 0 ? (mainY.get(tokens[0] ?? "") ?? 0) + P.band.tanks : tokenTop + (anyBox ? boxBand + P.band.mains : 0);
  const tankBottom = tankTop + tankH;
  const pipeY = tankBottom - P.side.pipeY;
  const boxTop = (id: string): number => (side ? pipeY - P.side.boxUp - tokenH(id) : tokenTop);
  const cyOf = (id: string): number => (isBox(id) ? boxTop(id) + tokenH(id) / 2 : (rowY[rowOf(id)] as number));
  const rectOf = (id: string): Rect => {
    const { w, h } = sizeOf(id);
    return { x: (xOf.get(id) ?? 0) - w / 2, y: cyOf(id) - h / 2, w, h };
  };
  const nameBottom = (id: string): number => (shapeOf(id) === "round" ? cyOf(id) + P.avatar.nameY + T.party.size * 0.3 : rectOf(id).y + rectOf(id).h);
  const height = anyRow
    ? tankBottom + P.band.bottom
    : Math.max(...order.map((id) => (isBox(id) ? boxTop(id) + tokenH(id) : nameBottom(id)))) + P.band.plain;

  // 関係者
  const parties: PipeParty[] = order.map((id) => {
    const r = rectOf(id);
    const shape = shapeOf(id);
    const box = diagram.boxes.find((b) => b.id === id);
    const big = rowOf(id) === 0;
    const label =
      shape === "round"
        ? textAt(nameOf(id), r.x + r.w / 2, cyOf(id) + P.avatar.nameY, T.party, "middle")
        : shape === "token"
          ? textAt(nameOf(id), r.x + r.w / 2, r.y + P.token.nameY, T.party, "middle")
          : textAt(nameOf(id), r.x + (big ? P.cabinet.name : P.cabinet.nameSmall), cyOf(id) + T.party.size * 0.4, T.party);
    return {
      ...r,
      id,
      name: nameOf(id),
      role: roleOf(id),
      ...(box?.icon ? { icon: box.icon } : {}),
      shape,
      ...(shape === "token" ? {} : { row: rowOf(id) }),
      label,
      holder: holding.has(id),
    };
  });
  const involved = diagram.steps.map((step, s) => {
    const set = new Set(step.events.flatMap(partiesOf));
    for (const c of shown) if (c.close?.step === s) set.add(c.to);
    return set;
  });
  const columns: PipeColumn[] = [];
  const pills: PipePill[] = [];
  for (const s of stepList)
    for (const p of parties) {
      const col = colOf.get(p.id);
      const left = col ? Math.min(col.left, p.x) : p.x;
      const right = col ? Math.max(col.right, p.x + p.w) : p.x + p.w;
      columns.push({ party: p.id, step: s, x: left, y: p.y, w: right - left, h: height - P.margin - p.y, folded: false });
      pills.push({ x: p.x, y: p.y, w: p.w, h: p.h, party: p.id, step: s, folded: false, active: snapOf(s).active === p.id, involved: (involved[s] as Set<string>).has(p.id) });
    }
  const ties: PipeTie[] = parties.flatMap((p) => {
    const col = colOf.get(p.id);
    if (!col || p.shape === "token") return [];
    const top = p.shape === "round" ? p.label.y + p.label.h + P.tie.gap : p.y + p.h + P.tie.gap;
    return [{ party: p.id, x: p.x + p.w / 2, y1: top, y2: tankTop - (col.tanks.length > 1 ? P.tie.housing : P.tie.up) }];
  });

  // 槽と水位。水位の物差しは、トークンごとに並べた槽の一番多い量で作る
  const scale = new Map(
    tokens.map((token) => {
      const owners = holders.filter((h) => has(h, token));
      const amounts = owners.flatMap((h) => historyOf(`b${keyOf(h, token)}`).map(amountNumber));
      return [token, Math.max(0, ...amounts)];
    }),
  );
  const room = tankH - P.tank.pad * 2;
  const levelH = (token: string, amount: string | undefined): number => {
    const most = scale.get(token) ?? 0;
    const n = amountNumber(amount);
    if (!(n > 0) || most <= 0) return 0;
    return Math.min(room, Math.max(P.tank.least, (n / most) * room * P.tank.fill));
  };
  const liquid = (glass: Rect, token: string, amount: string | undefined): Rect => {
    const h = levelH(token, amount);
    return { x: glass.x + P.tank.pad, y: glass.y + glass.h - P.tank.pad - h, w: glass.w - P.tank.pad * 2, h };
  };
  /** 槽か値の札の下の行。前の字と語を真ん中に並べ、前の字に消し線を引く */
  const subLine = (cx: number, base: number, was: string, tag: string): { was: PipeText; strike: Rect; tag: PipeText } => {
    const ww = textWidth(was, T.sub);
    const total = ww + P.tank.tagGap + textWidth(tag, T.tag);
    const w = textAt(was, cx - total / 2, base, T.sub);
    return { was: w, strike: { x: w.x - 1, y: w.y + w.h * 0.55, w: w.w + 2, h: 1.5 }, tag: textAt(tag, w.x + w.w + P.tank.tagGap, base, T.tag) };
  };
  const tanks: PipeTank[] = [];
  const glasses: PipeGlass[] = [];
  const levels: PipeLevel[] = [];
  for (const col of cols)
    for (const t of col.tanks) {
      const glass: Rect = { x: t.x, y: tankTop, w: t.w, h: tankH };
      const cx = t.x + t.w / 2;
      const tank: PipeTank = { ...glass, party: col.id, token: t.token, title: textAt(t.token, cx, tankTop + P.tank.titleY, T.tankTitle, "middle"), tone: toneOf(t.token) };
      tanks.push(tank);
      const key = `b${keyOf(col.id, t.token)}`;
      for (const s of stepList) {
        glasses.push({ ...tank, step: s });
        const snap = snapOf(s);
        const amount = snap.balances.get(keyOf(col.id, t.token)) ?? "0";
        const state = snap.states.get(key) ?? "none";
        const old = snap.was.get(key);
        const changedAt = snap.changed.get(key);
        const prev = s > 0 ? snapOf(s - 1).balances.get(keyOf(col.id, t.token)) : undefined;
        const sub = old !== undefined && state !== "none" ? subLine(cx, tankBottom + P.tank.numberY + P.tank.subY, grouped(old), words.tags[state]) : undefined;
        levels.push({
          ...liquid(glass, t.token, amount),
          party: col.id,
          token: t.token,
          step: s,
          amount,
          state,
          text: textAt(grouped(amount), cx, tankBottom + P.tank.numberY, T.amount, "middle"),
          ...(sub ? { was: sub.was, strike: sub.strike, tag: sub.tag, base: liquid(glass, t.token, old) } : {}),
          ...(changedAt !== undefined ? { event: changedAt } : {}),
          ...(changedAt !== undefined && prev !== undefined && prev !== amount ? { from: liquid(glass, t.token, prev) } : {}),
        });
      }
    }
  const housings: PipeHousing[] = cols
    .filter((c) => c.tanks.length > 1)
    .map((c) => ({ party: c.id, x: c.left, y: tankTop - P.tank.housing, w: c.right - c.left, h: tankH + P.tank.housing * 2 }));

  // 値の管と弁
  const valveOf = (token: string, y: number): PipeBus["valve"] => {
    const box = token === ETH ? undefined : boxOf(token);
    return box === undefined ? undefined : { party: box, x: xOf.get(box) ?? 0, y };
  };
  const buses: PipeBus[] = side
    ? segs.map((seg, k) => {
        const a = tankOf(seg.a, seg.token);
        const b = tankOf(seg.b, seg.token);
        const first = segs.findIndex((s) => s.token === seg.token) === k;
        const valve = first ? valveOf(seg.token, pipeY) : undefined;
        return { token: seg.token, y: pipeY, x1: a.x + a.w, x2: b.x, mode: "side", ...(valve ? { valve } : {}), drops: [] };
      })
    : tokens.map((token) => {
        const y = mainY.get(token) ?? 0;
        const valve = valveOf(token, y);
        const xs = [...holders.filter((h) => has(h, token)).map((h) => mid(h, token)), ...(valve ? [valve.x] : [])];
        return {
          token,
          y,
          x1: Math.min(...xs) - P.bus.end,
          x2: Math.max(...xs) + P.bus.end,
          mode: "main",
          ...(valve ? { valve } : {}),
          drops: holders.filter((h) => has(h, token)).map((h) => ({ x: mid(h, token), y: tankTop + P.tank.pad })),
        };
      });
  const pipes: PipeBusAt[] = stepList.flatMap((s) => buses.map((b) => ({ ...b, step: s })));

  // 流れた分
  const flows: PipeFlow[] = stepList.flatMap((s) =>
    (shownAt[s] ?? []).map((f): PipeFlow => {
      const snap = snapOf(s);
      const { fx, tx, track } = routes.get(`${s}|${f.id}`) ?? { fx: mid(f.from, f.token), tx: mid(f.to, f.token), track: 0 };
      const changedAt = snap.changed.get(`f${f.id}`);
      const bus = side ? buses.find((b) => b.token === f.token && b.x1 <= Math.min(fx, tx) + 1 && b.x2 >= Math.max(fx, tx) - 1) : undefined;
      const valveX = side ? (buses.find((b) => b.token === f.token && b.valve)?.valve?.x ?? (fx + tx) / 2) : (fx + tx) / 2;
      const y = side ? pipeY + sideShift(track) : (mainY.get(f.token) ?? 0) - track * P.flow.track;
      const arrowX = side && bus?.valve && valveX > Math.min(fx, tx) && valveX < Math.max(fx, tx) ? (fx + valveX) / 2 : (fx + tx) / 2;
      return {
        id: f.id,
        step: s,
        token: f.token,
        from: f.from,
        to: f.to,
        amount: f.amount,
        state: snap.states.get(`f${f.id}`) ?? "none",
        points: side
          ? [
              [fx, y],
              [tx, y],
            ]
          : [
              [fx, tankTop],
              [fx, y],
              [tx, y],
              [tx, tankTop],
            ],
        arrow: { x: arrowX, y, dir: tx >= fx ? 1 : -1 },
        tone: toneOf(f.token),
        fresh: f.step === s,
        ...(changedAt !== undefined ? { event: changedAt } : {}),
      };
    }),
  );

  // 呼び出しの管。呼んだ者ごとに本管を 1 本引き、呼ぶ相手ごとに枝を分ける
  interface Branch {
    from: string;
    to: string;
    root: Point;
    end: Point;
    exit: Point;
    vertical: boolean;
    /** 枝の向き。横の枝は右へ 1、縦の枝は下へ 1 */
    dir: 1 | -1;
    valve: Point;
  }
  const along = (p: Point, b: Branch, d: number): Point => (b.vertical ? [p[0], p[1] + b.dir * d] : [p[0] + b.dir * d, p[1]]);
  const lengthOf = (a: Point, b: Point): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const branches = new Map<string, Branch>();
  for (const c of shown) {
    const key = `${c.from}>${c.to}`;
    if (branches.has(key)) continue;
    const a = rectOf(c.from);
    const b = rectOf(c.to);
    const ay = cyOf(c.from);
    const sameRow = !isBox(c.from) && !isBox(c.to) && rowOf(c.from) === rowOf(c.to);
    let root: Point;
    let end: Point;
    let exit: Point;
    let dir: 1 | -1;
    if (sameRow) {
      dir = b.x + b.w / 2 >= a.x + a.w / 2 ? 1 : -1;
      root = [a.x + a.w / 2 + (dir * a.w) / 2, ay];
      end = [b.x + b.w / 2 - (dir * b.w) / 2, cyOf(c.to)];
      exit = root;
    } else {
      const bx = b.x + b.w / 2;
      dir = cyOf(c.to) > ay ? 1 : -1;
      root = [bx, ay];
      end = [bx, dir === 1 ? b.y : b.y + b.h];
      exit = bx > a.x && bx < a.x + a.w ? [bx, dir === 1 ? a.y + a.h : a.y] : root;
    }
    const branch: Branch = { from: c.from, to: c.to, root, end, exit, vertical: !sameRow, dir, valve: exit };
    branch.valve = along(exit, branch, Math.min(P.call.valveAt, lengthOf(exit, end) * 0.4));
    branches.set(key, branch);
  }
  const mains: PipeMain[] = [];
  for (const from of order) {
    const own = [...branches.values()].filter((b) => b.from === from);
    if (own.length === 0) continue;
    const a = rectOf(from);
    const y = cyOf(from);
    const xs = [a.x, a.x + a.w, ...own.map((b) => b.root[0])];
    mains.push({
      from,
      y,
      points: [
        [Math.min(...xs), y],
        [Math.max(...xs), y],
      ],
      branches: own.map((b) => ({ to: b.to, points: [b.root, b.end], valve: { x: b.valve[0], y: b.valve[1], vertical: b.vertical } })),
    });
  }
  /** 光る管の道。呼んだ者の名札を出た所から本管を通って枝の端まで */
  const litOf = (b: Branch): Point[] => {
    if (b.exit !== b.root) return [b.exit, b.end];
    if (!b.vertical) return [b.root, b.end];
    const a = rectOf(b.from);
    const edge: Point = [b.root[0] >= a.x + a.w / 2 ? a.x + a.w : a.x, b.root[1]];
    return [edge, b.root, b.end];
  };
  const widthOf = (kind: CallRec["kind"]): number => (kind === "static" ? P.call.flow / 2 : P.call.flow);
  const calls: PipeCallLane[] = shown.map((c) => {
    const b = branches.get(`${c.from}>${c.to}`) as Branch;
    const a = rectOf(c.from);
    return {
      index: c.index,
      step: c.step,
      event: c.event,
      from: c.from,
      to: c.to,
      depth: c.depth,
      y: cyOf(c.from),
      kind: c.kind,
      width: widthOf(c.kind),
      points: [[a.x + a.w / 2, cyOf(c.from)], b.root, b.end],
      lit: litOf(b),
      ...(c.value !== undefined ? { value: c.value } : {}),
      ...(c.close ? { close: c.close } : {}),
    };
  });
  const lanes: PipeLane[] = stepList.flatMap((s) =>
    shown
      .filter((c) => c.step <= s && (c.close === undefined || c.close.step >= s))
      .map((c) => ({
        call: c.index,
        step: s,
        from: c.from,
        to: c.to,
        kind: c.kind,
        width: widthOf(c.kind),
        points: litOf(branches.get(`${c.from}>${c.to}`) as Branch),
        ...(c.step === s ? { opened: c.event } : {}),
        ...(c.close?.step === s ? { shut: c.close.event } : {}),
      })),
  );

  // 計器。確かめる者ごとに 1 つ、最初に確かめた段から最後の段まで置き、針と通ったかの印を残す
  const gauges: PipeGauge[] = [];
  for (const party of checkers) {
    const own = sim.checks.filter((c) => c.party === party);
    const firstStep = Math.min(...own.map((c) => c.step));
    const incoming = shown.find((c) => c.to === party);
    const branch = incoming ? branches.get(`${incoming.from}>${incoming.to}`) : undefined;
    const pays = paysOn(party);
    const valveBus = isBox(party)
      ? buses.find((b) => b.valve?.party === party)
      : pays !== undefined
        ? buses.find((b) => b.token === pays && b.valve)
        : undefined;
    // 値の管の計器の式は、管が運ぶトークンの単位を外して書く。単位は管とトークンの箱が示し、式を計器の幅に収めるため
    const bare = (side: string): string => (valveBus && side.endsWith(` ${valveBus.token}`) ? side.slice(0, -valveBus.token.length - 1) : side);
    const readOf = (c: CheckRec): string => `${bare(c.check.left)} ${OP_TEXT[c.check.op]} ${bare(c.check.right)}`;
    let place: { on: PipeGauge["on"]; cx: number; cy: number; r: number; stem?: { y1: number; y2: number } };
    if (valveBus?.valve) {
      const r = P.gauge.rValue;
      const box = rectOf(valveBus.valve.party);
      const want = Math.min(valveBus.valve.x - P.gauge.valveX, box.x - P.gauge.boxX);
      // 横の管では、式の字を左の槽の縁と囲いの点線から離す
      const half = Math.max(...own.map((c) => textWidth(readOf(c), T.read))) / 2;
      const edge = Math.max(valveBus.x1, ...housings.filter((h) => h.x <= valveBus.x1 && h.x + h.w >= valveBus.x1).map((h) => h.x + h.w));
      const cx = valveBus.mode === "side" ? Math.max(valveBus.x1 + r + P.flow.width, edge + half + P.gauge.readGap, want) : want;
      const cy = valveBus.valve.y - P.gauge.up;
      place = { on: "value", cx, cy, r, stem: { y1: cy + r, y2: valveBus.valve.y - P.gauge.stemGap } };
    } else if (branch && !isBox(party)) {
      const r = P.gauge.r;
      const len = lengthOf(branch.root, branch.end);
      const valveAt = lengthOf(branch.root, branch.valve);
      const want = len - (branch.vertical ? P.call.gaugeDown : P.call.gaugeEnd);
      const least = valveAt + P.valve.r + r + P.call.gaugeGap / 4;
      const at = Math.min(len - r, Math.max(least, want));
      const [cx, cy] = along(branch.root, branch, at);
      place = { on: "call", cx, cy, r };
    } else {
      const r = P.gauge.r;
      const box = rectOf(party);
      place = { on: "party", cx: box.x + box.w + P.gauge.lampGap + r, cy: box.y + box.h / 2, r };
    }
    let angle: number = P.gauge.unseen;
    for (let s = firstStep; s < steps; s++) {
      const done = own.filter((c) => c.step <= s);
      const latest = done[done.length - 1] as CheckRec;
      const here = own.filter((c) => c.step === s);
      const from = angle;
      angle = latest.ok ? P.gauge.ok : P.gauge.fail;
      const { cx, cy, r } = place;
      const read = place.on === "value" && here.length === 0 ? readOf(latest) : undefined;
      gauges.push({
        x: cx - r,
        y: cy - r,
        w: r * 2,
        h: r * 2,
        party,
        step: s,
        event: (here[0] ?? latest).event,
        ok: latest.ok,
        on: place.on,
        cx,
        cy,
        r,
        fresh: here.length > 0 && !foldSteps.has(s),
        from,
        angle,
        lamp: { x: cx + r + P.gauge.lampGap, y: cy - r + 4, r: P.gauge.lamp },
        ...(place.stem ? { stem: place.stem } : {}),
        ...(read ? { read: textAt(read, cx, cy - r - P.gauge.readGap, T.read, "middle") } : {}),
      });
    }
  }

  // 変換器と囲い。計算する関係者の最初の 2 つの槽の間に置く
  const converters: PipeConverter[] = [];
  for (const col of cols) {
    const own = sim.calcs.filter((c) => c.party === col.id);
    const [first] = own;
    const [ta, tb] = col.tanks;
    if (!first || !ta || !tb) continue;
    const r = many ? P.converter.rSmall : P.converter.r;
    const left = ta.x + ta.w;
    const right = tb.x;
    const cx = (left + right) / 2;
    const cy = tankTop + tankH / 2;
    for (const s of stepList) {
      const here = own.filter((c) => c.step === s && !foldSteps.has(s));
      const shownCalc = here[0] ?? [...own].reverse().find((c) => c.step <= s) ?? first;
      converters.push({
        x: cx - r,
        y: cy - r,
        w: r * 2,
        h: r * 2,
        party: col.id,
        step: s,
        calc: shownCalc.step,
        ...(here[0] ? { event: here[0].event } : {}),
        in: shownCalc.input,
        out: shownCalc.output,
        rate: shownCalc.rate,
        active: here.length > 0,
        cx,
        cy,
        r,
        left,
        right,
      });
    }
  }

  // 値の札。トークンの箱の値は箱の中の名前の下に、ほかは持ち主の槽の並びに置く
  const plates: PipePlate[] = [];
  for (const party of order) {
    const boxed = isBox(party);
    const col = colOf.get(party);
    (platesOf.get(party) ?? []).forEach((name, i) => {
      const key = `v${keyOf(party, name)}`;
      const box = rectOf(party);
      const spot = col?.plates.find((p) => p.name === name);
      if (!boxed && !spot) return;
      for (const s of stepList) {
        const snap = snapOf(s);
        const value = snap.values.get(keyOf(party, name)) ?? "";
        const state = snap.states.get(key) ?? "none";
        const old = state === "none" ? undefined : snap.was.get(key);
        const changedAt = snap.changed.get(key);
        const at = changedAt !== undefined ? { event: changedAt } : {};
        if (boxed) {
          const cx = box.x + box.w / 2;
          const keyBase = box.y + P.token.keyY + P.token.line * i;
          const base = keyBase + P.token.valueY;
          const valueW = textWidth(value, T.keyValue);
          const total = old === undefined ? valueW : textWidth(old, T.keyValue) + P.token.arrowGap * 2 + arrowW + valueW;
          const start = cx - total / 2;
          const was = old === undefined ? undefined : textAt(old, start, base, T.keyValue);
          const arrow = was ? textAt("→", was.x + was.w + P.token.arrowGap, base, T.keyValue) : undefined;
          const text = textAt(value, arrow ? arrow.x + arrow.w + P.token.arrowGap : start, base, T.keyValue);
          plates.push({
            x: box.x + P.token.plateX,
            y: keyBase - T.key.size,
            w: box.w - P.token.plateX * 2,
            h: P.token.valueY + T.key.size + T.keyValue.size * 0.3,
            party,
            name,
            step: s,
            value,
            state,
            boxed,
            label: textAt(name, cx, keyBase, T.key, "middle"),
            text,
            ...(was && arrow ? { was, arrow, strike: { x: was.x - 1, y: was.y + was.h * 0.55, w: was.w + 2, h: 1.5 } } : {}),
            ...at,
          });
          continue;
        }
        const p = spot as { x: number; w: number };
        const y = tankTop + P.plate.top;
        const h = tankH - P.plate.short;
        const cx = p.x + p.w / 2;
        const sub = old !== undefined ? subLine(cx, tankBottom + P.tank.numberY, old, words.tags[state as Exclude<PipeState, "none">]) : undefined;
        plates.push({
          x: p.x,
          y,
          w: p.w,
          h,
          party,
          name,
          step: s,
          value,
          state,
          boxed,
          label: textAt(name, cx, y + P.plate.nameY, T.tankTitle, "middle"),
          text: textAt(value, cx, y + h / 2 + P.plate.valueY, T.plateValue, "middle"),
          ...(sub ? { was: sub.was, strike: sub.strike, tag: sub.tag } : {}),
          ...at,
        });
      }
    });
  }
  const plateAt = (party: string, name: string): PipePlate | undefined => plates.find((p) => p.party === party && p.name === name);
  const writes: PipeWrite[] = sim.writes
    .filter((w) => !foldSteps.has(w.step) && visible.has(w.from))
    .flatMap((w) => {
      const plate = plateAt(w.to, w.name);
      if (!plate) return [];
      const writer = rectOf(w.from);
      const wx = writer.x + writer.w / 2;
      const px = plate.x + plate.w / 2;
      const target = plate.boxed ? rectOf(w.to).y : plate.y;
      const turn = plate.boxed ? target - P.write.turn : tankTop - P.write.turn;
      const start = writer.y + writer.h;
      const points: Point[] =
        plate.boxed && w.from === w.to
          ? [
              [px, plate.y],
              [px, plate.y],
            ]
          : Math.abs(wx - px) < 1
            ? [
                [wx, start],
                [px, target],
              ]
            : [
                [wx, start],
                [wx, turn],
                [px, turn],
                [px, target],
              ];
      return [{ ...w, points }];
    });

  // イベントの札と、イベントを出した者の輪
  const events: PipeEventChip[] = [];
  for (const s of stepList) {
    const snap = snapOf(s);
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
  const rings: PipeRing[] = sim.emits.filter((e) => !foldSteps.has(e.step) && visible.has(e.party)).map((e) => ({ party: e.party, step: e.step, event: e.event }));
  const heads: PipeLayout["heads"] = sim.emits.length > 0 ? { events: textAt(words.events, P.margin, middleBase(chipsTop, P.chip.h, T.head), T.head) } : {};

  // 段ごとに避ける所。名札と名前、槽と下の数、値の札、トークンの箱、変換器、計器、イベントの札
  const fixedAvoid: Rect[] = [
    ...parties.map((p) => (p.shape === "round" ? { x: Math.min(p.x, p.label.x), y: p.y, w: Math.max(p.w, p.label.w), h: p.label.y + p.label.h - p.y } : p)),
    ...tanks.map((t) => ({ x: t.x, y: t.y, w: t.w, h: t.h + P.tank.numberY + P.tank.subY + T.sub.size * 0.4 })),
    ...housings,
  ];
  const avoidAt = (s: number): Rect[] => [
    ...fixedAvoid,
    ...levels.filter((l) => l.step === s).flatMap((l) => [l.text, ...(l.was ? [l.was] : []), ...(l.tag ? [l.tag] : [])]),
    ...plates.filter((p) => p.step === s).flatMap((p) => [p, ...(p.was ? [p.was] : []), ...(p.tag ? [p.tag] : [])]),
    ...converters.filter((c) => c.step === s),
    ...gauges.filter((g) => g.step === s).flatMap((g) => [g, { x: g.lamp.x - g.lamp.r, y: g.lamp.y - g.lamp.r, w: g.lamp.r * 2, h: g.lamp.r * 2 }, ...(g.read ? [g.read] : [])]),
    ...events.filter((e) => e.step === s),
  ];
  /** 置き場の候補を順に試し、避ける所と重ならない最初の所。どれも重なる時は吹き出しの帯に置く */
  const placeAt = (w: number, h: number, anchor: Point, avoid: Rect[], band: number): Rect => {
    const C = P.callout;
    const [ax, ay] = anchor;
    const fit = ([cx, cy]: Point): Rect => ({
      x: Math.min(Math.max(cx - w / 2, C.edge), width - C.edge - w),
      y: Math.min(Math.max(cy - h / 2, P.margin), height - P.margin - h),
      w,
      h,
    });
    const tries: Point[] = [
      [ax, ay],
      [ax, ay - C.near],
      [ax, ay + C.near],
      [ax + w / 2 + C.beside, ay],
      [ax - w / 2 - C.beside, ay],
      [ax, ay - C.far],
      [ax, ay + C.far],
    ];
    for (const at of tries) {
      const r = fit(at);
      if (avoid.every((o) => clear(r, o))) return r;
    }
    return fit([ax, band + h / 2]);
  };

  // 畳んだ箱。呼ばれた者の下の空いた所に置く
  const foldBoxes: PipeFoldBox[] = folds.flatMap((fold) => {
    const call = sim.calls[fold.call];
    const party = call?.to ?? "";
    if (!visible.has(party)) return [];
    const count = fold.to - fold.from + 1;
    const text = words.fold(count, fold.hidden.length);
    const w = P.card.padX * 2 + P.card.icon + P.card.gap + Math.max(textWidth(words.open, T.cardTitle), textWidth(text, T.fold));
    const owner = rectOf(party);
    const at = placeAt(w, P.card.h, [owner.x + owner.w / 2, owner.y + owner.h + P.card.top + P.card.h / 2], avoidAt(fold.step), bandTop);
    const left = at.x + P.card.padX + P.card.icon + P.card.gap;
    const title = textAt(words.open, left, at.y + P.card.titleY, T.cardTitle);
    const value = textAt(text, left, at.y + P.card.valueY, T.fold);
    return [{ ...at, party, step: fold.step, call: fold.call, steps: count, parties: fold.hidden.length, title, value, text: value }];
  });

  // 段ごとの吹き出し。その段の出来事のうち、取り消し、移す、確かめる、換算、戻る、呼ぶ、書く、出すの順に先に来る 1 つを出す
  const KINDS = ["revert", "move", "check", "calc", "return", "call", "write", "emit"] as const;
  const callouts: PipeCallout[] = [];
  for (const s of stepList) {
    if (foldSteps.has(s)) continue;
    const events0 = (diagram.steps[s] as Step).events;
    let found: { e: Step["events"][number]; at: number } | undefined;
    for (const kind of KINDS) {
      const at = events0.findIndex((e) => e.type === kind);
      if (at >= 0) {
        found = { e: events0[at] as Step["events"][number], at };
        break;
      }
    }
    if (!found) continue;
    const { e, at } = found;
    let tag = "";
    let text = "";
    let tone: PipeTone = "call";
    let mono = false;
    let anchor: Point = [width / 2, bandTop];
    const partyMid = (id: string): Point => {
      const r = rectOf(id);
      return [r.x + r.w / 2, r.y + r.h / 2];
    };
    if (e.type === "revert") {
      tag = words.undo;
      text = e.reason ?? "revert";
      tone = "bad";
      anchor = [partyMid(e.box)[0], bandTop + P.callout.h / 2];
    } else if (e.type === "move") {
      const token = sim.tokens.get(e.box) ?? "";
      tag = words.moves(nameOf(e.box));
      text = `${e.amount} ${token}`;
      tone = "value";
      const f = flows.find((g) => g.step === s && g.event === at) ?? flows.find((g) => g.step === s);
      anchor = f ? (side ? [f.arrow.x, pipeY + P.callout.h + P.side.pipeY] : [f.arrow.x, f.arrow.y - P.callout.near]) : partyMid(e.box);
    } else if (e.type === "check") {
      const ok = checkPasses(e);
      tag = (diagram.steps[s] as Step).title;
      text = `${e.left} ${OP_TEXT[e.op]} ${e.right}  ${ok ? "✓" : "✕"}`;
      tone = ok ? "check" : "bad";
      mono = true;
      const g = gauges.find((x) => x.party === e.box && x.step === s);
      anchor = g ? [g.cx, g.cy - (g.on === "value" ? P.callout.far - P.gauge.up : P.callout.near)] : partyMid(e.box);
    } else if (e.type === "calc") {
      tag = rateOf(e.in, e.out);
      text = `${e.in} → ${e.out}`;
      tone = "value";
      const col = colOf.get(e.box);
      anchor = col ? [col.cx, tankTop - P.callout.h] : partyMid(e.box);
    } else if (e.type === "return") {
      const rec = sim.returns.find((r) => r.step === s && r.event === at);
      const call = rec ? sim.calls[rec.call] : undefined;
      const outer = call?.depth === 0 && snapOf(s).status?.kind === "final";
      tag = outer ? words.tags.final : words.back;
      text = e.value ?? words.returned;
      tone = outer ? "good" : "call";
      const [cx, cy] = partyMid(call?.from ?? e.box);
      anchor = [cx, cy - P.callout.near];
    } else if (e.type === "call") {
      tag = words.call;
      const label = e.label ?? `${nameOf(e.from)} → ${nameOf(e.to)}`;
      text = e.value === undefined ? label : `${label} +${e.value} ${ETH}`;
      const b = branches.get(`${e.from}>${e.to}`);
      anchor = b ? [b.valve[0], b.valve[1] - P.callout.near] : partyMid(e.from);
    } else if (e.type === "write") {
      tag = e.name;
      text = e.value;
      tone = "value";
      mono = true;
      const plate = plateAt(sim.writes.find((w) => w.step === s && w.event === at)?.to ?? e.box, e.name);
      anchor = plate ? [plate.x + plate.w / 2, plate.y - P.callout.h] : partyMid(e.box);
    } else if (e.type === "emit") {
      tag = words.emitted;
      text = `${nameOf(e.box)}.${e.name}`;
      tone = "event";
      const [cx, cy] = partyMid(e.box);
      anchor = [cx, cy - P.callout.near];
    }
    const textStyle = mono ? T.calloutMono : T.callout;
    const w = Math.max(textWidth(text, textStyle), textWidth(tag, T.calloutTag)) + P.callout.padX * 2;
    const r = placeAt(w, P.callout.h, anchor, avoidAt(s), bandTop);
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    callouts.push({
      ...r,
      step: s,
      event: at,
      kind: e.type,
      tone,
      mono,
      tag: textAt(tag, cx, cy + P.callout.tagY, T.calloutTag, "middle"),
      text: textAt(text, cx, cy + P.callout.textY, textStyle, "middle"),
    });
  }

  // 段ごとに関わる関係者を囲む所
  const focus = stepList.flatMap((s) => {
    const ids = [...new Set((diagram.steps[s] as Step).events.flatMap(partiesOf))].filter((id) => visible.has(id));
    if (ids.length === 0) return [];
    const rects = ids.map(rectOf);
    const left = Math.min(...rects.map((r) => r.x));
    const top = Math.min(...rects.map((r) => r.y));
    return [{ step: s, x: left, y: top, w: Math.max(...rects.map((r) => r.x + r.w)) - left, h: Math.max(...rects.map((r) => r.y + r.h)) - top }];
  });

  return {
    kind: "pipe",
    arrangement: "wide",
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
    flows,
    calls,
    mains,
    lanes,
    plates,
    writes,
    gauges,
    checks: [],
    events,
    converters,
    housings,
    ties,
    folds: foldBoxes,
    rings,
    callouts,
    heads,
    focus,
  };
}
