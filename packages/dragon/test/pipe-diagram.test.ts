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
 * - `folds`: `[fold]` の呼び出しを畳んだ箱。`steps` は内側の段の数、`parties` は内側の関係者の数
 *   (内側の段は畳んだ呼び出しを開いた段の次の段から閉じた段の前の段まで。内側の関係者は、内側の段で呼ぶか呼ばれるか行の頭に名指された者のうち、畳んだ呼び出しの両端を除く)
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
import { covers, draw, figureClass, gap, type Rect, type Rendered, sampleTimes } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** 見本 6 組の名前 (交換の成功、交換の取り消し、2回の交換、内側だけの取り消し、storage とイベントと ETH と delegatecall と staticcall、大きな Trace) */
const SAMPLES = ["swap", "swap-revert", "swap-two-hops", "swap-retry", "vault-proxy", "aggregator"] as const;

/** 配管の図だけが読む行の頭の語 */
const PIPE_WORDS = ["hold", "move", "write", "check", "return", "revert", "emit", "calc"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 畳んだ列の幅の上限 */
const STRIP_MOST = 24;

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
}
interface Bus {
  token: string;
  y: number;
  x1: number;
  x2: number;
  valve?: { party: string; x: number };
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

/** 宣言の順と出てくる順が違う図。出てくる順は alice、router、usdc、pool、weth、bob */
function orderPipe(): Json {
  return pipeOf(
    "出てきた順",
    [box("bob", "Bob"), box("weth", "WETH"), box("pool", "Pool"), box("usdc", "USDC"), box("router", "Router"), box("alice", "Alice")],
    [bal("pool", "2000", "USDC"), bal("pool", "10", "WETH"), bal("alice", "1000", "USDC"), bal("bob", "0", "WETH"), bal("alice", "2", "ETH"), bal("router", "0", "ETH")],
    [
      stepOf("頼む", [call("alice", "router", "交換", { value: "1" })]),
      stepOf("移す", [call("router", "usdc", "移す"), move("usdc", "100", "alice", "pool"), ret("usdc", "true")]),
      stepOf("払う", [call("router", "pool", "交換"), call("pool", "weth", "送る"), move("weth", "0.05", "pool", "bob"), ret("weth", "true"), ret("pool", "0.05 WETH")]),
      stepOf("終える", [ret("router", "0.05 WETH")]),
    ],
  );
}

/** 呼び出しが深くなり、呼ばれた者が呼んだ者を呼び返す図 */
function lanesPipe(): Json {
  return pipeOf(
    "呼び出しの深さ",
    [box("alice", "Alice"), box("router", "Router"), box("pool", "Pool"), box("usdc", "USDC")],
    [bal("alice", "100", "USDC"), bal("pool", "0", "USDC")],
    [
      stepOf("頼む", [call("alice", "router", "交換")]),
      stepOf("交換を頼む", [call("router", "pool", "交換")]),
      stepOf("呼び返す", [call("pool", "router", "callback")]),
      stepOf("払う", [call("router", "usdc", "払う"), move("usdc", "100", "alice", "pool"), ret("usdc", "true")]),
      stepOf("呼び返しが戻る", [ret("router", "払った")]),
      stepOf("Poolが戻る", [ret("pool", "0.05 WETH")]),
      stepOf("終える", [ret("router", "0.05 WETH")]),
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

/** 6 つの比べ方の数の確認と、数でない確認を持つ図。`ok` は dragon が決める結果 */
const CHECKS: { left: string; op: string; right: string; fail?: boolean; ok: boolean }[] = [
  { left: "5", op: ">=", right: "5", ok: true },
  { left: "4", op: "<=", right: "3", ok: false },
  { left: "0.05 WETH", op: ">", right: "0.04 WETH", ok: true },
  { left: "1", op: "<", right: "1", ok: false },
  { left: "2", op: "==", right: "2.0", ok: true },
  { left: "3", op: "!=", right: "3", ok: false },
  { left: "owner", op: "==", right: "alice", ok: true },
  { left: "owner", op: "==", right: "bob", fail: true, ok: false },
];
function checkPipe(): Json {
  return pipeOf(
    "確認",
    [box("alice", "Alice"), box("guard", "Guard")],
    [],
    [
      stepOf("頼む", [call("alice", "guard", "確かめる")]),
      ...CHECKS.map((c, i) => stepOf(`確かめる${i + 1}`, [check("guard", c.left, c.op, c.right, c.fail)])),
      stepOf("終える", [ret("guard", "ok")]),
    ],
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

/** 換算して、ほかの者の確認を挟み、同じ者が確認する図 */
function calcPipe(): Json {
  return pipeOf(
    "換算",
    [box("alice", "Alice"), box("router", "Router"), box("pool", "Pool")],
    [],
    [
      stepOf("頼む", [call("alice", "router", "交換")]),
      stepOf("交換を頼む", [call("router", "pool", "交換")]),
      stepOf("換算する", [calc("pool", "100 USDC", "0.05 WETH")]),
      stepOf("ほかの者が確かめる", [check("router", "1", "==", "1")]),
      stepOf("同じ者が確かめる", [check("pool", "0.05 WETH", ">=", "0.04 WETH")]),
      stepOf("Poolが戻る", [ret("pool", "0.05 WETH")]),
      stepOf("終える", [ret("router", "0.05 WETH")]),
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

/** 関係者 15 人の図。段 1 で p00 が p01 を呼び、段 2 から段 14 で p01 が 1 人ずつ呼んで戻させる */
const CROWD = Array.from({ length: 15 }, (_, i) => `p${String(i).padStart(2, "0")}`);
function crowdPipe(): Json {
  const [first = "p00", second = "p01"] = CROWD;
  return pipeOf(
    "関係者の多い図",
    CROWD.map((id) => box(id, `Party${id.slice(1)}`)),
    [],
    [
      stepOf("頼む", [call(first, second, "頼む")]),
      ...CROWD.slice(2).map((id) => stepOf(`${id}を呼ぶ`, [call(second, id, "呼ぶ"), ret(id, "ok")])),
      stepOf("終える", [ret(second, "済み")]),
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

/** 描いた配管の図。`width` は描く枠の幅。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en", width?: number): PipeRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { ...(lang ? { lang } : {}), ...(width === undefined ? {} : { width }) });
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

  it("pipe-layout-places-parties-tanks-and-buses", () => {
    const rendered = render(orderPipe());
    const { layout } = rendered;
    // 関係者は出てきた順に左から 1 列に並ぶ
    expect(
      layout.parties.map((p) => p.id),
      "関係者の並び",
    ).toEqual(["alice", "router", "usdc", "pool", "weth", "bob"]);
    layout.parties.forEach((p, k) => {
      const next = layout.parties[k + 1];
      if (!next) return;
      expect(next.x, `${next.id} が ${p.id} の右に 10px 離れて並ばない`).toBeGreaterThanOrEqual(p.x + p.w + 10);
      expect(next.y, `${next.id} と ${p.id} の上の端が揃わない`).toBeCloseTo(p.y, 6);
    });
    // 残高を持つ関係者の列の下に、トークンごとの槽を置く
    expect(
      layout.tanks.map((t) => `${t.party}|${t.token}`).sort(),
      "槽の並び",
    ).toEqual(["alice|ETH", "alice|USDC", "bob|WETH", "pool|USDC", "pool|WETH", "router|ETH"]);
    for (const tank of layout.tanks) {
      const party = partyOf(layout, tank.party);
      expect(within(center(tank), columnOf(layout, tank.party, 0)), `${tank.party} の ${tank.token} の槽が持ち主の列に無い`).toBe(true);
      expect(tank.y, `${tank.party} の ${tank.token} の槽が名札の下に 10px 離れて無い`).toBeGreaterThanOrEqual(party.y + party.h + 10);
    }
    layout.tanks.forEach((a, i) => {
      for (const b of layout.tanks.slice(i + 1)) expect(apart(a, b), `${a.party} の ${a.token} と ${b.party} の ${b.token} の槽が 10px 離れない`).toBe(true);
    });
    // トークンごとに 1 本の管を引き、トークンの Contract の列の位置に弁を描く。ETH の管は弁を持たない
    expect(layout.buses.map((b) => b.token).sort(), "管のトークン").toEqual(["ETH", "USDC", "WETH"]);
    for (const bus of layout.buses) {
      const tanks = layout.tanks.filter((t) => t.token === bus.token);
      expect(bus.y, `${bus.token} の管が槽の下に無い`).toBeGreaterThan(Math.max(...tanks.map((t) => t.y + t.h)));
      expect(bus.x1, `${bus.token} の管が左の槽に届かない`).toBeLessThanOrEqual(Math.min(...tanks.map(center)));
      expect(bus.x2, `${bus.token} の管が右の槽に届かない`).toBeGreaterThanOrEqual(Math.max(...tanks.map(center)));
    }
    for (const [token, party] of [
      ["USDC", "usdc"],
      ["WETH", "weth"],
    ] as const) {
      const bus = layout.buses.find((b) => b.token === token);
      expect(bus?.valve?.party, `${token} の管の弁`).toBe(party);
      expect(Math.abs((bus?.valve?.x ?? Number.NaN) - center(partyOf(layout, party))), `${token} の弁が ${party} の列に無い`).toBeLessThan(1);
    }
    expect(layout.buses.find((b) => b.token === "ETH")?.valve, "ETH の管が弁を持つ").toBeUndefined();
    // [value: 1 ETH] を付けた段で、呼んだ者の ETH の槽から呼ばれた者の ETH の槽へ移る
    expect(levelOf(layout, "alice", "ETH", 0).amount, "段 1 の Alice の ETH").toBe("1");
    expect(levelOf(layout, "router", "ETH", 0).amount, "段 1 の Router の ETH").toBe("1");
    expect(
      layout.flows.filter((f) => f.step === 0).map((f) => ({ token: f.token, from: f.from, to: f.to, amount: f.amount })),
      "段 1 に ETH の管を流れた分",
    ).toEqual([{ token: "ETH", from: "alice", to: "router", amount: "1" }]);

    // 2 回の交換の図も同じ決まりで並び、どの段でも関係者と槽と字が 10px 以上離れる
    for (const [file, lang] of [
      ["swap-two-hops.json", "ja"],
      ["swap-two-hops.en.json", "en"],
      ["swap.json", "ja"],
    ] as const) {
      const source = exampleJson(file);
      const drawn = render(source, lang).layout;
      expect(
        drawn.parties.map((p) => p.id),
        `${file} の関係者の並び`,
      ).toEqual(((source as unknown as Source).blocks.box ?? []).map((b) => b.id));
      for (let s = 0; s <= lastStep(source); s++) {
        const parts: [string, string, Rect][] = [
          ...drawn.parties.map((p): [string, string, Rect] => [`名札 ${p.id}`, `party:${p.id}`, p]),
          ...drawn.tanks.flatMap((t): [string, string, Rect][] => [
            [`${t.party} の ${t.token} の槽`, `tank:${t.party}|${t.token}`, t],
            [`${t.party} の ${t.token} の槽の名前`, `tank:${t.party}|${t.token}`, t.title],
          ]),
          ...drawn.levels
            .filter((l) => l.step === s)
            .flatMap((l): [string, string, Rect][] => [
              [`${l.party} の ${l.token} の量`, `tank:${l.party}|${l.token}`, l.text],
              ...(l.was ? [[`${l.party} の ${l.token} の前の量`, `tank:${l.party}|${l.token}`, l.was] as [string, string, Rect]] : []),
            ]),
          ...drawn.plates.filter((p) => p.step === s).map((p): [string, string, Rect] => [`${p.party} の ${p.name} の札`, `plate:${p.party}|${p.name}`, p]),
        ];
        parts.forEach(([a, ka, ra], i) => {
          for (const [b, kb, rb] of parts.slice(i + 1)) if (ka !== kb) expect(apart(ra, rb), `${file} の段 ${s + 1} で ${a} と ${b} が 10px 離れない`).toBe(true);
        });
      }
    }
  });

  it("pipe-call-lanes-follow-depth", () => {
    const rendered = render(lanesPipe());
    const { layout, svg } = rendered;
    expect(
      layout.calls.map((c) => [c.index, c.from, c.to, c.depth]),
      "呼び出しの管と深さ",
    ).toEqual([
      [0, "alice", "router", 0],
      [1, "router", "pool", 1],
      [2, "pool", "router", 2],
      [3, "router", "usdc", 3],
    ]);
    // 深くなるごとに 1 段下げ、どの管も関係者の名札の上を走る
    const pillTop = Math.min(...layout.parties.map((p) => p.y));
    const lanes = [...layout.calls].sort((a, b) => a.depth - b.depth);
    lanes.forEach((c, k) => {
      expect(c.y, `${c.from} から ${c.to} の管が名札の上に無い`).toBeLessThan(pillTop);
      const next = lanes[k + 1];
      if (next) expect(next.y, `深さ ${next.depth} の管が深さ ${c.depth} の管より下に無い`).toBeGreaterThan(c.y);
      // 呼んだ者の名札から出て、呼ばれた者の名札へ入る
      const [x0] = c.points[0] ?? [Number.NaN];
      const [x1, y1] = c.points[c.points.length - 1] ?? [Number.NaN, Number.NaN];
      expect(within(x0, partyOf(layout, c.from)), `${c.from} から ${c.to} の管が呼んだ者の名札から出ない`).toBe(true);
      expect(within(x1, partyOf(layout, c.to)), `${c.from} から ${c.to} の管が呼ばれた者の名札へ入らない`).toBe(true);
      expect(y1, `${c.from} から ${c.to} の管が呼ばれた者の名札の上の端で止まらない`).toBeLessThanOrEqual(partyOf(layout, c.to).y + 1);
    });
    // 呼び返しは戻りではない。Pool への呼び出しは呼び返しの段でも開いたまま
    expect(
      layout.calls.map((c) => c.close && [c.close.step, c.close.how]),
      "呼び出しを閉じた段と閉じ方",
    ).toEqual([
      [6, "return"],
      [5, "return"],
      [4, "return"],
      [3, "return"],
    ]);
    // return の段で、戻る値を札にしてその管の上に出す
    const label = layout.returns.find((r) => r.step === 4);
    expect(label?.text, "段 5 の戻る値の札").toBe("払った");
    expect(label?.call, "段 5 の戻る値の札が閉じた呼び出し").toBe(2);
    const back = callAt(layout, 2);
    expect((label?.y ?? Number.NaN) + (label?.h ?? 0), "戻る値の札が管の上に無い").toBeLessThanOrEqual(back.y);
    const xs = back.points.map(([x]) => x);
    expect(center(label ?? { x: Number.NaN, y: 0, w: 0, h: 0 }), "戻る値の札が管の横の範囲に無い").toBeGreaterThanOrEqual(Math.min(...xs));
    expect(center(label ?? { x: Number.NaN, y: 0, w: 0, h: 0 }), "戻る値の札が管の横の範囲に無い").toBeLessThanOrEqual(Math.max(...xs));
    // 開いている間は呼び出しの色の実線、閉じた後は点線
    const motion = motionFrom(rendered as unknown as Rendered);
    const openSel = '[data-pipe-call="1"][data-pipe-pipe="open"]';
    const closedSel = '[data-pipe-call="1"][data-pipe-pipe="closed"]';
    const opens = partsOf(motion, openSel);
    const closes = partsOf(motion, closedSel);
    expect(
      opens.some((el) => roleOf(svg, el) === "blue"),
      "開いている呼び出しの管が呼び出しの色 (c-blue) でない",
    ).toBe(true);
    expect(
      opens.every((el) => !dashed(svg, el) || el.getAttribute("pathLength") !== null),
      "開いている呼び出しの管が点線",
    ).toBe(true);
    expect(
      closes.some((el) => dashed(svg, el)),
      "閉じた呼び出しの管が点線でない",
    ).toBe(true);
    for (let s = 1; s <= 4; s++) {
      expect(seen(motion, openSel, stillOf(rendered, s)), `段 ${s + 1} に Pool への呼び出しの管が見えない`).toBeGreaterThan(0.9);
      expect(seen(motion, closedSel, stillOf(rendered, s)), `段 ${s + 1} に閉じた後の点線が見える`).toBeLessThan(0.1);
    }
    for (const s of [5, 6]) {
      expect(seen(motion, closedSel, stillOf(rendered, s)), `段 ${s + 1} に閉じた後の点線が見えない`).toBeGreaterThan(0.9);
      expect(seen(motion, openSel, stillOf(rendered, s)), `段 ${s + 1} に閉じた呼び出しの実線が見える`).toBeLessThan(0.1);
    }
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
    expect([after.alice.amount, after.alice.was?.text, after.pool.amount, after.pool.was?.text], "move の段の量と前の量").toEqual(["900", "1000", "2100", "2000"]);
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
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const s of [1, 2]) {
      const sel = `[data-pipe-flow][data-pipe-step="${s}"]`;
      expect(seen(motion, sel, stillOf(rendered, s)), `段 ${s + 1} に流れた分が見えない`).toBeGreaterThan(0.9);
      expect(
        partsOf(motion, sel).some((el) => hatched(svg, el)),
        `段 ${s + 1} の流れた分が斜線でない`,
      ).toBe(true);
    }
    const poolAt = (s: number): string => `[data-pipe-level="pool"][data-pipe-token="USDC"][data-pipe-step="${s}"]`;
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

  it("pipe-check-compares-numbers", () => {
    const rendered = render(checkPipe());
    const { layout } = rendered;
    const steps = CHECKS.map((_, i) => i + 1);
    // 両側が数の確認は dragon が比べ、数でない確認は [fail] があれば落ちる。計器はその段だけ行う者の列に描く
    expect(
      layout.gauges.map((g) => [g.step, g.party, g.ok]),
      "計器と結果",
    ).toEqual(steps.map((s, i) => [s, "guard", CHECKS[i]?.ok]));
    for (const g of layout.gauges)
      expect(within(center(g), columnOf(layout, "guard", g.step)), `段 ${g.step + 1} の計器が Guard の列に無い`).toBe(true);
    // 段の後は計器を消し、行う者の印と図の上の確認の印に結果を残す
    const last = steps.length + 1;
    expect(
      layout.lamps.filter((l) => l.step === last).map((l) => [l.party, l.ok]),
      "最後の段の Guard の確認の印",
    ).toEqual(CHECKS.map((c) => ["guard", c.ok]));
    expect(
      layout.lamps.filter((l) => l.step === 1).map((l) => l.ok),
      "段 2 の Guard の確認の印",
    ).toEqual([true]);
    expect(
      layout.checks.filter((c) => c.step === last).map((c) => c.ok),
      "最後の段の図の上の確認の印",
    ).toEqual(CHECKS.map((c) => c.ok));
    const pillTop = Math.min(...layout.parties.map((p) => p.y));
    for (const mark of layout.checks) expect(mark.y + mark.h, `段 ${mark.step + 1} の確認の印が図の上に無い`).toBeLessThan(pillTop);
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const s of steps) {
      const sel = `[data-pipe-gauge="guard"][data-pipe-step="${s}"]`;
      expect(seen(motion, sel, stillOf(rendered, s)), `段 ${s + 1} の計器が見えない`).toBeGreaterThan(0.9);
      expect(seen(motion, sel, stillOf(rendered, s + 1)), `段 ${s + 1} の計器が次の段に残る`).toBeLessThan(0.1);
    }
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

  it("pipe-calc-shows-converter", () => {
    const rendered = render(calcPipe());
    const { layout } = rendered;
    // calc の段で行う者の列の下に、入る値と出る値と比率の換算の札を出し、同じ者の次の check の段まで残す
    expect(
      layout.converters.map((c) => [c.step, c.party, c.calc, c.in, c.out, c.rate]),
      "換算の札",
    ).toEqual([2, 3, 4].map((s) => [s, "pool", 2, "100 USDC", "0.05 WETH", "×0.0005"]));
    const pool = partyOf(layout, "pool");
    for (const c of layout.converters) {
      expect(within(center(c), columnOf(layout, "pool", c.step)), `段 ${c.step + 1} の換算の札が Pool の列に無い`).toBe(true);
      expect(c.y, `段 ${c.step + 1} の換算の札が Pool の名札の下に無い`).toBeGreaterThanOrEqual(pool.y + pool.h);
    }
    const motion = motionFrom(rendered as unknown as Rendered);
    const sel = '[data-pipe-converter="pool"][data-pipe-step="2"]';
    expect(seen(motion, sel, stillOf(rendered, 2)), "calc の段の換算の札が見えない").toBeGreaterThan(0.9);
    const written = [...(partsOf(motion, sel)[0]?.querySelectorAll("text") ?? [])].map((t) => t.textContent ?? "").join(" ");
    for (const want of ["100 USDC", "0.05 WETH", "×0.0005"]) expect(written, `描いた換算の札に ${want} が無い`).toContain(want);
    expect(seen(motion, '[data-pipe-converter="pool"]', stillOf(rendered, 5)), "確認の後の段に換算の札が残る").toBeLessThan(0.1);
    // 比率は出る値を入る値で割る。2 回の交換の図の 2 つ目は ×3200
    const hops = render(exampleJson("swap-two-hops.json")).layout;
    expect([...new Set(hops.converters.map((c) => c.rate))], "2 回の交換の図の換算の比率").toEqual(["×0.0005", "×3200"]);
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
  it("pipe-folds-idle-columns", () => {
    // 全員を同じ幅で並べると、幅 760 の枠に収めた名前が 10.5px に届かない
    const wide = render(crowdPipe());
    expect(draw("chooseView")(wide as unknown as Rendered, 760).textPx, "関係者 15 人を横に並べた形を 760px の枠に収めた字").toBeLessThan(10.5);
    expect(
      wide.layout.columns.filter((c) => c.folded),
      "枠の幅を渡さない図で列を畳む",
    ).toEqual([]);
    // 今の段に関わらない関係者の列を幅 24px 以下の帯に畳み、段が進むと関わる列だけを広げる
    const narrow = render(crowdPipe(), undefined, 760).layout;
    const [first = "", second = ""] = CROWD;
    for (let s = 0; s < CROWD.length - 1; s++) {
      const involved = s === 0 ? [first, second] : [second, CROWD[s + 1] ?? ""];
      for (const id of CROWD) {
        const column = columnOf(narrow, id, s);
        if (involved.includes(id)) {
          expect(column.folded, `段 ${s + 1} に関わる ${id} の列が畳まれる`).toBe(false);
          expect(column.w, `段 ${s + 1} に関わる ${id} の列が細い`).toBeGreaterThan(STRIP_MOST);
        } else {
          expect(column.folded, `段 ${s + 1} に関わらない ${id} の列が畳まれない`).toBe(true);
          expect(column.w, `段 ${s + 1} に関わらない ${id} の列の帯が ${STRIP_MOST}px より太い`).toBeLessThanOrEqual(STRIP_MOST);
        }
      }
    }
    // 名前が読める幅の枠では畳まない
    const swap = exampleJson("swap.json");
    const roomy = render(swap, undefined, 1440);
    expect(draw("chooseView")(roomy as unknown as Rendered, 1440).textPx, "交換の図を 1440px の枠に収めた字").toBeGreaterThanOrEqual(10.5);
    expect(
      roomy.layout.columns.filter((c) => c.folded),
      "名前が読める幅の枠で列を畳む",
    ).toEqual([]);
  });

  it("pipe-fold-collapses-inner-calls", () => {
    const source = foldPipe();
    const rendered = render(source);
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
    // 畳んだ箱の段では、内側の move をまとめて 1 段で槽に出す
    expect(
      [levelOf(layout, "alice", "USDC", 1).amount, levelOf(layout, "pool", "USDC", 1).amount, levelOf(layout, "pool", "WETH", 1).amount, levelOf(layout, "alice", "WETH", 1).amount],
      "畳んだ箱の前の段の槽",
    ).toEqual(["100", "0", "10", "0"]);
    const boxed = ["alice|USDC", "pool|USDC", "pool|WETH", "alice|WETH"].map((key) => {
      const [party = "", token = ""] = key.split("|");
      const level = levelOf(layout, party, token, 2);
      return [level.amount, level.state];
    });
    expect(boxed, "畳んだ箱の段の槽").toEqual([
      ["0", "provisional"],
      ["100", "provisional"],
      ["9", "provisional"],
      ["1", "provisional"],
    ]);
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
      folded?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(count(), "畳んだ箱を押しても内側の段を開かない").toBe(7);
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
