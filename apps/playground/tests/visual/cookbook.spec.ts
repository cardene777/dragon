/**
 * Visual regression ... cookbook 25 demo の subset 10 件。
 *
 * /catalog/cookbook の 5 カテゴリ (API / Auth / Data / Realtime / Job) 各 2 件抜粋し
 * 視覚 regression を担保。 全 25 件は coverage 過剰なので頻出 pattern のみ。
 *
 * baseline 不一致 = SVG path / fill / stroke / text rendering の崩れ。
 */
import { test, expect } from "@playwright/test";

const subset = [
  // A. API 系
  { slug: "api-call", label: "REST API GET" },
  { slug: "rate-limit", label: "Rate limit" },
  // B. Auth 系
  { slug: "jwt-auth", label: "JWT auth" },
  { slug: "oauth-flow", label: "OAuth 2.0" },
  // C. Data 系
  { slug: "crud-create", label: "CRUD create" },
  { slug: "cache-read", label: "Cache read-through" },
  // D. Realtime 系
  { slug: "websocket", label: "WebSocket" },
  { slug: "sse-stream", label: "SSE stream" },
  // E. Job 系
  { slug: "background-job", label: "Background job" },
  { slug: "webhook", label: "Webhook" },
];

const PAGE_URL = "/catalog/cookbook";

test.describe("Visual regression - cookbook subset (/catalog/cookbook)", () => {
  for (const { slug, label } of subset) {
    test(`cookbook ${slug} (${label}) SVG snapshot`, async ({ page }) => {
      await page.goto(PAGE_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(`[data-cdl-diagram="${slug}"] svg`, { timeout: 10_000 });
      await page.waitForTimeout(1000);
      const el = page.locator(`[data-cdl-diagram="${slug}"]`).first();
      // cookbook の thumbnail を 1 件 scroll into view してから撮影
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await expect(el).toHaveScreenshot(`cookbook-${slug}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
});
