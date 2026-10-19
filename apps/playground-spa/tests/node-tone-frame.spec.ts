/**
 * 節の色 (`tone`) を書いた箱の枠を画面で測る (#1966)。
 *
 * engine は強調した箱の枠を節の色で描き、強調していない箱は色を持たない枠で描く。 dragon のテーマは
 * 全ての箱の枠を 1 色に揃える規則 (#1111) を持っており、後から入った節の色まで消していた。
 * カタログの「節の色 6 種」 は 6 枚とも同じ朱の枠になっていた。
 *
 * **強調した箱の枠の色は測らない** (#2962)。 図は必ずどれかの意匠で描かれ、強調した箱の枠は
 * 意匠帳が決めた色と太さで描く (節の色ごとに分けない意匠もある)。 強調した箱の枠が意匠帳の色に
 * 収まることは `rendered-contrast.spec.ts` の「全図種で固定色と contrast が出る」、 枠の太さの値は
 * `src/lib/stage-theme-contract.test.ts` が見る。 ここに残すのは、
 * 強調していない箱が節の色で分かれないことだけ。
 */
import { test, expect, type Page } from "@playwright/test";

import { 記法をURLに載せる } from "./box-and-edge-figure";

/** 強調しない色を持たせた箱を、強調する側と同じ数だけ並べる */
const 節の色の記法 = `title: "節の色の枠"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 400, width: 280 }
  l3: { x: 800, width: 280 }

actors:
  - 主張: { kind: card, lane: l1, stack: 0, tone: accent }
  - 青緑: { kind: card, lane: l1, stack: 1, tone: teal }
  - 成功: { kind: card, lane: l1, stack: 2, tone: success }
  - 失敗: { kind: card, lane: l2, stack: 0, tone: error }
  - 注意: { kind: card, lane: l2, stack: 1, tone: warning }
  - 案内: { kind: card, lane: l2, stack: 2, tone: info }
  - 休む青緑: { kind: card, lane: l3, stack: 0, tone: teal }
  - 休む失敗: { kind: card, lane: l3, stack: 1, tone: error }
  - 休む案内: { kind: card, lane: l3, stack: 2, tone: info }

animation:
  - step: "6 色を強調する" 1.8s
    focus: ["主張", "青緑", "成功", "失敗", "注意", "案内"]
`;

interface 枠 {
  readonly tone: string;
  readonly active: boolean;
  readonly stroke: string;
}

async function 枠を測る(page: Page): Promise<枠[]> {
  return page
    .locator('[data-testid="editor-preview-stage"] svg g[data-cdl-node][data-cdl-tone]')
    .evaluateAll((箱たち) =>
      箱たち.flatMap((箱) => {
        // 枠は箱の孫にある。 枠そのものが四角の形と、枠の中に四角を持つ形の 2 通り
        const 枠 = 箱.querySelector('[data-cdl-role="node-body"]');
        const 形 =
          枠 && ["rect", "path"].includes(枠.tagName) ? 枠 : 枠?.querySelector("rect, path");
        if (!形) return [];
        return [
          {
            tone: 箱.getAttribute("data-cdl-tone") ?? "",
            active: 箱.getAttribute("data-cdl-active") === "true",
            stroke: getComputedStyle(形).stroke,
          },
        ];
      }),
    );
}

async function 開く(page: Page): Promise<枠[]> {
  await page.goto(`editor#s=${記法をURLに載せる(節の色の記法)}`);
  await page.waitForLoadState("networkidle");
  // 強調が 6 箱に当たるまで待つ。 段に入る前は 1 箱も強調していない
  await expect(
    page.locator(
      '[data-testid="editor-preview-stage"] svg g[data-cdl-node][data-cdl-active="true"]',
    ),
  ).toHaveCount(6);
  return 枠を測る(page);
}

test("強調していない箱は、節の色を書いても揃えた枠の色で描く", async ({ page }) => {
  const 枠たち = await 開く(page);
  const 休む = 枠たち.filter((値) => !値.active);

  expect(休む.length, "強調していない 3 箱を測れていない (検査が空振りしている)").toBe(3);
  expect(
    new Set(休む.map((値) => 値.stroke)).size,
    `強調していない箱の枠が色で分かれている: ${休む.map((値) => `${値.tone}=${値.stroke}`).join(" / ")}`,
  ).toBe(1);
});
