import { test, expect, type Page } from "@playwright/test";

/**
 * 自動修正の button を押すと本文が書き換わることを画面で確かめる (#992)。
 *
 * 判定 (`lib/auto-fix-offsets`) と書き戻し (`lib/auto-fix-dsl`) は純関数として test 済だが、
 * **呼出そのものと button との配線** は覆えていなかった。 codex review の指摘 =
 * 「実際の auto-fix が完全に壊れても 19 件は通る」。
 *
 * 本文は共有 URL (`#s=<base64>`) から流し込む。 打ち込むと CodeMirror の自動字下げが入る。
 */

/** 本文を base64 にして共有 URL の形にする。 editor 側の `encodeShare` と同じ規則。 */
function shareHash(dsl: string): string {
  return Buffer.from(dsl, "utf8").toString("base64");
}

/**
 * 自動修正の対象になる警告を出す本文。
 *
 * `b` を右に大きく離して線を長くすると、 label の箱が線から離れて `edge-label-proximity` が出る
 * (実測 = 110px 離れ、 閾値 80px)。 この軸は `FIXABLE_WARNING_AXES` に含まれる。
 *
 * **箱の大きさを書く** (#1498)。 cdl 0.20.0 から高さは書いた段の数で決まり、名前だけの
 * `service` は 54 になる。 箱が低いと label は箱の上端から 32 空ければよく、線からの距離が
 * 77 に縮んで閾値 (80) を下回る = 警告が 1 件も出ず、この検査が何も通せなくなる。
 */
const DSL = `title: "自動修正の見本"
type: flow
actors:
  - a:
      kind: service
      大きさ: 320,116
  - b:
      kind: service
      位置: a の右 400
      大きさ: 320,116
flow:
  - a -> b: とてもとてもながいラベルの文字列テスト
`;

/** editor を開いて本文が届くまで待つ。 */
async function open(page: Page, dsl: string): Promise<void> {
  await page.goto(`editor#s=${shareHash(dsl)}`);
  await page.waitForSelector(".v4-editor-code-body", { timeout: 20000 });
  await expect
    .poll(async () => await page.evaluate(() => (window as { __cdlEditorSrc?: string }).__cdlEditorSrc ?? ""), {
      timeout: 15000,
    })
    .toContain(dsl.split("\n")[0]);
  await page.waitForTimeout(800);
}

/** 本文の全文を読む (CodeMirror は表示外の行を DOM に出さない)。 */
const srcOf = (page: Page): Promise<string> =>
  page.evaluate(() => (window as { __cdlEditorSrc?: string }).__cdlEditorSrc ?? "");

