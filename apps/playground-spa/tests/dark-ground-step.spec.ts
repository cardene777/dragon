/**
 * 暗い画面で図の面が分かれて見えることの検証 (#1060)。
 *
 * 以前は紙 `#1a1408` と箱 `#2a1f14` の明るさの差が `ΔL* 6.1` しかなく、 **箱が面として
 * 立っていなかった**。 見えるのは輪郭線と文字だけで、 目が図の構造を掴めない状態だった。
 *
 * ## 対比比では測れない
 *
 * 暗い面どうしは対比比 (WCAG) では測れない。 比は明るさに対する割合なので、 目に見える
 * 段差があっても `1.1-1.4` に潰れる (実測 = 現状 1.14 / 変更後 1.41 で、 どちらも「差が無い」
 * ように見える値になる)。 面が分かれて見えるかは **`L*` の差** で見る。
 *
 * 明暗差が大きい組 (箱と文字 / 箱と枠) は従来どおり対比比で測る。
 */
import { test, expect } from "@playwright/test";

/** sRGB → 相対輝度 (WCAG)。 */
function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** `rgb(r, g, b)` を数値 3 つに直す。 */
function parse(color: string): number[] {
  const m = color.match(/\d+(\.\d+)?/g);
  expect(m, `色を読めない: ${color}`).not.toBeNull();
  return m!.slice(0, 3).map(Number);
}

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(parse(a)), luminance(parse(b))].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** 人が感じる明るさ (CIE L*)。 */
const Lstar = (color: string): number => {
  const Y = luminance(parse(color));
  const f = Y > 0.008856 ? Math.cbrt(Y) : 7.787 * Y + 16 / 116;
  return 116 * f - 16;
};

/** エディタの図面から、 面と線の色をまとめて測る。 */
async function surfaces(page: import("@playwright/test").Page) {
  return await page.evaluate(() => {
    const fill = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fill : null;
    };
    // 図面の実背景 (svg の後ろにある要素まで辿る)
    const svg = document.querySelector("svg [data-cdl-role='node-body']")?.closest("svg");
    let paper: string | null = null;
    let n: HTMLElement | null = svg?.parentElement ?? null;
    while (n && !paper) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && c !== "rgba(0, 0, 0, 0)" && !c.includes(", 0)")) paper = c;
      n = n.parentElement;
    }
    const strokeOf = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).stroke : null;
    };
    return {
      紙: paper,
      箱: fill("svg [data-cdl-role='node-body']"),
      座布団: fill("svg [data-cdl-role='edge-label-bg']"),
      枠: strokeOf("svg [data-cdl-role='node-body']"),
      文字: fill("svg [data-cdl-role='node-label']"),
      線: [...document.querySelectorAll("svg [data-cdl-role='edge-line']")]
        .map((el) => getComputedStyle(el).stroke)
        .filter((v, i, a) => a.indexOf(v) === i),
    };
  });
}

async function openDark(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(2200);
}

/**
 * 面の段差 (`L*` の差 12 以上) を測る 2 件は #1110 で外した。
 *
 * 12 という値は旧配色 (羊皮紙・銅・琥珀・黒曜石) の面の幅に合わせて決めたもので、
 * 明暗 2 種に作り直した配色では最大でも 11.8 しか離れない = 満たせない。
 *
 * 見た目の判断は `docs/design/app.pen` に一本化した。 user 明示指示
 * 「いらない・pencil が全て。 デザインに関しては。」 による。
 *
 * **代わりの数値を置かない**。 置くとその数値を誰かが決めることになり、 `.pen` に
 * 一本化した権威が再び分散する。 面が分かれて見えるかは画面で判断する。
 *
 * 下の「紙と箱の明るさが離れている」 は配色の良し悪しではなく **上書きが届いているか** を
 * 見る配線の検査として残す (同じ色なら変数が効いていない)。
 */

