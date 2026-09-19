import { test, expect, type Page } from "@playwright/test";
import { verifyAllDiagramsDom, type CdlDiagram, type Discrepancy } from "@cardenelabs/cdl";

/**
 * 行の実寸検査を **offset / bind を持つ node** で実ブラウザに通す (cardene777/cdl#397)。
 *
 * `#390` で入れた検査は枠 (`[data-cdl-frame]`) の `getBoundingClientRect()` を使う。 実寸なので
 * `renderOffsetX/Y` の移動と `wBind` / `hBind` の寸法変化が反映される **はず** だが、 その形の
 * 図が見本 412 件に 1 つも無く、 実ブラウザで一度も走っていなかった。
 *
 * - 配線 (枠が bind 後の寸法で描かれ offset の `<g>` の内側にある) = cdl の jsdom test
 * - 実寸 (行が枠に収まっているか) = dragon の `row-bounds.spec.ts`、 対象 7 件は offset / bind なし
 *
 * 見本に図を足す案は採らない (見本の総数と sweep の件数が動く)。 開発時のみの頁
 * (`/__render`) に図を渡して描く。
 */

/**
 * 図を base64url にして `/__render` を開く。
 *
 * ## 2 枚目を渡す時は空の頁を 1 度挟む (#2298)
 *
 * 図は URL の hash (`#d=...`) に載る。 **hash だけが変わる移動は頁を描き直さない** ので、
 * 続けて別の図を渡すと前の図が画面に残ったまま測ることになる。
 *
 * ```ts
 * await page.goto("about:blank");   // ← これが要る
 * await render(page, 2 枚目の図);
 * ```
 *
 * 見え方が 2 通りあり、 どちらも「測れている」 ように見える = 2 枚目が 1 枚目と同じ値を返すか、
 * 下の `waitForSelector` が時間切れになって「図が描かれない」 と出る (画面には前の図の字が
 * 見えている)。
 *
 * この形で誤った測定が 2 回記録に残った。 #2200 の「`side: right` を書くと道筋が 1 点になり
 * 線が消える」 は作り直すと再現せず、 線は道筋 584.5 で描かれていた。 同じ調べ直しの最初の
 * 試みも、 4 通りとも「図が描かれない」 を返した。
 *
 * **ここでは挟まない**。 本 file の検査は 1 つにつき 1 枚しか描かず (検査ごとに頁が分かれる)、
 * 毎回 2 回開くと実行が延びるだけになる。 2 枚以上描く側が挟む。
 */
async function render(page: Page, diagram: CdlDiagram): Promise<void> {
  const b64 = Buffer.from(JSON.stringify(diagram), "utf-8")
    .toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  await page.goto(`/__render#d=${b64}`);
  await page.waitForSelector(`[data-cdl-diagram="${diagram.id}"]`, { timeout: 15000 });
  // font 未読込だと代替 font の字形で測ることになり、 判定が環境に依存する。
  await page.evaluate(() => document.fonts.ready);
}

const kinds = async (page: Page, d: CdlDiagram): Promise<Discrepancy[]> => {
  const report = await verifyAllDiagramsDom(page, [d], { skipBbox: true, skipParticle: true, skipPhase: true });
  return report.discrepancies;
};

// offset (120 world) だけずらすと静的な枠 (幅 400) からは出る長さ。 短い行だと、 verifier が
// 静的座標で枠を作っても収まってしまい、 移動を見ている証明にならない (codex review Round 2)。
const ROWS = ["createdAt: time", "email: string"];

/** offset で動かした node に行を持たせた図。 幅は既定のままなので行は収まる。 */
const offsetDiagram = (): CdlDiagram => ({
  id: "probe-offset",
  topic: "offset を持つ node の行",
  viewport: {},
  lanes: [{ id: "l1", x: 0, width: 500 }],
  nodes: [
    // 幅を明示する。 既定 (400) だと行が短すぎて、 verifier が静的座標で枠を作っても
    // 移動後の行が収まってしまい、 移動を見ている証明にならない (codex review Round 2)。
    { id: "n1", lane: "l1", stack: 0, kind: "storage", title: "A", rows: ROWS, w: 300,
      renderOffsetX: 120, renderOffsetY: 40 },
    { id: "n2", lane: "l1", stack: 1, kind: "storage", title: "B", rows: ROWS, w: 300 },
  ],
  edges: [],
  states: [],
  phases: [{ id: "p", duration: 1000, title: "t", body: "b", activate: ["n1", "n2"], tweens: [], sets: [] }],
} as unknown as CdlDiagram);

