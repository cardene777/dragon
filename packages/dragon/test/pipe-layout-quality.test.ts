// @vitest-environment jsdom
/**
 * パイプ図の並べ方の崩れ (#3721)。
 *
 * Tracelythのカタログの図を全て撮って見直したところ、どのサンプルでも崩れが見つかった (cardene777/Tracelyth#185)。
 * ログの札が人と箱を隠し、図の上に何も描かない帯が残り、線どうしが重なって走り、線が槽の下から入って残高の字の上を通っていた。
 * この file は、親の課題 (#3718) で決めた並べ方を、描いた部品の位置から数えて確かめる。
 *
 * 人と箱の数を変えた図は、Tracelythがエディタとカタログの図に書く`layout auto`が選ぶ2つの形 (`top`と`bottom`) で描く。
 * 人と、トークンの箱とコントラクトの数は、境目の 1 と 8 と、その間の 3 を組み合わせる。
 * 部品の位置は置き場所 (`layout`) から読み、字の四角と見える時刻は、描く処理が崩れの確かめに渡す材料 (`findBreaks` の引数) から読む。
 * 数え方は検査の中に持ち、描く処理が持つ崩れの数え方 (`render/pipe-breaks.ts`) を使わない。数え方の誤りで両方が揃って見逃さないため。
 *
 * #3761 で、Tracelythがパッチで当てた並べ方を元にした。#3721 の仕組み (ログの札の帯、枠の外の入力と出力の札、通り道の予約、前の値の行、流れの矢じり) を
 * 確かめていた検査は、パッチの並べ方で同じ狙いを確かめる形に書き換え、Tracelythの図が描かない流れの矢じりの検査は外した。
 *
 * 図は入口 (`@cardenelabs/dragon` = `dist`) で描く。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "../src/core";
import { afterEach, describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import "../src/kind-use/pipe";
// 組み立てが本体に埋める共有のブロック集と絵柄集を、src を読む検査にも置く (#3763)
import "./built-globals";

/*
 * 崩れを数える部品と知らせる文の元の code を、検査の外で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで数秒かかる (#3410)
 */
const [{ findBreaks }, { describeBreak, checkLayoutText }, { PIPE_LOOK }, page, { FILL_NAME_PX, PIPE_FIRST, ZOOM }] = await Promise.all([
  import("../src/render/breaks"),
  import("../src/render/layout-check"),
  import("../src/look/pipe"),
  import("../src/export/page"),
  import("../src/look/values"),
]);

type Point = [number, number];
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Text extends Rect {
  text: string;
}
interface Party extends Rect {
  id: string;
  name: string;
  role: string;
  shape: "round" | "cabinet" | "token";
  label: Text;
}
interface Tank extends Rect {
  party: string;
  token: string;
  /** 槽の名前の字の箱 */
  title?: Rect;
}
interface Level {
  party: string;
  token: string;
  step: number;
  text: Text;
  delta?: Text;
  tag?: Text;
}
interface Port {
  party: string;
  token: string;
  side: "left" | "right" | "top" | "bottom";
  x: number;
  y: number;
}
interface ValuePipe {
  token: string;
  from: string;
  to: string;
  points: Point[];
  ports: [Port, Port];
}
interface Flow {
  step: number;
  token: string;
  from: string;
  to: string;
  points: Point[];
}
interface Plate extends Rect {
  party: string;
  name: string;
  step: number;
  boxed: boolean;
  row?: boolean;
  event?: number;
  text: Text;
  was?: Text;
  strike?: Rect;
  tag?: Text;
  /** 前の値に添える札 (「前」) */
  before?: Text;
}
interface Chip extends Rect {
  kind: string;
  text: string;
  step: number;
  party?: string;
  /** 入力と出力の札が付く槽のトークン */
  token?: string;
  /** 戻り値の札が伝う道。札は道の始まりに描き、道の終わりで止まる */
  path?: Point[];
}
interface Housing extends Rect {
  party: string;
}
interface Branch {
  to: string;
  points: Point[];
}
interface Main {
  from: string;
  branches: Branch[];
}
interface Link {
  step: number;
  from: string;
  to: string;
  name: string;
  points: Point[];
  label: Text;
  delta?: Text;
}
interface Write {
  step: number;
  to: string;
  name: string;
  points: Point[];
}
interface Pill {
  party: string;
  step: number;
  involved: boolean;
}
interface LogCard extends Rect {
  party: string;
  title: string;
  /** 札を発した段と、その段で発した順 */
  step?: number;
  event?: number;
  /** 札から発した箱へ結ぶ点線 */
  tether?: Point[];
}
interface CallCard extends Rect {
  call: string;
  shown: [number, number][];
}
interface PipeLayout {
  width: number;
  height: number;
  parties: Party[];
  tanks: Tank[];
  levels: Level[];
  valuePipes: ValuePipe[];
  flows: Flow[];
  plates: Plate[];
  chips: Chip[];
  housings: Housing[];
  mains: Main[];
  links: Link[];
  writes: Write[];
  pills: Pill[];
  fixed?: { shape: string; order: string[] };
  callCards?: CallCard[];
  logCards?: LogCard[];
}
interface Timeline {
  steps: { start: number; end: number }[];
  stills: number[];
  total: number;
}
type Shown = [number, number];
interface Ink {
  text: string;
  rect: Rect;
  shown: Shown[];
}
interface Drawn {
  inks: Ink[];
  stills: number[];
  frame: { w: number; h: number };
}
interface Rendered {
  svg: string;
  layout: PipeLayout;
  timeline: Timeline;
}
type Parsed = { ok: true; diagram: Record<string, unknown> } | { ok: false; errors: { line: number; message: string }[] };
interface Player {
  destroy(): void;
}
interface Api {
  parseNotation(text: string, options?: { lang?: string }): Parsed;
  renderDiagram(input: unknown, options?: Record<string, unknown>): Rendered;
  mountDiagram(host: HTMLElement, diagram: unknown, options?: Record<string, unknown>): Player;
}
const api = dragon as unknown as Api;

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
const exampleText = (file: string): string => readFileSync(join(EXAMPLES, file), "utf8");

// ---- 図を組む

const PEOPLE = ["alice", "bob", "carol", "dave", "erin", "frank", "grace", "heidi"];
const cap = (s: string): string => (s[0] ?? "").toUpperCase() + s.slice(1);
/** 40字を超える名前 */
const longName = (id: string): string => `${cap(id)}${"Treasury".repeat(5)}`;

interface GridOptions {
  layout?: string;
  long?: boolean;
  /** 1つの段で発するログの枚数 */
  logs?: number;
  /** `route` の行で渡す呼び出しの組 */
  routes?: [string, string][];
  /** 段を書く呼び出しの番号 (書かない時は全て) */
  only?: number[];
}
/**
 * 人を `n` 人、コントラクトとトークンの箱を `m` 個ずつ持つパイプ図。段 j は、人が j 番目のコントラクトを呼び、
 * コントラクトが値を書き換えて j 番目のトークンの `transferFrom` を呼び、トークンが次の人へ移ってログを発する
 */
function gridText(n: number, m: number, { layout, long = false, logs = 1, routes, only }: GridOptions = {}): string {
  const people = PEOPLE.slice(0, n);
  const contracts = Array.from({ length: m }, (_, i) => `router${i + 1}`);
  const tokens = Array.from({ length: m }, (_, i) => `tk${i + 1}`);
  const name = (id: string): string => (long ? longName(id) : id.toUpperCase());
  const lines = [`pipe 格子 ${n}人 ${m}箱`, ...(layout ? [`layout ${layout}`] : []), ...(routes ?? []).map(([a, b]) => `route ${a} -> ${b}`), ""];
  for (const id of [...people, ...contracts, ...tokens]) lines.push(`box ${id} as ${name(id)}`);
  lines.push("");
  people.forEach((p, i) => lines.push(`hold ${p}: ${tokens.map((t) => `${i === 0 ? 1000 : 10} ${name(t)}`).join(", ")}`));
  for (const c of contracts) lines.push(`hold ${c}: count 0`);
  lines.push("");
  tokens.forEach((t, j) => {
    if (only && !only.includes(j)) return;
    const from = people[j % n] as string;
    const to = people[(j + 1) % n] as string;
    const c = contracts[j] as string;
    lines.push(`step ${name(t)}を送る`, `  say ${from}が${c}を呼ぶ`, `  ${from} -> ${c}: run(amount: 5)`, `  write ${c}: count ${j + 1}`);
    lines.push(`  ${c} -> ${t}: transferFrom(from: ${from}, to: ${to}, amount: 5)`);
    if (from !== to) lines.push(`  move ${t}: 5 ${from} -> ${to}`);
    for (let k = 0; k < logs; k++) lines.push(`  emit ${t}: Transfer${k === 0 ? "" : k + 1}(from: ${from}, to: ${to}, amount: 5)`);
    lines.push(`  return ${t}: true`, `  return ${c}: ok`, "");
  });
  return lines.join("\n");
}

/**
 * 許可の値 (`allowance`) を2つ持つ図。値は持ち主と使う人を結ぶ点線で描く (Tracelyth #107)。
 * Tracelythが挙げたPermitとPermit2とERC-4626の図は、どれも許可の値を持つ
 */
