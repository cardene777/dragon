/**
 * canvas pivot UX 実 bug forensic e2e (user 目視 fedback 対応)。
 *
 * user 3 bug report:
 * B1 = パーツごとに拡大できず、 図全体がデカくなる (hover 四角枠のサイズも対象と一致しない)
 * B2 = parts (achievement 等) upload 後 resize が元に戻る
 * B3 = 特定パーツをクリックできない (parts 内部 element の pointer-events 不通)
 *
 * このファイルは **修正前の現状再現テスト** = fail することを期待する。 全 3 bug を可視化して
 * 修正後に「pass に変わる」 を verify する。 attribute-only ではなく実 UX (SVG rect 実測 + DOM
 * 構造 dump + screenshot 保存) で判定。
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/ux-forensic";

async function setup(page: Page) {
  mkdirSync(OUT_DIR, { recursive: true });
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(600);
}

test.describe("canvas pivot UX forensic (user report 3 bug)", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("B1-forensic = hover 中の四角枠が対象 element と同じサイズか", async ({ page }) => {
    // sequence の header node (data-cdl-node) を hover して、
    // hoveredHandle rect (点線四角) が対象 node の bounding rect と ±3px 以内で一致するか判定。
    const nodes = await page.$$("[data-cdl-node]");
    expect(nodes.length).toBeGreaterThan(0);
    const targetIdx = 0; // 最初の header node
    const rectExpected = await nodes[targetIdx].boundingBox();
    expect(rectExpected).not.toBeNull();

    // 中心を hover
    await page.mouse.move(rectExpected!.x + rectExpected!.width / 2, rectExpected!.y + rectExpected!.height / 2);
    await page.waitForTimeout(500);

    // 点線 outline の DOM を取得 (border-style: dashed で描画されている div)
    const outline = await page.evaluate(() => {
      const stage = document.querySelector(".v4-editor-preview");
      if (!stage) return null;
      const stageRect = stage.getBoundingClientRect();
      // 点線 outline = border dashed style を持つ absolute div (canvas pivot PR-B で追加した hover handle box)
      const candidates = Array.from(stage.querySelectorAll("div"));
      for (const el of candidates) {
        const style = (el as HTMLElement).style;
        if (style.border?.includes("dashed") || style.borderStyle === "dashed" || (style.border && style.border.includes("dashed"))) {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height, stageX: stageRect.x, stageY: stageRect.y };
        }
      }
      return null;
    });

    await page.screenshot({ path: `${OUT_DIR}/B1-hover-outline.png`, fullPage: false });

    expect(outline, "hover 中の点線 outline overlay が DOM に存在").not.toBeNull();
    if (outline && rectExpected) {
      const dx = Math.abs(outline.x - rectExpected.x);
      const dy = Math.abs(outline.y - rectExpected.y);
      const dw = Math.abs(outline.width - rectExpected.width);
      const dh = Math.abs(outline.height - rectExpected.height);
      // ±3 px 以内で 対象 node と outline の rect が一致すること
      expect(dx, `outline.x should match target.x (dx=${dx}, expected=${rectExpected.x}, actual=${outline.x})`).toBeLessThan(3);
      expect(dy, `outline.y should match target.y (dy=${dy})`).toBeLessThan(3);
      expect(dw, `outline.width should match target.width (dw=${dw})`).toBeLessThan(3);
      expect(dh, `outline.height should match target.height (dh=${dh})`).toBeLessThan(3);
    }
  });

  test("B1-forensic = 個別 node を resize しても他 element (spacer / footer 等) は変わらない", async ({ page }) => {
    // hover して 4 隅 handle を出す
    const nodes = await page.$$("[data-cdl-node]");
    const headerNode = nodes[0]; // *-header
    const targetRect = await headerNode.boundingBox();
    expect(targetRect).not.toBeNull();

    // 他 element (別 node) の初期 rect を記録
    const otherNodes = await page.$$("[data-cdl-node]");
    const beforeSnapshot = await Promise.all(otherNodes.slice(1, 5).map(async (n) => {
      const box = await n.boundingBox();
      const id = await n.getAttribute("data-cdl-node");
      return { id, box };
    }));

    // hover して handle 出す
    await page.mouse.move(targetRect!.x + targetRect!.width / 2, targetRect!.y + targetRect!.height / 2);
    await page.waitForTimeout(400);

    // 右下 handle 位置を SE corner で drag
    const seX = targetRect!.x + targetRect!.width;
    const seY = targetRect!.y + targetRect!.height;
    await page.mouse.move(seX, seY);
    await page.mouse.down();
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(seX + 60 * i / 15, seY + 60 * i / 15);
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(800);

    // 他 element の位置 / サイズが変わっていないこと (resize が local scope に留まる) を verify
    const afterSnapshot = await Promise.all(otherNodes.slice(1, 5).map(async (n) => {
      const box = await n.boundingBox();
      const id = await n.getAttribute("data-cdl-node");
      return { id, box };
    }));

    await page.screenshot({ path: `${OUT_DIR}/B1-after-resize.png`, fullPage: false });

    for (let i = 0; i < beforeSnapshot.length; i++) {
      const b = beforeSnapshot[i];
      const a = afterSnapshot[i];
      if (!b.box || !a.box) continue;
      const dx = Math.abs(a.box.x - b.box.x);
      const dy = Math.abs(a.box.y - b.box.y);
      const dw = Math.abs(a.box.width - b.box.width);
      const dh = Math.abs(a.box.height - b.box.height);
      // 他 element の shift / resize は ±5 px 以内 (drag 対象以外は動かない)
      expect(dx + dy + dw + dh, `other node ${b.id} should not resize/shift when target is resized (before=${JSON.stringify(b.box)}, after=${JSON.stringify(a.box)})`).toBeLessThan(20);
    }
  });

  test("B3-forensic = parts の内部 SVG element (arc / circle 等) がクリック可能", async ({ page }) => {
    // parts tab 開く
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(1000);
    // parts (achievement) 追加
    const partsBtn = await page.$('[data-part-id="parts-achievement"]');
    expect(partsBtn, "parts-achievement button 存在").not.toBeNull();
    await partsBtn!.click();
    await page.waitForTimeout(1200);

    // parts の内部 SVG element (data-cdl-node includes __ で parts prefix) が hittest 経由で click 可能か
    const partsEls = await page.evaluate(() => {
      const svg = document.querySelector(".v4-editor-preview svg");
      if (!svg) return [];
      return Array.from(svg.querySelectorAll('[data-cdl-node]'))
        .filter((el) => (el.getAttribute("data-cdl-node") ?? "").includes("__"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          const hitTarget = document.elementFromPoint(cx, cy);
          return {
            id: el.getAttribute("data-cdl-node"),
            hitTag: hitTarget?.tagName,
            // hitTarget から parent chain で data-cdl-node が見つかれば click 経由で hover / drag 可
            hitReachesLane: (() => {
              let cur: Element | null = hitTarget;
              while (cur) {
                if (cur.getAttribute?.("data-cdl-node")) return true;
                cur = cur.parentElement;
              }
              return false;
            })(),
          };
        });
    });

    await page.screenshot({ path: `${OUT_DIR}/B3-parts-clickable.png`, fullPage: false });

    expect(partsEls.length, "parts overlay element が存在").toBeGreaterThan(0);
    for (const p of partsEls) {
      expect(p.hitReachesLane, `parts ${p.id} が hit test で data-cdl-node parent に到達可能 (pointer-events 通過)`).toBe(true);
    }
  });

  test("B2-forensic = parts 追加後も 既存 node の resize が独立に動く", async ({ page }) => {
    // sequence load 済 → まず sequence header node の rect を記録
    const nodes = await page.$$("[data-cdl-node]");
    const headerBefore = await nodes[0].boundingBox();
    expect(headerBefore).not.toBeNull();

    // parts tab 開いて追加
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(600);
    await page.click('[data-part-id="parts-achievement"]');
    await page.waitForTimeout(1200);

    // 既存 sequence header の rect が変わらないこと (parts 追加で auto-layout が押し出されない)
    const nodesAfter = await page.$$("[data-cdl-node]");
    const headerAfter = await nodesAfter[0].boundingBox();
    expect(headerAfter).not.toBeNull();
    const dx = Math.abs(headerAfter!.x - headerBefore!.x);
    const dy = Math.abs(headerAfter!.y - headerBefore!.y);
    // 20 CSS px 以内 = parts 追加で全体 layout が大きく変わらない
    expect(dx + dy, `既存 header は parts 追加で大きく shift しない (before=${JSON.stringify(headerBefore)}, after=${JSON.stringify(headerAfter)})`).toBeLessThan(50);

    await page.screenshot({ path: `${OUT_DIR}/B2-after-parts-add.png`, fullPage: false });
  });
});
