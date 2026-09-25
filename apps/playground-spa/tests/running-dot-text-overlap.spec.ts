import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

import { 一覧の行 } from "./catalog-item-pick";

/*
 * 線の上を走る丸が、線と見分けられて、かつ線のそばの文字を横切らないことを見る (#2537)。
 *
 * 丸は箱に指を乗せている間だけ出る。 走る線は指を乗せた箱で変わるので、
 * **箱を 1 つずつ順に辿る**。 1 つの箱だけで測ると、その箱に繋がっていない線の
 * そばの文字は 1 度も確かめられない (それで 1 巡目は「被りなし」 と出た)。
 *
 * 測り方は画素から取る。 紙の色と丸の色を重ねて計算すると、線が箱の面を横切る場合に
 * 合わない (`relation-edge-opacity.spec.ts` と同じ理由)。
 * 丸を消した写しと出した写しを撮り、文字の枠の中で色が変わった画素を数える。
 */

const 被りの上限 = 0.05; // 文字の枠の面積に対する割合
const 舞台 = "svg[data-cdl-stage]";
const 流れ = `${舞台} [data-cdl-role="edge-flow"]`;
const 端の数 = `${舞台} [data-cdl-role="edge-end-label"]`;
const 時刻 = [0.15, 0.45, 0.75, 1.05, 1.35, 1.65, 1.9];

type 枠 = { 文: string; x: number; y: number; w: number; h: number };

async function 見本を開く(page: Page, id: string) {
  await page.goto("catalog/presets");
  await page.waitForLoadState("networkidle");
  await 一覧の行(page, id).click();
  await page.waitForTimeout(3500);
}

async function 写す(page: Page, t: number, 丸あり: boolean) {
  await page.evaluate(
    ([t, 丸あり]) => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      s.setCurrentTime(t);
      document.getElementById("丸を消す")?.remove();
      if (!丸あり) {
        const st = document.createElement("style");
        st.id = "丸を消す";
        st.textContent = '[data-cdl-role="edge-flow"]{visibility:hidden !important}';
        document.head.appendChild(st);
      }
    },
    [t, 丸あり] as const,
  );
  await page.waitForTimeout(70);
  return PNG.sync.read(await page.screenshot());
}

/** 枠の中で、丸のある写しとない写しで色が変わった画素の割合を返す。 */
function 変わった割合(あり: PNG, なし: PNG, f: 枠, 倍: number) {
  const x0 = Math.floor(f.x * 倍);
  const y0 = Math.floor(f.y * 倍);
  const x1 = Math.ceil((f.x + f.w) * 倍);
  const y1 = Math.ceil((f.y + f.h) * 倍);
  let 差 = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * あり.width + x) * 4;
      const 差分 = (k: number) => Math.abs((あり.data[i + k] ?? 0) - (なし.data[i + k] ?? 0));
      if (差分(0) > 3 || 差分(1) > 3 || 差分(2) > 3) 差 += 1;
    }
  }
  const 面積 = (x1 - x0) * (y1 - y0);
  return { 割合: 面積 ? 差 / 面積 : 0, 面積 };
}

/**
 * 全部の箱に順に指を乗せ、丸が走る度に文字の枠を測る。
 * 1 本も走らなかった場合は 0 を返さず、走った本数を一緒に返して呼出側で確かめる。
 */
async function 横切りを測る(page: Page, 倍: number) {
  const 箱 = page.locator(`${舞台} [data-cdl-node]`);
  const 箱数 = await 箱.count();
  expect(箱数, "箱が 1 つも無い").toBeGreaterThan(0);

  let 走った = 0;
  const 最悪 = new Map<string, number>();

  for (let n = 0; n < 箱数; n++) {
    await 箱.nth(n).hover();
    await page.waitForTimeout(700);
    const 本数 = await page.locator(流れ).count();
    if (本数 === 0) continue;
    走った += 本数;

    await page.evaluate(() =>
      (document.querySelector("svg[data-cdl-stage]") as SVGSVGElement).pauseAnimations(),
    );
    const 枠々: 枠[] = await page.evaluate(() => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      return [...s.querySelectorAll("text")]
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { 文: (e.textContent ?? "").slice(0, 10), x: r.x, y: r.y, w: r.width, h: r.height };
        })
        .filter(
          (r) =>
            r.w > 0 &&
            r.h > 0 &&
            r.x >= 0 &&
            r.y >= 0 &&
            r.x + r.w <= window.innerWidth &&
            r.y + r.h <= window.innerHeight,
        );
    });
    expect(枠々.length, "文字が 1 つも取れなかった").toBeGreaterThan(0);

    for (const t of 時刻) {
      const あり = await 写す(page, t, true);
      const なし = await 写す(page, t, false);
      for (const f of 枠々) {
        const { 割合 } = 変わった割合(あり, なし, f, 倍);
        if (割合 > (最悪.get(f.文) ?? 0)) 最悪.set(f.文, 割合);
      }
    }
  }
  return { 走った, 最悪 };
}

