// @vitest-environment jsdom

/**
 * 項目を選び直した最初の描画から、新しい項目の見せ方で描かれることを見る (#2022)。
 *
 * 見せ方 (速さ / 描き方 / 配色 …) を効果で既定へ戻すと、効果が走るのは描き終えた後なので、
 * **選び直した最初の 1 コマは前の項目の見せ方で新しい図が描かれる**。 描き終えた後の画面は
 * 同じなので、最後の姿だけを見ても差が出ない。 ここでは描かれた図そのものの移り変わりを
 * 全部集めて、途中に前の項目の見せ方が混じらないことを見る。
 *
 * ## 何を材料にするか
 *
 * 描き方の既定は図ごとに違う (弧は継ぎ足すと起点を見失うので描き直しから始める、#1690)。
 * つまり **操作を 1 度もしなくても** 既定が違う 2 件を行き来するだけで差が出る。
 * 2 件は見本の一覧から導く = 項目の id を書き写すと、見本が入れ替わった時に検査だけが古くなる。
 *
 * ## 描いた結果で見る
 *
 * 押した釦の色 (`aria-checked`) ではなく、描画側へ渡った図を見る。 釦は見せ方の写しで、
 * 図に効いているかは別の問い。 `図の描き方を変える` は 2 段目以降へ 1 段目の描く指定を写すので、
 * 2 段目に描く指定があるかどうかが「描き直す」 で描かれたかの印になる。
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { CdlDiagram, LaidDiagram } from "@cardenelabs/cdl";

import { CategoryPage } from "./CategoryPage";
import { CATALOG_ITEMS, patternName, type CatalogItem } from "@/lib/catalog-items";
import { ToastProvider } from "@/components/Toast";
import { 配色の札, 配色の選択肢, 画面の色, 画面の色の札 } from "@/lib/palette-switch";
import { 図ごとの既定の描き方, 描き方を選べる } from "@/lib/redraw-mode";
import {
  drive,
  installIntersectionObserverStub,
  restoreIntersectionObserver,
} from "../../../../test-support/intersection-observer-stub";

/** 描画側へ渡った図の印。 どの図が、どの描き方で描かれたか */
function 描かれた印(diagram: CdlDiagram): string {
  const 二段目に描く指定 = (diagram.phases[1]?.draw ?? []).length > 0;
  return `${diagram.topic ?? "(題なし)"}/${二段目に描く指定 ? "描き直す" : "動かすだけ"}`;
}

vi.mock("@cardenelabs/cdl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cardenelabs/cdl")>();
  return {
    ...actual,
    CdlDiagramView: ({
      diagram,
      laid,
    }: {
      diagram: CdlDiagram;
      laid?: LaidDiagram;
    }): React.ReactElement => (
      <div
        data-testid="catalog-diagram"
        data-drawn={描かれた印(diagram)}
        data-cdl-palette={laid?.palette ?? diagram.palette}
        data-diagram-id={diagram.id}
        data-text-metrics={laid?.textMetrics ?? diagram.textMetrics}
        data-laid-reused={String(laid !== undefined)}
      />
    ),
  };
});

/**
 * 既定の描き方が違う 2 件を、同じ縦列から選ぶ。
 *
 * 後から選ぶ側は **写す先を持つ図** に限る = 写せない図は「描き直す」 を渡しても図が変わらず、
 * 前の項目の値が残っていても印に出ない。
 */
function 既定の描き方が違う2件(): { 縦列: string; 先に見る: CatalogItem; 後に見る: CatalogItem } {
  for (const [縦列, items] of Object.entries(CATALOG_ITEMS)) {
    const 先に見る = items.find((i) => 図ごとの既定の描き方(i.diagram) === "redraw");
    const 後に見る = items.find(
      (i) => 図ごとの既定の描き方(i.diagram) === "hold" && 描き方を選べる(i.diagram),
    );
    if (先に見る && 後に見る && 先に見る.diagram.topic !== 後に見る.diagram.topic)
      return { 縦列, 先に見る, 後に見る };
  }
  throw new Error("既定の描き方が違う 2 件を同じ縦列で見つけられない (検査の前提が崩れた)");
}

/** パターンを持つ見本を、登録表から 1 件選ぶ。 */
function パターンを持つ見本(): { 縦列: string; item: CatalogItem } {
  for (const [縦列, items] of Object.entries(CATALOG_ITEMS)) {
    const item = items.find(
      (candidate) =>
        (candidate.patterns?.length ?? 0) > 1 &&
        candidate.patterns?.[1] !== undefined &&
        (candidate.patterns[1].sourceYaml !== undefined ||
          candidate.patterns[1].sourceJson !== undefined),
    );
    if (item) return { 縦列, item };
  }
  throw new Error("パターンを持つ見本が 1 件も無い (検査の前提が崩れた)");
}

