/**
 * 起点から伸びる動きが起きるのは 1 度だけ、を **見本帳のプリセット全部** の実画面で確かめる
 * (#1474 で 4 図種、#1476 で残り 15 図種)。
 *
 * 組み立てだけを見る検査では捕まらない。 伸ばすかは描き手が段の並びから決めており、
 * 描かれた結果を読むしかない。
 *
 * **画面を人が見て気付いた**。 3 度続けて同じ形 (シーンが進むたびに既に見えている線が
 * 引き直される / まだ出番でない線が最初から見えている) を実機で指摘され、その都度直した。
 *
 * ## 段は何から数えるか
 *
 * 図の入れ物が持つ段の番号 (`data-cdl-phase-index`) から数える。
 *
 * 札 (`PhaseChrome`) は使えない。 札は入れ物の属性を `MutationObserver` で読んで **別に**
 * 描き直すため、境目で 1 コマ遅れる (#1474 で実測 = 暗い地の表の図で「シーン 3 なのに 4 の
 * 矢印が伸びている」 と読めた)。 入れ物の属性そのものは図と同じ描き直しで書き換わる。
 *
 * #1474 は札を避けて **出ている矢印の本数** を段の代わりに使っていた。 本数は矢印が増える
 * 図でしか動かないため、矢印を持たない 9 図種では全ての観測が同じ段に潰れる = 引き直しを
 * 1 件も検出できない。 段の番号に替えると、矢印の有無に依らず同じ形で数えられる。
 *
 * ## 描いている印
 *
 * 図種で見え方が違うので 3 つ読む。 いずれも **描いている間だけ** 出る。
 *
 * | 印 | 出る図種 |
 * |---|---|
 * | `data-cdl-drawing="true"` | 矢印を持つ 10 図種 |
 * | `stroke-dashoffset` が付く | 折れ線グラフ / ツリー図 / マインドマップ / ユーザージャーニー |
 * | `-draw-` を含む切り抜き | 円グラフ / ファネル図 |
 * | 帯の包みに倍率 | ガントチャート |
 *
 * 後ろの 3 つは節 (`[data-cdl-node]`) の中だけを見る。 矢印は節の外に描かれるので、
 * 節を起点にすれば矢印の線が混ざらない。
 *
 * ## 1 周を必ず 1 度は見る
 *
 * 段の番号が 0 に戻る (折り返す) まで見て止める。 出番の段でしか印は出ないので、全ての段を
 * 1 度ずつ通れば描かれるものは全て観測できる。 折り返しに届かないまま上限に達した回は、
 * 1 周ぶん見ていない = 引き直しを見落とせるので落とす。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test edge-draws-once`
 */
import { test, expect, type Page } from "@playwright/test";

import { PRESETS, presetName } from "../src/lib/presets";

/** 何が起点から伸びるか。 図種ごとに担い手が違う */
type 描き手 = "矢印" | "図" | "なし";

/**
 * 図ごとに何が伸びるか。 **鍵は見本の登録簿 (`PRESETS`) から導く** (#1709)。
 *
 * 前の形は名前と担い手を手で並べており、見本が 2 件増えた時に一覧とずれて
 * 「表と一覧がずれている」 で落ちたまま放置されていた。 いまは
 *
 *   - 鍵がそろっているか = 「見落としている見本が無い」 が登録簿と突き合わせる
 *   - 画面に出る名前 = `presetName()` が登録簿から引く
 *
 * の 2 つで、手で書くのは担い手 (何が伸びるか) だけになった。 担い手は図を実際に
 * 動かさないと決まらないので、実物から導けない。
 */
const 描き手たち: Record<string, 描き手> = {
  // 矢印が伸びる図
  swimlane: "矢印",
  flow: "矢印",
  topology: "矢印",
  er: "矢印",
  erComplex: "矢印",
  stateMachine: "矢印",
  infrastructure: "矢印",
  classDiagram: "矢印",
  classComplex: "矢印",
  flowchart: "矢印",
  network: "矢印",
  stateMachine2: "矢印",
  // 図が自分で線や塗りを伸ばす図。 矢印を 1 本も持たない
  tree: "図",
  userJourney: "図",
  mindMap: "図",
  funnel: "図",
  chartPie: "図",
  chartLine: "図",
  gantt: "図",
  /*
   * 伸びるものを持たない図。
   *
   * シーケンス図は 1 枚の板で描き、言づては矢印ではなく板の中の行になる (#1466)。
   * 四象限マトリクスは軸と点だけで、起点から現す形を持たない。
   *
   * **0 件は植え込みで裏を取る**。 この 2 つの検査は印を 1 つ足して、読み手がそれを
   * 見つけることまで見る。 他の図で見つかっていることと合わせて、「探し方が何にも
   * 当たらないから 0 件」 ではないと言える。
   */
  sequence: "なし",
  quadrant: "なし",
};

