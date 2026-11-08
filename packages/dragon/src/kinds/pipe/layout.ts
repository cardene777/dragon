/**
 * 配管の図の置き場所の形と、段ごとの値を当てる手順 (#3389、#3418)。見た目の元は Tracelyth の第6回の試作の「4 配管」(#3398)。
 *
 * 関係者の種類は行から導く。残高の単位に名前を書かれた関係者はトークンの Contract、最初の呼び出しを呼んだ者は送り手、
 * ほかに呼ぶか呼ばれる者は Contract、どちらでもない者は口座。
 * 段の中の出来事は記法を読む所と同じ手順 (`PipeRun`) に当て、段ごとの残高と値と、変更が暫定か確定か取り消しかを作る。
 * 変更は一番外の呼び出しが戻った段で確定し、落ちた呼び出しの内側の変更は、落ちた段で取り消しの印を付けて元の値へ戻る。
 * `[fold]` の呼び出しの内側の段は、描く前に 1 つの段へまとめる (`foldPipe`)。
 *
 * 部品の置き場所を組む手順 (`layoutPipe`) は、槽と値の札を持ち主ごとの囲いにまとめ、流れでつながる囲いを隣に並べる。
 * 流れが輪になる時は、輪の 1 つを下の段に置いて輪にする。
 * 名札は自分の囲いの真上に置き、呼び出しの深さで行を下げる。トークンの箱は自分のトークンの値の管の横に走る所に載せる。
 * 値の管は槽の横の口どうしを結び、ほかの値の管と交わらない。呼び出しの管は値の管を直角に 1 回だけくぐり、名札と槽を横切らない。
 * 管の道は `pipe-route.ts` が格子の上で探す。道が見つからない時は、囲いの間と管の道を広げて組み直す。
 * 決まりの表 (`pipe-rules.ts`) は組んだ置き場所を後から測る。組み方は表を読まず、表の値が守れる間を空けて置く。
 * 狭い枠では、図を枠の幅に縮めても槽の残高と今の段の値が読める大きさの字で組み直す。
 * 並べ方は描き方を読まない。描く部品は `render/pipe.ts` とブロックの描き方が持つ (#3418)。
 */
import { ETH } from "../../blocks/return/block";
import { joinWords } from "../../figure-text";
import { textWidth } from "../../layout/measure";
import type { Layout, Point, Rect } from "../../layout/scene";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import type { TextStyle } from "../../look/values";
import { type Ask, type Dir, type End, gridLines, type Laid, type Obstacle, Router, simplify, unjog } from "../../pipe-route";
import { checkPasses, isFault, keyOf, minus, PipeRun, rateOf } from "../../pipe-run";
import { valveRects } from "../../pipe-valve";
import type { CheckOp, DiagramModel, PipeCallKind, PipeCheck, PipeFold, Step } from "../../schema";
import { DEFAULT_LANG, type NotationLang } from "../../words";


/** 変更の印。`none` は変わっていない、`provisional` は暫定、`final` は確定、`rolled` は取り消し */
export type PipeState = "none" | "provisional" | "final" | "rolled";
/** 関係者の種類 */
export type PipeRole = "sender" | "contract" | "token" | "account";
/** 名札の形。`round` は丸の名札、`cabinet` は Contract の箱、`token` はトークンの箱 */
export type PipeShape = "round" | "cabinet" | "token";

/** 配管の図の言葉。図の原本は語を持たないので、描く時の言葉で引く */
export interface PipeWords {
  tags: Record<Exclude<PipeState, "none">, string>;
  /** 始めた人が払った槽の印と、受け取った槽の印 */
  io: { in: string; out: string };
  fold: (steps: number, parties: number) => string;
  open: string;
  foldTitle: (name: string) => string;
  join: (titles: readonly string[]) => string;
}

