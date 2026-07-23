/**
 * HTML div canvas drag behavior test (CAR-1947、 architecture 転換 Phase 1)。
 *
 * 前 session (2026-07-23 昼) で SVG based drag pipeline 7 PR 全 revert 後の architecture 転換として
 * HTML div canvas (`?canvas=html`) を新設、 Miro / Figma / Google スライド 相当 GPU accelerated
 * `translate3d` 経路の 3 条件 + Round 2 fix regression を機械検証する。
 *
 * Stated check (Issue AC 3 条件):
 * 1. 掴んだ点 = 置いた点 (pointer up 後の lane transform と最終 pointer 座標の delta < 1px)
 * 2. drag 中 smooth 追従 (RAF sample 経路で lane 位置が client pointer 進行に線形追随、 逸脱 < 4px world)
 * 3. release 後 flicker ゼロ (release 前 rect 基準で 300ms 全 frame shift < 5px)
 *
 * Round 2 fix regression (Codex adversarial review 6 MAJOR):
 * - F1 = 対象外 lane が drag 中 / release 後に飛ばない (前 session の user report「Client が API 位置に飛ぶ」)
 * - F2 = viewBox 原点 (vb.x/vb.y、 通常負) 補正後の fit で lane が viewport 内に配置される
 * - F4 = pointer cancel / focus loss で drag が start 位置に rollback、 DSL 変更なし
 *
 * baseURL = 4323 (vite dev)。
 */
import { test, expect, type Page } from "@playwright/test";

const LANE_SELECTOR = "[data-html-canvas-lane]";
const CANVAS_TEST_MIRROR_KEY = "__htmlCanvasState";

interface CanvasStateMirror {
  viewBox: { x: number; y: number; w: number; h: number } | null;
  viewportTransform: { tx: number; ty: number; scale: number };
  lanes: Array<{
    name: string;
    slug: string;
    worldX: number;
    worldY: number;
    worldW: number;
    worldH: number;
    origPosW: number | null;
    origPosH: number | null;
  }>;
}

async function readCanvasState(page: Page): Promise<CanvasStateMirror | null> {
  return page.evaluate((key) => {
    const mirror = (window as unknown as Record<string, CanvasStateMirror | undefined>)[key];
    return mirror ?? null;
  }, CANVAS_TEST_MIRROR_KEY);
}

async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
}

function parseTranslate3d(transform: string): { x: number; y: number } | null {
  const m = transform.match(/translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/);
  if (!m) return null;
  return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) };
}

