/**
 * 配管の図の札と管の重なり (#3523)。
 *
 * 見本と評価の図を書き出して目で探した調べで、配管の図 13 枚のうち 11 枚で、呼んだ側へ返した値の札が呼んだ側の弁と計器と箱に重なっていた。
 * 見本`swap-retry`の段 11 では Pool1 から出る 2 本の管の弁が隣の管に触れ、`swap-two-hops`の段 13 では管が SwapRouter の箱の下の縁に沿って角の後ろを通り、
 * 2 つの呼び出しが逆向きに 1 本の管を共に通っていた。`dragon check --layout`はどれも知らせなかった。
 *
 * 見本の図は置き場所 (`layout`) の座標で確かめる。返した値の札は呼び出しの管を伝って動き、管の終わり (`path`の最後の点) に止まる。
 * 崩れの確かめは、描いた部品を直に崩れの確かめへ渡して確かめる。描く側は札が収まる長さまで管を伸ばすので (#3607)、札が部品に重なる図はもう描けない。
 * 管どうしの重なりは、直した後の見本には残らないため、描いた部品を直に渡す。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

/*
 * 崩れを数える部品と知らせる文の元の code を、検査の外で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで数秒かかる (#3410)
 */
const [{ findBreaks }, { describeBreak }, { valveRects }, { PIPE_LOOK }] = await Promise.all([
  import("../src/render/breaks"),
  import("../src/render/layout-check"),
  import("../src/pipe-valve"),
  import("../src/look/pipe"),
]);

type Point = [number, number];
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Party extends Rect {
  id: string;
  name: string;
  shape: "round" | "cabinet" | "token";
}
interface Branch {
  to: string;
  points: Point[];
  valve: { x: number; y: number; vertical: boolean; under: boolean };
}
interface Main {
  from: string;
  branches: Branch[];
}
interface Chip extends Rect {
  kind: string;
  text: string;
  step: number;
  path?: Point[];
}
interface Gauge extends Rect {
  party: string;
  step: number;
  lamp: { x: number; y: number; r: number };
  stem?: { y1: number; y2: number };
  cx: number;
}
interface Laid {
  kind: string;
  parties: Party[];
  mains: Main[];
  chips: Chip[];
  gauges: Gauge[];
}
type Part =
  | { kind: "badge"; step: number }
  | { kind: "box"; name: string }
  | { kind: "slot"; box: string }
  | { kind: "text"; text: string; box?: string }
  | { kind: "line"; from: string; to: string; step: number }
  | { kind: "valve"; from: string; to?: string }
  | { kind: "gauge"; box: string }
  | { kind: "pipe"; from: string; to: string; step: number };
interface LayoutBreak {
  kind: string;
  step: number;
  width?: number;
  parts: Part[];
}

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const P = PIPE_LOOK;
const HALF = P.call.case / 2;
/** 管と部品の間の下限。平行な管の縁どうしの間と同じ (`kinds/pipe/layout.ts`の`LINE_GAP`) */
const LINE_GAP = 10;
const ALWAYS: [number, number][] = [[0, Number.POSITIVE_INFINITY]];

/** 見本の記法を読んで既定の幅で描いた置き場所 */
function laid(name: string, lang: "ja" | "en" = "ja"): Laid {
  const text = readFileSync(join(EXAMPLES, lang === "ja" ? `${name}.dragon` : `${name}.en.dragon`), "utf8");
  const parsed = dragon.parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`${name} (${lang}) を読めない: ${JSON.stringify(parsed.errors)}`);
  const layout = dragon.renderDiagram(parsed.diagram, { lang }).layout as unknown as Laid;
  expect(layout.kind, `${name} が配管の図として描かれない`).toBe("pipe");
  return layout;
}

/** 2 つの四角が縁の触れ合いより深く重なるか */
const overlaps = (a: Rect, b: Rect): boolean => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5;
/** 2 つの四角の縁の間。重なる時は負 */
const gapOf = (a: Rect, b: Rect): number => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
const segs = (points: Point[]): [Point, Point][] => points.slice(1).map((b, i) => [points[i] as Point, b]);
const flat = (a: Point, b: Point): boolean => Math.abs(a[1] - b[1]) < 0.5;
/** 線分を太さ `half` の半分で広げた四角 */
const caseOf = ([u, v]: [Point, Point], half: number): Rect => ({
  x: Math.min(u[0], v[0]) - half,
  y: Math.min(u[1], v[1]) - half,
  w: Math.abs(v[0] - u[0]) + half * 2,
  h: Math.abs(v[1] - u[1]) + half * 2,
});

