/**
 * parts drop 位置 forensic e2e (user 目視 report + screenshot 証拠、 2026-07-19)。
 *
 * user 実 dev-server で報告された 2 bug:
 *   D1 = drop した座標と描画位置が乖離 (drop=preview 中央、 描画=user lane 上重ね)
 *   D2 = drop 後に既存 sequence 図が崩れる (auto layout 再配置で spacer / footer / step が別位置に飛ぶ)
 *
 * 既存 `canvas-pivot-ux-forensic.spec.ts` の B2 は「click 追加後、 nodes[0] (header) の rect
 * shift が 50px 以内」 だけを check し、 (a) drop 座標 vs 実描画位置の乖離、 (b) header 以外の
 * spacer / step / footer の shift、 (c) parts 内部 SVG element が drop 座標付近にあるか、
 * のいずれも検証できていなかった。 本 file は上記 3 観点を実測 assert して bug を捕捉する。
 *
 * 対象 = parts-achievement (arc-gauge 系) を preview の中央付近に drop する scenario、
 * drop 位置 = viewBox 変換で「parts が (dropX, dropY) 付近に描画される」 を assert する経路。
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/parts-drop-forensic";

async function setup(page: Page) {
  mkdirSync(OUT_DIR, { recursive: true });
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(600);
}

test.describe("parts drop 位置 forensic (D1 drop 位置乖離 + D2 図崩れ)", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("D1-forensic = drop 座標に近い位置に parts が描画される (現 impl では fail expected)", async ({ page }) => {
    // parts tab open
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(600);

    const partsBtn = page.locator('[data-part-id="parts-achievement"]');
    await expect(partsBtn).toBeVisible();

    // preview stage の drop target 位置 (中央付近を狙う)
    const preview = page.locator(".v4-editor-preview");
    const previewBox = await preview.boundingBox();
    expect(previewBox).not.toBeNull();
    // preview の中央下寄り = user lane / API lane より下の空いた空間を drop 位置に選ぶ
    const dropX = previewBox!.x + previewBox!.width * 0.6;
    const dropY = previewBox!.y + previewBox!.height * 0.75;

    // Playwright dragTo で指定 target 座標に drop (dataTransfer 経由)
    await partsBtn.dragTo(preview, {
      targetPosition: { x: previewBox!.width * 0.6, y: previewBox!.height * 0.75 },
    });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: `${OUT_DIR}/D1-after-drop.png`, fullPage: false });

    // drop した parts の SVG element を特定 (achievement 系 = arc-gauge の shape kind 由来 nodes は
    // `data-cdl-node` の id に `__` prefix、 CAR-1657 = parts merge の alias prefix 経路)
    const partsRects = await page.evaluate(() => {
      const svg = document.querySelector(".v4-editor-preview svg");
      if (!svg) return [];
      return Array.from(svg.querySelectorAll('[data-cdl-node]'))
        .filter((el) => (el.getAttribute("data-cdl-node") ?? "").includes("__"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            id: el.getAttribute("data-cdl-node"),
            cx: r.x + r.width / 2,
            cy: r.y + r.height / 2,
            w: r.width,
            h: r.height,
          };
        });
    });

    expect(partsRects.length, "parts merge で少なくとも 1 個の sub-node が生成される").toBeGreaterThan(0);

    // parts の bounding-center を全 parts の重心で近似
    const centroidX = partsRects.reduce((s, r) => s + r.cx, 0) / partsRects.length;
    const centroidY = partsRects.reduce((s, r) => s + r.cy, 0) / partsRects.length;

    // drop 座標との乖離 ... ± 150 CSS px 以内で「drop 位置に配置された」 と判定
    const dx = Math.abs(centroidX - dropX);
    const dy = Math.abs(centroidY - dropY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    expect(
      distance,
      `drop 座標 (${dropX.toFixed(0)}, ${dropY.toFixed(0)}) と parts 描画重心 (${centroidX.toFixed(0)}, ${centroidY.toFixed(0)}) の距離 (${distance.toFixed(0)}px) が 150px 以内 = drop 座標を尊重して描画される`,
    ).toBeLessThan(150);
  });

  test("D2-forensic = drop 後に既存 sequence 全 node の絶対位置が保たれる (± 30px)", async ({ page }) => {
    // drop 前に全 sequence node の rect を map で記録 (id → rect)
    const beforeMap = await page.evaluate(() => {
      const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
      document.querySelectorAll('[data-cdl-node]').forEach((el) => {
        const id = el.getAttribute("data-cdl-node") ?? "";
        // parts の merge 前だから prefix なし
        if (id.includes("__")) return;
        const r = el.getBoundingClientRect();
        out[id] = { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      return out;
    });
    expect(Object.keys(beforeMap).length, "sequence の nodes が initial に存在").toBeGreaterThan(3);

    // parts drop
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(600);
    const partsBtn = page.locator('[data-part-id="parts-achievement"]');
    const preview = page.locator(".v4-editor-preview");
    const previewBox = await preview.boundingBox();
    await partsBtn.dragTo(preview, {
      targetPosition: { x: previewBox!.width * 0.55, y: previewBox!.height * 0.7 },
    });
    await page.waitForTimeout(1500);

    // drop 後、 同 id の rect を再計測 (parts 由来の new node は skip、 既存 sequence node のみ)
    const afterMap = await page.evaluate(() => {
      const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
      document.querySelectorAll('[data-cdl-node]').forEach((el) => {
        const id = el.getAttribute("data-cdl-node") ?? "";
        if (id.includes("__")) return;
        const r = el.getBoundingClientRect();
        out[id] = { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      return out;
    });

    await page.screenshot({ path: `${OUT_DIR}/D2-after-drop.png`, fullPage: false });

    // 全 sequence 既存 node の shift を assert = ± 30 CSS px 以内
    const shifts: Array<{ id: string; dx: number; dy: number }> = [];
    for (const id of Object.keys(beforeMap)) {
      if (!(id in afterMap)) {
        // drop 後に消えた node はカウントしないが警告扱いで push
        shifts.push({ id, dx: 9999, dy: 9999 });
        continue;
      }
      const b = beforeMap[id]!;
      const a = afterMap[id]!;
      shifts.push({ id, dx: Math.abs(a.x - b.x), dy: Math.abs(a.y - b.y) });
    }

    const worst = shifts.reduce((max, s) => (s.dx + s.dy > max.dx + max.dy ? s : max), { id: "", dx: 0, dy: 0 });
    expect(
      worst.dx + worst.dy,
      `worst-case sequence node shift after drop = ${worst.id} (dx=${worst.dx.toFixed(1)} dy=${worst.dy.toFixed(1)})、 30 CSS px 以内で「drop で 図全体が崩れない」`,
    ).toBeLessThan(30);
  });

  test("D1-forensic-click = parts click 追加で DSL 上「意味ある空き位置」 に posX/posY が明示される", async ({ page }) => {
    // click 経路は drop 座標なしだが、 DSL レベルで parts.posX/posY が既存 actor と重ならない
    // 「意味ある空きエリア」 に配置される期待。 SVG render 上の lane bbox は parts merge で
    // 動的拡張されるため判定不能、 DSL の宣言座標で assert する方が安定 (root logic の verify)。
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(600);

    await page.click('[data-part-id="parts-achievement"]');
    await page.waitForTimeout(1500);

    // DSL state (CodeMirror content) を取得して parts actor の posX/posY を parse
    const dslDump = await page.evaluate(() => {
      const cm = document.querySelector('.cm-content');
      return cm?.textContent ?? "";
    });

    await page.screenshot({ path: `${OUT_DIR}/D1-click.png`, fullPage: false });

    // DSL parse = 各 actor entry (`- {name}: { posX: N, posY: N, ... }`) から座標抽出
    const actorPositions: Array<{ name: string; posX: number; posY: number; isPart: boolean }> = [];
    const actorLineRe = /-\s*([^\s:{]+)\s*:\s*\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = actorLineRe.exec(dslDump)) !== null) {
      const name = m[1]!;
      const inner = m[2]!;
      const px = inner.match(/posX\s*:\s*(-?\d+)/);
      const py = inner.match(/posY\s*:\s*(-?\d+)/);
      const kindMatch = inner.match(/kind\s*:\s*([\w-]+)/);
      const isPart = kindMatch !== null; // kind: field を持つ actor は parts (unified syntax)
      if (px && py) actorPositions.push({ name, posX: parseInt(px[1]!, 10), posY: parseInt(py[1]!, 10), isPart });
    }

    const partsActor = actorPositions.find((a) => a.isPart);
    const existingActors = actorPositions.filter((a) => !a.isPart);

    expect(partsActor, `parts actor が posX/posY 明示で DSL に追加される (現状 DSL:\n${dslDump.slice(0, 600)})`).toBeDefined();
    expect(existingActors.length, "既存 sequence actor が pinning されて posX/posY 明示").toBeGreaterThan(0);

    // 判定 = parts.posX/posY が既存 actor いずれかから 500 world 以上離れている = 「意味ある空きエリア」
    let minDistance = Infinity;
    let closestName = "";
    for (const a of existingActors) {
      const dx = partsActor!.posX - a.posX;
      const dy = partsActor!.posY - a.posY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDistance) { minDistance = d; closestName = a.name; }
    }

    expect(
      minDistance,
      `parts actor ${partsActor!.name} (posX=${partsActor!.posX}, posY=${partsActor!.posY}) と最近接 actor ${closestName} との距離 (${minDistance.toFixed(0)}) が 500 world 以上 = 「意味ある空きエリア」 に配置される。 DSL:\n${dslDump.slice(0, 600)}`,
    ).toBeGreaterThan(500);
  });
});
