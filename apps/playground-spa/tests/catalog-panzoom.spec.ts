/**
 * カタログの図のホイール・つまみ・ドラッグの検査 (#1961)。
 *
 * 並べて見る側と拡大表示の両方で、倍率のボタンのほかに次の操作を受ける。
 *
 * | 操作 | 並べて見る側 | 拡大表示 |
 * |---|---|---|
 * | `Ctrl` + ホイール (つまみ操作も同じ形で届く) | 拡大縮小 | 拡大縮小 |
 * | 修飾キー無しのホイール | 頁を送る (奪わない) | 拡大縮小 |
 * | 倍率を指定した図のドラッグ | 巻き取る | 巻き取る |
 *
 * ここで見るのは **実際に描かれた図の外枠と巻き取りの位置**。 倍率の状態や属性だけを見ると、
 * 巻き取りを当て損ねても通る検査になる。
 *
 * 図の外枠は svg の箱ではなく、箱の中に縦横比を保って描かれた範囲で測る。 拡大表示で器に収めると
 * 箱は器いっぱいに広がるが、縦に長い図はその中央に細く描かれる。
 *
 * 倍率の決まり (刻み・ホイールの効き・巻き取りの差の式) は `src/lib/diagram-zoom.test.ts` が見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-panzoom`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;
type 外枠 = { 左: number; 上: number; 幅: number; 高さ: number };

test.use({ actionTimeout: 10_000, viewport: { width: 1440, height: 900 } });

const 並び = ".catalog-preview-stage";
const 並びの操作 = ".catalog-preview-actions";
const 拡大 = ".cdl-modal-content";

/** カーソルの下にあった図の点が、操作の後に同じ画面の位置に残っているとみなす距離 (px) */
const 残す誤差 = 2;

/** 場所の中の図が実際に描かれている外枠 (画面の座標) */
async function 図の外枠(page: Page, 場所: string): Promise<外枠> {
  const 測った = await page.evaluate((場所) => {
    const 根 = document.querySelector(場所);
    if (!根) return null;
    const 候補 = [...根.querySelectorAll<SVGSVGElement>("[data-cdl-diagram] svg[viewBox]")]
      .map((svg) => ({ svg, r: svg.getBoundingClientRect() }))
      .sort((a, b) => b.r.width - a.r.width)[0];
    if (!候補) return null;
    const vb = 候補.svg.viewBox.baseVal;
    return {
      左: 候補.r.left,
      上: 候補.r.top,
      幅: 候補.r.width,
      高さ: 候補.r.height,
      vbW: vb.width,
      vbH: vb.height,
    };
  }, 場所);
  if (!測った) throw new Error(`${場所} の中に図が見つからない (検査が空振りしている)`);
  // 縦横比を保って箱の中央に描かれる (`preserveAspectRatio` の既定)
  const 倍率 = Math.min(測った.幅 / 測った.vbW, 測った.高さ / 測った.vbH);
  const 幅 = 測った.vbW * 倍率;
  const 高さ = 測った.vbH * 倍率;
  return {
    左: 測った.左 + (測った.幅 - 幅) / 2,
    上: 測った.上 + (測った.高さ - 高さ) / 2,
    幅,
    高さ,
  };
}

/** 巻き取りの位置。 並べて見る側は横を内側が、縦を頁が持つ */
async function 巻き取りの位置(
  page: Page,
  場所: "並び" | "拡大",
): Promise<{ 横: number; 縦: number }> {
  return await page.evaluate((場所) => {
    if (場所 === "拡大") {
      const 本体 = document.querySelector(".cdl-modal-body");
      if (!本体) throw new Error("拡大表示の本体が見つからない (検査が空振りしている)");
      return { 横: 本体.scrollLeft, 縦: 本体.scrollTop };
    }
    const 内側 = document.querySelector(".catalog-preview-stage-inner");
    if (!内側) throw new Error("台の内側が見つからない (検査が空振りしている)");
    return { 横: 内側.scrollLeft, 縦: window.scrollY };
  }, 場所);
}

/** 図の中の割合 (0〜1) の点が、画面のどこにあるか */
const 図の点 = (枠: 外枠, 割合: { x: number; y: number }) => ({
  x: 枠.左 + 枠.幅 * 割合.x,
  y: 枠.上 + 枠.高さ * 割合.y,
});

async function 図を選ぶ(page: Page, 分類: string, 名前: string, パターン?: string): Promise<void> {
  await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  if (パターン !== undefined) {
    await page
      .getByRole("radiogroup", { name: "パターン" })
      .getByRole("radio", { name: パターン })
      .click();
  }
  await page.waitForTimeout(600);
}

