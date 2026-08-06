/**
 * 携帯の幅でエディタが使える大きさを保つことの検証 (#1070)。
 *
 * 脇の一覧は幅 220px 固定で、画面が狭くなっても縮まなかった。 削られるのは本体 (記法欄と絵)
 * だけで、375px では記法欄が 155px = 1 行あたり 10 文字ほどしか見えない状態だった
 * (実測 = 脇 220 / 本体 155、画面の 59% を脇が占める)。
 *
 * 700px 以下では脇を畳んで本体に全幅を渡し、ボタンで出し入れする。
 *
 * ## 検査の作り
 *
 * **「畳めること」 だけでは守れない**。 畳んだまま出せなければ見本にもパーツにも到達できず、
 * 出しっぱなしなら畳んだ意味が無い。 出す / 閉じるの両方と、閉じる 3 経路 (幕 / Esc / 見本を
 * 選ぶ) を通す。
 *
 * 広い画面を巻き込んでいないことは、脇と本体の幅を変更前の実測値で固定して見る。
 */
import { test, expect } from "@playwright/test";

/** 変更前に測った幅 (この値が動いたら広い画面を巻き込んでいる)。 */
const 広い画面 = [
  { 幅: 1440, 脇: 260, 記法欄: 492, 絵の欄: 688 },
  { 幅: 1024, 脇: 240, 記法欄: 356, 絵の欄: 428 },
  { 幅: 900, 脇: 220, 記法欄: 680, 絵の欄: 680 },
] as const;

async function openEditor(page: import("@playwright/test").Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 780 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

/** 各部の幅と位置を測る。 */
async function 測る(page: import("@playwright/test").Page) {
  return await page.evaluate(() => {
    const r = (s: string): DOMRect | null => document.querySelector(s)?.getBoundingClientRect() ?? null;
    const side = r(".v4-editor-side");
    const toggle = document.querySelector("[data-testid=editor-side-toggle]");
    const doc = document.documentElement;
    return {
      脇幅: side ? Math.round(side.width) : null,
      脇右端: side ? Math.round(side.right) : null,
      脇左端: side ? Math.round(side.left) : null,
      記法欄: Math.round(r(".v4-editor-code")?.width ?? 0),
      絵の欄: Math.round(r(".v4-editor-preview")?.width ?? 0),
      ボタンが見える: toggle !== null && getComputedStyle(toggle).display !== "none",
      幕: document.querySelector("[data-testid=editor-side-backdrop]") !== null,
      横スクロール: Math.round(doc.scrollWidth - doc.clientWidth),
    };
  });
}

test("携帯の幅で記法欄と絵が画面の全幅を使う", async ({ page }) => {
  await openEditor(page, 375);
  const m = await 測る(page);
  // 変更前は記法欄 155 / 絵の欄 155 (脇が 220 を固定で取っていた)
  expect(m.記法欄, "記法欄が狭い").toBeGreaterThanOrEqual(300);
  expect(m.絵の欄, "絵の欄が狭い").toBeGreaterThanOrEqual(300);
  expect(m.横スクロール, "横スクロールが出ている").toBeLessThan(20);
});

test("携帯の幅では脇の一覧が畳まれている", async ({ page }) => {
  await openEditor(page, 375);
  const m = await 測る(page);
  // 画面の外に出ている (右端が画面の左端より左)
  expect(m.脇右端!, `脇が画面に残っている (右端 ${m.脇右端})`).toBeLessThanOrEqual(0);
  expect(m.ボタンが見える, "出し入れのボタンが無い = 一覧に到達できない").toBe(true);
  expect(m.幕, "畳んでいるのに幕が出ている").toBe(false);
});

test("畳んだ一覧は Tab でも読み上げでも触れない", async ({ page }) => {
  // 位置を動かすだけだと、 画面の外に居る見えないボタンに focus が飛ぶ (Round 1 review の
  // 指摘)。 `visibility` で触れなくしていることを、 状態と実際の Tab 移動の両方で見る
  await openEditor(page, 375);
  const 見え方 = await page.evaluate(
    () => getComputedStyle(document.querySelector(".v4-editor-side")!).visibility,
  );
  expect(見え方, "畳んだ一覧が触れる状態で残っている").toBe("hidden");

  await page.locator("[data-testid=editor-side-toggle]").focus();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const 中に居る = await page.evaluate(
      () => document.querySelector(".v4-editor-side")?.contains(document.activeElement) ?? false,
    );
    expect(中に居る, `Tab ${i + 1} 回目で畳んだ一覧の中に入った`).toBe(false);
  }

  // 出した後は触れる (触れなくする指定が出した状態まで巻き込んでいない)
  await page.locator("[data-testid=editor-side-toggle]").click();
  await page.waitForTimeout(400);
  const 出した後 = await page.evaluate(
    () => getComputedStyle(document.querySelector(".v4-editor-side")!).visibility,
  );
  expect(出した後, "出したのに触れない").toBe("visible");
});

