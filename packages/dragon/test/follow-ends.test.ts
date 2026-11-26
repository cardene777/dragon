// @vitest-environment jsdom
/**
 * 寄って追う窓の線の端の箱 (#3836)。
 *
 * 線の端の箱は、段で引いた線の端に在り、その段で足した物に入らない箱を指す。
 * mind は段で足した考えの親、sankey は段で足した帯の出どころの棒と名前、state は段で引いた線の両端の状態を挙げる。
 * 幅 390 の窓に足した物と線の端の箱が同時に入らない時は、足した物を窓に残したまま線の端の箱の側へ寄せ、
 * 窓の端で切れる線の端の箱には、名前を全部書いた札を窓の枠の内に出す。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import { type Diagramish, overflow, place, type Placed, releasePlaced, round } from "./follow-support";
import { draw, type Rect } from "./render-support";
import { renderDiagram } from "../src/api";
import { partsOf } from "../src/kinds/registry";
import "../src/kind-use/architecture";
import "../src/kind-use/mind";
import "../src/kind-use/sankey";
import "../src/kind-use/state";
import "../src/kind-use/tree";
import "../src/render/look-all";

afterEach(releasePlaced);

const WIDTH = 390;
type Point = [number, number];

/** 記法の file (repo の根から見た path) を読んだ原本 */
function notation(file: string): Diagramish {
  const read = api("parseNotation")(readFileSync(join(process.cwd(), file), "utf8"), { lang: file.includes(".en.") ? "en" : "ja" });
  expect(read.ok, `${file} を読めない`).toBe(true);
  return (read as { diagram: Diagramish }).diagram;
}

const example = (name: string): string => `packages/dragon/examples/${name}.dragon`;

/** 線の端の箱。`rect` は図の上の四角、`paths` は箱へ向かうその段の線の点 */
interface End {
  name: string;
  rect: Rect;
  paths: Point[][];
}

interface MindIdea extends Rect {
  id: string;
  name: string;
  parent?: string;
  step: number;
}
interface SankeyNode extends Rect {
  id: string;
  name: string;
  label: { rect: Rect };
}
interface SankeyBand {
  from: string;
  to: string;
  step: number;
  x1: number;
  x2: number;
  a: Point;
  b: Point;
}
interface Loose {
  kind: string;
  boxes: (Rect & { id: string; name: string })[];
  edges: { from: string; to: string; step: number; points: Point[] }[];
  labels: (Rect & { step: number })[];
  ideas?: MindIdea[];
  links?: { from: string; to: string; step: number; points: Point[] }[];
  nodes?: SankeyNode[];
  bands?: SankeyBand[];
  arrangement?: string;
}

const loose = (p: Placed): Loose => p.layout as unknown as Loose;

/** 四角どうしを囲む四角 */
function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}

/** 量の行き先の図の棒と名前。`low` は下の端 */
function nodeArea(n: SankeyNode, low: number): Rect {
  const r = n.label.rect;
  const x = Math.min(r.x, n.x);
  const y = Math.min(r.y, n.y);
  return { x, y, w: Math.max(r.x + r.w, n.x + n.w) - x, h: Math.max(r.y + r.h, low) - y };
}

/** 段 `step` の線の端の箱 */
function endsAt(p: Placed, step: number): End[] {
  const l = loose(p);
  if (l.kind === "mind") {
    const ideas = l.ideas ?? [];
    const added = ideas.filter((i) => i.step === step);
    const ids = new Set(added.map((i) => i.id));
    return ideas
      .filter((i) => !ids.has(i.id) && added.some((a) => a.parent === i.id))
      .map((i) => ({ name: i.name, rect: i, paths: (l.links ?? []).filter((k) => k.step === step && k.from === i.id).map((k) => k.points) }));
  }
  if (l.kind === "sankey") {
    if (l.arrangement) return [];
    const bands = (l.bands ?? []).filter((b) => b.step === step);
    const to = new Set(bands.map((b) => b.to));
    return (l.nodes ?? [])
      .filter((n) => bands.some((b) => b.from === n.id) && !to.has(n.id))
      .map((n) => ({
        name: n.name,
        rect: nodeArea(n, n.y),
        paths: bands.filter((b) => b.from === n.id).map((b): Point[] => [[b.x1, (b.a[0] + b.a[1]) / 2], [b.x2, (b.b[0] + b.b[1]) / 2]]),
      }));
  }
  if (l.kind === "state") {
    const edges = l.edges.filter((e) => e.step === step);
    return l.boxes
      .filter((b) => edges.some((e) => e.from === b.id || e.to === b.id))
      .map((b) => ({ name: b.name, rect: b, paths: edges.filter((e) => e.from === b.id || e.to === b.id).map((e) => e.points) }));
  }
  return [];
}

