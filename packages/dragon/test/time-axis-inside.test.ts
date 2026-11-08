/**
 * 時間軸の図の針と目盛りと字を、時間軸の囲みの枠の内側に収める (#3527)。
 *
 * 見本`finality`の段3、段9、段10で、軸の右端の針の頭と終わりの点が囲みの枠を越え、右端の目盛りの字が枠に接していた。
 * 見本`withdraw`の段4でも、右端の目盛りの字と最後の目盛りの線が枠に接していた。
 * 置き場所は描く部品が返す値 (`layout`と`timeline`) と見た目の値の表から測り、枠の線の内側の縁から4px以上離れることを求める。
 * 枠は角を丸めた四角なので、角の近くの部品は丸めた角までの間で測る。
 * はみ出す図は`dragon check --layout`が段と部品を名指して知らせる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { runCli } from "./export-support";

const [{ LOOK, TYPE }, { textBox }, { findBreaks }] = await Promise.all([import("../src/look/values"), import("../src/layout/measure"), import("../src/render/breaks")]);

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
/** 右端の目盛りの節目に、段2で囲みの枠を越える長い状態の字を出す図 */
const TIME_EDGE = join(ROOT, "packages/dragon/test/fixtures/layout/time-edge.dragon");
/** 枠の線の内側の縁から空ける間の下限 (px) */
const GAP = 4;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TimeRendered {
  layout: {
    regions: (Rect & { id: string })[];
    axis: { x: number; w: number; unit: number; count: number; line: number };
    ticks: { at: number; x: number; text: string; left: number; y: number }[];
    needle: { y1: number; y2: number };
  };
  timeline: { stills: number[]; needle: [number, number][] };
}

/** 見本の記法を読んで描く */
function render(file: string, lang: "ja" | "en"): TimeRendered {
  const parsed = dragon.parseNotation(readFileSync(file, "utf8"), { lang });
  if (!parsed.ok) throw new Error(`${file} を読めない: ${JSON.stringify(parsed.errors)}`);
  return dragon.renderDiagram(parsed.diagram, { lang }) as unknown as TimeRendered;
}

/** 真っ直ぐ進む動き`keys`の、時刻`t`の値 */
function valueAt(keys: [number, number][], t: number): number {
  const first = keys[0];
  if (!first) return Number.NaN;
  if (t <= first[0]) return first[1];
  for (let k = 1; k < keys.length; k++) {
    const [t1, v1] = keys[k] as [number, number];
    const [t0, v0] = keys[k - 1] as [number, number];
    if (t <= t1) return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return (keys[keys.length - 1] as [number, number])[1];
}

/**
 * 四角`rect`が、囲み`panel`の枠の線の内側の縁からどれだけ内に在るか (px)。縁を越えた分は負になる。
 * 枠の線は太さ1pxで囲みの四角の内側に引き、角は`LOOK.region.radius`で丸める。丸めた四角は凸なので、四角の4つの角で測れば足りる
 */
function clearance(rect: Rect, panel: Rect): number {
  const inner = { x: panel.x + 1, y: panel.y + 1, w: panel.w - 2, h: panel.h - 2 };
  const r = LOOK.region.radius - 1;
  const cx = inner.x + inner.w / 2;
  const cy = inner.y + inner.h / 2;
  const corners: [number, number][] = [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h],
  ];
  return Math.min(
    ...corners.map(([px, py]) => {
      const qx = Math.abs(px - cx) - (inner.w / 2 - r);
      const qy = Math.abs(py - cy) - (inner.h / 2 - r);
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      return -outside;
    }),
  );
}

/** 時間軸の囲み */
function axisPanel(rendered: TimeRendered): Rect {
  const panel = rendered.layout.regions.find((region) => region.id === "axis");
  expect(panel, "時間軸の囲みが無い").toBeDefined();
  return panel as Rect;
}

/** 段`step` (1から数える) の止め絵で、針の頭と終わりの点が占める四角 */
function needleAt(rendered: TimeRendered, step: number): { head: Rect; dot: Rect } {
  const { layout, timeline } = rendered;
  const N = LOOK.time.needle;
  const x = layout.axis.x + valueAt(timeline.needle, timeline.stills[step - 1] as number) * layout.axis.unit;
  return {
    head: { x: x - N.head * 0.75, y: layout.needle.y1 - N.head, w: N.head * 1.5, h: N.head },
    dot: { x: x - N.dot, y: layout.axis.line - N.dot, w: N.dot * 2, h: N.dot * 2 },
  };
}