async function 拡大を開く(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /を拡大表示$/ })
    .first()
    .click();
  await expect(page.locator(拡大)).toBeVisible();
  await page.waitForTimeout(600);
}

/** カーソルを置いてホイールを回す。 `Ctrl` を渡すとつまみ操作と同じ `ctrlKey` 付きの `wheel` になる */
async function 回す(
  page: Page,
  点: { x: number; y: number },
  deltaY: number,
  Ctrl: boolean,
): Promise<void> {
  await page.mouse.move(点.x, 点.y);
  if (Ctrl) await page.keyboard.down("Control");
  await page.mouse.wheel(0, deltaY);
  if (Ctrl) await page.keyboard.up("Control");
  await page.waitForTimeout(400);
}

/**
 * 画面の点にカーソルを置いて回し、その下にあった図の点が同じ画面の位置に残ったかを確かめる。
 *
 * 点は図の上かつ画面の中に入る所を選ぶ = 外すとホイールが図に届かず何も起きず、ずれも 0 で通ってしまう。
 */
async function カーソルの下が残るか(
  page: Page,
  場所: string,
  点: { x: number; y: number },
  deltaY: number,
  Ctrl: boolean,
): Promise<{ 前: 外枠; 後: 外枠; ずれ: { x: number; y: number } }> {
  const 前 = await 図の外枠(page, 場所);
  const 割合 = { x: (点.x - 前.左) / 前.幅, y: (点.y - 前.上) / 前.高さ };
  for (const [軸, 値] of Object.entries(割合)) {
    expect(値, `カーソルを置く点が図の外にある (${軸}、検査が図に届いていない)`).toBeGreaterThan(
      0.05,
    );
    expect(値, `カーソルを置く点が図の外にある (${軸}、検査が図に届いていない)`).toBeLessThan(0.95);
  }
  expect(点.y, "カーソルを置く点が画面の外にある (検査が図に届いていない)").toBeLessThan(880);
  expect(点.y).toBeGreaterThan(0);
  await 回す(page, 点, deltaY, Ctrl);
  const 後 = await 図の外枠(page, 場所);
  const 同じ点 = 図の点(後, 割合);
  return { 前, 後, ずれ: { x: 同じ点.x - 点.x, y: 同じ点.y - 点.y } };
}

