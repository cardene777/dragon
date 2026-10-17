import { test, expect, type Page } from "@playwright/test";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import {
  見本が開けたことを確かめる,
  選んだ見本の図が描かれるまで待つ,
} from "./opened-sample";
import { 位置が落ち着くまで待つ } from "./wait-for-render";

const DIAGRAM_SVG = '[data-testid="editor-preview-stage"] svg[viewBox]';

async function 図の大きさ(page: Page): Promise<{ width: number; height: number }> {
  return await page.locator(DIAGRAM_SVG).evaluate((svg) => {
    const rect = svg.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
}

test.use({ viewport: { width: 1920, height: 1080 } });

test("最初の見本の表示合わせ直後に漏斗へ切り替えても図が枠に収まる", async ({ page }) => {
  test.setTimeout(60_000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });

  try {
    await page.goto("editor");
    const firstSample = EDITOR_SAMPLES[0];
    await 選んだ見本の図が描かれるまで待つ(page, firstSample.slug);
    await page.waitForFunction(() => {
      const pan = document.querySelector<HTMLElement>(".v4-editor-pan");
      const scale = /scale\(([^)]+)\)/u.exec(pan?.style.transform ?? "")?.[1];
      return scale !== undefined && Math.abs(Number(scale) - 1) > 0.001;
    });

    await page.locator('[data-testid="editor-samples-tab"]').click();
    await page.locator('[data-testid="editor-sample-funnel"]').first().click();
    await 見本が開けたことを確かめる(page, "funnel");
    await 選んだ見本の図が描かれるまで待つ(page, "funnel");
    await 位置が落ち着くまで待つ(page, "漏斗の見本");
    const automatic = await 図の大きさ(page);

    await page.getByTestId("editor-fit").click();
    await 位置が落ち着くまで待つ(page, "手で枠に合わせた漏斗の見本");
    const manual = await 図の大きさ(page);

    expect(Math.abs(automatic.width - manual.width), "自動と手動の表示合わせ後の幅").toBeLessThan(1);
    expect(Math.abs(automatic.height - manual.height), "自動と手動の表示合わせ後の高さ").toBeLessThan(1);
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await cdp.detach();
  }
});
