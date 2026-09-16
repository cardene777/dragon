import { test, expect } from "@playwright/test";

/**
 * 編集画面の舞台を撮り、基準画像と画素で比べる検査。
 *
 * 撮るのは開いた直後の舞台 1 枚 (`01-init.png`)。 基準画像は初回の実行で保存し、以後は違う画素の
 * 割合が `maxDiffPixelRatio` を超えたら落ちる。 動きは止めてから撮る (撮るたびに違う瞬間が写らない
 * ように)。
 *
 * 撮影を消す時は、`<この file>-snapshots/` の基準画像も一緒に消す。 残すと `test-leftovers.test.ts` が落ちる。
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
 * 撮る直前に、図の動きを止める。
 *
 * 図の動きは cdl 側が rAF / setInterval で進めるので、CSS の `animation-duration: 0` では
 * 止まらない。 止めないと撮るたびに違う段の瞬間が写り、矢印の描かれた長さが変わって比べた
 * 画素の差が上限を超える (実測 = 同じ検査が単体では通り、続けて回すと落ちた)。
 *
 * rAF と timer を止めて画面を固定し、配置の違いだけが差に残るようにする。 上限を緩めて通す形は
 * 取らない = 100px ほどのずれを見逃すようになるため。
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



