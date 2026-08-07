/**
 * 収まらない図で左端が見えることの検証 (#1088)。
 *
 * `#1084` で読める下限を入れた結果、 横長の図は枠に収まらなくなった。 収まらないこと自体は
 * 決めたとおりだが、 中央寄せのままだと左右が同じだけ隠れる。 実測 (窓 1440×900、 絵の枠
 * 688×840) で見本「Client登録」 は左右 343px ずつ隠れ、 最初の登場人物が画面の外にあった。
 *
 * ## 隠れ量を測る
 *
 * 「中央か始点か」 は単体 test が見る (`src/lib/fit-anchor.test.ts`)。 ここでは **画面上で
 * 左端が隠れていないか** を測る。 位置決めが正しくても、 図の描き出し位置が別の理由でずれれば
 * 見る人にとっては直っていない。
 */
import { test, expect } from "@playwright/test";

async function 隠れ量(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const host = document.querySelector(".v4-editor-preview");
    const svg = host?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    if (!host || !svg) return null;
    const h = host.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    return {
      左: Math.round(h.left - s.left),
      右: Math.round(s.right - h.right),
      上: Math.round(h.top - s.top),
      図幅: Math.round(s.width),
      枠幅: Math.round(h.width),
    };
  });
}

async function 開く(page: import("@playwright/test").Page, slug: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/editor#preset=${slug}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

// 読める下限で枠に収まらなくなる見本。 変更前は左右が同量ずつ隠れていた
for (const slug of ["swimlane", "sequence", "pie"]) {
  test(`見本 ${slug} を開くと図の左端が見える (#1088)`, async ({ page }) => {
    await 開く(page, slug);
    const m = await 隠れ量(page);

    expect(m, "図が画面に無い").not.toBeNull();
    // 収まらない図であることを先に確かめる。 収まる図で測っても「左が隠れない」 は自明に通り、
    // 検査が空振りする
    expect(m!.図幅, `枠に収まっている (検査が空振りしている): ${m!.図幅} <= ${m!.枠幅}`).toBeGreaterThan(
      m!.枠幅,
    );
    expect(m!.左, `図の左端が ${m!.左}px 隠れている`).toBeLessThanOrEqual(1);
  });
}

test("枠に収まる図は中央に置かれる (#1088)", async ({ page }) => {
  // 始点寄せは収まらない軸だけに効く。 収まる図まで左に寄せると、 直そうとしていない図の
  // 見え方が変わる
  await 開く(page, "flow");
  const m = await 隠れ量(page);

  expect(m, "図が画面に無い").not.toBeNull();
  expect(m!.図幅, `枠に収まっていない (検査が空振りしている)`).toBeLessThan(m!.枠幅);
  // 中央なら左右の余りが同じ。 左に寄せると左が 0 になり右だけ余る
  expect(m!.左, `中央に置かれていない: 左 ${m!.左} / 右 ${m!.右}`).toBe(m!.右);
  expect(m!.左, "左に余りが無い (左端に貼り付いている)").toBeLessThan(0);
});

test("縦に収まる図では上端に寄せない (#1088)", async ({ page }) => {
  // 軸ごとに独立して決める。 横は収まらないが縦は収まる図で、 縦まで上端に寄せると
  // 上下の余白が偏る
  await 開く(page, "swimlane");
  const m = await 隠れ量(page);

  expect(m, "図が画面に無い").not.toBeNull();
  // 上が負 = 図の上端が枠の上端より下にある = 余白がある
  expect(m!.上, `縦まで上端に寄せている: 上 ${m!.上}`).toBeLessThan(0);
});
