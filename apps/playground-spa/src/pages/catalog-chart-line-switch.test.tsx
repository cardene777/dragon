// @vitest-environment jsdom

/**
 * catalog 画面の折れ線の見せ方切替 (#1624)。
 *
 * 見本一覧から折れ線を選んだ時だけ 3 つの入り切りボタンを出し、通常表示と拡大表示の
 * `CdlDiagramView` の両方へ同じ指定を渡すことを見る。view は差し替えて渡された図の
 * node の欄を data 属性に出し、通常表示と拡大表示を要素ごとに検査する。
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CategoryPage } from "./CategoryPage";
import { CATALOG_ITEMS } from "@/lib/catalog-items";
import { ToastProvider } from "@/components/Toast";
import {
  drive as driveIntersection,
  installIntersectionObserverStub,
  restoreIntersectionObserver,
} from "../../../../test-support/intersection-observer-stub";

function chartsの一覧() {
  const items = CATALOG_ITEMS.charts;
  if (items === undefined) throw new Error("charts の一覧が無い");
  return items;
}

const チャート一覧 = chartsの一覧();

vi.mock("@cardenelabs/cdl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cardenelabs/cdl")>();
  return {
    ...actual,
    CdlDiagramView: ({ diagram }: { diagram: CdlDiagram }): React.ReactElement => {
      const 折れ線 = diagram.nodes.find((node) => node.kind === "chart-line");
      return (
        <div
          data-testid="catalog-diagram"
          data-fill={String(折れ線?.chartFillUnder === true)}
          data-value-rise={String(折れ線?.chartValueRise === true)}
          data-trace={String(折れ線?.chartTrace === true)}
        />
      );
    },
  };
});

beforeEach(() => {
  installIntersectionObserverStub();
});
afterEach(() => {
  cleanup();
  restoreIntersectionObserver();
});

function 画面を開く(): void {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={["/catalog/charts"]}>
        <Routes>
          <Route path="/catalog/:slug" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
  act(() => driveIntersection(true));
}

/**
 * 一覧からその見本を選ぶ。
 *
 * 識別子は画面に出さなくなった (#2461) ので、字ではなく `data-item-id` で引く。
 * 一覧の欄に絞るのは、同じ属性が右側の詳細にも付くため。
 */
function 一覧から選ぶ(item: (typeof チャート一覧)[number]): void {
  const button = document.querySelector(
    `.catalog-list .catalog-list-item[data-item-id="${item.id}"]`,
  );
  expect(button, `${item.id} の一覧ボタンが見つからない`).not.toBeNull();
  fireEvent.click(button!);
}

function 折れ線の見本() {
  const item = チャート一覧.find((x) => x.diagram.topic === "週ごとの応答時間");
  expect(item, "週ごとの応答時間 の見本が見つからない").toBeDefined();
  return item!;
}

describe("catalog の折れ線の見せ方切替 (#1624)", () => {
  it("折れ線の見本を一覧から選ぶと 3 つの押しボタンが出て、最初は全て切", () => {
    // Given
    画面を開く();

    // When
    一覧から選ぶ(折れ線の見本());

    // Then
    const group = screen.getByRole("group", { name: "折れ線の見せ方" });
    const buttons = ["塗り", "せり上げ", "なぞり"].map((name) =>
      screen.getByRole("button", { name }),
    );
    expect(buttons, "折れ線の見せ方の押しボタンが 3 つ出ていない").toHaveLength(3);
    for (const button of buttons)
      expect(
        button.getAttribute("aria-pressed"),
        `${button.textContent} が最初から入っている`,
      ).toBe("false");
    expect(group, "折れ線の見せ方の group が無い").toBeTruthy();
  });

  it("折れ線でない先頭の棒グラフでは押しボタンを出さない", () => {
    // Given / When
    画面を開く();

    // Then
    expect(
      screen.queryByRole("group", { name: "折れ線の見せ方" }),
      "棒グラフに効かない切替が出ている",
    ).toBeNull();
  });

  it("塗りを押すと aria-pressed と通常 view に届く折れ線 node が入になる", () => {
    // Given
    画面を開く();
    一覧から選ぶ(折れ線の見本());
    const 塗り = screen.getByRole("button", { name: "塗り" });

    // When
    fireEvent.click(塗り);

    // Then
    expect(塗り.getAttribute("aria-pressed"), "塗りを押しても aria-pressed が反転しない").toBe(
      "true",
    );
    expect(
      screen.getByTestId("catalog-diagram").getAttribute("data-fill"),
      "通常 view に塗りの指定が届いていない",
    ).toBe("true");
  });

  it("拡大を押しても同じ塗りの指定が拡大側 view に届く", () => {
    // Given
    画面を開く();
    一覧から選ぶ(折れ線の見本());
    fireEvent.click(screen.getByRole("button", { name: "塗り" }));

    // When
    fireEvent.click(screen.getByRole("button", { name: /を拡大表示$/ }));

    // Then
    const 描いた要素 = screen.getAllByTestId("catalog-diagram");
    expect(
      描いた要素.length,
      "通常 view と拡大側 view の両方が描かれていない",
    ).toBeGreaterThanOrEqual(2);
    for (const 要素 of 描いた要素) {
      expect(要素.getAttribute("data-fill"), "塗りの指定が届いていない view がある").toBe("true");
    }
  });

  it("既存の 2 段目以降と再生速度の切替を残す", () => {
    // Given
    画面を開く();

    // When
    一覧から選ぶ(折れ線の見本());

    // Then
    expect(
      screen.getByRole("radiogroup", { name: "2 段目以降" }),
      "既存の 2 段目以降の切替が消えている",
    ).toBeTruthy();
    expect(
      screen.getByRole("radiogroup", { name: "再生速度" }),
      "既存の再生速度の切替が消えている",
    ).toBeTruthy();
  });

  it("見本を選び直すと 3 つとも切へ戻る", () => {
    // Given
    画面を開く();
    const line = 折れ線の見本();
    一覧から選ぶ(line);
    fireEvent.click(screen.getByRole("button", { name: "塗り" }));

    // When
    一覧から選ぶ(チャート一覧[0]!);
    一覧から選ぶ(line);

    // Then
    for (const name of ["塗り", "せり上げ", "なぞり"]) {
      expect(
        screen.getByRole("button", { name }).getAttribute("aria-pressed"),
        `${name} が見本を選び直しても切へ戻らない`,
      ).toBe("false");
    }
  });
});
