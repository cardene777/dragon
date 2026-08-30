/**
 * 箱の上下の余白が揃っていることを画面で測る (#1496)。
 *
 * ## なぜ画面で測るか
 *
 * 箱の高さを決めるのは cdl 側 (`layout/tokens.ts` と `autoStorageHeight`) で、この repo に
 * 同じ値は無い。 こちらが持つ `golden` は「その値である」 ことしか言わないので、
 * **次に cdl が高さを変えた時に「揃っているか」 を誰も見ていない**。
 *
 * 字は箱の上から描かれるため、箱を高くしたぶんがそのまま下の空きになる。 実測で
 * `service` は上 15.7 に対し下が 81、`merkle-tree` は下が 121 空いていた (cdl 0.18.1)。
 *
 * ## 対象の決め方
 *
 * 種別の一覧を手で持たない。 `NODE_KINDS` から 2 段で絞る。
 *
 * | 落とすもの | 判定 | 理由 |
 * |---|---|---|
 * | 絵だけを描く 49 種別 | 名前が `shape-` で始まる | 箱いっぱいに絵を描くので余白の話にならない |
 * | 図を丸ごと描く種別 | 画面に `node-label` が出ない | 描くのは中身側の字で、箱の題を使わない |
 * | 絵が枠を越える種別 | 絵の高さが箱より大きい | `cloud` / `decision`。 箱と絵がずれているので箱の余白では測れない |
 *
 * 3 つとも **描いた結果から引く**。 種別を書き並べる形にすると、cdl が種別を足した時に
 * 一覧の更新を忘れた側が無防備なまま緑になる。
 *
 * 3 つ目は「余白が揃っているか」 とは別の性質なので、**揃うように直しても対象から外れない**
 * (絵の大きさは余白を直しても変わらない)。
 */
import { test, expect } from "@playwright/test";
import { NODE_KINDS } from "@cardenelabs/cdl";
import { 記法をURLに載せる } from "./box-and-edge-figure";

/**
 * 上と下の余白の差をどこまで許すか。
 *
 * 字の輪郭の丸めで 1-2 は動く。 実測の最大は `event` の 6.1 (名前 + 説明) で、この種別だけ
 * 説明の段が箱の下端から 28 の位置に置かれ、上の余白 21 と 7 ずれる。 守りたいのは
 * 「下だけ 50-100 空く」 形なので、7 まで許して数え漏らす分は無い。
 */
const 許す差 = 7;

type 実測 = {
  kind: string;
  h: number;
  上: number;
  下: number;
  絵: number;
  名前を中央に置く: boolean;
  字: number;
};

/**
 * 1 枚に並べた箱を全部測る。
 *
 * **落ち着いてから測る**。 箱は `scale` で出てくるので、途中で測ると箱だけが小さく読める
 * (実測で `event` が 156 の箱を 135 と返し、絵が 4 はみ出して見えた)。
 */
async function 余白を測る(page: import("@playwright/test").Page): Promise<実測[]> {
  return await page.evaluate(() => {
    const out: 実測[] = [];
    for (const n of document.querySelectorAll("svg [data-cdl-node]")) {
      const body = n.querySelector("[data-cdl-role='node-body']");
      const kind = n.getAttribute("data-cdl-kind");
      if (!body || !kind) continue;
      const 名札 = n.querySelector("[data-cdl-role='node-label']");
      if (!名札) continue;
      const svg = body.closest("svg");
      if (!svg) continue;
      const 縮尺 = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      if (!(縮尺 > 0)) continue;
      const B = body.getBoundingClientRect();
      if (B.height < 1) continue;

      let 字上 = Infinity;
      let 字下 = -Infinity;
      for (const t of n.querySelectorAll("text")) {
        const r = t.getBoundingClientRect();
        if (r.height < 1) continue;
        字上 = Math.min(字上, r.top);
        字下 = Math.max(字下, r.bottom);
      }
      if (!Number.isFinite(字上)) continue;

      let 絵上 = Infinity;
      let 絵下 = -Infinity;
      for (const el of n.querySelectorAll("path, circle, ellipse, polygon, polyline, image, rect")) {
        if (el === body) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 0.5 && r.height < 0.5) continue;
        絵上 = Math.min(絵上, r.top);
        絵下 = Math.max(絵下, r.bottom);
      }

      const 世界 = (v: number) => Math.round((v / 縮尺) * 10) / 10;
      out.push({
        kind,
        // 低い箱では名前を箱の真ん中に置く (`compact-title.ts`)。 その形は **字形** を
        // 中央に合わせるので、行の箱で測ると下へ寄って見える (実測で 12 の差)。
        // 揃え方が違うので、同じ物差しで測る対象から外す
        名前を中央に置く: 名札.getAttribute("text-anchor") === "middle",
        h: 世界(B.height),
        上: 世界(字上 - B.top),
        下: 世界(B.bottom - 字下),
        絵: Number.isFinite(絵上) ? 世界(絵下 - 絵上) : 0,
        字: 世界(字下 - 字上),
      });
    }
    return out;
  });
}

/**
 * 書き方の 4 通り (#1498)。
 *
 * cdl 0.20.0 から高さは **書いた段の数** で決まるので、1 通りだけ測ると変わった側を
 * 1 度も見ないまま緑になる。
 */
const 書き方 = [
  { 名: "名前だけ", 項目: "" },
  { 名: "小見出し + 名前", 項目: `, eyebrow: "小見出し"` },
  { 名: "名前 + 説明", 項目: `, subtitle: "説明の行"` },
  { 名: "3 段", 項目: `, eyebrow: "小見出し", subtitle: "説明の行"` },
] as const;