/** 検査が回る見本。 登録簿の並びをそのまま使う */
const 見本 = PRESETS.map((p) => ({
  id: p.id,
  label: presetName(p, "ja"),
  描き手: 描き手たち[p.id],
}));

/*
 * 1 周が最も長い図で約 20 秒。 待ちと合わせても収まる長さに置く。
 *
 * **同じ file の中でも並べて走らせる** (`mode: "parallel"`)。 20 件が 1 つの worker に
 * 並ぶと 1 file だけで 3.6 分掛かり、全体 (4 worker で約 7 分) の中で最も長い列になる。
 * 見るのはそれぞれ別の頁で、共有する状態を持たない。
 */
test.describe.configure({ mode: "parallel", timeout: 120_000 });

/** 折り返しを待つのも含めた観測の上限。 これを超えたら観測不足として落とす */
const 観測の上限ms = 60_000;

/**
 * 名前を「そのままの字」 として探す形に直す。
 *
 * 完全一致を作るのに正規表現を使うので、名前に `(` `)` が入ると別の意味になる
 * (実測 = 「クラス図 (複雑)」 が 1 件も当たらなかった)。
 */
const 字そのまま = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 見本帳の一覧から名前が完全に一致する見本を開く */
async function 見本を開く(page: Page, label: string): Promise<void> {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page
    .locator(".catalog-list-item")
    .filter({ has: page.locator(".catalog-list-item-name", { hasText: new RegExp(`^${字そのまま(label)}$`) }) })
    .first()
    .click();
  await page.waitForSelector("[data-cdl-phase-index]", { timeout: 15_000 });
}

/** その時点の段の番号と、いま描かれているものの名前 */
type 一コマ = { 段: number; 描いている: string[] };

/**
 * 図を 1 コマ読む。
 *
 * `植え込む` を立てると **印を 1 つ足してから同じ読み手を通す**。 伸びるものを持たない図で
 * 「0 件」 を根拠にする時、探し方が実物と噛み合っているかを別に確かめるため (植え込み対照)。
 * 足すのと読むのを 1 度の評価に収めるのは、間に描き直しが入ると印が消えるため。
 */
async function 図を読む(page: Page, 植え込む = false): Promise<一コマ> {
  return page.evaluate((植え込む: boolean) => {
    const 仮の印 = 植え込む ? document.querySelector("[data-cdl-node] *") : null;
    仮の印?.setAttribute("stroke-dashoffset", "0.5");
    const 入れ物 = document.querySelector("[data-cdl-phase-index]");
    const 段 = Number(入れ物?.getAttribute("data-cdl-phase-index") ?? "-1");
    const 描いている: string[] = [];

    // 矢印。 起点から伸びている間だけ true になる
    for (const g of document.querySelectorAll('[data-cdl-edge][data-cdl-drawing="true"]')) {
      描いている.push(`矢印:${g.getAttribute("data-cdl-edge") ?? "?"}`);
    }

    /*
     * 図が自分で描く側。 3 つの印はどれも描いている間だけ付くので、付いていること自体が
     * 「いま伸びている」 の合図になる。 節を起点に探すため矢印の線は入らない。
     */
    for (const n of document.querySelectorAll("[data-cdl-node]")) {
      const 伸びている =
        n.querySelector("[stroke-dashoffset]") !== null ||
        n.querySelector("clipPath[id*='-draw-']") !== null ||
        n.querySelector("g[transform*='scale('] > [data-cdl-role='gantt-bar']") !== null;
      if (伸びている) 描いている.push(`図:${n.getAttribute("data-cdl-node") ?? "?"}`);
    }

    仮の印?.removeAttribute("stroke-dashoffset");
    return { 段: Number.isFinite(段) ? 段 : -1, 描いている };
  }, 植え込む);
}

/**
 * 1 周ぶん見て、描かれたものごとに「伸びた段」 を集める。
 *
 * 段の番号が 0 に戻るまでを 1 周とする。 途中から見始めた回は前半の段を見ないので、
 * **0 段目に居ることを確かめてから** 数え始める。 途中で入った時は 1 度折り返しを待つ。
 */
type 観測 = { 伸びた段: Map<string, Set<number>>; 見た段: Set<number>; 一周した: boolean };

