/**
 * 表の区切り線が明暗のどちらでも見えることの検証 (#1108)。
 *
 * ## 起票時の前提はもう無い
 *
 * `#1108` は「cdl が付けた役割 `node-row-divider` に、 呼び出し側が **6 テーマ分** の色を
 * 当てていない」 という形で起票された。 その後 `#1111` が見た目を明暗 2 種に作り直して主題の
 * 概念を廃し、 同時に `cdl-theme.css` へ配線が入っている (`--d-text-secondary`)。
 *
 * したがって「配線されていない」 は解消済で、 **残っていたのは検査が無いこと**。 起票時の
 * 完了条件のうち「線の色と箱の塗りの対比が 3:1 以上」 は、 誰も測っていなかった。
 *
 * ## 画素で測る
 *
 * 宣言値では測らない。 線は不透明度と重なりを持ち、 合成の順序まで再現しないと合わない
 * (`helpers/pixel-contrast.ts` が 2 度踏んだ経緯を持つ)。 線を隠した写しと出した写しを
 * 比べて、 描かれた画素から測る。
 *
 * 閾値 3.0 は WCAG の非文字要素の下限。 区切り線は字ではないので 4.5 は課さない。
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { shoot, measure, type Box } from "./helpers/pixel-contrast";

/** 区切り線を持つ画面。 実体の名前と列の間に横線が入る。 */
const 対象 = "/preset/er";

const 役割 = '[data-cdl-role="node-row-divider"]';

/** 非文字要素の対比の下限 (WCAG 2.x)。 */
const 下限 = 3.0;

async function 開く(page: Page, 暗い: boolean): Promise<void> {
  await page.goto(対象);
  await page.waitForLoadState("networkidle");
  if (暗い) await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
}

/** 区切り線の矩形を、 線の細さで潰れないよう上下に広げて返す。 */
async function 線の矩形(page: Page): Promise<Box[]> {
  return await page.evaluate((sel) => {
    const out: Box[] = [];
    for (const e of document.querySelectorAll(sel)) {
      const r = e.getBoundingClientRect();
      if (r.width < 2) continue;
      // 線は高さがほぼ 0 なので、 上下に 3px ずつ足して地の画素も入るようにする
      out.push({ x: r.x, y: r.y - 3, width: r.width, height: Math.max(r.height, 1) + 6 });
    }
    return out;
  }, 役割);
}

for (const [名, 暗い] of [
  ["明るい画面", false],
  ["暗い画面", true],
] as const) {
  test(`${名}で表の区切り線が箱の上で見える`, async ({ page }) => {
    await 開く(page, 暗い);

    const 矩形 = await 線の矩形(page);
    // 線が 1 本も無い画面で測ると、 何も見ずに通る
    expect(矩形.length, `${対象} に区切り線が無い`).toBeGreaterThan(0);

    const 出した = await shoot(page, { x: 0, y: 0, width: 1280, height: 720 });
    await page.addStyleTag({ content: `${役割} { visibility: hidden !important; }` });
    await page.waitForTimeout(400);
    const 隠した = await shoot(page, { x: 0, y: 0, width: 1280, height: 720 });

    const 悪い: string[] = [];
    let 測れた = 0;
    for (const b of 矩形) {
      const m = measure(出した, 隠した, b);
      if (m.kind === "invisible") {
        悪い.push(`(${Math.round(b.x)}, ${Math.round(b.y)}) 線が描かれていない`);
        continue;
      }
      if (m.kind === "unmeasurable") continue;
      測れた++;
      if (m.ratio < 下限) {
        悪い.push(`(${Math.round(b.x)}, ${Math.round(b.y)}) 対比 ${m.ratio.toFixed(2)}`);
      }
    }

    // 全部が「測れない」 で終わると、 悪い件数 0 のまま通る
    expect(測れた, "区切り線を 1 本も測れていない").toBeGreaterThan(0);
    expect(悪い, `区切り線の対比が ${下限} を下回る`).toEqual([]);
  });
}

test("表の区切り線の色が明暗で変わる", async ({ page }) => {
  // 同じ色のままなら、 配線 (`--d-text-secondary`) が効いていない
  const 色 = async (暗い: boolean): Promise<string> => {
    await 開く(page, 暗い);
    const s = await page.evaluate((sel) => {
      const e = document.querySelector(sel);
      return e === null ? null : getComputedStyle(e).stroke;
    }, 役割);
    expect(s, `${対象} に区切り線が無い`).not.toBeNull();
    return s!;
  };

  const 明 = await 色(false);
  const 暗 = await 色(true);
  expect(暗, `明暗で区切り線の色が同じ (${明})`).not.toEqual(明);
});
