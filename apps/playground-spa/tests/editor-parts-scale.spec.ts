import { test, expect, type Page } from "@playwright/test";

/**
 * 図の倍率を上げた時、canvas に重ねた部品も一緒に拡大することを見る (#1436)。
 *
 * 部品は cdl の図と同じ world 座標に置かれるが、cdl の SVG は 1 world unit = 倍率 k px で
 * 描かれる。 部品側に k を掛けないと **図だけが伸びて部品がその場に取り残される**。
 *
 * 倍率が画面上で何も変えなかった間は、この不整合は起こりようがなかった (どちらも動かない)。
 * 倍率が効くようになって初めて表に出る。
 *
 * ## なぜ実ブラウザでしか見られないか
 *
 * 部品は本文から抜いて別に重ねる経路 (`extractPartsFromSrc` → `placeParts`) で描かれ、
 * 図の SVG の矩形には含まれない。 単体側の `part-placement-parity.test.ts` は
 * **置き場所の一致** を見るもので、画面の倍率操作を通らない。
 *
 * 既存の「図の倍率が等比で効く」 (`editor-all-types.spec.ts`) は **図の SVG しか測っていない**
 * ので、図だけが伸びて部品が取り残されても通る。
 *
 * ## 図と部品の両方を測る
 *
 * 片方だけを見ると、**両方が動かない形と両方が動く形を区別できない**。
 * 図が 1.25 倍になっていることを先に確かめてから、部品が同じ倍率で動くことを見る。
 */

test.use({ viewport: { width: 1920, height: 1080 } });

/** 1 段の倍率。 画面側の実装と同じ値 */
const 一段 = 1.25;

/**
 * 部品を置く。
 *
 * 部品の drag drop は #923 で外れており、いまは一覧から選ぶと **本文に書き込まれる**
 * (実測で `- achievement: { kind: achievement }` が本文に入る)。 本文へ直接打ち込む形は
 * 編集器の入力を経由するぶん壊れやすいので、備わっている経路をそのまま使う。
 */
async function 部品を置く(page: Page, partId: string): Promise<void> {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(400);
  await page.click(`[data-part-id="${partId}"]`);
  await page.waitForTimeout(1500);
}

type 実測 = {
  図: { w: number; h: number };
  部品: Array<{ id: string; w: number; h: number; left: number; top: number }>;
};

/** 図と部品を **同じ回で** 測る。 別々に測ると、間に入った再描画で組が食い違う */
async function 測る(page: Page): Promise<実測> {
  return await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="editor-preview-stage"] svg[viewBox]');
    if (!svg) throw new Error("図の SVG が無い");
    const s = svg.getBoundingClientRect();
    const parts = [...document.querySelectorAll("[data-overlay-part]")].map((p) => {
      const r = p.getBoundingClientRect();
      const st = (p as HTMLElement).style;
      return {
        id: p.getAttribute("data-overlay-part") ?? "",
        w: r.width,
        h: r.height,
        left: parseFloat(st.left || "0"),
        top: parseFloat(st.top || "0"),
      };
    });
    return { 図: { w: s.width, h: s.height }, 部品: parts };
  });
}

