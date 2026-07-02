/**
 * Visual regression ... cookbook 25 demo の全網羅。
 *
 * /catalog/cookbook の全 25 diagram を対象に SVG 視覚 regression を担保する。
 * 他 spec (presets / primitives / patterns) は全網羅方針で運用済、 cookbook のみ
 * subset だった非対称を解消し refactor 検知精度を最大化。
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
  { slug: "oauth-flow", label: "OAuth code flow" },
  { slug: "csrf-token", label: "CSRF token" },
  // C. Data 系 (CRUD / cache / search / sort)
  { slug: "crud-create", label: "CRUD create" },
  { slug: "pagination", label: "Cursor pagination" },
  { slug: "cache-read", label: "Cache read-through" },
  { slug: "search-query", label: "Search full-text" },
  { slug: "sort-filter", label: "Sort + Filter" },
  // D. Form / File 系
  { slug: "form-submit", label: "Form submit" },
  { slug: "file-upload", label: "File upload" },
  { slug: "export-data", label: "Export CSV" },
  { slug: "import-data", label: "Import CSV" },
  // E. Realtime 系
  { slug: "sse-stream", label: "SSE stream" },
  { slug: "websocket", label: "WebSocket" },
  { slug: "polling", label: "Long polling" },
  { slug: "notification", label: "Notification" },
  // F. Job / Task 系
  { slug: "background-job", label: "Background job" },
  { slug: "retry-backoff", label: "Retry + backoff" },
  { slug: "webhook", label: "Webhook" },
  { slug: "scheduled-task", label: "Scheduled task" },
  { slug: "email-notification", label: "Email notification" },
  // G. Ops 系
  { slug: "audit-log", label: "Audit log" },
  { slug: "health-check", label: "Health check" },
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
