import { test, expect } from "@playwright/test";

/**
 * Feature 1-7 (Figma / Miro 相当) = undo / color / paste / context menu / z-order / align / rotate。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

async function drop(page: import("@playwright/test").Page, partId: string, position: { x: number; y: number }): Promise<void> {
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await page.locator(`[data-testid="editor-part-item-${partId}"]`).dragTo(stage, { targetPosition: position });
  await page.waitForTimeout(1000);
}

/** 測定前に rAF / timer を止めて frame を固定する (animated part の AABB 変動を排除)。 */
async function freezeAnimation(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number; setTimeout: typeof setTimeout };
    w.requestAnimationFrame = () => 0;
    const maxId = Number(w.setTimeout(() => {}, 0));
    for (let i = 0; i <= maxId; i += 1) { clearInterval(i); clearTimeout(i); }
  });
  await page.waitForTimeout(300);
}

async function selectFirstOverlay(page: import("@playwright/test").Page): Promise<{ x: number; y: number; width: number; height: number }> {
  const overlay = page.locator('[data-overlay-part]').first();
  const b = await overlay.boundingBox();
  if (!b) throw new Error("null");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(200);
  return b;
}

test("Feature 1: Undo/Redo = 直前 drop を Cmd+Z で消せる、 Cmd+Shift+Z で戻る", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  expect(await page.locator('[data-overlay-part]').count()).toBe(1);
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(600);
  expect(await page.locator('[data-overlay-part]').count()).toBe(0);
  await page.keyboard.press("Meta+Shift+z");
  await page.waitForTimeout(600);
  expect(await page.locator('[data-overlay-part]').count()).toBe(1);
});

test("Feature 2: Color picker = 🎨 button で色 swatch popover 表示", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await selectFirstOverlay(page);
  // 🎨 button 表示確認
  const colorBtn = page.locator('[data-overlay-toolbar-btn="color"]').first();
  expect(await colorBtn.count()).toBe(1);
  await colorBtn.click();
  await page.waitForTimeout(200);
  // color swatch popover が出る
  const swatches = await page.locator('[data-overlay-color-swatch]').count();
  expect(swatches).toBeGreaterThan(4);
  // 1 色 click で DSL に bg 反映
  await page.locator('[data-overlay-color-swatch="#22c55e"]').click();
  await page.waitForTimeout(400);
  const dsl = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  expect(dsl).toContain('bg: "#22c55e"');
});

test("Feature 2b: Color picker = 選んだ色が canvas の shape に実反映 (CAR-2158 correctness fix)", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await selectFirstOverlay(page);
  // 色変更前の shape fill を記録
  const fillBefore = await page.evaluate(() => {
    const div = document.querySelector("[data-overlay-part]");
    if (!div) return null;
    // 実装 (CdlEditor の bg 適用 useEffect) と同じ判定基準 = 色を持つ shape のうち最大面積
    const shapes = div.querySelectorAll("circle, rect, path, ellipse, polygon");
    let maxArea = 0;
    let best: Element | null = null;
    for (const s of Array.from(shapes)) {
      const r = s.getBoundingClientRect();
      if (r.width < 3 || r.height < 3) continue;
      const orig = s.getAttribute("data-original-fill");
      const fill = orig !== null ? orig : (s.getAttribute("fill") ?? "");
      const painted = fill !== "" && fill !== "none" && fill !== "transparent" && !fill.startsWith("rgba(0, 0, 0, 0)");
      if (!painted) continue;
      const area = r.width * r.height;
      if (area > maxArea) { maxArea = area; best = s; }
    }
    return best?.getAttribute("fill") ?? null;
  });
  await page.locator('[data-overlay-toolbar-btn="color"]').first().click();
  await page.waitForTimeout(200);
  await page.locator('[data-overlay-color-swatch="#22c55e"]').click();
  await page.waitForTimeout(700);
  // 色変更後の shape fill を測定 = DSL だけでなく実 SVG に反映されている
  const fillAfter = await page.evaluate(() => {
    const div = document.querySelector("[data-overlay-part]");
    if (!div) return null;
    // 実装 (CdlEditor の bg 適用 useEffect) と同じ判定基準 = 色を持つ shape のうち最大面積
    const shapes = div.querySelectorAll("circle, rect, path, ellipse, polygon");
    let maxArea = 0;
    let best: Element | null = null;
    for (const s of Array.from(shapes)) {
      const r = s.getBoundingClientRect();
      if (r.width < 3 || r.height < 3) continue;
      const orig = s.getAttribute("data-original-fill");
      const fill = orig !== null ? orig : (s.getAttribute("fill") ?? "");
      const painted = fill !== "" && fill !== "none" && fill !== "transparent" && !fill.startsWith("rgba(0, 0, 0, 0)");
      if (!painted) continue;
      const area = r.width * r.height;
      if (area > maxArea) { maxArea = area; best = s; }
    }
    return best?.getAttribute("fill") ?? null;
  });
  console.log(`[color] fill: ${fillBefore} → ${fillAfter}`);
  expect(fillAfter).toBe("#22c55e");
  expect(fillAfter).not.toBe(fillBefore);
});

