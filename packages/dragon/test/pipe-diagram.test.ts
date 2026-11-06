// @vitest-environment jsdom
/**
 * 配管の図 (#3389)。
 *
 * Solidity の関数を呼んだ時に中で何が起きたかを、関係者の列と上の呼び出しの管と下の槽と管で段ごとに見せる図。
 * 原本の JSON の `kind` は `pipe`。見た目の元は step 2 で本人が選んだ Tracelyth の第8回の試作 (`pipes2`) で、色は dragon の値の表で描く。
 *
 * 原本の JSON の形 (版2)
 *
 * - `blocks.box`: 関係者。`{ id, name, icon? }`。種類 (送り手、Contract、トークンの Contract、口座) は書かず、行から導く
 * - `blocks.hold`: 始めの値。残高は `{ box, amount, token }` (`hold pool: 2000 USDC, 10 WETH` は 2 つに分ける)、
 *   残高でない値は `{ box, name, value }` (`hold usdc: "allowance[alice][router]" 100`)。量は書いた字のまま持つ (`"0.05"`)。
 *   `token` はトークンの Contract の名前 (`box usdc as USDC` の `USDC`) か、宣言しない決まった名前の `ETH`
 * - 段の中の出来事 (`steps[].events`)
 *   - 呼び出し `a -> b: <字>` は `{ type: "call", from, to, label?, value?, call?, fold? }`。
 *     `[value: 1 ETH]` は `value: "1"`、`[call: delegate]` と `[call: static]` は `call`、`[fold]` は `fold: true`
 *   - `return <者>: <値>` は `{ type: "return", box, value? }`、`revert <者>: <理由>` は `{ type: "revert", box, reason? }`
 *   - `move <動かす者>: <量> <送り手> -> <受け手>` は `{ type: "move", box, amount, from, to }`
 *   - `write <者>: <名前> <値>` は `{ type: "write", box, name, value }`
 *   - `check <者>: <左> <比べ方> <右>` は `{ type: "check", box, left, op, right, fail? }`。`[fail]` は `fail: true`
 *   - `emit <者>: <名前>(<引数>, …)` は `{ type: "emit", box, name, args? }`。引数が無ければ `args` を持たない
 *   - `calc <者>: <入る値> -> <出る値>` は `{ type: "calc", box, in, out }`
 *
 * 記法の決まり (この file の検査が名指す所)
 *
 * - `return` と `revert` は、今いちばん内側で開いている呼び出しの呼ばれた者を名指す。ほかの者を名指した行は、その名前を指して止まる
 * - 閉じない呼び出しは、その呼び出しの行の頭を指して止まる。量が足りない行は量を、印の誤りは印の鍵か値を指して止まる
 * - 名前に `[` を持つ値の名前は、記法の決まり 3 のとおり `"` で囲む
 *
 * 描いた図の置き場所 (`renderDiagram` の `layout`、`kind` は `pipe`)
 *
 * 段ごとに変わる物は、見える段ごとに 1 つずつ持ち、`step` はその段の番号 (畳んだ図では畳んだ後の段の番号)。
 * `event` は原本のその段の `events` の何番目か。`state` は `none` (変わっていない)、`provisional` (暫定)、`final` (確定)、`rolled` (取り消し)。
 *
 * - `parties`: 関係者の名札の枠。出てきた順に左から。`role` は `sender` / `contract` / `token` / `account`、`icon` は `box` に書いた形
 * - `columns`: 段ごとの関係者の列の帯。畳んだ列は `folded` が真
 * - `tanks`: 槽のガラスの枠と、上のトークンの名前の字 (`title`)。`levels`: 段ごとの水の四角 (高さが水位) と量の字 (`text`) と前の量の字 (`was`)
 * - `buses`: トークンごとの管。`valve` はトークンの Contract の弁 (`ETH` は持たない)。`flows`: 段ごとの、管を流れた分 (`move` と `[value]` ごと)
 * - `calls`: 呼び出しの管。`index` は出てきた順、`depth` は深さ、`y` は横に走る高さ、`kind` は `call` / `delegate` / `static`、`width` は太さ、`close` は閉じた段と閉じ方
 * - `returns`: `return` の値の札。`call` は閉じた呼び出しの `index`
 * - `plates`: 段ごとの値の札。前の値の字 (`was`) と消し線 (`strike`) を持つ。`writes`: 書き込む管。`from` は書いた者、`to` は書き替えた札の持ち主
 * - `gauges`: その段だけの計器。`lamps`: 段ごとの行う者の確認の印。`checks`: 段ごとの図の上の確認の印
 * - `events`: 段ごとの図の上の端のイベントの札。`emitted` は出した段、`args` は出した段だけ持つ引数の字
 * - `converters`: 段ごとの換算の札。`calc` は換算した段
 * - `folds`: `[fold]` の呼び出しを畳んだ箱。`steps` は内側の段の数、`parties` は箱に畳んだ関係者の数
 *   (内側の段は畳んだ呼び出しを開いた段の次の段から閉じた段の前の段まで。箱に畳んだ関係者は、内側の段で呼ぶか呼ばれるか行の頭か `move` の両端に名指され、
 *   畳まなかった段には出ない者。畳んだ間は、その関係者の列と名札と槽と値の札と、内側にしか出ないトークンの管を描かない)
 * - `pills`: 段ごとの関係者の名札。`glasses`: 段ごとの槽のガラス。`pipes`: 段ごとのトークンの管
 *
 * 描いた SVG の印
 *
 * `data-pipe-step` を持つ部品はその段の止め絵でだけ見え、`data-pipe-state` は上の `state` を持つ。
 * 関係者は `data-pipe-party` と `data-pipe-role`、呼び出しの管は `data-pipe-call` (`index`) と `data-pipe-pipe` (`open` が開いている間の実線、`closed` が閉じた後の点線)、
 * 水は `data-pipe-level` (持ち主) と `data-pipe-token`、流れた分は `data-pipe-flow`、値の札は `data-pipe-plate` (持ち主) と `data-pipe-name`、
 * 計器は `data-pipe-gauge`、イベントを出した印は `data-pipe-ring`、イベントの札は `data-pipe-event` と中の引数の `data-pipe-args`、
 * 換算の札は `data-pipe-converter`、畳んだ箱は `data-pipe-fold` (`index`、押すと開く)。
 * 色の役は部品か包む部品の `--c:var(--c-<役>)` で読む。呼び出しは青 (`blue`)、確定は緑 (`green`)、イベントは桃色 (`rose`)。
 *
 * 見本の file と配管の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, patched, pointers, smallArchitecture, smallSequence } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { covers, draw, figureClass, figureVars, gap, type Rect, type Rendered, sampleTimes } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** 見本 6 組の名前 (交換の成功、交換の取り消し、2回の交換、内側だけの取り消し、storage とイベントと ETH と delegatecall と staticcall、大きな Trace) */
const SAMPLES = ["swap", "swap-revert", "swap-two-hops", "swap-retry", "vault-proxy", "aggregator"] as const;

