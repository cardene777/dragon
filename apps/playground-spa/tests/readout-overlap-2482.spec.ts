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
 * ## 画面の矩形で見る
 *
 * 組み立て側は読み取り値の矩形を持たないため、そこから推定すると描画側の決まりを写すことに
 * なり、描画側が変わった日に黙ってずれる。 実際に描かれた要素の矩形どうしで判定する。
 *
 * ## 伸び切った瞬間に測る
 *
 * 矢印は繰り返し伸びて戻る (実測 = 5 秒で伸び切り、7 秒でまた短い)。
 * 描いている途中は線が短く、重なりを見逃す。
 *
 * 伸び切りは、線 (`edge-line`) の道筋が同じ組の下地 (`edge-glow`) の道筋と一致したことで判る。
 * 下地は最初から最終の形を持つ。 曲がった矢印もあるため終点だけでなく道筋そのものを比べる。
 *
 * **一致した評価の中でそのまま測る** = 待ってから測ると、その間に線が戻ってしまう。
 */
import { test, expect } from "@playwright/test";
import { 描き終わりを待つ, 図の箱が出るまで待つ } from "./wait-for-render";
import { 一覧の行 } from "./catalog-item-pick";
import { layout } from "@cardenelabs/cdl";
import { loadPartsItems } from "../src/lib/catalog-items";

/**
 * いま重なっている件数 (2026-09-22 に画面で測った)。
 *
 * **減らす向きの変更は記録も直す**。 描画側が直って重なりが消えたら、この数を下げる。
 * 増えたら落ちるのがこの数の役目で、落ちた時に「直す」 か「受け入れて数を上げる」 かを決める。
 */
const 重なりの記録 = 5;

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
    const laid = layout(item.diagram as never) as unknown as { edges?: { d?: string }[] };
    if ((laid.edges ?? []).some((e) => 縦の道筋(e.d ?? ""))) out.push(item.id);
  }
  return out;
}

/** 画面で数えた結果 */
interface 数えた結果 {
  読み取り値: number;
  縦の矢印: number;
  重なり: number;
  中身: string[];
  /** 線と下地の対が揃わず、縦かどうかを判定できなかった組。 0 に潰さず数える */
  読めない組: number;
}

/**
 * 伸び切った瞬間に重なりを数え、`window` に置く。
 *
 * playwright の評価の中で動くため、外の値を参照できない。 引数だけで閉じる。
 */
function 伸び切って数えた(指す: { 鍵: string }): boolean {
  const svg = document.querySelector("[data-cdl-node]")?.closest("svg");
  if (!svg) return false;

  const 組 = [...svg.querySelectorAll("g[data-cdl-edge]")];
  if (組.length === 0) return false;

  // 下地 (最初から最終の形を持つ) と線 (伸びている途中) の道筋が揃うまで待つ。
  // 曲がった矢印もあるため、終点だけでなく道筋そのものを比べる
  const 縦の線: Element[] = [];
  let 読めない組 = 0;
  for (const g of 組) {
    const 線 = g.querySelector('[data-cdl-role="edge-line"]');
    const 下地 = g.querySelector('[data-cdl-role="edge-glow"]');
    if (!線 || !下地) {
      読めない組 += 1;
      continue;
    }
    const 今 = (線.getAttribute("d") ?? "").replace(/\s+/g, " ").trim();
    const 元 = (下地.getAttribute("d") ?? "").replace(/\s+/g, " ").trim();
    if (今 === "" || 元 === "" || 今 !== 元) return false;
    // 縦の矢印 = まっすぐ 1 本で、横の伸びが 1 未満、縦の伸びが 1 を超える。
    // 曲がった矢印は縦に走る区間があっても、読み取り値の上を通る形ではない
    const m = 元.match(/^M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+)$/);
    if (m && Math.abs(Number(m[3]) - Number(m[1])) < 1 && Math.abs(Number(m[4]) - Number(m[2])) > 1) {
      縦の線.push(線);
    }
  }

  // 読み取り値 = 数と区切りと数の形をした字
  const 読み取り値 = [...svg.querySelectorAll("text")].filter((t) =>
    /^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/.test(t.textContent ?? ""),
  );

  const 重なる = (a: DOMRect, b: DOMRect): boolean =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  const 中身: string[] = [];
  let 重なり = 0;
  for (const 字 of 読み取り値) {
    const r = 字.getBoundingClientRect();
    for (const 線 of 縦の線) {
      const s = 線.getBoundingClientRect();
      // 縦の線は幅が 0 に近い。 そのままでは矩形の重なりが成立しないので、線の太さぶん広げる
      const 太さ = new DOMRect(s.left - 2, s.top, Math.max(s.width, 4), s.height);
      if (重なる(r, 太さ)) {
        重なり += 1;
        中身.push(`${(字.textContent ?? "").trim()} と 縦の矢印`);
      }
    }
  }

  const 置き場 = window as unknown as Record<string, unknown>;
  置き場[指す.鍵] = {
    読み取り値: 読み取り値.length,
    縦の矢印: 縦の線.length,
    重なり,
    中身,
    読めない組,
  };
  return true;
}

const 鍵 = "#2482の数えた結果";

test.describe("読み取り値と縦の矢印の重なり (#2482)", () => {
  test("縦の矢印を持つ部品が 1 枚以上ある (検査の空振り検知)", async () => {
    const 対象 = await 縦の矢印を持つ部品();
    expect(
      対象,
      "縦の矢印を持つ部品が 1 枚も無い (対象の拾い方が実装とずれた)",
    ).not.toEqual([]);
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
      await 描き終わりを待つ(page, `部品 ${id} の矢印`, 伸び切って数えた, { 鍵 }, {
        出ない時の言い方: "伸び切らない",
      });
      const m = (await page.evaluate((k) => (window as unknown as Record<string, unknown>)[k], 鍵)) as 数えた結果;

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
