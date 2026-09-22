/**
 * 待つ道具そのものの検査 (#2496)。
 *
 * 落ち着くまで待つ仕組みは 3 箇所に写されていた。 1 箇所に畳んだので、
 * **その 1 箇所が効いていることをここで見る**。 効かなくなっても、使う側の検査は
 * 負荷のかかった回にだけ落ちる = 手元では緑のまま通り続ける (#2476 / #2466 で実際に踏んだ)。
 *
 * ## 画面ではなく仕組みを見る
 *
 * 見るのは「形が変わらなくなってから返るか」 だけなので、実物の画面は要らない。
 * 試しの印 (`.probe-2496`) を画面へ差し込み、決めた時刻に形を変える。
 * 実物の描画に乗せると、描画の速さで結果が変わって何を測ったか分からなくなる。
 *
 * ## 時間は下限だけを見る
 *
 * 100 ミリ秒ごとに測るので、返る時刻は必ず目標より後にずれる。 上限で縛ると
 * 負荷のかかった回に落ちる = 待ち方の検査が待ち方の問題で落ちることになる。
 * **仕組みが壊れた時に必ず下回る値** を下限に置く (壊れた形は即座に返る)。
 */
import { test, expect } from "@playwright/test";
import { 形が落ち着くまで待つ, 測れた値を受け取る } from "./wait-for-render";

/** 試しの印を差し込み、決めた時刻に幅を変える。 `隠す間` の間は印そのものを出さない */
async function 印を置く(
  page: import("@playwright/test").Page,
  指す: { 動く回数: number; 間隔: number; 隠す間: number },
): Promise<void> {
  await page.evaluate((指す) => {
    document.querySelector(".probe-2496")?.remove();
    const 印 = document.createElement("div");
    印.className = "probe-2496";
    印.style.cssText = "position:fixed;left:0;top:0;height:10px;width:10px;background:red";
    if (指す.隠す間 > 0) 印.style.display = "none";
    document.body.appendChild(印);

    if (指す.隠す間 > 0) {
      setTimeout(() => {
        印.style.display = "block";
      }, 指す.隠す間);
    }
    for (let i = 1; i <= 指す.動く回数; i += 1) {
      setTimeout(() => {
        印.style.width = `${10 + i * 5}px`;
      }, 指す.隠す間 + i * 指す.間隔);
    }
  }, 指す);
}

/** 試しの印の幅。 出ていない間は測れないので `null` を返す */
const 印の幅 = (): string | null => {
  const 印 = document.querySelector(".probe-2496")?.getBoundingClientRect();
  if (!印 || 印.width === 0) return null;
  return String(Math.round(印.width));
};

test.describe("落ち着くまで待つ仕組み (#2496)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("editor", { waitUntil: "networkidle" });
  });

  test("形が動いている間は返らない", async ({ page }) => {
    // 4 回動いて止まる。 窓が効いていれば、最後に動いた時刻 + 窓 より前には返れない
    await 印を置く(page, { 動く回数: 4, 間隔: 200, 隠す間: 0 });

    const 待った = await 形が落ち着くまで待つ(page, "試しの印", 印の幅, {}, { 窓: 500 });

    expect(
      待った,
      `最後に動くのは 800 ミリ秒後、窓は 500 ミリ秒なので 1300 ミリ秒より早くは返れない。` +
        ` ${待った} ミリ秒で返ったなら、窓を見ずに最初の形で落ち着いている`,
    ).toBeGreaterThanOrEqual(1100);
  });

  test("測れない間を形として数えない", async ({ page }) => {
    // 800 ミリ秒は印そのものが出ない。 その間を 1 つの形として覚えると、
    // 出る前に落ち着いたことになる
    await 印を置く(page, { 動く回数: 0, 間隔: 200, 隠す間: 800 });

    const 待った = await 形が落ち着くまで待つ(page, "試しの印", 印の幅, {}, { 窓: 400 });

    expect(
      待った,
      `印が出るのは 800 ミリ秒後、窓は 400 ミリ秒なので 1200 ミリ秒より早くは返れない。` +
        ` ${待った} ミリ秒で返ったなら、測れない間を形として数えている`,
    ).toBeGreaterThanOrEqual(1000);
  });

  test("測れないまま時間が来たら、渡した言い方で落ちる", async ({ page }) => {
    // 印を 1 つも置かない。 判定 (expect) の失敗文と読み分けられることを見る
    await page.evaluate(() => document.querySelector(".probe-2496")?.remove());

    const 文 = await 形が落ち着くまで待つ(
      page,
      "置いていない印",
      印の幅,
      {},
      { 窓: 200, 上限ミリ秒: 1_500, 出ない時の言い方: "揃わない" },
    ).then(
      () => null,
      (e: Error) => e.message,
    );

    expect(文, "測れないはずの形で待ちが通ってしまった").toContain("揃わない");
  });

  test("測れた値を受け取る側は、窓を待たずに最初の値を返す", async ({ page }) => {
    // 600 ミリ秒後に出て、その後は測る間隔 (100 ミリ秒) より速く動き続ける。
    // 2 回続けて同じ形になることが無いので、落ち着きを待つ形だと返らない
    // = 測る瞬間を選べない相手 (伸びて戻る矢印、#2482) のために分けている
    await 印を置く(page, { 動く回数: 200, 間隔: 50, 隠す間: 600 });

    const 始め = Date.now();
    const 値 = await 測れた値を受け取る(page, "試しの印", 印の幅, {});
    const 待った = Date.now() - 始め;

    expect(Number(値), `測れた値が数として読めない (${値})`).toBeGreaterThan(0);
    expect(待った, `動き続ける印で ${待った} ミリ秒かかった。 落ち着きを待ってしまっている`).
      toBeLessThan(3_000);
  });
});