function permitText(layout?: string): string {
  return [
    "pipe 許可で送る",
    ...(layout ? [`layout ${layout}`] : []),
    "",
    "box alice as Alice",
    "box bob as Bob",
    "box carol as Carol",
    "box router as Router",
    "box usdc as USDC",
    "box weth as WETH",
    "",
    "hold alice: 1000 USDC, 5 WETH",
    "hold bob: 200 USDC, 0 WETH",
    "hold carol: 0 USDC, 1 WETH",
    'hold usdc: "allowance[Alice][Router]" 100 [from: alice, to: router, unit: USDC]',
    'hold weth: "allowance[Carol][Router]" 2 [from: carol, to: router, unit: WETH]',
    "hold router: nonce 0",
    "",
    "step BobがRouterを呼ぶ",
    "  say BobがRouterを呼ぶ",
    "  bob -> router: pull(from: alice, amount: 100)",
    "  write router: nonce 1",
    '  write usdc: "allowance[Alice][Router]" 0',
    "  move usdc: 100 alice -> carol",
    "  emit usdc: Transfer(from: alice, to: carol, amount: 100)",
    "  return router: ok",
    "",
    "step CarolのWETHを動かす",
    "  say RouterがWETHを呼ぶ",
    "  bob -> router: pull2(from: carol)",
    "  router -> weth: transferFrom(from: carol, to: bob, amount: 1)",
    '  write weth: "allowance[Carol][Router]" 1',
    "  move weth: 1 carol -> bob",
    "  return weth: true",
    "  return router: ok",
    "",
  ].join("\n");
}

function parse(text: string): Record<string, unknown> {
  const parsed = api.parseNotation(text, { lang: "ja" });
  expect(parsed.ok, parsed.ok ? "" : parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join("\n")).toBe(true);
  return parsed.ok ? parsed.diagram : {};
}

interface Figure extends Rendered {
  drawn: Drawn;
}
/** 記法を描き、描く処理が崩れの確かめに渡す材料を一緒に受け取る */
function draw(text: string, options: Record<string, unknown> = {}): Figure {
  let drawn: Drawn = { inks: [], stills: [], frame: { w: 0, h: 0 } };
  const rendered = api.renderDiagram(parse(text), {
    lang: "ja",
    ...options,
    findBreaks: (d: Drawn) => {
      drawn = d;
      return [];
    },
  });
  return { ...rendered, drawn };
}
const drawnCache = new Map<string, Figure>();
/** 同じ記法を何度も描かない。人と箱の数を変えた図は4つの検査が同じ図を見る */
function drawOnce(text: string): Figure {
  const hit = drawnCache.get(text);
  if (hit) return hit;
  const figure = draw(text);
  drawnCache.set(text, figure);
  return figure;
}

// ---- 数え方

const D = 0.5;
const overlaps = (a: Rect, b: Rect): boolean => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > D && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > D;
const inside = (a: Rect, b: Rect): boolean => a.x >= b.x - D && a.y >= b.y - D && a.x + a.w <= b.x + b.w + D && a.y + a.h <= b.y + b.h + D;
const visibleAt = (shown: Shown[], t: number): boolean => shown.some(([a, b]) => a <= t && t < b);
const segsOf = (points: readonly Point[]): [Point, Point][] => points.slice(1).map((q, i): [Point, Point] => [points[i] as Point, q]);
const isFlat = ([a, b]: [Point, Point]): boolean => Math.abs(a[1] - b[1]) < D;
const isUpright = ([a, b]: [Point, Point]): boolean => Math.abs(a[0] - b[0]) < D;
/** 線分の太さの四角。端の先へは広げない */
function caseOf([a, b]: [Point, Point], half: number): Rect {
  return isFlat([a, b])
    ? { x: Math.min(a[0], b[0]), y: a[1] - half, w: Math.abs(b[0] - a[0]), h: half * 2 }
    : { x: a[0] - half, y: Math.min(a[1], b[1]), w: half * 2, h: Math.abs(b[1] - a[1]) };
}
/** 線分 a-b が四角 r の内側 (縁を `inset` だけ縮めた所) を通るか。縦と横でない線分も線分の上の点で見る */
function crosses([a, b]: [Point, Point], r: Rect, inset = 1): boolean {
  const x0 = r.x + inset;
  const x1 = r.x + r.w - inset;
  const y0 = r.y + inset;
  const y1 = r.y + r.h - inset;
  if (x1 <= x0 || y1 <= y0) return false;
  // 線分を四角の中へ切り詰める (Liang-Barsky)
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - x0],
    [dx, x1 - a[0]],
    [-dy, a[1] - y0],
    [dy, y1 - a[1]],
  ] as [number, number][]) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return false;
  }
  return t1 - t0 > 1e-6;
}

/** 線の太さの半分。呼び出しの管、値のパイプ、2人を結ぶ点線、値を書き換える点線、ログの札の点線 */
const HALF = { call: PIPE_LOOK.call.case / 2, value: 7, link: 1, write: 1, tether: 1 };
interface Line {
  kind: keyof typeof HALF;
  id: string;
  /** 呼び出しの管は、同じ者から出る管と本管を共に通る。同じ `trunk` の線は同じ線の上を重ねて通ってよい */
  trunk?: string;
  points: Point[];
  /** その線の札。線は自分の札の上を通ってよい */
  own: Rect[];
  /** 線の両端の部品の名前。線はその部品の縁に着く */
  ends: string[];
  step?: number;
}
/** 段 `step` (0から) に見えている線 */
/**
 * 呼び出しの管 `points` の上で止まる戻り値の札の、止まった所の四角。戻り値の札は呼び出しの管を伝って呼んだ側へ戻り、
 * 止まった所で濃く見えた後に消える。その札の字は、札が乗る管の字として数える
 */
function restingChips(L: PipeLayout, points: Point[]): Rect[] {
  const on = ([x, y]: Point): boolean =>
    points.slice(1).some((b, i) => {
      const a = points[i] as Point;
      return x >= Math.min(a[0], b[0]) - 1 && x <= Math.max(a[0], b[0]) + 1 && y >= Math.min(a[1], b[1]) - 1 && y <= Math.max(a[1], b[1]) + 1;
    });
  return L.chips.flatMap((c) => {
    const path = c.kind === "return" ? c.path : undefined;
    if (!path || path.length < 2) return [];
    const [sx, sy] = path[0] as Point;
    const [ex, ey] = path[path.length - 1] as Point;
    return on([ex, ey]) ? [{ x: c.x + ex - sx, y: c.y + ey - sy, w: c.w, h: c.h }] : [];
  });
}
function linesAt(L: PipeLayout, step: number): Line[] {
  const out: Line[] = [];
  for (const main of L.mains)
    for (const br of main.branches) out.push({ kind: "call", id: `call ${main.from}>${br.to}`, trunk: main.from, points: br.points, own: restingChips(L, br.points), ends: [main.from, br.to] });
  for (const v of L.valuePipes) out.push({ kind: "value", id: `pipe ${v.token} ${v.from}>${v.to}`, points: v.points, own: [], ends: [v.from, v.to, `${v.from}/${v.token}`, `${v.to}/${v.token}`] });
  for (const l of L.links.filter((x) => x.step === step))
    out.push({ kind: "link", id: `link ${l.from}>${l.to}`, points: l.points, own: [l.label, ...(l.delta ? [l.delta] : [])], ends: [l.from, l.to], step });
  for (const w of L.writes.filter((x) => x.step === step)) out.push({ kind: "write", id: `write ${w.to}.${w.name}`, points: w.points, own: [], ends: [w.to, `plate ${w.to}.${w.name}`], step });
  for (const c of L.logCards ?? []) if (c.tether && c.tether.length > 1) out.push({ kind: "tether", id: `tether ${c.title}`, points: c.tether, own: [c], ends: [c.party, `log ${c.title}`] });
  return out;
}

interface Block extends Rect {
  name: string;
  /** 同じ持ち主の部品どうしは重ねて描く (名札と名前、槽と残高の字) */
  owner: string;
}
/** 段 `step` (0から) の時刻 `t` (書かない時は止め絵の時刻) に見えている、人と箱と槽と札 */
function blocksAt(f: Figure, step: number, t = f.timeline.stills[step] ?? 0): Block[] {
  const L = f.layout;
  const out: Block[] = [];
  for (const p of L.parties) {
    out.push({ ...p, name: `${p.shape === "round" ? "人" : "箱"} ${p.id}`, owner: p.id });
    if (p.shape === "round") out.push({ ...p.label, name: `${p.id}の名前`, owner: p.id });
  }
  for (const k of L.tanks) out.push({ ...k, name: `槽 ${k.party}/${k.token}`, owner: `${k.party}/${k.token}` });
  for (const lv of L.levels.filter((x) => x.step === step))
    for (const t2 of [lv.text, lv.delta, lv.tag]) if (t2) out.push({ ...t2, name: `槽 ${lv.party}/${lv.token} の字 ${t2.text}`, owner: `${lv.party}/${lv.token}` });
  for (const p of L.plates.filter((x) => x.step === step && !x.boxed && !x.row)) {
    out.push({ ...p, name: `値の箱 ${p.party}.${p.name}`, owner: `plate ${p.party}.${p.name}` });
    for (const t2 of [p.was, p.tag, p.before]) if (t2) out.push({ ...t2, name: `値の箱 ${p.party}.${p.name} の字 ${t2.text}`, owner: `plate ${p.party}.${p.name}` });
  }
  // ログの札は発した段から出たまま残る。発した段を持たない札はどの段にも出ているとみなす
  for (const c of L.logCards ?? []) if (c.step === undefined || c.step <= step) out.push({ ...c, name: `ログの札 ${c.title}`, owner: `log ${c.title}` });
  for (const c of L.callCards ?? []) if (visibleAt(c.shown, t)) out.push({ ...c, name: `呼び出しの札 ${c.call}`, owner: `card ${c.call}` });
  for (const c of L.chips.filter((x) => x.step === step && x.kind === "io")) out.push({ ...c, name: `札 ${c.text} (${c.party})`, owner: `io ${c.party} ${c.text}` });
  for (const l of L.links.filter((x) => x.step === step)) for (const t2 of [l.label, l.delta]) if (t2) out.push({ ...t2, name: `線の札 ${t2.text}`, owner: `link ${l.from}>${l.to}` });
  return out;
}
/**
 * 段ごとの止め絵で重なる部品の組。`moving` を立てると、動画とGIFが映す段の途中の時刻 (呼び出しの札が出ている間の真ん中) でも数える
 */