/** 札。`pill` と `mask` は窓の上の四角 */
interface Tag {
  el: Element;
  step: number;
  name: string;
  pill: Rect;
  mask?: Rect;
}

const rectOf = (el: Element | null): Rect | undefined =>
  el ? { x: Number(el.getAttribute("x")), y: Number(el.getAttribute("y")), w: Number(el.getAttribute("width")), h: Number(el.getAttribute("height")) } : undefined;

function tagsOf(p: Placed): Tag[] {
  return [...p.figure.querySelectorAll("g.dg-tag")].map((el) => ({
    el,
    step: Number(el.getAttribute("data-step")),
    name: el.querySelector(".dg-tag-name")?.textContent ?? "",
    pill: rectOf(el.querySelector(".dg-tag-pill")) ?? { x: 0, y: 0, w: 0, h: 0 },
    mask: rectOf(el.querySelector(".dg-tag-mask")),
  }));
}

/** 段 `step` の止め絵で見える札 */
const shownTags = (p: Placed, step: number): Tag[] => tagsOf(p).filter((t) => p.opacity(t.el, p.stillAt(step)) > 0.5);

/** 図の上の四角を窓の上の四角へ移す */
const inWindow = (r: Rect, win: Rect): Rect => ({ x: r.x - win.x, y: r.y - win.y, w: r.w, h: r.h });

const meets = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** 点 (`x`、`y`) が、角の丸みの径 `r` の四角 `q` を `out` だけ外へ広げた形の中に在るか */
function inRound(q: Rect, r: number, x: number, y: number, out: number): boolean {
  if (x < q.x - out || x > q.x + q.w + out || y < q.y - out || y > q.y + q.h + out) return false;
  const cx = Math.min(Math.max(x, q.x + r), q.x + q.w - r);
  const cy = Math.min(Math.max(y, q.y + r), q.y + q.h - r);
  return Math.hypot(x - cx, y - cy) <= r + out + 0.01;
}

const contains = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.w <= outer.x + outer.w + 0.5 && inner.y + inner.h <= outer.y + outer.h + 0.5;

/** repo の mind と sankey と state の記法の file のうち、幅 390 で寄って追う形になる物 */
function followFiles(): string[] {
  const listed = execFileSync("git", ["ls-files", "*.dragon"], { cwd: process.cwd(), encoding: "utf8" }).split("\n");
  return listed.filter((file) => {
    if (!file || file.includes("test/fixtures")) return false;
    if (!/^(mind|sankey|state) /mu.test(readFileSync(join(process.cwd(), file), "utf8"))) return false;
    return draw("chooseView")(draw("renderDiagram")(notation(file)), WIDTH).mode === "follow";
  });
}

/** 窓の位置。-0 を 0 に揃える */
const spot = (win: Rect): Point => [round(win.x) + 0, round(win.y) + 0];

/** 線の端の箱が窓から切れる長さ */
const cutOf = (end: End, win: Rect): number => overflow(end.rect, win);