/** 見張りを始めてから描画側へ渡った図の印を全部集める */
function 描かれた図を見張る(): { 止める: () => string[] } {
  const 集めた: string[] = [];
  const 印を拾う = (n: Node): void => {
    if (!(n instanceof Element)) return;
    for (const el of [n, ...n.querySelectorAll("[data-drawn]")]) {
      const 印 = el.getAttribute("data-drawn");
      if (印 !== null) 集めた.push(印);
    }
  };
  const 拾う = (records: MutationRecord[]): void => {
    for (const r of records) {
      // 同じ要素のまま図だけ差し替わった時は、書き換える前の値が `oldValue` に残る
      if (r.type === "attributes" && r.oldValue !== null) 集めた.push(r.oldValue);
      if (r.type === "attributes") 印を拾う(r.target);
      for (const n of r.addedNodes) 印を拾う(n);
    }
  };
  const 見張り = new MutationObserver(拾う);
  見張り.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["data-drawn"],
  });
  return {
    止める: () => {
      拾う(見張り.takeRecords());
      見張り.disconnect();
      // 止めた時点の姿も入れる = 書き換えが 1 回も起きなかった時に空にしない
      集めた.push(今の印());
      return 集めた;
    },
  };
}

/** 今描かれている図の印 */
function 今の印(): string {
  return document.querySelector("[data-drawn]")?.getAttribute("data-drawn") ?? "(図が無い)";
}

/**
 * 一覧からその項目を選ぶ。
 *
 * 探すのは一覧の欄の中だけ = 同じ属性は右側の詳細にも付くので、画面全体から引くと 2 つ当たる。
 * 識別子は画面に出さなくなった (#2461) ので、字ではなく属性で引く。
 */
function 選ぶ(item: CatalogItem): void {
  const 行 = [...document.querySelectorAll(".catalog-list .catalog-list-item")].find(
    (el) => el.getAttribute("data-item-id") === item.id,
  );
  if (!(行 instanceof HTMLElement))
    throw new Error(`一覧に ${item.id} が無い (検査の前提が崩れた)`);
  act(() => 行.click());
}

/** 検索の欄に字を入れて一覧を絞り込む。 選ばずに見ている項目が変わる経路 */
function 絞り込む(字: string): void {
  const 欄 = document.querySelector(".catalog-search");
  if (!(欄 instanceof HTMLInputElement))
    throw new Error("検索の欄が画面に無い (検査の前提が崩れた)");
  act(() => {
    fireEvent.change(欄, { target: { value: 字 } });
  });
}