async function ドラッグする(
  page: Page,
  始め: { x: number; y: number },
  動き: { x: number; y: number },
): Promise<void> {
  await page.mouse.move(始め.x, 始め.y);
  await page.mouse.down();
  await page.mouse.move(始め.x + 動き.x / 2, 始め.y + 動き.y / 2, { steps: 4 });
  await page.mouse.move(始め.x + 動き.x, 始め.y + 動き.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

test.describe("並べて見る側のホイールとドラッグ (#1961)", () => {
  test("Ctrl を押したホイールで拡大し、カーソルの下の点が残る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    const 枠 = await 図の外枠(page, 並び);
    const 点 = { x: 枠.左 + 枠.幅 * 0.3, y: Math.min(枠.上 + 枠.高さ * 0.3, 700) };
    const r = await カーソルの下が残るか(page, 並び, 点, -100, true);
    expect(r.後.幅, "図の描かれた幅が変わっていない").toBeGreaterThan(r.前.幅 + 50);
    expect(Math.abs(r.ずれ.x), `横に ${r.ずれ.x}px ずれた`).toBeLessThanOrEqual(残す誤差);
    expect(Math.abs(r.ずれ.y), `縦に ${r.ずれ.y}px ずれた`).toBeLessThanOrEqual(残す誤差);
    // 器に収めた状態を離れた = 「幅に合わせる」 が押せる
    await expect(
      page.locator(並びの操作).getByRole("button", { name: "幅に合わせる", exact: true }),
    ).toBeEnabled();
  });

  test("Ctrl を押したホイールで縮めても、カーソルの下の点が残る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    // 巻き取れる大きさまで拡げてから縮める = 収まった図は中央に寄るので、残す位置が決まらない
    for (let i = 0; i < 2; i += 1) {
      await page.locator(並びの操作).getByRole("button", { name: "並びの倍率を上げる" }).click();
    }
    await page.waitForTimeout(400);
    // 縮めると点は左上へ寄るので、戻す向き (左と上) に巻き取れる余地を先に作る
    await page.evaluate(() => {
      const 内側 = document.querySelector(".catalog-preview-stage-inner");
      if (内側) 内側.scrollLeft = 400;
      window.scrollTo(0, 400);
    });
    await page.waitForTimeout(200);
    const r = await カーソルの下が残るか(page, 並び, { x: 700, y: 500 }, 100, true);
    expect(r.後.幅, "図の描かれた幅が縮んでいない").toBeLessThan(r.前.幅 - 50);
    expect(Math.abs(r.ずれ.x), `横に ${r.ずれ.x}px ずれた`).toBeLessThanOrEqual(残す誤差);
    expect(Math.abs(r.ずれ.y), `縦に ${r.ずれ.y}px ずれた`).toBeLessThanOrEqual(残す誤差);
  });

  test("修飾キー無しのホイールは図の幅を変えず、頁を送る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    /*
     * 上向き (拡大の向き) に回す。 下向きだと、器に収めた 38% の図は刻みの下端 (50%) より小さく、
     * 拡大に使われても外へは縮まないので、幅の判定が奪われたことを見分けられない。
     * 上向きに頁を送れるよう、先に少し下げておく。
     */
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(200);
    const 前 = await 図の外枠(page, 並び);
    const 頁の前 = await 巻き取りの位置(page, "並び");
    await 回す(page, { x: 前.左 + 前.幅 / 2, y: 450 }, -200, false);
    const 後 = await 図の外枠(page, 並び);
    expect(Math.abs(後.幅 - 前.幅), "修飾キー無しのホイールで図の幅が変わった").toBeLessThan(1);
    expect((await 巻き取りの位置(page, "並び")).縦, "一覧の頁を送る操作が奪われた").toBeLessThan(
      頁の前.縦,
    );
  });

  test("拡げた図をドラッグすると、ドラッグした向きと逆に巻き取る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await page.locator(並びの操作).getByRole("button", { name: "並びの倍率を上げる" }).click();
    await page.waitForTimeout(400);
    // 右に巻き取れる余地を作る = 左端から左へは巻き取れない
    await page.evaluate(() => {
      const 内側 = document.querySelector(".catalog-preview-stage-inner");
      if (内側) 内側.scrollLeft = 100;
    });
    const 枠 = await 図の外枠(page, 並び);
    const 前 = await 巻き取りの位置(page, "並び");
    await ドラッグする(page, 図の点(枠, { x: 0.5, y: 0.2 }), { x: -120, y: -80 });
    const 後 = await 巻き取りの位置(page, "並び");
    expect(Math.abs(後.横 - 前.横 - 120), `横の巻き取り ${前.横} → ${後.横}`).toBeLessThanOrEqual(
      残す誤差,
    );
    expect(Math.abs(後.縦 - 前.縦 - 80), `縦の巻き取り ${前.縦} → ${後.縦}`).toBeLessThanOrEqual(
      残す誤差,
    );
    // 掴んで動かした跡が字の選択で塗られない
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toBe("");
  });

  test("器に収めている図はドラッグしても巻き取らない (字の選択や図を押す操作を奪わない)", async ({
    page,
  }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    const 枠 = await 図の外枠(page, 並び);
    const 前 = await 巻き取りの位置(page, "並び");
    await ドラッグする(page, 図の点(枠, { x: 0.5, y: 0.2 }), { x: -120, y: -80 });
    expect(await 巻き取りの位置(page, "並び")).toEqual(前);
    expect(
      await page.locator(並び).getAttribute("data-cdl-pannable"),
      "収めた図に掴める見た目が出ている",
    ).toBeNull();
  });

  test("ホイールで刻みの外にした後、倍率を上げると次に大きい刻みへ動く", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    const 表示 = page.locator(`${並びの操作} .cdl-zoom-value`);
    const 数を読む = async (): Promise<number> =>
      Number((await 表示.textContent())?.match(/^(\d+)%$/)?.[1]);
    const 収めた = await 数を読む();
    const 枠 = await 図の外枠(page, 並び);
    await 回す(page, 図の点(枠, { x: 0.5, y: 0.2 }), -100, true);
    const 回した後 = await 数を読む();
    // 収めた倍率 (38%) と次の刻み (50%) の間 = 刻みの外の値になっている
    expect(回した後, "ホイールで倍率が上がっていない").toBeGreaterThan(収めた);
    expect(回した後, "ホイールで刻みまで跳ねている").toBeLessThan(50);
    await page.locator(並びの操作).getByRole("button", { name: "並びの倍率を上げる" }).click();
    await expect(表示).toHaveText("50%");
  });
});

