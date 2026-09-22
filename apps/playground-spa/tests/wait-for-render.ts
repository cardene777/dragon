import type { Page } from "@playwright/test";

/**
 * 描き終わりを待つ (#2458)。
 *
 * 固定の待ち時間 (`waitForTimeout`) は、一式で回した時の負荷で足りなくなる。
 * 足りないと **空の値を測る** ことになり、検査は「本文が空」「種類が `null`」 としか言わない。
 * 読んだ人は画面が壊れたのか測るのが早かったのかを区別できず、単独で回し直すことになる
 * (実測 = 863 件の一式で 2 件が落ち、単独では 89 件すべて通った)。
 *
 * ここは **そうなるはずの形になるまで** 待つ。 なったらすぐ返るので、待ち時間の合計は短くなる。
 * 待つ形は呼ぶ側が決める (物が出ること / 目標の形に揃うこと / 触った分だけ動くこと)。
 *
 * ## 待っても出なかった時は、待った時間と対象を書いて落とす
 *
 * `waitForFunction` の既定の文は「timeout 30000ms exceeded」 としか言わない。
 * 何を待っていたかを書かないと、落ちた時に直す先が分からない。
 *
 * 落ちた時の言い方は呼ぶ側が選ぶ。 出るのを待つ経路は「出ない」、
 * 既に出ている物が目標の形になるのを待つ経路は「揃わない」 のように、
 * **判定 (`expect`) が落ちた時の文と読み分けられる語** を渡す (#2466)。
 *
 * ## 全部を置き換えてはいない
 *
 * この repo の検査には固定の待ち時間がまだ数百箇所残る (実数は `grep waitForTimeout tests` が
 * SSOT で、ここには書かない = 書くと片方だけ古くなる)。 一度に移すと、
 * 待つ対象を取り違えた検査が黙って素通りする形を大量に作る。
 * **実際に落ちた経路から移す**。
 */
export async function 描き終わりを待つ<渡す物>(
  page: Page,
  何を: string,
  判定: (渡す: 渡す物) => boolean,
  渡す: 渡す物,
  お好み: { 上限ミリ秒?: number; 出ない時の言い方?: string } = {},
): Promise<number> {
  const 上限ミリ秒 = お好み.上限ミリ秒 ?? 20_000;
  const 始め = Date.now();
  try {
    // 判定は browser 側で動くので、外の変数を読めない。 使う値は `渡す` に載せる。
    // 数 1 つで足りる呼び手 (本文の下限 / 箱の下限) と、選択子と目標をまとめて渡す呼び手
    // (編集画面の収まり具合、 #2466) が居るので、中身の型は呼ぶ側が決める。
    //
    // playwright は引数を `Unboxed<T>` (`JSHandle` を剥がした型) で受け取るため、
    // 呼ぶ側の型 1 つでは一致しない。 ここへ来る値は JSON にできる物だけなので、
    // 境界で 1 度だけ合わせる
    const 中で動かす = 判定 as unknown as (渡す: unknown) => boolean;
    await page.waitForFunction(中で動かす, 渡す as unknown, { timeout: 上限ミリ秒, polling: 100 });
  } catch {
    const 待った = ((Date.now() - 始め) / 1000).toFixed(1);
    throw new Error(
      `${何を} が ${待った} 秒待っても${お好み.出ない時の言い方 ?? "出ない"}。` +
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

/**
 * 編集画面の位置合わせが落ち着くまで待つ (#2476)。
 *
 * 編集画面は図を読んでから枠に収めるまでに 3 度位置を計算し直す
 * (`CdlEditor` の初回合わせが描画の直後と 100ms 後と 400ms 後に走る)。
 * 合わせ終わる前に測ると、**その後の合わせ直しが測った点と掴んで引いた分を捨てる**。
 *
 * 最後の 1 回より長く動かないことを合わせ終わりとみなす。
 * 位置が動くたびに数え直すので、一式で回して合わせ直しが遅れた回にも付いていく。
 * 実装側の 400ms を変える時はここも変える。
 *
 * **箱の数は見ない**。 順序図は 1 枚の板として描かれて箱を 1 つも持たないので
 * (#1466)、箱を待つと図種によって永久に返らない。 動く中身の矩形だけで見る。
 */
export async function 位置が落ち着くまで待つ(
  page: Page,
  画面: string,
  窓 = 600,
): Promise<number> {
  return 描き終わりを待つ(
    page,
    `${画面} の位置`,
    (指す: { 中身: string; 窓: number; 鍵: string }) => {
      const 覚え書き = window as unknown as Record<
        string,
        { 位置: string; 時刻: number } | undefined
      >;
      const 絵 = document.querySelector(指す.中身)?.getBoundingClientRect();
      if (!絵 || 絵.width === 0 || 絵.height === 0) {
        覚え書き[指す.鍵] = undefined;
        return false;
      }
      const いま = `${Math.round(絵.left)},${Math.round(絵.top)},${Math.round(絵.width)}`;
      const 前 = 覚え書き[指す.鍵];
      if (前 === undefined || 前.位置 !== いま) {
        覚え書き[指す.鍵] = { 位置: いま, 時刻: Date.now() };
        return false;
      }
      return Date.now() - 前.時刻 >= 指す.窓;
    },
    { 中身: ".v4-editor-pan", 窓, 鍵: "#2476の覚え書き" },
    { 出ない時の言い方: "落ち着かない" },
  );
}

/**
 * 見本の一覧が組み終わるまで待つ (#2488)。
 *
 * 一覧を開いてから行を押す検査は、決め打ちの 800 ミリ秒だけ待っていた。
 * 押す側は要素が動かなくなるまで待つため、一覧がまだ組み替わっていると待ち続ける。
 * 束が大きいほど描き終わりが遅れ、押す所で 30 秒待ち切って落ちる
 * (実測 = 194 件の束で 2 件が落ち、165 件では全件通った)。
 *
 * **時間を伸ばす形では直らない**。 束の大きさで必要な時間が変わるので、
 * どの数を選んでも別の束で足りなくなる。
 *
 * 行の数と先頭の行の位置の両方を見る。 数だけだと、行が出揃ってから位置が動く間に押してしまう。
 * 位置だけだと、行が 1 つも無い間も「動いていない」 とみなす。
 */
export async function 一覧が落ち着くまで待つ(
  page: Page,
  画面: string,
  窓 = 600,
): Promise<number> {
  return 描き終わりを待つ(
    page,
    `${画面} の一覧`,
    (指す: { 行: string; 窓: number; 鍵: string }) => {
      const 覚え書き = window as unknown as Record<
        string,
        { 形: string; 時刻: number } | undefined
      >;
      const 行 = document.querySelectorAll(指す.行);
      const 先頭 = 行[0]?.getBoundingClientRect();
      if (行.length === 0 || !先頭 || 先頭.height === 0) {
        覚え書き[指す.鍵] = undefined;
        return false;
      }
      const いま = `${行.length},${Math.round(先頭.top)},${Math.round(先頭.height)}`;
      const 前 = 覚え書き[指す.鍵];
      if (前 === undefined || 前.形 !== いま) {
        覚え書き[指す.鍵] = { 形: いま, 時刻: Date.now() };
        return false;
      }
      return Date.now() - 前.時刻 >= 指す.窓;
    },
    { 行: ".catalog-list .catalog-list-item", 窓, 鍵: "#2488の覚え書き" },
    { 出ない時の言い方: "落ち着かない" },
  );
}
