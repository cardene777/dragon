import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

import { 一覧の行 } from "./catalog-item-pick";
import { 一覧が落ち着くまで待つ, 形が落ち着くまで待つ } from "./wait-for-render";

/*
 * 線の上を走る丸が、線と見分けられて、かつ線のそばの文字を横切らないことを見る (#2537)。
 *
 * 丸は箱に指を乗せている間だけ出る。 走る線は指を乗せた箱で変わるので、
 * **箱を 1 つずつ順に辿る**。 1 つの箱だけで測ると、その箱に繋がっていない線の
 * そばの文字は 1 度も確かめられない (それで 1 巡目は「被りなし」 と出た)。
 *
 * 測り方は画素から取る。 紙の色と丸の色を重ねて計算すると、線が箱の面を横切る場合に
 * 合わない (`relation-edge-opacity.spec.ts` と同じ理由)。
 * 丸を消した写しと出した写しを撮り、文字の枠の中で色が変わった画素を数える。
 */

const 被りの上限 = 0.05; // 文字の枠の面積に対する割合
const 覆う段差 = 40; // 1 画素の色がこれより大きくずれたら、丸が覆ったとみなす
const 舞台 = "svg[data-cdl-stage]";
const 流れ = `${舞台} [data-cdl-role="edge-flow"]`;
const 端の数 = `${舞台} [data-cdl-role="edge-end-label"]`;
const 時刻 = [0.15, 0.45, 0.75, 1.05, 1.35, 1.65, 1.9];

type 枠 = { 文: string; x: number; y: number; w: number; h: number };

/**
 * 図が組み終わるまで待つ (#2555)。
 *
 * かつては一覧の行を押して 3500 ミリ秒 待っていた。 一式で回すと一覧の組み替えが遅れ、
 * 押す側が要素の動かなくなるのを待って 30 秒で切れる (#2488 と同じ落ち方)。
 *
 * 箱の数と、最初と最後の箱の位置を見る。 数だけだと出揃ってから動く間に測ってしまい、
 * 位置だけだと箱が 1 つも無い間も動いていないことになる。
 */
async function 図が落ち着くまで待つ(page: Page, id: string): Promise<number> {
  return 形が落ち着くまで待つ(
    page,
    `${id} の図`,
    (指す: { 舞台: string }) => {
      const s = document.querySelector(指す.舞台);
      if (!s) return null;
      const 箱 = [...s.querySelectorAll("[data-cdl-node]")];
      if (箱.length === 0) return null;
      const 先 = 箱[0]!.getBoundingClientRect();
      const 後 = 箱[箱.length - 1]!.getBoundingClientRect();
      if (先.width === 0) return null;
      return [箱.length, 先.x, 先.y, 後.x, 後.y].map(Math.round).join(",");
    },
    { 舞台 },
  );
}

/**
 * 指を乗せた箱から走る丸が出揃うまで待つ (#2555)。
 *
 * かつては 700 ミリ秒 待って、出ていなければ **その箱を黙って飛ばしていた**。
 * 実測では丸は 1-3 ミリ秒で出て、飛ばす経路は待ちが足りなかった時にしか通らない
 * (class-demo は 7 個中 7 個、er-demo は 3 個中 3 個の箱から出る)。
 * 飛ばすと「被りなし」 が、見なかったことを意味するようになる。
 *
 * 丸そのものは線の上を動き続けるので位置では落ち着かない。 **どの線に付いているか** を見る。
 * 隣の箱へ移る間は古い丸が消えて新しい丸が出るまでの隙間があり、そこで一瞬 0 本になるため、
 * 0 本も形の 1 つとして数える (窓の間 0 本が続いた箱は、丸の出ない箱として呼出側が数える)。
 */
async function 丸が落ち着くまで待つ(page: Page, id: string): Promise<number> {
  return 形が落ち着くまで待つ(
    page,
    `${id} の走る丸`,
    (指す: { 舞台: string }) => {
      const s = document.querySelector(指す.舞台);
      if (!s) return null;
      return [...s.querySelectorAll('[data-cdl-role="edge-flow"]')]
        .map((e) => e.closest("g[data-cdl-edge]")?.getAttribute("data-cdl-edge") ?? "(親なし)")
        .sort()
        .join("|");
    },
    { 舞台 },
    { 窓: 300, 出ない時の言い方: "出揃わない" },
  );
}

