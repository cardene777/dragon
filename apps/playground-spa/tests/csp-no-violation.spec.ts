/**
 * 公開 site の CSP で画面が壊れないことの検証 (#2956)。
 *
 * CSP は build の時だけ `index.html` の meta に入る (`vite-csp.ts`)。 決まりを狭めすぎると、
 * 画面は白くならずに一部だけ黙って止まる (差し込んだ `<style>` が効かない / 書き出しの画像が
 * 描けない)。 そのため頁を開いて操作し、ブラウザが出す違反の知らせ
 * (`securitypolicyviolation`) を数える。
 *
 * ## 開く頁は画面から引く
 *
 * 頁の一覧を手で持たない。 上の行き先と見本帳の分類の link を画面から集めて全て開く。
 * 頁や分類を足した時に、検査が取り残されない。
 *
 * ## 空振りしていないことも確かめる
 *
 * 違反 0 件は「決まりが無い」 時にも出る。 meta があることと、わざと inline の script を
 * 差し込むと違反が出ることを別に見る。
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

declare global {
  interface Window {
    __csp違反?: string[];
    __走った?: boolean;
  }
}

/** 頁を開くたびに、違反の知らせを貯める受け口を置く */
async function 違反を拾う(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__csp違反 = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__csp違反?.push(`${e.effectiveDirective} ${e.blockedURI} (${e.sourceFile}:${e.lineNumber})`);
    });
  });
}

async function 貯まった違反(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__csp違反 ?? []);
}

/** 頁を開き、遅れて読む束まで読み終えるのを待つ */
async function 開く(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}

/** 同じ site の中を指す link の行き先を集める */
async function 内側のlink(page: Page, selector: string): Promise<string[]> {
  return page.locator(selector).evaluateAll((els) => {
    const 先頭 = new URL(document.baseURI).pathname;
    return [
      ...new Set(
        els
          .map((a) => new URL((a as HTMLAnchorElement).href))
          .filter((u) => u.origin === location.origin && u.pathname.startsWith(先頭))
          .map((u) => u.origin + u.pathname),
      ),
    ];
  });
}

async function 書き出す(page: Page, 札: string): Promise<void> {
  await page.getByTestId("editor-export").hover();
  const button = page.locator(".v4-editor-export-menu button").filter({
    has: page.locator("strong", { hasText: 札 }),
  });
  await expect(button, `${札} の札が書き出し menu に無い`).toHaveCount(1);
  // **保存の待ちは短くする**。 画像の読み込みを止められた PNG は保存まで届かない
  // (実測 = `img-src` から `blob:` を外すと、違反 `img-src blob` が 1 件出て、保存は来なかった)。
  // 既定の待ちのままだと、ここで頁全体の持ち時間を使い切り、違反の数を見る行まで進まない。
  // 待ちを短くして、届かなかったことを理由として名指しする
  const 待受 = page.waitForEvent("download", { timeout: 15000 });
  await button.click();
  await 待受.catch(() => {
    throw new Error(`${札} の書き出しが保存まで届かない (CSP で読み込みが止まっている疑い)`);
  });
}

test.describe("公開 site の CSP で画面が壊れない (#2956)", () => {
  test("build した頁が CSP の meta を持つ", async ({ page }) => {
    await 開く(page, "");
    const 決まり = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");
    expect(決まり, "CSP の meta が無い (build ではない頁を見ている)").toBeTruthy();
    expect(決まり).toContain("script-src 'self'");
  });

  test("行き先の頁と見本帳の全分類を開いても違反が出ない", async ({ page }) => {
    test.setTimeout(180000);
    await 違反を拾う(page);
    await 開く(page, "");
    const 行き先 = await 内側のlink(page, 'nav[aria-label="行き先"] a');
    await 開く(page, "catalog");
    const 分類 = await 内側のlink(page, "a.catalog-index-card");
    // 集めた数が 0 だと何も開かずに通るので、両方あることを先に見る
    expect(行き先.length, "上の行き先の link が見つからない").toBeGreaterThan(1);
    expect(分類.length, "見本帳の分類の link が見つからない").toBeGreaterThan(1);

    const 違反: string[] = [];
    const 頁 = [...new Set([...行き先, ...分類])];
    for (const url of 頁) {
      await 開く(page, url);
      違反.push(...(await 貯まった違反(page)).map((v) => `${url} ${v}`));
    }
    // 0 件を報告する時は母数を併記する
    console.log(`CSP: ${頁.length} 頁を開いた (行き先 ${行き先.length} / 分類 ${分類.length})`);
    expect(違反).toEqual([]);
  });

  test("編集画面で 3 種を書き出しても違反が出ない", async ({ page }) => {
    await 違反を拾う(page);
    await 開く(page, "editor");
    await page.locator(".v4-editor-preview svg[data-cdl-stage]").waitFor();
    for (const 札 of ["動く SVG", "静止 SVG", "PNG"]) await 書き出す(page, 札);
    expect(await 貯まった違反(page)).toEqual([]);
  });

  test("inline の script を差し込むと止まり、違反が出る (検査が空振りしていない)", async ({ page }) => {
    await 違反を拾う(page);
    await 開く(page, "");
    await page.evaluate(() => {
      const s = document.createElement("script");
      s.textContent = "window.__走った = true";
      document.head.append(s);
    });
    await expect.poll(() => 貯まった違反(page)).not.toEqual([]);
    expect(await page.evaluate(() => window.__走った)).toBeUndefined();
  });
});
