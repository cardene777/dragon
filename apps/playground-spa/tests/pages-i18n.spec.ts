import { test, expect } from "@playwright/test";

/**
 * HomePage と 404 page が言語切替に追随することを固定する (#386)。
 *
 * hero だけが対応済で、 features / quickstart / examples / closing-cta は日本語が直書きされて
 * いた。 英語で開いても日本語が出る状態だった。
 *
 * 判定は「英語で開いた時に日本語が 1 文字も出ない」。 個々の文言を照合すると、 文面を直すたびに
 * test も直す必要があり、 追随漏れを見る目的から外れる。
 */

/** 画面に出ている文字のうち、 日本語 (ひらがな / カタカナ / 漢字) を含むもの。 */
const japaneseTexts = (page: import("@playwright/test").Page, selector: string) =>
  page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return ["__no_root__"];
    const out: string[] = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walk.nextNode())) {
      const t = (n.textContent ?? "").trim();
      // `<pre>` の中は DSL の見本なので対象外 (題名が日本語のままで良い)。
      if (n.parentElement?.closest("pre")) continue;
      // 図の中身も対象外。 catalog の図 (preset ER の「エンティティ」 等) は日本語で書かれて
      // おり、 図の翻訳は HomePage の文言とは別の話 (catalog 全体の課題)。
      if (n.parentElement?.closest("[data-cdl-diagram]")) continue;
      // 範囲指定だと `々` `〆` `〇` や半角カタカナ、 拡張漢字、 `㈱` `㍻` 等の互換文字を
      // 取りこぼす。 script で見る (`Script_Extensions` は互換文字と `〆` も含む)。
      if (t && /[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u.test(t)) out.push(t);
    }
    return out;
  }, selector);

const SECTIONS = [".features", ".quickstart", ".examples", ".closing-cta"];

test.describe("HomePage の言語切替 (#386)", () => {
  test("英語で開くと日本語が出ない", async ({ page }) => {
    await page.goto("?lang=en", { waitUntil: "networkidle" });
    await page.waitForSelector(".features", { timeout: 15000 });
    for (const sel of SECTIONS) {
      const jp = await japaneseTexts(page, sel);
      expect(jp, `${sel} に日本語が残っている`).toEqual([]);
    }
  });

  test("英語で開くと図の説明文 (aria-label) も英語になる", async ({ page }) => {
    // text node だけを見ると属性が漏れる。 読み上げだけ日本語になる回帰を別に見る。
    await page.goto("?lang=en", { waitUntil: "networkidle" });
    const label = await page.getAttribute('.hero-demo svg[role="img"]', "aria-label");
    expect(label, "図の説明文が無い").toBeTruthy();
    expect(/[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u.test(label ?? ""),
      `図の説明文に日本語が残っている: ${label}`).toBe(false);
  });

  test("日本語で開くと日本語が出る", async ({ page }) => {
    // 上の test だけだと「section が描かれていない」 状態でも通る。 出ることを別に見る。
    await page.goto("?lang=ja", { waitUntil: "networkidle" });
    await page.waitForSelector(".features", { timeout: 15000 });
    for (const sel of SECTIONS) {
      const jp = await japaneseTexts(page, sel);
      expect(jp.length, `${sel} に日本語が 1 件も無い`).toBeGreaterThan(0);
    }
  });
});

test.describe("404 page の言語切替 (#386 段階 2)", () => {
  test("英語で開くと日本語が出ない", async ({ page }) => {
    await page.goto("__no_such_page__?lang=en", { waitUntil: "networkidle" });
    await page.waitForSelector(".v4-404", { timeout: 15000 });
    expect(await japaneseTexts(page, ".v4-404"), "404 page に日本語が残っている").toEqual([]);
  });

  test("日本語で開くと日本語が出る", async ({ page }) => {
    // 上の test だけだと page が描かれていない状態でも通る。
    await page.goto("__no_such_page__?lang=ja", { waitUntil: "networkidle" });
    await page.waitForSelector(".v4-404", { timeout: 15000 });
    expect((await japaneseTexts(page, ".v4-404")).length, "404 page に日本語が 1 件も無い").toBeGreaterThan(0);
  });
});