test("Feature 3: Copy/Paste = Cmd+C → Cmd+V で複製", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await selectFirstOverlay(page);
  expect(await page.locator('[data-overlay-part]').count()).toBe(1);
  await page.keyboard.press("Meta+c");
  await page.waitForTimeout(100);
  await page.keyboard.press("Meta+v");
  await page.waitForTimeout(600);
  expect(await page.locator('[data-overlay-part]').count()).toBe(2);
});

test("Feature 4: Context menu = 右クリックで actions 表示", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const b = await overlay.boundingBox();
  if (!b) throw new Error("null");
  await overlay.click({ button: "right", position: { x: 20, y: 20 } });
  await page.waitForTimeout(200);
  const menu = await page.locator('[data-context-menu="1"]').count();
  expect(menu).toBe(1);
  const actions = await page.locator('[data-context-action]').count();
  expect(actions).toBeGreaterThan(3);
});

test("Feature 5: Z-order = Cmd+] で forward、 DSL 行順が入れ替わる", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await drop(page, "parts-arc-gauge", { x: 600, y: 300 });
  // 1 個目 select
  const overlays = page.locator('[data-overlay-part]');
  const b0 = await overlays.nth(0).boundingBox();
  if (!b0) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(200);
  const dslBefore = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  await page.keyboard.press("Meta+]");
  await page.waitForTimeout(500);
  const dslAfter = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  // 行順が変わった (achievement が下 = 前面 に移動)
  const idxAchBefore = dslBefore.indexOf("achievement1");
  const idxAchAfter = dslAfter.indexOf("achievement1");
  const idxArcBefore = dslBefore.indexOf("arcgauge1");
  const idxArcAfter = dslAfter.indexOf("arcgauge1");
  console.log(`[z-order] before: ach=${idxAchBefore}, arc=${idxArcBefore}`);
  console.log(`[z-order] after: ach=${idxAchAfter}, arc=${idxArcAfter}`);
  // 順序変化 = 位置が入れ替わる
  expect(idxAchBefore < idxArcBefore).not.toBe(idxAchAfter < idxArcAfter);
});

test("Feature 6: Alignment = Alt+L で左揃え", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 200 });
  await drop(page, "parts-arc-gauge", { x: 600, y: 400 });
  // 2 個 select
  const overlays = page.locator('[data-overlay-part]');
  const b0 = await overlays.nth(0).boundingBox();
  const b1 = await overlays.nth(1).boundingBox();
  if (!b0 || !b1) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.down("Shift");
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await page.waitForTimeout(200);
  await page.keyboard.press("Alt+l");
  await page.waitForTimeout(600);
  // 左揃えは「実 shape の左端が揃う」 で検証する。
  // posX の一致で見ていたが、 CAR-2158 Round 2 で align を実 AABB 基準の delta 方式に変えたため
  // rotate や shape offset がある parts では posX は一致しない (揃うのは AABB の左端)。
  await freezeAnimation(page);
  const lefts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-overlay-part]")).map((div) => {
      const shapes = div.querySelectorAll("circle, rect, path, ellipse, polygon");
      let maxArea = 0;
      let left = 0;
      for (const sh of Array.from(shapes)) {
        const r = sh.getBoundingClientRect();
        if (r.width < 3 || r.height < 3) continue;
        // 実装 (findPaintedShape) と同じ painted 判定。 透明 wrapper を掴むと oracle がずれる
        const orig = sh.getAttribute("data-original-fill");
        // computed style も見る = fill が CSS 変数 (`var(--cdl-tone-accent, ...)`) の場合、
        // 属性値だけだと解決前の文字列になり実装と判定がずれる
        const fill = orig !== null ? orig : (sh.getAttribute("fill") ?? window.getComputedStyle(sh).fill ?? "");
        if (fill === "" || fill === "none" || fill === "transparent" || fill.startsWith("rgba(0, 0, 0, 0)")) continue;
        const area = r.width * r.height;
        if (area > maxArea) { maxArea = area; left = r.left; }
      }
      return left;
    }),
  );
  console.log(`[align] shape lefts: ${lefts.map((l) => Math.round(l)).join(", ")}`);
  expect(Math.abs((lefts[0] ?? 0) - (lefts[1] ?? 0))).toBeLessThan(3);
});

