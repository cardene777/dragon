// @vitest-environment jsdom

/**
 * catalog 画面の「図 / コード」 切替の検査 (#1236)。
 *
 * それまで図と記法は縦に積まれており、記法を見るには図の下までスクロールする必要があった。
 * 切替を足したうえで、**どちらも DOM に残す** 形にしている。 外すと切り替えるたびに図を
 * 描き直すことになり、記法の選択 (yaml / json) も毎回戻る。
 *
 * CSS の字面 (隠す指定) は `catalog-preview-tabs-style.test.ts` が見る。 こちらは jsdom で
 * 走るため file 相対で CSS を読めず、cwd 相対にすると repo の外から走らせた時だけ落ちる。
 *
 * 最初の状態と結線に加えて、実際に押した後の `aria-selected` / `hidden` と、図の DOM が
 * 同じ instance のまま残ることを見る。 後者が無いと、非表示になった時に図が unmount され、
 * 再び開くたびに描き直されても検出できない。
 */
import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { CategoryPage } from "./CategoryPage";
import { ToastProvider } from "@/components/Toast";
import {
  drive as driveIntersection,
  installIntersectionObserverStub,
  restoreIntersectionObserver,
} from "../../../../test-support/intersection-observer-stub";

vi.mock("@cardenelabs/cdl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cardenelabs/cdl")>();
  return {
    ...actual,
    CdlDiagramView: (): React.ReactElement => <div data-testid="catalog-diagram" />,
  };
});

beforeEach(() => installIntersectionObserverStub());
afterEach(() => {
  cleanup();
  restoreIntersectionObserver();
});

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

/** 操作を伴う検査用に `/catalog/:slug` を DOM へ描く。 */
function 操作できる画面(slug: string): ReturnType<typeof render> {
  return render(
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

  it("押すと図とコードの表示が入れ替わる", () => {
    操作できる画面("charts");
    const 図 = screen.getByRole("tab", { name: "図" });
    const コード = screen.getByRole("tab", { name: "コード" });
    const 図の欄 = document.querySelector<HTMLElement>(".catalog-preview-stage");
    const コードの欄 = document.querySelector<HTMLElement>(".catalog-source-section");
    expect(図の欄, "図の欄が見つからない").not.toBeNull();
    expect(コードの欄, "コードの欄が見つからない").not.toBeNull();

    fireEvent.click(コード);
    expect(図.getAttribute("aria-selected")).toBe("false");
    expect(コード.getAttribute("aria-selected")).toBe("true");
    expect(図の欄!.hidden).toBe(true);
    expect(コードの欄!.hidden).toBe(false);

    fireEvent.click(図);
    expect(図.getAttribute("aria-selected")).toBe("true");
    expect(コード.getAttribute("aria-selected")).toBe("false");
    expect(図の欄!.hidden).toBe(false);
    expect(コードの欄!.hidden).toBe(true);
  });

  it("コードへ切り替えても図の DOM を作り直さない", () => {
    操作できる画面("charts");
    act(() => driveIntersection(true));
    const 描画前 = screen.getByTestId("catalog-diagram");

    fireEvent.click(screen.getByRole("tab", { name: "コード" }));
    // hidden になった結果を observer から届ける。 keepMounted の配線が無ければ、ここで図が外れる。
    act(() => driveIntersection(false));
    expect(screen.getByTestId("catalog-diagram")).toBe(描画前);

    fireEvent.click(screen.getByRole("tab", { name: "図" }));
    expect(screen.getByTestId("catalog-diagram")).toBe(描画前);
  });
});
