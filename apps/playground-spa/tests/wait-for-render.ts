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
 * 形が窓の間だけ変わらなくなるまで待つ (#2496)。
 *
 * ## なぜ `描き終わりを待つ` と分けるか
 *
 * `描き終わりを待つ` は「そうなるはずの形か」 を 1 回の評価で答えられる待ち方で、
 * 前回の評価を覚えておく必要が無い。
 * 落ち着きを見る待ち方は前回と比べるため、**評価をまたいで値を持つ置き場が要る**。
 *
 * `page.waitForFunction` に渡す関数は browser の中で動いて外の変数を読めないので、
 * そこで比べる形にすると前回の値を `window` に預けることになる。
 * 預けるには鍵が要り、鍵は呼び手ごとに増える。 実際に 3 つ増え、
 * うち 1 つは検査の file に置いたために画面の字として拾われ、2 度の後始末を生んだ
 * (#2486 で登録し、#2492 で助けの側へ移して登録を外した)。
 * 同じ 8 行を写すうちに欄の名前も割れた (`位置` と `形`)。
 *
 * **比べる所を呼ぶ側に移すと、預け先ごと消える**。 中で動かす関数は形を表す字を返すだけ、
 * 前回との比較と窓の判定はここが持つ。
 *
 * ## まだ測れない時は `null` を返す
 *
 * 図が描かれる前は矩形の幅が 0 で、その値を「形」 として覚えると
 * **描かれていない状態で落ち着いたことになる**。 測れない間は `null` を返し、
 * 覚えている形を捨てて数え直す。
 *
 * @param 形を出す browser の中で動く。 形を表す字を返す。 まだ測れない時は `null`
 * @param 窓 同じ字がこの時間だけ続いたら落ち着いたとみなす (ミリ秒)
 */
async function 繰り返し測る<渡す物, 測った物>(
  page: Page,
  何を: string,
  測る: (渡す: 渡す物) => 測った物 | null,
  渡す: 渡す物,
  見極め: (いま: 測った物 | null) => { 終わり: true; 値: 測った物 } | { 終わり: false },
  お好み: { 上限ミリ秒?: number; 出ない時の言い方?: string },
): Promise<{ 値: 測った物; 待った: number }> {
  const 上限ミリ秒 = お好み.上限ミリ秒 ?? 20_000;
  const 始め = Date.now();
  // 型合わせの理由は `描き終わりを待つ` と同じ (playwright は `Unboxed<T>` で受け取る)
  const 中で動かす = 測る as unknown as (渡す: unknown) => 測った物 | null;

  while (Date.now() - 始め < 上限ミリ秒) {
    const 判断 = 見極め(await page.evaluate(中で動かす, 渡す as unknown));
    if (判断.終わり) return { 値: 判断.値, 待った: Date.now() - 始め };
    // `描き終わりを待つ` の `polling: 100` と同じ間隔で測る
    await page.waitForTimeout(100);
  }

  const 待った = ((Date.now() - 始め) / 1000).toFixed(1);
  throw new Error(
    `${何を} が ${待った} 秒待っても${お好み.出ない時の言い方 ?? "落ち着かない"}。` +
      ` 画面が出ていないか、この検査が待つ対象を取り違えている`,
  );
}

export async function 形が落ち着くまで待つ<渡す物>(
  page: Page,
  何を: string,
  形を出す: (渡す: 渡す物) => string | null,
  渡す: 渡す物,
  お好み: { 窓?: number; 上限ミリ秒?: number; 出ない時の言い方?: string } = {},
): Promise<number> {
  const 窓 = お好み.窓 ?? 600;
  let 前: { 形: string; 時刻: number } | undefined;

  const { 待った } = await 繰り返し測る(page, 何を, 形を出す, 渡す, (いま) => {
    if (いま === null) {
      前 = undefined;
      return { 終わり: false };
    }
    if (前 === undefined || 前.形 !== いま) {
      前 = { 形: いま, 時刻: Date.now() };
      return { 終わり: false };
    }
    return Date.now() - 前.時刻 >= 窓 ? { 終わり: true, 値: いま } : { 終わり: false };
  }, お好み);

  return 待った;
}

/**
 * 測れる状態になった瞬間の値を受け取る (#2496)。
 *
 * 待つ側と測る側を分けられない時に使う。 分けると、待ち終わってから測るまでの間に
 * 画面が次の状態へ進む (実測 = 矢印は 5 秒で伸び切り、7 秒でまた短い、#2482)。
 *
 * **落ち着きは見ない**。 測れた 1 回目の値をそのまま返す。
 * 同じ値が 2 度続くことを求めると、測るたびに動く画面では永久に揃わない。
 */
export async function 測れた値を受け取る<渡す物, 測った物>(
  page: Page,
  何を: string,
  測る: (渡す: 渡す物) => 測った物 | null,
  渡す: 渡す物,
  お好み: { 上限ミリ秒?: number; 出ない時の言い方?: string } = {},
): Promise<測った物> {
  const { 値 } = await 繰り返し測る(
    page,
    何を,
    測る,
    渡す,
    (いま) => (いま === null ? { 終わり: false } : { 終わり: true, 値: いま }),
    { 出ない時の言い方: "測れない", ...お好み },
  );
  return 値;
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
  return 形が落ち着くまで待つ(
    page,
    `${画面} の位置`,
    (指す: { 中身: string }) => {
      const 絵 = document.querySelector(指す.中身)?.getBoundingClientRect();
      if (!絵 || 絵.width === 0 || 絵.height === 0) return null;
      return `${Math.round(絵.left)},${Math.round(絵.top)},${Math.round(絵.width)}`;
    },
    { 中身: ".v4-editor-pan" },
    { 窓 },
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
  return 形が落ち着くまで待つ(
    page,
    `${画面} の一覧`,
    (指す: { 行: string }) => {
      const 行 = document.querySelectorAll(指す.行);
      const 先頭 = 行[0]?.getBoundingClientRect();
      if (行.length === 0 || !先頭 || 先頭.height === 0) return null;
      return `${行.length},${Math.round(先頭.top)},${Math.round(先頭.height)}`;
    },
    { 行: ".catalog-list .catalog-list-item" },
    { 窓 },
  );
}

/** 読み取り値と縦の矢印の重なりを数えた結果 (#2482 / #2492) */
export interface 重なりの数え {
  /** 箱の上に出た読み取り値 (`5 / 10` の形) の個数 */
  読み取り値: number;
  /** まっすぐ 1 本の縦の矢印の本数 */
  縦の矢印: number;
  /** 読み取り値の矩形と縦の矢印の矩形が重なった組の数 */
  重なり: number;
  /** 重なった組の中身 (落ちた時に何と何かを言うため) */
  中身: string[];
  /** 線と下地の対が揃わず、縦かどうかを判定できなかった組。 0 に潰さず数える */
  読めない組: number;
}

/**
 * 矢印が伸び切った瞬間に、読み取り値との重なりを数える (#2482)。
 *
 * ## なぜ待つ側と数える側を分けないか
 *
 * 矢印は繰り返し伸びて戻る (実測 = 5 秒で伸び切り、7 秒でまた短い)。
 * 伸び切るのを待ってから測ると、その間に線が戻る。
 * **伸び切ったと判定した評価の中でそのまま測る** 必要がある。
 *
 * ## 伸び切りの見分け方
 *
 * 線 (`edge-line`) は描いている途中の形を持ち、下地 (`edge-glow`) は最初から最終の形を持つ。
 * 2 つの道筋が一致したら伸び切り。
 *
 * **終点だけでは足りない**。 曲がった矢印 (`Q` を含む道筋) の終点を `M x y L x y` の形で
 * 読めず、2 枚が 20 秒待っても条件を満たさなかった (実際に踏んだ)。
 *
 * ## 測った値は返り値で持ち出す (#2496)
 *
 * かつては伸び切りを待つ関数の中で測り、結果を `window` に預けて後から読み出していた。
 * 預けるには鍵が要り、その鍵を検査の file に置いたために画面の字として拾われ、
 * 2 度の後始末を生んだ (#2486 で登録し、#2492 で助けの側へ移して登録を外した)。
 * いまは測った値をそのまま返すので、預け先も鍵も要らない。
 */
export async function 重なりを数える(page: Page, 画面: string): Promise<重なりの数え> {
  return 測れた値を受け取る<Record<string, never>, 重なりの数え>(
    page,
    `${画面} の矢印`,
    () => {
      const svg = document.querySelector("[data-cdl-node]")?.closest("svg");
      if (!svg) return null;

      const 組 = [...svg.querySelectorAll("g[data-cdl-edge]")];
      if (組.length === 0) return null;

      const 縦の線: Element[] = [];
      let 読めない組 = 0;
      for (const g of 組) {
        const 線 = g.querySelector('[data-cdl-role="edge-line"]');
        const 下地 = g.querySelector('[data-cdl-role="edge-glow"]');
        if (!線 || !下地) {
          読めない組 += 1;
          continue;
        }
        const 今 = (線.getAttribute("d") ?? "").replace(/\s+/g, " ").trim();
        const 元 = (下地.getAttribute("d") ?? "").replace(/\s+/g, " ").trim();
        if (今 === "" || 元 === "" || 今 !== 元) return null;
        const m = 元.match(/^M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+)$/);
        if (
          m &&
          Math.abs(Number(m[3]) - Number(m[1])) < 1 &&
          Math.abs(Number(m[4]) - Number(m[2])) > 1
        ) {
          縦の線.push(線);
        }
      }

      const 読み取り値 = [...svg.querySelectorAll("text")].filter((t) =>
        /^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/.test(t.textContent ?? ""),
      );

      const 重なる = (a: DOMRect, b: DOMRect): boolean =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

      const 中身: string[] = [];
      let 重なり = 0;
      for (const 字 of 読み取り値) {
        const r = 字.getBoundingClientRect();
        for (const 線 of 縦の線) {
          const s = 線.getBoundingClientRect();
          // 縦の線は幅が 0 に近い。 そのままでは矩形の重なりが成立しないので、線の太さぶん広げる
          const 太さ = new DOMRect(s.left - 2, s.top, Math.max(s.width, 4), s.height);
          if (重なる(r, 太さ)) {
            重なり += 1;
            中身.push(`${(字.textContent ?? "").trim()} と 縦の矢印`);
          }
        }
      }

      return { 読み取り値: 読み取り値.length, 縦の矢印: 縦の線.length, 重なり, 中身, 読めない組 };
    },
    {},
    { 出ない時の言い方: "伸び切らない" },
  );
}
