import { test, expect, type Page } from "@playwright/test";
import { cores, shoot, type Box } from "./helpers/pixel-contrast";
import { 記法をURLに載せる } from "./box-and-edge-figure";

/**
 * 役目 `role: main` を書いた線 (順路) を強調の色で引き、矢じりも同じ色にする (#2141)。
 *
 * 描画エンジンは順路の線の色の属性を `var(--cdl-now, #c0421f)` にして出す。 ところが
 * `cdl-theme.css` の線の規則が全ての線を `--dragon-edge-tone` で上書きしており、画面では
 * 順路も枝も同じ墨色だった (実測 = 明 `rgb(34, 24, 17)` / 暗 `rgb(236, 223, 201)`)。
 *
 * 矢じりは `<defs>` の `marker` にあり、名前が色味だけで決まる。 順路と枝が同じ色味なら同じ
 * 矢じりを共有するので、線の色だけを直すと矢じりが墨色のまま残る。 そこで 2 つを測る。
 *
 *   1. 線の計算値 = 順路は `--cdl-now`、 枝はそれと違う色
 *   2. 描いた画素 = 矢じりの色が、同じ線の色と一致する
 *
 * **2 は計算値で読まない**。 矢じりは線の色を `context-stroke` で継ぐため、計算値は色ではなく
 * `context-stroke` という語になる。 閲覧ソフトが実際にその色で塗ったかは画素にしか出ない。
 */

/**
 * 順路 3 本と枝 3 本を横向きに引く図。
 *
 * | 書いたこと | 何のためか |
 * |---|---|
 * | 矢印を全て横向き | 矢じりが箱の上下の辺に重ならず、紙の上に出る。 縦の矢印は矢じりの先が箱の枠に掛かり、芯の画素が混色になった (実測) |
 * | 順路と枝の両方に 3 形 (三角 / 開いた矢 / 白抜き) を置く | 面を塗る形と輪郭で描く形で、線の色を継ぐ規則が別。 順路に置かないと、輪郭の規則を外しても矢じりが色味の色のまま線と一致して落ちない |
 * | 枝の 3 本のうち 2 本を別の色味 (teal / error) にする | 矢じりが色味の名前ではなく線から色を継ぐことを、強調の色以外の色でも見る |
 * | 1 段目 (1.5 秒) で線を引き、2 段目 (60 秒) で同じ線を名指しする | 名指しした線は段の長さをかけて起点から伸びる。 60 秒の 1 段だけにすると、測る時点で線が箱の縁から 20 単位しか伸びていなかった (実測)。 2 段目は線が既に出ているので引き直さず、光ったまま止まる = 2 枚の写しの間で画素が動かない |
 * | 名前の下地を外す | 下地が矢じりの近くに来ると、矢じりを隠した写しとの差に下地の縁が混ざる |
 */
const 順路の記法 = `title: "順路と枝"
type: flow
reveal: all

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 560, width: 280 }
  l3: { x: 1120, width: 280 }

actors:
  - ブラウザ: { kind: card, lane: l1, stack: 0 }
  - 受付: { kind: card, lane: l2, stack: 0 }
  - 台帳: { kind: card, lane: l3, stack: 0 }
  - 夜間の集計: { kind: card, lane: l1, stack: 1 }
  - 控え: { kind: card, lane: l2, stack: 1 }
  - 監視: { kind: card, lane: l3, stack: 1 }
  - 支払い画面: { kind: card, lane: l1, stack: 2 }
  - 決済: { kind: card, lane: l2, stack: 2 }
  - 領収書: { kind: card, lane: l3, stack: 2 }

flow:
  - ブラウザ -> 受付: "注文を送る" (accent, solid) { role: main, labelPlate: false }
  - 受付 -> 台帳: "書く" (accent, solid) { role: main, head: open, labelPlate: false }
  - 夜間の集計 -> 控え: "写す" (teal, solid) { head: triangle, headFill: hollow, labelPlate: false }
  - 控え -> 監視: "知らせる" (error, solid) { labelPlate: false }
  - 支払い画面 -> 決済: "払う" (accent, solid) { role: main, head: triangle, headFill: hollow, labelPlate: false }
  - 決済 -> 領収書: "控えを送る" (accent, solid) { head: open, labelPlate: false }

animation:
  - step: "線を引く" 1.5s
    focus: [ブラウザ, 受付, 台帳, 夜間の集計, 控え, 監視, 支払い画面, 決済, 領収書, "ブラウザ -> 受付", "受付 -> 台帳", "夜間の集計 -> 控え", "控え -> 監視", "支払い画面 -> 決済", "決済 -> 領収書"]
  - step: "引いた線を光らせたまま止める" 60s
    focus: [ブラウザ, 受付, 台帳, 夜間の集計, 控え, 監視, 支払い画面, 決済, 領収書, "ブラウザ -> 受付", "受付 -> 台帳", "夜間の集計 -> 控え", "控え -> 監視", "支払い画面 -> 決済", "決済 -> 領収書"]
`;

