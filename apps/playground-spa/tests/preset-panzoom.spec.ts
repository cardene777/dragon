/**
 * ひな形の詳細画面の図の倍率・ホイール・ドラッグの検査 (#1964)。
 *
 * 台は幅に合わせて描くので、カタログの並べて見る側と同じ扱いにしている。
 *
 * | 操作 | 何が起きるか |
 * |---|---|
 * | 倍率の欄のボタン | 描かれた倍率から次の刻みへ動く |
 * | `Ctrl` + ホイール (つまみ操作も同じ形で届く) | カーソルの下の点を残して拡大縮小 |
 * | 修飾キー無しのホイール | 画面を送る (奪わない) |
 * | 倍率を指定した図のドラッグ | 横は台の内側、縦は画面ごと巻き取る |
 *
 * ここで見るのは **実際に描かれた図の外枠と巻き取りの位置**。 倍率の状態や属性だけを見ると、
 * CSS の側や巻き取りを当て損ねても通る検査になる。
 *
 * 部品と倍率の決まりそのものは `catalog-panzoom.spec.ts` と `src/lib/diagram-zoom.test.ts` が見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test preset-panzoom`
 */
import { test, expect } from "@playwright/test";
import { 倍率の刻み } from "../src/lib/diagram-zoom";

type Page = import("@playwright/test").Page;
type 外枠 = { 左: number; 上: number; 幅: number; 高さ: number; 倍率: number; vbW: number };

test.use({ actionTimeout: 10_000, viewport: { width: 1440, height: 900 } });

const 欄 = ".nm-preset-detail-tools";
const 残す誤差 = 2;

const 上げる = (page: Page) => page.locator(欄).getByRole("button", { name: "図の倍率を上げる" });
const 表示 = (page: Page) => page.locator(`${欄} .cdl-zoom-value`);
const 幅に合わせる = (page: Page) =>
  page.locator(欄).getByRole("button", { name: "幅に合わせる", exact: true });

/** 台の中の図の svg の箱と、同じ時点の倍率の欄の字 */
type 台の読み = {
  左: number;
  上: number;
  幅: number;
  高さ: number;
  vbW: number;
  vbH: number;
  /** 描いている図の識別子 (`data-cdl-diagram`)。 ひな形ごとに違う */
  図: string;
  欄の字: string;
  ボタン: string;
};

/**
 * 台の図と倍率の欄を **同じ時点で** 読む。 ページの中で実行する (`page.evaluate` に渡す) ので、外の値を使わない。
 *
 * 図と欄を別々の往復で読むと、その間に描き直された時に、画面に 1 度も出ていない食い違いを検査が作る。
 */
function 台を読む(): 台の読み | null {
  const svg = [
    ...document.querySelectorAll<SVGSVGElement>(
      ".nm-preset-detail-stage [data-cdl-diagram] svg[viewBox]",
    ),
  ].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  if (!svg) return null;
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const 字 = (選び方: string): string =>
    (document.querySelector(`.nm-preset-detail-tools ${選び方}`)?.textContent ?? "").trim();
  return {
    左: r.left,
    上: r.top,
    幅: r.width,
    高さ: r.height,
    vbW: vb.width,
    vbH: vb.height,
    図: svg.closest("[data-cdl-diagram]")?.getAttribute("data-cdl-diagram") ?? "",
    欄の字: 字(".cdl-zoom-value"),
    ボタン: 字(".cdl-zoom-fit"),
  };
}

/** svg の箱の中に縦横比を保って描いた時の倍率 */
const 描かれた倍率 = (読み: 台の読み): number => Math.min(読み.幅 / 読み.vbW, 読み.高さ / 読み.vbH);

/** 台の中の図が実際に描かれている外枠 (箱の中に縦横比を保って描かれた範囲) */
async function 図の外枠(page: Page): Promise<外枠> {
  const 測った = await page.evaluate(台を読む);
  if (!測った) throw new Error("台の中に図が見つからない (検査が空振りしている)");
  const 倍率 = 描かれた倍率(測った);
  const 幅 = 測った.vbW * 倍率;
  const 高さ = 測った.vbH * 倍率;
  return {
    左: 測った.左 + (測った.幅 - 幅) / 2,
    上: 測った.上 + (測った.高さ - 高さ) / 2,
    幅,
    高さ,
    倍率,
    vbW: 測った.vbW,
  };
}

async function 巻き取りの位置(page: Page): Promise<{ 横: number; 縦: number }> {
  return await page.evaluate(() => {
    const 内側 = document.querySelector(".nm-preset-detail-stage-inner");
    if (!内側) throw new Error("台の内側が見つからない (検査が空振りしている)");
    return { 横: 内側.scrollLeft, 縦: window.scrollY };
  });
}

const 百分率 = (倍率: number): string => `${Math.round(倍率 * 100)}%`;

