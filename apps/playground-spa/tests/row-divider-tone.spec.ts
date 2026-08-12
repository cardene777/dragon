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

/** 写しの範囲。 区切り線がこの外に出たら測れないので、 その形も落とす。 */
const 写し = { x: 0, y: 0, width: 1280, height: 720 } as const;

/**
 * 区切り線の矩形を、 線の細さで潰れないよう上下に広げて返す。
 *
 * **1 本ずつ結果を持つ**。 幅が無い / 写しの外にある線を黙って飛ばすと、 2 本のうち 1 本が
 * 消えても「残った 1 本が基準を満たす」 で通る (review 指摘)。 飛ばす代わりに理由を返し、
 * 呼出側が落とす。
 */
async function 線の矩形(page: Page): Promise<Array<{ box: Box | null; 理由: string | null }>> {
  return await page.evaluate(
    ({ sel, 写し }) => {
      const out: Array<{ box: { x: number; y: number; width: number; height: number } | null; 理由: string | null }> = [];
      for (const e of document.querySelectorAll(sel)) {
        const r = e.getBoundingClientRect();
        const 場所 = `(${Math.round(r.x)}, ${Math.round(r.y)})`;
        if (r.width < 2) {
          out.push({ box: null, 理由: `${場所} 線の幅が 2 未満 (${r.width.toFixed(2)})` });
          continue;
        }
        // 線は高さがほぼ 0 なので、 上下に 3px ずつ足して地の画素も入るようにする
        const box = { x: r.x, y: r.y - 3, width: r.width, height: Math.max(r.height, 1) + 6 };
        if (
          box.x < 写し.x ||
          box.y < 写し.y ||
          box.x + box.width > 写し.x + 写し.width ||
          box.y + box.height > 写し.y + 写し.height
        ) {
          out.push({ box: null, 理由: `${場所} 写しの外にある (写しの範囲を広げること)` });
          continue;
        }
        out.push({ box, 理由: null });
      }
      return out;
    },
    { sel: 役割, 写し },
  );
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

    const 出した = await shoot(page, 写し);
    await page.addStyleTag({ content: `${役割} { visibility: hidden !important; }` });
    await page.waitForTimeout(400);
    const 隠した = await shoot(page, 写し);

    // **1 本ずつ結果を出す**。 測れなかった線を飛ばすと、 残った線が基準を満たすだけで通る
    const 悪い: string[] = [];
    let 測れた = 0;
    for (const { box, 理由 } of 矩形) {
      if (box === null) {
        悪い.push(理由!);
        continue;
      }
      const 場所 = `(${Math.round(box.x)}, ${Math.round(box.y)})`;
      const m = measure(出した, 隠した, box);
      if (m.kind === "invisible") {
        悪い.push(`${場所} 線が描かれていない`);
        continue;
      }
      if (m.kind === "unmeasurable") {
        悪い.push(`${場所} 測れない (${m.reason})`);
        continue;
      }
      測れた++;
      if (m.ratio < 下限) {
        悪い.push(`${場所} 対比 ${m.ratio.toFixed(2)}`);
      }
    }

    expect(悪い, `区切り線が ${下限} を満たさない / 測れない`).toEqual([]);
    // 上が空でも、 全部が測れずに終わっていないことを別に確かめる
    expect(測れた, "区切り線を 1 本も測れていない").toBe(矩形.length);
  });
}

/** 区切り線の `stroke` を読む。 */
async function 線の色(page: Page): Promise<string> {
  const s = await page.evaluate((sel) => {
    const e = document.querySelector(sel);
    return e === null ? null : getComputedStyle(e).stroke;
  }, 役割);
  expect(s, `${対象} に区切り線が無い`).not.toBeNull();
  return s!;
}

/**
 * `--d-text-secondary` を別の色に差し替えて、 線が追随した色を返す。
 *
 * **値の一致では配線を確かめられない**。 変数と同じ色を直接書けば計算後の値は一致するので、
 * 「繋がっている」 と「たまたま同じ色」 を区別できない (review 指摘)。 値を比べる形は
 * 仮の要素をどこに置くかで解決の文脈も変わり、 正しい配線を誤って落とす形も持っていた。
 *
 * **変数を動かして線が動くかを見る**。 繋がっていれば追随し、 直接書いてあれば動かない。
 * 差し替えは `html` の inline に置く = 明暗どちらの宣言よりも強いので、 どちらの表示でも効く。
 */
async function 差し替えて追随を見る(page: Page, 色: string): Promise<string> {
  await page.evaluate(
    ({ sel, c }) => {
      document.documentElement.style.setProperty("--d-text-secondary", c);
      void (document.querySelector(sel) as SVGElement | null)?.getBoundingClientRect();
    },
    { sel: 役割, c: 色 },
  );
  const 後 = await 線の色(page);
  await page.evaluate(() => document.documentElement.style.removeProperty("--d-text-secondary"));
  return 後;
}

test("表の区切り線が表示ごとの字の色に繋がっている", async ({ page }) => {
  const 印 = "rgb(1, 2, 3)";

  await 開く(page, false);
  const 明 = await 線の色(page);
  expect(
    await 差し替えて追随を見る(page, 印),
    "明るい画面で `--d-text-secondary` を動かしても区切り線が追随しない (色を直接書いている)",
  ).toEqual(印);

  await 開く(page, true);
  const 暗 = await 線の色(page);
  expect(
    await 差し替えて追随を見る(page, 印),
    "暗い画面で `--d-text-secondary` を動かしても区切り線が追随しない (色を直接書いている)",
  ).toEqual(印);

  // 繋がっていても、 明暗で同じ値なら表示ごとに変わっていない
  expect(暗, `明暗で区切り線の色が同じ (${明})`).not.toEqual(明);
});
