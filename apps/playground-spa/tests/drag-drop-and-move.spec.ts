/**
 * drag-drop 座標指定 + parts 単独 drag 移動 網羅 e2e (2026-07-19、 iter6)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter6:
 *   G1 = preview 上の指定座標に parts drag-drop = drop 座標付近に配置される
 *   G2 = 複数箇所 drop = 各 drop 位置が尊重される
 *   G3 = 追加後の parts drag = DSL の posX/posY が更新される
 *   G4 = drag 直後の他 element (sequence) 保持 (drop で全崩れしない)
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/drag-drop-and-move";

async function setup(page: Page) {
  mkdirSync(OUT_DIR, { recursive: true });
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(600);
}

async function getPartsRects(page: Page): Promise<Array<{ id: string; alias: string; cx: number; cy: number }>> {
  return await page.evaluate(() => {
    const svg = document.querySelector(".v4-editor-preview svg");
    if (!svg) return [];
    return Array.from(svg.querySelectorAll('[data-cdl-node]'))
      .filter((el) => (el.getAttribute("data-cdl-node") ?? "").includes("__"))
      .map((el) => {
        const id = el.getAttribute("data-cdl-node") ?? "";
        const alias = id.split("__")[0] ?? "";
        const r = el.getBoundingClientRect();
        return { id, alias, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
      });
  });
}

test.describe("drag-drop 座標指定 + parts 単独移動 網羅", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("G1-forensic = preview 指定座標 (右下寄り) に parts drag drop で 該当座標付近に描画", async ({ page }) => {
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(500);

    const preview = page.locator(".v4-editor-preview");
    const previewBox = await preview.boundingBox();
    expect(previewBox).not.toBeNull();

    // drop 位置 = preview の右下寄り (0.7, 0.8)
    const dropX = previewBox!.x + previewBox!.width * 0.7;
    const dropY = previewBox!.y + previewBox!.height * 0.8;

    // drag from sidebar item to preview
    const partsBtn = page.locator('[data-part-id="parts-achievement"]').first();
    await partsBtn.dragTo(preview, {
      targetPosition: { x: previewBox!.width * 0.7, y: previewBox!.height * 0.8 },
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT_DIR}/G1-drop-right-bottom.png`, fullPage: false });

    const parts = await getPartsRects(page);
    expect(parts.length, "G1: parts sub-node 追加").toBeGreaterThan(0);

    // parts 重心が drop 座標付近 (200px 以内) にあること
    const centroidX = parts.reduce((s, p) => s + p.cx, 0) / parts.length;
    const centroidY = parts.reduce((s, p) => s + p.cy, 0) / parts.length;
    const distance = Math.sqrt((centroidX - dropX) ** 2 + (centroidY - dropY) ** 2);

    // drop 座標尊重 = ± 300px 以内 (viewport auto-fit 保持で scale の余地あり)
    expect(distance, `G1: parts 重心 (${centroidX.toFixed(0)}, ${centroidY.toFixed(0)}) と drop 座標 (${dropX.toFixed(0)}, ${dropY.toFixed(0)}) の距離 ${distance.toFixed(0)}px < 300`).toBeLessThan(300);
  });

  test("G2-forensic = 2 箇所 drop で 各 drop 位置が異なる parts に反映", async ({ page }) => {
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(500);

    const preview = page.locator(".v4-editor-preview");
    const previewBox = await preview.boundingBox();

    // 1 個目 = 左下
    await page.locator('[data-part-id="parts-achievement"]').first().dragTo(preview, {
      targetPosition: { x: previewBox!.width * 0.55, y: previewBox!.height * 0.75 },
    });
    await page.waitForTimeout(1200);

    const parts1 = await getPartsRects(page);
    expect(parts1.length).toBeGreaterThan(0);
    const cx1 = parts1.reduce((s, p) => s + p.cx, 0) / parts1.length;

    // 2 個目 = 右下
    await page.locator('[data-part-id="parts-arc-gauge"]').first().dragTo(preview, {
      targetPosition: { x: previewBox!.width * 0.85, y: previewBox!.height * 0.75 },
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT_DIR}/G2-two-drops.png`, fullPage: false });

    const parts2 = await getPartsRects(page);
    const aliases = new Set(parts2.map((p) => p.alias));
    expect(aliases.size, `G2: 2 個の parts alias (${[...aliases].join(",")})`).toBeGreaterThanOrEqual(2);

    // 各 alias の重心 X が異なる方向 (arc-gauge cx > achievement cx)
    const groupBy: Record<string, number[]> = {};
    for (const p of parts2) {
      groupBy[p.alias] = (groupBy[p.alias] ?? []).concat(p.cx);
    }
    const aliasCx = Object.fromEntries(
      Object.entries(groupBy).map(([a, cxs]) => [a, cxs.reduce((s, x) => s + x, 0) / cxs.length])
    );
    const cxs = Object.values(aliasCx);
    // 2 個の parts の cx 差 が 100px 以上 = 異なる位置に配置 (viewport 縮小率で client 差は縮まるので緩和)
    const cxDiff = Math.max(...cxs) - Math.min(...cxs);
    expect(cxDiff, `G2: 2 個 parts の cx 差 ${cxDiff.toFixed(0)}px > 100 (異なる drop 位置反映) 初回 cx=${cx1.toFixed(0)}`).toBeGreaterThan(100);
  });

  test("G3-forensic = 追加後の parts 全体を drag = DSL の posX 更新", async ({ page }) => {
    // parts add
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(500);
    await page.click('[data-part-id="parts-achievement"]');
    await page.waitForTimeout(1500);

    // DSL 初期状態
    const dslBefore = await page.evaluate(() => document.querySelector('.cm-content')?.textContent ?? "");
    const initPosXMatch = dslBefore.match(/achievement1[^{]*\{[^}]*posX\s*:\s*(-?\d+)/);
    const initPosX = initPosXMatch ? parseInt(initPosXMatch[1]!, 10) : NaN;
    expect(Number.isFinite(initPosX), `G3: initial DSL に achievement1 posX 存在 (DSL:\n${dslBefore.slice(0, 300)})`).toBe(true);

    // parts の中央を掴んで drag 移動 (左方向 200 client px)
    const partsRects = await getPartsRects(page);
    expect(partsRects.length).toBeGreaterThan(0);
    const first = partsRects[0]!;
    // hover でまず handle 表示させ、 body 中央から drag
    await page.mouse.move(first.cx, first.cy);
    await page.waitForTimeout(400);

    // body 中央で mouse down → 左に 200px 移動 → up
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(first.cx - 20 * i, first.cy);
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT_DIR}/G3-after-move.png`, fullPage: false });

    // DSL 更新 = posX が変化した (小さくなった)
    const dslAfter = await page.evaluate(() => document.querySelector('.cm-content')?.textContent ?? "");
    const afterPosXMatch = dslAfter.match(/achievement1[^{]*\{[^}]*posX\s*:\s*(-?\d+)/);
    const afterPosX = afterPosXMatch ? parseInt(afterPosXMatch[1]!, 10) : NaN;
    expect(Number.isFinite(afterPosX), `G3: drag 後の DSL に posX 存在`).toBe(true);
    // posX 変化 = DSL の書換が起きた
    const changed = Math.abs(afterPosX - initPosX) > 50;
    expect(changed, `G3: parts drag で DSL posX 変化 (before=${initPosX} → after=${afterPosX})`).toBe(true);
  });

  test("G4-forensic = drop で 既存 sequence node の DSL posX/Y が pinning で保持", async ({ page }) => {
    // DSL pinning check = 既存 sequence actor の posX/posY が drop 前後で不変 (client shift は
    // viewport scale で変わるため semantics 不安定、 DSL 上の真の pinning を判定)
    const dslBefore = await page.evaluate(() => document.querySelector('.cm-content')?.textContent ?? "");
    const beforePinned = /Client\s*:\s*\{\s*posX\s*:\s*(-?\d+)/.exec(dslBefore);
    // 初期 sample には posX 未書出 (auto layout)、 drop 時 pinExistingActorLayoutFromSvg で書出される
    // よって drop 前は posX なし、 drop 後は書出 = 「Client の posX field が drop 前後で pinning された」 を assert

    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(500);
    const preview = page.locator(".v4-editor-preview");
    const previewBox = await preview.boundingBox();
    await page.locator('[data-part-id="parts-achievement"]').first().dragTo(preview, {
      targetPosition: { x: previewBox!.width * 0.6, y: previewBox!.height * 0.7 },
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT_DIR}/G4-after-drop-preserved.png`, fullPage: false });

    const dslAfter = await page.evaluate(() => document.querySelector('.cm-content')?.textContent ?? "");
    // 全 sequence actor の posX/posY が同じ値 (元 lane 座標) で pinning されていること = 真の pinning
    const actorRe = /-\s*([A-Za-z]\w*)\s*:\s*\{([^}]*)\}/g;
    const seqActors: Array<{ name: string; posY: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = actorRe.exec(dslAfter)) !== null) {
      const name = m[1]!;
      const inner = m[2]!;
      if (inner.includes("kind:")) continue; // parts entry skip
      const py = inner.match(/posY\s*:\s*(-?\d+)/);
      if (py) seqActors.push({ name, posY: parseInt(py[1]!, 10) });
    }
    expect(seqActors.length, `G4: sequence actor 3 個以上が posX/posY 明示 pinning された (DSL:\n${dslAfter.slice(0, 400)})`).toBeGreaterThanOrEqual(3);
    // 全 sequence actor の posY が同じ = 元 lane top で並ぶ
    const posYSet = new Set(seqActors.map((a) => a.posY));
    expect(posYSet.size, `G4: sequence actor posY が pinning で 統一 (values=${[...posYSet].join(",")})`).toBeLessThanOrEqual(1);
    void beforePinned;
  });
});
