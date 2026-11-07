/**
 * 配管の図の置き場所の決まりの表と、組んだ図の違反を数える処理 (#3418)。
 *
 * 表の 1 行が 1 つの決まりで、受け持つ崩れの種類 (`breakage`) と、値が下限 (`min`) か上限 (`max`) かと、値を持つ。
 * 崩れは 8 種類。部品が込み合う (`crowded`)、線が名札の裏を通る (`behind-tag`)、管が絡む (`tangled`)、計器が管を外れる (`gauge-astray`)、
 * 点線を越える (`tie-crossing`)、空きが偏る (`lopsided`)、字に線がかかる (`text-under-line`)、線に小さな段差がある (`jog`)。
 * 空きの偏りは組み方で減らし、違反には数えない (`counted` が偽)。
 * 下限の決まりは測った値が値より小さい組を、上限の決まりは数えた値が値より大きい物を、1 つずつ違反にする。
 * 組み方 (`compose.ts`) はこの表を読まない。この表は組んだ後の置き場所だけを読んで測る。
 * 戻り値の札は呼び出しの管を伝って動き、止め絵に出ないので測らない
 */
import type { Point, Rect } from "./layout/scene";
import { PIPE_LOOK } from "./look/pipe";
import type { PipeLayout } from "./kinds/pipe/layout";
import { valveRects } from "./pipe-valve";

const P = PIPE_LOOK;

/** 崩れの種類 */
export type PipeBreakage = "crowded" | "behind-tag" | "tangled" | "gauge-astray" | "tie-crossing" | "lopsided" | "text-under-line" | "jog";

/** 決まりの表の 1 行 */
export interface PipeRule {
  name: string;
  breakage: PipeBreakage;
  /** 違反に数えるか */
  counted: boolean;
  /** 値が下限か上限か */
  kind: "min" | "max";
  value: number;
  /** 何を決めるか */
  about: string;
}

/** 決まりへの違反。`parts` は崩れた部品の名前、`step` は段ごとに変わる部品の段 */
export interface PipeViolation {
  rule: string;
  parts: string[];
  step?: number;
}

export const PIPE_RULES: readonly PipeRule[] = [
  { name: "part-gap", breakage: "crowded", counted: true, kind: "min", value: 8, about: "部品どうしの縁の間の下限 (px)。囲いの中の部品は同じ囲いの部品どうしで測る" },
  { name: "call-part-spacing", breakage: "crowded", counted: true, kind: "min", value: 14, about: "呼び出しの管に載せた弁と計器どうしの縁の間の下限 (px)" },
  {
    name: "valve-clearance",
    breakage: "crowded",
    counted: true,
    kind: "min",
    value: 3,
    about: "呼び出しの管の弁が描く形 (胴と軸と、閉じた取っ手と開いた取っ手) と、ほかの線の縁の間の下限 (px)。弁が載る管と、弁の所でその管と重なって走る同じ者の管は測らない",
  },
  { name: "line-through-part", breakage: "behind-tag", counted: true, kind: "max", value: 0, about: "線が通り抜ける部品の数の上限。線の両端の部品と自分の囲いは数えない" },
  { name: "text-clear", breakage: "text-under-line", counted: true, kind: "max", value: 0, about: "字と札にかかる線の数の上限" },
  { name: "gauge-on-line", breakage: "gauge-astray", counted: true, kind: "max", value: 1, about: "計器の真ん中か軸の端と、載せる管の芯の間の上限 (px)" },
  { name: "tie-crossings", breakage: "tie-crossing", counted: true, kind: "max", value: 0, about: "名札から囲いへ下りる点線を越える線の数の上限" },
  { name: "parallel-gap", breakage: "tangled", counted: true, kind: "min", value: 10, about: "平行に並ぶ 2 本の線の縁どうしの間の下限 (px)。同じ者から出る呼び出しの管どうしは測らない" },
  { name: "value-crossings", breakage: "tangled", counted: true, kind: "max", value: 0, about: "値の管どうしが交わる回数の上限" },
  { name: "call-crossings", breakage: "tangled", counted: true, kind: "max", value: 1, about: "1 本の呼び出しの管が 1 本の値の管を越える回数の上限" },
  { name: "bends", breakage: "jog", counted: true, kind: "max", value: 4, about: "1 本の管が折れる回数の上限" },
  { name: "short-segment", breakage: "jog", counted: true, kind: "min", value: 16, about: "管の折れ目と折れ目の間の長さの下限 (px)" },
  { name: "balance", breakage: "lopsided", counted: false, kind: "max", value: 0.5, about: "図の左右の余白の差を図の幅で割った割合の上限。組み方で減らし、違反には数えない" },
];

