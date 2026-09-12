/**
 * 記法の型が約束した図が実際に描かれることの検証 (#1076)。
 *
 * `type: pie` と書いても円が描かれず、480x120 の箱が縦に並ぶだけだった。
 * 割合 (`"45%"`) は箱の説明文として置かれ、枠の下端に重なって切れていた。
 *
 * 描画側には `chart-pie` の実装があり、`/catalog/presets` の「円グラフ」 では円が出ていた。
 * **記法経由の compile だけが円を使っていなかった**。
 *
 * ## 組み立て結果ではなく画面を見る
 *
 * 「`chart-pie` の node を作った」 までは単体 test が見る (`packages/dragon/test/`)。
 * 本 file は **画面に扇が描かれたか** を見る。 node の種類が正しくても、描画側が扇を出さなければ
 * 見る人にとっては直っていない。
 */
import { test, expect } from "@playwright/test";

async function openSample(page: import("@playwright/test").Page, slug: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`editor#preset=${slug}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

test("見本「言語シェア」 で円が描かれる (#1076)", async ({ page }) => {
  await openSample(page, "pie");

  const m = await page.evaluate(() => {
    const g = document.querySelector('[data-cdl-kind="chart-pie"]');
    if (!g) return null;
    /*
     * **扇だけを数える** (#1479)。
     *
     * 元は箱の中の `path` を全部数えていた。 描画側が名札への引出線を足したため、
     * 同じ 4 項目の図で `path` が 8 本になり「扇の数が違う」 で落ちていた
     * (実測 = 扇 4 + 引出線 4)。 数えたいのは扇なので、役割で絞る。
     */
    const 扇 = [...g.querySelectorAll('[data-cdl-role="chart-pie-slice"]')].map((p) => {
      const r = p.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), d: (p.getAttribute("d") ?? "").slice(0, 8) };
    });
    return {
      扇,
      文字: [...g.querySelectorAll("text")].map((t) => (t.textContent ?? "").trim()),
    };
  });

  expect(m, "円を描く箱が画面に無い").not.toBeNull();
  // 4 項目 = 扇 4 枚。 数を見ないと、 1 枚だけ描いて残りが消えても通る
  expect(m!.扇.length, `扇の数が違う: ${JSON.stringify(m!.扇)}`).toBe(4);
  // 大きさを見ないと、 `d` が空の path が 4 つあるだけでも通る
  for (const s of m!.扇) {
    expect(s.w, `扇が潰れている (${JSON.stringify(s)})`).toBeGreaterThan(20);
    expect(s.h, `扇が潰れている (${JSON.stringify(s)})`).toBeGreaterThan(20);
  }
  // 割合が画面に出る (箱の説明文ではなく凡例として)。
  // **小数点以下は書かない** (#1479)。 描画側が `45.0%` から `45%` に変えたので実物に合わせる。
  // 割り切れない値まで整数に丸める形なら別の見本 (合計 3 等分) で落ちるが、この見本は
  // 4 項目とも整数なので、ここで見るのは「割合が凡例に出ているか」 に留まる
  expect(m!.文字.join(" "), "割合が出ていない").toContain("45%");
  expect(m!.文字.join(" "), "項目名が出ていない").toContain("TypeScript");
});

test("見本「スプリントロードマップ」 で帯と目盛りが描かれる (#1077)", async ({ page }) => {
  // 変更前は帯も目盛りも無く、 小さな箱が階段状に 4 つ散らばっていた
  await openSample(page, "gantt");

  const m = await page.evaluate(() => {
    const g = document.querySelector('[data-cdl-kind="gantt-timeline"]');
    if (!g) return null;
    const box = g.getBoundingClientRect();
    // 帯 = 図の幅の 1 割から 6 割に収まる矩形。 枠や背景 (ほぼ全幅) と区別する
    const 帯 = [...g.querySelectorAll("rect")]
      .map((r) => r.getBoundingClientRect())
      .filter((r) => r.width > box.width * 0.05 && r.width < box.width * 0.6 && r.height > 4)
      .map((r) => ({ w: Math.round(r.width), x: Math.round(r.x) }));
    const 文字 = [...g.querySelectorAll("text")];
    return {
      帯,
      文言: 文字.map((t) => (t.textContent ?? "").trim()),
      最小文字高: Math.min(...文字.map((t) => Math.round(t.getBoundingClientRect().height))),
    };
  });

  expect(m, "帯を描く箱が画面に無い").not.toBeNull();
  // 4 タスク = 帯 4 本。 数を見ないと、 1 本だけ描いて残りが消えても通る
  expect(m!.帯.length, `帯の数が違う: ${JSON.stringify(m!.帯)}`).toBe(4);
  // 時期がずれていれば x も動く = 4 本が同じ位置に重なっていないことを見る
  expect(new Set(m!.帯.map((b) => b.x)).size, "帯が同じ位置に重なっている").toBe(4);
  // 目盛りとタスク名が出る
  for (const 語 of ["Q1", "Q4", "設計", "リリース"]) {
    expect(m!.文言.join(" "), `${語} が出ていない`).toContain(語);
  }
  // 変更前は幅 1400 の帯を敷いていたため、 画面に合わせると文字が読めない大きさになっていた
  expect(m!.最小文字高, "文字が小さすぎる").toBeGreaterThanOrEqual(8);
});

test("タスクが多いガントでも帯が箱に収まる (#1077)", async ({ page }) => {
  // 高さを 360 で固定していると、 8 件目から最後の帯が枠の外に出る (Round 1 review の指摘)。
  // 件数から高さを決めていることを、 実際に 8 件描いて確かめる
  const src = [
    `title: "多いガント"`,
    `type: gantt`,
    ``,
    `actors:`,
    ...Array.from({ length: 8 }, (_, i) => `  - タスク${i + 1}: "Q${i + 1}"`),
    ``,
    // 段が 1 つも無い図は描画側の検査で弾かれるため、 最小の 1 段を置く
    `animation:`,
    `  - step: "全体" 1.0s`,
    `    focus: [タスク1]`,
  ].join("\n");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`editor#s=${Buffer.from(src, "utf8").toString("base64")}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const m = await page.evaluate(() => {
    const g = document.querySelector('[data-cdl-kind="gantt-timeline"]');
    if (!g) return null;
    const body = g.querySelector("[data-cdl-role='node-body']") ?? g;
    const b = body.getBoundingClientRect();
    const 帯 = [...g.querySelectorAll("rect")]
      .map((r) => r.getBoundingClientRect())
      .filter((r) => r.width > b.width * 0.02 && r.width < b.width * 0.6 && r.height > 4);
    return {
      本数: 帯.length,
      はみ出し: 帯
        .map((r) => Math.round(Math.max(r.bottom - b.bottom, b.top - r.top)))
        .filter((v) => v > 1),
    };
  });

  expect(m, "帯を描く箱が画面に無い").not.toBeNull();
  expect(m!.本数, "帯が 8 本描かれていない").toBe(8);
  expect(m!.はみ出し, `帯が箱の外に出ている: ${m!.はみ出し.join(", ")}`).toEqual([]);
});

