import { test, expect, type Page } from "@playwright/test";

/**
 * 画面で言語を切り替えた後に出る知らせが、新しい言語になることの検証 (#2517)。
 *
 * `after-action-locale.spec.ts` は **開いた時の言語** で押した後の字を見る。
 * こちらは **開いた後に切り替えた** 言語を見る = 別の壊れ方で、切り替えの前に作られた
 * 中身が古い言語を掴んだままになる形を捕まえる。
 *
 * 実際 `handleWritePosition` は依存に言語を並べておらず、日本語で開いて英語へ切り替えても
 * 日本語の知らせが出ていた。 本文を触るなど別の依存が動くまで切り替わらない。
 *
 * ## 切り替えない側も見る
 *
 * 切り替えた側だけを見ると、知らせが常に英語で出る壊れ方 (言語の選び方そのものを壊した形) でも
 * 通ってしまう。 切り替えずに押した時に日本語で出ることを対照として置く。
 */

/** 本文を共有 URL の形にする。 editor 側の `encodeShare` と同じ規則 */
function shareHash(dsl: string): string {
  return Buffer.from(dsl, "utf8").toString("base64");
}

const DSL = `title: "位置の相対指定"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の右 200
  - DB: database
flow:
  - Web -> API: "要求"
  - API -> DB: "検索"
`;

/** 日本語で開いて、位置の札を出すところまで進める */
async function 日本語で開く(page: Page): Promise<void> {
  await page.goto(`editor?lang=ja#s=${shareHash(DSL)}`);
  await page.waitForSelector(".v4-editor-stage svg", { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.getByTestId("editor-toggle-positions").click();
  await expect(page.locator('[data-pos-name="API"]')).toBeVisible();
}

/** 札を押して、図の上に出た知らせの字を返す */
async function 札を押して知らせを読む(page: Page): Promise<string> {
  await page.locator('[data-pos-name="API"]').click();
  const 知らせ = page.locator(".v4-editor-stage-notice");
  await expect(知らせ).toBeVisible({ timeout: 5000 });
  return (await 知らせ.textContent()) ?? "";
}

const 日本語の字 =
  /[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u;

test.describe("言語を切り替えた後の知らせ (#2517)", () => {
  test("英語へ切り替えた直後の知らせが英語で出る", async ({ page }) => {
    await 日本語で開く(page);

    await page.locator(".v4-nav-lang-toggle").click();
    await page.waitForTimeout(400);

    const 字 = await 札を押して知らせを読む(page);
    expect(字.length, "知らせの字が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(字, `知らせが日本語のまま: ${字}`).not.toMatch(日本語の字);
    expect(字, `英語の知らせが出ていない: ${字}`).toContain("Wrote the place");
  });

  test("切り替えなければ日本語のまま出る (対照)", async ({ page }) => {
    await 日本語で開く(page);

    const 字 = await 札を押して知らせを読む(page);
    expect(字.length, "知らせの字が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(字, `日本語の知らせが出ていない: ${字}`).toContain("を書きました");
  });
});
