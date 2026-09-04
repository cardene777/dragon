import type { CdlDiagram } from "@cardenelabs/cdl";

import * as Animation from "@/topics/catalog/animation.cdl";
import * as Charts from "@/topics/catalog/charts.cdl";
import * as Cookbook from "@/topics/catalog/cookbook.cdl";
import * as Ethereum from "@/topics/catalog/ethereum.cdl";
import * as Interactive from "@/topics/catalog/interactive.cdl";
import * as Parts from "@/topics/catalog/parts.cdl";
import * as Patterns from "@/topics/catalog/patterns.cdl";
import * as Presets from "@/topics/catalog/presets.cdl";
import * as PrimitivesExtra from "@/topics/catalog/primitives-extra.cdl";
import * as Primitives from "@/topics/catalog/primitives.cdl";
import * as Styles from "@/topics/catalog/styles.cdl";
import * as TextDsl from "@/topics/catalog/text-dsl.cdl";

export type CatalogSourceCase = { key: string; yaml: string; built: CdlDiagram };

/**
 * 記法を併記した見本を持つまとまり。
 *
 * **1 つずつ足す**。 module を動的に集める形にすると、記法を持たない module まで拾って
 * 別の壊れ方をするため、ここは手で並べる。
 *
 * 足し忘れは「検査が増えない」 という形で残り、通っている件数だけが減る = 気付けない。
 * 実際 `charts` と `text-dsl` が一覧に載りながら一致検査の対象から漏れていた (#1403)。
 * **漏れは `catalog-source-parity.test.tsx` の一覧との照合が落とす**。
 */
export const 記法を持つ見本帳: readonly [string, Record<string, unknown>][] = [
  ["presets", Presets],
  ["patterns", Patterns],
  ["styles", Styles],
  ["animation", Animation],
  ["primitives", Primitives],
  ["primitives-extra", PrimitivesExtra],
  // 図が記法から組み立つ頁も、図の側だけを書き換えた変更を落とすため対象に含める
  ["cookbook", Cookbook],
  ["ethereum", Ethereum],
  ["parts", Parts],
  ["interactive", Interactive],
  ["charts", Charts],
  ["text-dsl", TextDsl],
];

/** `sourceYaml__<key>` を持つ見本を集める */
export function 記法つき(): CatalogSourceCase[] {
  const out: CatalogSourceCase[] = [];
  const 既出の名前 = new Set<string>();
  for (const [名, mod] of 記法を持つ見本帳) {
    for (const [k, v] of Object.entries(mod)) {
      if (!k.startsWith("sourceYaml__") || typeof v !== "string") continue;
      const key = k.slice("sourceYaml__".length);
      const built = mod[key];
      // 比べる相手が無い記法を通すと、一致検査が成立しない
      if (built === null || typeof built !== "object") {
        throw new Error(`${名}: sourceYaml__${key} に対応する図の export が無い`);
      }
      // 差の宣言は `key` で引くため、重複すると意図しない図に効く
      if (既出の名前.has(key))
        throw new Error(`見本の名前 "${key}" がページをまたいで重複している`);
      既出の名前.add(key);
      out.push({ key, yaml: v, built: built as CdlDiagram });
    }
  }
  return out;
}
