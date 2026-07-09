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
  /** 人 / LLM 向け source 記法 (optional、 dragon package の 2 記法を dogfood 提示するため) */
  sourceYaml?: string;
  sourceJson?: string;
}

/**
 * phase 0 の text-dsl は cdl validate で「animation を駆動するための最低 1 phase が必要」 error になる。
 * static 表示だけしたい diagram のために、 phases が空なら 1 phase を注入して validate 通過させる。
 */
function ensurePhase(d: CdlDiagram): CdlDiagram {
  if (d.phases && d.phases.length > 0) return d;
  return {
    ...d,
    phases: [
      { id: "p1", duration: 1200, title: "static", body: "", activate: [], tweens: [], sets: [] },
    ] as CdlDiagram["phases"],
  };
}

/**
 * 全 export を CatalogItem 配列化する helper (topic module → items[])。
 * default = key を title、 subtitle = diagram.topic (もしあれば)。
 */
function moduleToItems(mod: Record<string, unknown>): CatalogItem[] {
  const out: CatalogItem[] = [];
  // source 記法は `sourceYaml__<key>` / `sourceJson__<key>` の suffix pair convention で検出
  const sourceYamlMap = new Map<string, string>();
  const sourceJsonMap = new Map<string, string>();
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v !== "string") continue;
    if (k.startsWith("sourceYaml__")) sourceYamlMap.set(k.slice("sourceYaml__".length), v);
    if (k.startsWith("sourceJson__")) sourceJsonMap.set(k.slice("sourceJson__".length), v);
  }
  for (const [key, value] of Object.entries(mod)) {
    if (!value || typeof value !== "object") continue;
    const d = value as CdlDiagram;
    if (!d.id || !d.nodes) continue;
    out.push({
      id: d.id,
      title: key,
      subtitle: d.topic ?? "",
      diagram: ensurePhase(d),
      sourceYaml: sourceYamlMap.get(key),
      sourceJson: sourceJsonMap.get(key),
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
