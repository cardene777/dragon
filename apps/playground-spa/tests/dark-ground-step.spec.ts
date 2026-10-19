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
 *
 * 暗い画面 = 地の暗い画面の意匠 (`?theme=terminal`) で開いた画面 (#2962)。 意匠を書いていない
 * 図は画面の意匠で描かれる。
 */
import { test, expect } from "@playwright/test";
import { 明るい画面の意匠, 暗い画面の意匠, 画面の意匠を付ける } from "./helpers/site-theme-url";
import { 箱と矢印を開く } from "./box-and-edge-figure";
import { 一覧の行 } from "./catalog-item-pick";
import { PRESETS } from "./presets";
import {
  effectivePaint,
  parseColor,
  readPaints,
  type Paint,
} from "./helpers/effective-color";
import { contrast as colorContrast } from "./helpers/pixel-contrast";

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

/**
 * 今のシーンに **関わっていない** 箱を選ぶ (#1143)。
 *
 * シーンに関わる箱は面と枠を橙の対 (`--d-accent-soft` + `--d-accent`) に切り替える。 この 2 色は
 * 互いに 4.82 で読めるが、 面は舞台とほぼ同じ明るさになり、 分離は枠が担う。
 *
 * 下の 2 件が測っているのは **既定の箱** が紙に沈まないことなので、 シーンで切り替わった箱を
 * 拾うと測る対象が変わってしまう。 橙に切り替わった箱そのものの読みやすさは
 * `editor-phase-chrome.spec.ts` が別に見る。
 */
const 既定の箱 = "svg [data-cdl-active='false'] [data-cdl-role='node-body']";

/** エディタの図面から、 面と線の色をまとめて測る。 */
async function surfaces(page: import("@playwright/test").Page) {
  // 選択子は引数で渡す。 `page.evaluate` の中は browser 側で走るため、 module 直下の
  // 定数はそのままでは見えない
  return await page.evaluate((既定の箱: string) => {
    const fill = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fill : null;
    };
    // 図面の実背景。 舞台の svg から辿る = 舞台は図の地を自分で塗るので、親の画面の地を
    // 読むと図の紙とは別の色になる (#2962)
    const svg = document.querySelector("svg [data-cdl-role='node-body']")?.closest("svg[data-cdl-stage]");
    let paper: string | null = null;
    let n: Element | null = svg ?? null;
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
      箱: fill(既定の箱),
      座布団: fill("svg [data-cdl-role='edge-label-bg']"),
      枠: strokeOf(既定の箱),
      文字: fill("svg [data-cdl-role='node-label']"),
      線: [...document.querySelectorAll("svg [data-cdl-role='edge-line']")]
        .map((el) => getComputedStyle(el).stroke)
        .filter((v, i, a) => a.indexOf(v) === i),
    };
  }, 既定の箱);
}

/**
 * エディタで箱と矢印が在る図を暗い画面 (地の暗い画面の意匠) で開く。
 *
 * **既定の見本には依らない** (#1477)。 既定は順序図で、`#1466` から 1 枚の板として描かれる =
 * 箱も線も 1 つも出ないため、下の 4 件が測る対象を失っていた。 面の色は図種に依らないので、
 * 測るものが在る図を名指しする。
 */
async function openDark(page: import("@playwright/test").Page): Promise<void> {
  await 箱と矢印を開く(page, 2200, 暗い画面の意匠);
}

