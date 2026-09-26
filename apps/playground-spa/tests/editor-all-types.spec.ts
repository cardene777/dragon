import { test, expect, type Page } from "@playwright/test";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 見本が開けたことを確かめる } from "./opened-sample";
import { 位置が落ち着くまで待つ, 形が落ち着くまで待つ, 描き終わりを待つ } from "./wait-for-render";

/**
 * 全 diagram type で editor の基本操作が成立することを保証する (CAR-2160)。
 *
 * type ごとに lane / node の id 規約が違う (sequence は `{slug}-header`、 flow は素の slug、
 * state は `lane-{slug}`、 gantt は `gantt-{slug}`) ため、 1 type で動いても他が動く保証がない。
 * sample を順に開いて、 選択 / 移動 / 図の倍率 / 文字倍率 の 4 操作を全 type で確認する。
 */

test.use({ viewport: { width: 1920, height: 1080 } });

/**
 * この file の 50 件を並べて回す (#2557)。
 *
 * 並べて回す単位は既定では file なので、50 件が 1 つの走らせ役に並んでいた。
 * 他の file が終わってもこの 1 本が残り、**一式の終わりがこの file の長さで決まっていた**
 * (一式 19.3 分のうち 5.2 分)。
 *
 * 触れ合わないので並べてよい。 50 件はそれぞれ自分の頁を開いて読むだけで、書き換える先を
 * 共有していない。
 *
 * **走らせ役の数は増えない**。 4 つという数は [#1094](https://github.com/cardene777/dragon/issues/1094)
 * が 1 / 4 / 6 を実測して選んだ値で、ここでは変えない。 変わるのは 50 件が 4 つに散ることだけ。
 */
test.describe.configure({ mode: "parallel" });

const DIAGRAM_SVG = '[data-testid="editor-preview-stage"] svg[viewBox]';

/**
 * 脇の一覧の「見本」 の見出しから slug 指定で開く。
 *
 * **字ではなく目印で掴む** (#1811)。 字で掴むと呼び名を直した日に検査が落ちる。
 *
 * **決め打ちで待たない** (#2557)。 かつては開いて 2000ms、欄を開いて 300ms、押して 1800ms を
 * 待っていた。 一式で回すと足りなくなり、単独では通る形になる (#2458 / #2555 と同じ落ち方)。
 * 押し所が出るのは押す側が待ち、図が組み終わるのは編集画面向けの助けが待つ。
 */
async function openSample(page: Page, slug: string): Promise<void> {
  await page.goto("editor");
  await page.waitForLoadState("networkidle");
  await page.locator('[data-testid="editor-samples-tab"]').click();

  const btn = page.locator(`[data-testid="editor-sample-${slug}"]`).first();
  try {
    await btn.waitFor({ state: "visible", timeout: 10_000 });
  } catch {
    throw new Error(`見本 ${slug} の押し所が出ない (slug が消えたか、見本の欄が開いていない)`);
  }
  await btn.click();

  await 見本が開けたことを確かめる(page, slug);
  // 編集画面は図を読んでから枠に収めるまでに 3 度位置を計算し直す (#2476)
  await 位置が落ち着くまで待つ(page, `編集画面の ${slug}`);
}

/** 図の実描画の大きさが動かなくなるまで待つ */
async function 大きさが落ち着くまで待つ(page: Page, 何を: string): Promise<number> {
  return 形が落ち着くまで待つ(
    page,
    `${何を} の図の大きさ`,
    (指す: { sel: string }) => {
      const r = document.querySelector(指す.sel)?.getBoundingClientRect();
      if (!r || r.width === 0) return null;
      return `${Math.round(r.width)},${Math.round(r.height)}`;
    },
    { sel: DIAGRAM_SVG },
    { 窓: 300 },
  );
}

/**
 * 変わるはずの値が変わるまで待つ。
 *
 * 落ち着きだけを見ると、**押す前の値のまま落ち着いたことにできる**。 押してから描き直しが
 * 300 ミリ秒を超えて遅れた回に、変わっていない値を測って進んでしまう。
 *
 * **変わらないまま時間切れになった時は、ここで落とさず下の判定に言わせる**。
 * 何がどう違うかは判定の文のほうが詳しい (倍率 / 縦横比 / 座標系のどれが崩れたかまで出る)。
 */