function overlapsOf(f: Figure, moving = false): string[] {
  const out: string[] = [];
  f.timeline.stills.forEach((still, step) => {
    const span = f.timeline.steps[step] ?? { start: 0, end: still };
    const mids = moving ? (f.layout.callCards ?? []).flatMap((c) => c.shown.map(([a, b]) => (a + b) / 2)).filter((t) => t >= span.start && t < span.end) : [];
    for (const t of [still, ...mids]) {
      const blocks = blocksAt(f, step, t);
      blocks.forEach((a, i) => {
        for (const b of blocks.slice(i + 1)) {
          if (a.owner === b.owner) continue;
          if (overlaps(a, b)) out.push(`段${step + 1} ${a.name} × ${b.name}`);
        }
      });
    }
  });
  return [...new Set(out)];
}
/** 段ごとの止め絵で、線が箱と槽と値の箱の中か、字の上を通る所 */
function linesOverTextOf(f: Figure): string[] {
  const L = f.layout;
  const out: string[] = [];
  const solids: { name: string; ids: string[]; rect: Rect }[] = [
    ...L.parties.filter((p) => p.shape !== "round").map((p) => ({ name: `箱 ${p.id}`, ids: [p.id], rect: p })),
    ...L.parties.filter((p) => p.shape === "round").map((p) => ({ name: `人 ${p.id}`, ids: [p.id], rect: p })),
    ...L.tanks.map((k) => ({ name: `槽 ${k.party}/${k.token}`, ids: [`${k.party}/${k.token}`], rect: k })),
  ];
  f.timeline.stills.forEach((t, step) => {
    const inks = f.drawn.inks.filter((ink) => visibleAt(ink.shown, t) && ink.text.trim() !== "");
    const plates = L.plates.filter((p) => p.step === step && !p.boxed && !p.row).map((p) => ({ name: `値の箱 ${p.party}.${p.name}`, ids: [`plate ${p.party}.${p.name}`], rect: p }));
    for (const line of linesAt(L, step)) {
      if (line.step !== undefined && line.step !== step) continue;
      const half = HALF[line.kind];
      for (const seg of segsOf(line.points)) {
        for (const s of [...solids, ...plates]) if (!s.ids.some((id) => line.ends.includes(id)) && crosses(seg, s.rect)) out.push(`段${step + 1} ${line.id} が${s.name}の中を通る`);
        const body = caseOf(seg, half);
        for (const ink of inks) {
          if (line.own.some((r) => inside(ink.rect, r))) continue;
          if (overlaps(body, ink.rect)) out.push(`段${step + 1} ${line.id} が字「${ink.text}」の上を通る`);
        }
      }
    }
  });
  return [...new Set(out)];
}
/** 横幅いっぱいに何も描かない帯。図に描く全ての物の縦の範囲を重ね、`min` 以上空いた所を返す */
function emptyBandsOf(f: Figure, min = 200): [number, number][] {
  const L = f.layout;
  const spans: [number, number][] = [];
  const add = (r: Rect | undefined): void => {
    if (r && r.h >= 0) spans.push([r.y, r.y + r.h]);
  };
  for (const p of L.parties) {
    add(p);
    add(p.label);
  }
  for (const k of L.tanks) add(k);
  for (const h of L.housings) add(h);
  for (const lv of L.levels) for (const t of [lv.text, lv.delta, lv.tag]) add(t);
  for (const p of L.plates) add(p);
  for (const c of L.chips) add(c);
  for (const c of L.logCards ?? []) add(c);
  for (const c of L.callCards ?? []) add(c);
  for (const ink of f.drawn.inks) add(ink.rect);
  f.timeline.stills.forEach((_, step) => {
    for (const line of linesAt(L, step)) for (const seg of segsOf(line.points)) add(caseOf(seg, HALF[line.kind]));
  });
  spans.sort((a, b) => a[0] - b[0]);
  const bands: [number, number][] = [];
  let reach = 0;
  for (const [a, b] of spans) {
    if (a - reach >= min) bands.push([reach, a]);
    reach = Math.max(reach, b);
  }
  if (L.height - reach >= min) bands.push([reach, L.height]);
  return bands;
}
/** 縦と横でない線分と、2本の線が同じ所を重なって走る所 */
function crookedOrMergedOf(f: Figure): string[] {
  const out: string[] = [];
  f.timeline.stills.forEach((_, step) => {
    const lines = linesAt(f.layout, step);
    for (const line of lines) for (const seg of segsOf(line.points)) if (!isFlat(seg) && !isUpright(seg)) out.push(`${line.id} が斜めに走る`);
    lines.forEach((a, i) => {
      for (const b of lines.slice(i + 1)) {
        for (const sa of segsOf(a.points))
          for (const sb of segsOf(b.points)) {
            if (isFlat(sa) !== isFlat(sb) || isUpright(sa) !== isUpright(sb)) continue;
            const [k, o]: [0 | 1, 0 | 1] = isFlat(sa) ? [1, 0] : [0, 1];
            const offset = Math.abs(sa[0][k] - sb[0][k]);
            const along = Math.min(Math.max(sa[0][o], sa[1][o]), Math.max(sb[0][o], sb[1][o])) - Math.max(Math.min(sa[0][o], sa[1][o]), Math.min(sb[0][o], sb[1][o]));
            if (offset >= HALF[a.kind] + HALF[b.kind] - D || along <= D) continue;
            // 同じ者から出る呼び出しの管は、分かれる所まで1本の本管を共に通る
            if (a.trunk !== undefined && a.trunk === b.trunk && offset < D) continue;
            out.push(`段${step + 1} ${a.id} と ${b.id} が重なって走る`);
          }
      }
    });
  });
  return [...new Set(out)];
}

// ---- 人と箱の数を変えた図

const SIZES = [1, 3, 8];
const SHAPES = ["top", "bottom"];
const GRID = SHAPES.flatMap((shape) => SIZES.flatMap((n) => SIZES.map((m): [string, number, number] => [shape, n, m])));

/** コントラクトの形を比べる図。router3 は値を持つが、どの段でも呼ばれない。上と下と既定の置き方で描く */
const CONTRACT_TEXT = gridText(3, 3, { layout: "top", only: [0, 1] });
const CONTRACT_TEXTS = [CONTRACT_TEXT, CONTRACT_TEXT.replace("layout top", "layout bottom"), CONTRACT_TEXT.replace("layout top\n", "")];
/** 動画の絵と図の置き場所を比べる図 */
const EXPORT_TEXTS = [gridText(2, 2, { layout: "top" }), gridText(1, 3, { layout: "bottom" }), exampleText("swap.dragon")];
/** 薄く描く線を確かめる図。上と下と既定の置き方ごとに、許可で送る図と 3 人 3 箱の図 */
const faintTexts = (shape: string | undefined): [string, string][] => [
  [`${shape ?? "既定"} 許可で送る`, permitText(shape)],
  [`${shape ?? "既定"} 3人3箱`, gridText(3, 3, shape ? { layout: shape } : {})],
];

// 件の中で図を描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。その件の図は file を読み込む段で描き、件は記法で引いて読む。
// 人と箱の数を変えた図のほかの件は、同じ図を drawOnce の覚えから読む
const DRAWN = await atLoad("配管の図を描き、動画の絵の段取りを作る", () => {
  const texts = [
    ...[...SHAPES, undefined].flatMap((shape) => faintTexts(shape).map(([, text]) => text)),
    ...CONTRACT_TEXTS,
    ...EXPORT_TEXTS,
    ...GRID.map(([shape, n, m]) => gridText(n, m, { layout: shape })),
    ...SHAPES.map((shape) => gridText(3, 3, { layout: shape, long: true, logs: 5 })),
  ];
  return {
    figures: new Map(texts.map((text): [string, Figure] => [text, drawOnce(text)])),
    plans: new Map(EXPORT_TEXTS.map((text): [string, ReturnType<typeof page.planPage>] => [text, page.planPage(parse(text), { lang: "ja" })])),
  };
});

// ---- 線の通り道

