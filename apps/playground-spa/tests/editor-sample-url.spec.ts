/**
 * 見本が URL で開けることの検証 (#1092)。
 *
 * 変更前は `sequence` の見本が 2 件あり両方とも同じ識別子を持っていたため、 `#preset=sequence`
 * では 1 件目しか開けなかった。 2 件目 (`注文チェックアウト`) には URL が無く、 人に見せることも
 * 後で開き直すこともできない。 同じ `data-testid` が画面に 2 つ出る状態にもなっていた。
 *
 * ## 13 件を総当たりしない
 *
 * `#preset=` の照合は `SAMPLES.find((s) => s.slug === targetSlug)` の 1 行で、 見本ごとに経路が
 * 分かれない。 13 件を実ブラウザで回しても同じ 1 行を 13 回通るだけで、 かかる時間 (実測 48 秒)
 * に見合う識別力が無い。
 *
 * 見本の中身側 (名前と題の一致 / 識別子の一意性) は単体 test が全件を見る
 * (`packages/dragon/test/editor-samples-identity.test.ts`)。 ここでは **その 1 行が実際に動くか**
 * だけを見る = 既存の識別子で 1 件、 本 PR で足した識別子で 1 件。
 */
import { test, expect } from "@playwright/test";
import { EDITOR_SAMPLES } from "../src/data/editor-samples";

async function 開いた題(page: import("@playwright/test").Page, slug: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/editor#preset=${slug}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  return page.evaluate(() => ({
    題: /title:\s*"(.+?)"/.exec(document.querySelector(".cm-content")?.textContent ?? "")?.[1] ?? "",
    知らせ: document.querySelector(".v4-editor-autofix-message")?.textContent?.trim() ?? "",
  }));
}

test("本 PR で足した識別子で 2 件目が開く (#1092)", async ({ page }) => {
  // 変更前はこの識別子が存在せず、 2 件目に URL が無かった
  const m = await 開いた題(page, "sequence-checkout");
  expect(m.題, `別の見本が開いた: ${m.題}`).toBe("注文チェックアウト");
  expect(m.知らせ, `未登録として扱われた: ${m.知らせ}`).not.toContain("未登録");
});

test("カタログからの識別子で 1 件目が開く (#1092)", async ({ page }) => {
  // 2 件目に固有の識別子を与えた時に 1 件目まで変えると、 カタログ (`lib/presets.ts`) からの
  // `#preset=sequence` が切れる
  const m = await 開いた題(page, "sequence");
  expect(m.題, `別の見本が開いた: ${m.題}`).toBe("ログインAPI呼び出し");
  expect(m.知らせ, `未登録として扱われた: ${m.知らせ}`).not.toContain("未登録");
});

test("一覧の目印が見本ごとに分かれている (#1092)", async ({ page }) => {
  // 変更前は `sequence` の 2 件が同じ `data-testid` を持ち、 画面に同じ目印が 2 つ出ていた。
  // 目印で 1 件を選べない状態は、 検査からも人からも「どちらか」 を指せないことを意味する
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const ids = await page.evaluate(() =>
    [...document.querySelectorAll("[data-testid^='editor-sample-']")].map((e) =>
      e.getAttribute("data-testid"),
    ),
  );

  expect(ids.length, "一覧に項目が無い (検査が空振りしている)").toBe(EDITOR_SAMPLES.length);
  const 重複 = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  expect(重複, `同じ目印が複数ある: ${重複.join(", ")}`).toEqual([]);
});