interface Line {
  name: string;
  kind: "value" | "stub" | "call" | "tie" | "write";
  points: Point[];
  half: number;
  /** 同じ組の線どうしは重なってよい */
  group: string;
  /** 通ってよい部品の名前 */
  own: Set<string>;
}
interface Part extends Rect {
  name: string;
  /** 囲いの中の部品は囲いの持ち主。囲いの外の部品は空 */
  inside: string;
  step?: number;
}

const segs = (points: readonly Point[]): [Point, Point][] => points.slice(1).map((b, i) => [points[i] as Point, b]);
const flat = (a: Point, b: Point): boolean => Math.abs(a[1] - b[1]) < 0.5;
const len = (a: Point, b: Point): number => Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
const gapOf = (a: Rect, b: Rect): number => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
const contains = (o: Rect, i: Rect): boolean => i.x >= o.x - 0.5 && i.y >= o.y - 0.5 && i.x + i.w <= o.x + o.w + 0.5 && i.y + i.h <= o.y + o.h + 0.5;
/** 線分が四角を `pad` だけ広げた形の中を通るか。縁に触れるだけの線は数えない */
function cuts(a: Point, b: Point, r: Rect, pad: number): boolean {
  const x0 = r.x - pad + 1;
  const x1 = r.x + r.w + pad - 1;
  const y0 = r.y - pad + 1;
  const y1 = r.y + r.h + pad - 1;
  if (x1 <= x0 || y1 <= y0) return false;
  return Math.max(a[0], b[0]) > x0 && Math.min(a[0], b[0]) < x1 && Math.max(a[1], b[1]) > y0 && Math.min(a[1], b[1]) < y1;
}
/**
 * 2 本の折れ線の交わる回数。直角に越える所を 1 回、重なって走る所を 2 回と数える。
 * `trunk` の時は 1 本の幹を共に通る組の 2 本で、重なって走る所と、幹から枝が分かれる所 (片方の折れ目が相手の上に在る所) は数えず、
 * 相手を突き抜けて越える所だけを数える
 */
function crossCount(p: readonly Point[], q: readonly Point[], tol = 0, trunk = false): number {
  let n = 0;
  for (const [a, b] of segs(p))
    for (const [u, v] of segs(q)) {
      const fa = flat(a, b);
      const fu = flat(u, v);
      if (trunk) {
        if (fa === fu) continue;
        const [h1, h2, v1, v2] = fa ? [a, b, u, v] : [u, v, a, b];
        const x = v1[0];
        const y = h1[1];
        if (x > Math.min(h1[0], h2[0]) + 0.5 && x < Math.max(h1[0], h2[0]) - 0.5 && y > Math.min(v1[1], v2[1]) + 0.5 && y < Math.max(v1[1], v2[1]) - 0.5) n++;
        continue;
      }
      if (fa === fu) {
        const same = fa ? Math.abs(a[1] - u[1]) <= tol : Math.abs(a[0] - u[0]) <= tol;
        if (!same) continue;
        const [lo, hi] = fa ? [Math.min(a[0], b[0]), Math.max(a[0], b[0])] : [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
        const [lo2, hi2] = fu ? [Math.min(u[0], v[0]), Math.max(u[0], v[0])] : [Math.min(u[1], v[1]), Math.max(u[1], v[1])];
        if (Math.min(hi, hi2) - Math.max(lo, lo2) > 0.5) n += 2;
        continue;
      }
      const [h1, h2, v1, v2] = fa ? [a, b, u, v] : [u, v, a, b];
      const x = v1[0];
      const y = h1[1];
      if (x >= Math.min(h1[0], h2[0]) - tol && x <= Math.max(h1[0], h2[0]) + tol && y >= Math.min(v1[1], v2[1]) - tol && y <= Math.max(v1[1], v2[1]) + tol) n++;
    }
  return n;
}
/** 点と折れ線の間 */
function distanceTo(p: Point, points: readonly Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const [a, b] of segs(points)) {
    const x = Math.max(Math.min(a[0], b[0]), Math.min(Math.max(a[0], b[0]), p[0]));
    const y = Math.max(Math.min(a[1], b[1]), Math.min(Math.max(a[1], b[1]), p[1]));
    best = Math.min(best, Math.hypot(p[0] - x, p[1] - y));
  }
  return best;
}

