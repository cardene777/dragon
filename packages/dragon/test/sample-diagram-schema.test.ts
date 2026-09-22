/**
 * sample diagram schema 網羅 (iter37、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter37。
 * 全 sample の compile 結果 schema 検証、 上位 property の存在 / 型を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter37: 全 sample × diagram schema 網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`箱を 1 つ以上作れている (空振り防止)`, () => {
        // 下の検査は箱を回して 1 件ずつ見る。 箱が無いと 1 度も判定へ入らずに通る
        const d = textDslToDiagram(sample.code);
        expect(d.nodes.length, "箱が 1 つも無い").toBeGreaterThan(0);
      });

      it(`nodes / edges array field 存在 + Array 型`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Array.isArray(d.nodes), "nodes array").toBe(true);
        expect(Array.isArray(d.edges), "edges array").toBe(true);
      });

      it(`states / phases array field 存在 (empty 許容)`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Array.isArray(d.states), "states array").toBe(true);
        expect(Array.isArray(d.phases), "phases array").toBe(true);
      });

      it(`id field 存在 or undefined (未定義許容)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as { id?: unknown };
        if (d.id !== undefined) {
          expect(typeof d.id).toBe("string");
        }
      });

      it(`title field が string or undefined`, () => {
        const d = textDslToDiagram(sample.code) as unknown as { title?: unknown };
        if (d.title !== undefined) {
          expect(typeof d.title).toBe("string");
        }
      });

      it(`type field が string or undefined (許容)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as { type?: unknown };
        if (d.type !== undefined) {
          expect(typeof d.type).toBe("string");
        }
      });

      it(`nodes 要素は object with .id`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          expect(typeof n).toBe("object");
          expect(typeof n.id).toBe("string");
        }
      });

      it(`edges 要素は object with .from + .to`, () => {
        const d = textDslToDiagram(sample.code);
        for (const e of d.edges) {
          expect(typeof e).toBe("object");
          expect(typeof e.from).toBe("string");
          expect(typeof e.to).toBe("string");
        }
      });
    });
  }
});
