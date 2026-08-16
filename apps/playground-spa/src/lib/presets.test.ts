/**
 * preset の表示名が、catalog と同じ名前の表から引けることの検証 (#1047)。
 *
 * preset 詳細ページは `PRESETS` という別の入れ物を持ち、見出しに `stateMachine2` /
 * `stateMachine2` のような **識別子風の文字列** をそのまま出していた。 言語を切り替えても
 * 変わらなかった。
 *
 * 表示名は catalog の名前の表を引いて出す。 引く鍵は `id` から導くため、
 * **導けなくなった時に静かに外れる**。 それをここで止める。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PRESETS, presetCatalogKey, presetName } from "./presets";
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";

describe("preset の表示名 (#1047)", () => {
  it("全ての preset が両言語の名前を持つ", () => {
    expect(PRESETS.length, "preset が 1 件も無い").toBeGreaterThan(15);
    const missing: string[] = [];
    for (const preset of PRESETS) {
      const key = presetCatalogKey(preset);
      if (!ITEM_NAME_JA[key]) missing.push(`${preset.id} → ${key} の日本語名が無い`);
      if (!ITEM_NAME_EN[key]) missing.push(`${preset.id} → ${key} の英語名が無い`);
    }
    expect(missing, `名前を引けない preset:\n${missing.join("\n")}`).toHaveLength(0);
  });

  it("表示名がこの図の識別子と一致しない", () => {
    // **形ではなく値で見る**。 形だけで見ると、識別子の書き方が変わった時
    // (kebab / snake / 数字始まり) にすり抜ける
    const identifierLike: string[] = [];
    for (const preset of PRESETS) {
      const identifiers = [preset.id, preset.slug, presetCatalogKey(preset)];
      for (const locale of ["ja", "en"] as const) {
        const name = presetName(preset, locale);
        if (identifiers.includes(name)) identifierLike.push(`${preset.id} (${locale}): ${name}`);
      }
    }
    expect(identifierLike, `表示名が識別子と同じ: ${identifierLike.join(", ")}`).toHaveLength(0);
  });

  it("表示名が識別子の形をしていない", () => {
    // 値の一致だけでは、別の識別子 (他の図の `id` 等) が出る形を捕まえられない。
    // 識別子の書き方を 3 種まとめて見る
    const IDENTIFIER_SHAPES = [
      /^[a-z][A-Za-z0-9]*$/, // camelCase / 小文字 1 語
      /^[a-z0-9]+([-_][a-z0-9]+)+$/, // kebab-case / snake_case
      /^[0-9]/, // 数字始まり
    ];
    const shaped: string[] = [];
    for (const preset of PRESETS) {
      for (const locale of ["ja", "en"] as const) {
        const name = presetName(preset, locale);
        if (IDENTIFIER_SHAPES.some((re) => re.test(name))) shaped.push(`${preset.id} (${locale}): ${name}`);
      }
    }
    expect(shaped, `表示名が識別子の形: ${shaped.join(", ")}`).toHaveLength(0);
  });

  it("言語ごとに違う名前を返す", () => {
    // 片方の表しか引いていないと、切り替えても変わらない
    const same = PRESETS.filter((p) => presetName(p, "ja") === presetName(p, "en")).map((p) => p.id);
    expect(same, `言語を切り替えても変わらない: ${same.join(", ")}`).toHaveLength(0);
  });

  it("識別子を画面に出す経路が残っていない", () => {
    // 直す前は `title` を見出しに出していた。 field ごと外したので型が止めるが、
    // `id` / `slug` を代わりに出す形は型では止まらない
    const src = readFileSync(new URL("../pages/PresetDetailPage.tsx", import.meta.url), "utf8");
    // 括弧の中で識別子を出している箇所 (`{preset.id}` 等)。 パンくずの末尾は URL と
    // 対応する位置なので `slug` を出してよい (意図して残している)
    const uses = [...src.matchAll(/\{(?:preset|prevPreset|nextPreset)\.(id|title)\}/g)].map((m) => m[0]);
    expect(uses, `識別子を画面に出している: ${uses.join(", ")}`).toHaveLength(0);
  });
});
