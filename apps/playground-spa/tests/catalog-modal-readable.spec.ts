/**
 * カタログの拡大表示で、図の中の文字が読める大きさに届いているかを測る (#2284)。
 *
 * ## 拡大表示はどの検査の母数にも入っていなかった
 *
 * `phone-diagram-legibility.spec.ts` は頁を送って図を測るが、**拡大表示は押して開く**ので
 * 送っただけでは出ない。 `catalog-modal-zoom.spec.ts` は倍率の刻みを見る検査で、幅 1440px に
 * 固定されており文字の大きさを見ていない。 結果、携帯の幅で拡大表示を開いた時の文字は
 * 1 度も測られていなかった (実測 = `charts` 4.4px、`styles` 5.64px)。
 *
 * 拡大表示は図を読むために開く場所なので、ここが読めないと読む手段が無くなる。
 *
 * ## 母集団は分類の一覧から作る
 *
 * 分類を手で並べると、分類が増えた日に黙って対象から外れる。 `CATEGORIES` を走査し、
 * 拡大表示のボタンを持たない分類は `図を持たない分類` と突き合わせる = 「押せなかったから
 * 0 件」 を「読めている」 と同じ結果にしない。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-modal-readable`
 */
import { test, expect } from "@playwright/test";

import { CATEGORIES } from "../src/lib/catalog";

type Page = import("@playwright/test").Page;

/** 携帯の幅と高さ。 iPhone 14 の値 */
const 携帯の幅 = 390;
const 携帯の高さ = 844;

/**
 * 画面の上でこれを下回ると読めない (px)。
 *
 * `src/lib/readable-scale.ts` の `READABLE_RELAXED_PX` と同じ値を **書き写す**
 * (`phone-diagram-legibility.spec.ts` と同じ判断 = import すると実装を変えた時に期待値も
 * 一緒に動いて何も落ちなくなる)。
 */
const 下限 = 8;

/**
 * 下限の倍率が目指す大きさ (px)。
 *
 * `src/lib/readable-scale.ts` の `READABLE_MIN_PX` と同じ値を **書き写す** (上の 下限 と同じ判断)。
 * 下限の倍率は `この大きさ / 図の中でいちばん小さい文字` で決まる。
 */
const 目指す大きさ = 10;

/**
 * 植える字の指定と、その親に掛ける縮小 (#2287 の対照で使う)。 実効は 30 × 0.5 = 15。
 *
 * 指定は植え先の図の最小 (24) より **大きく** 採る = 指定を母数にすると 1px も動かない。
 * 実効 15 を母数にすると下限は 10 / 15 = 0.6667 で、実寸 100% の上限には当たらない。
 */
const 植える指定 = 30;
const 植える縮小 = 0.5;

/**
 * 測る文字を持たない分類。 **母集団ではなく期待値**。
 *
 * `parts` は部品の一覧で、拡大表示は開くが中に `<text>` が 1 つも無い
 * (`phone-diagram-legibility.spec.ts` も同じ 1 件だけを図が出ない分類として扱っている)。
 *
 * **「ボタンが無い」 と「文字が無い」 を同じ袋に入れない**。 起きたことが違えば直す先も違う
 * ので、下の判定では 2 つを別々に数え、合わせた集合をこの期待値と突き合わせる。
 */
const 測れない分類 = new Set(["parts"]);

/**
 * いま下限に届かない分類と、その理由。
 *
 * **理由と行き先を必ず書く**。 宣言した分類は「まだ割っていること」 を確かめるので、
 * 直ったらこの検査が落ちて、直した PR が行を外すまで気付ける。
 *
 * **空でも消さない**。 次に割る分類が出た時、宣言の形と決まりをここから引く。
 * `ethereum` は #2562 で外した = 記法の engine が 0.73.0 で縮めた分を字の指定で打ち消す
 * ようになり ([cardene777/cdl#871](https://github.com/cardene777/cdl/issues/871))、
 * `ハッシュ` の実効が 7.55 から 10.5 に戻って下限を割らなくなった。
 */
