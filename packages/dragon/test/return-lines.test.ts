/**
 * 同じ2つの箱を結ぶ行きと帰りの線と、その段の番号を、崩れの検査の下限より広く離して描く (#3521)。
 *
 * skillの評価でClaudeが描いた支払いの図では、頼みの線と答えの線が10pxしか離れず、`dragon check --layout`が
 * 並んで近すぎる線と近すぎる番号を知らせていた。
 * 曲がり目を持つ同じ道を通る行きと帰りの線は重なって描かれ、番号の丸が相手の線の矢じりを隠していたのに、検査は数えなかった。
 * 描く処理が線と番号を離す間と、検査が求める間の下限を同じ値 (`APART`) から決め、2つが食い違わないようにする。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { badgeOnPath, type Layout, type Point, type SceneEdge } from "../src/layout/scene";
import * as values from "../src/look/values";
import { LOOK } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { findBreaks, type LayoutBreak } from "../src/render/breaks";
import { ALWAYS, type Trace } from "../src/render/ink";
import { renderDiagram } from "../src/render/svg";
import { runCli } from "./export-support";

const ROOT = process.cwd();
const LAYOUT_FIXTURES = join(ROOT, "packages/dragon/test/fixtures/layout");
/** 評価でClaudeが描いた支払いの図。真っすぐな行きと帰りの線を2組と、曲がり目を持つ同じ道の行きと帰りの線を1組持つ */
const PAYMENT_EVAL = join(LAYOUT_FIXTURES, "payment-eval.dragon");
/** 評価でClaudeが描いたもう1つの支払いの図。段4と段5でAPIサーバーと決済代行を曲がり目を持つ同じ道で往復する */
const PAYMENT_BENT = join(LAYOUT_FIXTURES, "payment-bent.dragon");
/** 隣り合う状態の間を行きと帰りの線で往復する状態遷移図 */
const STATE_PAIR = join(LAYOUT_FIXTURES, "state-pair.dragon");
/** 頼みと答えを別の段で書いた時系列図 */
const SEQUENCE_REPLY = join(LAYOUT_FIXTURES, "sequence-reply.dragon");
/** 同じ帯の同じ行で、支払いと台帳を横の線で往復する構成図 (#3189) */
const PAIR_ROW = join(ROOT, "packages/dragon/test/fixtures/pair-row.dragon");
/** 時間の図の見本。番号の丸の間を検査と同じ値で決める前は、段7と段9の番号が近すぎた */
const FINALITY = join(ROOT, "packages/dragon/examples/finality.dragon");

const R = LOOK.badge.r;

type Apart = { badge: number; line: number };
/** 崩れの検査と描く処理が分け合う間の下限 (`APART`)。値が無い版では、検査が自分で持っていた同じ下限 (番号の丸の半径と直径) を使う */
const shared = (values as unknown as { APART?: Apart }).APART;
const apart = (): Apart => shared ?? { badge: R, line: 2 * R };