async function 一周ぶん見る(page: Page): Promise<観測> {
  const 伸びた段 = new Map<string, Set<number>>();
  const 見た段 = new Set<number>();
  const 始め = Date.now();
  let 前の段 = -1;
  let 数え始めた = false;
  let 一周した = false;

  while (Date.now() - 始め < 観測の上限ms) {
    const { 段, 描いている } = await 図を読む(page);
    const 折り返した = 前の段 >= 0 && 段 < 前の段;

    if (数え始めた && 折り返した) {
      // 数え始めた後の折り返し = 1 周を見終えた
      一周した = true;
      break;
    }
    // 0 段目に居るか、折り返しを見た時点から数え始める
    if (!数え始めた && (段 === 0 || 折り返した)) 数え始めた = true;

    if (数え始めた && 段 >= 0) {
      見た段.add(段);
      for (const 名 of 描いている) {
        const s = 伸びた段.get(名) ?? new Set<number>();
        s.add(段);
        伸びた段.set(名, s);
      }
    }
    前の段 = 段;
    await page.waitForTimeout(150);
  }
  return { 伸びた段, 見た段, 一周した };
}

test.describe("伸びるのは 1 度だけ (#1474 / #1476)", () => {
  test("見落としている見本が無い", async ({ page }) => {
    /*
     * 見るのは 2 つのずれ。
     *
     * | 突き合わせる相手 | 外れると何が起きるか |
     * |---|---|
     * | 登録簿 (`PRESETS`) と担い手の表 | 見本が増えても担い手が引けず、検査が対象を取り落とす |
     * | 登録簿と画面の一覧 | 登録した見本が画面に出ていない (あるいは逆) |
     *
     * 前の形は画面の一覧と **手書きの名前** を突き合わせていたため、見本が増えるたびに
     * 人が表を直すまで落ち続けた (実測 = 2 件増えて 30 件が赤のまま積み上がった)。
     */
    const 登録簿の鍵 = PRESETS.map((p) => p.id).sort();
    expect(登録簿の鍵.length, "見本の登録簿が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(Object.keys(描き手たち).sort(), "担い手の表が登録簿とずれている").toEqual(登録簿の鍵);

    await page.goto("catalog/presets", { waitUntil: "networkidle" });
    const 一覧 = await page
      .locator(".catalog-list-item-name")
      .allTextContents()
      .then((xs) => xs.map((x) => x.trim()).sort());

    expect(一覧.length, "見本の一覧が読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(一覧, "画面の一覧が登録簿とずれている").toEqual(見本.map((x) => x.label).sort());

    // 内訳を出力に残す。 数だけでは、どの担い手が痩せたかが読めない
    const 内訳 = (k: 描き手): number => 見本.filter((x) => x.描き手 === k).length;
    expect(
      { 対象: 見本.length, 矢印: 内訳("矢印"), 図: 内訳("図"), 描かない: 内訳("なし") },
      "母集団の内訳が変わった (担い手の表を見直す)",
    ).toEqual({ 対象: 登録簿の鍵.length, 矢印: 12, 図: 7, 描かない: 2 });
  });

  for (const { label, 描き手 } of 見本) {
    test(`${label}`, async ({ page }) => {
      await 見本を開く(page, label);
      const { 伸びた段, 見た段, 一周した } = await 一周ぶん見る(page);

      expect(見た段.size, "段を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
      expect(
        一周した,
        `1 周を見終える前に上限に達した (見た段 = ${[...見た段].join("/")})`,
      ).toBe(true);

      if (描き手 === "なし") {
        expect([...伸びた段.keys()], "伸びるものを持たない図で何かが伸びている").toEqual([]);

        // 植え込み対照 = 印を 1 つ足して、同じ読み手が見つけることを確かめる
        const 植えた = await 図を読む(page, true);
        expect(
          植えた.描いている.length,
          "印を足しても読み手が見つけない (探し方が実物と噛み合っていない)",
        ).toBeGreaterThan(0);
        expect((await 図を読む(page)).描いている, "植えた印が残っている").toEqual([]);
        return;
      }

      const 名前 = [...伸びた段.keys()];
      expect(名前.length, `${描き手}が 1 つも伸びていない (検査が空振りしている)`).toBeGreaterThan(0);

      // 担い手が入れ替わっていないか。 矢印の図が図側だけで伸びていたら表が古い
      expect(
        名前.filter((n) => !n.startsWith(`${描き手}:`)),
        `${描き手}以外が伸びている (表の担い手が実物と違う)`,
      ).toEqual([]);

      const 引き直し = [...伸びた段.entries()]
        .filter(([, 段]) => 段.size > 1)
        .map(([名, 段]) => `${名} (段 ${[...段].join("/")})`);
      expect(引き直し, `既に見えているものが引き直されている: ${引き直し.join(", ")}`).toEqual([]);
    });
  }
});