describe("線の通り道", () => {
  it("pipe-pipes-leave-tanks-from-side", () => {
    // #3721 は槽へ上の縁から入れたが、パッチの並べ方 (#3761) は槽の横の縁の口から出す。下の縁から出すと槽の下の残高の字の上を通ったので、
    // 槽の隣に槽か札が並ぶ時も横の口から出て隣との間を下りる。口からは横へ真っすぐ出る
    for (const shape of SHAPES) {
      const L = drawOnce(gridText(3, 3, { layout: shape })).layout;
      const tankAt = (party: string, token: string): Tank | undefined => L.tanks.find((t) => t.party === party && t.token === token);
      expect(L.valuePipes.length, `${shape} の値のパイプ`).toBeGreaterThan(0);
      for (const v of L.valuePipes) {
        for (const [k, port] of v.ports.entries()) {
          const tank = tankAt(port.party, port.token);
          if (!tank) continue;
          expect(["left", "right"], `${shape} の ${v.token} ${v.from}>${v.to} が槽の${port.side}の縁から出る`).toContain(port.side);
          const end = k === 0 ? v.points.slice(0, 2) : v.points.slice(-2).reverse();
          const [at, next] = end as [Point, Point];
          const edge = port.side === "left" ? tank.x : tank.x + tank.w;
          expect(Math.abs(at[0] - edge), `${shape} の ${v.token} ${v.from}>${v.to} の口が槽の${port.side}の縁に無い`).toBeLessThan(1);
          expect(at[1] > tank.y && at[1] < tank.y + tank.h, `${shape} の ${v.token} ${v.from}>${v.to} の口が槽の横の縁の中に無い`).toBe(true);
          const outward = port.side === "left" ? next[0] < at[0] : next[0] > at[0];
          expect(Math.abs(next[1] - at[1]) < D && outward, `${shape} の ${v.token} ${v.from}>${v.to} が口から横へ出ない`).toBe(true);
        }
      }
    }
  });

  it("pipe-route-lines-keep-places", () => {
    // #3721 の置き方は `route` の行で渡した組の通り道を空けたが、パッチの並べ方 (#3761) は通り道を空けない。
    // Tracelythの図をパッチを当てた時のまま描くため、`route` の行は読むが、書いても人と箱と槽の置き場所は行を書かない図と同じ
    // 段を最初の1つに減らした図に、減らす前の3本の呼び出しの組を渡す。#3721 の置き方は減らした段の通り道も空けて置き場所を変えなかった
    const passed: [string, string][] = [
      ["alice", "router1"],
      ["bob", "router2"],
      ["carol", "router3"],
    ];
    const places = (L: PipeLayout): string =>
      JSON.stringify([...L.parties.map((p) => [p.id, Math.round(p.x), Math.round(p.y)]), ...L.tanks.map((t) => [`${t.party}/${t.token}`, Math.round(t.x), Math.round(t.y)])].sort());
    for (const shape of SHAPES) {
      const routed = drawOnce(gridText(3, 3, { layout: shape, routes: passed, only: [0] })).layout;
      const plain = drawOnce(gridText(3, 3, { layout: shape, only: [0] })).layout;
      expect(places(routed), `${shape} で route の行を書くと置き場所が動いた`).toBe(places(plain));
    }
    // 組に知らない名前を書いた行は読まずに断る
    const refused = api.parseNotation(gridText(2, 2, { layout: "top", routes: [["alice", "nobody"]] }), { lang: "ja" });
    expect(refused.ok, "知らない名前の route の行").toBe(false);
  });

  it("pipe-faint-lines-avoid-boxes", () => {
    // 薄く描く線は、2人を結ぶ点線 (許可の値) と、その段で流れない値のパイプ
    const drawn = DRAWN.get().figures;
    const figures = [...SHAPES, undefined].flatMap((shape) => faintTexts(shape).map(([what, text]): [string, Figure] => [what, drawn.get(text) as Figure]));
    const found: string[] = [];
    for (const [what, f] of figures) {
      const L = f.layout;
      const walls: { name: string; ids: string[]; rect: Rect; edge: boolean }[] = [
        ...L.parties.map((p) => ({ name: `${p.shape === "round" ? "人" : "箱"} ${p.id}`, ids: [p.id], rect: p, edge: p.shape !== "round" })),
        ...L.tanks.map((k) => ({ name: `槽 ${k.party}/${k.token}`, ids: [`${k.party}/${k.token}`], rect: k, edge: true })),
        ...L.housings.map((h) => ({ name: `${h.party} の点線の枠`, ids: [h.party], rect: h, edge: true })),
        ...L.plates.filter((p) => !p.boxed && !p.row && p.step === 0).map((p) => ({ name: `値の箱 ${p.party}.${p.name}`, ids: [`plate ${p.party}.${p.name}`], rect: p, edge: true })),
      ];
      const faint: { id: string; points: Point[]; ends: string[]; half: number }[] = [
        ...L.links.filter((l) => l.step === 0).map((l) => ({ id: `点線 ${l.from}>${l.to}`, points: l.points, ends: [l.from, l.to], half: HALF.link })),
        // 既定の並べ方は、トークンの箱をそのトークンの値の管の上に載せる。管が通るのは自分のトークンの箱だけ
        ...L.valuePipes.map((v) => ({
          id: `パイプ ${v.token} ${v.from}>${v.to}`,
          points: v.points,
          ends: [v.from, v.to, `${v.from}/${v.token}`, `${v.to}/${v.token}`, ...L.parties.filter((p) => p.shape === "token" && p.name === v.token).map((p) => p.id)],
          half: HALF.value,
        })),
      ];
      for (const line of faint)
        for (const seg of segsOf(line.points)) {
          for (const w of walls) {
            const own = w.ids.some((id) => line.ends.includes(id));
            if (!own && crosses(seg, w.rect)) found.push(`${what} の${line.id} が${w.name}の中を通る`);
            if (!w.edge) continue;
            // 縁に沿って走る = 縁と平行に、縁から線の太さの半分と8px以内を、12pxより長く走る
            const r = w.rect;
            const near = line.half + 8;
            if (isFlat(seg)) {
              const lo = Math.max(Math.min(seg[0][0], seg[1][0]), r.x);
              const hi = Math.min(Math.max(seg[0][0], seg[1][0]), r.x + r.w);
              const y = seg[0][1];
              if (hi - lo > 12 && (Math.abs(y - r.y) < near || Math.abs(y - (r.y + r.h)) < near)) found.push(`${what} の${line.id} が${w.name}の横の縁に沿って走る`);
            } else if (isUpright(seg)) {
              const lo = Math.max(Math.min(seg[0][1], seg[1][1]), r.y);
              const hi = Math.min(Math.max(seg[0][1], seg[1][1]), r.y + r.h);
              const x = seg[0][0];
              if (hi - lo > 12 && (Math.abs(x - r.x) < near || Math.abs(x - (r.x + r.w)) < near)) found.push(`${what} の${line.id} が${w.name}の縦の縁に沿って走る`);
            }
          }
        }
    }
    expect([...new Set(found)], "薄く描く線").toEqual([]);
  });
});

// ---- 札と印

