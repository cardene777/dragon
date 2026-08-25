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
import * as Parts from "@/topics/catalog/parts.cdl";
import * as Charts from "@/topics/catalog/charts.cdl";
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";

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
  // parts は画面では遅延読み込みだが、名前の衝突は読み込み方に関係なく起きる
  ["parts", Parts as unknown as Record<string, unknown>],
  ["charts", Charts as unknown as Record<string, unknown>],
];

/**
 * 図として組み立て済の export だけを拾う。
 *
 * 判定は production (`catalog-items.ts` の `moduleToItems`) と**同じ式**にする。
 * 厳しくすると production が一覧に出す図を test が見落とし、緩くすると図でない export を数える。
 */
function diagramKeys(mod: Record<string, unknown>): string[] {
  return Object.entries(mod)
    .filter(([, value]) => {
      if (!value || typeof value !== "object") return false;
      const d = value as { id?: unknown; nodes?: unknown };
      return Boolean(d.id) && Boolean(d.nodes);
    })
    .map(([k]) => k);
}

describe("一覧の名前 (#1030)", () => {
  const byCatalog = CATALOGS.map(([name, mod]) => [name, diagramKeys(mod)] as const);
  const total = byCatalog.reduce((a, [, ks]) => a + ks.length, 0);

  it("catalog ごとの図の数を固定する", () => {
    // 件数の下限だけだと、取りこぼしても通ってしまう。 catalog ごとの実数で固定する。
    // 図を足したらこの表も更新する = 数が変わったことに気付ける
    const expected: Record<string, number> = {
      interactive: 129, cookbook: 26, patterns: 12, primitives: 89,
      "primitives-extra": 21, animation: 10, styles: 10, presets: 19,
      ethereum: 4, "text-dsl": 13, parts: 80, charts: 9,
    };
    const actual = Object.fromEntries(byCatalog.map(([n, k]) => [n, k.length]));
    expect(actual, "図の数が変わっている (足したら期待値も更新する)").toEqual(expected);
    expect(total, "総数が合わない").toBe(Object.values(expected).reduce((a, b) => a + b, 0));
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

  it("名前の表と図の集合が双方向で一致する (#1035)", () => {
    // 図にあって表に無い = その言語で export 名が出る。
    // 表にあって図に無い = 死んだ entry で、両言語に同じ死んだ key を足すと
    // 集合の一致だけを見る検査は通ってしまう。 **図を基準に双方向で見る**
    const diagrams = new Set(byCatalog.flatMap(([, keys]) => keys));
    for (const [label, table] of [["日本語名", ITEM_NAME_JA], ["英語名", ITEM_NAME_EN]] as const) {
      const missing = [...diagrams].filter((k) => table[k] === undefined);
      expect(missing, `${label}が無い図: ${missing.slice(0, 8).join(", ")}`).toHaveLength(0);
      const dead = Object.keys(table).filter((k) => !diagrams.has(k));
      expect(dead, `${label}の表に図の無い entry: ${dead.slice(0, 8).join(", ")}`).toHaveLength(0);
    }
  });

  it("英語名が ASCII だけで書かれている", () => {
    // 日本語をそのまま貼る訳し忘れを見る。 **文字種を列挙する形にしない** =
    // 日本語だけを弾くと、他の文字体系 (ハングル / キリル文字 等) が素通りする。
    // 現行 443 件はすべて ASCII なので、ASCII 以外を弾く形が最も狭く正しい
    const bad = Object.entries(ITEM_NAME_EN)
      // eslint-disable-next-line no-control-regex
      .filter(([, v]) => /[^\x20-\x7e]/.test(v))
      .map(([k, v]) => `${k}: "${v}"`);
    expect(bad, `英語名に ASCII 以外が混ざっている: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  it("表示名が export 名と同じにならない", () => {
    // export 名がそのまま出る状態を、名前の形ではなく **export 名との一致** で見る。
    // 形で見る (camelCase かどうか) と、`websocket` のような小文字 1 語の export 名を
    // 見逃し、`iPhone` のような正しい英語名を誤って弾く
    const same: string[] = [];
    for (const [, keys] of byCatalog) {
      for (const k of keys) {
        if (ITEM_NAME_JA[k] === k) same.push(`ja/${k}`);
        if (ITEM_NAME_EN[k] === k) same.push(`en/${k}`);
      }
    }
    expect(same, `表示名が export 名と同じ: ${same.slice(0, 8).join(", ")}`).toHaveLength(0);
  });
});
