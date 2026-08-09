/**
 * 見本を開いた時に登場人物が画面の中に入ることの検証 (#1100)。
 *
 * 読める下限 (`#1084`) を入れた後、 12 見本のうち **7 件で登場人物が画面の外** に出ていた。
 * `sequence` は Client と API しか見えず、 `Client検索` / `結果` の矢印が見えない相手を指す。
 * 「小さすぎる」 は直ったが「見えない」 に変わっただけだった。
 *
 * 絵の枠が 688px しかなく、 図は 886-1374px になるため収まらない。 画面の割り当てを変えて
 * 絵の枠を 840px にした。
 *
 * ## 収まらない見本が 3 件残る
 *
 * `swimlane` (1374px) と `state-machine` (1340px) と `er` (1021px) は 840px でも収まらない。
 * ここまで広げるには窓の大半を絵に割く必要があり、 記法を書く場所が残らない。 中身を減らすか
 * 下限を下げるかは別の判断として残す。
 */
import { test, expect } from "@playwright/test";
import { EDITOR_SAMPLES } from "../src/data/editor-samples";

/** 画面の外に出ている箱の名前 */
async function 画面外の箱(page: import("@playwright/test").Page, slug: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/editor#preset=${slug}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2200);
  return page.evaluate(() => {
    const host = document.querySelector(".v4-editor-stage");
    const svg = host?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    if (!host || !svg) return null;
    const h = host.getBoundingClientRect();
    const 箱 = [...svg.querySelectorAll("[data-cdl-node]")];
    const 外 = 箱
      .filter((n) => {
        const b = n.getBoundingClientRect();
        return b.right > h.right + 1 || b.left < h.left - 1;
      })
      .map((n) => n.getAttribute("data-cdl-title") ?? "")
      .filter((s) => s.length > 0);
    return { 外: [...new Set(外)], 箱の数: 箱.length, 枠: Math.round(h.width) };
  });
}

// 変更前は 7 件で登場人物が画面の外にあった。 枠を広げて収まるようになった見本
for (const slug of ["sequence", "sequence-checkout", "gantt", "pie"]) {
  test(`見本 ${slug} の登場人物が画面の中に入る (#1100)`, async ({ page }) => {
    const m = await 画面外の箱(page, slug);
    expect(m, "図が画面に無い").not.toBeNull();
    expect(m!.箱の数, "箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(m!.外, `画面の外にある: ${m!.外.join(", ")}`).toEqual([]);
  });
}

test("絵の枠が記法欄より広い (#1100)", async ({ page }) => {
  // 割り当てを戻すと絵の枠が 688px に縮み、 上の 4 件が画面外に戻る。 枠の幅そのものを見て
  // おくと、 割り当てが変わった時にどちらが原因かすぐ分かる
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const m = await page.evaluate(() => {
    const stage = document.querySelector(".v4-editor-stage");
    const code = document.querySelector(".v4-editor-code");
    if (!stage || !code) return null;
    return {
      絵: Math.round(stage.getBoundingClientRect().width),
      記法: Math.round(code.getBoundingClientRect().width),
    };
  });

  expect(m, "エディタの領域が取れない").not.toBeNull();
  // 実測 840px (窓 1440 から余白と記法欄の床 340px を引いた実際の割り当て)。 割り当てを戻すと
  // 648px 前後に縮む
  expect(m!.絵, `絵の枠が狭い: ${m!.絵}px`).toBeGreaterThanOrEqual(840);
  // 記法欄も実用の幅を保つ。 40 桁が下限 (床 340px はこれを上回る)
  expect(m!.記法, `記法欄が狭すぎる: ${m!.記法}px`).toBeGreaterThanOrEqual(320);
});

// 記法欄の幅は窓の幅で変わる。 比率だけで割ると狭い窓で潰れるため床を置いた (Round 1 review の
// 指摘)。 実測 = 床が無いと 1366px で 307px、 1280px で 283px、 1201px で 261px まで縮んだ
for (const 窓 of [1440, 1366, 1280, 1201]) {
  test(`窓 ${窓}px で記法欄が 340px を保つ (#1100)`, async ({ page }) => {
    await page.setViewportSize({ width: 窓, height: 900 });
    await page.goto("/editor");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1800);

    const m = await page.evaluate(() => {
      const code = document.querySelector(".v4-editor-code");
      return code ? Math.round(code.getBoundingClientRect().width) : -1;
    });
    expect(m, `記法欄が潰れている: ${m}px`).toBeGreaterThanOrEqual(340);
  });
}

