/**
 * 見本の記法が人向け (YAML) と LLM 向け (JSON) で揃っていることの検証 (#1292)。
 *
 * カタログは見本ごとに 2 記法を並べて見せる (`CategoryPage.tsx` の `SourceTab`)。
 * しかし実データは片側しか無く、`presets` 19 件と `charts` 9 件は `yaml` タブに中身が
 * あるのに `json` タブが空だった。
 *
 * ## なぜ片側だけになったか
 *
 * 2 つの流れが別々に走った。 `#211` / `#212` は「2 記法を並べて見せる」 のが目的で
 * `primitives` 30 件に両方入れたが、`#1262`-`#1267` は「記法で書ける範囲を広げる」 のが
 * 目的で YAML だけを足した。 **JSON を外す判断があったのではなく、別目的の作業なので
 * 付いてこなかった**。
 *
 * `#212` が「全 30 件」 と宣言して閉じた後、YAML が 28 件増えても気付けなかったのは
 * **網羅を見る検査が無かったから**。 件数を埋めるだけでは次の追加でまた片方が増える。
 *
 * ## 存在だけでは足りない
 *
 * 「両方ある」 だけを見ると、**空の JSON や別の図の JSON でも通る**。 記法が 2 つある
 * 意味は同じ図を 2 通りで書けることなので、**同じ図に解決されること** まで見る。
 *
 * ## 比べ方
 *
 * `textDslToDiagram(yaml)` と `jsonToDiagram(json)` の結果を比べる。 どちらも
 * `CdlDiagram` を返すので、そのまま突き合わせられる。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";

/** 全 category の見本を 1 列に並べる (parts は lazy-load なので別途足す) */
async function 全見本(): Promise<CatalogItem[]> {
  const 並び = Object.values(CATALOG_ITEMS).flat();
  return [...並び, ...(await loadPartsItems())];
}

describe("見本の記法が YAML / JSON で揃っている (#1292)", () => {
  it("走査対象を集められている", async () => {
    // 集められていなければ、以下の検査は通って当然になる
    const 見本 = await 全見本();
    expect(見本.length, "見本を 1 件も集められていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("YAML を持つ見本は JSON も持つ", async () => {
    const 見本 = await 全見本();
    const yamlあり = 見本.filter((i) => i.sourceYaml);
    // **母集合が空でないことを先に固定する**。 0 件だと下の `toEqual([])` は必ず通る
    expect(yamlあり.length, "YAML を持つ見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    const jsonなし = yamlあり.filter((i) => !i.sourceJson).map((i) => i.id);
    expect(jsonなし, "YAML はあるが JSON が無い見本がある").toEqual([]);
  });

  it("JSON を持つ見本は YAML も持つ", async () => {
    const 見本 = await 全見本();
    const jsonあり = 見本.filter((i) => i.sourceJson);
    expect(jsonあり.length, "JSON を持つ見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    const yamlなし = jsonあり.filter((i) => !i.sourceYaml).map((i) => i.id);
    expect(yamlなし, "JSON はあるが YAML が無い見本がある").toEqual([]);
  });

  it("YAML と JSON が同じ図に解決される", async () => {
    const 見本 = await 全見本();
    const 対 = 見本.filter((i) => i.sourceYaml && i.sourceJson);
    expect(
      対.length,
      "YAML / JSON の対を 1 件も集められていない (検査が空振りしている)",
    ).toBeGreaterThan(0);

    const 食い違い: string[] = [];
    for (const i of 対) {
      let y: CdlDiagram;
      let j: CdlDiagram;
      try {
        y = textDslToDiagram(i.sourceYaml!);
      } catch (e) {
        食い違い.push(`${i.id}: YAML が読めない (${(e as Error).message})`);
        continue;
      }
      try {
        j = jsonToDiagram(JSON.parse(i.sourceJson!));
      } catch (e) {
        食い違い.push(`${i.id}: JSON が読めない (${(e as Error).message})`);
        continue;
      }
      if (JSON.stringify(y) !== JSON.stringify(j)) 食い違い.push(i.id);
    }
    expect(食い違い, "YAML と JSON が別の図に解決される見本がある").toEqual([]);
  });
});
