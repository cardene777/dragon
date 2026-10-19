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
import { 配色の札, 配色の選択肢 } from "../src/lib/palette-switch";
import { 一覧の行 } from "./catalog-item-pick";
import { openEditorTheme } from "./helpers/fixed-theme-checks";
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

const 色味 = (page: Page) => page.getByRole("combobox", { name: "図の色味" });

/** 図を組み立てた外側の器が持つ viewBox を読む。 SVG の属性と同じ配置結果を載せる。 */
async function 描いた大きさ(page: Page, id: string): Promise<string | null> {
  return await page.locator(`[data-cdl-diagram="${id}"]`).getAttribute("data-cdl-viewbox");
}

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

test("switch: 意匠の札が全て並び、配色を持つ図で切り替えられる (#1569 / #2790)", async ({
  page,
}) => {
  await 開く(page, "presets", "delivery-relations-demo");

  await expect(色味(page), "配色を持つ図に選ぶ欄が出ていない").toBeVisible();
  const expected = 配色の選択肢.map((theme) => 配色の札(theme, "ja"));
  // 色だけを変える生成りに茶と青磁に墨は外した (#2960)。札は地まで含めて描く 7 意匠だけ
  expect(expected).toEqual(["図面", "活版", "図録", "端末", "手描き", "電飾", "浮彫"]);
  for (const label of expected)
    await expect(色味(page).getByRole("option", { name: label, exact: true })).toHaveCount(1);
  for (const label of ["生成りに茶", "青磁に墨"])
    await expect(色味(page).getByRole("option", { name: label, exact: true }), `${label} の札が残っている`).toHaveCount(0);
  // 見本は意匠を書かず、画面の意匠で開く (#2960)。 `?theme=` を付けない画面の意匠は活版 (#2962)
  expect(await 配色(page, "delivery-relations-demo"), "意匠を書かない見本が画面の意匠で描かれていない").toBe("letterpress");

  await 色味(page).selectOption({ label: "図面" });
  await expect.poll(async () => await 配色(page, "delivery-relations-demo"), { timeout: 5000 }).toBe("blueprint");

  await 色味(page).selectOption({ label: "活版" });
  await expect.poll(async () => await 配色(page, "delivery-relations-demo"), { timeout: 5000 }).toBe("letterpress");
});

test('switch: 意匠の札を全て並べても「図 / コード」 のタブは 1 行のまま (#2794)', async ({
  page,
}) => {
  await 開く(page, "presets", "delivery-relations-demo");
  await expect(色味(page), "配色を持つ図に選ぶ欄が出ていない").toBeVisible();

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

test("switch: 狭い幅でも色味の選ぶ欄は画面の中に収まる (#2867)", async ({
  page,
}) => {
  for (const width of [1440, 1366, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("catalog/presets");
    await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
    await 一覧の行(page, "delivery-relations-demo").click();
    await page.locator(".catalog-preview-stage").scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-cdl-diagram="delivery-relations-demo"]', { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await expect(色味(page), `${width}px で図の色味の選ぶ欄が出ていない`).toBeVisible();

    const 測った = await 色味(page).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        whiteSpace: getComputedStyle(element).whiteSpace,
        left: rect.left,
        right: rect.right,
        viewportWidth: window.innerWidth,
      };
    });
    console.log(
      `palette select width=${width}: left=${測った.left} right=${測った.right} viewport=${測った.viewportWidth}`,
    );
    expect(測った.whiteSpace, `${width}px で色味の字を折る指定になっている`).toBe("nowrap");
    expect(測った.left, `${width}px で色味の欄が画面の左へ出ている`).toBeGreaterThanOrEqual(0);
    expect(測った.right, `${width}px で色味の欄が画面の右へ出ている`).toBeLessThanOrEqual(
      測った.viewportWidth,
    );
  }
});

test("switch: クラス図でも切り替えられる (#1569)", async ({ page }) => {
  // ER 図だけを見ると、配色を持つ図が 1 種類しか無い形でも通る
  await 開く(page, "presets", "delivery-classes-demo");
  await expect(色味(page), "クラス図に選ぶ欄が出ていない").toBeVisible();

  await 色味(page).selectOption({ label: "図面" });
  await expect.poll(async () => await 配色(page, "delivery-classes-demo"), { timeout: 5000 }).toBe("blueprint");
});

