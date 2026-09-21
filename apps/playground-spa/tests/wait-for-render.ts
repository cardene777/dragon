import type { Page } from "@playwright/test";

/**
 * 描き終わりを待つ (#2458)。
 *
 * 固定の待ち時間 (`waitForTimeout`) は、一式で回した時の負荷で足りなくなる。
 * 足りないと **空の値を測る** ことになり、検査は「本文が空」「種類が `null`」 としか言わない。
 * 読んだ人は画面が壊れたのか測るのが早かったのかを区別できず、単独で回し直すことになる
 * (実測 = 863 件の一式で 2 件が落ち、単独では 89 件すべて通った)。
 *
 * ここは **出るはずの物が出るまで** 待つ。 出たらすぐ返るので、待ち時間の合計は短くなる。
 *
 * ## 待っても出なかった時は、待った時間と対象を書いて落とす
 *
 * `waitForFunction` の既定の文は「timeout 30000ms exceeded」 としか言わない。
 * 何を待っていたかを書かないと、落ちた時に直す先が分からない。
 *
 * ## 全部を置き換えてはいない
 *
 * この repo の検査には固定の待ち時間が 541 箇所ある。 一度に移すと、
 * 待つ対象を取り違えた検査が黙って素通りする形を大量に作る。
 * **実際に落ちた経路から移す**。
 */
export async function 描き終わりを待つ(
  page: Page,
  何を: string,
  判定: (下限: number) => boolean,
  下限: number,
  上限ミリ秒 = 20_000,
): Promise<number> {
  const 始め = Date.now();
  try {
    // 判定は browser 側で動くので、外の変数を読めない。 使う数は `下限` で渡す。
    // いまの呼び手はどちらも数 1 つで足りる。 別の形が要る時に広げる
    await page.waitForFunction(判定, 下限, { timeout: 上限ミリ秒, polling: 100 });
  } catch {
    const 待った = ((Date.now() - 始め) / 1000).toFixed(1);
    throw new Error(
      `${何を} が ${待った} 秒待っても出ない。` +
        ` 画面が出ていないか、この検査が待つ対象を取り違えている`,
    );
  }
  return Date.now() - 始め;
}

/**
 * 本文が出るまで待つ。 真っ白な画面を測らないため。
 *
 * 下限は **呼ぶ側の判定と同じ値を渡す**。 待つ側だけ緩いと、
 * 待ち終わってから判定で落ちる = 待った意味が消える。
 */
export async function 本文が出るまで待つ(page: Page, 画面: string, 下限: number): Promise<number> {
  return 描き終わりを待つ(
    page,
    `${画面} の本文 (${下限} 文字より多く)`,
    (n) => (document.body.innerText ?? "").trim().length > n,
    下限,
  );
}

/** 図の箱が出るまで待つ。 描き終わる前に種類を読むと `null` が返る */
export async function 図の箱が出るまで待つ(page: Page, 画面: string, 下限 = 1): Promise<number> {
  return 描き終わりを待つ(
    page,
    `${画面} の図の箱 (${下限} 個以上)`,
    (n) => document.querySelectorAll("svg [data-cdl-node]").length >= n,
    下限,
  );
}
