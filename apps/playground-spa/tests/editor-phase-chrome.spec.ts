/**
 * 舞台に重ねるシーンの表示の検証 (#1143)。
 *
 * 表示そのものは `#1239` で画面をまたげる部品 (`PhaseChrome`、 class は `cdl-phase-*`) へ
 * 出したため、 選択子は共有側の名前を見る。 検査の中身 (中身と色の変化を直接見る) は変えていない。
 *
 * 設計 (`docs/design/app.pen` の `04 エディタ`) は 3 つを描いているが、 実装は 1 つも持って
 * いなかった。 図がどのシーンを見せているのか、 あと何段あるのか、 どの速さで回っているのかが
 * 画面から一切分からない状態だった。
 *
 * 4 つ目 (今のシーンに関わる名札を橙で塗る) は engine 側で動いていたが、 `cdl-theme.css` の
 * `!important` が全部の箱に同じ枠を当てて打ち消していた (実測 = `active=true` の
 * `api-header` と `false` の `db-header` が `stroke: rgb(196,189,179)` /
 * `strokeWidth: 1.75px` で完全一致)。
 *
 * ## 検査の作り
 *
 * **要素の有無では守れない**。 札が出ていても中身が固定文字ならシーンは伝わらないし、 バーが
 * 出ていても色が動かなければ進み具合は伝わらない。 中身と色の変化を直接見る。
 */
import { test, expect } from "@playwright/test";

async function 開く(page: import("@playwright/test").Page, hash = ""): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`editor${hash}`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector(".v4-editor-stage svg", { timeout: 30000 });
  await page.waitForTimeout(1500);
}

/** 共有 URL の形。 `CdlEditor` の `decodeShare` と対になる */
function 共有(src: string): string {
  return `#s=${Buffer.from(unescape(encodeURIComponent(src)), "binary").toString("base64")}`;
}

/** シーンを持たない図。 既定の見本はすべて `animation:` を持つので、 自分で書く */
const シーンなし = `title: "単発"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "x"
`;

