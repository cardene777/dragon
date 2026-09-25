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

/*
 * 上端の帯の共有は #2539 で外した。
 * 帯の右端は携帯でも残る場所で、URL はブラウザの URL 欄にそのまま出ているため置く価値が薄い。
 * 編集画面の側の共有は URL に図の中身が乗るので残す (以下 3 件)。
 */

test("エディタの共有を押すと知らせが出て絵が残る (#1082)", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("editor");
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

test("写す口が無い環境でも失敗の知らせが出る (#1082)", async ({ page }) => {
  // Round 1 review の指摘。 secure context でない環境や塞がれた埋め込みでは
  // `navigator.clipboard` 自体が `undefined` で、 参照した瞬間に同期例外になる。
  // `.then().catch()` 形だと Promise が作られず知らせも逃げ道も出ない = 直す前と同じ無反応に戻る
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    window.prompt = () => null;
  });
  await page.goto("editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  await page.locator('[data-testid="editor-share"]').click();
  await expect(知らせ(page).first(), "写す口が無いのに知らせが出ない").toContainText(
    "コピーに失敗しました",
    { timeout: 4000 },
  );
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
  await page.goto("editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  await page.locator('[data-testid="editor-share"]').click();
  await expect(知らせ(page).first(), "写せなかったのに知らせが出ない").toContainText(
    "コピーに失敗しました",
    { timeout: 4000 },
  );
});
