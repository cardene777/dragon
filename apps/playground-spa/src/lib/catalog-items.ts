/**
 * 各 catalog category の diagram を lazy-load する SSOT。
 *
 * 各 category ごとに import + metadata。 CatalogPage で category に応じて
 * 該当 items 配列を CategoryPage の 2 pane grid で表示。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";
import { motionNote } from "./catalog-motion";

// --- category: presets ---
import * as PresetsMod from "@/topics/catalog/presets.cdl";
// --- category: primitives ---
import * as PrimMod from "@/topics/catalog/primitives.cdl";
import * as PrimExtMod from "@/topics/catalog/primitives-extra.cdl";
// --- category: patterns ---
import * as PatMod from "@/topics/catalog/patterns.cdl";
// --- category: animation ---
import * as AnimMod from "@/topics/catalog/animation.cdl";
// --- category: parts (rich exemplar 合成用 reusable atoms、 2026-07-15 新設) ---
// top-level で diagram(...).build() が走る数だけ初期 chunk が重くなるため (数は PARTS_COUNT_ESTIMATE 参照)、
// dynamic import で lazy-load して初期 catalog-items chunk (348 kB gzip) からは除外する (CAR-1613)。
// CategoryPage が params.slug === "parts" 時のみ loadPartsItems() を呼び、 State に populate する経路。
// --- category: styles ---
import * as StyMod from "@/topics/catalog/styles.cdl";
// --- category: cookbook ---
import * as CookMod from "@/topics/catalog/cookbook.cdl";
// --- category: text-dsl ---
import * as TdMod from "@/topics/catalog/text-dsl.cdl";
// --- category: interactive ---
import * as InteractiveMod from "@/topics/catalog/interactive.cdl";
// --- category: ethereum (仕組み解説アニメーション、 CAR-2160) ---
import * as EthMod from "@/topics/catalog/ethereum.cdl";
// --- category: charts (図表系 10 種、 #1152) ---
import * as ChartsMod from "@/topics/catalog/charts.cdl";

export interface CatalogItem {
  id: string;
  title: string;
  subtitle: string;
  /**
   * 動きの種類を表す 1 文 (#1043)。 **人は書かず、図の実装から導く**。
   *
   * 説明 (`subtitle`) に動きを書くと実装とずれ、ずれは言い回しの列挙では止められない。
   * 動かない図も含めて必ず付く (#1053)。 SSOT = `catalog-motion.ts`
   */
  motionNote: string;
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
 * default = key を title、 subtitle = `subtitle__<key>` があればそれ、 無ければ diagram.topic。
 *
 * `topic` は図の題名で 60 字以内に収める (cdl の seo-metadata-quality が SEO title として見る)。
 * 一覧に出したい長い説明は `subtitle__<key>` に置く。
 */
function moduleToItems(mod: Record<string, unknown>): CatalogItem[] {
  const out: CatalogItem[] = [];
  // source 記法は `sourceYaml__<key>` / `sourceJson__<key>` の suffix pair convention で検出
  const sourceYamlMap = new Map<string, string>();
  const sourceJsonMap = new Map<string, string>();
  const subtitleMap = new Map<string, string>();
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v !== "string") continue;
    if (k.startsWith("sourceYaml__")) sourceYamlMap.set(k.slice("sourceYaml__".length), v);
    if (k.startsWith("sourceJson__")) sourceJsonMap.set(k.slice("sourceJson__".length), v);
    if (k.startsWith("subtitle__")) subtitleMap.set(k.slice("subtitle__".length), v);
  }
  for (const [key, value] of Object.entries(mod)) {
    if (!value || typeof value !== "object") continue;
    const d = value as CdlDiagram;
    if (!d.id || !d.nodes) continue;
    const withPhase = ensurePhase(d);
    out.push({
      id: d.id,
      title: key,
      subtitle: subtitleMap.get(key) ?? d.topic ?? "",
      motionNote: motionNote(withPhase),
      diagram: withPhase,
      sourceYaml: sourceYamlMap.get(key),
      sourceJson: sourceJsonMap.get(key),
    });
  }
  return out;
}

export const CATALOG_ITEMS: Record<string, CatalogItem[]> = {
  presets: moduleToItems(PresetsMod),
  primitives: [
    ...moduleToItems(PrimMod),
    ...moduleToItems(PrimExtMod),
  ],
  patterns: moduleToItems(PatMod),
  animation: moduleToItems(AnimMod),
  // parts は dynamic import で lazy-load、 初期表示は空 = CategoryPage が useEffect で populate する
  parts: [],
  styles: moduleToItems(StyMod),
  cookbook: moduleToItems(CookMod),
  "text-dsl": moduleToItems(TdMod),
  interactive: moduleToItems(InteractiveMod),
  ethereum: moduleToItems(EthMod),
  charts: moduleToItems(ChartsMod),
};

/** parts.cdl.ts の N 個 diagram を lazy-load する。 CategoryPage で params.slug === "parts" 時のみ発火。 */
export async function loadPartsItems(): Promise<CatalogItem[]> {
  const mod = await import("@/topics/catalog/parts.cdl");
  return moduleToItems(mod);
}

/**
 * CatalogIndexPage が総数を出すために使う parts の数。
 *
 * **実 loading せずに数だけ要る**。 parts は初期 chunk から外すため後から読む設計で
 * (`CAR-1613`)、総数の表示のために全件を読み込むと分けた意味が消える。
 *
 * **実物とずれたら検査が落ちる** (`parts-count.test.ts`)。 以前は「人が忘れずに直す」 ことに
 * 依存しており、実際に片方だけ直された記述が残っていた (#1341)。 数を変える時は
 * `parts.cdl.ts` を直せば検査が本 constant のずれを教える。
 */
export const PARTS_COUNT_ESTIMATE = 80;
