/**
 * 更新履歴の画面が出す見本の数が実物と合うことの検証 (#1806)。
 *
 * 直す前は札が `12 {呼び名}` と字で書いてあり、実物 (`PRESETS`) は 21 件だった。
 * 説明文も 12 個の名前を手で並べており、実物の一部でしかない。
 *
 * この画面は見出しが「最新リリース」、説明が「いまの最新は v0.5」 なので、
 * 読み手は「今これが手に入る」 と読む。 過去の版の記録ではないため、今の数を出す。
 *
 * **説明書と違って数を落とさない** (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
 * 動いている頁で実物がその場にあるので、`PRESETS.length` から出せば書き写しにならない。
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router";
import { PRESETS } from "@/lib/presets";
import { CATEGORIES } from "@/lib/catalog";
import { ToastProvider } from "@/components/Toast";
import { ReleaseNotesPage } from "./ReleaseNotesPage";

/** 見本の分類の呼び名。 出どころは `CATEGORIES[].label` 1 つ (#1788) */
const 呼び名 = CATEGORIES.find((c) => c.slug === "presets")?.label ?? "";

function 更新履歴の画面(): string {
  return renderToStaticMarkup(
    <ToastProvider>
      <MemoryRouter initialEntries={["/release-notes"]}>
        <Routes>
          <Route path="/release-notes" element={<ReleaseNotesPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

/** 札の中の「数 + 呼び名」 から数を取り出す。 本番と植え込み対照が同じ関数を使う */
export function 札の数(html: string, 語: string): number | null {
  const m = html.match(new RegExp(`class="nm-preset-tag"[^>]*>\\s*([0-9]+)\\s*${語}\\s*<`));
  return m ? Number(m[1]) : null;
}

/**
 * 中黒で 3 つ以上つないだ並びを返す。
 *
 * **語ではなく形で見る** = 「12 種類の見本 (…)」 のような言い方を字で書くと、
 * 言い換えた日に探し方が当たらなくなる。 手で並べた一覧は中黒の連なりという形を持つ。
 */
export function 中黒の並び(文: string): string[] {
  return [...文.matchAll(/[^\s()（）、。<>]+(?:・[^\s()（）、。<>]+){2,}/g)].map((m) => m[0]);
}

describe("更新履歴の画面が出す見本の数 (#1806)", () => {
  it("札の数が PRESETS と一致する", () => {
    expect(PRESETS.length, "見本を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(10);
    expect(呼び名, "分類の呼び名を引けていない (検査が空振りしている)").not.toBe("");
    const 出た = 札の数(更新履歴の画面(), 呼び名);
    console.log(`[更新履歴の札] 実物=${PRESETS.length} 画面=${出た}`);
    expect(出た, "札を読めていない (検査が空振りしている)").not.toBeNull();
    expect(出た, "画面の札の数が PRESETS と違う").toBe(PRESETS.length);
  });

  it("札の数を取り出せる (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る
    expect(札の数(`<span class="nm-preset-tag">21 ${呼び名}</span>`, 呼び名)).toBe(21);
    expect(札の数(`<span class="nm-preset-tag">12 ${呼び名}</span>`, 呼び名)).toBe(12);
    expect(札の数(`<span class="other">21 ${呼び名}</span>`, 呼び名), "別の札を読んでいる").toBeNull();
    expect(札の数("<span>札が無い</span>", 呼び名), "札が無いのに数を返している").toBeNull();
  });

  it("説明文が見本の名前を手で並べていない", () => {
    const html = 更新履歴の画面();
    expect(html.length, "画面を描けていない (検査が空振りしている)").toBeGreaterThan(500);
    const 並び = 中黒の並び(html);
    console.log(`[更新履歴の説明文] 中黒で 3 つ以上つないだ並び=${並び.length}`);
    expect(並び, `見本の名前を手で並べている:\n${並び.join("\n")}`).toEqual([]);
  });

  it("中黒の並びを拾える (植え込み対照)", () => {
    expect(中黒の並び("シーケンス図・フロー・トポロジー図・ER図")).toEqual([
      "シーケンス図・フロー・トポロジー図・ER図",
    ]);
    // 2 つだけつないだ形は一覧ではないので拾わない (対象外の対照)
    expect(中黒の並び("明暗・2 通り")).toEqual([]);
    expect(中黒の並び("中黒を使わない文")).toEqual([]);
  });

  it("札の代わりに見本の一覧へ送る行き先がある", () => {
    const html = 更新履歴の画面();
    const 行き先 = [...html.matchAll(/href="(\/catalog[^"]*)"/g)].map((m) => m[1]!);
    console.log(`[更新履歴の行き先] catalog へ送る所=${行き先.length}`);
    expect(行き先, "見本の一覧へ送る行き先が無い").toContain("/catalog/presets");
  });
});
