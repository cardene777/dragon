/**
 * 構成図で、上下の行で列が違う箱を結ぶ線が、どの道でも間の箱に当たる時の回り道 (#3607)。
 *
 * 道が全て塞がると、入る箱の列を真っすぐ下り、間の箱と字の上を通っていた。
 * その線は、入る箱の側の一番端の列のさらに外を縦に回り、入る箱の脇から入る。
 * 左の外側は区画の名前と一番左の列の間を通し、間が足りなければ広げて置き直す。
 * 外側を回る線どうしは、別の箱へ向かう線なら`APART.line`以上離して並べる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * 描く部品と崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ renderDiagram }, { parseNotation }, { checkText, problemLine }, { APART }] =
  await Promise.all([
    import("../src/render/svg"),
    import("../src/parser"),
    import("../src/check"),
    import("../src/look/values"),
  ]);

type Point = [number, number];
interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cy: number;
}
interface Edge {
  from: string;
  to: string;
  step: number;
  points: Point[];
}
interface Region {
  header: { x: number; w: number };
}

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures/layout");
/**
 * 評価の`new-kind-issue`で Claude が描いた図 (#3606)。3つの区画を縦に積み、一番下の行の右の列に Slack を置く。
 * 段5の`開発チーム → Slack`と`営業チーム → Slack`は、右の列の Salesforce と Zendesk に塞がれる
 */
const OUTER_DETOUR = join(FIXTURES, "outer-detour.dragon");
/** 右の列の API から、2つ下の区画の左の列の記録へ線を引く図。段2の`API → 記録`は、左の列の集計と右の列の通知に塞がれる */
const OUTER_LEFT = join(FIXTURES, "outer-left.dragon");
/** 一番上の区画のアプリから、2つの区画を挟んだ右の列の集計とデータベースへ線を引く図。2本とも間の箱に塞がれる */
const OUTER_STACK = join(FIXTURES, "outer-stack.dragon");

function laid(file: string): { boxes: Box[]; edges: Edge[]; regions: Region[] } {
  const parsed = parseNotation(readFileSync(file, "utf8"), { lang: "ja" });
  if (!parsed.ok)
    throw new Error(`記法を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang: "ja" }).layout;
}

/** `dragon check --layout` と同じ形で、記法の誤りと崩れの知らせの行を返す。記法を読めずに崩れを数えなかった回を、崩れの無い回と取り違えない */
function problems(file: string): string[] {
  return checkText(file, readFileSync(file, "utf8"), "notation", "ja", {
    layout: (step, said) => `段 ${step}: ${said}`,
  }).map(problemLine);
}

function line(edges: Edge[], from: string, to: string): Edge {
  const found = edges.find((e) => e.from === from && e.to === to);
  if (!found) throw new Error(`線 ${from} → ${to} が無い`);
  return found;
}

function box(boxes: Box[], id: string): Box {
  const found = boxes.find((b) => b.id === id);
  if (!found) throw new Error(`箱 ${id} が無い`);
  return found;
}

/** 線の縦の区間の x */
const verticals = (edge: Edge): number[] =>
  edge.points.slice(1).flatMap((q, k) => {
    const p = edge.points[k] as Point;
    return Math.abs(p[0] - q[0]) < 0.01 && Math.abs(p[1] - q[1]) > 0.01 ? [p[0]] : [];
  });

describe("道が全て塞がる線は図の外側を回る (#3607)", () => {
  it("outer-detour-warns-nothing", () => {
    expect(problems(OUTER_DETOUR), "評価で崩れた図に崩れが残る").toEqual([]);
  });

  it("outer-detour-runs-right-outside", () => {
    const { boxes, edges } = laid(OUTER_DETOUR);
    const right = Math.max(...boxes.map((b) => b.x + b.w));
    const slack = box(boxes, "slack");
    for (const from of ["devteam", "salesteam"]) {
      const edge = line(edges, from, "slack");
      expect(
        Math.max(...verticals(edge)),
        `${from} → slack が全ての箱の右端より右を縦に走らない`,
      ).toBeGreaterThan(right);
      const end = edge.points.at(-1) as Point;
      expect(end[0], `${from} → slack が Slack の右の辺へ入らない`).toBeGreaterThanOrEqual(
        slack.x + slack.w,
      );
      expect(
        Math.abs(end[1] - slack.cy),
        `${from} → slack が Slack の右の辺の真ん中へ入らない`,
      ).toBeLessThan(0.5);
    }
  });

  it("outer-left-runs-between-headers-and-boxes", () => {
    expect(problems(OUTER_LEFT), "左の外側を回る図に崩れが残る").toEqual([]);
    const { boxes, edges, regions } = laid(OUTER_LEFT);
    const left = Math.min(...boxes.map((b) => b.x));
    const headers = Math.max(...regions.map((r) => r.header.x + r.header.w));
    const edge = line(edges, "api", "log");
    const x = Math.min(...verticals(edge));
    expect(x, "API → 記録 が一番左の列の箱の左端より左を縦に走らない").toBeLessThan(left);
    expect(x, "API → 記録 が区画の名前の右端より右を縦に走らない").toBeGreaterThan(headers);
    const log = box(boxes, "log");
    const end = edge.points.at(-1) as Point;
    expect(end[0], "API → 記録 が記録の左の辺へ入らない").toBeLessThanOrEqual(log.x);
    expect(Math.abs(end[1] - log.cy), "API → 記録 が記録の左の辺の真ん中へ入らない").toBeLessThan(
      0.5,
    );
  });

  it("outer-stack-lines-apart", () => {
    expect(problems(OUTER_STACK), "外側に2本並ぶ図に崩れが残る").toEqual([]);
    const { boxes, edges } = laid(OUTER_STACK);
    const right = Math.max(...boxes.map((b) => b.x + b.w));
    const [db, sum] = ["db", "sum"].map((to) => Math.max(...verticals(line(edges, "app", to))));
    expect(db, "アプリ → データベース が右の外側を縦に走らない").toBeGreaterThan(right);
    expect(sum, "アプリ → 集計 が右の外側を縦に走らない").toBeGreaterThan(right);
    expect(
      Math.abs((db as number) - (sum as number)),
      "外側を縦に走る2本が離れない",
    ).toBeGreaterThanOrEqual(APART.line);
  });
});