test.describe("線の上を走る丸", () => {
  test("クラス図で、線のそばの文字を横切らない", async ({ page }, info) => {
    const 倍 = info.project.use.deviceScaleFactor ?? 1;
    await 見本を開く(page, "class-demo");
    const { 走った, 最悪 } = await 横切りを測る(page, 倍);

    // 1 本も走らなければ「被りなし」 も意味を持たない
    expect(走った, "丸が 1 本も走らなかった").toBeGreaterThan(0);

    const 超過 = [...最悪].filter(([, v]) => v >= 被りの上限);
    expect(
      超過.map(([文, v]) => `${文} ${(v * 100).toFixed(1)}%`).join(" / "),
      `走った線 のべ ${走った} 本 / 見た文字 ${最悪.size} 個`,
    ).toBe("");
  });

  test("表どうしのつながりを描く図で、文字を横切らない", async ({ page }, info) => {
    const 倍 = info.project.use.deviceScaleFactor ?? 1;
    await 見本を開く(page, "er-demo");
    const { 走った, 最悪 } = await 横切りを測る(page, 倍);

    expect(走った, "丸が 1 本も走らなかった").toBeGreaterThan(0);
    const 超過 = [...最悪].filter(([, v]) => v >= 被りの上限);
    expect(超過.map(([文, v]) => `${文} ${(v * 100).toFixed(1)}%`).join(" / ")).toBe("");
  });

  test("丸の一番内側は紙の色で、ぼかしは 3 枚のまま縮めてある", async ({ page }) => {
    await 見本を開く(page, "er-demo");
    await page.locator(`${舞台} [data-cdl-node]`).first().hover();
    await page.waitForSelector(流れ, { state: "attached" });

    const 実 = await page.evaluate(() => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      const g = s.querySelector('[data-cdl-role="edge-flow"]') as SVGGElement;
      const 丸 = [...g.querySelectorAll("circle")];
      const 紙 = getComputedStyle(s).getPropertyValue("--er-ground").trim();
      const 色 = (v: string) => {
        const c = document.createElement("span");
        c.style.color = v;
        document.body.appendChild(c);
        const out = getComputedStyle(c).color;
        c.remove();
        return out;
      };
      return {
        枚数: 丸.length,
        半径: 丸.map((c) => c.getBoundingClientRect().width),
        内側の塗り: getComputedStyle(丸[丸.length - 1] as Element).fill,
        紙の色: 色(紙),
      };
    });

    // 1 本の線につき 3 枚。 枚数は赤ペンの回答どおり変えない
    expect(実.枚数 % 3, `丸の枚数 ${実.枚数}`).toBe(0);
    expect(実.内側の塗り).toBe(実.紙の色);
    // 外 > 中 > 内 の順で、外は内の 2 倍未満 (28/11 = 2.5 倍から縮めた)
    const [外, 中, 内] = 実.半径;
    expect(外, "外のぼかしが取れない").toBeGreaterThan(0);
    expect(中, "中のぼかしが取れない").toBeGreaterThan(0);
    expect(内, "一番内側が取れない").toBeGreaterThan(0);
    expect(外!).toBeGreaterThan(中!);
    expect(中!).toBeGreaterThan(内!);
    expect(外! / 内!).toBeLessThan(2);
  });

  test("線のそばの数には、台と同じ色の下敷きが敷いてある", async ({ page }) => {
    await 見本を開く(page, "class-demo");
    const 数 = page.locator(端の数).first();
    await 数.waitFor({ state: "attached" });

    const 実 = await page.evaluate(() => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      const t = s.querySelector('[data-cdl-role="edge-end-label"]') as SVGTextElement;
      const cs = getComputedStyle(t);
      const 紙 = getComputedStyle(s).getPropertyValue("--er-ground").trim();
      const 色 = (v: string) => {
        const c = document.createElement("span");
        c.style.color = v;
        document.body.appendChild(c);
        const out = getComputedStyle(c).color;
        c.remove();
        return out;
      };
      return { 縁: cs.stroke, 幅: cs.strokeWidth, 描き順: cs.paintOrder, 紙の色: 色(紙) };
    });

    expect(実.縁).toBe(実.紙の色);
    expect(parseFloat(実.幅)).toBeGreaterThanOrEqual(16);
    // 下敷きは字の下に敷く。 字の上に来ると数が読めなくなる
    expect(実.描き順).toContain("stroke");
  });
});
