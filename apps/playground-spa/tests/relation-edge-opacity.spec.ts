/**
 * クラス図と表のつながりの図で、箱をつなぐ線の薄さを画面で測る (#2535 / #2805)。
 *
 * 線は丸い端の破線なので一粒ずつが点として読める。 描く側 (`@cardenelabs/cdl`) は
 * その点を 0.9 (光っている線は 0.95) で描き、箱の枠より濃く出ていた。
 * 本 app が描く側の `er()` とクラス図を図種で囲い、記法で書いた表の図 (`record`) を
 * 個数の端で囲って 0.8 / 0.85 に下げる。
 *
 * 見るのは 3 つ。
 *
 * 1. 下げた値が実際に効き、記法の表の図と `er()` の見本で同じになる
 *    (`cdl-theme.css` の `!important` の重なりで決まるので、規則を読んだだけでは効く値が判らない)
 * 2. 下げた後も紙に対する対比が 3 以上ある (図形が読める下限)
 * 3. 移り変わりの図と他の図種は描く側の値のまま (`edge-line` は線を引く全図種が共有する役割で、
 *    囲いが外れると分かれ道の図まで薄くなり、`record` 全体を囲うと移り変わりの図まで薄くなる)
 *
 * 3 つ目が対照。 これが無いと「全部薄くした」 と「囲った図だけ薄くした」 を区別できない。
 *
 * **一覧の画面で測る**。 編集画面は `reveal: all` でしか線が出ず、その時は全部の線が
 * 光っている扱いになるため、光っていない線の値を測れない (実測 = 0.85 だけが返る)。
 * 一覧は光る線 1 本とそれ以外を同時に描くので、2 つの値を 1 枚で確かめられる。
 */
import { test, expect, type Page } from "@playwright/test";

import { 一覧の行 } from "./catalog-item-pick";
import { contrast, measure, shoot, type Box } from "./helpers/pixel-contrast";

/** 意味を持つ図形が読める下限。 文字の 4.5 とは別軸 (WCAG の非文字要素)。 */
const 対比の下限 = 3;

/** 下げた後の薄さ。 `globals.css` の `--d-relation-edge-opacity*` と揃える。 */
const 薄さ = { 通常: 0.8, 光る: 0.85 } as const;

/** 描く側が描く薄さ。 囲いの外はこの値のまま。 */
const 描く側の薄さ = { 通常: 0.9, 光る: 0.95 } as const;

/**
 * #2805 の変更前 (`45c8c06f`) に画面で測った移り変わりの図の値。
 *
 * | 見本 | 光る | 光らない |
 * |---|---|---|
 * | `注文の状態` | なし | 0.9 |
 * | `認証の状態遷移` | なし | 0.9 |
 * | 編集画面の `state-machine` | 0.95 | なし |
 *
 * 囲いを足す前は `record` 全体が描く側の値のままだったため、`描く側の薄さ` と同じ数になる。
 */
const 変更前の移り変わりの薄さ = { 光る: 0.95, 光らない: 0.9 } as const;

const 舞台 = "svg[data-cdl-stage]";
const 線 = `${舞台} [data-cdl-role="edge-line"]`;

test.use({ viewport: { width: 1500, height: 1000 } });

async function 見本を開く(
  page: Page,
  識別子: string,
  暗い: boolean,
  頁 = "presets",
): Promise<void> {
  await page.goto(`catalog/${頁}`);
  await page.waitForLoadState("networkidle");
  await page.evaluate((d) => document.documentElement.classList.toggle("dark", d), 暗い);
  await 一覧の行(page, 識別子).click();
  await page.waitForSelector(線, { state: "attached" });
  // 線は引かれる動きを持つ。 引き終わる前に読むと引きかけの姿を測ることになる。
  await page.waitForTimeout(3500);
}

/** 画面で解決された薄さを線ごとに読む。 */
async function 薄さを読む(page: Page): Promise<number[]> {
  return page
    .locator(線)
    .evaluateAll((線たち) => 線たち.map((要素) => Number(getComputedStyle(要素).strokeOpacity)));
}

/** 線を光っているかで分け、画面で解決された薄さを読む。 */
async function 光り方ごとの薄さを読む(
  page: Page,
  選び方 = 線,
): Promise<{ 光る: number[]; 光らない: number[] }> {
  return page.locator(選び方).evaluateAll((線たち) => {
    const 値: { 光る: number[]; 光らない: number[] } = { 光る: [], 光らない: [] };
    for (const 要素 of 線たち) {
      const 光り方 = 要素.closest('[data-cdl-active="true"]') !== null ? "光る" : "光らない";
      値[光り方].push(Number(getComputedStyle(要素).strokeOpacity));
    }
    return 値;
  });
}

/** 図の根に出た描く側の図種を読む。 */
async function 図種を読む(page: Page, 選び方 = 舞台): Promise<string | null> {
  return page.locator(選び方).first().getAttribute("data-cdl-type");
}

const 重複を除いて並べる = (値: number[]): number[] => [...new Set(値)].sort((a, b) => a - b);