/** 組んだ図の線。値の管、短い管、呼び出しの管 (呼ぶ相手ごと)、名札から囲いへの点線、書き込む管 */
function linesOf(layout: PipeLayout): Line[] {
  const out: Line[] = [];
  for (const p of layout.valuePipes) {
    const own = new Set(p.ports.flatMap((port) => [`tank:${port.party}:${port.token}`, `housing:${port.party}`]));
    // 幹を共に通る組の管は、組の名前を同じにする
    out.push({ name: `value:${p.token}:${p.from}>${p.to}`, kind: "value", points: p.points, half: P.bus.case / 2, group: `value:${p.group}`, own });
  }
  layout.stubs.forEach((s, i) => {
    const bus = layout.buses.find((b) => b.token === s.token);
    const owner = layout.tanks.find((t) => t.token === s.token && s.points.some((q) => Math.abs(q[0] - t.x) < 1 || Math.abs(q[0] - (t.x + t.w)) < 1));
    const own = new Set([`party:${bus?.valve?.party ?? ""}`, ...(owner ? [`tank:${owner.party}:${owner.token}`, `housing:${owner.party}`] : [])]);
    out.push({ name: `stub:${s.token}`, kind: "stub", points: s.points, half: P.bus.case / 2, group: `stub:${i}`, own });
  });
  for (const main of layout.mains)
    for (const b of main.branches) {
      const own = new Set([`party:${main.from}`, `party:${b.to}`, ...layout.mains.filter((m) => m.from === main.from).flatMap((m) => m.branches.map((x) => `valve:${m.from}>${x.to}`))]);
      for (const g of layout.gauges) if (g.on === "call" && distanceTo([g.cx, g.cy], b.points) < 1) own.add(`gauge:${g.party}`);
      out.push({ name: `call:${main.from}>${b.to}`, kind: "call", points: b.points, half: P.call.case / 2, group: `call:${main.from}`, own });
    }
  for (const t of layout.ties)
    out.push({
      name: `tie:${t.party}`,
      kind: "tie",
      points: [
        [t.x, t.y1],
        [t.x, t.y2],
      ],
      half: 1,
      group: `tie:${t.party}`,
      own: new Set([`party:${t.party}`, `housing:${t.party}`]),
    });
  layout.writes.forEach((w, i) => {
    if (w.points.length < 2 || len(w.points[0] as Point, w.points[w.points.length - 1] as Point) < 1) return;
    out.push({ name: `write:${w.from}>${w.to}.${w.name}`, kind: "write", points: w.points, half: 1.5, group: `write:${i}`, own: new Set([`party:${w.from}`, `housing:${w.to}`, `plate:${w.to}:${w.name}`]) });
  });
  return out;
}

/** 線が通ってはいけない部品 */
function solidsOf(layout: PipeLayout): Part[] {
  const out: Part[] = [];
  for (const p of layout.parties) {
    // 丸の名札は丸と下の名前の 2 つの四角。2 つを囲む四角にすると、丸の横の何も無い所を通る線まで数える
    out.push({ x: p.x, y: p.y, w: p.w, h: p.h, name: `party:${p.id}`, inside: "" });
    if (p.shape === "round") out.push({ x: p.label.x, y: p.label.y, w: p.label.w, h: p.label.h, name: `party:${p.id}`, inside: "" });
  }
  for (const t of layout.tanks) out.push({ ...t, name: `tank:${t.party}:${t.token}`, inside: t.party });
  for (const h of layout.housings) out.push({ ...h, name: `housing:${h.party}`, inside: "" });
  for (const p of layout.plates.filter((x) => x.step === 0 && !x.boxed)) out.push({ ...p, name: `plate:${p.party}:${p.name}`, inside: p.party });
  for (const c of layout.converters.filter((x) => x.step === 0)) out.push({ ...c, name: `converter:${c.party}`, inside: c.party });
  const seen = new Set<string>();
  for (const g of layout.gauges) {
    if (seen.has(g.party)) continue;
    seen.add(g.party);
    out.push({ x: g.x, y: g.y, w: g.w, h: g.h, name: `gauge:${g.party}`, inside: "" });
  }
  for (const m of layout.mains)
    for (const b of m.branches) {
      // 弁の胴。縦に走る所の弁は縦に長い
      const [hx, hy] = b.valve.vertical ? [P.valve.half, P.valve.r] : [P.valve.r, P.valve.half];
      out.push({ x: b.valve.x - hx, y: b.valve.y - hy, w: hx * 2, h: hy * 2, name: `valve:${m.from}>${b.to}`, inside: "" });
    }
  for (const f of layout.folds) out.push({ ...f, name: `fold:${f.call}`, inside: "", step: f.step });
  return out;
}

