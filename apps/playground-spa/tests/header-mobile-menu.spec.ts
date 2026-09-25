import { expect, test, type Page } from "@playwright/test";

/*
 * 携帯の幅で行き先へ移れることを見る (#2539)。
 *
 * 帯は幅が足りない時に外側から順に落とす作りで、720px 以下で行き先の列ごと消えていた。
 * **代わりを置いていなかった** ため、携帯で開いた人はどこへも移れなかった。
 *
 * 「行き先の列が消える」 だけを見る検査にはしない = それは直す前から成り立っており、
 * 代わりが在るかどうかを 1 つも見ていない。 見るのは **移れるか** のほう。
 */

const 携帯 = { width: 390, height: 844 };
const 卓上 = { width: 1400, height: 950 };
const 折りたたむ幅 = 720;

const 帯 = "header.v4-nav";
const 開く口 = `${帯} .v4-nav-menu-btn`;
const 面 = "#v4-nav-sheet";
const 面の行き先 = `${面} .v4-nav-sheet-link`;

async function 開く(page: Page, 道: string, 幅: typeof 携帯) {
  await page.setViewportSize(幅);
  await page.goto(道);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
}

/** 画面に本当に出ているか (`display: none` と幅 0 の両方を外す)。 */
async function 見える数(page: Page, 選び方: string): Promise<number> {
  return page.evaluate((s) => {
    return [...document.querySelectorAll(s)].filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
    }).length;
  }, 選び方);
}

test.describe("携帯の幅の帯", () => {
  test("行き先を開く口が 1 つある", async ({ page }) => {
    await 開く(page, "catalog/presets", 携帯);

    // 直す前の状態をそのまま押さえる = 列は消えたままでよい
    expect(await 見える数(page, `${帯} .v4-nav-links .v4-nav-link`), "行き先の列が出ている").toBe(
      0,
    );
    expect(await 見える数(page, 開く口), "行き先を開く口が無い").toBe(1);
  });

  test("押すと行き先と編集画面への入口が出る", async ({ page }) => {
    await 開く(page, "catalog/presets", 携帯);
    await expect(page.locator(面), "押す前から面が出ている").toHaveCount(0);

    await page.locator(開く口).click();
    await expect(page.locator(面)).toBeVisible();

    // 行き先 5 件 + GitHub = 6 件。 数は `SiteHeader.tsx` の `帯に出す行き先` から来る
    expect(await 見える数(page, 面の行き先), "行き先が足りない").toBe(6);
    await expect(page.locator(`${面} .v4-nav-sheet-cta`), "編集画面への入口が無い").toBeVisible();

    // 空振り防止 = 字が 1 つも無い面を「出ている」 と数えない
    const 字 = await page.locator(面).innerText();
    expect(字.trim().length, "面に字が 1 つも無い").toBeGreaterThan(0);
  });

  test("行き先を押すとその画面へ移り、面が閉じる", async ({ page }) => {
    await 開く(page, "catalog/presets", 携帯);
    await page.locator(開く口).click();
    await expect(page.locator(面)).toBeVisible();

    await page.locator(面の行き先).filter({ hasText: /使い方|docs/i }).first().click();
    await page.waitForTimeout(700);

    expect(page.url(), "画面が移っていない").toContain("/docs");
    await expect(page.locator(面), "移った後も面が残っている").toHaveCount(0);
  });

  test("面の外を押すと閉じる", async ({ page }) => {
    await 開く(page, "catalog/presets", 携帯);
    await page.locator(開く口).click();
    await expect(page.locator(面)).toBeVisible();

    // 面の下を押す。 決め打ちの座標だと面の上に当たる = 面は帯のすぐ下から下へ伸びており、
    // 行き先の数で高さが変わる (7 件で約 330px)
    const 面の枠 = await page.locator(面).boundingBox();
    expect(面の枠, "面の位置が取れない").not.toBeNull();
    await page.mouse.click(195, (面の枠?.y ?? 0) + (面の枠?.height ?? 0) + 60);
    await expect(page.locator(面), "外を押しても閉じない").toHaveCount(0);
  });

  test("開いたまま画面を広げると閉じる", async ({ page }) => {
    await 開く(page, "catalog/presets", 携帯);
    await page.locator(開く口).click();
    await expect(page.locator(面)).toBeVisible();

    // 広げると開く口が消えるので、面だけ残ると閉じる手段が画面から無くなる
    await page.setViewportSize(卓上);
    await page.waitForTimeout(500);
    await expect(page.locator(面), "広げても面が残っている").toHaveCount(0);
  });

  test("横にはみ出さない", async ({ page }) => {
    await 開く(page, "catalog/presets", 携帯);
    await page.locator(開く口).click();
    await page.waitForTimeout(300);

    const はみ出し = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(はみ出し, "横にはみ出している").toBeLessThanOrEqual(0);
  });
});

test.describe("広い幅の帯", () => {
  test("行き先はそのまま並び、開く口は出ない", async ({ page }) => {
    await 開く(page, "catalog/presets", 卓上);

    expect(await 見える数(page, `${帯} .v4-nav-links .v4-nav-link`), "行き先が並んでいない").toBe(
      6,
    );
    expect(await 見える数(page, 開く口), "広い幅で開く口が出ている").toBe(0);
    expect(await 見える数(page, `${帯} .v4-nav-cta`), "編集画面への入口が消えている").toBe(1);
  });

  test("折りたたみに切り替わる幅が、見た目の指定と揃っている", async ({ page }) => {
    // 実装と検査で別の値を持つと、片方だけ直した時に気付けない
    await 開く(page, "catalog/presets", { width: 折りたたむ幅, height: 844 });
    expect(await 見える数(page, 開く口), `${折りたたむ幅}px で開く口が出ていない`).toBe(1);

    await page.setViewportSize({ width: 折りたたむ幅 + 1, height: 844 });
    await page.waitForTimeout(300);
    expect(await 見える数(page, 開く口), `${折りたたむ幅 + 1}px で開く口が残っている`).toBe(0);
  });
});

test.describe("帯の共有", () => {
  test("帯から写しのボタンが消えている", async ({ page }) => {
    for (const 幅 of [携帯, 卓上]) {
      await 開く(page, "editor", 幅);
      await expect(
        page.locator(`${帯} .v4-nav-share-btn`),
        `幅 ${幅.width} で帯に写しのボタンが残っている`,
      ).toHaveCount(0);
    }
  });

  test("編集画面の側の共有は残っている (対照)", async ({ page }) => {
    await 開く(page, "editor", 卓上);
    await page.waitForTimeout(1500);
    // 帯から外したのは帯の分だけ = 編集画面の共有まで消していないことを見る
    await expect(page.locator('[data-testid="editor-share"]')).toHaveCount(1);
  });
});
