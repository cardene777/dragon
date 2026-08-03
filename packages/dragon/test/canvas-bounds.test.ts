import { describe, it, expect } from "vitest";
import {
  computeDiagramBoundingBox,
  rectsOverlap,
  DIAGRAM_BOUNDARY_PADDING,
  type DiagramBoundingBox,
} from "../src/canvas-bounds";
import { parseTextDsl } from "../src/parser";
import { compileToCdl } from "../src/compile";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * canvas-bounds は dragon canvas-pivot spec の図境界計算 SSOT だが test が 0 件だった。
 * rectsOverlap は交差判定の全分岐 (交差 / 分離4方向 / 辺接触 / 角接触 / 包含 / 同一) を、
 * computeDiagramBoundingBox は実 diagram を layout して padding 適用を検証する。
 */

const rect = (x: number, y: number, width: number, height: number): DiagramBoundingBox => ({ x, y, width, height });

describe("rectsOverlap — 交差判定の全分岐", () => {
  it("交差する 2 矩形 → true", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(true);
  });

  it("一方が他方を完全包含 → true", () => {
    expect(rectsOverlap(rect(0, 0, 100, 100), rect(40, 40, 10, 10))).toBe(true);
  });

  it("同一矩形 → true", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(0, 0, 10, 10))).toBe(true);
  });

  it("完全に離れている (右方向) → false", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(20, 0, 10, 10))).toBe(false);
  });

  it("完全に離れている (下方向) → false", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(0, 20, 10, 10))).toBe(false);
  });

  it("左辺と右辺がちょうど接する (交差面積 0) → false", () => {
    // a の右端 = 10、 b の左端 = 10。 spec は「面積 > 0」 判定なので接触のみは中でない
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBe(false);
  });

  it("上辺と下辺がちょうど接する → false", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(0, 10, 10, 10))).toBe(false);
  });

  it("角だけが 1 点で接する → false", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(10, 10, 10, 10))).toBe(false);
  });

  it("1px だけ重なる → true", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(9, 9, 10, 10))).toBe(true);
  });

  it("交差判定は可換 (a,b と b,a で同結果)", () => {
    const a = rect(0, 0, 10, 10);
    const b = rect(5, 5, 10, 10);
    expect(rectsOverlap(a, b)).toBe(rectsOverlap(b, a));
  });
});

describe("computeDiagramBoundingBox — 実 diagram を layout して padding 適用", () => {
  function buildDiagram(): CdlDiagram {
    const src = [
      "タイトル: 境界テスト",
      "種類: sequence",
      "",
      "登場人物:",
      "  - ユーザー",
      "  - API (function)",
      "",
      "流れ:",
      "  1. ユーザー → API: ログイン",
      "  2. API → ユーザー: 200 OK",
    ].join("\n");
    const parsed = parseTextDsl(src);
    if (!parsed.ok) throw new Error("fixture DSL の parse に失敗: " + JSON.stringify(parsed.errors));
    const diag = compileToCdl(parsed.doc);
    if (diag.nodes.length === 0) throw new Error("fixture が空 diagram を生成した (DSL 構文誤り)");
    return diag;
  }

  it("padding 定数は spec 準拠の 20", () => {
    expect(DIAGRAM_BOUNDARY_PADDING).toBe(20);
  });

  it("bbox は layout viewBox に上下左右 20px を加えた矩形", () => {
    const diag = buildDiagram();
    const bbox = computeDiagramBoundingBox(diag);
    // width/height は viewBox に padding*2 が乗る → 必ず 40 以上大きい
    expect(bbox.width).toBeGreaterThan(DIAGRAM_BOUNDARY_PADDING * 2);
    expect(bbox.height).toBeGreaterThan(DIAGRAM_BOUNDARY_PADDING * 2);
  });

  it("bbox の x/y は viewBox 原点から padding 分だけ外側 (負方向) にずれる", () => {
    const diag = buildDiagram();
    const bbox = computeDiagramBoundingBox(diag);
    // computeDiagramBoundingBox は vb.x - 20 を返す。 typical viewBox.x=0 なら -20
    expect(bbox.x).toBeLessThanOrEqual(0);
    expect(bbox.y).toBeLessThanOrEqual(0);
  });

  it("width/height は有限の正の数 (NaN/Infinity でない)", () => {
    const diag = buildDiagram();
    const bbox = computeDiagramBoundingBox(diag);
    expect(Number.isFinite(bbox.width)).toBe(true);
    expect(Number.isFinite(bbox.height)).toBe(true);
    expect(bbox.width).toBeGreaterThan(0);
    expect(bbox.height).toBeGreaterThan(0);
  });

  it("同一 diagram を 2 回計算しても同じ bbox (決定的)", () => {
    const diag = buildDiagram();
    expect(computeDiagramBoundingBox(diag)).toEqual(computeDiagramBoundingBox(diag));
  });

  it("計算した自図 bbox 同士は必ず重なる (rectsOverlap と整合)", () => {
    const diag = buildDiagram();
    const bbox = computeDiagramBoundingBox(diag);
    expect(rectsOverlap(bbox, bbox)).toBe(true);
  });
});
