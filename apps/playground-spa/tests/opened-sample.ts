import { expect, type Page } from "@playwright/test";

/**
 * 指定した見本が実際に開けたことを、 **開いた場所で** 確かめる (`#1174`)。
 *
 * `editor-readable-scale.spec.ts` は見本ごとに実測した「読める下限」 を持ち、
 * `/editor#preset=<slug>` で開いて測る。 slug が消えた見本を指していると **黙って別の図を
 * 測る** = `CdlEditor.tsx` は一致しない slug で `SAMPLES[0]` に落ちるため 1 つ目の見本が出て、
 * 消えた見本の下限を満たせば通ってしまう。 落ちないので誰も気付かない。
 *
 * source を読んで一覧と突き合わせる形も試したが、 それだと `["slug", 数]` の形しか見られない。
 * 同じ file には他に 2 種類の slug の出所がある = 層 1 の `SAMPLES` 配列と、
 * `page.goto("/editor#preset=...")` の直書き。 どれも source の形が違うので 1 つの正規表現では
 * 覆えない。
 *
 * **開く側で確かめれば 3 種類とも同時に覆える**。 編集画面は未登録の slug に対して
 * 「プリセット「{slug}」 に対応する編集可能サンプルは未登録です」 を `role="status"` で出すので、
 * それが出ていないことを見れば足りる。 綴り違いと hash 経路の壊れも同じ 1 行で捕まる。
 *
 * spec 同士は import できない (Playwright が禁じる) ため、 helper を別 file に置く。
 */
export async function 見本が開けたことを確かめる(page: Page, slug: string): Promise<void> {
  const 未登録 = page.locator('[role="status"]', { hasText: "未登録です" });
  expect(
    await 未登録.count(),
    `見本 "${slug}" が開けていない (消えた slug を指しているか、 綴りが違う)`,
  ).toBe(0);
}
