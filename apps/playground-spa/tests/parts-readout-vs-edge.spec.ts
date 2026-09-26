/**
 * 部品の読み取り値を、縦の矢印が割っていないかを測る (#2293)。
 *
 * 部品の箱は上に読み取り値 (`8 / 10` のような現在値と上限) を出す。 同じ帯の上下に置いた箱を
 * 矢印で繋ぐと線が縦に引かれ、**読み取り値の真ん中を通って数字を割る**。
 *
 * ```
 * parts-batch-collector の実測 (図の座標)
 * 読み取り値 `8 / 10`  x 88.5 - 121.5 / y 362.7 - 373.7
 * 矢印の道筋           M 105 278 L 105 378   ← x=105 が箱の中を縦に貫く
 * ```
 *
 * **指摘は 1 件も出ない**。 `validate` も `visualValidateAll` も 0 件を返し、板の大きさも
 * 変わらない。 画面で見た時にだけ分かるので、測る経路がどこにも無かった。
 *
 * ## 直す側とは分ける
 *
 * 直すには記法の engine (`@cardenelabs/cdl`) で読み取り値か矢印の取り付き位置を変える必要があり、
 * このリポジトリからは変えられない (#2200 に 3 案と実測が載っている)。
 * ここは **測る側だけ** を置く = 直った時に宣言が落ちて気付ける形にする。
 * `#2268` (測る側) → `#2269` (直す) と同じ分け方。
 *
 * ## 対象は実物から導く
 *
 * 部品の名前を並べると、後から足した部品が検査を受けない。 部品の一覧を走査して
 * 「同じ帯の上下を矢印で繋いでいて、受け手が読み取り値を持つ」 組を導く。
 *
 * ## 字ではなく座標で見る
 *
 * 描かれた字を読むだけでは重なりが分からない (`8 / 10` は重なっていても同じ字列で返る)。
 * 読み取り値の箱と、矢印の道筋の上に取った点が交わるかを測る。
 *
 * ## 1 回だけ測ると見落とす
 *
 * **矢印は描き出しの動きで伸びる**。 道筋は `M 105 278 L 105.0 315.4` から始まり、
 * 描き切った時だけ `L 105 378` になって読み取り値に届く。 しかも動きは繰り返すので、
 * 1 回測るとほとんどの時刻で「重なっていない」 が返る。
 *
 * **1 回にすると検査は逆向きに壊れる** = `測る回数` を 1 に落として回すと、割れている 4 件
 * 全部が「直ったので宣言から外せ」 と報告される (実測)。 見落とすのではなく、直っていないものを
 * 直ったと言う側に倒れる。
 *
 * ```
 * parts-batch-collector の bt-in (実測)
 * 1500ms L 105.0 315.4  重なり 0 件
 * 3000ms L 105.0 353.3  重なり 0 件
 * 4500ms L 105 378      重なり 1 件  ← 描き切った瞬間
 * 6000ms L 105.0 283.1  重なり 0 件  ← 動きが 1 周して戻った
 * ```
 *
 * 何度か測って **重なりを足し合わせる** = 描き切った姿は見る人が実際に見る状態なので、
 * 1 度でも重なればその部品は割れている。 700ms × 14 回で動き 2 周ぶんを見る。
 *
 * 足し合わせた結果は **箱の数より多く出る**。 読み取り値の数字も動きで変わるので、同じ箱が
 * `23 / 100` と `24 / 100` の 2 行になる (三段の漏斗の fn-2 で実測)。 割れている箱の数を
 * 数える検査ではなく、1 件でも出たかを見る検査なので、そのまま足して構わない。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test parts-readout-vs-edge`
 */
import { test, expect } from "@playwright/test";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { 部品の一覧を作る } from "../src/lib/parts-catalog";
import * as 部品 from "../src/topics/catalog/parts.cdl";

type Page = import("@playwright/test").Page;

test.use({ viewport: { width: 1440, height: 1200 } });

const 一覧 = 部品の一覧を作る(Object.values(部品));

