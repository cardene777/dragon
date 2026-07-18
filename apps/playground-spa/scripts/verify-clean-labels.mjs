// user 指摘 arraySignalHistogram の label + description が clean 日本語になったか screenshot 確認
import { chromium } from "playwright";

const url = "http://localhost:4323/catalog/interactive";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

// arraySignalHistogram sidebar item click
const target = page.locator("aside.catalog-sidebar").getByText("arraySignal と template でヒストグラム", { exact: false }).first();
const exists = await target.count();
console.log(`target exists = ${exists}`);
if (exists) {
  await target.click();
  await page.waitForTimeout(1500);
}

await page.screenshot({ path: "/tmp/verify-clean-labels.png", fullPage: false });
console.log("saved /tmp/verify-clean-labels.png");

await browser.close();