test.describe("図の倍率に部品が追随する (#1436)", () => {
  test("倍率を 1 段上げると、図も部品も同じ 1.25 倍になる", async ({ page }) => {
    await page.goto("editor", { waitUntil: "networkidle" });
    await page.waitForSelector(".v4-editor-preview svg[data-cdl-stage]", { timeout: 15000 });
    await page.waitForTimeout(800);

    await 部品を置く(page, "parts-achievement");

    const 前 = await 測る(page);
    // 走査の空振りを止める = 部品が 1 つも置けていないと、以下の loop が 1 度も回らない
    expect(前.部品.length, "部品が 1 つも置けていない").toBeGreaterThan(0);
    expect(前.図.w, "図が描かれていない").toBeGreaterThan(0);
    for (const p of 前.部品) {
      expect(p.w, `${p.id} の幅が 0`).toBeGreaterThan(0);
      expect(p.h, `${p.id} の高さが 0`).toBeGreaterThan(0);
    }

    await page.locator('[data-testid="editor-diagram-scale-up"]').click();
    await page.waitForTimeout(1400);
    const 後 = await 測る(page);

    // 先に図が動いたことを確かめる。 図が動いていない回で部品だけを見ると、
    // 「両方動かない」 を「追随している」 と読んでしまう
    expect(後.図.w / 前.図.w, "図の幅の倍率").toBeCloseTo(一段, 2);
    expect(後.図.h / 前.図.h, "図の高さの倍率").toBeCloseTo(一段, 2);

    expect(後.部品.length, "倍率を変えたら部品が消えた").toBe(前.部品.length);
    for (const [i, 後p] of 後.部品.entries()) {
      const 前p = 前.部品[i]!;
      expect(後p.id, "部品の並びが変わった").toBe(前p.id);
      expect(後p.w / 前p.w, `${後p.id} の幅の倍率`).toBeCloseTo(一段, 2);
      expect(後p.h / 前p.h, `${後p.id} の高さの倍率`).toBeCloseTo(一段, 2);
    }
  });

  test("倍率を上げると部品の置き場所も同じだけ動く (その場に取り残されない)", async ({ page }) => {
    await page.goto("editor", { waitUntil: "networkidle" });
    await page.waitForSelector(".v4-editor-preview svg[data-cdl-stage]", { timeout: 15000 });
    await page.waitForTimeout(800);

    await 部品を置く(page, "parts-achievement");

    const 前 = await 測る(page);
    // 置き場所が原点だと倍率を掛けても動かないので、比べる意味が無くなる。
    // 原点でない部品が 1 つ以上あることを先に確かめる
    const 動く = 前.部品.filter((p) => p.left > 1 || p.top > 1);
    expect(動く.length, "原点でない部品が 1 つも無い (倍率の効きを測れない)").toBeGreaterThan(0);

    await page.locator('[data-testid="editor-diagram-scale-up"]').click();
    await page.waitForTimeout(1400);
    const 後 = await 測る(page);

    for (const 前p of 動く) {
      const 後p = 後.部品.find((p) => p.id === 前p.id)!;
      expect(後p, `${前p.id} が消えた`).toBeTruthy();
      if (前p.left > 1) {
        expect(後p.left / 前p.left, `${前p.id} の左位置の倍率`).toBeCloseTo(一段, 2);
      }
      if (前p.top > 1) {
        expect(後p.top / 前p.top, `${前p.id} の上位置の倍率`).toBeCloseTo(一段, 2);
      }
    }
  });

  test("倍率を戻すと部品も元の大きさに戻る", async ({ page }) => {
    // 陰性対照。 「常に 1.25 倍で描く」 実装でも上の 2 件は通るので、戻る側も見る
    await page.goto("editor", { waitUntil: "networkidle" });
    await page.waitForSelector(".v4-editor-preview svg[data-cdl-stage]", { timeout: 15000 });
    await page.waitForTimeout(800);

    await 部品を置く(page, "parts-achievement");
    const 前 = await 測る(page);
    expect(前.部品.length).toBeGreaterThan(0);

    await page.locator('[data-testid="editor-diagram-scale-up"]').click();
    await page.waitForTimeout(1400);
    await page.locator('[data-testid="editor-diagram-scale-down"]').click();
    await page.waitForTimeout(1400);
    const 戻り = await 測る(page);

    expect(戻り.図.w / 前.図.w, "図の幅").toBeCloseTo(1, 2);
    for (const [i, 戻りp] of 戻り.部品.entries()) {
      const 前p = 前.部品[i]!;
      expect(戻りp.w / 前p.w, `${戻りp.id} の幅`).toBeCloseTo(1, 2);
      expect(戻りp.h / 前p.h, `${戻りp.id} の高さ`).toBeCloseTo(1, 2);
    }
  });
});