/**
 * ひな形を移った後、台の図が `前の図` から替わるまで待ち、替わった時点の図と欄を返す (#2044)。
 *
 * **欄は待たない**。 図と欄は同じ描画で替わる (`useDiagramPanZoom` が画面に出す前に測る) ので、
 * 図が替わった時点で欄が替わっていなければ、それ自体が壊れている。 欄が追い付くまで待つ形にすると、
 * 欄だけが遅れて前の図の百分率を出す壊れ方を見逃す (直す前は 16 本同時で
 * `flow: 欄「60%」 描かれた倍率 200%` が 500ms 経っても残った)。
 *
 * 図が替わるのを待つのは、移り終わる前に読むと前の図と前の欄どうしを比べ、移った先の図を
 * 1 度も確かめずに通るため。 読む間隔を短くして、図が替わった直後を読む。
 */
async function 移った先を読む(page: Page, 前の図: string | null): Promise<台の読み> {
  const 最後 = { 読み: null as 台の読み | null };
  await expect
    .poll(
      async () => {
        最後.読み = await page.evaluate(台を読む);
        return 最後.読み !== null && 最後.読み.図 !== 前の図;
      },
      { message: `台の図が ${前の図} から替わらない`, timeout: 10_000, intervals: [16] },
    )
    .toBe(true);
  if (!最後.読み) throw new Error("台の中に図が見つからない (検査が空振りしている)");
  return 最後.読み;
}

const 上の刻み = (倍率: number): number => {
  const 刻み = 倍率の刻み.find((x) => x > 倍率 + 1e-6);
  if (刻み === undefined)
    throw new Error(`${倍率} より大きい刻みが無い (この図では上げる向きを確かめられない)`);
  return 刻み;
};

