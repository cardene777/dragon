import type { Locator, Page } from "@playwright/test";

/**
 * 一覧からその見本の行を引く (#2461)。
 *
 * 見本の識別子 (`api-call` / `class-demo`) は画面に出さなくなったので、字で引く形は当たらない。
 * 行には `data-item-id` が付くため、まず属性で引き、当たらなければ字で引く。
 * 呼ぶ側は識別子と画面に出る名前のどちらを渡してもよい。
 *
 * **字の側を残す** = 呼ぶ側の半分は画面に出る名前 (`マインドマップ` / `線の役目`) を渡しており、
 * 属性だけにすると当たらない。 2 つを繋いで先頭を取る。
 *
 * spec 同士は import できない (Playwright が禁じる) ため、helper を別 file に置く
 * (`opened-sample.ts` と同じ理由)。
 */
export function 一覧の行(page: Page, 名前: string, 完全一致 = false): Locator {
  const 一覧 = page.locator(".catalog-list");
  return 一覧
    .locator(`.catalog-list-item[data-item-id="${名前}"]`)
    .or(一覧.getByText(名前, { exact: 完全一致 }))
    .first();
}
