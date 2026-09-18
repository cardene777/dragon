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
  /**
   * 同じ種別の中で **中身そのものが違う見本** (#1696)。
   *
   * 切替には性質の違う 2 種類がある。 見せ方 (`折れ線の見せ方` 等) は 1 つの記法を変換する
   * 操作で、押しても図に載る項目と値は変わらない。 こちらは **複数の記法から選ぶ** 操作で、
   * 押すと中身が入れ替わる。 変換では作れない (件を足す変換は記法の見本にならない)。
   *
   * 一覧の別行にはしない = 一覧は「この記法でこう描ける」 の目録なので、変種が行を持つと
   * 項目の数と記法の型の数がずれる。
   */
  patterns?: CatalogPattern[];
}

/** 同じ種別の中の変種 1 つ (#1696) */
export interface CatalogPattern {
  /** 切替に出す名前 */
  名: string;
  /**
   * この見本の export 名 (元は `<key>`、変種は `pattern__<key>__<名>`)。
   *
   * **持たせる**。 記法の一致を見る検査は export 名で対象を引くので、名前から組み立て直すと
   * 組み立て方が 2 箇所に分かれる。
   */
  鍵: string;
  diagram: CdlDiagram;
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
 *
 * **検査から呼べるように export する** (#1696)。 変種の読み取りは実在のカタログを経由すると
 * 「今そう書いてあるか」 しか見られず、書き方そのもの (名前が無い変種を弾く 等) を
 * 確かめられない。 検査が自分で module の形を組み立てられるようにする。
 */
export function moduleToItems(mod: Record<string, unknown>): CatalogItem[] {
  const out: CatalogItem[] = [];
  // source 記法は `sourceYaml__<key>` / `sourceJson__<key>` の suffix pair convention で検出
  const sourceYamlMap = new Map<string, string>();
  const sourceJsonMap = new Map<string, string>();
  const subtitleMap = new Map<string, string>();
  const patternBaseMap = new Map<string, string>();
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v !== "string") continue;
    if (k.startsWith("sourceYaml__")) sourceYamlMap.set(k.slice("sourceYaml__".length), v);
    if (k.startsWith("sourceJson__")) sourceJsonMap.set(k.slice("sourceJson__".length), v);
    if (k.startsWith("subtitle__")) subtitleMap.set(k.slice("subtitle__".length), v);
    if (k.startsWith("patternBase__")) patternBaseMap.set(k.slice("patternBase__".length), v);
  }
  // 変種は `pattern__<元の見本>__<名前>` で export する (#1696)。 一覧の行にはせず、
  // 元の見本に束ねる。 記法は今までどおり同じ鍵 (`sourceYaml__pattern__...`) で引く。
  //
  // **変種の名前に空白は置けない** = export 名の末尾がそのまま切替の札になるので、
  // 識別子に置ける形へ言い換える (「前と今」 / 「今だけ」)。 単位付きの名前 (「1 件」) を
  // 書けるのは元の見本の側 (`patternBase__<key>` は文字列) だけ。
  const patternMap = new Map<string, CatalogPattern[]>();
  for (const [key, value] of Object.entries(mod)) {
    if (!key.startsWith("pattern__")) continue;
    if (!value || typeof value !== "object") continue;
    const d = value as CdlDiagram;
    if (!d.id || !d.nodes) continue;
    const [, 元, 名] = key.split("__");
    if (!元 || !名) continue;
    const 束 = patternMap.get(元) ?? [];
    束.push({
      名,
      鍵: key,
      diagram: ensurePhase(d),
      sourceYaml: sourceYamlMap.get(key),
      sourceJson: sourceJsonMap.get(key),
    });
    patternMap.set(元, 束);
  }

  for (const [key, value] of Object.entries(mod)) {
    if (key.startsWith("pattern__")) continue;
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
      ...変種を束ねる({
        key,
        元の図: withPhase,
        sourceYamlMap,
        sourceJsonMap,
        patternBaseMap,
        変種: patternMap.get(key),
      }),
    });
  }
  return out;
}

/**
 * 元の見本と変種を 1 本の並びにする (#1696)。
 *
 * **元の見本も並びの 1 つとして入れる**。 切替は「元 + 変種」 から選ぶ操作で、
 * 元を並びの外に置くと「元へ戻る」 を押せる場所が無くなる。
 *
 * 元の名前は `patternBase__<元の見本>` で書く。 **既定値を置かない** = 名前が無いまま
 * 変種だけ足すと、押す先の名前が実物と違う切替が黙って出る。 落ちれば見本を書いた
 * 時点で気付ける (`rules/quality.md § 判定できなかったことを値に潰さない`)。
 */
