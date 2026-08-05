/**
 * preset 詳細ページの見出しが言語に応じた名前になることの確認 (#1047)。
 *
 * 直す前は `stateMachine2` / `mindMapRadial` のような識別子風の文字列が出ており、
 * 言語を切り替えても変わらなかった。 catalog の一覧は #1035 で対応したが、
 * preset 詳細は別の入れ物 (`PRESETS`) を持つため届いていなかった。
 */
import { test, expect, type Page } from "@playwright/test";

const SPA_URL = "http://localhost:4323";
/** 識別子風 = 先頭が小文字で空白を持たない英数字の並び。 */
const IDENTIFIER_LIKE = /^[a-z][A-Za-z0-9]*$/;

async function heading(page: Page): Promise<string> {
  return ((await page.locator("h1.nm-hero-title").first().textContent()) ?? "").trim();
}

async function switchLocale(page: Page): Promise<void> {
  await page.locator("button.v4-nav-lang-toggle").click();
  await page.waitForTimeout(500);
}

test.describe("preset 詳細の見出し (#1047)", () => {
  test("言語を切り替えると見出しの名前が変わる", async ({ page }) => {
    await page.goto(`${SPA_URL}/preset/state-machine-2`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const ja = await heading(page);
    expect(ja.length, "見出しが空").toBeGreaterThan(0);

    await switchLocale(page);
    const en = await heading(page);
    expect(en, `言語を切り替えても見出しが変わらない ("${ja}")`).not.toBe(ja);
  });

  test("見出しに識別子がそのまま出ない", async ({ page }) => {
    // 直す前は `stateMachine2 プリセット` のように識別子が出ていた
    for (const slug of ["state-machine-2", "mindmap-radial", "swimlane"]) {
      await page.goto(`${SPA_URL}/preset/${slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const words = (await heading(page)).split(/\s+/).filter(Boolean);
      const identifiers = words.filter((w) => IDENTIFIER_LIKE.test(w));
      expect(identifiers, `${slug} の見出しに識別子が出ている: ${identifiers.join(", ")}`).toHaveLength(0);
    }
  });

  test("見出しの添えの語が言語で変わる", async ({ page }) => {
    await page.goto(`${SPA_URL}/preset/swimlane`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    expect(await heading(page), "日本語表示で日本語の添えが出ない").toContain("プリセット");

    await switchLocale(page);
    const en = await heading(page);
    expect(en, "英語表示でも日本語の添えが残る").not.toContain("プリセット");
    expect(en, "英語表示で英語の添えが出ない").toContain("preset");
  });

  test("前へ / 次へ の名前も識別子のままにならない", async ({ page }) => {
    await page.goto(`${SPA_URL}/preset/swimlane`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const labels = (await page.locator(".nm-preset-detail-nav-btn .font-semibold").allTextContents())
      .map((s) => s.trim())
      .filter(Boolean);
    expect(labels.length, "前へ / 次へ が見つからない").toBeGreaterThan(0);

    const identifiers = labels.filter((l) => IDENTIFIER_LIKE.test(l));
    expect(identifiers, `識別子が出ている: ${identifiers.join(", ")}`).toHaveLength(0);
  });
});