type Rgb = [number, number, number];

type 線の値 = {
  edge: string;
  順路: boolean;
  stroke: string;
  /** 線の不透明度。 矢じりは線の不透明度を継がないので、線の画素だけを紙の混ざる前へ戻す */
  strokeOpacity: number;
  /** 終点 (矢じりの先) の画面上の位置 */
  end: { x: number; y: number };
  /** 終点から画面で 60px 手前の位置。 矢じりにも名前にも掛からない */
  back: { x: number; y: number };
};

/**
 * 画素密度を 2 倍にする。 白抜きと開いた矢の輪郭は画面で 2px 前後しかなく、等倍だと輪郭が
 * 覆い切る画素が無く、芯が紙との混色になる。
 */
test.use({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });

async function 開く(page: Page, dark: boolean): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(順路の記法)}`);
  await page.waitForLoadState("networkidle");
  await page.evaluate((d) => document.documentElement.classList.toggle("dark", d), dark);
  // 1 段目で名指しした線は起点から伸びる。 伸び終わるまで待つ
  await page.waitForTimeout(3500);
}

/** `--cdl-now` を色として解決する。 変数の値は `#c0421f` の形なので、要素に塗って計算値で読む */
async function 強調の色(page: Page): Promise<string> {
  return page.evaluate(() => {
    const 見本 = document.createElement("span");
    見本.style.color = "var(--cdl-now)";
    document.body.appendChild(見本);
    const 色 = getComputedStyle(見本).color;
    見本.remove();
    return 色;
  });
}

async function 線を読む(page: Page): Promise<線の値[]> {
  const 線 = await page.evaluate(() => {
    const out: 線の値[] = [];
    for (const g of document.querySelectorAll('[data-testid="editor-preview-stage"] [data-cdl-edge]')) {
      const line = g.querySelector<SVGGeometryElement>('[data-cdl-role="edge-line"]');
      const ctm = line?.getScreenCTM();
      if (!line || !ctm) continue;
      const 画面へ = (p: DOMPoint) => ({
        x: p.x * ctm.a + p.y * ctm.c + ctm.e,
        y: p.x * ctm.b + p.y * ctm.d + ctm.f,
      });
      const len = line.getTotalLength();
      out.push({
        edge: g.getAttribute("data-cdl-edge") ?? "",
        // 順路かは描画エンジンが出す色の属性で見分ける。 属性の形が変わればこの検査が
        // 「順路の線が無い」 で落ちるので、CSS の規則が効かなくなったことに気付ける
        順路: (line.getAttribute("stroke") ?? "").startsWith("var(--cdl-now"),
        stroke: getComputedStyle(line).stroke,
        strokeOpacity: Number(getComputedStyle(line).strokeOpacity),
        end: 画面へ(line.getPointAtLength(len)),
        back: 画面へ(line.getPointAtLength(Math.max(0, len - 60 / ctm.a))),
      });
    }
    return out;
  });
  expect(線.filter((l) => l.順路).length, "順路の線が 3 本読めていない").toBe(3);
  expect(線.filter((l) => !l.順路).length, "枝の線が 3 本読めていない").toBe(3);
  return 線;
}