/**
 * 1 つの部品で重なりを測る回数と間隔。
 *
 * 描き出しの動きは約 4 秒で 1 周する。 `700ms × 14 = 9.8 秒` で 2 周ぶんを見るので、
 * 描き切った瞬間が少なくとも 2 回は窓に入る。
 */
const 測る回数 = 14;
const 測る間隔 = 700;

/** 節点の欄のうち、ここで見るものだけ */
interface 節点 {
  id?: string;
  lane?: string;
  stack?: number;
  shape?: { source?: string };
}

/**
 * 同じ帯の上下を矢印で繋いでいて、受け手が読み取り値を持つ部品。
 *
 * 読み取り値は `shape.source` を持つ箱にだけ出る = 持たない箱を数えると、割れようの無い
 * 部品まで対象に入って「割れていない」 が当たり前の検査になる。
 */
function 縦の矢印を持つ部品(): string[] {
  const out: string[] = [];
  for (const [鍵, 図] of Object.entries<CdlDiagram>(一覧)) {
    // 一覧は「頭付き (`parts-…`)」 と「頭なし」 の 2 通りで引ける。 画面で選ぶ形 (頭付き) を使う
    if (!鍵.startsWith("parts-")) continue;
    const 節点たち = (図.nodes ?? []) as 節点[];
    const 引く = (id: string): 節点 | undefined => 節点たち.find((n) => n.id === id);
    const 縦 = (図.edges ?? []).some((e) => {
      const a = 引く((e as { from?: string }).from ?? "");
      const b = 引く((e as { to?: string }).to ?? "");
      if (!a || !b) return false;
      if (a.lane === undefined || a.lane !== b.lane) return false;
      if (a.stack === b.stack) return false;
      return typeof b.shape?.source === "string";
    });
    if (縦) out.push(鍵);
  }
  return out.sort();
}

/**
 * いま割れている部品と、その理由。 **理由と行き先を必ず書く**。
 *
 * 宣言した部品は「まだ割れていること」 を確かめる = 直ったらこの検査が落ちて、
 * 直した PR がこの行を外すまで気付ける。
 *
 * **いまは空** (#2200)。 記法の engine (`@cardenelabs/cdl` 0.70.0) が読み取り値を箱の
 * 右端へ寄せ、中央の縦の通り道が空いた。 割れていた 4 件 (三段の漏斗 / まとめ箱 /
 * 押し戻し箱 / 分け箱) が 4 件とも通る。
 *
 * 空でも消さない = 次に割れる部品が出た時、理由と行き先を書いて足す場所がここになる。
 */
const 宣言: ReadonlyMap<string, string> = new Map([]);

