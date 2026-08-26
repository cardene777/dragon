/**
 * catalog の `eventVariety` が 5 種すべての操作で画面を変えることの確認 (#1045)。
 *
 * 直す前は段の説明が「反応する」 と書いていたが、受け取り手が何もしない実装で、
 * 図も状態を持たなかったため画面は一度も変わらなかった。
 *
 * **5 種を個別に確かめる**。 1 つ動けば通る形だと、残り 4 つが死んでいても気付けない。
 */
import { test, expect, type Page, type Locator } from "@playwright/test";

const ITEM_LABEL = "イベントハンドラ5種の組合せ";

async function open(page: Page): Promise<Locator> {
  await page.goto("catalog/interactive", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.locator("aside.catalog-sidebar").getByText(ITEM_LABEL, { exact: false }).first().click();
  await page.waitForTimeout(500);
  // 字が届くと文字の幅が変わり、 その下にある図の位置が動く。 座標を測ってから押す形
  // (長押し) は、 測った後に動くと押す先が外れる。 落ち着くまで待ってから返す。
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const preview = page.locator("main.catalog-preview");
  await expect(preview.locator("svg").first()).toBeVisible();
  return preview;
}

/** 受け取った結果を出す箱の文字列。 */
async function readReceiver(scope: Locator): Promise<string> {
  const node = scope.locator('[data-cdl-node="receiver"]').first();
  await expect(node).toBeAttached();
  return (await node.textContent()) ?? "";
}

test.describe("catalog の eventVariety (#1045)", () => {
  test("2 回押すと受け取った結果が変わる", async ({ page }) => {
    const preview = await open(page);
    const before = await readReceiver(preview);

    await preview.locator('[data-cdl-node="btn1"]').first().dblclick();
    await page.waitForTimeout(300);

    const after = await readReceiver(preview);
    expect(after, `2 回押しても変わらない (前 "${before}" 後 "${after}")`).not.toBe(before);
    expect(after, "受け取った操作の名前が出ていない").toContain("2 回押し");
  });

  test("選ぶ / キーを押す / 外れる の 3 つが個別に届く", async ({ page }) => {
    const preview = await open(page);
    const btn2 = preview.locator('[data-cdl-node="btn2"]').first();

    // 選ばれた
    await btn2.focus();
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "選ばれた が届かない").toContain("選ばれた");

    // キーを押した
    await page.keyboard.press("a");
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "キー入力 が届かない").toContain("キー入力");

    // 外れた
    await preview.locator('[data-cdl-node="btn1"]').first().click();
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "外れた が届かない").toContain("外れた");
  });

  test("押したまま一定時間たつと受け取る", async ({ page }) => {
    // 段の説明は「押したまま一定時間たつと受け取る」。 **離す前に** 画面が変わることを見る。
    // 離した時に受け取る形だと、押し続けている間は何も起きず説明と食い違う
    const preview = await open(page);
    const 対象 = preview.locator('[data-cdl-node="btn3"]').first();
    // 座標で押すので、 画面の外にあると届かない (`click` と違って自動で送られない)。
    // 図は見出しの下に来るため、 縦の狭い画面では対象が折り返しの下に落ちる。
    await 対象.scrollIntoViewIfNeeded();
    const box = await 対象.boundingBox();
    expect(box, "長押しの対象が見つからない").not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(700);

    const whileHolding = await readReceiver(preview);
    expect(whileHolding, "押し続けている間に受け取っていない (離すまで変わらない)").toContain("長押し");

    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "離した後に消えている").toContain("長押し");
  });

  test("短く押しただけでは長押しにならない", async ({ page }) => {
    // 「押したまま一定時間たつと」 の **一定時間** が効いていることを見る。
    // 時間を見ずに受け取っていたら、短い押下でも届いてしまう
    const preview = await open(page);
    const box = await preview.locator('[data-cdl-node="btn3"]').first().boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(120);
    await page.mouse.up();
    await page.waitForTimeout(300);

    expect(await readReceiver(preview), "短い押下で長押しが届いてしまう").not.toContain("長押し");
  });

  test("キーボードだけで選ぶ / キーを押す に到達できる", async ({ page }) => {
    // Issue は「`g` は `tabindex` を持たないのでキーボードでは到達できない」 と書いていたが、
    // 実測では **結び付けた要素だけが Tab 順に入る** (`btn2` のみ、`btn1` / `btn3` は入らない)。
    // `tabindex` を足す必要は無かった。 ただし到達性は誰も固定していないので、ここで固定する。
    //
    // 起点は同じ枠にある「拡大」 ボタンにする。 画面の先頭から数えると一覧の項目が
    // 140 件ほど手前に並び、停止点の数が一覧の件数に左右される
    const preview = await open(page);
    await page.locator("main.catalog-preview").getByRole("button", { name: /拡大/ }).first().focus();

    let reached = false;
    for (let i = 0; i < 30 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = (await page.evaluate(() => document.activeElement?.getAttribute?.("data-cdl-node") ?? null)) === "btn2";
    }
    expect(reached, "Tab キーだけでは操作の対象に到達できない").toBe(true);

    // 到達しただけでなく、そこからキー操作が実際に届くこと
    expect(await readReceiver(preview), "到達しても選ばれた が届かない").toContain("選ばれた");
    await page.keyboard.press("a");
    await page.waitForTimeout(300);
    expect(await readReceiver(preview), "到達してもキー入力 が届かない").toContain("キー入力");
  });

  test("受け取るたびに累計が増える", async ({ page }) => {
    const preview = await open(page);
    const btn1 = preview.locator('[data-cdl-node="btn1"]').first();

    await btn1.dblclick();
    await page.waitForTimeout(300);
    const first = await readReceiver(preview);

    await btn1.dblclick();
    await page.waitForTimeout(300);
    const second = await readReceiver(preview);

    expect(second, `2 度目で累計が増えない (1 度目 "${first}" 2 度目 "${second}")`).not.toBe(first);
  });
});
