// @vitest-environment jsdom

import { layout } from "@cardenelabs/cdl";
import { THEMES, textDslToDiagram } from "@cardenelabs/dragon";
import { describe, expect, it, vi } from "vitest";

import { EDITOR_SAMPLES } from "../data/editor-samples";
import { 骨組みの差, 骨組みを測る } from "./skeleton-test-helpers";

const 色味を外す = (source: string): string =>
  source.replace(/^(?:theme|palette):[^\n]*(?:\n|$)/gmu, "");

const 色味を入れる = (source: string, theme: (typeof THEMES)[number]): string =>
  色味を外す(source).replace(/^(type:[^\n]*)$/mu, `$1\ntheme: ${theme}`);

describe("編集画面の見本は色味を替えても骨組みを保つ (#2918 / #2926)", () => {
  it("全見本の箱・線・札・円の区画が色味なしと全色味で同じ", () => {
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const differences: string[] = [];
      const widestでない図: string[] = [];
      for (const sample of EDITOR_SAMPLES) {
        const 色味なし = textDslToDiagram(色味を外す(sample.code));
        if (色味なし.textMetrics !== "widest") widestでない図.push(`${sample.label} / 色味なし`);
        const 基準 = 骨組みを測る(色味なし, layout(色味なし));
        for (const theme of THEMES) {
          const diagram = textDslToDiagram(色味を入れる(sample.code, theme));
          if (diagram.textMetrics !== "widest") widestでない図.push(`${sample.label} / ${theme}`);
          differences.push(
            ...骨組みの差(sample.label, theme, 基準, 骨組みを測る(diagram, layout(diagram))),
          );
        }
      }

      const failedPairs = new Set(
        differences.map((difference) => difference.split(" / ").slice(0, 2).join(" / ")),
      );
      const failedSamples = new Set([...failedPairs].map((pair) => pair.split(" / ")[0]!));
      const summary = `失敗見本 ${failedSamples.size}、見本×色味 ${failedPairs.size}、差分 ${differences.length}`;
      expect(differences, `${summary}\n${differences.join("\n")}`).toEqual([]);
      expect(widestでない図, `widest でない図:\n${widestでない図.join("\n")}`).toEqual([]);
    } finally {
      warnings.mockRestore();
    }
  }, 120_000);
});
