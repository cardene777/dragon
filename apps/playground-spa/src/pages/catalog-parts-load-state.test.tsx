// @vitest-environment jsdom

/**
 * 部品の頁へ移った最初の描画から「読み込み中…」 が出ることを見る (#2018)。
 *
 * `/catalog/:slug` は縦列が変わっても頁の部品を作り直さない。 読み込み中かどうかを状態で持つと、
 * 移った最初の描画には前の縦列の値が残り、効果が走って描き直すまでの間、別の文言が DOM に入る。
 * 描き終えた後の画面は同じなので、**行き先が変わった描画で一覧の欄の文言を記録する**。
 *
 * ## `Profiler` で記録しない理由
 *
 * 実測で、行き先の変化を受けて頁が描き直された描画に `Profiler` の `onRender` が呼ばれなかった
 * (外側に置いても頁の直上に置いても同じ)。 古い形に戻すと DOM には「該当する項目がありません」
 * が入っていたのに、記録には「読み込み中…」 しか残らず、検査が通ってしまった。
 * ここでは行き先を読む部品を頁の後ろに置き、その部品の `useLayoutEffect` で DOM を読む。
 * 行き先が変わると必ず描き直され、頁と同じ描画で DOM を書き終えた後に走る。
 *
 * 読み込みは検査から終わらせる。 実物の読み込みは 1 拍で終わり、読み込み中の描画を
 * 観測できる時間が無いため。
 */
import React, { useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { CategoryPage } from "./CategoryPage";
import { CATALOG_ITEMS, type CatalogItem } from "@/lib/catalog-items";
import { ToastProvider } from "@/components/Toast";
import {
  installIntersectionObserverStub,
  restoreIntersectionObserver,
} from "../../../../test-support/intersection-observer-stub";

const 読込 = vi.hoisted(() => ({ 部品を読む: vi.fn<() => Promise<CatalogItem[]>>() }));

vi.mock("@/lib/catalog-items", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/catalog-items")>();
  return { ...actual, loadPartsItems: 読込.部品を読む };
});

vi.mock("@cardenelabs/cdl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cardenelabs/cdl")>();
  return {
    ...actual,
    CdlDiagramView: ({ diagram }: { diagram: CdlDiagram }): React.ReactElement => (
      <div data-testid="catalog-diagram" data-topic={diagram.topic} />
    ),
  };
});

const 読み込み中 = "読み込み中…";
const 該当なし = "該当する項目がありません";
const 失敗 = "読み込みに失敗しました";

/** 行き先が変わった描画で記録した、行き先と一覧の欄の文言 */
let 記録: { 行き先: string; 一覧: string }[] = [];

/** 頁の外から行き先を変える手段。 描いた後に入る */
let 移る: (行き先: string) => void = () => {
  throw new Error("まだ描いていない");
};

/**
 * 行き先が変わるたびに、頁と同じ描画で一覧の欄を読む。
 * 頁の後ろに置くので、この部品の `useLayoutEffect` は頁が DOM を書き終えた後に走る。
 * hook の規則が部品と見なすよう、名前を大文字の英字で始める。
 */
function NavigationRecorder(): null {
  const navigate = useNavigate();
  const location = useLocation();
  // 描画の最中に外の変数を書き換えると hook の規則に反するので、描き終えた後に渡す
  useLayoutEffect(() => {
    移る = (行き先) => {
      void navigate(行き先);
    };
  }, [navigate]);
  useLayoutEffect(() => {
    記録.push({
      行き先: location.pathname,
      一覧: document.querySelector(".catalog-list")?.textContent ?? "(一覧の欄が無い)",
    });
  }, [location.pathname]);
  return null;
}

/** 外から終わらせられる読み込み */
function 終わっていない読み込み(): {
  終える: (items: CatalogItem[]) => void;
  失敗させる: () => void;
} {
  let 終える: (items: CatalogItem[]) => void = () => {};
  let 失敗させる: () => void = () => {};
  読込.部品を読む.mockImplementationOnce(
    () =>
      new Promise<CatalogItem[]>((resolve, reject) => {
        終える = resolve;
        失敗させる = () => reject(new Error("読み込みに失敗させた"));
      }),
  );
  return { 終える: (items) => 終える(items), 失敗させる: () => 失敗させる() };
}

