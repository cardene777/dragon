/**
 * 見本を開いた時に登場人物が画面の中に入ることの検証 (#1100)。
 *
 * 読める下限 (`#1084`) を入れた後、 12 見本のうち **7 件で登場人物が画面の外** に出ていた。
 * `sequence` は 利用者 と API しか見えず、 `利用者検索` / `結果` の矢印が見えない相手を指す。
 * 「小さすぎる」 は直ったが「見えない」 に変わっただけだった。
 *
 * 絵の枠が 688px しかなく、 図は 886-1374px になるため収まらない。 画面の割り当てを変えて
 * 絵の枠を 840px にした。
 *
 * ## 残った 3 件を `#1102` で収めた
 *
 * `swimlane` (1374px) / `state-machine` (1340px) / `er` (1021px) は 840px でも収まらなかった。
 * 実測で「中身を減らす」 と「読める下限を下げる」 のどちらか一方では解けないことが確定したため、
 * 両方を使う。 ただし下限を下げるのは **箱が枠から出る図に限る** (`readableScaleForFrame`)。
 * `swimlane` と `state-machine` は登場人物を 1 つ減らし、 `er` は減らさずに下限だけで収めた。
 */
import { test, expect } from "@playwright/test";
import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 下限 as 文字の下限 } from "./readable-floor";

/** 画面の外に出ている箱の名前 */
async function 画面外の箱(page: import("@playwright/test").Page, slug: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`editor#preset=${slug}`);
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
  await page.goto("editor");
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
    await page.goto("editor");
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
  // `title: "利用者・投稿・コメントのスキーマ"`) は 521px あり、 完全に収めると記法欄 521px /
  // 絵の枠 659px で変更前より狭くなる。 変更前も `er` は 54px 欠けていた (実測) ので、
  // 欠けないことは目標にしない。 **欠ける量が最長行から決まる範囲に収まっているか** を見る
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("editor#preset=er");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2200);

  const m = await page.evaluate(() => {
    const sc = document.querySelector(".cm-scroller");
    if (!sc) return null;
    return { 見える: sc.clientWidth, 中身: sc.scrollWidth };
  });

  expect(m, "本文欄が取れない").not.toBeNull();
  // 中身は 521px。 見える幅 339px なので 182px 欠ける。 これ以上大きくなったら記法欄が
  // 想定より潰れている
  expect(m!.中身 - m!.見える, `横に欠ける量が想定を超えた: ${m!.中身 - m!.見える}px`).toBeLessThanOrEqual(187);
  // 中身の幅そのものも見る = 見本を長い題に変えると欠ける量が増えるので、 どちらが動いたか分かる
  expect(m!.中身, `最長行が想定と違う: ${m!.中身}px`).toBeLessThanOrEqual(536);
});

test("収まらない見本が 1 件も無い (#1102)", async ({ page }) => {
  // 見本を 1 件の中で回すため、 既定の 30 秒では足りない (実測 = 1 見本あたり約 4 秒)
  test.setTimeout(120_000);
  // **見本の一覧は SSOT (`src/data/editor-samples.ts`) から引く**。 既知の件数だけを見ていると
  // 残りのどれかが将来画面外へ出ても緑のまま通る (`#1100` Round 1 review の指摘 1 点目)。
  // 手書きで並べるのも同じ穴が残る = SSOT に 13 件目が増えた時に検査が追随しない (同 2 点目)。
  const 収まらない: string[] = [];
  let 測れた = 0;
  for (const { slug } of EDITOR_SAMPLES) {
    const m = await 画面外の箱(page, slug);
    if (m === null) continue;
    測れた += 1;
    if (m.外.length > 0) 収まらない.push(`${slug} (${m.外.join(" / ")})`);
  }
  // 空振り防止。 SSOT が空でないことと、 全件を実際に測れたことの 2 つを見る
  expect(EDITOR_SAMPLES.length, "SSOT に見本が無い").toBeGreaterThan(0);
  expect(測れた, "測れなかった見本がある (検査が空振りしている)").toBe(EDITOR_SAMPLES.length);
  expect(収まらない.sort(), "画面の外に出ている見本がある").toEqual([]);
});

