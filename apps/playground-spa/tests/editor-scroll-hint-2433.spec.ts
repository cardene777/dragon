/**
 * 編集画面でも続きが隠れている側に手がかりを出す (#2433)。
 *
 * 判定そのものは `src/lib/scroll-edges.test.ts` が 3 つの数で見る (#2427)。
 * ここが見るのは **編集画面でその判定が画面に繋がっているか** と、
 * **飾りが図と一緒に動かないか** の 2 つ。
 *
 * ## 編集画面は巻き取らない
 *
 * 見本の頁と拡大表示は `overflow: auto` で巻き取るので、送り具合が `scrollLeft` に出る。
 * 編集画面は `overflow: hidden` の台の中で `.v4-editor-pan` を `transform` で動かすため、
 * **送りは一切発生しない** = `scrollLeft` は常に 0 のまま。
 * だから位置を動かす手段も、測る対象も違う。
 *
 * | | 見本の頁 / 拡大表示 | 編集画面 |
 * |---|---|---|
 * | 動かす手段 | `scrollLeft` を書く | 台の上で掴んで引く |
 * | 測る対象 | 巻き取る要素の 3 つの数 | 台と動く中身の、画面上の矩形 |
 *
 * 測るのは実際に描かれた矩形なので、図の左の余白も倍率も込みで出る。
 *
 * ## 待ち方 (#2466)
 *
 * 開いてから 1.5 秒待って測る形だった間、一式で回した時だけ 1 件が落ちていた。
 * 編集画面は図を読んでから枠に収めるまでに何度か位置を計算し直すので、
 * 負荷がかかると収める前の位置を読む。
 *
 * **目標が揃い、そのまま落ち着くまで待つ**。 揃った瞬間に返すと、その後の合わせ直しが
 * 掴んで引いた分を元に戻す (実測 = 218px 引いたのに位置が変わらないまま 5 秒経った)。
 *
 * 揃わない時は「揃わない」 と書いて落ちるので、判定 (`expect`) が落ちた時の文と読み分けられる。
 * 画面が壊れたのか測るのが早かったのかを、落ちた文から区別できる。
 *
 * 目標を待つ形にすると、空振り防止の判定も待つ側へ移る (枠に入らないはずの図が
 * 入ってしまう回は、目標に揃わないまま時間切れになる)。
 * 待つ側が常に通る形に壊れても気付けるよう、末尾に植え込みの対照を 1 件置く。
 */
import { test, expect, type Page } from "@playwright/test";
import { 描き終わりを待つ } from "./wait-for-render";

const 台 = ".v4-editor-stage";
const 中身 = ".v4-editor-pan";

/**
 * 合わせ終わりを待つ窓 (ミリ秒)。
 *
 * 編集画面は図を読んでから枠に収めるまでに 3 度位置を計算し直す
 * (`CdlEditor` の初回合わせは描画の直後と 100ms 後と 400ms 後に走る)。
 * **最後の 1 回より長く動かないこと** を合わせ終わりとみなす。
 *
 * 位置が動くたびに数え直すので、一式で回して合わせ直しが遅れた回にも付いていく。
 * 実装側の 400ms を変える時はここも変える。
 */
const 落ち着き窓 = 600;

/**
 * 収まり具合が目標に揃い、そのまま落ち着いたかを画面の中で見る (#2466)。
 *
 * 固定の待ち時間で測ると、一式で回した時の負荷で収める前の位置を読む。
 * 目標が揃った瞬間に返してもいけない = その後の合わせ直しが、掴んで引いた分を元に戻す
 * (実測 = 218px 引いたのに位置が変わらないまま 5 秒経った)。
 *
 * **箱が出ていることを先に見る**。 図が描かれる前は動く中身の幅が 0 で、
 * `余り` が大きな負の数になる = 枠に入る側の目標が空の画面で成立してしまう。
 *
 * 判定は browser 側で動いて外の変数を読めないため、選択子も目標も引数で渡す。
 * 前回見た位置は画面側に預ける (呼び出しをまたいで持てる置き場がここしかない)。
 */
