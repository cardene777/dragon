import { describe, it, expect } from "vitest";
import { validateDragonJson, jsonToDiagram, jsonToDoc, type DragonJson } from "../src/json-parser";

/**
 * CAR-1693 (dragon canvas pivot Phase 1) の behavior test。
 *
 * DSL 表面 `pos: {x, y}` (auto layout の offset dx, dy) の parse と mapping を検証する。
 * `layout: auto | manual` は #1295 で受けるのをやめた (記法に無く、読む場所も無かった)。
 * 内部 AST の既存 `pos: Position`
 * (source location) と naming collision しないこと、 未指定 element は auto fallback で render 挙動が
 * 現状維持 (catalog 100+ backward compat) であることを固定する。
 *
 * scope = JSON parse path (json-parser.ts) を対象。 CDL text parser (parser.ts) と yaml-adapter
 * (PR #421 で追加予定) の pos: accept は本 Phase 1 の scope 外、 別 issue で追加する (Issue 側 T003 /
 * T005 note)。
 */

const validDoc: DragonJson = {
  title: "test",
  type: "sequence",
  actors: [{ name: "A" }, { name: "B" }],
  flow: [{ from: "A", to: "B", label: "call" }],
};

describe("#CAR-1693 Phase 1: DSL 表面 pos field", () => {
  describe("validation", () => {
    it("actor.pos は {x, y} 形式で accept される", () => {
      const r = validateDragonJson({
        ...validDoc,
        actors: [{ name: "A", pos: { x: 40, y: -20 } }, { name: "B" }],
      });
      expect(r.ok).toBe(true);
    });

    it("actor.pos が NaN なら reject", () => {
      const r = validateDragonJson({
        ...validDoc,
        actors: [{ name: "A", pos: { x: Number.NaN, y: 10 } }, { name: "B" }],
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errors.some((e) => e.path === "$.actors[0].pos.x")).toBe(true);
      }
    });

    it("actor.pos が Infinity なら reject", () => {
      const r = validateDragonJson({
        ...validDoc,
        actors: [{ name: "A", pos: { x: 10, y: Number.POSITIVE_INFINITY } }, { name: "B" }],
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errors.some((e) => e.path === "$.actors[0].pos.y")).toBe(true);
      }
    });

    it("actor.pos が非 object なら reject", () => {
      const r = validateDragonJson({
        ...validDoc,
        actors: [
          { name: "A", pos: "invalid" as unknown as { x: number; y: number } },
          { name: "B" },
        ],
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errors.some((e) => e.path === "$.actors[0].pos")).toBe(true);
      }
    });

    it("step.pos は {x, y} 形式で accept される", () => {
      const r = validateDragonJson({
        ...validDoc,
        flow: [{ from: "A", to: "B", label: "call", pos: { x: 15, y: 25 } }],
      });
      expect(r.ok).toBe(true);
    });

    it("step.pos が非 finite なら reject", () => {
      const r = validateDragonJson({
        ...validDoc,
        flow: [{ from: "A", to: "B", label: "call", pos: { x: 10, y: Number.NaN } }],
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errors.some((e) => e.path === "$.flow[0].pos.y")).toBe(true);
      }
    });

    it("lanes.<id>.pos は {x, y} 形式で accept される", () => {
      const r = validateDragonJson({
        ...validDoc,
        lanes: { l1: { width: 200, pos: { x: 100, y: 0 } } },
      });
      expect(r.ok).toBe(true);
    });

    it("lanes.<id>.pos が非 finite なら reject", () => {
      const r = validateDragonJson({
        ...validDoc,
        lanes: { l1: { width: 200, pos: { x: Number.NaN, y: 0 } } },
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errors.some((e) => e.path === "$.lanes.l1.pos.x")).toBe(true);
      }
    });

    // `layout` は受けない (#1295)。 記法 (`TOP_LEVEL_KEYS`) に無く、`doc.layout` を読む場所も
    // 実装に 1 つも無いため、受けると「検査を通るのに何も起きない」 項目が残る。
    // Phase 4 (drag で位置を保存する mode) が入る時に両入口へ同時に足す
    it("layout は値に関わらず知らない項目として誤りになる", () => {
      for (const 値 of ["auto", "manual", "invalid"]) {
        const r = validateDragonJson({ ...validDoc, layout: 値 });
        expect(r.ok, `layout: "${値}" が通ってしまう`).toBe(false);
        if (r.ok) continue;
        expect(r.errors.map((e) => e.path)).toContain("$.layout");
      }
    });

    it("layout / pos とも未指定なら backward compat で accept (catalog 100+ 互換)", () => {
      const r = validateDragonJson(validDoc);
      expect(r.ok).toBe(true);
    });
  });

  describe("AST mapping (DSL 表面 pos → 内部 AST layoutPos、 jsonToDoc 実 execute)", () => {
    // `jsonToDoc` を実際に呼んで、対応付けの処理そのものを走らせる。
    // 内部の形を手で組み立てる近道を使うと対応付けを通らないため、`json-parser` 側から
    // その処理を消しても検査が落ちなかった。 実際に呼ぶことで、置いた座標が内部の座標へ
    // 渡ることを見る (後段のずらし処理がこの受け渡しに依存している)。

    it("actor.pos が jsonToDoc で AST layoutPos に mapping され、 既存 pos: Position (source loc) と並存する", () => {
      const input: DragonJson = {
        ...validDoc,
        actors: [{ name: "A", pos: { x: 40, y: -20 } }, { name: "B" }],
      };
      const r = validateDragonJson(input);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const doc = jsonToDoc(r.data);
      // DSL 表面 pos → AST layoutPos に rename されている (2 層設計)
      expect(doc.actors[0]?.layoutPos).toEqual({ x: 40, y: -20 });
      // pos 未指定 actor B の layoutPos は undefined (auto fallback 保証)
      expect(doc.actors[1]?.layoutPos).toBeUndefined();
      // 既存 pos: Position (source location) は separate field で並存 (naming collision 回避)
      expect(doc.actors[0]?.pos).toEqual({ line: 0 });
      expect(doc.actors[1]?.pos).toEqual({ line: 0 });
    });

    it("step.pos が jsonToDoc で AST layoutPos に mapping される", () => {
      const input: DragonJson = {
        ...validDoc,
        flow: [{ from: "A", to: "B", label: "call", pos: { x: 15, y: 25 } }],
      };
      const r = validateDragonJson(input);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const doc = jsonToDoc(r.data);
      expect(doc.flow[0]?.layoutPos).toEqual({ x: 15, y: 25 });
      // source location と並存
      expect(doc.flow[0]?.pos).toEqual({ line: 0 });
    });

    it("lanes.<id>.pos が jsonToDoc で AST layoutPos に mapping され、 既存 x/width と分離される", () => {
      const input: DragonJson = {
        ...validDoc,
        lanes: { l1: { width: 200, x: 50, pos: { x: 100, y: 0 } } },
      };
      const r = validateDragonJson(input);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const doc = jsonToDoc(r.data);
      // DSL 表面 pos → AST layoutPos に rename、 既存 x/width は残る (destructure 漏れ防止)
      expect(doc.lanes?.l1?.layoutPos).toEqual({ x: 100, y: 0 });
      expect(doc.lanes?.l1?.x).toBe(50);
      expect(doc.lanes?.l1?.width).toBe(200);
      // source location と並存
      expect(doc.lanes?.l1?.pos).toEqual({ line: 0 });
    });

    it("layout / pos とも未指定なら AST の layoutPos / layout は undefined (backward compat)", () => {
      const r = validateDragonJson(validDoc);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const doc = jsonToDoc(r.data);
      expect(doc.actors[0]?.layoutPos).toBeUndefined();
      expect(doc.flow[0]?.layoutPos).toBeUndefined();
      expect(doc.layout).toBeUndefined();
    });
  });

  describe("compile (Phase 1 = pass-through、 render は現状維持)", () => {
    it("pos 指定なしで既存 render と byte-identical (catalog 100+ backward compat)", () => {
      const d = jsonToDiagram(validDoc);
      expect(d.nodes.length).toBeGreaterThan(0);
      // Phase 1 では pos 指定なし = 既存 auto layout が動く。 実 render の byte-identical 確認は
      // catalog 全 sweep (visual-validate-sweep.test.ts) 側で保証済。
    });

    it("pos 指定ありでも Phase 1 では render 崩れない (Phase 2 の applyPosOffset 実装前)", () => {
      // Phase 1 は types + parser の 2 層基盤のみ。 layoutPos → CdlDiagram 反映は Phase 2 で追加。
      // Phase 1 の時点では layoutPos が AST に載っても compile.ts は無視するため既存 render と同じ。
      const d = jsonToDiagram({
        ...validDoc,
        actors: [{ name: "A", pos: { x: 40, y: -20 } }, { name: "B" }],
      });
      expect(d.nodes.length).toBeGreaterThan(0);
      // Phase 2 実装後は node の posX/Y に (auto + offset) が反映される予定、 本 test はそれまで
      // 「pos 指定でも既存 render を壊さない」 の regression guard として機能する。
    });
  });
});