test.describe("自動修正の button (#992)", () => {
  test("押すと本文の edge 行に labelOffsetY が入る", async ({ page }) => {
    await open(page, DSL);

    // **警告が出ていることを先に確かめる**。 engine 側の改善で警告が消えると、 この test は
    // 何も検査しないまま通ってしまう (issue の「破れる条件」)。
    const badge = page.locator(".v4-editor-warnings-badge");
    await expect(badge, "位置関係の警告が 1 件も出ていない").toBeVisible();

    // 対応可の件数が 1 件以上あること。 0 件だと button が無効で経路を通せない。
    const button = page.locator(".v4-editor-warnings-apply");
    await expect(button, "対応可 0 件で button が無効").toBeEnabled();
    await expect(button).toContainText("一括反映");

    expect(await srcOf(page), "はじめから offset が入っている").not.toContain("labelOffsetY");

    await button.click();

    await expect
      .poll(async () => await srcOf(page), { timeout: 10000 })
      .toContain("labelOffsetY");

    const src = await srcOf(page);
    // 書き戻し先は `flow:` 配下の edge 行。 他の行に入っていたら対応付けが壊れている。
    const line = src.split("\n").find((l) => l.includes("labelOffsetY"));
    expect(line, "labelOffsetY を書いた行が無い").toBeDefined();
    expect(line, "edge 行以外に書かれている").toMatch(/->/);
    expect(line, "既存の本文が消えている").toContain("とてもとてもながいラベルの文字列テスト");
  });

  test("反映した件数を知らせる", async ({ page }) => {
    await open(page, DSL);
    await page.locator(".v4-editor-warnings-apply").click();
    // 件数は差し込みで入るので、知らせのうち字で書かれている所を見る
    // (`CdlEditor.tsx` の 2 通りの文がどちらも持つ部分、#1834)
    await expect(page.getByRole("status")).toContainText("記法に書き戻しました");
  });

  test("2 回押しても値が積み上がらない", async ({ page }) => {
    // 既存の `labelOffsetY` を消してから足す。 消さないと押すたびに増える。
    await open(page, DSL);
    const button = page.locator(".v4-editor-warnings-apply");
    await button.click();
    await expect.poll(async () => await srcOf(page), { timeout: 10000 }).toContain("labelOffsetY");
    const first = await srcOf(page);
    expect((first.match(/labelOffsetY/g) ?? []).length, "1 回目で 1 件入っていない").toBe(1);

    // **2 回目は必ず押す**。 `isEnabled()` で飛ばすと、 1 回目の後に button が誤って無効化
    // される退行も、 警告が消えて空振りする形も検出できない (codex review Round 1 の指摘)。
    await expect(button, "1 回目の後に button が無効になっている").toBeEnabled({ timeout: 10000 });
    await button.click();
    await page.waitForTimeout(1500);

    const second = await srcOf(page);
    expect((second.match(/labelOffsetY/g) ?? []).length, "同じ行に 2 つ入っている").toBe(1);
  });

  test("対応外の警告しか無ければ button が無効で、 何をすべきか出る", async ({ page }) => {
    // 対応外の軸だけを出す本文。 押せてしまうと、 押しても何も起きない状態になる。
    await open(
      page,
      `title: "対応外だけ"
type: flow
actors:
  - a: service
  - b: service
flow:
  - a -> b: 短い
`,
    );
    // 警告の枠と button が出ることを先に確かめる。 `count()` は待たないので、 描画が遅い時に
    // 無検証で通ってしまう (codex review Round 1 の指摘)。
    await expect(page.locator(".v4-editor-warnings-badge")).toBeVisible({ timeout: 15000 });
    const button = page.locator(".v4-editor-warnings-apply");
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    await expect(button).toContainText("直せるものなし");
  });

  test("行順と edge 順が食い違っても正しい行に入る", async ({ page }) => {
    // `type: flow` の preset は actor を宣言順に鎖状に繋ぐ = `a -> c` と書いても `a -> b` の
    // edge になる。 組み立て側が返す行番号 (#998) を使わないと別の行を書き換える。
    //
    // **箱の大きさを書く** (#1709)。 上の見本と同じ理由 (#1498) で、名前だけの `service` は
    // 高さ 54 になり label が線から 80px 以内に収まる = 直せる警告が 1 件も出ず、button が
    // 押せないまま落ちる。 大きさを書くと 110px / 86px 離れて 2 件出る (実測)。
    await open(
      page,
      `title: "行順と edge 順が違う"
type: flow
actors:
  - a:
      kind: service
      大きさ: 320,116
  - b:
      kind: service
      位置: a の右 500
      大きさ: 320,116
  - c:
      kind: service
      位置: a の右 250
      大きさ: 320,116
flow:
  - a -> c: とてもとてもながいラベルの文字列テストです
  - c -> b: みじかい
`,
    );
    const button = page.locator(".v4-editor-warnings-apply");
    // 対応外の警告しか出ない図では押せない。 その場合は本 test の前提が崩れているので落とす。
    await expect(button, "対応可 0 件で button が無効").toBeEnabled({ timeout: 15000 });
    await button.click();
    await expect.poll(async () => await srcOf(page), { timeout: 10000 }).toContain("labelOffsetY");

    // 組み立て側は `e-b-c` に長いラベルを、 `e-a-b` に短い方を載せる (actor の鎖)。 行との
    // 対応が壊れていると、 長いラベルの警告に対する offset が短い方の行に入る。
    const lines = (await srcOf(page)).split("\n").filter((l) => l.includes("labelOffsetY"));
    expect(lines.length, "1 行も書き換わっていない").toBeGreaterThan(0);
    const long = lines.find((l) => l.includes("とてもとてもながいラベルの文字列テストです"));
    expect(long, "長いラベルの行に入っていない").toBeDefined();
  });

  test("パーツが本文の前にあっても正しい行に入る", async ({ page }) => {
    // パーツの行は組み立て前に抜かれるので、 組み立て側が返す行番号は本文の座標とずれる。
    // 戻さないと `flow:` より前にパーツがある本文で別の行を書き換える (#998)。
    await open(
      page,
      `title: "パーツが前にある"
type: flow
actors:
  - g:
      kind: arc-gauge
  - a:
      kind: service
      大きさ: 320,116
  - b:
      kind: service
      位置: a の右 500
      大きさ: 320,116
  - c:
      kind: service
      位置: a の右 250
      大きさ: 320,116
flow:
  - a -> c: とてもとてもながいラベルの文字列テストです
  - c -> b: みじかい
`,
    );
    const button = page.locator(".v4-editor-warnings-apply");
    await expect(button, "対応可 0 件で button が無効").toBeEnabled({ timeout: 15000 });
    await button.click();
    await expect.poll(async () => await srcOf(page), { timeout: 10000 }).toContain("labelOffsetY");

    const src = await srcOf(page);
    for (const line of src.split("\n")) {
      if (!line.includes("labelOffsetY")) continue;
      expect(line, "edge 行以外に書かれている").toMatch(/->/);
    }
    const long = src.split("\n").find((l) => l.includes("labelOffsetY"));
    expect(long, "長いラベルの行に入っていない").toContain("とてもとてもながいラベルの文字列テストです");
  });

  /**
   * 行順と edge 順が食い違う形は browser からは作れない。 `type: flow` の preset は actor を
   * 鎖状に繋いだ edge を作り、 DSL の step とは対応しない (実測 = `a -> c` / `c -> b` と書くと
   * `e-a-b: みじかい` / `e-b-c: とてもとても…` になり from/to も label の並びも食い違う)。
   * その形で出る警告は `edge-label-clearance` で、 自動修正の対象外なので button が無効になる。
   *
   * 誤った行に書き込まないことは `lib/auto-fix-dsl.test.ts` の「行の順番と edge の順番が違っても
   * 正しい行に当てる」 と「対応する行が無ければ unmatched に入れる」 で覆う。 compile 側が
   * step と edge の対応を持たない点は #998 で扱う。
   */
});