/** 字と札。段ごとに変わる物は段を持つ */
function textsOf(layout: PipeLayout): Part[] {
  const out: Part[] = [];
  for (const p of layout.parties) if (p.shape === "round") out.push({ ...p.label, name: `name:${p.id}`, inside: "" });
  // 槽の名前は槽の中に在り、隣の槽と字と線には間を取る
  for (const t of layout.tanks) out.push({ ...t.title, name: `title:${t.party}:${t.token}`, inside: t.party });
  for (const l of layout.levels)
    for (const [k, t] of [
      ["number", l.text],
      ["delta", l.delta],
      ["tag", l.tag],
    ] as const)
      if (t) out.push({ ...t, name: `${k}:${l.party}:${l.token}`, inside: l.party, step: l.step });
  for (const p of layout.plates.filter((x) => !x.boxed))
    for (const [k, t] of [
      ["was", p.was],
      ["tag", p.tag],
    ] as const)
      if (t) out.push({ ...t, name: `${k}:${p.party}:${p.name}`, inside: p.party, step: p.step });
  for (const c of layout.chips) if (c.kind !== "return") out.push({ x: c.x, y: c.y, w: c.w, h: c.h, name: `${c.kind}:${c.text}`, inside: c.kind === "io" ? (c.party ?? "") : "", step: c.step });
  return out;
}

/** 段ごとに数え直す部品の段の一覧。段を持たない部品は全ての段で同じ */
const stepsOf = (layout: PipeLayout): number[] => [...new Set(layout.pills.map((p) => p.step))].sort((a, b) => a - b);

