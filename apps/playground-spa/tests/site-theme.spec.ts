import { test, expect, type Page } from "@playwright/test";
import { THEMES, type DslTheme } from "@cardenelabs/dragon";

import { contrast } from "./helpers/pixel-contrast";
import { color } from "./helpers/fixed-theme-checks";

/**
 * サイトの見た目を住所の `?theme=` で決める (#2962)。
 *
 * 確かめるのは 4 つ。
 *
 * 1. `?theme=` の名前が html の `data-site-theme` に出る。 書かなければ活版
 * 2. 付けるのは外部 script で、本体の script が走らなくても付いている (描く前に付く)
 * 3. `color-scheme` と編集画面の記述欄の明暗は、意匠の地から決まる
 * 4. 意匠を書いていない見本は、表紙 / 見本帳の一覧と拡大 / 編集画面の本図と重ねた部品で
 *    `?theme=` の意匠で描かれる
 *
 * 明暗の判定は値の表を写さず、描かれた地の色から導く = 表の値が変わっても検査はそのまま。
 */

/** 地に白い字と黒い字を置き、対比の高い方が白なら暗い地 */
const 地の明暗 = (地: string): "dark" | "light" => {
  const rgb = color(地);
  return contrast(rgb, [255, 255, 255]) > contrast(rgb, [0, 0, 0]) ? "dark" : "light";
};

async function 開く(page: Page, 行き先: string): Promise<void> {
  await page.goto(行き先);
  await page.waitForSelector("#root > *", { state: "attached", timeout: 20_000 });
}

const サイトの意匠 = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute("data-site-theme"));

test.describe("住所の `?theme=` で意匠を決める (#2962)", () => {
  test("`?theme=` を付けずに開くと html の `data-site-theme` が活版", async ({ page }) => {
    await 開く(page, "");
    expect(await サイトの意匠(page)).toBe("letterpress");
  });

  for (const 意匠 of THEMES) {
    test(`\`?theme=${意匠}\` で開くと html の \`data-site-theme\` が ${意匠}`, async ({ page }) => {
      await 開く(page, `catalog?theme=${意匠}`);
      expect(await サイトの意匠(page)).toBe(意匠);
    });
  }

  test("本体の script を止めても、外部 script が描く前に意匠を付けている", async ({ page }) => {
    // 意匠を付ける script 以外の script を全部止める = React は 1 度も描かない
    await page.route("**/*", (route) => {
      const request = route.request();
      if (request.resourceType() === "script" && !request.url().includes("site-theme.js")) {
        return route.abort();
      }
      return route.continue();
    });
    await page.goto("editor?theme=neon");
    expect(await page.locator("#root > *").count(), "本体が描いている (止められていない)").toBe(0);
    expect(await サイトの意匠(page)).toBe("neon");
  });
});

test.describe("明暗は意匠の地から決まる (#2962)", () => {
  for (const 意匠 of THEMES) {
    test(`${意匠}: html の \`color-scheme\` が地の明暗と一致する`, async ({ page }) => {
      await 開く(page, `?theme=${意匠}`);
      const { 明暗, 地 } = await page.evaluate(() => ({
        明暗: getComputedStyle(document.documentElement).colorScheme,
        地: getComputedStyle(document.body).backgroundColor,
      }));
      expect(明暗, `${意匠} の地 ${地}`).toBe(地の明暗(地));
    });
  }

  for (const 意匠 of THEMES) {
    test(`${意匠}: 編集画面の記述欄は地の明暗で CodeMirror を描く`, async ({ page }) => {
      await 開く(page, `editor?theme=${意匠}`);
      await page.waitForSelector(".cm-editor", { timeout: 20_000 });
      const 地 = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      // html の明暗を逆にしても記述欄が変わらない = 継いだ値ではなく CodeMirror に渡した明暗
      const 記述欄 = await page.evaluate((逆) => {
        document.documentElement.style.colorScheme = 逆;
        const 値 = getComputedStyle(document.querySelector(".cm-editor")!).colorScheme;
        document.documentElement.style.colorScheme = "";
        return 値;
      }, 地の明暗(地) === "dark" ? "light" : "dark");
      expect(記述欄, `${意匠} の地 ${地}`).toBe(地の明暗(地));
    });
  }
});

/** 意匠を書いていない見本を描く場所。 どの場所も同じ道 (書いた意匠、無ければサイトの意匠) を通る */
const 確かめる意匠: readonly DslTheme[] = ["terminal", "blueprint"];

async function 図の意匠(page: Page, 範囲: string): Promise<string[]> {
  await page.waitForSelector(`${範囲} svg[data-cdl-stage]`, { timeout: 20_000 });
  return page
    .locator(`${範囲} svg[data-cdl-stage]`)
    .evaluateAll((stages) => stages.map((s) => s.getAttribute("data-cdl-palette") ?? "(無し)"));
}

test.describe("意匠を書いていない見本は `?theme=` の意匠で描く (#2962)", () => {
  for (const 意匠 of 確かめる意匠) {
    test(`${意匠}: 表紙の図`, async ({ page }) => {
      await 開く(page, `?theme=${意匠}`);
      const 図 = await 図の意匠(page, "#root");
      expect(図.length, "表紙に図が無い (検査が空振りしている)").toBeGreaterThan(0);
      expect(図.filter((p) => p !== 意匠)).toEqual([]);
    });

    test(`${意匠}: 見本帳の一覧と拡大の図`, async ({ page }) => {
      await 開く(page, `catalog/presets?theme=${意匠}`);
      expect(await 図の意匠(page, ".catalog-preview-stage"), "一覧の図").toEqual([意匠]);
      await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
      expect(await 図の意匠(page, ".cdl-modal-content"), "拡大の図").toEqual([意匠]);
    });

    test(`${意匠}: 編集画面の本図と重ねた部品`, async ({ page }) => {
      await 開く(page, `editor?theme=${意匠}`);
      expect(await 図の意匠(page, ".v4-editor-svg-wrap > [data-cdl-diagram]"), "本図").toEqual([意匠]);
      await page.getByTestId("editor-parts-tab").click();
      await page.getByTestId("editor-part-item-parts-achievement").click();
      expect(await 図の意匠(page, "[data-overlay-part]"), "重ねた部品").toEqual([意匠]);
    });
  }
});
