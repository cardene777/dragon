/**
 * 関係の線の太さを画面で測る (#1597)。
 *
 * CSS の文字列ではなく **画面で解決された値** を読む。 太さは `!important` の
 * 重なりで決まるので、規則を読んだだけでは実際に効く値が判らない。
 *
 * 3 つの図種を見るのは、図の種類で値が分かれていないことを固定するため。
 * 以前はクラス図だけ別の値だった (#1587) が、#1597 で全ての図が同じ値になった。
 */
import { test, expect, type Page } from "@playwright/test";

import { 記法をURLに載せる } from "./box-and-edge-figure";

const クラス図の記法 = `title: "クラス図の線幅"
type: class
reveal: all

actors:
  - Parent: { lane: c0, stack: 0 }
  - Child: { lane: c0, stack: 1 }
  - Peer: { lane: c1, stack: 1 }

flow:
  - Child -> Parent: "継ぐ" { relation: extends }
  - Child -> Peer: "結ぶ" { relation: associates }
`;

const ER図の記法 = `title: "ER 図の線幅"
type: er
reveal: all

actors:
  - users: { kind: storage, rows: ["id: bigint"] }
  - orders: { kind: storage, rows: ["id: bigint", "user_id: bigint"] }

flow:
  - users -> orders: "注文する" { tailHead: one, head: zero-many }
`;

const 流れ図の記法 = `title: "流れ図の線幅"
type: flow
reveal: all

actors:
  - Start
  - End

flow:
  - Start -> End: "進む"
`;

async function 図を開く(page: Page, 記法: string): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(記法)}`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('[data-testid="editor-preview-stage"] svg[data-cdl-type]');
}

async function 線幅を測る(page: Page, 図種: string): Promise<number[]> {
  return page
    .locator(
      `[data-testid="editor-preview-stage"] svg[data-cdl-type="${図種}"] [data-cdl-role="edge-line"]`,
    )
    .evaluateAll((線) => 線.map((要素) => Number.parseFloat(getComputedStyle(要素).strokeWidth)));
}

test("クラス図の関係の線幅は 7", async ({ page }) => {
  await 図を開く(page, クラス図の記法);
  const 太さ = await 線幅を測る(page, "class");

  expect(
    太さ.length,
    "クラス図の関係の線を 1 本も測れていない (検査が空振りしている)",
  ).toBeGreaterThan(0);
  expect(new Set(太さ), `クラス図の線幅が揃っていない: ${太さ.join(" / ")}`).toEqual(
    new Set([7]),
  );
});

test("ER 図の関係の線幅も 7", async ({ page }) => {
  await 図を開く(page, ER図の記法);
  const 太さ = await 線幅を測る(page, "er");

  expect(
    太さ.length,
    "ER 図の関係の線を 1 本も測れていない (検査が空振りしている)",
  ).toBeGreaterThan(0);
  expect(new Set(太さ), `ER 図の線幅が揃っていない: ${太さ.join(" / ")}`).toEqual(new Set([7]));
});

test("流れ図の関係の線幅も 7", async ({ page }) => {
  await 図を開く(page, 流れ図の記法);
  const 太さ = await 線幅を測る(page, "flow");

  expect(
    太さ.length,
    "流れ図の関係の線を 1 本も測れていない (検査が空振りしている)",
  ).toBeGreaterThan(0);
  expect(new Set(太さ), `流れ図の線幅が揃っていない: ${太さ.join(" / ")}`).toEqual(new Set([7]));
});

test('クラス図の絵の根は data-cdl-type="class" を持つ', async ({ page }) => {
  await 図を開く(page, クラス図の記法);

  await expect(
    page.locator('[data-testid="editor-preview-stage"] svg[data-cdl-type]').first(),
  ).toHaveAttribute("data-cdl-type", "class");
});

test("白抜きの印と開いた矢の輪郭も線と同じ比で太くなる", async ({ page }) => {
  await 図を開く(page, クラス図の記法);
  const 印 = await page
    .locator(
      '[data-testid="editor-preview-stage"] svg[data-cdl-type="class"] [data-cdl-role="edge-line"]',
    )
    .evaluateAll((線) =>
      線.flatMap((要素) => {
        const 絵 = 要素.closest("svg");
        return ["marker-start", "marker-end"].flatMap((属性) => {
          const id = (要素.getAttribute(属性) ?? "").replace(/^url\(#|\)$/gu, "");
          const 矢印 = id
            ? 絵?.querySelector(`#${CSS.escape(id)} [data-cdl-role="edge-arrowhead"]`)
            : null;
          return 矢印
            ? [
                {
                  head: 矢印.getAttribute("data-cdl-edge-head"),
                  fill: 矢印.getAttribute("data-cdl-edge-head-fill"),
                  width: Number.parseFloat(getComputedStyle(矢印).strokeWidth),
                },
              ]
            : [];
        });
      }),
    );
  const 白抜き = 印.filter((値) => 値.fill === "hollow").map((値) => 値.width);
  const 開いた矢 = 印.filter((値) => 値.head === "open").map((値) => 値.width);

  expect(白抜き.length, "白抜きの印を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(
    0,
  );
  expect(new Set(白抜き), `白抜きの印の輪郭が揃っていない: ${白抜き.join(" / ")}`).toEqual(
    new Set([4.36]),
  );
  expect(開いた矢.length, "開いた矢を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(
    0,
  );
  expect(new Set(開いた矢), `開いた矢の輪郭が揃っていない: ${開いた矢.join(" / ")}`).toEqual(
    new Set([4.98]),
  );
});
