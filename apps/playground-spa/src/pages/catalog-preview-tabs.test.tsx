/**
 * catalog 画面の「図 / コード」 切替の検査 (#1236)。
 *
 * それまで図と記法は縦に積まれており、記法を見るには図の下までスクロールする必要があった。
 * 切替を足したうえで、**どちらも DOM に残す** 形にしている。 外すと切り替えるたびに図を
 * 描き直すことになり、記法の選択 (yaml / json) も毎回戻る。
 *
 * この repo に click を起こす道具 (`@testing-library`) は入っていないため、ここで見るのは
 * **最初の状態と結線**まで。 押した後の切替そのものは `setPreviewTab` の 1 行で、
 * 選択状態は `aria-selected` と `hidden` の組で表している。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router";
import { CategoryPage } from "./CategoryPage";
import { ToastProvider } from "@/components/Toast";

/**
 * `/catalog/:slug` を描いた HTML。 画面と同じ route を通す。
 *
 * `ToastProvider` は画面の根に置かれているもので、頭の部分 (`SiteHeader`) が中で呼ぶ。
 * 包まないと組み立ての時点で落ちる
 */
function 画面(slug: string): string {
  return renderToStaticMarkup(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/catalog/${slug}`]}>
        <Routes>
          <Route path="/catalog/:slug" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("図とコードを切り替えられる (#1236)", () => {
  // **最初の項目が記法を持つ分類で見る**。 選ばれるのは一覧の先頭なので、記法を持つ図が
  // 混ざっているだけでは足りない (`primitives` は 149 件中 30 件が持つが先頭は持たない)
  const html = 画面("charts");

  it("切替のタブがある", () => {
    expect(html).toContain('aria-label="表示の切替"');
    expect(html).toContain('role="tablist"');
  });

  it("タブは図とコードの 2 つ", () => {
    const tabs = [...html.matchAll(/<button role="tab"[^>]*class="catalog-preview-tab[^"]*"[^>]*>([^<]+)</g)]
      .map((m) => m[1]);
    expect(tabs).toEqual(["図", "コード"]);
  });

  it("記法を持つ図ではコードのタブが押せる", () => {
    const コード = html.match(/<button role="tab"[^>]*>コード</)?.[0] ?? "";
    expect(コード, "コードのタブが見つからない").not.toContain("disabled");
  });

  it("最初は図が選ばれている", () => {
    // 図の側を既定にする = catalog は絵を見に来る画面で、記法は確かめに来た人が押す
    const 図 = html.match(/<button role="tab"[^>]*>図</)?.[0] ?? "";
    const コード = html.match(/<button role="tab"[^>]*>コード</)?.[0] ?? "";
    expect(図, "図のタブが見つからない").toContain('aria-selected="true"');
    expect(コード, "コードのタブが見つからない").toContain('aria-selected="false"');
  });

  it("記法を持たない分類ではコードのタブを押せない (陰性対照)", () => {
    // `presets` は 19 件すべてが記法を持たない。 押せる見た目にすると「押したのに何も
    // 出ない」 が残る
    const presets = 画面("presets");
    const コード = presets.match(/<button role="tab"[^>]*>コード</)?.[0] ?? "";
    expect(コード, "コードのタブが見つからない").toContain("disabled");
  });

  it("最初は記法の欄が隠れている", () => {
    // 隠すだけで DOM からは外さない。 外すと記法の選択が毎回 yaml へ戻る
    expect(html).toContain('class="catalog-source-section"');
    expect(html).toMatch(/class="catalog-source-section"[^>]*hidden/);
  });

  it("図の側は隠れていない (陰性対照)", () => {
    // 両方隠れている実装でも上の検査は通ってしまう
    const 図の欄 = html.match(/<div class="catalog-preview-stage"[^>]*>/)?.[0] ?? "";
    expect(図の欄, "図の欄が見つからない").not.toBe("");
    expect(図の欄).not.toContain("hidden");
  });
});

describe("隠す指定が効く形になっている (#1236)", () => {
  it("`hidden` 属性を CSS が打ち消していない", async () => {
    // `hidden` の既定の `display: none` は、要素側の `display: grid` / `flex` に負ける。
    // 明示して消す規則が無いと、隠したつもりの欄が出たままになる
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../styles/catalog-new.css", import.meta.url), "utf8"),
    );
    expect(css).toContain(".catalog-preview-stage[hidden]");
    expect(css).toContain(".catalog-source-section[hidden]");
  });
});