test("terminal switch: 見本帳は端末と活版で同じ字幅の骨組みを使う (#2908)", async ({
  page,
}) => {
  await 開く(page, "presets", "infra-demo");

  await 色味(page).selectOption({ label: 配色の札("letterpress", "ja") });
  await expect.poll(async () => await 配色(page, "infra-demo"), { timeout: 5000 }).toBe("letterpress");
  const 活版 = await 描いた大きさ(page, "infra-demo");
  expect(活版, "活版の data-cdl-viewbox が無く、骨組みの検査が空振りしている").not.toBeNull();
  if (活版 === null) throw new Error("活版の data-cdl-viewbox を文字列として確かめられない");
  expect(活版, "活版の data-cdl-viewbox が 4 つの数でない").toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);

  await 色味(page).selectOption({ label: 配色の札("terminal", "ja") });
  await expect.poll(async () => await 配色(page, "infra-demo"), { timeout: 5000 }).toBe("terminal");
  await expect.poll(async () => await 描いた大きさ(page, "infra-demo"), { timeout: 5000 }).toBe(活版);
  const 端末 = await 描いた大きさ(page, "infra-demo");

  await 色味(page).selectOption({ label: 配色の札("letterpress", "ja") });
  await expect.poll(async () => await 描いた大きさ(page, "infra-demo"), { timeout: 5000 }).toBe(活版);
  const 戻した後 = await 描いた大きさ(page, "infra-demo");
  console.log(`活版=${活版} 端末=${端末} 戻した後=${戻した後}`);
});

test("terminal: どの色味も英数字 24 字の名前を比例と等幅の広い方で測り、同じ箱幅で端末の字を収める (#2818 / #2918)", async ({
  page,
}) => {
  // i / l / t / f / j は比例の見積りが等幅の 1 字 0.63em より狭い。どの色味も比例と等幅の
  // 広い方で測るため、箱幅は同じになり、端末の等幅書体も収まる。題ではなく行の左列で箱幅が
  // 決まる service の箱にする。行を描かない actor / card では、箱に収める等幅の字が無い。
  const 細い名前 = "filllistlimitfilttiltjit";
  expect(細い名前).toMatch(/^[A-Za-z0-9]{24}$/);
  const 本文 = `title: "等幅で測る箱"
type: flow

actors:
  - ${細い名前}: { kind: service, rows: ["${細い名前}: 1"] }
  - Receiver

flow:
  - ${細い名前} -> Receiver: "送る"
`;

  await openEditorTheme(page, 本文, "letterpress");
  const 活版の面 = page.locator(`[data-cdl-node="${細い名前}"] [data-cdl-role="node-body"]`);
  await expect(活版の面, "活版で細い名前の箱面を読めない").toHaveCount(1);
  const 活版の箱幅 = await 活版の面.evaluate((面) => 面.getBoundingClientRect().width);

  await openEditorTheme(page, 本文, "terminal");
  const 端末の面 = page.locator(`[data-cdl-node="${細い名前}"] [data-cdl-role="node-body"]`);
  await expect(端末の面, "端末で細い名前の箱面を読めない").toHaveCount(1);
  const 端末の箱幅 = await 端末の面.evaluate((面) => 面.getBoundingClientRect().width);
  const 箱幅の差 = Math.abs(端末の箱幅 - 活版の箱幅);
  expect(箱幅の差).toBeLessThanOrEqual(0.5);

  const 字と箱 = await page.locator(`[data-cdl-node="${細い名前}"]`).evaluate((node) => {
    const 面 = node.querySelector<SVGGraphicsElement>('[data-cdl-role="node-body"]');
    if (!面) throw new Error("箱面が無く、字の内側を確かめられない");
    const 面の矩形 = 面.getBoundingClientRect();
    const 行の字 = [
      ...node.querySelectorAll<SVGTextElement>('text[data-cdl-role^="node-row"], [data-cdl-role^="node-row"] text'),
    ].map((element) => element.textContent ?? "");
    // 図の題は `[data-cdl-node]` の外なので入らない (#2749)。箱の題と行の字はどちらも箱面に収める。
    const 字 = [...node.querySelectorAll<SVGGraphicsElement>("text")]
      .filter((element) => (element.textContent ?? "").trim() !== "")
      .map((element) => ({ 内容: element.textContent ?? "", 矩形: element.getBoundingClientRect() }));
    return { 面の矩形, 行の字, 字 };
  });
  expect(字と箱.行の字, "行の字が描かれず、箱に収める検査が空振りしている").toContain(細い名前);
  expect(字と箱.字.length, "題と行の字を 1 つも読めず検査が空振りしている").toBeGreaterThan(0);
  const 許容 = 0.5;
  for (const { 内容, 矩形 } of 字と箱.字) {
    expect(矩形.left, `${内容} の左端が箱面から出ている`).toBeGreaterThanOrEqual(字と箱.面の矩形.left - 許容);
    expect(矩形.right, `${内容} の右端が箱面から出ている`).toBeLessThanOrEqual(字と箱.面の矩形.right + 許容);
    expect(矩形.top, `${内容} の上端が箱面から出ている`).toBeGreaterThanOrEqual(字と箱.面の矩形.top - 許容);
    expect(矩形.bottom, `${内容} の下端が箱面から出ている`).toBeLessThanOrEqual(字と箱.面の矩形.bottom + 許容);
  }
  const 字の右端 = Math.max(...字と箱.字.map(({ 矩形 }) => 矩形.right));
  console.log(
    `比例と等幅の広い方で測った活版の箱幅=${活版の箱幅} 端末の箱幅=${端末の箱幅} 幅差=${箱幅の差} ` +
      `端末の字の右端=${字の右端} 箱の右端=${字と箱.面の矩形.right}`,
  );
});

