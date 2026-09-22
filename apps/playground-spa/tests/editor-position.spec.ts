import { test, expect, type Page } from "@playwright/test";

/**
 * 位置調整の 2 経路を画面で確かめる。
 *
 * 1. 記法に相対で書くと、 図の上で書いた通りの位置関係になる
 * 2. 「位置を表示」 で今の座標が見え、 押すと本文に座標が入る
 *
 * 本文は共有 URL (`#s=<base64>`) から流し込む。 打ち込むと CodeMirror の自動字下げが
 * 入って、 意図した字下げと違う本文になる (実測 = 行ごとに字下げが深くなった)。
 */

/** 本文を base64 にして共有 URL の形にする。 editor 側の `encodeShare` と同じ規則。 */
function shareHash(dsl: string): string {
  return Buffer.from(dsl, "utf8").toString("base64");
}

/** 図が出ない本文 (誤りを見る場合) はこちらで開く。 */
async function openRaw(page: Page, dsl: string): Promise<void> {
  await page.goto(`editor#s=${shareHash(dsl)}`);
  await page.waitForSelector(".v4-editor-code-body", { timeout: 20000 });
  await page.waitForTimeout(900);
}

async function openWith(page: Page, dsl: string): Promise<void> {
  await page.goto(`editor#s=${shareHash(dsl)}`);
  await page.waitForSelector(".v4-editor-stage svg", { timeout: 20000 });
  // 入力の debounce (300ms) と再描画を待つ
  await expect
    .poll(async () => await page.evaluate(() => (window as { __cdlEditorSrc?: string }).__cdlEditorSrc ?? ""), {
      timeout: 10000,
    })
    .toContain(dsl.split("\n")[0]!);
  await page.waitForTimeout(600);
}

/** 札に出ている座標を名前ごとに読む。 */
async function marks(page: Page): Promise<Record<string, { x: number; y: number }>> {
  const raw = await page.locator(".v4-editor-pos-mark").evaluateAll((els) =>
    els.map((el) => ({ name: (el as HTMLElement).dataset.posName ?? "", text: el.textContent ?? "" })),
  );
  const out: Record<string, { x: number; y: number }> = {};
  for (const r of raw) {
    const m = r.text.match(/^(-?\d+),(-?\d+)$/);
    if (m) out[r.name] = { x: Number(m[1]), y: Number(m[2]) };
  }
  return out;
}

const RELATIVE_DSL = `title: "位置の相対指定"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の右 200
  - DB:
      kind: database
      位置: API の下 200
flow:
  - Web -> API: "要求"
  - API -> DB: "検索"
`;