test("出し入れのボタンが隣のアイコンと同じ大きさになる", async ({ page }) => {
  // 携帯は指で触るので、 このボタンだけ小さいと押せない。
  //
  // 絶対値では見ない。 狭い画面のアイコンは 26px 角に詰める指定があり (`editor.css`、 指で
  // 押す下限 24px を保つ判断)、 数値を書くと設計を変えた時に検査だけ古くなる。 同じ列の
  // 他のアイコンと同じ大きさかを見る。 `editor-bar-fit.spec.ts` は隠れているボタンを測らない
  // ので、 出ている幅での大きさは本 file が担う
  await openEditor(page, 375);
  const m = await page.evaluate(() => {
    const size = (el: Element): string => {
      const r = el.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    };
    const 全部 = [...document.querySelectorAll(".v4-editor-bar-btn-icon")].filter(
      (el) => getComputedStyle(el).display !== "none",
    );
    const toggle = document.querySelector("[data-testid=editor-side-toggle]")!;
    return {
      出し入れ: size(toggle),
      他: [...new Set(全部.filter((el) => el !== toggle).map(size))],
      個数: 全部.length,
    };
  });
  expect(m.個数, "アイコンが測れていない").toBeGreaterThan(3);
  expect(m.他, `隣のアイコンの大きさが揃っていない: ${m.他.join(", ")}`).toHaveLength(1);
  expect(m.出し入れ, "出し入れのボタンだけ大きさが違う").toBe(m.他[0]);
});

test("ボタンで脇の一覧を出せる", async ({ page }) => {
  await openEditor(page, 375);
  await page.locator("[data-testid=editor-side-toggle]").click();
  await page.waitForTimeout(400);
  const m = await 測る(page);
  expect(m.脇左端, "出したのに画面の外にある").toBe(0);
  expect(m.脇幅!, "出した一覧が狭い").toBeGreaterThanOrEqual(240);
  expect(m.幕, "本体側に戻る幕が無い").toBe(true);
});

test("幕を押すと脇の一覧が閉じる", async ({ page }) => {
  await openEditor(page, 375);
  await page.locator("[data-testid=editor-side-toggle]").click();
  await page.waitForTimeout(400);
  // 幕は一覧の下にも敷いてあるので、 中央を押すと一覧が受け取る。 一覧の右側 (見えている
  // 帯) を押す = 実際に user が触れる場所と同じ
  await page.locator("[data-testid=editor-side-backdrop]").click({ position: { x: 340, y: 300 } });
  await page.waitForTimeout(400);
  const m = await 測る(page);
  expect(m.脇右端!, "幕を押しても閉じない").toBeLessThanOrEqual(0);
});

test("Esc で脇の一覧が閉じる", async ({ page }) => {
  await openEditor(page, 375);
  await page.locator("[data-testid=editor-side-toggle]").click();
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const m = await 測る(page);
  expect(m.脇右端!, "Esc で閉じない").toBeLessThanOrEqual(0);
});

test("見本を選ぶと脇の一覧が閉じて本文が変わる", async ({ page }) => {
  await openEditor(page, 375);
  const 本文 = async (): Promise<string> =>
    (await page.locator(".v4-editor-code-body").first().textContent())?.trim() ?? "";
  const 前 = await 本文();
  await page.locator("[data-testid=editor-side-toggle]").click();
  await page.waitForTimeout(400);
  // 既定サンプル (ログインAPI呼び出し) ではない見本を選ぶ
  await page.locator("[data-testid=editor-sample-flow]").first().click();
  await page.waitForTimeout(800);
  const m = await 測る(page);
  expect(m.脇右端!, "見本を選んでも一覧が残る = 選んだ図が見えない").toBeLessThanOrEqual(0);
  expect(await 本文(), "見本を選んでも本文が変わらない").not.toBe(前);
});

test("携帯の幅でも見本 / パーツ / 記法の 3 つに到達できる", async ({ page }) => {
  await openEditor(page, 375);
  await page.locator("[data-testid=editor-side-toggle]").click();
  await page.waitForTimeout(400);
  const tabs = page.locator(".v4-editor-side-tab");
  await expect(tabs, "タブが 3 つ無い").toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(tabs.nth(i), `${i} 番目のタブが押せない`).toBeVisible();
  }
});

for (const { 幅, 脇, 記法欄, 絵の欄 } of 広い画面) {
  test(`画面幅 ${幅}px の見た目は変わらない`, async ({ page }) => {
    await openEditor(page, 幅);
    const m = await 測る(page);
    expect(m.脇幅, "脇の幅が動いた").toBe(脇);
    expect(m.記法欄, "記法欄の幅が動いた").toBe(記法欄);
    expect(m.絵の欄, "絵の欄の幅が動いた").toBe(絵の欄);
    // 広い画面では脇が常に出ているので、出し入れのボタンは押す先が無い
    expect(m.ボタンが見える, "広い画面に出し入れのボタンが出ている").toBe(false);
    expect(m.横スクロール, "横スクロールが出ている").toBeLessThan(20);
  });
}
