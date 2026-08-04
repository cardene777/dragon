/**
 * 一覧に出る名前の健全性 (#1030)。
 *
 * 一覧の名前は export 名で引く 1 つの表 (`ITEM_NAME_JA`) に集約されており、**カテゴリを見ない**。
 * そのため別カテゴリが同じ export 名を持つと、片方向けに直した名前がもう片方にも出る。
 * 実測で `oauthFlow` が interactive と cookbook で衝突していた (図 331 件中 1 件)。
 *
 * 名前と題名を一致させることは**検査しない**。 一覧の名前は「探す時の見出し」、図の題名は
 * 「開いた時の説明」 で役割が違う。 他カテゴリは名前 5-8 文字 / 題名 28-39 文字と役割を
 * 分けており (実測 = patterns 5.5/27.8、primitives 7.6/38.5)、一致させると一覧が読みにくくなる。
 */
import { describe, it, expect } from "vitest";
import * as Interactive from "@/topics/catalog/interactive.cdl";
import * as Cookbook from "@/topics/catalog/cookbook.cdl";
import * as Patterns from "@/topics/catalog/patterns.cdl";
import * as Primitives from "@/topics/catalog/primitives.cdl";
import * as PrimitivesExtra from "@/topics/catalog/primitives-extra.cdl";
import * as Animation from "@/topics/catalog/animation.cdl";
import * as Styles from "@/topics/catalog/styles.cdl";
import * as Presets from "@/topics/catalog/presets.cdl";
import * as Ethereum from "@/topics/catalog/ethereum.cdl";
import * as TextDsl from "@/topics/catalog/text-dsl.cdl";
import { ITEM_NAME_JA } from "./i18n";

const CATALOGS: Array<readonly [string, Record<string, unknown>]> = [
  ["interactive", Interactive as unknown as Record<string, unknown>],
  ["cookbook", Cookbook as unknown as Record<string, unknown>],
  ["patterns", Patterns as unknown as Record<string, unknown>],
  ["primitives", Primitives as unknown as Record<string, unknown>],
  ["primitives-extra", PrimitivesExtra as unknown as Record<string, unknown>],
  ["animation", Animation as unknown as Record<string, unknown>],
  ["styles", Styles as unknown as Record<string, unknown>],
  ["presets", Presets as unknown as Record<string, unknown>],
  ["ethereum", Ethereum as unknown as Record<string, unknown>],
  ["text-dsl", TextDsl as unknown as Record<string, unknown>],
];

/** 図として組み立て済の export だけを拾う (説明文の export と helper を除く)。 */
function diagramKeys(mod: Record<string, unknown>): string[] {
  return Object.entries(mod)
    .filter(([k]) => !k.startsWith("subtitle__"))
    .filter(([, v]) => {
      const d = v as { id?: unknown; nodes?: unknown };
      return typeof d?.id === "string" && Array.isArray(d?.nodes);
    })
    .map(([k]) => k);
}

describe("一覧の名前 (#1030)", () => {
  const byCatalog = CATALOGS.map(([name, mod]) => [name, diagramKeys(mod)] as const);
  const total = byCatalog.reduce((a, [, ks]) => a + ks.length, 0);

  it("対象が空振りしていない", () => {
    // 抽出条件を誤って 0 件になると、以下の検証が全て素通りする
    expect(total, `図が取れていない (${byCatalog.map(([n, k]) => `${n}:${k.length}`).join(" ")})`).toBeGreaterThan(300);
    for (const [name, keys] of byCatalog) {
      expect(keys.length, `${name} の図が 0 件`).toBeGreaterThan(0);
    }
  });

  it("catalog をまたいで export 名が衝突しない", () => {
    // 一覧の名前は export 名だけで引くため、衝突すると片方向けの名前がもう片方にも出る
    const seen = new Map<string, string[]>();
    for (const [name, keys] of byCatalog) {
      for (const k of keys) seen.set(k, [...(seen.get(k) ?? []), name]);
    }
    const dup = [...seen.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => `${k}: ${v.join(" + ")}`);
    expect(dup, `名前が衝突している\n  ${dup.join("\n  ")}`).toHaveLength(0);
  });

  it("interactive の図は全件 一覧に名前を持つ", () => {
    // 名前が無いと一覧に export 名がそのまま出る
    const keys = byCatalog.find(([n]) => n === "interactive")![1];
    const missing = keys.filter((k) => ITEM_NAME_JA[k] === undefined);
    expect(missing, `一覧に名前が無い: ${missing.join(", ")}`).toHaveLength(0);
  });
});
