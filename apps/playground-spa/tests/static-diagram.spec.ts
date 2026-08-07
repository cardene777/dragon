/**
 * 動かない図が種類を問わず画面に出ることの検証 (#1086)。
 *
 * 変更前は `animation:` を書かない同じ記法を 12 種に与えると、 6 種 (sequence / flow / er /
 * state / topology / solidity) は描かれ、 6 種 (swimlane / gantt / class / pie / c4 / mind) は
 * 「cdl validate failed: phase が 0 件です」 で弾かれていた。 書く人から見ると区別する手がかりが
 * 無い。
 *
 * ## 組み立て結果ではなく画面を見る
 *
 * 「段が 1 件入った」 までは単体 test が見る (`packages/dragon/test/static-diagram.test.ts`)。
 * ここでは **画面に図が出たか** を見る。 段の数が正しくても、 描画側が別の理由で弾けば
 * 書いた人にとっては直っていない。
 */
import { test, expect } from "@playwright/test";

const TYPES = [
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "gantt",
  "class",
  "pie",
  "c4",
  "mind",
] as const;

const 静止図 = (type: string): string =>
  [
    `title: "静止 ${type}"`,
    `type: ${type}`,
    ``,
    `actors:`,
    `  - A: "Q1"`,
    `  - B: "Q2"`,
    ``,
    `flow:`,
    `  - A -> B: "進む"`,
    ``,
  ].join("\n");

for (const type of TYPES) {
  test(`type: ${type} を animation 無しで書いても図が出る (#1086)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/editor#s=${Buffer.from(静止図(type), "utf8").toString("base64")}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2200);

    const m = await page.evaluate(() => {
      const svg = document.querySelector('.v4-editor-preview svg[data-cdl-stage]');
      const err = document.querySelector(".v4-editor-error");
      return {
        図あり: svg !== null,
        節点: svg ? svg.querySelectorAll("[data-cdl-node]").length : 0,
        エラー: err ? (err.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 140) : null,
      };
    });

    expect(m.エラー, `記法の誤りとして弾かれた: ${m.エラー}`).toBeNull();
    expect(m.図あり, "図が画面に無い").toBe(true);
    // 図の枠だけ出て中身が無い形を落とす。 弾かれた図でも枠は残ることがある (実測)
    expect(m.節点, "図に箱が 1 つも無い").toBeGreaterThan(0);
  });
}

test("animation を書いた図では段の数が変わらない (#1086)", async ({ page }) => {
  // 動かない図に段を足す修正が、 書いた段まで増やしていないことを画面で見る。
  // 今どの段かは図の枠が `data-cdl-phase-id` と `data-cdl-phase-index` で持つ。 段を進めながら
  // 順に読むと、 図が持つ段の並びが分かる
  const src = [
    `title: "2 段"`,
    `type: swimlane`,
    ``,
    `actors:`,
    `  - A`,
    `  - B`,
    ``,
    `flow:`,
    `  - A -> B: "進む"`,
    ``,
    `animation:`,
    `  - step: "いち" 1.0s`,
    `    focus: [A]`,
    `  - step: "に" 1.0s`,
    `    focus: [B]`,
  ].join("\n");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/editor#s=${Buffer.from(src, "utf8").toString("base64")}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2200);

  // 図は動き続けるので、 一定時間見て現れた段を全て集める。 1 度だけ読むと、 その瞬間の
  // 段しか分からない
  const 見た段 = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const id = await page.evaluate(
      () =>
        document
          .querySelector(".v4-editor-preview svg[data-cdl-stage]")
          ?.closest("[data-cdl-phase-id]")
          ?.getAttribute("data-cdl-phase-id") ??
        document.querySelector("[data-cdl-phase-id]")?.getAttribute("data-cdl-phase-id") ??
        null,
    );
    if (id !== null) 見た段.add(id);
    await page.waitForTimeout(200);
  }

  expect(見た段.size, "段を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
  expect([...見た段].sort(), `段が書いたとおりでない`).toEqual(["いち", "に"]);
  // 動かない図に入れる段の目印。 書いた図に混ざれば「段を足す条件を間違えた」 と分かる
  expect([...見た段], "入れた段が混ざっている").not.toContain("static");
});

test("見本「プロジェクト構想」 に日本語の名前が出る (#1090)", async ({ page }) => {
  // 変更前は `- root: { title: "新プロジェクト" }` と書かれており、 `title` は読める項目では
  // ないため黙って捨てられ、 識別子 (`root` / `features` 等) が箱に出ていた
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor#preset=mind");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const 文字 = await page.evaluate(() =>
    [...document.querySelectorAll('.v4-editor-preview svg[data-cdl-stage] [data-cdl-node] text')]
      .map((t) => (t.textContent ?? "").trim())
      .filter((s) => s.length > 0),
  );

  expect(文字.sort(), `箱の文字が違う: ${文字.join(", ")}`).toEqual([
    "デザイン",
    "マーケット",
    "リリース",
    "新プロジェクト",
    "機能",
  ]);
});