/**
 * 1 本の線の、矢じりか線そのものを隠した写しと隠さない写しを撮り、描いた色を返す。
 *
 * 2 枚の差に出るのは隠した物だけなので、箱や名前の画素は拾わない。
 *
 * **線の本体は破線の長さを 0 にして消す**。 `visibility` で隠すと矢じりも一緒に消え、線を測る
 * 写しの差に矢じりが混ざる (実測 = 矢じりの面の規則を外した変異で、順路の線が矢じりの墨色
 * `34,24,17` と読まれた)。 破線の長さを 0 にしても色 (`stroke`) は残るので、矢じりが継ぐ色は変わらない。
 *
 * **矢じりを測る時は、2 枚とも線の本体を消しておく**。 白抜きの矢じりは紙色の面で線の端を覆うので、
 * 線を残すと「線の上に面を置いた画素」 の差が最も大きく出て、輪郭ではなく面の色を拾う (実測 =
 * 色味 teal の白抜きで `255,253,247`)。
 *
 * **差の芯の中で、最も地から離れた画素を採る**。 芯 (差が最大の 97% 以上の画素) には、線が画素を
 * 覆い切らずに紙の色が数 % 混ざった画素も入る。 覆い切った画素が描いた色そのもの。
 *
 * **線の画素は、不透明度で混ざった紙の分を戻す**。 線は不透明度 0.95 で塗られ、矢じりは 1 で塗られる
 * ので、同じ色を指定しても線の画素だけ紙に 5% 寄る (実測 = 強調の色 `192,66,31` の線が `195,75,41`)。
 * 隠した写しの同じ画素が紙の色なので、`(画素 - (1 - 不透明度) × 紙) / 不透明度` で指定した色に戻す。
 */
async function 描いた色(page: Page, 線: 線の値, 対象: "矢じり" | "線"): Promise<Rgb> {
  const 中心 = 対象 === "矢じり" ? 線.end : 線.back;
  const 半径 = 対象 === "矢じり" ? 30 : 12;
  const 範囲: Box = { x: 中心.x - 半径, y: 中心.y - 半径, width: 半径 * 2, height: 半径 * 2 };
  const 選ぶ = `[data-cdl-edge="${線.edge}"] [data-cdl-role="edge-line"]`;
  const 本体を消す = `${選ぶ} { stroke-dasharray: 0 1000000 !important; stroke-linecap: butt !important; }`;

  const 前提 = 対象 === "矢じり" ? await page.addStyleTag({ content: 本体を消す }) : null;
  const 出した = await shoot(page, 範囲);
  const 札 = await page.addStyleTag({
    content:
      対象 === "矢じり"
        ? `${選ぶ} { marker-start: none !important; marker-end: none !important; }`
        : 本体を消す,
  });
  const 隠した = await shoot(page, 範囲);
  for (const el of [札, 前提]) await el?.evaluate((e) => (e as Element).remove());

  const 芯 = cores(出した, 隠した);
  if (芯.kind !== "ok") throw new Error(`${線.edge} の${対象}を測れない: ${芯.kind}`);
  const 離れ = ({ fg, bg }: { fg: Rgb; bg: Rgb }) => Math.hypot(fg[0] - bg[0], fg[1] - bg[1], fg[2] - bg[2]);
  const { fg, bg } = 芯.画素.reduce((a, b) => (離れ(b) > 離れ(a) ? b : a));
  if (対象 === "矢じり") return fg;
  const α = 線.strokeOpacity;
  return fg.map((v, i) => Math.round((v - (1 - α) * bg[i]!) / α)) as Rgb;
}

