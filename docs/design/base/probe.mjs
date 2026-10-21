// 図ごとに、運ぶ物が 1 つも見えていない時間の割合と、同時に見えている線の名前と番号の数を測る。
// 0.25 秒ごとに止めて、不透明度 0.3 を超えて見えている物だけを数える
import { chromium } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const DIR = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 1400 } });
for (const scene of ["ccip", "oauth", "order", "web", "git", "finality"]) {
  await page.goto(`file://${join(DIR, "gallery.html")}?scene=${scene}`);
  await page.waitForTimeout(250);
  const r = await page.evaluate(async () => {
    const q = window.__seq, S = q.S, END = q.END;
    // 祖先の不透明度を掛け合わせて、実際に見えているかを判定する
    const seen = (el) => { let o = 1; for (let n = el; n && n.tagName !== "svg"; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o > 0.3; };
    const fig = document.querySelector(".pn .fig");
    let empty = 0, n = 0, maxCap = 0, maxBadge = 0, maxCar = 0;
    for (let t = S[0]; t < END; t += 0.25) {
      q.pause(); q.seek(t);
      await new Promise((r) => requestAnimationFrame(r));
      const carriers = [...fig.querySelectorAll(".carrier")].filter(seen).length;
      if (carriers === 0) empty++;
      maxCar = Math.max(maxCar, carriers);
      n++;
      maxCap = Math.max(maxCap, [...fig.querySelectorAll(".cap rect")].filter(seen).length);
      maxBadge = Math.max(maxBadge, [...fig.querySelectorAll(".bdp, .bdf")].filter(seen).length);
    }
    return { empty: Math.round((empty / n) * 100), maxCap, maxBadge, maxCar, steps: S.length };
  });
  console.log(`${scene}: 運ぶ物が見えない時間 ${r.empty}% / 同時に見える運ぶ物 最大 ${r.maxCar} / 線の名前 最大 ${r.maxCap} / 番号 最大 ${r.maxBadge} (段 ${r.steps})`);
}
await browser.close();
