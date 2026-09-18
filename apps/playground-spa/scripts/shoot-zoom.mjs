/**
 * catalog の図を 1 つずつ拡大して撮る (#1094)。
 *
 * ## 元は 56 件の検査だったが 1 件も対象を見つけていなかった
 *
 * `tests/dragon-zoom.spec.ts` が 56 件の検査として置かれていたが、 `expect` を 1 つも持たず、
 * 対象が見つからない時も撮って抜けるため **図が消えても通る** 形だった。
 *
 * さらに実測すると、 探していた識別子 (`presetSwimlane` 等) は画面のどこにも出ておらず、
 * **56 件すべてが一度も対象を見つけていなかった**。 画面に出る識別子は `swimlane-demo` の形で、
 * 探し方が page と噛み合っていない。
 *
 * ## 固定の一覧を持たない
 *
 * 書き写した識別子は、 catalog 側が名前を変えた時に黙って古くなる (実際にそうなっていた)。
 * その場で画面から拾えば、 名前が変わっても追随する。 図が消えれば件数が減るので、 それも
 * 出力に出す。
 *
 * **分類の一覧も同じ** (#2244)。 識別子だけを画面から拾い、分類は書き写したままだったため、
 * 後から足した 3 分類を一度も撮っていなかった (綴りは `CATEGORIES` が持つ)。
 * 一覧に無いので回らず、撮れなかった記録にも出ないので出力からは気付けない。
 *
 * ## 既定は分類ごとに 3 件
 *
 * 1 枚あたり 4.3 秒かかる (実測)。 catalog の図は足すたびに増えるので、全件撮ると
 * 目視用の道具に使えない長さになる。 枚数は下の式で決まり、この注記は数を持たない
 * (`rules/quality.md § 導出可能記述は人手で書かない` の経路 2)。
 *
 * 見た目の崩れは分類の中で似た形に出るので、各分類を数件見れば気付ける。
 * 全件見たい時だけ `SHOOT_ALL=1` を付ける。
 *
 * 起動 = `pnpm shoot:zoom` (開発サーバーが立っていること)。
 * 出力 = `test-results/zoom/<category>/<id>.png`。
 * 撮った枚数は分類ごとに 1 行ずつ出し、走り終わりに合計を出す。
 *
 * | 指定 | 枚数 |
 * |---|---|
 * | 既定 | 分類の数 x 3 |
 * | `SHOOT_LIMIT=<N>` | 分類の数 x N |
 * | `SHOOT_ALL=1` | catalog の図の全件 |
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:4323";
const OUT = "test-results/zoom";
/** 分類ごとに撮る数。 既定 3。 `SHOOT_ALL=1` で全件 */
const 全件 = process.env.SHOOT_ALL === "1";
const 指定 = Number.parseInt(process.env.SHOOT_LIMIT ?? "", 10);
const 上限 = 全件 ? Number.POSITIVE_INFINITY : Number.isFinite(指定) && 指定 > 0 ? 指定 : 3;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

/**
 * 分類の一覧を分類の頁から拾う (#2244)。
 *
 * **書き写さない**。 書き写していた間、後から足した 3 分類を一度も撮っていなかった。
 * 一覧に無いので回らず、撮れなかった記録にも出ないため、出力を見ても欠けに気付けない。
 * 上の「固定の一覧を持たない」 を分類にも適用する。
 *
 * **拾えなければ撮らずに止める**。 0 件を「分類が無い」 として静かに終わると、
 * いま直している欠けと同じ形になる。
 */
await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const category = await page.evaluate(() =>
  [...document.querySelectorAll("a.catalog-index-card")]
    .map((a) => a.getAttribute("href")?.split("/catalog/")[1] ?? "")
    .filter((s) => s !== ""),
);
if (category.length === 0) {
  console.error(`分類の一覧を ${BASE}/catalog から拾えなかった。 開発サーバーを確かめる`);
  await browser.close();
  process.exit(1);
}
console.log(`分類 ${category.length} 件を分類の頁から拾った: ${category.join(" ")}`);

let 撮った = 0;
const 失敗 = [];

for (const c of category) {
  mkdirSync(`${OUT}/${c}`, { recursive: true });
  await page.goto(`${BASE}/catalog/${c}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // 一覧はその場で拾う。 書き写すと catalog 側の改名で黙って古くなる
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll(".catalog-list-item-id")].map((e) => e.textContent?.trim() ?? ""),
  );
  const 対象 = Number.isFinite(上限) ? ids.slice(0, 上限) : ids;
  if (対象.length === 0) {
    失敗.push(`${c}: 一覧が空`);
    continue;
  }

  for (const [i, id] of 対象.entries()) {
    // 一覧の項目を押すと右側のプレビューが差し替わる。
    //
    // **`hasText` で選ばない**。 部分一致なので、 別の識別子に含まれる名前が別の項目を掴む
    // (実測 = cookbook の `notification` は `email-notification` にも一致し、 DOM 上で先にある
    // 後者が選ばれる。 `notification.png` の中身が別の図になり、 件数は変わらないので失敗にも
    // ならない)。 識別子は上で拾った順に並んでいるので、 その番号でそのまま指す
    const 項目 = page.locator(".catalog-list-item").nth(i);
    const 実際の識別子 = (await 項目.locator(".catalog-list-item-id").textContent())?.trim();
    if (実際の識別子 !== id) {
      失敗.push(`${c}/${id}: ${i} 番目が ${実際の識別子} になっている (一覧が動いた)`);
      continue;
    }
    await 項目.click();
    await page.waitForTimeout(1200);

    const 拡大 = page.locator('.catalog-preview-card button[aria-label*="拡大"]');
    if ((await 拡大.count()) === 0) {
      失敗.push(`${c}/${id}: 拡大の押しどころが無い`);
      continue;
    }
    await 拡大.first().click();
    await page.waitForTimeout(1500);

    const 窓 = page.locator('[role="dialog"]');
    if ((await 窓.count()) === 0) {
      失敗.push(`${c}/${id}: 窓が開かない`);
      continue;
    }
    // file 名に使えない文字を落とす (日本語の識別子がある)
    const 名前 = id.replace(/[^\w぀-ヿ一-鿿-]/g, "_");
    await 窓.screenshot({ path: `${OUT}/${c}/${名前}.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    撮った += 1;
  }
  console.log(`${c}: ${対象.length} 件中 ${対象.length - 失敗.filter((f) => f.startsWith(`${c}/`)).length} 件を撮影`);
}

await browser.close();

console.log(`\n合計 ${撮った} 枚を ${OUT} に出力`);
if (!全件) console.log(`(分類ごとに先頭 ${上限} 件。 全件は SHOOT_ALL=1)`);
if (失敗.length > 0) {
  console.log(`\n撮れなかったもの (${失敗.length} 件)`);
  for (const f of 失敗) console.log(`  ${f}`);
  process.exit(1);
}