const rgb = (s: string): Rgb => {
  const m = s.match(/\d+(\.\d+)?/g);
  if (!m || m.length < 3) throw new Error(`色として読めない: ${s}`);
  return [Number(m[0]), Number(m[1]), Number(m[2])];
};

/** 8bit の丸めで 1-2 動くので、成分ごとに 3 までの差を同じ色とみなす */
const 同じ色 = (a: Rgb, b: Rgb): boolean => a.every((v, i) => Math.abs(v - b[i]!) <= 3);

/**
 * カタログの「線の役目」 で、切替を押すと通り道の 2 本だけが強調の色になる。
 *
 * 見本は書かない形と `main` を書いた形で箱と線と名前を揃えてあり、違うのは線の色だけ
 * (`topics/catalog/styles.cdl.ts`)。 切替の前後で順路の線の数と色を読む。
 */
test("カタログの線の役目: 切替で main を選ぶと通り道の 2 本だけを強調の色で引く", async ({ page }) => {
  await page.goto("catalog/styles", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText("線の役目", { exact: true }).first().click();
  await page.waitForTimeout(1500);
  const 色 = await 強調の色(page);

  const 読む = () =>
    page.locator(".catalog-preview-stage [data-cdl-role='edge-line']").evaluateAll((線) =>
      線.map((l) => ({
        順路: (l.getAttribute("stroke") ?? "").startsWith("var(--cdl-now"),
        stroke: getComputedStyle(l).stroke,
      })),
    );

  const 書かない = await 読む();
  expect(書かない.length, "書かない形の線を 4 本読めていない").toBe(4);
  expect(書かない.filter((l) => l.順路), "書かない形に順路の線がある").toHaveLength(0);
  expect(書かない.filter((l) => l.stroke === 色), "書かない形に強調の色の線がある").toHaveLength(0);

  await page.getByRole("radio", { name: "main" }).click();
  await page.waitForTimeout(1500);
  const 書いた = await 読む();
  expect(書いた.length, "main の形の線を 4 本読めていない").toBe(4);
  expect(書いた.filter((l) => l.順路).map((l) => l.stroke), "通り道の 2 本が強調の色でない").toEqual([色, 色]);
  expect(書いた.filter((l) => !l.順路 && l.stroke === 色), "分かれる線が強調の色になっている").toHaveLength(0);
});

for (const dark of [false, true]) {
  const 画面 = dark ? "暗い画面" : "明るい画面";

  test(`${画面}: 順路の線を強調の色で引き、枝の線はそれと違う色で引く`, async ({ page }) => {
    await 開く(page, dark);
    const 色 = await 強調の色(page);
    const 線 = await 線を読む(page);
    const 順路 = 線.filter((l) => l.順路);
    const 枝 = 線.filter((l) => !l.順路);

    expect(
      順路.map((l) => `${l.edge} ${l.stroke}`),
      "順路の線が強調の色で描かれていない",
    ).toEqual(順路.map((l) => `${l.edge} ${色}`));
    for (const l of 枝) {
      expect(l.stroke, `${l.edge} が順路と同じ色で描かれている`).not.toBe(色);
    }
  });

  test(`${画面}: 矢じりを線と同じ色で塗り、順路の線は強調の色で描かれる`, async ({ page }) => {
    await 開く(page, dark);
    const 色 = rgb(await 強調の色(page));
    const 違い: string[] = [];
    for (const l of await 線を読む(page)) {
      const 線の色 = await 描いた色(page, l, "線");
      const 矢じりの色 = await 描いた色(page, l, "矢じり");
      if (!同じ色(矢じりの色, 線の色)) {
        違い.push(`${l.edge}: 線 ${線の色.join(",")} / 矢じり ${矢じりの色.join(",")}`);
      }
      if (l.順路 && !同じ色(線の色, 色)) {
        違い.push(`${l.edge}: 順路の線 ${線の色.join(",")} / 強調の色 ${色.join(",")}`);
      }
    }
    expect(違い, `描いた色が合わない:\n${違い.join("\n")}`).toHaveLength(0);
  });
}