const 宣言: ReadonlyMap<string, string> = new Map<string, string>();

/** 拡大表示の中の図の、いちばん小さい文字 */
async function 拡大の最小の文字(page: Page): Promise<{ 最小: number; 字: string; 文字数: number }> {
  return page.evaluate(() => {
    const 本体 = document.querySelector(".cdl-modal-body");
    if (!本体) throw new Error("拡大表示が開いていない (検査が空振りしている)");
    let 最小 = Number.POSITIVE_INFINITY;
    let 字 = "";
    let 文字数 = 0;
    for (const t of 本体.querySelectorAll("text")) {
      const 中身 = (t.textContent ?? "").trim();
      if (中身 === "") continue;
      const cs = getComputedStyle(t);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") {
        continue;
      }
      if (Number.parseFloat(cs.opacity) === 0) continue;
      const ctm = t.getScreenCTM?.();
      if (!ctm) continue;
      // 回転や傾きが混ざっても面積の比から 1 つの拡大率を出せる (行列式の平方根)
      const 拡大率 = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
      const 指定 = Number.parseFloat(cs.fontSize);
      if (!Number.isFinite(指定) || 指定 <= 0) continue;
      if (!Number.isFinite(拡大率) || 拡大率 <= 0) continue;
      文字数++;
      const 実寸 = 指定 * 拡大率;
      if (実寸 < 最小) {
        最小 = 実寸;
        字 = 中身.slice(0, 16);
      }
    }
    return { 最小, 字, 文字数 };
  });
}

/**
 * 頁を上から下まで送る。
 *
 * 図は台が見える所に入ってから描かれる (`InViewMount`、#2283)。 送らないと拡大表示の
 * ボタンまで辿り着けない。
 */
async function 頁を送る(page: Page): Promise<void> {
  const 高さ = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < 高さ; y += Math.floor(携帯の高さ * 0.8)) {
    await page.evaluate((v) => globalThis.scrollTo(0, v), y);
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

/**
 * 拡大表示の中の図と、その中でいちばん小さい文字を測る。
 *
 * 図は `.cdl-modal-body` の中で最も広い svg を採る = 読み取り値の輪のような飾りの svg が
 * 同じ器に並ぶため (`useDiagramPanZoom` の `図のsvgを探す` と同じ選び方)。
 *
 * **指定と実効を両方返す**。 下限の母数がどちらかは 2 つの差にしか現れないので、
 * 片方だけを測っても判定できない。
 */
async function 拡大の図を測る(
  page: Page,
): Promise<{ 倍率: number; 指定の最小: number; 実効の最小: number; 字: string }> {
  return page.evaluate(() => {
    const 本体 = document.querySelector(".cdl-modal-body");
    if (!本体) throw new Error("拡大表示が開いていない (検査が空振りしている)");
    let 図: SVGSVGElement | null = null;
    for (const svg of 本体.querySelectorAll<SVGSVGElement>("svg[viewBox]")) {
      if (!図 || svg.getBoundingClientRect().width > 図.getBoundingClientRect().width) 図 = svg;
    }
    if (!図) throw new Error("拡大表示の中に図が無い (検査が空振りしている)");
    const 枠 = 図.getBoundingClientRect();
    const vb横 = Number((図.getAttribute("viewBox") ?? "").split(/[ ,]+/)[2]);
    if (!Number.isFinite(vb横) || vb横 <= 0) throw new Error("図の viewBox を読めない");
    const 根 = 図.getScreenCTM();
    if (!根) throw new Error("図の変換を読めない");
    // 回転や傾きが混ざっても面積の比から 1 つの拡大率を出せる (行列式の平方根)
    const 根の倍率 = Math.sqrt(Math.abs(根.a * 根.d - 根.b * 根.c));
    let 指定の最小 = Number.POSITIVE_INFINITY;
    let 実効の最小 = Number.POSITIVE_INFINITY;
    let 字 = "";
    for (const t of 図.querySelectorAll("text")) {
      const 中身 = (t.textContent ?? "").trim();
      if (中身 === "") continue;
      const cs = getComputedStyle(t);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") {
        continue;
      }
      if (Number.parseFloat(cs.opacity) === 0) continue;
      const ctm = t.getScreenCTM?.();
      const 指定 = Number.parseFloat(cs.fontSize);
      if (!ctm || !Number.isFinite(指定) || 指定 <= 0) continue;
      const 拡大率 = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
      if (!Number.isFinite(拡大率) || 拡大率 <= 0) continue;
      指定の最小 = Math.min(指定の最小, 指定);
      // 表示倍率を混ぜない = 根で割った値は svg の中だけの入れ子の積 (#2287)
      const 実効 = 指定 * (拡大率 / 根の倍率);
      if (実効 < 実効の最小) {
        実効の最小 = 実効;
        字 = 中身.slice(0, 16);
      }
    }
    return { 倍率: 枠.width / vb横, 指定の最小, 実効の最小, 字 };
  });
}

