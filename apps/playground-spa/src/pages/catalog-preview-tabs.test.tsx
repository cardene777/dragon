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
import { CATALOG_ITEMS, 選んだ見本 } from "@/lib/catalog-items";
import type { CatalogItem, CatalogPattern } from "@/lib/catalog-items";
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

/**
 * 先頭の図が記法を持たない分類か。
 *
 * **記法は 2 種類ある** (yaml / json)。 タブが押せるかは画面側で
 * `Boolean(sourceYaml || sourceJson)` と決まるため、片方だけを見ると json だけ持つ図を
 * 「記法なし」 として選んでしまう。
 *
 * **変種を先に解決してから見る** (#1722)。 画面は `選んだ見本` を通してから記法の有無を
 * 決めるので、項目そのものの欄だけを見ると判定が画面とずれる。 棒グラフに変種を足した時、
 * 項目の欄だけを消した対照が「記法なし」 と判定され、画面ではタブが押せる状態で通っていた。
 */
function 記法を持たない(item: Partial<CatalogItem> | undefined): boolean {
  if (item === undefined) return false;
  const 見せる = 選んだ見本(item as CatalogItem, null);
  return 見せる?.sourceYaml === undefined && 見せる?.sourceJson === undefined;
}

/** 判定の規則だけを見るための変種 1 つ。 図は引かないので中身は空でよい */
const 変種 = (sourceYaml?: string): CatalogPattern =>
  ({ 名: "元", 鍵: "pattern__x__元", diagram: {}, sourceYaml }) as unknown as CatalogPattern;

describe("陰性対照の選び方 (Round 1 の指摘)", () => {
  // 今の一覧に json だけ持つ図は無いため、選び方の規則を直接確かめる。
  // 規則を緩めると、押せるタブを持つ分類を「記法なし」 として選んでしまう
  it.each([
    ["どちらも無い", {}, true],
    ["yaml を持つ", { sourceYaml: "x" }, false],
    ["json を持つ", { sourceJson: "x" }, false],
    ["両方持つ", { sourceYaml: "x", sourceJson: "x" }, false],
    ["欄は空だが変種の先頭が yaml を持つ", { patterns: [変種("x")] }, false],
    ["変種の先頭も記法を持たない", { patterns: [変種(undefined)] }, true],
  ])("%s 図を %s と判定する", (_name, item, 期待) => {
    expect(記法を持たない(item)).toBe(期待);
  });

  it("項目が無い分類は選ばない", () => {
    expect(記法を持たない(undefined)).toBe(false);
  });
});

describe("図とコードを切り替えられる (#1236)", () => {
  // **最初の項目が記法を持つ分類で見る**。 選ばれるのは一覧の先頭なので、記法を持つ図が
  // 混ざっているだけでは足りない (`primitives` は 149 件中 30 件が持つが先頭は持たない)
  const html = 画面("charts");

  it("切替のタブがある", () => {
    expect(html).toContain('aria-label="表示の切替"');
    expect(html).toContain('role="tablist"');
  });

  it("タブは図とコードの 2 つ", () => {
    const tabs = [
      ...html.matchAll(/<button role="tab"[^>]*class="catalog-preview-tab[^"]*"[^>]*>([^<]+)</g),
    ].map((m) => m[1]);
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

  it("記法を持たない図ではコードのタブを押せない (陰性対照)", () => {
    // 押せる見た目にすると「押したのに何も出ない」 が残る。
    //
    // **実在の分類を陰性対照にしない**。 一覧を埋め終わることが目標なので、記法なしの
    // 分類を探す検査はいつか必ず成立しなくなる。 記法だけを消した見本を画面へ渡す。
    const 元 = CATALOG_ITEMS.charts?.[0];
    if (!元) throw new Error("合成 fixture の元にする catalog item が無い");
    const 元の一覧 = CATALOG_ITEMS.charts;
    if (元の一覧 === undefined) throw new Error("charts の一覧が無い");
    // 変種も落とす。 残すと画面が変種の記法を拾い、タブが押せてしまう (#1722)
    const 対照 = {
      ...元,
      id: "negative-control",
      sourceYaml: undefined,
      sourceJson: undefined,
      patterns: undefined,
    };
    expect(記法を持たない(対照), "合成 fixture が記法を持っている").toBe(true);

    CATALOG_ITEMS.charts = [対照];
    try {
      const コード = 画面("charts").match(/<button role="tab"[^>]*>コード</)?.[0] ?? "";
      expect(コード, "記法を持たない合成 fixture でコードのタブが押せてしまう").toContain(
        "disabled",
      );
    } finally {
      CATALOG_ITEMS.charts = 元の一覧;
    }
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