/**
 * 線を出した写しと隠した写しを撮り、画素の差から対比を出す。
 *
 * **計算で合成しない** (`helpers/pixel-contrast.ts` の冒頭が SSOT)。 薄めた線の見え方は
 * 描画側が紙に重ねた後の色でしか判らない。
 *
 * **1 本ずつ測る**。 `measure` は差の最大に近い画素だけを芯に採るので、濃い線と薄い線を
 * 1 枚で撮ると濃いほうだけが芯になり、薄いほうは 1 画素も測られない。
 * 実測 = 光っていない線を 0.55 (対比 2.17) まで落としても、光る線 (0.85) が芯を占めて
 * 本検査が通ってしまった。 測る 1 本以外を両方の写しで隠すと、差はその 1 本だけになる。
 *
 * **矢印の先も両方の写しで隠す**。 先は薄くしていないぶん線より濃く、同じ理由で芯を奪う。
 */
async function 線の対比を測る(page: Page): Promise<{ 比: number; 本数: number; 内訳: string[] }> {
  const 印 = "data-opacity-probe";

  const 本数 = await page.locator(線).evaluateAll((線たち, 属性) => {
    線たち.forEach((要素, i) => 要素.setAttribute(属性, String(i)));
    return 線たち.length;
  }, 印);

  const 隠す = async (i: number, 本人も: boolean) => {
    await page.evaluate(
      ({ 属性, 番, 本人 }: { 属性: string; 番: number; 本人: boolean }) => {
        document.getElementById("薄さ検査")?.remove();
        const s = document.createElement("style");
        s.id = "薄さ検査";
        const 対象 = [
          '[data-cdl-role="edge-arrowhead"]',
          `[data-cdl-role="edge-line"]:not([${属性}="${番}"])`,
        ];
        if (本人) 対象.push(`[${属性}="${番}"]`);
        s.textContent = `${対象.join(",")}{visibility:hidden !important}`;
        document.head.appendChild(s);
      },
      { 属性: 印, 番: i, 本人: 本人も },
    );
    await page.waitForTimeout(150);
  };

  // 写しは画面に映っている範囲しか撮れない。 線の枠が画面からはみ出すと `shoot` が
  // 「範囲が空か画像の外」 で落ちるので、映っている側へ切り詰める。
  // **切り詰めて 1 画素も残らない線は測れないものとして落とす** = 測れなかった本を
  // 「対比が足りている」 側に数えない (rules/quality.md § 判定できなかったことを値に潰さない)。
  const 画面 = page.viewportSize();
  const 画面に収める = (b: Box): Box => {
    const x0 = Math.max(0, b.x);
    const y0 = Math.max(0, b.y);
    const x1 = Math.min(画面?.width ?? b.x + b.width, b.x + b.width);
    const y1 = Math.min(画面?.height ?? b.y + b.height, b.y + b.height);
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };

  let 最悪 = Infinity;
  const 内訳: string[] = [];
  for (let i = 0; i < 本数; i++) {
    // 位置は **隠す前に、画面へ送ってから** 読む。 長い図では下のほうの線が画面の外にあり、
    // 送らずに撮ると「範囲が画像の外」 で落ちる (実測 = クラス図の 6 本目が y=1107)。
    const 的 = page.locator(`${舞台} [${印}="${i}"]`);
    await 的.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const 生枠 = await 的.boundingBox();
    if (!生枠) throw new Error(`${i} 本目の線の位置が取れない (測れていない本を 0 と数えない)`);
    const 枠 = 画面に収める(生枠);
    if (枠.width < 1 || 枠.height < 1) {
      throw new Error(
        `${i} 本目の線が画面に映っていない (枠 ${JSON.stringify(生枠)} / 画面 ${JSON.stringify(画面)})`,
      );
    }
    await 隠す(i, false);
    const 出した = await shoot(page, 枠);
    await 隠す(i, true);
    const 隠した = await shoot(page, 枠);

    const 結果 = measure(出した, 隠した);
    if (結果.kind !== "ok") {
      throw new Error(
        `${i} 本目の線の対比を測れない: ${結果.kind === "invisible" ? "線が見えていない" : 結果.reason}`,
      );
    }
    内訳.push(`${i}: ${結果.ratio.toFixed(2)}`);
    最悪 = Math.min(最悪, 結果.ratio);
  }
  await page.evaluate(() => document.getElementById("薄さ検査")?.remove());

  return { 比: 最悪, 本数, 内訳 };
}