test("見本「C4コンテキスト」 で空の枠が残らない (#1078)", async ({ page }) => {
  // 変更前は L1 / L2 / L3 の枠を必ず作り、 段の振り分けが完全一致だったため全員が L1 に落ち、
  // 右上に中身のない点線枠が 2 つ残っていた
  await openSample(page, "c4");

  const m = await page.evaluate(() => {
    // 枠は `data-cdl-lane-w` を併せ持つ要素。 箱 (`data-cdl-node`) も所属先を `data-cdl-lane` で
    // 持つので、 それだけで探すと箱まで「枠」 として数えてしまう
    const lanes = [...document.querySelectorAll("[data-cdl-lane][data-cdl-lane-w]")];
    const 箱の所属 = [...document.querySelectorAll("[data-cdl-node]")].map((n) =>
      n.getAttribute("data-cdl-lane"),
    );
    return lanes.map((l) => {
      const id = l.getAttribute("data-cdl-lane");
      return { id, 箱: 箱の所属.filter((x) => x === id).length };
    });
  });

  expect(m.length, "枠が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  const 空枠 = m.filter((l) => l.箱 === 0);
  expect(空枠, `中身のない枠が残っている: ${空枠.map((l) => l.id).join(", ")}`).toEqual([]);
  // 見本は L1 に 2 件 (利用者 / システム) と L2 に 2 件 (API / DB)
  expect(m.map((l) => l.id).sort(), "段の振り分けが効いていない").toEqual(["c4-l1", "c4-l2"]);
});

test("見本「言語シェア」 で文字が箱からはみ出さない (#1076)", async ({ page }) => {
  // 変更前は `45%` が card の説明文として枠の下端に重なっていた。
  //
  // **`data-cdl-role='node-label'` を探しては測れない**。 円グラフの凡例は role を持たない
  // 素の `text` で、 探しても 0 件になり「はみ出しは 0 件」 として通る (Round 1 review の指摘)。
  // 円の箱の下にある `text` を直接列挙し、 測った件数も併せて見る
  await openSample(page, "pie");
  const m = await page.evaluate(() => {
    const chart = document.querySelector('[data-cdl-kind="chart-pie"]');
    if (!chart) return null;
    const body = chart.querySelector("[data-cdl-role='node-body']") ?? chart;
    const b = body.getBoundingClientRect();
    const 溢れ: string[] = [];
    let 測った = 0;
    for (const t of chart.querySelectorAll("text")) {
      const r = t.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      測った++;
      const 下 = Math.round(r.bottom - b.bottom);
      const 上 = Math.round(b.top - r.top);
      const 右 = Math.round(r.right - b.right);
      const 左 = Math.round(b.left - r.left);
      if (下 > 1 || 上 > 1 || 右 > 1 || 左 > 1) {
        溢れ.push(`${(t.textContent ?? "").trim()}(下 ${下} / 上 ${上} / 右 ${右} / 左 ${左})`);
      }
    }
    return { 溢れ, 測った };
  });

  expect(m, "円を描く箱が画面に無い").not.toBeNull();
  // 8 = 項目名 4 + 割合 4。 件数を見ないと、 文字が 1 つも取れていない状態で通る
  expect(m!.測った, "凡例の文字を 1 つも測れていない").toBeGreaterThanOrEqual(8);
  expect(m!.溢れ, `文字が箱からはみ出している: ${m!.溢れ.join(", ")}`).toEqual([]);
});

test("見本「C4コンテキストモデル」 の箱に段の目印が出ない (#1098)", async ({ page }) => {
  // 変更前は 4 箱すべてが `L1` / `L1: system` / `L2: container` を説明として出していた。
  // 目印は組み立てに段を伝えるためのもので、 段の名前は枠のラベルが既に出している
  await openSample(page, "c4");

  const m = await page.evaluate(() => {
    const svg = document.querySelector('.v4-editor-preview svg[data-cdl-stage]');
    if (!svg) return null;
    return {
      説明: [...svg.querySelectorAll("[data-cdl-node]")].map((n) => ({
        題: n.getAttribute("data-cdl-title") ?? "",
        説明: n.getAttribute("data-cdl-subtitle") ?? "",
      })),
      枠のラベル: [...svg.querySelectorAll("text")]
        .map((t) => (t.textContent ?? "").trim())
        .filter((s) => /System Context|Container|Component/.test(s)),
    };
  });

  expect(m, "図が画面に無い").not.toBeNull();
  expect(m!.説明.length, "箱が 1 つも無い (検査が空振りしている)").toBe(4);

  // 目印が説明として残っていないこと
  const 目印が残る = m!.説明.filter((x) => /^L[123]\b/i.test(x.説明));
  expect(目印が残る, `箱の説明に段の目印が出ている: ${目印が残る.map((x) => `${x.題}="${x.説明}"`).join(", ")}`).toEqual([]);

  // 説明が空になっていないこと (落としすぎていないか)
  const 説明なし = m!.説明.filter((x) => x.説明 === "");
  expect(説明なし, `説明が消えた箱がある: ${説明なし.map((x) => x.題).join(", ")}`).toEqual([]);

  // 段の名前は枠のラベルが出す (箱の説明と二重にしない)
  expect(m!.枠のラベル.sort(), "枠のラベルが出ていない").toEqual(["Container", "System Context"]);
});
