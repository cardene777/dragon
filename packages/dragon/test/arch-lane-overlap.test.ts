/**
 * 構成図で、別々の箱から出て同じ道を回る線と、1つの箱の同じ所へ入る線と出る線 (#3552)。
 *
 * 4つの箱を1行に並べて段3で`A → C`、段4で`B → D`を引くと、2本はどちらも間の箱を避けて行の下を回り、
 * 同じ高さの道を間0で重なって走っていた。同じ箱から出る線は #3549 で離したが、出る箱が違う線は離していなかった。
 * 行の下か上か列の間を回る道は、出る箱によらず、区間が重なる線どうしを`APART.line`以上離して並べる。
 * 回る道を離すと入る線の縦の区間が長くなり、1つの箱の同じ所へ入る線とそこから出る線の重なりが崩れの検査の下限を超えたので、
 * 入る所と出る所も離す。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * 描く部品と崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ renderDiagram }, { parseNotation }, { checkText, problemLine }, { APART, LOOK }] = await Promise.all([
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

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures/layout");
/** 4つの箱を1行に並べ、段3の`A → C`と段4の`B → D`が行の下を回る図 */
const LANE_OVERLAP = join(FIXTURES, "lane-overlap.dragon");
/** 形を変えた箱の図 (#3520)。段4の関所からプールへの線が行の下を回ってプールの下へ入り、段5のプールから記録の倉庫への線が同じ所から下へ出る */
const SHAPES = join(FIXTURES, "shapes.dragon");

/** 1行に並べる4つの箱。段1から段3の線が`a`から`d`を順に右へ並べる */
const ROW = ["box a as A", "box b as B", "box c as C", "box d as D"];

/** 段ごとに 1 本の線を引く記法 */
const notation = (title: string, boxes: string[], lines: string[]): string =>
  [`architecture ${title}`, "", ...boxes, ...lines.flatMap((line, i) => ["", `step ${i + 1}`, `  ${line}`])].join("\n");

/**
 * 1行目の4つの箱の下に、`a`の下の`e`と`c`の下の`f`を置く図 (`[side: right]`の線は相手の箱を下の行に置く)。
 * 行の間の道を、行へ戻る線 (`A → C`、`B → D`) と、その帰りの線 (`C → A`) と、次の行へ進む線 (`A → F`) が通る。
 * `A → C`と`B → D`は区間が交わり、`A → F`は`A`の下の`E`に塞がれて真下へ行けず行の間を回る。
 * `C`の下からは、帰りの線`C → A`と真下の`F`への線が出る。
 * 帰りの線には名前を付けない。付けると #3552 の前から名前が線から離れて置かれ (`label-off-line`)、この検査が確かめる線の崩れと混ざるため
 */
const MIXED = notation("行の間で戻る線と進む線と帰りの線を混ぜる", [...ROW, "box e as E", "box f as F"], [
  "a -> b: 一",
  "b -> c: 二",
  "c -> d: 三",
  "a -> e: 四 [side: right]",
  "c -> f: 五 [side: right]",
  "a -> c: 六",
  "b -> d: 七",
  "c -> a",
  "a -> f: 九",
]);

/**
 * 1行目の4つの箱の下に、`a`と`c`と`d`の下の箱を置く図。段7の`A → F`は行の間を回って下り、
 * 段8の`G → B`は`D`に塞がれて真上へ行けず、`F`に塞がれて横へも行けないので、同じ行の間を回って上る。2本の道は`B`から`F`までの区間で重なる
 */
const BETWEEN_ROWS = notation("行の間で下りる線と上る線が重なる", [...ROW, "box e as E", "box f as F", "box g as G"], [
  "a -> b: 一",
  "b -> c: 二",
  "c -> d: 三",
  "a -> e: 四 [side: right]",
  "c -> f: 五 [side: right]",
  "d -> g: 六 [side: right]",
  "a -> f: 七",
  "g -> b: 八",
]);