for (const [名, 頁, 識別子] of [
  ["クラス図", "presets", "class-demo"],
  ["表のつながりの図", "presets", "er-demo"],
  ["記法で書いた表のつながりの図", "patterns", "集まる形-6-表-5-関係"],
] as const) {
  test(`${名}の線が薄くなっている`, async ({ page }) => {
    await 見本を開く(page, 識別子, false, 頁);
    const 値 = await 薄さを読む(page);

    expect(値.length, `${名}の線を 1 本も測れていない (検査が空振りしている)`).toBeGreaterThan(0);
    expect(
      [...new Set(値)].sort((a, b) => a - b),
      `${名}の線の薄さ (${値.length} 本): ${値.join(" / ")}`,
    ).toEqual([薄さ.通常, 薄さ.光る]);
  });

  for (const 暗い of [false, true]) {
    test(`${名}の線が${暗い ? "暗い" : "明るい"}画面で対比 ${対比の下限} 以上`, async ({
      page,
    }) => {
      await 見本を開く(page, 識別子, 暗い, 頁);
      const { 比, 本数, 内訳 } = await 線の対比を測る(page);

      expect(本数, `${名}の線を 1 本も測れていない (検査が空振りしている)`).toBeGreaterThan(0);
      expect(
        比,
        `${名}の線 ${本数} 本の最悪の対比 ${比.toFixed(2)} (下限 ${対比の下限})、内訳 ${内訳.join(" / ")}`,
      ).toBeGreaterThanOrEqual(対比の下限);
    });
  }
}

test("記法で書いた表のつながりの図の線は `er()` の見本と同じ薄さ (#2805)", async ({ page }) => {
  await 見本を開く(page, "er-demo", false);
  expect(await 図種を読む(page), "`er()` の見本の図種").toBe("er");
  const erの値 = await 光り方ごとの薄さを読む(page);

  await 見本を開く(page, "集まる形-6-表-5-関係", false, "patterns");
  expect(await 図種を読む(page), "記法で書いた表の図の図種").toBe("record");
  const recordの値 = await 光り方ごとの薄さを読む(page);

  for (const 光り方 of ["光る", "光らない"] as const) {
    expect(erの値[光り方].length, `er() に${光り方}線が無い`).toBeGreaterThan(0);
    expect(recordの値[光り方].length, `記法の表の図に${光り方}線が無い`).toBeGreaterThan(0);
    const erの集合 = 重複を除いて並べる(erの値[光り方]);
    const recordの集合 = 重複を除いて並べる(recordの値[光り方]);
    expect(
      recordの集合,
      `${光り方}線の薄さが違う (er(): ${erの集合.join(" / ")}、記法: ${recordの集合.join(" / ")})`,
    ).toEqual(erの集合);
  }
});

for (const [名, 識別子] of [
  ["注文の状態", "注文の状態"],
  ["認証の状態遷移", "認証の状態遷移"],
] as const) {
  test(`記法で書いた移り変わりの図「${名}」は変更前の濃さのまま (#2805)`, async ({ page }) => {
    await 見本を開く(page, 識別子, false, "text-dsl");
    expect(await 図種を読む(page), `${名}の図種`).toBe("record");
    const 値 = await 光り方ごとの薄さを読む(page);

    expect(値.光る.length + 値.光らない.length, `${名}の線が 1 本も無い`).toBeGreaterThan(0);
    for (const 光り方 of ["光る", "光らない"] as const) {
      for (const v of 値[光り方]) {
        expect(v, `${名}の${光り方}線の薄さ (${値[光り方].join(" / ")})`).toBe(
          変更前の移り変わりの薄さ[光り方],
        );
      }
    }
  });
}

test("編集画面の移り変わりの図は変更前の濃さのまま (#2805)", async ({ page }) => {
  const 編集画面の舞台 = '[data-testid="editor-preview-stage"] svg[data-cdl-type]';
  const 編集画面の線 =
    '[data-testid="editor-preview-stage"] svg[data-cdl-stage] [data-cdl-role="edge-line"]';

  await page.goto("editor#preset=state-machine");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector(編集画面の舞台);
  await page.waitForTimeout(3500);

  expect(await 図種を読む(page, 編集画面の舞台), "編集画面の見本の図種").toBe("record");
  await expect(page.locator('[data-cdl-eyebrow="初期"]'), "初期の札").toHaveCount(1);
  await expect(page.locator('[data-cdl-eyebrow="最終"]'), "最終の札").toHaveCount(1);

  const 値 = await 光り方ごとの薄さを読む(page, 編集画面の線);
  expect(値.光る.length + 値.光らない.length, "編集画面の見本の線が 1 本も無い").toBeGreaterThan(0);
  for (const 光り方 of ["光る", "光らない"] as const) {
    for (const v of 値[光り方]) {
      expect(v, `編集画面の${光り方}線の薄さ (${値[光り方].join(" / ")})`).toBe(
        変更前の移り変わりの薄さ[光り方],
      );
    }
  }
});

test("囲いの外の図は描く側の薄さのまま (対照)", async ({ page }) => {
  await 見本を開く(page, "delivery-flow-demo", false);
  const 値 = await 薄さを読む(page);

  expect(値.length, "分かれ道の図の線を 1 本も測れていない (検査が空振りしている)").toBeGreaterThan(
    0,
  );
  for (const v of 値) {
    expect(
      [描く側の薄さ.通常, 描く側の薄さ.光る],
      `分かれ道の図の線が薄くなっている (${値.join(" / ")}) = 図種の囲いが外れている`,
    ).toContain(v);
  }
});

test("対比の計算が WCAG の式と合っている (道具の対照)", () => {
  // 黒と白は 21、同じ色どうしは 1。 helper を取り違えた時にここが落ちる。
  expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 2);
  expect(contrast([128, 128, 128], [128, 128, 128])).toBeCloseTo(1, 5);
});