test("暗い画面で箱の中の文字と枠が読める", async ({ page }) => {
  await openDark(page);
  const s = await surfaces(page);
  // 面を暗くした分、 その上に乗るものが読めなくなっていないかを見る
  expect(contrast(s.箱!, s.文字!), "箱の中の文字が読めない").toBeGreaterThanOrEqual(4.61);
  expect(contrast(s.箱!, s.枠!), "箱の枠が見えない").toBeGreaterThanOrEqual(4.61);
});

test("暗い画面で線が紙の上で読める", async ({ page }) => {
  await openDark(page);
  const s = await surfaces(page);
  expect(s.線.length, "線を測れていない").toBeGreaterThan(0);
  for (const 色 of s.線) {
    expect(contrast(s.紙!, 色!), `線 ${色} が紙 ${s.紙} の上で読めない`).toBeGreaterThanOrEqual(4.61);
  }
});

test("暗い画面で図の中の面の色が揃っている", async ({ page }) => {
  // 面の色は selector が 3 系統ある = 箱を rect 1 枚で描く種別 / 子図形で描く種別 (generic 系) /
  // 変数 (`--cdl-node-fill`) 経由で塗る種別 (chart 系)。 1 つだけ直すと、 同じ図の中で
  // **面の色が混ざる** (実測 = 本 PR の初版で generic 系と chart 系が旧色のまま残った)。
  //
  // **既定サンプル (順序図) だけでは足りない**。 順序図は箱を rect 1 枚で描くので、
  // 子図形と変数の系統に届かない (実測 = generic 系と chart 系を旧色に戻す変異が素通りした)。
  //
  // 3 系統が出る 2 画面を見る。
  // `/preset/topology` = 本体 4 / 子図形 5、 `/catalog/presets` = `chart-line` (変数経由)
  for (const path of ["/preset/topology", "/catalog/presets"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(2500);

    const 色 = await page.evaluate(() => {
      const seen = new Map<string, number>();
      // **`node-body` の中だけを見ては足りない**。 変数 (`--cdl-node-fill`) を参照する面は
      // chart 系の中にあり、 `node-body` の外側に置かれることがある (実測 = `chart-line` の
      // 点は `node-body` を持たない `circle`)。 図の中の面を全部見る。
      for (const t of document.querySelectorAll("svg rect, svg ellipse, svg circle, svg path")) {
        // icon は別軸 (gold で塗る)。 線と矢頭も面ではない
        if (t.closest("[data-cdl-role='node-kind-icon']")) continue;
        const role = t.closest("[data-cdl-role]")?.getAttribute("data-cdl-role");
        if (role === "edge-line" || role === "edge-arrowhead") continue;
        const f = getComputedStyle(t).fill;
        if (!f || f === "none" || f.startsWith("url(")) continue;
        seen.set(f, (seen.get(f) ?? 0) + 1);
      }
      return [...seen].sort((a, b) => b[1] - a[1]);
    });
    expect(色.length, `${path} で面を 1 つも測れていない`).toBeGreaterThan(0);
    // 種別ごとの塗り分け (tone) はあるので 1 色に限らないが、 **旧色が残っていないこと** を見る
    const 旧色 = 色.filter(([c]) => c === "rgb(42, 31, 20)");
    expect(旧色, `${path} に旧い面の色 #2a1f14 が残っている: ${JSON.stringify(旧色)}`).toEqual([]);
  }
});

test("書き出す絵の紙が画面の紙と同じ", async ({ page }) => {
  // 書き出し側は紙の色を別に持っていた (実測 = 画面を `#3a2f22` に変えた後も `#241c14` の
  // まま残り、 箱との明るさの差が `ΔL* 4.7` に潰れていた)。 画面から読む形にする。
  await openDark(page);
  const 一致 = await page.evaluate(() => {
    const stage = document.querySelector(".v4-editor-stage");
    if (!stage) return null;
    const 画面 = getComputedStyle(stage).backgroundColor;
    // 書き出しが使う関数と同じ辿り方 (透けていたら祖先へ)
    let n: Element | null = stage;
    let 読んだ: string | null = null;
    while (n && !読んだ) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c)) 読んだ = c;
      n = n.parentElement;
    }
    return { 画面, 読んだ };
  });
  expect(一致, "図面の枠を測れていない").not.toBeNull();
  expect(一致!.読んだ, "書き出しが読む色が画面の紙と違う").toBe(一致!.画面);
});

