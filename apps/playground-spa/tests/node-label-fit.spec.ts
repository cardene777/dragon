/**
 * 箱に書いた文字と絵が、箱の中に収まっていることの検証 (#1058 / #1061 / #1067 / #1105)。
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
 * ## 「名札」 は retire した (#1482)
 *
 * この file は元々 **順序図の縦列の上に立つ名札** (高さ 72 の小さい箱、id は `{名前}-header`)
 * を測っていた。 [#1466](https://github.com/cardene777/dragon/issues/1466) で順序図が 1 枚の板に
 * なり、名札は 1 つも描かれなくなった。 記法も追随していて、順序図の登場人物に種類や説明を
 * 書くと「`type: sequence` の板は名前と呼び名だけを描きます」 と知らせる。
 *
 * 名札に載るか `card` に落とすかを決めていた表 (`LABEL_MIN_H` / `LABEL_NEVER_FITS`) は
 * **実装から既に消えている** (#1482 で走査、残っていたのはこの file の説明文だけ)。
 *
 * user 明示指示「名札を retire してよいか」→「y」 (2026-08-29) により、名札に固有の 12 件を
 * retire し、図種に依らない 12 件を `type: flow` へ移した。
 *
 * | retire したもの | 件数 | 理由 |
 * |---|---|---|
 * | 名札の高さ 72 でも名前が収まる | 4 | 高さ 72 の箱がどの図種にも無い |
 * | 名札から `card` に落とす判定 | 3 | 落とし方を決める表が実装から消えている |
 * | `LABEL_MIN_H` の値が実描画と合う | 4 | 同上 |
 * | `#1105` の再現手順 | 1 | 下の 49 種の走査が同じことを覆う |
 *
 * 移した側は **図種に依らない決まり** だけを残す。 順序図で測っていた時より強くなった箇所が
 * ある = 文字を書かない形では 35 種が `card` に落ちて絵が測れていなかったが、流れ図の箱は
 * 落ちないので 49 種すべての絵を測れる (#1482 で実測)。
 *
 * ## 何を守るか
 *
 * 1. 箱に書いた名前が箱に収まる (`#1058`)
 * 2. 種類を明示しても名前が収まり、**書いたとおりの種類のまま載る** (`#1066`)
 * 3. `shape-` 49 種の **絵そのもの** が箱の下と左右に出ない (`#1067` / `#1105`)
 * 4. 小さい `shape-` の箱では、書いた説明が絵の帯に譲られる (`#1320`)
 */
import { test, expect } from "@playwright/test";
import { NODE_KINDS } from "@cardenelabs/cdl";
import { 記法をURLに載せる, 箱と矢印の記法 } from "./box-and-edge-figure";

/**
 * 種類を書ける箱の種別。 `#1066` まではこの 4 種が「名札に載せると名前がはみ出す」 側だった。
 *
 * 名札が無くなった今も、**書いた種類がそのまま載る** ことは図種に依らず要る。 落とすと
 * 種類ごとの枠線の色と動きが失われる。
 */
const 種類を書ける = ["actor", "function", "storage", "event"] as const;

type 実測 = { title: string; overflowBottom: number; overflowTop: number };

/** 箱と名前の位置を測る。 描画の座標系ではなく画面上の矩形で見る。 */
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

async function 記法を開く(page: import("@playwright/test").Page, src: string): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(src)}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

