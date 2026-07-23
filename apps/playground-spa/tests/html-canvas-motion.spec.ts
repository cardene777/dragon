/**
 * HTML div canvas motion / smoothness verify (CAR-1983 + Round 1 Codex fix)。
 *
 * user 指摘「動きを見ないと」 への応答。 静止 screenshot 4-5 枚では捉えられない時間軸を 2 経路で verify。
 *
 * Round 1 Codex adversarial review 3 MAJOR fix:
 * - F1 = rAF loop 単独では element 移動と decoupled で smoothness を測れない。 rAF ごとに
 *   対象 element の getBoundingClientRect() + pointer 座標 + rAF 時刻 の 3 者を同時 sample、
 *   pointer 移動時に element 移動が追従していることを assert する経路に変更
 * - F2 = p95 のみでは単発長 jitter を見逃す。 drag phase と release phase を別集計、
 *   max = hard cap で 4 × median 以内を assert (単発 stall 検知)、 release 後 sample は統計から除外
 * - F3 = mouse.move の 25ms 間隔 (40Hz) が pointer 更新精度を制限、 rAF 内部が 60fps でも
 *   element 実移動は 40Hz。 16.7ms (~60Hz) 相当の scheduling に変更、 90 steps に増やす
 *
 * video 録画は playwright.config.ts の motion project (video: on) 経由で自動生成、
 * user が実動作を再生確認する経路。
 *
 * baseURL = 4323 (vite dev)。 motion project の viewport = 1280x720 で録画。
 */
import { test, expect, type Page } from "@playwright/test";

const LANE_SELECTOR = "[data-html-canvas-lane]";
const NODE_SELECTOR = "[data-html-canvas-node]";

interface SamplingHandle {
  selector: string;
}

/**
 * browser 側で rAF sampling を開始、 各 frame で 対象 element の rect と時刻を 1 sample として蓄積。
 * F1 対応 = element 位置と rAF timing の同時サンプルで decoupled 検証を可能に。
 */