export function pipeViolations(layout: PipeLayout, rules: readonly PipeRule[] = PIPE_RULES): PipeViolation[] {
  const out: PipeViolation[] = [];
  const rule = (name: string): PipeRule | undefined => rules.find((r) => r.name === name && r.counted);
  const over = (r: PipeRule, v: number): boolean => (r.kind === "min" ? v < r.value - 1e-6 : v > r.value + 1e-6);
  const lines = linesOf(layout);
  const solids = solidsOf(layout);
  const texts = textsOf(layout);
  const stepList = stepsOf(layout);

  // 部品どうしの間。囲いの外の部品どうしと、同じ囲いの中の部品どうしを測る。囲いの中に在る部品と囲いの組は測らない
  const partGap = rule("part-gap");
  if (partGap) {
    const all: Part[] = [...solids.filter((p) => !p.name.startsWith("valve:")), ...texts.filter((t) => !t.name.startsWith("name:"))];
    const fixed = all.filter((p) => p.step === undefined);
    const byStep = new Map<number, Part[]>();
    for (const p of all) if (p.step !== undefined) byStep.set(p.step, [...(byStep.get(p.step) ?? []), p]);
    // 部品が部品を囲む組 (囲いと中の部品、槽と中の字) は測らない。字か札が字か札を覆う組は重なりとして数える
    const words = new Set<Part>(texts);
    const pair = (a: Part, b: Part, step?: number): void => {
      if ((contains(a, b) && !words.has(a)) || (contains(b, a) && !words.has(b))) return;
      if (a.name === b.name) return;
      const g = gapOf(a, b);
      // 囲いの中の部品と外の部品は間を測らない。ただし重なる組は数える (囲いの中の字に外の札が載る形)
      const broken = a.inside === b.inside ? over(partGap, g) : g < -0.5;
      if (broken) out.push({ rule: partGap.name, parts: [a.name, b.name], ...(step === undefined ? {} : { step }) });
    };
    for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) pair(fixed[i] as Part, fixed[j] as Part);
    for (const s of stepList) {
      const here = byStep.get(s) ?? [];
      for (let i = 0; i < here.length; i++) {
        for (const f of fixed) pair(here[i] as Part, f, s);
        for (let j = i + 1; j < here.length; j++) pair(here[i] as Part, here[j] as Part, s);
      }
    }
  }

  // 呼び出しの管の弁と計器の間
  const spacing = rule("call-part-spacing");
  if (spacing) {
    const items = solids.filter((p) => p.name.startsWith("valve:") || (p.name.startsWith("gauge:") && layout.gauges.some((g) => `gauge:${g.party}` === p.name && g.on === "call")));
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i] as Part;
        const b = items[j] as Part;
        const g = gapOf(a, b);
        if (over(spacing, g)) out.push({ rule: spacing.name, parts: [a.name, b.name] });
      }
  }

  // 呼び出しの管の弁が描く形と、ほかの線の間。同じ者の管が弁の所で重なって走る時、その所は弁が載る管と同じ線なので測らない
  const clearance = rule("valve-clearance");
  if (clearance)
    for (const m of layout.mains)
      for (const b of m.branches) {
        const name = `call:${m.from}>${b.to}`;
        const { x, y, vertical, under } = b.valve;
        const rects = valveRects(x, y, vertical, under);
        const onValve = (u: Point, v: Point): boolean =>
          vertical
            ? !flat(u, v) && Math.abs(u[0] - x) < 0.5 && Math.min(u[1], v[1]) <= y - P.valve.r && Math.max(u[1], v[1]) >= y + P.valve.r
            : flat(u, v) && Math.abs(u[1] - y) < 0.5 && Math.min(u[0], v[0]) <= x - P.valve.r && Math.max(u[0], v[0]) >= x + P.valve.r;
        let least = Number.POSITIVE_INFINITY;
        let who = "";
        for (const l of lines) {
          if (l.name === name) continue;
          const sibling = l.kind === "call" && l.group === `call:${m.from}`;
          for (const [u, v] of segs(l.points)) {
            if (sibling && onValve(u, v)) continue;
            const seg: Rect = { x: Math.min(u[0], v[0]) - l.half, y: Math.min(u[1], v[1]) - l.half, w: Math.abs(v[0] - u[0]) + l.half * 2, h: Math.abs(v[1] - u[1]) + l.half * 2 };
            for (const r of rects) {
              const g = gapOf(seg, r);
              if (g < least) {
                least = g;
                who = l.name;
              }
            }
          }
        }
        if (over(clearance, least)) out.push({ rule: clearance.name, parts: [`valve:${m.from}>${b.to}`, who] });
      }

  // 線が部品を通り抜ける数
  const through = rule("line-through-part");
  if (through)
    for (const l of lines) {
      const hit = [...new Set(solids.filter((p) => !l.own.has(p.name) && segs(l.points).some(([a, b]) => cuts(a, b, p, l.half))).map((p) => p.name))];
      if (over(through, hit.length)) out.push({ rule: through.name, parts: [l.name, ...hit] });
    }

  // 字にかかる線
  const textClear = rule("text-clear");
  if (textClear)
    for (const t of texts) {
      const hit = lines.filter((l) => segs(l.points).some(([a, b]) => cuts(a, b, t, l.half)));
      if (over(textClear, hit.length)) out.push({ rule: textClear.name, parts: [t.name, ...hit.map((l) => l.name)], ...(t.step === undefined ? {} : { step: t.step }) });
    }

  // 計器と載せる管の間
  const astray = rule("gauge-on-line");
  if (astray) {
    const seen = new Set<string>();
    for (const g of layout.gauges) {
      if (seen.has(g.party) || g.on === "party") continue;
      seen.add(g.party);
      let d = Number.POSITIVE_INFINITY;
      if (g.on === "call") for (const m of layout.mains) for (const b of m.branches) d = Math.min(d, distanceTo([g.cx, g.cy], b.points));
      else
        for (const b of layout.buses)
          if (g.stem && g.cx >= b.x1 && g.cx <= b.x2) d = Math.min(d, Math.abs(g.stem.y2 + P.gauge.stemGap - b.y));
      if (over(astray, d)) out.push({ rule: astray.name, parts: [`gauge:${g.party}`] });
    }
  }

  // 点線を越える線
  const tieCross = rule("tie-crossings");
  if (tieCross)
    for (const t of lines.filter((l) => l.kind === "tie")) {
      const party = t.name.slice("tie:".length);
      const hit = lines.filter((l) => l !== t && !(l.kind === "write" && l.own.has(`party:${party}`)) && crossCount(l.points, t.points, l.half) > 0);
      if (over(tieCross, hit.length)) out.push({ rule: tieCross.name, parts: [t.name, ...hit.map((l) => l.name)] });
    }

  // 平行に並ぶ線の間
  const parallel = rule("parallel-gap");
  if (parallel) {
    const runs = lines.filter((l) => l.kind !== "write").flatMap((l) => segs(l.points).map(([a, b]) => ({ l, a, b, flat: flat(a, b) })));
    for (let i = 0; i < runs.length; i++)
      for (let j = i + 1; j < runs.length; j++) {
        const p = runs[i] as (typeof runs)[number];
        const q = runs[j] as (typeof runs)[number];
        // 同じ者から出る呼び出しの管どうしは測らない。幹を共に通る値の管どうしは、重なって走る所を測らず、離れて並ぶ所を測る
        const same = p.l.group === q.l.group;
        if (p.l === q.l || (same && p.l.kind !== "value") || p.flat !== q.flat) continue;
        const [lo, hi] = p.flat ? [Math.min(p.a[0], p.b[0]), Math.max(p.a[0], p.b[0])] : [Math.min(p.a[1], p.b[1]), Math.max(p.a[1], p.b[1])];
        const [lo2, hi2] = q.flat ? [Math.min(q.a[0], q.b[0]), Math.max(q.a[0], q.b[0])] : [Math.min(q.a[1], q.b[1]), Math.max(q.a[1], q.b[1])];
        if (Math.min(hi, hi2) - Math.max(lo, lo2) <= 0.5) continue;
        const d = p.flat ? Math.abs(p.a[1] - q.a[1]) : Math.abs(p.a[0] - q.a[0]);
        if (same && d <= 0.5) continue;
        const g = d - p.l.half - q.l.half;
        if (over(parallel, g)) out.push({ rule: parallel.name, parts: [p.l.name, q.l.name] });
      }
  }

  // 値の管どうしの交わり
  const valueCross = rule("value-crossings");
  if (valueCross) {
    const values = lines.filter((l) => l.kind === "value" || l.kind === "stub");
    for (let i = 0; i < values.length; i++)
      for (let j = i + 1; j < values.length; j++) {
        const a = values[i] as Line;
        const b = values[j] as Line;
        const n = crossCount(a.points, b.points, 0, a.group === b.group);
        if (over(valueCross, n)) out.push({ rule: valueCross.name, parts: [a.name, b.name] });
      }
  }

  // 呼び出しの管が値の管を越える回数
  const callCross = rule("call-crossings");
  if (callCross)
    for (const c of lines.filter((l) => l.kind === "call"))
      for (const v of lines.filter((l) => l.kind === "value" || l.kind === "stub")) {
        const n = crossCount(c.points, v.points);
        if (over(callCross, n)) out.push({ rule: callCross.name, parts: [c.name, v.name] });
      }

  // 折れる回数と、折れ目の間の長さ
  const bends = rule("bends");
  const short = rule("short-segment");
  for (const l of lines.filter((x) => x.kind === "value" || x.kind === "call" || x.kind === "stub")) {
    if (bends && over(bends, Math.max(0, l.points.length - 2))) out.push({ rule: bends.name, parts: [l.name] });
    if (short) for (const [a, b] of segs(l.points)) if (over(short, len(a, b))) out.push({ rule: short.name, parts: [l.name] });
  }

  // 左右の余白の偏り。組み方で減らし、違反には数えない
  const balance = rule("balance");
  if (balance) {
    const xs = [...layout.parties, ...layout.housings];
    const left = Math.min(...xs.map((r) => r.x));
    const right = layout.width - Math.max(...xs.map((r) => r.x + r.w));
    if (over(balance, Math.abs(left - right) / layout.width)) out.push({ rule: balance.name, parts: ["figure"] });
  }
  return out;
}
