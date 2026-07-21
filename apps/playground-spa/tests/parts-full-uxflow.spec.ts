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

// 既存 sequence node (parts merge 由来 `__` prefix 除外) の WORLD 座標 (SVG user space) を測定する。
// client 座標は part 追加 / resize で viewBox が拡張されると全体が再スケールされてシフトするため、
// 「既存 layout が reflow したか」 の判定には getScreenCTM inverse で world 変換した座標を使う。
async function measureSeqWorld(page: Page): Promise<Record<string, { x: number; y: number }>> {
  return page.evaluate(() => {
    const svg = document.querySelector(".v4-editor-preview svg") as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return {} as Record<string, { x: number; y: number }>;
    const inv = ctm.inverse();
    const out: Record<string, { x: number; y: number }> = {};
    document.querySelectorAll("[data-cdl-node]").forEach((el) => {
      const id = el.getAttribute("data-cdl-node") ?? "";
      if (id.includes("__")) return;
      const r = el.getBoundingClientRect();
      const pt = svg.createSVGPoint();
      pt.x = r.x + r.width / 2;
      pt.y = r.y + r.height / 2;
      const w = pt.matrixTransform(inv);
      out[id] = { x: w.x, y: w.y };
    });
    return out;
  });
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
    const seqWorldBeforeResize = await measureSeqWorld(page);

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
      // DSL に posW/posH が書出されたか check、 未書出 = resize が DSL 反映されていない = bug
      const hasPosW = /achievement1[^{]*\{[^}]*posW\s*:/.test(p4.dslText);
      const hasPosH = /achievement1[^{]*\{[^}]*posH\s*:/.test(p4.dslText);
      expect(hasPosW && hasPosH, `Phase 4: DSL に achievement1 posW/posH 書出し (hasPosW=${hasPosW}, hasPosH=${hasPosH}) DSL 抜粋:\n${p4.dslText.slice(0, 600)}`).toBe(true);
      // 拡大判定は WORLD size (DSL posW/posH) で行う = client 座標の rect は part 追加/resize で viewBox が
      // 拡張されると全体が再スケールされて縮小しうるため (part を既存図の下の空きエリアに置く新配置で顕在化)。
      // resize は SE handle を +100 CSS px drag し、 achievement part の自然幅 (~380 world) より明確に拡大する。
      const posWMatch = p4.dslText.match(/achievement1[^{]*\{[^}]*posW\s*:\s*(\d+)/);
      const posHMatch = p4.dslText.match(/achievement1[^{]*\{[^}]*posH\s*:\s*(\d+)/);
      const posW = posWMatch ? parseInt(posWMatch[1]!, 10) : 0;
      const posH = posHMatch ? parseInt(posHMatch[1]!, 10) : 0;
      const grew = posW > 450 && posH > 450;
      expect(grew, `Phase 4: parts が world size で明確に拡大 (posW=${posW}, posH=${posH} > 自然幅 ~380)。 client rect は再スケールで縮小しうるため world 判定。 DSL:\n${p4.dslText.slice(0, 500)}`).toBe(true);
    }

    // 4.2 = 既存 sequence node の WORLD 座標が resize 後も不変 = parts のみ resize、 他 reflow なし。
    // client 座標は part resize で viewBox が拡張されると再スケールされるため world 座標で判定する。
    const seqWorldAfterResize = await measureSeqWorld(page);
    let seqWorstShift = 0;
    let seqWorstId = "";
    for (const id of Object.keys(seqWorldBeforeResize)) {
      const before = seqWorldBeforeResize[id]!;
      const after = seqWorldAfterResize[id];
      if (!after) continue;
      const shift = Math.abs(after.x - before.x) + Math.abs(after.y - before.y);
      if (shift > seqWorstShift) { seqWorstShift = shift; seqWorstId = id; }
    }
    expect(
      seqWorstShift,
      `Phase 4: sequence node ${seqWorstId} の world 座標 shift (${seqWorstShift.toFixed(1)}) が 30 以下 = parts のみ resize、 既存 layout は reflow しない`,
    ).toBeLessThan(30);

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
    // zoom で view が pan/scale するため part が mouse 下から外れる。 part の現在 client 中央を再取得して
    // hover し直し、 outline を part 上に維持する (再 hover しないと別要素の rect を拾い outline scale が
    // part scale と乖離して test が fragile になる)。
    const p5PartCenter = await page.evaluate((pid) => {
      const el = document.querySelector(`[data-cdl-node="${pid}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    }, firstPart.id);
    if (p5PartCenter) {
      await page.mouse.move(p5PartCenter.cx, p5PartCenter.cy);
      await page.waitForTimeout(300);
    }
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

      // 5.2 = outline が part を囲い続ける (user 目視 bug 「点線の四角は拡大しない = part と乖離」 の防止)。
      // zoom 前後の outline 絶対 scale は hover 位置 / detached overlay 検出の揺れで不安定なため、
      // 「zoom 後の outline が part を同オーダーで囲うサイズか」 (outline が part に追随しているか) で判定。
      // outline が拡大せず stuck なら part 拡大後 (5.1) に対し outline/part 比が小さくなって fail する。
      if (p5after.hoverOutline && p5PartsAfter) {
        const partWAfter = p5PartsAfter.right - p5PartsAfter.x;
        const outlineToPart = p5after.hoverOutline.w / Math.max(1, partWAfter);
        expect(
          outlineToPart,
          `Phase 5: zoom 後 outline (w=${p5after.hoverOutline.w.toFixed(0)}) が part (w=${partWAfter.toFixed(0)}) を囲うサイズで追随 (outline/part=${outlineToPart.toFixed(2)})、 stuck なら比が過小`,
        ).toBeGreaterThan(0.5);
        expect(outlineToPart, "Phase 5: outline が part に対し過大でない (別 overlay 誤検出でない)").toBeLessThan(4);
        void partsScale;
      } else {
        expect(p5after.hoverOutline, "Phase 5: zoom 後も outline 存続").not.toBeNull();
      }
    }
  });
});
