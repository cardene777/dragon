// @vitest-environment jsdom

/**
 * 道筋の部品の検査 (#2451)。
 *
 * 見本の詳細 / 更新履歴 / 参加方法 の 3 画面が同じ markup を別々に書いていた。
 * 中身の字は日本語を直に書いていたので、英語で開いても `概要` と出ていた。
 *
 * ここは **部品単体の判断** を固定する。 3 画面で実際に英語が出ることは
 * `tests/onload-locale.spec.ts` が実ブラウザで数える。
 */
import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { LocaleProvider } from "@/lib/useLocale";
import { Breadcrumb, type 道筋の段 } from "./Breadcrumb";

afterEach(() => cleanup());

function 置く(段: 道筋の段[], 言語: "ja" | "en"): HTMLElement {
  window.localStorage.setItem("dragon-locale", 言語);
  const { container } = render(
    <MemoryRouter>
      <LocaleProvider>
        <Breadcrumb 段={段} />
      </LocaleProvider>
    </MemoryRouter>,
  );
  const nav = container.querySelector("nav.nm-crumb");
  if (nav === null) throw new Error("道筋が描かれていない");
  return nav as HTMLElement;
}

describe("道筋 (#2451)", () => {
  it("行き先だけを渡すと、名前の表から字を引く", () => {
    const nav = 置く([{ 行き先: "/" }, { 字: "いまここ" }], "ja");
    expect(nav.textContent).toContain("概要");
  });

  it("英語で開くと英語の名前が出る", () => {
    const nav = 置く([{ 行き先: "/" }, { 行き先: "/catalog" }], "en");
    expect(nav.textContent).toContain("home");
    expect(nav.textContent).toContain("catalog");
    expect(nav.textContent, "英語なのに日本語の名前が出ている").not.toContain("概要");
  });

  it("読み上げの名前も言語で変わる", () => {
    expect(置く([{ 行き先: "/" }], "ja").getAttribute("aria-label")).toBe("道筋");
    cleanup();
    expect(置く([{ 行き先: "/" }], "en").getAttribute("aria-label")).toBe("Breadcrumb");
  });

  it("行き先を省いた段は押せない字として出る", () => {
    置く([{ 行き先: "/" }, { 字: "いまここ" }], "ja");
    expect(screen.getByText("いまここ").tagName).toBe("SPAN");
    expect(screen.getByText("概要").tagName).toBe("A");
  });

  it("段を包まない (見た目が変わらないことの固定)", () => {
    // `.nm-crumb` は直の子を横に並べて間隔を取る。 段を包むと区切りと字が 1 つの枠に入る
    const nav = 置く([{ 行き先: "/" }, { 行き先: "/catalog" }, { 字: "x" }], "ja");
    const 子 = [...nav.children].map((e) => e.tagName);
    expect(子, "区切りと字が直の子として並んでいない").toEqual([
      "A",
      "SPAN",
      "A",
      "SPAN",
      "SPAN",
    ]);
  });

  it("字も行き先も無い段は例外にして落とす", () => {
    expect(() => 置く([{}], "ja")).toThrow(/字も行き先も無い/u);
  });

  it("名前の表に無い行き先は例外にして落とす", () => {
    // 行き先そのものを出す形にすると、英語でも日本語でもない字が黙って画面に残る
    expect(() => 置く([{ 行き先: "/__no_such__" }], "ja")).toThrow(/名前が表に無い/u);
  });

  it("段が 1 つも無い道筋は例外にして落とす", () => {
    expect(() => 置く([], "ja")).toThrow(/段が 1 つも無い/u);
  });
});