test("switch: 配色を書いていない図は画面の意匠で描き、図面を当てられる (#2790 / #2962)", async ({ page }) => {
  await 開く(page, "presets", "infra-demo");
  expect(await 配色(page, "infra-demo"), "配色を書いていない図が既定の画面の意匠で描かれていない").toBe("letterpress");
  await expect(色味(page), "配色を書いていない図に選ぶ欄が出ていない").toBeVisible();
  await expect(色味(page)).toHaveValue("letterpress");

  await 色味(page).selectOption({ label: 配色の札("blueprint", "ja") });
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

  for (const id of ["infra-demo", "delivery-relations-demo"]) {
    await 開く(page, "presets", id);
    await 色味(page).selectOption({ label: 配色の札("letterpress", "ja") });
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

  for (const id of ["infra-demo", "delivery-relations-demo"]) {
    await 開く(page, "presets", id);
    await 色味(page).selectOption({ label: 配色の札("catalog", "ja") });
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

  for (const id of ["infra-demo", "delivery-relations-demo"]) {
    await 開く(page, "presets", id);
    await 色味(page).selectOption({ label: 配色の札("terminal", "ja") });
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

  for (const id of ["infra-demo", "delivery-relations-demo"]) {
    await 開く(page, "presets", id);
    const option = 色味(page).getByRole("option", { name: 配色の札("sketch", "ja") });
    const count = await option.count();
    console.log(`sketch switch ${id}: options=${count}`);
    expect(count, `${id} の手描きの選択肢`).toBe(1);
    await 色味(page).selectOption({ label: 配色の札("sketch", "ja") });
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

  for (const id of ["infra-demo", "delivery-relations-demo"]) {
    await 開く(page, "presets", id);
    const option = 色味(page).getByRole("option", { name: 配色の札("neon", "ja") });
    const count = await option.count();
    console.log(`neon switch ${id}: options=${count}`);
    expect(count, `${id} の電飾の選択肢`).toBe(1);
    await 色味(page).selectOption({ label: 配色の札("neon", "ja") });
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

  for (const id of ["infra-demo", "delivery-relations-demo"]) {
    await 開く(page, "presets", id);
    const option = 色味(page).getByRole("option", { name: 配色の札("relief", "ja") });
    const count = await option.count();
    console.log(`relief switch ${id}: options=${count}`);
    expect(count, `${id} の浮彫の選択肢`).toBe(1);
    await 色味(page).selectOption({ label: 配色の札("relief", "ja") });
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
  await 開く(page, "presets", "delivery-relations-demo");
  await 色味(page).selectOption({ label: "図面" });
  await expect.poll(async () => await 配色(page, "delivery-relations-demo"), { timeout: 5000 }).toBe("blueprint");

  await 一覧の行(page, "delivery-classes-demo").click();
  await page.waitForSelector('[data-cdl-diagram="delivery-classes-demo"]', { timeout: 15000 });
  // 見本は意匠を書かないので、選び直した図は画面の意匠 (`?theme=` 無しは活版) で開く (#2960 / #2962)
  await expect.poll(async () => await 配色(page, "delivery-classes-demo"), { timeout: 5000 }).toBe("letterpress");
});