/** 目盛りの字が占める四角 */
const tickRect = (tick: TimeRendered["layout"]["ticks"][number]): Rect => textBox(tick.text, tick.left, tick.y, TYPE.timeTick);

describe("時間軸の部品が囲みの枠の内側に収まる (#3527)", () => {
  it("time-axis-needle-inside-panel", () => {
    for (const lang of ["ja", "en"] as const) {
      const rendered = render(join(EXAMPLES, lang === "en" ? "finality.en.dragon" : "finality.dragon"), lang);
      const panel = axisPanel(rendered);
      expect(rendered.timeline.stills, `ブロックの確定の段の数 (${lang})`).toHaveLength(10);
      for (const step of [3, 9, 10]) {
        const { head, dot } = needleAt(rendered, step);
        expect(clearance(head, panel), `段${step}の針の頭が枠の線から${GAP}px以上内側に無い (${lang})`).toBeGreaterThanOrEqual(GAP);
        expect(clearance(dot, panel), `段${step}の針の終わりの点が枠の線から${GAP}px以上内側に無い (${lang})`).toBeGreaterThanOrEqual(GAP);
      }
      // 段9と段10は針が軸の右端にいる。測る所が右端に届いていなければ、右端の崩れを測っていない
      const end = rendered.layout.axis.x + rendered.layout.axis.w;
      expect(needleAt(rendered, 10).dot.x + LOOK.time.needle.dot, `段10の針が軸の右端にいない (${lang})`).toBeCloseTo(end, 3);
      // 目盛りの字は全ての段で見えている
      expect(rendered.layout.ticks.length, `目盛りの字が無い (${lang})`).toBeGreaterThan(1);
      for (const tick of rendered.layout.ticks) expect(clearance(tickRect(tick), panel), `目盛りの字「${tick.text}」が枠の線から${GAP}px以上内側に無い (${lang})`).toBeGreaterThanOrEqual(GAP);
    }
  });

  it("time-axis-last-tick-inside-panel", () => {
    for (const lang of ["ja", "en"] as const) {
      const rendered = render(join(EXAMPLES, lang === "en" ? "withdraw.en.dragon" : "withdraw.dragon"), lang);
      const panel = axisPanel(rendered);
      const { axis, ticks } = rendered.layout;
      expect(rendered.timeline.stills, `引き出しの段の数 (${lang})`).toHaveLength(4);
      const last = ticks.find((tick) => tick.at === axis.count);
      expect(last?.text, `右端の目盛りの字が10日でない (${lang})`).toMatch(lang === "en" ? /^10\s?d$/u : /^10\s?日$/u);
      if (!last) return;
      expect(clearance(tickRect(last), panel), `右端の目盛りの字「${last.text}」が枠の線から${GAP}px以上内側に無い (${lang})`).toBeGreaterThanOrEqual(GAP);
      // 最後の目盛りの線は、軸の右端に長い目盛りの線の長さで、線の太さを持って引く
      const x = axis.x + axis.count * axis.unit;
      const line = { x: x - LOOK.stroke.timeAxis / 2, y: axis.line - LOOK.time.major / 2, w: LOOK.stroke.timeAxis, h: LOOK.time.major };
      expect(clearance(line, panel), `最後の目盛りの線が枠の線から${GAP}px以上内側に無い (${lang})`).toBeGreaterThanOrEqual(GAP);
      // 段4の止め絵の針も枠の内に在る
      const { head, dot } = needleAt(rendered, 4);
      expect(Math.min(clearance(head, panel), clearance(dot, panel)), `段4の針が枠の線から${GAP}px以上内側に無い (${lang})`).toBeGreaterThanOrEqual(GAP);
    }
  });
});

interface Problem {
  file: string;
  line: number;
  severity: string;
  message: string;
  layout?: { kind: string; step: number; parts: Record<string, unknown>[] };
}

/** file の中で、段`step` (1から数える) を始める`step`の行の番号 */
function stepLine(file: string, step: number): number {
  const lines = readFileSync(file, "utf8").split("\n");
  const at = lines.map((line, i) => ({ line, i })).filter(({ line }) => /^step\b/u.test(line))[step - 1];
  return (at?.i ?? -1) + 1;
}

