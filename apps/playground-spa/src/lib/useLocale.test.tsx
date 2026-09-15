// @vitest-environment jsdom

/**
 * 開いた時の言語が最初の描画から出ることを見る (#2018)。
 *
 * 言語は描いた後の効果で読むと、英語を選んだ人にも最初の 1 回は日本語の画面が出る。
 * 最終的な画面は同じになるので、**描画ごとに出た言語を記録し、最初の 1 回を見る**。
 * 描き終えた後の値だけを見ると、効果で読む形に戻しても通ってしまう。
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { LocaleProvider, useLocale } from "./useLocale";
import type { Locale } from "./i18n";

/** 描画ごとに出た言語 */
let 描いた言語: Locale[] = [];

/** 描くたびに言語を記録する部品 (hook の規則が部品と見なすよう、名前を大文字の英字で始める) */
function LocaleRecorder(): React.ReactElement {
  const [locale, setLocale] = useLocale();
  描いた言語.push(locale);
  return (
    <button type="button" onClick={() => setLocale(locale === "ja" ? "en" : "ja")}>
      切り替える
    </button>
  );
}

function 開く(行き先: string): void {
  window.history.replaceState(null, "", 行き先);
  render(
    <LocaleProvider>
      <LocaleRecorder />
    </LocaleProvider>,
  );
}

beforeEach(() => {
  描いた言語 = [];
  localStorage.clear();
  document.documentElement.setAttribute("lang", "ja");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("開いた時の言語 (#2018)", () => {
  it("URL の `?lang=en` で開くと、最初の描画から英語が出る", () => {
    開く("/?lang=en");
    expect(描いた言語.length, "1 回も描かれていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(描いた言語[0], "最初の描画が英語ではない").toBe("en");
    expect(
      描いた言語.every((l) => l === "en"),
      `途中で別の言語が出た: ${描いた言語.join(",")}`,
    ).toBe(true);
  });

  it("保存した言語で開くと、最初の描画からその言語が出る", () => {
    localStorage.setItem("dragon-locale", "en");
    開く("/");
    expect(描いた言語[0], "最初の描画が保存した言語ではない").toBe("en");
  });

  it("URL と保存した言語が食い違う時は URL を使う", () => {
    // 2 つの条件を同時に立てる。 片方だけでは、どちらを先に見ているかを測れない。
    // URL 側を既定 (ja) と違う値にするのは、保存を先に見る形と既定のまま描く形の両方で落とすため
    localStorage.setItem("dragon-locale", "ja");
    開く("/?lang=en");
    expect(描いた言語[0]).toBe("en");
  });

  it("知らない値しか無い時は日本語を使う", () => {
    localStorage.setItem("dragon-locale", "de");
    開く("/?lang=fr");
    expect(描いた言語[0]).toBe("ja");
  });

  it("html の `lang` は開いた時の言語になり、切り替えると追従して保存される", () => {
    開く("/?lang=en");
    expect(document.documentElement.getAttribute("lang")).toBe("en");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "切り替える" }));
    });
    expect(document.documentElement.getAttribute("lang")).toBe("ja");
    expect(localStorage.getItem("dragon-locale")).toBe("ja");
  });
});