describe("札と印", () => {
  it("pipe-logs-stack-by-emitter", () => {
    // #3721 はログの札を呼び出しの線より上の1本の帯に左から並べ、発した箱へ点線で結んだ。
    // パッチの並べ方 (#3761) は、札を発した箱の札入れに入れる。上の形は箱の上の左半分に、下の形は箱の下の左半分に置き、
    // 右半分は呼び出しの札に空ける (Tracelyth #165、#166)。札は発した箱の傍に積むので、点線で結ばない
    for (const shape of SHAPES) {
      const f = drawOnce(gridText(3, 3, { layout: shape, logs: 2 }));
      const L = f.layout;
      const cards = L.logCards ?? [];
      expect(cards.length, `${shape} のログの札`).toBe(6);
      expect(
        cards.every((c) => c.step !== undefined && c.event !== undefined),
        `${shape} のログの札が発した段を持たない`,
      ).toBe(true);
      for (const c of cards) {
        const box = L.parties.find((p) => p.id === c.party);
        expect(box, `${shape} の ${c.title} を発した箱`).toBeDefined();
        if (!box) continue;
        if (shape === "bottom") expect(c.y, `${shape} の ${c.title} が ${c.party} の下に無い`).toBeGreaterThanOrEqual(box.y + box.h - D);
        else expect(c.y + c.h, `${shape} の ${c.title} が ${c.party} の上に無い`).toBeLessThanOrEqual(box.y + D);
        expect(c.x < box.x + box.w && c.x + c.w > box.x, `${shape} の ${c.title} が ${c.party} の上下から横に外れる`).toBe(true);
        expect(c.x + c.w, `${shape} の ${c.title} が ${c.party} の右半分に掛かる`).toBeLessThanOrEqual(box.x + box.w / 2 + D);
      }
      // 同じ箱の札は1列に、発した順 (段の順、段の中は発した順) に上から積む
      for (const party of new Set(cards.map((c) => c.party))) {
        const mine = cards.filter((c) => c.party === party);
        const order = [...mine].sort((a, b) => (a.step ?? 0) - (b.step ?? 0) || (a.event ?? 0) - (b.event ?? 0));
        const read = [...mine].sort((a, b) => a.y - b.y);
        expect(read.map((c) => c.title), `${shape} の ${party} の札の並び`).toEqual(order.map((c) => c.title));
        expect(new Set(mine.map((c) => Math.round(c.x))).size, `${shape} の ${party} の札が1列に並ばない`).toBe(1);
      }
      // 呼び出しの線は札の下を通らない。線が札入れの下を通ると、線が札に被って見える (Tracelyth #221)
      const under: string[] = [];
      for (const m of L.mains)
        for (const br of m.branches) for (const seg of segsOf(br.points)) for (const c of cards) if (crosses(seg, c)) under.push(`${m.from}>${br.to} が ${c.title} の下を通る`);
      expect([...new Set(under)], `${shape} の札の下を通る呼び出しの線`).toEqual([]);
    }
    // 1つの箱が多くの札を発しても、札は図の中に収まり、重ならない
    const many = drawOnce(gridText(1, 1, { layout: "top", logs: 8 }));
    const cards = many.layout.logCards ?? [];
    expect(cards.length, "多くの札を発した図のログの札").toBe(8);
    for (const c of cards) expect(c.x >= 0 && c.y >= 0 && c.x + c.w <= many.layout.width && c.y + c.h <= many.layout.height, `${c.title} が図の外にはみ出す`).toBe(true);
    expect(overlapsOf(many), "積んだ札の重なり").toEqual([]);
  });

  it("pipe-prev-value-under-box", () => {
    // パッチの並べ方 (#3761) は、値の箱の前の値を線で消して箱の下の行に置き、状態の語 (確定) を右に添える。行は槽の下の額と同じ高さに並ぶ。
    // #3721 は消す線をやめて「前」の札を足したが、Tracelythの図をパッチを当てた時のまま描くので戻した
    for (const shape of [...SHAPES, undefined]) {
      const f = drawOnce(gridText(2, 2, shape ? { layout: shape } : {}));
      const L = f.layout;
      const changed = L.plates.filter((p) => !p.boxed && !p.row && p.was);
      expect(changed.length, `${shape ?? "既定"} の前の値を持つ値の箱`).toBeGreaterThan(0);
      for (const p of changed) {
        const what = `${shape ?? "既定"} 段${p.step + 1} の ${p.party}.${p.name}`;
        const { was, strike, tag } = p;
        const frame = L.housings.find((h) => h.party === p.party);
        expect(was && strike && tag && frame, `${what} の前の値か消す線か状態の語か持ち主の枠が無い`).toBeTruthy();
        if (!was || !strike || !tag || !frame) continue;
        // 前の値と状態の語は箱の下端より下で、持ち主の点線の枠の中に置く
        for (const [name, t] of [
          ["前の値", was],
          ["状態の語", tag],
        ] as [string, Text][]) {
          expect(t.y, `${what} の${name}が箱の下端より上`).toBeGreaterThanOrEqual(p.y + p.h - D);
          expect(t.y + t.h, `${what} の${name}が枠の下の縁より下`).toBeLessThanOrEqual(frame.y + frame.h + D);
        }
        // 消す線は前の値の字を横に貫く
        expect(strike.x <= was.x + D && strike.x + strike.w >= was.x + was.w - D, `${what} の消す線が前の値の字の端まで届かない`).toBe(true);
        expect(strike.y >= was.y && strike.y + strike.h <= was.y + was.h, `${what} の消す線が前の値の字の高さの外`).toBe(true);
        // 状態の語は前の値の右に、重ねずに置く
        expect(tag.x, `${what} の状態の語が前の値に重なる`).toBeGreaterThanOrEqual(was.x + was.w);
        // 槽の下の額と同じ行に並ぶ
        const amounts = L.levels.filter((lv) => lv.step === p.step).map((lv) => lv.text);
        expect(amounts.length, `${what} と同じ段の槽の額`).toBeGreaterThan(0);
        for (const a of amounts) expect(was.y < a.y + a.h && a.y < was.y + was.h, `${what} の前の値が槽の ${a.text} と同じ行に無い`).toBe(true);
      }
    }
  });

  it("pipe-io-tags-in-frame-margin", () => {
    // パッチの並べ方 (#3761) は、入力と出力の札を始めた人 (alice) の槽にだけ付け、払った槽に入力を、受け取った槽に出力を付けて、
    // 持ち主の点線の枠の中の、槽より上の余白に置く。#3721 は札を枠の外の上へ出し、交換で受け取った別の人にも出力を付けたが、
    // Tracelythの図をパッチを当てた時のまま描くので戻した。受け取る槽を持たない交換 (見本 swap) は入力だけを付ける
    const figures: [string, Figure, Record<string, string>][] = [
      ["見本 swap", drawOnce(exampleText("swap.dragon")), { USDC: "入力" }],
      ["見本 swap top", drawOnce(exampleText("swap.dragon").replace(/\n\n/u, "\nlayout top\n\n")), { USDC: "入力" }],
      ...SHAPES.map((shape): [string, Figure, Record<string, string>] => [`${shape} 3人3箱`, drawOnce(gridText(3, 3, { layout: shape })), { TK1: "入力", TK3: "出力" }]),
    ];
    for (const [what, f, marks] of figures) {
      const L = f.layout;
      const io = L.chips.filter((c) => c.kind === "io");
      expect(io.length, `${what} の入力と出力の札`).toBeGreaterThan(0);
      expect([...new Set(io.map((c) => c.party))], `${what} の札を持つ人`).toEqual(["alice"]);
      for (const step of new Set(io.map((c) => c.step))) {
        const here = io.filter((c) => c.step === step);
        expect(Object.fromEntries(here.map((c) => [c.token, c.text])), `${what} 段${step + 1} の槽ごとの札`).toEqual(marks);
        for (const c of here) {
          const frame = L.housings.find((h) => h.party === c.party);
          const tank = L.tanks.find((t) => t.party === c.party && t.token === c.token);
          expect(frame && tank, `${what} の ${c.party} の点線の枠か ${c.token} の槽`).toBeTruthy();
          if (!frame || !tank) continue;
          const where = `${what} 段${step + 1} の ${c.party} の${c.text}の札`;
          // 枠の上の縁と槽の上の縁の間の余白に置き、枠の線にも槽にも重ねない
          expect(c.y, `${where}が枠の上の縁に重なる`).toBeGreaterThanOrEqual(frame.y + 1);
          expect(c.y + c.h, `${where}が槽に重なる`).toBeLessThanOrEqual(tank.y - 1);
          // 槽の名前を外の上に置いた槽 (#3783) では、名前を左の端へ、札を右の端へ寄せて同じ行に並べる
          const title = tank.title;
          const beside = title !== undefined && title.y < c.y + c.h && c.y < title.y + title.h;
          const off = beside ? Math.abs(c.x + c.w - (tank.x + tank.w)) : Math.abs(c.x + c.w / 2 - (tank.x + tank.w / 2));
          expect(off, beside ? `${where}が槽の右の端に揃わない` : `${where}が槽の真上に無い`).toBeLessThan(1);
        }
      }
    }
  });

  it("pipe-contracts-share-shape-and-height", () => {
    // 呼ばれるコントラクトは全て四角の箱で描いて高さを揃え、トークンの箱も高さを揃える。
    // どの段でも呼ばれない値の持ち主 (router3) は、パッチの並べ方 (#3761) どおり人と同じ大きさの丸で描く。
    // #3721 は呼ばれない持ち主も四角の箱にしたが、Tracelythの図をパッチを当てた時のまま描くので戻した
    const drawn = DRAWN.get().figures;
    for (const t of CONTRACT_TEXTS) {
      const L = (drawn.get(t) as Figure).layout;
      const shape = L.fixed?.shape ?? "既定";
      const called = L.parties.filter((p) => p.id === "router1" || p.id === "router2");
      expect(called.map((p) => p.shape), `${shape} の呼ばれるコントラクトの形`).toEqual(["cabinet", "cabinet"]);
      expect(new Set(called.map((p) => Math.round(p.h))).size, `${shape} のコントラクトの箱の高さが揃わない`).toBe(1);
      const idle = L.parties.find((p) => p.id === "router3");
      const person = L.parties.find((p) => p.id === "alice");
      expect(idle?.shape, `${shape} の呼ばれない router3 の形`).toBe("round");
      expect([idle?.w, idle?.h].map((v) => Math.round(v ?? 0)), `${shape} の router3 が人と同じ大きさでない`).toEqual([person?.w, person?.h].map((v) => Math.round(v ?? -1)));
      const tokens = L.parties.filter((p) => p.shape === "token");
      expect(new Set(tokens.map((p) => Math.round(p.h))).size, `${shape} のトークンの箱の高さが揃わない`).toBe(1);
    }
  });

  it("pipe-changed-table-not-faded", () => {
    // 値の変わった表 = その段の止め絵で、前の値と今の値を並べて見せる行 (`was`) を持つトークンの箱。
    // 値が変わった段より後の段も、前の値と今の値を見せる
    const dimmedOpen = /<g opacity="[\d.]+" style="filter:grayscale\(1\)">$|<g class="dg-pp-dim[" ][^>]*>$/u;
    const found: string[] = [];
    let seen = 0;
    for (const [what, text] of [
      ["top 3人3箱", gridText(3, 3, { layout: "top" })],
      ["bottom 3人3箱", gridText(3, 3, { layout: "bottom" })],
      ["既定 3人3箱", gridText(3, 3)],
      ["top 許可で送る", permitText("top")],
    ] as [string, string][]) {
      const { layout: L, svg } = drawOnce(text);
      const steps = Math.max(...L.plates.map((p) => p.step)) + 1;
      for (const table of L.parties.filter((p) => p.shape === "token"))
        for (let step = 0; step < steps; step++) {
          const changed = L.plates.some((p) => p.party === table.id && p.step === step && p.boxed && p.was !== undefined);
          if (!changed) continue;
          seen++;
          const open = `<g data-pipe-party="${table.id}" data-pipe-role="token" data-pipe-step="${step}"`;
          const at = svg.indexOf(open);
          expect(at, `${what} 段${step + 1} の ${table.id} の表を描いていない`).toBeGreaterThan(0);
          if (dimmedOpen.test(svg.slice(Math.max(0, at - 80), at))) found.push(`${what} 段${step + 1} で値の変わった ${table.id} の表を薄く描く`);
        }
    }
    expect(seen, "値の変わった表").toBeGreaterThan(0);
    expect(found, "薄く描いた値の変わった表").toEqual([]);
  });
});