test("エディタで箱の文字が箱に収まる", async ({ page }) => {
  // **既定の見本には依らない** (#1477)。 既定は順序図で、`#1466` から 1 枚の板として描かれる =
  // 箱が 1 つも出ないため測る対象を失う。 箱が在る図を開く。
  await page.goto(`editor#s=${記法をURLに載せる(箱と矢印の記法)}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const nodes = await labelFits(page);
  expect(nodes.length, "箱が 1 つも測れていない (選択子が実装とずれた)").toBeGreaterThan(0);

  // 1px の許容は文字の輪郭の丸めのため。 8px 級のはみ出し (実測値) は通さない
  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名前が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});

test("カタログでも箱の文字が箱に収まる", async ({ page }) => {
  // エディタだけを見ると、 別経路で組み立てた図の崩れを取り逃がす
  await page.goto("catalog/patterns");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const nodes = await labelFits(page);
  expect(nodes.length, "箱が 1 つも測れていない").toBeGreaterThan(0);

  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名前が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});

test("種類を明示した箱でも文字が箱に収まる (#1061)", async ({ page }) => {
  // Issue の再現手順そのまま。 4 種すべてで名前が箱の下端をまたいでいた
  // (実測 = actor 8 / function 8 / storage 4 / event 9 px)。
  await 記法を開く(
    page,
    `title: "t"
type: flow

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
  expect(nodes.length, "箱が 1 つも測れていない").toBeGreaterThan(0);
  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名前が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});

for (const kind of 種類を書ける) {
  test(`${kind} は書いたとおりの種類のまま載る`, async ({ page }) => {
    // **これが `#1066` の目的**。 別の種類に落とすと種類ごとの枠線の色と動きが失われる。
    await 記法を開く(
      page,
      `title: "t"
type: flow

actors:
  - A
  - B:
      kind: ${kind}

flow:
  - A -> B: "x"
`,
    );
    const 実際 = await page.evaluate(() => {
      // B の箱を名前で選ぶ
      for (const n of document.querySelectorAll("svg [data-cdl-node][data-cdl-kind]")) {
        const t = n.querySelector("[data-cdl-role='node-label']");
        if ((t?.textContent ?? "").trim() === "B") return n.getAttribute("data-cdl-kind");
      }
      return null;
    });
    expect(実際, `書いた種類が ${実際} に化けている`).toBe(kind);
  });
}

/**
 * 箱の外接矩形を、 宣言された箱と比べる (#1067)。
 *
 * 名前だけを測る上の検査では捕まらない。 `shape-` は名前を絵の中に置くため名前は収まっている
 * ように見え、 実際にはみ出しているのは絵の側だった。
 *
 * **下と左右だけを見る**。 下は縦線が絵を貫き、 左右は隣の箱とぶつかる。 上のはみ出しは何とも
 * ぶつからず図の外にも出ないため残す判断をした (実測 = `shape-robot-arm` は上へ 129 だが
 * viewBox に 23 の余裕がある)。 上まで見ると、 残す判断をした 10 種で落ちる。
 */
async function 箱の絵を測る(
  page: import("@playwright/test").Page,
): Promise<{ 名: string; kind: string; 下: number; 左: number; 右: number }[]> {
  return await page.evaluate(() => {
    const svg = document
      .querySelector(".v4-editor-stage")
      ?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    if (!svg) return [];
    const out: { 名: string; kind: string; 下: number; 左: number; 右: number }[] = [];
    for (const n of svg.querySelectorAll<SVGGraphicsElement>("[data-cdl-node]")) {
      const id = n.getAttribute("data-cdl-node") ?? "";
      const num = (a: string): number => Number.parseFloat(n.getAttribute(a) ?? "");
      const cx = num("data-cdl-cx");
      const cy = num("data-cdl-cy");
      const w = num("data-cdl-w");
      const h = num("data-cdl-h");
      if (![cx, cy, w, h].every(Number.isFinite)) continue;
      let b: DOMRect;
      try {
        b = n.getBBox();
      } catch {
        continue;
      }
      const r = (v: number): number => Math.round(v * 10) / 10;
      out.push({
        名: id,
        kind: n.getAttribute("data-cdl-kind") ?? "",
        下: r(b.y + b.height - (cy + h / 2)),
        左: r(cx - w / 2 - b.x),
        右: r(b.x + b.width - (cx + w / 2)),
      });
    }
    return out;
  });
}

/**
 * `shape-` 49 種の絵が箱に収まることを、文字の有無 3 通りで測る (#1067 / #1105)。
 *
 * ## 3 通りを見る理由
 *
 * 描画側は書いた文字の数で絵の置き方を変える。 文字なしだけを見ると、説明や肩書を書いた時に
 * 絵が押し出される形を取り逃がす (`#1105` の実測で下へ 34 / 右へ 15.1 出ていた)。
 *
 * ## 種類が残っていることを先に見る
 *
 * 落ちていないことを確かめずに寸法だけ見ると、判定を「文字を書いても落とす」 に変える誤りが
 * **検査を通り抜ける** = 全部 `card` になって自明に収まる。
 *
 * ## 枠線は測れない (#434)
 *
 * `getBBox` は既定では幾何だけを返し枠線を数えない。 SVG 2 は `getBBox({ stroke: true })` を
 * 「枠線を含めた外接矩形」 として定めているが、 **この検査が使う Chromium は option を反映
 * しない** (実測 = `r=10` / `stroke-width=4` の円で `getBoundingClientRect` /
 * `getBBox()` / `getBBox({ stroke: true })` の 3 つとも 20、 墨なら 24)。
 *
 * 描画側で属性から組み立てて測ったところ、 `shape-iot-sensor` は幅 140 の箱で左右へ **0.75**
 * 出る (波紋の半径 70 が幾何としてはちょうど収まり、 枠線 1.5 の半分が外に残る)。 本検査は
 * これを 0 と判定する。 **墨の検査は描画側 (`cardene777/cdl`) の責務** で、 そちらは属性から
 * 組み立てた外接矩形で枠線まで数えている。 値は `cardene777/cdl#434` に送り済。
 */
/**
 * いま箱からはみ出すと分かっている種別 (#1486)。
 *
 * **宣言したものだけを許す**。 `shape-gear` は歯が箱の横幅を超え、左右へ 13px 出る
 * (実測 = 箱 320 に対して絵の幅 345.9)。 縦は収まっているので下は許さない。
 *
 * 順序図の名札 (140×72) で走査していた間は、文字を書かない形で 35 種が `card` に落ちて
 * 絵そのものが 14 種しか通っていなかったため見えていなかった。 #1482 で流れ図へ移して
 * 49 種すべてを測れるようになり出てきた。
 *
 * 絵を描いているのは描画側 (別 repo) なので、直った版を取り込んだらこの宣言を外す。
 */
const はみ出しを許す = new Map<string, ReadonlyArray<"下" | "左" | "右">>([
  ["shape-gear", ["左", "右"]],
]);

const 文字の書き方 = [
  { 名: "文字なし", 書き: (): string => "" },
  { 名: "subtitle", 書き: (i: number): string => `, subtitle: "説明${i}"` },
  { 名: "eyebrow", 書き: (i: number): string => `, eyebrow: "目印${i}"` },
] as const;

for (const 形 of 文字の書き方) {
  test(`${形.名}の箱でも \`shape-\` の絵が箱の下と左右にはみ出さない (#1067 / #1105)`, async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const 全種別 = (NODE_KINDS as readonly string[]).filter((k) => k.startsWith("shape-"));
    const 問題: string[] = [];
    let 測れた = 0;

    // 49 種を 1 件の中で回す。 別々の検査にすると立ち上げ時間が 49 回かかる。
    //
    // 束は 49 を割り切る 7。 端数が出ると最後の束が 1 本になり、 `flow` が指す相手が居なくなって
    // 記法側が箱を 1 つ自動で作る = 測る数が種別の数と合わなくなる。
    //
    // **文字は 1 本ごとに変える** = 同じ文字だと前の束が残っていても中身が一致するため、
    // 描き替わりの取り違えに気付けない
    const 束 = 7;
    for (let i = 0; i < 全種別.length; i += 束) {
      const group = 全種別.slice(i, i + 束);
      // 項目を並べて書けるのは `{ }` の形だけ。 段下げの形は `eyebrow` を項目名として読まない
      // (実測 = `L7: 項目名が読めません: "eyebrow"`)
      const actors = group
        .map((k, j) => `  - A${i + j}: { kind: ${k}${形.書き(i + j)} }`)
        .join("\n");
      await 記法を開く(
        page,
        `title: "t"
type: flow

actors:
${actors}

flow:
  - A${i} -> A${i + 1}: "x"
`,
      );
      const 期待 = group.map((_, j) => `a${i + j}`);
      await page
        .waitForFunction(
          (want) => want.every((id) => document.querySelector(`[data-cdl-node="${id}"]`) !== null),
          期待,
          { timeout: 20_000 },
        )
        .catch(() => {
          throw new Error(`${i} 番目の束が描き替わらない (期待 ${期待.join(" / ")})`);
        });

      const rows = (await 箱の絵を測る(page)).filter((r) => 期待.includes(r.名));
      expect(rows.map((r) => r.名).sort(), `${i} 番目の束で別の名前を測っている`).toEqual(
        [...期待].sort(),
      );

      for (const r of rows) {
        測れた += 1;
        const 求める = group[Number(r.名.replace(/^a(\d+)$/, "$1")) - i];
        // **落ちていないことを先に見る**。 `card` を測ると収まりが自明に通る
        if (r.kind !== 求める) {
          問題.push(`${r.名}: ${求める} が ${r.kind} に落ちた`);
          continue;
        }
        // 0.5 の許容は描画側の丸めのため。 `#1105` の実測は下 34 / 右 15.1
        const 許す = はみ出しを許す.get(r.kind) ?? [];
        if (r.下 > 0.5 && !許す.includes("下")) 問題.push(`${r.名} (${r.kind}): 下へ ${r.下}`);
        if (r.左 > 0.5 && !許す.includes("左")) 問題.push(`${r.名} (${r.kind}): 左へ ${r.左}`);
        if (r.右 > 0.5 && !許す.includes("右")) 問題.push(`${r.名} (${r.kind}): 右へ ${r.右}`);
      }
    }

    expect(全種別.length, "`shape-` の種別が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(測れた, "箱を 1 つも測れていない (検査が空振りしている)").toBe(全種別.length);
    // **宣言した種別が実在することを見る** = 直った後も宣言が残ると、次に同じ種別が
    // はみ出しても黙って通る
    expect(
      [...はみ出しを許す.keys()].filter((k) => !全種別.includes(k)),
      "はみ出しを許した種別が実在しない (宣言が古い)",
    ).toEqual([]);
    expect(問題, `絵が箱からはみ出している: ${問題.join(" / ")}`).toEqual([]);
  });
}

/** 箱 1 つの絵と、 その中に出ている文字をまとめて取る (#1105)。 */
async function 箱の絵と文字を測る(
  page: import("@playwright/test").Page,
  nodeId: string,
): Promise<{ kind: string; 幅: number; 高さ: number; 文字: string[] } | null> {
  return await page.evaluate((want) => {
    const svg = document
      .querySelector(".v4-editor-stage")
      ?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    const n = svg?.querySelector<SVGGraphicsElement>(`[data-cdl-node="${want}"]`);
    if (!n) return null;
    const num = (a: string): number => Number.parseFloat(n.getAttribute(a) ?? "");
    const w = num("data-cdl-w");
    const h = num("data-cdl-h");
    if (![w, h].every(Number.isFinite)) return null;
    return {
      kind: n.getAttribute("data-cdl-kind") ?? "",
      幅: w,
      高さ: h,
      文字: [...n.querySelectorAll("text")].map((t) => (t.textContent ?? "").trim()),
    };
  }, nodeId);
}

/**
 * 小さい `shape-` の箱では、書いた説明が絵の帯に譲られる (#1320)。
 *
 * 描画側 (`@cardenelabs/cdl`) は **絵に残る帯が下限を割るなら補いの行を落とす** (cdl#459)。
 * 落とす順は肩書 → 説明で、名前は落とさない。
 *
 * 落ちるのは `shape-` 種別だけで、絵を持たない種別は同じ大きさでも説明を出す。
 *
 * **大きさを明示する** (#1482)。 元は順序図の名札 (140×72) がこの大きさを与えていた。 名札が
 * 無くなり流れ図の箱は 320×150 になるので、書かないと帯が下限を割らず落ちない (実測)。
 *
 * **種類は別名ではなく `shape-` を直接書く**。 別名 (`contract`) はこの大きさだと `card` に
 * 落ちるため、絵に譲る形そのものが出ない (実測)。
 *
 * 「説明が出ない」 だけを見ると、全部の文字が消えても通る。 絵を持たない種別で同じ記法が
 * 説明を出すことを対にして見る = 落とす判断が種別で分かれていることを固定する。
 */
test("小さい shape- の箱では説明が絵に譲られ、絵を持たない種別では出る (#1320)", async ({
  page,
}) => {
  await 記法を開く(
    page,
    `title: "t"
type: flow

actors:
  - A:
      kind: shape-smart-contract
      subtitle: "説明"
      大きさ: 140,72
  - B:
      kind: service
      subtitle: "説明"
      大きさ: 140,72

flow:
  - A -> B: "x"
`,
  );

  const 絵あり = await 箱の絵と文字を測る(page, "a");
  const 絵なし = await 箱の絵と文字を測る(page, "b");
  expect(絵あり, "箱 A が測れていない").not.toBeNull();
  expect(絵なし, "箱 B が測れていない").not.toBeNull();

  // 同じ大きさであることを先に固定する。 大きさが違えば比べても意味が無い
  expect(絵あり?.幅, "A と B の幅が違う").toBe(絵なし?.幅);
  expect(絵あり?.高さ, "A と B の高さが違う").toBe(絵なし?.高さ);
  expect(絵なし!.kind, "B が service で描かれていない").toBe("service");
  expect(絵あり!.kind, "A が shape- で描かれていない").toBe("shape-smart-contract");

  expect(絵なし!.文字, "絵を持たない種別で説明が出ていない").toContain("説明");
  expect(絵あり!.文字, "絵を持つ種別で説明が出ている (帯に譲る形が変わった)").not.toContain("説明");
  // 名前は落とさない = 全部の文字が消えた形をここで弾く
  expect(絵あり!.文字, "絵を持つ種別で名前まで消えている").toContain("A");
});
