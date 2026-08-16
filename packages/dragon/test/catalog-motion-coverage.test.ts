/**
 * 動きが意味を持つ分類に静止した図を残さない (#1161 / #1164)。
 *
 * catalog 422 件のうち 194 件が完全に静止していた (値も注目先も変わらない)。 このうち
 * 見本帳 150 件 (`primitives` / `primitives-extra` / `presets` / `charts` / `styles`) は
 * 形を見比べるためのもので静止していてよい。 残る 44 件は動きが意味を持つ分類なので、
 * 静止を残さないことを固定する。
 *
 * 「動く」 の判定は 3 通りのいずれか。 値が動く (`tweens` / `sets`)、 注目先が段ごとに
 * 変わる、 badge が段ごとに変わる。 3 つとも無い図は開いても静止画と区別が付かない。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as Interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as Cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as Patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as TextDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as Animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";

/** 動きが意味を持つ分類。 見本帳 (primitives 等) は対象外 */
const 対象: Array<[string, Record<string, unknown>]> = [
  ["parts", Parts],
  ["interactive", Interactive],
  ["cookbook", Cookbook],
  ["patterns", Patterns],
  ["text-dsl", TextDsl],
  ["animation", Animation],
];

const diagramsOf = (mod: Record<string, unknown>): Array<[string, CdlDiagram]> =>
  Object.entries(mod)
    .filter(([, v]) => {
      if (!v || typeof v !== "object") return false;
      const d = v as Partial<CdlDiagram>;
      return typeof d.id === "string" && Array.isArray(d.nodes) && Array.isArray(d.phases);
    })
    .map(([k, v]) => [k, v as CdlDiagram]);

const key = (a: readonly string[] = []) => [...new Set(a)].sort().join(",");

/** 開いて何かが変わるか */
const moves = (d: CdlDiagram): boolean => {
  const 値 = d.phases.some((p) => (p.tweens?.length ?? 0) > 0 || (p.sets?.length ?? 0) > 0);
  const 注目 = new Set(d.phases.map((p) => key(p.activate))).size > 1;
  const badge = new Set(d.phases.map((p) => p.badge ?? "")).size > 1;
  return 値 || 注目 || badge;
};

describe("動きが意味を持つ分類に静止した図を残さない (#1161)", () => {
  it("対象がそろっている", () => {
    // import を書き間違えると以下が素通りする
    const 件数 = Object.fromEntries(対象.map(([n, m]) => [n, diagramsOf(m).length]));
    expect(件数).toEqual({
      parts: 80,
      interactive: 129,
      cookbook: 25,
      patterns: 12,
      "text-dsl": 12,
      animation: 10,
    });
  });

  for (const [name, mod] of 対象) {
    it(`${name} に静止した図が無い`, () => {
      const 静止 = diagramsOf(mod).filter(([, d]) => !moves(d)).map(([k]) => k);
      expect(静止, `静止している図: ${静止.join(", ")}`).toEqual([]);
    });
  }

  it("見本帳は対象に含めない (形を見比べる用途を守る)", () => {
    // 対象を増やす変更が入った時に気付けるよう、 含めない分類を名指しで固定する
    const 含めない = ["primitives", "primitives-extra", "presets", "charts", "styles"];
    const 対象名 = 対象.map(([n]) => n);
    expect(対象名.filter((n) => 含めない.includes(n))).toEqual([]);
  });
});