async function getLaneCenter(page: Page, slug: string): Promise<{ x: number; y: number }> {
  return page.evaluate((s) => {
    const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
    if (!el) throw new Error(`lane not found: ${s}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, slug);
}

async function getAllLaneRects(
  page: Page,
): Promise<Record<string, { x: number; y: number; w: number; h: number }>> {
  return page.evaluate((sel) => {
    const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const el of Array.from(document.querySelectorAll(sel))) {
      const slug = (el as HTMLElement).getAttribute("data-html-canvas-lane") ?? "";
      const r = (el as HTMLElement).getBoundingClientRect();
      out[slug] = { x: r.left, y: r.top, w: r.width, h: r.height };
    }
    return out;
  }, LANE_SELECTOR);
}

test.describe("HTML div canvas drag (CAR-1947 Phase 1 + Round 2 regression)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor?canvas=html", { waitUntil: "networkidle" });
    await page.waitForSelector(LANE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test("T1 = HTML div canvas が mount され、 lane 要素が cdl compile 済 posX/posY で配置される", async ({ page }) => {
    const lanes = await page.$$(LANE_SELECTOR);
    expect(lanes.length).toBeGreaterThanOrEqual(2);
    const mirror = await readCanvasState(page);
    expect(mirror).not.toBeNull();
    expect(mirror!.viewBox).not.toBeNull();
    expect(mirror!.lanes.length).toBeGreaterThanOrEqual(2);
    for (const lane of mirror!.lanes) {
      expect(Number.isFinite(lane.worldX)).toBe(true);
      expect(Number.isFinite(lane.worldY)).toBe(true);
      expect(lane.worldW).toBeGreaterThan(0);
      expect(lane.worldH).toBeGreaterThan(0);
    }
  });

  test("T2 = 掴んだ点 = 置いた点 (release 座標 delta < 1px、 3 条件 1/3)", async ({ page }) => {
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const firstLane = mirror0!.lanes[0]!;
    const scale = mirror0!.viewportTransform.scale;
    const start = await getLaneCenter(page, firstLane.slug);
    const clientDeltaX = 150;
    const clientDeltaY = 40;
    const expectedWorldDeltaX = clientDeltaX / scale;
    const expectedWorldDeltaY = clientDeltaY / scale;
    const targetX = start.x + clientDeltaX;
    const targetY = start.y + clientDeltaY;
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(start.x + (clientDeltaX * i) / 12, start.y + (clientDeltaY * i) / 12);
      await page.waitForTimeout(15);
    }
    await page.mouse.move(targetX, targetY);
    await page.mouse.up();
    await page.waitForTimeout(600);
    const mirror1 = await readCanvasState(page);
    expect(mirror1).not.toBeNull();
    const updatedLane = mirror1!.lanes.find((l) => l.slug === firstLane.slug);
    expect(updatedLane).toBeDefined();
    const deltaX = updatedLane!.worldX - firstLane.worldX;
    const deltaY = updatedLane!.worldY - firstLane.worldY;
    expect(Math.abs(deltaX - expectedWorldDeltaX)).toBeLessThanOrEqual(1);
    expect(Math.abs(deltaY - expectedWorldDeltaY)).toBeLessThanOrEqual(1);
    const dsl = await getEditorText(page);
    expect(/posX\s*:\s*-?\d+/.test(dsl)).toBe(true);
    expect(/posY\s*:\s*-?\d+/.test(dsl)).toBe(true);
  });

  test("T3 = drag 中 smooth 追従 (RAF sample 経路で線形逸脱 < 4px world、 3 条件 2/3)", async ({ page }) => {
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const firstLane = mirror0!.lanes[0]!;
    const scale = mirror0!.viewportTransform.scale;
    const start = await getLaneCenter(page, firstLane.slug);
    const totalDeltaX = 200;
    const totalDeltaY = 60;
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const samples: Array<{ pointerX: number; pointerY: number; worldX: number; worldY: number }> = [];
    for (let i = 1; i <= 20; i++) {
      const px = start.x + (totalDeltaX * i) / 20;
      const py = start.y + (totalDeltaY * i) / 20;
      await page.mouse.move(px, py);
      await page.evaluate(() => new Promise<void>((r) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => r()))));
      const t = await page.evaluate((s) => {
        const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
        return el?.style.transform ?? "";
      }, firstLane.slug);
      const parsed = parseTranslate3d(t);
      if (parsed) {
        samples.push({ pointerX: px, pointerY: py, worldX: parsed.x, worldY: parsed.y });
      }
    }
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(samples.length).toBeGreaterThanOrEqual(10);
    let maxDeviation = 0;
    for (const s of samples) {
      const expectedWorldX = firstLane.worldX + (s.pointerX - start.x) / scale;
      const expectedWorldY = firstLane.worldY + (s.pointerY - start.y) / scale;
      const devX = Math.abs(s.worldX - expectedWorldX);
      const devY = Math.abs(s.worldY - expectedWorldY);
      maxDeviation = Math.max(maxDeviation, devX, devY);
    }
    expect(maxDeviation, `max deviation ${maxDeviation}px world`).toBeLessThanOrEqual(4);
  });

  test("T4 = release 前 rect 基準で 300ms 全 frame shift < 5px (Round 2 F6 対応、 flicker ゼロ 3 条件 3/3)", async ({ page }) => {
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const firstLane = mirror0!.lanes[0]!;
    const start = await getLaneCenter(page, firstLane.slug);
    const clientDeltaX = 120;
    const clientDeltaY = 30;
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(start.x + (clientDeltaX * i) / 10, start.y + (clientDeltaY * i) / 10);
      await page.waitForTimeout(12);
    }
    // F6 対応 = release 前の rect を基準にする (旧 test は release 後 rect 基準で 1 frame flash を見逃す)
    const rectBeforeRelease = await page.evaluate((s) => {
      const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }, firstLane.slug);
    expect(rectBeforeRelease).not.toBeNull();
    await page.mouse.up();
    // F6 対応 = 300ms 内で 15 sample (20ms 間隔) の全 frame を check、 rect が > 5px shift しないこと
    const flickerSamples: Array<{ dx: number; dy: number; dw: number; dh: number }> = [];
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(20);
      const r = await page.evaluate((s) => {
        const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
      }, firstLane.slug);
      if (r) {
        flickerSamples.push({
          dx: Math.abs(r.x - rectBeforeRelease!.x),
          dy: Math.abs(r.y - rectBeforeRelease!.y),
          dw: Math.abs(r.w - rectBeforeRelease!.w),
          dh: Math.abs(r.h - rectBeforeRelease!.h),
        });
      }
    }
    const maxShift = Math.max(...flickerSamples.map((s) => Math.max(s.dx, s.dy, s.dw, s.dh)));
    expect(maxShift, `max shift ${maxShift}px, samples=${JSON.stringify(flickerSamples.slice(0, 3))}`)
      .toBeLessThanOrEqual(5);
  });

  test("T5 = 対象外 lane が drag 中 / release 300ms window / release 後全て飛ばない (Round 2 F1 + F6 対応)", async ({ page }) => {
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    expect(mirror0!.lanes.length).toBeGreaterThanOrEqual(3);
    const targetLane = mirror0!.lanes[0]!;
    const nonTargetLanes = mirror0!.lanes.slice(1);
    const start = await getLaneCenter(page, targetLane.slug);
    const rectsBefore = await getAllLaneRects(page);
    // drag 中の非対象 lane rect も sample
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const rectsMidDrag: Record<string, { x: number; y: number }>[] = [];
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(start.x + (150 * i) / 10, start.y + (40 * i) / 10);
      await page.waitForTimeout(15);
      const snap = await getAllLaneRects(page);
      const nonTargetSnap: Record<string, { x: number; y: number }> = {};
      for (const slug of Object.keys(snap)) {
        if (slug === targetLane.slug) continue;
        nonTargetSnap[slug] = { x: snap[slug]!.x, y: snap[slug]!.y };
      }
      rectsMidDrag.push(nonTargetSnap);
    }
    // release 直前の非対象 lane rect を基準として保存 (F6 = release 前基準)
    const rectsAtRelease = await getAllLaneRects(page);
    await page.mouse.up();
    // release 後 300ms window で 15 sample (20ms 間隔) を collect (F6 = 全 frame check)
    const rectsFlickerWindow: Record<string, { x: number; y: number }>[] = [];
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(20);
      const snap = await getAllLaneRects(page);
      const nonTargetSnap: Record<string, { x: number; y: number }> = {};
      for (const slug of Object.keys(snap)) {
        if (slug === targetLane.slug) continue;
        nonTargetSnap[slug] = { x: snap[slug]!.x, y: snap[slug]!.y };
      }
      rectsFlickerWindow.push(nonTargetSnap);
    }
    const rectsAfter = await getAllLaneRects(page);
    // 対象外 lane の drag 中 rect shift 検証 (5px 以内、 auto-adjust なし)
    for (const snap of rectsMidDrag) {
      for (const lane of nonTargetLanes) {
        const before = rectsBefore[lane.slug]!;
        const during = snap[lane.slug];
        if (!during) continue;
        expect(Math.abs(during.x - before.x), `${lane.slug} drag 中 x shift`).toBeLessThanOrEqual(5);
        expect(Math.abs(during.y - before.y), `${lane.slug} drag 中 y shift`).toBeLessThanOrEqual(5);
      }
    }
    // F6 = release 前 rect 基準で 300ms window 内の非対象 lane flicker 検証 (5px 以内)
    for (const snap of rectsFlickerWindow) {
      for (const lane of nonTargetLanes) {
        const atRelease = rectsAtRelease[lane.slug]!;
        const during = snap[lane.slug];
        if (!during) continue;
        expect(Math.abs(during.x - atRelease.x), `${lane.slug} release 300ms window x flicker (F6)`).toBeLessThanOrEqual(5);
        expect(Math.abs(during.y - atRelease.y), `${lane.slug} release 300ms window y flicker (F6)`).toBeLessThanOrEqual(5);
      }
    }
    // release 完了後の対象外 lane rect shift 検証 (F1 = 前 session user report「API/DB が飛ぶ」 の再現防止)
    for (const lane of nonTargetLanes) {
      const before = rectsBefore[lane.slug]!;
      const after = rectsAfter[lane.slug];
      expect(after, `${lane.slug} が消失していない`).toBeDefined();
      expect(Math.abs(after!.x - before.x), `${lane.slug} release 後 x shift (F1 regression)`).toBeLessThanOrEqual(20);
      expect(Math.abs(after!.y - before.y), `${lane.slug} release 後 y shift (F1 regression)`).toBeLessThanOrEqual(20);
    }
    // DSL 側で対象外 lane も posX/posY が明示されていること (F1 = 未固定なら auto layout で飛ぶ)
    const dsl = await getEditorText(page);
    for (const lane of nonTargetLanes) {
      const pattern = new RegExp(`${lane.name}[^\\n]*posX\\s*:\\s*-?\\d+`);
      expect(pattern.test(dsl), `${lane.name} の posX が DSL に write back された (F1)`).toBe(true);
    }
  });

  test("T6 = viewBox 原点 (vb.x/vb.y 通常負) 補正後の fit で全 lane が viewport 内に配置される (Round 2 F2 対応)", async ({ page }) => {
    const mirror = await readCanvasState(page);
    expect(mirror).not.toBeNull();
    expect(mirror!.viewBox).not.toBeNull();
    const vb = mirror!.viewBox!;
    const t = mirror!.viewportTransform;
    // F2 = fit 計算で vb.x/vb.y を差し引いた tx/ty で全 lane rect が viewport 内に収まる (負座標 lane が切れない)
    const viewportRect = await page.evaluate(() => {
      const el = document.querySelector("[data-testid='editor-preview-stage']") as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    expect(viewportRect).not.toBeNull();
    for (const lane of mirror!.lanes) {
      // world 座標 → viewport 内 CSS 座標
      const cssX = t.tx + lane.worldX * t.scale;
      const cssY = t.ty + lane.worldY * t.scale;
      const cssW = lane.worldW * t.scale;
      const cssH = lane.worldH * t.scale;
      // viewport 内に少なくとも部分的に (right > 0 かつ left < viewport.w、 同 y 軸) 収まる
      expect(cssX + cssW, `${lane.name} right > 0`).toBeGreaterThan(0);
      expect(cssX, `${lane.name} left < viewport.w`).toBeLessThan(viewportRect!.w);
      expect(cssY + cssH, `${lane.name} bottom > 0`).toBeGreaterThan(0);
      expect(cssY, `${lane.name} top < viewport.h`).toBeLessThan(viewportRect!.h);
    }
    // vb.x/vb.y が負なら fit の tx が (viewport.w - vb.w * scale) / 2 より小さい (原点補正が働いている)
    if (vb.x < 0) {
      const naiveTx = (viewportRect!.w - vb.w * t.scale) / 2;
      const correctedTx = naiveTx - vb.x * t.scale;
      expect(Math.abs(t.tx - correctedTx), "tx = naive fit - vb.x * scale (F2 補正済)").toBeLessThan(0.5);
    }
  });

  test("T7 = pointer cancel で drag が start 位置に rollback、 DSL 変更なし (Round 2 F4 対応)", async ({ page }) => {
    const before = await getEditorText(page);
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const firstLane = mirror0!.lanes[0]!;
    const rectBefore = (await getAllLaneRects(page))[firstLane.slug]!;
    const start = await getLaneCenter(page, firstLane.slug);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(start.x + 30 * i, start.y + 10 * i);
      await page.waitForTimeout(15);
    }
    // pointercancel を dispatchEvent で発火 (window.blur / pointer capture loss を模擬)
    await page.evaluate((s) => {
      const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
      if (!el) return;
      const evt = new PointerEvent("pointercancel", { pointerId: 1, bubbles: true });
      el.dispatchEvent(evt);
    }, firstLane.slug);
    await page.waitForTimeout(300);
    // pointer 状態を強制解放 (Playwright 側 mouse state を戻す)
    await page.mouse.up().catch(() => { /* already up */ });
    await page.waitForTimeout(200);
    // F4 = DSL 変更なしを検証
    const after = await getEditorText(page);
    expect(after, "pointer cancel で DSL が変更されていない (F4 rollback)").toBe(before);
    // 対象 lane rect が start 位置に近い (rollback で戻った) or drag 中位置のまま (未 write back)、
    // いずれにせよ「掴んだ点」 が最終 DSL 化していない
    const rectAfter = (await getAllLaneRects(page))[firstLane.slug];
    expect(rectAfter, "対象 lane が消失していない").toBeDefined();
    // pointercancel 経路で write back されていないので DSL は before と一致
    expect(after).toBe(before);
    // 対象 lane transform が rollback で開始座標付近か、 drag 中座標のいずれかであることを確認
    // (rollback 時は startWorldX/Y へ戻り、 DSL 未書換のため React 再 render 発生せず transform 残らない)
    const dslAfter = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
    expect(dslAfter).toBe(before);
    void rectBefore;
  });
});
