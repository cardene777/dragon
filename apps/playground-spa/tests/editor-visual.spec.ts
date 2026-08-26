import { test, expect } from "@playwright/test";

/**
 * Layer 4 = visual regression。 Playwright `toHaveScreenshot` で pixel diff。
 *
 * 4 baseline snapshot を初回実行時に保存、 以後 実行で pixel diff。 diff threshold 内なら pass。
 * animation は disable (animations: "disabled") で決定的比較を担保。
 *
 * snapshot:
 *   1. 初期 (achievement drop 前) editor stage 全体
 *   2. achievement drop 直後
 *   3. achievement 右 200px drag 後
 *   4. achievement SE corner drag で 1.5x resize 後
 */


test.use({ viewport: { width: 1920, height: 1080 } });

// visual regression では animation を止めて決定的スナップショット
test.beforeEach(async ({ page }) => {
  await page.addStyleTag({ content: "* { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }" });
});

async function openEditorStable(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
  await page.addStyleTag({ content: "* { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }" });
  await page.waitForTimeout(500);
}

/**
 * 2026-07-26 CAR-2158 = visual regression の flaky 解消。
 *
 * dragon の diagram animation は cdl 側で rAF / setInterval 駆動しており、 CSS の animation-duration: 0 では
 * 止まらない。 その結果「どの step が active な瞬間か」 が撮影ごとに変わり、 矢印の描画長が変化して
 * pixel diff が閾値を超えることがあった (実測 = 同一 test が単体では pass、 連続実行では fail する flaky)。
 *
 * 撮影直前に rAF / timer を停止して frame を固定することで、 レイアウト差 (真の regression) だけが
 * diff に残るようにする。 閾値を緩めて誤魔化す経路は取らない = 100px 級のズレを見逃す穴になるため。
 */
async function freezeAnimation(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as {
      requestAnimationFrame: (cb: FrameRequestCallback) => number;
      setInterval: typeof setInterval;
      setTimeout: typeof setTimeout;
    };
    w.requestAnimationFrame = () => 0;
    // 実行中の timer を全て停止 (id 空間を総なめして clear)
    const maxId = Number(w.setTimeout(() => {}, 0));
    for (let i = 0; i <= maxId; i += 1) {
      clearInterval(i);
      clearTimeout(i);
    }
  });
  await page.waitForTimeout(300);
}

test("visual 1 = 初期 editor stage", async ({ page }) => {
  await openEditorStable(page);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await freezeAnimation(page);
  await expect(stage).toHaveScreenshot("01-init.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.005,
  });
});