/** 見本帳のひな形を名指しして開き (既定は暗い画面)、同じ図が描かれたことを先に確かめる。 */
async function ひな形を開く(
  page: import("@playwright/test").Page,
  id: string,
  画面の意匠: string = 暗い画面の意匠,
): Promise<void> {
  const 見本 = PRESETS.find((p) => p.id === id);
  expect(見本, `${id} のひな形が無い`).toBeDefined();
  await page.goto(画面の意匠を付ける("catalog/presets", 画面の意匠), { waitUntil: "networkidle" });
  const 行 = 一覧の行(page, 見本!.diagram.id);
  await expect(行, `${id} を一覧から選べない`).toBeVisible();
  await 行.click();
  await expect(page.locator(`[data-cdl-diagram="${見本!.diagram.id}"] svg`).first()).toBeVisible();
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
 * 紙と箱の明るさの差を見る配線の検査も #2962 で外した。 図は必ずどれかの意匠で描かれ、
 * 箱の面と地の差は意匠帳が決める (地の暗い画面の意匠 = 端末は、箱の面を地とほぼ同じ色に置いて
 * 輪郭で分ける。 実測で対比 1.04)。 意匠ごとの面と枠の値は `rendered-contrast.spec.ts` が見る。
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
    expect(contrast(s.紙!, 色), `線 ${色} が紙 ${s.紙} の上で読めない`).toBeGreaterThanOrEqual(4.61);
  }
});

