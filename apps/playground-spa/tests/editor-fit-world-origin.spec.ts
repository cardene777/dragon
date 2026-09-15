import { test, expect, type Page } from "@playwright/test";

/**
 * 枠に収める時、図枠の左上 (`worldOrigin`) を引いて重ねた部品の位置を数えることを見る (#2020)。
 *
 * 図枠 (`viewBox`) は内容の外接矩形なので左上は原点ではない (見本「ログインAPI呼び出し」 の実測 =
 * `-20 68` から始まる)。 重ねる部品は図と同じ world 座標に置かれ、**描く側は図枠の左上を引いてから**
 * 画面の位置を決める (`CdlEditor.tsx` の `left: (p.posX - worldOrigin.x) * diagramK`)。
 * 枠に収める側が同じ数を引かないと、描いた場所と収める計算が図枠の余白のぶんだけ食い違い、
 * 枠に入れたはずの部品が枠から出る。
 *
 * 画面側はこの値を控え (`worldOriginRef`) で読む。 #2020 で控えへ写す時機を
 * 「描いている最中」 から「描き終えた後の効果」 へ移したので、写し漏れると控えが初期値
 * (`0, 0`) のままになり、図枠の左上を引かないのと同じことが起きる。
 *
 * ## 部品を図より上に置く理由
 *
 * 図枠の左上は縦が正 (68) なので、引き忘れた側は部品を **68 world ぶん下にある** と数える。
 * 部品が図の内側にいると、収める範囲は図の外枠で決まるため差が表に出ない
 * (自動配置のまま押した検査は、引き忘れても通った)。 部品を図の上端より上に置くと、
 * 範囲の上端を部品が決めるようになり、引き忘れた分がそのまま枠の外へのはみ出しになる。
 *
 * ## なぜ実ブラウザでしか見られないか
 *
 * 枠に収める計算は、舞台の実寸 (`getBoundingClientRect`) と描かれた SVG の図枠を読む。
 * どちらも実際に描かないと値を持たない。
 */

test.use({ viewport: { width: 1920, height: 1080 } });

/**
 * 図の上に部品を 1 つ置いた本文。
 *
 * 見本「ログインAPI呼び出し」 (編集画面の初期値) に `- over:` の 4 行を足しただけ。
 * 図の本体を変えないのは、図枠の左上を `-20 68` のまま保つため。
 * 部品は本文から抜いてから組み立てるので、足しても図枠は動かない。
 */
const 図の上に部品を置いた本文 = `title: "ログインAPI呼び出し"
type: sequence

actors:
  - 利用者
  - API
  - DB
  - over:
      kind: achievement
      位置: 300,-100

flow:
  - 利用者 -> API: "ログイン要求"
  - API -> DB: "利用者検索"
  - DB -> API: "結果"
  - API -> 利用者: "認証成功" { kind: return }

animation:
  - step: "call" 1.4s
    focus: [利用者, API, "利用者 -> API"]
  - step: "ok" 1.4s
    focus: [利用者, API, "API -> 利用者"]
`;

/** 本文欄の中身を丸ごと書き換える (`editor-yaml-tab.spec.ts` と同じ経路)。 */
async function 本文を書き換える(page: Page, text: string): Promise<void> {
  await page.locator('[data-testid="editor-code-body-cdl"] .cm-content').click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
  await page.waitForTimeout(1500);
}

type 実測 = {
  舞台: { left: number; top: number; right: number; bottom: number };
  図枠: { x: number; y: number };
  図: { top: number };
  部品: Array<{ id: string; left: number; top: number; right: number; bottom: number }>;
};

/** 舞台と図枠と図と部品を同じ回で測る */
async function 測る(page: Page): Promise<実測> {
  return await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="editor-preview-stage"]');
    if (!stage) throw new Error("舞台が無い");
    const svg = stage.querySelector("svg[data-cdl-stage]");
    if (!svg) throw new Error("図の SVG が無い");
    const vb = (svg.getAttribute("viewBox") ?? "0 0 0 0").split(/\s+/).map(Number);
    const s = stage.getBoundingClientRect();
    const parts = [...document.querySelectorAll("[data-overlay-part]")].map((p) => {
      const r = p.getBoundingClientRect();
      return {
        id: p.getAttribute("data-overlay-part") ?? "",
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
      };
    });
    return {
      舞台: { left: s.left, top: s.top, right: s.right, bottom: s.bottom },
      図枠: { x: vb[0] ?? 0, y: vb[1] ?? 0 },
      図: { top: svg.getBoundingClientRect().top },
      部品: parts,
    };
  });
}

test.describe("枠に収める時に図枠の左上を引く (#2020)", () => {
  test("図より上に置いた部品が、枠に収めた後も舞台の中に入る", async ({ page }) => {
    await page.goto("editor", { waitUntil: "networkidle" });
    await page.waitForSelector(".v4-editor-preview svg[data-cdl-stage]", { timeout: 15000 });
    await page.waitForTimeout(800);

    await 本文を書き換える(page, 図の上に部品を置いた本文);

    await page.locator('[data-testid="editor-fit"]').click();
    await page.waitForTimeout(1200);

    const m = await 測る(page);

    // 空振り防止 = 部品が 1 つも無いと以下の loop が 1 度も回らない
    expect(m.部品.length, "部品が 1 つも置けていない (検査が空振りしている)").toBe(1);
    // 前提 1 = 図枠の左上が原点だと、引いても引かなくても同じ値になり何も測れない
    expect(m.図枠.y, "図枠の上端が 0 なので、引く / 引かないの差が縦に出ない").toBeGreaterThan(0);
    // 前提 2 = 部品が図の上端より上にいないと、収める範囲を図が決めてしまい差が出ない
    expect(
      m.部品[0]!.top,
      "部品が図より上にいない (この位置では引き忘れても範囲が変わらない)",
    ).toBeLessThan(m.図.top);

    for (const p of m.部品) {
      expect(p.left, `${p.id} が舞台の左から出た`).toBeGreaterThanOrEqual(m.舞台.left - 1);
      expect(p.top, `${p.id} が舞台の上から出た`).toBeGreaterThanOrEqual(m.舞台.top - 1);
      expect(p.right, `${p.id} が舞台の右から出た`).toBeLessThanOrEqual(m.舞台.right + 1);
      expect(p.bottom, `${p.id} が舞台の下から出た`).toBeLessThanOrEqual(m.舞台.bottom + 1);
    }
  });
});
