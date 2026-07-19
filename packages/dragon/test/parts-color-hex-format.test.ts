/**
 * parts / preset color hex format 網羅 (iter43、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter43。
 * 全 parts / preset の node style / state.initial に含まれる color hex code の
 * format 妥当性を verify、 typo (#FF / #FFFF / RGB) を検知する gate。
 */
import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllDiagrams(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
  const out: Array<{ name: string; diagram: CdlDiagram }> = [];
  for (const [name, val] of Object.entries(mod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id === "string" && Array.isArray(d.nodes)) {
      out.push({ name, diagram: d as CdlDiagram });
    }
  }
  return out;
}

const ALL_PARTS = collectAllDiagrams(PartsMod);
const ALL_PRESETS = collectAllDiagrams(PresetsMod);

// hex format 検証 = #RGB / #RRGGBB / #RRGGBBAA
function isValidHexColor(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

// diagram 全体から hex-like string を抽出
function extractHexColors(obj: unknown, path = "", out: Array<{ path: string; value: string }> = []): typeof out {
  if (typeof obj === "string") {
    // # で始まる 3-9 char は hex candidate
    if (/^#[0-9a-fA-F]{2,10}$/.test(obj)) {
      out.push({ path, value: obj });
    }
    return out;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      extractHexColors(obj[i], `${path}[${i}]`, out);
    }
    return out;
  }
  if (obj !== null && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      extractHexColors(v, path ? `${path}.${k}` : k, out);
    }
  }
  return out;
}

describe("iter43: parts / preset color hex format 網羅", () => {
  it(`parts + preset diagram 検出`, () => {
    expect(ALL_PARTS.length + ALL_PRESETS.length).toBeGreaterThan(0);
  });

  describe("parts", () => {
    for (const { name, diagram } of ALL_PARTS) {
      it(`${name}: 全 hex color が #RGB / #RRGGBB / #RRGGBBAA format`, () => {
        const colors = extractHexColors(diagram);
        const invalid = colors.filter((c) => !isValidHexColor(c.value));
        expect(
          invalid.map((c) => `${c.path}=${c.value}`),
          `invalid hex in ${name}`,
        ).toEqual([]);
      });
    }
  });

  describe("presets", () => {
    for (const { name, diagram } of ALL_PRESETS) {
      it(`${name}: 全 hex color が valid format`, () => {
        const colors = extractHexColors(diagram);
        const invalid = colors.filter((c) => !isValidHexColor(c.value));
        expect(
          invalid.map((c) => `${c.path}=${c.value}`),
          `invalid hex in ${name}`,
        ).toEqual([]);
      });
    }
  });
});
