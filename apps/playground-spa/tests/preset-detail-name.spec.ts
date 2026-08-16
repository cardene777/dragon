/**
 * preset 詳細ページの見出しが言語に応じた名前になることの確認 (#1047)。
 *
 * 直す前は `stateMachine2` のような識別子風の文字列が出ており、
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

/** 見出しの名前だけ (添えの語を除く)。 */
async function headingName(page: Page): Promise<string> {
  return ((await page.locator(".nm-hero-title-name").first().textContent()) ?? "").trim();
}

async function switchLocale(page: Page): Promise<void> {
  await page.locator("button.v4-nav-lang-toggle").click();
  await page.waitForTimeout(500);
}

test.describe("preset 詳細の見出し (#1047)", () => {
  test("言語を切り替えると見出しの名前が実名で変わる", async ({ page }) => {
    // **名前の部分だけを実名で照合する**。 見出し全体で比べると、添えの語
    // (プリセット / preset) が変わっただけでも通ってしまう
    await page.goto(`${SPA_URL}/preset/state-machine-2`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    expect(await headingName(page), "日本語表示で日本語名が出ない").toBe("拡張ステート図");

    await switchLocale(page);
    expect(await headingName(page), "英語表示で英語名が出ない").toBe("Extended state machine");
  });

  test("識別子とは違う名前が出る", async ({ page }) => {
    // 形ではなく値で見る。 直す前は `stateMachine2` (= 図の識別子) が出ていた
    await page.goto(`${SPA_URL}/preset/mind`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const name = await headingName(page);
    for (const identifier of ["mindMap", "mind", "presetMindMap"]) {
      expect(name, `識別子がそのまま出ている: ${identifier}`).not.toBe(identifier);
    }
    expect(name, "日本語名が出ない").toBe("マインドマップ");
  });

  test("見出しに識別子がそのまま出ない", async ({ page }) => {
    // 直す前は `stateMachine2 プリセット` のように識別子が出ていた
    for (const slug of ["state-machine-2", "mind", "swimlane"]) {
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