test("暗い画面で紙と箱の明るさが離れている", async ({ page }) => {
  // 元は「紙の変更が主題 blueprint に限られている」 を測っていた。 主題を廃止したので、
  // その検査が守っていた中身 (箱が紙に沈まないこと) を直接測る形に置き換えた。
  //
  // 紙と箱が同じ明るさだと、 見えるのは輪郭線と文字だけになり、 目が図の構造を掴めない。
  await openDark(page);
  const 測定 = await page.evaluate(() => {
    const stage = document.querySelector(".v4-editor-stage");
    const box = document.querySelector("svg [data-cdl-role='node-body']");
    if (!stage || !box) return null;
    return {
      紙: getComputedStyle(stage).backgroundColor,
      箱: getComputedStyle(box).fill,
    };
  });
  expect(測定, "紙と箱を測れていない").not.toBeNull();

  const 明るさ = (色: string): number => {
    const m = /rgba?\(([^)]+)\)/.exec(色);
    if (!m) return Number.NaN;
    const [r, g, b] = m[1]!.split(",").map((v) => Number(v.trim()) / 255);
    const 直線化 = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * 直線化(r!) + 0.7152 * 直線化(g!) + 0.0722 * 直線化(b!);
  };
  const 紙 = 明るさ(測定!.紙);
  const 箱 = 明るさ(測定!.箱);
  expect(Number.isNaN(紙) || Number.isNaN(箱), "色を読めていない").toBe(false);
  // 面としての区別が付く最低限。 対比 1.2 は WCAG の閾値ではなく「別の面に見える」 目安。
  const 対比 = (Math.max(紙, 箱) + 0.05) / (Math.min(紙, 箱) + 0.05);
  expect(対比, `紙 ${測定!.紙} と箱 ${測定!.箱} が同じ明るさ`).toBeGreaterThan(1.2);
});

