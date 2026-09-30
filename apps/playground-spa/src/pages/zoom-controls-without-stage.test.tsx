// @vitest-environment jsdom

/**
 * 図の欄を持たない頁で、拡大の操作を出さないことを見る検査 (#2682)。
 *
 * engine は描くものが 1 つも無い図に欄を出さない (cdl#924)。 欄が無い頁では倍率を測る相手が
 * 居ないため、倍率の欄が `--%` のまま残り、「幅に合わせる」 も「拡大」 も押す意味が無い。
 *
 * **判定は欄の `svg` が在るかの 1 点で行う**。 図の中身を見て決めると、同じ判定を見本帳と
 * engine の 2 か所が持つことになる。 ここでは描く部品を差し替えて、欄が在る場合と無い場合の
 * 両方を作る。
 *
 * **「無い」 と「まだ測っていない」 を分けていることも見る**。 潰すと、描かれる前の 1 フレームで
 * 描かれる図の操作まで消える。
 *
 * 実画面で何枚が該当するかは `pnpm exec playwright test tests/catalog-inline-zoom.spec.ts` 側と、
 * 提出時に数えた値が持つ。 ここは枚数ではなく配線を固定する。
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { CategoryPage } from "./CategoryPage";
import type { CatalogItem } from "@/lib/catalog-items";
import { ToastProvider } from "@/components/Toast";
/** 描く部品が欄を出すか。 図の id ごとに決める */
const 欄を出す = new Set<string>();

const 読込 = vi.hoisted(() => ({ 部品を読む: vi.fn<() => Promise<CatalogItem[]>>() }));

vi.mock("@/lib/catalog-items", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/catalog-items")>();
  return { ...actual, loadPartsItems: 読込.部品を読む };
});

vi.mock("@cardenelabs/cdl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cardenelabs/cdl")>();
  return {
    ...actual,
    // 欄を出す図だけ `svg` を描く。 engine が「描くものが無い図に欄を出さない」 のと同じ形
    CdlDiagramView: ({ diagram }: { diagram: CdlDiagram }): React.ReactElement | null =>
      欄を出す.has(diagram.id) ? (
        <div data-cdl-diagram={diagram.id}>
          <svg viewBox="0 0 400 300" />
        </div>
      ) : null,
  };
});

/** 実物の図を 1 つ借りて、id と題だけを差し替えた見本を作る */
function 見本を作る(id: string, 名: string, 元: CdlDiagram): CatalogItem {
  return {
    id,
    title: 名,
    subtitle: 名,
    subtitleEn: "",
    motionNote: "",
    diagram: { ...元, id, topic: 名 },
  };
}

function 開く(): void {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={["/catalog/parts"]}>
        <Routes>
          <Route path="/catalog/:slug" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

/** 一覧の項目を押して、その図を見ている状態にする */
async function 選ぶ(id: string): Promise<void> {
  const 項目 = document.querySelector<HTMLElement>(`.catalog-list-item[data-item-id="${id}"]`);
  expect(項目, `一覧に ${id} が出ていない`).not.toBeNull();
  await act(async () => {
    項目!.click();
    // 読み込みの解決と効果を流し切ってから読む (`catalog-parts-load-state` と同じ形)
    await Promise.resolve();
  });
}

const 操作の枠 = (): HTMLElement | null => document.querySelector(".catalog-preview-actions");

let 元の図: CdlDiagram;

beforeEach(async () => {
  // `IntersectionObserver` は差し替えない。 jsdom は持たないので `InViewMount` が出す側に倒れ、
  // 図が最初の描画から入る = 欄の有無だけを見る形になる
  欄を出す.clear();
  const 実物 = await vi.importActual<typeof import("@/lib/catalog-items")>("@/lib/catalog-items");
  元の図 = (await 実物.loadPartsItems())[0]!.diagram;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("図の欄が無い頁の拡大の操作 (#2682)", () => {
  it("欄が無い頁では、倍率も「幅に合わせる」 も「拡大」 も出ない", async () => {
    const 欄なし = 見本を作る("stageless-demo", "欄を持たない見本", 元の図);
    読込.部品を読む.mockResolvedValue([欄なし]);
    await act(async () => {
      開く();
      await Promise.resolve();
    });
    await 選ぶ("stageless-demo");
    expect(操作の枠(), "欄が無いのに拡大の操作が出ている").toBeNull();
    expect(document.querySelector(".cdl-zoom-value"), "倍率の欄が残っている").toBeNull();
    expect(screen.queryByText("拡大"), "「拡大」 が残っている").toBeNull();
  });

  it("欄がある頁では、拡大の操作が今までどおり出る (対照)", async () => {
    const 欄あり = 見本を作る("staged-demo", "欄を持つ見本", 元の図);
    欄を出す.add("staged-demo");
    読込.部品を読む.mockResolvedValue([欄あり]);
    await act(async () => {
      開く();
      await Promise.resolve();
    });
    await 選ぶ("staged-demo");
    expect(操作の枠(), "欄があるのに拡大の操作が消えている").not.toBeNull();
    expect(document.querySelector(".cdl-zoom-value"), "倍率の欄が出ていない").not.toBeNull();
  });

  it("同じ一覧の中で、欄のある図へ移ると操作が戻る", async () => {
    const 欄なし = 見本を作る("stageless-demo", "欄を持たない見本", 元の図);
    const 欄あり = 見本を作る("staged-demo", "欄を持つ見本", 元の図);
    欄を出す.add("staged-demo");
    読込.部品を読む.mockResolvedValue([欄なし, 欄あり]);
    await act(async () => {
      開く();
      await Promise.resolve();
    });
    await 選ぶ("stageless-demo");
    expect(操作の枠(), "欄が無いのに拡大の操作が出ている").toBeNull();
    await 選ぶ("staged-demo");
    expect(操作の枠(), "欄のある図へ移っても操作が戻らない").not.toBeNull();
  });
});