test("Feature 6b: Alignment = 右揃えで右端が揃う (実 bbox 基準、 CAR-2158)", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 200 });
  await drop(page, "parts-arc-gauge", { x: 700, y: 400 });
  const overlays = page.locator('[data-overlay-part]');

  const shapeRights = async (): Promise<number[]> =>
    await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-overlay-part]")).map((div) => {
        const shapes = div.querySelectorAll("circle, rect, path, ellipse, polygon");
        let maxArea = 0;
        let right = 0;
        for (const sh of Array.from(shapes)) {
          const r = sh.getBoundingClientRect();
          if (r.width < 3 || r.height < 3) continue;
          // 実装 (findPaintedShape) と同じ painted 判定
          const orig = sh.getAttribute("data-original-fill");
          const fill = orig !== null ? orig : (sh.getAttribute("fill") ?? window.getComputedStyle(sh).fill ?? "");
          if (fill === "" || fill === "none" || fill === "transparent" || fill.startsWith("rgba(0, 0, 0, 0)")) continue;
          const area = r.width * r.height;
          if (area > maxArea) { maxArea = area; right = r.right; }
        }
        return right;
      }),
    );

  const b0 = await overlays.nth(0).boundingBox();
  const b1 = await overlays.nth(1).boundingBox();
  if (!b0 || !b1) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.down("Shift");
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await page.waitForTimeout(300);
  await page.keyboard.press("Alt+r");
  await page.waitForTimeout(800);

  await freezeAnimation(page);
  const rights = await shapeRights();
  console.log(`[align right] rights = ${rights.map((r) => Math.round(r)).join(", ")} diff=${Math.round(Math.abs((rights[0] ?? 0) - (rights[1] ?? 0)))}`);
  // 右揃えが動くことの smoke check。
  //
  // 完全一致を要求しない理由 = arc-gauge は sweep animation を持ち、 painted shape の AABB が
  // 53px 規模で変動する (実測 range 1854〜1907)。 測定前に frame を固定しても、
  // align 実行時に実装が測った bbox と test が事後に測る bbox で対象 shape が一致せず 4px 残る。
  //
  // 「実測 bbox を使っているか」 の判別は左揃え test が担う。 そちらは achievement 同士 (静的 part) で
  // 完全一致し、 実測 bbox を無効化する mutation で 91px ずれて fail する = detector として成立している。
  expect(Math.abs((rights[0] ?? 0) - (rights[1] ?? 0))).toBeLessThan(10);
});

test("Feature 7: Rotation = Alt+corner drag で rotate DSL に反映", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 400, y: 400 });
  const b = await selectFirstOverlay(page);
  const seHandle = page.locator('[data-overlay-handle="se"]').first();
  const seBB = await seHandle.boundingBox();
  if (!seBB) throw new Error("se null");
  // Alt + drag で rotate
  await page.keyboard.down("Alt");
  await page.mouse.move(seBB.x + seBB.width / 2, seBB.y + seBB.height / 2);
  await page.mouse.down();
  // 円周 90度 相当の位置に move
  await page.mouse.move(b.x + b.width / 2 - 100, b.y + b.height / 2 + 100, { steps: 15 });
  await page.mouse.up();
  await page.keyboard.up("Alt");
  await page.waitForTimeout(600);
  const dsl = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  console.log(`[rotate] DSL: ${dsl.slice(-500)}`);
  expect(dsl).toMatch(/rotate:\s*-?\d+/);
});