describe("時間軸の部品が囲みの枠に掛かると知らせる (#3527)", () => {
  it("layout-check-finds-time-text-on-panel-edge", async () => {
    const json = await runCli(["check", TIME_EDGE, "--layout", "--json", "--lang", "ja"]);
    expect(json.code, `崩れだけの図で終わり方0にならない ${json.stderr}`).toBe(0);
    const problems = JSON.parse(json.stdout || "[]") as Problem[];
    const edges = problems.filter((p) => p.layout?.kind === "panel-edge");
    expect(
      edges.map((p) => p.layout),
      "段2の状態の字が時間軸の囲みの枠に掛かることを1件で出さない",
    ).toEqual([{ kind: "panel-edge", step: 2, parts: [{ kind: "text", text: "受け取った資産" }, { kind: "panel", panel: "axis" }] }]);
    const [edge] = edges;
    expect(edge?.severity, "崩れの重さ").toBe("warning");
    expect(edge?.line, "崩れが見え始める段のstepの行").toBe(stepLine(TIME_EDGE, 2));
    expect(edge?.message, "日本語の知らせが段と字と時間軸の囲みを名指さない").toMatch(/^段 ?2: 「受け取った資産」が.*時間軸の囲み/u);
    const en = await runCli(["check", TIME_EDGE, "--layout", "--lang", "en"]);
    expect(en.code, en.stderr).toBe(0);
    const line = en.stdout.trimEnd().split("\n").find((l) => l.includes('"受け取った資産"'));
    expect(line, `英語の行が段と字と時間軸の囲みを名指さない\n${en.stdout}`).toMatch(new RegExp(`^${TIME_EDGE.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}:${stepLine(TIME_EDGE, 2)}:1 warning Step 2: .*"受け取った資産".*time axis`, "u"));
  });

  it("layout-check-names-needle-and-ticks", () => {
    const panel = { x: 14, y: 100, w: 700, h: 200 };
    const right = panel.x + panel.w - 1;
    const ALWAYS: [number, number][] = [[0, Number.POSITIVE_INFINITY]];
    const breaks = findBreaks({
      inks: [],
      traces: [],
      stills: [1, 2, 3, 4],
      frame: { w: 728, h: 400 },
      boxes: [],
      edges: [],
      outlines: new Map(),
      framed: [
        // 段1と段2の針は枠の内に、段3と段4の針は右端で枠を越える
        { part: { kind: "needle" }, rect: { x: 400, y: 110, w: 9, h: 6 }, frame: panel, shown: [[1, 3]] },
        { part: { kind: "needle" }, rect: { x: right - 6.5, y: 110, w: 9, h: 6 }, frame: panel, shown: [[3, Number.POSITIVE_INFINITY]] },
        // 目盛りの線は枠の線の内側の縁から2pxで、接して見える
        { part: { kind: "ticks" }, rect: { x: 118, y: 240, w: right - 2 - 118, h: 12 }, frame: panel, shown: ALWAYS },
        // 4px離れた字は崩れでない
        { part: { kind: "text", text: "19.2 分" }, rect: { x: right - 4 - 40, y: 260, w: 40, h: 11 }, frame: panel, shown: ALWAYS },
      ],
    });
    const panelPart = { kind: "panel", panel: "axis" };
    expect(breaks, "針と目盛りの線が枠に掛かる崩れを、最初に見える段の1件ずつで出さない").toEqual([
      { kind: "panel-edge", step: 1, parts: [{ kind: "ticks" }, panelPart] },
      { kind: "panel-edge", step: 3, parts: [{ kind: "needle" }, panelPart] },
    ]);
    const say = (lang: "ja" | "en"): string[] => breaks.map((b) => dragon.describeBreak(b as never, lang));
    const [ticksJa, needleJa] = say("ja");
    expect(ticksJa, "日本語の知らせが目盛りの線と時間軸の囲みを名指さない").toMatch(/目盛りの線.*時間軸の囲み/u);
    expect(needleJa, "日本語の知らせが針と時間軸の囲みを名指さない").toMatch(/針.*時間軸の囲み/u);
    const [ticksEn, needleEn] = say("en");
    expect(ticksEn, "英語の知らせが目盛りの線と時間軸の囲みを名指さない").toMatch(/tick marks.*time axis panel/iu);
    expect(needleEn, "英語の知らせが針と時間軸の囲みを名指さない").toMatch(/needle.*time axis panel/iu);
  });
});