/** 段 `step` (0 から数える) の、`text` を書いた戻り値の札と、札が止まる所の四角 */
function arrived(layout: Laid, step: number, text: string): Rect {
  const chip = layout.chips.find((c) => c.kind === "return" && c.step === step && c.text === text);
  expect(chip, `段 ${step + 1} に戻り値の札「${text}」が無い`).toBeDefined();
  const end = chip?.path?.[chip.path.length - 1];
  expect(end, `戻り値の札「${text}」が伝う道が無い`).toBeDefined();
  if (!chip || !end) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: end[0] - chip.w / 2, y: end[1] - chip.h / 2, w: chip.w, h: chip.h };
}

/** 置いた弁を、どの呼び出しの弁かの名前と、弁が描く形 (胴と軸と閉じた取っ手と開いた取っ手) の四角で並べる */
const valvesOf = (layout: Laid): { name: string; from: string; to: string; branch: Branch; rects: Rect[] }[] =>
  layout.mains.flatMap((m) =>
    m.branches.map((b) => ({ name: `${m.from}>${b.to}`, from: m.from, to: b.to, branch: b, rects: valveRects(b.valve.x, b.valve.y, b.valve.vertical, b.valve.under) })),
  );

/** 計器が描く形。針の盤と、通ったかの印と、値の管から上る軸 */
const gaugeRects = (g: Gauge): Rect[] => [
  { x: g.x, y: g.y, w: g.w, h: g.h },
  { x: g.lamp.x - g.lamp.r, y: g.lamp.y - g.lamp.r, w: g.lamp.r * 2, h: g.lamp.r * 2 },
  ...(g.stem ? [{ x: g.cx - 2, y: Math.min(g.stem.y1, g.stem.y2), w: 4, h: Math.abs(g.stem.y2 - g.stem.y1) }] : []),
];

/** 止まった札に重なる部品の名前。全ての弁と、その段の全ての計器と、全ての箱を見る */
function coveredBy(layout: Laid, step: number, rect: Rect): string[] {
  return [
    ...valvesOf(layout)
      .filter((v) => v.rects.some((r) => overlaps(rect, r)))
      .map((v) => `弁 ${v.name}`),
    ...layout.gauges.filter((g) => g.step === step && gaugeRects(g).some((r) => overlaps(rect, r))).map((g) => `計器 ${g.party}`),
    ...layout.parties.filter((p) => overlaps(rect, p)).map((p) => `箱 ${p.id}`),
  ];
}

describe("戻り値の札は弁と計器と箱に重ならない所に止まる (#3523)", () => {
  it("pipe-return-chip-clears-valve-and-gauge", () => {
    for (const lang of ["ja", "en"] as const) {
      const layout = laid("swap", lang);
      // 段 14 で Router が Alice へ 0.05 WETH を返す。Alice の弁と、Alice の管に載せた Router の計器が札の通り道に在る
      const chip = arrived(layout, 13, "0.05 WETH");
      const valve = valvesOf(layout).find((v) => v.name === "alice>router");
      expect(valve, `swap (${lang}) に Alice から Router への管の弁が無い`).toBeDefined();
      const gauge = layout.gauges.find((g) => g.step === 13 && g.party === "router");
      expect(gauge, `swap (${lang}) の段 14 に Router の計器が無い`).toBeDefined();
      expect(valve?.rects.some((r) => overlaps(chip, r)), `swap (${lang}) の段 14 の札「0.05 WETH」が Alice の弁に重なる`).toBe(false);
      expect(gauge ? gaugeRects(gauge).some((r) => overlaps(chip, r)) : true, `swap (${lang}) の段 14 の札「0.05 WETH」が Router の計器に重なる`).toBe(false);
      expect(coveredBy(layout, 13, chip), `swap (${lang}) の段 14 の札「0.05 WETH」に重なる部品`).toEqual([]);
    }
  });

  it("pipe-return-chip-clears-box-and-lever", () => {
    for (const lang of ["ja", "en"] as const) {
      const layout = laid("swap-retry", lang);
      // 段 4 で USDC が Pool1 へ true を返す。札は Pool1 の箱の手前の、Pool1 から USDC への管の弁の上で止まっていた
      const chip = arrived(layout, 3, "true");
      const pool1 = layout.parties.find((p) => p.id === "pool1");
      expect(pool1, `swap-retry (${lang}) に Pool1 の箱が無い`).toBeDefined();
      expect(pool1 ? overlaps(chip, pool1) : true, `swap-retry (${lang}) の段 4 の札「true」が Pool1 の箱に重なる`).toBe(false);
      const levers = valvesOf(layout).filter((v) => v.from === "pool1");
      expect(levers.length, `swap-retry (${lang}) に Pool1 から出る管の弁が無い`).toBeGreaterThan(0);
      for (const v of levers) expect(v.rects.some((r) => overlaps(chip, r)), `swap-retry (${lang}) の段 4 の札「true」が弁 ${v.name} の胴か取っ手に重なる`).toBe(false);
      expect(coveredBy(layout, 3, chip), `swap-retry (${lang}) の段 4 の札「true」に重なる部品`).toEqual([]);
    }
  });
});