/**
 * 丸から広がる波を、いちばん広がった所で止める (#2770)。
 *
 * 波は `cdl-theme.css` の動きで半径を伸ばす。 **描く側の時計 (`pauseAnimations`) では
 * 止まらない** ので、止めずに測ると写すたびに半径が変わり、被りの割合が run ごとに揺れる。
 *
 * 待ちを負の値にして 1 周の終わり近くへ送り、そこで止める。
 * 波がいちばん外まで出た形で測るので、出る値はこの指定での最悪値になる。
 */
async function 波を止める(page: Page) {
  await page.addStyleTag({
    content: `[data-cdl-role="edge-flow"] circle {
      animation-delay: -1.3s !important;
      animation-play-state: paused !important;
    }`,
  });
}

async function 見本を開く(page: Page, id: string) {
  await page.goto("catalog/presets");
  await page.waitForLoadState("networkidle");
  await 一覧が落ち着くまで待つ(page, `${id} の一覧`);
  await 一覧の行(page, id).click();
  await 図が落ち着くまで待つ(page, id);
  await 波を止める(page);
}

async function 写す(page: Page, t: number, 丸あり: boolean) {
  await page.evaluate(
    ([t, 丸あり]) => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      s.setCurrentTime(t);
      document.getElementById("丸を消す")?.remove();
      if (!丸あり) {
        const st = document.createElement("style");
        st.id = "丸を消す";
        st.textContent = '[data-cdl-role="edge-flow"]{visibility:hidden !important}';
        document.head.appendChild(st);
      }
    },
    [t, 丸あり] as const,
  );
  /*
   * 描き直した面が出るまで待つ (#2555)。
   *
   * かつては 70 ミリ秒 待っていた。 これも負荷で足りなくなる形で、足りないと **前の面を撮る** =
   * 丸ありと丸なしが同じ絵になり、被りが 0% と出る。 落ちずに通るので気付けない。
   *
   * 面が 2 度出るのを待つ。 1 度目は書き換えを反映する前のことがある。
   */
  await page.evaluate(
    () =>
      new Promise<void>((戻す) => {
        requestAnimationFrame(() => requestAnimationFrame(() => 戻す()));
      }),
  );
  return PNG.sync.read(await page.screenshot());
}

/**
 * 枠の中で、丸のある写しとない写しで色が変わった画素の割合を返す。
 *
 * 「変わった」 とみなす段差を 40 に取る (#2772)。
 * 丸の芯は紙の色の上に線の色を置くので、重なった画素は 120 前後ずれる。
 * 波のにじみは離れるほど薄くなり、数の所では 40 以下にしかならない。
 * 実測は 段差 20 で 4.8% / 段差 40 で 1.5% / 段差 60 で 0 件 と離れており、
 * 「丸が字を覆った」 と「波が字のまわりを染めた」 の間に広い間がある。
 *
 * 1 画素でも違えば数える形 (段差 3) にすると、広がる波そのものを被りとして数える。
 * 波は図の端まで広がる作りなので、それを被りと呼ぶと上限は永久に満たせない。
 */
function 変わった割合(あり: PNG, なし: PNG, f: 枠, 倍: number) {
  const x0 = Math.floor(f.x * 倍);
  const y0 = Math.floor(f.y * 倍);
  const x1 = Math.ceil((f.x + f.w) * 倍);
  const y1 = Math.ceil((f.y + f.h) * 倍);
  let 差 = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * あり.width + x) * 4;
      const 差分 = (k: number) => Math.abs((あり.data[i + k] ?? 0) - (なし.data[i + k] ?? 0));
      if (差分(0) > 覆う段差 || 差分(1) > 覆う段差 || 差分(2) > 覆う段差) 差 += 1;
    }
  }
  const 面積 = (x1 - x0) * (y1 - y0);
  return { 割合: 面積 ? 差 / 面積 : 0, 面積 };
}

/**
 * 全部の箱に順に指を乗せ、丸が走る度に文字の枠を測る。
 * 1 本も走らなかった場合は 0 を返さず、走った本数を一緒に返して呼出側で確かめる。
 * 丸の出なかった箱も飛ばさずに数えて返す (#2555)。
 */
