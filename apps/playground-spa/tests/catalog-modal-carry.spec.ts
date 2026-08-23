/**
 * 切替が拡大表示にも届いていることの検査 (#1361)。
 *
 * 速度 (#1356) と描き方 (#1359) の切替は拡大表示にも同じ値を渡すように繋いであるが、
 * **画面の検査は通常表示だけを見ていた**。 繋ぎを外しても通常表示の検査は全て通るため、
 * 拡大を開くと元の速さ・元の描き方に戻る状態に気付けない。
 *
 * 読む対象は **拡大表示の中に限る**。 後ろの通常表示を読むと、繋ぎを外しても通る検査になる。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-modal-carry`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

/** 拡大表示の中だけを指す */
const 拡大 = ".cdl-modal-content";

/** 折れ線の見本を開く */
async function 折れ線を開く(page: Page): Promise<void> {
  await page.goto("/catalog/presets", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText("折れ線グラフ", { exact: true }).first().click();
  await page.waitForTimeout(400);
}

/** 拡大表示を開く */
async function 拡大を開く(page: Page): Promise<void> {
  await page.getByRole("button", { name: /を拡大表示$/ }).click();
  await expect(page.locator(拡大)).toBeVisible();
  await page.waitForTimeout(400);
}

/**
 * 見る窓の長さ (0.1 秒 × 回数)。
 *
 * **1 周より長く取る**。 折れ線の見本は 1 段目 2.4 秒 + 2 段目 0.9 秒で、0.5 倍速では
 * 1 周 6.6 秒になる。 6 秒の窓だと 2 段目を 1 度も観測できずに終わることがある
 * (実測で「4800 は出たが 1800 が出ない」 形で落ちた)。
 */
const 見る回数 = 120;

/**
 * 拡大表示の札に出た段の長さを集める。
 *
 * 図は繰り返し再生されるので、一定時間見て出た値を全部拾う。 段が 2 つあるため、
 * 落ち着いていれば 2 種類の数が出る。
 */
async function 拡大の段の長さ(page: Page): Promise<Set<number>> {
  const 出た = new Set<number>();
  for (let i = 0; i < 見る回数; i++) {
    const 札 = await page.locator(`${拡大} .cdl-phase-meta`).first().textContent();
    const n = /(\d+)ms/.exec(札 ?? "")?.[1];
    if (n !== undefined) 出た.add(Number(n));
    if (出た.size >= 2) break;
    await page.waitForTimeout(100);
  }
  return 出た;
}

/**
 * 拡大表示で、2 段目に居る間に折れ線の残りが付いた回数。
 *
 * 1 段目の名前は「計画」。 札にその名前が出ていない間だけ数える。
 */
async function 拡大の2段目で残りが付いた回数(
  page: Page,
  一度出たら終える = false,
): Promise<number> {
  let n = 0;
  for (let i = 0; i < 見る回数; i++) {
    const 見た = await page.evaluate((sel: string) => {
      const 根 = document.querySelector(sel);
      const 札 = 根?.querySelector(".cdl-phase-chip")?.textContent ?? "";
      const 線 = 根?.querySelector('[data-cdl-role="chart-line"]');
      return { 札, 残り: 線?.getAttribute("stroke-dashoffset") ?? null, 線あり: 線 !== null };
    }, 拡大);
    if (!見た.線あり) {
      await page.waitForTimeout(100);
      continue;
    }
    if (!見た.札.includes("計画") && 見た.残り !== null) {
      n += 1;
      // 陽性側は 1 度見つければ判定できる。 陰性対照だけは観測窓を最後まで見る
      if (一度出たら終える) break;
    }
    await page.waitForTimeout(100);
  }
  return n;
}

test.describe("切替が拡大表示にも届く (#1361)", () => {
  test("既定のまま拡大すると、段の長さは見本のまま (陰性対照)", async ({ page }) => {
    await 折れ線を開く(page);
    await 拡大を開く(page);

    const 長さ = await 拡大の段の長さ(page);
    expect(長さ.size, "拡大表示の札を読めていない (検査が空振りしている)").toBeGreaterThan(0);
    // 見本の値 = 1 段目 2400ms / 2 段目 900ms
    expect([...長さ].sort((a, b) => a - b)).toEqual([900, 2400]);
  });

  test("0.5x にしてから拡大すると、段の長さが 2 倍で出る", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("radio", { name: "0.5x" }).click();
    await page.waitForTimeout(300);
    await 拡大を開く(page);

    const 長さ = await 拡大の段の長さ(page);
    expect(長さ.size, "拡大表示の札を読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect([...長さ].sort((a, b) => a - b)).toEqual([1800, 4800]);
  });

  test("2x にしてから拡大すると、段の長さが半分で出る", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("radio", { name: "2x" }).click();
    await page.waitForTimeout(300);
    await 拡大を開く(page);

    const 長さ = await 拡大の段の長さ(page);
    expect(長さ.size, "拡大表示の札を読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect([...長さ].sort((a, b) => a - b)).toEqual([450, 1200]);
  });

  test("既定のまま拡大すると、2 段目で線を引き直さない (陰性対照)", async ({ page }) => {
    await 折れ線を開く(page);
    await 拡大を開く(page);
    expect(
      await 拡大の2段目で残りが付いた回数(page),
      "動かすだけなのに拡大表示の 2 段目で線を引き直している",
    ).toBe(0);
  });

  test("描き直すにしてから拡大すると、2 段目でも線を引き直す", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("radio", { name: "描き直す" }).click();
    await page.waitForTimeout(300);
    await 拡大を開く(page);

    expect(
      await 拡大の2段目で残りが付いた回数(page, true),
      "描き直すのに拡大表示の 2 段目で線を引き直していない",
    ).toBeGreaterThan(0);
  });

  test("速度と描き方を同時に変えても、両方が拡大表示に届く", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("radio", { name: "0.5x" }).click();
    await page.getByRole("radio", { name: "描き直す" }).click();
    await page.waitForTimeout(300);
    await 拡大を開く(page);

    const 長さ = await 拡大の段の長さ(page);
    expect(長さ.size, "拡大表示の札を読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect([...長さ].sort((a, b) => a - b)).toEqual([1800, 4800]);
    expect(
      await 拡大の2段目で残りが付いた回数(page, true),
      "描き直すのに拡大表示の 2 段目で線を引き直していない",
    ).toBeGreaterThan(0);
  });
});
