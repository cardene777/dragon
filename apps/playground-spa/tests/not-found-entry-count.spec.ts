/**
 * 見つからない頁の説明文が言う入口の数が、画面に出ている行き先の釦の数と合う (#2445)。
 *
 * 以前は説明文が「4 つの入口」 と字で書き、釦は 3 つしか並んでいなかった。
 * 釦は画面の実装が持ち、数は説明文の中の字だったので、釦を足し引きしても追従しない。
 *
 * ## 数は画面から読む
 *
 * 期待値を字で書かない (「3 であること」 を検査に書くと、釦を 4 つにした日に
 * 実装と検査の両方を直すことになり、片方を忘れると食い違う)。
 * **説明文の数** と **釦の数** を画面から読んで、互いに一致することだけを見る。
 *
 * ## 飾りの線は数えない
 *
 * `404` の下に短い線が 4 本あるが、段の目盛りを空のまま置いた飾りで入口ではない。
 *
 * 飾りかどうかは **役割** で見る (読み上げから外れている / 押せる link でない /
 * 行き先の並びの外に在る)。 「釦が 4 つで無いこと」 で見ると、行き先を 4 つにする
 * 設計を将来採れなくなり、飾りとは無関係の理由で落ちる検査になる。
 */
import { test, expect, type Page } from "@playwright/test";

/** 日本語の漢数字と算用数字の両方を受ける */
const 数の字 = new Map<string, number>([
  ["1", 1],
  ["2", 2],
  ["3", 3],
  ["4", 4],
  ["5", 5],
  ["6", 6],
  ["一", 1],
  ["二", 2],
  ["三", 3],
  ["四", 4],
  ["五", 5],
  ["六", 6],
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
]);

/** 説明文が言う入口の数。 読み取れなければ `null` を返す (0 に潰さない) */
function 文が言う数(文: string): number | null {
  const 日本語 = /([0-9０-９一二三四五六])\s*つの入口/u.exec(文)?.[1];
  if (日本語 !== undefined) return 数の字.get(日本語.normalize("NFKC")) ?? null;
  // 綴り (`three`) と算用数字 (`3`) の両方を受ける。 実装が数を差し込むので算用数字になるが、
  // 綴りへ戻した日も読めるようにしておく (読めないと、一致の判定ごと落ちる)
  const 英語 = /([0-9]|one|two|three|four|five|six)\s+entry\s+points?/iu.exec(文)?.[1];
  if (英語 !== undefined) return 数の字.get(英語.toLowerCase()) ?? null;
  return null;
}

async function 見つからない頁を開く(page: Page, 言語: "ja" | "en"): Promise<void> {
  // 言語は `?lang=` で指定する (`pages-i18n.spec.ts` と同じ経路)。
  // 帯の切替を押す形は、押す前の言語に依存して結果が変わる
  await page.goto(`no-such-page?lang=${言語}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
}

async function 測る(page: Page): Promise<{ 文: string; 言う数: number | null; 釦の数: number }> {
  const 文 = (await page.locator(".v4-404-lead").first().textContent()) ?? "";
  const 釦の数 = await page.locator(".v4-404-cta a").count();
  return { 文, 言う数: 文が言う数(文), 釦の数 };
}

for (const 言語 of ["ja", "en"] as const) {
  test(`見つからない頁の入口の数が釦の数と合う (${言語}、#2445)`, async ({ page }) => {
    await 見つからない頁を開く(page, 言語);
    const m = await 測る(page);

    // 空振り防止。 説明文から数を読めていないなら、一致も不一致も言えない
    expect(m.言う数, `説明文から入口の数を読めない: ${m.文}`).not.toBeNull();
    expect(m.釦の数, "行き先の釦が 1 つも無い").toBeGreaterThan(0);

    expect(m.言う数, `説明文は ${m.言う数} と言うが、釦は ${m.釦の数} 個しか無い`).toBe(m.釦の数);
  });
}

test("飾りの線を行き先として数えていない (#2445)", async ({ page }) => {
  await 見つからない頁を開く(page, "ja");

  // 空振り防止。 飾りの線が消えていたら、以下の判定は何も言っていない
  const 飾り = page.locator(".v4-404-phases span");
  await expect(飾り, "飾りの線が無くなっている (検査が空振りしている)").toHaveCount(4);

  // 数ではなく役割を見る。 「釦が 4 つで無いこと」 を見ると、
  // 行き先を 4 つにする設計を将来採れなくなり、飾りとは無関係の形で落ちる
  const 読み上げから外れている = await page
    .locator(".v4-404-phases")
    .first()
    .getAttribute("aria-hidden");
  expect(読み上げから外れている, "飾りの線が読み上げに載っている").toBe("true");

  await expect(
    page.locator(".v4-404-phases a"),
    "飾りの線が行き先 (押せる link) になっている",
  ).toHaveCount(0);

  await expect(
    page.locator(".v4-404-cta .v4-404-phases"),
    "飾りの線が行き先の並びの中に入っている",
  ).toHaveCount(0);
});
