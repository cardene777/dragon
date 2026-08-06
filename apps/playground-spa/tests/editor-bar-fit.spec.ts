/**
 * 操作列が画面に収まっていることの検証 (#1063)。
 *
 * 文字で書いたボタンが 12 個並び、合計 811px に対して操作列の幅は 491px しかなかった。
 * 320px が画面の外にあり、等倍表示と拡大縮小が押せない状態だった
 * (実測 = 1440px 幅で 107px、1280px 幅で 174px、1100px 幅で 208px のはみ出し)。
 *
 * アイコンにすると 1 個 30px になり、10 個で 300px に収まる。
 *
 * ## 覆っていない範囲
 *
 * **960px 幅ではプレビュー側が 55px はみ出す**。ボタン 10 個 (300px) + 倍率表示 (44px) が
 * 操作列 393px を超えるため、名前を 0 まで縮めても足りない。操作の数を減らすか、
 * 畳んで隠す設計が要る (どちらも `#1063` の範囲外)。1280px 以上を対象にする。
 */
import { test, expect } from "@playwright/test";

/** 画面にある操作列を全部測る (左 = 記法欄 / 右 = プレビュー)。 */
async function bars(page: import("@playwright/test").Page) {
  return await page.evaluate(() =>
    [...document.querySelectorAll(".v4-editor-bar")].map((bar, i) => ({
      名: i === 0 ? "記法欄" : "プレビュー",
      幅: Math.round(bar.getBoundingClientRect().width),
      // `scrollWidth - clientWidth` が「画面の外に出ている量」
      はみ出し: Math.round(bar.scrollWidth - bar.clientWidth),
    })),
  );
}

async function openEditor(page: import("@playwright/test").Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

for (const width of [1440, 1280]) {
  test(`画面幅 ${width}px で操作列が収まる`, async ({ page }) => {
    await openEditor(page, width);
    const 列 = await bars(page);
    expect(列.length, "操作列を 1 つも測れていない").toBeGreaterThan(0);
    for (const b of 列) {
      expect(b.はみ出し, `${b.名} が ${b.はみ出し}px はみ出している (幅 ${b.幅}px)`).toBe(0);
    }
  });
}

test("操作の名前が読み上げに残っている", async ({ page }) => {
  // アイコンには文字が無い。 名前を付けないと「ボタン」 としか読まれず、
  // 何をするか分からなくなる
  await openEditor(page, 1440);
  const 名無し = await page.evaluate(() =>
    [...document.querySelectorAll(".v4-editor-bar-btn")]
      .filter((el) => {
        const 名 = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim();
        return 名.length === 0;
      })
      .map((el) => el.getAttribute("data-testid") ?? el.className),
  );
  expect(名無し, `名前を持たないボタンがある: ${名無し.join(", ")}`).toEqual([]);
});

test("押す前に何が起きるか分かる説明が付いている", async ({ page }) => {
  // アイコンだけでは意味が読めない操作がある (共有 / 位置を表示)。
  // ホバーで出る説明が唯一の手がかりになる
  await openEditor(page, 1440);
  const 説明無し = await page.evaluate(() =>
    [...document.querySelectorAll(".v4-editor-bar-btn")]
      .filter((el) => (el.getAttribute("title") ?? "").trim().length === 0)
      .map((el) => el.getAttribute("aria-label") ?? el.getAttribute("data-testid") ?? el.className),
  );
  expect(説明無し, `説明を持たないボタンがある: ${説明無し.join(", ")}`).toEqual([]);
});

test("アイコンのボタンが押せる大きさを保っている", async ({ page }) => {
  // 幅を中身任せにすると、 線の少ないアイコンだけ狭くなって押しにくい。
  // 正方形で揃える
  await openEditor(page, 1440);
  const 小さい = await page.evaluate(() =>
    [...document.querySelectorAll(".v4-editor-bar-btn-icon")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { 名: el.getAttribute("aria-label") ?? "?", w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((x) => x.w < 28 || x.h < 28),
  );
  expect(小さい, `押しにくい大きさのボタンがある: ${JSON.stringify(小さい)}`).toEqual([]);
});
