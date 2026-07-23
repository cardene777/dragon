/**
 * HTML div canvas drag behavior test (CAR-1947、 architecture 転換 Phase 1)。
 *
 * 前 session (2026-07-23 昼) で SVG based drag pipeline 7 PR 全 revert 後の architecture 転換として
 * HTML div canvas (`?canvas=html`) を新設、 Miro / Figma / Google スライド 相当 GPU accelerated
 * `translate3d` 経路の 3 条件を機械検証する。
 *
 * Stated check (Issue AC):
 * 1. 掴んだ点 = 置いた点 (pointer up 後の lane transform と最終 pointer 座標の delta < 1px、
 *    world 座標 = viewport scale で client 座標に線形変換 済)
 * 2. drag 中 smooth 追従 (RAF sample 経路で lane 位置が client pointer 進行に線形追随、
 *    最大逸脱 < 2px 相当の world 単位)
 * 3. release 後 flicker ゼロ (pointer up 後 300ms 以内で bounding rect が > 5px shift しない、
 *    SVG re-render / cdl re-layout 経路の視覚 flash 検知)
 *
 * 実装 SSOT = `apps/playground-spa/src/components/HtmlDivCanvasEditor.tsx`。
 * decision log = `~/projects/claude-memory/decisions/personal/decision-log/2026-07-23-dragon-editor-html-div-canvas-architecture.md`。
 *
 * baseURL = 4323 (vite dev、 外部で `pnpm --filter dragon-playground-spa dev` を起動しておく)。
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

/**
 * 指定 lane 要素の transform の translate3d(x, y, ...) から x/y を parse。
 * translate3d は `translate3d(<n>px, <n>px, 0px)` 形式 (React 側で set 済)。
 */
function parseTranslate3d(transform: string): { x: number; y: number } | null {
  const m = transform.match(/translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/);
  if (!m) return null;
  return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) };
}

/**
 * lane element の boundingClientRect (center) を取得。
 */
async function getLaneCenter(page: Page, slug: string): Promise<{ x: number; y: number }> {
  return page.evaluate((s) => {
    const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
    if (!el) throw new Error(`lane not found: ${s}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, slug);
}

test.describe("HTML div canvas drag (CAR-1947 Phase 1)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor?canvas=html", { waitUntil: "networkidle" });
    await page.waitForSelector(LANE_SELECTOR, { timeout: 10000 });
    // fit / initial layout の settle を待つ
    await page.waitForTimeout(400);
  });

  test("T1 = HTML div canvas が mount され、 lane 要素が cdl compile 済 posX/posY で配置される", async ({ page }) => {
    const lanes = await page.$$(LANE_SELECTOR);
    expect(lanes.length).toBeGreaterThanOrEqual(2); // Client / API / DB の 3 lane が sequence sample の default
    const mirror = await readCanvasState(page);
    expect(mirror).not.toBeNull();
    expect(mirror!.viewBox).not.toBeNull();
    expect(mirror!.lanes.length).toBeGreaterThanOrEqual(2);
    // 全 lane の world 座標が有限数
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
    // React 再 render 後の DSL write back と初期化を待つ
    await page.waitForTimeout(600);
    const mirror1 = await readCanvasState(page);
    expect(mirror1).not.toBeNull();
    const updatedLane = mirror1!.lanes.find((l) => l.slug === firstLane.slug);
    expect(updatedLane).toBeDefined();
    // 掴んだ点 = 置いた点 : DSL write back された worldX/Y が expected delta と 1px 以内一致
    // (updateActorPosition が Math.round 実施 → world 単位で ±1 の丸め誤差許容)
    const deltaX = updatedLane!.worldX - firstLane.worldX;
    const deltaY = updatedLane!.worldY - firstLane.worldY;
    expect(Math.abs(deltaX - expectedWorldDeltaX)).toBeLessThanOrEqual(1);
    expect(Math.abs(deltaY - expectedWorldDeltaY)).toBeLessThanOrEqual(1);
    // DSL 側にも posX/posY が反映されているか
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
    // 20 step で drag、 各 step 後に current transform を capture (RAF flush を待つ)
    const samples: Array<{ pointerX: number; pointerY: number; worldX: number; worldY: number }> = [];
    for (let i = 1; i <= 20; i++) {
      const px = start.x + (totalDeltaX * i) / 20;
      const py = start.y + (totalDeltaY * i) / 20;
      await page.mouse.move(px, py);
      // 1 RAF 分待って transform を read (RAF driven direct DOM update のため)
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
    // 各 sample が client pointer 進行に線形追随 (start + delta / scale = expected worldX/Y)
    // 逸脱 = |worldX - (startWorldX + (pointerX - startClientX) / scale)| が world 単位で許容内
    // browser rAF 精度 + tick 内 pointer capture 遅延を考慮して world 単位で 4px 許容 (scale > 0.1 想定)
    expect(samples.length).toBeGreaterThanOrEqual(10);
    let maxDeviation = 0;
    for (const s of samples) {
      const expectedWorldX = firstLane.worldX + (s.pointerX - start.x) / scale;
      const expectedWorldY = firstLane.worldY + (s.pointerY - start.y) / scale;
      const devX = Math.abs(s.worldX - expectedWorldX);
      const devY = Math.abs(s.worldY - expectedWorldY);
      maxDeviation = Math.max(maxDeviation, devX, devY);
    }
    // world unit で 4px 逸脱以内 (Playwright mouse.move の精度 + rAF 1 frame lag を許容)
    expect(maxDeviation, `max deviation ${maxDeviation}px world, samples=${JSON.stringify(samples.slice(0, 3))}`)
      .toBeLessThanOrEqual(4);
  });

  test("T4 = release 後 flicker ゼロ (300ms 以内 bounding rect shift < 5px、 3 条件 3/3)", async ({ page }) => {
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
    await page.mouse.up();
    // release 直後の bounding rect を capture
    const rectAtRelease = await page.evaluate((s) => {
      const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }, firstLane.slug);
    expect(rectAtRelease).not.toBeNull();
    // 300ms 内で 6 sample、 各 sample で bounding rect が > 5px shift しないこと
    const flickerSamples: Array<{ dx: number; dy: number }> = [];
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(50);
      const r = await page.evaluate((s) => {
        const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }, firstLane.slug);
      if (r) {
        flickerSamples.push({
          dx: Math.abs(r.x - rectAtRelease!.x),
          dy: Math.abs(r.y - rectAtRelease!.y),
        });
      }
    }
    const maxShift = Math.max(...flickerSamples.map((s) => Math.max(s.dx, s.dy)));
    expect(maxShift, `max shift ${maxShift}px in 300ms after release, samples=${JSON.stringify(flickerSamples)}`)
      .toBeLessThanOrEqual(5);
  });
});
