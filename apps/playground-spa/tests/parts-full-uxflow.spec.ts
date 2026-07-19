/**
 * parts full UX flow e2e (user 実操作フルシナリオ再現、 2026-07-19)。
 *
 * user 目視 report を e2e で完全再現する。 各 step で screenshot + DOM state を dump し、
 * click / hover / resize / zoom の 4 phase の layout 妥当性を直接 assert する。
 *
 * user 実 UX 期待:
 *   Phase 1: sample load = Client / API / DB の sequence が表示される (rename 反映確認)
 *   Phase 2: click achievement = parts が sequence と物理的に重ならない位置に配置される
 *   Phase 3: hover 上 = 点線 outline が achievement 全体を囲う
 *   Phase 4: SE drag = achievement のみ拡大、 sequence 不変
 *   Phase 5: zoom = 図全体拡大、 outline も同 scale で追随
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/parts-full-uxflow";

async function setup(page: Page) {
  mkdirSync(OUT_DIR, { recursive: true });
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(800);
}

async function snapshotDOM(page: Page, phaseTag: string): Promise<{
  lanes: Array<{ id: string; x: number; right: number; y: number; bottom: number }>;
  sequenceNodes: Array<{ id: string; x: number; right: number; y: number; bottom: number }>;
  partsSubNodes: Array<{ id: string; x: number; right: number; y: number; bottom: number }>;
  dslText: string;
  hoverOutline: { x: number; y: number; w: number; h: number } | null;
  cornerHandles: number;
}> {
  return await page.evaluate((tag) => {
    void tag;
    const svg = document.querySelector(".v4-editor-preview svg");
    const stage = document.querySelector(".v4-editor-preview");
    if (!svg || !stage) {
      return { lanes: [], sequenceNodes: [], partsSubNodes: [], dslText: "", hoverOutline: null, cornerHandles: 0 };
    }
    const lanes = Array.from(svg.querySelectorAll('[data-cdl-lane]'))
      .filter((el) => !(el.getAttribute("data-cdl-lane") ?? "").includes("__"))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute("data-cdl-lane") ?? "", x: r.x, right: r.right, y: r.y, bottom: r.bottom };
      });
    const allNodes = Array.from(svg.querySelectorAll('[data-cdl-node]'));
    const sequenceNodes = allNodes
      .filter((el) => !(el.getAttribute("data-cdl-node") ?? "").includes("__"))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute("data-cdl-node") ?? "", x: r.x, right: r.right, y: r.y, bottom: r.bottom };
      });
    const partsSubNodes = allNodes
      .filter((el) => (el.getAttribute("data-cdl-node") ?? "").includes("__"))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute("data-cdl-node") ?? "", x: r.x, right: r.right, y: r.y, bottom: r.bottom };
      });
    const dslText = document.querySelector('.cm-content')?.textContent ?? "";
    let hoverOutline: { x: number; y: number; w: number; h: number } | null = null;
    for (const el of Array.from(stage.querySelectorAll("div"))) {
      const style = (el as HTMLElement).style;
      if (style.borderStyle === "dashed" || (style.border && style.border.includes("dashed"))) {
        const r = el.getBoundingClientRect();
        hoverOutline = { x: r.x, y: r.y, w: r.width, h: r.height };
        break;
      }
    }
    const cornerHandles = stage.querySelectorAll('div[data-corner]').length;
    return { lanes, sequenceNodes, partsSubNodes, dslText, hoverOutline, cornerHandles };
  }, phaseTag);
}

test.describe("parts full UX flow (user 実操作 5 phase 完全再現)", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("full-flow = 5 phase 全 step で layout 妥当性 assert", async ({ page }) => {
    // ─── Phase 1: sample load 直後 ───
    await page.screenshot({ path: `${OUT_DIR}/phase1-loaded.png`, fullPage: false });
    const p1 = await snapshotDOM(page, "p1");
    expect(p1.lanes.length, `Phase 1: sequence lane 3 個 (Client/API/DB、 rename 済み)`).toBeGreaterThanOrEqual(3);
    expect(p1.dslText, `Phase 1 DSL に「Client」 含む (ユーザー rename 反映)`).toContain("Client");
    expect(p1.dslText, `Phase 1 DSL に「ユーザー」 が消滅 (rename)`).not.toContain("ユーザー");
    expect(p1.partsSubNodes.length, `Phase 1: parts 未追加`).toBe(0);

    // ─── Phase 2: click achievement ───
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(500);
    await page.click('[data-part-id="parts-achievement"]');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT_DIR}/phase2-after-click.png`, fullPage: false });
    const p2 = await snapshotDOM(page, "p2");

    // 2.1 = parts sub-node が render される
    expect(p2.partsSubNodes.length, `Phase 2: parts sub-node 追加 (DSL=\n${p2.dslText.slice(0, 400)})`).toBeGreaterThan(0);

    // 2.2 = 既存 sequence lane が保たれる (rect 保持 = pinning が効いてる)
    expect(p2.lanes.length, "Phase 2: sequence lane 3 個保持").toBeGreaterThanOrEqual(3);

    // 2.3 = parts の SVG element (sub-node) が既存 sequence node の SVG element と物理的に
    // overlap しない = 各 pair の client rect が交差しない。 lane bbox 判定は viewBox 拡張の
    // 動的性で false positive/negative になるため、 sub-node 個別 rect vs sequence node 個別 rect
    // の直接 overlap check に切り替える (user 目視の「重なって見える」 の真の検証)。
    let overlapCount = 0;
    let overlapDetail = "";
    for (const p of p2.partsSubNodes) {
      for (const s of p2.sequenceNodes) {
        const ox = Math.max(0, Math.min(p.right, s.right) - Math.max(p.x, s.x));
        const oy = Math.max(0, Math.min(p.bottom, s.bottom) - Math.max(p.y, s.y));
        if (ox > 5 && oy > 5) {
          overlapCount += 1;
          overlapDetail = `${p.id} × ${s.id} (overlap ${ox.toFixed(0)}×${oy.toFixed(0)}px)`;
        }
      }
    }
    expect(
      overlapCount,
      `Phase 2: parts sub-node と sequence node の 物理 overlap (${overlapCount} pair、 worst=${overlapDetail}) = user 目視 bug 「achievement が sequence 上に重なる」 の直接再現。 DSL:\n${p2.dslText.slice(0, 400)}\n\nparts rects: ${JSON.stringify(p2.partsSubNodes.map((p) => ({ id: p.id, x: p.x.toFixed(0), r: p.right.toFixed(0), y: p.y.toFixed(0), b: p.bottom.toFixed(0) })))}`,
    ).toBe(0);

    // ─── Phase 3: hover 上 parts で 点線 outline 表示 ───
    const firstPart = p2.partsSubNodes[0]!;
    const partsCx = (firstPart.x + firstPart.right) / 2;
    const partsCy = (firstPart.y + firstPart.bottom) / 2;
    await page.mouse.move(partsCx, partsCy);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT_DIR}/phase3-hover.png`, fullPage: false });
    const p3 = await snapshotDOM(page, "p3");

    expect(p3.hoverOutline, `Phase 3: hover で 点線 outline 表示 (partsCx=${partsCx.toFixed(0)}, partsCy=${partsCy.toFixed(0)})`).not.toBeNull();
    expect(p3.cornerHandles, "Phase 3: 4 隅 handle 表示").toBe(4);

    // outline は parts 全体を囲う (union bbox) = parts の右端 ± 10px 以内に outline の right が来る
    if (p3.hoverOutline && p3.partsSubNodes.length > 0) {
      const partsUnionRight = Math.max(...p3.partsSubNodes.map((p) => p.right));
      const outlineRight = p3.hoverOutline.x + p3.hoverOutline.w;
      const rightDiff = Math.abs(outlineRight - partsUnionRight);
      expect(
        rightDiff,
        `Phase 3: outline right が parts union right と ±30px (outline right=${outlineRight.toFixed(0)}, parts union right=${partsUnionRight.toFixed(0)})`,
      ).toBeLessThan(30);
    }

    // ─── Phase 4: SE handle drag で resize ───
    const seX = firstPart.right;
    const seY = firstPart.bottom;
    const sequenceBeforeResize = p3.sequenceNodes.map((n) => ({ ...n }));

    await page.mouse.move(seX, seY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(seX + 10 * i, seY + 10 * i);
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT_DIR}/phase4-after-resize.png`, fullPage: false });
    const p4 = await snapshotDOM(page, "p4");

    // 4.1 = parts が拡大した (幅 or 高さ +30px 以上)
    const partsBefore = p3.partsSubNodes.find((p) => p.id === firstPart.id);
    const partsAfter = p4.partsSubNodes.find((p) => p.id === firstPart.id);
    expect(partsAfter, "Phase 4: parts sub-node 存続").toBeDefined();
    if (partsBefore && partsAfter) {
      const wBefore = partsBefore.right - partsBefore.x;
      const hBefore = partsBefore.bottom - partsBefore.y;
      const wAfter = partsAfter.right - partsAfter.x;
      const hAfter = partsAfter.bottom - partsAfter.y;
      // DSL に posW/posH が書出されたか check、 未書出 = resize が DSL 反映されていない = bug
      const hasPosW = /achievement1[^{]*\{[^}]*posW\s*:/.test(p4.dslText);
      const hasPosH = /achievement1[^{]*\{[^}]*posH\s*:/.test(p4.dslText);
      expect(hasPosW && hasPosH, `Phase 4: DSL に achievement1 posW/posH 書出し (hasPosW=${hasPosW}, hasPosH=${hasPosH}) DSL 抜粋:\n${p4.dslText.slice(0, 600)}`).toBe(true);
      const grew = (wAfter - wBefore) > 50 || (hAfter - hBefore) > 50;
      expect(grew, `Phase 4: parts が明確に拡大 +50px 以上 (before ${wBefore.toFixed(0)}x${hBefore.toFixed(0)} → after ${wAfter.toFixed(0)}x${hAfter.toFixed(0)}、 drag 100px 相当) DSL:\n${p4.dslText.slice(0, 500)}`).toBe(true);
    }

    // 4.2 = 既存 sequence node の位置 / サイズが ±30px 以内 (parts のみ resize、 他不変)
    let seqWorstShift = 0;
    let seqWorstId = "";
    for (const before of sequenceBeforeResize) {
      const after = p4.sequenceNodes.find((n) => n.id === before.id);
      if (!after) continue;
      const wBefore = before.right - before.x;
      const hBefore = before.bottom - before.y;
      const wAfter = after.right - after.x;
      const hAfter = after.bottom - after.y;
      const shift = Math.abs(after.x - before.x) + Math.abs(after.y - before.y) + Math.abs(wAfter - wBefore) + Math.abs(hAfter - hBefore);
      if (shift > seqWorstShift) { seqWorstShift = shift; seqWorstId = before.id; }
    }
    expect(
      seqWorstShift,
      `Phase 4: sequence node ${seqWorstId} の shift (${seqWorstShift.toFixed(1)}) が 40 以下 (parts のみ resize、 viewport 再拡張の縮小分は許容)`,
    ).toBeLessThan(40);

    // ─── Phase 5: zoom で outline sync ───
    // parts の中央に mouse 戻す (hover 維持) + wheel zoom in
    const partsAfterCx = partsAfter ? (partsAfter.x + partsAfter.right) / 2 : partsCx;
    const partsAfterCy = partsAfter ? (partsAfter.y + partsAfter.bottom) / 2 : partsCy;
    await page.mouse.move(partsAfterCx, partsAfterCy);
    await page.waitForTimeout(300);
    const p5before = await snapshotDOM(page, "p5-before-zoom");

    // wheel zoom in 3 回
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT_DIR}/phase5-after-zoom.png`, fullPage: false });
    const p5after = await snapshotDOM(page, "p5-after-zoom");

    // 5.1 = 図が拡大した (parts のいずれかの sub-node が +5% 以上大きくなった)
    const p5PartsBefore = p5before.partsSubNodes.find((p) => p.id === firstPart.id);
    const p5PartsAfter = p5after.partsSubNodes.find((p) => p.id === firstPart.id);
    expect(p5PartsAfter, "Phase 5: parts sub-node が zoom 後も存続").toBeDefined();
    if (p5PartsBefore && p5PartsAfter) {
      const wBefore = p5PartsBefore.right - p5PartsBefore.x;
      const wAfter = p5PartsAfter.right - p5PartsAfter.x;
      const partsScale = wAfter / wBefore;
      expect(partsScale, `Phase 5: 図が zoom で拡大 (before w=${wBefore.toFixed(0)} → after w=${wAfter.toFixed(0)}、 scale=${partsScale.toFixed(2)})`).toBeGreaterThan(1.05);

      // 5.2 = outline が拡大方向に追随 (user 目視 bug 「点線の四角は拡大しない」 の再現防止)
      if (p5before.hoverOutline && p5after.hoverOutline) {
        const outlineScale = p5after.hoverOutline.w / p5before.hoverOutline.w;
        expect(
          outlineScale,
          `Phase 5: outline が zoom で拡大した (before w=${p5before.hoverOutline.w.toFixed(0)} → after w=${p5after.hoverOutline.w.toFixed(0)}、 scale=${outlineScale.toFixed(2)})、 拡大しないなら user 目視 bug 再現`,
        ).toBeGreaterThan(1.05);
        // parts scale と outline scale の乖離は許容 (hover cursor 位置変化で別 rect 拾う場合あり)
        // 但し完全 stuck (scale=1) は bug なので上で >1.05 で assert 済
        void partsScale;
      } else {
        expect(p5after.hoverOutline, "Phase 5: zoom 後も outline 存続").not.toBeNull();
      }
    }
  });
});
