/**
 * 編集画面で、押して使うものに掴む形の cursor を出さないことの検証 (#2072)。
 *
 * 部品の一覧の button は押すと本文の `actors:` に 1 行足す。 引きずって置く操作 (#413) が
 * #923 で外れた後も、`editor.css` に掴む形 (`grab` / `grabbing`) の規則が残り、
 * 引きずって置く操作に見えていた。
 *
 * 舞台に描いた図の箱 ・ 線 ・ 区画にも掴む形の規則が残っていた。 掴む形は舞台の平行移動の
 * 側が持つので、この規則は箱の上から押して舞台を動かしている間だけ cursor を `grab` に
 * 留め、空いた所から押した時の `grabbing` と食い違わせていた。
 *
 * ## 検査の作り
 *
 * **規則の有無では守れない**。 規則を消しても別の規則が同じ値を出せば見た目は戻る。
 * 実際に計算された cursor を、比べる相手 (見本の button / 舞台の空いた所) と同じ回で読む。
 */
import { test, expect, type Page } from "@playwright/test";
import { 位置が落ち着くまで待つ } from "./wait-for-render";

const 舞台 = "editor-preview-stage";

async function 開く(page: Page, 見本: string): Promise<void> {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`editor#preset=${見本}`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector(".v4-editor-preview svg[data-cdl-stage]", { timeout: 15000 });
  // 固定の待ち時間だと、一式で回した時の負荷で枠に収める処理が終わる前に点を測る (#2476)。
  // 測った後に合わせ直しが走ると、拾った箱の点が図ごとずれて別の物を押すことになる
  await 位置が落ち着くまで待つ(page, `編集画面 (${見本})`);
}

/**
 * 指している間と押している間の cursor。
 *
 * 離し方を選ぶ。 一覧の button は外へ出してから離す (押した扱いにせず、本文を変えない)。
 * 舞台はその場で離す (押したまま動かすと舞台が平行移動し、次に測る点がずれる)。
 */
async function 指して押す(
  page: Page,
  x: number,
  y: number,
  離す: "外" | "その場",
): Promise<{ 指す: string; 押している間: string }> {
  const 読む = (): Promise<string> =>
    page.evaluate(([px, py]) => {
      const e = document.elementFromPoint(px, py);
      return e ? getComputedStyle(e).cursor : "";
    }, [x, y] as const);
  await page.mouse.move(x, y);
  const 指す = await 読む();
  await page.mouse.down();
  const 押している間 = await 読む();
  if (離す === "外") await page.mouse.move(5, 5, { steps: 4 });
  await page.mouse.up();
  return { 指す, 押している間 };
}

test.describe("押して使うものに掴む形の cursor を出さない (#2072)", () => {
  test("部品の button は、見本の button と同じ cursor になる", async ({ page }) => {
    await 開く(page, "flow");
    const 見本 = await page.locator(".v4-editor-side-item").first().boundingBox();
    expect(見本, "見本の button が無い").not.toBeNull();
    const 見本の形 = await 指して押す(page, 見本!.x + 20, 見本!.y + 8, "外");

    await page.getByTestId("editor-parts-tab").click();
    const 部品 = page.locator("[data-part-id]").first();
    await 部品.waitFor({ state: "visible", timeout: 15000 });
    const 部品box = await 部品.boundingBox();
    expect(部品box, "部品の button が無い").not.toBeNull();
    const 部品の形 = await 指して押す(page, 部品box!.x + 20, 部品box!.y + 8, "外");

    // 見本の側が掴む形になっていないことも見る。 両方が掴む形に揃っても一致はするため
    expect(見本の形.指す, "見本の button の cursor").toBe("pointer");
    expect(部品の形, "部品の button の cursor が見本の button と違う").toEqual(見本の形);
  });

  test("部品を押すと、足したことが舞台の上に出る", async ({ page }) => {
    await 開く(page, "flow");
    await page.getByTestId("editor-parts-tab").click();
    const 部品 = page.locator('[data-part-id="parts-achievement"]');
    await 部品.waitFor({ state: "visible", timeout: 15000 });
    await 部品.click();

    const 知らせ = page.getByTestId(舞台).getByRole("status");
    await expect(知らせ).toBeVisible();
    await expect(知らせ).toContainText("を追加しました");
    // 押した部品の名前が入っていることも見る。 名前は部品の種類から組み立てて差し込まれる
    expect(await 知らせ.textContent()).toContain(`"achievement"`);
  });

  test("図の箱の上から押している間は、舞台の空いた所から押した時と同じ cursor になる", async ({ page }) => {
    await 開く(page, "flow");
    const 点 = await page.getByTestId(舞台).evaluate((stage) => {
      const s = stage.getBoundingClientRect();
      // 箱の外枠の中心が塗りに当たるとは限らないので、実際に箱の中の要素に当たる点を探す
      for (const g of stage.querySelectorAll("svg [data-cdl-node]")) {
        const r = g.getBoundingClientRect();
        for (let i = 1; i < 8; i++) {
          for (let j = 1; j < 8; j++) {
            const x = r.left + (r.width * i) / 8;
            const y = r.top + (r.height * j) / 8;
            const e = document.elementFromPoint(x, y);
            if (e !== null && e !== g && g.contains(e)) {
              return { 箱: { x, y }, 空き: { x: s.left + 12, y: s.bottom - 70 } };
            }
          }
        }
      }
      return null;
    });
    expect(点, "箱の中の要素に当たる点が無い").not.toBeNull();

    const 空き = await 指して押す(page, 点!.空き.x, 点!.空き.y, "その場");
    const 箱 = await 指して押す(page, 点!.箱.x, 点!.箱.y, "その場");
    // 空いた所の側が平行移動の形になっていることを先に見る。 舞台の規則が消えて両方が
    // 既定の矢印に揃っても一致はするため
    expect(空き, "舞台の空いた所の cursor").toEqual({ 指す: "grab", 押している間: "grabbing" });
    expect(箱, "箱の上の cursor が舞台の空いた所と違う").toEqual(空き);
  });
});
