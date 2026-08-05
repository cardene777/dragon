/**
 * preset の表示名が、catalog と同じ名前の表から引けることの検証 (#1047)。
 *
 * preset 詳細ページは `PRESETS` という別の入れ物を持ち、見出しに `stateMachine2` /
 * `mindMapRadial` のような **識別子風の文字列** をそのまま出していた。 言語を切り替えても
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

  it("表示名が識別子のままにならない", () => {
    // 名前を引けないと `itemName` は鍵 (export 名) をそのまま返す。 その状態を見逃すと
    // 「見出しが識別子風」 の直す前に戻る
    const identifierLike: string[] = [];
    for (const preset of PRESETS) {
      for (const locale of ["ja", "en"] as const) {
        const name = presetName(preset, locale);
        if (name === presetCatalogKey(preset)) identifierLike.push(`${preset.id} (${locale})`);
        // 識別子は先頭が小文字で空白を持たない。 表示名がその形なら引けていない
        if (/^[a-z][A-Za-z0-9]*$/.test(name)) identifierLike.push(`${preset.id} (${locale}): ${name}`);
      }
    }
    expect(identifierLike, `表示名が識別子のまま: ${identifierLike.join(", ")}`).toHaveLength(0);
  });

  it("言語ごとに違う名前を返す", () => {
    // 片方の表しか引いていないと、切り替えても変わらない
    const same = PRESETS.filter((p) => presetName(p, "ja") === presetName(p, "en")).map((p) => p.id);
    expect(same, `言語を切り替えても変わらない: ${same.join(", ")}`).toHaveLength(0);
  });

  it("識別子は表示に使わない", () => {
    // `title` は URL と図の対応を追う識別子で、画面には出さない (#1047)
    const src = readFileSync(new URL("../pages/PresetDetailPage.tsx", import.meta.url), "utf8");
    const uses = [...src.matchAll(/\{(?:preset|prevPreset|nextPreset)\.title\}/g)].map((m) => m[0]);
    expect(uses, `識別子を画面に出している: ${uses.join(", ")}`).toHaveLength(0);
  });
});
