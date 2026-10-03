import { test, expect, type Page } from "@playwright/test";

import { 記法をURLに載せる } from "./box-and-edge-figure";

const ANIMATION = "blueprint-wipe-in";

const source = (theme: "blueprint" | "kinari"): string => `title: "現れ方"
type: flow
theme: ${theme}
reveal: all

states:
  shown: 0

actors:
  - a: { kind: card, title: "A" }
  - b: { kind: card, title: "B" }
  - c: { kind: card, title: "C", 出す条件: "{shown}" }

flow:
  - a -> b
  - b -> c

animation:
  - step: "1" 2.0s
    focus: [a]
  - step: "2" 2.0s
    focus: [b]
    set:
      shown: 1
  - step: "3" 2.0s
    focus: [a]
`;

async function capture(page: Page): Promise<void> {
  await page.addInitScript((animation) => {
    const counts: Record<string, number> = {};
    (window as unknown as { __themeAppearCounts: Record<string, number> }).__themeAppearCounts = counts;
    document.addEventListener(
      "animationstart",
      (event) => {
        if (!(event instanceof AnimationEvent) || event.animationName !== animation) return;
        const target = event.target instanceof Element ? event.target.closest("[data-cdl-node]") : null;
        const id = target?.getAttribute("data-cdl-node");
        if (id) counts[id] = (counts[id] ?? 0) + 1;
      },
      true,
    );
  }, ANIMATION);
}

async function counts(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() =>
    ({ ...(window as unknown as { __themeAppearCounts?: Record<string, number> }).__themeAppearCounts }),
  );
}

test("図面の箱は開いた時か新しく現れた時の 1 回だけ動く (#2790)", async ({ page }) => {
  await capture(page);
  await page.goto(`editor#s=${記法をURLに載せる(source("blueprint"))}`);
  await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await page.waitForFunction(() => {
    const c = document.querySelector('[data-cdl-node="c"]');
    return c !== null && !c.hasAttribute("data-cdl-hidden");
  }, undefined, { timeout: 5_000 });
  await page.waitForTimeout(1_000);

  await expect(page.locator("[data-cdl-phase-index]").first()).toHaveAttribute("data-cdl-phase-index", "1");
  expect(await counts(page)).toMatchObject({ a: 1, b: 1, c: 1 });
  expect(Object.values(await counts(page)).reduce((sum, value) => sum + value, 0)).toBe(3);
});

test("動きを減らす時は現れ方を止めても箱を描く (#2790)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await capture(page);
  await page.goto(`editor#s=${記法をURLに載せる(source("blueprint"))}`);
  await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await page.waitForTimeout(1_000);

  expect(Object.values(await counts(page)).reduce((sum, value) => sum + value, 0)).toBe(0);
  await expect(page.locator('[data-cdl-role="node-body"]')).not.toHaveCount(0);
});

test("生成りには図面の現れ方を足さない (#2790)", async ({ page }) => {
  await capture(page);
  await page.goto(`editor#s=${記法をURLに載せる(source("kinari"))}`);
  await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="kinari"]');
  await page.waitForTimeout(1_000);

  expect(Object.values(await counts(page)).reduce((sum, value) => sum + value, 0)).toBe(0);
  await expect(page.locator('[data-cdl-role="node-body"]')).not.toHaveCount(0);
});