describe("呼び出しの管と弁は重ならない (#3523)", () => {
  it("pipe-valves-keep-clear-of-sibling-pipes", () => {
    for (const lang of ["ja", "en"] as const) {
      const layout = laid("swap-retry", lang);
      const valves = valvesOf(layout).filter((v) => v.from === "pool1");
      expect(valves.map((v) => v.to).sort(), `swap-retry (${lang}) の Pool1 から出る管`).toEqual(["usdc", "weth"]);
      for (const v of valves) {
        const { x, y, vertical } = v.branch.valve;
        const body: Rect = vertical ? { x: x - P.valve.half, y: y - P.valve.r, w: P.valve.half * 2, h: P.valve.r * 2 } : { x: x - P.valve.r, y: y - P.valve.half, w: P.valve.r * 2, h: P.valve.half * 2 };
        for (const other of valvesOf(layout)) {
          if (other.name === v.name) continue;
          // 同じ者の管が弁の所で弁の管と重なって走る所 (本管) は、弁が載る管と同じ線なので測らない
          const onValve = (u: Point, w: Point): boolean =>
            other.from === v.from && (vertical ? !flat(u, w) && Math.abs(u[0] - x) < 0.5 : flat(u, w) && Math.abs(u[1] - y) < 0.5);
          const least = Math.min(...segs(other.branch.points).flatMap((s) => (onValve(s[0], s[1]) ? [] : [gapOf(body, caseOf(s, HALF))])), Number.POSITIVE_INFINITY);
          expect(least, `swap-retry (${lang}) の弁 ${v.name} の胴と管 ${other.name} の縁の間`).toBeGreaterThanOrEqual(LINE_GAP - 0.01);
        }
      }
    }
  });

  it("pipe-calls-leave-straight-edges-and-stay-apart", () => {
    for (const lang of ["ja", "en"] as const) {
      const layout = laid("swap-two-hops", lang);
      // 管の端が箱の縁に在る時、縁の角から管の太さの半分と角の丸みを足した長さより内に在る。角の丸みにかかる管は箱の縁の後ろを通って見える
      const corner = (p: Party): number => (p.shape === "cabinet" ? P.cabinet.radius : P.token.radius);
      const ends = valvesOf(layout).flatMap((v) => [v.branch.points[0], v.branch.points[v.branch.points.length - 1]].map((end) => ({ name: v.name, end: end as Point })));
      expect(ends.length, `swap-two-hops (${lang}) の管の端`).toBeGreaterThan(0);
      for (const { name, end } of ends)
        for (const p of layout.parties.filter((q) => q.shape !== "round")) {
          const onSide = (Math.abs(end[0] - p.x) < 0.5 || Math.abs(end[0] - (p.x + p.w)) < 0.5) && end[1] > p.y - 0.5 && end[1] < p.y + p.h + 0.5;
          const onTop = (Math.abs(end[1] - p.y) < 0.5 || Math.abs(end[1] - (p.y + p.h)) < 0.5) && end[0] > p.x - 0.5 && end[0] < p.x + p.w + 0.5;
          if (!onSide && !onTop) continue;
          const room = onSide ? Math.min(end[1] - p.y, p.y + p.h - end[1]) : Math.min(end[0] - p.x, p.x + p.w - end[0]);
          expect(room, `swap-two-hops (${lang}) の管 ${name} の端が ${p.id} の箱の縁の角に近い`).toBeGreaterThanOrEqual(HALF + corner(p) - 0.5);
        }
      // Router から Pool1 への管と Router から Pool2 への管は、平行に走る所で管の太さが重ならない
      const pool1 = valvesOf(layout).find((v) => v.name === "router>pool1");
      const pool2 = valvesOf(layout).find((v) => v.name === "router>pool2");
      expect(pool1 && pool2, `swap-two-hops (${lang}) に Router から Pool1 と Pool2 への管が無い`).toBeTruthy();
      const shared: string[] = [];
      for (const a of segs(pool1?.branch.points ?? []))
        for (const b of segs(pool2?.branch.points ?? [])) {
          if (flat(a[0], a[1]) !== flat(b[0], b[1])) continue;
          const [k, o]: [0 | 1, 0 | 1] = flat(a[0], a[1]) ? [1, 0] : [0, 1];
          const along = Math.min(Math.max(a[0][o], a[1][o]), Math.max(b[0][o], b[1][o])) - Math.max(Math.min(a[0][o], a[1][o]), Math.min(b[0][o], b[1][o]));
          if (along > 0.5 && Math.abs(a[0][k] - b[0][k]) < P.call.case) shared.push(`${JSON.stringify(a)} と ${JSON.stringify(b)}`);
        }
      expect(shared, `swap-two-hops (${lang}) で Router から Pool1 と Pool2 への管が共に通る所`).toEqual([]);
    }
  });
});