async function 開く(page: Page, slug: string): Promise<void> {
  await page.goto(`preset/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
}

/** 巻き取れる大きさまで拡げる (横に長いスイムレーンを 2 回上げると 100%、台の幅 1150px を超える) */
async function 巻き取れるまで拡げる(page: Page): Promise<void> {
  await 上げる(page).click();
  await 上げる(page).click();
  await page.waitForTimeout(400);
  const 巻き取り = await page.evaluate(() => {
    const 内側 = document.querySelector(".nm-preset-detail-stage-inner");
    return 内側 ? 内側.scrollWidth - 内側.clientWidth : 0;
  });
  expect(
    巻き取り,
    "拡げても台の内側が巻き取れない (検査が確かめたい形になっていない)",
  ).toBeGreaterThan(100);
}

test.describe("ひな形の詳細画面の図の倍率 (#1964)", () => {
  test("既定は幅に合わせる = 描かれた倍率を欄に出す", async ({ page }) => {
    await 開く(page, "swimlane");
    await expect(幅に合わせる(page)).toBeDisabled();
    const 枠 = await 図の外枠(page);
    await expect(表示(page)).toHaveText(百分率(枠.倍率));
  });

  test("倍率を上げると、描かれていた倍率の次に大きい刻みで viewBox の幅 × 倍率 に描かれる", async ({
    page,
  }) => {
    await 開く(page, "swimlane");
    const 前 = await 図の外枠(page);
    const 次 = 上の刻み(前.倍率);
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText(百分率(次));
    const 後 = await 図の外枠(page);
    expect(Math.abs(後.幅 - 後.vbW * 次), `描かれた幅 ${後.幅}px`).toBeLessThan(2);
    await expect(幅に合わせる(page)).toBeEnabled();
  });

  test("Ctrl を押したホイールで拡大し、カーソルの下の点が残る", async ({ page }) => {
    await 開く(page, "swimlane");
    await 巻き取れるまで拡げる(page);
    const 前 = await 図の外枠(page);
    const 点 = { x: 700, y: Math.min(前.上 + 前.高さ * 0.5, 850) };
    const 割合 = { x: (点.x - 前.左) / 前.幅, y: (点.y - 前.上) / 前.高さ };
    expect(割合.x, "カーソルを置く点が図の外にある (検査が図に届いていない)").toBeGreaterThan(0.05);
    expect(割合.x).toBeLessThan(0.95);
    expect(割合.y, "カーソルを置く点が図の外にある (検査が図に届いていない)").toBeGreaterThan(0.05);
    expect(割合.y).toBeLessThan(0.95);
    await page.mouse.move(点.x, 点.y);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Control");
    await page.waitForTimeout(400);
    const 後 = await 図の外枠(page);
    expect(後.幅, "図の描かれた幅が変わっていない").toBeGreaterThan(前.幅 + 50);
    const ずれ = { x: 後.左 + 後.幅 * 割合.x - 点.x, y: 後.上 + 後.高さ * 割合.y - 点.y };
    expect(Math.abs(ずれ.x), `横に ${ずれ.x}px ずれた`).toBeLessThanOrEqual(残す誤差);
    expect(Math.abs(ずれ.y), `縦に ${ずれ.y}px ずれた`).toBeLessThanOrEqual(残す誤差);
  });

  test("修飾キー無しのホイールは図の幅を変えず、画面を送る", async ({ page }) => {
    await 開く(page, "swimlane");
    // 上向き (拡大の向き) に回して、奪われたら幅が変わる形にする。 上へ送れるよう先に下げる
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(200);
    const 前 = await 図の外枠(page);
    const 頁の前 = await 巻き取りの位置(page);
    expect(頁の前.縦, "画面を下げられない (検査が送る向きを確かめられない)").toBeGreaterThan(0);
    await page.mouse.move(前.左 + 前.幅 / 2, 前.上 + 前.高さ / 2);
    await page.mouse.wheel(0, -150);
    await page.waitForTimeout(400);
    const 後 = await 図の外枠(page);
    expect(Math.abs(後.幅 - 前.幅), "修飾キー無しのホイールで図の幅が変わった").toBeLessThan(1);
    expect((await 巻き取りの位置(page)).縦, "画面を送る操作が奪われた").toBeLessThan(頁の前.縦);
  });

  test("拡げた図をドラッグすると、ドラッグした向きと逆に巻き取る", async ({ page }) => {
    await 開く(page, "swimlane");
    await 巻き取れるまで拡げる(page);
    await page.evaluate(() => {
      const 内側 = document.querySelector(".nm-preset-detail-stage-inner");
      if (内側) 内側.scrollLeft = 100;
    });
    const 枠 = await 図の外枠(page);
    const 前 = await 巻き取りの位置(page);
    const 始め = { x: 700, y: 枠.上 + 枠.高さ / 2 };
    await page.mouse.move(始め.x, 始め.y);
    await page.mouse.down();
    await page.mouse.move(始め.x - 45, 始め.y - 15, { steps: 3 });
    await page.mouse.move(始め.x - 90, 始め.y - 30, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const 後 = await 巻き取りの位置(page);
    expect(Math.abs(後.横 - 前.横 - 90), `横の巻き取り ${前.横} → ${後.横}`).toBeLessThanOrEqual(
      残す誤差,
    );
    expect(Math.abs(後.縦 - 前.縦 - 30), `縦の巻き取り ${前.縦} → ${後.縦}`).toBeLessThanOrEqual(
      残す誤差,
    );
  });

  test("段の札は図を巻き取っても台の中の同じ位置に残る", async ({ page }) => {
    await 開く(page, "swimlane");
    await 巻き取れるまで拡げる(page);
    const 札の左 = async (): Promise<number | null> =>
      await page.evaluate(
        () =>
          document.querySelector(".nm-preset-detail-stage .cdl-phase-chip")?.getBoundingClientRect()
            .left ?? null,
      );
    const 前 = await 札の左();
    expect(前, "段の札が見つからない (検査が空振りしている)").not.toBeNull();
    await page.evaluate(() => {
      const 内側 = document.querySelector(".nm-preset-detail-stage-inner");
      if (内側) 内側.scrollLeft = 300;
    });
    await page.waitForTimeout(200);
    expect(await 札の左(), "段の札が図と一緒に流れた").toBe(前);
  });

  test("前へ / 次へで別のひな形へ移ると、幅に合わせる状態へ戻る", async ({ page }) => {
    await 開く(page, "swimlane");
    await 上げる(page).click();
    await page.waitForTimeout(300);
    await expect(幅に合わせる(page)).toBeEnabled();
    await page.getByRole("link", { name: /^次へ/ }).click();
    await page.waitForTimeout(700);
    await expect(幅に合わせる(page)).toBeDisabled();
    const 枠 = await 図の外枠(page);
    await expect(表示(page)).toHaveText(百分率(枠.倍率));
  });

  test("ひな形の全ての詳細画面で、欄の文字が描かれた倍率の百分率になる", async ({ page }) => {
    test.setTimeout(180_000);
    await 開く(page, "swimlane");
    const 位置の札 = page.locator(".nm-preset-detail-nav span.font-mono");
    const 総数 = Number(((await 位置の札.textContent()) ?? "").match(/\/\s*(\d+)/)?.[1]);
    expect(総数, "ひな形の総数を読めていない (検査が空振りしている)").toBeGreaterThan(0);

    const 見た = new Set<string>();
    const 外れ: string[] = [];
    const 読んだ図 = new Set<string>();
    let 前の図: string | null = null;
    for (let i = 0; i < 総数; i += 1) {
      const 読み = await 移った先を読む(page, 前の図);
      読んだ図.add(読み.図);
      // URL は図より先に替わるので、図が替わった後に読めば移った先の slug になる
      const slug = new URL(page.url()).pathname.split("/").pop() ?? "";
      見た.add(slug);
      const 描かれた = 百分率(描かれた倍率(読み));
      if (読み.欄の字 !== 描かれた || 読み.欄の字 === 読み.ボタン) {
        外れ.push(`${slug}: 欄「${読み.欄の字}」 描かれた倍率 ${描かれた}`);
      }
      前の図 = 読み.図;
      await page.getByRole("link", { name: /^次へ/ }).click();
    }
    expect(見た.size, "ひな形を全て回っていない").toBe(総数);
    // 移った先の図を読む前に前の図を読むと、どこかで同じ図を 2 度読み、読まない図が残る
    expect(読んだ図.size, "移り終わる前の図を読んでいる (移った先の図を確かめていない)").toBe(総数);
    expect(外れ, "欄の文字が描かれた倍率の百分率になっていない").toEqual([]);
  });
});
