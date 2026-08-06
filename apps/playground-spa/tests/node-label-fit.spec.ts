/**
 * 名札の文字が箱の中に収まっていることの検証 (#1058 / #1061)。
 *
 * この不変条件を見ている検査がどこにも無かった。
 *
 * 既存の幾何検査 (`kind-geometry-check.spec.ts`) は card の subtitle が **横** にはみ出さない
 * ことだけを `/catalog/presets` で見ており、 縦のはみ出しも、 title も、 エディタも対象外だった。
 * pixel 比較 (`editor-visual.spec.ts`) は差分を検出していたが、 閾値 `maxDiffPixelRatio: 0.005`
 * (= 4743 px) の下に隠れた (実測 = この崩れは 2462 px)。
 *
 * pixel の許容量に依存せず、 はみ出しを直接測る。
 *
 * ## 何を守るか
 *
 * 1. 種類を書かない名札 (`#1058`)
 * 2. 種類を明示した名札 (`#1061`) = `actor` / `function` / `storage` / `event` は名前を箱の
 *    高さに関係なく固定の位置に置くため、 名札 (`h: 72`) に載せると名前が箱の下端をまたぐ。
 *    組み立て側 (`compile.ts` の `dropUnfittableEndKinds`) が収まらない種類を `card` に落とす
 * 3. その判定が使う表 (`LABEL_MIN_H`) が実際の描画と合っているか = **両側** を実 render で測る。
 *    「その高さなら収まる」 だけだと表を小さくする誤り (はみ出す高さで載せる) が通り抜け、
 *    「低いとはみ出す」 だけだと表を大きくする誤り (収まるのに落とす) が通り抜ける
 *
 * `shape-` で始まる種別は対象外。 これらは名前を箱ではなく **自分の絵に対して** 置くため
 * (実測 = `shape-code-block` は箱が 30 でも絵は 180 で描かれる)、 箱を基準に測る前提が
 * 成り立たない。 判定側も同じ範囲で切ってある。
 */
import { test, expect } from "@playwright/test";

/** 組み立て側の表 (`packages/dragon/src/compile.ts` の `LABEL_MIN_H`) と同じ値。 */
const 要る高さ = [
  { kind: "actor", h: 95 },
  { kind: "function", h: 94 },
  { kind: "storage", h: 86 },
  { kind: "event", h: 96 },
] as const;

/** 記法を URL に載せてエディタへ渡す (`CdlEditor.tsx` の `#s=<base64>`)。 */
const share = (src: string): string => Buffer.from(src, "utf8").toString("base64");

type 実測 = { title: string; overflowBottom: number; overflowTop: number };

/** 箱と名札の位置を測る。 描画の座標系ではなく画面上の矩形で見る。 */
async function labelFits(page: import("@playwright/test").Page): Promise<実測[]> {
  return await page.evaluate(() => {
    const out: { title: string; overflowBottom: number; overflowTop: number }[] = [];
    for (const body of document.querySelectorAll("svg [data-cdl-role='node-body']")) {
      const g = body.closest("g");
      const label = g?.querySelector("[data-cdl-role='node-label']");
      if (!label) continue;
      const b = body.getBoundingClientRect();
      const t = label.getBoundingClientRect();
      // 大きさを持たない要素 (spacer 等) は測る意味が無い
      if (b.height < 1 || t.height < 1) continue;
      out.push({
        title: (label.textContent ?? "").trim().slice(0, 20),
        overflowBottom: Math.round(t.bottom - b.bottom),
        overflowTop: Math.round(b.top - t.top),
      });
    }
    return out;
  });
}

/**
 * 図の `viewBox` を基準に、 名札 1 つを world 単位で測る。
 *
 * 画面上の px は表示倍率が掛かるため、 1 world の差が 0.4px になって境界の判定が測れない。
 * 倍率で割って図の座標系に戻す。
 */
