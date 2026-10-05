/**
 * カタログの色味の切替の検証 (#1569)。
 *
 * 意匠は全ての図へ当てて見比べる。切替の札と、押した名前 / 地が舞台へ届く所までを押さえる。
 *
 * ## 押した後の markup を見る
 *
 * 押しものの状態 (`aria-checked`) だけを見ると、掛け忘れても通る。
 * 図の `data-cdl-palette` が実際に変わることを見る。
 *
 */
import { test, expect, type Page } from "@playwright/test";
import { 配色の札, 配色の選択肢, 画面の色の札 } from "../src/lib/palette-switch";
import { 一覧の行 } from "./catalog-item-pick";
import { colorKey, openEditorTheme } from "./helpers/fixed-theme-checks";
import { LABEL_TONE_SOURCE } from "./helpers/label-tone-checks";
import { readThemeNotes } from "./helpers/theme-notes";

/** 見本を id で名指しして開く */
async function 開く(page: Page, slug: string, id: string): Promise<void> {
  await page.goto(`catalog/${slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await 一覧の行(page, id).click();
  await page.waitForSelector(`[data-cdl-diagram="${id}"]`, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}

/** いま出ている図の配色の名前 */
async function 配色(page: Page, id: string): Promise<string | null> {
  return await page.evaluate((diagramId) => {
    const 舞台 = document.querySelector(`[data-cdl-diagram="${diagramId}"] svg[data-cdl-stage]`);
    return 舞台?.getAttribute("data-cdl-palette") ?? null;
  }, id);
}

const 切替 = (page: Page) => page.locator('[role="radiogroup"][aria-label="図の色味"]');

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

test("switch: 意匠の札が全て並び、配色を持つ図で切り替えられる (#1569 / #2790)", async ({
  page,
}) => {
  await 開く(page, "presets", "er-demo");

  await expect(切替(page), "配色を持つ図に切替が出ていない").toBeVisible();
  const expected = 配色の選択肢.map((theme) => 配色の札(theme, "ja"));
  expect(expected).toEqual(["生成りに茶", "青磁に墨", "図面", "活版", "図録", "端末", "手描き", "電飾", "浮彫"]);
  for (const label of expected)
    await expect(切替(page).getByRole("radio", { name: label })).toHaveCount(1);
  expect(await 配色(page, "er-demo"), "既定が生成りに茶でない").toBe("kinari");

  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect.poll(async () => await 配色(page, "er-demo"), { timeout: 5000 }).toBe("celadon");

  await 切替(page).getByRole("radio", { name: "生成りに茶" }).click();
  await expect.poll(async () => await 配色(page, "er-demo"), { timeout: 5000 }).toBe("kinari");
});

test('switch: 意匠の札を全て並べても「図 / コード」 のタブは 1 行のまま (#2794)', async ({
  page,
}) => {
  await 開く(page, "presets", "er-demo");
  await expect(切替(page), "配色を持つ図に切替が出ていない").toBeVisible();

  const tabs = page.locator('.catalog-preview-tabs [role="tab"]:visible');
  expect(await tabs.count(), "見えている図 / コードのタブが 2 つ未満").toBeGreaterThanOrEqual(2);
  const 測った = await tabs.evaluateAll((elements) =>
    elements.map((element) => {
      const textNode = [...element.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (!textNode) throw new Error("タブの字を測れない (検査が空振りしている)");
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const 行数 = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
      return {
        名前: textNode.textContent?.trim() ?? "",
        行数,
        高さ: element.getBoundingClientRect().height,
      };
    }),
  );
  console.log(
    `図 / コードのタブ: ${測った
      .map(({ 名前, 行数, 高さ }) => `${名前}=${行数} 行・${高さ}px`)
      .join(", ")}`,
  );
  for (const tab of 測った) expect(tab.行数, `${tab.名前} の字が折れている`).toBe(1);
  const 高さ = 測った.map((tab) => tab.高さ);
  expect(Math.max(...高さ) - Math.min(...高さ), "図 / コードのタブの高さが揃っていない").toBeLessThanOrEqual(
    1,
  );
});

test("switch: 狭い幅でも意匠の札の字は 1 行のまま、札は画面の中に収まる (#2796)", async ({
  page,
}) => {
  for (const width of [1440, 1366, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("catalog/presets");
    await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
    await 一覧の行(page, "er-demo").click();
    await page.locator(".catalog-preview-stage").scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-cdl-diagram="er-demo"]', { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await expect(切替(page), `${width}px で図の色味の切替が出ていない`).toBeVisible();

    const 札 = 切替(page).getByRole("radio");
    expect(await 札.count(), `${width}px で意匠の札が欠けている`).toBeGreaterThanOrEqual(9);
    const 測った = await 札.evaluateAll((elements) => {
      const chips = elements.map((element) => {
        const textNode = [...element.childNodes].find(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (!textNode) throw new Error("意匠の札の字を測れない (検査が空振りしている)");
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const rect = element.getBoundingClientRect();
        return {
          名前: textNode.textContent?.trim() ?? "",
          行数: new Set([...range.getClientRects()].map((line) => Math.round(line.top))).size,
          上端: Math.round(rect.top),
          左端: rect.left,
          右端: rect.right,
        };
      });
      return {
        chips,
        rows: new Set(chips.map((chip) => chip.上端)).size,
        outside: chips.filter((chip) => chip.左端 < 0 || chip.右端 > window.innerWidth).length,
        viewportWidth: window.innerWidth,
      };
    });

    console.log(
      `chip lines width=${width}: rows=${測った.rows} maxLines=${Math.max(...測った.chips.map((chip) => chip.行数))} outside=${測った.outside}`,
    );
    for (const chip of 測った.chips) {
      expect(chip.行数, `${width}px で ${chip.名前} の字が折れている`).toBe(1);
      expect(chip.左端, `${width}px で ${chip.名前} が画面の左へ出ている`).toBeGreaterThanOrEqual(0);
      expect(chip.右端, `${width}px で ${chip.名前} が画面の右へ出ている`).toBeLessThanOrEqual(
        測った.viewportWidth,
      );
    }
  }
});

test("switch: クラス図でも切り替えられる (#1569)", async ({ page }) => {
  // ER 図だけを見ると、配色を持つ図が 1 種類しか無い形でも通る
  await 開く(page, "presets", "class-demo");
  await expect(切替(page), "クラス図に切替が出ていない").toBeVisible();

  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect.poll(async () => await 配色(page, "class-demo"), { timeout: 5000 }).toBe("celadon");
});

test("switch: 配色を持たない図にも切替が出て、図面を当てられる (#2790)", async ({ page }) => {
  await 開く(page, "presets", "infra-demo");
  expect(await 配色(page, "infra-demo"), "この図が配色を持ってしまっている").toBeNull();
  await expect(切替(page), "配色を持たない図に切替が出ていない").toBeVisible();
  await expect(切替(page).getByRole("radio", { name: 画面の色の札("ja") })).toBeChecked();

  await 切替(page)
    .getByRole("radio", { name: 配色の札("blueprint", "ja") })
    .click();
  await expect
    .poll(async () => await 配色(page, "infra-demo"), { timeout: 5000 })
    .toBe("blueprint");
  const blueprint = readThemeNotes().get("blueprint");
  if (blueprint?.mode !== "fixed") throw new Error("図面の意匠帳が固定の表ではない");
  const ground = await page.evaluate(() => {
    const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
    return stage ? getComputedStyle(stage).backgroundColor : null;
  });
  expect(ground).toBe(hexToRgb(blueprint.value.ground));
});

test("letterpress switch: 配色のない図と表の図へ活版の名前と地が届く", async ({ page }) => {
  const letterpress = readThemeNotes().get("letterpress");
  if (letterpress?.mode !== "fixed") throw new Error("活版の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    await 切替(page)
      .getByRole("radio", { name: 配色の札("letterpress", "ja") })
      .click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("letterpress");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="letterpress"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(letterpress.value.ground));
  }
});

test("catalog switch: 配色のない図と表の図へ図録の名前と地が届く", async ({ page }) => {
  const catalog = readThemeNotes().get("catalog");
  if (catalog?.mode !== "fixed") throw new Error("図録の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    await 切替(page)
      .getByRole("radio", { name: 配色の札("catalog", "ja") })
      .click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("catalog");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="catalog"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(catalog.value.ground));
  }
});

test("terminal switch: 配色のない図と表の図へ端末の名前と地が届く", async ({ page }) => {
  const terminal = readThemeNotes().get("terminal");
  if (terminal?.mode !== "fixed") throw new Error("端末の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    await 切替(page)
      .getByRole("radio", { name: 配色の札("terminal", "ja") })
      .click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("terminal");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="terminal"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(terminal.value.ground));
  }
});

test("sketch switch: 配色のない図と表の図へ手描きの名前と地が届く", async ({ page }) => {
  const sketch = readThemeNotes().get("sketch");
  if (sketch?.mode !== "fixed") throw new Error("手描きの意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    const option = 切替(page).getByRole("radio", { name: 配色の札("sketch", "ja") });
    const count = await option.count();
    console.log(`sketch switch ${id}: options=${count}`);
    expect(count, `${id} の手描きの選択肢`).toBe(1);
    await option.click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("sketch");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="sketch"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(sketch.value.ground));
  }
});

test("neon switch: 配色のない図と表の図へ電飾の名前と地が届く", async ({ page }) => {
  const neon = readThemeNotes().get("neon");
  if (neon?.mode !== "fixed") throw new Error("電飾の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    const option = 切替(page).getByRole("radio", { name: 配色の札("neon", "ja") });
    const count = await option.count();
    console.log(`neon switch ${id}: options=${count}`);
    expect(count, `${id} の電飾の選択肢`).toBe(1);
    await option.click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("neon");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="neon"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(neon.value.ground));
  }
});

test("relief switch: 配色のない図と表の図へ浮彫の名前と地が届く", async ({ page }) => {
  const relief = readThemeNotes().get("relief");
  if (relief?.mode !== "fixed") throw new Error("浮彫の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    const option = 切替(page).getByRole("radio", { name: 配色の札("relief", "ja") });
    const count = await option.count();
    console.log(`relief switch ${id}: options=${count}`);
    expect(count, `${id} の浮彫の選択肢`).toBe(1);
    await option.click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("relief");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="relief"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(relief.value.ground));
  }
});

test("switch: 項目を選び直すと既定へ戻る (#1569)", async ({ page }) => {
  // 残すと、次の図が別の色みで出る理由を見失う (速さ / 描き方 と同じ扱い)
  await 開く(page, "presets", "er-demo");
  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect.poll(async () => await 配色(page, "er-demo"), { timeout: 5000 }).toBe("celadon");

  await 一覧の行(page, "class-demo").click();
  await page.waitForSelector('[data-cdl-diagram="class-demo"]', { timeout: 15000 });
  await expect.poll(async () => await 配色(page, "class-demo"), { timeout: 5000 }).toBe("kinari");
});

test("switch: 生成りと青磁では札へ線の色みが漏れない", async ({ page }, testInfo) => {
  for (const theme of ["kinari", "celadon"] as const) {
    const note = readThemeNotes().get(theme);
    if (note?.mode !== "light-dark") throw new Error(`${theme} の意匠帳が明暗の表ではない`);
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";
      const values = dark ? note.dark : note.light;
      await openEditorTheme(page, LABEL_TONE_SOURCE, theme, dark);
      const actual = await page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`).evaluate(
        (stage) => {
          const labels = [...stage.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge-label-for]")]
            .flatMap((group) => {
              const background = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label-bg"]');
              const label = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label"]');
              if (!background || !label) return [];
              return [{
                tone: group.getAttribute("data-cdl-tone"),
                fill: getComputedStyle(background).fill,
                stroke: getComputedStyle(background).stroke,
                ink: getComputedStyle(label).fill,
              }];
            });
          const lines = [...stage.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge]")]
            .flatMap((edge) => {
              const line = edge.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-line"]');
              return line ? [{
                tone: edge.getAttribute("data-cdl-tone"),
                role: edge.getAttribute("data-cdl-edge-role"),
                stroke: getComputedStyle(line).stroke,
              }] : [];
            });
          const boxes = [...stage.querySelectorAll<SVGGraphicsElement>('rect[data-cdl-role="node-body"]')]
            .map((box) => ({
              active: box.closest("[data-cdl-active]")?.getAttribute("data-cdl-active") === "true",
              fill: getComputedStyle(box).fill,
              stroke: getComputedStyle(box).stroke,
            }));
          const resolveStageColor = (property: "--d-err" | "--d-warn"): string => {
            const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            probe.style.fill = `var(${property})`;
            stage.append(probe);
            const color = getComputedStyle(probe).fill;
            probe.remove();
            return color;
          };
          return {
            labels,
            lines,
            boxes,
            semantic: {
              error: resolveStageColor("--d-err"),
              warning: resolveStageColor("--d-warn"),
            },
          };
        },
      );
      expect(actual.labels).toHaveLength(4);
      expect(new Set(actual.labels.map((label) => colorKey(label.fill)))).toEqual(
        new Set([colorKey(values.stripe)]),
      );
      expect(new Set(actual.labels.map((label) => colorKey(label.stroke)))).toEqual(
        new Set([colorKey(values.line)]),
      );
      expect(new Set(actual.labels.map((label) => colorKey(label.ink)))).toEqual(
        new Set([colorKey(values.line)]),
      );
      const expectedLines = new Map([
        ["accent", values.line],
        ["info", values.line],
        ["success", values.link],
        ["teal", values.own],
        ["error", actual.semantic.error],
        ["warning", actual.semantic.warning],
      ]);
      for (const line of actual.lines) {
        const expected = line.role === "main" ? values.line : expectedLines.get(line.tone ?? "");
        if (!expected) throw new Error(`${theme}/${mode} の線の色み ${line.tone} を読めない`);
        expect(colorKey(line.stroke), `${theme}/${mode}/${line.tone} の線`).toBe(colorKey(expected));
      }
      expect(actual.boxes.length, `${theme}/${mode} の箱`).toBeGreaterThan(0);
      expect(new Set(actual.boxes.map((box) => colorKey(box.fill)))).toEqual(
        new Set([colorKey(values.face)]),
      );
      expect(actual.boxes.some((box) => box.active), `${theme}/${mode} の強調した箱`).toBe(true);
      expect(actual.boxes.some((box) => !box.active), `${theme}/${mode} の強調していない箱`).toBe(true);
      for (const box of actual.boxes) {
        expect(colorKey(box.stroke), `${theme}/${mode} の${box.active ? "強調した" : "通常の"}箱`).toBe(
          colorKey(box.active ? values.line : values.frame),
        );
      }
      const report = `${theme} ${mode} labels leak-free: fill=${actual.labels[0]?.fill} ` +
        `stroke=${actual.labels[0]?.stroke} ink=${actual.labels[0]?.ink}`;
      console.log(report);
      testInfo.annotations.push({ type: `${theme} ${mode} labels`, description: report });
    }
  }
});