test.describe("拡大表示のホイールとドラッグ (#1961)", () => {
  /** 巻き取れる大きさまで拡げる。 収まった図は中央に寄り、カーソルの下を残す余地が無い */
  async function 巻き取れるまで拡げる(page: Page): Promise<void> {
    for (let i = 0; i < 2; i += 1) {
      await page.locator(拡大).getByRole("button", { name: "倍率を上げる" }).click();
    }
    await page.waitForTimeout(400);
  }

  test("修飾キー無しのホイールで拡大し、カーソルの下の点が残る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 拡大を開く(page);
    await 巻き取れるまで拡げる(page);
    const r = await カーソルの下が残るか(page, 拡大, { x: 600, y: 520 }, -100, false);
    expect(r.後.幅, "図の描かれた幅が変わっていない").toBeGreaterThan(r.前.幅 + 50);
    expect(Math.abs(r.ずれ.x), `横に ${r.ずれ.x}px ずれた`).toBeLessThanOrEqual(残す誤差);
    expect(Math.abs(r.ずれ.y), `縦に ${r.ずれ.y}px ずれた`).toBeLessThanOrEqual(残す誤差);
  });

  test("Ctrl を押したホイールでも拡大し、カーソルの下の点が残る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 拡大を開く(page);
    await 巻き取れるまで拡げる(page);
    const r = await カーソルの下が残るか(page, 拡大, { x: 900, y: 420 }, -100, true);
    expect(r.後.幅, "図の描かれた幅が変わっていない").toBeGreaterThan(r.前.幅 + 50);
    expect(Math.abs(r.ずれ.x), `横に ${r.ずれ.x}px ずれた`).toBeLessThanOrEqual(残す誤差);
    expect(Math.abs(r.ずれ.y), `縦に ${r.ずれ.y}px ずれた`).toBeLessThanOrEqual(残す誤差);
  });

  test("器に収めた図をホイールで拡げると、描かれていた倍率から動く", async ({ page }) => {
    /*
     * 器に収めた `er-complex-demo` は縦に長く、箱 1150 × 630 の中央に幅 500px ほどで描かれる。
     * 箱の幅で起点を測ると 50% から動き、1 目盛で図が 2 倍を超えて跳ねる。
     */
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 拡大を開く(page);
    const 前 = await 図の外枠(page, 拡大);
    // 箱で測ると幅は約 2.3 倍になっている = 下の上限で箱の誤りを捕まえられる図を使っている
    expect(前.幅, "器に収めた図が箱の幅いっぱいに描かれている").toBeLessThan(800);
    await 回す(page, 図の点(前, { x: 0.5, y: 0.5 }), -100, false);
    const 後 = await 図の外枠(page, 拡大);
    expect(後.幅 / 前.幅, "ホイール 1 目盛で動いた割合").toBeGreaterThan(1.1);
    expect(後.幅 / 前.幅).toBeLessThan(1.5);
  });

  test("拡げた図をドラッグすると、ドラッグした向きと逆に巻き取る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 拡大を開く(page);
    await 巻き取れるまで拡げる(page);
    await page.evaluate(() => {
      const 本体 = document.querySelector(".cdl-modal-body");
      if (本体) {
        本体.scrollLeft = 100;
        本体.scrollTop = 100;
      }
    });
    const 枠 = await page.locator(".cdl-modal-body").boundingBox();
    if (!枠) throw new Error("拡大表示の本体の位置を測れない (検査が空振りしている)");
    const 前 = await 巻き取りの位置(page, "拡大");
    await ドラッグする(page, { x: 枠.x + 枠.width / 2, y: 枠.y + 枠.height / 2 }, { x: 90, y: 60 });
    const 後 = await 巻き取りの位置(page, "拡大");
    expect(Math.abs(前.横 - 後.横 - 90), `横の巻き取り ${前.横} → ${後.横}`).toBeLessThanOrEqual(
      残す誤差,
    );
    expect(Math.abs(前.縦 - 後.縦 - 60), `縦の巻き取り ${前.縦} → ${後.縦}`).toBeLessThanOrEqual(
      残す誤差,
    );
    // 掴んでいる間の見た目は離すと戻る
    expect(
      await page.locator(".cdl-modal-body").getAttribute("data-cdl-panning"),
      "離した後も掴んでいる見た目が残っている",
    ).toBeNull();
    await expect(page.locator(".cdl-modal-body")).toHaveAttribute("data-cdl-pannable", "");
  });

  test("ドラッグの直後の押す操作を 1 回だけ捨て、動かさずに押した操作は図に届く", async ({
    page,
  }) => {
    /*
     * 掴んで離すと、ブラウザは離した所で押す操作 (`click`) を起こす。 捨てないと、掴んだ所の箱が
     * 押されて状態が変わる図 (押すと開閉する図など) で、動かしただけで図が変わる。
     */
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 拡大を開く(page);
    await 巻き取れるまで拡げる(page);
    await page.evaluate(() => {
      const 本体 = document.querySelector(".cdl-modal-body");
      if (本体) 本体.scrollTop = 100;
      const 窓 = window as unknown as { 届いた押す操作: number };
      窓.届いた押す操作 = 0;
      // 本体の外側 (祖先) で数える = 本体で止めた押す操作はここへ届かない
      document.addEventListener("click", () => {
        窓.届いた押す操作 += 1;
      });
    });
    const 数 = async (): Promise<number> =>
      await page.evaluate(() => (window as unknown as { 届いた押す操作: number }).届いた押す操作);
    const 枠 = await page.locator(".cdl-modal-body").boundingBox();
    if (!枠) throw new Error("拡大表示の本体の位置を測れない (検査が空振りしている)");
    const 中央 = { x: 枠.x + 枠.width / 2, y: 枠.y + 枠.height / 2 };

    await ドラッグする(page, 中央, { x: 60, y: 40 });
    expect(await 数(), "ドラッグの直後の押す操作が図に届いた").toBe(0);

    // 動かさずに押す操作は奪わない (捨てるのは直後の 1 回だけ)
    await page.mouse.click(中央.x, 中央.y);
    await page.waitForTimeout(200);
    expect(await 数(), "動かさずに押した操作が図に届いていない").toBe(1);
  });
});