function 変種を束ねる(引数: {
  key: string;
  元の図: CdlDiagram;
  sourceYamlMap: Map<string, string>;
  sourceJsonMap: Map<string, string>;
  patternBaseMap: Map<string, string>;
  変種: CatalogPattern[] | undefined;
}): { patterns?: CatalogPattern[] } {
  const { key, 元の図, sourceYamlMap, sourceJsonMap, patternBaseMap, 変種 } = 引数;
  if (変種 === undefined || 変種.length === 0) return {};
  const 元の名 = patternBaseMap.get(key);
  if (!元の名) {
    throw new Error(`変種を持つ見本 ${key} に patternBase__${key} (元の見本の名前) が無い`);
  }
  return {
    patterns: [
      {
        名: 元の名,
        鍵: key,
        diagram: 元の図,
        sourceYaml: sourceYamlMap.get(key),
        sourceJson: sourceJsonMap.get(key),
      },
      ...変種,
    ],
  };
}

/** 画面に出している見本 1 つ (元の見本か、選ばれた変種) */
export type 見せている見本 = Pick<CatalogItem, "diagram" | "sourceYaml" | "sourceJson">;

/**
 * 選んだ名前の見本を返す (#1696)。
 *
 * **変種を持たない見本は元をそのまま返す**。 呼び出し側で分けると、変種を持たない図の
 * 経路だけ書き忘れて そこだけ画面が落ちる (`記法を持つか` が同じ理由で `null` を受ける)。
 *
 * 名前が並びに無い時は先頭 (= 元の見本) に落とす。 項目を選び直した直後は前の図の
 * 名前が残っており、そのまま引くと何も出ない。
 */
export function 選んだ見本(
  item: CatalogItem | null | undefined,
  名: string | null,
): 見せている見本 | null {
  if (!item) return null;
  const 並び = item.patterns;
  if (!並び || 並び.length === 0) return item;
  return 並び.find((p) => p.名 === 名) ?? 並び[0]!;
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

/**
 * 部品の頁に並べる見本を後から読む。 CategoryPage で params.slug === "parts" 時のみ発火。
 *
 * 部品そのもの (`parts.cdl.ts`) の後ろに、部品を箱に使う見本 (`parts-in-box.cdl.ts`) を並べる (#1973)。
 * その後ろに、部品を繋いだまま動かす見本 (`parts-motion.cdl.ts`) を並べる (#2125)。
 * 後ろの 2 つは部品の一覧を組み立てに渡すため `parts.cdl.ts` を読み込み、同じく後から読む。
 * 部品そのものだけが要る所 (編集画面の部品の欄と組み立ての一覧) は `部品の図か` で絞る。
 *
 * 並びは「部品そのもの → 箱として置く → 繋いで動かす」 の順で、後ろほど前の頁を前提にする。
 */
export async function loadPartsItems(): Promise<CatalogItem[]> {
  const [mod, 箱に使う, 繋いで動かす] = await Promise.all([
    import("@/topics/catalog/parts.cdl"),
    import("@/topics/catalog/parts-in-box.cdl"),
    import("@/topics/catalog/parts-motion.cdl"),
  ]);
  return [...moduleToItems(mod), ...moduleToItems(箱に使う), ...moduleToItems(繋いで動かす)];
}

/**
 * CatalogIndexPage が総数を出すために使う、部品の頁に並ぶ見本の数。
 *
 * **実 loading せずに数だけ要る**。 parts は初期 chunk から外すため後から読む設計で
 * (`CAR-1613`)、総数の表示のために全件を読み込むと分けた意味が消える。
 *
 * **実物とずれたら検査が落ちる** (`parts-count.test.ts`)。 以前は「人が忘れずに直す」 ことに
 * 依存しており、実際に片方だけ直された記述が残っていた (#1341)。 数を変える時は
 * `parts.cdl.ts` か `parts-in-box.cdl.ts` か `parts-motion.cdl.ts` を直せば検査が本 constant の
 * ずれを教える。 数えるのは頁に並ぶ行で、部品そのもの (`parts.cdl.ts`) と
 * 部品を箱に使う見本 (`parts-in-box.cdl.ts`、#1973) と
 * 部品を繋いで動かす見本 (`parts-motion.cdl.ts`、#2125) の 3 つ。 切替を持つ見本は 1 行として数える。
 *
 * **内訳の件数はここに書かない** (`rules/quality.md § 導出可能記述は人手で書かない` の経路 2)。
 * 以前は「部品そのもの 80」 と書いてあったが実物は 94 で、検査が見ない数だったため
 * 気付かれないまま残っていた。 内訳が要る時は上の 3 つの file を数える。
 */
export const PARTS_COUNT_ESTIMATE = 112;
