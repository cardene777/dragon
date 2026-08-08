/**
 * 見本を開いた時に登場人物が画面の中に入ることの検証 (#1100)。
 *
 * 読める下限 (`#1084`) を入れた後、 12 見本のうち **7 件で登場人物が画面の外** に出ていた。
 * `sequence` は Client と API しか見えず、 `Client検索` / `結果` の矢印が見えない相手を指す。
 * 「小さすぎる」 は直ったが「見えない」 に変わっただけだった。
 *
 * 絵の枠が 688px しかなく、 図は 886-1374px になるため収まらない。 画面の割り当てを変えて
 * 絵の枠を 892px にした。
 *
 * ## 収まらない見本が 3 件残る
 *
 * `swimlane` (1374px) と `state-machine` (1340px) と `er` (1021px) は 892px でも収まらない。
 * ここまで広げるには窓の大半を絵に割く必要があり、 記法を書く場所が残らない。 中身を減らすか
 * 下限を下げるかは別の判断として残す。
 */
import { test, expect } from "@playwright/test";

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
  // 実測 852px (窓 1440 から余白を引いた実際の割り当て)。 割り当てを戻すと 648px 前後に縮む
  expect(m!.絵, `絵の枠が狭い: ${m!.絵}px`).toBeGreaterThanOrEqual(840);
  // 記法欄も実用の幅を保つ。 見本で最も長い行 (`  - Client -> API: "ログイン要求"`) が
  // 折り返さない 40 桁が下限
  expect(m!.記法, `記法欄が狭すぎる: ${m!.記法}px`).toBeGreaterThanOrEqual(320);
});

test("記法欄で見本の最長行が折り返さない (#1100)", async ({ page }) => {
  // 幅を数字で見るだけでは足りない。 実際に折り返していないかを行の高さで見る
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor#preset=sequence");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2200);

  const m = await page.evaluate(() => {
    const lines = [...document.querySelectorAll(".cm-line")];
    if (lines.length === 0) return null;
    const 高さ = lines.map((l) => Math.round(l.getBoundingClientRect().height));
    const 最小 = Math.min(...高さ.filter((h) => h > 0));
    // 折り返した行は 1 行分の 2 倍近くになる
    const 折り返し = lines
      .filter((l) => l.getBoundingClientRect().height > 最小 * 1.5)
      .map((l) => (l.textContent ?? "").trim().slice(0, 30));
    return { 折り返し, 行数: lines.length };
  });

  expect(m, "本文欄が取れない").not.toBeNull();
  expect(m!.行数, "行が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  expect(m!.折り返し, `折り返している行がある: ${m!.折り返し.join(" / ")}`).toEqual([]);
});

test("収まらない見本は 3 件に留まる (#1100)", async ({ page }) => {
  // `swimlane` / `state-machine` / `er` は 892px でも収まらない。 これ以上増えたら
  // 割り当てか見本の中身が変わったということ
  const 収まらない: string[] = [];
  for (const slug of ["swimlane", "state-machine", "er"]) {
    const m = await 画面外の箱(page, slug);
    if (m !== null && m.外.length > 0) 収まらない.push(slug);
  }
  expect(収まらない.sort(), "収まらない見本が変わった").toEqual(["er", "state-machine", "swimlane"]);
});