describe("寄って追う窓の線の端の箱 (#3836)", () => {
  it("follow-ends-mind-added-in-window", () => {
    const p = place("wallet-ux", notation(example("wallet-ux")), WIDTH);
    for (let s = 1; s < p.steps; s++) {
      const win = p.windowAt(s);
      const ideas = (loose(p).ideas ?? []).filter((i) => i.step === s);
      expect(ideas.length, `wallet-ux の段 ${s + 1} に足した考えが無い`).toBeGreaterThan(0);
      for (const idea of ideas) expect(overflow(idea, win), `wallet-ux の段 ${s + 1} の ${idea.name} が窓から切れる`).toBeLessThanOrEqual(0.5);
      const b = p.badgeAt(s);
      expect(overflow({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, win), `wallet-ux の段 ${s + 1} の番号の丸が窓から切れる`).toBeLessThanOrEqual(0.5);
    }
  });

  it("follow-ends-mind-slides-to-parent", () => {
    const p = place("wallet-ux", notation(example("wallet-ux")), WIDTH);
    for (let s = 1; s < p.steps; s++) {
      const win = p.windowAt(s);
      const [parent] = endsAt(p, s);
      expect(parent, `wallet-ux の段 ${s + 1} に親が無い`).toBeDefined();
      const ideas = (loose(p).ideas ?? []).filter((i) => i.step === s);
      const b = p.badgeAt(s);
      const added = union([...ideas, { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }]);
      const parentLeft = (parent as End).rect.x + (parent as End).rect.w / 2 < added.x + added.w / 2;
      const gap = parentLeft ? win.x + win.w - (added.x + added.w) : added.x - win.x;
      expect(round(gap), `wallet-ux の段 ${s + 1} で、足した物の親と反対の側の端から窓の端まで`).toBeLessThanOrEqual(16.5);
    }
  });

  it("follow-ends-mind-tag-names-parent", () => {
    const p = place("wallet-ux", notation(example("wallet-ux")), WIDTH);
    for (let s = 1; s < p.steps; s++) {
      const win = p.windowAt(s);
      const [parent] = endsAt(p, s);
      expect(parent?.name).toBe("使いやすいウォレット");
      const r = (parent as End).rect;
      expect(cutOf(parent as End, win), `wallet-ux の段 ${s + 1} で親が窓から切れない`).toBeGreaterThan(1);
      const tag = shownTags(p, s).find((t) => t.name === "使いやすいウォレット");
      expect(tag, `wallet-ux の段 ${s + 1} の止め絵に親の札が見えない`).toBeDefined();
      const leftCut = win.x - r.x > r.x + r.w - (win.x + win.w);
      const mid = (tag as Tag).pill.x + (tag as Tag).pill.w / 2;
      expect(leftCut ? mid < win.w / 2 : mid > win.w / 2, `wallet-ux の段 ${s + 1} の札が親の切れた側の窓の端に無い`).toBe(true);
    }
  });

  it("follow-ends-tag-hides-cut-box", () => {
    // 窓に一部が映る線の端の箱は、札の下の地で縁まで覆い、札の外に箱の縁を覗かせない (#3836 の受け入れで本人が求めた)
    const p = place("wallet-ux", notation(example("wallet-ux")), WIDTH);
    for (let s = 1; s < p.steps; s++) {
      const win = p.windowAt(s);
      const [parent] = endsAt(p, s);
      const tag = shownTags(p, s).find((t) => t.name === parent?.name);
      expect(tag?.mask, `wallet-ux の段 ${s + 1} の札に箱を覆う地が無い`).toBeDefined();
      // 考えの箱は高さの半分の丸みを持つ丸い札で、縁の線の太さの半分 (1) だけ外へ出る。札も縁の線の分だけ外を覆う
      const box = inWindow((parent as End).rect, win);
      const pill = (tag as Tag).pill;
      const mask = (tag as Tag).mask as Rect;
      const left: string[] = [];
      for (let x = Math.max(0, box.x - 1); x <= Math.min(win.w, box.x + box.w + 1); x += 1)
        for (let y = Math.max(0, box.y - 1); y <= Math.min(win.h, box.y + box.h + 1); y += 1) {
          if (!inRound(box, box.h / 2, x, y, 1)) continue;
          if (contains(mask, { x, y, w: 0, h: 0 }) || inRound(pill, Math.min(pill.h, pill.w, 48) / 2, x, y, 1)) continue;
          left.push(`${x},${y}`);
        }
      expect(left.slice(0, 5), `wallet-ux の段 ${s + 1} で、地と札の外に覗く親の箱の点 (${left.length} 点)`).toEqual([]);
    }
  });

  it("follow-ends-tag-only-in-its-step", () => {
    const p = place("wallet-ux", notation(example("wallet-ux")), WIDTH);
    const tags = tagsOf(p);
    expect(tags.length, "wallet-ux に札が無い").toBeGreaterThan(0);
    for (const tag of tags)
      for (let s = 0; s < p.steps; s++) {
        const o = p.opacity(tag.el, p.stillAt(s));
        if (s === tag.step) expect(o, `段 ${tag.step + 1} の札が自分の段の止め絵で見えない`).toBeGreaterThan(0.5);
        else expect(o, `段 ${tag.step + 1} の札が段 ${s + 1} の止め絵で見える`).toBeLessThan(0.05);
      }
    releasePlaced();
    const q = place("support-ticket", notation(example("support-ticket")), WIDTH);
    for (let s = 0; s < 5; s++) expect(shownTags(q, s).map((t) => t.name), `support-ticket の段 ${s + 1} に札が見える`).toEqual([]);
  });

  it("follow-ends-sankey-tag-on-top", () => {
    const p = place("salary", notation(example("salary")), WIDTH);
    const s = 2;
    const win = p.windowAt(s);
    const nodes = loose(p).nodes ?? [];
    for (const id of ["food", "fun"]) {
      const n = nodes.find((x) => x.id === id) as SankeyNode;
      expect(overflow(nodeArea(n, n.y + n.h), win), `salary の段 3 で ${n.name} の棒と名前が窓から切れる`).toBeLessThanOrEqual(0.5);
    }
    const [source] = endsAt(p, s);
    expect(source?.name).toBe("手取り30万円");
    const r = (source as End).rect;
    expect(win.y - r.y, "salary の段 3 で出どころの名前が窓の上で切れない").toBeGreaterThan(1);
    const tag = shownTags(p, s).find((t) => t.name === "手取り30万円");
    expect(tag, "salary の段 3 の止め絵に出どころの札が見えない").toBeDefined();
    expect((tag as Tag).pill.y + (tag as Tag).pill.h / 2, "salary の段 3 の札が窓の上の端に無い").toBeLessThan(win.h / 4);
  });

  it("follow-ends-sankey-band-in-window", () => {
    const p = place("fee-split", notation(example("fee-split")), WIDTH);
    const s = 2;
    const win = p.windowAt(s);
    const b = p.badgeAt(s);
    expect(overflow({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, win), "fee-split の段 3 の番号の丸が窓から切れる").toBeLessThanOrEqual(0.5);
    const l = loose(p);
    const band = (l.bands ?? []).find((x) => x.step === s) as SankeyBand;
    const target = (l.nodes ?? []).find((n) => n.id === band.to) as SankeyNode;
    expect(target.name).toBe("交換所の取り分");
    expect(overflow(nodeArea(target, target.y + target.h), win), "fee-split の段 3 で行き先の棒と名前が窓から切れる").toBeLessThanOrEqual(0.5);
    const seen = Math.min(band.x2, win.x + win.w) - Math.max(band.x1, win.x);
    expect(round(seen), `fee-split の段 3 で帯の幅 ${round(band.x2 - band.x1)} のうち窓に映る幅`).toBeGreaterThanOrEqual((band.x2 - band.x1) / 2);
  });

  it("follow-ends-state-tag-on-line", () => {
    // 段 5 は段で動く物が窓に収まらないので、窓を字が読める大きさまで引き、線の先の「有料」から窓に入れる (#3871)。
    // 窓の端で切れる線の元の「停止」には札を出す。箱の一部が窓に映る時は映る所を同じ高さで覆い、窓の外に在る時は線が窓の端を横切る所に出す
    const p = place("subscription", notation(example("subscription")), WIDTH);
    const s = 4;
    const win = p.windowAt(s);
    const k = p.scaleAt(s);
    const l = loose(p);
    expect(k, "subscription の段 5 で窓を引かない").toBeLessThan(1);
    const to = l.boxes.find((x) => x.name === "有料") as Rect;
    expect(overflow(to, win), "subscription の段 5 で線の先「有料」が窓から切れる").toBeLessThanOrEqual(0.5);
    const end = endsAt(p, s).find((e) => e.name === "停止") as End;
    expect(overflow(end.rect, win), "subscription の段 5 で「停止」が窓に入る").toBeGreaterThan(1);
    const tag = shownTags(p, s).find((t) => t.name === "停止");
    expect(tag, "subscription の段 5 の止め絵に「停止」の札が見えない").toBeDefined();
    const pill = (tag as Tag).pill;
    /** 図の上の四角を、引いた窓に映る四角 (札の中の位置と同じ、窓の左上からの位置) へ移す */
    const shown = (r: Rect): Rect => ({ x: (r.x - win.x) * k, y: (r.y - win.y) * k, w: r.w * k, h: r.h * k });
    const box = shown(end.rect);
    if (meets(end.rect, win)) {
      // 箱の一部が窓に映る時は、札が箱の映る高さを覆う
      expect(pill.y <= box.y + 0.5 && pill.y + pill.h >= box.y + box.h - 0.5, `札 ${JSON.stringify(pill)} が窓に映る「停止」${JSON.stringify(box)} の高さを覆わない`).toBe(true);
    } else {
      // 線が「停止」の側の窓の端を横切る高さ
      const edge = end.rect.x < win.x ? win.x : win.x + win.w;
      const crossings: number[] = [];
      for (const pts of end.paths)
        for (let i = 1; i < pts.length; i++) {
          const [a, c] = [pts[i - 1] as Point, pts[i] as Point];
          if (a[0] === c[0] || (a[0] - edge) * (c[0] - edge) > 0) continue;
          crossings.push((a[1] + ((edge - a[0]) / (c[0] - a[0])) * (c[1] - a[1]) - win.y) * k);
        }
      expect(crossings.length, "subscription の段 5 の線が窓の端を横切らない").toBeGreaterThan(0);
      expect(crossings.some((y) => y >= pill.y - 0.5 && y <= pill.y + pill.h + 0.5), `札 ${JSON.stringify(pill)} が線の横切る高さ ${crossings.map(round).join(",")} に無い`).toBe(true);
    }
    for (const label of l.labels.filter((x) => x.step === s)) expect(meets(pill, shown(label)), "札が段の線の札に重なる").toBe(false);
    for (const other of l.boxes.filter((x) => x.name !== "停止")) expect(meets(pill, shown(other)), `札が状態「${other.name}」の箱に重なる`).toBe(false);
  });

  it("follow-ends-state-both-ends", () => {
    const p = place("support-ticket", notation(example("support-ticket")), WIDTH);
    const win = p.windowAt(5);
    for (const name of ["再開", "完了"]) {
      const box = loose(p).boxes.find((x) => x.name === name) as Rect;
      expect(overflow(box, win), `support-ticket の段 6 で「${name}」が窓から切れる`).toBeLessThanOrEqual(0.5);
    }
  });

  it("follow-ends-fitting-steps-kept", () => {
    const kept: [string, number[], Point[]][] = [
      ["support-ticket", [0, 1, 2, 3, 4], [[0, 0], [0, 34], [229.4, 34], [453.35, 34], [499.6, 138.5]]],
      ["subscription", [0, 1, 2, 3], [[0, 0], [24.15, 0], [263.45, 0], [502.75, 0]]],
      ["salary", [0], [[0, 68]]],
    ];
    for (const [name, steps, wins] of kept) {
      const p = place(name, notation(example(name)), WIDTH);
      steps.forEach((s, i) => {
        const win = p.windowAt(s);
        expect(spot(win), `${name} の段 ${s + 1} の窓の位置`).toEqual(wins[i]);
        expect(shownTags(p, s).map((t) => t.name), `${name} の段 ${s + 1} に札が見える`).toEqual([]);
      });
      releasePlaced();
    }
  });

  it("follow-ends-wide-windows-kept", () => {
    const kept: [string, Point[]][] = [
      ["budget-app.en", [[93.93, 0], [0, 0], [188, 0], [188, 0], [0, 0]]],
      ["dao-proposal.en", [[125.6, 0], [0, 0], [252, 0], [252, 0], [0, 0]]],
      ["wallet-ux.en", [[145.21, 0], [0, 0], [291, 0], [291, 0], [0, 0]]],
      ["order.en", [[0, 0], [0, 0], [109.16, 0], [217.23, 0], [217.23, 0], [217.23, 0], [110.99, 0], [0, 0], [0, 0], [0, 0]]],
      ["support-ticket.en", [[0, 0], [0, 0], [46.72, 0], [153.88, 0], [153.88, 0], [153.88, 0]]],
    ];
    for (const [name, wins] of kept) {
      const p = place(name, notation(example(name)), 760);
      expect(p.steps).toBe(wins.length);
      wins.forEach((at, s) => {
        const win = p.windowAt(s);
        expect(spot(win), `${name} の幅 760 の段 ${s + 1} の窓の位置`).toEqual(at);
      });
      expect(tagsOf(p).map((t) => t.name), `${name} の幅 760 に札が在る`).toEqual([]);
      releasePlaced();
    }
  });

  it("follow-ends-no-tag-without-follow", () => {
    for (const name of ["wallet-ux", "salary", "subscription"]) {
      const diagram = notation(example(name));
      for (const options of [{ lang: "ja" as const }, { lang: "ja" as const, still: true, figure: true }]) {
        const { svg } = renderDiagram(diagram, options);
        expect(svg.includes('data-view="follow"'), `${name} ${JSON.stringify(options)} が寄って追う形になる`).toBe(false);
        expect(svg.includes("dg-tag"), `${name} ${JSON.stringify(options)} に札が在る`).toBe(false);
      }
    }
  });

  it("follow-ends-other-kinds-kept", () => {
    const kept: [string, Point[]][] = OTHER_KINDS;
    for (const [file, wins] of kept) {
      const p = place(file, notation(file), WIDTH);
      expect(p.steps).toBe(wins.length);
      wins.forEach((at, s) => {
        const win = p.windowAt(s);
        expect(spot(win), `${file} の段 ${s + 1} の窓の位置`).toEqual(at);
      });
      expect(tagsOf(p).map((t) => t.name), `${file} に札が在る`).toEqual([]);
      releasePlaced();
    }
  });
});

/**
 * 見本ごとに 1 件ずつ確かめる。全ての見本を 1 件で描くと、混んだ機械で 1 件の上限の秒数を超えるため。
 * 寄って追う形になる見本は、集める時に 1 度だけ描いて選ぶ
 */
describe.each(followFiles())("%s", (file) => {
  it("follow-ends-every-cut-end-has-tag", () => {
    const p = place(file, notation(file), WIDTH);
    const missing: string[] = [];
    for (let s = 0; s < p.steps; s++) {
      const win = p.windowAt(s);
      const names = shownTags(p, s).map((t) => t.name);
      for (const end of endsAt(p, s)) if (cutOf(end, win) > 1 && !names.includes(end.name)) missing.push(`段 ${s + 1} ${end.name}`);
    }
    expect(missing, `${file} で線の端の箱が切れるのに札が見えない段`).toEqual([]);
  });

  it("follow-ends-tag-inside-frame", () => {
    // 札は窓の枠に掛けず、枠の内に収める (#3836 の受け入れで本人が求めた)
    const p = place(file, notation(file), WIDTH);
    const { w, h } = p.windowAt(0);
    const cut = Array.from({ length: p.steps }, (_, s) => endsAt(p, s).some((e) => cutOf(e, p.windowAt(s)) > 1)).some(Boolean);
    const tags = tagsOf(p);
    if (cut) expect(tags.length, `${file} は線の端の箱が切れる段を持つのに札が無い`).toBeGreaterThan(0);
    const out = tags.filter(({ pill: r }) => r.x < 2 || r.y < 2 || r.x + r.w > w - 2 || r.y + r.h > h - 2).map((t) => `段 ${t.step + 1} ${t.name} ${JSON.stringify(t.pill)}`);
    expect(out, `${file} で窓の枠に掛かる札`).toEqual([]);
  });

  it("follow-ends-never-cut-more", () => {
    /** 段ごとの、線の端の箱が窓から切れる長さの合計。窓の外に出た箱は箱の大きさまでを数える */
    const sums = (): number[] => {
      const p = place(file, notation(file), WIDTH);
      const out = Array.from({ length: p.steps }, (_, s) =>
        endsAt(p, s).reduce((sum, e) => sum + Math.min(cutOf(e, p.windowAt(s)), Math.max(e.rect.w, e.rect.h)), 0),
      );
      releasePlaced();
      return out;
    };
    const parts = partsOf((notation(file) as { kind: string }).kind) as unknown as Record<string, unknown>;
    const now = sums();
    const saved = parts.ends;
    delete parts.ends;
    let without: number[];
    try {
      without = sums();
    } finally {
      if (saved !== undefined) parts.ends = saved;
    }
    const worse = now.flatMap((v, s) => (v > (without[s] as number) + 0.5 ? [`段 ${s + 1} ${round(without[s] as number)} → ${round(v)}`] : []));
    expect(worse, `${file} で線の端の箱の切れる長さの合計が増えた段`).toEqual([]);
  });
});

/** 線の端の箱を挙げない種類の、幅 390 の今の窓の位置 (#3836 の前に測った値) */
// hd-wallet の段 5 は段で動く物が窓に収まらず、窓を引いて全てを映す所に止まる (#3871)
const OTHER_KINDS: [string, Point[]][] = [
  ["packages/dragon/examples/hd-wallet.dragon", [[14, 350], [32.5, 281.5], [67.75, 24], [106.37, 0], [0, 129], [0, 350]]],
  ["packages/dragon/examples/bridge.dragon", [[1.5, 0], [196.5, 0]]],
];
