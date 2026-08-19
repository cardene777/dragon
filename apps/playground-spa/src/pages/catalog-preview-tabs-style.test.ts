/**
 * 「図 / コード」 の切替で使う隠す指定の検査 (#1236)。
 *
 * 切替の DOM 側は `catalog-preview-tabs.test.tsx` が見る。 **こちらを別 file に分けたのは
 * 環境の違いによる**。 あちらは click を起こすため jsdom で走り、jsdom では
 * `import.meta.url` が `file:` にならないので、file からの相対で CSS を読めない。
 *
 * cwd からの相対で読む形にすると、repo の外から走らせた時だけ落ちる (実測)。 CSS の字面を
 * 見るだけの検査に DOM は要らないので、node 環境のこの file に置いて file 相対で読む。
 * 隣の `catalog-search-style.test.ts` と同じ形。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const CSS = readFileSync(new URL("../styles/catalog-new.css", import.meta.url), "utf8");

describe("隠す指定が効く形になっている (#1236)", () => {
  it("`hidden` 属性を CSS が打ち消していない", () => {
    // `hidden` の既定の `display: none` は、要素側の `display: grid` / `flex` に負ける。
    // 明示して消す規則が無いと、隠したつもりの欄が出たままになる
    expect(CSS).toContain(".catalog-preview-stage[hidden]");
    expect(CSS).toContain(".catalog-source-section[hidden]");
  });

  it("隠す規則が `display` を明示している (陰性対照)", () => {
    // 選択子だけ書いて中身が別の property だと、上の検査は通るのに隠れない
    const m = CSS.match(/\.catalog-preview-stage\[hidden\][^{]*\{([^}]*)\}/);
    expect(m?.[1], "隠す規則の本体が無い").toBeDefined();
    expect(m?.[1] ?? "", "隠す規則が display を指定していない").toMatch(/display:\s*none/);
  });
});
