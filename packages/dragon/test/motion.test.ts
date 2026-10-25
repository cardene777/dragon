// @vitest-environment jsdom
/**
 * 描いた図の動きが、時刻の表と図の決まりのとおりに見える (#3111)。
 *
 * 動きの数 (光が消える長さ、済んだ線の濃さ、点の流れる向き、運ぶ物の出入り) は `render/` の式の中に在り、
 * 時刻の表 (`timeline`) を比べる検査では崩れても気付けない。
 * ここでは SVG の keyframes を時刻を指して読み、段の止め絵と、線を引く間と、運ぶ物の見える間で比べる。
 */
import { describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { type Motion, motionOf } from "./motion-support";
import type { Rendered } from "./render-support";

interface Event {
  type: string;
  from?: string;
  to?: string;
  box?: string;
}
interface Source {
  steps: { events: Event[] }[];
}

const SAMPLES = [
  ["OAuth", "oauth.json"],
  ["CCIP", "ccip.json"],
] as const;

/** 段 `s` で動く箱。線の両端と、処理か書き換えをする箱 */
function moving(diagram: Json, s: number): Set<string> {
  const ids = new Set<string>();
  for (const event of (diagram as unknown as Source).steps[s]?.events ?? []) {
    if (event.type === "edge") for (const id of [event.from, event.to]) if (id) ids.add(id);
    if ((event.type === "action" || event.type === "swap") && event.box) ids.add(event.box);
  }
  return ids;
}

type EdgeTime = Rendered["timeline"]["edges"][number];

/** 描いた線と、その線の時刻。SVG の色の線、矢じり、流れる点は、時刻を持つ線の順に並ぶ */
function lines(m: Motion): { time: EdgeTime; line: Element; head: Element; flow: Element }[] {
  const { layout, timeline } = m.rendered;
  const times = layout.edges.flatMap((e) => timeline.edges.filter((t) => t.step === e.step && t.event === e.event));
  const line = [...m.doc.querySelectorAll(".dg-e-on")];
  const head = [...m.doc.querySelectorAll(".dg-eh-on")];
  const flow = [...m.doc.querySelectorAll(".dg-flow")];
  expect(line.length, "色の線の数が時刻を持つ線の数と違う").toBe(times.length);
  return times.map((time, i) => ({ time, line: line[i] as Element, head: head[i] as Element, flow: flow[i] as Element }));
}

/** 点線の模様 `dasharray` を `offset` だけずらした時に、長さ 1 の線のうち描かれる割合 */
function drawnShare(dasharray: number[], offset: number): number {
  const pattern = dasharray.length % 2 === 0 ? dasharray : [...dasharray, ...dasharray];
  const period = pattern.reduce((a, b) => a + b, 0);
  let drawn = 0;
  const n = 1000;
  for (let i = 0; i < n; i++) {
    let at = ((((i + 0.5) / n + offset) % period) + period) % period;
    for (let k = 0; k < pattern.length; k++) {
      const len = pattern[k] as number;
      if (at < len) {
        if (k % 2 === 0) drawn++;
        break;
      }
      at -= len;
    }
  }
  return drawn / n;
}

describe("止め絵", () => {
  it("still-lights-only-moving-boxes", () => {
    for (const [name, file] of SAMPLES) {
      const diagram = exampleJson(file);
      const m = motionOf(diagram);
      const { layout, timeline } = m.rendered;
      const cards = [...m.doc.querySelectorAll(".dg-st")];
      expect(cards.length, `${name} の箱の数`).toBe(layout.boxes.length);
      timeline.stills.forEach((t, s) => {
        const on = moving(diagram, s);
        layout.boxes.forEach((box, i) => {
          const halo = cards[i]?.parentElement?.querySelector(".dg-halo");
          const shown = halo ? m.opacity(halo, t) : 0;
          if (on.has(box.id)) expect(shown, `${name} の段 ${s + 1} の止め絵で、動く ${box.id} が光らない`).toBeGreaterThan(0.99);
          else expect(shown, `${name} の段 ${s + 1} の止め絵で、動かない ${box.id} が光る`).toBeLessThan(0.01);
        });
      });
    }
  });

  it("still-dims-past-lines", () => {
    for (const [name, file] of SAMPLES) {
      const m = motionOf(exampleJson(file));
      const drawn = lines(m);
      m.rendered.timeline.stills.forEach((t, s) => {
        const now = drawn.filter((d) => d.time.step === s).map((d) => m.opacity(d.line, t));
        for (const d of drawn.filter((x) => x.time.step < s)) {
          const shown = m.opacity(d.line, t);
          expect(shown, `${name} の段 ${s + 1} の止め絵で、段 ${d.time.step + 1} の線が消えている`).toBeGreaterThan(0);
          for (const current of now) expect(shown, `${name} の段 ${s + 1} の止め絵で、段 ${d.time.step + 1} の線が今の段の線より薄くない`).toBeLessThan(current);
        }
      });
    }
  });

  it("still-marks-past-badges", () => {
    for (const [name, file] of SAMPLES) {
      const m = motionOf(exampleJson(file));
      const badges = [...m.doc.querySelectorAll(".dg-bd")];
      expect(badges.length, `${name} の段の番号の数`).toBe(m.rendered.timeline.steps.length);
      m.rendered.timeline.stills.forEach((t, s) => {
        for (const badge of badges) {
          const step = Number(badge.getAttribute("data-step"));
          const fill = m.opacity(badge.querySelector(".dg-bdf") as Element, t);
          const ring = m.opacity(badge.querySelector(".dg-bdp") as Element, t);
          if (step === s) expect(fill, `${name} の段 ${s + 1} の止め絵で、今の段の番号が塗られていない`).toBeGreaterThan(0.99);
          if (step < s) {
            expect(fill, `${name} の段 ${s + 1} の止め絵で、段 ${step + 1} の番号の塗りが残る`).toBeLessThan(0.01);
            expect(ring, `${name} の段 ${s + 1} の止め絵で、段 ${step + 1} の番号の縁取りが見えない`).toBeGreaterThan(0.99);
          }
        }
      });
    }
  });

  it("still-carrier-at-rest", () => {
    const m = motionOf(exampleJson("ccip.json"));
    const { layout, timeline } = m.rendered;
    const shapes = [...new Set([...m.doc.querySelectorAll(".dg-coin, .dg-car, .dg-env")].map((el) => el.parentElement as Element))];
    const carriers = timeline.carriers.filter((c) => layout.edges.some((e) => e.step === c.step && e.event === c.event));
    expect(shapes.length, "CCIP の運ぶ物の数").toBe(carriers.length);
    let checked = 0;
    carriers.forEach((c, i) => {
      const settle = layout.edges.find((e) => e.step === c.step && e.event === c.event)?.settle;
      const t = timeline.stills[c.step] as number;
      if (!settle || t < c.arrive || t >= c.end) return;
      const [x = Number.NaN, y = Number.NaN] = m.value(shapes[i] as Element, "transform", t) ?? [];
      expect(Math.hypot(x - settle[0], y - settle[1]), `CCIP の段 ${c.step + 1} の止め絵で、運ぶ物が着いた先 (${settle.join(", ")}) に居ない (${x}, ${y})`).toBeLessThanOrEqual(0.5);
      checked++;
    });
    expect(checked, "CCIP の止め絵で着いた先に居るはずの運ぶ物").toBeGreaterThan(0);
  });
});

describe("線", () => {
  it("line-draws-before-its-head", () => {
    for (const [name, file] of SAMPLES) {
      const m = motionOf(exampleJson(file));
      const dash = /\.dg-e-on\{[^}]*stroke-dasharray:([\d. ]+)/.exec(m.rendered.svg)?.[1]?.trim().split(/\s+/).map(Number);
      expect(dash, `${name} の色の線に点線の模様が無い`).toBeDefined();
      for (const { time, line, head } of lines(m)) {
        const where = `${name} の段 ${time.step + 1} の線`;
        const mid = (time.start + time.drawn) / 2;
        expect(m.opacity(line, mid), `${where} が引く間に見えない`).toBeGreaterThan(0.99);
        const share = drawnShare(dash as number[], m.value(line, "stroke-dashoffset", mid)?.[0] ?? Number.NaN);
        expect(share, `${where} の引く間の中ほどに描かれる割合`).toBeGreaterThan(0);
        expect(share, `${where} の引く間の中ほどに描かれる割合`).toBeLessThan(1);
        expect(drawnShare(dash as number[], m.value(line, "stroke-dashoffset", time.drawn)?.[0] ?? Number.NaN), `${where} を引き終えても全部は描かれない`).toBe(1);
        expect(m.opacity(head, mid), `${where} の矢じりが引き終える前に出る`).toBeLessThan(0.01);
        expect(m.opacity(head, time.drawn + 0.01), `${where} の矢じりが引き終えても出ない`).toBeGreaterThan(0.99);
      }
    }
  });

  it("flow-runs-forward-in-its-step", () => {
    for (const [name, file] of SAMPLES) {
      const m = motionOf(exampleJson(file));
      const { stills } = m.rendered.timeline;
      for (const { time, flow } of lines(m)) {
        const where = `${name} の段 ${time.step + 1} の線の流れる点`;
        expect(m.opacity(flow, (time.drawn + time.end) / 2), `${where} が見えない`).toBeGreaterThan(0.5);
        const from = m.value(flow, "stroke-dashoffset", time.drawn)?.[0] ?? Number.NaN;
        const to = m.value(flow, "stroke-dashoffset", time.end)?.[0] ?? Number.NaN;
        // 点線の模様をずらす量が減ると、点は線の始まりから終わりへ進む
        expect(to, `${where} が線の向きに流れない`).toBeLessThan(from);
        const next = stills[time.step + 1];
        if (next !== undefined) expect(m.opacity(flow, next), `${where} が次の段の止め絵で消えていない`).toBeLessThan(0.01);
      }
    }
  });

  it("lines-relit-after-last-step", () => {
    for (const [name, file] of SAMPLES) {
      const m = motionOf(exampleJson(file));
      const { stills, last } = m.rendered.timeline;
      const final = stills.length - 1;
      const drawn = lines(m);
      const dim = Math.max(...drawn.filter((d) => d.time.step < final).map((d) => m.opacity(d.line, stills[final] as number)));
      for (const { time, line } of drawn) {
        expect(m.opacity(line, last), `${name} の段 ${time.step + 1} の線が、繰り返す前に済んだ段の線 (${dim}) より濃くならない`).toBeGreaterThan(dim);
      }
    }
  });
});

describe("運ぶ物", () => {
  it("carrier-shown-as-timeline", () => {
    for (const [name, file] of SAMPLES) {
      const m = motionOf(exampleJson(file));
      const { layout, timeline } = m.rendered;
      const shapes = [...new Set([...m.doc.querySelectorAll(".dg-coin, .dg-car, .dg-env")].map((el) => el.parentElement as Element))];
      const carriers = timeline.carriers.filter((c) => layout.edges.some((e) => e.step === c.step && e.event === c.event));
      expect(shapes.length, `${name} の運ぶ物の数`).toBe(carriers.length);
      carriers.forEach((c, i) => {
        const shape = shapes[i] as Element;
        const where = `${name} の段 ${c.step + 1} の運ぶ物`;
        expect(m.opacity(shape, c.start + 0.05), `${where} が見える間の始まりに見えない`).toBeGreaterThan(0.99);
        expect(m.opacity(shape, (c.start + c.end) / 2), `${where} が見える間の中ほどに見えない`).toBeGreaterThan(0.99);
        // 次の運ぶ物と入れ替わる時に、前の運ぶ物が残ると 2 つに見える
        if (c.start >= 0.2) expect(m.opacity(shape, c.start - 0.2), `${where} が見える間の 0.2 秒前に見える`).toBeLessThan(0.01);
        if (c.end + 0.2 < timeline.total) expect(m.opacity(shape, c.end + 0.2), `${where} が見える間の 0.2 秒後に見える`).toBeLessThan(0.01);
      });
    }
  });
});
