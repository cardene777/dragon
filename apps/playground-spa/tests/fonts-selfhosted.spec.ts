/**
 * 字が同梱されていることの検証 (#1122)。
 *
 * 以前は Google の配信元から読んでいた。 向こうの状態で字が届いたり届かなかったりし、
 * 届かない間は system の字で描かれる。 字が変われば寸法も変わるので、 **文字が箱に収まるかを
 * 見る検査が実行ごとに別の場所で落ちていた** (直列化で減らしたが 0 にならなかった、 #1118)。
 *
 * `#1114` で直した本番検査の不安定 (字の 404 で落ちる) も同じ根。
 *
 * ## 3 点を別々に見る
 *
 * 1. 外部の配信元へ 1 度も取りに行かないこと (`index.html` から `<link>` を消しただけでは、
 *    css の `@import` や `url()` 経由で残ることがある)
 * 2. 同梱した字が実際に読み込まれていること (`document.fonts` に載っているか)
 * 3. その字で実際に描かれていること (指定しただけで system に落ちていないか)
 *
 * 3 を見ないと、 `@font-face` は読めているのに指定側の名前が違って system で描かれる形を
 * 通してしまう (`Inter` と `Inter Variable` は別の名前)。
 */
import { test, expect, type Page } from "@playwright/test";

/** 同梱した 3 系統。 `変数` はその系統を指す CSS 変数。 */
const 系統 = [
  { 名: "Inter Variable", 変数: "--d-body" },
  { 名: "Space Grotesk Variable", 変数: "--d-display" },
  { 名: "JetBrains Mono Variable", 変数: "--d-mono" },
] as const;

/** 外部の字を取りに行った要求を記録する。 */
function 外部要求を見張る(page: Page): string[] {
  const 記録: string[] = [];
  page.on("request", (r) => {
    const u = r.url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) 記録.push(u);
  });
  return 記録;
}

test("外部の配信元へ字を取りに行かない", async ({ page }) => {
  const 記録 = 外部要求を見張る(page);
  // 字を最も多く使う 2 画面を通す。 頁ごとに css が分かれているため 1 画面では足りない
  for (const path of ["/", "/editor"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
  }
  expect(記録, `外部の配信元へ ${記録.length} 件取りに行った`).toEqual([]);
});

test("同梱した字が読み込まれている", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);

  const 読めた = await page.evaluate(() => {
    const out: Record<string, boolean> = {};
    for (const f of document.fonts) {
      if (f.status === "loaded") out[f.family.replace(/^["']|["']$/g, "")] = true;
    }
    return out;
  });
  for (const { 名 } of 系統) {
    expect(読めた[名], `${名} が読み込まれていない (読めたのは ${Object.keys(読めた).join(" / ")})`).toBe(true);
  }
});

test("同梱した字で実際に描かれている", async ({ page }) => {
  // **`font-family` に書いてあるだけでは足りない**。 名前が違えば system の字で描かれ、
  // 見た目も寸法も変わる。 `document.fonts.check` で「その字で描けるか」 を直接聞く。
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);

  for (const { 名, 変数 } of 系統) {
    const r = await page.evaluate(
      ([名, 変数]) => {
        const 指定 = getComputedStyle(document.documentElement).getPropertyValue(変数).trim();
        return {
          指定,
          先頭に居る: 指定.replace(/["']/g, "").split(",")[0]!.trim() === 名,
          描ける: document.fonts.check(`16px "${名}"`),
        };
      },
      [名, 変数] as const,
    );
    expect(r.先頭に居る, `${変数} の先頭が ${名} ではない (${r.指定})`).toBe(true);
    expect(r.描ける, `${名} で描けない`).toBe(true);
  }
});

test("網を切っても同じ字で描かれる", async ({ page, context }) => {
  // 本 Issue の中身。 外部を全部落とした状態で、 字の寸法が変わらないことを見る。
  //
  // 同じ文字列を同じ指定で描いて幅を比べる。 system の字に落ちれば幅が変わる。
  const 幅を測る = async (): Promise<Record<string, number>> => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    return await page.evaluate((系統) => {
      const out: Record<string, number> = {};
      for (const { 名 } of 系統) {
        const s = document.createElement("span");
        s.textContent = "Hamburgefonstiv 0123456789";
        s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:32px;font-family:"${名}"`;
        document.body.appendChild(s);
        out[名] = s.getBoundingClientRect().width;
        s.remove();
      }
      return out;
    }, 系統 as unknown as { 名: string }[]);
  };

  const 通常 = await 幅を測る();
  for (const { 名 } of 系統) {
    expect(通常[名], `${名} の幅を測れていない`).toBeGreaterThan(0);
  }

  // 外部への通信を全部落とす (同梱なので何も変わらないはず)
  await context.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort());
  const 遮断 = await 幅を測る();

  for (const { 名 } of 系統) {
    expect(
      遮断[名],
      `${名} の幅が網の有無で変わる (通常 ${通常[名]!.toFixed(1)} / 遮断 ${遮断[名]!.toFixed(1)})`,
    ).toBeCloseTo(通常[名]!, 1);
  }
});