/** 図の中で画面上いちばん小さい文字の大きさ。 表示倍率を掛けた実寸で返す。 */
async function 最小の文字(
  page: import("@playwright/test").Page,
): Promise<{ 最小: number; 数えた: number } | null> {
  return page.evaluate(() => {
    const svg = document
      .querySelector(".v4-editor-stage")
      ?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    if (!svg) return null;
    const 幅 = svg.getBoundingClientRect().width;
    const vb = svg.viewBox?.baseVal?.width ?? 0;
    if (!(幅 > 0) || !(vb > 0)) return null;
    const k = 幅 / vb;
    let 最小 = Number.POSITIVE_INFINITY;
    let 数えた = 0;
    for (const t of svg.querySelectorAll("text")) {
      if ((t.textContent ?? "").trim().length === 0) continue;
      const cs = getComputedStyle(t);
      if (cs.display === "none") continue;
      if (cs.visibility === "hidden" || cs.visibility === "collapse") continue;
      if (Number.parseFloat(cs.opacity) === 0) continue;
      const world = Number.parseFloat(cs.fontSize);
      if (!Number.isFinite(world) || world <= 0) continue;
      数えた += 1;
      最小 = Math.min(最小, world * k);
    }
    return 数えた > 0 ? { 最小: Math.round(最小 * 10) / 10, 数えた } : null;
  });
}

// `#1102` で 8px まで譲るのは、 好ましい下限 10px では箱が枠から出る図に限る。 譲る図と譲らない
// 図の両方を押さえておかないと、 一律に下げる変更が入っても緑のまま通る。
//
// どの見本がどちらに落ちるかは `readable-floor.ts` (共有の期待値) が持つ。 同じ分類を
// `editor-readable-scale.spec.ts` も使うため、 片方だけ直しても両方が通る形を避ける
const 見る見本 = [
  { slug: "gantt", 理由: "箱が枠に収まるので譲らない" },
  { slug: "swimlane", 理由: "10px では箱が枠から出る" },
  { slug: "state-machine", 理由: "同上" },
  { slug: "er", 理由: "同上" },
] as const;

/**
 * 縮める必要が無い見本 (#1477)。
 *
 * `#1466` で順序図が 1 枚の板になり、枠に対して余裕を持って収まるようになった =
 * 倍率が下限に当たらない (実測 = 順序図 18.2px / 買い物の順序図 17.7px、どちらも下限 10px)。
 *
 * **下限ちょうどで止まる形では見られない**。 当たらないものに「ちょうど」 を課すと、
 * 板の大きさを変えるたびに落ちる。 代わりに **下限を下回らない** ことを見る。
 * 枠から出ていないことは上の「収まらない見本が 1 件も無い」 が全見本について見ている。
 */
const 縮まない見本 = [
  { slug: "sequence", 理由: "板が枠に収まるので縮まない" },
  { slug: "sequence-checkout", 理由: "同上" },
] as const;

for (const { slug, 理由 } of 見る見本) {
  const 下限 = 文字の下限(slug);
  test(`見本 ${slug} の画面上の最小文字が ${下限}px (#1102)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`editor#preset=${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2400);

    const m = await 最小の文字(page);

    expect(m, "図の文字が取れない").not.toBeNull();
    expect(m!.数えた, "文字が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    // 下限ちょうどで止まる。 実測は 6 件とも小数点以下が 0 なので、 幅は丸めを吸収する分だけ。
    // 0.3px にすると `gantt` の変異後の値 (9.7px) が許容に隠れて変異を見逃す (実測)
    expect(m!.最小, `${理由} / 実測 ${m!.最小}px`).toBeGreaterThanOrEqual(下限 - 0.2);
    expect(m!.最小, `${理由} / 実測 ${m!.最小}px`).toBeLessThan(下限 + 0.2);
  });
}

for (const { slug, 理由 } of 縮まない見本) {
  const 下限 = 文字の下限(slug);
  test(`見本 ${slug} の画面上の最小文字が ${下限}px を下回らない (#1477)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`editor#preset=${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2400);

    const m = await 最小の文字(page);
    expect(m, "図の文字が取れない").not.toBeNull();
    expect(m!.数えた, "文字が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(m!.最小, `${理由} / 実測 ${m!.最小}px`).toBeGreaterThan(下限);
  });
}
