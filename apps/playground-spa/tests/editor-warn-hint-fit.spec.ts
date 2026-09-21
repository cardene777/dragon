/**
 * 注意の知らせ文が帯の中に収まって最後まで読める (#2437)。
 *
 * 記法欄の下に出る帯は、件数の札と、何をすればよいかの文と、まとめて直す押しボタンを持つ。
 * 3 つを横一列に並べると、記法欄の幅 340px のうち札と押しボタンで 231px を取るため
 * 文に 64px しか残らず、42 文字が 5 文字ずつ 9 行に折れる。
 * 帯は高さの上限を持つので、折れた分の大半が隠れて読めない。
 *
 * ## 何を測るか
 *
 * 折れる行数と、札 / 文 / 押しボタンの段が帯の見える範囲に収まっているかの 2 つ。
 * **どちらも描かれた後の矩形から出す** = 置き方 (段にするか列にするか) を直接見ない。
 * 置き方を見ると、別の直し方 (文を短くする / 幅を広げる) で直した時に落ちる。
 *
 * **帯そのものが巻き取ることは咎めない**。 帯は注意の一覧も持ち、件数が増えれば巻き取るのが
 * 正しい (`max-height: 180px` + `overflow-y: auto`)。 咎めるのは **文を持つ段が
 * 見える範囲から出ること** で、そこが出ると開いた瞬間に文の続きが読めない。
 *
 * ## 広い窓も測る
 *
 * 1920x1080 では今でも 3 行に収まっている。 狭い窓だけ見て直すと、
 * 広い窓で段を増やして帯を無駄に高くする形が素通りする。
 */
import { test, expect, type Page } from "@playwright/test";

/** 知らせの文が折れてよい行数 (42 文字が幅 307px に 2 行で入る) */
const 行数の上限 = 3;

/**
 * 1 件の注意の説明が折れてよい行数。
 *
 * 99 文字が幅 307px なら 3 行、名札の横に潰れた幅 163px なら 6 行になる (窓 1440x900 で実測)。
 * 4 に置くと 2 つを分けられる。 6 に置くと潰れた形も通ってしまい、検査が空振りする
 * (実際に 1 度空振りさせて確かめた)。
 */
const 説明の行数の上限 = 4;

type 測定 = {
  字数: number;
  文の幅: number;
  行数: number;
  段の下端: number;
  帯の見える下端: number;
  押しボタンの右: number;
  帯の右: number;
  説明の字数: number;
  説明の幅: number;
  説明の行数: number;
};

async function 測る(page: Page): Promise<測定> {
  const 出た = await page.evaluate(() => {
    const 文 = document.querySelector(".v4-editor-warnings-hint");
    const 帯 = document.querySelector(".v4-editor-warnings");
    const 段 = document.querySelector(".v4-editor-warnings-head");
    const 説明 = document.querySelector(".v4-editor-warning-detail");
    const 押しボタン = document.querySelector(".v4-editor-warnings-apply");
    if (
      !(説明 instanceof HTMLElement) ||
      !(文 instanceof HTMLElement) ||
      !(帯 instanceof HTMLElement) ||
      !(段 instanceof HTMLElement) ||
      !(押しボタン instanceof HTMLElement)
    ) {
      return null;
    }
    const 書式 = getComputedStyle(文);
    // `line-height: normal` は数で返らないので、字の大きさから見積もる
    const 行の高さ = Number.parseFloat(書式.lineHeight) || Number.parseFloat(書式.fontSize) * 1.2;
    const 文の矩形 = 文.getBoundingClientRect();
    return {
      字数: (文.textContent ?? "").length,
      文の幅: Math.round(文の矩形.width),
      行数: Math.round(文の矩形.height / 行の高さ),
      段の下端: Math.round(段.getBoundingClientRect().bottom),
      帯の見える下端: Math.round(帯.getBoundingClientRect().top + 帯.clientHeight),
      押しボタンの右: Math.round(押しボタン.getBoundingClientRect().right),
      帯の右: Math.round(帯.getBoundingClientRect().right),
      説明の字数: (説明.textContent ?? "").length,
      説明の幅: Math.round(説明.getBoundingClientRect().width),
      説明の行数: Math.round(
        説明.getBoundingClientRect().height /
          (Number.parseFloat(getComputedStyle(説明).lineHeight) ||
            Number.parseFloat(getComputedStyle(説明).fontSize) * 1.2),
      ),
    };
  });
  if (出た === null) throw new Error("知らせの帯が出ていない");
  return 出た;
}

async function 注意の出る見本を開く(page: Page, 窓: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(窓);
  await page.goto("editor#preset=flow", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await expect(page.locator(".v4-editor-warnings-hint")).toHaveCount(1);
}

for (const 窓 of [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`窓 ${窓.width}x${窓.height} で知らせの文が帯に収まる (#2437)`, async ({ page }) => {
    await 注意の出る見本を開く(page, 窓);
    const m = await 測る(page);

    // 空振り防止。 短い文だと何行でも収まってしまう
    expect(m.字数, "知らせの文が短すぎて折り返しを見られない").toBeGreaterThan(20);

    expect(m.行数, `知らせの文が ${m.行数} 行に折れている (幅 ${m.文の幅}px)`).toBeLessThanOrEqual(
      行数の上限,
    );
    const 隠れた = m.段の下端 - m.帯の見える下端;
    expect(隠れた, `文を持つ段が帯の見える範囲から ${隠れた}px 出ている`).toBeLessThanOrEqual(0);

    // 1 件の注意の説明も同じ潰れ方をしていた (#2437 に吸収)。 軸の名札 (134px) を横に置くと
    // 説明に 163px しか残らず、118 文字が 12 行に折れる
    expect(m.説明の字数, "注意の説明が短すぎて折り返しを見られない").toBeGreaterThan(50);
    expect(
      m.説明の行数,
      `注意の説明が ${m.説明の行数} 行に折れている (幅 ${m.説明の幅}px)`,
    ).toBeLessThanOrEqual(説明の行数の上限);
  });
}

test("まとめて直す押しボタンが帯の右端に残る (#2437)", async ({ page }) => {
  // 段に分けた時に押しボタンが左へ寄ると、押す位置が手の覚えた場所とずれる
  await 注意の出る見本を開く(page, { width: 1440, height: 900 });
  const m = await 測る(page);
  // 帯の内側の余白 (14px) ぶんは離れる
  expect(m.帯の右 - m.押しボタンの右, "押しボタンが帯の右端から離れている").toBeLessThanOrEqual(20);
});
