/**
 * catalog の 2 面構成の検査 (#1236)。
 *
 * この画面は長く「設計に無い形」 で動いていた。 `docs/design/app.pen` の `03 見本帳の分類`
 * は figure と記法を縦に積む 1 面の姿のままで、サイドメニューも絞り込み欄も持たなかった。
 * 実装だけが 2 面へ進み、design を見た人と画面を見た人が別の姿を思い浮かべる状態が続いた。
 *
 * design 側は同 PR で描き直した。 ここで固定するのは **描き直した先の形** で、
 * 3 つある = 左にサイドメニューがあること、その中の一覧より前に絞り込み欄があること、
 * 面の幅と余白が design の数値と一致すること。
 *
 * **見た目そのものは検査できない**。 検査できるのは順序と数値だけなので、
 * 「1 面に戻す」 「絞り込み欄を一覧の後ろへ動かす」 「幅を変える」 のどれかをすると落ちる形にする。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router";
import { CategoryPage } from "./CategoryPage";
import { ToastProvider } from "@/components/Toast";

const CSS = readFileSync(new URL("../styles/catalog-new.css", import.meta.url), "utf8");

/** `/catalog/:slug` を描いた HTML。 画面と同じ route を通す */
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

/**
 * 広い画面向けの規則だけを持つ部分。 `@media` より前で切る。
 *
 * 切らずに探すと、狭い画面用の上書き (`@media (max-width: 860px)` が同じ選択子で 1 列へ戻す)
 * が **代わりに見つかってしまう**。 広い画面用の規則を丸ごと消しても「規則はある」 と読めて
 * しまい、下の `not.toBe("")` の見張りが空回りする (実測で踏んだ)。
 */
const 広い画面 = CSS.slice(0, CSS.indexOf("@media"));

/** 広い画面向けの規則 1 つ分の本体 */
function 規則(選択子: string): string {
  const m = 広い画面.match(new RegExp(`\\${選択子}\\s*\\{([^}]*)\\}`));
  return m?.[1] ?? "";
}

describe("catalog が 2 面で組まれている (#1236)", () => {
  const html = 画面("animation");

  it("規則そのものが見つかる", () => {
    // 見つからなければ以下の検査が全て空文字を見て通ってしまう
    expect(規則(".catalog-body"), "2 面の規則が無い").not.toBe("");
    expect(規則(".catalog-sidebar"), "サイドメニューの規則が無い").not.toBe("");
    expect(規則(".catalog-hero"), "頁の頭の規則が無い").not.toBe("");
  });

  it("サイドメニューが本文より前にある", () => {
    const 面 = html.indexOf('class="catalog-body"');
    const 側 = html.indexOf('class="catalog-sidebar"');
    const 本 = html.indexOf('class="catalog-preview"');
    expect(面, "2 面の入れ物が無い").toBeGreaterThan(-1);
    expect(側, "サイドメニューが無い").toBeGreaterThan(面);
    expect(本, "本文の面が無い").toBeGreaterThan(側);
  });

  it("絞り込み欄がサイドメニューの中で一覧より前にある", () => {
    const 側 = html.indexOf('class="catalog-sidebar"');
    const 絞 = html.indexOf('class="catalog-search-wrap"');
    const 覧 = html.indexOf('class="catalog-list"');
    expect(絞, "絞り込み欄が無い").toBeGreaterThan(側);
    expect(覧, "一覧が無い").toBeGreaterThan(絞);
  });

  it("絞り込み欄は打ち込める欄を持つ", () => {
    // 枠だけ残して input を外すと、上の順序の検査は通ってしまう
    expect(html).toMatch(/<input[^>]*class="catalog-search"/);
  });

  it("面の幅と間隔が design の数値と一致する", () => {
    // design (`03 見本帳の分類`) = サイドメニュー 260 / 面の間 24
    const 本体 = 規則(".catalog-body");
    expect(本体, "1 面に戻っている").toMatch(/grid-template-columns:\s*260px\s+minmax\(0,\s*1fr\)/);
    expect(本体, "面の間隔が 24px でない").toMatch(/gap:\s*24px/);
  });

  it("サイドメニューの余白が design の数値と一致する", () => {
    // design = 内側の余白 14 / 絞り込み欄と一覧の間 14
    const 本体 = 規則(".catalog-sidebar");
    expect(本体, "内側の余白が 14px でない").toMatch(/padding:\s*14px/);
    expect(本体, "中身の間隔が 14px でない").toMatch(/gap:\s*14px/);
  });

  it("頁の頭の余白が design の数値と一致する", () => {
    // design (`Page Head`) = 上 54 / 下 44
    expect(規則(".catalog-hero"), "頁の頭の余白が design と違う").toMatch(/padding:\s*54px 0 44px/);
  });

  it("狭い画面でだけ 1 面へ戻る (陰性対照)", () => {
    // 上の「1 面に戻っている」 は最初の規則しか見ない。 狭い画面用の上書きまで
    // 消してしまうと、この検査が落ちる = 2 面固定にした事故を検出できる
    const 狭い = CSS.slice(CSS.indexOf("@media (max-width: 860px)"));
    expect(狭い, "狭い画面用の規則が無い").not.toBe("");
    expect(狭い, "狭い画面で 1 面へ戻らない").toMatch(
      /\.catalog-body\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
  });
});