async function 変わるまで待つ(
  page: Page,
  何を: string,
  渡す: { sel: string; 前: number },
  読む: (渡す: { sel: string; 前: number }) => boolean,
): Promise<void> {
  await 描き終わりを待つ(page, 何を, 読む, 渡す, {
    上限ミリ秒: 5_000,
    出ない時の言い方: "変わらない",
  }).catch(() => undefined);
}

/**
 * 対象 type の代表 sample。 label の部分一致で引く。
 *
 * **見本の一覧から導く**。 手で並べると、 記法に型を足した時にここが古いまま残り、 新しい型が
 * 1 度も画面で確かめられない (`solidity` / `bar` / `line` で実際に起きた)。
 */
const TYPES: Array<{ type: string; label: string }> = EDITOR_SAMPLES.map((s) => {
  const m = s.code.match(/^type:\s*([a-z0-9-]+)\s*$/mu);
  return { type: m?.[1] ?? "", label: s.slug };
}).filter((t, i, a) => t.type !== "" && a.findIndex((x) => x.type === t.type) === i);

for (const { type, label } of TYPES) {
  test(`全 type: ${type} = 図の倍率が等比で効く`, async ({ page }) => {
    await openSample(page, label);
    // 測るのは **実描画サイズ** (getBoundingClientRect)。
    //
    // 以前はここで viewBox 属性を測っていたが、 それでは倍率が効いたことにならない。
    // viewBox を k 倍すると表示倍率が 1/k になるので、 中身も k 倍していると両者が
    // 打ち消し合って画面は 1 pixel も変わらない。 属性は増えるので test は通ってしまう。
    const size = async (): Promise<{ w: number; h: number; vb: string }> =>
      await page.evaluate((sel) => {
        const svg = document.querySelector(sel)!;
        const r = svg.getBoundingClientRect();
        return { w: r.width, h: r.height, vb: svg.getAttribute("viewBox")! };
      }, DIAGRAM_SVG);
    const b = await size();
    await page.locator('[data-testid="editor-diagram-scale-up"]').click();
    await 変わるまで待つ(page, `${type} の図の幅`, { sel: DIAGRAM_SVG, 前: b.w }, (渡す) => {
      const r = document.querySelector(渡す.sel)?.getBoundingClientRect();
      return r !== undefined && Math.abs(r.width - 渡す.前) > 1;
    });
    await 大きさが落ち着くまで待つ(page, type);
    const a = await size();
    // 縦横とも拡大し、 縦横比が保たれる (歪まない)
    expect(a.w, `${type} の描画幅`).toBeGreaterThan(b.w);
    expect(a.h, `${type} の描画高さ`).toBeGreaterThan(b.h);
    expect(Math.abs(a.w / a.h - b.w / b.h), `${type} の縦横比`).toBeLessThan(0.01);
    // 1 段 = 1.25 倍。 「大きくなった」 だけでなく倍率どおりであることまで見る。
    expect(a.w / b.w, `${type} の倍率`).toBeCloseTo(1.25, 2);
    // 座標系は変えない (当たり判定や座標の読み書きが倍率で狂わない)
    expect(a.vb, `${type} の viewBox`).toBe(b.vb);
  });

  test(`全 type: ${type} = 文字サイズを一律で変えられる`, async ({ page }) => {
    await openSample(page, label);
    const font = async (): Promise<number> =>
      await page.evaluate((sel) => {
        const t = document.querySelector(`${sel} text`);
        return t ? parseFloat(getComputedStyle(t).fontSize) : 0;
      }, DIAGRAM_SVG);
    const b = await font();
    expect(b, `${type} に text がある`).toBeGreaterThan(0);
    await page.locator('[data-testid="editor-font-scale-up"]').click();
    await 変わるまで待つ(
      page,
      `${type} の文字の大きさ`,
      { sel: `${DIAGRAM_SVG} text`, 前: b },
      (渡す) => {
        const t = document.querySelector(渡す.sel);
        return t !== null && Math.abs(parseFloat(getComputedStyle(t).fontSize) - 渡す.前) > 0.01;
      },
    );
    expect(await font(), `${type} の文字`).toBeGreaterThan(b);
  });
}
