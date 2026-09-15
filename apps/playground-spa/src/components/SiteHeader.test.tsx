// @vitest-environment jsdom

/**
 * 配色の切替ボタンが最初の描画から正しい向きを出すことを見る (#2018)。
 *
 * header は頁ごとに作り直される。 配色を描いた後の効果で読むと、暗い配色の人は頁を移るたびに
 * 印と読み上げの文言が 1 回逆になる。 描き終えた後の画面は同じなので、**描画を確定するたびに
 * ボタンの文言を記録し、最初の 1 回を見る**。
 *
 * 記録は `Profiler` の `onRender` で取る。 見るのは header を作った最初の描画 (`mount`) だけで、
 * ここでは呼ばれる。 効果で読む形に戻すと最初の記録が逆向きの文言になって落ちる。
 * 行き先の変化で描き直された描画では呼ばれないことがあるため、そちらを見る検査
 * (`catalog-parts-load-state.test.tsx`) は別の方法で記録している。
 */
import { Profiler } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { SiteHeader } from "./SiteHeader";
import { ToastProvider } from "@/components/Toast";

const 明るくする = "明るい配色に切り替える";
const 暗くする = "暗い配色に切り替える";

/** 描画を確定するたびに記録した、配色の切替ボタンの文言 */
let 描いた文言: string[] = [];

function 切替ボタン(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".v4-nav-theme-toggle");
}

function 開く(): void {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={["/catalog"]}>
        <Profiler
          id="header"
          onRender={() => {
            描いた文言.push(切替ボタン()?.getAttribute("aria-label") ?? "(ボタンが無い)");
          }}
        >
          <SiteHeader />
        </Profiler>
      </MemoryRouter>
    </ToastProvider>,
  );
}

/** 端末の設定を差し替える。 jsdom は `matchMedia` を持たない */
function 端末の設定を暗くする(): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches: query === "(prefers-color-scheme: dark)" }),
  });
}

beforeEach(() => {
  描いた文言 = [];
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  Reflect.deleteProperty(window, "matchMedia");
});

describe("配色の切替ボタンの最初の描画 (#2018)", () => {
  it("暗い配色を保存していると、最初の描画から「明るい配色に切り替える」 を出す", () => {
    localStorage.setItem("v4-theme", "dark");
    開く();
    expect(描いた文言.length, "描画を 1 回も記録していない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    expect(描いた文言[0], "最初の描画が明るい配色の向きになっている").toBe(明るくする);
    expect(
      描いた文言.every((t) => t === 明るくする),
      `途中で逆向きの文言が出た: ${描いた文言.join(" / ")}`,
    ).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("保存が無ければ端末の設定に従う", () => {
    端末の設定を暗くする();
    開く();
    expect(描いた文言[0]).toBe(明るくする);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("保存した配色と端末の設定が食い違う時は保存した配色を使う", () => {
    // 2 つの条件を同時に立てる。 片方だけでは、どちらを先に見ているかを測れない
    localStorage.setItem("v4-theme", "light");
    端末の設定を暗くする();
    開く();
    expect(描いた文言[0]).toBe(暗くする);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("保存が読めない環境では明るい配色を使い、既に付いている `dark` は外さない", () => {
    // 保存が読めない環境で暗くしてから頁を移った形。 読み直した「明るい」 で上書きしない
    document.documentElement.classList.add("dark");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("保存が読めない");
    });
    開く();
    expect(描いた文言[0]).toBe(暗くする);
    expect(document.documentElement.classList.contains("dark"), "付いていた `dark` が外れた").toBe(
      true,
    );
  });

  it("切替ボタンを押すと配色と保存と文言が入れ替わる", () => {
    localStorage.setItem("v4-theme", "dark");
    開く();
    act(() => {
      fireEvent.click(切替ボタン()!);
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("v4-theme")).toBe("light");
    expect(切替ボタン()?.getAttribute("aria-label")).toBe(暗くする);
  });
});
