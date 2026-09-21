/**
 * カタログの見本で、カタカナの伸ばす音 (`ー`) が見分けの字に残ることの確認 (#2431)。
 *
 * 字を作る `slugify` の側は `packages/dragon/test/slug-choon-2431.test.ts` が見る。
 * こちらは **実物のカタログを走査して** 確かめる = 字を作る側を直しても、
 * 手で書いた見分けの字 (`presets.cdl.ts` の `flow-demo` 等) は自動では変わらないため。
 *
 * 見分けの字は画面に出る。 見本一覧の 2 行目がそのまま出すので、
 * 化けると `フロ-の並ぶ向きを書かない` という読めない字が並ぶ。
 *
 * ## 「題と字が一致する」 とは見ない
 *
 * 字を英語で書いた節が多くある (`aCard` / `token` / `mobile` 等、実測 12 件)。
 * 題が `チーム A` でも字は `aCard` で、これは書き手が選んだ形であって化けた跡ではない。
 * 見るのは **化けた形が残っていないか** に絞る = 題に伸ばす音があるのに、
 * 字の側でカタカナの隣に `-` が立っている形。
 */
import { describe, it, expect } from "vitest";
import { CATALOG_ITEMS, type CatalogItem } from "./catalog-items";

/** カタログの全見本を 1 本の並びにする */
const 全件 = (): CatalogItem[] => Object.values(CATALOG_ITEMS).flat();

/** 伸ばす音が `-` に化けた跡。 カタカナの隣に `-` が立つ */
const 化けた跡 = /[ァ-ヺ]-|-[ァ-ヺ]/u;

describe("カタカナの伸ばす音は見分けの字に残る (#2431)", () => {
  it("伸ばす音を含む題の字に、化けた跡が残っていない", () => {
    const 残り: string[] = [];
    let 走査した = 0;
    let 伸ばす音を含む = 0;
    const 見る = (題: string, 字: string, 場: string): void => {
      走査した += 1;
      if (!題.includes("ー")) return;
      伸ばす音を含む += 1;
      if (化けた跡.test(字)) 残り.push(`${場} ${字} <- ${題}`);
    };
    for (const item of 全件()) {
      見る((item.diagram as { title?: string }).title ?? "", item.id, "図");
      for (const n of item.diagram.nodes ?? []) {
        見る((n as { title?: string }).title ?? "", n.id, `節 ${item.id}:`);
      }
    }

    // 空振り防止 = 走査した題と、伸ばす音を含む題の両方が 1 件以上あることを先に見る。
    // 0 件が「該当なし」 か「測っていない」 かを読み手が分けられるようにする
    expect(走査した, "題を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(500);
    expect(
      伸ばす音を含む,
      `伸ばす音を含む題が 1 つも無い (走査した題 ${走査した} 件)`,
    ).toBeGreaterThan(20);
    expect(
      残り,
      `伸ばす音の化けた字が残っている (伸ばす音を含む題 ${伸ばす音を含む} 件 / 走査した題 ${走査した} 件)`,
    ).toEqual([]);
  });

  it("一覧の 2 行目に出る字が読める (フローの並ぶ向きの見本)", () => {
    // 画面に出る所を 1 件だけ固定する。 上の 1 件は全件の性質を見るので、
    // 「どこに出るか」 が読み取れない
    const 見本 = 全件().find((x) => x.title === "flowDirection");
    expect(見本, "フローの並ぶ向きの見本が無い").toBeDefined();
    expect(見本!.id).toBe("フローの並ぶ向きを書かない");
  });
});
