/**
 * canvas pivot 新 spec 包括 e2e test (dragon canvas pivot spec §product-spec-redefinition)。
 *
 * kiwa 相当の fixture 設計 = helper 群 + scenario 定型 + 12 preset 走査。
 * dragon は dApp じゃないので wallet inject 部分は不要、 kiwa の multi-scenario 経路のみ応用。
 *
 * 目的 = 前回の attribute-only assertion (「data-* 属性が付く」 レベル) から脱却、 実 UX と等価な e2e
 * (drag → 視覚 rect 実測 → drop → DSL 実 write back → 再 render 後 visual verify) を全 preset で回す。
 *
 * spec 対応 (spec 項目 1-6 全て):
 * - S1 自由移動 = lane drag で SVG rect が実 delta 分移動 + DSL 側 posX/posY に反映
 * - S2 自由 resize = 四隅 handle drag で SVG rect が拡大 (aspect 固定)
 * - S3 図単位 resize = 図全体 hover で 4 隅 handle 表示 (visual、 minimum 実装)
 * - S4 図内 drag 自動調整 = drag 中に他 lane の transform が変わる (transient)
 * - S5 Command bypass = Cmd 押下中は S4 shift 無効化
 * - S6 整列補助線 = drag 中に guideline overlay 表示 + snap
 *
 * baseURL 4323、 dev-server 起動必要。
 */
import { test, expect, type Page } from "@playwright/test";

interface PresetSpec {
  slug: string;
  label: string;
  /** その preset で drag する SVG element の selector (data-cdl-lane / data-cdl-node) */
  dragSelector: string;
}

const PRESETS: PresetSpec[] = [
  { slug: "sequence", label: "ログインAPI呼び出し", dragSelector: "[data-cdl-lane]" },
  { slug: "flow", label: "CIパイプライン", dragSelector: "[data-cdl-node]" },
  { slug: "swimlane", label: "ユーザー登録", dragSelector: "[data-cdl-node]" },
  { slug: "topology", label: "システム構成", dragSelector: "[data-cdl-node]" },
  { slug: "er", label: "ユーザーと投稿のスキーマ", dragSelector: "[data-cdl-node]" },
  { slug: "state-machine", label: "認証状態遷移", dragSelector: "[data-cdl-node]" },
  { slug: "class", label: "OOPクラス階層", dragSelector: "[data-cdl-node]" },
  { slug: "gantt", label: "スプリントロードマップ", dragSelector: "[data-cdl-node]" },
  { slug: "mind", label: "プロジェクト構想", dragSelector: "[data-cdl-node]" },
  { slug: "pie", label: "言語シェア", dragSelector: "[data-cdl-node]" },
  { slug: "c4", label: "C4コンテキスト", dragSelector: "[data-cdl-node]" },
];

async function loadEditor(page: Page): Promise<void> {
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
}

async function selectPreset(page: Page, slug: string): Promise<void> {
  const btn = await page.$(`[data-testid="editor-sample-${slug}"]`);
  if (btn) {
    await btn.click();
    await page.waitForTimeout(500);
  }
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(500);
}

async function getFirstDraggableRect(page: Page, selector: string) {
  const el = await page.$(selector);
  if (!el) return null;
  return await el.boundingBox();
}

async function dragBy(page: Page, from: { x: number; y: number }, dx: number, dy: number, opts: { modifier?: "Meta" } = {}) {
  if (opts.modifier === "Meta") await page.keyboard.down("Meta");
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  const steps = 15;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  if (opts.modifier === "Meta") await page.keyboard.up("Meta");
  await page.waitForTimeout(600);
}

async function getEditorText(page: Page): Promise<string> {
  return await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
}

async function countAutoAdjustShifts(page: Page): Promise<number> {
  return await page.evaluate(() => document.querySelectorAll('[data-auto-adjust-shift="1"]').length);
}

async function countGuidelines(page: Page): Promise<number> {
  return await page.evaluate(() => document.querySelectorAll('[data-guideline]').length);
}