test("記法欄の横に欠ける量が見本の最長行を大きく超えない (#1100)", async ({ page }) => {
  // **「折り返さない」 を見てはいけない**。 `.cm-line` の `white-space` は `pre` なので、 幅が
  // 足りなくても行の高さは増えず横スクロールになる = 常に真で検査が空振りする (Round 1 review の
  // 指摘。 変更前の検査はこれを見ていた)。
  //
  // 横スクロール自体は無くならない。 見本で最も長い行 (`er` の
  // `title: "Client・投稿・コメントのスキーマ"`) は 545px あり、 完全に収めると記法欄 545px /
  // 絵の枠 635px で変更前より狭くなる。 変更前も `er` は 54px 欠けていた (実測) ので、
  // 欠けないことは目標にしない。 **欠ける量が最長行から決まる範囲に収まっているか** を見る
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor#preset=er");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2200);

  const m = await page.evaluate(() => {
    const sc = document.querySelector(".cm-scroller");
    if (!sc) return null;
    return { 見える: sc.clientWidth, 中身: sc.scrollWidth };
  });

  expect(m, "本文欄が取れない").not.toBeNull();
  // 中身は 545px。 見える幅 340px なので 205px 欠ける。 これ以上大きくなったら記法欄が
  // 想定より潰れている
  expect(m!.中身 - m!.見える, `横に欠ける量が想定を超えた: ${m!.中身 - m!.見える}px`).toBeLessThanOrEqual(210);
  // 中身の幅そのものも見る = 見本を長い題に変えると欠ける量が増えるので、 どちらが動いたか分かる
  expect(m!.中身, `最長行が想定と違う: ${m!.中身}px`).toBeLessThanOrEqual(560);
});

test("収まらない見本は 3 件に留まる (#1100)", async ({ page }) => {
  // 見本を 1 件の中で回すため、 既定の 30 秒では足りない (実測 = 1 見本あたり約 4 秒)
  test.setTimeout(120_000);
  // **見本の一覧は SSOT (`src/data/editor-samples.ts`) から引く**。 既知の 3 件だけを見ていると
  // 残りのどれかが将来画面外へ出ても緑のまま通る (Round 1 review の指摘 1 点目)。 手書きで
  // 12 件並べるのも同じ穴が残る = SSOT に 13 件目が増えた時に検査が追随しない (同 2 点目)。
  //
  // `swimlane` (図 1374px) / `state-machine` (1340px) / `er` (1021px) は絵の枠 840px でも
  // 収まらない。 収めるには窓の大半を絵に割く必要があり記法を書く場所が残らないため 3 件を残す
  const 収まらない: string[] = [];
  let 測れた = 0;
  for (const { slug } of EDITOR_SAMPLES) {
    const m = await 画面外の箱(page, slug);
    if (m === null) continue;
    測れた += 1;
    if (m.外.length > 0) 収まらない.push(slug);
  }
  // 空振り防止。 SSOT が空でないことと、 全件を実際に測れたことの 2 つを見る
  expect(EDITOR_SAMPLES.length, "SSOT に見本が無い").toBeGreaterThan(0);
  expect(測れた, "測れなかった見本がある (検査が空振りしている)").toBe(EDITOR_SAMPLES.length);
  expect(収まらない.sort(), "収まらない見本が変わった").toEqual(["er", "state-machine", "swimlane"]);
});