async function 横切りを測る(page: Page, id: string, 倍: number) {
  const 箱 = page.locator(`${舞台} [data-cdl-node]`);
  const 箱数 = await 箱.count();
  expect(箱数, "箱が 1 つも無い").toBeGreaterThan(0);

  let 走った = 0;
  const 丸の出ない箱: number[] = [];
  const 最悪 = new Map<string, number>();

  for (let n = 0; n < 箱数; n++) {
    await 箱.nth(n).hover();
    await 丸が落ち着くまで待つ(page, id);
    const 本数 = await page.locator(流れ).count();
    if (本数 === 0) {
      丸の出ない箱.push(n);
      continue;
    }
    走った += 本数;

    await page.evaluate(() =>
      (document.querySelector("svg[data-cdl-stage]") as SVGSVGElement).pauseAnimations(),
    );

    // 丸あり と 丸なし の 2 枚が本当に違う絵になるかを、画素を撮る前に確かめる (#2555)。
    // 同じ絵だと被りは必ず 0% になり、検査は黙って通る
    const 見え方 = await page.evaluate(() => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      const 丸 = [...s.querySelectorAll('[data-cdl-role="edge-flow"]')];
      const 隠れている = () => 丸.every((e) => getComputedStyle(e).visibility === "hidden");
      document.getElementById("丸を消す")?.remove();
      const 出ている = 丸.some((e) => {
        const r = e.getBoundingClientRect();
        return getComputedStyle(e).visibility !== "hidden" && r.width > 0 && r.height > 0;
      });
      const st = document.createElement("style");
      st.id = "丸を消す";
      st.textContent = '[data-cdl-role="edge-flow"]{visibility:hidden !important}';
      document.head.appendChild(st);
      const 消せる = 隠れている();
      st.remove();
      return { 出ている, 消せる };
    });
    expect(見え方.出ている, `箱 ${n} で丸が出ていない (撮る 2 枚が同じ絵になる)`).toBe(true);
    expect(見え方.消せる, `箱 ${n} で丸を消せていない (撮る 2 枚が同じ絵になる)`).toBe(true);
    const 枠々: 枠[] = await page.evaluate(() => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      // 図の題も数える (#2749)。 丸が題に重なるのも同じ不具合なので、外す理由が無い
      return [...s.querySelectorAll("text")]
        .map((e) => {
          const r = e.getBoundingClientRect();
          return {
            文: (e.textContent ?? "").slice(0, 10),
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
          };
        })
        .filter(
          (r) =>
            r.w > 0 &&
            r.h > 0 &&
            r.x >= 0 &&
            r.y >= 0 &&
            r.x + r.w <= window.innerWidth &&
            r.y + r.h <= window.innerHeight,
        );
    });
    expect(枠々.length, "文字が 1 つも取れなかった").toBeGreaterThan(0);

    for (const t of 時刻) {
      const あり = await 写す(page, t, true);
      const なし = await 写す(page, t, false);
      for (const f of 枠々) {
        const { 割合 } = 変わった割合(あり, なし, f, 倍);
        if (割合 > (最悪.get(f.文) ?? 0)) 最悪.set(f.文, 割合);
      }
    }
  }
  return { 走った, 最悪, 丸の出ない箱, 箱数 };
}