function layoutOf(file: string): Layout {
  const parsed = parseNotation(readFileSync(file, "utf8"), { lang: "ja" });
  if (!parsed.ok) throw new Error(`${file} を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang: "ja" }).layout;
}

/** `dragon check --layout --json`が出した崩れ */
async function breaksOf(file: string): Promise<LayoutBreak[]> {
  const ran = await runCli(["check", file, "--layout", "--json", "--lang", "ja"]);
  expect(ran.code, `${file} の確かめが終わり方0で終わらない ${ran.stderr}`).toBe(0);
  return (JSON.parse(ran.stdout) as { layout?: LayoutBreak }[]).flatMap((p) => (p.layout ? [p.layout] : []));
}

const closeKinds = (breaks: LayoutBreak[]): LayoutBreak[] => breaks.filter((b) => b.kind === "lines-close" || b.kind === "badges-close");

/** 箱の名札 `a` と `b` を逆向きに結ぶ2本の線。`a`から出る線を先に返す */
function pairOf(layout: Layout, a: string, b: string): [SceneEdge, SceneEdge] {
  const there = layout.edges.find((e) => e.from === a && e.to === b && e.points.length > 1);
  const back = layout.edges.find((e) => e.from === b && e.to === a && e.points.length > 1);
  if (!there || !back) throw new Error(`${a} と ${b} を往復する線が無い`);
  return [there, back];
}

const segments = (points: Point[]): [Point, Point][] => points.slice(1).map((p, k) => [points[k] as Point, p]);

/**
 * 2本の線の、同じ向きの区間どうしが並んで走る所の間。縦の区間どうしと横の区間どうしだけを比べ、並んで走る長さが0より長い組を返す
 */
function sideBySide(a: Point[], b: Point[]): { axis: "縦" | "横"; gap: number }[] {
  const out: { axis: "縦" | "横"; gap: number }[] = [];
  for (const [a0, a1] of segments(a))
    for (const [b0, b1] of segments(b))
      for (const axis of [0, 1] as const) {
        if (Math.abs(a0[axis] - a1[axis]) > 1e-6 || Math.abs(b0[axis] - b1[axis]) > 1e-6) continue;
        const other = axis === 0 ? 1 : 0;
        const along = Math.min(Math.max(a0[other], a1[other]), Math.max(b0[other], b1[other])) - Math.max(Math.min(a0[other], a1[other]), Math.min(b0[other], b1[other]));
        if (along > 0) out.push({ axis: axis === 0 ? "縦" : "横", gap: Math.abs(a0[axis] - b0[axis]) });
      }
  return out;
}

/** 段`step` (1から数える) の番号の丸の真ん中 */
function badgeAt(layout: Layout, step: number): Point {
  const badge = layout.badges.find((b) => b.step === step - 1);
  if (!badge) throw new Error(`段 ${step} の番号が無い`);
  return [badge.x, badge.y];
}

/** 点から線分までの最も近い距離 */
function toSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/** 線の矢じり。線の終わりの点を先とし、最後の区間を矢じりの長さだけ戻った所を根元にする */
function arrowOf(points: Point[]): [Point, Point] {
  const tip = points[points.length - 1] as Point;
  const before = points[points.length - 2] as Point;
  const length = Math.hypot(tip[0] - before[0], tip[1] - before[1]);
  const back = LOOK.edge.arrow / length;
  return [tip, [tip[0] + (before[0] - tip[0]) * back, tip[1] + (before[1] - tip[1]) * back]];
}

/** 段の番号の丸どうしの縁の間 */
const badgeGap = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], a[1] - b[1]) - 2 * R;

/** 崩れの検査に渡す描いた線。どの時刻にも見えている */
const trace = (from: string, to: string, points: Point[]): Trace => ({ from, to, points, shown: ALWAYS });

/** 描いた線 `traces` だけを崩れの検査に掛ける */
const linesOnly = (traces: Trace[]): LayoutBreak[] => findBreaks({ inks: [], traces, stills: [0], boxes: [], edges: [], outlines: new Map() });

describe("評価でClaudeが描いた支払いの図の行きと帰りの線 (#3521)", () => {
  it("return-lines-payment-eval-no-close-breaks", async () => {
    // 図が行きと帰りの線を持つことを先に確かめる。持たなければ崩れ0件は当たり前になる
    expect(pairOf(layoutOf(PAYMENT_EVAL), "api", "oracle")).toHaveLength(2);
    expect(pairOf(layoutOf(PAYMENT_BENT), "api", "psp")).toHaveLength(2);
    for (const file of [PAYMENT_EVAL, PAYMENT_BENT]) {
      expect(closeKinds(await breaksOf(file)), `${file} の線と番号の崩れ`).toEqual([]);
    }
  });

  it("return-lines-architecture-apart", () => {
    const eval_ = layoutOf(PAYMENT_EVAL);
    const row = layoutOf(PAIR_ROW);
    const cases: [string, Layout, string, string][] = [
      ["支払いの図のAPIサーバーと価格オラクル", eval_, "api", "oracle"],
      ["支払いの図の利用者のアプリとAPIサーバー", eval_, "app", "api"],
      ["同じ行の支払いと台帳", row, "支払い", "台帳"],
    ];
    for (const [name, layout, a, b] of cases) {
      const [there, back] = pairOf(layout, a, b);
      const gaps = sideBySide(there.points, back.points);
      expect(gaps.length, `${name} の行きと帰りの線が並んで走らない`).toBeGreaterThan(0);
      for (const { gap } of gaps) expect(gap, `${name} の行きと帰りの線の間`).toBeGreaterThan(apart().line);
    }
  });

  it("return-lines-bent-pair-apart", () => {
    for (const [name, file] of [
      ["支払いの図", PAYMENT_EVAL],
      ["もう1つの支払いの図", PAYMENT_BENT],
    ] as const) {
      const layout = layoutOf(file);
      const [there, back] = pairOf(layout, "api", "psp");
      expect(there.points.length, `${name} のAPIサーバーから決済代行への線が曲がらない`).toBeGreaterThan(2);
      const gaps = sideBySide(there.points, back.points);
      expect(new Set(gaps.map((g) => g.axis)), `${name} の行きと帰りの線が縦と横の両方で並んで走らない`).toEqual(new Set(["縦", "横"]));
      for (const { axis, gap } of gaps) expect(gap, `${name} の行きと帰りの線の${axis}の区間どうしの間`).toBeGreaterThan(apart().line);
      // 段4の番号は段5の線の矢じりに、段5の番号は段4の線の矢じりに掛からない
      for (const [step, other] of [
        [there.step + 1, back],
        [back.step + 1, there],
      ] as const) {
        const [tip, base] = arrowOf(other.points);
        expect(toSegment(badgeAt(layout, step), tip, base), `${name} の段 ${step} の番号が ${other.from} から ${other.to} への線の矢じりに掛かる`).toBeGreaterThan(R + LOOK.edge.arrowHalf);
      }
    }
  });

  it("return-lines-badges-apart", () => {
    for (const file of [PAYMENT_EVAL, PAYMENT_BENT]) {
      const layout = layoutOf(file);
      for (const [a, b] of [
        [2, 3],
        [4, 5],
      ] as const) {
        expect(badgeGap(badgeAt(layout, a), badgeAt(layout, b)), `${file} の段 ${a} と段 ${b} の番号の丸の縁の間`).toBeGreaterThanOrEqual(apart().badge - 1e-6);
      }
    }
  });

  it("return-lines-gap-from-check-value", () => {
    // 2本の線の真ん中どうしの間は、検査の下限に光った線の太さを足した値。光った線の縁どうしの間も下限を下回らない
    for (const [layout, a, b] of [
      [layoutOf(PAYMENT_EVAL), "api", "oracle"],
      [layoutOf(STATE_PAIR), "待ち", "作業中"],
    ] as const) {
      const [there, back] = pairOf(layout, a, b);
      for (const { gap } of sideBySide(there.points, back.points)) expect(gap, `${a} と ${b} の行きと帰りの線の間`).toBeCloseTo(apart().line + LOOK.stroke.edgeOn, 6);
    }
  });
});

describe("状態遷移図と時系列図の行きと帰りの線 (#3521)", () => {
  it("return-lines-state-apart", async () => {
    const layout = layoutOf(STATE_PAIR);
    for (const [a, b] of [
      ["待ち", "作業中"],
      ["作業中", "確認"],
    ] as const) {
      const [there, back] = pairOf(layout, a, b);
      const gaps = sideBySide(there.points, back.points);
      expect(gaps.length, `${a} と ${b} の行きと帰りの線が並んで走らない`).toBeGreaterThan(0);
      for (const { gap } of gaps) expect(gap, `${a} と ${b} の行きと帰りの線の間`).toBeGreaterThan(apart().line);
    }
    expect((await breaksOf(STATE_PAIR)).filter((b) => b.kind === "lines-close"), "状態遷移図の並んで近すぎる線").toEqual([]);
  });

  it("return-lines-sequence-unchanged", async () => {
    const layout = layoutOf(SEQUENCE_REPLY);
    for (const [a, b] of [
      ["app", "api"],
      ["api", "db"],
    ] as const) {
      const [there, back] = pairOf(layout, a, b);
      // 時系列図の線は段ごとに下の行へ引く横の線で、行きと帰りは別の行に分かれる
      for (const edge of [there, back]) expect(edge.points.every(([, y]) => y === (edge.points[0] as Point)[1]), `${edge.from} から ${edge.to} への線が横の線でない`).toBe(true);
      expect(Math.abs((there.points[0] as Point)[1] - (back.points[0] as Point)[1]), `${a} と ${b} の行きと帰りの線が同じ行に在る`).toBeGreaterThan(0);
    }
    expect(closeKinds(await breaksOf(SEQUENCE_REPLY)), "時系列図の線と番号の崩れ").toEqual([]);
  });
});

describe("段の番号の丸の間を検査と同じ値で決める (#3521)", () => {
  it("badge-on-path-keeps-check-gap", () => {
    // 長い縦の線の始まりから14px進んだ所に置く番号が、先に置いた番号から縁で6pxしか離れない
    const line: Point[] = [
      [0, 0],
      [0, 200],
    ];
    const taken: Point = [0, LOOK.badge.along + 2 * R + 6];
    const placed = badgeOnPath(line, [taken], []);
    expect(placed[0], "番号が線の上に無い").toBeCloseTo(0, 6);
    expect(badgeGap(placed, taken), "先に置いた番号との丸の縁の間").toBeGreaterThanOrEqual(apart().badge - 1e-6);
    // 下限を満たす所のうち、線の始まりに一番近い所に置く
    expect(placed[1], "下限より先へ進めすぎる").toBeLessThanOrEqual(taken[1] + 2 * R + apart().badge + 1);
  });

  it("return-lines-badge-gap-clears-finality", async () => {
    expect((await breaksOf(FINALITY)).filter((b) => b.kind === "badges-close"), "時間の図の近すぎる番号").toEqual([]);
  });
});

describe("崩れの検査の線の下限 (#3521)", () => {
  it("layout-check-line-gap-from-apart", () => {
    expect(shared, "崩れの検査と描く処理が分け合う間の下限APARTが無い").toBeDefined();
    const vertical = (x: number): Point[] => [
      [x, 0],
      [x, 100],
    ];
    const narrow = linesOnly([trace("a", "b", vertical(0)), trace("c", "d", vertical(apart().line - 0.5))]);
    expect(narrow.map((b) => b.kind), "下限より狭い間で並ぶ線を数えない").toEqual(["lines-close"]);
    const wide = linesOnly([trace("a", "b", vertical(0)), trace("c", "d", vertical(apart().line))]);
    expect(wide, "下限ちょうどの間で並ぶ線を数える").toEqual([]);
  });

  it("layout-check-finds-overlapping-return-lines", () => {
    // 矢じりの側の端は箱から3px離すので、逆向きの線の端は3pxずれる
    const straight = linesOnly([
      trace("a", "b", [
        [0, 0],
        [0, 97],
      ]),
      trace("b", "a", [
        [0, 100],
        [0, 3],
      ]),
    ]);
    expect(straight.map((b) => b.kind), "真っすぐな行きと帰りの線が重なっても数えない").toEqual(["lines-close"]);
    const bent = linesOnly([
      trace("a", "b", [
        [0, 0],
        [0, 100],
        [97, 100],
      ]),
      trace("b", "a", [
        [100, 100],
        [0, 100],
        [0, 3],
      ]),
    ]);
    expect(bent.map((b) => b.kind), "曲がり目を持つ行きと帰りの線が重なっても数えない").toEqual(["lines-close"]);
  });

  it("layout-check-skips-same-line-redrawn", () => {
    const points: Point[] = [
      [0, 0],
      [0, 100],
      [100, 100],
    ];
    expect(linesOnly([trace("a", "b", points), trace("a", "b", points.map((p): Point => [p[0], p[1]]))]), "同じ線を2度引いた描画を崩れに数える").toEqual([]);
  });
});