/** 配管の図だけが読む行の頭の語 */
const PIPE_WORDS = ["hold", "move", "write", "check", "return", "revert", "emit", "calc"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 流れた分の線の太さ。中心がこれより近い平行な線は重なって見える */
const FLOW_WIDTH = 4;

/** 0 より多い量の水位の下限として、目で見える高さ */
const BAND_LEAST = 4;

type Point = [number, number];
type Writing = Rect & { text: string };
type State = "none" | "provisional" | "final" | "rolled";

interface Party extends Rect {
  id: string;
  name: string;
  role: string;
  icon?: string;
  /** 名札の形 (#3398)。`round` は丸の名札、`cabinet` は Contract の箱、`token` はトークンの箱 */
  shape?: string;
  /** 名札の行 (#3398)。一番上が 0。トークンの箱は持たない */
  row?: number;
}
interface Column extends Rect {
  party: string;
  step: number;
  folded: boolean;
}
interface Tank extends Rect {
  party: string;
  token: string;
  title: Writing;
}
interface Level extends Rect {
  party: string;
  token: string;
  step: number;
  amount: string;
  state: State;
  text: Writing;
  was?: Writing;
  /** 前の量の消し線 (#3398) */
  strike?: Rect;
  /** 槽の下の数に添える暫定か確定の語 (#3398) */
  tag?: Writing;
}
interface Bus {
  token: string;
  y: number;
  x1: number;
  x2: number;
  valve?: { party: string; x: number; y?: number };
  /** 値の管の通し方 (#3398)。`side` は隣の槽の横を結ぶ管、`main` は槽の上に通す本管 */
  mode?: string;
}
/** 同じ関係者から出る呼び出しの本管と、呼ぶ相手ごとの枝 (#3398) */
interface Main {
  from: string;
  points: Point[];
  branches: { to: string; points: Point[]; valve: { x: number; y: number } }[];
}
/** 段ごとの吹き出し (#3398)。`kind` はその段の動きの種類、`text` は大きな字 */
interface Callout extends Rect {
  step: number;
  kind: string;
  tag?: Writing;
  text: Writing;
}
interface Flow {
  step: number;
  token: string;
  from: string;
  to: string;
  amount: string;
  state: State;
  points: Point[];
}
interface Call {
  index: number;
  step: number;
  event: number;
  from: string;
  to: string;
  depth: number;
  y: number;
  kind: string;
  width: number;
  points: Point[];
  close?: { step: number; event: number; how: string };
}
interface Return extends Writing {
  step: number;
  event: number;
  call: number;
}
interface Plate extends Rect {
  party: string;
  name: string;
  step: number;
  value: string;
  state: State;
  text: Writing;
  was?: Writing;
  strike?: Rect;
}
interface Write {
  step: number;
  event: number;
  from: string;
  to: string;
  name: string;
  points: Point[];
}
interface Gauge extends Rect {
  party: string;
  step: number;
  event: number;
  ok: boolean;
  /** 計器を載せる管 (#3398)。`value` は値の管、`call` は呼び出しの管 */
  on?: string;
  /** 値の管の計器の上に書く式。確かめた段の後だけ持つ */
  read?: Rect & { text: string };
}
interface CheckMark extends Rect {
  step: number;
  event: number;
  ok: boolean;
}
interface EventChip extends Rect {
  party: string;
  name: string;
  step: number;
  emitted: number;
  state: State;
  text: Writing;
  args?: Writing;
}
interface Converter extends Rect {
  party: string;
  step: number;
  calc: number;
  in: string;
  out: string;
  rate: string;
  /** その段で計算したか (#3398) */
  active?: boolean;
}
interface Fold extends Rect {
  call: number;
  step: number;
  steps: number;
  parties: number;
  text: Writing;
}

interface PipeLayout {
  kind: string;
  width: number;
  height: number;
  parties: Party[];
  columns: Column[];
  pills: { party: string; step: number }[];
  glasses: { party: string; token: string; step: number }[];
  pipes: (Bus & { step: number })[];
  tanks: Tank[];
  levels: Level[];
  buses: Bus[];
  flows: Flow[];
  calls: Call[];
  returns: Return[];
  plates: Plate[];
  writes: Write[];
  gauges: Gauge[];
  lamps: Gauge[];
  checks: CheckMark[];
  events: EventChip[];
  converters: Converter[];
  folds: Fold[];
  arrangement?: string;
  heads?: { checks?: unknown; events?: unknown };
  mains?: Main[];
  /** `calc` を行う関係者の槽の点線の囲い (#3398) */
  housings?: (Rect & { party: string })[];
  callouts?: Callout[];
}

interface PipeRendered extends Omit<Rendered, "layout"> {
  layout: PipeLayout;
}

interface SourceEvent {
  type: string;
  box?: string;
  from?: string;
  to?: string;
}
interface Hold {
  box: string;
  amount?: string;
  token?: string;
  name?: string;
  value?: string;
}
interface Source {
  kind: string;
  title: string;
  blocks: { box?: { id: string; name: string }[]; hold?: Hold[] };
  steps: { title: string; body: string; events: SourceEvent[] }[];
}

// ---- 原本を組む道具

const box = (id: string, name: string, icon?: string): Json => ({ id, name, ...(icon ? { icon } : {}) });
const bal = (owner: string, amount: string, token: string): Json => ({ box: owner, amount, token });
const val = (owner: string, name: string, value: string): Json => ({ box: owner, name, value });
const call = (from: string, to: string, label: string, marks: { value?: string; call?: string; fold?: boolean } = {}): Json => ({
  type: "call",
  from,
  to,
  label,
  ...marks,
});
const ret = (who: string, value: string): Json => ({ type: "return", box: who, value });
const rev = (who: string, reason: string): Json => ({ type: "revert", box: who, reason });
const move = (who: string, amount: string, from: string, to: string): Json => ({ type: "move", box: who, amount, from, to });
const write = (who: string, name: string, value: string): Json => ({ type: "write", box: who, name, value });
const check = (who: string, left: string, op: string, right: string, fail = false): Json => ({
  type: "check",
  box: who,
  left,
  op,
  right,
  ...(fail ? { fail: true } : {}),
});
const emit = (who: string, name: string, args?: string[]): Json => ({ type: "emit", box: who, name, ...(args ? { args } : {}) });
const calc = (who: string, input: string, output: string): Json => ({ type: "calc", box: who, in: input, out: output });
const stepOf = (title: string, events: Json[]): Json => ({ title, body: `${title}。`, events });
const pipeOf = (title: string, boxes: Json[], holds: Json[], steps: Json[]): Json => ({
  version: 2,
  kind: "pipe",
  title,
  blocks: { box: boxes, ...(holds.length > 0 ? { hold: holds } : {}) },
  steps,
});

/** 全ての語と印を 1 度ずつ使う図 */
function fullPipe(): Json {
  return pipeOf(
    "全部の語の図",
    [box("alice", "Alice"), box("router", "Router", "shield"), box("usdc", "USDC"), box("pool", "Pool"), box("logic", "Logic"), box("oracle", "Oracle")],
    [bal("alice", "1000", "USDC"), bal("alice", "2", "ETH"), bal("router", "0", "ETH"), bal("pool", "0", "USDC"), val("router", "paused", "false")],
    [
      stepOf("頼む", [call("alice", "router", "交換", { value: "1" })]),
      stepOf("借りる", [call("router", "logic", "処理", { call: "delegate" }), write("logic", "paused", "true"), ret("logic", "true")]),
      stepOf("読む", [call("router", "oracle", "価格", { call: "static" }), ret("oracle", "3200")]),
      stepOf("畳む", [call("router", "pool", "交換", { fold: true })]),
      stepOf("内側", [
        calc("pool", "100 USDC", "0.05 WETH"),
        check("pool", "0.05 WETH", ">=", "0.04 WETH"),
        check("pool", "owner", "==", "alice", true),
        call("pool", "usdc", "移す"),
        move("usdc", "100", "alice", "pool"),
        emit("usdc", "Transfer", ["alice", "pool", "100"]),
        ret("usdc", "true"),
      ]),
      stepOf("落ちる", [rev("pool", "失敗")]),
      stepOf("終える", [emit("router", "Done"), ret("router", "済み")]),
    ],
  );
}

/** 関係者の種類を行から導く図。送り手、Contract、トークンの Contract (呼ばれる物と、残高の単位にだけ出る物)、口座、形を替えた Contract を持つ */
function kindsPipe(): Json {
  return pipeOf(
    "関係者の種類",
    [box("alice", "Alice"), box("router", "Router"), box("usdc", "USDC"), box("bob", "Bob"), box("vault", "Vault", "shield"), box("weth", "WETH")],
    [bal("alice", "100", "USDC"), bal("alice", "1", "ETH"), bal("router", "0", "ETH"), bal("bob", "0", "USDC"), bal("bob", "5", "WETH")],
    [
      stepOf("送る", [
        call("alice", "router", "送る", { value: "1" }),
        call("router", "usdc", "移す"),
        move("usdc", "10", "alice", "bob"),
        ret("usdc", "true"),
        call("router", "vault", "記録"),
        ret("vault", "ok"),
        ret("router", "済み"),
      ]),
    ],
  );
}

/** 処理を借りる呼び出しの内側の書き込みと、書き込めない呼び出しを持つ図 */
function callKindsPipe(): Json {
  return pipeOf(
    "呼び出しの種類",
    [box("alice", "Alice"), box("proxy", "Proxy"), box("logic", "Logic"), box("oracle", "Oracle")],
    [val("proxy", "owner", "alice"), val("proxy", "count", "0")],
    [
      stepOf("頼む", [call("alice", "proxy", "数える")]),
      stepOf("借りる", [call("proxy", "logic", "数える", { call: "delegate" })]),
      stepOf("書く", [write("logic", "count", "1")]),
      stepOf("読む", [call("logic", "oracle", "読む", { call: "static" }), ret("oracle", "7")]),
      stepOf("戻る", [ret("logic", "true")]),
      stepOf("持ち主を替える", [write("proxy", "owner", "bob")]),
      stepOf("終える", [ret("proxy", "true")]),
    ],
  );
}

/** 槽の水位を比べる図。量の大きく違う槽、ごく少ない槽、空の槽を持つ */
function movePipe(): Json {
  return pipeOf(
    "水位",
    [box("alice", "Alice"), box("router", "Router"), box("usdc", "USDC"), box("pool", "Pool"), box("bob", "Bob"), box("carol", "Carol")],
    [bal("alice", "1000", "USDC"), bal("pool", "2000", "USDC"), bal("bob", "0.001", "USDC"), bal("carol", "0", "USDC")],
    [
      stepOf("頼む", [call("alice", "router", "交換")]),
      stepOf("移す", [call("router", "usdc", "移す"), move("usdc", "100", "alice", "pool")]),
      stepOf("返す", [ret("usdc", "true")]),
      stepOf("終える", [ret("router", "済み")]),
    ],
  );
}

/** 値の札を書き替える図 */
function platePipe(): Json {
  return pipeOf(
    "値の札",
    [box("alice", "Alice"), box("vault", "Vault")],
    [val("vault", "owner", "alice"), val("vault", "paused", "false")],
    [stepOf("頼む", [call("alice", "vault", "止める")]), stepOf("書く", [write("vault", "paused", "true")]), stepOf("終える", [ret("vault", "ok")])],
  );
}

/** イベントを 2 つ出す図 */
function emitPipe(): Json {
  return pipeOf(
    "イベント",
    [box("alice", "Alice"), box("router", "Router"), box("usdc", "USDC"), box("pool", "Pool")],
    [bal("alice", "100", "USDC"), bal("pool", "0", "USDC")],
    [
      stepOf("頼む", [call("alice", "router", "交換")]),
      stepOf("移す", [call("router", "usdc", "移す"), move("usdc", "10", "alice", "pool"), emit("usdc", "Transfer", ["alice", "pool", "10"]), ret("usdc", "true")]),
      stepOf("知らせる", [emit("router", "Swapped", ["alice", "10"])]),
      stepOf("終える", [ret("router", "ok")]),
    ],
  );
}

/** 内側の呼び出しだけが落ち、呼んだ側が受け止めて続ける図。Pool1 の内側の変更だけが元に戻る */
function innerPipe(): Json {
  return pipeOf(
    "内側だけの取り消し",
    [box("alice", "Alice"), box("router", "Router"), box("usdc", "USDC"), box("pool1", "Pool1"), box("weth", "WETH"), box("pool2", "Pool2")],
    [
      bal("alice", "100", "USDC"),
      bal("alice", "0", "WETH"),
      bal("pool1", "0", "USDC"),
      bal("pool1", "0.01", "WETH"),
      bal("pool2", "0", "USDC"),
      bal("pool2", "10", "WETH"),
      val("router", "tries", "0"),
      val("pool1", "locked", "false"),
    ],
    [
      stepOf("頼む", [call("alice", "router", "交換")]),
      stepOf("数える", [write("router", "tries", "1")]),
      stepOf("受け取る", [call("router", "pool1", "交換"), call("pool1", "usdc", "受け取る"), move("usdc", "100", "alice", "pool1"), emit("usdc", "Transfer", ["alice", "pool1", "100"]), ret("usdc", "true")]),
      stepOf("鍵を掛ける", [write("pool1", "locked", "true")]),
      stepOf("落ちる", [call("pool1", "weth", "送る"), check("weth", "0.01 WETH", ">=", "0.05 WETH"), rev("weth", "残高不足"), rev("pool1", "送金の失敗")]),
      stepOf("やり直す", [
        call("router", "pool2", "交換"),
        call("pool2", "usdc", "受け取る"),
        move("usdc", "100", "alice", "pool2"),
        ret("usdc", "true"),
        call("pool2", "weth", "送る"),
        move("weth", "0.05", "pool2", "alice"),
        ret("weth", "true"),
        ret("pool2", "0.05 WETH"),
      ]),
      stepOf("終える", [ret("router", "0.05 WETH")]),
    ],
  );
}

/** `[fold]` の呼び出しの内側に 3 段と 4 人を持つ図 */
function foldPipe(): Json {
  return pipeOf(
    "畳む",
    [box("alice", "Alice"), box("router", "Router"), box("agg", "Aggregator"), box("usdc", "USDC"), box("pool", "Pool"), box("weth", "WETH"), box("vault", "Vault")],
    [bal("alice", "100", "USDC"), bal("alice", "0", "WETH"), bal("pool", "0", "USDC"), bal("pool", "10", "WETH"), val("vault", "count", "0")],
    [
      stepOf("頼む", [call("alice", "router", "交換")]),
      stepOf("任せる", [call("router", "agg", "まとめて交換", { fold: true })]),
      stepOf("移す", [call("agg", "usdc", "移す"), move("usdc", "100", "alice", "pool"), ret("usdc", "true")]),
      stepOf("替える", [call("agg", "pool", "交換"), call("pool", "weth", "送る"), move("weth", "1", "pool", "alice"), ret("weth", "true"), ret("pool", "1 WETH")]),
      stepOf("記録する", [call("agg", "vault", "記録"), write("vault", "count", "1"), ret("vault", "ok")]),
      stepOf("戻る", [ret("agg", "1 WETH")]),
      stepOf("終える", [ret("router", "1 WETH")]),
    ],
  );
}

// ---- 読む道具

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の原本の JSON。無ければ落とす */
function exampleJson(name: string): Json {
  const text = fileText(name);
  expect(text, `${name} が packages/dragon/examples に無い`).toBeDefined();
  return JSON.parse(text ?? "{}") as Json;
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 描いた配管の図。`width` は描く枠の幅、`open` は開いた `[fold]` の呼び出しの番号。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en", width?: number, open?: number[]): PipeRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { ...(lang ? { lang } : {}), ...(width === undefined ? {} : { width }), ...(open ? { open } : {}) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "配管の図を描けない").toBe("");
  const layout = (rendered as unknown as PipeRendered | undefined)?.layout;
  expect(layout?.kind, "描いた図の置き場所が配管の図 (layout.kind が pipe) でない").toBe("pipe");
  expect(layout?.parties, "並べた配管の図に関係者 (layout.parties) が無い").toBeDefined();
  return rendered as unknown as PipeRendered;
}

const partyOf = (layout: PipeLayout, id: string): Party => {
  const found = layout.parties.find((p) => p.id === id);
  expect(found, `関係者 ${id} が並べた図に無い`).toBeDefined();
  return found as Party;
};

const columnOf = (layout: PipeLayout, party: string, step: number): Column => {
  const found = layout.columns.find((c) => c.party === party && c.step === step);
  expect(found, `段 ${step + 1} の ${party} の列が並べた図に無い`).toBeDefined();
  return found as Column;
};

const levelOf = (layout: PipeLayout, party: string, token: string, step: number): Level => {
  const found = layout.levels.find((l) => l.party === party && l.token === token && l.step === step);
  expect(found, `段 ${step + 1} の ${party} の ${token} の水位が並べた図に無い`).toBeDefined();
  return found as Level;
};

const tankOf = (layout: PipeLayout, party: string, token: string): Tank => {
  const found = layout.tanks.find((t) => t.party === party && t.token === token);
  expect(found, `${party} の ${token} の槽が並べた図に無い`).toBeDefined();
  return found as Tank;
};

const plateOf = (layout: PipeLayout, party: string, name: string, step: number): Plate => {
  const found = layout.plates.find((p) => p.party === party && p.name === name && p.step === step);
  expect(found, `段 ${step + 1} の ${party} の ${name} の値の札が並べた図に無い`).toBeDefined();
  return found as Plate;
};

const callAt = (layout: PipeLayout, index: number): Call => {
  const found = layout.calls.find((c) => c.index === index);
  expect(found, `${index + 1} 番目の呼び出しの管が並べた図に無い`).toBeDefined();
  return found as Call;
};

const center = (r: Rect): number => r.x + r.w / 2;
const within = (x: number, r: Rect): boolean => x >= r.x - 1e-6 && x <= r.x + r.w + 1e-6;
const apart = (a: Rect, b: Rect, least = 10): boolean => gap(a, b) >= least - 1e-6;
const lastStep = (d: Json): number => (d as unknown as Source).steps.length - 1;

/** 段 `step` の止め絵の時刻 */
const stillOf = (rendered: PipeRendered, step: number): number => rendered.timeline.stills[step] ?? Number.NaN;

/** 部品の見える濃さ。動きの濃さに、部品と包む部品の `opacity` の属性も掛ける */
function seenOf(motion: Motion, el: Element, t: number): number {
  let o = motion.opacity(el, t);
  for (let e: Element | null = el; e; e = e.parentElement) {
    const attr = e.getAttribute("opacity");
    if (attr !== null) o *= Number(attr);
  }
  return o;
}

/** 描いた図の部品。無ければ落とす */
function partsOf(motion: Motion, selector: string): Element[] {
  const found = [...motion.doc.querySelectorAll(selector)];
  expect(found.length, `描いた図に ${selector} の部品が無い`).toBeGreaterThan(0);
  return found;
}

/** `selector` に合う部品のうち、時刻 `t` に最も濃く見える物の濃さ。無ければ 0 */
const seen = (motion: Motion, selector: string, t: number): number =>
  Math.max(0, ...[...motion.doc.querySelectorAll(selector)].map((el) => seenOf(motion, el, t)));

/** `svg` の `<style>` の規則のうち、部品の class に当たる規則の中身 */
const classRules = (svg: string, el: Element): string[] =>
  [...el.classList].flatMap((cls) => [...svg.matchAll(new RegExp(`\\.${cls.replace(/[^\w-]/gu, "\\$&")}\\{([^}]*)\\}`, "gu"))].map((m) => m[1] ?? ""));

/** 部品の色の役 (`blue` など)。部品から包む部品へ、stroke と fill の属性、style の `--c`、class の規則の順に読む */
function roleOf(svg: string, el: Element): string | undefined {
  for (let e: Element | null = el; e; e = e.parentElement) {
    for (const value of [e.getAttribute("stroke"), e.getAttribute("fill")]) {
      const m = /var\(--c-([a-z]+)\)/u.exec(value ?? "");
      if (m?.[1]) return m[1];
    }
    const own = /--c:\s*var\(--c-([a-z]+)\)/u.exec(e.getAttribute("style") ?? "");
    if (own?.[1]) return own[1];
    for (const rule of classRules(svg, e)) {
      const m = /(?:stroke|fill):\s*var\(--c-([a-z]+)\)/u.exec(rule);
      if (m?.[1]) return m[1];
    }
  }
  return undefined;
}

/** 部品が点線か。属性、style、class の規則のどれかに `stroke-dasharray` を持つ */
const dashed = (svg: string, el: Element): boolean =>
  el.getAttribute("stroke-dasharray") !== null ||
  /stroke-dasharray:\s*[\d.]/u.test(el.getAttribute("style") ?? "") ||
  classRules(svg, el).some((rule) => /stroke-dasharray:\s*[\d.]/u.test(rule));

/** 部品の線の太さ。部品から包む部品へ、属性、style、class の規則の順に読む */
function strokeWidthOf(svg: string, el: Element): number | undefined {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const attr = e.getAttribute("stroke-width");
    if (attr !== null) return Number(attr);
    const style = /stroke-width:\s*([\d.]+)/u.exec(e.getAttribute("style") ?? "")?.[1];
    if (style !== undefined) return Number(style);
    for (const rule of classRules(svg, e)) {
      const m = /stroke-width:\s*([\d.]+)/u.exec(rule)?.[1];
      if (m !== undefined) return Number(m);
    }
  }
  return undefined;
}

