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
 * ## `shape-` は別の測り方をする (#1067)
 *
 * これらは名前を箱ではなく自分の絵に対して置くため、 名前だけを測る上の 3 つでは捕まらない。
 * 実際に壊れていたのは **絵そのものが箱の外に出る** ことで、 縦線が絵を貫き隣の本ともぶつかって
 * いた。 名札 group の外接矩形を箱と比べる検査を別に置く。
 */
import { test, expect } from "@playwright/test";
import { NODE_KINDS } from "@cardenelabs/cdl";

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

/**
 * 名札 group の外接矩形を、 宣言された箱と比べる (#1067)。
 *
 * 名前だけを測る上の検査では捕まらない。 `shape-` は名前を絵の中に置くため名前は収まっている
 * ように見え、 実際にはみ出しているのは絵の側だった。
 *
 * **下と左右だけを見る**。 下は縦線が絵を貫き、 左右は隣の本とぶつかる。 上のはみ出しは何とも
 * ぶつからず図の外にも出ないため残す判断をした (実測 = `shape-robot-arm` は上へ 129 だが
 * viewBox に 23 の余裕がある)。 上まで見ると、 残す判断をした 10 種で落ちる。
 */
async function 名札の絵を測る(
  page: import("@playwright/test").Page,
): Promise<{ 名: string; kind: string; 箱高: number; 下: number; 左: number; 右: number }[]> {
  return await page.evaluate(() => {
    const svg = document
      .querySelector(".v4-editor-stage")
      ?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    if (!svg) return [];
    const out: { 名: string; kind: string; 箱高: number; 下: number; 左: number; 右: number }[] = [];
    for (const n of svg.querySelectorAll<SVGGraphicsElement>("[data-cdl-node]")) {
      const id = n.getAttribute("data-cdl-node") ?? "";
      if (!id.endsWith("-header")) continue;
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
        箱高: r(h),
        下: r(b.y + b.height - (cy + h / 2)),
        左: r(cx - w / 2 - b.x),
        右: r(b.x + b.width - (cx + w / 2)),
      });
    }
    return out;
  });
}

