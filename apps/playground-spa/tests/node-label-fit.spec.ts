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
 * 2. 種類を明示した名札 = `actor` / `function` / `storage` / `event` を書いても、 名前が箱に
 *    収まり **書いたとおりの種類のまま載る** (`#1066`)。 `#1061` はこの 4 種を `card` に落として
 *    いたが、 描画側 (`cardene777/cdl#416`) が小さい箱で名前を中央に置くようになったため
 *    落とす理由が無くなった。 落とすと種類ごとの枠線の色と動きが失われる
 * 3. 高さで落とす判定が残る `shape-` 4 種について、 表 (`LABEL_MIN_H`) が実際の描画と
 *    合っているか = **両側** を実 render で測る。 「その高さなら収まる」 だけだと表を小さくする
 *    誤り (はみ出す高さで載せる) が通り抜け、 「低いとはみ出す」 だけだと表を大きくする誤り
 *    (収まるのに落とす) が通り抜ける
 *
 * ## `shape-` は別の測り方をする (#1067)
 *
 * これらは名前を箱ではなく自分の絵に対して置くため、 名前だけを測る上の 3 つでは捕まらない。
 * 実際に壊れていたのは **絵そのものが箱の外に出る** ことで、 縦線が絵を貫き隣の本ともぶつかって
 * いた。 名札 group の外接矩形を箱と比べる検査を別に置く。
 */
import { test, expect } from "@playwright/test";
import { NODE_KINDS } from "@cardenelabs/cdl";

/**
 * 名札に書ける種類。 `#1066` まではこの 4 種が「名札に載せると名前がはみ出す」 側だった。
 *
 * `cardene777/cdl#416` が小型用の配置 (箱が低い時は名前を中央に置く) を足したので、 名札の
 * 高さ (72) のままで収まる。 組み立て側が `card` に落とす必要も無くなった。
 */
const 名札に書ける種類 = ["actor", "function", "storage", "event"] as const;

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