test.describe("シーンの表示 (#1143)", () => {
  test("札に今のシーンと全体の数と題名が出る", async ({ page }) => {
    await 開く(page);
    const 札 = page.locator(".cdl-phase-chip");
    await expect(札).toBeVisible();
    // 既定の見本は 4 シーン (`call` / `query` / `return` / `ok`)
    await expect(札).toContainText(/シーン [1-4] \/ 4/u);
    await expect(札).toContainText("·");
  });

  test("シーンが進むと札の数字とバーが追随する", async ({ page }) => {
    await 開く(page);
    const 札 = page.locator(".cdl-phase-chip");
    const 済 = page.locator(".cdl-phase-seg.is-done");

    const 前文 = (await 札.textContent()) ?? "";
    const 前済 = await 済.count();

    // 1 シーンは 1.4s + 静止 2s。 5s あれば必ず 1 つ以上進む
    await page.waitForTimeout(5200);

    const 後文 = (await 札.textContent()) ?? "";
    const 後済 = await 済.count();
    expect(後文, `シーンが進んでも札が ${前文} のまま`).not.toBe(前文);
    expect(後済, `シーンが進んでもバーが ${前済} 本のまま`).not.toBe(前済);
  });

  test("バーはシーンの数だけ区切られる", async ({ page }) => {
    await 開く(page);
    await expect(page.locator(".cdl-phase-seg")).toHaveCount(4);

    // 済んだ側とこれからの側で色が違う。 同じなら進み具合を示せていない
    const 色 = await page.evaluate(() => {
      const segs = [...document.querySelectorAll(".cdl-phase-seg")];
      return segs.map((s) => ({
        done: s.classList.contains("is-done"),
        bg: getComputedStyle(s).backgroundColor,
      }));
    });
    const 済色 = new Set(色.filter((s) => s.done).map((s) => s.bg));
    const 未色 = new Set(色.filter((s) => !s.done).map((s) => s.bg));
    expect(済色.size, "済んだ区切りが 1 つも無い").toBeGreaterThan(0);
    expect(未色.size, "これからの区切りが 1 つも無い").toBeGreaterThan(0);
    for (const a of 済色) expect(未色.has(a), `済みと未了が同じ色 (${a})`).toBe(false);
  });

  test("動きの長さと繰り返しが出る", async ({ page }) => {
    await 開く(page);
    // `ease-out` は書かない = cdl の内部既定で API に出ておらず、 写すと黙って古くなる
    await expect(page.locator(".cdl-phase-meta")).toHaveText(/^\d+ms · 繰り返し$/u);
  });

  test("シーンを持たない図では何も出さない", async ({ page }) => {
    await 開く(page, 共有(シーンなし));
    await expect(page.locator(".cdl-phase-chip")).toHaveCount(0);
    await expect(page.locator(".cdl-phase-seg")).toHaveCount(0);
  });

  test("重ねても舞台を掴んで動かせる", async ({ page }) => {
    await 開く(page);
    const 位置 = () =>
      page.locator(".v4-editor-pan").evaluate((el) => getComputedStyle(el).transform);

    // 重ねたものはマウスを受け取らない。 受け取ると札の上で掴めなくなる
    const pe = await page
      .locator(".cdl-phase")
      .evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(pe, "重ねたものがマウスを受け取っている").toBe("none");

    // 札のちょうど上から掴んで実際に動くことまで見る。 `pointer-events` だけだと、
    // 別の要素が上に載った時に気付けない
    const 札 = await page.locator(".cdl-phase-chip").boundingBox();
    if (札 === null) throw new Error("札が見つからない");
    const 前 = await 位置();
    await page.mouse.move(札.x + 札.width / 2, 札.y + 札.height / 2);
    await page.mouse.down();
    await page.mouse.move(札.x + 札.width / 2 + 90, 札.y + 札.height / 2 + 60, { steps: 6 });
    await page.mouse.up();
    expect(await 位置(), "札の上から掴んでも図が動かない").not.toBe(前);
  });

  test("拡大しても札の位置と大きさが変わらない", async ({ page }) => {
    await 開く(page);
    const 前 = await page.locator(".cdl-phase-chip").boundingBox();
    await page.getByTestId("editor-zoom-in").click();
    await page.getByTestId("editor-zoom-in").click();
    await page.waitForTimeout(400);
    const 後 = await page.locator(".cdl-phase-chip").boundingBox();
    expect(後?.x).toBeCloseTo(前?.x ?? -1, 0);
    expect(後?.y).toBeCloseTo(前?.y ?? -1, 0);
    expect(後?.width).toBeCloseTo(前?.width ?? -1, 0);
  });

  test("今のシーンに関わる名札だけ枠が変わる", async ({ page }) => {
    await 開く(page);

    const 枠 = await page.evaluate(() => {
      const out: { id: string; active: string | null; stroke: string; width: string }[] = [];
      for (const g of document.querySelectorAll("[data-cdl-node]")) {
        const body = g.querySelector('[data-cdl-role="node-body"]');
        if (body === null) continue;
        const c = getComputedStyle(body);
        out.push({
          id: g.getAttribute("data-cdl-node") ?? "",
          active: g.getAttribute("data-cdl-active"),
          stroke: c.stroke,
          width: c.strokeWidth,
        });
      }
      return out;
    });

    const 有 = 枠.filter((n) => n.active === "true");
    const 無 = 枠.filter((n) => n.active === "false");
    expect(有.length, "今のシーンに関わる名札が 1 つも無い").toBeGreaterThan(0);
    expect(無.length, "関わらない名札が 1 つも無い").toBeGreaterThan(0);

    // 枠の色で見分ける。 面も一緒に変わるが、 面は舞台とほぼ同じ明るさなので分離は枠が担う
    const 有色 = new Set(有.map((n) => n.stroke));
    const 無色 = new Set(無.map((n) => n.stroke));
    expect(有色.size, "関わる名札の枠が揃っていない").toBe(1);
    for (const a of 有色)
      expect(無色.has(a), `関わる名札と関わらない名札が同じ枠 (${a})`).toBe(false);
  });

  for (const 明暗 of ["light", "dark"] as const) {
    test(`橙に変わった名札が読める (${明暗})`, async ({ page }) => {
      // `dark-ground-step.spec.ts` の 2 件は **既定の箱** が紙に沈まないことを測る。 橙に切り替わった
      // 箱はそこから外したので、 その箱の読みやすさをここで測る。
      //
      // 橙の箱は面が舞台と同じ色になり、 **分離は枠が担う**。 面と枠が互いに読めること、
      // 枠が舞台からも浮くことの 2 つを見る。
      //
      // **明暗の両方で見る**。 面の色 (`--d-accent-face`) は明暗で必要な向きが逆で、
      // 片方だけ見ていると気付けない (実測 = 明で `--d-accent-soft` を使うと 4.17)。
      await page.emulateMedia({ colorScheme: 明暗 });
      await 開く(page);

      const 色 = await page.evaluate(() => {
        // `data-cdl-active` は箱以外 (矢印 / 印) にも付く。 箱と文字を両方持つものを選ぶ
        const g = [...document.querySelectorAll('[data-cdl-active="true"]')].find(
          (e) =>
            e.querySelector('[data-cdl-role="node-body"]') !== null &&
            e.querySelector('[data-cdl-role="node-label"]') !== null,
        );
        const body = g?.querySelector('[data-cdl-role="node-body"]');
        const label = g?.querySelector('[data-cdl-role="node-label"]');
        const stage = document.querySelector(".v4-editor-stage");
        if (!body || !label || !stage) return null;
        return {
          面: getComputedStyle(body).fill,
          枠: getComputedStyle(body).stroke,
          字: getComputedStyle(label).fill,
          舞台: getComputedStyle(stage).backgroundColor,
        };
      });
      expect(色, "橙に変わった名札を測れていない").not.toBeNull();

      const 対比 = (a: string, b: string): number => {
        const L = (c: string): number => {
          const m = /rgba?\(([^)]+)\)/u.exec(c);
          if (m === null) return Number.NaN;
          // 必須の群。 一致した以上必ず取れる
          const 成分 = (m[1] ?? "").split(",").map((v) => Number(v.trim()) / 255);
          const r = 成分[0] ?? Number.NaN;
          const g = 成分[1] ?? Number.NaN;
          const bb = 成分[2] ?? Number.NaN;
          const 直線 = (v: number): number =>
            v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          return 0.2126 * 直線(r) + 0.7152 * 直線(g) + 0.0722 * 直線(bb);
        };
        const la = L(a);
        const lb = L(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };

      // 閾値は `dark-ground-step.spec.ts` が箱に課しているものと同じ 4.61 を使う
      expect(対比(色!.面, 色!.枠), "橙の枠が箱の面に沈む").toBeGreaterThanOrEqual(4.61);
      expect(対比(色!.面, 色!.字), "橙の箱の中の文字が読めない").toBeGreaterThanOrEqual(4.61);
      expect(対比(色!.舞台, 色!.枠), "橙の枠が舞台に沈む").toBeGreaterThanOrEqual(4.61);
    });
  }
});
