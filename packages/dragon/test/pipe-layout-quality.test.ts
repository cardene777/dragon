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
 * 図は入口 (`@cardenelabs/dragon` = `dist`) で描く。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { afterEach, describe, expect, it } from "vitest";

/*
 * 崩れを数える部品と知らせる文の元の code を、検査の外で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで数秒かかる (#3410)
 */
const [{ findBreaks }, { describeBreak, checkLayoutText }, { PIPE_LOOK }, page] = await Promise.all([
  import("../src/render/breaks"),
  import("../src/render/layout-check"),
  import("../src/look/pipe"),
  import("../src/export/page"),
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
  /** 向きの矢じり。`dx` と `dy` は流れる向きの単位の向き */
  chevrons?: { x: number; y: number; dx: number; dy: number }[];
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
  fixed?: { shape: string; order: string[]; routes?: [string, string][] };
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

// ---- 線の通り道

describe("線の通り道", () => {
  it("pipe-pipes-enter-tanks-from-top", () => {
    for (const shape of SHAPES) {
      const L = drawOnce(gridText(3, 3, { layout: shape })).layout;
      const tankAt = (party: string, token: string): Tank | undefined => L.tanks.find((t) => t.party === party && t.token === token);
      expect(L.valuePipes.length, `${shape} の値のパイプ`).toBeGreaterThan(0);
      for (const v of L.valuePipes) {
        for (const [k, port] of v.ports.entries()) {
          const tank = tankAt(port.party, port.token);
          if (!tank) continue;
          expect(port.side, `${shape} の ${v.token} ${v.from}>${v.to} が槽の${port.side}の縁から入る`).toBe("top");
          // 槽の上の縁の口へは、上から真っすぐ下りて着く
          const end = k === 0 ? v.points.slice(0, 2) : v.points.slice(-2).reverse();
          const [at, before] = end as [Point, Point];
          expect(Math.abs(at[1] - tank.y), `${shape} の ${v.token} ${v.from}>${v.to} の口が槽の上の縁に無い`).toBeLessThan(1);
          expect(Math.abs(before[0] - at[0]) < D && before[1] < at[1], `${shape} の ${v.token} ${v.from}>${v.to} が上から下りて槽に入らない`).toBe(true);
        }
      }
    }
  });

  it("pipe-routes-reserve-only-passed-calls", () => {
    const passed: [string, string][] = [
      ["alice", "router1"],
      ["bob", "router2"],
      ["carol", "router3"],
      ["alice", "router3"],
    ];
    for (const shape of SHAPES) {
      const all = drawOnce(gridText(3, 3, { layout: shape, routes: passed })).layout;
      // 置き方は渡した組の分だけ通り道を空け、渡した組に無い人と箱の組 (bob と router1 など) の通り道を空けない
      const reserved = (all.fixed?.routes ?? []).map(([a, b]) => `${a}>${b}`).sort();
      expect(reserved, `${shape} の空けた通り道`).toEqual(passed.map(([a, b]) => `${a}>${b}`).sort());
      // 渡した組を変えずに段を減らしても、人と箱と槽の置き場所は変わらない
      const fewer = drawOnce(gridText(3, 3, { layout: shape, routes: passed, only: [0] })).layout;
      const places = (L: PipeLayout): string =>
        JSON.stringify([...L.parties.map((p) => [p.id, Math.round(p.x), Math.round(p.y)]), ...L.tanks.map((t) => [`${t.party}/${t.token}`, Math.round(t.x), Math.round(t.y)])].sort());
      expect(places(fewer), `${shape} で段を減らすと置き場所が動いた`).toBe(places(all));
      // 組を書かない図は、段に出る呼び出しの組だけを空ける
      const plain = drawOnce(gridText(3, 3, { layout: shape })).layout;
      expect((plain.fixed?.routes ?? []).map(([a, b]) => `${a}>${b}`).sort(), `${shape} で組を書かない図の通り道`).toEqual(["alice>router1", "bob>router2", "carol>router3"]);
    }
    // 組に知らない名前を書いた行は読まずに断る
    const refused = api.parseNotation(gridText(2, 2, { layout: "top", routes: [["alice", "nobody"]] }), { lang: "ja" });
    expect(refused.ok, "知らない名前の route の行").toBe(false);
  });

  it("pipe-faint-lines-avoid-boxes", () => {
    // 薄く描く線は、2人を結ぶ点線 (許可の値) と、その段で流れない値のパイプ
    const figures: [string, Figure][] = [...SHAPES, undefined].flatMap((shape): [string, Figure][] => [
      [`${shape ?? "既定"} 許可で送る`, drawOnce(permitText(shape))],
      [`${shape ?? "既定"} 3人3箱`, drawOnce(gridText(3, 3, shape ? { layout: shape } : {}))],
    ]);
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
  it("pipe-logs-sit-in-top-band", () => {
    for (const shape of SHAPES) {
      const f = drawOnce(gridText(3, 3, { layout: shape, logs: 2 }));
      const L = f.layout;
      const cards = L.logCards ?? [];
      expect(cards.length, `${shape} のログの札`).toBe(6);
      // 呼び出しの線より上の帯に置く
      const callTop = Math.min(...L.mains.flatMap((m) => m.branches.flatMap((b) => b.points.map((p) => p[1]))));
      for (const c of cards) expect(c.y + c.h, `${shape} の ${c.title} が呼び出しの線より上に無い`).toBeLessThanOrEqual(callTop + D);
      // 発した順 (段の順、段の中は発した順) に左から並べる。2段にした時は上の段から読む
      const order = [...cards].sort((a, b) => (a.step ?? 0) - (b.step ?? 0) || (a.event ?? 0) - (b.event ?? 0));
      expect(
        order.every((c) => c.step !== undefined && c.event !== undefined),
        `${shape} のログの札が発した段を持たない`,
      ).toBe(true);
      const read = [...cards].sort((a, b) => a.y - b.y || a.x - b.x);
      expect(read.map((c) => c.title), `${shape} の札の並び`).toEqual(order.map((c) => c.title));
      // 発した箱へ点線で結ぶ。点線は札の下の縁から出て、発した箱の上の縁に着く
      for (const c of cards) {
        const box = L.parties.find((p) => p.id === c.party);
        const [first, last] = [c.tether?.[0], c.tether?.at(-1)];
        expect(first && Math.abs(first[1] - (c.y + c.h)) < 1, `${shape} の ${c.title} の点線が札の下の縁から出ない`).toBe(true);
        expect(box && last && Math.abs(last[1] - box.y) < 1 && last[0] > box.x && last[0] < box.x + box.w, `${shape} の ${c.title} の点線が ${c.party} の上の縁に着かない`).toBe(true);
      }
    }
    // 図の幅に並びきらない時は帯を2段にする
    const many = drawOnce(gridText(1, 1, { layout: "top", logs: 8 }));
    const cards = many.layout.logCards ?? [];
    const rows = new Set(cards.map((c) => Math.round(c.y)));
    expect(rows.size, "並びきらない札の帯の段").toBe(2);
    for (const c of cards) expect(c.x >= 0 && c.x + c.w <= many.layout.width, `${c.title} が図の外にはみ出す`).toBe(true);
    expect(overlapsOf(many), "2段にした札の重なり").toEqual([]);
  });

  it("pipe-value-pipes-carry-chevrons", () => {
    for (const shape of [...SHAPES, undefined]) {
      const f = drawOnce(gridText(3, 3, shape ? { layout: shape } : {}));
      const flows = f.layout.flows.filter((x) => x.points.length > 1);
      expect(flows.length, `${shape ?? "既定"} の流れ`).toBeGreaterThan(0);
      for (const fl of flows) {
        const chevrons = fl.chevrons ?? [];
        const length = segsOf(fl.points).reduce((s, [a, b]) => s + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), 0);
        expect(chevrons.length, `${shape ?? "既定"} の ${fl.token} ${fl.from}>${fl.to} (長さ ${Math.round(length)}) の矢じりの数`).toBeGreaterThanOrEqual(Math.max(1, Math.floor(length / 44) - 1));
        // 道の上で隣どうしが44px離れ、流れる向きを指す
        const walked = (p: { x: number; y: number }): number => {
          let s = 0;
          for (const [a, b] of segsOf(fl.points)) {
            const onSeg = isFlat([a, b]) ? Math.abs(p.y - a[1]) < 1 && p.x >= Math.min(a[0], b[0]) - 1 && p.x <= Math.max(a[0], b[0]) + 1 : Math.abs(p.x - a[0]) < 1 && p.y >= Math.min(a[1], b[1]) - 1 && p.y <= Math.max(a[1], b[1]) + 1;
            if (onSeg) {
              const dir: Point = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
              const c = chevrons.find((x) => x.x === p.x && x.y === p.y);
              expect(c && c.dx === dir[0] && c.dy === dir[1], `${fl.token} ${fl.from}>${fl.to} の矢じりが流れる向きを指さない`).toBe(true);
              return s + Math.abs(p.x - a[0]) + Math.abs(p.y - a[1]);
            }
            s += Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
          }
          return Number.NaN;
        };
        const at = chevrons.map(walked);
        expect(at.every((d) => Number.isFinite(d)), `${fl.token} ${fl.from}>${fl.to} の矢じりが道の上に無い`).toBe(true);
        for (let i = 1; i < at.length; i++) expect(Math.abs((at[i] as number) - (at[i - 1] as number) - 44), `${fl.token} ${fl.from}>${fl.to} の矢じりの間`).toBeLessThan(1);
      }
      // 1 本の流れの矢じりは 1 つの path の区切った道 (`M` で始まる 1 つずつ) にまとめて描く
      const drawn = [...f.svg.matchAll(/class="dg-pp-chev" d="([^"]*)"/gu)].reduce((s, m) => s + ((m[1] ?? "").match(/M/gu) ?? []).length, 0);
      expect(drawn, `${shape ?? "既定"} の矢じりを描いていない`).toBeGreaterThanOrEqual(flows.reduce((s, fl) => s + (fl.chevrons?.length ?? 0), 0));
    }
  });

  it("pipe-prev-value-under-box", () => {
    for (const shape of [...SHAPES, undefined]) {
      const f = drawOnce(gridText(2, 2, shape ? { layout: shape } : {}));
      const changed = f.layout.plates.filter((p) => !p.boxed && !p.row && p.was);
      expect(changed.length, `${shape ?? "既定"} の前の値を持つ値の箱`).toBeGreaterThan(0);
      for (const p of changed) {
        const bottom = p.y + p.h;
        const what = `${shape ?? "既定"} 段${p.step + 1} の ${p.party}.${p.name}`;
        expect(p.strike, `${what} の前の値を線で消している`).toBeUndefined();
        for (const [name, t] of [
          ["前の札", p.before],
          ["前の値", p.was],
          ["確定の札", p.tag],
        ] as [string, Text | undefined][]) {
          expect(t, `${what} の${name}が無い`).toBeDefined();
          if (!t) continue;
          expect(t.y, `${what} の${name}が箱の下端より上`).toBeGreaterThanOrEqual(bottom - D);
          expect(t.y + t.h, `${what} の${name}が箱の下端から24pxより下`).toBeLessThanOrEqual(bottom + 24);
        }
      }
    }
  });

  it("pipe-io-tags-outside-frame", () => {
    // 交換の見本 (`swap`) と、人と箱の数を変えた図
    const figures: [string, Figure][] = [
      ["見本 swap", drawOnce(exampleText("swap.dragon"))],
      ["見本 swap top", drawOnce(exampleText("swap.dragon").replace(/\n\n/u, "\nlayout top\n\n"))],
      ...SHAPES.map((shape): [string, Figure] => [`${shape} 3人3箱`, drawOnce(gridText(3, 3, { layout: shape }))]),
    ];
    for (const [what, f] of figures) {
      const L = f.layout;
      const io = L.chips.filter((c) => c.kind === "io");
      expect(io.length, `${what} の入力と出力の札`).toBeGreaterThan(0);
      const words = new Set(io.map((c) => c.text));
      expect([...words].sort(), `${what} の札の語`).toEqual(["入力", "出力"]);
      for (const step of new Set(io.map((c) => c.step))) {
        const here = io.filter((c) => c.step === step);
        // 入力と出力は対で読む。札は槽の持ち主の枠に付けるので、受け取った分を別の人へ送る交換 (見本 swap) は、出力の札が受け取った人に付く
        expect([...new Set(here.map((c) => c.text))].sort(), `${what} 段${step + 1} の入力と出力の対`).toEqual(["入力", "出力"]);
        for (const c of here) {
          const frame = L.housings.find((h) => h.party === c.party);
          expect(frame, `${what} の ${c.party} の点線の枠`).toBeDefined();
          if (!frame) continue;
          expect(c.y + c.h, `${what} 段${step + 1} の ${c.party} の${c.text}の札が枠の上の縁に重なる`).toBeLessThanOrEqual(frame.y - 1);
          expect(c.x >= frame.x - D && c.x + c.w <= frame.x + frame.w + D, `${what} 段${step + 1} の ${c.party} の${c.text}の札が枠の上に無い`).toBe(true);
        }
      }
    }
  });

  it("pipe-contracts-share-shape-and-height", () => {
    // router3 は値を持つが、どの段でも呼ばれない
    const text = gridText(3, 3, { layout: "top", only: [0, 1] });
    for (const t of [text, text.replace("layout top", "layout bottom"), text.replace("layout top\n", "")]) {
      const L = drawOnce(t).layout;
      const contracts = L.parties.filter((p) => p.id.startsWith("router"));
      expect(contracts.map((p) => p.shape), "コントラクトの形").toEqual(["cabinet", "cabinet", "cabinet"]);
      expect(new Set(contracts.map((p) => Math.round(p.h))).size, "コントラクトの箱の高さが揃わない").toBe(1);
      const tokens = L.parties.filter((p) => p.shape === "token");
      expect(new Set(tokens.map((p) => Math.round(p.h))).size, "トークンの箱の高さが揃わない").toBe(1);
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

  it("pipe-fit-wide-keeps-readable-text", () => {
    const wide = parse(gridText(3, 3, { layout: "top" }));
    const small = parse(gridText(1, 1, { layout: "top" }));
    for (const frame of [1200, 390]) {
      const layout = api.renderDiagram(wide, { lang: "ja", width: frame }).layout;
      expect(layout.width, "図が1300pxより狭い").toBeGreaterThan(1300);
      const name = Math.min(...layout.parties.map((p) => p.label.h));
      // 全体を枠に収めると名前の字が10.5pxを下回る図
      expect((name * Math.min(frame, layout.width)) / layout.width, "全体を収めても字が読める図").toBeLessThan(10.5);
      const m = mount(wide, frame, { lang: "ja", fitWide: true, minZoom: 0.25 });
      const px = (name * m.shown()) / layout.width;
      expect(px, `枠 ${frame}px で始めた名前の字の大きさ`).toBeGreaterThanOrEqual(10.5 - 1e-6);
      expect(px, `枠 ${frame}px で字を10.5pxより大きく始めた`).toBeLessThan(10.5 + name * 0.02);
    }
    // 全体を収めても字が10.5px以上の図は、今どおり全体を枠に収めて始める
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
    for (const text of [gridText(2, 2, { layout: "top" }), gridText(1, 3, { layout: "bottom" }), exampleText("swap.dragon")]) {
      const diagram = parse(text);
      const plan = page.planPage(diagram, { lang: "ja" });
      const video = plan.followSvg ?? plan.rendered.svg;
      const f = draw(text);
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
      "dg-pp-pcase": "fill:none;stroke:var(--line);stroke-width:14;stroke-linejoin:round",
      "dg-pp-pbore": "fill:none;stroke:color-mix(in srgb,var(--line) 22%,var(--surf));stroke-width:8;stroke-linejoin:round",
      "dg-pp-mtrack": "fill:none;stroke:color-mix(in srgb,var(--pp-t) 40%,var(--surf));stroke-width:8;stroke-linejoin:round",
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
    expect(overlapsOf(figure(), true), "重なる部品").toEqual([]);
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
    const f = drawOnce(gridText(3, 3, { layout: shape, long: true, logs: 5 }));
    expect(f.layout.parties.every((p) => p.name.length > 40), "名前が40字を超えていない").toBe(true);
    expect(f.layout.logCards?.length ?? 0, "ログの札の枚数").toBe(15);
    expect(overlapsOf(f, true), "重なる部品").toEqual([]);
    expect(linesOverTextOf(f), "箱と槽の中か字の上を通る線").toEqual([]);
  });
});
