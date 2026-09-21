/**
 * 押した後に出る文が、画面の言語に付いてくることの検証 (#2447)。
 *
 * `pages-i18n.spec.ts` は開いた直後の字を読むので、押してから現れる字には届かない。
 * 英語で開いて `URL コピー` を押すと「URL をコピーしました」 と日本語で出ていた。
 *
 * ## 呼び出す側の走査と 2 本立てにする
 *
 * `src/lib/after-action-locale.test.ts` が呼出を実物から拾って、言語で選んでいないものを
 * 数える。 そちらは新しい呼出を足した日にも効くが、**選んだ結果が画面に出ているか** は見ない。
 * ここは実際に押して、出た字を読む。
 *
 * ## 写し取りの成否は検査側で決める
 *
 * 素のまま押すと、この環境では写し取りが必ず失敗して **失敗側の知らせしか出ない**。
 * 成功側を直し忘れても検査は緑のままになる (実測 = 成功側を日本語のみに戻しても 6 件とも通った)。
 *
 * そこで `navigator.clipboard.writeText` を検査側で差し替え、成功と失敗の両方を通す。
 * 見ているのは写し取りではなく **出た字の言語** なので、差し替えても測る対象は変わらない。
 */
import { test, expect, type Page } from "@playwright/test";

const 日本語 = /[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u;

type 道 = "成功" | "失敗";

/** 写し取りの成否を決めてから画面を開く */
async function 開く(page: Page, 経路: string, 言語: "ja" | "en", 道: 道): Promise<void> {
  await page.addInitScript((成功: boolean) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (): Promise<void> =>
          成功 ? Promise.resolve() : Promise.reject(new Error("clipboard blocked")),
      },
    });
  }, 道 === "成功");
  await page.goto(`${経路}?lang=${言語}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
}

/** 浮かんだ知らせの字。 出なければ `null` を返す (空文字に潰さない) */
async function 知らせの字(page: Page): Promise<string | null> {
  const 題 = page.locator(".toast-title").first();
  try {
    await 題.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    return null;
  }
  const 本文 = page.locator(".toast-sub").first();
  const 副題 = (await 本文.count()) > 0 ? ((await 本文.textContent()) ?? "") : "";
  return `${(await 題.textContent()) ?? ""} ${副題}`.trim();
}

/** 出た字が、開いた時の言語と合っていること */
function 言語が合う(字: string | null, 言語: "ja" | "en", 何: string): void {
  // 空振り防止。 字が出ていないなら、言語の判定は何も言っていない
  expect(字, `${何}が出ない (検査が空振りしている)`).not.toBeNull();
  expect((字 ?? "").length, `${何}の字が空`).toBeGreaterThan(0);
  if (言語 === "en") {
    expect(日本語.test(字 ?? ""), `英語で開いたのに日本語が出た: ${字}`).toBe(false);
  } else {
    expect(日本語.test(字 ?? ""), `日本語で開いたのに日本語が出ない: ${字}`).toBe(true);
  }
}

const 言語と道 = (["ja", "en"] as const).flatMap((言語) =>
  (["成功", "失敗"] as const).map((道) => ({ 言語, 道 })),
);

test.describe("見本の詳細の知らせ (#2447)", () => {
  for (const { 言語, 道 } of 言語と道) {
    test(`${言語} で URL コピーを押す (写し取りが${道})`, async ({ page }) => {
      await 開く(page, "preset/flow", 言語, 道);
      // 写せない時は何も開かないが、念のため窓が出ても止まらないようにする
      page.on("dialog", (d) => void d.dismiss());
      await page.getByRole("button", { name: /URL コピー|Copy URL/ }).first().click();
      言語が合う(await 知らせの字(page), 言語, "知らせ");
    });
  }
});

test.describe("編集画面の知らせ (#2447)", () => {
  for (const { 言語, 道 } of 言語と道) {
    test(`${言語} で共有を押す (写し取りが${道})`, async ({ page }) => {
      await 開く(page, "editor", 言語, 道);
      // 写せない時は URL を見せる窓が開く。 閉じて先へ進む
      page.on("dialog", (d) => void d.dismiss());
      await page.getByTestId("editor-share").click();
      言語が合う(await 知らせの字(page), 言語, "知らせ");
    });
  }
});

test.describe("編集画面の確かめの窓 (#2447)", () => {
  for (const 言語 of ["ja", "en"] as const) {
    test(`${言語} で欄を切り替えると確かめも同じ言語で出る`, async ({ page }) => {
      await 開く(page, "editor", 言語, "失敗");
      await page.locator('[data-testid="editor-code-body-cdl"] .cm-content').click();
      await page.keyboard.press("End");
      await page.keyboard.type("\n# edit marker");
      await page.waitForTimeout(400);

      let 字: string | null = null;
      page.on("dialog", (d) => {
        字 = d.message();
        void d.dismiss();
      });
      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(400);
      言語が合う(字, 言語, "確かめの窓");
    });
  }
});
