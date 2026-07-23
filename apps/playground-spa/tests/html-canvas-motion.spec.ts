/**
 * HTML div canvas motion / smoothness verify (CAR-1983)。
 *
 * user 指摘「動きを見ないと」 への応答。 静止 screenshot 4-5 枚では捉えられない時間軸 (smooth 感、
 * 途中 jitter 有無) を 2 経路で verify。
 *
 * - **video 録画** = playwright.config.ts の `motion` project で video: on、 test 完了時に WebM が
 *   test-results/motion/ 配下に生成、 user が実動作を目視再生確認する経路
 * - **rAF timing 実測** = drag 中に window.requestAnimationFrame の呼出間隔 (frame delta) を browser 側で
 *   収集、 median ≤ 20ms (50fps 相当) + max ≤ 40ms (25fps 下限) を assert。 機械的 smoothness 保証
 *
 * baseURL = 4323 (vite dev)。 motion project の viewport = 1280x720 で録画。
 */
import { test, expect, type Page } from "@playwright/test";

const LANE_SELECTOR = "[data-html-canvas-lane]";
const NODE_SELECTOR = "[data-html-canvas-node]";

/**
 * browser 側で rAF sampling を開始、 __rafDeltas に frame delta を蓄積。
 * caller は drag 操作終了後に stopAndReadRafSampling で結果取得。
 */
async function startRafSampling(page: Page): Promise<void> {
  await page.evaluate(() => {
    interface W {
      __rafDeltas?: number[];
      __rafLast?: number;
      __rafStop?: boolean;
    }
    const w = window as unknown as W;
    w.__rafDeltas = [];
    w.__rafLast = undefined;
    w.__rafStop = false;
    const step = (t: number) => {
      const ww = window as unknown as W;
      if (ww.__rafLast !== undefined) {
        ww.__rafDeltas!.push(t - ww.__rafLast);
      }
      ww.__rafLast = t;
      if (!ww.__rafStop) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });
}

interface RafStats {
  deltas: number[];
  median: number;
  max: number;
  p95: number;
  count: number;
}

async function stopAndReadRafSampling(page: Page): Promise<RafStats> {
  return page.evaluate(() => {
    interface W {
      __rafDeltas?: number[];
      __rafStop?: boolean;
    }
    const w = window as unknown as W;
    w.__rafStop = true;
    const deltas = (w.__rafDeltas ?? []).slice();
    if (deltas.length === 0) {
      return { deltas: [], median: 0, max: 0, p95: 0, count: 0 };
    }
    const sorted = [...deltas].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]!;
    const p95 = sorted[Math.max(0, Math.floor(sorted.length * 0.95) - 1)]!;
    const max = sorted[sorted.length - 1]!;
    return { deltas, median, max, p95, count: deltas.length };
  });
}

async function getLaneCenter(page: Page, slug: string): Promise<{ x: number; y: number }> {
  return page.evaluate((s) => {
    const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
    if (!el) throw new Error(`lane not found: ${s}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, slug);
}

async function getNodeCenter(page: Page, nodeId: string): Promise<{ x: number; y: number }> {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
    if (!el) throw new Error(`node not found: ${id}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, nodeId);
}

test.describe("HTML div canvas motion / smoothness (CAR-1983 video 録画 + rAF timing)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor?canvas=html", { waitUntil: "networkidle" });
    await page.waitForSelector(LANE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test("T-M1 = lane drag 中の rAF timing = median frame delta ≤ 20ms、 p95 ≤ 33ms (60fps 目標 / 30fps 下限)", async ({ page }) => {
    const slug = await page.evaluate(() => {
      const el = document.querySelector("[data-html-canvas-lane]") as HTMLElement | null;
      return el?.getAttribute("data-html-canvas-lane") ?? "";
    });
    expect(slug.length).toBeGreaterThan(0);
    const start = await getLaneCenter(page, slug);
    // rAF sampling 開始
    await startRafSampling(page);
    // drag 開始 → 1.5 秒相当 (60 fps 目標で 90 frame) 分の drag を実施
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const totalMs = 1500;
    const steps = 60;
    const dx = 250;
    const dy = 80;
    for (let i = 1; i <= steps; i++) {
      const px = start.x + (dx * i) / steps;
      const py = start.y + (dy * i) / steps;
      await page.mouse.move(px, py);
      await page.waitForTimeout(totalMs / steps);
    }
    await page.mouse.up();
    // release 後 300ms 追加 sampling
    await page.waitForTimeout(300);
    // rAF sampling 停止 + 結果取得
    const stats = await stopAndReadRafSampling(page);
    console.log(`[T-M1 lane] rAF stats: count=${stats.count} median=${stats.median.toFixed(2)}ms p95=${stats.p95.toFixed(2)}ms max=${stats.max.toFixed(2)}ms`);
    // assert = median ≤ 20ms (50fps 以上) + p95 ≤ 33ms (30fps 相当の悲観境界)
    expect(stats.count, `rAF sample 数 ≥ 60 (1.5s drag 分)`).toBeGreaterThanOrEqual(60);
    expect(stats.median, `median frame delta ${stats.median.toFixed(2)}ms`).toBeLessThanOrEqual(20);
    expect(stats.p95, `p95 frame delta ${stats.p95.toFixed(2)}ms`).toBeLessThanOrEqual(33);
  });

  test("T-M2 = node drag 中の rAF timing = median frame delta ≤ 20ms、 p95 ≤ 33ms", async ({ page }) => {
    await page.waitForSelector(NODE_SELECTOR, { timeout: 10000 });
    const nodeId = await page.evaluate(() => {
      // subKey が非空 (sub-node) を対象、 単一 node 経路より安定
      const els = Array.from(document.querySelectorAll("[data-html-canvas-node]"));
      const withSub = els.find((el) => (el as HTMLElement).getAttribute("data-html-canvas-node-subkey")) as HTMLElement | undefined;
      return withSub?.getAttribute("data-html-canvas-node") ?? els[0]?.getAttribute("data-html-canvas-node") ?? "";
    });
    expect(nodeId.length).toBeGreaterThan(0);
    const start = await getNodeCenter(page, nodeId);
    await startRafSampling(page);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const totalMs = 1500;
    const steps = 60;
    const dx = 200;
    const dy = 60;
    for (let i = 1; i <= steps; i++) {
      const px = start.x + (dx * i) / steps;
      const py = start.y + (dy * i) / steps;
      await page.mouse.move(px, py);
      await page.waitForTimeout(totalMs / steps);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);
    const stats = await stopAndReadRafSampling(page);
    console.log(`[T-M2 node] rAF stats: count=${stats.count} median=${stats.median.toFixed(2)}ms p95=${stats.p95.toFixed(2)}ms max=${stats.max.toFixed(2)}ms`);
    expect(stats.count, `rAF sample 数 ≥ 60`).toBeGreaterThanOrEqual(60);
    expect(stats.median, `node median frame delta ${stats.median.toFixed(2)}ms`).toBeLessThanOrEqual(20);
    expect(stats.p95, `node p95 frame delta ${stats.p95.toFixed(2)}ms`).toBeLessThanOrEqual(33);
  });
});