/** 4つの箱を縦に並べる図。段4の`A → H`と段5の`E → J`は間の箱に塞がれ、同じ列の右の間を縦に回る。2本の道は`E`から`H`までの区間で重なる */
const COLUMN = notation("同じ列の間を縦に回る2本の線", ["box a as A", "box e as E", "box h as H", "box j as J"], [
  "a -> e: 一 [side: right]",
  "e -> h: 二 [side: right]",
  "h -> j: 三 [side: right]",
  "a -> h: 四",
  "e -> j: 五",
]);

/** 1行目の4つの箱の下に、`c`の下の`f`と`d`の下の`e`を置く図。段7の`A → F`が`F`の左へ入り、段8の`F → B`が`F`の左の同じ所から出る */
const IN_OUT_SIDE = notation("箱の左へ入る線と同じ所から出る線", [...ROW, "box e as E", "box f as F"], [
  "a -> b: 一",
  "b -> c: 二",
  "c -> d: 三",
  "a -> e: 四 [side: right]",
  "c -> f: 五 [side: right]",
  "f -> e: 六",
  "a -> f: 七",
  "f -> b: 八",
]);

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

/** 箱`from`から箱`to`への線 */
function line(edges: Edge[], from: string, to: string): Edge {
  const found = edges.find((e) => e.from === from && e.to === to);
  if (!found) throw new Error(`線 ${from} → ${to} が無い`);
  return found;
}

/** 回る道。線の2つ目の区間 */
const lane = (edge: Edge): [Point, Point] => [edge.points[1] as Point, edge.points[2] as Point];

/** 2本の線の縦か横の区間どうしで、間が`APART.line`より狭く、番号の丸2つ分より長く並んで走る所 (間0で重なる所も含む) */
function closeRuns(a: Edge, b: Edge): string[] {
  const runs: string[] = [];
  const segments = (points: Point[]): [Point, Point][] => points.slice(1).map((q, k) => [points[k] as Point, q]);
  for (const [a0, a1] of segments(a.points))
    for (const [b0, b1] of segments(b.points))
      for (const axis of [0, 1] as const) {
        // `axis` が 0 なら縦の区間 (x が同じ)、1 なら横の区間 (y が同じ) どうしを比べる
        if (Math.abs(a0[axis] - a1[axis]) > 0.01 || Math.abs(b0[axis] - b1[axis]) > 0.01) continue;
        const other = axis === 0 ? 1 : 0;
        const along = Math.min(Math.max(a0[other], a1[other]), Math.max(b0[other], b1[other])) - Math.max(Math.min(a0[other], a1[other]), Math.min(b0[other], b1[other]));
        const gap = Math.abs(a0[axis] - b0[axis]);
        if (gap < APART.line && along > LOOK.badge.r * 2) runs.push(`間 ${gap.toFixed(1)} で ${along.toFixed(1)} 並ぶ`);
      }
  return runs;
}

/** 2本の線の回る道が同じ向きに走り、`APART.line`以上離れることを確かめる。`axis` は道の向きと直角の座標 (横の道は y の 1) */
function expectLanesApart(a: Edge, b: Edge, axis: 0 | 1): void {
  const [la, lb] = [lane(a), lane(b)];
  for (const [p, q] of [la, lb]) expect(Math.abs(p[axis] - q[axis]), `線 ${a.from} → ${a.to} か ${b.from} → ${b.to} の2つ目の区間が回る道でない`).toBeLessThan(0.01);
  expect(Math.abs(la[0][axis] - lb[0][axis]), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} の回る道の間`).toBeGreaterThanOrEqual(APART.line);
  expect(closeRuns(a, b), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} が並んで近すぎる所`).toEqual([]);
}

