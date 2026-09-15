/**
 * 部品を箱に使う見本が、カタログの画面と編集画面で同じ絵になることの確認 (#1973)。
 *
 * `state-indicator` は円の外枠と、状態 `lvl` の割合で半径が決まる塗りの円を描く。 画面の円の
 * 半径と塗りの色で、状態の上書き・倍率・色番号が効いたかを見る。
 *
 * **編集画面でも同じ円を描くかを見る**。 見本の頁は部品ごと組み立てた図を出すが、編集画面の
 * 本文欄は部品を本文から抜いて図の上に重ねる。 2 つの形を見る。
 *
 * | 形 | 壊れていた時の絵 |
 * |---|---|
 * | 部品だけの本文 (見本の頁から開く形) | 抜いた後の図が空で組み立てに落ち、「読み込み中」 のまま |
 * | 箱と並べた部品 | 重ねた部品が既定の値 (塗り 0 と緑) のまま |
 */
import { test, expect, type Page } from "@playwright/test";

const 見本 = "部品を箱に置き何も書き換えない";

async function 開く(page: Page): Promise<void> {
  await page.goto("catalog/parts", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar .catalog-list-item", { hasText: 見本 }).first().click();
  await page.waitForTimeout(800);
  await expect(page.locator("main.catalog-preview svg[data-cdl-stage]").first()).toBeVisible();
}

async function 押す(page: Page, 名: string): Promise<void> {
  await page
    .getByRole("radiogroup", { name: "パターン" })
    .getByRole("radio", { name: 名, exact: true })
    .click();
  await page.waitForTimeout(800);
}

/** 図の中の円を、外枠 (塗り無し) と塗りに分けて返す */
async function 円(
  page: Page,
  図: string,
): Promise<{ 外枠: number[]; 塗り: { r: number; fill: string }[] }> {
  return page
    .locator(図)
    .first()
    .evaluate((svg) => {
      const 円たち = [...svg.querySelectorAll("circle")].map((c) => ({
        r: Number(c.getAttribute("r")),
        fill: c.getAttribute("fill") ?? "",
      }));
      return {
        外枠: 円たち.filter((c) => c.fill === "none").map((c) => c.r),
        塗り: 円たち.filter((c) => c.fill.startsWith("#")),
      };
    });
}

const カタログの図 = "main.catalog-preview svg[data-cdl-stage]";

test.describe("部品を箱に使う見本 (#1973)", () => {
  test("部品の頁に並び、切替が 9 つ出る", async ({ page }) => {
    await 開く(page);
    await expect(page.getByRole("radiogroup", { name: "パターン" }).getByRole("radio")).toHaveCount(
      9,
    );
  });

  test("並べる切替は、部品の名前の名札を部品ごとに 1 つ、その部品のすぐ上に描く (#1990)", async ({
    page,
  }) => {
    await 開く(page);
    await 押す(page, "並べる");
    const 図 = page.locator(カタログの図).first();
    // 名札の字と部品の要素の範囲を、画面の座標で比べる。 図は画面の幅に合わせて縮むので、
    // 名札の下端と部品の上端の間は倍率を掛けた値になる。 上にあることと、その間が部品の高さより
    // 小さいことを見る
    const 測った = await 図.evaluate((svg) => {
      const 名札 = [...svg.querySelectorAll('[data-cdl-role="lane-label"]')].map((t) => {
        const r = t.getBoundingClientRect();
        return { 字: t.textContent ?? "", 左: r.left, 下: r.bottom };
      });
      const 部品 = (名前: string) => {
        const 箱 = [...svg.querySelectorAll(`[data-cdl-node^="${名前}__"]`)].map((g) =>
          g.getBoundingClientRect(),
        );
        if (箱.length === 0) return undefined;
        return {
          左: Math.min(...箱.map((r) => r.left)),
          右: Math.max(...箱.map((r) => r.right)),
          上: Math.min(...箱.map((r) => r.top)),
          下: Math.max(...箱.map((r) => r.bottom)),
        };
      };
      return 名札.map((n) => ({ ...n, 部品: 部品(n.字) }));
    });
    expect(測った.map((n) => n.字).sort()).toEqual(
      ["乾燥炉", "乾燥炉の温度", "塗装機", "成形機", "工場の回線"].sort(),
    );
    for (const n of 測った) {
      expect(n.部品, `${n.字} の部品の要素が画面に無い (検査が空振りしている)`).toBeDefined();
      const 部品 = n.部品!;
      expect(n.下, `${n.字} の名札が部品より下にある`).toBeLessThanOrEqual(部品.上);
      expect(部品.上 - n.下, `${n.字} の名札が部品から離れている`).toBeLessThan(
        (部品.下 - 部品.上) / 2,
      );
      expect(n.左, `${n.字} の名札が部品の左端より左に出ている`).toBeGreaterThanOrEqual(
        部品.左 - 2,
      );
      expect(n.左, `${n.字} の名札が部品の横の範囲に無い`).toBeLessThan(部品.右);
    }
  });

  test("流れの途中に置く切替は、前後の箱を繋ぐ矢印と部品の円を描く (#1987)", async ({ page }) => {
    await 開く(page);
    await 押す(page, "流れの途中に置く");
    const 図 = page.locator(カタログの図).first();
    // 部品を並びに入れると前後の矢印が外れ、矢印が 0 本になっていた
    await expect(図.locator("[data-cdl-edge]")).toHaveCount(1);
    await expect(図.locator('[data-cdl-edge-label-for$="注文を受ける-出荷する"]')).toHaveCount(1);
    expect((await 円(page, カタログの図)).外枠).toEqual([140]);
  });

  test("縦列に置く切替は、部品の円を出荷の縦列の中に描く (#1980)", async ({ page }) => {
    await 開く(page);
    await 押す(page, "縦列に置く");
    const 図 = page.locator(カタログの図).first();
    // 画面に出た縦列の枠と部品の円の横の範囲を、画面の座標で比べる。 箱は移動の変換を持つので、
    // 要素ごとの座標 (`getBBox`) では同じ物差しにならない
    const 測った = await 図.evaluate((svg) => {
      const 縦列 = [...svg.querySelectorAll("g[data-cdl-lane]")].map((g) => {
        const r = g.querySelector("rect")!.getBoundingClientRect();
        return { id: g.getAttribute("data-cdl-lane") ?? "", x0: r.left, x1: r.right };
      });
      const 円 = [...svg.querySelectorAll("circle")].find((c) => c.getAttribute("fill") === "none");
      const r = 円?.getBoundingClientRect();
      return { 縦列, 円: r ? { x0: r.left, x1: r.right } : undefined };
    });
    expect(測った.円, "部品の円を描いていない (検査が空振りしている)").toBeDefined();
    const 出荷 = 測った.縦列.find((l) => l.id === "出荷");
    expect(
      出荷,
      `出荷の縦列が画面に無い (${測った.縦列.map((l) => l.id).join(" / ")})`,
    ).toBeDefined();
    expect(測った.円!.x0).toBeGreaterThanOrEqual(出荷!.x0 - 0.5);
    expect(測った.円!.x1).toBeLessThanOrEqual(出荷!.x1 + 0.5);
  });

  test("編集画面で縦列を書いた部品は、重ねずに図の縦列の中に描く (#1980)", async ({ page }) => {
    const 本文 = [
      'title: "縦列に置く"',
      "type: swimlane",
      "",
      "lanes:",
      '  受付: { label: "受付" }',
      '  出荷: { label: "出荷" }',
      "",
      "actors:",
      "  - 注文を受ける: { kind: card, lane: 受付 }",
      "  - 梱包する: { kind: card, lane: 出荷 }",
      "  - 印: { kind: state-indicator, lane: 出荷 }",
      "",
    ].join("\n");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`editor#s=${Buffer.from(本文, "utf8").toString("base64")}`);
    await page.waitForLoadState("networkidle");
    const 図 = page.locator(".v4-editor-stage svg[data-cdl-stage]").first();
    await expect(図).toContainText("梱包する", { timeout: 15000 });
    // 重ねる側に回すと縦列の位置を知らずに描く。 組み立て側の図の中に部品の円がある
    await expect(page.locator('.v4-editor-stage [data-overlay-part="印"]')).toHaveCount(0);
    await expect
      .poll(
        async () =>
          図.evaluate((svg) => {
            const 出荷 = svg.querySelector('g[data-cdl-lane="出荷"] rect')?.getBoundingClientRect();
            const 円 = [...svg.querySelectorAll("circle")]
              .find((c) => c.getAttribute("fill") === "none")
              ?.getBoundingClientRect();
            if (!出荷 || !円) return "縦列か円が無い";
            return 円.left >= 出荷.left - 0.5 && 円.right <= 出荷.right + 0.5 ? "中" : "外";
          }),
        { timeout: 10000 },
      )
      .toBe("中");
  });

  test("矢印を引く 2 つの切替は、部品の要素へ繋いだ矢印を描く (#1979)", async ({ page }) => {
    await 開く(page);
    // 繋ぎ先の id は組み立てが `{部品の名前}__{要素の id}` で作る。 見本に書いた名前と要素の id で引く
    for (const [名, 部品, 要素] of [
      ["矢印を繋ぐ", "設備の稼働", ["ind"]],
      ["繋ぐ要素を名指しする", "在庫の内訳", ["topL", "botL"]],
    ] as const) {
      await 押す(page, 名);
      const 図 = page.locator(カタログの図).first();
      // 矢印の線が 2 本とも出て、部品の要素の箱も画面にある
      await expect(図.locator("[data-cdl-edge]"), `${名} の矢印の線`).toHaveCount(2);
      for (const id of 要素) {
        await expect(
          図.locator(`[data-cdl-node="${部品}__${id}"]`),
          `${名} の繋ぎ先 ${id}`,
        ).toHaveCount(1);
      }
    }
  });

  test("編集画面で部品へ矢印を引いた本文は、重ねずに矢印を部品に繋いで描く (#1979)", async ({
    page,
  }) => {
    // 縦列を共有する流れ図で見る。 swimlane の部品は矢印が無くても縦列に入って重ねない (#1980)
    const 本文 = [
      'title: "部品へ矢印"',
      "type: flow",
      "",
      "actors:",
      "  - 受付: { kind: card }",
      "  - 印: { kind: state-indicator }",
      "",
      "flow:",
      '  - 受付 -> 印: "送る"',
      "",
    ].join("\n");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`editor#s=${Buffer.from(本文, "utf8").toString("base64")}`);
    await page.waitForLoadState("networkidle");
    const 図 = page.locator(".v4-editor-stage svg[data-cdl-stage]").first();
    await expect(図).toContainText("受付", { timeout: 15000 });
    await expect(page.locator('.v4-editor-stage [data-overlay-part="印"]')).toHaveCount(0);
    await expect(図.locator('[data-cdl-node="印__ind"]')).toHaveCount(1);
    await expect(図.locator("[data-cdl-edge]")).toHaveCount(1);
  });

  test("切替ごとに円の大きさと塗りの色が書いた欄のとおりに変わる", async ({ page }) => {
    await 開く(page);
    const 書かない = await 円(page, カタログの図);
    expect(書かない.外枠, "部品の円を描いていない (検査が空振りしている)").toEqual([140]);
    expect(書かない.塗り.map((c) => c.fill)).toEqual(["#22c55e"]);

    await 押す(page, "状態を上書き");
    // 部品の段を外したので、待っても 4 割のまま動かない
    await page.waitForTimeout(1500);
    expect(await 円(page, カタログの図)).toEqual({
      外枠: [140],
      塗り: [{ r: 56, fill: "#22c55e" }],
    });

    await 押す(page, "倍率を変える");
    expect((await 円(page, カタログの図)).外枠).toEqual([84]);

    await 押す(page, "色番号を変える");
    expect((await 円(page, カタログの図)).塗り.map((c) => c.fill)).toEqual(["#d9534f"]);
  });

  test("コードの yaml と json に書き換えた欄が出る", async ({ page }) => {
    await 開く(page);
    await 押す(page, "状態を上書き");
    await page.getByRole("tab", { name: "コード" }).click();
    const コード = page.locator(".catalog-source-code").first();
    await expect(コード).toContainText("state: { lvl: 0.4, phase: false }");
    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const 読んだ = JSON.parse(await コード.innerText()) as {
      actors?: { kind?: string; state?: Record<string, unknown> }[];
    };
    expect(読んだ.actors?.[0]).toEqual({
      name: "設備の稼働",
      kind: "state-indicator",
      state: { lvl: 0.4, phase: false },
    });
  });

  test("編集画面で開くと、カタログと同じ円を描く", async ({ page }) => {
    await 開く(page);
    await 押す(page, "状態を上書き");
    const リンク = page.getByRole("link", { name: /編集画面で開く/ });
    await expect(リンク).toBeVisible();
    const href = await リンク.getAttribute("href");
    expect(href ?? "", "編集画面へ渡す中身が空").toContain("#");
    await リンク.click();
    await page.waitForSelector(".v4-editor-stage svg[data-cdl-stage]", { timeout: 15000 });
    await expect
      .poll(async () => await 円(page, ".v4-editor-stage svg[data-cdl-stage]"), { timeout: 10000 })
      .toEqual({ 外枠: [140], 塗り: [{ r: 56, fill: "#22c55e" }] });
  });

  test("編集画面で箱と並べた部品も、書いた状態と色番号で重ねて描く", async ({ page }) => {
    // 箱がある本文では、部品を図から抜いて上に重ねる。 重ねる側にも上書きが届くかを見る
    const 本文 = [
      'title: "受付と稼働"',
      "type: flow",
      "",
      "actors:",
      "  - 受付: { kind: card }",
      '  - 印: { kind: state-indicator, color: "#d9534f", state: { lvl: 0.4, phase: false } }',
      "",
    ].join("\n");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`editor#s=${Buffer.from(本文, "utf8").toString("base64")}`);
    await page.waitForLoadState("networkidle");
    const 重ねた部品 = '.v4-editor-stage [data-overlay-part="印"] svg';
    await page.waitForSelector(重ねた部品, { timeout: 15000 });
    await expect(page.locator(".v4-editor-stage svg[data-cdl-stage]").first()).toContainText(
      "受付",
    );
    await expect
      .poll(async () => await 円(page, 重ねた部品), { timeout: 10000 })
      .toEqual({ 外枠: [140], 塗り: [{ r: 56, fill: "#d9534f" }] });
  });
});