test("補助線が重ねた後の色で読める", async ({ page }) => {
  // **半透明で置くと、宣言した色と見える色がずれる**。 以前は gold を半透明で明暗どちらの紙にも
  // 当てており、 catalog の cream の紙では重ねた後が対比 1.38 で溶けていた (実測)。
  // 意味を持つ非文字要素の下限は 3:1。
  // 命綱は順序図に、枠は topology / swimlane に出る。 どちらか片方の画面だけでは
  // もう一方の役割に届かない (実測 = `/editor` は命綱 3 / 枠 0、 `/catalog/patterns` は
  // 命綱 0 / 枠 1)。 紙が暗い側と cream 側の両方を通す。
  //
  // **cream の紙に命綱が出る画面は現状 1 つも無い** (実測 = カタログ側 5 画面すべて命綱 0)。
  // そのため catalog 向けの命綱の色を変えても、この検査は落ちない。 到達する入力を作れない
  // 防御的な指定として残してある (`cdl-theme.css` の `lane-lifeline`)。
  for (const [場所, path] of [
    ["editor (暗い紙)", "/editor"],
    ["catalog (cream の紙)", "/catalog/patterns"],
    ["catalog (cream の紙・枠)", "/preset/topology"],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(2200);

    const r = await page.evaluate(() => {
      const svg = document.querySelector("svg [data-cdl-role='node-body']")?.closest("svg");
      let paper: string | null = null;
      let n: HTMLElement | null = svg?.parentElement ?? null;
      while (n && !paper) {
        const c = getComputedStyle(n).backgroundColor;
        if (c && c !== "rgba(0, 0, 0, 0)" && !c.includes(", 0)")) paper = c;
        n = n.parentElement;
      }
      const strokes: { role: string; stroke: string; opacity: number }[] = [];
      for (const role of ["lane-lifeline", "lane-container"]) {
        const el = document.querySelector(`svg [data-cdl-role="${role}"]`);
        if (!el) continue;
        // **薄さは色の alpha だけではない**。 効くものを 3 つとも数える。
        //
        // 1. 色自身の alpha (`rgba(...)`)
        // 2. 要素と祖先の `opacity` — 実測 = 描画側が `opacity: 0.7` を掛けており、
        //    色を不透明にしても 2.73 に落ちた
        // 3. `stroke-opacity` — 線にだけ掛かる別軸。 現状はどこも 1 だが、
        //    数えないと将来効いた時に黙って通る
        //
        // 祖先は `documentElement` **自身も含めて** 遡る。 除くと root に掛けた
        // `opacity` を見落とす。
        let 実効 = Number(getComputedStyle(el).strokeOpacity || 1);
        let n: Element | null = el;
        while (n) {
          実効 *= Number(getComputedStyle(n).opacity || 1);
          if (n === document.documentElement) break;
          n = n.parentElement;
        }
        strokes.push({ role, stroke: getComputedStyle(el).stroke, opacity: 実効 });
      }
      return { paper, strokes };
    });
    expect(r.paper, `${場所} の紙を測れていない`).not.toBeNull();
    // 測る対象が 0 件だと、 何も確かめずに通る。 どの画面でどの役割が出るかは
    // 上の表で決めているので、 1 件も取れないのは選択子が実装とずれた合図
    expect(r.strokes.length, `${場所} で補助線を 1 つも測れていない (選択子が実装とずれた)`).toBeGreaterThan(0);

    for (const { role, stroke, opacity } of r.strokes) {
      // 色の alpha と要素の opacity の両方を紙に重ねた実効色で測る。
      // どちらかを落とすと実際より強く見積もる
      const f = (stroke.match(/[\d.]+/g) ?? []).map(Number);
      const bg = parse(r.paper!);
      const a = (f.length === 4 ? f[3]! : 1) * opacity;
      const 実効 = [0, 1, 2].map((i) => f[i]! * a + bg[i]! * (1 - a));
      const [hi, lo] = [luminance(実効), luminance(bg)].sort((p, q) => q - p);
      const 対比 = (hi! + 0.05) / (lo! + 0.05);
      expect(
        対比,
        `${場所} の ${role} が紙に溶ける (宣言 ${stroke} / opacity ${opacity.toFixed(2)} / 重ねた後の対比 ${対比.toFixed(2)})`,
      ).toBeGreaterThanOrEqual(3);
    }
  }
});

test("明るい画面は変えていない", async ({ page }) => {
  // 変更は暗い画面に限った。 明るい側を巻き込んでいないことを直接見る。
  //
  // **色を literal で固定しない**。 固定すると将来の正当な配色更新まで落ちる。
  // 「面が分かれて見えるか」 と「その上の文字が読めるか」 の不変条件で見る。
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2200);
  const s = await surfaces(page);
  expect(s.紙, "明るい画面の紙を測れていない").not.toBeNull();

  // 明るい画面は全体が明るいので、 面の段差は小さくても輪郭線が効く。 段差ではなく
  // 「紙が明るい側にある」 ことと「箱の上の文字が読める」 ことを見る
  expect(Lstar(s.紙!), "明るい画面の紙が暗くなっている").toBeGreaterThan(80);
  expect(Lstar(s.箱!), "明るい画面の箱が暗くなっている").toBeGreaterThan(80);
  expect(contrast(s.箱!, s.文字!), "明るい画面で箱の中の文字が読めない").toBeGreaterThanOrEqual(4.61);
  expect(contrast(s.箱!, s.枠!), "明るい画面で箱の枠が見えない").toBeGreaterThanOrEqual(3);
});