async function 名札を測る(
  page: import("@playwright/test").Page,
  title: string,
): Promise<{ 箱高: number; 下: number } | null> {
  return await page.evaluate((want) => {
    const anyBody = document.querySelector("svg [data-cdl-role='node-body']");
    const svg = anyBody?.closest("svg") as SVGSVGElement | null;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / svg.viewBox.baseVal.width;
    for (const body of svg.querySelectorAll("[data-cdl-role='node-body']")) {
      const g = body.closest("g");
      const label = g?.querySelector("[data-cdl-role='node-label']");
      if (!label || (label.textContent ?? "").trim() !== want) continue;
      const b = body.getBoundingClientRect();
      const t = label.getBoundingClientRect();
      if (b.height < 1 || t.height < 1) continue;
      return {
        箱高: Math.round((b.height / scale) * 10) / 10,
        下: Math.round(((t.bottom - b.bottom) / scale) * 10) / 10,
      };
    }
    return null;
  }, title);
}

async function 記法を開く(page: import("@playwright/test").Page, src: string): Promise<void> {
  await page.goto(`/editor#s=${share(src)}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

test("エディタの既定サンプルで名札の文字が箱に収まる", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const nodes = await labelFits(page);
  expect(nodes.length, "名札が 1 つも測れていない (選択子が実装とずれた)").toBeGreaterThan(0);

  // 1px の許容は文字の輪郭の丸めのため。 8px 級のはみ出し (実測値) は通さない
  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名札が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});

test("カタログでも名札の文字が箱に収まる", async ({ page }) => {
  // エディタだけを見ると、 別経路で組み立てた図の崩れを取り逃がす
  await page.goto("/catalog/patterns");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const nodes = await labelFits(page);
  expect(nodes.length, "名札が 1 つも測れていない").toBeGreaterThan(0);

  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名札が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});

test("種類を明示した名札でも文字が箱に収まる (#1061)", async ({ page }) => {
  // Issue の再現手順そのまま。 4 種すべてで名前が箱の下端をまたいでいた
  // (実測 = actor 8 / function 8 / storage 4 / event 9 px)。
  await 記法を開く(
    page,
    `title: "t"
type: sequence

actors:
  - A: actor
  - B: function
  - C: storage
  - D: event

flow:
  - A -> B: "x"
  - B -> C: "y"
  - C -> D: "z"
`,
  );

  const nodes = await labelFits(page);
  expect(nodes.length, "名札が 1 つも測れていない").toBeGreaterThan(0);
  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名札が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});

for (const { kind, h } of 要る高さ) {
  test(`${kind} は高さ ${h} で名前が箱に収まる`, async ({ page }) => {
    // 表の値で載せた時に本当に収まるか。 表を小さくする誤り (はみ出す高さで載せてしまう) を
    // ここで捕まえる。
    await 記法を開く(
      page,
      `title: "t"
type: sequence

actors:
  - A
  - B:
      kind: ${kind}
      大きさ: 300,${h}

flow:
  - A -> B: "x"
`,
    );
    const 実測 = await 名札を測る(page, "B");
    expect(実測, "名札 B が測れていない").not.toBeNull();
    expect(実測!.箱高, `名札の高さが ${h} になっていない`).toBeGreaterThanOrEqual(h - 1);
    expect(実測!.下, `名前が箱の下端を ${実測!.下} はみ出す`).toBeLessThanOrEqual(1);
  });

  test(`${kind} は高さ ${h - 2} だと名前が箱をはみ出す`, async ({ page }) => {
    // 表を大きくする誤り (収まるのに落とす) を捕まえる。 順序図の名札はこの高さだと `card` に
    // 落ちて測れないので、 名札を持たない `type: flow` で同じ種類を同じ高さに描いて測る。
    //
    // 2 低い高さで見るのは、 1 低い時のはみ出しが 0.01-0.69 world しかない種別があるため
    // (`function` / `storage`)。 2 低ければ 1.0 以上のはみ出しが出るので、 表が 2 以上
    // 過大になっていればここで落ちる。
    await 記法を開く(
      page,
      `title: "t"
type: flow

actors:
  - A:
      kind: ${kind}
      位置: 400,300
      大きさ: 300,${h - 2}
  - B

flow:
  - A -> B: "x"
`,
    );
    const 実測 = await 名札を測る(page, "A");
    expect(実測, "箱 A が測れていない").not.toBeNull();
    expect(実測!.箱高, `箱の高さが ${h - 2} になっていない`).toBeLessThanOrEqual(h);
    expect(実測!.下, "表の値より 2 低いのに名前が収まっている (表が過大)").toBeGreaterThan(0);
  });
}