for (const 形 of 書き方) {
  test(`${形.名}の箱で上と下の余白が揃っている (#1496 / #1498)`, async ({ page }) => {
    test.setTimeout(240_000);

    const 候補 = (NODE_KINDS as readonly string[]).filter((k) => !k.startsWith("shape-"));
    expect(候補.length, "`shape-` でない種別が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);

    const 測れた: 実測[] = [];

    // 1 種別 1 枚だと立ち上げ時間が種別の数だけかかる。 束ねて 1 枚に並べる。
    //
    // 束の最後に相手役を 1 つ足す。 足さないと束が 1 本になった時に `flow` の相手が居らず、
    // 記法側が箱を自動で作って測る数がずれる。
    //
    // **相手役にも同じ字を書く**。 書き方ごとに高さが変わるので、中身を揃えないと
    // その差を「揃っていない」 と読んでしまう。
    const 束 = 6;
    for (let i = 0; i < 候補.length; i += 束) {
      const group = 候補.slice(i, i + 束);
      const actors = group.map((k, j) => `  - A${i + j}: { kind: ${k}${形.項目} }`).join("\n");
      const flow = group.map((_, j) => `  - A${i + j} -> 相手: ""`).join("\n");
      const 相手 = `  - 相手: { kind: card${形.項目} }`;
      // 束ごとに読み込み直す。 `#` だけが変わる移動は同じ画面のままになり、
      // **2 束目以降が 1 束目の図を測る** (実測で全束が 1 束目の `actor` を返した)
      await page.goto("about:blank");
      await page.goto(
        `editor#s=${記法をURLに載せる(`title: "余白"\ntype: flow\n\nactors:\n${actors}\n${相手}\n\nflow:\n${flow}\n`)}`,
      );
      await page.waitForLoadState("networkidle");
      // 箱の出現 (`scale`) が 1 に落ち着くまで待つ。 2.6 秒で全種別が落ち着くことを実測した
      await page.waitForTimeout(2600);
      測れた.push(...(await 余白を測る(page)));
    }

    // 絵が枠を越える種別は箱の余白で測れない (絵と箱がずれている)
    const 絵が越える = 測れた.filter((x) => x.絵 > x.h + 2).map((x) => x.kind);
    const 中央寄せ = 測れた.filter((x) => x.絵 <= x.h + 2 && x.名前を中央に置く).map((x) => x.kind);
    const 対象 = 測れた.filter((x) => x.絵 <= x.h + 2 && !x.名前を中央に置く);

    const 内訳 =
      `候補 ${候補.length} / 字を持つ ${測れた.length} / 測った ${対象.length}` +
      ` / 絵が枠を越える ${絵が越える.length} (${絵が越える.join(", ") || "なし"})` +
      ` / 名前を中央に置く ${中央寄せ.length} (${中央寄せ.join(", ") || "なし"})`;
    expect(対象.length, `測る箱が 1 つも無い (検査が空振りしている)。 ${内訳}`).toBeGreaterThan(0);

    const 偏り = 対象
      .filter((x) => Math.abs(x.上 - x.下) > 許す差)
      .map((x) => `${x.kind}(高さ ${x.h} / 上 ${x.上} / 下 ${x.下})`);
    expect(偏り, `上と下の余白が ${許す差} より離れている。 ${内訳}`).toEqual([]);
  });
}

/**
 * 伸びた箱でも上下の余白が揃う (#1516)。
 *
 * 段の高さは行内の最大値で決まるので、行に高い箱が 1 つあると同じ行の箱も伸びる。
 * 字は上から置かれるため、伸びたぶんが下に空く形が起きうる (実測 = cdl 0.21.x で
 * 240 の箱に 67 ぶんの字が上端に貼り付いていた)。
 *
 * **上の検査では出ない形**。 あちらは 1 種別ずつ同じ中身で測るので、箱が伸びない。
 * 中身の量が違う箱を同じ段に並べて初めて出る。
 */
test("伸びた箱でも上と下の余白が揃っている (#1516)", async ({ page }) => {
  test.setTimeout(120_000);

  // `direction: 横` は 1 人ずつ縦列を作るので、3 箱が同じ段に並ぶ。
  // 3 段を書いた箱が段の高さを決め、名前だけの 2 箱が伸びる
  const 記法 = `title: "伸びた箱"
type: flow
direction: 横

actors:
  - A: { kind: card, eyebrow: "小見出し", subtitle: "説明の行" }
  - B: { kind: card }
  - C: { kind: actor }

flow:
  - A -> B: ""
  - B -> C: ""
`;
  await page.goto("about:blank");
  await page.goto(`editor#s=${記法をURLに載せる(記法)}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2600);

  const 測れた = await 余白を測る(page);
  expect(測れた.length, "箱を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(1);

  // **伸びていることを先に確かめる**。 高さが揃った図を渡すと、この検査は何も見ない
  const 高さ = [...new Set(測れた.map((x) => x.h))];
  expect(高さ.length, `箱が 1 つも伸びていない (高さ ${高さ.join(" / ")})`).toBe(1);
  const 中身の量 = new Set(測れた.map((x) => x.字));
  expect(中身の量.size, "中身の量が同じ箱しか無い (伸びる形になっていない)").toBeGreaterThan(1);

  const 偏り = 測れた
    .filter((x) => Math.abs(x.上 - x.下) > 許す差)
    .map((x) => `${x.kind}(高さ ${x.h} / 上 ${x.上} / 下 ${x.下})`);
  expect(偏り, `伸びた箱で上と下の余白が ${許す差} より離れている`).toEqual([]);
});