test.describe("位置調整", () => {
  test("相対で書くと図の上で書いた通りの位置関係になる", async ({ page }) => {
    await openWith(page, RELATIVE_DSL);
    await page.getByTestId("editor-toggle-positions").click();
    const m = await marks(page);
    expect(Object.keys(m).sort()).toEqual(["API", "DB", "Web"]);
    // API は Web の右、 縦は揃う
    expect(m.API!.x).toBeGreaterThan(m.Web!.x);
    expect(m.API!.y).toBe(m.Web!.y);
    // DB は API の下、 横は揃う
    expect(m.DB!.y).toBeGreaterThan(m.API!.y);
    expect(m.DB!.x).toBe(m.API!.x);
  });

  test("既定では位置を出さない (図の邪魔をしない)", async ({ page }) => {
    await openWith(page, RELATIVE_DSL);
    await expect(page.locator(".v4-editor-pos-mark")).toHaveCount(0);
    await expect(page.getByTestId("editor-toggle-positions")).toHaveAttribute("aria-pressed", "false");
  });

  test("札を押すと本文に座標が入る", async ({ page }) => {
    await openWith(page, RELATIVE_DSL);
    await page.getByTestId("editor-toggle-positions").click();
    const before = await marks(page);
    await page.locator('[data-pos-name="API"]').click();
    await page.waitForTimeout(800);
    const src = await page.evaluate(() => (window as { __cdlEditorSrc?: string }).__cdlEditorSrc ?? "");
    // 相対の記述が、 見えていた座標に置き換わる
    expect(src).toContain(`位置: ${before.API!.x},${before.API!.y}`);
    expect(src).not.toContain("Web の右 200");
  });

  test("押した後も図の位置が変わらない (座標に直しても同じ場所)", async ({ page }) => {
    await openWith(page, RELATIVE_DSL);
    await page.getByTestId("editor-toggle-positions").click();
    const before = await marks(page);
    await page.locator('[data-pos-name="API"]').click();
    await page.waitForTimeout(1000);
    const after = await marks(page);
    expect(after.API).toEqual(before.API);
  });

  test("本文に行を持たない要素には札を出さない (押しても何も起きないため)", async ({ page }) => {
    await openWith(page, RELATIVE_DSL);
    await page.getByTestId("editor-toggle-positions").click();
    const names = await page
      .locator(".v4-editor-pos-mark")
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.posName ?? ""));
    // 札が 1 つも出ていないと、下の繰り返しが 1 度も回らずに通る
    expect(names.length, "位置の札が 1 つも出ていない").toBeGreaterThan(0);
    for (const n of names) {
      expect(RELATIVE_DSL).toContain(`- ${n}`);
    }
  });

  test("効かない指定は自動配置に戻り、 理由が画面に出る", async ({ page }) => {
    // 順序図の縦位置は動かせない (縦列は横に並ぶもの)
    await openWith(
      page,
      `title: "効かない例"
type: sequence
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の下 140
  - DB: database
flow:
  - Web -> API: "a"
  - API -> DB: "b"
`,
    );
    const notices = page.getByTestId("editor-compile-notices");
    await expect(notices).toBeVisible();
    await expect(notices).toContainText("API");
    await expect(notices).toContainText("効きません");
    /*
     * 板には置き場所が 1 つも無い (#1477)。
     *
     * 元は「重なりを作らずに自動配置へ戻る」 を、`Web` と `API` の印の左右で見ていた。
     * `#1466` で順序図が 1 枚の板になり、登場人物は板の中の行になったので、
     * 人物ごとの置き場所という概念自体が消えた = 比べる 2 点が作れない。
     *
     * 代わりに **印が 1 つも出ないこと** を見る。 書いた位置が効かないまま人物ごとの箱が
     * 戻れば印が出るので、この形でも「効かない指定が黙って効く」 は落とせる。
     */
    await page.getByTestId("editor-toggle-positions").click();
    const m = await marks(page);
    expect(Object.keys(m), "板に人物ごとの置き場所が出ている").toEqual([]);
  });

  test("書き方が読めない位置は誤りとして出す", async ({ page }) => {
    await openRaw(
      page,
      `title: "読めない例"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: まんなかへん
flow:
  - Web -> API: "a"
`,
    );
    await expect(page.locator(".v4-editor-error")).toContainText("位置の書き方が読めません");
  });
});

test.describe("光らせる相手", () => {
  test("居ない相手を書くと理由が画面に出る", async ({ page }) => {
    await openWith(
      page,
      `title: "光らせる相手の誤り"
type: sequence
actors:
  - Client
  - api-gateway
flow:
  - Client -> api-gateway: "要求"
animation:
  - step: "呼ぶ" 1.4s
    focus: [Client, いない人]
`,
    );
    const notices = page.getByTestId("editor-compile-notices");
    await expect(notices).toBeVisible();
    await expect(notices).toContainText("いない人");
    // 何が書けるか分かるよう、 居る名前を並べる
    await expect(notices).toContainText("api-gateway");
  });

  test("名前に `-` を含む相手は誤り扱いにしない", async ({ page }) => {
    await openWith(
      page,
      `title: "ハイフンを含む名前"
type: sequence
actors:
  - Client
  - api-gateway
flow:
  - Client -> api-gateway: "要求"
animation:
  - step: "呼ぶ" 1.4s
    focus: [Client, api-gateway]
`,
    );
    await expect(page.getByTestId("editor-compile-notices")).toHaveCount(0);
  });
});