const 収まり具合 = (指す: {
  台: string;
  中身: string;
  枠に入らない: boolean;
  窓: number;
  鍵: string;
}): boolean => {
  const 覚え書き = window as unknown as Record<string, { 位置: string; 時刻: number } | undefined>;
  const 忘れる = (): boolean => {
    覚え書き[指す.鍵] = undefined;
    return false;
  };

  const 枠 = document.querySelector(指す.台)?.getBoundingClientRect();
  const 絵 = document.querySelector(指す.中身)?.getBoundingClientRect();
  if (!枠 || !絵 || 絵.width === 0) return 忘れる();
  if (document.querySelectorAll("svg [data-cdl-node]").length === 0) return 忘れる();

  const 余り = 絵.width - 枠.width;
  const 左 = 絵.left - 枠.left;
  // 数は下の `はみ出し` を使う判定と同じ値。 待つ側だけ緩いと、待ち終わってから判定で落ちる
  const 揃った = 指す.枠に入らない ? 余り > 2 && 左 > -2 : 余り <= 1;
  if (!揃った) return 忘れる();

  const いま = `${Math.round(左)},${Math.round(絵.width)}`;
  const 前 = 覚え書き[指す.鍵];
  if (前 === undefined || 前.位置 !== いま) {
    覚え書き[指す.鍵] = { 位置: いま, 時刻: Date.now() };
    return false;
  }
  return Date.now() - 前.時刻 >= 指す.窓;
};

const 端 = (page: Page): Promise<string | null> =>
  page.locator(台).first().getAttribute("data-cdl-more");

/** 台と動く中身の、画面上の矩形から「はみ出している量」 を出す */
async function はみ出し(page: Page): Promise<{ 余り: number; 左: number }> {
  return page.evaluate(
    (指す) => {
      const 枠 = document.querySelector(指す.台)?.getBoundingClientRect();
      const 絵 = document.querySelector(指す.中身)?.getBoundingClientRect();
      if (!枠 || !絵) return { 余り: 0, 左: 0 };
      return { 余り: 絵.width - 枠.width, 左: 絵.left - 枠.left };
    },
    { 台, 中身 },
  );
}

/**
 * 見本を開き、収める処理が目標どおり終わるまで待つ。
 *
 * **ここが空振り防止も兼ねる** (#2466)。 枠に入らないはずの図が入ってしまう回は
 * 目標に揃わないまま時間切れになり、「揃わない」 と書いて落ちる。
 * 判定 (`expect`) の失敗文と読み分けられるので、画面が壊れたのか測るのが早かったのかが分かる。
 */
async function 見本を開く(page: Page, slug: string, 枠に入らない: boolean): Promise<void> {
  await page.goto(`editor#preset=${slug}`, { waitUntil: "networkidle" });
  await 描き終わりを待つ(
    page,
    `見本 ${slug} が${枠に入らない ? "枠に入らない" : "枠に入る"}状態`,
    収まり具合,
    { 台, 中身, 枠に入らない, 窓: 落ち着き窓, 鍵: "#2466の覚え書き" },
    { 出ない時の言い方: "揃わない" },
  );
}

/**
 * 台の上で掴んで、図を横に `量` px 動かす (負なら左へ)。
 *
 * 動いたことを待ってから返す。 固定の待ち時間だと、一式で回した時の負荷で
 * 動く前の位置のまま次の判定へ進む (#2466)。
 */
async function 引く(page: Page, 量: number): Promise<void> {
  const 枠 = await page.locator(台).first().boundingBox();
  if (!枠) throw new Error("台が見つからない");
  const 前 = (await はみ出し(page)).左;
  const y = 枠.y + 枠.height / 2;
  // 引き始めは枠の中央から。 端から始めると、動かす途中で台の外に出て掴んだ手が離れる
  const 始め = 枠.x + 枠.width / 2;
  await page.mouse.move(始め, y);
  await page.mouse.down();
  await page.mouse.move(始め + 量, y, { steps: 4 });
  await page.mouse.up();
  await 描き終わりを待つ(
    page,
    `${Math.round(量)}px 引いた後の図の位置 (引く前は左端から ${Math.round(前)}px)`,
    (指す) => {
      const 枠 = document.querySelector(指す.台)?.getBoundingClientRect();
      const 絵 = document.querySelector(指す.中身)?.getBoundingClientRect();
      if (!枠 || !絵) return false;
      return Math.abs(絵.left - 枠.left - 指す.前) > 1;
    },
    { 台, 中身, 前 },
    { 上限ミリ秒: 5_000, 出ない時の言い方: "変わらない" },
  );
}