function 開く(縦列: string): void {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/catalog/${縦列}`]}>
        <Routes>
          <Route path="/catalog/:slug" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
  // 図は見えてから描く (`InViewMount`)。 見えたことにしないと図が 1 度も描かれない
  act(() => drive(true));
}

beforeEach(() => {
  installIntersectionObserverStub();
});

afterEach(() => {
  cleanup();
  restoreIntersectionObserver();
  vi.restoreAllMocks();
});

describe("項目を選び直した時の見せ方 (#2022)", () => {
  it("既定の描き方が違う項目へ移ると、移った最初の描画から新しい既定で描く", () => {
    const { 縦列, 先に見る, 後に見る } = 既定の描き方が違う2件();
    開く(縦列);
    選ぶ(先に見る);

    // 前提 = 移る前は「描き直す」 で描かれている (同じ描き方どうしでは差が出ない)
    expect(今の印(), "移る前の図が描き直すで描かれていない").toBe(
      `${先に見る.diagram.topic}/描き直す`,
    );

    const 見張り = 描かれた図を見張る();
    選ぶ(後に見る);
    const 描かれた = 見張り.止める();

    const 正しい姿 = `${後に見る.diagram.topic}/動かすだけ`;
    const 前の見せ方 = `${後に見る.diagram.topic}/描き直す`;
    expect(今の印(), "描き終えた後の姿が違う").toBe(正しい姿);
    expect(
      描かれた.filter((印) => 印 === 正しい姿).length,
      "正しい姿を 1 度も拾っていない (見張りが空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      描かれた.filter((印) => 印 === 前の見せ方),
      "移った後の描画に前の項目の描き方が混じった",
    ).toEqual([]);
  });

  it("絞り込みで見ている項目が入れ替わった時も、その描画から新しい既定で描く", () => {
    // 押さずに見ている項目が変わる経路。 選ぶ操作で戻す形は届かず、読み替えだけが受け持つ。
    // 一覧の先頭を見ている状態から絞り込むと、押さないまま見ている項目が変わる
    const { 縦列, 先に見る } = 既定の描き方が違う2件();
    開く(縦列);
    // 前提 = 絞り込む前は別の項目を見ている (同じ項目なら入れ替わりが起きない)
    expect(今の印(), "絞り込む前から弧の図を見ている (入れ替わりが起きない)").not.toBe(
      `${先に見る.diagram.topic}/描き直す`,
    );

    const 見張り = 描かれた図を見張る();
    絞り込む(先に見る.id);
    const 描かれた = 見張り.止める();

    const 正しい姿 = `${先に見る.diagram.topic}/描き直す`;
    expect(今の印(), "絞り込んだ後の姿が違う").toBe(正しい姿);
    expect(
      描かれた.filter((印) => 印 === 正しい姿).length,
      "正しい姿を 1 度も拾っていない (見張りが空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      描かれた.filter((印) => 印 === `${先に見る.diagram.topic}/動かすだけ`),
      "絞り込んだ後の描画に、画面共通の既定で描いた図が混じった",
    ).toEqual([]);
  });

  it("同じ項目を見ている間は、選んだ見せ方が保たれる", () => {
    const { 縦列, 後に見る } = 既定の描き方が違う2件();
    開く(縦列);
    選ぶ(後に見る);
    expect(今の印()).toBe(`${後に見る.diagram.topic}/動かすだけ`);

    const 描き直す釦 = screen
      .getAllByRole("radio")
      .find((b) => b.textContent === "描き直す" && b.closest('[aria-label="2 段目以降"]'));
    if (描き直す釦 === undefined) throw new Error("描き方の切替が画面に無い (検査の前提が崩れた)");
    act(() => 描き直す釦.click());

    expect(今の印(), "押した描き方が図に効いていない").toBe(`${後に見る.diagram.topic}/描き直す`);
  });
});

describe("見せ方の帯 (#2867)", () => {
  it("色味の選ぶ欄が画面の色と 9 意匠を持ち、選ぶと図の配色が替わる", () => {
    開く("presets");

    const select = screen.getByRole("combobox", { name: "図の色味" });
    if (!(select instanceof HTMLSelectElement))
      throw new Error("図の色味が select でない (検査の前提が崩れた)");
    expect([...select.options].map((option) => option.text)).toEqual([
      画面の色の札("ja"),
      ...配色の選択肢.map((theme) => 配色の札(theme, "ja")),
    ]);
    expect([...select.options].map((option) => option.value)).toEqual([
      画面の色,
      ...配色の選択肢,
    ]);

    act(() => {
      fireEvent.change(select, { target: { value: "celadon" } });
    });
    expect(select.value).toBe("celadon");
    expect(screen.getByTestId("catalog-diagram").getAttribute("data-cdl-palette")).toBe(
      "celadon",
    );
    expect(screen.getByTestId("catalog-diagram").getAttribute("data-text-metrics")).toBe("widest");
    expect(screen.getByTestId("catalog-diagram").getAttribute("data-laid-reused")).toBe("true");
    expect(screen.queryAllByText("オプション")).toHaveLength(0);
  });

  it("パターンの選ぶ欄はタブの列にあり、見本と同じ並びで図と記法を替える", () => {
    const { 縦列, item } = パターンを持つ見本();
    開く(縦列);
    選ぶ(item);

    const pattern = screen.getByRole("combobox", { name: "パターン" });
    if (!(pattern instanceof HTMLSelectElement))
      throw new Error("パターンが select でない (検査の前提が崩れた)");
    const patterns = item.patterns ?? [];
    const tabs = document.querySelector(".catalog-preview-tabs");
    const strip = document.querySelector(".catalog-option-strip");
    expect(tabs?.contains(pattern)).toBe(true);
    expect(strip?.contains(pattern)).toBe(false);
    expect([...pattern.options].map((option) => option.text)).toEqual(
      patterns.map((candidate) => patternName(candidate, "ja")),
    );
    expect([...pattern.options].map((option) => option.value)).toEqual(
      patterns.map((candidate) => candidate.名),
    );

    const next = patterns[1];
    if (next === undefined) throw new Error("2 つ目のパターンが無い (検査の前提が崩れた)");
    act(() => {
      fireEvent.change(pattern, { target: { value: next.名 } });
    });
    expect(screen.getByTestId("catalog-diagram").getAttribute("data-diagram-id")).toBe(
      next.diagram.id,
    );
    act(() => screen.getByRole("tab", { name: "コード" }).click());
    const source = next.sourceYaml ?? next.sourceJson;
    if (source === undefined) throw new Error("2 つ目の記法が無い (検査の前提が崩れた)");
    expect(document.querySelector(".catalog-source-code")?.textContent).toContain(source);
  });
});