/** 描いた部品 `pieces` を崩れの確かめへ直に渡す。止め絵は 4 段で、段 `n` の止め絵の時刻は `n` */
const run = (pieces: unknown[]): LayoutBreak[] =>
  findBreaks({ inks: [], traces: [], framed: [], stills: [1, 2, 3, 4], boxes: [], edges: [], outlines: new Map(), pieces } as never) as unknown as LayoutBreak[];
const box = (name: string, x: number, y: number, w: number, h: number, corner: number = P.cabinet.radius) => ({ kind: "box" as const, name, rect: { x, y, w, h }, corner, shown: ALWAYS });
const pipe = (from: string, to: string, step: number, points: Point[]) => ({ kind: "pipe" as const, from, to, step, points, half: HALF, shown: ALWAYS });
const valve = (from: string, to: string, step: number, x: number, y: number) => {
  const [body, ...lever] = valveRects(x, y, false, false);
  return { kind: "valve" as const, from, to, step, body: body as Rect, lever, shown: ALWAYS };
};
/** 知らせる文 */
const said = (b: LayoutBreak | undefined, lang: "ja" | "en"): string => (b ? describeBreak(b as never, lang) : "");

const LONG_TEXT = "呼び出しの管のどこにも収まらないほど長い戻り値の札";

