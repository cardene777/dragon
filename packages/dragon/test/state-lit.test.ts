// @vitest-environment jsdom
/**
 * 状態図の箱が光る区間 (#3575)。
 *
 * 状態に着く線とその状態を出る線を同じ段に書くと、着く時刻より出る時刻が前になる。
 * 箱は着いた時から段の終わりまで光り、済んだ印は光が消えた少し後に出る。
 * 全ての状態図を走査し、区間が逆でなかった箱は `fixtures/state-lit-before.json` の直す前の記録と比べる。
 * 記録は `packages/dragon` から見た file の path ごとに、箱の光る区間と済んだ印の時刻を持ち、区間が逆だった箱を持たない。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { draw, type Rendered, type Span, type Timeline } from "./render-support";

const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages/dragon");

interface StateTimeline extends Timeline {
  states?: { box: string; lit: Span[]; done?: number }[];
}

type StateRendered = Omit<Rendered, "timeline"> & { timeline: StateTimeline };

const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));

/** 頭の説明の行を除いた最初の行が `state ` で始まる記法の file */
const isStateDiagram = (path: string): boolean =>
  readFileSync(path, "utf8")
    .split("\n")
    .find((line) => line.trim() !== "" && !line.startsWith("//"))
    ?.startsWith("state ") === true;

const FILES = ["src", "test", "examples", "blocks"]
  .flatMap((dir) => walk(join(PACKAGE, dir)))
  .filter((path) => path.endsWith(".dragon") && isStateDiagram(path))
  .map((path) => relative(PACKAGE, path))
  .sort();

const before = JSON.parse(readFileSync(join(PACKAGE, "test/fixtures/state-lit-before.json"), "utf8")) as Record<string, Record<string, { lit: [number, number][]; done?: number }>>;

const drawn = new Map<string, StateRendered>();

/** file を読んで描いた結果。読めなければ誤りを名指して落とす */
function render(file: string): StateRendered {
  const found = drawn.get(file);
  if (found) return found;
  const lang = file.endsWith(".en.dragon") ? "en" : "ja";
  const read = api("parseNotation")(readFileSync(join(PACKAGE, file), "utf8"), { lang });
  expect(read.ok, `${file} を読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  const rendered = draw("renderDiagram")(read.ok ? read.diagram : {}, { lang }) as unknown as StateRendered;
  drawn.set(file, rendered);
  return rendered;
}

const statesOf = (file: string) => render(file).timeline.states ?? [];

/** 時刻 `at` を含む段の終わり */
function stepEnd(timeline: StateTimeline, at: number): number {
  const step = timeline.steps.find((s) => at >= s.start && at < s.end);
  expect(step, `${at} 秒を含む段が無い`).toBeDefined();
  return step?.end ?? 0;
}

/** 着く線と出る線を同じ段に書いた 5 か所。`at` は着く時刻 (秒) */
const ARRIVE_AND_LEAVE = [
  { file: "src/blocks/link/gallery/link.state.dragon", box: "支払い", at: 4.6 },
  { file: "src/blocks/link/gallery/link.state.en.dragon", box: "check", at: 5.5 },
  { file: "src/blocks/source/gallery/source.state.dragon", box: "支払い", at: 4.6 },
  { file: "src/blocks/source/gallery/source.state.en.dragon", box: "check", at: 5.45 },
  { file: "test/fixtures/empty-slot/order-state.dragon", box: "delivered", at: 9.2 },
];

describe("状態図の走査 (#3575)", () => {
  it("state-files-are-found", () => {
    expect(FILES.length, "走査した状態図の数 (走査の空振り)").toBeGreaterThanOrEqual(30);
    for (const { file } of ARRIVE_AND_LEAVE) expect(FILES, `走査が ${file} を拾わない`).toContain(file);
    expect(
      Object.keys(before).filter((file) => !FILES.includes(file)),
      "記録に在るのに走査が拾わない file",
    ).toEqual([]);
  });
});

describe.for(FILES)("状態図の光る区間 (#3575) %s", (file) => {
  it("state-lit-never-reversed", () => {
    for (const { box, lit } of statesOf(file)) for (const { start, end } of lit) expect(end, `${file} の ${box} の光る区間 ${start} 秒から ${end} 秒の終わりが始まりより後でない`).toBeGreaterThan(start);
  });

  it("state-done-after-arrival", () => {
    for (const { box, lit, done } of statesOf(file)) {
      if (done !== undefined) expect(done, `${file} の ${box} の済んだ印が光り始める ${lit[0]?.start} 秒より後でない`).toBeGreaterThan(lit[0]?.start ?? Number.POSITIVE_INFINITY);
    }
  });

  it("state-lit-keeps-other-intervals", () => {
    const states = statesOf(file);
    for (const [box, recorded] of Object.entries(before[file] ?? {})) {
      const state = states.find((s) => s.box === box);
      expect(
        state?.lit.map((l) => [l.start, l.end]),
        `${file} の ${box} の光る区間が直す前の記録と違う`,
      ).toEqual(recorded.lit);
      expect(state?.done, `${file} の ${box} の済んだ印の時刻が直す前の記録と違う`).toBe(recorded.done);
    }
  });
});

describe.for(ARRIVE_AND_LEAVE)("着いた段のうちに出る箱 (#3575) $file", ({ file, box, at }) => {
  it("state-lit-ends-with-step", () => {
    const { timeline } = render(file);
    const lit = timeline.states?.find((s) => s.box === box)?.lit.find((l) => Math.abs(l.start - at) < 0.001);
    expect(lit, `${file} の ${box} に ${at} 秒から光る区間が無い`).toBeDefined();
    expect(lit?.end, `${file} の ${box} の光が段の終わりまで続かない`).toBe(stepEnd(timeline, at));
  });
});

describe("着く前の箱の光 (#3575)", () => {
  it("state-glow-waits-for-arrival", () => {
    const file = "src/blocks/link/gallery/link.state.dragon";
    const box = "支払い";
    const rendered = render(file);
    const motion = motionFrom(rendered);
    const place = rendered.layout.boxes.find((b) => b.id === box);
    const glow = [...motion.doc.querySelectorAll("rect.dg-on")].find((rect) => Math.abs(Number(rect.getAttribute("x")) - (place?.x ?? Number.NaN)) < 1 && Math.abs(Number(rect.getAttribute("y")) - (place?.y ?? Number.NaN)) < 1);
    expect(glow, `${box} の光の枠が SVG に無い`).toBeDefined();
    if (!glow) return;
    const lit = rendered.timeline.states?.find((s) => s.box === box)?.lit[0];
    const at = 4.6;
    expect(lit?.start, `${box} に着く時刻が変わった`).toBeCloseTo(at, 3);
    for (let t = 0; t < at; t += 0.1) expect(motion.opacity(glow, t), `${box} が着く前の ${t.toFixed(1)} 秒に光る`).toBe(0);
    expect(motion.opacity(glow, stepEnd(rendered.timeline, at) - 0.2), `${box} が着いた段のうちに光らない`).toBe(1);
  });
});

describe("光る区間を作る場所 (#3575)", () => {
  it("flow-render-has-no-lit-fix", () => {
    const flow = readFileSync(join(PACKAGE, "src/render/flow.ts"), "utf8");
    expect(flow, "手順の図を描く処理が光る区間の逆を直している").not.toContain("l.end > l.start");
    expect(flow, "手順の図を描く処理が段の終わりを引いている").not.toContain("stepEnd");
  });

  it("changelog-lists-state-glow-fix", () => {
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) expect(changelogEntry(join(ROOT, file), 3575), `${file} に #3575 の項が無い`).not.toBe("");
  });
});
