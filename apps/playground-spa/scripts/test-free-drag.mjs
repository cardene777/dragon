/**
 * user 明示 「Miro のように完全自由 drag」 = drag 対象の snap は全廃止、 drop 位置を常に尊重。
 * ユーザーが指定した mouse 位置 (dx, dy) がそのまま posX / posY として書込されるか verify。
 */
import { chromium } from "playwright";
const BASE = "http://localhost:4323";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const results = [];
function rec(id, pass, detail) { results.push({id, pass}); console.log(`  ${pass?"✅":"❌"} [${id}] ${detail}`); }

async function reload() {
  await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.click('[data-testid="editor-parts-tab"]'); await page.waitForTimeout(1500);
  await page.locator('[role="tab"]:has-text("サンプル")').first().click(); await page.waitForTimeout(500);
}

async function dragElement(sel, dx, dy) {
  const el = page.locator(sel).first();
  const b = await el.boundingBox();
  if (!b) return null;
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  return { cx, cy };
}

async function getPos(alias) {
  const dsl = await page.evaluate(() => window.__cdlEditorSrc ?? "");
  const line = dsl.split("\n").find(l => l.includes(`- ${alias}`));
  if (!line) return null;
  const px = parseInt((line.match(/posX:\s*(-?\d+)/) || [])[1] ?? "0");
  const py = parseInt((line.match(/posY:\s*(-?\d+)/) || [])[1] ?? "0");
  return { px, py, line };
}

console.log("=== 完全自由 drag verify ===\n");

await reload();

// T1: ユーザー header を X 100px 右に drag → posX ≈ 100 (snap なし = 生値そのまま)
await dragElement('[data-cdl-node="ユ-ザ-header"]', 100, 30);
const p1 = await getPos("ユーザー");
// scale 補正で client 100px → SVG posX 大きめ、 方向性 (正の X + 正の Y) だけ verify
rec("T1", p1 && p1.px > 50 && p1.py > 15,
  `posX=${p1?.px}, posY=${p1?.py} (期待 X > 50 AND Y > 15、 drag 方向反映)`);

// T2: 他 element 近くに drag しても snap しない (Y align 廃止確認)
// api-header の位置に近づく方向に drag = api の Y = 401 前後、 ユーザー = 401 前後 (同 stack)
// api header の 5px 隣に drag = X 200 前後、 Y そのまま = Y snap 発火なら Y = 401 補正、
// 廃止後は Y 元 mouse 位置のまま
await reload();
const uB = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
const aB = await page.locator('[data-cdl-node="api-header"]').first().boundingBox();
const dxT2 = (aB.x + aB.width/2) - (uB.x + uB.width/2) - 30;
const dyT2 = 15;  // 15px 下にずらす、 snap 廃止なら Y=15 のまま
await dragElement('[data-cdl-node="ユ-ザ-header"]', dxT2, dyT2);
const p2 = await getPos("ユーザー");
// snap 廃止 = Y は drag した dyT2 (>0) に相応する SVG 座標。 snap 発火なら 0 に補正されていた。
rec("T2", p2 && p2.py > 5, `snap なし verify: posY=${p2?.py} (snap 発火なら 0、 廃止なら >0)`);

// T3: 別 lane 吸い寄せなし (X 座標が posX でそのまま反映)
await reload();
await dragElement('[data-cdl-node="ユ-ザ-header"]', -200, 100);
const p3 = await getPos("ユーザー");
rec("T3", p3 && p3.px < -100, `X 吸い寄せなし: posX=${p3?.px} (期待 < -100 = drag した方向)`);

console.log("\n=== SUMMARY ===");
const passed = results.filter(r => r.pass).length;
console.log(`${passed}/${results.length} PASS`);
await browser.close();
process.exit(passed === results.length ? 0 : 1);