test.describe("編集画面の手がかり (#2433)", () => {
  test("枠に入らない図は、動かした位置で手がかりの向きが変わる", async ({ page }) => {
    // 枠に入らない図であることは `見本を開く` が待つ側で見る (揃わなければ「揃わない」 で落ちる)
    await 見本を開く(page, "flow", true);
    const 初め = await はみ出し(page);

    await expect.poll(() => 端(page), { timeout: 4000 }).toBe("右");

    // 半分だけ左へ引くと、左にも右にも続きが残る
    await 引く(page, -Math.round(初め.余り / 2));
    await expect.poll(() => 端(page), { timeout: 2000 }).toBe("両方");

    // 残りを左へ引き切ると、続きは左だけになる
    await 引く(page, -(Math.round(初め.余り / 2) + 10));
    await expect.poll(() => 端(page), { timeout: 2000 }).toBe("左");
  });

  test("飾りを持つ要素そのものが動かない", async ({ page }) => {
    // 飾りを図と同じ要素に付けると、図と一緒に動いて隠れている端を指さなくなる。
    // **飾りを持つ要素を探してから測る** = 台を名前で指すと、飾りが動く側へ移っても
    // 台は動かないままなので植え込みが素通りする (#2429 で 1 度抜けた)
    await 見本を開く(page, "flow", true);
    await 引く(page, -20);

    const 持ち主 = page.locator("[data-cdl-more]");
    await expect(持ち主, "飾りを持つ要素が 1 つも無い").toHaveCount(1);

    const 測った = await 持ち主.first().evaluate((el) => ({
      送り: el.scrollLeft,
      transform: getComputedStyle(el).transform,
      position: getComputedStyle(el).position,
    }));
    expect(測った.送り, "飾りを持つ要素が送られている").toBe(0);
    expect(測った.transform, "飾りを持つ要素が動かされている (飾りが図と一緒に動く)").toBe("none");
    expect(測った.position, "飾りの位置の基準になっていない").toBe("relative");
  });

  test("枠に入る図には手がかりが付かない", async ({ page }) => {
    // 対照。 付けっぱなしの実装だとここが落ちる。
    // 枠に入る図であることは `見本を開く` が待つ側で見る
    await 見本を開く(page, "topology", false);

    expect(await 端(page)).toBeNull();
  });

  test("目標に揃わない時は、判定の失敗と別の文言で落ちる", async ({ page }) => {
    // 待つ道具そのものの対照 (#2466)。 枠に入らない図を「枠に入る」 側の目標で待たせる。
    // 揃わないまま時間切れになり、`expect` の失敗文とは別の語で落ちることを見る。
    //
    // **この対照が無いと、待つ側が常に true を返す形に壊れても誰も気付かない** =
    // 空振り防止をこの待ちに移した以上、待ちが利いていることを別に見る必要がある。
    await page.goto("editor#preset=flow", { waitUntil: "networkidle" });

    const 文 = await 描き終わりを待つ(
      page,
      "植え込みの目標 (枠に入らない図を、枠に入る側で待つ)",
      収まり具合,
      { 台, 中身, 枠に入らない: false, 窓: 落ち着き窓, 鍵: "#2466の覚え書き" },
      { 上限ミリ秒: 3_000, 出ない時の言い方: "揃わない" },
    ).then(
      () => null,
      (e: Error) => e.message,
    );

    expect(文, "揃わないはずの目標で待ちが通ってしまった (待つ側が空振りしている)").toContain(
      "揃わない",
    );
  });
});