function 開く(縦列: string): void {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/catalog/${縦列}`]}>
        <Routes>
          <Route path="/catalog/:slug" element={<CategoryPage />} />
        </Routes>
        <NavigationRecorder />
      </MemoryRouter>
    </ToastProvider>,
  );
}

/**
 * 見張りを始めてから DOM に入った文言を全て集める。
 *
 * 上の記録は行き先が変わった描画を 1 回読むだけで、その後に効果が描き直した描画は読まない。
 * ここでは DOM の書き換えごとに、書き換える前の文言と足した要素の文言を拾う。
 * 同じ要素の文言だけを差し替える描き直しでも、書き換える前の値 (`oldValue`) に残る。
 */
function DOMに入った文言を見張る(): { 止める: () => string[] } {
  const 集めた: string[] = [];
  const 拾う = (records: MutationRecord[]): void => {
    for (const r of records) {
      if (r.type === "characterData" && r.oldValue !== null) 集めた.push(r.oldValue);
      for (const n of [...r.addedNodes, ...r.removedNodes]) {
        if (n.textContent) 集めた.push(n.textContent);
      }
    }
  };
  const 見張り = new MutationObserver(拾う);
  見張り.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    characterDataOldValue: true,
  });
  return {
    止める: () => {
      拾う(見張り.takeRecords());
      見張り.disconnect();
      // 止めた時点の文言も入れる = 書き換えが 1 回も起きなかった時も最後の姿は見る
      集めた.push(今の一覧());
      return 集めた;
    },
  };
}

/** 一覧の欄の今の文言 */
function 今の一覧(): string {
  return document.querySelector(".catalog-list")?.textContent ?? "(一覧の欄が無い)";
}

/** 最後に記録した描画。 記録が無ければ空振りとして落とす */
function 最後の記録(行き先: string): string {
  const 当たり = 記録.filter((r) => r.行き先 === 行き先);
  expect(
    当たり.length,
    `${行き先} へ移った描画を 1 回も記録していない (検査が空振りしている)`,
  ).toBeGreaterThan(0);
  return 当たり.at(-1)!.一覧;
}

function 別の縦列の見本(): CatalogItem[] {
  const items = CATALOG_ITEMS.charts;
  if (items === undefined || items.length === 0)
    throw new Error("charts の見本が無い (検査の前提が崩れた)");
  return items.slice(0, 2);
}

beforeEach(() => {
  記録 = [];
  読込.部品を読む.mockReset();
  installIntersectionObserverStub();
});

afterEach(() => {
  cleanup();
  restoreIntersectionObserver();
  vi.restoreAllMocks();
});

describe("部品の頁の読み込み中の表示 (#2018)", () => {
  it("部品の頁を直接開くと、最初の描画から読み込み中を出す", () => {
    終わっていない読み込み();
    開く("parts");
    expect(最後の記録("/catalog/parts")).toBe(読み込み中);
  });

  it("別の縦列から部品の頁へ移ると、移った描画から読み込み中を出し、読み込みが終わると見本を並べる", async () => {
    開く("charts");
    // 前提 = 移る前の一覧は別の縦列の見本で埋まっている (空の一覧から移ると差が出ない)
    expect(最後の記録("/catalog/charts")).not.toContain(該当なし);
    expect(最後の記録("/catalog/charts")).not.toContain(読み込み中);

    const 読み込み = 終わっていない読み込み();
    const 見張り = DOMに入った文言を見張る();
    act(() => 移る("/catalog/parts"));
    const 入った文言 = 見張り.止める();

    expect(最後の記録("/catalog/parts"), "移った描画で読み込み中以外の文言が DOM に入った").toBe(
      読み込み中,
    );
    expect(今の一覧()).toBe(読み込み中);
    expect(
      入った文言.filter((t) => t.includes(読み込み中)).length,
      "読み込み中を 1 度も拾っていない (見張りが空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      入った文言.filter((t) => t.includes(該当なし)),
      "移ってから読み込みが終わるまでの描画に「該当する項目がありません」 が入った",
    ).toEqual([]);

    const 見本 = 別の縦列の見本();
    await act(async () => {
      読み込み.終える(見本);
      await Promise.resolve();
    });
    expect(今の一覧()).toContain(見本[0]!.id);
  });

  it("読み込みに失敗した後に別の縦列へ移って戻ると、戻った描画から読み込み中を出す", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const 一回目 = 終わっていない読み込み();
    開く("parts");
    await act(async () => {
      一回目.失敗させる();
      await Promise.resolve();
    });
    // 前提 = 失敗が一覧の欄に出ている
    expect(今の一覧()).toContain(失敗);

    act(() => 移る("/catalog/charts"));

    終わっていない読み込み();
    記録 = [];
    const 見張り = DOMに入った文言を見張る();
    act(() => 移る("/catalog/parts"));
    const 入った文言 = 見張り.止める();

    expect(最後の記録("/catalog/parts"), "戻った描画で前回の失敗が DOM に入った").toBe(読み込み中);
    expect(今の一覧()).toBe(読み込み中);
    expect(
      入った文言.filter((t) => t.includes(失敗)),
      "戻ってから読み込みが終わるまでの描画に前回の失敗が入った",
    ).toEqual([]);
  });
});
