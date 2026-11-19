/**
 * 配管の図の検査 (#3389) が共有する図の材料と、置き場所の型と、描く関数と測る関数。
 * 検査の file は 1 回の実行の上限 (5 分) に収まるよう、組ごとの 3 つの file に分けた (#3738)。原本の形と描いた図の置き場所の説明は `pipe-diagram.test.ts` の頭が持つ
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import type { Json } from "./diagram-support";
import type { Motion } from "./motion-support";
import { draw, type Rect, type Rendered } from "./render-support";
import "../src/kind-use/pipe";

export const ROOT = process.cwd();
export const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** 見本 6 組の名前 (交換の成功、交換の取り消し、2回の交換、内側だけの取り消し、storage とイベントと ETH と delegatecall と staticcall、大きな Trace) */
export const SAMPLES = ["swap", "swap-revert", "swap-two-hops", "swap-retry", "vault-proxy", "aggregator"] as const;
/** 戻り値の札を見る見本と言葉の組。全ての組を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3733) */
export const RETURN_CASES = SAMPLES.flatMap((name) => (["ja", "en"] as const).map((lang) => ({ name, lang, label: `${name} ${lang}` })));

/** 配管の図だけが読む行の頭の語 */
export const PIPE_WORDS = ["hold", "move", "write", "check", "return", "revert", "emit", "calc"] as const;

/** 仮名と漢字 */
export const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 流れた分の線の太さ。中心がこれより近い平行な線は重なって見える */
export const FLOW_WIDTH = 4;

/** 0 より多い量の水位の下限として、目で見える高さ */
export const BAND_LEAST = 4;

export type Point = [number, number];
export type Writing = Rect & { text: string };
export type State = "none" | "provisional" | "final" | "rolled";

