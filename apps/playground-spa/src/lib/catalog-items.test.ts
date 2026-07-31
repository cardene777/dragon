import { describe, it, expect } from "vitest";
import { CATALOG_ITEMS, loadPartsItems } from "./catalog-items";
import * as InteractiveMod from "@/topics/catalog/interactive.cdl";
import * as PartsMod from "@/topics/catalog/parts.cdl";
import * as PresetsMod from "@/topics/catalog/presets.cdl";

/**
 * catalog の suffix pair 規約 (`subtitle__<key>` / `sourceYaml__<key>` / `sourceJson__<key>`) を固定する。
 *
 * これらは export 名の綴りだけで diagram と結び付いている。 diagram の export 名を変えたり
 * `subtitle__` を打ち間違えたりすると、 **説明文が孤立して静かに `topic` へ落ちる**。
 * 説明文の block は定義元から数千行離れているため、 目視では気付けない。
 *
 * そこで「対応する diagram の無い `subtitle__` が 1 つも無いこと」 を機械で押さえる。
 */

type Mod = Record<string, unknown>;

/** module から diagram export の key 集合を取る (CatalogItem.title と同じ key)。 */
const diagramKeys = (mod: Mod): Set<string> => {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(mod)) {
    if (!value || typeof value !== "object") continue;
    const d = value as { id?: unknown; nodes?: unknown };
    if (typeof d.id === "string" && Array.isArray(d.nodes)) keys.add(key);
  }
  return keys;
};

/** module から `<prefix>__<key>` 形式の string export を取る。 */
const pairedKeys = (mod: Mod, prefix: string): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(mod)) {
    if (typeof value !== "string") continue;
    if (key.startsWith(`${prefix}__`)) out.set(key.slice(prefix.length + 2), value);
  }
  return out;
};

describe("catalog の suffix pair 規約", () => {
  const mods: Array<[string, Mod]> = [
    ["interactive", InteractiveMod as Mod],
    ["parts", PartsMod as Mod],
    ["presets", PresetsMod as Mod],
  ];

  describe.each(mods)("%s module", (_name, mod) => {
    it.each(["subtitle", "sourceYaml", "sourceJson"])(
      "%s__<key> が全て実在する diagram export に対応する (孤立ゼロ)",
      (prefix) => {
        const keys = diagramKeys(mod);
        const orphans = [...pairedKeys(mod, prefix).keys()].filter((k) => !keys.has(k));
        expect(orphans, `対応する diagram の無い ${prefix}__: ${orphans.join(", ")}`).toEqual([]);
      },
    );
  });

  it("string export が CatalogItem 化されない", () => {
    // `subtitle__` 等は string なので item にならない。 なると一覧に空 card が出る。
    for (const items of Object.values(CATALOG_ITEMS)) {
      for (const item of items) {
        expect(item.diagram, `${item.id} の diagram が object でない`).toBeTypeOf("object");
      }
    }
  });
});

describe("CatalogItem.subtitle の決まり方", () => {
  it("subtitle__ がある item はその値を使う", () => {
    const subs = pairedKeys(InteractiveMod as Mod, "subtitle");
    expect(subs.size, "interactive に subtitle__ が 1 つも無い").toBeGreaterThan(0);

    const items = CATALOG_ITEMS.interactive ?? [];
    let checked = 0;
    for (const item of items) {
      const declared = subs.get(item.title);
      if (declared === undefined) continue;
      expect(item.subtitle, `${item.id} の subtitle が subtitle__ と一致しない`).toBe(declared);
      checked++;
    }
    expect(checked, "subtitle__ と照合できた item が 0 件").toBe(subs.size);
  });

  it("subtitle__ が無い item は topic に落ちる", () => {
    const subs = pairedKeys(PresetsMod as Mod, "subtitle");
    expect(subs.size, "presets は subtitle__ を持たない前提").toBe(0);

    const items = CATALOG_ITEMS.presets ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.subtitle).toBe((item.diagram as { topic?: string }).topic ?? "");
    }
  });

  it("subtitle が空の item が無い (説明文の取りこぼし検知)", () => {
    const empty = (CATALOG_ITEMS.interactive ?? []).filter((i) => i.subtitle.length === 0);
    expect(empty.map((i) => i.id), "subtitle が空の interactive item").toEqual([]);
  });
});

describe("topic は図の題名として扱える長さに収まる", () => {
  // cdl の seo-metadata-quality axis が 60 字を上限に見る。 説明文を topic に書くと超える。
  const SEO_MAX_TOPIC = 60;

  it("static category の topic が全て 60 字以内", () => {
    const over: string[] = [];
    for (const [category, items] of Object.entries(CATALOG_ITEMS)) {
      for (const item of items) {
        const topic = (item.diagram as { topic?: string }).topic ?? "";
        if (topic.trim().length > SEO_MAX_TOPIC) {
          over.push(`[${category}] ${item.id} (${topic.trim().length} 字)`);
        }
      }
    }
    expect(over, `topic が 60 字を超える図:\n${over.join("\n")}`).toEqual([]);
  });

  it("lazy-load する parts の topic も 60 字以内", async () => {
    const items = await loadPartsItems();
    expect(items.length).toBeGreaterThan(0);
    const over = items
      .map((i) => [i.id, ((i.diagram as { topic?: string }).topic ?? "").trim()] as const)
      .filter(([, t]) => t.length > SEO_MAX_TOPIC)
      .map(([id, t]) => `${id} (${t.length} 字)`);
    expect(over, `topic が 60 字を超える図:\n${over.join("\n")}`).toEqual([]);
  });
});