describe("dragon check --layout が配管の図の重なりを知らせる (#3523)", () => {
  it("layout-check-finds-chip-over-pipe-part", () => {
    // 描く側は札が収まる長さまで管を伸ばすので (#3607)、札が弁と箱に重なる形は描いた部品を直に渡して確かめる。
    // 丸の名札の Alice から Router への管に Alice の弁が載り、段 2 で Router が返した長い札が管の上に止まる
    const alice = box("Alice", 100, 100, 80, 80, 40);
    const router = box("Router", 300, 112, 160, 56);
    const call = pipe("Alice", "Router", 1, [[180, 140], [300, 140]]);
    const lever = valve("Alice", "Router", 1, 220, 140);
    const chip = (x: number, y: number) => ({ kind: "chip" as const, text: LONG_TEXT, rect: { x, y, w: 260, h: 24 }, shown: [[2, 3]] as [number, number][] });
    const chips = run([alice, router, call, lever, chip(150, 128)]).filter((b) => b.kind === "chip-over-part");
    // 札は Alice の弁と、両端の Alice と Router の箱に重なる
    expect(chips.map((b) => b.parts[1]), "札が重なる部品").toEqual([
      { kind: "valve", from: "Alice", to: "Router" },
      { kind: "box", name: "Alice" },
      { kind: "box", name: "Router" },
    ]);
    for (const b of chips) {
      expect(b.parts[0], "札を名指さない").toEqual({ kind: "text", text: LONG_TEXT });
      expect(b.step, "札が見え始める段で知らせない").toBe(2);
    }
    // 管から離れた所に止まる札は知らせない
    expect(run([alice, router, call, lever, chip(150, 0)]).filter((b) => b.kind === "chip-over-part"), "部品から離れた札を知らせる").toEqual([]);
    // 知らせる文は札と弁を名指す
    const onValve = chips.find((b) => b.parts[1]?.kind === "valve");
    expect(said(onValve, "ja"), "札が弁に重なる文").toMatch(new RegExp(`${LONG_TEXT}.*Alice.*弁`, "u"));
    expect(said(onValve, "en"), "札が弁に重なる英語の文").toMatch(/valve/u);
  });

  it("layout-check-finds-pipes-overlapping", () => {
    const router = box("Router", 100, 100, 160, 56);
    // 箱の下の縁から 6px の高さで右の縁を出る管は、角の丸みにかかり、箱の縁の後ろを通って見える
    const behind = run([router, pipe("Router", "Pool1", 2, [[260, 150], [420, 150], [420, 300]])]);
    expect(behind, "角の丸みにかかる管を知らせない").toContainEqual({ kind: "pipe-behind-box", step: 2, parts: [{ kind: "pipe", from: "Router", to: "Pool1", step: 2 }, { kind: "box", name: "Router" }] });
    // 縁のまっすぐな所から出る管は知らせない
    expect(run([router, pipe("Router", "Pool1", 2, [[260, 128], [420, 128], [420, 300]])]), "縁のまっすぐな所から出る管を知らせる").toEqual([]);
    // 同じ者から出る 2 本の管が、逆向きに 1 本の管を共に通る
    const merged = run([router, pipe("Router", "Pool1", 2, [[260, 128], [500, 128], [500, 300]]), pipe("Router", "Pool2", 3, [[260, 110], [440, 110], [440, 128], [330, 128], [330, 300]])]);
    expect(merged.filter((b) => b.kind === "pipes-merged"), "逆向きに共に通る 2 本の管を知らせない").toEqual([
      { kind: "pipes-merged", step: 3, parts: [{ kind: "pipe", from: "Router", to: "Pool1", step: 2 }, { kind: "pipe", from: "Router", to: "Pool2", step: 3 }] },
    ]);
    // 名札の縁から同じ向きに共に通り、先で分かれる本管は知らせない
    const trunk = run([router, pipe("Router", "Pool1", 2, [[260, 128], [500, 128], [500, 300]]), pipe("Router", "Pool2", 3, [[260, 128], [400, 128], [400, 300]])]);
    expect(trunk.filter((b) => b.kind === "pipes-merged"), "同じ向きに共に通る本管を知らせる").toEqual([]);
    // 弁の胴が、隣を平行に走る管の縁から 3px しか離れない
    const near = run([pipe("Pool1", "USDC", 2, [[600, 200], [300, 200]]), pipe("Pool1", "WETH", 3, [[600, 222], [300, 222]]), valve("Pool1", "USDC", 2, 450, 200)]);
    expect(near, "隣の管に近すぎる弁を知らせない").toContainEqual({ kind: "valve-near-pipe", step: 3, parts: [{ kind: "valve", from: "Pool1", to: "USDC" }, { kind: "pipe", from: "Pool1", to: "WETH", step: 3 }] });
    const apart = run([pipe("Pool1", "USDC", 2, [[600, 200], [300, 200]]), pipe("Pool1", "WETH", 3, [[600, 244], [300, 244]]), valve("Pool1", "USDC", 2, 450, 200)]);
    expect(apart.filter((b) => b.kind === "valve-near-pipe"), "隣の管から離れた弁を知らせる").toEqual([]);
    // 知らせる文は管と箱と弁を名指す
    const behindBreak = behind.find((b) => b.kind === "pipe-behind-box");
    expect(said(behindBreak, "ja"), "管が箱の縁の後ろを通る文").toMatch(/Router → Pool1.*「Router」/u);
    expect(said(behindBreak, "en"), "管が箱の縁の後ろを通る英語の文").toMatch(/Router → Pool1.*"Router"/u);
    const mergedBreak = merged.find((b) => b.kind === "pipes-merged");
    expect(said(mergedBreak, "ja"), "2 本の管がまとまる文").toMatch(/Router → Pool1.*Router → Pool2/u);
    const nearBreak = near.find((b) => b.kind === "valve-near-pipe");
    expect(said(nearBreak, "ja"), "弁が管に近すぎる文").toMatch(/Pool1 → USDC.*弁.*Pool1 → WETH/u);
    expect(said(nearBreak, "en"), "弁が管に近すぎる英語の文").toMatch(/valve.*Pool1 → USDC.*Pool1 → WETH/u);
  });
});
