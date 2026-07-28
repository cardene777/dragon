import { test, expect } from "@playwright/test";

/**
 * 編集画面の選択 UI と文字編集の見え方 (CAR-2292)。
 *
 * user 指摘の 4 点を固定する。
 *
 * 1. 図全体の囲いが出ない
 * 2. 図の要素は個別に拡大できないので 4 隅 handle は不要 (点線だけでよい)
 * 3. 文字入力欄が中身に対して大きすぎる / 中央に無い
 * 4. 要素を横に動かした時、 矢印のラベルだけ追従しない
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1600, height: 1000 } });

const STAGE_SVG = '[data-testid="editor-preview-stage"] svg[viewBox]';

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

/** 要素を click して選択する。 */
async function selectNode(page: import("@playwright/test").Page, nodeId: string): Promise<void> {
  const b = (await page.locator(`[data-cdl-node="${nodeId}"]`).first().boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(350);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(500);
}

test("図の内側を click すると図全体の囲いが出る", async ({ page }) => {
  await openEditor(page);
  const svg = (await page.locator(STAGE_SVG).boundingBox())!;
  // 図の内側で、 要素が無い隅を click する
  await page.mouse.click(svg.x + svg.width - 12, svg.y + svg.height - 12);
  await page.waitForTimeout(500);

  const outline = page.locator("[data-cdl-diagram-outline]");
  expect(await outline.count(), "図全体の囲い").toBe(1);

  // 囲いは図の実描画範囲に一致する (倍率や pan で動いてもずれない)
  const ob = (await outline.boundingBox())!;
  expect(Math.abs(ob.width - svg.width), "囲いの幅").toBeLessThan(2);
  expect(Math.abs(ob.height - svg.height), "囲いの高さ").toBeLessThan(2);
});

test("図の外を click しても囲いは出ない", async ({ page }) => {
  await openEditor(page);
  const svg = (await page.locator(STAGE_SVG).boundingBox())!;
  const stage = (await page.locator('[data-testid="editor-preview-stage"]').boundingBox())!;
  // 図より上の余白 (stage の内側だが svg の外) を click
  const y = Math.max(stage.y + 4, svg.y - 20);
  if (y < svg.y) {
    await page.mouse.click(svg.x + svg.width / 2, y);
    await page.waitForTimeout(500);
    expect(await page.locator("[data-cdl-diagram-outline]").count()).toBe(0);
  }
});

test("要素の選択は点線だけで 4 隅 handle を出さない", async ({ page }) => {
  await openEditor(page);
  await selectNode(page, "client-header");
  // 図の要素は個別に拡大できない。 掴める形の handle を出すと「引っ張れば大きくなる」 と読める
  expect(await page.locator("[data-cdl-outline]").count(), "点線の囲い").toBeGreaterThan(0);
  expect(await page.locator("[data-cdl-handle]").count(), "4 隅 handle").toBe(0);
});

test("文字入力欄は中身の幅で元の文字の中心に出る", async ({ page }) => {
  await openEditor(page);
  const target = await page.evaluate((sel) => {
    for (const t of Array.from(document.querySelectorAll(`${sel} text`))) {
      const r = t.getBoundingClientRect();
      if (r.width > 5 && r.height > 5) return { x: r.left, y: r.top, width: r.width, height: r.height };
    }
    return null;
  }, STAGE_SVG);
  if (!target) throw new Error("編集できる text が無い");

  await page.mouse.dblclick(target.x + target.width / 2, target.y + target.height / 2);
  await page.waitForTimeout(700);
  const input = page.locator('[data-testid="editor-text-edit-input"]');
  expect(await input.count(), "入力欄").toBe(1);
  const ib = (await input.boundingBox())!;

  // 入力欄の既定幅 (size=20 相当 = 256px 前後) まで広がらない。
  // `input.scrollWidth` は中身に関係なく既定幅を返すので、 それで測ると必ず 256px になる
  expect(ib.width, "入力欄の幅").toBeLessThan(target.width + 100);
  // 元の文字の中心に揃う (幅が変わっても中心が動かない形)
  const cx = (v: { x: number; width: number }) => v.x + v.width / 2;
  expect(Math.abs(cx(ib) - cx(target)), "中心のずれ").toBeLessThan(12);
});

test("入力欄は打った分だけ伸びるが中心は動かない", async ({ page }) => {
  await openEditor(page);
  const target = await page.evaluate((sel) => {
    for (const t of Array.from(document.querySelectorAll(`${sel} text`))) {
      const r = t.getBoundingClientRect();
      if (r.width > 5 && r.height > 5) return { x: r.left, y: r.top, width: r.width, height: r.height };
    }
    return null;
  }, STAGE_SVG);
  if (!target) throw new Error("編集できる text が無い");
  const centerX = target.x + target.width / 2;

  await page.mouse.dblclick(centerX, target.y + target.height / 2);
  await page.waitForTimeout(700);
  const input = page.locator('[data-testid="editor-text-edit-input"]');
  const before = (await input.boundingBox())!;

  await input.fill("これはかなり長い文字列を入れた場合の確認です");
  await page.waitForTimeout(300);
  const after = (await input.boundingBox())!;

  expect(after.width, "打った分だけ伸びる").toBeGreaterThan(before.width);
  const cx = (v: { x: number; width: number }) => v.x + v.width / 2;
  expect(Math.abs(cx(after) - cx(before)), "中心は動かない").toBeLessThan(4);

  await page.keyboard.press("Escape");
});

test("要素を横に動かすと矢印のラベルも追従する", async ({ page }) => {
  await openEditor(page);
  // ラベルは矢印の <g> の外側に別 group で描かれる。 矢印の中を探す実装だと 1 つも
  // 見つからず、 線だけ動いてラベルが取り残される。
  const labelX = async (edgeId: string): Promise<number> =>
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-cdl-edge-label-for="${id}"]`);
      return el ? (el as SVGGElement).getBoundingClientRect().x : NaN;
    }, edgeId);

  const movedBefore = await labelX("e0-client-api");
  const untouchedBefore = await labelX("e1-api-db");

  const b = (await page.locator('[data-cdl-node="client-header"]').first().boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 150, b.y + b.height / 2, { steps: 12 });

  const movedDuring = await labelX("e0-client-api");
  const untouchedDuring = await labelX("e1-api-db");
  await page.mouse.up();
  await page.waitForTimeout(800);

  // 掴んだ actor に繋がる矢印のラベルは drag 中に動く
  expect(Math.abs(movedDuring - movedBefore), "繋がるラベル").toBeGreaterThan(20);
  // 無関係な矢印のラベルは動かない
  expect(Math.abs(untouchedDuring - untouchedBefore), "無関係なラベル").toBeLessThan(2);
});

test("drag を終えるとラベルの一時的な移動は残らない", async ({ page }) => {
  await openEditor(page);
  const b = (await page.locator('[data-cdl-node="client-header"]').first().boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 120, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);

  // drag 中の追従は inline style で当てる。 mouseup 後は DSL 反映後の再 render が正なので、
  // style が残っていると二重にずれる
  const leftover = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-cdl-edge-label-for]"))
      .filter((el) => (el as SVGGElement).style.transform !== "").length,
  );
  expect(leftover, "残った inline transform").toBe(0);
});
