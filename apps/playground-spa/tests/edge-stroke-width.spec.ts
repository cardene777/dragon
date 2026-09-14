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
  - Child -> Parent: "継承" { relation: extends }
  - Child -> Peer: "関連" { relation: associates }
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

/**
 * 矢じりは 2 倍に描き (#1966)、輪郭には半分の値を書く。 画面上の輪郭は「書いた値 × 倍率」 で、
 * 線を 7 にした時 (#1598) の 4.36 と 4.98 に揃う。 倍率だけを見ると輪郭が倍に太って点に戻る形を、
 * 輪郭の値だけを見ると矢じりが小さいまま据え置かれる形を見逃すので、2 つを掛けて確かめる。
 */
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
          if (!矢印) return [];
          const 変形 = getComputedStyle(矢印).transform;
          // `matrix(a, b, c, d, e, f)` の a が横の倍率。 変形が無ければ 1 倍
          const 倍率 = 変形 === "none" ? 1 : new DOMMatrixReadOnly(変形).a;
          return [
            {
              head: 矢印.getAttribute("data-cdl-edge-head"),
              fill: 矢印.getAttribute("data-cdl-edge-head-fill"),
              width: Number.parseFloat(getComputedStyle(矢印).strokeWidth) * 倍率,
            },
          ];
        });
      }),
    );
  // 掛け算で出る端数を丸める (2.18 × 2 = 4.36 が 4.3599999 になる)
  const 丸める = (値: number) => Math.round(値 * 100) / 100;
  const 白抜き = 印.filter((値) => 値.fill === "hollow").map((値) => 丸める(値.width));
  const 開いた矢 = 印.filter((値) => 値.head === "open").map((値) => 丸める(値.width));

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

const 矢じりの記法 = `title: "矢じりの大きさ"
type: flow
reveal: all

actors:
  - A
  - B
  - C
  - D
  - E
  - F
  - G
  - H

flow:
  - A -> B: "三角"
  - C -> D: "菱形" { head: diamond }
  - E -> F: "開いた矢" { head: open }
  - G -> H: "三又" { head: crow }
`;

/** 画面に出ている矢じりを、形の名前と倍率と、はみ出しを見せているかで読む */
async function 矢じりを読む(page: Page) {
  return page.locator('[data-testid="editor-preview-stage"] svg marker').evaluateAll((印) =>
    印.flatMap((枠) => {
      const 形 = 枠.querySelector('[data-cdl-role="edge-arrowhead"]');
      if (!形) return [];
      const 変形 = getComputedStyle(形).transform;
      return [
        {
          head: 形.getAttribute("data-cdl-edge-head") ?? "(既定の灰色)",
          倍率: 変形 === "none" ? 1 : new DOMMatrixReadOnly(変形).a,
          はみ出し: getComputedStyle(枠).overflow,
        },
      ];
    }),
  );
}

/**
 * 矢じりは線の太さ 7 に負けないよう 2 倍に描く (#1966)。
 *
 * 枠の外へはみ出した分を見せないと、拡大した形が枠で切れて半分しか出ない。
 */
test("矢じりは線の太さに負けないよう 2 倍に描き、枠の外まで見せる", async ({ page }) => {
  await 図を開く(page, 矢じりの記法);
  const 矢じり = await 矢じりを読む(page);

  const 形の名前 = new Set(矢じり.map((値) => 値.head));
  expect(
    [...形の名前].sort(),
    "記法に書いた 4 形を全て読めていない (検査が空振りしている)",
  ).toEqual(expect.arrayContaining(["crow", "diamond", "open", "triangle"]));
  for (const 値 of 矢じり) {
    expect(値.倍率, `${値.head} の矢じりが 2 倍になっていない`).toBe(2);
    expect(値.はみ出し, `${値.head} の矢じりの枠が外を切っている`).toBe("visible");
  }
});

test("ER の端は engine の大きさのまま描く", async ({ page }) => {
  await 図を開く(page, ER図の記法);
  const 矢じり = await 矢じりを読む(page);
  const ERの端 = 矢じり.filter((値) => ["one", "zero-many"].includes(値.head));

  expect(ERの端.length, "ER の端を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
  for (const 値 of ERの端) {
    expect(値.倍率, `${値.head} は engine が 1.8 倍の枠で描くので重ねて拡大しない`).toBe(1);
  }
});
