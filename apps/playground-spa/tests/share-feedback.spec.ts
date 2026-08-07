/**
 * 共有ボタンを押した時に画面が変わることの検証 (#1082)。
 *
 * 変更前は URL を写すだけで画面に何も出なかった。
 * エディタ側は `getElementById("editor-share-btn")` を探して文字を差し替えていたが、 その id を
 * 持つ要素はどこにも無く常に `null` = 押しても DOM が 1 byte も変わらない (実測)。
 *
 * ## 「写せたか」 ではなく「画面に出たか」 を見る
 *
 * clipboard に入ったかは元から通っていた。 押した人に見えるものが無いことが欠陥なので、
 * **画面の文字** を見る。
 */
import { test, expect } from "@playwright/test";

const 知らせ = (page: import("@playwright/test").Page) =>
  page.locator("li, [role='status'], [data-radix-toast-announce-exclude]").filter({
    hasText: /コピー/,
  });

test("上端の帯の共有を押すと知らせが出る (#1082)", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  await expect(知らせ(page), "押す前から知らせが出ている").toHaveCount(0);
  await page.locator(".v4-nav-share-btn").click();

  await expect(知らせ(page).first(), "押しても知らせが出ない").toContainText(
    "URL をコピーしました",
    { timeout: 4000 },
  );
  // 写した中身も見る。 知らせだけ出て中身が空だと、 押した人は気付けないまま貼り付ける
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url, `写した URL が違う: ${url}`).toContain("/editor");
});

test("エディタの共有を押すと知らせが出て絵が残る (#1082)", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const btn = page.locator('[data-testid="editor-share"]');
  const 絵の数 = await btn.locator("svg").count();
  expect(絵の数, "共有ボタンに絵が無い (検査が空振りしている)").toBe(1);

  await btn.click();
  await expect(知らせ(page).first(), "押しても知らせが出ない").toContainText(
    "URL をコピーしました",
    { timeout: 4000 },
  );

  // 文字を差し替える形に戻すと絵が消える。 押した後も絵が残ることを見る
  await expect(btn.locator("svg"), "押した後に絵が消えた").toHaveCount(1);

  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url, `共有 URL に本文が載っていない: ${url}`).toContain("#s=");
});

test("写せなかった時は失敗の知らせが出る (#1082)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // clipboard を必ず失敗させる。 権限を与えないだけでは環境によって成功するため、
  // 実装そのものを差し替えて「失敗した時の道」 を確実に通す
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")), readText: () => Promise.resolve("") },
    });
    // 失敗時の逃げ道 (URL を出す窓) は試験を止めるので黙らせる
    window.prompt = () => null;
  });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  await page.locator('[data-testid="editor-share"]').click();
  await expect(知らせ(page).first(), "写せなかったのに知らせが出ない").toContainText(
    "コピーに失敗しました",
    { timeout: 4000 },
  );
});
