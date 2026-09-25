import type { Page } from "@playwright/test";

/**
 * 狭い画面で中身を隠している「開く口」 (#2545)。
 *
 * 携帯の幅では、帯の行き先も編集画面の脇の板も画面の外に置かれる。 押して初めて出てくる
 * ものを測らないと、**開けば届くものが「無い」 側に数えられる** (#2541 の測定で、編集画面の
 * 脇の板を押さずに数えて 31 件の偽の落ちを出した)。 逆に開いた面は幅いっぱいに広がるので、
 * はみ出しがいちばん出やすい形でもある。
 *
 * ## 一覧をここ 1 か所で持つ
 *
 * 押す検査は増える一方なので、同じ選び方を各 file に書くと片方だけ直った時に、直さなかった
 * 側が黙って閉じた状態しか測らなくなる。 落ちずに通るので気付けない。
 * 読んでいる file は `開いた状態ごとに` を import している側が SSOT (数はここに書かない)。
 *
 * ## 導く形にはしない
 *
 * `main.tsx` の道筋と違って導く元が無い (画面の中の部品で、押すと何が出るかは実装ごと)。
 * 代わりに **選び方が実物と合っていること** を検査で押さえる = 古くなると `count()` が 0 に
 * なり、押す処理が黙って何もしなくなる。
 */
export const 開く口 = [
  {
    選び方: ".v4-nav-menu-btn",
    名: "帯の折りたたみ",
    /** この口を持つ画面。 どの道筋でも帯は出る */
    出る道筋: "catalog/presets",
  },
  {
    選び方: '[data-testid="editor-side-toggle"]',
    名: "編集画面の脇の板",
    出る道筋: "editor",
  },
] as const;

/** 押した後に中身が動き切るまでの待ち。 面は 140ms で滑り込む (`header.css`) */
const 開くのを待つ = 700;
const 閉じるのを待つ = 400;

/**
 * 閉じるのは `Escape`。 **同じ口をもう 1 度押す形は使えない**。
 *
 * 編集画面の脇の板は開くと口の上に覆い被さり、押し直そうとすると時間切れになる
 * (実測 = 口の中心に在るものが `button.v4-editor-side-new` に変わる)。 帯の面も脇の板も
 * `Escape` で閉じるので、こちらを唯一の閉じ方にする。
 */
async function 閉じる(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(閉じるのを待つ);
}

/**
 * その口が押せる状態に戻ったか。
 *
 * 見えているか (`isVisible`) では足りない = 覆われていても CSS 上は見えている。
 * 口の中心に在るものが口そのものか中の部品なら、覆いが退いたと判る。
 */
async function 押せる状態に戻ったか(page: Page, 選び方: string): Promise<boolean> {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el === null) return false;
    const r = el.getBoundingClientRect();
    const 上 = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return 上 !== null && (上 === el || el.contains(上));
  }, 選び方);
}

/**
 * その画面が持つ開く口を 1 つずつ開き、開いた状態で `測る` を走らせる。
 *
 * 押す → 測る → `Escape` で閉じる、を口ごとに繰り返す。 2 つ同時に開いた状態は作らない
 * (帯の面と脇の板は画面の同じ所を占めるので、重ねて測っても読める結果にならない)。
 * 閉じ損ねたら例外にして落とす = 次の口の測定が 2 つ重なった状態のものになるため。
 *
 * 口を持たない画面では空の配列を返す。 **呼ぶ側は「0 件だから開く口が無い」 と
 * 「0 件だから選び方が古い」 を区別できない** ので、選び方の生死は § 導く形にはしない が
 * 書いた別の検査が見る。
 */
export async function 開いた状態ごとに<T>(
  page: Page,
  測る: () => Promise<T>,
): Promise<{ 名: string; 値: T }[]> {
  const 出: { 名: string; 値: T }[] = [];
  for (const 口 of 開く口) {
    const 場所 = page.locator(口.選び方).first();
    if ((await page.locator(口.選び方).count()) === 0) continue;
    if (!(await 場所.isVisible())) continue;
    await 場所.click();
    await page.waitForTimeout(開くのを待つ);
    出.push({ 名: 口.名, 値: await 測る() });
    await 閉じる(page);
    // 閉じ損ねたまま次へ進むと、次の口を開いた状態が 2 つ重なった状態になる。
    // 黙って進めると測った値が何の状態のものか判らなくなるので、ここで落とす
    if (!(await 押せる状態に戻ったか(page, 口.選び方))) {
      throw new Error(`${口.名}を閉じられなかった (Escape の後も口が覆われている)`);
    }
  }
  return 出;
}