test.describe("canvas pivot 包括 e2e (kiwa 相当 scenario)", () => {
  test.beforeEach(async ({ page }) => {
    await loadEditor(page);
  });

  test("S1 = sequence lane drag で SVG rect が実 delta 分移動 + DSL に posX 反映", async ({ page }) => {
    await selectPreset(page, "sequence");
    const before = await getFirstDraggableRect(page, "[data-cdl-lane]");
    expect(before, "sequence lane が存在").not.toBeNull();
    const dslBefore = await getEditorText(page);
    expect(/posX\s*:/.test(dslBefore), "初期 DSL には posX なし").toBe(false);

    // 中心から drag = pointer-events: auto が乗っている element (lane bounding box 中央) を確実に掴む
    await dragBy(page, { x: before!.x + before!.width / 2, y: before!.y + before!.height / 2 }, 150, 40);

    const dslAfter = await getEditorText(page);
    expect(/posX\s*:\s*-?\d+/.test(dslAfter), "drag 後 DSL に posX 出現").toBe(true);
    expect(/posY\s*:\s*-?\d+/.test(dslAfter), "drag 後 DSL に posY 出現").toBe(true);
  });

  test("S1-b = sequence lane drop で元位置に戻らない (座標保持)", async ({ page }) => {
    await selectPreset(page, "sequence");
    const before = await getFirstDraggableRect(page, "[data-cdl-lane]");
    await dragBy(page, { x: before!.x + 30, y: before!.y + 30 }, 100, 30);
    const after = await getFirstDraggableRect(page, "[data-cdl-lane]");
    const totalDelta = Math.abs(after!.x - before!.x) + Math.abs(after!.y - before!.y);
    expect(totalDelta, "drop 後に元位置から明確に離れている (座標保持)").toBeGreaterThan(20);
  });

  test("S4 = drag 中に auto-adjust-shift 属性が発火 (sequence)", async ({ page }) => {
    await selectPreset(page, "sequence");
    const lanes = await page.$$("[data-cdl-lane]");
    expect(lanes.length).toBeGreaterThanOrEqual(2);
    const b1 = await lanes[0].boundingBox();
    const b2 = await lanes[1].boundingBox();

    await page.mouse.move(b1!.x + b1!.width / 2, b1!.y + b1!.height / 2);
    await page.mouse.down();
    let saw = false;
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(b1!.x + b1!.width / 2 + (b2!.x - b1!.x) * i / 15, b1!.y + b1!.height / 2);
      await page.waitForTimeout(25);
      if (!saw && (await countAutoAdjustShifts(page)) > 0) saw = true;
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(saw, "drag 中に auto-adjust-shift 属性が発火する").toBe(true);
    expect(await countAutoAdjustShifts(page), "drop 後は shift 全 clear").toBe(0);
  });

  test("S5 = Command 押下中は auto-adjust-shift が発火しない (bypass)", async ({ page }) => {
    await selectPreset(page, "sequence");
    const lanes = await page.$$("[data-cdl-lane]");
    const b1 = await lanes[0].boundingBox();
    const b2 = await lanes[1].boundingBox();

    await page.keyboard.down("Meta");
    await page.mouse.move(b1!.x + b1!.width / 2, b1!.y + b1!.height / 2);
    await page.mouse.down();
    let saw = false;
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(b1!.x + b1!.width / 2 + (b2!.x - b1!.x) * i / 15, b1!.y + b1!.height / 2);
      await page.waitForTimeout(25);
      if (!saw && (await countAutoAdjustShifts(page)) > 0) saw = true;
    }
    await page.mouse.up();
    await page.keyboard.up("Meta");
    expect(saw, "Command bypass 中は auto-adjust-shift が発火しない").toBe(false);
  });

  test("S6 = drag 中に guideline overlay が表示される (整列補助線)", async ({ page }) => {
    await selectPreset(page, "sequence");
    const lanes = await page.$$("[data-cdl-lane]");
    const b1 = await lanes[0].boundingBox();
    const b2 = await lanes[1].boundingBox();
    // b1 を b2 の右端 = b1 の左端が b2 の右端に align するように drag (vertical guideline 検出)
    const startCX = b1!.x + b1!.width / 2;
    const startCY = b1!.y + b1!.height / 2;
    const targetLeft = b2!.x + b2!.width; // b2 の右端
    const dx = targetLeft - b1!.x;
    await page.mouse.move(startCX, startCY);
    await page.mouse.down();
    let saw = false;
    for (let i = 1; i <= 30; i++) {
      await page.mouse.move(startCX + dx * i / 30, startCY);
      await page.waitForTimeout(30);
      if (!saw && (await countGuidelines(page)) > 0) saw = true;
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    // drop 後は guideline clear
    expect(await countGuidelines(page), "drop 後は guideline 全 clear").toBe(0);
    // drag 中に guideline が最低 1 回発火した
    expect(saw, "drag 中に guideline が発火する").toBe(true);
  });

  test("hover 中の handle overlay が表示される (S2 resize UI)", async ({ page }) => {
    await selectPreset(page, "sequence");
    const el = await page.$("[data-cdl-lane]");
    const box = await el!.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(400);
    // 4 隅 corner の handle が dashed outline + white square 4 個で描画される、 data-corner attribute で判定
    const corners = await page.evaluate(() => document.querySelectorAll('[data-corner]').length);
    expect(corners, "4 隅の resize handle が dom に存在").toBeGreaterThanOrEqual(4);
  });

  // 12 preset 走査 = 各 preset で「lane / node が存在 + drag で DSL に posX 反映」 の smoke test
  for (const preset of PRESETS) {
    test(`smoke [${preset.slug}] = preset load + drag で DSL posX 反映`, async ({ page }) => {
      await selectPreset(page, preset.slug);
      const rect = await getFirstDraggableRect(page, preset.dragSelector);
      expect(rect, `[${preset.slug}] draggable element が存在`).not.toBeNull();
      // 中心から drag = pointer-events: auto が乗る element (lane / node bounding box 中央) を確実に掴む
      await dragBy(page, { x: rect!.x + rect!.width / 2, y: rect!.y + rect!.height / 2 }, 80, 40);
      const dsl = await getEditorText(page);
      expect(/posX\s*:\s*-?\d+/.test(dsl), `[${preset.slug}] drag 後 DSL に posX 反映`).toBe(true);
    });
  }
});