for (const kind of 名札に書ける種類) {
  test(`${kind} は名札の高さでも名前が箱に収まる`, async ({ page }) => {
    // `#1066` まではここで名前が箱の下端をまたぎ、 組み立て側が `card` に落としていた。
    // `cardene777/cdl#416` の小型用の配置で収まるようになった。
    await 記法を開く(
      page,
      `title: "t"
type: sequence

actors:
  - A
  - B:
      kind: ${kind}

flow:
  - A -> B: "x"
`,
    );
    const 実測 = await 名札を測る(page, "B");
    expect(実測, "名札 B が測れていない").not.toBeNull();
    expect(実測!.箱高, "名札の高さが 72 になっていない").toBeLessThanOrEqual(80);
    expect(実測!.下, `名前が箱の下端を ${実測!.下} はみ出す`).toBeLessThanOrEqual(1);
  });

  test(`${kind} は名札で書いたとおりの種類のまま載る`, async ({ page }) => {
    // **これが `#1066` の目的**。 `card` に落とすと種類ごとの枠線の色と動きが失われる。
    await 記法を開く(
      page,
      `title: "t"
type: sequence

actors:
  - A
  - B:
      kind: ${kind}

flow:
  - A -> B: "x"
`,
    );
    const 実際 = await page.evaluate(() => {
      const g = document.querySelector("svg [data-cdl-node$='-header'][data-cdl-kind]");
      const 名 = g?.querySelector("[data-cdl-role='node-label']");
      // 名札は lane ごとに 1 つ。 B の名札を名前で選ぶ
      for (const n of document.querySelectorAll("svg [data-cdl-node][data-cdl-kind]")) {
        const t = n.querySelector("[data-cdl-role='node-label']");
        if ((t?.textContent ?? "").trim() === "B") return n.getAttribute("data-cdl-kind");
      }
      void g;
      void 名;
      return null;
    });
    expect(実際, `名札 B の種類が読めていない`).not.toBeNull();
    expect(実際, `名札 B が ${kind} でなく ${実際} で載っている (card に落ちた)`).toBe(kind);
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

test("上だけにはみ出す種別は形を残す (#1067 / #1106)", async ({ page }) => {
  // 落としすぎの側を捕まえる。 判定を「どの向きでもはみ出したら落とす」 に広げると、
  // 何ともぶつからない 9 種まで `card` になる。
  //
  // `shape-wallet` はここに居ない。 上へ 12.1 だけだが絵が潰れて名前と重なるため、 `#1106` で
  // 落とす側へ移した (user 実機確認)。 上のはみ出し量ではなく **名前が読めるか** で分かれる
  await 記法を開く(
    page,
    `title: "t"
type: sequence

actors:
  - A: shape-robot-arm
  - B: shape-iot-sensor
  - C: shape-cloud

flow:
  - A -> B: "x"
`,
  );

  const rows = await 名札の絵を測る(page);
  const kindOf = (名: string): string | undefined => rows.find((r) => r.名 === 名)?.kind;
  expect(rows.length, "名札を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  // 上へ 129。 それでも viewBox の内側に収まる
  expect(kindOf("a-header"), "上だけのはみ出しで落としている").toBe("shape-robot-arm");
  // 上へ 48
  expect(kindOf("b-header"), "上だけのはみ出しで落としている").toBe("shape-iot-sensor");
  // 完全に収まる 5 種の 1 つ
  expect(kindOf("c-header"), "収まる種別を落としている").toBe("shape-cloud");
});

test("shape-wallet は名札で card に落ちる (#1106)", async ({ page }) => {
  // 上へ 12.1 しか出ないが、 絵が潰れて名前と重なるため落とす。 落とす基準が「はみ出し量」
  // ではなく「名前が読めるか」 であることを固定する
  await 記法を開く(
    page,
    `title: "t"
type: sequence

actors:
  - EOA: eoa
  - Wallet: wallet
  - Robot: shape-robot-arm

flow:
  - EOA -> Wallet: "x"
`,
  );

  const rows = await 名札の絵を測る(page);
  const kindOf = (名: string): string | undefined => rows.find((r) => r.名 === 名)?.kind;
  expect(rows.length, "名札を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  expect(kindOf("eoa-header"), "eoa が落ちていない").toBe("card");
  expect(kindOf("wallet-header"), "wallet が落ちていない").toBe("card");
  // 同じ「上だけ」 の種別でも残すものがあることを一緒に見る = 全部落とす変異を捕まえる
  expect(kindOf("robot-header"), "残す種別まで落ちている").toBe("shape-robot-arm");
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

  // **いま落ちる**。 描画側 (`cardene777/cdl#433` / `#446`) が絵をどの高さでも箱に収めるように
  // なったため、 表の値より 2 低くしてもはみ出さなくなった。 検査が壊れているのではなく、
  // **表が過大になったことを正しく報告している**。
  //
  // 通すために期待値を書き換えるのは筋が違う (直っていないものを直ったことにする逆をやる形に
  // なる)。 直すなら `LABEL_MIN_H` と `LABEL_NEVER_FITS` による落とし方そのものを畳む話で、
  // 35 種の挙動と goldens が動く。 `#1149` に分けた。
  test.fixme(`${kind} は高さ ${h - 2} だと絵が箱をはみ出す (#1067)`, async ({ page }) => {
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

/**
 * 文字を書いた名札で `shape-` 49 種を測る (#1105)。
 *
 * ## 上の検査では覆えていなかった
 *
 * 上の `#1067` の検査は **文字を書かない形** で測っている。 その形では絵がはみ出す 35 種が
 * `card` に落ちるため、 実際に測っているのは `card` の外接矩形で、 `shape-` の絵は 14 種しか
 * 通っていない。 落ちた 35 種は「収まっている」 のではなく「絵が消えている」。
 *
 * `#1061` の規約で **著者が文字を書いた名札は落とさない** (落とすと書いた文字が画面から消える)。
 * そのため文字を書いた形では 49 種すべてが `shape-` のまま載り、 絵がそのまま箱と比べられる。
 * `#1105` が問題にしていたのはこちらで、 実測で下へ 34 / 右へ 15.1 出ていた。
 *
 * ## 種類が残っていることを先に見る
 *
 * 落ちていないことを確かめずに寸法だけ見ると、 判定を「文字を書いても落とす」 に変える誤りが
 * **検査を通り抜ける** = 全部 `card` になって自明に収まる。 上の `#1067` の検査で同じ穴を
 * 踏んでいる (`shape-person` の表の値を小さくする変異が通り抜けた)。
 *
 * ## 枠線は測れない (#434)
 *
 * `getBBox` は既定では幾何だけを返し枠線を数えない。 SVG 2 は `getBBox({ stroke: true })` を
 * 「枠線を含めた外接矩形」 として定めているが、 **この検査が使う Chromium は option を反映
 * しない** (実測 = `r=10` / `stroke-width=4` の円で `getBoundingClientRect` /
 * `getBBox()` / `getBBox({ stroke: true })` の 3 つとも 20、 墨なら 24)。
 *
 * API が存在しないのではなく、 いま動かしているブラウザが返さない。 Chromium が反映するように
 * なったら、 ここは `getBBox({ stroke: true })` に寄せられる。
 *
 * 描画側で属性から組み立てて測ったところ、 `shape-iot-sensor` は幅 140 の箱で左右へ **0.75**
 * 出る (波紋の半径 70 が幾何としてはちょうど収まり、 枠線 1.5 の半分が外に残る)。 本検査は
 * これを 0 と判定する。 **墨の検査は描画側 (`cardene777/cdl`) の責務** で、 そちらは属性から
 * 組み立てた外接矩形で枠線まで数えている。 ここで同じものを組み立てると同じ計算が 2 repo に
 * 残る。 値は `cardene777/cdl#434` に送り済。
 */
const 文字を書く形 = [
  { 名: "subtitle", 書き: (i: number): string => `subtitle: "説明${i}"`, 文字: (i: number): string => `説明${i}` },
  { 名: "eyebrow", 書き: (i: number): string => `eyebrow: "目印${i}"`, 文字: (i: number): string => `目印${i}` },
] as const;

for (const 形 of 文字を書く形) {
  test(`${形.名} を書いた名札でも \`shape-\` の絵が箱の下と左右にはみ出さない (#1105)`, async ({ page }) => {
    test.setTimeout(240_000);

    const 全種別 = (NODE_KINDS as readonly string[]).filter((k) => k.startsWith("shape-"));
    const 問題: string[] = [];
    let 測れた = 0;

    // 束の理由と待ち方は上の `#1067` の検査と同じ。 **文字は 1 本ごとに変える** = 同じ文字だと
    // 前の束が残っていても中身が一致するため、 描き替わりの取り違えに気付けない
    const 束 = 7;
    for (let i = 0; i < 全種別.length; i += 束) {
      const group = 全種別.slice(i, i + 束);
      // 項目を並べて書けるのは `{ }` の形だけ。 段下げの形は `eyebrow` を項目名として読まない
      // (実測 = `L7: 項目名が読めません: "eyebrow"`)
      const actors = group
        .map((k, j) => `  - A${i + j}: { kind: ${k}, ${形.書き(i + j)} }`)
        .join("\n");
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
      expect(rows.map((r) => r.名).sort(), `${i} 番目の束で別の名前を測っている`).toEqual(
        [...期待].sort(),
      );

      for (const r of rows) {
        測れた += 1;
        const 求める = group[Number(r.名.replace(/^a(\d+)-header$/, "$1")) - i];
        // **落ちていないことを先に見る**。 `card` を測ると収まりが自明に通る
        if (r.kind !== 求める) {
          問題.push(`${r.名}: ${求める} が ${r.kind} に落ちた (文字を書いた名札は落とさない)`);
          continue;
        }
        if (r.箱高 !== 72) {
          問題.push(`${r.名}: 名札の高さが 72 でない (${r.箱高})`);
          continue;
        }
        // 0.5 の許容は描画側の丸めのため。 `#1105` の実測は下 34 / 右 15.1
        if (r.下 > 0.5) 問題.push(`${r.名} (${r.kind}): 下へ ${r.下}`);
        if (r.左 > 0.5) 問題.push(`${r.名} (${r.kind}): 左へ ${r.左}`);
        if (r.右 > 0.5) 問題.push(`${r.名} (${r.kind}): 右へ ${r.右}`);
      }
    }

    expect(全種別.length, "`shape-` の種別が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(測れた, "名札を 1 つも測れていない (検査が空振りしている)").toBe(全種別.length);
    expect(問題, `文字を書いた名札で絵が箱からはみ出している: ${問題.join(" / ")}`).toEqual([]);
  });
}

/** 名札 1 つの絵と、 その中に出ている文字をまとめて取る (#1105)。 */
async function 名札の絵と文字を測る(
  page: import("@playwright/test").Page,
  nodeId: string,
): Promise<{ kind: string; 下: number; 左: number; 右: number; 文字: string[] } | null> {
  return await page.evaluate((want) => {
    const svg = document
      .querySelector(".v4-editor-stage")
      ?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    const n = svg?.querySelector<SVGGraphicsElement>(`[data-cdl-node="${want}"]`);
    if (!n) return null;
    const num = (a: string): number => Number.parseFloat(n.getAttribute(a) ?? "");
    const cx = num("data-cdl-cx");
    const cy = num("data-cdl-cy");
    const w = num("data-cdl-w");
    const h = num("data-cdl-h");
    if (![cx, cy, w, h].every(Number.isFinite)) return null;
    let b: DOMRect;
    try {
      b = n.getBBox();
    } catch {
      return null;
    }
    const r = (v: number): number => Math.round(v * 10) / 10;
    return {
      kind: n.getAttribute("data-cdl-kind") ?? "",
      下: r(b.y + b.height - (cy + h / 2)),
      左: r(cx - w / 2 - b.x),
      右: r(b.x + b.width - (cx + w / 2)),
      文字: [...n.querySelectorAll("text")].map((t) => (t.textContent ?? "").trim()),
    };
  }, nodeId);
}

test("Issue の再現手順そのままで絵が収まる (#1105)", async ({ page }) => {
  // `#1105` の本文にある記法をそのまま使う。 実測は下 34 / 右 15.1 だった
  await 記法を開く(
    page,
    `title: "t"
type: sequence

actors:
  - A: { kind: contract, subtitle: "説明" }
  - B

flow:
  - A -> B: "x"
`,
  );

  const 実測 = await 名札の絵と文字を測る(page, "a-header");
  expect(実測, "名札 A が測れていない").not.toBeNull();
  // 落ちていないことを先に見る = `card` なら収まりも文字も自明に通る
  expect(実測!.kind, "名札が card に落ちている (文字を書いた名札は落とさない)").toBe(
    "shape-smart-contract",
  );
  expect(実測!.下, `絵が箱の下端を ${実測!.下} はみ出す`).toBeLessThanOrEqual(0.5);
  expect(実測!.右, `絵が箱の右端を ${実測!.右} はみ出す`).toBeLessThanOrEqual(0.5);
  expect(実測!.左, `絵が箱の左端を ${実測!.左} はみ出す`).toBeLessThanOrEqual(0.5);
  // **収まるだけでは足りない**。 絵を消しても収まりは通るので、名前が出ていることを見る
  expect(実測!.文字, `名前が画面に出ていない (出た文字 ${実測!.文字.join(" / ")})`).toContain("A");
});

/**
 * 小さい `shape-` の箱では、書いた説明が絵の帯に譲られる (#1320)。
 *
 * `#1105` を書いた時点では、上の再現手順で `subtitle` の「説明」 も画面に出ていた。
 * その後 描画側 (`@cardenelabs/cdl`) が **絵に残る帯が下限を割るなら補いの行を落とす** 形に
 * 変えた (cdl#459)。 落とす順は肩書 → 説明で、名前は落とさない。
 *
 * 落ちるのは `shape-` 種別だけで、絵を持たない種別は同じ大きさでも説明を出す。 実測 (140×72)。
 *
 * | 種別 | 出た文字 |
 * |---|---|
 * | `contract` (`shape-smart-contract`) | `function execute()` / `A` |
 * | `service` (絵を持たない) | `A` / `説明` |
 *
 * **「説明が出ない」 だけを見ると、全部の文字が消えても通る**。 絵を持たない種別で同じ
 * 記法が説明を出すことを対にして見る = 落とす判断が種別で分かれていることを固定する。
 *
 * 書いた文字が黙って消えること自体は別の課題として残る。 描画側は落とした行を返す口
 * (`labelPlan` の `落とした`) を持つが、記法側はまだ知らせに繋いでいない。
 */
test("小さい shape- の箱では説明が絵に譲られ、絵を持たない種別では出る (#1320)", async ({ page }) => {
  await 記法を開く(
    page,
    `title: "t"
type: sequence

actors:
  - A: { kind: contract, subtitle: "説明" }
  - B: { kind: service, subtitle: "説明" }

flow:
  - A -> B: "x"
`,
  );

  const 絵あり = await 名札の絵と文字を測る(page, "a-header");
  const 絵なし = await 名札の絵と文字を測る(page, "b-header");
  expect(絵あり, "名札 A が測れていない").not.toBeNull();
  expect(絵なし, "名札 B が測れていない").not.toBeNull();

  // 同じ大きさであることを先に固定する。 大きさが違えば比べても意味が無い
  expect(絵なし!.kind, "B が service で描かれていない").toBe("service");
  expect(絵あり!.kind, "A が shape- で描かれていない").toBe("shape-smart-contract");

  expect(絵なし!.文字, "絵を持たない種別で説明が出ていない").toContain("説明");
  expect(絵あり!.文字, "絵を持つ種別で説明が出ている (帯に譲る形が変わった)").not.toContain("説明");
  // 名前は落とさない = 全部の文字が消えた形をここで弾く
  expect(絵あり!.文字, "絵を持つ種別で名前まで消えている").toContain("A");
});

/**
 * `value` と `rows` の扱いを固定する (#1105)。
 *
 * `#1105` の完了条件は `subtitle` / `eyebrow` / `value` / `rows` の 4 形を並べているが、
 * 描画側の扱いが 2 つに分かれる。
 *
 * | 形 | 名札に残るか | 書いた文字が出るか |
 * |---|---|---|
 * | `subtitle` / `eyebrow` | 残る | 出る (49 種中 45 / 47 種。 残りは絵の中に自前の文字を持つ種別) |
 * | `value` | 残る | **出ない** = `shape-` はどれも `value` を描かない |
 * | `rows` | **落ちる** | 出ない = `shape-` はどれも `rows` を描かない |
 *
 * `rows` が落ちるのは `hasAuthoredText` が `rendersRows(kind)` を条件にしているため。 描かない
 * 種別で `rows` を守っても、 守った先に出す場所が無い。 どちらも `#1105` の前からこうで、
 * 絵のはみ出しとは別の話。 **ここで固定するのは「はみ出さない」 ことと現状の分かれ方** で、
 * 描く / 描かないを変えるかは描画側の判断。
 */
test("value は名札に残り rows は card に落ちる (#1105)", async ({ page }) => {
  await 記法を開く(
    page,
    `title: "t"
type: sequence

actors:
  - A: { kind: contract, value: "42" }
  - B: { kind: contract, rows: ["段"] }

flow:
  - A -> B: "x"
`,
  );

  const v = await 名札の絵と文字を測る(page, "a-header");
  const r = await 名札の絵と文字を測る(page, "b-header");
  expect(v, "名札 A が測れていない").not.toBeNull();
  expect(r, "名札 B が測れていない").not.toBeNull();

  // `value` は著者が書いた文字なので落とさない。 絵は箱に収まる
  expect(v!.kind, "value を書いた名札が落ちている").toBe("shape-smart-contract");
  expect(v!.下, `絵が箱の下端を ${v!.下} はみ出す`).toBeLessThanOrEqual(0.5);
  expect(v!.右, `絵が箱の右端を ${v!.右} はみ出す`).toBeLessThanOrEqual(0.5);

  // `rows` は描かない種別なので落とす側に入る。 落ちた先の `card` も箱に収まる
  expect(r!.kind, "rows を書いた名札が落ちていない (描かない種別は落とす側)").toBe("card");
  expect(r!.下, `絵が箱の下端を ${r!.下} はみ出す`).toBeLessThanOrEqual(0.5);
});
