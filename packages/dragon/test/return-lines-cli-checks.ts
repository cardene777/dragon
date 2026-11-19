/**
 * `return-lines.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Layout, type Point, type SceneEdge } from "../src/layout/scene";
import * as values from "../src/look/values";
import { LOOK } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { type LayoutBreak } from "../src/render/breaks";
import { renderDiagram } from "../src/render/draw";
import { atLoad } from "./at-load";
import { runCli } from "./export-support";
import "../src/kinds/basics";
import "../src/kind-use/sequence";

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

// 2 つの図を描いて命令で崩れを調べると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。file を読み込む段で済ませ、件はその結果を読む
const PAYMENT_CHECKED = await atLoad("評価の支払いの図を描き、命令で崩れを調べる", async () => ({
  evalLayout: layoutOf(PAYMENT_EVAL),
  bentLayout: layoutOf(PAYMENT_BENT),
  breaks: [
    [PAYMENT_EVAL, await breaksOf(PAYMENT_EVAL)],
    [PAYMENT_BENT, await breaksOf(PAYMENT_BENT)],
  ] as const,
}));

describe("評価でClaudeが描いた支払いの図の行きと帰りの線 (#3521)", () => {
  it("return-lines-payment-eval-no-close-breaks", () => {
    const { evalLayout, bentLayout, breaks } = PAYMENT_CHECKED.get();
    // 図が行きと帰りの線を持つことを先に確かめる。持たなければ崩れ0件は当たり前になる
    expect(pairOf(evalLayout, "api", "oracle")).toHaveLength(2);
    expect(pairOf(bentLayout, "api", "psp")).toHaveLength(2);
    for (const [file, found] of breaks) expect(closeKinds(found), `${file} の線と番号の崩れ`).toEqual([]);
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

  it("return-lines-badge-gap-clears-finality", async () => {
    expect((await breaksOf(FINALITY)).filter((b) => b.kind === "badges-close"), "時間の図の近すぎる番号").toEqual([]);
  });
});