/** その部品を画面に出す */
async function 部品を開く(page: Page, id: string): Promise<void> {
  await page.goto("catalog/parts", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  // 識別子は画面に出さなくなった (#2461)。 行は属性で引く
  await page.locator(`.catalog-list-item[data-item-id="${id}"]`).first().click();
  await page.waitForTimeout(2000);
}

/** 読み取り値の箱と、矢印の道筋の上に取った点が交わるか */
async function 重なりを測る(
  page: Page,
): Promise<{ 読み取り値: number; 矢印: number; 重なり: { 字: string; 矢印: string }[] }> {
  return page.evaluate(() => {
    const svg = document.querySelector(
      ".catalog-preview-stage-inner [data-cdl-diagram] svg[viewBox]",
    );
    if (!svg) throw new Error("図が見つからない (検査が空振りしている)");

    // 読み取り値 = 箱の絵 (`data-cdl-shape`) の中に描かれる文字
    const 読み取り値 = [...svg.querySelectorAll("[data-cdl-node] [data-cdl-shape] text")]
      .filter((t) => (t.textContent ?? "").trim() !== "")
      .map((t) => ({ 字: (t.textContent ?? "").trim(), 箱: (t as SVGGraphicsElement).getBBox() }));

    const 矢印 = [...svg.querySelectorAll("[data-cdl-edge] path[data-cdl-role='edge-line']")].map(
      (p) => ({
        名: p.parentElement?.getAttribute("data-cdl-edge") ?? "(無名)",
        線: p as SVGPathElement,
      }),
    );

    const 重なり: { 字: string; 矢印: string }[] = [];
    for (const { 名, 線 } of 矢印) {
      const 長さ = 線.getTotalLength();
      if (!(長さ > 0)) continue;
      // 道筋の上に等間隔で点を取る。 端点だけを見ると、途中で横切る形を見落とす
      const 刻み = Math.max(2, Math.ceil(長さ / 2));
      for (const { 字, 箱 } of 読み取り値) {
        let 当たった = false;
        for (let i = 0; i <= 刻み && !当たった; i++) {
          const p = 線.getPointAtLength((長さ * i) / 刻み);
          if (p.x >= 箱.x && p.x <= 箱.x + 箱.width && p.y >= 箱.y && p.y <= 箱.y + 箱.height) {
            当たった = true;
          }
        }
        if (当たった) 重なり.push({ 字, 矢印: 名 });
      }
    }
    return { 読み取り値: 読み取り値.length, 矢印: 矢印.length, 重なり };
  });
}

test("対象を実物から導けている (空振り検知)", () => {
  const 対象 = 縦の矢印を持つ部品();
  expect(Object.keys(一覧).length, "部品の一覧が空").toBeGreaterThan(0);
  expect(対象.length, "同じ帯の上下を矢印で繋ぐ部品を 1 つも導けていない").toBeGreaterThan(0);
  // 宣言は導いた集合の中にしか置けない = 綴りを間違えた行が「直った」 側に化けて消えるのを止める
  for (const [名] of 宣言) {
    expect(対象, `対象でない部品を宣言しても意味が無い: ${名}`).toContain(名);
  }
});

test("縦の矢印が読み取り値を割っていない", async ({ page }, info) => {
  const 対象 = 縦の矢印を持つ部品();
  // 1 部品あたり 読み込み 3.2 秒 + 測る窓 9.8 秒。 余裕を見て 30 秒ずつ積む
  info.setTimeout(30_000 + 対象.length * 30_000);

  /** 宣言していないのに割れている部品 */
  const 割れた: string[] = [];
  /** 宣言したのに割れなくなった部品。 宣言が古いので外す */
  const 直った: string[] = [];
  /** 測れた重なりを全部。 宣言をここから書き起こす (prose ではなく実測を根拠にする) */
  const 実測: string[] = [];
  let 読み取り値の数 = 0;
  let 矢印の数 = 0;

  for (const id of 対象) {
    await 部品を開く(page, id);
    // 動きの 1 周 (4 秒) を 2 回またぐ。 描き切った瞬間を取りこぼさない
    const 足した = new Set<string>();
    let 測: Awaited<ReturnType<typeof 重なりを測る>> | undefined;
    for (let i = 0; i < 測る回数; i++) {
      測 = await 重なりを測る(page);
      for (const x of 測.重なり) 足した.add(`${id} "${x.字}" が矢印 ${x.矢印} と重なる`);
      await page.waitForTimeout(測る間隔);
    }
    expect(測!.読み取り値, `${id} に読み取り値が 1 つも無い`).toBeGreaterThan(0);
    expect(測!.矢印, `${id} に矢印の線が 1 本も無い`).toBeGreaterThan(0);
    読み取り値の数 += 測!.読み取り値;
    矢印の数 += 測!.矢印;

    const 理由 = 宣言.get(id);
    const 割れ = [...足した].sort();
    実測.push(...割れ);
    if (理由 === undefined) {
      割れた.push(...割れ);
    } else if (割れ.length === 0) {
      直った.push(`${id} — 宣言の理由: ${理由}`);
    }
  }

  const 母数 = `部品 ${対象.length} 件 / 読み取り値 ${読み取り値の数} 件 / 矢印 ${矢印の数} 本`;
  await info.attach("母数", { body: 母数, contentType: "text/plain" });
  await info.attach("実測した重なり", { body: 実測.join("\n"), contentType: "text/plain" });

  expect(
    直った,
    `宣言が古い。 読み取り値が割れなくなったので 宣言 から外す (${母数})\n${直った.join("\n")}`,
  ).toEqual([]);
  expect(割れた, `縦の矢印が読み取り値を割っている (${母数})\n${割れた.join("\n")}`).toEqual([]);
});