test("`shape-` の名札で絵が箱の下と左右にはみ出さない (#1067)", async ({ page }) => {
  // 49 種を 1 件の中で回す。 別々の検査にすると立ち上げ時間が 49 回かかる
  test.setTimeout(240_000);

  const 全種別 = (NODE_KINDS as readonly string[]).filter((k) => k.startsWith("shape-"));
  const 問題: string[] = [];
  let 測れた = 0;

  // まとめて描く。 名札の高さは全本で揃うので、 揃えた後が 72 (名札の既定) であることを
  // 各回で確かめる = 高い名札で測ると、 直っていない種別も収まって見える。
  //
  // 束は 49 を割り切る 7。 端数が出ると最後の束が 1 本になり、 `flow` が指す相手が居なくなって
  // 記法側が本を 1 つ自動で作る = 測る数が種別の数と合わなくなる。
  const 束 = 7;
  for (let i = 0; i < 全種別.length; i += 束) {
    const group = 全種別.slice(i, i + 束);
    const actors = group.map((k, j) => `  - A${i + j}: ${k}`).join("\n");
    await 記法を開く(
      page,
      `title: "t"
type: sequence

actors:
${actors}

flow:
  - A${i} -> A${i + 1}: "x"
`,
    );
    // **描き替わるまで待つ**。 `page.goto` は `#` だけが変わる形だと同一 document 内の移動に
    // なり、 記法が読み直されないことがある。 待たずに測ると前の束をもう一度測って、
    // 測った数だけが増える (実測 = 49 種のはずが 56 になった)。
    //
    // **本の数で待ってはいけない**。 束は全て同じ本数なので、 前の束が残っていても数は一致する
    // = 描き替えが遅れると最初の束を 7 回測って `測れた === 49` を満たし、 残り 42 種の regression を
    // 見逃す (Round 1 review の指摘)。 **この束にしか無い名前** が出るまで待つ
    const 期待 = group.map((_, j) => `a${i + j}-header`);
    await page
      .waitForFunction(
        (want) => want.every((id) => document.querySelector(`[data-cdl-node="${id}"]`) !== null),
        期待,
        { timeout: 20_000 },
      )
      .catch(() => {
        throw new Error(`${i} 番目の束が描き替わらない (期待 ${期待.join(" / ")})`);
      });

    const rows = await 名札の絵を測る(page);
    // 待った後も、 測った名前がこの束のものと一致することを見る = 待ちが素通りしても捕まえる
    expect(
      rows.map((r) => r.名).sort(),
      `${i} 番目の束で別の名前を測っている`,
    ).toEqual([...期待].sort());

    for (const r of rows) {
      測れた += 1;
      if (r.箱高 !== 72) {
        問題.push(`${r.名}: 名札の高さが 72 でない (${r.箱高})`);
        continue;
      }
      // 0.5 の許容は描画側の丸めのため。 実測のはみ出しは最小でも 3 (`shape-kanban-card`)
      if (r.下 > 0.5) 問題.push(`${r.名} (${r.kind}): 下へ ${r.下}`);
      if (r.左 > 0.5) 問題.push(`${r.名} (${r.kind}): 左へ ${r.左}`);
      if (r.右 > 0.5) 問題.push(`${r.名} (${r.kind}): 右へ ${r.右}`);
    }
  }

  expect(全種別.length, "`shape-` の種別が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  expect(測れた, "名札を 1 つも測れていない (検査が空振りしている)").toBe(全種別.length);
  expect(問題, `絵が箱からはみ出している: ${問題.join(" / ")}`).toEqual([]);
});

test("上だけにはみ出す種別は形を残す (#1067)", async ({ page }) => {
  // 落としすぎの側を捕まえる。 判定を「どの向きでもはみ出したら落とす」 に広げると、
  // 何ともぶつからない 10 種まで `card` になる。 代表 2 種を固定する
  await 記法を開く(
    page,
    `title: "t"
type: sequence

actors:
  - A: shape-wallet
  - B: shape-robot-arm
  - C: shape-cloud

flow:
  - A -> B: "x"
`,
  );

  const rows = await 名札の絵を測る(page);
  const kindOf = (名: string): string | undefined => rows.find((r) => r.名 === 名)?.kind;
  expect(rows.length, "名札を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  // 上へ 12.1 (Solidity の `eoa` の読み替え先)
  expect(kindOf("a-header"), "上だけのはみ出しで落としている").toBe("shape-wallet");
  // 上へ 129。 それでも viewBox の内側に収まる
  expect(kindOf("b-header"), "上だけのはみ出しで落としている").toBe("shape-robot-arm");
  // 完全に収まる 5 種の 1 つ
  expect(kindOf("c-header"), "収まる種別を落としている").toBe("shape-cloud");
});

/**
 * 種別を 1 つ指定して、 その箱の絵のはみ出しを図の座標系で測る (#1067)。
 *
 * `名札の絵を測る` は名札 (`-header`) 全件を返すが、 こちらは id を指定して 1 つだけ見る。
 * 名札に載らない高さを確かめる時は `type: flow` で描くため、 `-header` に当たらない。
 */
async function 箱の絵を測る(
  page: import("@playwright/test").Page,
  nodeId: string,
): Promise<{ kind: string; 箱高: number; 下: number } | null> {
  return await page.evaluate((want) => {
    const svg = document
      .querySelector(".v4-editor-stage")
      ?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    const n = svg?.querySelector<SVGGraphicsElement>(`[data-cdl-node="${want}"]`);
    if (!n) return null;
    const num = (a: string): number => Number.parseFloat(n.getAttribute(a) ?? "");
    const cy = num("data-cdl-cy");
    const h = num("data-cdl-h");
    if (![cy, h].every(Number.isFinite)) return null;
    let b: DOMRect;
    try {
      b = n.getBBox();
    } catch {
      return null;
    }
    const r = (v: number): number => Math.round(v * 10) / 10;
    return {
      kind: n.getAttribute("data-cdl-kind") ?? "",
      箱高: r(h),
      下: r(b.y + b.height - (cy + h / 2)),
    };
  }, nodeId);
}

/**
 * `LABEL_MIN_H` に足した `shape-` 4 種の値を実描画の両側で確かめる (#1067)。
 *
 * 組み立て側の表 (`packages/dragon/src/compile.ts` の `LABEL_MIN_H`) と同じ値を書き写す。
 * 単体側 (`seq-header-kind-fit.test.ts`) は「表の値で載る / 1 低いと落ちる」 を見るが、
 * **表の値そのものが実際の描画と合っているか** は実 render でしか分からない。 単体だけだと
 * 実装と検査が同じ数値を複製するだけになり、 描画側が変わっても両方一緒に通る
 * (Round 1 review の指摘)。
 */
const 絵が収まる高さ = [
  { kind: "shape-person", h: 228 },
  { kind: "shape-server-rack", h: 166 },
  { kind: "shape-website", h: 98 },
  { kind: "shape-warehouse", h: 79 },
] as const;

for (const { kind, h } of 絵が収まる高さ) {
  test(`${kind} は高さ ${h} で絵が箱に収まる (#1067)`, async ({ page }) => {
    // 表を小さくする誤り (はみ出す高さで載せてしまう) をここで捕まえる。
    // この高さなら名札に載るので順序図で測れる
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
    const 実測 = await 箱の絵を測る(page, "b-header");
    expect(実測, "名札 B が測れていない").not.toBeNull();
    expect(実測!.箱高, `名札の高さが ${h} になっていない`).toBeGreaterThanOrEqual(h - 1);
    // **種類が残っていることを先に見る**。 表の値が実際より小さいと名札が `card` に落ち、
    // `card` を測って「収まっている」 が自明に通る (実測 = 228 を 200 にする変異が通り抜けた)
    expect(実測!.kind, `名札が ${実測!.kind} に落ちている (表の値が実際より小さい)`).toBe(kind);
    expect(実測!.下, `絵が箱の下端を ${実測!.下} はみ出す`).toBeLessThanOrEqual(0.5);
  });

  test(`${kind} は高さ ${h - 2} だと絵が箱をはみ出す (#1067)`, async ({ page }) => {
    // 表を大きくする誤り (収まるのに落とす) を捕まえる。 この高さの名札は `card` に落ちて
    // 測れないので、 名札を持たない `type: flow` で同じ種類を同じ高さに描く
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
    const 実測 = await 箱の絵を測る(page, "a");
    expect(実測, "箱 A が測れていない").not.toBeNull();
    expect(実測!.箱高, `箱の高さが ${h - 2} になっていない`).toBeLessThanOrEqual(h);
    expect(実測!.下, "表の値より 2 低いのに絵が収まっている (表が過大)").toBeGreaterThan(0);
  });
}