test.describe("倍率の欄に出る文字 (#1961)", () => {
  /** 欄の文字が `%` で終わる数字で、隣の「収める」 系のボタンの語と重なっていないか */
  async function 欄を読む(page: Page, 操作: string): Promise<{ 欄: string; ボタン: string }> {
    const 欄 = ((await page.locator(`${操作} .cdl-zoom-value`).textContent()) ?? "").trim();
    const ボタン = ((await page.locator(`${操作} .cdl-zoom-fit`).textContent()) ?? "").trim();
    return { 欄, ボタン };
  }

  test("ひな形の全ての図で、並べて見る側と拡大表示の欄が数字の百分率になる", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("catalog/presets", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const 名前たち = (await page.locator(".catalog-list-item-name").allTextContents()).map((s) =>
      s.trim(),
    );
    const 件数 = Number(
      ((await page.locator(".catalog-count").first().textContent()) ?? "").match(/\d+/)?.[0],
    );
    expect(名前たち.length, "一覧の名前を読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(名前たち.length, "一覧の行を全て回していない").toBe(件数);

    const 外れ: string[] = [];
    for (const [i, 名前] of 名前たち.entries()) {
      await page.locator(".catalog-list-item").nth(i).click();
      await page.waitForTimeout(300);
      const 並びの欄 = await 欄を読む(page, 並びの操作);
      await 拡大を開く(page);
      const 拡大の欄 = await 欄を読む(page, 拡大);
      await page.keyboard.press("Escape");
      await expect(page.locator(拡大)).toBeHidden();
      for (const [場所, { 欄, ボタン }] of [
        ["並べて見る側", 並びの欄],
        ["拡大表示", 拡大の欄],
      ] as const) {
        if (!/^\d+%$/.test(欄) || 欄 === ボタン)
          外れ.push(`${名前} の ${場所}: 「${欄}」 (ボタン「${ボタン}」)`);
      }
    }
    expect(外れ, "倍率の欄が数字の百分率になっていない").toEqual([]);
  });

  test("器に収めた時の欄は、実際に描かれた倍率を出す", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    const 測る = async (場所: string) =>
      await page.evaluate((場所) => {
        const svg = [
          ...document.querySelectorAll<SVGSVGElement>(`${場所} [data-cdl-diagram] svg[viewBox]`),
        ].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
        if (!svg) return null;
        const r = svg.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        return Math.round(Math.min(r.width / vb.width, r.height / vb.height) * 100);
      }, 場所);
    const 並びの倍率 = await 測る(並び);
    expect(並びの倍率, "並べて見る側の図を測れない (検査が空振りしている)").not.toBeNull();
    await expect(page.locator(`${並びの操作} .cdl-zoom-value`)).toHaveText(`${並びの倍率}%`);

    await 拡大を開く(page);
    const 拡大の倍率 = await 測る(拡大);
    expect(拡大の倍率, "拡大表示の図を測れない (検査が空振りしている)").not.toBeNull();
    // 縦に長い図なので箱の幅で割った値 (約 50%) とは違う = 箱で測る誤りを捕まえられる図を使っている
    expect(拡大の倍率).toBeLessThan(40);
    await expect(page.locator(`${拡大} .cdl-zoom-value`)).toHaveText(`${拡大の倍率}%`);
  });
});
