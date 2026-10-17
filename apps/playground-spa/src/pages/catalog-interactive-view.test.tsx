// @vitest-environment jsdom

/**
 * 見本帳が、組み済みの図と操作の記法を対にして描くことを見る (#2920)。
 *
 * `CdlDiagramView` は `laid` から箱・線・字を描く一方、入力欄と event binding は
 * `diagram` から読む。 両方へ組み済みの図を渡すと見た目は残るが、操作の欄が消え、
 * 箱を押しても差し込み前の字から変わらない。
 */
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { ToastProvider } from "@/components/Toast";
import { CATALOG_ITEMS } from "@/lib/catalog-items";
import { CategoryPage } from "./CategoryPage";

const 押して切り替える見本 = CATALOG_ITEMS.interactive?.find(
  (item) => item.id === "interactive-click-toggle",
);

function 画面を開く(): HTMLElement {
  if (押して切り替える見本 === undefined)
    throw new Error("クリックで状態切替の見本が無い (検査の前提が崩れた)");

  render(
    <ToastProvider>
      <MemoryRouter initialEntries={["/catalog/interactive"]}>
        <Routes>
          <Route path="/catalog/:slug" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );

  const 一覧の項目 = document.querySelector<HTMLElement>(
    `.catalog-list .catalog-list-item[data-item-id="${押して切り替える見本.id}"]`,
  );
  if (一覧の項目 === null) throw new Error("クリックで状態切替が一覧に無い");
  act(() => 一覧の項目.click());

  const 図 = document.querySelector<HTMLElement>(
    `[data-cdl-diagram="${押して切り替える見本.diagram.id}"]`,
  );
  if (図 === null) throw new Error("クリックで状態切替の図が描かれていない");
  return 図;
}

afterEach(() => cleanup());

describe("見本帳の操作できる図 (#2920)", () => {
  it("記法に書かれた入力の欄を描く", () => {
    const 図 = 画面を開く();

    expect(図.querySelector('[data-cdl-input-kind="toggle"]')).not.toBeNull();
  });

  it("押す箱を押すと、値の箱の字を切り替える", () => {
    const 図 = 画面を開く();
    const 押す箱 = 図.querySelector<SVGGElement>('[data-cdl-node="btn"]');
    const 値の箱 = 図.querySelector<SVGGElement>('[data-cdl-node="signalNode"]');
    if (押す箱 === null || 値の箱 === null)
      throw new Error("押す箱か値の箱が描かれていない (検査の前提が崩れた)");

    expect(値の箱.textContent).toContain("押した状態 = 押していない");
    fireEvent.click(押す箱);
    expect(値の箱.textContent).toContain("押した状態 = 押した");
  });
});