/** 分類の頁を開き、最初の拡大表示を開いて中の図を測る */
async function 拡大を開いて測る(page: Page, slug: string): ReturnType<typeof 拡大の図を測る> {
  await page.goto(`catalog/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await 頁を送る(page);
  await page
    .getByRole("button", { name: /を拡大表示$/ })
    .first()
    .click();
  await expect(page.locator(".cdl-modal-content")).toBeVisible();
  // 実効を測る窓が閉じるまで待つ (`useDiagramPanZoom` は 500ms × 6 回)
  await page.waitForTimeout(4500);
  return 拡大の図を測る(page);
}

/**
 * 拡大表示の図が現れたその場へ、**指定は大きいのに実効は小さい字** を植える。
 *
 * 次に開く頁から効く (`page.addInitScript` は頁の script より先に入る)。
 *
 * **後から植えても効かない**。 実効を測る窓は図が現れた所から 500ms × 6 回で閉じ、
 * 閉じた後の測り直しは指定しか見ない (`useDiagramPanZoom`)。 窓の中の全ての標本に
 * 入っている必要もある = 窓は標本の最大を採るので、途中から植えると植える前の値が勝つ。
 *
 * 観測の相手は `document` にする。 `document.documentElement` は この script が走る時点で
 * まだ無く、`observe` が投げて植え込みごと落ちる (落ちても頁は動くので気付けない)。
 */
async function 植え込みを仕込む(page: Page): Promise<void> {
  await page.addInitScript(
    ({ 指定, 縮小 }: { 指定: number; 縮小: number }) => {
      const 植える = (): void => {
        const 本体 = document.querySelector(".cdl-modal-body");
        if (!本体) return;
        let 図: SVGSVGElement | null = null;
        for (const svg of 本体.querySelectorAll<SVGSVGElement>("svg[viewBox]")) {
          if (!図 || svg.getBoundingClientRect().width > 図.getBoundingClientRect().width) 図 = svg;
        }
        if (!図 || 図.querySelector("[data-uekomi]")) return;
        const 包み = document.createElementNS("http://www.w3.org/2000/svg", "g");
        包み.setAttribute("transform", `scale(${縮小})`);
        包み.setAttribute("data-uekomi", "1");
        const 字 = document.createElementNS("http://www.w3.org/2000/svg", "text");
        字.setAttribute("x", "200");
        字.setAttribute("y", "200");
        字.setAttribute("font-size", String(指定));
        字.textContent = "植えた字";
        包み.append(字);
        図.append(包み);
      };
      new MutationObserver(植える).observe(document, { childList: true, subtree: true });
    },
    { 指定: 植える指定, 縮小: 植える縮小 },
  );
}

test.describe("拡大表示の文字が読める大きさに届く (#2284)", () => {
  test.use({ viewport: { width: 携帯の幅, height: 携帯の高さ } });

  test(`幅 ${携帯の幅}px で分類の拡大表示を開くと、文字が下限に届く`, async ({ page }, info) => {
    // 1 分類あたり 開く 1.2 秒 + 頁を送る往復 + 拡大表示が開くまで 1.5 秒
    info.setTimeout(30_000 + CATEGORIES.length * 16_000);

    /** 下限を割った分類。 宣言していない分だけを持つ */
    const 割った: string[] = [];
    /** 宣言したのに割らなくなった分類。 宣言が古いので外す */
    const 直った: string[] = [];
    /** 拡大表示のボタンが無かった分類 */
    const ボタンが無い: string[] = [];
    /** 拡大表示は開いたが、中に文字が 1 つも無かった分類 */
    const 文字が無い: string[] = [];
    let 測った分類 = 0;
    let 文字の数 = 0;

    for (const 分類 of CATEGORIES) {
      await page.goto(`catalog/${分類.slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      await 頁を送る(page);

      const ボタン = page.getByRole("button", { name: /を拡大表示$/ }).first();
      if ((await ボタン.count()) === 0) {
        ボタンが無い.push(分類.slug);
        continue;
      }
      await ボタン.click();
      await expect(page.locator(".cdl-modal-content")).toBeVisible();
      // 描き出しの動きが静止するまで待つ (#2279 の実測でガントチャートは 2.1 秒)
      await page.waitForTimeout(2500);

      const 測定 = await 拡大の最小の文字(page);
      if (測定.文字数 === 0) {
        文字が無い.push(分類.slug);
      } else {
        測った分類++;
        文字の数 += 測定.文字数;

        const 割れ = 測定.最小 < 下限;
        const 理由 = 宣言.get(分類.slug);
        if (理由 === undefined) {
          if (割れ) {
            割った.push(`${分類.slug} ${測定.最小.toFixed(2)}px "${測定.字}"`);
          }
        } else if (!割れ) {
          直った.push(`${分類.slug} ${測定.最小.toFixed(2)}px — 宣言の理由: ${理由}`);
        }
      }

      await page.keyboard.press("Escape");
      await expect(page.locator(".cdl-modal-content")).toBeHidden();
    }

    // 走査した母数を残す。 0 件が「該当なし」 か「測っていない」 かを読み手が分けられるようにする
    const 母数 =
      `分類 ${CATEGORIES.length} 件 / 測った ${測った分類} 件 / 文字 ${文字の数} 件` +
      ` / ボタンが無い ${ボタンが無い.length} 件 / 文字が無い ${文字が無い.length} 件`;
    await info.attach("母数", { body: 母数, contentType: "text/plain" });

    expect(測った分類, `拡大表示を 1 件も測れていない (${母数})`).toBeGreaterThan(0);
    expect(
      [...ボタンが無い, ...文字が無い].sort(),
      `測れなかった分類が 測れない分類 とずれている (ボタンが無い: ${
        ボタンが無い.join(", ") || "なし"
      } / 文字が無い: ${文字が無い.join(", ") || "なし"}) (${母数})`,
    ).toEqual([...測れない分類].sort());
    expect(
      直った,
      `宣言が古い。 下限 ${下限}px を割らなくなったので 宣言 から外す (${母数})\n${直った.join("\n")}`,
    ).toEqual([]);
    expect(
      割った,
      `拡大表示の文字が下限 ${下限}px を割っている (${母数})\n${割った.join("\n")}`,
    ).toEqual([]);
  });

  test("読む先への入口が、どの分類でも指で押せる (#2286)", async ({ page }, info) => {
    /*
     * #2286 は並べて見る側を「幅に合わせたまま」 に決めた = 携帯では図が 1.7px から 6.0px の
     * ままで、読むのは拡大表示で行う。 **その決めは受け皿が在ることを前提にしている** ので、
     * 入口が在って押せることをここで固定する。 入口が消えたり小さくなったりしたら、
     * 一覧の図が読めないことに行き先が無くなる。
     *
     * 44px は指の的の目安。 既定 (卓上) は 72x33px なので、狭い画面でだけ高さを足している。
     */
    info.setTimeout(30_000 + CATEGORIES.length * 12_000);
    const 的の下限 = 44;

    const 小さい: string[] = [];
    const 無い: string[] = [];
    let 測った = 0;

    for (const 分類 of CATEGORIES) {
      await page.goto(`catalog/${分類.slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);

      const ボタン = page.getByRole("button", { name: /を拡大表示$/ }).first();
      if ((await ボタン.count()) === 0) {
        無い.push(分類.slug);
        continue;
      }
      await expect(ボタン, `${分類.slug} の入口が見えていない`).toBeVisible();
      const 枠 = await ボタン.boundingBox();
      expect(枠, `${分類.slug} の入口の大きさを測れない`).not.toBeNull();
      測った++;
      if (枠!.height < 的の下限 || 枠!.width < 的の下限) {
        小さい.push(`${分類.slug} ${Math.round(枠!.width)}x${Math.round(枠!.height)}px`);
      }
    }

    const 母数 = `分類 ${CATEGORIES.length} 件 / 測った ${測った} 件`;
    await info.attach("母数", { body: 母数, contentType: "text/plain" });

    expect(測った, `入口を 1 件も測れていない (${母数})`).toBeGreaterThan(0);
    expect(無い, `拡大表示への入口を持たない分類がある (${母数})\n${無い.join("\n")}`).toEqual([]);
    expect(
      小さい,
      `入口が指の的 (${的の下限}px) より小さい (${母数})\n${小さい.join("\n")}`,
    ).toEqual([]);
  });

  test("入れ子の縮小が掛かった文字を母数に入れている (#2287)", async ({ page }, info) => {
    /*
     * 下限の母数は **書かれた指定** ではなく **画面に出る実効** (指定 × 入れ子の縮小)。
     * 2 つは入れ子の縮小を持つ図でしか違わないので、その図をこの検査が自分で作る。
     *
     * ## カタログの図には頼らない
     *
     * 元は `ethereum` の `ハッシュ` (指定 10.5 の親に `scale(0.719)`、実効 7.55) を材料に
     * していた。 記法の engine が 0.73.0 で縮めた分を字の指定で打ち消すようになり
     * ([cardene777/cdl#871](https://github.com/cardene777/cdl/issues/871))、実効が指定と
     * 一致して差が消えた (#2562)。 **同じことが次の見本でも起きる** ので、材料を植え込みに
     * 変える = どの図が何を持つかに左右されない。
     *
     * ## 対照で母数を読み分ける
     *
     * `cookbook` はいちばん小さい字が指定 24 で、下限は 10 / 24 = 0.4167 で描かれる。
     * 植える字の指定 30 は 24 より **大きい** ので、指定を母数にすると 1px も動かない。
     * 実効 15 を母数にすると 10 / 15 = 0.6667 になる。
     * 実寸 100% の上限には当たらない = 上限の頭打ちではなく母数の違いを測っている。
     */
    info.setTimeout(120_000);
    const 分類 = "cookbook";

    const 対照 = await 拡大を開いて測る(page, 分類);
    expect(対照.字, "植える前から植えた字が居る (検査が空振りしている)").not.toBe("植えた字");
    expect(
      植える指定,
      "植える字の指定が図の最小より小さいと、指定を母数にしても描かれ方が動く = 対照にならない",
    ).toBeGreaterThan(対照.指定の最小);
    expect(
      対照.倍率,
      `植える前の図が下限で描かれていない (実測 ${対照.倍率.toFixed(4)})`,
    ).toBeCloseTo(目指す大きさ / 対照.指定の最小, 2);

    await 植え込みを仕込む(page);
    const 植えた = await 拡大を開いて測る(page, 分類);

    await info.attach("測り", {
      body:
        `対照 倍率 ${対照.倍率.toFixed(4)} / 指定の最小 ${対照.指定の最小}` +
        ` / 実効の最小 ${対照.実効の最小.toFixed(2)} "${対照.字}"\n` +
        `植えた 倍率 ${植えた.倍率.toFixed(4)} / 指定の最小 ${植えた.指定の最小}` +
        ` / 実効の最小 ${植えた.実効の最小.toFixed(2)} "${植えた.字}"`,
      contentType: "text/plain",
    });

    expect(植えた.字, "植えた字が図に入っていない (検査が空振りしている)").toBe("植えた字");
    expect(植えた.実効の最小).toBeCloseTo(植える指定 * 植える縮小, 1);
    expect(
      植えた.指定の最小,
      "植えた字が指定の最小を下げている = 指定を母数にしても動くので対照にならない",
    ).toBe(対照.指定の最小);
    expect(
      植えた.倍率,
      `母数が指定のままなら ${対照.倍率.toFixed(4)} のまま動かない (実測 ${植えた.倍率.toFixed(4)})`,
    ).toBeCloseTo(目指す大きさ / (植える指定 * 植える縮小), 2);
  });

  test("小さすぎる文字はちゃんと拾える (植え込み対照)", async ({ page }) => {
    // 上の判定は「割った分類が 0 件」 を期待する側を持つ。 正しい画面を見ているだけでは
    // 拾い方が実物と噛み合っているかが判らない。 わざと小さい文字を 1 つ置いて確かめる
    await page.goto("catalog/charts", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await 頁を送る(page);
    await page
      .getByRole("button", { name: /を拡大表示$/ })
      .first()
      .click();
    await expect(page.locator(".cdl-modal-content")).toBeVisible();
    await page.waitForTimeout(2500);

    const 植える前 = await 拡大の最小の文字(page);
    expect(植える前.最小, "植える前から下限を割っている (対照にならない)").toBeGreaterThanOrEqual(
      下限,
    );

    await page.evaluate(() => {
      const svg = document.querySelector(".cdl-modal-body svg");
      if (!svg) throw new Error("拡大表示の中に図が無い");
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", "0");
      t.setAttribute("y", "0");
      t.style.fontSize = "0.5px";
      t.textContent = "植えた字";
      svg.append(t);
    });

    const 植えた後 = await 拡大の最小の文字(page);
    expect(植えた後.字, "小さい文字を置いても拾えない (測り方が実物と噛み合っていない)").toBe(
      "植えた字",
    );
    expect(植えた後.最小).toBeLessThan(下限);
  });
});

test.describe("飾りは図の幅を継がない (#2284)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("並べて見る側で倍率を上げても、読み取り値の輪は自分の大きさのまま", async ({ page }) => {
    /*
     * 倍率を指定した図には `--cdl-zoom-width` から幅を与える。 台の中の svg を全部拾う
     * 指定だったため、図の隣に並ぶ操作の部品 (`.cdl-ip-root`) の中の svg まで同じ幅を受け取り、
     * 44x44 の輪が 1640x1640 に膨らんで台の高さが 71px から 2194px に伸びた (実測)。
     */
    await page.goto("catalog/ethereum", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const 輪を測る = () =>
      page.evaluate(() => {
        const 輪 = document.querySelector(".catalog-preview-stage-inner .cdl-ip-root svg");
        const 台 = document.querySelector(".catalog-preview-stage-inner");
        if (!輪 || !台) return null;
        const r = 輪.getBoundingClientRect();
        return { 幅: Math.round(r.width), 高さ: Math.round(r.height), 台の高さ: 台.scrollHeight };
      });

    const 前 = await 輪を測る();
    expect(前, "読み取り値の飾りが出ていない (検査が空振りしている)").not.toBeNull();

    await page.getByRole("button", { name: "倍率を上げる" }).first().click();
    await page.waitForTimeout(500);

    const 後 = await 輪を測る();
    expect(
      後!.幅,
      `倍率を上げたら飾りが図の幅を継いだ (前 ${前!.幅}px → 後 ${後!.幅}px)`,
    ).toBeLessThanOrEqual(前!.幅 + 1);
    expect(
      後!.台の高さ,
      `飾りが伸びて台の高さが跳ねた (前 ${前!.台の高さ}px → 後 ${後!.台の高さ}px)`,
    ).toBeLessThan(前!.台の高さ + 400);
  });
});