describe("別々の箱から出て同じ道を回る構成図の線は離れて通る (#3552)", () => {
  it("lane-overlap-row-warns-nothing", () => {
    const text = readFileSync(LANE_OVERLAP, "utf8");
    // 知らせが無いことだけでは、検査が重なりを見落とした回と区別できない。描いた線どうしが並んで近すぎないことも確かめる
    const { edges } = laid(text);
    edges.forEach((a, i) => {
      for (const b of edges.slice(i + 1)) if (a.to !== b.to) expect(closeRuns(a, b), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} が並んで近すぎる所`).toEqual([]);
    });
    expect(problems(LANE_OVERLAP, text), "行の下で重なっていた図の崩れの知らせ").toEqual([]);
  });

  it("lane-overlap-row-lanes-apart", () => {
    const { edges } = laid(readFileSync(LANE_OVERLAP, "utf8"));
    expectLanesApart(line(edges, "a", "c"), line(edges, "b", "d"), 1);
  });

  it("lane-mixed-row-warns-nothing", () => {
    const { edges } = laid(MIXED);
    // 図が回る道を通る線を持つことを先に確かめる。持たなければ崩れ0件は当たり前になる
    for (const [from, to] of [
      ["a", "c"],
      ["b", "d"],
      ["c", "a"],
      ["a", "f"],
    ] as const)
      expect(line(edges, from, to).points.length, `線 ${from} → ${to} が行の間を回らない`).toBe(4);
    expectLanesApart(line(edges, "a", "c"), line(edges, "b", "d"), 1);
    expectLanesApart(line(edges, "c", "a"), line(edges, "b", "d"), 1);
    expectLanesApart(line(edges, "b", "d"), line(edges, "a", "f"), 1);
    // 別々の箱へ向かう線は、どの組も並んで近すぎない。同じ箱へ向かう線は入る前に合わさってよい
    edges.forEach((a, i) => {
      for (const b of edges.slice(i + 1)) if (a.to !== b.to) expect(closeRuns(a, b), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} が並んで近すぎる所`).toEqual([]);
    });
    expect(problems("mixed.dragon", MIXED), "混ぜた図の崩れの知らせ").toEqual([]);
  });

  it("lane-between-rows-apart", () => {
    const { edges } = laid(BETWEEN_ROWS);
    expectLanesApart(line(edges, "a", "f"), line(edges, "g", "b"), 1);
    expect(problems("between-rows.dragon", BETWEEN_ROWS, "lines-close"), "並んで近すぎる線の知らせ").toEqual([]);
  });

  it("lane-column-corridor-apart", () => {
    const { edges } = laid(COLUMN);
    expectLanesApart(line(edges, "a", "h"), line(edges, "e", "j"), 0);
    expect(problems("column.dragon", COLUMN, "lines-close"), "並んで近すぎる線の知らせ").toEqual([]);
  });

  it("lane-in-out-spot-apart", () => {
    const shapes = readFileSync(SHAPES, "utf8");
    const below = laid(shapes).edges;
    const into = line(below, "gate", "pool");
    const out = line(below, "pool", "store");
    // プールの下の辺に沿って、入る所と出る所を比べる
    expect(Math.abs((into.points.at(-1) as Point)[0] - (out.points[0] as Point)[0]), "プールの下へ入る所と出る所の間").toBeGreaterThanOrEqual(APART.line);
    expect(closeRuns(into, out), "関所からプールへの線とプールから記録の倉庫への線が並んで近すぎる所").toEqual([]);
    expect(problems(SHAPES, shapes, "lines-close"), "形を変えた箱の図の並んで近すぎる線の知らせ").toEqual([]);

    const side = laid(IN_OUT_SIDE).edges;
    const enter = line(side, "a", "f");
    const leave = line(side, "f", "b");
    // F の左の辺に沿って、入る所と出る所を比べる
    expect(Math.abs((enter.points.at(-1) as Point)[1] - (leave.points[0] as Point)[1]), "F の左へ入る所と出る所の間").toBeGreaterThanOrEqual(APART.line);
    expect(closeRuns(enter, leave), "A から F への線と F から B への線が並んで近すぎる所").toEqual([]);
    expect(problems("in-out-side.dragon", IN_OUT_SIDE, "lines-close"), "並んで近すぎる線の知らせ").toEqual([]);
  });
});