/** `wBind` で縮めた node に、 縮んだ幅では収まらない行を持たせた図。 `bind` を外すと対照になる。 */
const shrunkDiagram = (bind = true): CdlDiagram => ({
  id: bind ? "probe-shrunk" : "probe-full",
  topic: "wBind で縮んだ node の行",
  viewport: {},
  lanes: [{ id: "l1", x: 0, width: 500 }],
  states: [{ id: "narrow", initial: "120" }],
  nodes: [
    { id: "n1", lane: "l1", stack: 0, kind: "storage", title: "A",
      // 静的な幅 (460) には収まり、 bind 後の幅 (120) では溢れる長さ。 どちらでも溢れる行だと
      // 「縮んだ枠で測った」 ことの証明にならない (codex review Round 1 の指摘)。
      rows: ["email: string"], w: 460, ...(bind ? { wBind: "{narrow}" } : {}) },
  ],
  edges: [],
  phases: [{ id: "p", duration: 1000, title: "t", body: "b", activate: ["n1"], tweens: [], sets: [] }],
} as unknown as CdlDiagram);

test.describe("offset / bind を持つ node の行を実寸で測る (cdl#397)", () => {
  test("移動した node の行が枠に収まっていると判定される", async ({ page }) => {
    const d = offsetDiagram();
    await render(page, d);

    // 行が DOM に出ていることを先に確かめる。 出ていなければ以下の 0 件は「検査した上で 0 件」
    // ではなく「何も検査していない」 になる。
    const rows = await page.locator(`[data-cdl-diagram="${d.id}"] [data-cdl-role="node-row"]`).count();
    expect(rows, "行が DOM に出ている").toBeGreaterThan(0);

    // 移動が枠に反映されていることを確かめる。 反映されていなければ、 以下の 0 件は
    // 「移動を見た上で収まっている」 ではなく「移動していない図を見ている」 になる。
    const shift = await page.evaluate((id) => {
      const q = (n: string) => document
        .querySelector(`[data-cdl-diagram="${id}"] [data-cdl-node="${n}"] [data-cdl-frame]`)!
        .getBoundingClientRect();
      const a = q("n1");
      const b = q("n2");
      return { dx: a.left - b.left, dy: a.top - b.top };
    }, d.id);
    expect(Math.abs(shift.dx), "offset が枠の位置に出ている").toBeGreaterThan(1);

    const ds = await kinds(page, d);
    expect(ds.filter((x) => x.kind === "node-row-overflow").map((x) => x.detail)).toEqual([]);
    // 測定不能も 0 件であること。 これを見ないと、 実寸が 1 行も測れていない状態でも上の
    // 0 件が成立する。
    expect(ds.filter((x) => x.kind === "node-row-unverifiable").map((x) => x.detail)).toEqual([]);
  });

  test("縮んだ node の行が枠から出ていると報告される", async ({ page }) => {
    const d = shrunkDiagram();
    await render(page, d);

    // 縮みが枠に出ていることを先に確かめる。 静的な幅 (460) のままなら、 以下の検出は
    // 「縮んだ枠で測った」 ことにならない。
    const w = await page.evaluate((id) => document
      .querySelector(`[data-cdl-diagram="${id}"] [data-cdl-node="n1"] [data-cdl-frame]`)!
      .getBoundingClientRect().width, d.id);
    const full = await page.evaluate((id) => {
      const svg = document.querySelector(`[data-cdl-diagram="${id}"] svg[data-cdl-stage]`) as SVGSVGElement;
      const vb = svg.viewBox.baseVal;
      return (svg.getBoundingClientRect().width / vb.width) * 460;
    }, d.id);
    expect(w, `枠の幅 ${w.toFixed(1)} が静的な幅 ${full.toFixed(1)} より狭い`).toBeLessThan(full * 0.9);

    const ds = await kinds(page, d);
    const overflow = ds.filter((x) => x.kind === "node-row-overflow");
    expect(overflow.length, `検出 ${JSON.stringify(ds.map((x) => x.kind))}`).toBeGreaterThan(0);
    // 測定不能が混ざっていると、 行の一部が測れないまま残りの溢れで通ってしまう。
    expect(ds.filter((x) => x.kind === "node-row-unverifiable").map((x) => x.detail)).toEqual([]);
  });

  test("同じ行が bind 無しの幅では収まる (対照)", async ({ page }) => {
    // 上の検出が「縮んだから溢れた」 ことの対照。 同じ行が静的な幅 (460) では収まることを
    // 見ないと、 行を長くしただけでどちらの幅でも溢れる状態に変わっても test が通る
    // (codex review Round 2 の指摘)。
    const d = shrunkDiagram(false);
    await render(page, d);
    const ds = await kinds(page, d);
    expect(ds.filter((x) => x.kind === "node-row-overflow").map((x) => x.detail)).toEqual([]);
    expect(ds.filter((x) => x.kind === "node-row-unverifiable").map((x) => x.detail)).toEqual([]);
  });
});
