/**
 * 部品の読み取り値の上を、縦の矢印が通って割る件数を数える (#2482)。
 *
 * ## 何が起きているか
 *
 * 部品の箱は、いまの値と上限を `5 / 10` の形で箱の上に出す。
 * 同じ帯の上下に置いた箱を縦の矢印で繋ぐと、矢印が箱の上端の中央へ入るため、
 * **その数字の上を必ず通る**。
 *
 * 組み立てが返す矩形 (`bboxes`) には `node` と `edge-path` と `edge-label` しか無く、
 * 読み取り値の矩形が入っていない。 そのため `validate` も `visualValidateAll` も 0 件を返す。
 *
 * ## 直すのは描画側。 ここは気付ける経路だけを持つ
 *
 * 直すには読み取り値か矢印の取り付き位置を変える必要があり、この置き場からは変えられない
 * (#2200 で 3 案とも測って成立しなかった)。
 *
 * **いまの件数を記録し、増えたら落ちる** 形にする。 部品を 1 枚足した日に同じ壊れ方をしても、
 * いまは画面を開いた人が目で見るまで分からない。
 *
 * ## 測る仕組みは助けの側が持つ (#2492)
 *
 * 矢印が伸び切った瞬間に測る仕組みと、結果を受け渡す鍵は `wait-for-render.ts` にある。
 * 検査に `const` で字を置くと、名指しした字が実物に出るかを見る検査が画面の字として拾う
 * (#2486 で踏んだ)。 名指しの検査が走査するのは検査の file だけなので、助けの側なら当たらない。
 *
 * ここが持つのは **どれを開くか** と **数えた結果をどう突き合わせるか** の 2 つになる。
 */
import { test, expect } from "@playwright/test";
import { 図の箱が出るまで待つ, 重なりを数える } from "./wait-for-render";
import { 一覧の行 } from "./catalog-item-pick";
import { layout } from "@cardenelabs/cdl";
import { loadPartsItems } from "../src/lib/catalog-items";

/**
 * いま重なっている件数。
 *
 * **減らす向きの変更は記録も直す**。 描画側が直って重なりが消えたら、この数を下げる。
 * 増えたら落ちるのがこの数の役目で、落ちた時に「直す」 か「受け入れて数を上げる」 かを決める。
 *
 * **0 になった** (#2200)。 描画側 (`@cardenelabs/cdl` 0.70.0) が読み取り値を箱の右端へ寄せ、
 * 中央の縦の通り道が空いた。 2026-09-22 に測った時は 5 件で、4 枚とも 0 件になった。
 */
const 重なりの記録 = 0;

/** 縦に引いた矢印か。 横の伸びが 1 未満で、縦の伸びが 1 を超える */
function 縦の道筋(d: string): boolean {
  const m = d.trim().match(/^M\s+([\d.-]+)\s+([\d.-]+)\s+L\s+([\d.-]+)\s+([\d.-]+)$/);
  if (!m) return false;
  const [x1, y1, x2, y2] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  return Math.abs(x2 - x1) < 1 && Math.abs(y2 - y1) > 1;
}

/**
 * 縦の矢印を持つ部品を実物から導く。
 *
 * 名前を並べると、後から足した部品がこの検査を受けない。
 * 判定は画面で行い、ここでは **どれを開くか** だけを決める。
 */
async function 縦の矢印を持つ部品(): Promise<string[]> {
  const items = await loadPartsItems();
  const out: string[] = [];
  for (const item of items) {
    const laid = layout(item.diagram) as unknown as { edges?: { d?: string }[] };
    if ((laid.edges ?? []).some((e) => 縦の道筋(e.d ?? ""))) out.push(item.id);
  }
  return out;
}

test.describe("読み取り値と縦の矢印の重なり (#2482)", () => {
  test("縦の矢印を持つ部品が 1 枚以上ある (検査の空振り検知)", async () => {
    const 対象 = await 縦の矢印を持つ部品();
    expect(対象, "縦の矢印を持つ部品が 1 枚も無い (対象の拾い方が実装とずれた)").not.toEqual([]);
  });

  test("重なっている件数が記録と一致する", async ({ page }) => {
    const 対象 = await 縦の矢印を持つ部品();
    expect(対象.length, "対象が 0 枚 (空振り)").toBeGreaterThan(0);

    await page.goto("catalog/parts", { waitUntil: "networkidle" });
    await 図の箱が出るまで待つ(page, "部品の一覧");

    let 合計 = 0;
    const 内訳: string[] = [];
    for (const id of 対象) {
      await 一覧の行(page, id).click();
      await 図の箱が出るまで待つ(page, `部品 ${id}`);
      const m = await 重なりを数える(page, `部品 ${id}`);

      // 空振り防止。 読み取り値も縦の矢印も 0 個なら、重なり 0 は何も言っていない
      expect(m.縦の矢印, `${id} で縦の矢印が 1 本も見つからない`).toBeGreaterThan(0);
      expect(m.読み取り値, `${id} で読み取り値が 1 つも見つからない`).toBeGreaterThan(0);
      // 判定できなかった組を 0 件として数えない
      expect(m.読めない組, `${id} で線と下地の対が揃わない組がある`).toBe(0);

      合計 += m.重なり;
      内訳.push(`${id} ... 読み取り値 ${m.読み取り値} / 縦の矢印 ${m.縦の矢印} / 重なり ${m.重なり}`);
    }

    expect(
      合計,
      `重なりの件数が記録と違う (${対象.length} 枚を走査)。\n${内訳.join("\n")}`,
    ).toBe(重なりの記録);
  });
});
