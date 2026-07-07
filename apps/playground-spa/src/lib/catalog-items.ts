/**
 * 各 catalog category の diagram を lazy-load する SSOT。
 *
 * 各 category ごとに import + metadata。 CatalogPage で category に応じて
 * 該当 items 配列を PresetCard grid で表示。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";

// --- category: presets ---
import * as PresetsMod from "@/topics/catalog/presets.cdl";
// --- category: primitives ---
import * as PrimMod from "@/topics/catalog/primitives.cdl";
import * as PrimExtMod from "@/topics/catalog/primitives-extra.cdl";
// --- category: patterns ---
import * as PatMod from "@/topics/catalog/patterns.cdl";
// --- category: animation ---
import * as AnimMod from "@/topics/catalog/animation.cdl";
// --- category: styles ---
import * as StyMod from "@/topics/catalog/styles.cdl";
// --- category: cookbook ---
import * as CookMod from "@/topics/catalog/cookbook.cdl";
// --- category: text-dsl ---
import * as TdMod from "@/topics/catalog/text-dsl.cdl";

export interface CatalogItem {
  id: string;
  title: string;
  subtitle: string;
  diagram: CdlDiagram;
}

/**
 * 全 export を CatalogItem 配列化する helper (topic module → items[])。
 * default = key を title、 subtitle = diagram.topic (もしあれば)。
 */
function moduleToItems(mod: Record<string, unknown>): CatalogItem[] {
  const out: CatalogItem[] = [];
  for (const [key, value] of Object.entries(mod)) {
    if (!value || typeof value !== "object") continue;
    const d = value as CdlDiagram;
    if (!d.id || !d.nodes) continue;
    out.push({
      id: d.id,
      title: key,
      subtitle: d.topic ?? "",
      diagram: d,
    });
  }
  return out;
}

export const CATALOG_ITEMS: Record<string, CatalogItem[]> = {
  presets: moduleToItems(PresetsMod as Record<string, unknown>),
  primitives: [
    ...moduleToItems(PrimMod as Record<string, unknown>),
    ...moduleToItems(PrimExtMod as Record<string, unknown>),
  ],
  patterns: moduleToItems(PatMod as Record<string, unknown>),
  animation: moduleToItems(AnimMod as Record<string, unknown>),
  styles: moduleToItems(StyMod as Record<string, unknown>),
  cookbook: moduleToItems(CookMod as Record<string, unknown>),
  "text-dsl": moduleToItems(TdMod as Record<string, unknown>),
};
