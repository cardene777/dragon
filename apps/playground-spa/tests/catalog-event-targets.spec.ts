/**
 * catalog の `eventTargets` が、箱以外の相手と 2 種の操作を画面で受け取ることの確認 (#1969)。
 *
 * 記法の出来事は `box` / `arrow` / `lane` / `diagram` の 4 つの相手と、`drag` / `drop` / `hover` を
 * 含む操作を受ける。 カタログの見本は箱を押す形しか持たず、矢印・縦列・図全体を相手にした形と、
 * 動かす・落とすの 2 操作は画面で 1 度も確かめられていなかった。
 *
 * **5 つを個別に確かめる**。 1 つ動けば通る形だと、残りが死んでいても気付けない。
 */
import { test, expect, type Page, type Locator } from "@playwright/test";

const ITEM_LABEL = "矢印や縦列や図全体での受け取り";

async function open(page: Page): Promise<Locator> {
  await page.goto("catalog/interactive", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page
    .locator("aside.catalog-sidebar")
    .getByText(ITEM_LABEL, { exact: false })
    .first()
    .click();
  await page.waitForTimeout(500);
  // 字が届くと図の位置が動く。 座標で操作する検査があるので、落ち着くまで待ってから返す
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const preview = page.locator("main.catalog-preview");
  await expect(preview.locator("svg[data-cdl-stage]").first()).toBeVisible();
  return preview;
}

/** 受け取った結果を出す箱の文字列 */
async function readReceiver(scope: Locator): Promise<string> {
  const node = scope.locator('[data-cdl-node="受け取った結果"]').first();
  await expect(node).toBeAttached();
  return (await node.textContent()) ?? "";
}

/** 対象の中心の座標 (画面の中へ送ってから測る) */
async function center(target: Locator): Promise<{ x: number; y: number }> {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  expect(box, "操作の対象が見つからない").not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

test.describe("catalog の eventTargets (#1969)", () => {
  test("始めは何も受け取っていない", async ({ page }) => {
    // 以下の検査が「最初から字が出ていた」 で通らないよう、起点の字を固定する
    const preview = await open(page);
    expect(await readReceiver(preview)).toContain("まだ無し");
  });

  test("箱を押したまま動かすと受け取り、図は動かない", async ({ page }) => {
    const preview = await open(page);
    const 箱 = preview.locator('[data-cdl-node="動かす箱"]').first();
    const 始め = await center(箱);
    const 舞台 = preview.locator("svg[data-cdl-stage]").first();
    const 舞台の前 = await 舞台.boundingBox();

    await page.mouse.move(始め.x, 始め.y);
    await page.mouse.down();
    await page.mouse.move(始め.x + 40, 始め.y + 10, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    expect(await readReceiver(preview), "動かした が届かない").toContain("動かした");
    // 動かす操作をカタログの拡大と移動が横取りすると、図ごと動いて受け取りが起きない
    expect(await 舞台.boundingBox(), "箱を動かしたのに図ごと動いた").toEqual(舞台の前);
  });

  test("押しただけで動かさなければ受け取らない", async ({ page }) => {
    // 動かしたと数える距離が効いていることを見る。 距離を見ずに受け取ると、押しただけで届く
    const preview = await open(page);
    const 始め = await center(preview.locator('[data-cdl-node="動かす箱"]').first());
    await page.mouse.move(始め.x, 始め.y);
    await page.mouse.down();
    await page.mouse.move(始め.x + 2, 始め.y, { steps: 2 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "押しただけで 動かした が届いた").not.toContain("動かした");
  });

  test("落とす先に落とすと受け取る", async ({ page }) => {
    const preview = await open(page);
    const 落とす先 = preview.locator('[data-cdl-node="落とす先"]').first();
    await 落とす先.scrollIntoViewIfNeeded();
    const 運ぶ物 = await page.evaluateHandle(() => new DataTransfer());
    await 落とす先.dispatchEvent("dragover", { dataTransfer: 運ぶ物 });
    await page.waitForTimeout(100);
    expect(await readReceiver(preview), "重ねただけで 落とした が届いた").not.toContain("落とした");
    await 落とす先.dispatchEvent("drop", { dataTransfer: 運ぶ物 });
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "落とした が届かない").toContain("落とした");
  });

  test("矢印の名札を押すと受け取る", async ({ page }) => {
    const preview = await open(page);
    const 名札 = preview.locator('[data-cdl-edge-label-for="e0-動かす箱-窓口"]').first();
    await 名札.scrollIntoViewIfNeeded();
    await 名札.click();
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "矢印を押した が届かない").toContain("矢印を押した");
  });

  test("縦列の箱の無い所を押すと受け取り、箱を押しても縦列としては受け取らない", async ({
    page,
  }) => {
    const preview = await open(page);
    const 縦列 = preview.locator('[data-cdl-lane="frame"]').first();
    await 縦列.scrollIntoViewIfNeeded();
    const 枠 = await 縦列.boundingBox();
    expect(枠, "縦列が見つからない").not.toBeNull();

    // 箱の上を押しても縦列の受け取りにはならない (箱の中の出来事は箱のもの)
    await preview.locator('[data-cdl-node="窓口"]').first().click();
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "箱を押したのに 縦列を押した が届いた").not.toContain(
      "縦列を押した",
    );

    // 縦列の下端近くの真ん中 = 箱の並びより下の、箱の無い所。 角は丸いので端の点は囲いの外になる。
    // 囲いの内側が押せることを見る = カタログの配色は囲いの塗りを消すため、押せる範囲を別に決めている
    await page.mouse.click(枠!.x + 枠!.width / 2, 枠!.y + 枠!.height - 14);
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "縦列を押した が届かない").toContain("縦列を押した");
  });

  test("図に入ると受け取り、出ると別の名前で受け取る", async ({ page }) => {
    const preview = await open(page);
    // 図の根。 `svg` で探すと拡大の釦の絵を先に拾う
    const 舞台 = preview.locator("[data-cdl-diagram]").first();
    const 中 = await center(舞台);
    const 枠 = (await 舞台.boundingBox())!;

    // 図の外から入る
    await page.mouse.move(枠.x - 30, 枠.y - 30);
    await page.waitForTimeout(100);
    await page.mouse.move(中.x, 中.y, { steps: 6 });
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "図に入った が届かない").toContain("図に入った");

    await page.mouse.move(枠.x - 30, 枠.y - 30, { steps: 6 });
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "図から出た が届かない").toContain("図から出た");
  });

  test("受け取るたびに累計が増える", async ({ page }) => {
    const preview = await open(page);
    const 名札 = preview.locator('[data-cdl-edge-label-for="e0-動かす箱-窓口"]').first();
    await 名札.scrollIntoViewIfNeeded();
    await 名札.click();
    await page.waitForTimeout(300);
    const 一度目 = await readReceiver(preview);
    await 名札.click();
    await page.waitForTimeout(300);
    const 二度目 = await readReceiver(preview);
    expect(二度目, `2 度目で累計が増えない (1 度目 "${一度目}" 2 度目 "${二度目}")`).not.toBe(
      一度目,
    );
  });
});
