
/**
 * 分類の日本語の呼び名の出どころが 1 つであることの検証 (#1788)。
 *
 * 直す前は `CATEGORY_JA_LABEL` という同じ表が 2 つの画面 file に丸ごと置かれ、
 * `CATEGORIES[].label` を上書きしていた (片方には `SSOT` と書いてあったが唯一の出どころではない)。
 * #1787 で `テキスト DSL` を `テキスト記法` に直した時、同じ 1 語を 2 箇所で直している。
 *
 * 上書きの表は 9 件しか持たず、分類は 11 件ある。 足した分類は上書きから漏れて別の呼び名が出る。
 *
 * 呼び名は `CATEGORIES[].label` だけが持ち、2 つの画面はそこから引く。
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router";
import { CATEGORIES } from "@/lib/catalog";
import { ToastProvider } from "@/components/Toast";
import { CatalogIndexPage } from "./CatalogIndexPage";
import { CategoryPage } from "./CategoryPage";
import {
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
afterEach(() => restoreIntersectionObserver());

const 画面の置き場 = fileURLToPath(new URL(".", import.meta.url));

/**
 * 画面 file のうち、分類の鍵を object の鍵として持つもの。 本番と植え込み対照が同じ関数を使う。
 *
 * 探す形は `"presets":` のような object の鍵。 呼び名の表を画面側に持つとこの形になる。
 */
export function 呼び名の表を持つ所(src: string, file: string, 鍵: string[]): string[] {
  return 鍵
    .filter((k) => new RegExp(`["']${k.replace(/-/g, "\\-")}["']\\s*:`).test(src))
    .map((k) => `${file}: "${k}": を鍵に持っている`);
}

/** 描いた画面から、その class を持つ要素の中身を順に取り出す */
function 見出しの字(html: string, cls: string): string[] {
  return [...html.matchAll(new RegExp(`class="${cls}"[^>]*>([^<]*)<`, "g"))].map((m) => m[1]!);
}

function 画面のfile一覧(): string[] {
  return readdirSync(画面の置き場).filter((f) => f.endsWith(".tsx") && !f.includes(".test."));
}

function 一覧の画面(): string {
  return renderToStaticMarkup(
    <ToastProvider>
      <MemoryRouter initialEntries={["/catalog"]}>
        <Routes>
          <Route path="/catalog" element={<CatalogIndexPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

function 分類の画面(slug: string): string {
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

describe("分類の呼び名の出どころ (#1788)", () => {
  it("呼び名の表を画面 file が持っていない", () => {
    const 鍵 = CATEGORIES.map((c) => c.slug);
    expect(鍵.length, "分類を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(10);
    const files = 画面のfile一覧();
    expect(files.length, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    const 持つ所 = files.flatMap((f) =>
      呼び名の表を持つ所(readFileSync(画面の置き場 + f, "utf8"), f, 鍵),
    );
    expect(持つ所, `画面 file が分類の鍵を持っている:\n${持つ所.join("\n")}`).toEqual([]);
  });

  it("呼び名の表を拾える (植え込み対照)", () => {
    const 鍵 = CATEGORIES.map((c) => c.slug);
    const 元 = `const x = CATEGORIES.map((c) => c.label);`;
    expect(呼び名の表を持つ所(元, "元.tsx", 鍵), "土台に表が混ざっている").toEqual([]);
    const 植え = `const L = { "presets": "プリセット", "text-dsl": "テキスト記法" };`;
    expect(呼び名の表を持つ所(植え, "植え.tsx", 鍵)).toHaveLength(2);
  });

  it("一覧の画面が CATEGORIES の呼び名をそのまま出す", () => {
    // **含むかどうかでは見ない**。 見本の名前が呼び名を字として含む (`テキスト記法のシーケンス`) ため、
    // 画面全体に対する部分一致だと呼び名がずれていても通ってしまう。 見出しの中身と丸ごと突き合わせる
    const 出た = 見出しの字(一覧の画面(), "catalog-index-card-title");
    expect(出た.length, "見出しを 1 つも読めていない (検査が空振りしている)").toBe(CATEGORIES.length);
    expect(出た, "一覧の画面の呼び名が CATEGORIES と違う").toEqual(CATEGORIES.map((c) => c.label));
  });

  it("分類の画面が CATEGORIES の呼び名をそのまま出す", () => {
    // 11 件すべてを描く。 一部だけ見ると、見ていない分類の呼び名がずれても気付けない
    const 違う: string[] = [];
    let 読めた = 0;
    for (const c of CATEGORIES) {
      const 出た = 見出しの字(分類の画面(c.slug), "catalog-title");
      if (出た.length === 1) 読めた += 1;
      if (出た[0] !== c.label) 違う.push(`${c.slug}: ${出た[0] ?? "(見出しを読めない)"} ≠ ${c.label}`);
    }
    expect(読めた, "見出しを読めた分類の数が足りない (検査が空振りしている)").toBe(CATEGORIES.length);
    expect(違う, `分類の画面の呼び名が CATEGORIES と違う:\n${違う.join("\n")}`).toEqual([]);
  });

  it("分類名が呼び名の言い換えになっていない", () => {
    // 呼び名のすぐ上に分類名が出るため、同じ字だと同じことを 2 度読ませる (#1783 と同じ決まり)
    const なぞる = CATEGORIES.filter((c) => c.eyebrow === c.label).map(
      (c) => `${c.slug}: ${c.eyebrow}`,
    );
    expect(なぞる, `分類名が呼び名と同じ: ${なぞる.join(", ")}`).toEqual([]);
  });
});
