/**
 * 構成図で、同じ箱の同じ所から別々の箱へ出る線 (#3549)。
 *
 * 評価のケース`new-kind-issue`でAIが描いた構成図では、`スマートフォン市場`から`iOS`と`その他`へ引いた2本の線が、
 * `スマートフォン市場`の下の同じ所から出て、行の下の同じ道を重なって走っていた。段3で`dragon check --layout`が並んで近すぎる線を知らせた。
 * 検査の見本`overlap-lines.dragon`でも、`ウォレット`の右の縁の同じ所から出る2本の線が横に重なって走っていた。
 * 同じ箱の同じ所から別々の箱へ出る線は、出る所を離し、行の下か上を回る道も線ごとに`APART.line`以上離して通す。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * 描く部品と崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ renderDiagram }, { parseNotation }, { checkText, problemLine }, { APART }] = await Promise.all([
  // 全ての図の種類の部品と個別ブロックの読み方を持つ入口から読む
  import("../src/render/svg"),
  import("../src/parser"),
  import("../src/check"),
  import("../src/look/values"),
]);

type Point = [number, number];
interface Edge {
  from: string;
  to: string;
  step: number;
  points: Point[];
}

const ROOT = process.cwd();
const FIXTURES = join(ROOT, "packages/dragon/test/fixtures/layout");
/** 評価のケース`new-kind-issue`でAIが描いた構成図。4つの箱を1行に並べ、`スマートフォン市場`から3本の線を出す */
const FAN_OUT_ROW = join(FIXTURES, "fan-out-row.dragon");
/** `ウォレット`の右の縁から、段1のトークンへの線と段3のブリッジへの線を出す構成図 (#3547) */
const OVERLAP = join(FIXTURES, "overlap-lines.dragon");

/**
 * 1つの箱の下の同じ所から3本の線を出す図。`市場`と同じ行に箱を3つ並べ、5つ目の箱`タブレット`は行に入らないので下の行に置かれる。
 * `iOS`と`その他`への線は行の下を回り、`タブレット`への線は`市場`の下から真下へ出て下の行の箱の横へ入る
 */
const THREE_FAN = [
  "architecture 1つの箱の下から3本の線を出す",
  "",
  "box market as 市場 [note: 全体, icon: globe]",
  "box android as Android [note: 約70%, icon: app]",
  "box ios as iOS [note: 約29%, icon: app]",
  "box other as その他 [note: 約1%, icon: app]",
  "box tablet as タブレット [note: 別に数える, icon: app]",
  "",
  "step Android",
  "  say 市場の7割をAndroidが占める。",
  "  market -> android: 約70%",
  "",
  "step iOS",
  "  say 残りのほとんどをiOSが占める。",
  "  market -> ios: 約29%",
  "",
  "step その他",
  "  say それ以外は合わせても1%にとどまる。",
  "  market -> other: 約1%",
  "",
  "step タブレット",
  "  say タブレットは別に数える。",
  "  market -> tablet: 別に数える",
].join("\n");

function laid(text: string): { edges: Edge[] } {
  const parsed = parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(`記法を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang: "ja" }).layout;
}

/**
 * `dragon check --layout` と同じ形で、記法の誤りと崩れの知らせの行を返す。段の頭は命令と同じ形にする。
 * 誤りの行も返し、記法を読めずに崩れを数えなかった回を、崩れの無い回と取り違えない
 */
function problems(file: string, text: string, kind?: string): string[] {
  return checkText(file, text, "notation", "ja", { layout: (step, said) => `段 ${step}: ${said}` })
    .filter((p) => kind === undefined || p.layout?.kind === kind)
    .map(problemLine);
}

/** 点から線分 a-b までの距離 */
function toSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(ax + t * dx - px, ay + t * dy - py);
}

/** 折れ線を 1px ごとに区切った点 */
function samples(points: Point[]): Point[] {
  return points.slice(1).flatMap((q, k) => {
    const p = points[k] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
    return Array.from({ length: n + 1 }, (_, i): Point => [p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n]);
  });
}

/** 2 本の折れ線の間の最も近い所の距離。両方の線の点から測り、片方の線の端だけが近い形も拾う */
function closest(a: Point[], b: Point[]): number {
  const from = (xs: Point[], ys: Point[]): number => Math.min(...samples(xs).map((p) => Math.min(...ys.slice(1).map((q, k) => toSegment(p, ys[k] as Point, q)))));
  return Math.min(from(a, b), from(b, a));
}

/** 箱`from`から出る線を、行き先の箱ごとに 1 本ずつ */
function linesFrom(edges: Edge[], from: string): Edge[] {
  return edges.filter((e, i) => e.from === from && edges.findIndex((o) => o.from === from && o.to === e.to) === i);
}

/** 線の組ごとに、出る所の間と、最も近い所の距離が`APART.line`以上かを確かめる */
function expectApart(lines: Edge[]): void {
  lines.forEach((a, i) => {
    for (const b of lines.slice(i + 1)) {
      const [p, q] = [a.points[0] as Point, b.points[0] as Point];
      expect(Math.hypot(p[0] - q[0], p[1] - q[1]), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} の出る所の間`).toBeGreaterThanOrEqual(APART.line);
      expect(closest(a.points, b.points), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} の最も近い所`).toBeGreaterThanOrEqual(APART.line);
    }
  });
}

describe("同じ箱の同じ所から出る構成図の線は別々の道を通る (#3549)", () => {
  it("fan-out-row-warns-nothing", () => {
    expect(problems(FAN_OUT_ROW, readFileSync(FAN_OUT_ROW, "utf8")), "AIが描いた構成図の崩れの知らせ").toEqual([]);
  });

  it("fan-out-row-lines-apart", () => {
    const lines = linesFrom(laid(readFileSync(FAN_OUT_ROW, "utf8")).edges, "market");
    expect(lines.map((l) => l.to), "スマートフォン市場から出る線").toEqual(["android", "ios", "other"]);
    expectApart(lines);
  });

  it("overlap-lines-wallet-lines-apart", () => {
    const text = readFileSync(OVERLAP, "utf8");
    const lines = linesFrom(laid(text).edges, "wallet");
    expect(lines.map((l) => l.to), "ウォレットから出る線").toEqual(["token", "bridge"]);
    expectApart(lines);
    expect(problems(OVERLAP, text, "lines-close"), "並んで近すぎる線の知らせ").toEqual([]);
  });

  it("three-fan-lines-apart", () => {
    const lines = linesFrom(laid(THREE_FAN).edges, "market");
    expect(lines.map((l) => l.to), "市場から出る線").toEqual(["android", "ios", "other", "tablet"]);
    expectApart(lines);
    expect(problems("three-fan.dragon", THREE_FAN), "3本の線を出す図の崩れの知らせ").toEqual([]);
  });
});
