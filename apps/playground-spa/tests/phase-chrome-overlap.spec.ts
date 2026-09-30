import { test, expect, type Page } from "@playwright/test";

import {
  PHASE_CHROME_BOTTOM_SPACE_PX,
  PHASE_CHROME_TOP_SPACE_PX,
} from "../src/lib/phase-chrome-space";
import { 一覧の行 } from "./catalog-item-pick";

type 被り = {
  上: number;
  下: number;
};

const 見本 = {
  一覧の識別子: "seq-demo",
  詳細の道: "preset/sequence",
} as const;

const 覆いの必要量 = [
  { 変数名: "--cdl-phase-chrome-top-space", TypeScript値: PHASE_CHROME_TOP_SPACE_PX },
  {
    変数名: "--cdl-phase-chrome-bottom-space",
    TypeScript値: PHASE_CHROME_BOTTOM_SPACE_PX,
  },
] as const;

async function 開く(page: Page, path: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

async function カタログで図を選ぶ(page: Page): Promise<void> {
  await 開く(page, "catalog/presets");
  const 項目 = 一覧の行(page, 見本.一覧の識別子);
  await expect(項目, `${見本.一覧の識別子} を一覧から選べない`).toBeVisible();
  await 項目.click();
}

async function 被りを測る(page: Page, 画面: string, 舞台: string): Promise<被り[]> {
  await page.waitForSelector(`${舞台} [data-cdl-stage]`, { timeout: 30000 });
  await expect(
    page.locator(`${舞台} .cdl-phase-chip`),
    `${画面}: 覆いが出ている図を選べていない`,
  ).not.toHaveCount(0);
  await expect(
    page.locator(`${舞台} .cdl-phase-foot`),
    `${画面}: 覆いが出ている図を選べていない`,
  ).not.toHaveCount(0);

  const 測定 = await page.locator(舞台).evaluateAll((舞台一覧) => {
    const 縦の被り = (図: DOMRect, 覆い: DOMRect): number => {
      const 横の交わり = Math.min(図.right, 覆い.right) - Math.max(図.left, 覆い.left);
      if (横の交わり <= 0) return 0;
      return Math.max(0, Math.min(図.bottom, 覆い.bottom) - Math.max(図.top, 覆い.top));
    };
    const 丸める = (値: number): number => Math.round(値 * 100) / 100;

    return 舞台一覧.flatMap((根) => {
      const 図 = 根.querySelector<SVGSVGElement>("[data-cdl-stage]");
      const 札 = 根.querySelector<HTMLElement>(".cdl-phase-chip");
      const 足 = 根.querySelector<HTMLElement>(".cdl-phase-foot");
      if (図 === null || 札 === null || 足 === null) return [];

      const 図の矩形 = 図.getBoundingClientRect();
      return [
        {
          上: 丸める(縦の被り(図の矩形, 札.getBoundingClientRect())),
          下: 丸める(縦の被り(図の矩形, 足.getBoundingClientRect())),
        },
      ];
    });
  });

  expect(測定.length, `${画面}: 1 つも測れていない (検査が空振りしている)`).toBeGreaterThan(0);
  for (const [番号, 値] of 測定.entries()) {
    expect(値.上 + 値.下, `${画面}の図 ${番号 + 1}: 上 ${値.上}px / 下 ${値.下}px 被っている`).toBe(
      0,
    );
  }
  return 測定;
}

test("カタログの一覧で段の表示が図に被らない", async ({ page }) => {
  await カタログで図を選ぶ(page);
  await 被りを測る(page, "カタログの一覧", ".catalog-preview-stage");
});

test("見本の詳細で段の表示が図に被らない", async ({ page }) => {
  await 開く(page, 見本.詳細の道);
  await 被りを測る(page, "見本の詳細", ".nm-preset-detail-stage");
});

test("エディタで段の表示が図に被らない", async ({ page }) => {
  await 開く(page, "editor");
  // 高い舞台では横幅側の fit が先に効いて上下が偶然空く。舞台だけを狭め、覆い用の下限を実際に使わせる。
  await page.addStyleTag({
    content: ".v4-editor-stage { flex: 0 0 380px !important; min-height: 0 !important; }",
  });
  await page.getByTestId("editor-fit").click();
  await 被りを測る(page, "エディタ", ".v4-editor-stage");
});

test("覆いの必要量が CSS と TypeScript で一致する", async ({ page }) => {
  await 開く(page, "editor");

  const CSS値一覧 = await page.evaluate(
    (変数名一覧) => {
      const style = getComputedStyle(document.documentElement);
      return 変数名一覧.flatMap((変数名) => {
        const 生の値 = style.getPropertyValue(変数名).trim();
        const 値 = Number.parseFloat(生の値);
        return Number.isFinite(値) ? [{ 変数名, 生の値, 値 }] : [];
      });
    },
    覆いの必要量.map(({ 変数名 }) => 変数名),
  );

  const 値の一覧 = 覆いの必要量.map(({ 変数名, TypeScript値 }) => {
    const CSS値 = CSS値一覧.find((候補) => 候補.変数名 === 変数名);
    return `${変数名}: CSS=${CSS値?.生の値 ?? "読めない"} / TypeScript=${TypeScript値}px`;
  });
  expect(
    CSS値一覧,
    `CSS 変数を読めた件数=${CSS値一覧.length} (期待=2); ${値の一覧.join(", ")}`,
  ).toHaveLength(2);

  for (const { 変数名, TypeScript値 } of 覆いの必要量) {
    const CSS値 = CSS値一覧.find((候補) => 候補.変数名 === 変数名);
    expect(
      CSS値?.値,
      `${変数名}: CSS=${CSS値?.生の値 ?? "読めない"} / TypeScript=${TypeScript値}px`,
    ).toBe(TypeScript値);
  }
});

/**
 * 図に重ねる層が、倍率を指定した拡大表示でも図の入れ物の幅を持つ (#2741)。
 *
 * 重ねる層は `position: absolute` と `inset: 0` で入れ物いっぱいに広がる。
 * 倍率を指定した時の規則 (`width: max-content`) がその層にも掛かると、層の子が全て
 * 絶対配置なので幅が 0 になり、下の情報が 1 文字ずつ縦に折り返る。
 *
 * **倍率が指定されている状態で測る**。 指定しない状態 (幅 1440px の既定) では
 * `width: 100%` が掛かるので、元から通る検査になる。 携帯の幅では読める下限で描くため
 * 必ず倍率が指定される。
 */
test.describe("重ねる層の幅 (#2741)", () => {
  test("倍率を指定した拡大表示でも、重ねる層が図の入れ物の幅を持つ", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("catalog/presets", { waitUntil: "networkidle" });
    await page.waitForTimeout(900);

    // 図は台が見える所に入ってから描かれる。 入口は図と同じ台に付く
    const 高さ = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < 高さ; y += 670) {
      await page.evaluate((v) => globalThis.scrollTo(0, v), y);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => globalThis.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
    await expect(page.locator(".cdl-modal-content")).toBeVisible();
    await page.waitForTimeout(1500);

    const 測り = await page.evaluate(() => {
      const 入れ物 = document.querySelector(".cdl-modal-body");
      const 層 = document.querySelector(".cdl-modal-body .cdl-phase");
      const 情報 = document.querySelector(".cdl-modal-body .cdl-phase-meta");
      const 幅 = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().width) : -1);
      const 高 = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().height) : -1);
      return {
        倍率の指定: 入れ物?.getAttribute("data-cdl-zoom") ?? null,
        入れ物の幅: 幅(入れ物),
        層の幅: 幅(層),
        情報の幅: 幅(情報),
        情報の高さ: 高(情報),
        情報の文字: (情報?.textContent ?? "").trim(),
      };
    });

    // 倍率が指定されていない状態で測ると、この検査は元から通る (空振り)
    expect(測り.倍率の指定, `倍率が指定されていない (検査が空振りしている): ${JSON.stringify(測り)}`).toBe("on");
    expect(測り.情報の文字.length, `段の情報が出ていない: ${JSON.stringify(測り)}`).toBeGreaterThan(0);
    expect(測り.層の幅, `重ねる層が図の入れ物の幅を持たない: ${JSON.stringify(測り)}`).toBe(測り.入れ物の幅);
    // 1 行なら字の高さの 2 倍に届かない。 幅が 0 に潰れた時は 95px まで伸びていた
    expect(測り.情報の高さ, `段の情報が折り返っている: ${JSON.stringify(測り)}`).toBeLessThan(24);
  });
});