export interface Party extends Rect {
  id: string;
  name: string;
  role: string;
  icon?: string;
  /** 名札の形 (#3398)。`round` は丸の名札、`cabinet` は Contract の箱、`token` はトークンの箱 */
  shape?: string;
  /** 名札の行 (#3398)。一番上が 0。トークンの箱は持たない */
  row?: number;
  /** 名前の字。丸の名札は丸の下、箱は箱の中に書く */
  label?: Writing;
}
export interface Column extends Rect {
  party: string;
  step: number;
  folded: boolean;
}
export interface Tank extends Rect {
  party: string;
  token: string;
  title: Writing;
}
export interface Level extends Rect {
  party: string;
  token: string;
  step: number;
  amount: string;
  state: State;
  text: Writing;
  was?: Writing;
  /** 残高の下の増えた分か減った分 (#3418) */
  delta?: Writing;
  /** 前の量の消し線 (#3398) */
  strike?: Rect;
  /** 槽の下の数に添える暫定か確定の語 (#3398) */
  tag?: Writing;
}
export interface Bus {
  token: string;
  y: number;
  x1: number;
  x2: number;
  valve?: { party: string; x: number; y?: number };
  /** 値の管の通し方 (#3398)。`side` は隣の槽の横を結ぶ管、`main` は槽の上に通す本管 */
  mode?: string;
}
/** 同じ関係者から出る呼び出しの本管と、呼ぶ相手ごとの枝 (#3398) */
export interface Main {
  from: string;
  points: Point[];
  branches: { to: string; points: Point[]; valve: { x: number; y: number } }[];
}
/** 段ごとの吹き出し (#3398)。`kind` はその段の動きの種類、`text` は大きな字 */
export interface Callout extends Rect {
  step: number;
  kind: string;
  tag?: Writing;
  text: Writing;
}
export interface Flow {
  step: number;
  token: string;
  from: string;
  to: string;
  amount: string;
  state: State;
  points: Point[];
}
export interface Call {
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
export interface Return extends Writing {
  step: number;
  event: number;
  call: number;
}
export interface Plate extends Rect {
  party: string;
  name: string;
  step: number;
  value: string;
  state: State;
  text: Writing;
  was?: Writing;
  strike?: Rect;
}
export interface Write {
  step: number;
  event: number;
  from: string;
  to: string;
  name: string;
  points: Point[];
}
export interface Gauge extends Rect {
  party: string;
  step: number;
  event: number;
  ok: boolean;
  /** 計器を載せる管 (#3398)。`value` は値の管、`call` は呼び出しの管 */
  on?: string;
  /** 値の管の計器の上に書く式。確かめた段の後だけ持つ */
  read?: Rect & { text: string };
}
export interface CheckMark extends Rect {
  step: number;
  event: number;
  ok: boolean;
}
export interface EventChip extends Rect {
  party: string;
  name: string;
  step: number;
  emitted: number;
  state: State;
  text: Writing;
  args?: Writing;
}
export interface Converter extends Rect {
  party: string;
  step: number;
  calc: number;
  in: string;
  out: string;
  rate: string;
  /** その段で計算したか (#3398) */
  active?: boolean;
}
export interface Fold extends Rect {
  call: number;
  step: number;
  steps: number;
  parties: number;
  text: Writing;
}

export interface PipeLayout {
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

export interface PipeRendered extends Omit<Rendered, "layout"> {
  layout: PipeLayout;
}

export interface SourceEvent {
  type: string;
  box?: string;
  from?: string;
  to?: string;
}
export interface Hold {
  box: string;
  amount?: string;
  token?: string;
  name?: string;
  value?: string;
}
export interface Source {
  kind: string;
  title: string;
  blocks: { box?: { id: string; name: string }[]; hold?: Hold[] };
  steps: { title: string; body: string; events: SourceEvent[] }[];
}

// ---- 原本を組む道具

export const box = (id: string, name: string, icon?: string): Json => ({ id, name, ...(icon ? { icon } : {}) });
export const bal = (owner: string, amount: string, token: string): Json => ({ box: owner, amount, token });
export const val = (owner: string, name: string, value: string): Json => ({ box: owner, name, value });
export const call = (from: string, to: string, label: string, marks: { value?: string; call?: string; fold?: boolean } = {}): Json => ({
  type: "call",
  from,
  to,
  label,
  ...marks,
});
export const ret = (who: string, value: string): Json => ({ type: "return", box: who, value });
export const rev = (who: string, reason: string): Json => ({ type: "revert", box: who, reason });
export const move = (who: string, amount: string, from: string, to: string): Json => ({ type: "move", box: who, amount, from, to });
export const write = (who: string, name: string, value: string): Json => ({ type: "write", box: who, name, value });
export const check = (who: string, left: string, op: string, right: string, fail = false): Json => ({
  type: "check",
  box: who,
  left,
  op,
  right,
  ...(fail ? { fail: true } : {}),
});
export const emit = (who: string, name: string, args?: string[]): Json => ({ type: "emit", box: who, name, ...(args ? { args } : {}) });
export const calc = (who: string, input: string, output: string): Json => ({ type: "calc", box: who, in: input, out: output });
export const stepOf = (title: string, events: Json[]): Json => ({ title, body: `${title}。`, events });
export const pipeOf = (title: string, boxes: Json[], holds: Json[], steps: Json[]): Json => ({
  version: 2,
  kind: "pipe",
  title,
  blocks: { box: boxes, ...(holds.length > 0 ? { hold: holds } : {}) },
  steps,
});

/** 全ての語と印を 1 度ずつ使う図 */
export function fullPipe(): Json {
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
export function kindsPipe(): Json {
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
export function callKindsPipe(): Json {
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
export function movePipe(): Json {
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

/** 内側の呼び出しだけが落ち、呼んだ側が受け止めて続ける図。Pool1 の内側の変更だけが元に戻る */
export function innerPipe(): Json {
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
export function foldPipe(): Json {
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
export const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の原本の JSON。無ければ落とす */
export function exampleJson(name: string): Json {
  const text = fileText(name);
  expect(text, `${name} が packages/dragon/examples に無い`).toBeDefined();
  return JSON.parse(text ?? "{}") as Json;
}

/** repo の file の中身。無ければ空 */
export const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 描いた配管の図。`width` は描く枠の幅、`open` は開いた `[fold]` の呼び出しの番号。描けなければ断りの文を名指して落とす */
export function render(diagram: Json, lang?: "ja" | "en", width?: number, open?: number[]): PipeRendered {
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

export const partyOf = (layout: PipeLayout, id: string): Party => {
  const found = layout.parties.find((p) => p.id === id);
  expect(found, `関係者 ${id} が並べた図に無い`).toBeDefined();
  return found as Party;
};

export const levelOf = (layout: PipeLayout, party: string, token: string, step: number): Level => {
  const found = layout.levels.find((l) => l.party === party && l.token === token && l.step === step);
  expect(found, `段 ${step + 1} の ${party} の ${token} の水位が並べた図に無い`).toBeDefined();
  return found as Level;
};

export const tankOf = (layout: PipeLayout, party: string, token: string): Tank => {
  const found = layout.tanks.find((t) => t.party === party && t.token === token);
  expect(found, `${party} の ${token} の槽が並べた図に無い`).toBeDefined();
  return found as Tank;
};

export const plateOf = (layout: PipeLayout, party: string, name: string, step: number): Plate => {
  const found = layout.plates.find((p) => p.party === party && p.name === name && p.step === step);
  expect(found, `段 ${step + 1} の ${party} の ${name} の値の札が並べた図に無い`).toBeDefined();
  return found as Plate;
};

export const callAt = (layout: PipeLayout, index: number): Call => {
  const found = layout.calls.find((c) => c.index === index);
  expect(found, `${index + 1} 番目の呼び出しの管が並べた図に無い`).toBeDefined();
  return found as Call;
};

export const center = (r: Rect): number => r.x + r.w / 2;
export const within = (x: number, r: Rect): boolean => x >= r.x - 1e-6 && x <= r.x + r.w + 1e-6;
export const lastStep = (d: Json): number => (d as unknown as Source).steps.length - 1;

/** 段 `step` の止め絵の時刻 */
export const stillOf = (rendered: PipeRendered, step: number): number => rendered.timeline.stills[step] ?? Number.NaN;

/** 部品の見える濃さ。動きの濃さに、部品と包む部品の `opacity` の属性も掛ける */
export function seenOf(motion: Motion, el: Element, t: number): number {
  let o = motion.opacity(el, t);
  for (let e: Element | null = el; e; e = e.parentElement) {
    const attr = e.getAttribute("opacity");
    if (attr !== null) o *= Number(attr);
  }
  return o;
}

/** 描いた図の部品。無ければ落とす */
export function partsOf(motion: Motion, selector: string): Element[] {
  const found = [...motion.doc.querySelectorAll(selector)];
  expect(found.length, `描いた図に ${selector} の部品が無い`).toBeGreaterThan(0);
  return found;
}

/** `selector` に合う部品のうち、時刻 `t` に最も濃く見える物の濃さ。無ければ 0 */
export const seen = (motion: Motion, selector: string, t: number): number =>
  Math.max(0, ...[...motion.doc.querySelectorAll(selector)].map((el) => seenOf(motion, el, t)));

/** `svg` の `<style>` の規則のうち、部品の class に当たる規則の中身 */
export const classRules = (svg: string, el: Element): string[] =>
  [...el.classList].flatMap((cls) => [...svg.matchAll(new RegExp(`\\.${cls.replace(/[^\w-]/gu, "\\$&")}\\{([^}]*)\\}`, "gu"))].map((m) => m[1] ?? ""));

/** 部品の色の役 (`blue` など)。部品から包む部品へ、stroke と fill の属性、style の `--c`、class の規則の順に読む */
export function roleOf(svg: string, el: Element): string | undefined {
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
export const dashed = (svg: string, el: Element): boolean =>
  el.getAttribute("stroke-dasharray") !== null ||
  /stroke-dasharray:\s*[\d.]/u.test(el.getAttribute("style") ?? "") ||
  classRules(svg, el).some((rule) => /stroke-dasharray:\s*[\d.]/u.test(rule));

/** 部品の線の太さ。部品から包む部品へ、属性、style、class の規則の順に読む */
export function strokeWidthOf(svg: string, el: Element): number | undefined {
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
export const hatched = (svg: string, el: Element): boolean =>
  [el, ...el.querySelectorAll("*")].some(
    (e) =>
      /url\(#/u.test(`${e.getAttribute("fill") ?? ""} ${e.getAttribute("stroke") ?? ""} ${e.getAttribute("style") ?? ""}`) ||
      classRules(svg, e).some((rule) => /(?:fill|stroke):\s*url\(#/u.test(rule)),
  );

/** 原本の始めの残高と値。鍵は `<持ち主>|<トークンか名前>` */
export function initialsOf(d: Source): Map<string, string> {
  return new Map((d.blocks.hold ?? []).map((h) => [`${h.box}|${h.token ?? h.name ?? ""}`, h.amount ?? h.value ?? ""]));
}

/** 原本の関係者と始めの値と段と段ごとの出来事の数 */
export const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  parties: (d.blocks.box ?? []).length,
  holds: (d.blocks.hold ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

export const SAMPLE_FILES = SAMPLES.flatMap((name) => [`${name}.dragon`, `${name}.en.dragon`]);
export const SAMPLE_JSON = SAMPLES.flatMap((name) => [`${name}.json`, `${name}.en.json`]);
export const langOf = (file: string): "ja" | "en" => (file.includes(".en.") ? "en" : "ja");


// ---- 第6回の試作の形 (#3398)

/** 点 `p` が折れ線 `points` の上 (`tol` px 以内) に在るか */
export function onPath(p: Point, points: Point[], tol = 1.5): boolean {
  return points.slice(1).some((b, i) => {
    const a = points[i] as Point;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len));
    return Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]) <= tol;
  });
}

/** 縦と横の折れ線 `points` の始まりから、線の上の点 `p` までの道のりの長さ。線の上に無い点は線の長さ */
export function alongPath(p: Point, points: Point[], tol = 1.5): number {
  let walked = 0;
  for (const [i, b] of points.slice(1).entries()) {
    const a = points[i] as Point;
    if (onPath(p, [a, b], tol)) return walked + Math.hypot(p[0] - a[0], p[1] - a[1]);
    walked += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return walked;
}

/** 四角 `inner` が四角 `outer` の中に在るか */
export const inside = (inner: Rect, outer: Rect, tol = 0.5): boolean =>
  inner.x >= outer.x - tol && inner.y >= outer.y - tol && inner.x + inner.w <= outer.x + outer.w + tol && inner.y + inner.h <= outer.y + outer.h + tol;

/** 部品か中の部品のどれかが、時刻 `t0` と `t1` で性質 `prop` の値を変えるか */
export const changes = (motion: Motion, el: Element, prop: string, t0: number, t1: number): boolean =>
  [el, ...el.querySelectorAll("*")].some((e) => JSON.stringify(motion.value(e, prop, t0)) !== JSON.stringify(motion.value(e, prop, t1)));

/** 部品か、それを包む部品の性質 `prop` が、時刻 `t0` と `t1` で違うか。移す額の札は包む部品が動きを持つ (Tracelyth #168、#3720) */
export const movesWith = (motion: Motion, el: Element, prop: string, t0: number, t1: number): boolean => {
  for (let e: Element | null = el; e; e = e.parentElement) if (JSON.stringify(motion.value(e, prop, t0)) !== JSON.stringify(motion.value(e, prop, t1))) return true;
  return false;
};

/**
 * 段 `s` で、移す額の札 (`dg-pp-coin`) が段の始まりから止め絵までの間に動き、その間に見えるか (Tracelyth #168、#3720)。
 * 札は流れた段の外では動かないので、2 つの時刻で動きを比べ、見えるかは 0.25 秒ごとに測る
 */
export function coinMoves(rendered: PipeRendered, motion: Motion, s: number): boolean {
  const start = rendered.timeline.steps[s]?.start ?? Number.NaN;
  const still = stillOf(rendered, s);
  const times: number[] = [];
  for (let t = start; t <= still; t += 0.25) times.push(t);
  return partsOf(motion, ".dg-pp-coin").some((el) => movesWith(motion, el, "transform", start, still) && times.some((t) => seenOf(motion, el, t) > 0.5));
}

/** 見本 aggregator の箱を全て開き、幅 1200 の枠で描いた図 */
export const openedAggregator = (lang: "ja" | "en" = "ja"): PipeRendered => render(exampleJson(lang === "ja" ? "aggregator.json" : "aggregator.en.json"), lang, 1200, [2]);

/** 折れ線の線分 */
export const segmentsOf = (points: Point[]): [Point, Point][] => points.slice(1).map((b, i) => [points[i] as Point, b]);