// ---- 再生の部品

describe("再生の部品", () => {
  const players: Player[] = [];
  afterEach(() => {
    for (const p of players.splice(0)) p.destroy();
    document.body.innerHTML = "";
  });
  function mount(diagram: unknown, width: number, options: Record<string, unknown>) {
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { configurable: true, get: () => width });
    document.body.appendChild(host);
    players.push(api.mountDiagram(host, diagram, options));
    const svg = (): SVGElement | null => host.querySelector<SVGElement>('[data-dragon="pan"] svg,[data-dragon="zoom-frame"] svg') ?? host.querySelector<SVGElement>("svg");
    return { shown: (): number => Number.parseFloat(svg()?.style.width || "0") };
  }

  // 2 つの枠と枠に収まる図を 1 件で描いて置くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。枠ごとの件に分ける
  // #3721 は全体を枠に収めると名前の字が10.5pxを下回る図を、名前が10.5pxに見える幅で始めた。パッチの並べ方 (#3761) はこの下限を持たず、
  // 600px以上の枠は `fitWide` だけなら全体を収め (Tracelyth #177)、`fitNarrow` も渡すと名前の字を `FILL_NAME_PX` に届く幅で始める (Tracelyth #230)。
  // 600pxより狭い枠は `fitWide` を読まず、槽の残高の字が `PIPE_FIRST.narrowPx` に届く幅で始めて横に送る (#3450)
  describe.for([1200, 390])("%ipx の枠", (frame) => {
    it("pipe-fit-wide-keeps-readable-text", () => {
      const wide = parse(gridText(3, 3, { layout: "top" }));
      const layout = api.renderDiagram(wide, { lang: "ja", width: frame }).layout;
      expect(layout.width, "図が1300pxより狭い").toBeGreaterThan(1300);
      const phone = frame < ZOOM.fit;
      // 600px以上の枠は人の名前の字、狭い枠は槽の残高の字の大きさを見る
      const [what, floor, size] = phone
        ? ["槽の残高の字", PIPE_FIRST.narrowPx, Math.min(...layout.levels.map((l) => l.text.h))]
        : ["名前の字", FILL_NAME_PX, Math.min(...layout.parties.map((p) => p.label.h))];
      // 全体を枠に収めると字が下限を下回る図
      expect((size * Math.min(frame, layout.width)) / layout.width, `全体を収めても${what}が下限に届く図`).toBeLessThan(floor);
      const m = mount(wide, frame, { lang: "ja", fitWide: true, ...(phone ? {} : { fitNarrow: true }), minZoom: 0.25 });
      const px = (size * m.shown()) / layout.width;
      expect(px, `枠 ${frame}px で始めた${what}の大きさ`).toBeGreaterThanOrEqual(floor - 1e-6);
      expect(px, `枠 ${frame}px で${what}を${floor}pxより大きく始めた`).toBeLessThan(floor + size * 0.02);
    });
  });

  it("pipe-fit-wide-keeps-readable-text", () => {
    // `fitWide` だけを渡した図は、枠より広ければ全体を枠に収め、狭ければ原寸のまま始める (Tracelyth #177)
    const small = parse(gridText(1, 1, { layout: "top" }));
    const fits = api.renderDiagram(small, { lang: "ja", width: 1200 }).layout;
    const m = mount(small, 1200, { lang: "ja", fitWide: true });
    expect(m.shown(), "枠に収まる図の始めの幅").toBeCloseTo(Math.min(1200, fits.width), 0);
  });
});

// ---- 暗い色味

/** CSS の色を [r, g, b] (0 から 255) にする。`#rgb`、`#rrggbb`、`var(--x)`、`color-mix(in srgb, A p%, B)` と `transparent` を読む */
function colorOf(css: string, vars: Record<string, string>, under: number[]): number[] {
  const v = css.trim();
  const ref = /^var\((--[\w-]+)\)$/u.exec(v);
  if (ref) return colorOf(vars[ref[1] as string] ?? "#000", vars, under);
  if (v === "transparent") return under;
  const mixed = /^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*(.+)\)$/u.exec(v);
  if (mixed) {
    const a = colorOf(mixed[1] as string, vars, under);
    const b = colorOf(mixed[3] as string, vars, under);
    const p = Number(mixed[2]) / 100;
    return a.map((x, i) => x * p + (b[i] as number) * (1 - p));
  }
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/iu.exec(v);
  if (hex) {
    const h = hex[1] as string;
    const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
    const rgb = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
    // 8桁の色は終わりの2桁が不透明度。下の色に重ねる
    const alpha = full.length === 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1;
    return rgb.map((c, i) => c * alpha + (under[i] as number) * (1 - alpha));
  }
  throw new Error(`読めない色 ${v}`);
}
const luminance = (rgb: number[]): number => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]): number => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

describe("暗い色味", () => {
  it("pipe-dark-faint-parts-stay-visible", () => {
    const diagram = parse(gridText(3, 3, { layout: "top" }));
    /** 薄く描いた部品の色。薄くする組の不透明度と灰色にする filter を、背景に重ねた色にする */
    const faintOf = (svg: string, cls: string): { part: number[]; bg: number[] } => {
      const vars = Object.fromEntries([...svg.matchAll(/(--[\w-]+):([^;}]+)/gu)].map((m) => [m[1] as string, (m[2] as string).trim()]));
      const bg = colorOf("var(--bg)", vars, [0, 0, 0]);
      const rule = new RegExp(`\\.${cls}\\{[^}]*stroke:([^;}]+)`, "u").exec(svg);
      expect(rule, `${cls} の線の色`).not.toBeNull();
      const stroke = colorOf(rule?.[1] ?? "#000", vars, bg);
      const dim = /<g opacity="([\d.]+)" style="filter:grayscale\(1\)">/u.exec(svg) ?? /\.dg-pp-dim\{[^}]*opacity:([\d.]+)/u.exec(svg);
      expect(dim, "薄く描く組").not.toBeNull();
      const k = Number(dim?.[1] ?? 1);
      const gray = 0.2126 * (stroke[0] as number) + 0.7152 * (stroke[1] as number) + 0.0722 * (stroke[2] as number);
      return { part: bg.map((c) => gray * k + c * (1 - k)), bg };
    };
    const low: string[] = [];
    for (const palette of ["clear", "paper", "night", "arcade", "sea"]) {
      const light = api.renderDiagram(diagram, { lang: "ja", palette, theme: "light" }).svg;
      const dark = api.renderDiagram(diagram, { lang: "ja", palette, theme: "dark" }).svg;
      // 薄く描く値のパイプの線 (`dg-pp-pcase`) と、表の縁 (`dg-pp-act`)
      for (const cls of ["dg-pp-pcase", "dg-pp-act"]) {
        const a = faintOf(light, cls);
        const b = faintOf(dark, cls);
        const [lr, dr] = [contrast(a.part, a.bg), contrast(b.part, b.bg)];
        if (dr < lr - 1e-6) low.push(`${palette} の ${cls} 明るい色味 ${lr.toFixed(3)} 暗い色味 ${dr.toFixed(3)}`);
      }
    }
    expect(low, "暗い色味で明るさの比が下がる部品").toEqual([]);
  });
});

// ---- 書き出し

