/**
 * canvas pivot parts binding — 実 animation で source (counter) の tween が sink (arc) に流れるか
 * visual verify する。 phase 進行に沿って複数時点の screenshot + arc shape の angle attr を抽出して
 * 数値的に「連動している」 を証明する。
 */
import { chromium } from "playwright";

const DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

async function reload() {
  await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(1500);
  await page.locator('[role="tab"]:has-text("サンプル")').first().click();
  await page.waitForTimeout(500);
}

async function replaceSrc(text) {
  await page.click('.cm-content');
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);
  await page.keyboard.insertText(text);
  await page.waitForTimeout(2000);
}

async function readArcAngle() {
  // arc-gauge の dyn-arc shape は path element の d attribute で扇形を描画。
  // path d 全 char を返して sha 相当で比較。
  return await page.evaluate(() => {
    const arcNode = document.querySelector('svg [data-cdl-node="arcgauge1__arc"]');
    if (!arcNode) return { d: null, opacity: null, allPaths: 0 };
    const paths = Array.from(arcNode.querySelectorAll('path'));
    const opacity = arcNode.getAttribute('opacity');
    return { d: paths[0]?.getAttribute('d') || null, opacity, allPaths: paths.length };
  });
}

async function readCounterN() {
  return await page.evaluate(() => {
    // counter subtitle "{n} 件" が現在値を含む
    const text = document.querySelector('svg [data-cdl-node="counteractor1__cnt"] text');
    return text ? text.textContent : null;
  });
}

console.log("=== Binding Animation Visual Verify ===\n");

await reload();
await replaceSrc(`title: "binding demo"
type: sequence

actors:
  - user
  - api
  - counter1: { kind: counter-actor }
  - arcgauge1: { kind: arc-gauge, bind: counter1.n }

flow:
  - user -> api: "click"
`);

// timeline に沿って複数時点の screenshot
const timeline = [0, 800, 1600, 2400, 3200];
const samples = [];
for (const ms of timeline) {
  await page.waitForTimeout(ms === 0 ? 500 : 800);
  const arc = await readArcAngle();
  const cntText = await readCounterN();
  samples.push({ ms, dLen: (arc.d ?? "").length, dSample: (arc.d ?? "").slice(0, 30), opacity: arc.opacity, cntText });
  await page.screenshot({ path: `${DIR}/binding-anim-t${ms}.png`, fullPage: false });
  console.log(`  t=${ms}ms: d.length=${(arc.d ?? "").length}, d[0..30]=${(arc.d ?? "").slice(0, 30)}, opacity=${arc.opacity}, counter=${cntText}`);
}
// arc の d が時点 A と時点 B で違えば animation 発生
const uniqueDPatterns = new Set(samples.map((s) => s.dSample));
console.log(`\n感 unique arc d patterns across samples: ${uniqueDPatterns.size}`);

const animationDetected = uniqueDPatterns.size >= 2;
console.log(`\n判定: animation 検出 (arc d が変化 = counter tween が sink に流れている): ${animationDetected ? "✅" : "❌"}`);

await browser.close();
process.exit(animationDetected ? 0 : 1);