/** 部品か中の部品が斜線の模様 (`url(#…)`) で塗るか引くか */
const hatched = (svg: string, el: Element): boolean =>
  [el, ...el.querySelectorAll("*")].some(
    (e) =>
      /url\(#/u.test(`${e.getAttribute("fill") ?? ""} ${e.getAttribute("stroke") ?? ""} ${e.getAttribute("style") ?? ""}`) ||
      classRules(svg, e).some((rule) => /(?:fill|stroke):\s*url\(#/u.test(rule)),
  );

/** 原本の始めの残高と値。鍵は `<持ち主>|<トークンか名前>` */
function initialsOf(d: Source): Map<string, string> {
  return new Map((d.blocks.hold ?? []).map((h) => [`${h.box}|${h.token ?? h.name ?? ""}`, h.amount ?? h.value ?? ""]));
}

/** 原本の関係者と始めの値と段と段ごとの出来事の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  parties: (d.blocks.box ?? []).length,
  holds: (d.blocks.hold ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

const SAMPLE_FILES = SAMPLES.flatMap((name) => [`${name}.dragon`, `${name}.en.dragon`]);
const SAMPLE_JSON = SAMPLES.flatMap((name) => [`${name}.json`, `${name}.en.json`]);
const langOf = (file: string): "ja" | "en" => (file.includes(".en.") ? "en" : "ja");

describe("配管の図の原本の JSON (#3389)", () => {
  it("schema-accepts-pipe-diagram", () => {
    const validate = api("validateDiagram");
    const checked = validate(fullPipe());
    expect(checked.ok, `全部の語の配管の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    for (const file of SAMPLE_JSON) {
      const sample = validate(exampleJson(file));
      expect(sample.ok, `${file} が検査で落ちる: ${JSON.stringify(sample.ok ? [] : sample.errors)}`).toBe(true);
    }
  });

  it("schema-rejects-misplaced-pipe-events", () => {
    const validate = api("validateDiagram");
    const read = api("readDiagram");
    const toV2 = (d: Json): Json => {
      const r = read(d);
      expect(r.ok, "小さな図を版2の形で読めない").toBe(true);
      return r.ok ? r.diagram : {};
    };
    const sequence = toV2(smallSequence());
    const architecture = toV2(smallArchitecture());
    const events: [string, Json][] = [
      ["call", call("a", "b", "呼ぶ")],
      ["move", move("a", "1", "a", "b")],
      ["write", write("a", "名前", "1")],
      ["check", check("a", "1", "==", "1")],
      ["return", ret("a", "済み")],
      ["revert", rev("a", "失敗")],
      ["emit", emit("a", "Done")],
      ["calc", calc("a", "1 USDC", "2 WETH")],
    ];
    const edge: Json = { type: "edge", from: "alice", to: "router", carry: { kind: "envelope" } };
    const cases: [string, Json, string][] = [
      ...events.map(([type, event]): [string, Json, string] => [`時系列図に ${type} の出来事`, patched(sequence, ["steps", 0, "events"], [event]), "/steps/0/events/0/type"]),
      ...events.map(([type, event]): [string, Json, string] => [`構成図に ${type} の出来事`, patched(architecture, ["steps", 0, "events"], [event]), "/steps/0/events/0/type"]),
      ["時系列図に hold の欄", patched(sequence, ["blocks", "hold"], [bal("a", "1", "USDC")]), "/blocks/hold"],
      ["構成図に hold の欄", patched(architecture, ["blocks", "hold"], [val("a", "名前", "1")]), "/blocks/hold"],
      ["配管の図に枝の欄", patched(fullPipe(), ["blocks", "branch"], [{ id: "main" }]), "/blocks/branch"],
      ["配管の図にチップの欄", patched(fullPipe(), ["blocks", "item"], [{ id: "a" }]), "/blocks/item"],
      ["配管の図に区画の欄", patched(fullPipe(), ["blocks", "group"], [{ id: "g", name: "区画" }]), "/blocks/group"],
      ["配管の図に線の出来事", patched(fullPipe(), ["steps", 0, "events"], [edge]), "/steps/0/events/0/type"],
      ["配管の図に処理の出来事", patched(fullPipe(), ["steps", 0, "events"], [{ type: "action", box: "alice", label: "処理" }]), "/steps/0/events/0/type"],
      ["配管の図に列の並びの出来事", patched(fullPipe(), ["steps", 0, "events"], [{ type: "line", box: "alice", items: ["a"] }]), "/steps/0/events/0/type"],
    ];
    for (const [name, input, pointer] of cases) {
      expect(pointers(validate(input)), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      expect(
        (en.ok ? [] : en.errors.map((e) => e.message)).filter((m) => KANA.test(m)),
        `${name} の英語の誤りの文に仮名か漢字がある`,
      ).toEqual([]);
    }
  });
});

describe("配管の図の記法 (#3389)", () => {
  it("notation-compiles-pipe-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const file of SAMPLE_FILES) {
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: langOf(file) });
      expect(parsed.ok, `${file} が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const json = file.replace(/\.dragon$/u, ".json");
      expect(parsed.ok ? parsed.diagram : undefined, `${file} から作った JSON が ${json} と違う`).toEqual(exampleJson(json));
    }
    // 1 行に並べた残高は 1 つずつに分け、名前に [ を持つ値は囲みを外して持つ。印は呼び出しと確認の欄になる
    const small = parse(
      [
        "pipe 印",
        "box alice",
        "box router",
        "box usdc as USDC",
        "box pool",
        "hold alice: 1000 USDC, 2 ETH",
        "hold router: 0 ETH",
        'hold usdc: "allowance[alice][router]" 100',
        "step 頼む",
        "  say 頼む。",
        "  alice -> router: 預ける [value: 1 ETH]",
        "  router -> pool: 読む [call: static]",
        "  return pool: 7",
        "  router -> pool: 借りる [call: delegate]",
        "  return pool: ok",
        "  router -> pool: まとめる [fold]",
        "  check pool: owner == alice [fail]",
        "  emit pool: Done()",
        "  return pool: ok",
        "  return router: 済み",
      ].join("\n"),
    );
    expect(small.ok, `印を持つ配管の図が読めない: ${small.ok ? "" : JSON.stringify(small.errors)}`).toBe(true);
    const diagram = (small.ok ? small.diagram : {}) as unknown as Source & { steps: { events: Json[] }[] };
    expect(diagram.blocks?.hold, "hold の行が宣言する始めの値").toEqual([
      bal("alice", "1000", "USDC"),
      bal("alice", "2", "ETH"),
      bal("router", "0", "ETH"),
      val("usdc", "allowance[alice][router]", "100"),
    ]);
    expect(diagram.steps?.[0]?.events, "段の中の呼び出しと印と行").toEqual([
      call("alice", "router", "預ける", { value: "1" }),
      call("router", "pool", "読む", { call: "static" }),
      ret("pool", "7"),
      call("router", "pool", "借りる", { call: "delegate" }),
      ret("pool", "ok"),
      call("router", "pool", "まとめる", { fold: true }),
      check("pool", "owner", "==", "alice", true),
      emit("pool", "Done"),
      ret("pool", "ok"),
      ret("router", "済み"),
    ]);
  });

  it("notation-rejects-misused-pipe-lines", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札は英字にする
    const head = [
      "pipe small",
      "box alice",
      "box router",
      "box usdc as USDC",
      "box pool",
      "hold alice: 100 USDC, 2 ETH",
      "hold router: 5 ETH",
      "hold pool: 50 USDC, 0 ETH",
      "hold router: paused false",
    ];
    const step = ["step go", "  say go."];
    const open = [...step, "  alice -> router: swap"];
    const close = ["  return router: done"];
    const staticOpen = [...step, "  alice -> router: read [call: static]"];
    // 誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)
    const at = (line: string, token: string): number => line.indexOf(token);
    const body = head.length + open.length;
    const inner = (line: string): [string[], number, number] => [[...head, ...open, line, ...close], body, at(line, line.trim())];
    const cases: [string, string[], number, number][] = [
      ["宣言していない関係者を書いた行", [...head, ...open, "  check nobody: 1 == 1", ...close], body, at("  check nobody: 1 == 1", "nobody")],
      ["box の行が無い図", ["pipe small", ...step], 0, 0],
      ["最初の step より前の move", [...head, "move usdc: 10 alice -> pool", ...open, ...close], head.length, 0],
      ["最初の step より前の write", [...head, "write router: paused true", ...open, ...close], head.length, 0],
      ["最初の step より前の emit", [...head, "emit usdc: Transfer(alice, pool, 10)", ...open, ...close], head.length, 0],
      ["開いていない呼び出しの return", [...head, ...open, "  return pool: no", ...close], body, at("  return pool: no", "pool")],
      ["開いていない呼び出しの revert", [...head, ...open, "  revert pool: no", ...close], body, at("  revert pool: no", "pool")],
      ["最後まで閉じない呼び出し", [...head, ...open], body - 1, 2],
      ["持っている量より多い move", [...head, ...open, "  move usdc: 101 alice -> pool", ...close], body, at("  move usdc: 101 alice -> pool", "101")],
      ["持っている量より多い [value]", [...head, ...step, "  alice -> router: pay [value: 3 ETH]", ...close], body - 1, at("  alice -> router: pay [value: 3 ETH]", "3 ETH")],
      ["トークンの Contract でない者の move", [...head, ...open, "  move router: 10 alice -> pool", ...close], body, at("  move router: 10 alice -> pool", "router")],
      ["ETH の move", [...head, ...open, "  move ETH: 1 alice -> router", ...close], body, at("  move ETH: 1 alice -> router", "ETH")],
      ["両側が数の check の [fail]", [...head, ...open, "  check router: 1 >= 2 [fail]", ...close], body, at("  check router: 1 >= 2 [fail]", "fail")],
      ["単位の違う数を比べる check", [...head, ...open, "  check router: 1 USDC >= 2 ETH", ...close], body, at("  check router: 1 USDC >= 2 ETH", "2 ETH")],
      ["両側が数でない calc", [...head, ...open, "  calc router: lots -> 2 ETH", ...close], body, at("  calc router: lots -> 2 ETH", "lots")],
      ["呼び出しでない行の [fold]", [...head, ...open, "  move usdc: 10 alice -> pool [fold]", ...close], body, at("  move usdc: 10 alice -> pool [fold]", "fold")],
      ["[call: static] の内側の move", [...head, ...staticOpen, "  move usdc: 10 alice -> pool", ...close], body, 2],
      ["[call: static] の内側の write", [...head, ...staticOpen, "  write router: paused true", ...close], body, 2],
      ["[call: static] の内側の emit", [...head, ...staticOpen, "  emit router: Read()", ...close], body, 2],
      [
        "[call: static] の内側の [value]",
        [...head, ...staticOpen, "  router -> pool: pay [value: 1 ETH]", "  return pool: ok", ...close],
        body,
        at("  router -> pool: pay [value: 1 ETH]", "value"),
      ],
      [
        "[call: delegate] に付けた [value]",
        [...head, ...open, "  router -> pool: run [call: delegate, value: 1 ETH]", "  return pool: ok", ...close],
        body,
        at("  router -> pool: run [call: delegate, value: 1 ETH]", "value"),
      ],
      ["[call: create]", [...head, ...step, "  alice -> router: make [call: create]", ...close], body - 1, at("  alice -> router: make [call: create]", "create")],
      ["group の行", ["pipe small", "group g", "  box alice", "end", ...step], 1, 0],
      ["item の行", [...head, "item a", ...open, ...close], head.length, 0],
      ["act の行", ...inner("  act router: work")],
      ["line の行", ...inner("  line router: a")],
    ];
    for (const [name, lines, row, column] of cases) {
      const want = { line: row + 1, column: column + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-limits-pipe-lines-to-pipe", () => {
    const parse = api("parseNotation");
    const heads: [string, string[]][] = [
      ["時系列図", ["sequence 配管の行", "box a", "step 送る", "  say 送る。"]],
      ["構成図", ["architecture 配管の行", "box a", "step 送る", "  say 送る。"]],
      ["状態遷移図", ["state 配管の行", "box a", "step 送る", "  say 送る。"]],
      ["枝分かれの図", ["git 配管の行", "branch main", "step 積む", "  say 積む。"]],
      ["時間軸の図", ["time 配管の行", "scale slot 12s 4", "row a", "step 進む", "  say 進む。"]],
      ["木の図", ["tree 配管の行", "step 葉", "  say 葉。", "  leaf x1"]],
      ["列の図", ["lineup 配管の行", "box a", "item x", "step 並べる", "  say 並べる。"]],
      ["試す図", ["try 配管の行", "queue q [order: f]", "ask n, f [into: q]", "item x [f: 1]", "step 送る", "  say 送る。"]],
    ];
    const lines = [
      "hold a: 1 USDC",
      "move usdc: 100 alice -> pool",
      "write a: owner bob",
      "check a: 1 == 1",
      "return a: done",
      "revert a: failed",
      "emit a: Done()",
      "calc a: 1 USDC -> 2 WETH",
    ];
    for (const [name, head] of heads) {
      for (const line of lines) {
        for (const lang of ["ja", "en"] as const) {
          const parsed = parse([...head, `  ${line}`].join("\n"), { lang });
          const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
          expect(first?.line, `${name} の ${line} が ${head.length + 1} 行目の誤りにならない (${lang})`).toBe(head.length + 1);
          // 配管の図の頭の語を名指して、その図でしか書けないことを示す
          expect(first?.message ?? "", `${name} の ${line} の誤りの文が配管の図 (pipe) を名指さない (${lang})`).toContain("pipe");
          if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の ${line} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
        }
      }
    }
  });

  it("notation-keeps-pipe-words-plain-outside-pipe", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [
        `${kind} 配管の語の名札`,
        ...PIPE_WORDS.map((word) => `box ${word}`),
        "box db",
        "step 送る",
        "  say 送る。",
        ...PIPE_WORDS.map((word) => `  ${word} -> db: 送る`),
      ].join("\n");
      const parsed = parse(text);
      expect(parsed.ok, `${kind} で配管の図の語を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as {
        blocks?: { box?: { id: string }[] };
        steps?: { events: { type: string; from?: string; to?: string }[] }[];
      };
      expect(
        diagram.blocks?.box?.map((b) => b.id),
        `${kind} の箱の名札`,
      ).toEqual([...PIPE_WORDS, "db"]);
      expect(
        diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })),
        `${kind} の配管の図の語の箱から出る線`,
      ).toEqual(PIPE_WORDS.map((word) => ({ type: "edge", from: word, to: "db" })));
    }
  });

  it("pipe-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const file of SAMPLE_FILES) {
      const text = fileText(file);
      expect(text, `${file} が無い`).toBeDefined();
      const lang = langOf(file);
      const first = parse(text ?? "", { lang });
      expect(first.ok, `${file} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed, { lang });
      expect(second.ok, `${file} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
      expect(second.ok ? second.diagram : undefined, `${file} を往復した JSON が最初と違う`).toEqual(first.diagram);
    }
    // JSON から書いた全部の語の図も、記法を経て同じ JSON に戻る
    const source = fullPipe();
    const printed = print(source);
    const again = parse(printed);
    expect(again.ok ? again.diagram : again.errors, `全部の語の図を往復した JSON が最初と違う\n${printed}`).toEqual(source);
  });
});

describe("配管の図の関係者と並べ方 (#3389)", () => {
  it("pipe-derives-party-kinds-from-lines", () => {
    const rendered = render(kindsPipe());
    const { layout } = rendered;
    expect(
      Object.fromEntries(layout.parties.map((p) => [p.id, p.role])),
      "行から導いた関係者の種類",
    ).toEqual({ alice: "sender", router: "contract", usdc: "token", bob: "account", vault: "contract", weth: "token" });
    expect(
      layout.parties.map((p) => p.id),
      "ETH を関係者として並べている",
    ).not.toContain("ETH");
    // トークンの Contract はそのトークンの管の弁になり、ETH の管は弁を持たない
    for (const [token, party] of [
      ["USDC", "usdc"],
      ["WETH", "weth"],
    ] as const) {
      const bus = layout.buses.find((b) => b.token === token);
      expect(bus?.valve?.party, `${token} の管の弁`).toBe(party);
      expect(Math.abs((bus?.valve?.x ?? Number.NaN) - center(partyOf(layout, party))), `${token} の弁が ${party} の列に無い`).toBeLessThan(1);
    }
    const eth = layout.buses.find((b) => b.token === "ETH");
    expect(eth, "ETH の管が無い").toBeDefined();
    expect(eth?.valve, "ETH の管が弁を持つ").toBeUndefined();
    // icon を書いた関係者は、その形で描く
    expect(partyOf(layout, "vault").icon, "vault の形").toBe("shield");
    const shield = (dragon as unknown as { ICONS?: Record<string, string> }).ICONS?.shield;
    expect(shield, "形 shield の線が @cardenelabs/dragon の ICONS に無い").toBeDefined();
    const motion = motionFrom(rendered as unknown as Rendered);
    const vault = partsOf(motion, '[data-pipe-party="vault"]')[0] as Element;
    expect(
      [...vault.querySelectorAll("path")].some((p) => p.getAttribute("d") === shield),
      "vault の名札が shield の形を描かない",
    ).toBe(true);
    for (const party of layout.parties)
      expect(partsOf(motion, `[data-pipe-party="${party.id}"]`)[0]?.getAttribute("data-pipe-role"), `描いた ${party.id} の種類`).toBe(party.role);
  });

  it("pipe-call-kinds-draw-their-pipes", () => {
    const rendered = render(callKindsPipe());
    const { layout, svg } = rendered;
    expect(
      layout.calls.map((c) => [c.from, c.to, c.kind]),
      "呼び出しの種類",
    ).toEqual([
      ["alice", "proxy", "call"],
      ["proxy", "logic", "delegate"],
      ["logic", "oracle", "static"],
    ]);
    // 処理を借りる呼び出しの内側の write は、呼んだ側の値の札を書き替え、書き込む管を呼んだ側の札へ向ける
    const count = plateOf(layout, "proxy", "count", 2);
    expect(count.value, "段 3 の Proxy の count").toBe("1");
    expect(count.state, "段 3 の Proxy の count の印").toBe("provisional");
    expect(
      layout.plates.filter((p) => p.party === "logic"),
      "Logic に値の札を描く",
    ).toEqual([]);
    const borrowed = layout.writes.find((w) => w.step === 2);
    expect(borrowed && { from: borrowed.from, to: borrowed.to, name: borrowed.name }, "段 3 の書き込む管").toEqual({ from: "logic", to: "proxy", name: "count" });
    const [ex, ey] = borrowed?.points[borrowed.points.length - 1] ?? [Number.NaN, Number.NaN];
    expect(within(ex, count) && ey >= count.y - 1 && ey <= count.y + count.h + 1, "段 3 の書き込む管が Proxy の count の札へ向かない").toBe(true);
    const own = layout.writes.find((w) => w.step === 5);
    expect(own && { from: own.from, to: own.to, name: own.name }, "段 6 の書き込む管").toEqual({ from: "proxy", to: "proxy", name: "owner" });
    // 書き込めない呼び出しの管は、普通の呼び出しの管の半分の太さ
    const normal = callAt(layout, 0);
    const readOnly = callAt(layout, 2);
    expect(readOnly.width / normal.width, "書き込めない呼び出しの管の太さ").toBeCloseTo(0.5, 2);
    const motion = motionFrom(rendered as unknown as Rendered);
    const widthOf = (index: number): number =>
      Math.max(...partsOf(motion, `[data-pipe-call="${index}"][data-pipe-pipe="open"]`).map((el) => strokeWidthOf(svg, el) ?? Number.NaN));
    expect(widthOf(2) / widthOf(0), "描いた書き込めない呼び出しの管の太さ").toBeCloseTo(0.5, 2);
  });

  it("pipe-move-shifts-tank-levels", () => {
    const rendered = render(movePipe());
    const { layout, svg } = rendered;
    // 水位はトークンごとに量に比例し、0 より多い量は最小の帯より低くならない。0 の槽は空
    for (let s = 0; s <= 3; s++) {
      const alice = levelOf(layout, "alice", "USDC", s);
      const pool = levelOf(layout, "pool", "USDC", s);
      expect(alice.h / pool.h / (Number(alice.amount) / Number(pool.amount)), `段 ${s + 1} の Alice と Pool の水位が量に比例しない`).toBeCloseTo(1, 1);
      const dust = levelOf(layout, "bob", "USDC", s);
      expect(dust.h, `段 ${s + 1} のごく少ない Bob の水位が最小の帯より低い`).toBeGreaterThanOrEqual(BAND_LEAST);
      expect(dust.h, `段 ${s + 1} のごく少ない Bob の水位が Alice より高い`).toBeLessThan(alice.h);
      expect(levelOf(layout, "carol", "USDC", s).h, `段 ${s + 1} の空の Carol の槽に水がある`).toBe(0);
      for (const level of [alice, pool, dust]) {
        const tank = tankOf(layout, level.party, level.token);
        expect(level.y >= tank.y && level.y + level.h <= tank.y + tank.h, `段 ${s + 1} の ${level.party} の水が槽からはみ出す`).toBe(true);
      }
    }
    // move の段で、送り手の槽が下がって受け手の槽が上がる
    const before = { alice: levelOf(layout, "alice", "USDC", 0), pool: levelOf(layout, "pool", "USDC", 0) };
    const after = { alice: levelOf(layout, "alice", "USDC", 1), pool: levelOf(layout, "pool", "USDC", 1) };
    expect(after.alice.h, "move の段で Alice の槽が下がらない").toBeLessThan(before.alice.h);
    expect(after.pool.h, "move の段で Pool の槽が上がらない").toBeGreaterThan(before.pool.h);
    expect([after.alice.amount, after.alice.was?.text, after.pool.amount, after.pool.was?.text], "move の段の量と前の量").toEqual(["900", "1,000", "2100", "2,000"]);
    expect([after.alice.state, after.pool.state, levelOf(layout, "bob", "USDC", 1).state], "move の段の槽の印").toEqual(["provisional", "provisional", "none"]);
    // 管を流れた分は、確定するまで斜線の暫定で描く
    expect(
      layout.flows.map((f) => [f.step, f.token, f.from, f.to, f.amount, f.state]),
      "管を流れた分",
    ).toEqual([
      [1, "USDC", "alice", "pool", "100", "provisional"],
      [2, "USDC", "alice", "pool", "100", "provisional"],
      [3, "USDC", "alice", "pool", "100", "final"],
    ]);
    // 同じ段に描く流れた分は、横の線どうしも縦の線どうしも重ならない (Aggregator の箱を開いた図は、同じトークンの流れを 1 段に 3 本より多く描く)
    const crowded = render(exampleJson("aggregator.json"), "ja", undefined, [2]).layout;
    const segmentsOf = (f: Flow): { flat: boolean; at: number; lo: number; hi: number }[] =>
      f.points.slice(1).map((b, i) => {
        const a = f.points[i] as Point;
        const flat = Math.abs(a[1] - b[1]) < 0.5;
        return flat ? { flat, at: a[1], lo: Math.min(a[0], b[0]), hi: Math.max(a[0], b[0]) } : { flat, at: a[0], lo: Math.min(a[1], b[1]), hi: Math.max(a[1], b[1]) };
      });
    const busiest = Math.max(
      ...crowded.flows.map((f) => crowded.flows.filter((g) => g.step === f.step && g.token === f.token).length),
    );
    expect(busiest, "Aggregator の箱を開いた図で、1 段に同じトークンの流れを描く数").toBeGreaterThan(3);
    for (const [k, f] of crowded.flows.entries())
      for (const g of crowded.flows.slice(k + 1).filter((x) => x.step === f.step))
        for (const a of segmentsOf(f))
          for (const b of segmentsOf(g)) {
            const touches = a.flat === b.flat && Math.abs(a.at - b.at) < FLOW_WIDTH && a.lo < b.hi && b.lo < a.hi;
            expect(touches, `段 ${f.step + 1} の ${f.from}→${f.to} と ${g.from}→${g.to} の流れの線が重なる`).toBe(false);
          }
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const s of [1, 2]) {
      const sel = `[data-pipe-flow][data-pipe-step="${s}"]`;
      expect(seen(motion, sel, stillOf(rendered, s)), `段 ${s + 1} に流れた分が見えない`).toBeGreaterThan(0.9);
    }
    // 管を流れた分は、流れた段に斜線の液の塊が管を通り抜け、確定するまでの斜線は受け手の槽が持つ。管には斜線を残さない (試作の4配管と同じ、#3398)
    expect(
      partsOf(motion, '[data-pipe-slug][data-pipe-step="1"]').some((el) => hatched(svg, el)),
      "段 2 で管を通り抜ける液の塊が斜線でない",
    ).toBe(true);
    expect(
      partsOf(motion, '[data-pipe-flow][data-pipe-step="2"]').some((el) => hatched(svg, el)),
      "段 3 の管に流れた分の斜線が残る",
    ).toBe(false);
    const poolAt = (s: number): string => `[data-pipe-level="pool"][data-pipe-token="USDC"][data-pipe-step="${s}"]`;
    expect(
      partsOf(motion, poolAt(2)).some((el) => hatched(svg, el)),
      "確定する前の段 3 の Pool の上がった分が斜線でない",
    ).toBe(true);
    expect(partsOf(motion, poolAt(1))[0]?.getAttribute("data-pipe-state"), "move の段の Pool の水の印").toBe("provisional");
    expect(
      partsOf(motion, poolAt(1)).some((el) => hatched(svg, el)),
      "move の段の Pool の上がった分が斜線でない",
    ).toBe(true);
    expect(seen(motion, poolAt(1), stillOf(rendered, 1)), "move の段の Pool の水が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, poolAt(1), stillOf(rendered, 3)), "段 2 の Pool の水が段 4 に見える").toBeLessThan(0.1);
    expect(
      partsOf(motion, poolAt(3)).some((el) => hatched(svg, el)),
      "確定した Pool の水が斜線のまま",
    ).toBe(false);
  });

  it("pipe-write-updates-value-plate", () => {
    const rendered = render(platePipe());
    const { layout } = rendered;
    const vault = partyOf(layout, "vault");
    // 残高でない値は、持つ Contract の列の下に値の札として描く
    for (const name of ["owner", "paused"]) {
      const plate = plateOf(layout, "vault", name, 0);
      expect(within(plate.x, columnOf(layout, "vault", 0)) && within(plate.x + plate.w, columnOf(layout, "vault", 0)), `${name} の札が Vault の列からはみ出す`).toBe(true);
      expect(plate.y, `${name} の札が Vault の名札の下に 10px 離れて無い`).toBeGreaterThanOrEqual(vault.y + vault.h + 10);
      expect([plate.state, plate.was], `段 1 の ${name} の札の印と前の値`).toEqual(["none", undefined]);
    }
    expect(apart(plateOf(layout, "vault", "owner", 0), plateOf(layout, "vault", "paused", 0)), "Vault の 2 枚の札が 10px 離れない").toBe(true);
    expect([plateOf(layout, "vault", "owner", 0).value, plateOf(layout, "vault", "paused", 0).value], "段 1 の札の値").toEqual(["alice", "false"]);
    // write の段で札の値が替わり、前の値を消し線で残し、確定するまで暫定の印で描く
    const written = plateOf(layout, "vault", "paused", 1);
    expect([written.value, written.text.text, written.was?.text, written.state], "write の段の札").toEqual(["true", "true", "false", "provisional"]);
    const was = written.was ?? { x: Number.NaN, y: Number.NaN, w: 0, h: 0 };
    const strike = written.strike;
    expect(strike, "write の段の前の値に消し線が無い").toBeDefined();
    expect(
      strike !== undefined && strike.x <= was.x + 1 && strike.x + strike.w >= was.x + was.w - 1 && strike.y >= was.y && strike.y <= was.y + was.h,
      "消し線が前の値の字を横切らない",
    ).toBe(true);
    expect(plateOf(layout, "vault", "owner", 1).state, "書いていない札が暫定になる").toBe("none");
    expect([plateOf(layout, "vault", "paused", 2).value, plateOf(layout, "vault", "paused", 2).state], "一番外が戻った段の札").toEqual(["true", "final"]);
    const motion = motionFrom(rendered as unknown as Rendered);
    const sel = '[data-pipe-plate="vault"][data-pipe-name="paused"][data-pipe-step="1"]';
    const drawn = partsOf(motion, sel)[0] as Element;
    expect(drawn.getAttribute("data-pipe-state"), "描いた write の段の札の印").toBe("provisional");
    expect(seen(motion, sel, stillOf(rendered, 1)), "write の段の札が見えない").toBeGreaterThan(0.9);
    expect(
      [...drawn.querySelectorAll("text")].map((t) => t.textContent),
      "描いた write の段の札の字",
    ).toEqual(expect.arrayContaining(["paused", "true", "false"]));
  });

  it("pipe-emit-stacks-events", () => {
    const rendered = render(emitPipe());
    const { layout, svg } = rendered;
    // 図の上の端のイベントの列に <出した者の名前>.<イベントの名前> の札を積み、その段だけ引数も出す
    const chips = (s: number): EventChip[] => layout.events.filter((e) => e.step === s);
    expect(chips(0), "イベントを出す前にイベントの札がある").toEqual([]);
    expect(
      chips(1).map((e) => [e.text.text, e.args?.text]),
      "段 2 のイベントの札",
    ).toEqual([["USDC.Transfer", "alice, pool, 10"]]);
    expect(
      chips(2).map((e) => [e.text.text, e.args?.text]),
      "段 3 のイベントの札",
    ).toEqual([
      ["USDC.Transfer", undefined],
      ["Router.Swapped", "alice, 10"],
    ]);
    expect(
      chips(3).map((e) => [e.text.text, e.args?.text]),
      "段 4 のイベントの札",
    ).toEqual([
      ["USDC.Transfer", undefined],
      ["Router.Swapped", undefined],
    ]);
    const [a, b] = chips(2) as [EventChip, EventChip];
    expect(gap(a, b), "2 枚のイベントの札が重なる").toBeGreaterThan(0);
    const laneTop = Math.min(...layout.calls.map((c) => c.y));
    for (const chip of layout.events) expect(chip.y + chip.h, `段 ${chip.step + 1} のイベントの札が図の上の端に無い`).toBeLessThan(laneTop);
    // emit の段で、出した Contract にイベントの色の印を出す
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const [party, s] of [
      ["usdc", 1],
      ["router", 2],
    ] as const) {
      const sel = `[data-pipe-ring="${party}"][data-pipe-step="${s}"]`;
      expect(seen(motion, sel, stillOf(rendered, s)), `段 ${s + 1} に ${party} のイベントの印が見えない`).toBeGreaterThan(0.9);
      expect(seen(motion, sel, stillOf(rendered, s + 1)), `段 ${s + 1} の ${party} のイベントの印が次の段に残る`).toBeLessThan(0.1);
      expect(
        partsOf(motion, sel).some((el) => roleOf(svg, el) === "rose"),
        `${party} のイベントの印がイベントの色 (c-rose) でない`,
      ).toBe(true);
    }
    const args = (s: number): string => `[data-pipe-event][data-pipe-step="${s}"] [data-pipe-args]`;
    expect(
      partsOf(motion, args(1)).map((el) => el.textContent),
      "段 2 に描いた引数",
    ).toEqual(["alice, pool, 10"]);
    expect(seen(motion, args(1), stillOf(rendered, 1)), "段 2 の引数が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, args(1), stillOf(rendered, 2)), "段 2 の引数が次の段に見える").toBeLessThan(0.1);
  });

});

describe("配管の図の確定と取り消し (#3389)", () => {
  it("pipe-outer-return-finalizes-changes", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source);
    const { layout, svg } = rendered;
    const last = lastStep(source);
    // 内側の呼び出しの return では暫定のまま
    const inner = last - 1;
    const statesAt = (s: number): State[] => [
      ...layout.levels.filter((l) => l.step === s).map((l) => l.state),
      ...layout.plates.filter((p) => p.step === s).map((p) => p.state),
      ...layout.events.filter((e) => e.step === s).map((e) => e.state),
      ...layout.flows.filter((f) => f.step === s).map((f) => f.state),
    ];
    expect(statesAt(inner), "内側の呼び出しが戻った段に暫定の物が無い").toContain("provisional");
    for (let s = 0; s < last; s++) expect(statesAt(s), `一番外が戻る前の段 ${s + 1} に確定した物がある`).not.toContain("final");
    // 一番外の呼び出しが return した段で、暫定だった槽と値の札とイベントが全て確定の緑に替わる
    expect(statesAt(last), "一番外が戻った段に暫定の物が残る").not.toContain("provisional");
    for (const key of ["alice|USDC", "pool|USDC", "pool|WETH", "bob|WETH"]) {
      const [party = "", token = ""] = key.split("|");
      expect(levelOf(layout, party, token, last).state, `最後の段の ${party} の ${token} の槽`).toBe("final");
    }
    expect(plateOf(layout, "usdc", "allowance[alice][router]", last).state, "最後の段の許可額の札").toBe("final");
    expect(
      layout.events.filter((e) => e.step === last).map((e) => e.state),
      "最後の段のイベントの札",
    ).toEqual(["final", "final"]);
    const motion = motionFrom(rendered as unknown as Rendered);
    const finals = ["data-pipe-level", "data-pipe-plate", "data-pipe-event"].flatMap((attr) => partsOf(motion, `[${attr}][data-pipe-step="${last}"][data-pipe-state="final"]`));
    expect(
      finals.filter((el) => roleOf(svg, el) !== "green").map((el) => el.outerHTML.slice(0, 120)),
      "最後の段の確定した槽と値の札とイベントが確定の緑 (c-green) でない",
    ).toEqual([]);
  });

  it("pipe-outer-revert-undoes-everything", () => {
    const source = exampleJson("swap-revert.json");
    const rendered = render(source);
    const { layout } = rendered;
    const last = lastStep(source);
    const initials = initialsOf(source as unknown as Source);
    // 一番外の呼び出しが revert した段で、全ての槽と値の札が元の値へ戻る
    for (const level of layout.levels.filter((l) => l.step === last))
      expect(level.amount, `最後の段の ${level.party} の ${level.token} の量が元へ戻らない`).toBe(initials.get(`${level.party}|${level.token}`));
    for (const plate of layout.plates.filter((p) => p.step === last))
      expect(plate.value, `最後の段の ${plate.party} の ${plate.name} の札が元へ戻らない`).toBe(initials.get(`${plate.party}|${plate.name}`));
    expect([levelOf(layout, "alice", "USDC", last).state, levelOf(layout, "pool", "USDC", last).state], "移した槽の取り消しの印").toEqual(["rolled", "rolled"]);
    expect(plateOf(layout, "usdc", "allowance[alice][router]", last).state, "書き替えた札の取り消しの印").toBe("rolled");
    // 移した分とイベントが取り消しの印で描かれる
    const flows = layout.flows.filter((f) => f.step === last);
    expect(flows.length, "最後の段に移した分が無い").toBeGreaterThan(0);
    expect(new Set(flows.map((f) => f.state)), "最後の段の移した分の印").toEqual(new Set(["rolled"]));
    expect(
      layout.events.filter((e) => e.step === last).map((e) => e.state),
      "最後の段のイベントの札の印",
    ).toEqual(["rolled"]);
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(
      partsOf(motion, `[data-pipe-flow][data-pipe-step="${last}"]`).map((el) => el.getAttribute("data-pipe-state")),
      "描いた最後の段の移した分の印",
    ).not.toContain("provisional");
    expect(seen(motion, `[data-pipe-event][data-pipe-step="${last}"][data-pipe-state="rolled"]`, stillOf(rendered, last)), "最後の段に取り消したイベントの札が見えない").toBeGreaterThan(0.9);
  });

  it("pipe-inner-revert-undoes-only-inside", () => {
    const rendered = render(innerPipe());
    const { layout } = rendered;
    // 落ちた呼び出しの内側の変更 (槽、値の札、イベント) だけが元へ戻る
    expect([plateOf(layout, "pool1", "locked", 3).value, plateOf(layout, "pool1", "locked", 3).state], "落ちる前の段の Pool1 の札").toEqual(["true", "provisional"]);
    expect([plateOf(layout, "pool1", "locked", 4).value, plateOf(layout, "pool1", "locked", 4).state], "落ちた段の Pool1 の札").toEqual(["false", "rolled"]);
    expect([levelOf(layout, "alice", "USDC", 4).amount, levelOf(layout, "alice", "USDC", 4).state], "落ちた段の Alice の USDC").toEqual(["100", "rolled"]);
    expect([levelOf(layout, "pool1", "USDC", 4).amount, levelOf(layout, "pool1", "USDC", 4).state], "落ちた段の Pool1 の USDC").toEqual(["0", "rolled"]);
    expect(
      layout.events.filter((e) => e.step === 4).map((e) => [e.text.text, e.state]),
      "落ちた段のイベントの札",
    ).toEqual([["USDC.Transfer", "rolled"]]);
    expect(
      layout.flows.filter((f) => f.step === 4).map((f) => [f.from, f.to, f.state]),
      "落ちた段の流れた分",
    ).toEqual([["alice", "pool1", "rolled"]]);
    // 呼んだ側の変更は暫定のまま残る
    expect([plateOf(layout, "router", "tries", 4).value, plateOf(layout, "router", "tries", 4).state], "落ちた段の Router の札").toEqual(["1", "provisional"]);
    // 落ちた呼び出しの管は閉じ、呼んだ側の呼び出しは開いたまま
    expect(
      layout.calls.map((c) => [c.from, c.to, c.close?.step, c.close?.how]),
      "呼び出しを閉じた段と閉じ方",
    ).toEqual([
      ["alice", "router", 6, "return"],
      ["router", "pool1", 4, "revert"],
      ["pool1", "usdc", 2, "return"],
      ["pool1", "weth", 4, "revert"],
      ["router", "pool2", 5, "return"],
      ["pool2", "usdc", 5, "return"],
      ["pool2", "weth", 5, "return"],
    ]);
    // 呼んだ側の次の行から続けて描く
    expect(callAt(layout, 4).depth, "やり直しの呼び出しの深さが落ちた呼び出しと違う").toBe(callAt(layout, 1).depth);
    expect([levelOf(layout, "alice", "USDC", 5).amount, levelOf(layout, "alice", "USDC", 5).state], "やり直した段の Alice の USDC").toEqual(["0", "provisional"]);
    expect([levelOf(layout, "pool2", "USDC", 5).amount, levelOf(layout, "pool2", "USDC", 5).state], "やり直した段の Pool2 の USDC").toEqual(["100", "provisional"]);
    expect(plateOf(layout, "router", "tries", 5).state, "やり直した段の Router の札").toBe("provisional");
    expect(
      [plateOf(layout, "router", "tries", 6).state, levelOf(layout, "alice", "WETH", 6).state, levelOf(layout, "alice", "WETH", 6).amount],
      "一番外が戻った段の Router の札と Alice の WETH",
    ).toEqual(["final", "final", "0.05"]);
  });
});

describe("大きな Trace の縮め方 (#3389)", () => {
  it("pipe-fold-collapses-inner-calls", () => {
    const source = foldPipe();
    const rendered = render(source, "ja");
    const { layout, timeline } = rendered;
    // [fold] の呼び出しの内側 (段 3 から段 5) を 1 つの箱にまとめ、内側の段の数と関係者の数を出す
    expect(timeline.steps.length, "畳んだ図の段の数").toBe(5);
    expect(
      layout.folds.map((f) => [f.call, f.step, f.steps, f.parties]),
      "畳んだ箱",
    ).toEqual([[1, 2, 3, 4]]);
    expect(callAt(layout, 1).to, "畳んだ呼び出しの呼ばれた者").toBe("agg");
    const text = layout.folds[0]?.text.text ?? "";
    expect(text, "畳んだ箱の字が内側の段の数を出さない").toContain("3段");
    expect(text, "畳んだ箱の字が内側の関係者の数を出さない").toContain("4人");
    const english = render(source, "en").layout.folds[0]?.text.text ?? "";
    expect(english, "英語の畳んだ箱の字が内側の段の数と関係者の数を出さない").toMatch(/3[^\d]+4|4[^\d]+3/u);
    expect(KANA.test(english), `英語の畳んだ箱の字に仮名か漢字がある: ${english}`).toBe(false);
    // 畳んだ間は、内側にしか出ない関係者 (USDC、Pool、WETH、Vault) の列と名札と槽と値の札と、内側にしか出ないトークンの Contract の弁を描かない
    const inner = ["usdc", "pool", "weth", "vault"];
    expect(
      layout.parties.map((p) => p.id),
      "畳んだ図の関係者の並び",
    ).toEqual(["alice", "router", "agg"]);
    for (const [what, owners] of [
      ["列", layout.columns.map((c) => c.party)],
      ["名札", layout.pills.map((p) => p.party)],
      ["槽", layout.tanks.map((t) => t.party)],
      ["段ごとの槽", layout.glasses.map((g) => g.party)],
      ["水位", layout.levels.map((l) => l.party)],
      ["値の札", layout.plates.map((p) => p.party)],
      ["管の弁", [...layout.buses, ...layout.pipes].flatMap((b) => (b.valve ? [b.valve.party] : []))],
      ["流れた分", layout.flows.flatMap((f) => [f.from, f.to])],
    ] as const)
      expect(
        owners.filter((id) => inner.includes(id)),
        `畳んだ図に内側にしか出ない関係者の${what}がある`,
      ).toEqual([]);
    // 見えている Alice の量が内側で変わるトークンの管は残し、内側の流れは描かない
    expect(layout.buses.map((b) => b.token).sort(), "畳んだ図の管のトークン").toEqual(["USDC", "WETH"]);
    expect(
      layout.flows.filter((f) => f.step === 2),
      "畳んだ箱の段に内側の流れを描く",
    ).toEqual([]);
    // 畳んだ箱の段では、内側の move をまとめて、見えている関係者の量の差し引きだけを 1 段で槽に出す
    const aliceAt = (s: number): [string, string, string | undefined][] =>
      ["USDC", "WETH"].map((token) => {
        const level = levelOf(layout, "alice", token, s);
        return [level.amount, level.state, level.was?.text];
      });
    expect(aliceAt(1), "畳んだ箱の前の段の Alice の槽").toEqual([
      ["100", "none", undefined],
      ["0", "none", undefined],
    ]);
    expect(aliceAt(2), "畳んだ箱の段の Alice の槽").toEqual([
      ["0", "provisional", "100"],
      ["1", "provisional", "0"],
    ]);
    // 箱を開いた図は、内側の関係者の列と槽と値の札を今まで通りに描き、内側の最後の段の量が畳んだ箱の段の量と同じになる
    const opened = render(source, "ja", undefined, [1]).layout;
    expect(opened.folds, "開いた図に畳んだ箱がある").toEqual([]);
    expect(
      opened.parties.map((p) => p.id),
      "開いた図の関係者の並び",
    ).toEqual(["alice", "router", "agg", "usdc", "pool", "weth", "vault"]);
    expect(
      [levelOf(opened, "pool", "USDC", 1).amount, levelOf(opened, "pool", "WETH", 1).amount],
      "開いた図の、内側の前の段の Pool の槽",
    ).toEqual(["0", "10"]);
    const lastInner = ["alice|USDC", "pool|USDC", "pool|WETH", "alice|WETH"].map((key) => {
      const [party = "", token = ""] = key.split("|");
      const level = levelOf(opened, party, token, 4);
      return [level.amount, level.state];
    });
    expect(lastInner, "開いた図の内側の最後の段の槽").toEqual([
      ["0", "provisional"],
      ["100", "provisional"],
      ["9", "provisional"],
      ["1", "provisional"],
    ]);
    expect(plateOf(opened, "vault", "count", 4).value, "開いた図の内側の最後の段の Vault の値の札").toBe("1");
    expect(
      ["USDC", "WETH"].map((token) => levelOf(opened, "alice", token, 4).amount),
      "開いた図の内側の最後の段の Alice の量が、畳んだ箱の段の量と違う",
    ).toEqual(aliceAt(2).map(([amount]) => amount));
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(seen(motion, '[data-pipe-fold="1"]', stillOf(rendered, 2)), "畳んだ箱が見えない").toBeGreaterThan(0.9);
    // 箱を押すと、内側の段を開いて描く
    const host = document.createElement("div");
    document.body.appendChild(host);
    let player: { destroy(): void } | undefined;
    let refusal = "";
    try {
      player = draw("mountDiagram")(host, source);
    } catch (error) {
      refusal = String(error);
    }
    try {
      expect(refusal, "配管の図を再生の部品に置けない").toBe("");
      const count = (): number => host.querySelectorAll('[data-dragon="steps"] > li').length;
      expect(count(), "再生の部品に置いた畳んだ図の段の数").toBe(5);
      const folded = host.querySelector('[data-pipe-fold="1"]');
      expect(folded, "再生の部品に置いた図に畳んだ箱が無い").not.toBeNull();
      expect(host.querySelector('[data-pipe-party="pool"]'), "再生の部品に置いた畳んだ図に内側にしか出ない Pool の名札がある").toBeNull();
      folded?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(count(), "畳んだ箱を押しても内側の段を開かない").toBe(7);
      expect(host.querySelector('[data-pipe-party="pool"]'), "畳んだ箱を押しても内側の Pool の名札を描かない").not.toBeNull();
    } finally {
      player?.destroy();
      host.remove();
    }
  });
});

describe("配管の図の見本 (#3389)", () => {
  it("swap-renders-every-step", () => {
    for (const [file, outcome] of [
      ["swap.json", "final"],
      ["swap-revert.json", "rolled"],
    ] as const) {
      const source = exampleJson(file);
      const steps = (source as unknown as Source).steps.length;
      const rendered = render(source);
      const { layout, timeline, svg } = rendered;
      // 原本の段の数だけ順に動く
      expect(timeline.steps, `${file} の時刻の表の段の数`).toHaveLength(steps);
      timeline.steps.forEach((step, i) => {
        expect(step.end, `${file} の段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
        if (i > 0) expect(step.start, `${file} の段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
        expect(covers(step, stillOf(rendered, i)), `${file} の段 ${i + 1} の止め絵がその段の間に無い`).toBe(true);
      });
      const last = steps - 1;
      const changed = layout.levels.filter((l) => l.step === last - 1 && l.state === "provisional").map((l) => `${l.party}|${l.token}`);
      expect(changed.length, `${file} の最後の 1 つ前の段に暫定の槽が無い`).toBeGreaterThan(0);
      const motion = motionFrom(rendered as unknown as Rendered);
      if (outcome === "final") {
        // 成功の図は最後の段で全てが確定の緑になる
        for (const key of changed) {
          const [party = "", token = ""] = key.split("|");
          expect(levelOf(layout, party, token, last).state, `${file} の最後の段の ${party} の ${token}`).toBe("final");
          const sel = `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="${last}"]`;
          expect(seen(motion, sel, stillOf(rendered, last)), `${file} の最後の段の ${party} の ${token} の水が見えない`).toBeGreaterThan(0.9);
          expect(roleOf(svg, partsOf(motion, sel)[0] as Element), `${file} の最後の段の ${party} の ${token} が確定の緑でない`).toBe("green");
        }
      } else {
        // 取り消しの図は最後の段で全てが元へ戻る
        const initials = initialsOf(source as unknown as Source);
        for (const key of changed) {
          const [party = "", token = ""] = key.split("|");
          const level = levelOf(layout, party, token, last);
          expect([level.amount, level.state], `${file} の最後の段の ${party} の ${token}`).toEqual([initials.get(key), "rolled"]);
          const sel = `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="${last}"][data-pipe-state="rolled"]`;
          expect(seen(motion, sel, stillOf(rendered, last)), `${file} の最後の段の ${party} の ${token} の取り消しが見えない`).toBeGreaterThan(0.9);
        }
      }
    }
  });

  it("pipe-keeps-motion-rules", () => {
    const { timeline } = render(exampleJson("swap.json"));
    expect(sampleTimes(timeline).length, "交換の図を 0.25 秒ごとに数えた時刻").toBeGreaterThan(0);
    expect(
      timeline.badges.map((b) => b.step),
      "交換の図の段の番号",
    ).toEqual(timeline.steps.map((_, i) => i));
    for (const badge of timeline.badges) {
      const step = timeline.steps[badge.step];
      expect(badge.appears, `交換の図の段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
    }
    for (const t of sampleTimes(timeline)) {
      const early = timeline.badges.filter((b) => b.appears <= t && (timeline.steps[b.step]?.start ?? Number.POSITIVE_INFINITY) > t).map((b) => b.step + 1);
      expect(early, `交換の図の ${t} 秒に、始まっていない段の番号が出る`).toEqual([]);
    }
  });

  it("pipe-layout-same-in-every-palette", () => {
    const source = exampleJson("swap.json");
    const base = render(source);
    // 図の名前 (class と動きの名前) は色の値からも作るので、同じ名前に揃え、色と字の変数を書く最初の規則を外して比べる
    const shapeOf = (svg: string): string => {
      const hash = figureClass(svg)?.slice("dg-".length) ?? "";
      return svg.split(hash).join("figure").replace(/<style>\.dg-figure\{[^}]*\}/u, "<style>");
    };
    const palettes = draw("PALETTES");
    for (const palette of Object.keys(palettes)) {
      for (const theme of ["light", "dark"] as const) {
        const rendered = draw("renderDiagram")(source, { palette, theme });
        expect(rendered.layout, `色味 ${palette} (${theme}) の置き場所が既定の色味と違う`).toEqual(base.layout);
        // 角を落とす色味 (#3344) は箱の形を変えるため、SVG は既定の色味と同じ角の形の色味だけで比べる
        if (palettes[palette]?.corner !== palettes.paper?.corner) continue;
        expect(shapeOf(rendered.svg), `色味 ${palette} (${theme}) の SVG が色の値の外で既定の色味と違う`).toBe(shapeOf(base.svg));
      }
    }
  });

  it("pipe-example-files-match", () => {
    const parse = api("parseNotation");
    for (const name of SAMPLES) {
      for (const file of [`${name}.dragon`, `${name}.en.dragon`, `${name}.json`, `${name}.en.json`])
        expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
      const ja = parse(fileText(`${name}.dragon`) ?? "", { lang: "ja" });
      const en = parse(fileText(`${name}.en.dragon`) ?? "", { lang: "en" });
      expect(ja.ok && en.ok, `${name} の見本の記法が読めない: ${JSON.stringify([ja.ok || ja.errors, en.ok || en.errors])}`).toBe(true);
      if (!ja.ok || !en.ok) continue;
      expect((ja.diagram as unknown as Source).kind, `${name} の見本の図の種類`).toBe("pipe");
      expect(shape(en.diagram as unknown as Source), `${name} の英語版の関係者と段と出来事の数が日本語版と違う`).toEqual(shape(ja.diagram as unknown as Source));
    }
  });
});

describe("配管の図の書き方の文書 (#3389)", () => {
  it("docs-describe-pipe-diagram", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `pipe` と、行の形 (`hold <持ち主>: …` か `hold alice: …`) */
    const forms: [string, RegExp][] = [
      ["pipe", /(^|[\s`])pipe [^\s`]/mu],
      ...PIPE_WORDS.map((word): [string, RegExp] => [word, new RegExp(`(^|[\\s\`])${word} (<[^>]+>|[^\\s:\`]+):`, "mu")]),
    ];
    const marks = ["[value: ", "[call: ", "[fold]", "[fail]"];
    const describes = (where: string, text: string): void => {
      for (const [word, form] of forms) expect(form.test(text), `${where} に ${word} の行の書き方が無い`).toBe(true);
      for (const mark of marks) expect(text, `${where} に印 ${mark.trim()} の書き方が無い`).toContain(mark);
    };
    const pipeFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as unknown as Source).kind === "pipe";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      describes(path, text);
      if (path !== "README.md") expect(pipeFences(text), `${path} に配管の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"pipe"/u.test(content), "使い方の頁の節に配管の図 (pipe) が無い").toBe(true);
    const sections = ["pipe.dragon", "pipe.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const parsed = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(parsed.ok && (parsed.diagram as unknown as Source).kind, `使い方の頁の配管の図の節の例 (${i === 0 ? "pipe.dragon" : "pipe.en.dragon"}) が配管の図として読めない`).toBe("pipe");
    }
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    describes("使い方の頁", [content, ...sections, ...paragraphs].join("\n"));
  });
});

// ---- 第6回の試作の形 (#3398)

/** 原本の段の中の出来事。吹き出しが出す字を読むので、行の全ての欄を持つ */
interface AnyEvent {
  type: string;
  box?: string;
  from?: string;
  to?: string;
  label?: string;
  amount?: string;
  value?: string;
  reason?: string;
  left?: string;
  right?: string;
  in?: string;
  out?: string;
}

/** 描いた見本 (`open` は開く `[fold]` の呼び出しの番号) と、描いた段の原本の段。畳んだ箱を開いた図は段が増える */
function drawnSteps(rendered: PipeRendered): { title: string; events: AnyEvent[] }[] {
  const diagram = (rendered as unknown as { diagram?: { steps: { title: string; events: AnyEvent[] }[] } }).diagram;
  expect(diagram?.steps, "描いた結果に描いた段の原本 (diagram.steps) が無い").toBeDefined();
  return diagram?.steps ?? [];
}

/** 原本の段を順に読み、呼ばれた者ごとに最初に呼ばれた深さを返す。一番外の呼び出しは 0 */
function calledDepths(steps: { events: AnyEvent[] }[]): Map<string, number> {
  const depths = new Map<string, number>();
  const stack: string[] = [];
  for (const step of steps)
    for (const e of step.events) {
      if (e.type === "call" && e.to) {
        if (!depths.has(e.to)) depths.set(e.to, stack.length);
        stack.push(e.to);
      } else if (e.type === "return" || e.type === "revert") stack.pop();
    }
  return depths;
}

/** 点 `p` が折れ線 `points` の上 (`tol` px 以内) に在るか */
function onPath(p: Point, points: Point[], tol = 1.5): boolean {
  return points.slice(1).some((b, i) => {
    const a = points[i] as Point;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len));
    return Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]) <= tol;
  });
}

/** 四角 `inner` が四角 `outer` の中に在るか */
const inside = (inner: Rect, outer: Rect, tol = 0.5): boolean =>
  inner.x >= outer.x - tol && inner.y >= outer.y - tol && inner.x + inner.w <= outer.x + outer.w + tol && inner.y + inner.h <= outer.y + outer.h + tol;

/** 字の部品の字の大きさ (px)。部品から包む部品へ、属性、style、class の規則の順に、`font-size` か `font` の中の大きさを読む */
function fontPxOf(svg: string, el: Element): number | undefined {
  const read = (text: string): number | undefined => {
    const m = /font-size:\s*([\d.]+)px/u.exec(text) ?? /(?:^|[;{\s])font:[^;]*?([\d.]+)px/u.exec(text);
    return m?.[1] === undefined ? undefined : Number(m[1]);
  };
  for (let e: Element | null = el; e; e = e.parentElement) {
    const attr = e.getAttribute("font-size");
    if (attr !== null) return Number.parseFloat(attr);
    const style = read(e.getAttribute("style") ?? "");
    if (style !== undefined) return style;
    for (const rule of classRules(svg, e)) {
      const found = read(`;${rule}`);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** 部品か中の部品のどれかが、時刻 `t0` と `t1` で性質 `prop` の値を変えるか */
const changes = (motion: Motion, el: Element, prop: string, t0: number, t1: number): boolean =>
  [el, ...el.querySelectorAll("*")].some((e) => JSON.stringify(motion.value(e, prop, t0)) !== JSON.stringify(motion.value(e, prop, t1)));

/** 段 `s` の中の時刻 (始まりから止め絵まで、0.05 秒ごと) */
function timesIn(rendered: PipeRendered, s: number): number[] {
  const start = rendered.timeline.steps[s]?.start ?? Number.NaN;
  const still = stillOf(rendered, s);
  const out: number[] = [];
  for (let t = start; t <= still; t += 0.05) out.push(t);
  return out;
}

/** 見本 aggregator の箱を全て開き、幅 1200 の枠で描いた図 */
const openedAggregator = (lang: "ja" | "en" = "ja"): PipeRendered => render(exampleJson(lang === "ja" ? "aggregator.json" : "aggregator.en.json"), lang, 1200, [2]);

describe("第6回の試作の形の配管の図 (#3398)", () => {
  it("pipe-r6-parties-by-call-depth", () => {
    for (const [name, rendered] of [
      ["swap", render(exampleJson("swap.json"))],
      ["aggregator を開いた図", openedAggregator()],
    ] as const) {
      const { layout } = rendered;
      const depths = calledDepths(drawnSteps(rendered));
      // 送り手と呼ばれない口座は丸の名札で一番上の行、呼ばれる Contract は呼ばれた深さの行の箱、トークンの Contract はトークンの箱
      for (const p of layout.parties) {
        const want = p.role === "token" ? "token" : p.role !== "sender" && depths.has(p.id) ? "cabinet" : "round";
        expect(p.shape, `${name} の ${p.id} の名札の形`).toBe(want);
        if (want !== "token") expect(p.row, `${name} の ${p.id} の名札の行`).toBe(want === "round" ? 0 : depths.get(p.id));
      }
      // 同じ行の名札は同じ高さに並び、深い行ほど下に置く
      const named = layout.parties.filter((p) => p.shape !== "token");
      const middle = (p: Party): number => p.y + p.h / 2;
      const rows = [...new Set(named.map((p) => p.row ?? Number.NaN))].sort((a, b) => a - b);
      rows.forEach((row, k) => {
        const same = named.filter((p) => p.row === row);
        for (const p of same) expect(middle(p), `${name} の ${p.id} が行 ${row} のほかの名札と同じ高さに無い`).toBeCloseTo(middle(same[0] as Party), 0);
        const below = rows[k + 1];
        if (below !== undefined)
          expect(Math.min(...named.filter((p) => p.row === below).map((p) => p.y)), `${name} の行 ${below} が行 ${row} の下に無い`).toBeGreaterThan(Math.max(...same.map((p) => p.y + p.h)));
      });
      // 槽を持つ関係者は、自分の槽の真上に置く
      for (const owner of new Set(layout.tanks.map((t) => t.party))) {
        const p = partyOf(layout, owner);
        if (p.shape === "token") continue;
        const own = layout.tanks.filter((t) => t.party === owner);
        const lo = Math.min(...own.map((t) => t.x));
        const hi = Math.max(...own.map((t) => t.x + t.w));
        expect(center(p) >= lo && center(p) <= hi, `${name} の ${owner} の名札が自分の槽の真上に無い`).toBe(true);
        expect(p.y + p.h, `${name} の ${owner} の名札が自分の槽より上に無い`).toBeLessThanOrEqual(Math.min(...own.map((t) => t.y)));
      }
    }
    // 見本 swap では Alice と SwapRouter と Bob が 1 行目、LiquidityPool が 2 行目
    const swap = render(exampleJson("swap.json")).layout;
    expect(
      Object.fromEntries(swap.parties.filter((p) => p.shape !== "token").map((p) => [p.id, p.row])),
      "見本 swap の名札の行",
    ).toEqual({ alice: 0, router: 0, pool: 1, bob: 0 });
  });

  it("pipe-r6-value-pipes-follow-flows", () => {
    // 隣の槽どうしだけを結ぶ図は、槽の横を結ぶ値の管で描く
    const swap = render(exampleJson("swap.json")).layout;
    for (const [token, from, to, owner] of [
      ["USDC", "alice", "pool", "usdc"],
      ["WETH", "pool", "bob", "weth"],
    ] as const) {
      const bus = swap.buses.find((b) => b.token === token);
      expect(bus?.mode, `見本 swap の ${token} の値の管の通し方`).toBe("side");
      if (!bus) continue;
      const a = tankOf(swap, from, token);
      const b = tankOf(swap, to, token);
      const [l, r] = center(a) < center(b) ? [a, b] : [b, a];
      expect(Math.abs(bus.x1 - (l.x + l.w)), `${token} の値の管が左の槽の右の縁から出ない`).toBeLessThanOrEqual(2);
      expect(Math.abs(bus.x2 - r.x), `${token} の値の管が右の槽の左の縁へ入らない`).toBeLessThanOrEqual(2);
      expect(bus.y > Math.max(l.y, r.y) && bus.y < Math.min(l.y + l.h, r.y + r.h), `${token} の値の管が槽の横の高さを通らない`).toBe(true);
      for (const f of swap.flows.filter((g) => g.token === token)) {
        const [x0] = f.points[0] ?? [Number.NaN];
        const [x1] = f.points[f.points.length - 1] ?? [Number.NaN];
        expect(x0 >= l.x - 2 && x0 <= r.x + r.w + 2 && x1 >= l.x - 2 && x1 <= r.x + r.w + 2, `段 ${f.step + 1} の ${token} の流れが 2 つの槽の間を通らない`).toBe(true);
      }
      expect(bus.valve?.party, `${token} の値の管の弁`).toBe(owner);
      const valve = bus.valve ?? { party: "", x: Number.NaN, y: Number.NaN };
      expect(valve.x > bus.x1 && valve.x < bus.x2, `${token} の弁が値の管の上に無い`).toBe(true);
      expect(Math.abs((valve.y ?? Number.NaN) - bus.y), `${token} の弁が値の管の高さに無い`).toBeLessThan(1);
      const box = partyOf(swap, owner);
      expect(Math.abs(center(box) - valve.x), `${owner} のトークンの箱が弁の真上に無い`).toBeLessThan(1);
      expect(box.y + box.h, `${owner} のトークンの箱が弁より上に無い`).toBeLessThan(valve.y ?? Number.NaN);
    }
    // 離れた槽を結ぶ図は、槽の上に本管を通す
    const opened = openedAggregator();
    const crowd = opened.layout;
    const crowdLast = opened.timeline.steps.length - 1;
    for (const token of ["USDC", "WETH", "DAI"]) {
      const bus = crowd.buses.find((b) => b.token === token);
      expect(bus?.mode, `aggregator を開いた図の ${token} の値の管の通し方`).toBe("main");
      if (!bus) continue;
      const tanks = crowd.tanks.filter((t) => t.token === token);
      expect(bus.y, `${token} の本管が槽の上を通らない`).toBeLessThan(Math.min(...tanks.map((t) => t.y)));
      expect(bus.x1, `${token} の本管が左の槽に届かない`).toBeLessThanOrEqual(Math.min(...tanks.map(center)));
      expect(bus.x2, `${token} の本管が右の槽に届かない`).toBeGreaterThanOrEqual(Math.max(...tanks.map(center)));
      const owner = bus.valve?.party ?? "";
      const box = partyOf(crowd, owner);
      expect(box.shape, `${token} の本管の弁の持ち主がトークンの箱でない`).toBe("token");
      expect(Math.abs(center(box) - (bus.valve?.x ?? Number.NaN)), `${owner} のトークンの箱が弁の真上に無い`).toBeLessThan(1);
      expect(box.y + box.h, `${owner} のトークンの箱が本管より上に無い`).toBeLessThan(bus.y);
      for (const f of crowd.flows.filter((g) => g.token === token && g.step === crowdLast)) {
        const [x0] = f.points[0] ?? [Number.NaN];
        expect(within(x0, tankOf(crowd, f.from, token)), `${f.from} から ${f.to} の ${token} の流れが送り手の槽から出ない`).toBe(true);
      }
    }
  });

  it("pipe-r6-token-box-holds-values", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source);
    const { layout } = rendered;
    const box = partyOf(layout, "usdc");
    expect(box.shape, "USDC の名札の形").toBe("token");
    const name = "allowance[alice][router]";
    // hold で宣言したトークンの箱の値は、箱の中の名前の下に書く
    for (let s = 0; s <= lastStep(source); s++) {
      const plate = plateOf(layout, "usdc", name, s);
      expect(inside(plate, box), `段 ${s + 1} の許可額の札が USDC の箱の中に無い`).toBe(true);
      expect(plate.y, `段 ${s + 1} の許可額の札が USDC の箱の名前の下に無い`).toBeGreaterThanOrEqual(box.y + 18);
    }
    // write の段で、前の値を消し線で残す
    const written = plateOf(layout, "usdc", name, 4);
    expect([written.value, written.was?.text, written.state], "write の段の許可額の札").toEqual(["0", "100", "provisional"]);
    const was = written.was ?? { x: Number.NaN, y: Number.NaN, w: 0, h: 0 };
    expect(
      written.strike !== undefined && written.strike.x <= was.x + 1 && written.strike.x + written.strike.w >= was.x + was.w - 1,
      "write の段の前の許可額に消し線が無い",
    ).toBe(true);
    const motion = motionFrom(rendered as unknown as Rendered);
    const drawn = partsOf(motion, `[data-pipe-plate="usdc"][data-pipe-step="4"]`)[0] as Element;
    const texts = [...drawn.querySelectorAll("text, tspan")].map((t) => t.textContent ?? "");
    for (const want of [name, "100", "0"]) expect(texts, `描いた write の段の許可額の札に ${want} が無い`).toContain(want);
  });

  it("pipe-r6-tank-parts", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source, "ja");
    const { layout, svg } = rendered;
    const last = lastStep(source);
    const motion = motionFrom(rendered as unknown as Rendered);
    // 槽はつやと 5 本の目盛りとトークンの名前を持つ
    for (const tank of layout.tanks) {
      const g = partsOf(motion, `[data-pipe-tank="${tank.party}"][data-pipe-token="${tank.token}"]`)[0] as Element;
      expect(g.querySelectorAll("[data-pipe-shine]").length, `${tank.party} の ${tank.token} の槽につやが無い`).toBeGreaterThan(0);
      expect(g.querySelectorAll("[data-pipe-tick]").length, `${tank.party} の ${tank.token} の槽の目盛りの数`).toBe(5);
      expect(
        [...g.querySelectorAll("text")].map((t) => t.textContent),
        `${tank.party} の ${tank.token} の槽にトークンの名前が無い`,
      ).toContain(tank.token);
    }
    // 槽の下に 3 桁ごとに区切った大きな数を出す
    for (const level of layout.levels) {
      const tank = tankOf(layout, level.party, level.token);
      expect(level.text.y, `段 ${level.step + 1} の ${level.party} の ${level.token} の数が槽の下に無い`).toBeGreaterThanOrEqual(tank.y + tank.h);
    }
    expect([levelOf(layout, "alice", "USDC", 0).text.text, levelOf(layout, "pool", "USDC", 0).text.text], "段 1 の槽の下の数").toEqual(["1,000", "2,000"]);
    // 変わった段から確定するまで、前の値の消し線と暫定の語を添え、確定した後は確定の語を添える
    expect(levelOf(layout, "pool", "USDC", 3).tag, "変わる前の段の Pool の USDC に語がある").toBeUndefined();
    for (let s = 4; s < last; s++) {
      const moved = levelOf(layout, "pool", "USDC", s);
      expect([moved.text.text, moved.was?.text, moved.tag?.text], `段 ${s + 1} の Pool の USDC の数と前の数と語`).toEqual(["2,100", "2,000", "暫定"]);
      const was = moved.was ?? { x: Number.NaN, y: 0, w: 0, h: 0 };
      expect(
        moved.strike !== undefined && moved.strike.x <= was.x + 1 && moved.strike.x + moved.strike.w >= was.x + was.w - 1,
        `段 ${s + 1} の Pool の USDC の前の数に消し線が無い`,
      ).toBe(true);
      expect(moved.text.h, `段 ${s + 1} の Pool の USDC の数が前の数より大きくない`).toBeGreaterThanOrEqual(1.6 * was.h);
    }
    const done = levelOf(layout, "pool", "USDC", last);
    expect([done.state, done.tag?.text], "最後の段の Pool の USDC の語").toEqual(["final", "確定"]);
    // トークンごとに液の色を分ける
    const fillOf = (party: string, token: string): string => {
      const el = partsOf(motion, `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="0"]`)[0] as Element;
      return [el, ...el.querySelectorAll("*")].map((e) => `${e.getAttribute("fill") ?? ""}${e.getAttribute("style") ?? ""}${classRules(svg, e).join("")}`).join("|");
    };
    expect(fillOf("pool", "USDC"), "USDC と WETH の液が同じ色").not.toBe(fillOf("pool", "WETH"));
  });

  it("pipe-r6-calls-share-a-main", () => {
    const rendered = openedAggregator();
    const { layout, svg } = rendered;
    const mains = layout.mains ?? [];
    // 同じ関係者から出る呼び出しの管は 1 本の本管と呼ぶ相手ごとの枝で描き、弁は枝の根元に置く
    for (const from of new Set(layout.calls.map((c) => c.from))) {
      const own = mains.filter((m) => m.from === from);
      expect(own.length, `${from} から出る本管の数`).toBe(1);
      const main = own[0];
      if (!main) continue;
      expect(
        main.branches.map((b) => b.to).sort(),
        `${from} の本管の枝の相手`,
      ).toEqual([...new Set(layout.calls.filter((c) => c.from === from).map((c) => c.to))].sort());
      for (const b of main.branches) {
        const root = b.points[0] ?? [Number.NaN, Number.NaN];
        expect(onPath(root, main.points), `${from} から ${b.to} の枝の根元が本管の上に無い`).toBe(true);
        expect(onPath([b.valve.x, b.valve.y], b.points), `${from} から ${b.to} の枝の弁が枝の上に無い`).toBe(true);
        expect(Math.hypot(b.valve.x - root[0], b.valve.y - root[1]), `${from} から ${b.to} の枝の弁が根元から遠い`).toBeLessThanOrEqual(48);
        const end = b.points[b.points.length - 1] ?? [Number.NaN, Number.NaN];
        const callee = partyOf(layout, b.to);
        expect(inside({ x: end[0], y: end[1], w: 0, h: 0 }, callee, 1), `${from} から ${b.to} の枝が呼ばれた者の名札へ入らない`).toBe(true);
      }
    }
    expect(mains.find((m) => m.from === "agg")?.branches.length, "Aggregator の本管の枝の数").toBe(9);
    // まだ戻っていない呼び出しの管だけを光らせる。大きな図なので、光る管は 1 度だけ引いて段ごとに分ける
    const motion = motionFrom(rendered as unknown as Rendered);
    const litParts = new Map<string, Element[]>();
    for (const el of motion.doc.querySelectorAll('[data-pipe-branch][data-pipe-pipe="open"]')) {
      const key = `${el.getAttribute("data-pipe-branch")}|${el.getAttribute("data-pipe-step")}`;
      litParts.set(key, [...(litParts.get(key) ?? []), el]);
    }
    const lit = (from: string, to: string, s: number): Element[] => litParts.get(`${from}>${to}|${s}`) ?? [];
    const shownAt = (els: Element[], t: number): number => Math.max(0, ...els.map((el) => seenOf(motion, el, t)));
    const toAgg = layout.calls.find((c) => c.from === "router" && c.to === "agg");
    const closed = toAgg?.close?.step ?? Number.NaN;
    expect(closed, "Router から Aggregator への呼び出しを閉じた段").toBe(10);
    for (let s = 0; s < rendered.timeline.steps.length; s++) {
      const open = s >= 2 && s < closed;
      const shown = shownAt(lit("router", "agg", s), stillOf(rendered, s));
      if (open) expect(shown, `段 ${s + 1} に開いている Router から Aggregator への管が光らない`).toBeGreaterThan(0.9);
      else expect(shown, `段 ${s + 1} に Router から Aggregator への管が光る`).toBeLessThan(0.1);
      if (s >= 1) expect(shownAt(lit("router", "usdc", s), stillOf(rendered, s)), `段 ${s + 1} に戻った Router から USDC への管が光る`).toBeLessThan(0.1);
    }
    expect(
      lit("router", "agg", 2).some((el) => roleOf(svg, el) === "blue"),
      "光る呼び出しの管が呼び出しの色 (c-blue) でない",
    ).toBe(true);
    // 段の中で開いて閉じる呼び出しは、開いている間だけ光る
    const inner = lit("agg", "pool1", 4);
    expect(inner.length, "段 5 に Aggregator から Pool1 への光る管が無い").toBeGreaterThan(0);
    const during = Math.max(...timesIn(rendered, 4).map((t) => shownAt(inner, t)));
    expect(during, "段 5 の中で Aggregator から Pool1 への管が光らない").toBeGreaterThan(0.9);
    expect(shownAt(inner, stillOf(rendered, 4)), "段 5 の止め絵で戻った Aggregator から Pool1 への管が光る").toBeLessThan(0.1);
  });

  it("pipe-r6-gauge-on-pipe", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source);
    const { layout } = rendered;
    const last = lastStep(source);
    // 図の上に確認の印の列は描かない
    expect(layout.checks, "図の上に確認の印がある").toEqual([]);
    expect(layout.heads?.checks, "図の上の端に確認の行の字がある").toBeUndefined();
    const motion = motionFrom(rendered as unknown as Rendered);
    // 値を払う前の確認は払う値の管に載せる。Pool の最低額の確認 (0.05 WETH >= 0.04 WETH) は、Pool が払う WETH の管に載る
    for (const [party, step, on, token] of [
      ["router", 1, "call", ""],
      ["usdc", 3, "value", "USDC"],
      ["pool", 8, "value", "WETH"],
    ] as const) {
      const own = layout.gauges.filter((g) => g.party === party);
      // 確かめた段の後も、針と通ったかの印を残す
      expect(
        own.map((g) => g.step),
        `${party} の計器を描く段`,
      ).toEqual(Array.from({ length: last - step + 1 }, (_, i) => step + i));
      expect(own.every((g) => g.ok && g.on === on), `${party} の計器の結果と載せる管`).toBe(true);
      const g = own[0];
      if (!g) continue;
      const mid: Point = [center(g), g.y + g.h / 2];
      if (on === "call") {
        const pipe = layout.calls.find((c) => c.to === party);
        expect(onPath(mid, pipe?.points ?? []), `${party} の計器が ${party} を呼んだ管の上に無い`).toBe(true);
      } else {
        const bus = layout.buses.find((b) => b.token === token && b.valve);
        expect(mid[0] > (bus?.x1 ?? Number.NaN) && mid[0] < (bus?.x2 ?? Number.NaN), `${party} の計器が ${token} の値の管の横の範囲に無い`).toBe(true);
        expect(mid[1] < (bus?.y ?? Number.NaN) && (bus?.y ?? Number.NaN) - mid[1] <= 90, `${party} の計器が ${token} の値の管の上に無い`).toBe(true);
      }
      for (let s = step; s <= last; s++) {
        const sel = `[data-pipe-gauge="${party}"][data-pipe-step="${s}"]`;
        expect(seen(motion, sel, stillOf(rendered, s)), `段 ${s + 1} に ${party} の計器が見えない`).toBeGreaterThan(0.9);
        const drawn = partsOf(motion, sel)[0] as Element;
        expect(drawn.querySelector("[data-pipe-needle]"), `段 ${s + 1} の ${party} の計器に針が無い`).not.toBeNull();
        expect(drawn.querySelector("[data-pipe-lamp]"), `段 ${s + 1} の ${party} の計器に通ったかの印が無い`).not.toBeNull();
      }
    }
    // 値の管の計器の式は、管が運ぶトークンの単位を外して書き、Pool の囲いの点線にかけない
    const read = layout.gauges.find((g) => g.party === "pool" && g.step === last)?.read;
    expect(read?.text, "Pool の計器の式").toBe("0.05 ≥ 0.04");
    const housing = layout.housings?.find((h) => h.party === "pool");
    expect((read?.x ?? Number.NaN) >= (housing?.x ?? Number.NaN) + (housing?.w ?? Number.NaN), "Pool の計器の式が Pool の囲いにかかる").toBe(true);
  });

  it("pipe-r6-converter-between-tanks", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source);
    const { layout, svg } = rendered;
    const last = lastStep(source);
    const own = layout.converters.filter((c) => c.party === "pool");
    expect(
      own.map((c) => c.step),
      "Pool の変換器を描く段",
    ).toEqual(Array.from({ length: last + 1 }, (_, i) => i));
    expect(
      own.filter((c) => c.active).map((c) => c.step),
      "Pool の変換器が計算する段",
    ).toEqual([7]);
    // 変換器は Pool の 2 つの槽の間に置く
    const usdc = tankOf(layout, "pool", "USDC");
    const weth = tankOf(layout, "pool", "WETH");
    const [l, r] = usdc.x < weth.x ? [usdc, weth] : [weth, usdc];
    for (const c of own) {
      expect(center(c) > l.x + l.w && center(c) < r.x, `段 ${c.step + 1} の変換器が Pool の 2 つの槽の間に無い`).toBe(true);
      const mid = c.y + c.h / 2;
      expect(mid > Math.max(l.y, r.y) && mid < Math.min(l.y + l.h, r.y + r.h), `段 ${c.step + 1} の変換器が槽の横の高さに無い`).toBe(true);
    }
    // Pool の槽を点線の囲いで囲む
    const housing = (layout.housings ?? []).find((h) => h.party === "pool");
    expect(housing, "Pool の槽の囲いが無い").toBeDefined();
    if (housing) for (const t of [usdc, weth]) expect(inside(t, housing), `Pool の ${t.token} の槽が囲いの中に無い`).toBe(true);
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(
      partsOf(motion, '[data-pipe-housing="pool"]').some((el) => dashed(svg, el)),
      "Pool の槽の囲いが点線でない",
    ).toBe(true);
    // 計算する段で、変換器を値の色にする
    expect(roleOf(svg, partsOf(motion, '[data-pipe-converter="pool"][data-pipe-step="7"]')[0] as Element), "計算する段の変換器が値の色 (c-amber) でない").toBe("amber");
    expect(roleOf(svg, partsOf(motion, '[data-pipe-converter="pool"][data-pipe-step="6"]')[0] as Element), "計算しない段の変換器が値の色").not.toBe("amber");
  });

  it("pipe-r6-callout-per-step", () => {
    /** 段の出来事のうち、吹き出しが出す 1 つ。取り消し、移す、確かめる、換算、戻る、呼ぶの順に先に来る物 */
    const pick = (events: AnyEvent[]): AnyEvent | undefined => {
      for (const type of ["revert", "move", "check", "calc", "return", "call"]) {
        const found = events.find((e) => e.type === type);
        if (found) return found;
      }
      return undefined;
    };
    const words = (e: AnyEvent): string[] => {
      if (e.type === "revert") return e.reason ? [e.reason] : [];
      if (e.type === "move") return [e.amount ?? ""];
      if (e.type === "check") return [e.left ?? "", e.right ?? ""];
      if (e.type === "calc") return [e.in ?? "", e.out ?? ""];
      if (e.type === "return") return e.value ? [e.value] : [];
      return e.label ? [e.label] : [];
    };
    for (const [name, rendered] of [
      ["swap", render(exampleJson("swap.json"))],
      ["swap-revert", render(exampleJson("swap-revert.json"))],
      ["aggregator を開いた図", openedAggregator()],
    ] as const) {
      const { layout } = rendered;
      const steps = drawnSteps(rendered);
      steps.forEach((step, s) => {
        const own = (layout.callouts ?? []).filter((c) => c.step === s);
        expect(own.length, `${name} の段 ${s + 1} の吹き出しの数`).toBe(1);
        const callout = own[0];
        const event = pick(step.events);
        if (!callout || !event) return;
        expect(callout.kind, `${name} の段 ${s + 1} の吹き出しの種類`).toBe(event.type);
        for (const word of words(event)) expect(`${callout.tag?.text ?? ""} ${callout.text.text}`, `${name} の段 ${s + 1} の吹き出しに ${word} が無い`).toContain(word);
        // 名札と槽と槽の下の数に重ならない
        const others: [string, Rect][] = [
          ...layout.parties.map((p): [string, Rect] => [`名札 ${p.id}`, p]),
          ...layout.tanks.map((t): [string, Rect] => [`${t.party} の ${t.token} の槽`, t]),
          ...layout.levels
            .filter((l) => l.step === s)
            .flatMap((l): [string, Rect][] => [
              [`${l.party} の ${l.token} の数`, l.text],
              ...(l.was ? [[`${l.party} の ${l.token} の前の数`, l.was] as [string, Rect]] : []),
              ...(l.tag ? [[`${l.party} の ${l.token} の語`, l.tag] as [string, Rect]] : []),
            ]),
        ];
        for (const [what, rect] of others) expect(gap(callout, rect), `${name} の段 ${s + 1} の吹き出しが${what}に重なる`).toBeGreaterThan(0);
      });
    }
  });

  it("pipe-r6-motions", () => {
    const rendered = render(exampleJson("swap.json"));
    const motion = motionFrom(rendered as unknown as Rendered);
    const startOf = (s: number): number => rendered.timeline.steps[s]?.start ?? Number.NaN;
    // 呼び出しの段で、管が光って弁の取っ手が回る
    const lit = '[data-pipe-branch="alice>router"][data-pipe-pipe="open"][data-pipe-step="0"]';
    expect(seen(motion, lit, startOf(0)), "呼び出しの段の始まりに管が光っている").toBeLessThan(0.1);
    expect(seen(motion, lit, stillOf(rendered, 0)), "呼び出しの段の止め絵で管が光らない").toBeGreaterThan(0.9);
    const lever = partsOf(motion, '[data-pipe-lever="alice>router"][data-pipe-step="0"]');
    expect(
      lever.some((el) => changes(motion, el, "transform", startOf(0), stillOf(rendered, 0))),
      "呼び出しの段で弁の取っ手が回らない",
    ).toBe(true);
    // move の段で、液が値の管を流れて槽の水位が変わる
    const slug = partsOf(motion, '[data-pipe-slug][data-pipe-step="4"]');
    const times = timesIn(rendered, 4);
    expect(
      slug.some((el) => times.some((t) => changes(motion, el, "stroke-dashoffset", times[0] ?? 0, t))),
      "move の段で液が値の管を流れない",
    ).toBe(true);
    const pool = partsOf(motion, '[data-pipe-level="pool"][data-pipe-token="USDC"][data-pipe-step="4"]');
    expect(
      pool.some((el) => changes(motion, el, "transform", startOf(4), stillOf(rendered, 4))),
      "move の段で Pool の USDC の水位が動かない",
    ).toBe(true);
    // check の段で、計器の針が振れて印が付く
    const needle = partsOf(motion, '[data-pipe-gauge="router"][data-pipe-step="1"] [data-pipe-needle]');
    expect(
      needle.some((el) => changes(motion, el, "transform", startOf(1), stillOf(rendered, 1))),
      "check の段で計器の針が振れない",
    ).toBe(true);
    const lamp = '[data-pipe-gauge="router"][data-pipe-step="1"] [data-pipe-lamp]';
    expect(seen(motion, lamp, startOf(1)), "check の段の始まりに印が付いている").toBeLessThan(0.1);
    expect(seen(motion, lamp, stillOf(rendered, 1)), "check の段の止め絵に印が無い").toBeGreaterThan(0.9);
  });

  it("pipe-r6-wide-figure-keeps-text-size", () => {
    const swap = render(exampleJson("swap.json"));
    const crowd = openedAggregator();
    const { layout, svg } = crowd;
    // 縮めずに横に長い図のまま描く。列を畳まない
    expect(layout.width, "aggregator を開いた図の幅").toBeGreaterThan(1200);
    expect(layout.arrangement, "aggregator を開いた図の並べ方").toBe("wide");
    expect(layout.columns.filter((c) => c.folded), "aggregator を開いた図で畳んだ列").toEqual([]);
    // 関係者の名前を 1 字に略さない
    const motion = motionFrom(crowd as unknown as Rendered);
    for (const p of layout.parties) {
      const named = partsOf(motion, `[data-pipe-party="${p.id}"]`);
      for (const el of named)
        expect(
          [...el.querySelectorAll("text")].map((t) => t.textContent),
          `${p.id} の名札の名前が略されている`,
        ).toContain(p.name);
    }
    // 関係者の名前と槽の下の数を、見本 swap と同じ字の大きさで出す
    const swapMotion = motionFrom(swap as unknown as Rendered);
    const nameText = (m: Motion, id: string, name: string): Element =>
      [...partsOf(m, `[data-pipe-party="${id}"] text`)].find((t) => t.textContent === name) as Element;
    const swapName = fontPxOf(swap.svg, nameText(swapMotion, "alice", "Alice"));
    expect(swapName, "見本 swap の名前の字の大きさ").toBeDefined();
    for (const id of ["alice", "agg", "pool3", "bob"]) {
      const p = partyOf(layout, id);
      expect(fontPxOf(svg, nameText(motion, id, p.name)), `${id} の名前の字の大きさが見本 swap と違う`).toBe(swapName);
    }
    const swapNumber = levelOf(swap.layout, "alice", "USDC", 0).text.h;
    for (const [party, token] of [
      ["alice", "USDC"],
      ["pool3", "WETH"],
      ["bob", "WETH"],
    ] as const)
      expect(levelOf(layout, party, token, 0).text.h, `${party} の ${token} の数の字の大きさが見本 swap と違う`).toBeCloseTo(swapNumber, 6);
    expect(swapNumber, "見本 swap の槽の下の数の字の高さ").toBeGreaterThanOrEqual(24);
  });

  it("pipe-r6-final-step-draws-all-tanks", () => {
    const rendered = openedAggregator();
    const { layout } = rendered;
    const last = rendered.timeline.steps.length - 1;
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const [party, token] of [
      ["alice", "USDC"],
      ["router", "WETH"],
      ["bob", "WETH"],
    ] as const) {
      const glass = layout.glasses.find((g) => g.step === last && g.party === party && g.token === token);
      expect(glass, `最後の段に ${party} の ${token} の槽が無い`).toBeDefined();
      const tank = tankOf(layout, party, token);
      expect(inside(tank, { x: 0, y: 0, w: layout.width, h: layout.height }), `${party} の ${token} の槽が図の外にはみ出す`).toBe(true);
      levelOf(layout, party, token, last);
      expect(
        seen(motion, `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="${last}"]`, stillOf(rendered, last)),
        `最後の段に ${party} の ${token} の水が見えない`,
      ).toBeGreaterThan(0.9);
    }
  });

  it("pipe-default-palette-is-sea", () => {
    const palettes = draw("PALETTES");
    const sea = palettes.sea;
    expect(sea, "色味 sea が値の表に無い").toBeDefined();
    const source = exampleJson("swap.json");
    for (const theme of ["light", "dark"] as const) {
      // 色味を指定しない配管の図は sea で描く
      const plain = draw("renderDiagram")(source, { theme });
      expect(plain.palette, `色味を指定しない配管の図 (${theme}) の色味`).toBe("sea");
      const vars = figureVars(plain.svg);
      for (const key of ["bg", "ink", "c-blue", "c-amber", "c-green"]) expect(vars[key], `色味を指定しない配管の図 (${theme}) の ${key}`).toBe(sea?.[theme]?.[key]);
      // 色味を指定した時はその色味で描く
      const paper = draw("renderDiagram")(source, { theme, palette: "paper" });
      expect(paper.palette, `色味 paper を指定した配管の図 (${theme}) の色味`).toBe("paper");
      expect(figureVars(paper.svg)["c-blue"], `色味 paper を指定した配管の図 (${theme}) の c-blue`).toBe(palettes.paper?.[theme]?.["c-blue"]);
    }
    // 配管の図以外の図の既定の色味は変えない
    expect(draw("renderDiagram")(exampleJson("oauth.json")).palette, "配管の図以外の図の既定の色味").toBe("paper");
  });

  it("pipe-r6-parts-live-in-blocks", () => {
    const parts: [string, string[]][] = [
      ["hold", ["tank", "valuePipe", "tokenBox", "valve"]],
      ["check", ["gauge"]],
      ["calc", ["converter"]],
      ["write", ["plate"]],
      ["box", ["avatar", "cabinet"]],
    ];
    const pipe = repoText("packages/dragon/src/render/pipe.ts");
    expect(pipe, "packages/dragon/src/render/pipe.ts が無い").not.toBe("");
    for (const [block, names] of parts) {
      const path = `packages/dragon/src/blocks/${block}/draw.ts`;
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      // 部品はブロックの描き方が描き、配管の図の描き方はそれを呼んで組む
      for (const name of names) {
        expect(new RegExp(`export (?:function|const) ${name}\\b`, "u").test(text), `${path} が ${name} を描かない`).toBe(true);
        expect(
          new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "\\.\\./blocks/${block}/draw(?:\\.js)?"`, "u").test(pipe),
          `render/pipe.ts が blocks/${block}/draw.ts の ${name} を呼ばない`,
        ).toBe(true);
      }
    }
    // 色は値の表から読み、描き方の中に色の値を直接書かない
    for (const path of ["packages/dragon/src/render/pipe.ts", ...parts.map(([block]) => `packages/dragon/src/blocks/${block}/draw.ts`)]) {
      const code = repoText(path).replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gmu, "");
      const literal = /#[0-9a-fA-F]{3,8}\b(?![\w-])|\brgba?\(/u.exec(code.replace(/url\(#[\w-]+\)|href="#[\w-]+"|`#\$\{[^}]*\}`/gu, ""));
      expect(literal?.[0], `${path} に色の値が直接書かれている`).toBeUndefined();
    }
  });
});