describe("書き出し", () => {
  it("pipe-export-frames-keep-layout", () => {
    const { figures, plans } = DRAWN.get();
    for (const text of EXPORT_TEXTS) {
      const plan = plans.get(text) as ReturnType<typeof page.planPage>;
      const video = plan.followSvg ?? plan.rendered.svg;
      const f = figures.get(text) as Figure;
      // 動画とGIFは、図の置き場所と同じ位置に人と箱と槽を描く
      const at = (svg: string, attr: string): string[] => [...svg.matchAll(new RegExp(`<[^>]*${attr}="([^"]+)"[^>]*>`, "gu"))].map((m) => m[0].replace(/\sstyle="[^"]*"/gu, "")).sort();
      for (const attr of ["data-pipe-party", "data-pipe-tank"]) expect(at(video, attr), `動画の絵の ${attr} の部品の位置`).toEqual(at(f.svg, attr));
      expect((plan.rendered.layout as unknown as PipeLayout).width, "動画の絵の図の幅").toBe(f.layout.width);
      // 各段の止め絵と、段の途中の呼び出しの札が出ている絵に、重なる部品が無い
      expect(overlapsOf(f, true), "動画の各段の絵の重なり").toEqual([]);
    }
  });
});

// ---- 置き場所の検査

describe("置き場所の検査", () => {
  it("layout-check-refuses-pipe-breaks", () => {
    const always: Shown[] = [[0, Number.POSITIVE_INFINITY]];
    const box = (name: string, x: number, y: number) => ({ kind: "box" as const, name, rect: { x, y, w: 100, h: 60 }, corner: 6, shown: always });
    const base = { traces: [], framed: [], stills: [1], boxes: [], edges: [], outlines: new Map() };
    const kinds = (input: Record<string, unknown>): string[] => findBreaks({ ...base, ...input } as unknown as Parameters<typeof findBreaks>[0]).map((b) => b.kind);
    // 箱と槽が重なる
    const overlapping = kinds({ inks: [], frame: { w: 400, h: 200 }, pieces: [box("Alice", 10, 10), { kind: "tank", name: "Bob TK1", rect: { x: 60, y: 30, w: 60, h: 100 }, shown: always }] });
    expect(overlapping, "重なる箱と槽").toContain("parts-overlap");
    // 値のパイプが字の上を通る
    const overText = kinds({
      inks: [{ text: "1,000", rect: { x: 100, y: 95, w: 40, h: 14 }, shown: always }],
      frame: { w: 400, h: 200 },
      pieces: [{ kind: "line", name: "TK1", points: [[0, 100] as Point, [300, 100] as Point], half: 7, shown: always }],
    });
    expect(overText, "字の上を通る値のパイプ").toContain("line-over-text");
    // 高さ200px以上の空き帯
    const band = kinds({ inks: [], frame: { w: 400, h: 500 }, pieces: [box("Alice", 10, 10), box("Bob", 10, 400)] });
    expect(band, "高さ200px以上の空き帯").toContain("empty-band");
    // 空き帯が200pxに足りない図は知らせない
    expect(kinds({ inks: [], frame: { w: 400, h: 300 }, pieces: [box("Alice", 10, 10), box("Bob", 10, 200)] }), "199pxの空き").not.toContain("empty-band");
    // 知らせる文は崩れの種類ごとに文を持つ
    for (const kind of ["parts-overlap", "line-over-text", "empty-band"]) {
      const text = describeBreak({ kind, step: 1, parts: [{ kind: "box", name: "Alice" }, { kind: "box", name: "Bob" }] } as Parameters<typeof describeBreak>[0], "ja");
      expect(text, `${kind} の知らせる文`).not.toMatch(/undefined/u);
      expect(text.length, `${kind} の知らせる文`).toBeGreaterThan(8);
    }
    // 整った図は知らせない
    const good = checkLayoutText(gridText(3, 3, { layout: "top" }), { lang: "ja" }).filter((b) => ["parts-overlap", "line-over-text", "empty-band"].includes(b.kind));
    expect(good, "整った図の崩れ").toEqual([]);
  });
});

// ---- 今を守る

describe("今を守る", () => {
  it("pipe-keeps-notation-order", () => {
    // 形を決めた置き方 (`top`、`bottom`) は、人と箱とトークンの表 (トークンの箱) を記法に書いた順に左から並べる。
    // `auto` は箱の並びを試して選び、置き方の行を持たない図は今の並べ方が並びを選ぶので、ここでは確かめない
    for (const shape of SHAPES)
      for (const text of [gridText(3, 3, { layout: shape }), gridText(8, 3, { layout: shape }), permitText(shape)]) {
        const L = drawOnce(text).layout;
        const declared = [...text.matchAll(/^box (\S+) as /gmu)].map((m) => m[1] as string);
        const shapeOf = (id: string): string => L.parties.find((p) => p.id === id)?.shape ?? "";
        const xOf = (id: string): number => L.parties.find((p) => p.id === id)?.x ?? Number.NaN;
        for (const kind of ["round", "cabinet", "token"]) {
          const ids = declared.filter((id) => shapeOf(id) === kind);
          expect([...ids].sort((a, b) => xOf(a) - xOf(b)), `${shape} ${L.parties.length}個の ${kind} の左右の順`).toEqual(ids);
        }
      }
  });

  it("pipe-keeps-line-colors-and-widths", () => {
    const { svg } = drawOnce(gridText(2, 2, { layout: "top" }));
    const rules: Record<string, string> = {
      "dg-pp-ccase": "fill:none;stroke:var(--line);stroke-width:16;stroke-linejoin:round",
      "dg-pp-ctrack": "fill:none;stroke:color-mix(in srgb,var(--c) 34%,var(--surf));stroke-width:8;stroke-linejoin:round",
      "dg-pp-cdone": "fill:none;stroke:var(--c);stroke-width:12;opacity:.3;stroke-linejoin:round",
      // 値の管の壁は墨の色で、空洞と流れる液を11にして両側に細い縁を残す (#3783)
      "dg-pp-pcase": "fill:none;stroke:var(--ink);stroke-width:14;stroke-linejoin:round",
      "dg-pp-pbore": "fill:none;stroke:color-mix(in srgb,var(--line) 22%,var(--surf));stroke-width:11;stroke-linejoin:round",
      "dg-pp-mtrack": "fill:none;stroke:color-mix(in srgb,var(--pp-t) 40%,var(--surf));stroke-width:11;stroke-linejoin:round",
      "dg-pp-hl": "stroke:var(--pp-t);stroke-width:4",
      "dg-pp-wr": "fill:none;stroke:var(--c);stroke-width:1.75;stroke-dasharray:4 3",
    };
    for (const [cls, rule] of Object.entries(rules)) expect(new RegExp(`\\.${cls}\\{([^}]*)\\}`, "u").exec(svg)?.[1], `${cls} の色と太さ`).toBe(rule);
  });
});

// ---- 人と箱の数を変えた図 (描くのが重いので最後に回す)

describe.for(GRID)("%s %i人 %i箱", ([shape, n, m]) => {
  const figure = (): Figure => drawOnce(gridText(n, m, { layout: shape }));
  it("pipe-grid-no-overlap", () => {
    expect(overlapsOf(DRAWN.get().figures.get(gridText(n, m, { layout: shape })) as Figure, true), "重なる部品").toEqual([]);
  });
  it("pipe-grid-lines-avoid-text", () => {
    expect(linesOverTextOf(figure()), "箱と槽の中か字の上を通る線").toEqual([]);
  });
  it("pipe-grid-no-empty-band", () => {
    const f = figure();
    expect(emptyBandsOf(f), `高さ200px以上の空き帯 (図の高さ ${Math.round(f.layout.height)})`).toEqual([]);
  });
  it("pipe-grid-lines-cross-only-at-right-angles", () => {
    expect(crookedOrMergedOf(figure()), "斜めの線と重なって走る線").toEqual([]);
  });
});

describe.for(SHAPES)("%s 長い名前と多いログ", (shape) => {
  it("pipe-grid-long-names-and-many-logs", () => {
    const f = DRAWN.get().figures.get(gridText(3, 3, { layout: shape, long: true, logs: 5 })) as Figure;
    expect(f.layout.parties.every((p) => p.name.length > 40), "名前が40字を超えていない").toBe(true);
    expect(f.layout.logCards?.length ?? 0, "ログの札の枚数").toBe(15);
    expect(overlapsOf(f, true), "重なる部品").toEqual([]);
    expect(linesOverTextOf(f), "箱と槽の中か字の上を通る線").toEqual([]);
  });
});

// ---- 処理を借りる呼び出しの線の札 (#3854)

/** 処理を借りる呼び出し (delegatecall) の線に付ける札。札は全ての段で見える */
interface CallTag extends Text {
  from: string;
  to: string;
}
type TagLayout = PipeLayout & { callTags?: CallTag[]; gauges?: (Rect & { step: number })[] };
/** 描く処理が崩れの確かめに渡す部品。返した値の札 (`chip`) は止まる所の四角と、止まって見える時刻を持つ */
type DrawnPieces = Drawn & { pieces?: { kind: string; text?: string; rect?: Rect; shown: Shown[] }[] };
interface TagFigure {
  svg: string;
  layout: TagLayout;
  drawn: DrawnPieces;
}
// 見本`vault-proxy`の最後の段で、線の札`delegatecall()`の上の縁が VaultProxy の箱に隠れ、右の端がログの札に隠れた。
// 日本語と英語の見本を file を読み込む段で描き、件は描いた物を読む (#3738)
const VAULT = await atLoad("見本 vault-proxy の日本語と英語の図を描く", () =>
  new Map(
    (["ja", "en"] as const).map((lang): [string, TagFigure] => {
      const parsed = api.parseNotation(exampleText(lang === "ja" ? "vault-proxy.dragon" : "vault-proxy.en.dragon"), { lang });
      if (!parsed.ok) throw new Error(`vault-proxy (${lang}) を読めない: ${parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join(" / ")}`);
      let drawn: DrawnPieces = { inks: [], stills: [], frame: { w: 0, h: 0 } };
      const rendered = api.renderDiagram(parsed.diagram, {
        lang,
        findBreaks: (d: DrawnPieces) => {
          drawn = d;
          return [];
        },
      });
      return [lang, { svg: rendered.svg, layout: rendered.layout, drawn }];
    }),
  ),
);
const vaultFigure = (lang: string): TagFigure => VAULT.get().get(lang) as TagFigure;
/** 呼び出しの管。線の札は自分の管の番号 (`call`) を持つ */
interface CallPipe {
  index: number;
  from: string;
  to: string;
  points: Point[];
}
type GapTag = CallTag & { call: number };
type GapLayout = Omit<TagLayout, "callTags"> & { calls?: CallPipe[]; callTags?: GapTag[] };
/** 2 つの四角の隙間。離れる向きの隙間のうち最も大きい値で、重なる時は負になる */
const gapOf = (a: Rect, b: Rect): number => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
const rounded = (r: Rect): number[] => [r.x, r.y, r.w, r.h].map(Math.round);
/** 管は 16px の太さで描くので、管の縁は線の芯から 8px 外 (Tracelyth #209) */
const PIPE_HALF = 8;
/**
 * 線の札と、自分の呼び出しの管の縁と、返り値の札の止まる所の隙間 (#3949)。
 * 返り値の札は道の始まりに描き、道の終わりで止まる。止まる所の四角は道の終わりを真ん中にする
 */
function tagClearance(L: GapLayout, tag: GapTag): { pipe: number; back: number } {
  const call = (L.calls ?? []).find((c) => c.index === tag.call);
  if (!call) throw new Error(`線の札 ${tag.text} の呼び出しの管が無い`);
  const pipe = Math.min(
    ...segsOf(call.points).map(([a, b]) =>
      gapOf(tag, { x: Math.min(a[0], b[0]) - PIPE_HALF, y: Math.min(a[1], b[1]) - PIPE_HALF, w: Math.abs(b[0] - a[0]) + PIPE_HALF * 2, h: Math.abs(b[1] - a[1]) + PIPE_HALF * 2 }),
    ),
  );
  const rests = L.chips
    .filter((c) => c.kind === "return" && c.w > 0 && c.path && c.path.length > 1)
    .map((c): Rect => {
      const [x, y] = (c.path as Point[])[(c.path as Point[]).length - 1] as Point;
      return { x: x - c.w / 2, y: y - c.h / 2, w: c.w, h: c.h };
    });
  return { pipe, back: Math.min(...rests.map((r) => gapOf(tag, r)), Number.POSITIVE_INFINITY) };
}

describe.for(["ja", "en"])("vault-proxy (%s) の線の札", (lang) => {
  it("pipe-call-tag-clears-parts", () => {
    const { layout: L, drawn } = vaultFigure(lang);
    const tags = L.callTags ?? [];
    expect(tags.length, "線の札の枚数").toBe(1);
    const hits: string[] = [];
    drawn.stills.forEach((still, s) => {
      // 段 s の止め絵に見えている部品。ログの札は発した段から後に見え、呼び出しの札は見える区間に、返した値の札は止まって見える区間に見える
      const parts: { name: string; rect: Rect }[] = [
        ...L.parties.map((p) => ({ name: `箱 ${p.name}`, rect: p })),
        ...L.parties.map((p) => ({ name: `箱 ${p.name} の名前`, rect: p.label })),
        ...L.tanks.map((t) => ({ name: `槽 ${t.party}/${t.token}`, rect: t })),
        ...(L.gauges ?? []).map((g) => ({ name: `計器 (段 ${g.step + 1})`, rect: g })),
        ...(L.logCards ?? []).filter((c) => (c.step ?? 0) <= s).map((c) => ({ name: `ログの札 ${c.title}`, rect: c })),
        ...(L.callCards ?? []).filter((c) => visibleAt(c.shown, still)).map((c) => ({ name: `呼び出しの札 ${c.call}`, rect: c })),
        ...(drawn.pieces ?? [])
          .filter((p) => p.kind === "chip" && p.rect && visibleAt(p.shown, still))
          .map((p) => ({ name: `返した値の札 ${p.text}`, rect: p.rect as Rect })),
      ];
      for (const t of tags) for (const part of parts) if (overlaps(t, part.rect)) hits.push(`段 ${s + 1} ${t.text} と${part.name}`);
    });
    expect([...new Set(hits)], "線の札が重なる部品").toEqual([]);
  });

  it("pipe-call-tag-sits-beside-short-pipe", () => {
    // VaultProxy と VaultLogic の間の管は短い。札は管から遠い所と線の端の外まで探し、管の上に重ねずに管の横に置く (#3949)
    const { layout: L } = vaultFigure(lang);
    const tag = (L.callTags ?? []).find((t) => t.from === "proxy" && t.to === "logic");
    expect(tag, "VaultProxy から VaultLogic への線の札").toBeTruthy();
    const { pipe, back } = tagClearance(L as GapLayout, tag as GapTag);
    expect(pipe, `札 ${JSON.stringify(rounded(tag as Rect))} と管の縁の隙間`).toBeGreaterThanOrEqual(8);
    expect(back, `札 ${JSON.stringify(rounded(tag as Rect))} と返り値の札の止まる所の隙間`).toBeGreaterThanOrEqual(8);
  });

  it("pipe-call-tag-drawn-above-lit-pipes", () => {
    // 段ごとの絵は呼び出しの管を光らせて描く。線の札は全ての段の絵より後に描き、光る管に隠れない
    const { svg } = vaultFigure(lang);
    const tagAt = svg.indexOf("data-pipe-calltag=");
    expect(tagAt, "線の札を描いていない").toBeGreaterThanOrEqual(0);
    expect(tagAt, "線の札の組が最後の段の組より前に在る").toBeGreaterThan(svg.lastIndexOf("data-pipe-frame="));
  });
});

// ---- 処理を借りる呼び出しの線の札の隙間 (#3949)

/**
 * 網型で、Diamond が DiamondCutFacet の処理を借りる呼び出し。0.80.0 から線の札が戻りの ok の札に 23px 重なった (#3949)。
 * Tracelyth のアップグレードのサンプル (Diamond) と同じ記法
 */
const DIAMOND_CUT = `pipe Diamond.diamondCutを実行
layout mesh

box alice as Alice
box diamond as Diamond
box cut as DiamondCutFacet
box v1 as CounterFacetV1
box v2 as CounterFacetV2

hold diamond: "count" 1 [tank]

step AliceがDiamondのdiamondCutを呼ぶ
  say AliceがDiamond.diamondCutを呼び出します。
  alice -> diamond: "diamondCut(_diamondCut: [(v2, 1, [0xd09de08a])], _init: 0x0000000000000000000000000000000000000000, _calldata: 0x)"

step DiamondのincrementのファセットがCounterFacetV1からCounterFacetV2になる
  say DiamondがDiamondCutFacetのdiamondCutの処理を借りて、自分のincrementのファセットをCounterFacetV1からCounterFacetV2に書き換えます。
  diamond -> cut: "diamondCut(_diamondCut: [(v2, 1, [0xd09de08a])], _init: 0x0000000000000000000000000000000000000000, _calldata: 0x)" [call: delegate]
  emit diamond: DiamondCut(_diamondCut: [(v2, 1, [0xd09de08a])], _init: 0x0000000000000000000000000000000000000000, _calldata: 0x)
  return cut: ok

step トランザクションが成功する
  say 全ての変更が反映されました。incrementのファセットはCounterFacetV1からCounterFacetV2になりました。
  return diamond: ok
`;
// 図は file を読み込む段で描き、件は描いた物を読む (#3738)
const DIAMOND = await atLoad<GapLayout>("Diamond.diamondCut の図を描く", () => {
  const parsed = api.parseNotation(DIAMOND_CUT, { lang: "ja" });
  if (!parsed.ok) throw new Error(`Diamond.diamondCut を読めない: ${parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join(" / ")}`);
  return api.renderDiagram(parsed.diagram, { lang: "ja" }).layout;
});
const diamondTag = (): GapTag => {
  const tag = (DIAMOND.get().callTags ?? []).find((t) => t.from === "diamond" && t.to === "cut");
  if (!tag) throw new Error("Diamond から DiamondCutFacet への線の札が無い");
  return tag;
};

describe("Diamond.diamondCut の線の札 (#3949)", () => {
  it("pipe-call-tag-clears-return-chip", () => {
    const tag = diamondTag();
    expect(tagClearance(DIAMOND.get(), tag).back, `札 ${JSON.stringify(rounded(tag))} と戻りの ok の札の止まる所の隙間`).toBeGreaterThanOrEqual(8);
  });

  it("pipe-call-tag-clears-pipe-edge", () => {
    const tag = diamondTag();
    expect(tagClearance(DIAMOND.get(), tag).pipe, `札 ${JSON.stringify(rounded(tag))} と呼び出しの管の縁の隙間`).toBeGreaterThanOrEqual(8);
  });
});

describe("描いたログの札と線の札の隙間 (#3949)", () => {
  // 描く段はログの札を線の札から 6px 空けて置き直す。並べ方の段の線の札はログの札の仮の置き場を避けないので、描く段が離す
  const figures = (): [string, GapLayout][] => [
    ["Diamond.diamondCut", DIAMOND.get()],
    ["vault-proxy (ja)", vaultFigure("ja").layout as GapLayout],
    ["vault-proxy (en)", vaultFigure("en").layout as GapLayout],
  ];
  it("pipe-log-card-clears-call-tag", () => {
    const near: string[] = [];
    for (const [name, L] of figures())
      for (const tag of L.callTags ?? [])
        for (const card of L.logCards ?? []) {
          const gap = gapOf(tag, card);
          if (gap < 6 - 1e-6) near.push(`${name} ${tag.text} とログの札 ${card.title} の隙間 ${gap.toFixed(1)}px`);
        }
    expect(near, "線の札から 6px 未満のログの札").toEqual([]);
  });
});
