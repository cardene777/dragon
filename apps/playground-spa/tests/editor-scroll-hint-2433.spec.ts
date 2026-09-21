/**
 * 編集画面でも続きが隠れている側に手がかりを出す (#2433)。
 *
 * 判定そのものは `src/lib/scroll-edges.test.ts` が 3 つの数で見る (#2427)。
 * ここが見るのは **編集画面でその判定が画面に繋がっているか** と、
 * **飾りが図と一緒に動かないか** の 2 つ。
 *
 * ## 編集画面は巻き取らない
 *
 * 見本の頁と拡大表示は `overflow: auto` で巻き取るので、送り具合が `scrollLeft` に出る。
 * 編集画面は `overflow: hidden` の台の中で `.v4-editor-pan` を `transform` で動かすため、
 * **送りは一切発生しない** = `scrollLeft` は常に 0 のまま。
 * だから位置を動かす手段も、測る対象も違う。
 *
 * | | 見本の頁 / 拡大表示 | 編集画面 |
 * |---|---|---|
 * | 動かす手段 | `scrollLeft` を書く | 台の上で掴んで引く |
 * | 測る対象 | 巻き取る要素の 3 つの数 | 台と動く中身の、画面上の矩形 |
 *
 * 測るのは実際に描かれた矩形なので、図の左の余白も倍率も込みで出る。
 */
import { test, expect, type Page } from "@playwright/test";

const 台 = ".v4-editor-stage";
const 中身 = ".v4-editor-pan";

const 端 = (page: Page): Promise<string | null> =>
  page.locator(台).first().getAttribute("data-cdl-more");

/** 台と動く中身の、画面上の矩形から「はみ出している量」 を出す */
async function はみ出し(page: Page): Promise<{ 余り: number; 左: number }> {
  return page.evaluate(
    (指す) => {
      const 枠 = document.querySelector(指す.台)?.getBoundingClientRect();
      const 絵 = document.querySelector(指す.中身)?.getBoundingClientRect();
      if (!枠 || !絵) return { 余り: 0, 左: 0 };
      return { 余り: 絵.width - 枠.width, 左: 絵.left - 枠.left };
    },
    { 台, 中身 },
  );
}

async function 見本を開く(page: Page, slug: string): Promise<void> {
  await page.goto(`editor#preset=${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}

/** 台の上で掴んで、図を横に `量` px 動かす (負なら左へ) */
async function 引く(page: Page, 量: number): Promise<void> {
  const 枠 = await page.locator(台).first().boundingBox();
  if (!枠) throw new Error("台が見つからない");
  const y = 枠.y + 枠.height / 2;
  // 引き始めは枠の中央から。 端から始めると、動かす途中で台の外に出て掴んだ手が離れる
  const 始め = 枠.x + 枠.width / 2;
  await page.mouse.move(始め, y);
  await page.mouse.down();
  await page.mouse.move(始め + 量, y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(250);
}

test.describe("編集画面の手がかり (#2433)", () => {
  test("枠に入らない図は、動かした位置で手がかりの向きが変わる", async ({ page }) => {
    await 見本を開く(page, "flow");

    // 空振り防止。 この図が枠に入らないことを先に確かめる
    const 初め = await はみ出し(page);
    expect(初め.余り, "この図が枠に入ってしまっている (検査が空振りしている)").toBeGreaterThan(2);
    expect(初め.左, "収めた直後なのに図の左端が枠の左辺と合っていない").toBeGreaterThan(-2);

    await expect.poll(() => 端(page), { timeout: 4000 }).toBe("右");

    // 半分だけ左へ引くと、左にも右にも続きが残る
    await 引く(page, -Math.round(初め.余り / 2));
    await expect.poll(() => 端(page), { timeout: 2000 }).toBe("両方");

    // 残りを左へ引き切ると、続きは左だけになる
    await 引く(page, -(Math.round(初め.余り / 2) + 10));
    await expect.poll(() => 端(page), { timeout: 2000 }).toBe("左");
  });

  test("飾りを持つ要素そのものが動かない", async ({ page }) => {
    // 飾りを図と同じ要素に付けると、図と一緒に動いて隠れている端を指さなくなる。
    // **飾りを持つ要素を探してから測る** = 台を名前で指すと、飾りが動く側へ移っても
    // 台は動かないままなので植え込みが素通りする (#2429 で 1 度抜けた)
    await 見本を開く(page, "flow");
    await 引く(page, -20);

    const 持ち主 = page.locator("[data-cdl-more]");
    await expect(持ち主, "飾りを持つ要素が 1 つも無い").toHaveCount(1);

    const 測った = await 持ち主.first().evaluate((el) => ({
      送り: el.scrollLeft,
      transform: getComputedStyle(el).transform,
      position: getComputedStyle(el).position,
    }));
    expect(測った.送り, "飾りを持つ要素が送られている").toBe(0);
    expect(測った.transform, "飾りを持つ要素が動かされている (飾りが図と一緒に動く)").toBe("none");
    expect(測った.position, "飾りの位置の基準になっていない").toBe("relative");
  });

  test("枠に入る図には手がかりが付かない", async ({ page }) => {
    // 対照。 付けっぱなしの実装だとここが落ちる
    await 見本を開く(page, "topology");

    const 初め = await はみ出し(page);
    expect(初め.余り, "対照に選んだ図が枠に入っていない").toBeLessThanOrEqual(1);
    expect(await 端(page)).toBeNull();
  });
});