test("暗い画面で図の中の面の色が揃っている", async ({ page }) => {
  // 面の色は selector が 3 系統ある = 箱を rect 1 枚で描く種別 / 子図形で描く種別 (generic 系) /
  // 変数 (`--cdl-node-fill`) 経由で塗る種別 (chart 系)。 1 つだけ直すと、 同じ図の中で
  // **面の色が混ざる** (実測 = 暗い配色を入れた最初の実装で generic 系と chart 系が旧色のまま
  // 残った)。
  //
  // **既定サンプル (順序図) だけでは足りない**。 順序図は箱を rect 1 枚で描くので、
  // 子図形と変数の系統に届かない (実測 = generic 系と chart 系を旧色に戻す変異が素通りした)。
  //
  // 3 系統が出る 2 画面を見る。
  // `topology` = 本体 4 / 子図形 5、 `chartLine` = `chart-line` (変数経由)
  for (const id of ["topology", "chartLine"]) {
    await ひな形を開く(page, id);
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
    expect(色.length, `${id} で面を 1 つも測れていない`).toBeGreaterThan(0);
    // 種別ごとの塗り分け (tone) はあるので 1 色に限らないが、 **旧色が残っていないこと** を見る
    const 旧色 = 色.filter(([c]) => c === "rgb(42, 31, 20)");
    expect(旧色, `${id} に旧い面の色 #2a1f14 が残っている: ${JSON.stringify(旧色)}`).toEqual([]);
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

test("補助線が重ねた後の色で読める", async ({ page }) => {
  // **半透明で置くと、宣言した色と見える色がずれる**。 以前は gold を半透明で明暗どちらの紙にも
  // 当てており、 catalog の cream の紙では重ねた後が対比 1.38 で溶けていた (実測)。
  // 意味を持つ非文字要素の下限は 3:1。
  // 枠は topology / c4 に出る。 紙が暗い側と明るい側の両方を通す = エディタは地の暗い画面の意匠、
  // 見本帳は地の明るい画面の意匠で開く (#2962)。
  //
  // **命綱 (`lane-lifeline`) が出る画面は現状 1 つも無い** (#1477 で実測 = エディタと
  // カタログの全画面で 0 件)。 順序図が 1 枚の板になった (`#1466`) ため、縦の点線を引く
  // 主が居なくなった。 到達する入力を作れない防御的な指定として役割の一覧には残す
  // (`cdl-theme.css` の `lane-lifeline` も同じ理由で残している)。
  //
  // **エディタ側は図を名指しする** (#1477)。 既定の見本は順序図で、板には枠も命綱も無い =
  // 補助線を 1 つも測れない。 枠を持つ見本を開く。
  // **分類の一覧は測る対象を持たない** (#2750)。 選んだ 1 件を出す画面で、枠を持つ図
  // (構成図) はどの分類でも既定の選択にならない (実測 = 11 分類すべてで、頁を送った後も
  // 枠が 0 件)。 明るい紙は見本帳で `topology` を選んで測る。
  for (const 場所 of ["editor (暗い紙)", "catalog (明るい紙・枠)"] as const) {
    if (場所.startsWith("editor")) {
      await page.goto(画面の意匠を付ける("editor#preset=topology", 暗い画面の意匠), { waitUntil: "networkidle" });
    } else {
      await ひな形を開く(page, "topology", 明るい画面の意匠);
    }
    await page.waitForTimeout(2200);

    const paper = await page.evaluate(() => {
      // 舞台の svg から辿る (理由は `surfaces` と同じ、 #2962)
      const svg = document.querySelector("svg [data-cdl-role='node-body']")?.closest("svg[data-cdl-stage]");
      let paper: string | null = null;
      let n: Element | null = svg ?? null;
      while (n && !paper) {
        const c = getComputedStyle(n).backgroundColor;
        if (c && c !== "rgba(0, 0, 0, 0)" && !c.includes(", 0)")) paper = c;
        n = n.parentElement;
      }
      return paper;
    });
    expect(paper, `${場所} の紙を測れていない`).not.toBeNull();
    if (paper === null) continue;

    const strokes: Array<{ role: string; paint: Paint }> = [];
    for (const role of ["lane-lifeline", "lane-container"]) {
      const [paint] = await page
        .locator(`svg [data-cdl-role="${role}"]`)
        .first()
        .evaluateAll(readPaints);
      if (paint !== undefined) strokes.push({ role, paint });
    }
    // 測る対象が 0 件だと、 何も確かめずに通る。 どの画面でどの役割が出るかは
    // 上の表で決めているので、 1 件も取れないのは選択子が実装とずれた合図
    expect(strokes.length, `${場所} で補助線を 1 つも測れていない (選択子が実装とずれた)`).toBeGreaterThan(0);

    const ground = parseColor(paper);
    expect(ground, `${場所} の紙の色を読めていない`).not.toBeNull();
    if (ground === null) continue;
    for (const { role, paint } of strokes) {
      // **薄さは色の alpha だけではない**。色自身の alpha、`stroke-opacity`、要素と祖先の
      // `opacity` の 3 つが効く。祖先は documentElement 自身も含め、合成の式は helper が持つ。
      const frame = effectivePaint({ ...paint, fill: "none" }, ground.rgb).frame;
      expect(frame, `${場所} の ${role} の線を測れていない`).not.toBeNull();
      if (frame === null) continue;
      const 対比 = colorContrast(frame, ground.rgb);
      const opacity = paint.strokeOpacity * paint.opacity;
      expect(
        対比,
        `${場所} の ${role} が紙に溶ける (宣言 ${paint.stroke} / opacity ${opacity.toFixed(2)} / 重ねた後の対比 ${対比.toFixed(2)})`,
      ).toBeGreaterThanOrEqual(3);
    }
  }
});

test("明るい画面は変えていない", async ({ page }) => {
  // 変更は暗い画面に限った。 明るい側を巻き込んでいないことを直接見る。
  //
  // **色を literal で固定しない**。 固定すると将来の正当な配色更新まで落ちる。
  // 「面が分かれて見えるか」 と「その上の文字が読めるか」 の不変条件で見る。
  await 箱と矢印を開く(page, 2200);
  const s = await surfaces(page);
  expect(s.紙, "明るい画面の紙を測れていない").not.toBeNull();

  // 明るい画面は全体が明るいので、 面の段差は小さくても輪郭線が効く。 段差ではなく
  // 「紙が明るい側にある」 ことと「箱の上の文字が読める」 ことを見る
  expect(Lstar(s.紙!), "明るい画面の紙が暗くなっている").toBeGreaterThan(80);
  expect(Lstar(s.箱!), "明るい画面の箱が暗くなっている").toBeGreaterThan(80);
  expect(contrast(s.箱!, s.文字!), "明るい画面で箱の中の文字が読めない").toBeGreaterThanOrEqual(4.61);
  expect(contrast(s.箱!, s.枠!), "明るい画面で箱の枠が見えない").toBeGreaterThanOrEqual(3);
});