test.describe("線の上を走る丸", () => {
  test("クラス図で、線のそばの文字を横切らない", async ({ page }, info) => {
    const 倍 = info.project.use.deviceScaleFactor ?? 1;
    await 見本を開く(page, "class-demo");
    const { 走った, 最悪, 丸の出ない箱, 箱数 } = await 横切りを測る(page, "class-demo", 倍);

    // 1 本も走らなければ「被りなし」 も意味を持たない
    expect(走った, "丸が 1 本も走らなかった").toBeGreaterThan(0);
    // 実測では 7 個の箱すべてから丸が出る。 出ない箱を飛ばすと、そのそばの文字が
    // 1 度も確かめられないまま「被りなし」 になる (#2555)
    expect(丸の出ない箱, `箱 ${箱数} 個のうち、丸の出ない箱`).toEqual([]);

    const 超過 = [...最悪].filter(([, v]) => v >= 被りの上限);
    expect(
      超過.map(([文, v]) => `${文} ${(v * 100).toFixed(1)}%`).join(" / "),
      `走った線 のべ ${走った} 本 / 見た文字 ${最悪.size} 個`,
    ).toBe("");
  });

  test("表どうしのつながりを描く図で、文字を横切らない", async ({ page }, info) => {
    const 倍 = info.project.use.deviceScaleFactor ?? 1;
    await 見本を開く(page, "er-demo");
    const { 走った, 最悪, 丸の出ない箱, 箱数 } = await 横切りを測る(page, "er-demo", 倍);

    expect(走った, "丸が 1 本も走らなかった").toBeGreaterThan(0);
    // 実測では 3 個の箱すべてから丸が出る (理由はクラス図と同じ)
    expect(丸の出ない箱, `箱 ${箱数} 個のうち、丸の出ない箱`).toEqual([]);
    const 超過 = [...最悪].filter(([, v]) => v >= 被りの上限);
    expect(超過.map(([文, v]) => `${文} ${(v * 100).toFixed(1)}%`).join(" / ")).toBe("");
  });

  test("丸は線の色の芯がにじみ、外の 2 枚が波になって広がる", async ({ page }) => {
    await 見本を開く(page, "er-demo");
    await page.locator(`${舞台} [data-cdl-node]`).first().hover();
    await page.waitForSelector(流れ, { state: "attached" });

    const 実 = await page.evaluate(() => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      const g = s.querySelector('[data-cdl-role="edge-flow"]') as SVGGElement;
      const 丸 = [...g.querySelectorAll("circle")];
      const 紙 = getComputedStyle(s).getPropertyValue("--er-ground").trim();
      const 色 = (v: string) => {
        const c = document.createElement("span");
        c.style.color = v;
        document.body.appendChild(c);
        const out = getComputedStyle(c).color;
        c.remove();
        return out;
      };
      // 波がどこまで広がるかは、動きの終わりの半径で決まる。 描いている今の半径で見ると
      // 止めた位置に依ってしまうので、動きそのものが持つ値を読む
      const 行き先 = (e: Element) =>
        e
          .getAnimations()
          .flatMap((a) => (a.effect as KeyframeEffect | null)?.getKeyframes() ?? [])
          .map((k) => Number.parseFloat(String((k as { r?: string }).r ?? "NaN")))
          .filter((v) => Number.isFinite(v));
      const 線 = getComputedStyle(s).getPropertyValue("--er-line").trim();
      const 芯 = 丸[丸.length - 1] as Element;
      return {
        枚数: 丸.length,
        芯の塗り: getComputedStyle(芯).fill,
        芯の縁: getComputedStyle(芯).stroke,
        芯のにじみ: getComputedStyle(芯).filter,
        紙の色: 色(紙),
        線の色: 色(線),
        外の塗り: 丸.slice(0, 2).map((c) => getComputedStyle(c).fill),
        波の行き先: 丸.slice(0, 2).map((c) => Math.max(...行き先(c), 0)),
        半径: 丸.map((c) => c.getBoundingClientRect().width),
      };
    });

    // 1 本の線につき 3 枚。 枚数は赤ペンの回答どおり変えない
    expect(実.枚数 % 3, `丸の枚数 ${実.枚数}`).toBe(0);
    // 芯は線の色で塗り、台の色の縁で囲い、まわりへ光をにじませる (#2772)。
    // 塗りと縁が逆だと、中身が台と同じ色になって線に開いた泡に見える
    expect(実.芯の塗り).toBe(実.線の色);
    expect(実.芯の縁).toBe(実.紙の色);
    expect(実.芯のにじみ, "芯がにじんでいない").toContain("drop-shadow");
    // 外の 2 枚は塗らない輪。 塗ると波ではなく塊になる
    expect(実.外の塗り).toEqual(["none", "none"]);
    // 波はどちらも半径 20 までで止まる。 ここが線のそばの数に届かない上限 (#2537 の実測)
    for (const 先 of 実.波の行き先) {
      expect(先, "波が広がらない").toBeGreaterThan(0);
      expect(先, "波が線のそばの数まで届く").toBeLessThanOrEqual(20);
    }
    // 止めた位置で 外 > 中 > 芯 の順に並ぶ
    const [外, 中, 芯] = 実.半径;
    expect(外, "外の波が取れない").toBeGreaterThan(0);
    expect(中, "中の波が取れない").toBeGreaterThan(0);
    expect(芯, "芯が取れない").toBeGreaterThan(0);
    expect(外!).toBeGreaterThan(中!);
    expect(中!).toBeGreaterThan(芯!);
  });

  test("線のそばの数には、台と同じ色の下敷きが敷いてある", async ({ page }) => {
    await 見本を開く(page, "class-demo");
    const 数 = page.locator(端の数).first();
    await 数.waitFor({ state: "attached" });

    const 実 = await page.evaluate(() => {
      const s = document.querySelector("svg[data-cdl-stage]") as SVGSVGElement;
      const 紙 = getComputedStyle(s).getPropertyValue("--er-ground").trim();
      const 色 = (v: string) => {
        const c = document.createElement("span");
        c.style.color = v;
        document.body.appendChild(c);
        const out = getComputedStyle(c).color;
        c.remove();
        return out;
      };
      /*
       * 下敷きが線の芯まで届いていないかを、実物の隙間から見る (#2772)。
       *
       * 下敷きは字の外側へ **幅の半分** だけ伸びる。 数と線の隙間より半分が大きいと、
       * 下敷きが線の芯を塗り潰し、線がその場所だけ途切れて見える。
       * 実測では 幅 16 が線を 80% 削り、幅 8 は 23% で、削れたことが目で分からない。
       *
       * 数の属する線は親を辿っても見つからない。 描く側は数を線より後の段で、
       * 図の直下に置くため、数と線は親子にならない。
       * 横に重なる線のうち、数のすぐ上にあるものを相手にする。
       *
       * 隙間は横に走る線で測る。 縦の線は囲い枠の高さが線の長さになるので、
       * 数との上下の隙間を表さない。
       */
      const 倍 = s.getScreenCTM()?.a ?? 1;
      const 横線 = [...s.querySelectorAll('[data-cdl-role="edge-line"]')]
        .map((l) => l.getBoundingClientRect())
        .filter((r) => r.width > r.height);
      const 横の数 = [...s.querySelectorAll('[data-cdl-role="edge-end-label"]')]
        .map((t) => {
          const tr = t.getBoundingClientRect();
          // 数は線の下に置かれる。 線の芯から数の上端までが隙間 (図の寸法に直す)
          const 隙間 = 横線
            .filter((lr) => tr.x + tr.width > lr.x && tr.x < lr.x + lr.width && lr.y < tr.y)
            .map((lr) => (tr.y - lr.y) / 倍)
            .sort((a, b) => a - b)[0];
          return 隙間 === undefined ? null : { 隙間, 文: t.textContent ?? "" };
        })
        .filter((x): x is { 隙間: number; 文: string } => x !== null);
      const t = s.querySelector('[data-cdl-role="edge-end-label"]') as SVGTextElement;
      const cs = getComputedStyle(t);
      return {
        縁: cs.stroke,
        幅: cs.strokeWidth,
        描き順: cs.paintOrder,
        紙の色: 色(紙),
        隙間: 横の数,
      };
    });

    expect(実.縁).toBe(実.紙の色);
    // 下敷きが無いと、丸が通るたびに数が読めなくなる
    expect(parseFloat(実.幅), "下敷きが敷かれていない").toBeGreaterThan(0);
    // 下敷きは字の下に敷く。 字の上に来ると数が読めなくなる
    expect(実.描き順).toContain("stroke");

    // 幅の半分が隙間を超えると線が途切れる (#2772)。 上限は実物の隙間から導く
    expect(実.隙間.length, "横に走る線の数を 1 つも測れなかった").toBeGreaterThan(0);
    const 超え = 実.隙間
      .filter((x) => parseFloat(実.幅) / 2 > x.隙間)
      .map((x) => `${x.文} 隙間 ${x.隙間.toFixed(1)}`);
    expect(超え.join(" / "), `下敷き ${実.幅} の半分が線の芯まで届く数`).toBe("");
  });
});
