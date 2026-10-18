/**
 * 更新履歴と使い方が、版や件数を人手で書かずに現在の内容を出すことの検証 (#2929)。
 *
 * 版は `packages/dragon/package.json` から引いた値を Vite が `__DRAGON_VERSION__` に差し込む。
 * ここでは同じ値を差し込んで実際に画面を描き、版を上げた時に古い字が残る形を落とす。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/lib/useLocale";
import { DocsPage } from "./DocsPage";
import { ReleaseNotesPage } from "./ReleaseNotesPage";

const packageJson = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../../../packages/dragon/package.json", import.meta.url)),
    "utf8",
  ),
) as { version?: string };

if (typeof packageJson.version !== "string" || packageJson.version === "") {
  throw new Error("packages/dragon/package.json から version を読めない");
}

const 版 = `v${packageJson.version.split(".").slice(0, 2).join(".")}`;
const CHANGELOG_URL = "https://github.com/cardene777/dragon/blob/main/CHANGELOG.md";

beforeAll(() => {
  vi.stubGlobal("__DRAGON_VERSION__", packageJson.version);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function 更新履歴(locale: "ja" | "en"): string {
  return renderToStaticMarkup(
    <LocaleProvider 初期値={locale}>
      <MemoryRouter initialEntries={["/release-notes"]}>
        <ReleaseNotesPage />
      </MemoryRouter>
    </LocaleProvider>,
  );
}

function 使い方(locale: "ja" | "en"): string {
  return renderToStaticMarkup(
    <LocaleProvider 初期値={locale}>
      <MemoryRouter initialEntries={["/docs"]}>
        <DocsPage />
      </MemoryRouter>
    </LocaleProvider>,
  );
}

/** 使い方の各節の末尾にある行き先と字を、描画結果から取り出す。 */
function 節の出口(html: string): Array<{ href: string; 字: string }> {
  const out: Array<{ href: string; 字: string }> = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gu)) {
    const 属性 = m[1] ?? "";
    if (!/class="[^"]*docs-sec-cta[^"]*"/u.test(属性)) continue;
    const href = /href="([^"]+)"/u.exec(属性)?.[1];
    if (href === undefined) continue;
    out.push({ href, 字: (m[2] ?? "").replace(/<[^>]+>/gu, "").trim() });
  }
  return out;
}

describe("更新履歴と使い方の現在値 (#2929)", () => {
  it.each(["ja", "en"] as const)("%s の更新履歴と使い方が package の版を出す", (locale) => {
    const release = 更新履歴(locale);
    const docs = 使い方(locale);
    expect(release, "更新履歴に package の版が無い").toContain(版);
    expect(docs, "使い方に package の版が無い").toContain(版);
  });

  it("更新履歴は古いカードを持たず、CHANGELOG への案内が 1 つだけある", () => {
    const html = 更新履歴("ja");
    expect(html, "古いリリースカードが残っている").not.toContain("nm-preset-card");
    expect(html, "古い版が残っている").not.toMatch(/v0\.5(?!\d)/u);
    expect(
      html.split(`href="${CHANGELOG_URL}"`).length - 1,
      "CHANGELOG への案内が 1 つに定まらない",
    ).toBe(1);
  });

  it.each([
    ["ja", ["基本要素", "高位 API", "実用例"], ["5 つの基本要素", "6 種類の高位 API", "9 実用例"]],
    ["en", ["Building blocks", "Higher-level APIs", "Worked examples"], ["Five building blocks", "Six higher-level kinds", "Nine worked examples"]],
  ] as const)("%s の使い方は件数を書かない節名を出す", (locale, 現在, 古い) => {
    const html = 使い方(locale);
    for (const 題 of 現在) expect(html, `節「${題}」 が無い`).toContain(題);
    for (const 題 of 古い) expect(html, `古い節「${題}」 が残っている`).not.toContain(題);
  });

  it("各節の出口は、字が示す行き先と一致する", () => {
    expect(節の出口(使い方("ja"))).toEqual([
      { href: "/editor", 字: "編集画面で試す →" },
      { href: "/docs#primitives", 字: "続き → 基本要素" },
      { href: "/catalog/primitives", 字: "基本要素の見本を見る →" },
      { href: "/catalog/presets", 字: "ひな形の一覧を見る →" },
      { href: "/catalog/cookbook", 字: "実用例の一覧を見る →" },
      { href: "/catalog", 字: "図の一覧を見る →" },
      { href: "/catalog/animation", 字: "動く図の見本を見る →" },
    ]);
  });
});