export const PIPE_TEXT: Record<NotationLang, PipeWords> = {
  ja: {
    tags: { provisional: "暫定", final: "確定", rolled: "取り消し" },
    io: { in: "入力", out: "出力" },
    fold: (steps, parties) => `内側の${steps}段と${parties}人`,
    open: "押すと開く",
    foldTitle: (name) => `${name}の内側をまとめて進む`,
    join: (titles) => `${titles.join("。")}。`,
  },
  en: {
    tags: { provisional: "Pending", final: "Final", rolled: "Undone" },
    io: { in: "In", out: "Out" },
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
  /** 槽の下の今の残高。3 桁ごとに区切る */
  text: PipeText;
  /** 残高の下の増えた分か減った分 (`+100 USDC`)。変わった段から確定するまでと、確定と取り消しの段に出す。狭い枠では出さない */
  delta?: PipeText;
  /** 増減の下に添える暫定か確定か取り消しの語 */
  tag?: PipeText;
  /** 前の量の水位。前の数を持つ槽だけが持つ */
  base?: Rect;
  /** 段の始まりの水位。この段で変わった槽だけが持つ */
  from?: Rect;
}
/** トークンごとの管の横に走る所。トークンの箱を載せる管の所で、弁 (`valve`) はトークンの Contract の弁。`ETH` の管と、トークンの箱を描かない管は弁を持たない */
export interface PipeBus {
  token: string;
  y: number;
  x1: number;
  x2: number;
  valve?: { party: string; x: number; y: number };
}
/** 値の管の口。槽の左か右の縁の上の点 */
export interface PipePort {
  party: string;
  token: string;
  side: "left" | "right";
  x: number;
  y: number;
}
/**
 * 値の管。持ち主の槽の横の口どうしを結ぶ折れ線。`from` と `to` は最初に流れた向き。
 * `group` は幹の組で、同じ組の管は根の槽の口を共に出て 1 本の幹を重なって通り、相手の近くで枝分かれする。組の違う管とは重ならない
 */
export interface PipeValuePipe {
  token: string;
  from: string;
  to: string;
  points: Point[];
  ports: [PipePort, PipePort];
  tone: number;
  group: string;
}
/** 値の管を持たないトークンの箱を、持ち主の槽へ結ぶ短い管 */
export interface PipeStub {
  token: string;
  points: Point[];
}
/** 呼び出しの管が値の管の下をくぐる所。`pipe` は値の管 (`valuePipes`) の番号、`vertical` は呼び出しの管が縦に走るか */
export interface PipeCrossing {
  call: number;
  token: string;
  pipe: number;
  x: number;
  y: number;
  vertical: boolean;
}
/**
 * 図の中の札。`kind` は役で、流れた量 (`amount`)、イベント (`event`)、戻り値 (`return`)、計器の式 (`formula`)、入力と出力の印 (`io`)。
 * `size` は字の大きさ、`rx` は角の丸み (どちらも図の座標)。戻り値の札は呼び出しの管 (`path`) を伝って動き、呼んだ側に着いて消える
 */
export interface PipeChip extends Rect, PipeAt {
  kind: "amount" | "event" | "return" | "formula" | "io" | "delta";
  text: string;
  size: number;
  rx: number;
  label: PipeText;
  party?: string;
  token?: string;
  /**
   * 流れた量の札が名指す流れ (`PipeFlow` の `id`、#3528)。崩れの確かめが、札と流れの管の離れを測る。
   * 狭い枠の図の下の帯に並べた札は、管から離して置くと決めた札なので持たない
   */
  flow?: number;
  /** 札の色の役。`state` は流れた量とイベントの印、`ok` は計器の式の結果 */
  state?: PipeState;
  ok?: boolean;
  tone?: number;
  /** 戻り値の札が伝う道 (呼ばれた側から呼んだ側へ) と、戻した呼び出しの番号 */
  path?: Point[];
  call?: number;
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
  /** 向きの印の場所と向き。`vertical` は縦に走る所の印で、`dir` は右か下へ流れる時 1、左か上へ -1 */
  arrow: { x: number; y: number; dir: 1 | -1; vertical: boolean };
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
/**
 * 本管の枝。弁 (`valve`) は枝の上の、ほかの線から離れた所に置く。`vertical` は弁を置いた所が縦に走るか、
 * `under` は取っ手を管の下 (縦の管では左) に立てるか。取っ手は上 (縦の管では右) の側にほかの線が通る時に下の側へ立てる
 */
export interface PipeBranch {
  to: string;
  points: Point[];
  valve: { x: number; y: number; vertical: boolean; under: boolean };
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
/** 計器。`on` は載せる管 (`call` は呼び出しの管、`value` は値の管、`party` は呼ばれない者の名札の横)。式は図の中の札 (`formula`) が持つ */
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
/** 持ち主ごとの槽と値の札の点線の囲い。`row` は囲いの段 (一番上が 0) */
export interface PipeHousing extends Rect {
  party: string;
  row: number;
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
export interface PipeLayout extends Layout {
  kind: "pipe";
  /** 広い枠は縮めずに横に長いまま並べ、狭い枠は枠の幅に縮める */
  arrangement: "wide" | "fit";
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
  valuePipes: PipeValuePipe[];
  stubs: PipeStub[];
  crossings: PipeCrossing[];
  chips: PipeChip[];
  /** 狭い枠に合わせて並べたか。狭い枠は図を枠の幅に縮めて全体を出す */
  narrow: boolean;
  /** 段ごとに動く関係者を囲む所。再生の部品が横に送る時と、寄って追う窓が段ごとに見る */
  focus: (Rect & { step: number })[];
}

export interface PipeLayoutOptions {
  lang?: NotationLang;
  /** 描く枠の幅。`PIPE_LOOK.narrow.frame` より狭い枠では、槽の残高と今の段の値を大きな字で出す */
  width?: number;
}

// ---- 字

export function textAt(text: string, x: number, base: number, style: TextStyle, anchor: "start" | "middle" = "start"): PipeText {
  const w = textWidth(text, style);
  return { text, x: anchor === "middle" ? x - w / 2 : x, y: base - style.size * 0.8, w, h: style.size, base };
}

/** 高さ `h` の札の上の端 `top` から、字の真ん中を札の真ん中に置く基準線 */
export const middleBase = (top: number, h: number, style: TextStyle): number => top + h / 2 + style.size * 0.35;

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
export function partiesOf(e: Step["events"][number]): string[] {
  if (e.type === "call") return [e.from, e.to];
  if (!("box" in e)) return [];
  return e.type === "move" ? [e.box, e.from, e.to] : [e.box];
}

// ---- 段ごとの値を当てる

export interface CallRec {
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
export interface FlowRec {
  id: number;
  step: number;
  event: number;
  token: string;
  from: string;
  to: string;
  amount: string;
}
export interface EmitRec {
  id: number;
  step: number;
  event: number;
  party: string;
  name: string;
  args?: string[];
}
export interface CheckRec {
  step: number;
  event: number;
  party: string;
  ok: boolean;
  check: Pick<PipeCheck, "left" | "op" | "right">;
}
export interface CalcRec {
  step: number;
  event: number;
  party: string;
  input: string;
  output: string;
  rate: string;
}
export interface Snap {
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

export interface Simulated {
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

export function simulate(diagram: DiagramModel, foldSteps: ReadonlySet<number>): Simulated {
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

// ---- 字の形

/** 量の字を 3 桁ごとに区切る (#3398)。数でない字はそのまま */
export function grouped(amount: string): string {
  const m = /^(-?)(\d+)(\.\d+)?$/u.exec(amount);
  return m ? `${m[1] ?? ""}${(m[2] ?? "").replace(/\B(?=(\d{3})+(?!\d))/gu, ",")}${m[3] ?? ""}` : amount;
}

const P = PIPE_LOOK;
const T = PIPE_TYPE;

/** 字の大きさ。狭い枠では、縮めても読める大きさに上げる */
interface Sizes {
  amount: number;
  chip: number;
}

/** 組む時の間の広さ。管が通らない時に広げて組み直す */
interface Plan {
  /** 囲いの間に足す幅 */
  gap: number;
  /** 管を通す道の下限の数 */
  lanes: number;
  /** 名札の行の間に足す高さ */
  rows: number;
  /** 囲いの外側の道の数 */
  outer: number;
  /** 最後の組み方。値の管がほかの値の管を越えてよい (決まりの表が違反に数える) */
  last: boolean;
}

const PLANS: Plan[] = [
  { gap: 0, lanes: 1, rows: 0, outer: 2, last: false },
  { gap: P.lane.pitch, lanes: 2, rows: P.lane.pitch, outer: 3, last: false },
  { gap: P.lane.pitch * 2, lanes: 3, rows: P.lane.pitch, outer: P.lane.outer, last: false },
  { gap: P.lane.pitch * 2, lanes: 3, rows: P.lane.pitch, outer: P.lane.outer, last: true },
];

/** 組んだ置き場所の覚え。色味を替えて描き直す時と、同じ図を何度も描く時に組み直さない */
const CACHE = new Map<string, PipeLayout>();
const CACHE_SIZE = 48;

/** 札の高さ。入力と出力の印は囲いの上の余白に収める */
const IO_H = 20;
/** 平行な管の縁どうしの間と、管と部品の間 */
const LINE_GAP = 10;
/** 呼び出しの管の上の弁と計器の間 */
const SPACING = P.call.room;
/** 呼び出しの管は、呼ばれた側の縁からこの長さ手前で向きを揃えてから入る */
const APPROACH = 18;
/** 部品どうしの間の下限 */
const PART_GAP = 8;
/** 同じ横から出る管の高さの間。管の太さと平行な管の縁どうしの間 */
const LANE_STEP = P.call.case + LINE_GAP;
/**
 * 呼び出しの管が箱の縁の角から離れる長さ。管の太さの半分と角の丸み。
 * これより角に近い所から出入りする管は角の丸みにかかり、箱の縁の後ろを通って見える (#3523)
 */
const cornerRoom = (radius: number): number => P.call.case / 2 + radius;
/**
 * 一番上の行の名札の上の空き。名札を越えて上の口へ下りる管が、口の手前の線 (`APPROACH`) の 1 本上を、
 * 図の上の縁から管の太さ 1 本分離れて通る (#3523)
 */
const TOP_ROOM = APPROACH + P.call.case + P.call.case / 2 + P.call.case;
/** 呼び出しの管の弁が描く形 (胴と軸と取っ手) と、ほかの線の縁の間の下限。決まりの表 (`valve-clearance`) と同じ値 */
const VALVE_ROOM = 3;
/**
 * 上の行の者から真下の行の者へ下りる呼び出しの管の、弁を縦に置ける長さ。弁の胴を下りる前の横の線 (同じ者の管が共に通る) から離し、
 * 下へ倒れる開いた取っ手を呼ばれた側の名札から離す。弁の置き場所は 4px 刻みで探すため、その 1 刻みを足す
 */
const VALVE_DROP = P.call.case / 2 + VALVE_ROOM + P.valve.r + 4 + (P.valve.lever - P.valve.leverH / 2) + VALVE_ROOM;
/**
 * 幹を共に通る値の管が、先に引いた同じ組の管と重なって走る所の長さに掛ける割合。
 * 小さいほど幹を長く共に通る。重なった所を離れて並ぶ道より安くし、遠回りしてまで共に通らない値にする
 */
const SHARE = 0.3;
/** 値の管が折れる時に足す値 */
const BEND_VALUE = 60;
/** 弁を置くために引き直す呼び出しの管の、元の道の長さに対する長さの上限 */
const DETOUR_RATE = 1.5;
/** ほかの管の弁に譲る呼び出しの管が、名札の縁から出て折れるまでの短い長さ。自分の弁が両側に決まりの間を空けて載る */
const SHORT_RUN = P.valve.r * 2 + P.call.room + VALVE_ROOM * 2;

const amountNumber = (amount: string | undefined): number => {
  const n = Number(amount);
  return Number.isFinite(n) ? n : 0;
};
const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
const sized = (style: TextStyle, size: number): TextStyle => ({ ...style, size });
const grow = (r: Rect, d: number): Rect => ({ x: r.x - d, y: r.y - d, w: r.w + d * 2, h: r.h + d * 2 });
/** 2 つの四角が `d` より離れているか */
const apart = (a: Rect, b: Rect, d: number): boolean => a.x + a.w + d <= b.x || b.x + b.w + d <= a.x || a.y + a.h + d <= b.y || b.y + b.h + d <= a.y;
/** 線分と四角 (`pad` だけ広げた) が重なるか。線分は縦か横 */
function hits(a: Point, b: Point, r: Rect, pad: number): boolean {
  const x0 = Math.min(a[0], b[0]) - pad;
  const x1 = Math.max(a[0], b[0]) + pad;
  const y0 = Math.min(a[1], b[1]) - pad;
  const y1 = Math.max(a[1], b[1]) + pad;
  return x1 > r.x && x0 < r.x + r.w && y1 > r.y && y0 < r.y + r.h;
}
/** 折れの数の上限。決まりの表の `bends` と同じ値 */
const MAX_BENDS = 4;
const bendsOf = (points: readonly Point[]): number => Math.max(0, simplify(points).length - 2);
/** 流れた量の札を管に沿って置く所 (線分の長さに対する割合)。真ん中に近い順に試し、どれも塞がる時は細かく刻んだ所を試す */
const AMOUNT_AT = [0.5, 0.3, 0.7, 0.15, 0.85, 0.4, 0.6, 0.2, 0.8, 0.1, 0.9, 0.25, 0.75, 0.35, 0.65, 0.45, 0.55, 0.05, 0.95];
/** 呼び出しの管が 1 本の値の管を 2 度越える時に、探し直す道でその管の組を越える値 */
const REVISIT = 2000;
/** 折れ線 `p` が折れ線 `q` を直角に越える回数。端どうしで触れるだけの所は数えない */
function crossedTimes(p: readonly Point[], q: readonly Point[]): number {
  let n = 0;
  for (const [a, b] of segs(p))
    for (const [u, v] of segs(q)) {
      const fa = flat(a, b);
      if (fa === flat(u, v)) continue;
      const [h1, h2, v1, v2] = fa ? [a, b, u, v] : [u, v, a, b];
      const x = v1[0];
      const y = h1[1];
      if (x > Math.min(h1[0], h2[0]) + 1e-6 && x < Math.max(h1[0], h2[0]) - 1e-6 && y > Math.min(v1[1], v2[1]) + 1e-6 && y < Math.max(v1[1], v2[1]) - 1e-6) n++;
    }
  return n;
}
/** 前から順に比べて、最初に違う値で `a` が小さいか */
const lessThan = (a: readonly number[], b: readonly number[]): boolean => {
  const i = a.findIndex((v, j) => v !== b[j]);
  return i >= 0 && (a[i] as number) < (b[i] as number);
};
/**
 * 道を探し、仕上げた道の折れが上限を超える時は、折れを重く数えて探し直す。折れが減った時だけ探し直した道を採る。
 * 長さより折れの少なさを優先した道は遠回りになることがあるため、上限を超えた時だけ使う
 */
function fewerBends<T extends { points: Point[] }>(router: Router, ask: Ask, finish: (path: Point[]) => T | undefined): T | undefined {
  const first = router.route(ask);
  // 道が無い時は、折れの重さを変えても道は無い
  if (!first) return undefined;
  const done = finish(first);
  const count = (t: T | undefined): number => (t === undefined ? Number.POSITIVE_INFINITY : bendsOf(t.points));
  if (done !== undefined && count(done) <= MAX_BENDS) return done;
  const again = router.route({ ...ask, bend: ask.bend * 10 });
  const redone = again ? finish(again) : undefined;
  return count(redone) < count(done) ? redone : done;
}
const segs = (points: readonly Point[]): [Point, Point][] => points.slice(1).map((b, i) => [points[i] as Point, b]);
const flat = (a: Point, b: Point): boolean => Math.abs(a[1] - b[1]) < 0.5;
const lengthOf = (points: readonly Point[]): number => segs(points).reduce((s, [a, b]) => s + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), 0);
/** 点の並びを、始まりから `d` 進んだ所から先だけにする */
function fromAlong(points: readonly Point[], d: number): Point[] {
  const out: Point[] = [along(points, d)];
  let walked = 0;
  for (const [a, b] of segs(points)) {
    walked += Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    if (walked > d) out.push(b);
  }
  return out;
}
/** 点の並びの上の、始まりから `d` 進んだ所 */
function along(points: readonly Point[], d: number): Point {
  let left = d;
  for (const [a, b] of segs(points)) {
    const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    if (left <= len) {
      const k = len === 0 ? 0 : left / len;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    left -= len;
  }
  return points[points.length - 1] ?? [0, 0];
}

/**
 * 縦と横の折れ線を、進む向きの左へ `d` だけずらす。角は 2 本のずらした線の交わる所に置く。
 * 同じ管を同じ段に流れた分をずらして重ねない時に使う
 */
function offsetPath(points: readonly Point[], d: number): Point[] {
  if (d === 0 || points.length < 2) return points.map((p): Point => [p[0], p[1]]);
  const normal = (a: Point, b: Point): Point => {
    const dx = Math.sign(b[0] - a[0]);
    const dy = Math.sign(b[1] - a[1]);
    return [dy * d, -dx * d];
  };
  const parts = segs(points).map(([a, b]) => {
    const [nx, ny] = normal(a, b);
    return [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx, b[1] + ny],
    ] as [Point, Point];
  });
  const out: Point[] = [(parts[0] as [Point, Point])[0]];
  for (let k = 1; k < parts.length; k++) {
    const [, pb] = parts[k - 1] as [Point, Point];
    const [qa] = parts[k] as [Point, Point];
    const prevFlat = Math.abs((parts[k - 1] as [Point, Point])[0][1] - pb[1]) < 0.5;
    out.push(prevFlat ? [qa[0], pb[1]] : [pb[0], qa[1]]);
  }
  out.push((parts[parts.length - 1] as [Point, Point])[1]);
  return out;
}

export function layoutPipe(diagram: DiagramModel, options: PipeLayoutOptions = {}): PipeLayout {
  const lang = options.lang ?? DEFAULT_LANG;
  const frame = options.width;
  const narrow = frame !== undefined && frame < P.narrow.frame;
  const key = `${lang}|${narrow ? frame : "wide"}|${JSON.stringify(diagram)}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const remember = (k: string, layout: PipeLayout): PipeLayout => {
    if (CACHE.size >= CACHE_SIZE) CACHE.delete(CACHE.keys().next().value as string);
    CACHE.set(k, layout);
    return layout;
  };
  let sizes: Sizes = { amount: T.amount.size, chip: T.chip.size };
  // 狭い枠も、字の大きさを決めるために広い枠の図を先に組む。広い枠で描いた図が覚えに在ればそれを使う
  const wideKey = `${lang}|wide|${JSON.stringify(diagram)}`;
  let out = CACHE.get(wideKey) ?? remember(wideKey, compose(diagram, lang, sizes, false));
  if (narrow) {
    // 広い枠の図を枠の幅へ縮めた時に、画面で `px` の大きさに見える字で 1 度だけ組み直す。組み方は広い枠で組めた組み方から試す。
    // 大きな字で図が広がると縮める割合も変わるが、くり返して合わせない。札の多い図では字を上げるほど図が広がり、
    // 字が際限なく大きくなるため (aggregator は 10726px の幅に 293px の字まで広がった)。要る大きさより少し大きく組み、広がる分を見込む
    const want = Math.ceil(((P.narrow.px * out.width) / frame) * NARROW_OVER * 10) / 10;
    sizes = { amount: Math.max(T.amount.size, want), chip: Math.max(T.chip.size, want) };
    out = compose(diagram, lang, sizes, true, PLAN_OF.get(out) ?? 0);
  }
  return narrow ? remember(key, out) : out;
}

/** 値の管の定め。同じトークンの、同じ 2 人の間の流れは 1 本の管を通る */
interface Def {
  token: string;
  from: string;
  to: string;
  flows: FlowRec[];
}

/** 組んだ図がどの組み方 (`PLANS` の番号) で組めたか */
const PLAN_OF = new WeakMap<PipeLayout, number>();
/** 狭い枠の字を、要る大きさよりどれだけ大きく組むか */
const NARROW_OVER = 1.06;

function compose(diagram: DiagramModel, lang: NotationLang, sizes: Sizes, narrow: boolean, from = 0): PipeLayout {
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
  const amountStyle = sized(T.amount, sizes.amount);
  const chipStyle = T.chip;
  const chipH = P.chip.h;
  /** 狭い枠の、図の下の帯に出す大きな札の字 */
  const bigStyle = sized(T.chip, sizes.chip);
  const bigH = Math.max(P.chip.h, Math.ceil(sizes.chip * 1.6));

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
  const shown = sim.calls.filter((c) => !c.inner && visible.has(c.from) && visible.has(c.to));

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
  const boxOf = (token: string): string | undefined => {
    const id = tokenParty.get(token);
    return id !== undefined && visible.has(id) ? id : undefined;
  };

  // 値の管。同じトークンの同じ 2 人の間の流れは 1 本の管を通る
  const moving = sim.flows.filter((f) => !foldSteps.has(f.step) && f.from !== f.to && has(f.from, f.token) && has(f.to, f.token));
  const defs: Def[] = [];
  for (const f of moving) {
    const d = defs.find((x) => x.token === f.token && ((x.from === f.from && x.to === f.to) || (x.from === f.to && x.to === f.from)));
    if (d) d.flows.push(f);
    else defs.push({ token: f.token, from: f.from, to: f.to, flows: [f] });
  }
  const defOf = (f: FlowRec): number => defs.findIndex((d) => d.token === f.token && d.flows.includes(f));

  // ---- 囲いの段と並び

  const rank = new Map<string, number>();
  for (const f of moving) for (const id of [f.from, f.to]) if (!rank.has(id)) rank.set(id, rank.size);
  for (const h of holders) if (!rank.has(h)) rank.set(h, rank.size);
  const rankOf = (id: string): number => rank.get(id) ?? 0;
  const linked = (a: string, b: string): boolean => defs.some((d) => (d.from === a && d.to === b) || (d.from === b && d.to === a));
  // 隣の者の並び。呼び出しの浅い者を先に、同じ深さは流れに先に出た者を先にする。呼ばれない者は呼ばれる者の後
  const callDepth = (id: string): number => depthOf.get(id) ?? Number.POSITIVE_INFINITY;
  const nbrs = new Map(
    holders.map((a) => [a, holders.filter((b) => b !== a && linked(a, b)).sort((x, y) => callDepth(x) - callDepth(y) || rankOf(x) - rankOf(y))]),
  );
  /**
   * `from` から伸びる一番長い道。同じ長さの道は、呼び出しの浅い者を先に通る道。
   * 名札の行は呼び出しの深さで下がるため、浅い者の囲いを上の段に並べると、浅い者どうしの呼び出しの管が上の段の中で短く済む
   */
  const longest = (from: string, avoid: ReadonlySet<string>): string[] => {
    let best: string[] = [from];
    let budget = 20000;
    const path = [from];
    const walk = (): void => {
      if (--budget < 0) return;
      if (path.length > best.length) best = [...path];
      for (const n of nbrs.get(path[path.length - 1] as string) ?? []) {
        if (path.includes(n) || avoid.has(n)) continue;
        path.push(n);
        walk();
        path.pop();
      }
    };
    walk();
    return best;
  };
  const band0: string[] = [];
  const band1: string[] = [];
  const done = new Set<string>();
  for (const seed of [...holders].sort((a, b) => rankOf(a) - rankOf(b))) {
    if (done.has(seed)) continue;
    const comp: string[] = [];
    const queue = [seed];
    while (queue.length > 0) {
      const id = queue.shift() as string;
      if (done.has(id)) continue;
      done.add(id);
      comp.push(id);
      queue.push(...(nbrs.get(id) ?? []));
    }
    const start = sender !== undefined && comp.includes(sender) ? sender : seed;
    const path = longest(start, new Set());
    const ext = longest(start, new Set(path)).slice(1);
    const chain = [...ext.reverse(), ...path];
    // 隣どうしが 3 人とも流れでつながる所は、後から流れに出た者を下の段に下ろして輪にする
    for (let again = true; again; ) {
      again = false;
      for (let i = 1; i < chain.length - 1; i++) {
        const tri = [chain[i - 1], chain[i], chain[i + 1]] as string[];
        if (!(linked(tri[0] as string, tri[1] as string) && linked(tri[1] as string, tri[2] as string) && linked(tri[0] as string, tri[2] as string))) continue;
        const drop = tri.filter((x) => x !== start).sort((a, b) => rankOf(b) - rankOf(a))[0] as string;
        chain.splice(chain.indexOf(drop), 1);
        again = true;
        break;
      }
    }
    band0.push(...chain);
    band1.push(...comp.filter((id) => !chain.includes(id)));
  }
  const bandOf = (id: string): 0 | 1 | undefined => (band0.includes(id) ? 0 : band1.includes(id) ? 1 : undefined);

  // 槽の並び。流れの相手が左に居る槽を左に置く
  const posGuess = new Map<string, number>(band0.map((id, i) => [id, i]));
  for (let pass = 0; pass < 2; pass++)
    for (const id of band1) {
      const near = (nbrs.get(id) ?? []).flatMap((n) => (posGuess.has(n) && (pass > 0 || bandOf(n) === 0) ? [posGuess.get(n) as number] : []));
      posGuess.set(id, near.length > 0 ? mean(near) : band0.length / 2);
    }
  const scoreOf = (h: string, token: string): number => {
    const ds = defs.filter((d) => d.token === token && (d.from === h || d.to === h)).map((d) => (posGuess.get(d.from === h ? d.to : d.from) ?? 0) - (posGuess.get(h) ?? 0));
    return ds.length > 0 ? mean(ds) : 0;
  };
  // 相手が同じ向きに居る槽どうしは、相手が左に居る時は逆の順に並べる。向かい合う 2 つの囲いで並びが鏡になり、管が入れ子になって交わらない
  for (const h of holders) {
    const list = tanksOf.get(h) ?? [];
    list.sort((a, b) => scoreOf(h, a) - scoreOf(h, b) || (scoreOf(h, a) < 0 ? -1 : 1) * (tokens.indexOf(a) - tokens.indexOf(b)));
  }

  // ---- 部品の大きさ

  const nameW = (id: string): number => textWidth(nameOf(id), T.party);
  const arrowW = textWidth("→", T.keyValue);
  /** 呼ぶ者の数。トークンの箱は呼ぶ者ごとに上から入る口を 1 つずつ持てる幅にする。横の 2 つの口は、下の段から来る管が箱の上へ回る道に残す */
  const inboundOf = (id: string): number => new Set(shown.filter((c) => c.to === id && c.from !== id).map((c) => c.from)).size;
  const topsW = (id: string): number => 2 * (Math.ceil((inboundOf(id) - 1) / 2) * (P.call.case + LINE_GAP) + P.call.case);
  const tokenW = (id: string): number =>
    Math.max(
      P.token.w,
      topsW(id),
      nameW(id) + P.token.nameW,
      ...(platesOf.get(id) ?? []).flatMap((name) => {
        const history = historyOf(`v${keyOf(id, name)}`);
        return [textWidth(name, T.key) + P.token.keyW, widest(history, T.keyValue) * 2 + arrowW + P.token.arrowGap * 2 + P.token.keyW];
      }),
    );
  const tokenH = (id: string): number => P.token.h + P.token.line * (platesOf.get(id) ?? []).length;
  const sizeOf = (id: string): { w: number; h: number } => {
    const shape = shapeOf(id);
    if (shape === "token") return { w: tokenW(id), h: tokenH(id) };
    if (shape === "round") return { w: P.avatar.size, h: P.avatar.size };
    return { w: P.cabinet.pad + nameW(id) + P.cabinet.end, h: P.cabinet.h };
  };
  /** 名札の上と下の張り出し (真ん中から)。丸の名札は下に名前を書く */
  const aboveOf = (id: string): number => sizeOf(id).h / 2;
  const belowOf = (id: string): number => (shapeOf(id) === "round" ? P.avatar.nameY + T.party.size * 0.35 : sizeOf(id).h / 2);
  /** 名札が横に占める幅。丸の名札は下に書く名前の幅まで */
  const roomOf = (id: string): number => (shapeOf(id) === "round" ? Math.max(P.avatar.size, nameW(id) + 8) : sizeOf(id).w);

  // イベントの札の字。同じ者が同じ段に同じ名前のイベントを 2 つ以上出した時は、1 つの札にまとめて数を添える
  const chipTextOf = (e: EmitRec): string => `${nameOf(e.party)}.${e.name}`;
  const argsOf = (e: EmitRec): string | undefined => (e.args && e.args.length > 0 ? e.args.join(", ") : undefined);
  const chipW = (text: string, style: TextStyle = chipStyle): number => P.chip.padX * 2 + textWidth(text, style);
  const eventW = (party: string): number =>
    narrow ? 0 : Math.max(0, ...sim.emits.filter((e) => e.party === party).map((e) => chipW(`${chipTextOf(e)} ×9`) + (argsOf(e) ? P.chip.argsGap + textWidth(argsOf(e) ?? "", T.args) : 0)));

  // 計器。値を払う前の確認は、払う値の管に載せる (#3398)
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
  const checkers = [...new Set(sim.checks.map((c) => c.party))].filter((id) => visible.has(id));
  const gaugeToken = new Map<string, string>();
  for (const party of checkers) {
    const token = isBox(party) ? sim.tokens.get(party) : paysOn(party);
    if (token !== undefined && boxOf(token) !== undefined && !gone.has(token)) gaugeToken.set(party, token);
  }
  const formulaOf = (c: CheckRec): string => `${c.check.left} ${OP_TEXT[c.check.op]} ${c.check.right}`;
  const formulaW = (party: string): number => Math.max(0, ...sim.checks.filter((c) => c.party === party).map((c) => chipW(formulaOf(c))));
  const gaugeColW = (party: string): number => Math.max(P.gauge.r * 2 + P.gauge.lampGap + P.gauge.lamp * 2, formulaW(party));

  // ---- 囲いの中身。槽を並べ、値の札を後ろに置く

  const housingH = P.housing.top + P.tank.h + Math.max(P.housing.text, narrow ? Math.ceil(sizes.amount * 1.25) + P.housing.pad : 0);
  interface Inner {
    tanks: { token: string; dx: number; w: number }[];
    plates: { name: string; dx: number; w: number }[];
    w: number;
  }
  /** 槽の下の残高の行の幅と、その下の増減と語の行の幅。狭い枠は増減と語を描かない */
  const balanceW = (h: string, token: string): number => widest(historyOf(`b${keyOf(h, token)}`).map(grouped), amountStyle);
  const subW = (h: string, token: string): number =>
    narrow ? 0 : Math.max(widest(historyOf(`b${keyOf(h, token)}`).map((v) => joinWords(`+${grouped(v)}`, token)), T.delta), ...Object.values(words.tags).map((t) => textWidth(t, T.tag)));
  const numberW = (h: string, token: string): number => Math.max(balanceW(h, token), subW(h, token));
  /** 槽の名前の幅。名前は字の間を空けて描く */
  const titleW = (token: string): number => textWidth(token, T.tankTitle) + [...token].length * T.tankTitle.size * P.tank.titleTrack;
  /** 槽の幅。名前が長い時は、名前がつやと目盛りにかからない幅まで広げる */
  const tankW = (token: string): number => Math.max(P.tank.w, Math.ceil(titleW(token)) + (P.tank.shine.x + P.tank.shine.w + PART_GAP) * 2);
  const innerOf = new Map<string, Inner>();
  for (const h of holders) {
    const list = tanksOf.get(h) ?? [];
    // 槽の下の数は槽より広いことがある。端の槽の数が囲いからはみ出さないよう、囲いの縁から槽までを数の半分まで空ける
    const overhang = (token: string): number => Math.max(0, numberW(h, token) / 2 - tankW(token) / 2);
    let x = P.housing.pad + (list[0] === undefined ? 0 : overhang(list[0]));
    const tanks: Inner["tanks"] = [];
    // 真ん中の槽の管は内側の口から出て、槽の間を下りて囲いの外へ出る。その槽の両隣の間を管 1 本分広げる
    const middle = (k: number): boolean => k > 0 && k < list.length - 1 && defs.some((d) => d.token === list[k] && (d.from === h || d.to === h));
    list.forEach((token, j) => {
      if (j > 0) {
        const prev = list[j - 1] as string;
        const pass = middle(j - 1) || middle(j) ? P.bus.case + LINE_GAP * 2 + PART_GAP : 0;
        x += Math.max(P.tank.inner, (numberW(h, prev) + numberW(h, token)) / 2 + PART_GAP * 2 - (tankW(prev) + tankW(token)) / 2 + pass);
      }
      tanks.push({ token, dx: x, w: tankW(token) });
      x += tankW(token);
    });
    const last = list[list.length - 1];
    if (last !== undefined && (platesOf.get(h) ?? []).length === 0) x += overhang(last);
    const plates: Inner["plates"] = [];
    for (const name of platesOf.get(h) ?? []) {
      if (tanks.length > 0 || plates.length > 0) x += P.plate.gap;
      const w = Math.max(P.plate.w, textWidth(name, T.tankTitle) + P.plate.padX, widest(historyOf(`v${keyOf(h, name)}`), T.plateValue) + P.plate.padX);
      plates.push({ name, dx: x, w });
      x += w;
    }
    innerOf.set(h, { tanks, plates, w: x + P.housing.pad });
  }

  // ---- トークンの箱を載せる管。隣の囲いを結ぶ管か、囲いの外側の口から横に出る管に載せる

  interface Home {
    token: string;
    box: string;
    /** 載せる管 (`defs` の番号)。管を持たない箱は持ち主の槽から短い管を引く */
    def?: number;
    /** 管が横に走る所の端の持ち主と向き。`gap` は隣の囲いの間 */
    party: string;
    side: "left" | "right";
    gap: boolean;
    /** 箱と計器とイベントの札の列の幅 */
    w: number;
    gauges: string[];
    /** 載せる管が出る口の高さの番号 (`P.tank.ports` の番号) */
    slot: number;
  }
  const sideOf = (h: string, token: string): ("left" | "right")[] => {
    const list = tanksOf.get(h) ?? [];
    const out: ("left" | "right")[] = [];
    if (list[0] === token && (innerOf.get(h)?.tanks.length ?? 0) > 0) out.push("left");
    if (list[list.length - 1] === token && (platesOf.get(h) ?? []).length === 0) out.push("right");
    return out;
  };
  const homes: Home[] = [];
  const docked = new Set<string>();
  const colW = (box: string, gauges: readonly string[]): number =>
    gauges.reduce((s, g) => s + gaugeColW(g) + PART_GAP, 0) + tokenW(box) + Math.max(0, eventW(box) + PART_GAP - tokenW(box) / 2) + PART_GAP * 2;
  for (const token of tokens) {
    const box = boxOf(token);
    if (box === undefined) continue;
    const gauges = checkers.filter((c) => gaugeToken.get(c) === token);
    const w = colW(box, gauges);
    let home: Home | undefined;
    // 隣どうしの囲いを結ぶ管
    for (const [k, d] of defs.entries()) {
      if (home || d.token !== token) continue;
      const [a, b] = [d.from, d.to];
      for (const band of [band0, band1]) {
        const i = band.indexOf(a);
        const j = band.indexOf(b);
        if (i < 0 || j < 0 || Math.abs(i - j) !== 1) continue;
        const [l, r] = i < j ? [a, b] : [b, a];
        if (sideOf(l, token).includes("right") && sideOf(r, token).includes("left") && !docked.has(`${l}|right`)) {
          home = { token, box, def: k, party: l, side: "right", gap: true, w, gauges, slot: 0 };
          docked.add(`${l}|right`);
          docked.add(`${r}|left`);
        }
      }
    }
    // 囲いの外側の口から横に出る管
    for (const [k, d] of defs.entries()) {
      if (home || d.token !== token) continue;
      // 段をまたぐ管は下の段の囲いに載せる。上の段は名札と囲いで横に長く、下の段は横が空いている
      for (const party of [d.from, d.to].sort((x, y) => (bandOf(y) ?? -1) - (bandOf(x) ?? -1))) {
        if (home) break;
        for (const side of sideOf(party, token)) {
          if (docked.has(`${party}|${side}`)) continue;
          home = { token, box, def: k, party, side, gap: false, w, gauges, slot: 0 };
          docked.add(`${party}|${side}`);
          break;
        }
      }
    }
    // 管を持たない箱は、持ち主の槽から短い管を引く
    if (!home)
      for (const party of holders.filter((h) => has(h, token))) {
        if (home) break;
        for (const side of sideOf(party, token)) {
          if (docked.has(`${party}|${side}`)) continue;
          home = { token, box, party, side, gap: false, w, gauges, slot: 0 };
          docked.add(`${party}|${side}`);
          break;
        }
      }
    if (home) homes.push(home);
  }
  const homeOfBox = new Map(homes.map((h) => [h.box, h]));
  // 箱を載せる管の口の高さ。同じ槽のほかの管が下の段へ向かう時は一番上の口に、上の段へ向かう時は一番下の口に載せる。
  // 真ん中の口に載せると、ほかの管が下へ出られる口が半分になり、残りは箱の管を越える
  {
    const slots = P.tank.ports as readonly number[];
    const topSlot = slots.indexOf(Math.min(...slots));
    const bottomSlot = slots.indexOf(Math.max(...slots));
    for (const m of homes) {
      const d0 = m.def === undefined ? undefined : defs[m.def];
      const ends = [m.party, ...(m.gap && d0 ? [d0.from === m.party ? d0.to : d0.from] : [])];
      let down = 0;
      let up = 0;
      for (const [k, d] of defs.entries()) {
        if (k === m.def || d.token !== m.token) continue;
        for (const e of ends) {
          if (d.from !== e && d.to !== e) continue;
          const diff = (bandOf(d.from === e ? d.to : d.from) ?? 0) - (bandOf(e) ?? 0);
          if (diff > 0) down++;
          if (diff < 0) up++;
        }
      }
      m.slot = down > up ? topSlot : up > down ? bottomSlot : 0;
    }
  }

  // 値の管の幹の組。同じトークンで同じ槽を端に持つ管が 2 本以上在る時、その槽を根にした組にし、管は根の槽の口を共に出て 1 本の幹を通り、
  // 相手の近くで枝分かれする。何本もの管が平行に並ぶ束にしない。両端が根になれる管は、管の多い方の槽の組に入れる。
  // トークンの箱を載せる管は箱の下を横に走る所を持つため、組に入れない
  const trunkOf = new Map<number, string>();
  {
    const homeDefs = new Set(homes.flatMap((m) => (m.def === undefined ? [] : [m.def])));
    const tankKey = (party: string, token: string): string => `t:${party}|${token}`;
    const degree = new Map<string, number>();
    for (const [k, d] of defs.entries()) {
      if (homeDefs.has(k)) continue;
      for (const party of [d.from, d.to]) degree.set(tankKey(party, d.token), (degree.get(tankKey(party, d.token)) ?? 0) + 1);
    }
    for (const [k, d] of defs.entries()) {
      if (homeDefs.has(k)) continue;
      const [a, b] = [tankKey(d.from, d.token), tankKey(d.to, d.token)];
      const root = (degree.get(b) ?? 0) > (degree.get(a) ?? 0) ? b : a;
      if ((degree.get(root) ?? 0) >= 2) trunkOf.set(k, root);
    }
  }
  /** 値の管の組。幹を共に通る管は根の槽の組、ほかは管ごとの組 */
  const groupOfDef = (k: number): string => trunkOf.get(k) ?? `v${k}`;

  // ---- 組む。管が通らない時は、間を広げて組み直す

  let result: PipeLayout | undefined;
  for (const plan of PLANS.slice(from)) {
    result = attempt(plan);
    if (result) {
      PLAN_OF.set(result, PLANS.indexOf(plan));
      break;
    }
  }
  return result as PipeLayout;

  function attempt(plan: Plan): PipeLayout | undefined {
    const pitch = P.lane.pitch;
    const corridor = plan.outer * pitch;
    const throughBand = band1.length > 0 || defs.some((d) => !isAdjacent(d));
    const laneW = (throughBand ? plan.lanes : 0) * pitch;

    // 横の置き場。囲いの列の幅は、囲いと名札とトークンの箱の列の広い方
    interface Col {
      id: string;
      x: number;
      w: number;
      hx: number;
    }
    const cols = new Map<string, Col>();
    const dockW = (h: string, side: "left" | "right"): number =>
      homes.filter((m) => !m.gap && m.party === h && m.side === side).reduce((s, m) => s + m.w + P.lane.clear * 2, 0);
    const gapW = (l: string): number => {
      const between = homes.filter((m) => m.gap && m.party === l);
      return Math.max(P.housing.gap, between.reduce((s, m) => s + m.w, 0) + P.lane.clear * 2) + laneW + plan.gap;
    };
    const roomW = (h: string): number => roomOf(h) + eventW(h) + PART_GAP;
    const lay = (band: readonly string[], start: number, want?: Map<string, number>): void => {
      let x = start;
      band.forEach((h, i) => {
        const inner = innerOf.get(h) as Inner;
        const lw = dockW(h, "left");
        const rw = dockW(h, "right");
        const w = Math.max(lw + inner.w + rw, roomW(h) + lw + rw);
        if (i > 0) x += gapW(band[i - 1] as string);
        const wanted = want?.get(h);
        if (wanted !== undefined) x = Math.max(x, wanted - w / 2);
        cols.set(h, { id: h, x, w, hx: x + lw + (w - lw - rw - inner.w) / 2 });
        x += w;
      });
    };
    lay(band0, 0);
    // 下の段の囲いは、流れでつながる上の段の囲いの真ん中の下に寄せる
    const anchor = new Map<string, number>();
    for (let pass = 0; pass < 2; pass++)
      for (const h of band1) {
        const near = (nbrs.get(h) ?? []).flatMap((n) => {
          const c = cols.get(n);
          return c && (pass > 0 || bandOf(n) === 0) ? [c.x + c.w / 2] : anchor.has(n) ? [anchor.get(n) as number] : [];
        });
        anchor.set(h, near.length > 0 ? mean(near) : (cols.get(band0[0] as string)?.x ?? 0));
      }
    const lower = [...band1].sort((a, b) => (anchor.get(a) ?? 0) - (anchor.get(b) ?? 0) || rankOf(a) - rankOf(b));
    if (lower.length > 0) {
      const halfW = (h: string): number => {
        const inner = innerOf.get(h) as Inner;
        return Math.max(dockW(h, "left") + inner.w + dockW(h, "right"), roomW(h) + dockW(h, "left") + dockW(h, "right")) / 2;
      };
      lay(lower, (anchor.get(lower[0] as string) ?? 0) - halfW(lower[0] as string), anchor);
      // 寄せた分の偏りを均す。下の段の真ん中を、寄せたい所の真ん中に合わせる
      const shift = mean(lower.map((h) => (anchor.get(h) ?? 0) - ((cols.get(h)?.x ?? 0) + (cols.get(h)?.w ?? 0) / 2)));
      if (shift < 0) for (const h of lower) {
        const c = cols.get(h) as Col;
        cols.set(h, { ...c, x: c.x + shift, hx: c.hx + shift });
      }
    }

    // 名札の行の横の置き場。囲いを持つ者は自分の囲いの真上、ほかは呼ぶ相手と呼ばれる相手の真ん中
    const xOf = new Map<string, number>();
    for (const [id, c] of cols) xOf.set(id, c.hx + (innerOf.get(id) as Inner).w / 2);
    const homeX = new Map<string, number>();
    const placeHomes = (): void => {
      for (const m of homes) {
        const c = cols.get(m.party);
        if (!c) continue;
        const inner = innerOf.get(m.party) as Inner;
        const gaugesW = m.gauges.reduce((s, g) => s + gaugeColW(g) + PART_GAP, 0);
        const boxLeft = (left: number): number => left + PART_GAP + gaugesW;
        let left: number;
        if (m.gap) left = c.hx + inner.w + (gapW(m.party) - laneW - plan.gap - m.w) / 2;
        else if (m.side === "right") left = c.hx + inner.w + P.lane.clear + homes.filter((x) => !x.gap && x.party === m.party && x.side === "right" && homes.indexOf(x) < homes.indexOf(m)).reduce((s, x) => s + x.w, 0);
        else left = c.hx - P.lane.clear - m.w - homes.filter((x) => !x.gap && x.party === m.party && x.side === "left" && homes.indexOf(x) < homes.indexOf(m)).reduce((s, x) => s + x.w, 0);
        homeX.set(m.box, left);
        xOf.set(m.box, boxLeft(left) + tokenW(m.box) / 2);
      }
    };
    placeHomes();

    const tagParties = order.filter((id) => !isBox(id) && bandOf(id) !== 1);
    const others = tagParties.filter((id) => !holding.has(id));
    const nearOf = (id: string): number[] =>
      [...new Set(shown.flatMap((c) => (c.to === id ? [c.from] : c.from === id ? [c.to] : [])))]
        .filter((n) => n !== id)
        .flatMap((n) => (xOf.has(n) ? [xOf.get(n) as number] : []));
    const maxRow = Math.max(0, ...tagParties.map(rowOf));
    /** 呼ぶ者が名札の横から出て向きを変えるまでの長さ。呼ばない者は 0 */
    const callerRun = (id: string): number =>
      Math.max(0, ...shown.filter((c) => c.from === id).map((c) => P.call.valveAt + P.valve.r + SPACING + (checkers.includes(c.to) && !gaugeToken.has(c.to) ? P.gauge.r * 2 + SPACING : 0)));
    /** 同じ行の名札と、上の行から自分の囲いへ下りる点線を避けて、`want` に一番近い所 */
    const freeX = (id: string, want: number): number => {
      const row = rowOf(id);
      const w = roomOf(id) + eventW(id);
      const occ: [number, number][] = [];
      for (const [other, cx] of xOf) {
        if (other === id || isBox(other) || bandOf(other) === 1) continue;
        const ow = roomOf(other);
        // 呼ぶ者の横には、弁を載せて向きを変えるまでの長さと、呼ばれた側の手前で向きを揃える長さを空ける
        const gap = Math.max(P.cabinet.gap + plan.gap / 2, callerRun(id) + callerRun(other) + APPROACH + PART_GAP);
        if (rowOf(other) === row) occ.push([cx - ow / 2 - gap, cx + ow / 2 + eventW(other) + gap]);
        if (holding.has(other) && rowOf(other) < row) occ.push([cx - P.lane.clear * 2, cx + P.lane.clear * 2]);
      }
      const ok = (cx: number): boolean => occ.every(([a, b]) => cx + w - roomOf(id) / 2 < a || cx - roomOf(id) / 2 > b);
      for (let d = 0; d < 1e5; d += 6) {
        if (ok(want + d)) return want + d;
        if (ok(want - d)) return want - d;
      }
      return want;
    };
    const later = others.filter((id) => nearOf(id).length === 0);
    for (const id of [...others.filter((id) => !later.includes(id))].sort((a, b) => rowOf(a) - rowOf(b))) xOf.set(id, freeX(id, mean(nearOf(id))));
    for (const id of later) {
      const near = nearOf(id);
      xOf.set(id, freeX(id, near.length > 0 ? mean(near) : (cols.get(band0[0] as string)?.x ?? 0)));
    }
    // 名札は、呼ぶ相手が上の行に居る時に、その相手の点線に重ならないよう、自分の囲いを持たない者だけを動かした
    // 一番左を図の左の余白に合わせる
    const lefts: number[] = [];
    for (const [id, c] of cols) lefts.push(c.x, (xOf.get(id) ?? 0) - roomOf(id) / 2);
    for (const id of others) lefts.push((xOf.get(id) ?? 0) - roomOf(id) / 2);
    const dx = P.edge + corridor - Math.min(...lefts, 0);
    for (const [id, c] of cols) cols.set(id, { ...c, x: c.x + dx, hx: c.hx + dx });
    for (const [id, x] of xOf) xOf.set(id, x + dx);
    for (const [id, x] of homeX) homeX.set(id, x + dx);

    // ---- 縦の置き場

    // 呼び出しの管の計器を載せる行。計器を載せる管は呼んだ者の行を横に出る
    const callGauge = new Map<string, number>();
    for (const party of checkers) {
      if (gaugeToken.has(party)) continue;
      const first = shown.find((c) => c.to === party);
      if (first && !isBox(party) && bandOf(first.from) !== 1) callGauge.set(party, rowOf(first.from));
    }
    const rowsWith = new Set(callGauge.values());
    const gaugeUp = P.gauge.r + P.chip.off + chipH;
    const rowY: number[] = [];
    for (let r = 0; r <= maxRow; r++) {
      const here = tagParties.filter((id) => rowOf(id) === r);
      const up = Math.max(P.row.top - (r === 0 ? 0 : P.row.top), ...here.map(aboveOf), rowsWith.has(r) ? gaugeUp : 0);
      if (r === 0) {
        // 一番上の行の名札は、図の上の縁から `TOP_ROOM` 離す。名札を越えて上の口へ下りる管が図の外を回らないように (#3523)
        rowY.push(Math.max(P.margin + Math.max(P.row.top, up + PART_GAP), ...here.map((id) => TOP_ROOM + aboveOf(id))));
        continue;
      }
      const prev = tagParties.filter((id) => rowOf(id) === r - 1);
      const prevY = rowY[r - 1] as number;
      let need = P.row.pitch + plan.rows;
      for (const a of prev)
        for (const b of here) {
          const ax = xOf.get(a) ?? 0;
          const bx = xOf.get(b) ?? 0;
          if (Math.abs(ax - bx) < (roomOf(a) + roomOf(b)) / 2 + P.lane.clear * 4) {
            need = Math.max(need, belowOf(a) + aboveOf(b) + P.lane.clear * 3 + plan.rows);
            // 真下の者を呼ぶ管は、名札の下の側の高さから出て下りる。下りる所に自分の弁を縦に置ける高さを取る
            if (shown.some((c) => c.from === a && c.to === b)) need = Math.max(need, P.call.case + LINE_GAP + VALVE_DROP + aboveOf(b) + plan.rows);
          }
        }
      if (rowsWith.has(r - 1)) need = Math.max(need, P.gauge.r + Math.max(...here.map(aboveOf), 0) + P.lane.clear * 2);
      need = Math.max(need, up + Math.max(0, ...prev.map(belowOf)) + PART_GAP);
      rowY.push(prevY + need);
    }
    const rowsBottom = Math.max(...tagParties.map((id) => (rowY[rowOf(id)] as number) + belowOf(id)), P.margin);
    const H0 = rowsBottom + P.band.tag + (throughBand ? plan.rows / 2 : 0);
    const B0 = H0 + housingH;
    const crossBand = defs.filter((d) => !isAdjacent(d)).length;
    const channel = (n: number): number => (n === 0 ? 0 : Math.max(P.band.next, (n + plan.lanes) * pitch + P.lane.clear));
    const C0 = B0 + channel(band1.length > 0 ? crossBand + 1 : crossBand);
    let tag1 = C0;
    let H1 = C0;
    let B1 = C0;
    if (band1.length > 0) {
      tag1 = C0 + Math.max(...band1.map(aboveOf)) + P.lane.clear;
      H1 = tag1 + Math.max(...band1.map(belowOf)) + P.band.tag;
      B1 = H1 + housingH;
    }
    const C1 = band1.length > 0 ? B1 + channel(crossBand) : C0;
    const yOfBand = (h: string): number => (bandOf(h) === 1 ? H1 : H0);
    const tankTop = (h: string): number => yOfBand(h) + P.housing.top;

    // ---- 部品の四角

    const cyOf = (id: string): number => {
      if (isBox(id)) {
        const m = homeOfBox.get(id);
        const busY = m ? tankTop(m.party) + (P.tank.ports[m.slot] as number) : rowY[0] as number;
        return busY - P.token.up - tokenH(id) / 2;
      }
      return bandOf(id) === 1 ? tag1 : (rowY[rowOf(id)] as number);
    };
    const rectOf = (id: string): Rect => {
      const { w, h } = sizeOf(id);
      return { x: (xOf.get(id) ?? 0) - w / 2, y: cyOf(id) - h / 2, w, h };
    };
    // 下の段の名札は自分の囲いの真上
    for (const h of band1) xOf.set(h, (cols.get(h)?.hx ?? 0) + (innerOf.get(h)?.w ?? 0) / 2);
    // 槽を持たないトークンの箱は、呼ぶ相手の行に置く
    for (const id of order.filter((x) => isBox(x) && !homeOfBox.has(x))) {
      const near = nearOf(id);
      xOf.set(id, freeX(id, near.length > 0 ? mean(near) : P.edge));
    }
    const labelOf = (id: string): Rect => {
      const r = rectOf(id);
      if (shapeOf(id) !== "round") return r;
      const w = nameW(id);
      return { x: Math.min(r.x, r.x + r.w / 2 - w / 2), y: r.y, w: Math.max(r.w, w), h: P.avatar.size / 2 + belowOf(id) };
    };

    const housings: PipeHousing[] = holders.map((h) => {
      const c = cols.get(h) as Col;
      return { party: h, row: bandOf(h) ?? 0, x: c.hx, y: yOfBand(h), w: (innerOf.get(h) as Inner).w, h: housingH };
    });
    const housingOf = new Map(housings.map((h) => [h.party, h]));
    const tankRect = new Map<string, Rect>();
    for (const h of holders) {
      const hs = housingOf.get(h) as PipeHousing;
      for (const t of (innerOf.get(h) as Inner).tanks) tankRect.set(keyOf(h, t.token), { x: hs.x + t.dx, y: tankTop(h), w: t.w, h: P.tank.h });
    }
    const tankOf = (party: string, token: string): Rect => tankRect.get(keyOf(party, token)) ?? { x: 0, y: 0, w: 0, h: 0 };
    /** 槽の下の字の帯。残高と増減と語 */
    const textBand = (party: string, token: string): Rect => {
      const t = tankOf(party, token);
      const w = numberW(party, token) + 4;
      return { x: t.x + t.w / 2 - w / 2, y: t.y + t.h + 4, w, h: housingH - P.housing.top - P.tank.h - 6 };
    };
    /** 槽の下の残高の基準線。槽の下の端から `numberY` 下で、残高の字を大きくした枠では字の高さに合わせて下げる */
    const numberBaseOf = (t: Rect): number => t.y + t.h + Math.max(P.tank.numberY, sizes.amount + 6);
    /**
     * 槽の下の字の帯を、残高の行と、その下の増減と語の行に分けた四角 (#3528)。図の中の札だけがこの形で避ける。
     * 帯 1 つで避けると、残高の行の横の空き (増減の行より狭い残高の横) まで塞ぎ、槽から出る管の際に流れた量の札を置けない
     */
    const textRows = (party: string, token: string): Rect[] => {
      const t = tankOf(party, token);
      const band = textBand(party, token);
      const cx = t.x + t.w / 2;
      const base = numberBaseOf(t);
      const balance = balanceW(party, token) + 4;
      const sub = subW(party, token) + 4;
      const subTop = base + P.tank.deltaY - T.delta.size * 0.8;
      return [
        { x: cx - balance / 2, y: band.y, w: balance, h: base + amountStyle.size * 0.2 - band.y },
        { x: cx - sub / 2, y: subTop, w: sub, h: band.y + band.h - subTop },
      ];
    };
    const plateRect = (party: string, name: string): Rect | undefined => {
      const hs = housingOf.get(party);
      const p = innerOf.get(party)?.plates.find((x) => x.name === name);
      return hs && p ? { x: hs.x + p.dx, y: tankTop(party) + P.plate.top, w: p.w, h: P.tank.h - P.plate.short } : undefined;
    };
    const calcParties = new Set(sim.calcs.map((c) => c.party));
    const converterRect = (party: string): Rect | undefined => {
      const [ta, tb] = (innerOf.get(party)?.tanks ?? []).slice(0, 2);
      if (!calcParties.has(party) || !ta || !tb) return undefined;
      const a = tankOf(party, ta.token);
      const b = tankOf(party, tb.token);
      const r = P.converter.r;
      return { x: (a.x + a.w + b.x) / 2 - r, y: a.y + a.h / 2 - r, w: r * 2, h: r * 2 };
    };

    // トークンの箱と、箱の管の横に走る所と、値の管に載せる計器
    interface Bay {
      home: Home;
      left: number;
      y: number;
      x1: number;
      x2: number;
      gauges: { party: string; cx: number; cy: number; col: { x: number; w: number } }[];
    }
    const bays: Bay[] = homes.flatMap((m) => {
      const left = homeX.get(m.box);
      if (left === undefined || !cols.has(m.party)) return [];
      const t = tankOf(m.party, m.token);
      const y = t.y + (P.tank.ports[m.slot] as number);
      let x1: number;
      let x2: number;
      if (m.gap) {
        const d = defs[m.def as number] as Def;
        const other = d.from === m.party ? d.to : d.from;
        x1 = t.x + t.w;
        x2 = tankOf(other, m.token).x;
      } else if (m.side === "right") {
        x1 = t.x + t.w;
        x2 = left + m.w + (m.def === undefined ? 0 : P.lane.clear);
      } else {
        x1 = left - (m.def === undefined ? 0 : P.lane.clear);
        x2 = t.x;
      }
      let gx = left + PART_GAP;
      const gauges = m.gauges.map((party) => {
        const w = gaugeColW(party);
        const g = { party, cx: gx + w / 2 - (P.gauge.lampGap + P.gauge.lamp * 2) / 2, cy: y - P.gauge.up, col: { x: gx, w } };
        gx += w + PART_GAP;
        return g;
      });
      return [{ home: m, left, y, x1, x2, gauges }];
    });
    const bayOf = new Map(bays.map((b) => [b.home.box, b]));

    // ---- 値の管の道

    const portSlots = P.tank.ports as readonly number[];
    /** 使った口と、使った管の組。同じ組の管は口を共に使う */
    const taken = new Map<string, string>();
    const portAt = (party: string, token: string, side: "left" | "right", k: number): PipePort => {
      const t = tankOf(party, token);
      return { party, token, side, x: side === "left" ? t.x : t.x + t.w, y: t.y + (portSlots[k] as number) };
    };
    /** 槽の口の候補。外側の縁の口を先に、内側の縁の口を後に試す */
    /**
     * 槽の口の候補。外側の縁の口は、囲いの外の `exit` まで真っすぐ出てから道を探す。
     * 内側の縁の口は囲いの中から道を探すため、外側の口で道が無い時だけ使う
     */
    interface PortChoice {
      port: PipePort;
      cost: number;
      exit: Point;
      inner: boolean;
    }
    // 槽の外側の縁の口の割り当て。同じ縁から別の段へ向かう管が並ぶ時、外の筋を通る管ほど上の口から出し、内の筋の管を越えないようにする。
    // 縁から出た管は、相手の口がこちらを向いていれば進んだ向きのまま入り (進み続ける管)、向こうを向いていれば行き過ぎてから戻って入る (戻る管)。
    // 進み続ける管は戻る管より外を通り、近い相手ほど外を通る。戻る管は遠い相手ほど大きく回るため外を通る。上の段へ向かう管は上下を逆にする
    const yRank = portSlots.map((_, k) => k).sort((a, b) => (portSlots[a] as number) - (portSlots[b] as number));
    const preferSlot = new Map<string, number>();
    /** 管が縁のそばを走る筋の内からの順。内の筋の管から引き、外の管がその外に寄り添う */
    const laneRank = new Map<number, number>();
    const rankUp = (k: number, r: number): void => {
      laneRank.set(k, Math.max(laneRank.get(k) ?? 0, r));
    };
    for (const h of holders) {
      const hs = housingOf.get(h);
      if (!hs) continue;
      for (const token of tanksOf.get(h) ?? [])
        for (const side of sideOf(h, token)) {
          const dock = homes.find((m) => m.token === token && ((m.party === h && m.side === side) || (m.gap && side === "left" && m.def !== undefined && [defs[m.def]?.from, defs[m.def]?.to].includes(h) && m.party !== h)));
          const free = yRank.filter((k) => k !== dock?.slot);
          const rows = defs.flatMap((d, k) => {
            if (d.token !== token || (d.from !== h && d.to !== h) || k === dock?.def) return [];
            const partner = d.from === h ? d.to : d.from;
            const vertical = (bandOf(partner) ?? 0) - (bandOf(h) ?? 0);
            if (vertical === 0 || !tankRect.has(keyOf(partner, token))) return [];
            const t = tankOf(partner, token);
            const px = t.x + t.w / 2;
            const sides = sideOf(partner, token);
            const facing = sides.length === 1 ? sides[0] : px > hs.x + hs.w / 2 ? "left" : "right";
            const continuing = (side === "right") === (facing === "left");
            const dist = Math.abs(px - (side === "right" ? hs.x + hs.w : hs.x));
            return [{ k, vertical, continuing, dist }];
          });
          const order = (list: typeof rows): typeof rows =>
            [...list].sort((a, b) => Number(b.continuing) - Number(a.continuing) || (a.continuing ? a.dist - b.dist : b.dist - a.dist));
          // この槽を根にする幹の組の管は、1 つの口を共に使う。組は組の中で先に並んだ管の所に置く
          const laneKey = (r: (typeof rows)[number]): string => (trunkOf.get(r.k) === `t:${h}|${token}` ? `t:${h}|${token}` : `k${r.k}`);
          const assign = (list: typeof rows, slotAt: (i: number) => number | undefined): void => {
            const keys = [...new Set(list.map(laneKey))];
            for (const r of list) {
              const i = keys.indexOf(laneKey(r));
              const slot = slotAt(i);
              if (slot !== undefined) preferSlot.set(`${r.k}|${h}|${side}`, slot);
              rankUp(r.k, keys.length - 1 - i);
            }
          };
          assign(order(rows.filter((r) => r.vertical > 0)), (i) => free[i]);
          assign(order(rows.filter((r) => r.vertical < 0)), (i) => free[free.length - 1 - i]);
        }
    }
    /** 口の値。割り当てた口が在る時は、割り当てから離れた口ほど重い */
    const slotCost = (def: number | undefined, party: string, side: "left" | "right", k: number): number => {
      const want = def === undefined ? undefined : preferSlot.get(`${def}|${party}|${side}`);
      return want === undefined ? k * 24 : Math.abs(yRank.indexOf(k) - yRank.indexOf(want)) * 24;
    };
    const portsOf = (party: string, token: string, def?: number): PortChoice[] => {
      const list = tanksOf.get(party) ?? [];
      const j = list.indexOf(token);
      const out: PortChoice[] = [];
      const outer = sideOf(party, token);
      const hs = housingOf.get(party);
      // 最後の槽の右に値の札が並ぶ時は、札の下を通れる口だけを外側の口にする。札は槽より低く、下に隙間がある
      const plates = platesOf.get(party) ?? [];
      const plateBottom = P.plate.top + (P.tank.h - P.plate.short);
      const underPlate = (k: number): boolean => (portSlots[k] as number) - P.bus.case / 2 - LINE_GAP >= plateBottom;
      /** 口を使えるか。使った口は、同じ組の管だけが共に使う */
      const usable = (key: string): boolean => !taken.has(key) || (def !== undefined && taken.get(key) === groupOfDef(def));
      /** 同じ組の管が使った口は値を足さず、幹を共に通らせる */
      const shared = (key: string): boolean => def !== undefined && taken.get(key) === groupOfDef(def);
      if (j === list.length - 1 && plates.length > 0 && hs)
        portSlots.forEach((_, k) => {
          const key = `${party}|${token}|right|${k}`;
          if (!underPlate(k) || !usable(key)) return;
          const port = portAt(party, token, "right", k);
          out.push({ port, cost: shared(key) ? 0 : k * 24, exit: [hs.x + hs.w + vPadOut, port.y], inner: false });
        });
      for (const side of ["left", "right"] as const) {
        const inner = !outer.includes(side);
        if (inner && side === "right" && j === list.length - 1 && plates.length > 0) continue;
        if (inner && (side === "left" ? j === 0 : j === list.length - 1)) continue;
        if (inner && converterRect(party) && (side === "left" ? j === 1 : j === 0)) continue;
        portSlots.forEach((_, k) => {
          const port = portAt(party, token, side, k);
          // 内側の口は、隣の槽との間の真ん中まで出てから道を探す。口の際で折れる短い線を作らない
          const next = list[side === "left" ? j - 1 : j + 1];
          const gapMid = next !== undefined ? (side === "left" ? (tankOf(party, next).x + tankOf(party, next).w + port.x) / 2 : (port.x + tankOf(party, next).x) / 2) : port.x;
          const exit: Point = !hs ? [port.x, port.y] : inner ? [gapMid, port.y] : [side === "left" ? hs.x - vPadOut : hs.x + hs.w + vPadOut, port.y];
          const key = `${party}|${token}|${side}|${k}`;
          if (usable(key)) out.push({ port, cost: shared(key) ? 0 : inner ? k * 24 + 400 : slotCost(def, party, side, k), exit, inner });
        });
      }
      return out;
    };
    const keyPort = (p: PipePort): string => `${p.party}|${p.token}|${p.side}|${portSlots.indexOf(p.y - tankOf(p.party, p.token).y)}`;

    // 格子。管の道に使う縦と横の線
    const width0 = Math.max(...[...cols.values()].map((c) => c.x + c.w), ...[...xOf.entries()].map(([id, x]) => x + roomOf(id) / 2 + eventW(id))) + P.edge + corridor;
    const height0 = (band1.length > 0 ? C1 : C0 > B0 ? C0 : B0) + P.margin;
    const keepX: number[] = [];
    const keepY: number[] = [];
    for (const [k, t] of tankRect) {
      void k;
      keepX.push(t.x, t.x + t.w);
      for (const s of portSlots) keepY.push(t.y + s);
    }
    for (const b of bays) keepX.push(b.x1, b.x2);
    const vPadOut = P.bus.case / 2 + P.lane.clear;
    for (const h of housings) keepX.push(h.x - vPadOut, h.x + h.w + vPadOut);
    for (const h of housings) {
      const inner = innerOf.get(h.party) as Inner;
      inner.tanks.slice(1).forEach((t, j) => keepX.push(h.x + ((inner.tanks[j] as { dx: number; w: number }).dx + (inner.tanks[j] as { dx: number; w: number }).w + t.dx) / 2));
    }
    const valueXs = gridLines(
      Array.from({ length: Math.ceil(width0 / (pitch / 2)) + 1 }, (_, i) => i * (pitch / 2)),
      keepX.flatMap((x) => [x]),
      6,
    );
    const valueYs = gridLines(
      Array.from({ length: Math.ceil(height0 / (pitch / 2)) + 1 }, (_, i) => i * (pitch / 2)),
      [...keepY, B0 + pitch / 2, C0 - pitch / 2, ...(band1.length > 0 ? [B1 + pitch / 2, C1 - pitch / 2] : [])],
      6,
    );
    const vHalf = P.bus.case / 2;
    const obstacles: Obstacle[] = [];
    const ownObs = new Map<string, number[]>();
    const addObs = (rect: Rect, pad: number, owner?: string): void => {
      if (owner !== undefined) ownObs.set(owner, [...(ownObs.get(owner) ?? []), obstacles.length]);
      obstacles.push({ rect, pad });
    };
    const vPad = vHalf + P.lane.clear;
    for (const id of order) {
      if (!visible.has(id) || (isBox(id) && !homeOfBox.has(id) && !xOf.has(id))) continue;
      addObs(labelOf(id), vPad);
    }
    for (const h of housings) addObs(h, vPad, `h:${h.party}`);
    for (const [k, t] of tankRect) {
      addObs(t, 0);
      addObs(t, vPad, `t:${k}`);
    }
    for (const h of holders) {
      for (const t of tanksOf.get(h) ?? []) addObs(textBand(h, t), PART_GAP);
      for (const name of platesOf.get(h) ?? []) {
        const r = plateRect(h, name);
        if (r) addObs(r, P.lane.clear);
      }
      const c = converterRect(h);
      if (c) addObs(c, P.lane.clear);
    }
    /** トークンの箱の列。箱と軸と計器と式の札の場所。管の上の余白より上 */
    const bayRect = (b: Bay): Rect => {
      const top = Math.min(cyOf(b.home.box) - tokenH(b.home.box) / 2, ...b.gauges.map((g) => g.cy - P.gauge.r - P.chip.off - chipH));
      return { x: b.left, y: top, w: b.home.w, h: b.y - vHalf - LINE_GAP - top };
    };
    for (const b of bays) addObs(bayRect(b), 0);
    /** 入力と出力の印。始めた人が払った槽と受け取った槽の、囲いの上の余白に置く。値の管はこの印を避ける */
    function ioMarks(): { token: string; text: string; r: Rect }[] {
      if (sender === undefined || !holding.has(sender)) return [];
      return (tanksOf.get(sender) ?? []).flatMap((token) => {
        const first = amountNumber(holds.flatMap((h) => ("token" in h && h.box === sender && h.token === token ? [h.amount] : []))[0]);
        const last = amountNumber(snapOf(steps - 1).balances.get(keyOf(sender, token)));
        if (first === last) return [];
        const text = first > last ? words.io.in : words.io.out;
        const t = tankOf(sender, token);
        const w = chipW(text, T.io);
        return [{ token, text, r: { x: t.x + t.w / 2 - w / 2, y: yOfBand(sender) + (P.housing.top - IO_H) / 2 - 2, w, h: IO_H } }];
      });
    }
    for (const m of ioMarks()) addObs(m.r, vPad);

    // ---- 名札から自分の囲いへ下りる点線。値の管も呼び出しの管もまたがない
    const ties: PipeTie[] = holders.map((h) => {
      const r = rectOf(h);
      const top = shapeOf(h) === "round" ? r.y + r.h / 2 + belowOf(h) + P.tie.gap : r.y + r.h + P.tie.gap;
      return { party: h, x: r.x + r.w / 2, y1: top, y2: yOfBand(h) };
    });
    const tieLines = (router: Router): void => {
      for (const t of ties)
        router.lay(
          [
            [t.x, t.y1],
            [t.x, t.y2],
          ],
          { owner: `tie:${t.party}`, group: `tie:${t.party}`, kind: "tie", width: 2 },
        );
    };

    let valueRouter = new Router(valueXs, valueYs, obstacles);
    let routes: { def: number; points: Point[]; ports: [PipePort, PipePort] }[] = [];
    let stubs: PipeStub[] = [];
    const lineOwner = (k: number): string => `v${k}`;
    const layValue = (k: number, points: Point[]): void => valueRouter.lay(points, { owner: lineOwner(k), group: groupOfDef(k), kind: "value", width: P.bus.case });
    // 箱を載せる管は先に置く。隣の囲いを結ぶ管は横に 1 本、外側の口から出る管は箱の下を横に走ってから道を探す。
    // 幹を共に通る組の管は、組の中で一番近い管の順の所にまとめて置き、組の中では近い相手の管から引く。
    // 近い相手への管は根の囲いのそばで下りて幹になり、遠い相手の管は幹を共に通って先で分かれる。根から離れた所で下りる幹は、ほかの囲いの名札を囲んで呼び出しの管の道を塞ぐ
    const members = (k: number): number[] => (trunkOf.has(k) ? [...defs.keys()].filter((x) => trunkOf.get(x) === trunkOf.get(k)) : [k]);
    const order2 = [...defs.keys()].sort((a, b) => {
      const ha = homes.some((m) => m.def === a) ? 0 : 1;
      const hb = homes.some((m) => m.def === b) ? 0 : 1;
      const da = isAdjacent(defs[a] as Def) ? 0 : 1;
      const db = isAdjacent(defs[b] as Def) ? 0 : 1;
      const rankOfGroup = (k: number): number => Math.min(...members(k).map((x) => laneRank.get(x) ?? 0));
      const spanOfGroup = (k: number): number => Math.min(...members(k).map(spanOf));
      const lead = (k: number): number => Math.min(...members(k));
      return (
        ha - hb ||
        da - db ||
        rankOfGroup(a) - rankOfGroup(b) ||
        spanOfGroup(a) - spanOfGroup(b) ||
        lead(a) - lead(b) ||
        spanOf(a) - spanOf(b) ||
        a - b
      );
    });
    /** 道の長さのうち、端と端の真っすぐな隔たりを超えた分 */
    const detourOf = (points: readonly Point[]): number => {
      let len = 0;
      for (let i = 1; i < points.length; i++) len += Math.abs((points[i] as Point)[0] - (points[i - 1] as Point)[0]) + Math.abs((points[i] as Point)[1] - (points[i - 1] as Point)[1]);
      const a = points[0] as Point;
      const b = points[points.length - 1] as Point;
      return len - Math.abs(b[0] - a[0]) - Math.abs(b[1] - a[1]);
    };
    /**
     * 値の管を `list` の順に引く。先に引いた管が後の管の口を囲むと道が無くなるか遠回りになるため、
     * 呼ぶ側は道の無かった管と遠回りした管を前に出して引き直す。`fallback` の時だけ道の無い管を下の道の折れ線で結ぶ
     */
    const routeValues = (list: readonly number[], fallback: boolean): { failed: number[]; bent: number[]; detours: Map<number, number> } => {
      valueRouter = new Router(valueXs, valueYs, obstacles);
      taken.clear();
      routes = [];
      tieLines(valueRouter);
      // 管を持たない箱の短い管。口は先に押さえる
      stubs = bays
        .filter((b) => b.home.def === undefined)
        .map((b) => {
          const a = portAt(b.home.party, b.home.token, b.home.side, b.home.slot);
          taken.set(keyPort(a), `s${b.home.token}`);
          const end: Point = [b.home.side === "left" ? b.x1 : b.x2, a.y];
          const points: Point[] = b.home.side === "left" ? [end, [a.x, a.y]] : [[a.x, a.y], end];
          valueRouter.lay(points, { owner: `s${b.home.token}`, group: `s${b.home.token}`, kind: "stub", width: P.bus.case });
          return { token: b.home.token, points };
        });
      const failed: number[] = [];
      const bent: number[] = [];
      const detours = new Map<number, number>();
    for (const k of list) {
      const d = defs[k] as Def;
      const home = homes.find((m) => m.def === k);
      const bay = home ? bayOf.get(home.box) : undefined;
      const dirOut = (side: "left" | "right"): Dir => (side === "left" ? 2 : 0);
      const dirIn = (side: "left" | "right"): Dir => (side === "left" ? 0 : 2);
      let points: Point[] | undefined;
      let ports: [PipePort, PipePort] | undefined;
      const askOf = (starts: End[], ends: End[], allow: number[]): Ask => ({
        owner: lineOwner(k),
        group: groupOfDef(k),
        kind: "value",
        width: P.bus.case,
        starts,
        ends,
        allow: new Set(allow),
        cross: (l) => (l.kind !== "tie" && plan.last ? 5000 : undefined),
        gap: LINE_GAP,
        bend: BEND_VALUE,
        hug: 0.02,
        share: SHARE,
      });
      const own = (party: string, token: string): number[] => [...(ownObs.get(`h:${party}`) ?? []), ...(ownObs.get(`t:${keyOf(party, token)}`) ?? [])];
      if (home && bay && home.gap) {
        const other = d.from === home.party ? d.to : d.from;
        const a = portAt(home.party, d.token, "right", home.slot);
        const b = portAt(other, d.token, "left", home.slot);
        // 点は送る側から受ける側へ並べる。流れの向きは点の並びで決まる
        points = d.from === home.party ? [[a.x, a.y], [b.x, b.y]] : [[b.x, b.y], [a.x, a.y]];
        ports = d.from === home.party ? [a, b] : [b, a];
      } else {
        /** 口の候補どうしを結ぶ。外側の口だけで道が無い時に限り、内側の口と囲いの中を使う */
        const join = (sa: PortChoice[], sb: PortChoice[]): { points: Point[]; a: PipePort; b: PipePort } | undefined => {
          const same = (p: PortChoice, q: Point): boolean => Math.abs(p.exit[0] - q[0]) < 0.5 && Math.abs(p.exit[1] - q[1]) < 0.5;
          // 口から外の点までの線は道を探さずに引くため、先に引いた管がその線を越える口は使わない
          const stubAsk = askOf([], [], [...own(d.from, d.token), ...own(d.to, d.token)]);
          const clear = (p: PortChoice): boolean => same(p, [p.port.x, p.port.y]) || valueRouter.passable(stubAsk, [p.port.x, p.port.y], p.exit);
          for (const loose of [false, true]) {
            const xa = sa.filter((p) => (loose || !p.inner) && clear(p));
            const xb = sb.filter((p) => (loose || !p.inner) && clear(p));
            if (xa.length === 0 || xb.length === 0 || (loose && xa.every((p) => !p.inner) && xb.every((p) => !p.inner))) continue;
            // 内側の口は槽の間を上か下へ抜ける。外側の口は外の点から横に進むほか、外の点で上か下へ折れてよい。
            // 外の点の筋を同じ組の幹が通る時は、外の点で幹に入る。1 つ先の点まで出てから折れると、幹の際で行って戻る段差になる
            const turns = (p: PortChoice, straight: Dir): End[] =>
              p.inner
                ? ([1, 3] as Dir[]).map((dir) => ({ at: p.exit, dir, cost: p.cost }))
                : [{ at: p.exit, dir: straight, cost: p.cost }, ...([1, 3] as Dir[]).map((dir) => ({ at: p.exit, dir, cost: p.cost + BEND_VALUE }))];
            const request = askOf(
              xa.flatMap((p) => turns(p, dirOut(p.port.side))),
              xb.flatMap((p) => turns(p, dirIn(p.port.side))),
              loose ? [...own(d.from, d.token), ...own(d.to, d.token)] : [],
            );
            // 道の途中の短い段差を消す。口の点は動かさず、外の点は口から外の点までの線の上で口の側へ動かしてよい。
            // 幹を共に通る管は外の点が決まっているため、幹の筋と外の点の筋が少しずれると、外の点の手前に短い段差が残る
            const finish = (path: Point[]): { points: Point[]; a: PipePort; b: PipePort } | undefined => {
              const pa = xa.find((p) => same(p, path[0] as Point));
              const pb = xb.find((p) => same(p, path[path.length - 1] as Point));
              if (!pa || !pb) return undefined;
              /**
               * 線が通れるか。口から外の点までの線の上の所は道を探さずに引くため通れるとし、外の点より先の所は道を探す時と同じく測る
               */
              const passes = (u: Point, v: Point): boolean => {
                for (const c of [pa, pb]) {
                  if (Math.abs(u[1] - c.port.y) >= 0.5 || Math.abs(v[1] - c.port.y) >= 0.5) continue;
                  const [lo, hi] = [Math.min(c.port.x, c.exit[0]), Math.max(c.port.x, c.exit[0])];
                  const [s0, s1] = [Math.min(u[0], v[0]), Math.max(u[0], v[0])];
                  if (s0 >= lo - 0.5 && s1 <= hi + 0.5) return true;
                  // 外の点をまたいで外へ伸びる線は、外の点から先の所だけを測る
                  if (s0 >= lo - 0.5 && s0 <= hi + 0.5) return valueRouter.passable(request, [hi, c.port.y], [s1, c.port.y]);
                  if (s1 >= lo - 0.5 && s1 <= hi + 0.5) return valueRouter.passable(request, [lo, c.port.y], [s0, c.port.y]);
                }
                return valueRouter.passable(request, u, v);
              };
              const full = unjog([[pa.port.x, pa.port.y], ...path, [pb.port.x, pb.port.y]], 16, passes, valueRouter);
              return { points: simplify(full), a: pa.port, b: pb.port };
            };
            const got = fewerBends(valueRouter, request, finish);
            if (got) return got;
          }
          return undefined;
        };
        if (home && bay) {
          // 箱を載せる管は、箱の下を横に走って箱の列の端から道を探す
          const a = portAt(home.party, d.token, home.side, home.slot);
          const dock: PortChoice = { port: a, cost: 0, exit: [home.side === "left" ? bay.x1 : bay.x2, a.y], inner: false };
          const other = d.from === home.party ? d.to : d.from;
          const got = join([dock], portsOf(other, d.token, k));
          if (got) {
            points = got.points;
            ports = d.from === home.party ? [got.a, got.b] : [got.b, got.a];
            if (d.from !== home.party) points = [...points].reverse();
          }
        } else {
          const got = join(portsOf(d.from, d.token, k), portsOf(d.to, d.token, k));
          if (got) {
            points = got.points;
            ports = [got.a, got.b];
          }
        }
      }
      if (!points || !ports || !ports[0] || !ports[1]) {
        failed.push(k);
        if (!fallback) continue;
        // 最後の組み方でも道が無い時は、下の道を通る折れ線で結ぶ。決まりの表が違反に数える
        const a = portsOf(d.from, d.token)[0]?.port ?? portAt(d.from, d.token, "right", 0);
        const b = portsOf(d.to, d.token)[0]?.port ?? portAt(d.to, d.token, "left", 0);
        const out = (p: PipePort): number => p.x + (p.side === "left" ? -1 : 1) * (vHalf + P.lane.clear * 2);
        const low = (band1.length > 0 ? C1 : C0) - pitch / 2;
        points = [
          [a.x, a.y],
          [out(a), a.y],
          [out(a), low],
          [out(b), low],
          [out(b), b.y],
          [b.x, b.y],
        ];
        ports = [a, b];
      }
      taken.set(keyPort(ports[0]), groupOfDef(k));
      taken.set(keyPort(ports[1]), groupOfDef(k));
      layValue(k, points);
      routes[k] = { def: k, points, ports };
      detours.set(k, detourOf(points));
      if (bendsOf(points) > MAX_BENDS) bent.push(k);
    }
      return { failed, bent, detours };
    };
    // 道の無い管と曲がりすぎた管と遠回りした管を前に出して、引く順を最大 4 通り試す。道の無い管が少なく、曲がりすぎた管が少なく、遠回りが短い順を採る
    const FAR = 240;
    let list: number[] = order2;
    let best: { list: number[]; failed: number; bent: number; detour: number } | undefined;
    let ran: number[] = list;
    const tried = new Set<string>();
    for (let round = 0; round < 4 && !tried.has(list.join(",")); round++) {
      tried.add(list.join(","));
      ran = list;
      const got = routeValues(list, false);
      const detour = [...got.detours.values()].reduce((s, v) => s + v, 0);
      if (!best || lessThan([got.failed.length, got.bent.length, detour], [best.failed, best.bent, best.detour]))
        best = { list, failed: got.failed.length, bent: got.bent.length, detour };
      const far = [...got.detours.entries()].filter(([, v]) => v > FAR).sort((a, b) => b[1] - a[1]).map(([k]) => k);
      // 隣の囲いを結ぶ管は道を探さず真っすぐ引くため、いつも先頭に置く
      const fixed = list.filter((k) => homes.some((m) => m.def === k && m.gap));
      const bad = [...new Set([...got.failed, ...got.bent, ...far])].filter((k) => !fixed.includes(k));
      if (bad.length === 0) break;
      list = [...fixed, ...bad, ...list.filter((k) => !bad.includes(k) && !fixed.includes(k))];
    }
    // 道が無いか曲がりすぎた管が残る時は、間を広げた組み方で組み直す
    if (best && best.failed + best.bent > 0 && !plan.last) return undefined;
    if (best && (best.list !== ran || best.failed > 0)) routeValues(best.list, best.failed > 0);

    // ---- 呼び出しの管の道

    const cHalf = P.call.case / 2;
    const cPad = cHalf + P.lane.clear;
    const callObs: Obstacle[] = [];
    const callOwn = new Map<string, number[]>();
    const addCall = (rect: Rect, pad: number, owner?: string): void => {
      if (owner !== undefined) callOwn.set(owner, [...(callOwn.get(owner) ?? []), callObs.length]);
      callObs.push({ rect, pad });
    };
    const partyRects = new Map<string, Rect>();
    for (const id of order) {
      if (isBox(id) && !homeOfBox.has(id) && !xOf.has(id)) continue;
      const r = labelOf(id);
      partyRects.set(id, r);
      addCall(rectOf(id), 0);
      if (shapeOf(id) === "round") addCall({ ...r, y: r.y + P.avatar.size }, cPad);
      addCall(rectOf(id), cPad, id);
    }
    for (const h of housings) addCall(h, cPad, `h:${h.party}`);
    for (const b of bays) {
      const r = bayRect(b);
      const box = rectOf(b.home.box);
      // 箱の左の計器と式の札の場所
      if (box.x - r.x > 1) addCall({ x: r.x, y: r.y, w: box.x - r.x - PART_GAP / 2, h: r.h }, cPad);
      addCall({ x: box.x + box.w / 2 - 3, y: box.y + box.h, w: 6, h: b.y - box.y - box.h }, cPad);
    }
    const startRun = (from: string, to: string): number => {
      const gaugeHere = callGauge.has(to) && shown.find((c) => c.to === to)?.from === from;
      return P.call.valveAt + P.valve.r + SPACING + (gaugeHere ? P.gauge.r * 2 + SPACING : 0);
    };
    // 呼び出しの管の格子。名札の縁と真ん中と出入りの点を残し、値の管の格子の線で埋める。
    // 埋める線は残す線から 16 より離す。近い線が並ぶと、線の間で折れる短い段差ができる
    const callXs = new Set<number>();
    const callYs = new Set<number>();
    const callEnds = new Map<string, { starts: End[]; ends: End[]; rect: Rect }>();
    for (const id of partyRects.keys()) {
      const r = rectOf(id);
      const cy = cyOf(id);
      const cx = r.x + r.w / 2;
      callXs.add(r.x);
      callXs.add(r.x + r.w);
      callXs.add(cx);
      callYs.add(cy);
      callYs.add(r.y);
      callYs.add(r.y + r.h);
      callEnds.set(id, { starts: [], ends: [], rect: r });
    }
    const branches = [...new Map(shown.map((c) => [`${c.from}>${c.to}`, c])).values()];
    const topSlot = LANE_STEP;
    /** 名札の角の丸み。丸の名札は角を持たない */
    const cornerOf = (id: string): number => (shapeOf(id) === "cabinet" ? P.cabinet.radius : shapeOf(id) === "token" ? P.token.radius : 0);
    /**
     * 同じ者の同じ横から出る k 本目の管の高さのずれ。真ん中、上、下の順。
     * 縁の角から `cornerRoom` 離れた所に収まらない時は真ん中にし、管を角の丸みにかけない (#3523)
     */
    const laneOff = (id: string, k: number): number => {
      const o = [0, -topSlot, topSlot][k] ?? 0;
      return Math.abs(o) + cornerRoom(cornerOf(id)) <= rectOf(id).h / 2 ? o : 0;
    };
    /**
     * 名札の横から出て向きを決めるまでの長さ。弁を載せる分を取るが、呼ばれた側が真横の近くに居る時は、
     * 呼ばれた側の手前で向きを揃えられるよう縮める
     */
    const runOf = (from: string, to: string, side: 0 | 2, k = 0): number => {
      // 同じ横から k 本の管が先に出ている時は、弁 1 つ分ずつ長く出て、先の管の弁と並ばないようにする
      const base = startRun(from, to) + k * (P.valve.r * 2 + SPACING);
      const a = rectOf(from);
      const b = rectOf(to);
      const g = side === 0 ? b.x - (a.x + a.w) : a.x - (b.x + b.w);
      const room = g - 18 - 4;
      return g > 0 && room < base && room > cPadOf() + 1 ? room : base;
    };
    function cPadOf(): number {
      return P.call.case / 2 + P.lane.clear;
    }
    for (const id of partyRects.keys()) for (const o of [-topSlot, topSlot]) callYs.add(cyOf(id) + o);
    for (const c of branches) {
      const a = rectOf(c.from);
      for (const k of [0, 1, 2, 3]) {
        callXs.add(a.x - runOf(c.from, c.to, 2, k));
        callXs.add(a.x + a.w + runOf(c.from, c.to, 0, k));
      }
    }
    /** 上から入る口。真ん中と、幅が足りる名札は左右にも置く。呼ぶ者が多い名札や、真上が塞がる名札に入れるように */
    const topsOf = (id: string): number[] => {
      const r = rectOf(id);
      const bx = r.x + r.w / 2;
      if (shapeOf(id) === "round") return [bx];
      const out = [bx];
      // 左右の口も、縁の角から `cornerRoom` 離れた所までに置く
      for (let k = 1; k * topSlot <= r.w / 2 - cornerRoom(cornerOf(id)); k++) out.push(bx - k * topSlot, bx + k * topSlot);
      return out;
    };
    // 呼ばれた側へは、縁から `APPROACH` 手前の点で向きを揃えてから入る。縁の際で折れる短い線を作らない
    for (const id of partyRects.keys()) {
      const r = rectOf(id);
      for (const x of topsOf(id)) callXs.add(x);
      callXs.add(r.x - APPROACH);
      callXs.add(r.x + r.w + APPROACH);
      callYs.add(r.y - APPROACH);
      callYs.add(r.y + r.h + APPROACH);
    }
    // 一番上の段の名札を上から越えて、上の口へ下りる管の線。口の手前の線の 1 本上に置く。
    // 一番上の段の名札の上の縁が揃うと、図の上の縁との間にこの線のほかの線が残らない (#3523)
    const topRow = Math.min(...[...partyRects.keys()].map((id) => rectOf(id).y));
    callYs.add(topRow - APPROACH - P.call.case);
    // 書き込む管が札の上で折れる所
    for (const h of holders) {
      callYs.add(yOfBand(h) + (P.housing.top - IO_H) / 2 - 2);
      for (const name of platesOf.get(h) ?? []) {
        const pr = plateRect(h, name);
        if (pr) callXs.add(pr.x + pr.w / 2);
      }
    }
    // 図の上の縁と左の縁に沿う線は使わない。そこを通る管は半分が図の外に出て切れる (#3523)
    const callXList = gridLines(valueXs, [...callXs], 16).filter((x) => x >= P.call.case);
    const callYList = gridLines(valueYs, [...callYs], 16).filter((y) => y >= P.call.case);
    let callRouter = new Router(callXList, callYList, callObs);
    let callPath = new Map<string, Point[]>();

    // 呼び出しの管の弁。全ての呼び出しの管を引いた後に置く。弁を置けない管を引き直す時は、置いた弁の形を間を空けて通る障害にし、
    // 書き込む管を引く時は、弁の形の縁を越えない線として置く。後から引く管が弁の形から離れて通るため、弁がほかの線に載らない
    const onCall: { at: Point; half: number; tall: number; branch: string }[] = [];
    const valves = new Map<string, Point>();
    /** 取っ手を管の下 (縦の管では左) に立てた弁 */
    const underValves = new Set<string>();
    /** 縦に走る所に置いた弁 */
    const uprightValves = new Set<string>();
    /** 置いた弁が描く形 */
    const valveShapes: Rect[] = [];
    /** 弁が描く形の縁を、後から引く線が越えない線として置く */
    const layValve = (router: Router, key: string, at: Point, under: boolean, vertical: boolean): void => {
      for (const r of valveRects(at[0], at[1], vertical, under))
        router.lay(
          [
            [r.x, r.y],
            [r.x + r.w, r.y],
            [r.x + r.w, r.y + r.h],
            [r.x, r.y + r.h],
            [r.x, r.y],
          ],
          { owner: `valve:${key}`, group: `valve:${key}`, kind: "valve", width: 0 },
        );
    };
    const placeValve = (key: string, at: Point, under: boolean, vertical = false): void => {
      valves.set(key, at);
      if (under) underValves.add(key);
      if (vertical) uprightValves.add(key);
      onCall.push({ at, half: vertical ? P.valve.half : P.valve.r, tall: vertical ? P.valve.r : P.valve.half, branch: key });
      valveShapes.push(...valveRects(at[0], at[1], vertical, under));
      layValve(callRouter, key, at, under, vertical);
    };
    /** 弁と計器の縦の半分。弁は横に長い */
    const tallOf = (half: number): number => (half === P.valve.r ? P.valve.half : half);
    /** 横の半分が `half`、縦の半分が `tall` の四角と、置いた弁と計器の四角の縁の間が、決まりの間を超えるか。決まりの表と同じく、横と縦の隔たりの大きい方で測る */
    const freeBox = (p: Point, half: number, tall: number): boolean =>
      onCall.every((o) => Math.max(Math.abs(o.at[0] - p[0]) - o.half - half, Math.abs(o.at[1] - p[1]) - o.tall - tall) >= SPACING);
    /** 弁と計器の四角どうしの縁の間が、決まりの間を超えるか */
    const free = (p: Point, half: number): boolean => freeBox(p, half, tallOf(half));
    /**
     * 置いた線のうち、`branch` の管でない物。`mine` の時は同じ者から出た管も含める (計器は同じ者の管が分かれる所に置かない)
     */
    const otherLines = (branch: string, mine = false, skip: ReadonlySet<string> = new Set()): { points: Point[]; half: number; sibling?: boolean }[] => {
      const from = branch.split(">")[0];
      return [
        ...routes.flatMap((r) => (r ? [{ points: r.points, half: P.bus.case / 2 }] : [])),
        ...stubs.map((s) => ({ points: s.points, half: P.bus.case / 2 })),
        ...ties.map((t) => ({ points: [[t.x, t.y1], [t.x, t.y2]] as Point[], half: 1 })),
        ...[...callPath.entries()]
          .filter(([k]) => k !== branch && !skip.has(k) && (mine || k.split(">")[0] !== from))
          .map(([k, points]) => ({ points, half: cHalf, sibling: k.split(">")[0] === from })),
      ];
    };
    /** 道の上で、横に走る所の、ほかの弁と計器と線から離れた所。`from` は道の始まりからの距離の下限 */
    const spot = (points: Point[], half: number, from: number, avoid: readonly Point[][] = [], branch = ""): Point | undefined => {
      let walked = 0;
      // 計器は、同じ者から出た管とも重ならない所に置く。弁は同じ者の管が共に通る所を `avoid` で避ける
      const others = otherLines(branch, half === P.gauge.r);
      for (const [a, b] of segs(points)) {
        const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        if (flat(a, b) && len >= half * 2 + SPACING) {
          const dir = Math.sign(b[0] - a[0]);
          for (let t = Math.max(half + SPACING / 2, from - walked); t <= len - half - SPACING / 2; t += 4) {
            const p: Point = [a[0] + dir * t, a[1]];
            if (!free(p, half)) continue;
            const box: Rect = { x: p[0] - half, y: p[1] - tallOf(half), w: half * 2, h: tallOf(half) * 2 };
            if (others.some((l) => segs(l.points).some(([u, v]) => hits(u, v, box, l.half + 2)))) continue;
            if (avoid.some((q) => segs(q).some(([u, v]) => flat(u, v) && Math.abs(u[1] - p[1]) < 0.5 && p[0] >= Math.min(u[0], v[0]) - half && p[0] <= Math.max(u[0], v[0]) + half))) continue;
            return p;
          }
        }
        walked += len;
      }
      return undefined;
    };
    /**
     * 弁が描く形 (胴と軸と、閉じた取っ手と開いた取っ手) が、`lines` の全ての線から離れるか。胴は `body`、軸と取っ手は `VALVE_ROOM` 離す。
     * 同じ者から出る管も数える。同じ者の管が共に通る本管の上の弁は、どの枝の弁か読めない
     */
    const valveClear = (p: Point, vertical: boolean, under: boolean, lines: readonly { parts: [Point, Point][]; half: number }[], body: number): boolean => {
      const rects = valveRects(p[0], p[1], vertical, under);
      // 取っ手どうしも重ねない
      if (rects.some((r) => valveShapes.some((o) => !apart(r, o, VALVE_ROOM)))) return false;
      return lines.every((l) => l.parts.every(([u, v]) => rects.every((r, i) => !hits(u, v, r, l.half + (i === 0 ? body : VALVE_ROOM)))));
    };
    /**
     * 道の上の、ほかの弁と計器から決まりの間を空け、弁の形がほかの線から離れる所と、取っ手を下 (縦の管では左) に立てるか。
     * 横に走る所にも縦に走る所にも置き、弁は管の向きに合わせて描く。同じ者の管と共に通る幹から分かれた枝は、
     * 分かれた先が縦に走ることが多く、自分の枝に弁を置くには縦の所に置く。
     * 始まりに近い所から選び、同じ所では取っ手を上 (縦の管では右) に立てる方を先に試す。`skip` の管の線は測らない。
     * 先に胴がほかの線から管と部品の間 (`LINE_GAP`) 離れる所を道の全体で探し、無い時だけ `VALVE_ROOM` まで寄せた所を探す (#3523)。
     * 隣を平行に走る管から `VALVE_ROOM` しか離れない胴は、隣の管に触れて見える
     */
    const valveSpot = (
      points: Point[],
      branch: string,
      skip: ReadonlySet<string> = new Set(),
      shared = false,
    ): { at: Point; under: boolean; vertical: boolean } | undefined => {
      for (const body of [LINE_GAP, VALVE_ROOM]) {
        const at = valveSpotWith(points, branch, skip, shared, body);
        if (at) return at;
      }
      return undefined;
    };
    /** 胴をほかの線から `body` 離す、`valveSpot` の 1 回の探し */
    const valveSpotWith = (
      points: Point[],
      branch: string,
      skip: ReadonlySet<string>,
      shared: boolean,
      body: number,
    ): { at: Point; under: boolean; vertical: boolean } | undefined => {
      const r = P.valve.r;
      const reach = P.valve.stem + P.valve.lever + VALVE_ROOM;
      const others = otherLines(branch, true, skip);
      for (const [a, b] of segs(points)) {
        const vertical = !flat(a, b);
        const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        if (len < r * 2 + SPACING) continue;
        const dx = Math.sign(b[0] - a[0]);
        const dy = Math.sign(b[1] - a[1]);
        // 弁の形が届く所の近くを通る線だけを測る
        const along = len + (P.valve.lever + VALVE_ROOM) * 2;
        const near: Rect = vertical
          ? { x: a[0] - reach, y: Math.min(a[1], b[1]) - P.valve.lever - VALVE_ROOM, w: reach * 2, h: along }
          : { x: Math.min(a[0], b[0]) - P.valve.lever - VALVE_ROOM, y: a[1] - reach, w: along, h: reach * 2 };
        /** `shared` の時は、この所で重なって走る同じ者の管の線分を測らない (弁が本管に載る) */
        const onHere = (u: Point, v: Point): boolean =>
          vertical
            ? !flat(u, v) && Math.abs(u[0] - a[0]) < 0.5 && Math.max(u[1], v[1]) > Math.min(a[1], b[1]) && Math.min(u[1], v[1]) < Math.max(a[1], b[1])
            : flat(u, v) && Math.abs(u[1] - a[1]) < 0.5 && Math.max(u[0], v[0]) > Math.min(a[0], b[0]) && Math.min(u[0], v[0]) < Math.max(a[0], b[0]);
        const lines = others
          .map((l) => (shared && l.sibling ? { ...l, points: [] as Point[], parts: segs(l.points).filter(([u, v]) => !onHere(u, v)) } : { ...l, parts: segs(l.points) }))
          .filter((l) => l.parts.some(([u, v]) => hits(u, v, near, l.half)));
        for (let t = r + SPACING / 2; t <= len - r - SPACING / 2; t += 4) {
          const p: Point = [a[0] + dx * t, a[1] + dy * t];
          if (!(vertical ? freeBox(p, P.valve.half, r) : freeBox(p, r, P.valve.half))) continue;
          for (const under of [false, true]) if (valveClear(p, vertical, under, lines, body)) return { at: p, under, vertical };
        }
      }
      return undefined;
    };
    /** 呼び出しの管の道を探す前に置く線。値の管と短い管と点線 */
    const callBase = (router: Router): Router => {
      for (const r of routes) if (r) router.lay(r.points, { owner: lineOwner(r.def), group: groupOfDef(r.def), kind: "value", width: P.bus.case });
      for (const s of stubs) router.lay(s.points, { owner: `s${s.token}`, group: `s${s.token}`, kind: "stub", width: P.bus.case });
      for (const t of ties) {
        const tie: Point[] = [
          [t.x, t.y1],
          [t.x, t.y2],
        ];
        router.lay(tie, { owner: `tie:${t.party}`, group: `tie:${t.party}`, kind: "tie", width: 2 });
      }
      return router;
    };
    /** 呼び出しの管を `list` の順に引く。道の無かった管を返す */
    const routeCalls = (list: readonly (typeof branches)[number][], fallback: boolean): { failed: string[]; bent: string[]; twice: string[]; cramped: string[] } => {
      callRouter = new Router(callXList, callYList, callObs);
      callPath = new Map();
      valves.clear();
      underValves.clear();
      uprightValves.clear();
      valveShapes.length = 0;
      onCall.length = 0;
      /** ほかの線から離れた所が無く、弁を置けなかった呼び出し */
      const crampedCalls: string[] = [];
      callBase(callRouter);
      const failedCalls: string[] = [];
      const bentCalls: string[] = [];
      /** 1 本の値の管を 2 度越えた呼び出し */
      const twiceCalls: string[] = [];
      const lanes = new Map<string, number>();
      /** 名札の横の、入る管が使った所 (`id|向き|高さ`) と、出る管が使った所。入る管と出る管は同じ所を使わない */
      const entered = new Set<string>();
      const left = new Set<string>();
      const sideKey = (id: string, side: 0 | 2, y: number): string => `${id}|${side}|${Math.round(y)}`;
      const sideUsed = (set: ReadonlySet<string>, id: string, side: 0 | 2): boolean => [...set].some((k) => k.startsWith(`${id}|${side}|`));
      /** 出る管の高さ。同じ者の管は同じ高さを共に使ってよいが、入る管が使った高さは避ける */
      /** 出る管の高さの候補。入る管が使った高さを除き、まだ使っていない高さ、呼ぶ相手の高さに近い方の順 */
      const startYs = (id: string, side: 0 | 2, toward: number): number[] => {
        const base = cyOf(id);
        const used = (y: number): number => Number(left.has(sideKey(id, side, y)));
        // 入る管が使った横からは出ない。同じ横に出入りが並ぶと、入る管の計器を置く所が無くなる
        if (sideUsed(entered, id, side)) return [];
        const ys = [...new Set([0, 1, 2].map((k) => base + laneOff(id, k)))];
        // 使った高さの隣の高さは後にする。隣どうしの管に載せた弁は、胴が隣の管の縁に触れる (#3523)
        const taken = ys.filter((y) => used(y) === 1);
        const beside = (y: number): number => Number(used(y) === 0 && taken.some((u) => Math.abs(u - y) < topSlot * 2 - 0.5));
        return ys.sort((a, b) => used(a) - used(b) || beside(a) - beside(b) || Math.abs(a - toward) - Math.abs(b - toward));
      };
      /** 呼び出しが入った所 (`id|向き|高さ`)。引き直す管は、自分が入った所を外して入る口を選び直す */
      const entryOf = new Map<string, string>();
      /** 呼び出し `c` の道を探す問いと、探した道を名札の縁から呼ばれた側の縁までの線に仕上げる処理 */
      const planOf = (c: (typeof branches)[number]) => {
        const a = rectOf(c.from);
        const b = rectOf(c.to);
        const toward = b.x + b.w / 2 >= a.x + a.w / 2 ? 0 : 2;
        const ysR = startYs(c.from, 0, cyOf(c.to));
        const ysL = startYs(c.from, 2, cyOf(c.to));
        // 始まりの点では、そのまま進むほかに上か下へ折れてよい。縁から始まりの点までの横の線が弁を載せる所になる
        const startsAt = (at: Point, dir: 0 | 2, cost: number): End[] => [
          { at, dir, cost },
          { at, dir: 1, cost: cost + 50 },
          { at, dir: 3, cost: cost + 50 },
        ];
        const starts: End[] = [
          ...ysR.flatMap((y, i) => startsAt([a.x + a.w + runOf(c.from, c.to, 0, lanes.get(`${c.from}|0`) ?? 0), y], 0, (toward === 0 ? 0 : 80) + i * 30)),
          ...ysL.flatMap((y, i) => startsAt([a.x - runOf(c.from, c.to, 2, lanes.get(`${c.from}|2`) ?? 0), y], 2, (toward === 2 ? 0 : 80) + i * 30)),
        ];
        const bx = b.x + b.w / 2;
        const by = cyOf(c.to);
        const entries: (End & { edge: Point })[] = [
          ...topsOf(c.to).map((x, i): End & { edge: Point } => ({ at: [x, b.y - APPROACH], dir: 1, cost: Math.ceil(i / 2) * 8, edge: [x, b.y] })),
          ...(entered.has(sideKey(c.to, 2, by)) || sideUsed(left, c.to, 2) ? [] : [{ at: [b.x - APPROACH, by] as Point, dir: 0 as Dir, cost: 20, edge: [b.x, by] as Point }]),
          ...(entered.has(sideKey(c.to, 0, by)) || sideUsed(left, c.to, 0) ? [] : [{ at: [b.x + b.w + APPROACH, by] as Point, dir: 2 as Dir, cost: 20, edge: [b.x + b.w, by] as Point }]),
          // 下から入る口は、囲いへ下りる点線と重なるため、囲いを持つ者には置かない
          ...(isBox(c.to) || holding.has(c.to) ? [] : [{ at: [bx, b.y + b.h + APPROACH] as Point, dir: 3 as Dir, cost: 60, edge: [bx, b.y + b.h] as Point }]),
          // トークンの箱の下の真ん中は管の弁へ下りる軸が在る。幅の広い箱は、軸と弁から離れた下の口を持つ
          ...(isBox(c.to)
            ? topsOf(c.to)
                .filter((x) => Math.abs(x - bx) >= P.valve.r + P.call.case / 2 + LINE_GAP)
                .map((x, i): End & { edge: Point } => ({ at: [x, b.y + b.h + APPROACH], dir: 3, cost: 60 + i * 8, edge: [x, b.y + b.h] }))
            : []),
        ];
        // 呼ばれた側がさらに呼ぶ時は、その相手の方の横を自分の出る管に残すため、その横から入りにくくする
        const facing = (side: 0 | 2): boolean =>
          branches.some((x) => {
            if (x.from !== c.to) return false;
            const t = rectOf(x.to);
            return (t.x + t.w / 2 >= b.x + b.w / 2 ? 0 : 2) === side;
          });
        // 左から入る (向き 0) のは左の横、右から入る (向き 2) のは右の横
        const ends: End[] = entries.map(({ at, dir, cost }) => ({ at, dir, cost: (dir === 0 && facing(2)) || (dir === 2 && facing(0)) ? (cost ?? 0) + 300 : cost }));
        // 呼ばれた側へは縁の手前の点で向きを揃えて入るため、呼ばれた側の縁は通さない。縁に沿って走る線を作らない。
        // 呼ぶ側の名札の縁は、名札の際から出る 2 度目の試しだけ通す。1 度目から通すと、名札の下を回って自分の点線をまたぐ
        const allow = new Set<number>();
        const ask = {
          owner: `c:${c.from}>${c.to}`,
          group: `c:${c.from}`,
          kind: "call" as const,
          width: P.call.case,
          starts,
          ends,
          allow,
          cross: (l: Laid): number | undefined => (l.kind === "value" || l.kind === "stub" ? 300 : l.kind === "call" ? 400 : undefined),
          gap: LINE_GAP,
          bend: 50,
        };
        // 名札の縁から始まりの点までの線は道を探さずに引くため、点線や線をまたがないかを先に確かめる
        const ownAsk = { ...ask, allow: new Set([...allow, ...(callOwn.get(c.from) ?? [])]) };
        const edgeOf = (st: End): Point => [st.at[0] > a.x + a.w / 2 ? a.x + a.w : a.x, st.at[1]];
        ask.starts = starts.filter((st) => callRouter.passable(ownAsk, edgeOf(st), st.at));
        const callFinish = (path: Point[]): { points: Point[]; raw: Point[] } => {
          const head = path[0] as Point;
          const tail = path[path.length - 1] as Point;
          const into = entries.find((e) => Math.abs(e.at[0] - tail[0]) < 0.5 && Math.abs(e.at[1] - tail[1]) < 0.5);
          return { points: simplify([edgeOf({ at: head, dir: 0 }), ...path, ...(into ? [into.edge] : [])]), raw: path };
        };
        /** 探した道を、名札の縁から呼ばれた側の縁までの線にする。縁の際の短い段差は消す */
        const finish = (path: Point[]): { points: Point[]; entry: (End & { edge: Point }) | undefined } => {
          const first = path[0] as Point;
          const last = path[path.length - 1] as Point;
          const edge: Point = [first[0] > a.x + a.w / 2 ? a.x + a.w : a.x, first[1]];
          const entry = entries.find((e) => Math.abs(e.at[0] - last[0]) < 0.5 && Math.abs(e.at[1] - last[1]) < 0.5);
          // ずらした線が通れる時だけ消す。呼ばれた側の手前の点から縁までの線は、道を探さずに引く線なので通れるとする
          const approach = (u: Point, v: Point): boolean =>
            entry !== undefined && Math.abs(u[0] - entry.at[0]) < 0.5 && Math.abs(u[1] - entry.at[1]) < 0.5 && Math.abs(v[0] - entry.edge[0]) < 0.5 && Math.abs(v[1] - entry.edge[1]) < 0.5;
          return { points: unjog([edge, ...path, ...(entry ? [entry.edge] : [])], 16, (u, v) => approach(u, v) || callRouter.passable(ownAsk, u, v), callRouter), entry };
        };
        return { a, b, bx, toward, ysR, ysL, startsAt, starts, ask, ownAsk, edgeOf, callFinish, finish, allow };
      };
      /** 入った所を覚える。左から入る (向き 0) のは左の横、右から入る (向き 2) のは右の横 */
      const enter = (key: string, to: string, entry: (End & { edge: Point }) | undefined): void => {
        if (!entry || (entry.dir !== 0 && entry.dir !== 2)) return;
        const k = sideKey(to, entry.dir === 0 ? 2 : 0, entry.at[1]);
        entered.add(k);
        entryOf.set(key, k);
      };
    for (const c of list) {
      const key = `${c.from}>${c.to}`;
      const { a, b, bx, toward, ysR, ysL, startsAt, starts, ask, ownAsk, edgeOf, callFinish, finish, allow } = planOf(c);
      const ay0 = cyOf(c.from);
      let found = fewerBends(callRouter, ask, callFinish);
      // 弁を載せる長さの所で上か下へ折れられず、曲がりすぎた時は、別の長さで出る始まりも加えて探し直す。
      // 短い始まりは先の管と同じ所で折れて共に通り、弁は共に通らない所へ置く。折れが減った時だけ採る
      if (found && bendsOf(found.points) > MAX_BENDS) {
        const longer = (side: 0 | 2, ys: number[], x: (k: number) => number): End[] => {
          const now = lanes.get(`${c.from}|${side}`) ?? 0;
          return [0, 1, 2, 3].filter((k) => k !== now).flatMap((k) => ys.flatMap((y, i) => startsAt([x(k), y], side, (toward === side ? 0 : 80) + i * 30 + 60)));
        };
        const extra = [
          ...longer(0, ysR, (k) => a.x + a.w + runOf(c.from, c.to, 0, k)),
          ...longer(2, ysL, (k) => a.x - runOf(c.from, c.to, 2, k)),
        ].filter((st) => callRouter.passable(ownAsk, edgeOf(st), st.at));
        const again = extra.length > 0 ? fewerBends(callRouter, { ...ask, starts: [...ask.starts, ...extra] }, callFinish) : undefined;
        if (again && bendsOf(again.points) < bendsOf(found.points)) found = again;
      }
      // 1 本の値の管を 2 度越えた時は、その管の組を越える値を重くして探し直す。越える値は辺ごとに組で 1 度だけ数えるため、
      // 幹を何度も越える道が、1 本ずつ越える道より安く見えることがある。2 度越える管が減り、折れが上限を超えない時だけ採る
      if (found) {
        const twice = (points: readonly Point[]): Set<string> =>
          new Set(routes.flatMap((r) => (r && crossedTimes(points, r.points) > 1 ? [groupOfDef(r.def)] : [])));
        const heavy = twice(found.points);
        if (heavy.size > 0) {
          const again = fewerBends(callRouter, { ...ask, cross: (l: Laid) => (heavy.has(l.group) ? REVISIT : ask.cross(l)) }, callFinish);
          if (again && bendsOf(again.points) <= MAX_BENDS && twice(again.points).size < heavy.size) found = again;
        }
      }
      const path =
        found?.raw ??
        callRouter.route({ ...ask, allow: new Set([...allow, ...(callOwn.get(c.from) ?? [])]), starts: starts.filter((st) => st.dir === 0 || st.dir === 2).map((st) => ({ ...st, at: edgeOf(st) })) });
      if (!path) {
        failedCalls.push(key);
        if (!fallback) continue;
        callPath.set(key, [
          [a.x + a.w, ay0],
          [bx, ay0],
          [bx, b.y],
        ]);
        continue;
      }
      const first = path[0] as Point;
      const right = first[0] > a.x + a.w / 2;
      // 同じ横から出た管の数。次の管は高さが違っても弁 1 つ分長く出て、弁を横にずらす
      const laneKey = `${c.from}|${right ? 0 : 2}`;
      lanes.set(laneKey, (lanes.get(laneKey) ?? 0) + 1);
      left.add(sideKey(c.from, right ? 0 : 2, first[1]));
      const { points: simple, entry } = finish(path);
      enter(key, c.to, entry);
      callPath.set(key, simple);
      if (bendsOf(simple) > MAX_BENDS) bentCalls.push(key);
      if (routes.some((r) => r && crossedTimes(simple, r.points) > 1)) twiceCalls.push(key);
      callRouter.lay(simple, { owner: ask.owner, group: ask.group, kind: "call", width: P.call.case });
    }
      // 弁は、載せられる横の線が短い管から先に置く。長い管は後から空いた所を選べる
      const roomOn = (c: (typeof branches)[number]): number =>
        segs(callPath.get(`${c.from}>${c.to}`) ?? []).reduce((sum, [a, b]) => sum + (flat(a, b) ? Math.abs(b[0] - a[0]) : 0), 0);
      const waiting: (typeof branches)[number][] = [];
      for (const c of [...list].sort((a, b) => roomOn(a) - roomOn(b))) {
        const key = `${c.from}>${c.to}`;
        const points = callPath.get(key);
        if (!points || valves.has(key)) continue;
        const clear = valveSpot(points, key);
        if (clear) placeValve(key, clear.at, clear.under, clear.vertical);
        else waiting.push(c);
      }
      /** 値の管と点線と置いた呼び出しの管と弁で、道を探す道具を作り直す */
      const rebuild = (xs: readonly number[] = callXList, ys: readonly number[] = callYList): Router => {
        // 置いた弁の形は、管の縁が決まりの間を空けて通る障害にする。線として置くと、形の角の際を通る管を止められない
        const valveObs = [...valves].flatMap(([k, at]) =>
          valveRects(at[0], at[1], uprightValves.has(k), underValves.has(k)).map((rect): Obstacle => ({ rect, pad: cHalf + VALVE_ROOM })),
        );
        const router = callBase(new Router(xs, ys, [...callObs, ...valveObs]));
        for (const [k, points] of callPath) router.lay(points, { owner: `c:${k}`, group: `c:${k.split(">")[0]}`, kind: "call", width: P.call.case });
        return router;
      };
      /** 置いた弁を外す */
      const unplaceValve = (key: string): void => {
        valves.delete(key);
        underValves.delete(key);
        uprightValves.delete(key);
        valveShapes.length = 0;
        for (const [k, at] of valves) valveShapes.push(...valveRects(at[0], at[1], uprightValves.has(k), underValves.has(k)));
        for (let i = onCall.length - 1; i >= 0; i--) if (onCall[i]?.branch === key) onCall.splice(i, 1);
      };
      /**
       * 弁を置けない管 `c` のために、ほかの呼び出しの管を引き直す。ほかの呼び出しの管の線と弁を測らずに `c` の弁の置き場所を取り、
       * その場所を塞ぐ管 (2 本まで) を、取った弁を越えない道で引き直す。同じ者の管が同じ横に詰めて出る時や、
       * ほかの者の管が弁の真上を並んで走る時は、取っ手を塞いで弁を置けないため、先に引いた管を譲らせる。
       * 引き直した管が弁を置け、折れと長さが元の道を大きく超えず、1 本の値の管を 2 度越えない時だけ採り、採らない時は元に戻す
       */
      const yieldFor = (c: (typeof branches)[number], key: string, old: Point[]): boolean => {
        const rivals = new Set([...callPath.keys()].filter((k) => k !== key));
        if (rivals.size === 0) return false;
        const saved = {
          paths: new Map(callPath),
          valves: new Map(valves),
          under: new Set(underValves),
          upright: new Set(uprightValves),
          shapes: [...valveShapes],
          on: [...onCall],
          entered: new Set(entered),
          entryOf: new Map(entryOf),
        };
        const restore = (): false => {
          callPath = new Map(saved.paths);
          valves.clear();
          for (const [k, v] of saved.valves) valves.set(k, v);
          underValves.clear();
          for (const k of saved.under) underValves.add(k);
          uprightValves.clear();
          for (const k of saved.upright) uprightValves.add(k);
          valveShapes.splice(0, valveShapes.length, ...saved.shapes);
          onCall.splice(0, onCall.length, ...saved.on);
          entered.clear();
          for (const k of saved.entered) entered.add(k);
          entryOf.clear();
          for (const [k, v] of saved.entryOf) entryOf.set(k, v);
          callRouter = rebuild();
          return false;
        };
        for (const k of rivals) unplaceValve(k);
        const reserved = valveSpot(old, key, rivals);
        if (!reserved) return restore();
        const rects = valveRects(reserved.at[0], reserved.at[1], reserved.vertical, reserved.under);
        const blocking = [...rivals].filter((k) => {
          const v = saved.valves.get(k);
          const shape = v ? valveRects(v[0], v[1], saved.upright.has(k), saved.under.has(k)) : [];
          return (
            segs(callPath.get(k) as Point[]).some(([u, v2]) => rects.some((r) => hits(u, v2, r, cHalf + VALVE_ROOM))) ||
            shape.some((s) => rects.some((r) => !apart(s, r, VALVE_ROOM)))
          );
        });
        if (blocking.length === 0 || blocking.length > 2) return restore();
        // 塞がない管の弁は元の所に戻す
        for (const k of rivals)
          if (!blocking.includes(k)) {
            const v = saved.valves.get(k);
            if (v) placeValve(k, v, saved.under.has(k), saved.upright.has(k));
          }
        for (const k of blocking) {
          const e = entryOf.get(k);
          if (e) entered.delete(e);
          callPath.delete(k);
        }
        placeValve(key, reserved.at, reserved.under, reserved.vertical);
        // 取った弁の形の際を通る筋を格子に足す。格子の筋が弁の形から遠いと、譲る管は弁の手前で折れられず大きく回る
        const off = cHalf + LINE_GAP + 1;
        const xs = gridLines(rects.flatMap((r) => [r.x - off, r.x + r.w + off]), callXList, 4);
        const ys = gridLines(rects.flatMap((r) => [r.y - off, r.y + r.h + off]), callYList, 4);
        for (const k of blocking) {
          const bc = list.find((x) => `${x.from}>${x.to}` === k);
          const was = saved.paths.get(k);
          if (!bc || !was) return restore();
          // 譲る管は、自分の弁が載る長さだけ出て折れる短い始まりも使う。いつもの長さで出ると、取った弁の取っ手の上を通る
          const ra = rectOf(bc.from);
          const runs = [SHORT_RUN, (SHORT_RUN + startRun(bc.from, bc.to)) / 2];
          const startX = (side: 0 | 2, run: number): number => (side === 0 ? ra.x + ra.w + run : ra.x - run);
          callRouter = rebuild(gridLines([...xs, ...runs.flatMap((run) => [startX(0, run), startX(2, run)])], callXList, 4), ys);
          const plan = planOf(bc);
          const short = ([[0, plan.ysR], [2, plan.ysL]] as const).flatMap(([side, list2]) =>
            list2.flatMap((y, i) =>
              runs.flatMap((run) => {
                const at: Point = [startX(side, run), y];
                return callRouter.passable(plan.ownAsk, plan.edgeOf({ at, dir: side }), at) ? plan.startsAt(at, side, (plan.toward === side ? 0 : 80) + i * 30 + 40) : [];
              }),
            ),
          );
          const found = fewerBends(callRouter, { ...plan.ask, starts: [...plan.ask.starts, ...short] }, plan.callFinish);
          const redone = found ? plan.finish(found.raw) : undefined;
          if (
            !redone ||
            bendsOf(redone.points) > Math.min(MAX_BENDS, bendsOf(was) + 1) ||
            lengthOf(redone.points) > lengthOf(was) * DETOUR_RATE ||
            routes.some((r) => r && crossedTimes(redone.points, r.points) > 1)
          )
            return restore();
          callPath.set(k, redone.points);
          enter(k, bc.to, redone.entry);
          const at = valveSpot(redone.points, k);
          if (!at) return restore();
          placeValve(k, at.at, at.under, at.vertical);
        }
        callRouter = rebuild();
        return true;
      };
      // 弁を置けなかった管は、ほかの管と置いた弁をそのままにして、弁を置ける始まりの線を持つ始まりから引き直す。
      // 始まりの線は名札の縁から始まりの点までの横の線で、長く出る始まりも試す。引き直した道に弁を置け、
      // 折れが上限を超えず、1 本の値の管を 2 度越えず、元の道より大きく回らない時だけ採る。
      // 大きく回る道は、ほかの者の名札を囲んで計器の置き場所を塞ぎ、弁 1 つの空きより読みにくい
      for (const c of waiting) {
        const key = `${c.from}>${c.to}`;
        // 先の管の兄弟として引き直し、弁を置いた管は飛ばす
        if (valves.has(key)) continue;
        const old = callPath.get(key) as Point[];
        callPath.delete(key);
        callRouter = rebuild();
        callPath.set(key, old);
        const was = entryOf.get(key);
        if (was) entered.delete(was);
        const plan = planOf(c);
        const tries: End[] = [];
        for (const side of [0, 2] as const) {
          if (sideUsed(entered, c.from, side)) continue;
          const ys = [...new Set([0, 1, 2].map((k) => cyOf(c.from) + laneOff(c.from, k)))];
          for (const k of [0, 1, 2, 3])
            for (const y of ys) {
              const at: Point = [side === 0 ? plan.a.x + plan.a.w + runOf(c.from, c.to, 0, k) : plan.a.x - runOf(c.from, c.to, 2, k), y];
              const edge = plan.edgeOf({ at, dir: side });
              if (callRouter.passable(plan.ownAsk, edge, at) && valveSpot([edge, at], key)) tries.push(...plan.startsAt(at, side, (plan.toward === side ? 0 : 80) + k * 30));
            }
        }
        const found = tries.length > 0 ? fewerBends(callRouter, { ...plan.ask, starts: tries }, plan.callFinish) : undefined;
        const redone = found ? plan.finish(found.raw) : undefined;
        const fits =
          redone &&
          bendsOf(redone.points) <= Math.min(MAX_BENDS, bendsOf(old) + 1) &&
          lengthOf(redone.points) <= lengthOf(old) * DETOUR_RATE &&
          !routes.some((r) => r && crossedTimes(redone.points, r.points) > 1);
        const at = fits ? valveSpot(redone.points, key) : undefined;
        if (redone && at) {
          callPath.set(key, redone.points);
          enter(key, c.to, redone.entry);
          callRouter.lay(redone.points, { owner: plan.ask.owner, group: plan.ask.group, kind: "call", width: P.call.case });
          placeValve(key, at.at, at.under, at.vertical);
          continue;
        }
        if (was) entered.add(was);
        callRouter.lay(old, { owner: plan.ask.owner, group: plan.ask.group, kind: "call", width: P.call.case });
        yieldFor(c, key, old);
      }
      // 自分だけが通る所に離れた所の無い弁は、同じ者の管と重なって走る本管の上の、ほかの線と弁から離れた所に置く。
      // それも無い時は、ほかの弁と計器から決まりの間を空け、同じ者の管が共に通る所を避けて置く。決まりの表が違反に数える
      for (const c of waiting) {
        const key = `${c.from}>${c.to}`;
        const points = callPath.get(key);
        if (!points || valves.has(key)) continue;
        const onMain = valveSpot(points, key, new Set(), true);
        if (onMain) {
          placeValve(key, onMain.at, onMain.under, onMain.vertical);
          continue;
        }
        crampedCalls.push(key);
        const mine = [...callPath.entries()].filter(([k]) => k !== key && k.split(">")[0] === c.from && valves.has(k)).map(([, q]) => q);
        const at =
          spot(points, P.valve.r, P.call.valveAt, mine, key) ??
          spot(points, P.valve.r, P.call.valveAt, [], key) ??
          spot(points, P.valve.r, 0, [], key) ??
          along(points, Math.min(P.call.valveAt, lengthOf(points) / 2));
        placeValve(key, at, false);
      }
      return { failed: failedCalls, bent: bentCalls, twice: twiceCalls, cramped: crampedCalls };
    };
    // 道の無い呼び出しと曲がりすぎた呼び出しと 1 本の値の管を 2 度越えた呼び出しと弁を置けなかった呼び出しを前に出して、引く順を最大 4 通り試す。
    // 道の無い管が少なく、曲がりすぎた管が少なく、2 度越えた管が少なく、弁を置けなかった管が少ない順を採る
    {
      // 同じ者が呼ぶ管は、呼ばれた側が横に近い順に引く。ほかの者の管との順は変えない。
      // 先に引いた管が曲がる向きに近い高さを取り、後の管はその外の高さから出るので、同じ横から出る管が入れ子に曲がり、
      // 1 本の管を共に通らない (#3523)
      const reach = (c: (typeof branches)[number]): number => Math.abs(rectOf(c.to).x + rectOf(c.to).w / 2 - (rectOf(c.from).x + rectOf(c.from).w / 2));
      let callList = [...branches];
      const slotsOf = new Map<string, number[]>();
      branches.forEach((c, i) => slotsOf.set(c.from, [...(slotsOf.get(c.from) ?? []), i]));
      for (const slots of slotsOf.values()) {
        const nearer = slots.map((i) => branches[i] as (typeof branches)[number]).sort((a, b) => reach(a) - reach(b));
        slots.forEach((slot, k) => (callList[slot] = nearer[k] as (typeof branches)[number]));
      }
      let bestCalls: { list: typeof branches; failed: number; bent: number; twice: number; cramped: number } | undefined;
      let ranCalls = callList;
      const triedCalls = new Set<string>();
      const keyOfList = (l: typeof branches): string => l.map((c) => `${c.from}>${c.to}`).join(",");
      for (let round = 0; round < 4 && !triedCalls.has(keyOfList(callList)); round++) {
        triedCalls.add(keyOfList(callList));
        ranCalls = callList;
        const got = routeCalls(callList, false);
        if (!bestCalls || lessThan([got.failed.length, got.bent.length, got.twice.length, got.cramped.length], [bestCalls.failed, bestCalls.bent, bestCalls.twice, bestCalls.cramped]))
          bestCalls = { list: callList, failed: got.failed.length, bent: got.bent.length, twice: got.twice.length, cramped: got.cramped.length };
        const bad = [...new Set([...got.failed, ...got.bent, ...got.twice, ...got.cramped])];
        if (bad.length === 0) break;
        callList = [...callList.filter((c) => bad.includes(`${c.from}>${c.to}`)), ...callList.filter((c) => !bad.includes(`${c.from}>${c.to}`))];
      }
      // 道が無いか、曲がりすぎたか、1 本の値の管を 2 度越えたか、弁を置けなかった管が残る時は、間を広げた組み方で組み直す
      if (bestCalls && bestCalls.failed + bestCalls.bent + bestCalls.twice + bestCalls.cramped > 0 && !plan.last) return undefined;
      if (bestCalls && (bestCalls.list !== ranCalls || bestCalls.failed > 0)) routeCalls(bestCalls.list, bestCalls.failed > 0);
    }

    // ---- 書き込む管

    const writes: PipeWrite[] = sim.writes
      .filter((w) => !foldSteps.has(w.step) && visible.has(w.from))
      .flatMap((w) => {
        const plate = isBox(w.to) ? undefined : plateRect(w.to, w.name);
        if (isBox(w.to)) {
          const box = rectOf(w.to);
          const i = (platesOf.get(w.to) ?? []).indexOf(w.name);
          if (i < 0) return [];
          const y = box.y + P.token.keyY + P.token.line * i - T.key.size;
          return [{ ...w, points: [[box.x + box.w / 2, y], [box.x + box.w / 2, y]] as Point[] }];
        }
        if (!plate) return [];
        const writer = rectOf(w.from);
        const px = plate.x + plate.w / 2;
        const turn = yOfBand(w.to) + (P.housing.top - IO_H) / 2 - 2;
        if (w.from === w.to) {
          const hs = housingOf.get(w.to) as PipeHousing;
          return [{ ...w, points: [[px, hs.y + P.housing.top - P.write.turn], [px, plate.y]] as Point[] }];
        }
        const wx = writer.x + writer.w / 2;
        const start = shapeOf(w.from) === "round" ? writer.y + writer.h / 2 + belowOf(w.from) : writer.y + writer.h;
        const straight: Point[] = [[wx, start], [wx, turn], [px, turn], [px, plate.y]];
        // 書き手の下から真っすぐ下りると名札を通る時は、名札と点線を避けて道を探す
        const blocked = [...partyRects.entries()].some(([id, r]) => id !== w.from && id !== w.to && segs(straight).some(([a, b]) => hits(a, b, r, 2)));
        if (!blocked) return [{ ...w, points: straight }];
        const cy = cyOf(w.from);
        // 横から出る時は、縁の手前で上か下へ折れてよい。書き込む管は細く、隣の点線の際を通れる
        const sides: End[] = [writer.x - APPROACH, writer.x + writer.w + APPROACH].flatMap((x): End[] =>
          ([x < wx ? 2 : 0, 1, 3] as Dir[]).map((dir) => ({ at: [x, cy] as Point, dir, cost: 20 })),
        );
        const path = callRouter.route({
          owner: `w:${w.from}>${w.to}.${w.name}`,
          group: `w:${w.from}>${w.to}.${w.name}`,
          kind: "write",
          width: 3,
          starts: [...(holding.has(w.from) ? [] : [{ at: [wx, writer.y + writer.h + APPROACH] as Point, dir: 1 as Dir, cost: 0 }]), ...sides],
          ends: [
            { at: [px, turn], dir: 0, cost: 0 },
            { at: [px, turn], dir: 2, cost: 0 },
          ],
          allow: new Set(callOwn.get(`h:${w.to}`) ?? []),
          cross: (l) => (l.kind === "tie" || l.kind === "valve" ? undefined : 40),
          gap: 4,
          bend: 40,
        });
        if (!path) return [{ ...w, points: straight }];
        const first = path[0] as Point;
        const edge: Point = Math.abs(first[0] - wx) < 0.5 ? [wx, start] : [first[0] < wx ? writer.x : writer.x + writer.w, cy];
        return [{ ...w, points: simplify([edge, ...path, [px, plate.y]]) }];
      });

    // ---- 呼び出しの管の弁と計器。管が横に走る所に、決まりの間を空けて置く

    const gaugeAt = new Map<string, { on: PipeGauge["on"]; cx: number; cy: number; stem?: { y1: number; y2: number }; col?: { x: number; w: number } }>();
    for (const party of checkers) {
      const bay = bays.find((b) => b.gauges.some((g) => g.party === party));
      const g = bay?.gauges.find((x) => x.party === party);
      if (bay && g) {
        gaugeAt.set(party, { on: "value", cx: g.cx, cy: g.cy, stem: { y1: g.cy + P.gauge.r, y2: bay.y - P.gauge.stemGap }, col: g.col });
        continue;
      }
      const incoming = shown.find((c) => c.to === party);
      const points = incoming ? callPath.get(`${incoming.from}>${incoming.to}`) : undefined;
      if (points && !isBox(party)) {
        const valve = valves.get(`${incoming?.from}>${incoming?.to}`) as Point;
        const dist = (() => {
          let walked = 0;
          for (const [a, b] of segs(points)) {
            const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
            if (Math.abs(valve[1] - a[1]) < 0.5 && flat(a, b) && valve[0] >= Math.min(a[0], b[0]) && valve[0] <= Math.max(a[0], b[0])) return walked + Math.abs(valve[0] - a[0]);
            if (Math.abs(valve[0] - a[0]) < 0.5 && !flat(a, b) && valve[1] >= Math.min(a[1], b[1]) && valve[1] <= Math.max(a[1], b[1])) return walked + Math.abs(valve[1] - a[1]);
            walked += len;
          }
          return 0;
        })();
        const branch = `${incoming?.from}>${incoming?.to}`;
        const at = spot(points, P.gauge.r, dist + P.valve.r + SPACING + P.gauge.r, [], branch) ?? spot(points, P.gauge.r, 0, [], branch);
        if (at) {
          gaugeAt.set(party, { on: "call", cx: at[0], cy: at[1] });
          onCall.push({ at, half: P.gauge.r, tall: P.gauge.r, branch });
          continue;
        }
      }
      // 管に載せられない時は名札の横に置く。線と重ならない向きを選ぶ
      const box = rectOf(party);
      const cy = box.y + box.h / 2;
      const r = P.gauge.r;
      const lines = otherLines("", true);
      const right: Point = [box.x + box.w + P.gauge.lampGap + r, cy];
      const tries: Point[] = [
        right,
        [box.x - P.gauge.lampGap - r - P.gauge.lamp * 2, cy],
        [box.x + box.w / 2, box.y - P.gauge.lampGap - r],
      ];
      const at = tries.find(([x, y]) => !lines.some((l) => segs(l.points).some(([u, v]) => hits(u, v, { x: x - r, y: y - r, w: r * 2 + P.gauge.lampGap + P.gauge.lamp * 2, h: r * 2 }, l.half + 2)))) ?? right;
      gaugeAt.set(party, { on: "party", cx: at[0], cy: at[1] });
    }

    // ---- 部品

    const widthAll = width0;
    const height = height0;
    const parties: PipeParty[] = order
      .filter((id) => partyRects.has(id))
      .map((id) => {
        const r = rectOf(id);
        const shape = shapeOf(id);
        const box = diagram.boxes.find((b) => b.id === id);
        const label =
          shape === "round"
            ? textAt(nameOf(id), r.x + r.w / 2, cyOf(id) + P.avatar.nameY, T.party, "middle")
            : shape === "token"
              ? textAt(nameOf(id), r.x + r.w / 2, r.y + P.token.nameY, T.party, "middle")
              : textAt(nameOf(id), r.x + P.cabinet.name, cyOf(id) + T.party.size * 0.4, T.party);
        return {
          ...r,
          id,
          name: nameOf(id),
          role: roleOf(id),
          ...(box?.icon ? { icon: box.icon } : {}),
          shape,
          ...(shape === "token" ? {} : { row: bandOf(id) === 1 ? maxRow + 1 : rowOf(id) }),
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
        const hs = housingOf.get(p.id);
        const left = hs ? Math.min(hs.x, p.x) : p.x;
        const right = hs ? Math.max(hs.x + hs.w, p.x + p.w) : p.x + p.w;
        const bottom = hs ? hs.y + hs.h : p.y + p.h;
        columns.push({ party: p.id, step: s, x: left, y: p.y, w: right - left, h: bottom - p.y, folded: false });
        pills.push({ x: p.x, y: p.y, w: p.w, h: p.h, party: p.id, step: s, folded: false, active: snapOf(s).active === p.id, involved: (involved[s] as Set<string>).has(p.id) });
      }

    // 槽と水位。水位の物差しは、トークンごとに並べた槽の一番多い量で作る
    const scale = new Map(
      tokens.map((token) => {
        const amounts = holders.filter((h) => has(h, token)).flatMap((h) => historyOf(`b${keyOf(h, token)}`).map(amountNumber));
        return [token, Math.max(0, ...amounts)];
      }),
    );
    const room = P.tank.h - P.tank.pad * 2;
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
    const tanks: PipeTank[] = [];
    const glasses: PipeGlass[] = [];
    const levels: PipeLevel[] = [];
    for (const h of holders)
      for (const token of tanksOf.get(h) ?? []) {
        const glass = tankOf(h, token);
        const cx = glass.x + glass.w / 2;
        const tank: PipeTank = { ...glass, party: h, token, title: { ...textAt(token, cx, glass.y + P.tank.titleY, T.tankTitle, "middle"), x: cx - titleW(token) / 2, w: titleW(token) }, tone: toneOf(token) };
        tanks.push(tank);
        const key = `b${keyOf(h, token)}`;
        const numberBase = numberBaseOf(glass);
        for (const s of stepList) {
          glasses.push({ ...tank, step: s });
          const snap = snapOf(s);
          const amount = snap.balances.get(keyOf(h, token)) ?? "0";
          const state = snap.states.get(key) ?? "none";
          const old = snap.was.get(key);
          const changedAt = snap.changed.get(key);
          const prev = s > 0 ? snapOf(s - 1).balances.get(keyOf(h, token)) : undefined;
          const text = textAt(grouped(amount), cx, numberBase, amountStyle, "middle");
          let delta: PipeText | undefined;
          let tag: PipeText | undefined;
          if (!narrow && old !== undefined && state !== "none") {
            const diff = minus(amount, old);
            const sign = diff.startsWith("-") ? "−" : "+";
            delta = textAt(joinWords(`${sign}${grouped(diff.replace(/^-/u, ""))}`, token), cx, numberBase + P.tank.deltaY, T.delta, "middle");
            tag = textAt(words.tags[state], cx, numberBase + P.tank.deltaY + P.tank.tagY, T.tag, "middle");
          }
          levels.push({
            ...liquid(glass, token, amount),
            party: h,
            token,
            step: s,
            amount,
            state,
            text,
            ...(delta ? { delta } : {}),
            ...(tag ? { tag } : {}),
            ...(old !== undefined && state !== "none" ? { base: liquid(glass, token, old) } : {}),
            ...(changedAt !== undefined ? { event: changedAt } : {}),
            ...(changedAt !== undefined && prev !== undefined && prev !== amount ? { from: liquid(glass, token, prev) } : {}),
          });
        }
      }

    // 値の管と、トークンの箱を載せる所と弁
    const valuePipes: PipeValuePipe[] = [];
    const pipeIndex = new Map<number, number>();
    for (const r of routes) {
      if (!r) continue;
      const d = defs[r.def] as Def;
      pipeIndex.set(r.def, valuePipes.length);
      valuePipes.push({ token: d.token, from: d.from, to: d.to, points: r.points, ports: r.ports, tone: toneOf(d.token), group: groupOfDef(r.def) });
    }
    const buses: PipeBus[] = tokens.map((token) => {
      const box = boxOf(token);
      const bay = box !== undefined ? bayOf.get(box) : undefined;
      if (bay) {
        const valve = token === ETH ? undefined : { party: bay.home.box, x: xOf.get(bay.home.box) ?? 0, y: bay.y };
        return { token, y: bay.y, x1: Math.min(bay.x1, bay.x2), x2: Math.max(bay.x1, bay.x2), ...(valve ? { valve } : {}) };
      }
      const pipe = valuePipes.find((p) => p.token === token);
      const seg = pipe ? segs(pipe.points).filter(([a, b]) => flat(a, b)).sort(([a, b], [c, d]) => Math.abs(d[0] - c[0]) - Math.abs(b[0] - a[0]))[0] : undefined;
      if (seg) return { token, y: seg[0][1], x1: Math.min(seg[0][0], seg[1][0]), x2: Math.max(seg[0][0], seg[1][0]) };
      const owner = holders.find((h) => has(h, token));
      const t = owner ? tankOf(owner, token) : { x: 0, y: 0, w: 0, h: 0 };
      return { token, y: t.y + (portSlots[0] as number), x1: t.x, x2: t.x + t.w };
    });
    const pipes: PipeBusAt[] = stepList.flatMap((s) => buses.map((b) => ({ ...b, step: s })));

    // 流れた分。段ごとに、暫定と取り消しの分と、その段で確定した分を描く。同じ管を同じ段に流れた分は管の中でずらす
    const shownAt = stepList.map((s) => {
      const snap = snapOf(s);
      return moving.filter((f) => {
        if (f.step > s) return false;
        const state = snap.states.get(`f${f.id}`);
        return state === "provisional" || state === "rolled" || (state === "final" && snap.changed.has(`f${f.id}`));
      });
    });
    const flows: PipeFlow[] = stepList.flatMap((s) => {
      const used = new Map<number, number>();
      return (shownAt[s] ?? []).flatMap((f): PipeFlow[] => {
        const k = defOf(f);
        const pipe = valuePipes[pipeIndex.get(k) ?? -1];
        if (!pipe) return [];
        const track = used.get(k) ?? 0;
        used.set(k, track + 1);
        const shift = track === 0 ? 0 : (track % 2 === 1 ? -1 : 1) * Math.ceil(track / 2) * P.flow.track;
        const forward = pipe.from === f.from;
        const base = forward ? pipe.points : [...pipe.points].reverse();
        const points = offsetPath(base, shift);
        const longest = segs(points).sort(([a, b], [c, d]) => Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1]) - (Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])))[0] as [Point, Point];
        const [a, b] = longest;
        const vertical = !flat(a, b);
        const dir = (vertical ? Math.sign(b[1] - a[1]) : Math.sign(b[0] - a[0])) >= 0 ? 1 : -1;
        const snap = snapOf(s);
        const changedAt = snap.changed.get(`f${f.id}`);
        return [
          {
            id: f.id,
            step: s,
            token: f.token,
            from: f.from,
            to: f.to,
            amount: f.amount,
            state: snap.states.get(`f${f.id}`) ?? "none",
            points,
            arrow: { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, dir, vertical },
            tone: toneOf(f.token),
            fresh: f.step === s,
            ...(changedAt !== undefined ? { event: changedAt } : {}),
          },
        ];
      });
    });

    // 呼び出しの管
    const widthOf = (kind: PipeCallLane["kind"]): number => (kind === "static" ? P.call.flow / 2 : P.call.flow);
    const calls: PipeCallLane[] = shown.map((c) => {
      const points = callPath.get(`${c.from}>${c.to}`) as Point[];
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
        points,
        lit: points,
        ...(c.value !== undefined ? { value: c.value } : {}),
        ...(c.close ? { close: c.close } : {}),
      };
    });
    const mains: PipeMain[] = [...new Set(branches.map((c) => c.from))].map((from) => ({
      from,
      y: cyOf(from),
      points: [],
      branches: branches
        .filter((c) => c.from === from)
        .map((c) => {
          const v = valves.get(`${c.from}>${c.to}`) as Point;
          return { to: c.to, points: callPath.get(`${c.from}>${c.to}`) as Point[], valve: { x: v[0], y: v[1], vertical: uprightValves.has(`${c.from}>${c.to}`), under: underValves.has(`${c.from}>${c.to}`) } };
        }),
    }));
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
          points: callPath.get(`${c.from}>${c.to}`) as Point[],
          ...(c.step === s ? { opened: c.event } : {}),
          ...(c.close?.step === s ? { shut: c.close.event } : {}),
        })),
    );
    // 呼び出しの管が値の管の下をくぐる所
    const crossings: PipeCrossing[] = [];
    for (const c of calls)
      for (const [pi, pipe] of [...valuePipes.entries(), ...stubs.map((s, i): [number, { token: string; points: Point[] }] => [-1 - i, s])]) {
        if (pi < 0) continue;
        for (const [a, b] of segs(c.points))
          for (const [u, v] of segs(pipe.points)) {
            const callFlat = flat(a, b);
            if (callFlat === flat(u, v)) continue;
            const [h1, h2, v1, v2] = callFlat ? [a, b, u, v] : [u, v, a, b];
            const x = v1[0];
            const y = h1[1];
            const inH = x > Math.min(h1[0], h2[0]) + 1e-6 && x < Math.max(h1[0], h2[0]) - 1e-6;
            const inV = y > Math.min(v1[1], v2[1]) + 1e-6 && y < Math.max(v1[1], v2[1]) - 1e-6;
            if (inH && inV) crossings.push({ call: c.index, token: pipe.token, pipe: pi, x, y, vertical: !callFlat });
          }
      }

    // 計器。確かめる者ごとに 1 つ、最初に確かめた段から最後の段まで置き、針と通ったかの印を残す
    const gauges: PipeGauge[] = [];
    for (const party of checkers) {
      const own = sim.checks.filter((c) => c.party === party);
      const firstStep = Math.min(...own.map((c) => c.step));
      const place = gaugeAt.get(party);
      if (!place) continue;
      const r = P.gauge.r;
      let angle: number = P.gauge.unseen;
      for (let s = firstStep; s < steps; s++) {
        const doneHere = own.filter((c) => c.step <= s);
        const latest = doneHere[doneHere.length - 1] as CheckRec;
        const here = own.filter((c) => c.step === s);
        const from = angle;
        angle = latest.ok ? P.gauge.ok : P.gauge.fail;
        const { cx, cy } = place;
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
        });
      }
    }

    // 変換器
    const converters: PipeConverter[] = [];
    for (const h of holders) {
      const rc = converterRect(h);
      const own = sim.calcs.filter((c) => c.party === h);
      const [first] = own;
      const [ta] = (innerOf.get(h) as Inner).tanks;
      if (!rc || !first || !ta) continue;
      const left = tankOf(h, ta.token).x + tankOf(h, ta.token).w;
      const right = left + (rc.x - left) * 2 + rc.w;
      for (const s of stepList) {
        const here = own.filter((c) => c.step === s && !foldSteps.has(s));
        const shownCalc = here[0] ?? [...own].reverse().find((c) => c.step <= s) ?? first;
        converters.push({
          ...rc,
          party: h,
          step: s,
          calc: shownCalc.step,
          ...(here[0] ? { event: here[0].event } : {}),
          in: shownCalc.input,
          out: shownCalc.output,
          rate: shownCalc.rate,
          active: here.length > 0,
          cx: rc.x + rc.w / 2,
          cy: rc.y + rc.h / 2,
          r: rc.w / 2,
          left,
          right,
        });
      }
    }

    // 値の札。トークンの箱の値は箱の中の名前の下に、ほかは持ち主の囲いの中に置く
    const plates: PipePlate[] = [];
    for (const party of order) {
      const boxed = isBox(party);
      (platesOf.get(party) ?? []).forEach((name, i) => {
        const key = `v${keyOf(party, name)}`;
        const spot0 = boxed ? undefined : plateRect(party, name);
        if (!boxed && !spot0) return;
        if (boxed && !partyRects.has(party)) return;
        const box = rectOf(party);
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
          const p = spot0 as Rect;
          const cx = p.x + p.w / 2;
          let was: PipeText | undefined;
          let strike: Rect | undefined;
          let tag: PipeText | undefined;
          if (old !== undefined && state !== "none") {
            // 前の値と語は槽の数字と同じ行に置く。札のすぐ下は、槽の右の口から出る管が札の下を通る所
            const base = tankTop(party) + P.tank.h + P.tank.numberY;
            const ww = textWidth(old, T.sub);
            const total = ww + PART_GAP + textWidth(words.tags[state], T.tag);
            was = textAt(old, cx - total / 2, base, T.sub);
            strike = { x: was.x - 1, y: was.y + was.h * 0.55, w: was.w + 2, h: 1.5 };
            tag = textAt(words.tags[state], was.x + was.w + PART_GAP, base, T.tag);
          }
          plates.push({
            ...p,
            party,
            name,
            step: s,
            value,
            state,
            boxed,
            label: textAt(name, cx, p.y + P.plate.nameY, T.tankTitle, "middle"),
            text: textAt(value, cx, p.y + p.h / 2 + P.plate.valueY, T.plateValue, "middle"),
            ...(was && strike && tag ? { was, strike, tag } : {}),
            ...at,
          });
        }
      });
    }

    // ---- 図の中の札

    /** 札を置かない所。部品と、置いた線と、同じ段に置いた札 */
    const fixed: Rect[] = [
      ...parties.map((p) => labelOf(p.id)),
      ...tanks,
      ...holders.flatMap((h) => (tanksOf.get(h) ?? []).flatMap((t) => textRows(h, t))),
      ...holders.flatMap((h) => (platesOf.get(h) ?? []).flatMap((n) => (plateRect(h, n) ? [grow(plateRect(h, n) as Rect, 0)] : []))),
      ...holders.flatMap((h) => (converterRect(h) ? [converterRect(h) as Rect] : [])),
      // 値の札の前の値と語は、札の下の槽の数字と同じ行に在る
      ...plates.flatMap((pl) => [pl.was, pl.tag].filter((t): t is PipeText => t !== undefined)),
      ...[...gaugeAt.values()].flatMap((g) => [
        { x: g.cx - P.gauge.r, y: g.cy - P.gauge.r, w: P.gauge.r * 2, h: P.gauge.r * 2 },
        { x: g.cx + P.gauge.r + P.gauge.lampGap - P.gauge.lamp, y: g.cy - P.gauge.r + 4 - P.gauge.lamp, w: P.gauge.lamp * 2, h: P.gauge.lamp * 2 },
      ]),
      ...[...valves.values()].map(([x, y]) => ({ x: x - P.valve.r, y: y - P.valve.stem - P.valve.lever, w: P.valve.r * 2 + P.valve.lever, h: P.valve.stem + P.valve.lever + P.valve.half })),
    ];
    const lines: { points: Point[]; half: number }[] = [
      ...valuePipes.map((p) => ({ points: p.points, half: vHalf })),
      ...stubs.map((p) => ({ points: p.points, half: vHalf })),
      ...[...callPath.values()].map((p) => ({ points: p, half: cHalf })),
      ...ties.map((t) => ({ points: [[t.x, t.y1], [t.x, t.y2]] as Point[], half: 1 })),
      ...writes.map((w) => ({ points: w.points, half: 1.5 })),
      ...bays.map((b) => {
        const box = rectOf(b.home.box);
        return { points: [[box.x + box.w / 2, box.y + box.h], [box.x + box.w / 2, b.y]] as Point[], half: 2 };
      }),
    ];
    const inFigure = (r: Rect): boolean => r.x >= P.margin && r.y >= P.margin && r.x + r.w <= widthAll - P.margin && r.y + r.h <= height - P.margin;
    const clearOf = (r: Rect, placed: readonly Rect[]): boolean =>
      inFigure(r) &&
      fixed.every((o) => apart(r, o, PART_GAP)) &&
      placed.every((o) => apart(r, o, PART_GAP)) &&
      lines.every((l) => segs(l.points).every(([a, b]) => !hits(a, b, r, l.half + 4))) &&
      housings.every((hs) => apart(r, hs, PART_GAP) || (r.x >= hs.x && r.x + r.w <= hs.x + hs.w && r.y >= hs.y && r.y + r.h <= hs.y + hs.h));
    const firstClear = (tries: readonly Rect[], placed: readonly Rect[]): Rect => tries.find((r) => clearOf(r, placed)) ?? (tries[0] as Rect);
    /** `near` の周りに w × h の札を置く候補。近い順。先に挙げた候補で空きが無い時に使う */
    const around = (near: Rect, w: number, h: number): Rect[] => {
      const cx = near.x + near.w / 2;
      const cy = near.y + near.h / 2;
      const out: Rect[] = [];
      const stepX = 12;
      const stepY = h + 4;
      for (let i = -8; i <= 8; i++)
        for (let j = -6; j <= 6; j++) {
          const x = cx - w / 2 + i * (near.w / 2 + w / 2 + stepX) / 2 + Math.sign(i) * stepX * Math.max(0, Math.abs(i) - 2);
          const y = cy - h / 2 + j * stepY;
          out.push({ x, y, w, h });
        }
      return out.sort((a, b) => Math.hypot(a.x + w / 2 - cx, (a.y + h / 2 - cy) * 1.5) - Math.hypot(b.x + w / 2 - cx, (b.y + h / 2 - cy) * 1.5));
    };
    const chipOf = (kind: PipeChip["kind"], text: string, r: Rect, step: number, extra: Partial<PipeChip> = {}, big = false): PipeChip => {
      const style = kind === "io" ? T.io : big ? bigStyle : chipStyle;
      return {
        ...r,
        kind,
        text,
        size: style.size,
        rx: P.chip.rx,
        label: textAt(text, r.x + r.w / 2, middleBase(r.y, r.h, style), style, "middle"),
        step,
        ...extra,
      };
    };
    const chips: PipeChip[] = [];
    const placedAt = stepList.map((): Rect[] => []);
    /** 狭い枠の、図の下の帯に出す札。置き場所は図の大きさを決めた後に決める */
    const banded: { kind: "amount" | "formula"; text: string; step: number; extra: Partial<PipeChip> }[] = [];

    // 入力と出力の印。始めた人が払った槽と受け取った槽の、囲いの上の余白に置く
    if (sender !== undefined)
      for (const { token, text, r } of ioMarks()) {
        for (const s of stepList) {
          chips.push(chipOf("io", text, r, s, { party: sender, token }));
          placedAt[s]?.push(r);
        }
      }

    // 計器の式。値の管の計器は確かめた段から後も残し、呼び出しの管の計器は確かめた段だけ出す。狭い枠は確かめた段だけ
    for (const party of checkers) {
      const g = gaugeAt.get(party);
      if (!g) continue;
      const own = sim.checks.filter((c) => c.party === party);
      for (const s of stepList) {
        const here = own.filter((c) => c.step === s);
        const latest = [...own].reverse().find((c) => c.step <= s);
        const c = here[here.length - 1] ?? (g.on === "value" && !narrow ? latest : undefined);
        if (!c) continue;
        const text = formulaOf(c);
        if (narrow) {
          banded.push({ kind: "formula", text, step: s, extra: { party, ok: c.ok } });
          continue;
        }
        const w = chipW(text);
        const r = P.gauge.r;
        const tries: Rect[] = [
          ...(g.col ? [{ x: g.col.x + (g.col.w - w) / 2, y: g.cy - r - P.chip.off - chipH, w, h: chipH }] : []),
          { x: g.cx - w / 2, y: g.cy - r - P.chip.off - chipH, w, h: chipH },
          { x: g.cx - w / 2, y: g.cy + r + P.chip.off, w, h: chipH },
          { x: g.cx + r + P.gauge.lampGap + P.gauge.lamp * 2 + P.chip.off, y: g.cy - r - chipH, w, h: chipH },
          { x: g.cx - r - P.chip.off - w, y: g.cy - r - chipH, w, h: chipH },
          ...around({ x: g.cx - r, y: g.cy - r, w: r * 2, h: r * 2 }, w, chipH),
        ];
        const at = firstClear(tries, placedAt[s] ?? []);
        chips.push(chipOf("formula", text, at, s, { party, ok: c.ok }));
        placedAt[s]?.push(at);
      }
    }

    // 流れた量。値の管の近くに、単位つきで置く。狭い枠はその段で流れた分だけ。
    // 広い枠は済んだ段の分も残すが、その段で流れた分を先に置き、管の際の空きを先に取らせる
    for (const s of stepList)
      for (const f of flows.filter((x) => x.step === s && (!narrow || x.fresh)).sort((a, b) => Number(b.fresh) - Number(a.fresh))) {
        const pipe = valuePipes[pipeIndex.get(defOf(moving.find((m) => m.id === f.id) as FlowRec)) ?? -1];
        if (!pipe) continue;
        const text = joinWords(grouped(f.amount), f.token);
        if (narrow) {
          banded.push({ kind: "amount", text, step: s, extra: { token: f.token, state: f.state, tone: f.tone, ...(f.event !== undefined ? { event: f.event } : {}) } });
          continue;
        }
        const w = chipW(text);
        const off = vHalf + P.chip.off;
        const tries: Rect[] = [];
        const ordered = segs(pipe.points).sort(([a, b], [c, d]) => Number(!flat(a, b)) - Number(!flat(c, d)) || Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1]) - (Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])));
        /** 線分 a-b の割合 k の所から、管の真ん中から d 離した両脇の札の四角。横の管は下と上、縦の管は右と左の順 */
        const beside = (a: Point, b: Point, k: number, d: number): Rect[] => {
          const x = a[0] + (b[0] - a[0]) * k;
          const y = a[1] + (b[1] - a[1]) * k;
          return flat(a, b)
            ? [{ x: x - w / 2, y: y + d, w, h: chipH }, { x: x - w / 2, y: y - d - chipH, w, h: chipH }]
            : [{ x: x + d, y: y - chipH / 2, w, h: chipH }, { x: x - d - w, y: y - chipH / 2, w, h: chipH }];
        };
        for (const [a, b] of ordered) for (const k of AMOUNT_AT) tries.push(...beside(a, b, k, off));
        // 決めた割合の所が全て塞がる時は、管の際のまま線分に沿って細かくずらし、真ん中に近い所から試す (#3528)。
        // 束の外側まで離すと、札と管の間にほかの管や部品が入り、どの流れの量か読み手が取り違える
        for (const [a, b] of ordered) {
          const length = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
          const shifts = Array.from({ length: Math.floor(length / P.chip.slide) + 1 }, (_, i) => i * P.chip.slide).sort((p, q) => Math.abs(p - length / 2) - Math.abs(q - length / 2));
          for (const t of shifts) tries.push(...beside(a, b, t / length, off));
        }
        // 管の際が束ねた管で塞がる時は、束の外側まで離した所を試す
        for (const [a, b] of ordered) for (const far of [1, 2, 3, 4, 5]) for (const k of AMOUNT_AT) tries.push(...beside(a, b, k, off + far * (chipH + PART_GAP)));
        // それでも空きが無い時は、一番長い線分の真ん中の近くの空きに置く
        const [la, lb] = ordered[0] ?? [];
        if (la && lb) tries.push(...around({ x: (la[0] + lb[0]) / 2, y: (la[1] + lb[1]) / 2, w: 0, h: 0 }, w, chipH));
        const at = firstClear(tries, placedAt[s] ?? []);
        chips.push(chipOf("amount", text, at, s, { token: f.token, flow: f.id, state: f.state, tone: f.tone, ...(f.event !== undefined ? { event: f.event } : {}) }));
        placedAt[s]?.push(at);
      }

    // イベントの札。出した者の箱の横に置く。同じ者が同じ名前のイベントを 2 つ以上出した段は 1 つにまとめる
    const events: PipeEventChip[] = [];
    if (!narrow)
      for (const s of stepList) {
        const snap = snapOf(s);
        const groups = new Map<string, EmitRec[]>();
        for (const id of snap.emitted) {
          const e = sim.emits[id] as EmitRec;
          if (!partyRects.has(e.party)) continue;
          const k = `${e.party}|${e.name}`;
          groups.set(k, [...(groups.get(k) ?? []), e]);
        }
        const besideCount = new Map<string, number>();
        for (const list of groups.values()) {
          const e = list[list.length - 1] as EmitRec;
          const merged = list.length > 1;
          const text = merged ? `${chipTextOf(e)} ×${list.length}` : chipTextOf(e);
          const args = !merged && e.step === s ? argsOf(e) : undefined;
          const w = chipW(text) + (args ? P.chip.argsGap + textWidth(args, T.args) : 0);
          const emitter = rectOf(e.party);
          const n = besideCount.get(e.party) ?? 0;
          besideCount.set(e.party, n + 1);
          const cx = emitter.x + emitter.w / 2;
          const below = isBox(e.party) ? emitter.y + emitter.h + PART_GAP + n * (chipH + 4) : emitter.y + emitter.h + PART_GAP;
          const mid = emitter.y + emitter.h / 2 - chipH / 2 + n * (chipH + 4);
          const tries: Rect[] = [
            ...(isBox(e.party) ? [{ x: cx + 6, y: below, w, h: chipH }, { x: cx - 6 - w, y: below, w, h: chipH }] : []),
            { x: emitter.x + emitter.w + P.chip.beside, y: mid, w, h: chipH },
            { x: emitter.x - P.chip.beside - w, y: mid, w, h: chipH },
            { x: cx + 6, y: emitter.y + emitter.h + PART_GAP + n * (chipH + 4), w, h: chipH },
            { x: cx - 6 - w, y: emitter.y + emitter.h + PART_GAP + n * (chipH + 4), w, h: chipH },
            ...around(emitter, w, chipH),
          ];
          const at = firstClear(tries, placedAt[s] ?? []);
          placedAt[s]?.push(at);
          const textR = textAt(text, at.x + P.chip.padX, middleBase(at.y, at.h, chipStyle), chipStyle);
          const changedAt = list.map((x) => snap.changed.get(`e${x.id}`)).find((x) => x !== undefined);
          const state = list.map((x) => snap.states.get(`e${x.id}`) ?? "none").reduce((a, b) => (a === "provisional" || b === "provisional" ? "provisional" : b));
          events.push({
            id: e.id,
            ...at,
            party: e.party,
            name: e.name,
            step: s,
            emitted: e.step,
            state,
            text: textR,
            ...(args ? { args: textAt(args, textR.x + textR.w + P.chip.argsGap, middleBase(at.y, at.h, T.args), T.args) } : {}),
            ...(changedAt !== undefined ? { event: changedAt } : {}),
          });
          chips.push(chipOf("event", text, at, s, { party: e.party, state, ...(changedAt !== undefined ? { event: changedAt } : {}) }));
        }
      }
    const rings: PipeRing[] = sim.emits.filter((e) => !foldSteps.has(e.step) && visible.has(e.party)).map((e) => ({ party: e.party, step: e.step, event: e.event }));

    // 戻り値の札。呼ばれた側から呼び出しの管を伝って呼んだ側へ戻る
    /** 戻り値の札が着く所で避ける弁の形。呼び出しの管の弁とトークンの箱の弁の、胴と軸と閉じた取っ手と開いた取っ手 */
    const valveBlocks: Rect[] = [
      ...[...valves].flatMap(([k, [x, y]]) => valveRects(x, y, uprightValves.has(k), underValves.has(k))),
      ...buses.flatMap((b) => (b.valve ? valveRects(b.valve.x, b.valve.y, false, false) : [])),
    ];
    /** 段 `s` に戻り値の札が着く所で避ける部品。箱と名前の字、弁、その段の計器 (盤と通ったかの印と軸)、その段に置いた札 */
    const blocks = (s: number): Rect[] => [
      ...parties.map((p) => labelOf(p.id)),
      ...valveBlocks,
      ...gauges
        .filter((g) => g.step === s)
        .flatMap((g) => [
          { x: g.x, y: g.y, w: g.w, h: g.h },
          { x: g.lamp.x - g.lamp.r, y: g.lamp.y - g.lamp.r, w: g.lamp.r * 2, h: g.lamp.r * 2 },
          ...(g.stem ? [{ x: g.cx - 2, y: g.stem.y1, w: 4, h: g.stem.y2 - g.stem.y1 }] : []),
        ]),
      ...(placedAt[s] ?? []),
    ];
    if (!narrow)
      for (const ret of sim.returns) {
        const c = sim.calls[ret.call];
        if (!c || foldSteps.has(ret.step) || !ret.value) continue;
        const points = callPath.get(`${c.from}>${c.to}`);
        if (!points) continue;
        const back = [...points].reverse();
        const w = chipW(ret.value);
        // 呼ばれた側の名前の字に札がかからない所まで管に沿って進み、そこから動き出す。横から入る管では、縁の真ん中が名前の字の隣に在る
        const name = parties.find((p) => p.id === c.to)?.label;
        const rectAt = ([x, y]: Point): Rect => ({ x: x - w / 2, y: y - chipH / 2, w, h: chipH });
        let d = 0;
        while (name && d < lengthOf(back) / 2 && !apart(rectAt(along(back, d)), name, PART_GAP / 2)) d += 2;
        const started = d > 0 ? fromAlong(back, d) : back;
        // 着く所は、呼んだ側から管を遡り、箱と弁と計器とその段に置いた札のどれからも離れた最初の所にする (#3523)。
        // 呼んだ側の名札の手前には呼び出しの弁と計器が並ぶため、名札の手前で止めた札はそれらを隠していた
        const whole = lengthOf(started);
        const avoid = blocks(ret.step);
        /** 呼んだ側から遡り、どの部品からも `gap` 離れた最初の所までの長さ。無い時は `whole` */
        const backTo = (gap: number): number => {
          let at = 0;
          while (at < whole && !avoid.every((o) => apart(rectAt(along(started, whole - at)), o, gap))) at += 2;
          return at;
        };
        // 離れた所が無い短い管では、部品の縁に触れても重ならない所にする
        let e = backTo(PART_GAP / 2);
        if (e >= whole) e = backTo(0);
        // どこにも空きが無い時は、今までどおり呼んだ側の名札に札が載らない手前で止める。崩れの確かめが札と部品の重なりを知らせる
        if (e >= whole) {
          const caller = labelOf(c.from);
          e = 0;
          while (e < whole / 2 && !apart(rectAt(along(started, whole - e)), caller, 2)) e += 2;
        }
        const path = e > 0 ? fromAlong([...started].reverse(), e).reverse() : started;
        chips.push(chipOf("return", ret.value, rectAt(path[0] as Point), ret.step, { party: c.to, path, call: c.index, event: ret.event }));
      }

    // 畳んだ箱。呼ばれた者の下の空いた所に置く
    const foldBoxes: PipeFoldBox[] = folds.flatMap((fold) => {
      const call = sim.calls[fold.call];
      const party = call?.to ?? "";
      if (!partyRects.has(party)) return [];
      const count = fold.to - fold.from + 1;
      const text = words.fold(count, fold.hidden.length);
      const w = P.card.padX * 2 + P.card.icon + P.card.gap + Math.max(textWidth(words.open, T.cardTitle), textWidth(text, T.fold));
      const owner = rectOf(party);
      const cx = owner.x + owner.w / 2;
      const tries: Rect[] = [
        { x: owner.x + owner.w + P.card.top, y: owner.y + owner.h / 2 - P.card.h / 2, w, h: P.card.h },
        { x: cx - w / 2, y: owner.y + owner.h + P.card.top, w, h: P.card.h },
        { x: owner.x - P.card.top - w, y: owner.y + owner.h / 2 - P.card.h / 2, w, h: P.card.h },
        { x: cx - w / 2, y: owner.y - P.card.top - P.card.h, w, h: P.card.h },
      ];
      const at = firstClear(tries, placedAt[fold.step] ?? []);
      placedAt[fold.step]?.push(at);
      const left = at.x + P.card.padX + P.card.icon + P.card.gap;
      const title = textAt(words.open, left, at.y + P.card.titleY, T.cardTitle);
      const value = textAt(text, left, at.y + P.card.valueY, T.fold);
      return [{ ...at, party, step: fold.step, call: fold.call, steps: count, parties: fold.hidden.length, title, value, text: value }];
    });

    // 段ごとに関わる関係者を囲む所
    const focus = stepList.flatMap((s) => {
      const ids = [...new Set((diagram.steps[s] as Step).events.flatMap(partiesOf))].filter((id) => partyRects.has(id));
      if (ids.length === 0) return [];
      const rects = ids.map(rectOf);
      const left = Math.min(...rects.map((r) => r.x));
      const top = Math.min(...rects.map((r) => r.y));
      return [{ step: s, x: left, y: top, w: Math.max(...rects.map((r) => r.x + r.w)) - left, h: Math.max(...rects.map((r) => r.y + r.h)) - top }];
    });

    // 図の大きさは、置いた札と引いた管まで含める
    const all = [...chips.filter((c) => c.kind !== "return"), ...foldBoxes, ...gauges];
    const drawn: { points: Point[]; half: number }[] = [
      ...valuePipes.map((p) => ({ points: p.points, half: vHalf })),
      ...stubs.map((p) => ({ points: p.points, half: vHalf })),
      ...[...callPath.values()].map((points) => ({ points, half: cHalf })),
      ...writes.map((w) => ({ points: w.points, half: 1.5 })),
    ];
    const lineRight = Math.max(0, ...drawn.flatMap((l) => l.points.map((p) => p[0] + l.half + P.edge)));
    const lineBottom = Math.max(0, ...drawn.flatMap((l) => l.points.map((p) => p[1] + l.half + P.edge)));
    const widthFinal = Math.max(widthAll, lineRight, ...all.map((r) => r.x + r.w + P.margin));
    let heightFinal = Math.max(height, lineBottom, ...all.map((r) => r.y + r.h + P.margin));
    // 狭い枠は、今の段で動いた値を図の下の帯に大きな字で出す
    if (narrow && banded.length > 0) {
      const top = heightFinal - P.margin + P.narrow.gap;
      for (const s of stepList) {
        const here = banded.filter((b) => b.step === s);
        const ws = here.map((b) => chipW(b.text, bigStyle));
        let x = widthFinal / 2 - (ws.reduce((a, b) => a + b, 0) + P.chip.gap * Math.max(0, here.length - 1)) / 2;
        here.forEach((b, i) => {
          const w = ws[i] as number;
          chips.push(chipOf(b.kind, b.text, { x, y: top, w, h: bigH }, s, b.extra, true));
          x += w + P.chip.gap;
        });
      }
      heightFinal = top + bigH + P.margin;
    }

    return {
      kind: "pipe",
      arrangement: narrow ? "fit" : "wide",
      width: widthFinal,
      height: heightFinal,
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
      valuePipes,
      stubs,
      crossings,
      chips,
      narrow,
      focus,
    };

    function spanOf(k: number): number {
      const d = defs[k] as Def;
      return Math.abs((cols.get(d.from)?.x ?? 0) - (cols.get(d.to)?.x ?? 0)) + (bandOf(d.from) === bandOf(d.to) ? 0 : 1e4);
    }
  }

  /** 隣どうしの囲いを結ぶ管か。同じ段で並びが隣の 2 人の間の管 */
  function isAdjacent(d: Def): boolean {
    for (const band of [band0, band1]) {
      const i = band.indexOf(d.from);
      const j = band.indexOf(d.to);
      if (i >= 0 && j >= 0 && Math.abs(i - j) === 1) return true;
    }
    return false;
  }
}