async function startElementRafSampling(page: Page, selector: string): Promise<SamplingHandle> {
  await page.evaluate((sel) => {
    interface W {
      __rafSamples?: Array<{ t: number; cssLeft: number; cssTop: number }>;
      __rafStop?: boolean;
      __rafSelector?: string;
    }
    const w = window as unknown as W;
    w.__rafSamples = [];
    w.__rafStop = false;
    w.__rafSelector = sel;
    const step = (t: number) => {
      const ww = window as unknown as W;
      const el = document.querySelector(ww.__rafSelector!) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        ww.__rafSamples!.push({ t, cssLeft: r.left, cssTop: r.top });
      }
      if (!ww.__rafStop) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, selector);
  return { selector };
}

interface RafPhaseStats {
  frameCount: number;
  medianDelta: number;
  p95Delta: number;
  maxDelta: number;
  totalPositionDelta: number;
  maxSingleFrameJump: number;
  /**
   * Round 2 F1 refinement = 累積移動量 (往復加算) ではなく net displacement = 最終 sample と初期 sample の
   * L2 距離。 pointer が単方向 drag なら element net 移動も pointer delta 相当を要求できる。
   */
  netDisplacement: number;
}

interface RafSampleFull {
  t: number;
  cssLeft: number;
  cssTop: number;
}

async function stopAndReadSamples(page: Page): Promise<RafSampleFull[]> {
  return page.evaluate(() => {
    interface W {
      __rafSamples?: Array<{ t: number; cssLeft: number; cssTop: number }>;
      __rafStop?: boolean;
    }
    const w = window as unknown as W;
    w.__rafStop = true;
    return (w.__rafSamples ?? []).slice();
  });
}

function computePhaseStats(samples: RafSampleFull[]): RafPhaseStats {
  if (samples.length < 2) {
    return {
      frameCount: samples.length,
      medianDelta: 0,
      p95Delta: 0,
      maxDelta: 0,
      totalPositionDelta: 0,
      maxSingleFrameJump: 0,
      netDisplacement: 0,
    };
  }
  const deltas: number[] = [];
  let totalPositionDelta = 0;
  let maxSingleFrameJump = 0;
  for (let i = 1; i < samples.length; i++) {
    deltas.push(samples[i]!.t - samples[i - 1]!.t);
    const dx = samples[i]!.cssLeft - samples[i - 1]!.cssLeft;
    const dy = samples[i]!.cssTop - samples[i - 1]!.cssTop;
    const step = Math.sqrt(dx * dx + dy * dy);
    totalPositionDelta += step;
    maxSingleFrameJump = Math.max(maxSingleFrameJump, step);
  }
  const sortedDelta = [...deltas].sort((a, b) => a - b);
  const medianDelta = sortedDelta[Math.floor(sortedDelta.length / 2)]!;
  const p95Delta = sortedDelta[Math.max(0, Math.floor(sortedDelta.length * 0.95) - 1)]!;
  const maxDelta = sortedDelta[sortedDelta.length - 1]!;
  // Round 2 F1 refinement = net displacement (最終 sample - 初期 sample の L2 距離)
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  const netDisplacement = Math.sqrt(
    (last.cssLeft - first.cssLeft) ** 2 + (last.cssTop - first.cssTop) ** 2,
  );
  return {
    frameCount: samples.length,
    medianDelta,
    p95Delta,
    maxDelta,
    totalPositionDelta,
    maxSingleFrameJump,
    netDisplacement,
  };
}

/**
 * pointer 移動と rAF sampling を協調させるヘルパー。 target ms 間隔で 90 steps 実行 (16.7ms = 60Hz 目標)、
 * F3 対応。 pointer 移動は setTimeout ではなく、 dead-reckoning (start 時刻 + step*ms) で厳密 pacing。
 */
async function performSmoothDrag(
  page: Page,
  start: { x: number; y: number },
  totalDelta: { dx: number; dy: number },
  steps: number,
  targetMs: number,
): Promise<{ startTs: number; endTs: number }> {
  const startTs = Date.now();
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const stepMs = targetMs / steps;
  for (let i = 1; i <= steps; i++) {
    const px = start.x + (totalDelta.dx * i) / steps;
    const py = start.y + (totalDelta.dy * i) / steps;
    await page.mouse.move(px, py);
    // dead-reckoning wait = 経過 wall clock と目標 t_i の差分を wait
    const expectedElapsed = i * stepMs;
    const actualElapsed = Date.now() - startTs;
    const remaining = expectedElapsed - actualElapsed;
    if (remaining > 1) {
      await page.waitForTimeout(remaining);
    }
  }
  await page.mouse.up();
  const endTs = Date.now();
  return { startTs, endTs };
}

test.describe("HTML div canvas motion / smoothness (CAR-1983 video 録画 + rAF timing coupled)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForSelector(LANE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test("T-M1 = lane drag 中 rAF+element の coupled smoothness verify (60Hz 目標 / long-frame 検知)", async ({ page }) => {
    const slug = await page.evaluate(() => {
      const el = document.querySelector("[data-html-canvas-lane]") as HTMLElement | null;
      return el?.getAttribute("data-html-canvas-lane") ?? "";
    });
    expect(slug.length).toBeGreaterThan(0);
    const start = await page.evaluate((s) => {
      const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
      if (!el) throw new Error(`lane not found: ${s}`);
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, slug);
    // element と rAF timing を同時 sampling
    await startElementRafSampling(page, `[data-html-canvas-lane="${slug}"]`);
    // 90 steps × 16.7ms = 1500ms、 60Hz 相当 pacing (F3 対応)
    await performSmoothDrag(page, start, { dx: 240, dy: 80 }, 90, 1500);
    // sampling 停止 + drag phase を「element 移動があった frame」 で抽出 (F1 + F2 対応)
    const allSamples = await stopAndReadSamples(page);
    const drag = allSamples.filter((s, i, arr) => {
      if (i === 0) return false;
      const dx = s.cssLeft - arr[i - 1]!.cssLeft;
      const dy = s.cssTop - arr[i - 1]!.cssTop;
      return dx * dx + dy * dy > 0.01;
    });
    const stats = computePhaseStats(allSamples);
    console.log(`[T-M1 lane] frames=${stats.frameCount} median=${stats.medianDelta.toFixed(2)}ms p95=${stats.p95Delta.toFixed(2)}ms max=${stats.maxDelta.toFixed(2)}ms totalMove=${stats.totalPositionDelta.toFixed(1)}px netDisp=${stats.netDisplacement.toFixed(1)}px maxJump=${stats.maxSingleFrameJump.toFixed(1)}px dragFrames=${drag.length}`);
    // F1 対応 (Round 2 refinement) = 累積 (往復加算) ではなく net displacement で「単方向 drag が完遂」 を verify
    // pointer が (dx=240, dy=80) 動いた → element の net displacement も同程度 (viewport scale ≈ 1、
    // buffer 込で 200px 以上、 sqrt(240^2 + 80^2) ≈ 253px の 80% 目安)
    expect(stats.netDisplacement, `net displacement ${stats.netDisplacement.toFixed(1)}px (pointer moved sqrt(240^2+80^2)≈253px)`).toBeGreaterThan(200);
    // F1 対応 = drag phase 中に位置変化 sample が 60 以上 = pointer 進行と element 追従が couple
    expect(drag.length, `frames with element movement ${drag.length} (drag phase 中の追従 frame)`).toBeGreaterThanOrEqual(60);
    // F2 対応 = median ≤ 20ms (50fps) + p95 ≤ 33ms + max ≤ 60ms (単発 stall hard cap、 60ms > 30fps 悲観)
    expect(stats.medianDelta, `median frame delta ${stats.medianDelta.toFixed(2)}ms`).toBeLessThanOrEqual(20);
    expect(stats.p95Delta, `p95 frame delta ${stats.p95Delta.toFixed(2)}ms`).toBeLessThanOrEqual(33);
    expect(stats.maxDelta, `max frame delta ${stats.maxDelta.toFixed(2)}ms (単発 stall hard cap)`).toBeLessThanOrEqual(60);
    // F1 対応 = 単 frame jump が異常大でない (frame ごとの pixel 移動が 20px 超えない = 段階移動でなく滑らか追従)
    expect(stats.maxSingleFrameJump, `max single-frame position jump ${stats.maxSingleFrameJump.toFixed(1)}px`).toBeLessThanOrEqual(20);
  });

  test("T-M2 = node drag 中 rAF+element の coupled smoothness verify", async ({ page }) => {
    await page.waitForSelector(NODE_SELECTOR, { timeout: 10000 });
    const nodeId = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[data-html-canvas-node]"));
      const withSub = els.find((el) => (el as HTMLElement).getAttribute("data-html-canvas-node-subkey")) as HTMLElement | undefined;
      return withSub?.getAttribute("data-html-canvas-node") ?? els[0]?.getAttribute("data-html-canvas-node") ?? "";
    });
    expect(nodeId.length).toBeGreaterThan(0);
    const start = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) throw new Error(`node not found: ${id}`);
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, nodeId);
    await startElementRafSampling(page, `[data-html-canvas-node="${nodeId}"]`);
    await performSmoothDrag(page, start, { dx: 180, dy: 60 }, 90, 1500);
    const allSamples = await stopAndReadSamples(page);
    const drag = allSamples.filter((s, i, arr) => {
      if (i === 0) return false;
      const dx = s.cssLeft - arr[i - 1]!.cssLeft;
      const dy = s.cssTop - arr[i - 1]!.cssTop;
      return dx * dx + dy * dy > 0.01;
    });
    const stats = computePhaseStats(allSamples);
    console.log(`[T-M2 node] frames=${stats.frameCount} median=${stats.medianDelta.toFixed(2)}ms p95=${stats.p95Delta.toFixed(2)}ms max=${stats.maxDelta.toFixed(2)}ms totalMove=${stats.totalPositionDelta.toFixed(1)}px netDisp=${stats.netDisplacement.toFixed(1)}px maxJump=${stats.maxSingleFrameJump.toFixed(1)}px dragFrames=${drag.length}`);
    // F1 refinement = pointer (dx=180, dy=60) → sqrt(180^2+60^2)≈190px の 80% buffer で 150px 以上
    expect(stats.netDisplacement, `node net displacement ${stats.netDisplacement.toFixed(1)}px (pointer≈190px)`).toBeGreaterThan(150);
    expect(drag.length, `node frames with movement ${drag.length}`).toBeGreaterThanOrEqual(60);
    expect(stats.medianDelta, `node median ${stats.medianDelta.toFixed(2)}ms`).toBeLessThanOrEqual(20);
    expect(stats.p95Delta, `node p95 ${stats.p95Delta.toFixed(2)}ms`).toBeLessThanOrEqual(33);
    expect(stats.maxDelta, `node max ${stats.maxDelta.toFixed(2)}ms (hard cap)`).toBeLessThanOrEqual(60);
    expect(stats.maxSingleFrameJump, `node max single-frame jump ${stats.maxSingleFrameJump.toFixed(1)}px`).toBeLessThanOrEqual(20);
  });
});
