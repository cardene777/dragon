import { test, expect } from "@playwright/test";

/**
 * cdl 要素 (Client / API / DB header、 arrow label) の選択 UI 実測。
 *
 * 2026-07-26 CAR-2158 consistency fix = 現行 spec に追従。
 * Phase 1 (eb7b9be) で hover UI から handle 削除、 Phase 4 revert (4523bf9) で cdl の実 drag/resize を
 * 撤去 (cdl actor の header/spacer/footer 複合構造で分裂する root cause、 CAR-2156 で core 再設計待ち)。
 *
 * 現行 spec:
 *   - hover = 薄 blue dashed border のみ (handle なし)
 *   - click 選択 = 濃 dashed border + 4 隅 handle (`[data-cdl-handle]`、 pointerEvents: none = 表示のみ)
 *   - 実 drag/resize は overlay parts のみ対応、 cdl 要素は CAR-2156 完了後に復元
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

async function selectCdlNode(page: import("@playwright/test").Page, nodeId: string): Promise<{ x: number; y: number; width: number; height: number }> {
  const node = page.locator(`[data-cdl-node="${nodeId}"]`).first();
  const bb = await node.boundingBox();
  if (!bb) throw new Error(`${nodeId} null`);
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  return bb;
}

test("selection 1 = Client lane header click 選択で 4 隅 handle 表示 (実 resize は CAR-2156 待ち)", async ({ page }) => {
  await openEditor(page);
  await selectCdlNode(page, "client-header");
  // 選択 UI = outline 1 + handle 4
  const outlineCount = await page.locator('[data-cdl-outline]').count();
  const handleCount = await page.locator('[data-cdl-handle]').count();
  expect(outlineCount).toBe(1);
  expect(handleCount).toBe(4);
  // 4 隅 handle の corner 属性が全て揃う
  for (const corner of ["nw", "ne", "sw", "se"]) {
    expect(await page.locator(`[data-cdl-handle="${corner}"]`).count()).toBe(1);
  }
});

test("selection 2 = 選択枠が Client 単独 bbox に追従 (SVG 全体を囲わない)", async ({ page }) => {
  await openEditor(page);
  const nodeBB = await selectCdlNode(page, "client-header");
  const outline = page.locator('[data-cdl-outline]').first();
  const outlineBB = await outline.boundingBox();
  if (!outlineBB) throw new Error("outline null");
  // 選択枠が対象 node の bbox に一致する。
  // 2026-07-26 CAR-2158 fix = height を assert に追加し、 許容誤差を 25px → 3px に縮めた。
  // 旧 test は height 未検証 + 25px 許容で、 outline が SVG 全体まで伸びる regression を pass させていた
  // (本 spec が検証したい「SVG 全体を囲わない」 の対象そのものを見逃していた)。
  expect(Math.abs(outlineBB.x - nodeBB.x)).toBeLessThan(3);
  expect(Math.abs(outlineBB.y - nodeBB.y)).toBeLessThan(3);
  expect(Math.abs(outlineBB.width - nodeBB.width)).toBeLessThan(3);
  expect(Math.abs(outlineBB.height - nodeBB.height)).toBeLessThan(3);
});

test("selection 3 = arrow label hover で 薄 border、 click で 4 隅 handle", async ({ page }) => {
  await openEditor(page);
  const labels = await page.locator('.v4-editor-preview svg text').evaluateAll((els) =>
    els.map((el) => ({ content: (el.textContent ?? "").slice(0, 20), r: el.getBoundingClientRect() })).filter((l) => l.content.includes("ログイン")),
  );
  if (labels.length === 0) throw new Error("ログイン要求 label not found");
  const l = labels[0]!;
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);
  // hover = 薄 border indicator (handle なし)
  await page.mouse.move(l.r.x + l.r.width / 2, l.r.y + l.r.height / 2);
  await page.waitForTimeout(400);
  expect(await page.locator('[data-cdl-hover-outline]').count()).toBe(1);
  expect(await page.locator('[data-cdl-handle]').count()).toBe(0);
  // click 選択 = 4 隅 handle 表示
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.locator('[data-cdl-handle]').count()).toBe(4);
});

test("cdl drag = actor 全体 (header + footer) が一体で横移動する (CAR-2156)", async ({ page }) => {
  await openEditor(page);
  const header = page.locator('[data-cdl-node="client-header"]').first();
  const footer = page.locator('[data-cdl-node="client-footer"]').first();
  const h0 = await header.boundingBox();
  const f0 = await footer.boundingBox();
  if (!h0 || !f0) throw new Error("client header/footer null");
  const dslBefore = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");

  await page.mouse.move(h0.x + h0.width / 2, h0.y + h0.height / 2);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.mouse.move(h0.x + h0.width / 2 + 120, h0.y + h0.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(900);

  const h1 = await header.boundingBox();
  const f1 = await footer.boundingBox();
  if (!h1 || !f1) throw new Error("null after drag");
  const dslAfter = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");

  const headerDx = h1.x - h0.x;
  const footerDx = f1.x - f0.x;
  console.log(`[cdl drag] header dx=${Math.round(headerDx)} footer dx=${Math.round(footerDx)}`);

  const headerDy = h1.y - h0.y;
  const footerDy = f1.y - f0.y;
  console.log(`[cdl drag] header dy=${Math.round(headerDy)} footer dy=${Math.round(footerDy)}`);

  // header が実際に移動した (drag が効いている)
  expect(Math.abs(headerDx)).toBeGreaterThan(50);
  // 縦にも同じだけ動く (= 動かないので両方 0 付近)。 lane に posY を書くと row 起点が動く一方
  // lane 高さが footer 位置から再計算され、 header と footer が別々にずれる
  // (実測 = header dy 46 に対し footer dy 8)。 その分裂を検知する。
  expect(Math.abs(footerDy - headerDy)).toBeLessThan(5);
  // footer も同じだけ移動した = 分裂していない (Phase 4 で revert した症状の regression detector)
  expect(Math.abs(footerDx - headerDx)).toBeLessThan(5);
  // DSL に座標が書き出された
  expect(dslAfter).not.toBe(dslBefore);
  expect(dslAfter).toContain("posX");
});

test("cdl drag = 掴んでいない actor の座標が変わらない (勝手な移動の regression detector)", async ({ page }) => {
  await openEditor(page);
  const readPosX = async (name: string): Promise<number | null> =>
    await page.evaluate((n) => {
      const dsl = document.querySelector(".cm-content")?.textContent ?? "";
      const m = dsl.match(new RegExp(`- ${n}: \\{[^}]*posX: (-?\\d+)`));
      return m ? Number(m[1]) : null;
    }, name);

  const dragClient = async (dx: number): Promise<void> => {
    const bb = await page.locator('[data-cdl-node="client-header"]').first().boundingBox();
    if (!bb) throw new Error("null");
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(300);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width / 2 + dx, bb.y + bb.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(900);
  };

  await dragClient(60);
  const api1 = await readPosX("API");
  const db1 = await readPosX("DB");
  const client1 = await readPosX("Client");
  // 掴んでいない actor にも座標が書かれる = 以降の compile で並べ直しが起きない
  expect(api1).not.toBeNull();
  expect(db1).not.toBeNull();
  expect(client1).not.toBeNull();

  // 2 回目の drag でも、 掴んでいない actor の座標は 1px も変わらない。
  // 全 actor に座標を書かないと lane の並べ直しが起きて数百 px 動く
  // (実測 = Client を +200 したとき API が -565)。
  await dragClient(60);
  const api2 = await readPosX("API");
  const db2 = await readPosX("DB");
  const client2 = await readPosX("Client");
  console.log(`[cdl fix] API ${api1} → ${api2} / DB ${db1} → ${db2} / Client ${client1} → ${client2}`);
  expect(api2).toBe(api1);
  expect(db2).toBe(db1);
  // 掴んだ actor だけが動いている
  expect(client2).not.toBe(client1);
});

test("cdl drag = actor 順序が入れ替わらない (Client / API / DB の x 順序保持)", async ({ page }) => {
  await openEditor(page);
  const readOrder = async (): Promise<string[]> =>
    await page.evaluate(() => {
      const ids = ["client-header", "api-header", "db-header"];
      return ids
        .map((id) => ({ id, x: document.querySelector(`[data-cdl-node="${id}"]`)?.getBoundingClientRect().x ?? 0 }))
        .sort((a, b) => a.x - b.x)
        .map((e) => e.id);
    });
  const before = await readOrder();
  const header = page.locator('[data-cdl-node="client-header"]').first();
  const bb = await header.boundingBox();
  if (!bb) throw new Error("null");
  // 右に少しだけ動かす (API を追い越さない範囲)
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2 + 40, bb.y + bb.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const after = await readOrder();
  console.log(`[cdl order] before=${before.join(",")} after=${after.join(",")}`);
  expect(after).toEqual(before);
});
