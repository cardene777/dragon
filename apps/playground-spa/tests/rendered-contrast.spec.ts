import { test, expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import {
  requiredRatio,
  shoot,
  measure,
  type Box,
  type Measured,
} from "./helpers/pixel-contrast";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * edge label の **描画結果** の対比を実ブラウザで測る (#977)。
 *
 * `packages/dragon/test/edge-label-contrast.test.ts` (cardene777/cdl#388) は **宣言された配色**
 * を見る。 実際に画面に出る対比は半透明の重なり / 祖先の `opacity` / host 側の背景 / `@media` /
 * 状態依存 selector に依存し、 それらは実ブラウザでしか決まらない。
 *
 * 当初 jsdom に代表 DOM を組み立てて再現しようとしたが、 review で 6 round 連続して「代表 DOM と
 * 実ページの差」 を指摘され続けた。 合成 DOM は実ページと等価にならない。
 *
 * ## 測り方 = 画素を読む
 *
 * 計算で合成しない。 **文字を隠した画面と出した画面を撮って画素を比べる**。
 *
 *   背景色 = 文字を隠した画面の、 その画素の色
 *   文字色 = 文字を出した画面の、 **最も背景から離れた** 画素の色
 *
 * 「最も離れた画素」 を採るのは、 縁の画素が anti-alias で背景と混ざるため。 字の芯にあたる画素が
 * その文字の実効色になる。
 *
 * この形なら半透明の重なりも祖先の opacity も host の背景も、 合成の順序を自分で組み立てずに
 * 実際の値が入る。
 */

const MODES = ["light", "dark"] as const;

/**
 * 測る見本。 2 件で性質を分ける。
 *
 *   `pattern-passthrough` = main + sub の 2 行を持つ (sub 行の対比を測るため)
 *   `oauth-flow` = label 付きの edge が 8 本 (tone の種類と本数を稼ぐため)
 *
 * 1 件だけだと label が 2 個しか無く、 主題の配色のごく一部しか通らない。
 */
const TARGETS = [
  // main 22px + sub 19px の 2 行。 sub 行の対比を測る唯一の経路なので件数を固定する。
  { slug: "patterns", id: "pattern-passthrough", expectedLabels: 2, expectedDeclaredPx: [22, 19] },
  { slug: "cookbook", id: "oauth-flow", expectedLabels: 8, expectedDeclaredPx: [22] },
] as const;

type Label = { key: string; box: Box; px: number; weight: number; text: string; declaredPx: number };

/**
 * 明暗を当てた状態で見本を開く。
 *
 * 明暗は `<html>` の class で決まる。 図の色は `cdl-theme.css` が `var(--d-*)` で参照し、
 * その変数を `globals.css` が `html.dark` で差し替えるので、 class を切り替えるだけで
 * 図まで追随する。
 *
 * app の切替 UI を経由しないのは、 本 test が見たいのが「配色が実際に描かれた時の対比」
 * であって、 切替の操作ではないため。
 */
async function open(page: Page, target: { slug: string; id: string }, mode: string): Promise<void> {
  await page.goto(`/catalog/${target.slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 20000 });
  await page.locator(".catalog-list-item").filter({ hasText: target.id }).first().click();
  await page.waitForSelector(`[data-cdl-diagram="${target.id}"]`, { timeout: 20000 });
  await page.evaluate((m) => {
    document.documentElement.classList.toggle("dark", m === "dark");
  }, mode);
  // 当たっていないと明暗 2 通りが同じ画面になる。
  await page.waitForFunction(
    (m) => document.documentElement.classList.contains("dark") === (m === "dark"),
    mode,
    { timeout: 20000 },
  );
  await page.evaluate(() => document.fonts.ready);
  // 明暗の切替に transition が掛かるので落ち着くまで待つ。
  await page.waitForTimeout(600);
}

/** 撮り直す回数。 動いている瞬間に当たっても、 次の機会を待てば測れる (#1072)。 */
const STILL_ATTEMPTS = 5;

/**
 * その label の領域が動いていない瞬間を捉えて、 背景と文字を撮る (#1072)。
 *
 * 隠した状態で 2 度撮り、 差があれば animation 等で画面が動いており、 差分を文字と見なせない。
 *
 * **見本は動き続ける**。 `oauth-flow` は `animation:` を持ち、 描画側は
 * `requestAnimationFrame` の loop で段を進める。 「止まるまで待つ」 形は成立しない
 * (実測 = `pattern-passthrough` も 20 秒待っても止まらない)。
 *
 * 動くのは図の一部で、 label の領域は多くの瞬間で静止している。 だから **測れる瞬間まで
 * 撮り直す**。 1 回で諦めると、 負荷が高い時にだけその label が測れず、 件数だけが 1 少なく
 * なって落ちる (実測 = 全件実行 3 回のうち 2 回、 落ちる主題は毎回違う)。
 *
 * 撮り直しても駄目なら `null` を返す = 呼出側が理由付きで失敗させる。 動いた画面の色を
 * 対比として報告しない。
 */
async function shootWhenStill(
  page: Page,
  id: string,
  index: number,
  box: Box,
): Promise<{ bg: PNG; fg: PNG } | null> {
  for (let attempt = 0; attempt < STILL_ATTEMPTS; attempt++) {
    // その label だけを隠す。 撮る範囲も同じなので、 差分は必ずその文字による。
    await setLabelsHidden(page, id, true, index);
    const bg = await shoot(page, box);
    const bg2 = await shoot(page, box);
    await setLabelsHidden(page, id, false, index);
    const fg = await shoot(page, box);
    if (measure(bg2, bg).kind !== "ok") return { bg, fg };
    // 動いていた。 次の機会を待つ
    await page.waitForTimeout(200);
  }
  return null;
}

/** 描かれている edge label の位置と文字仕様を集める。 */
async function collectLabels(page: Page, id: string): Promise<Label[]> {
  return page.evaluate((id) => {
    const out: Array<{ key: string; box: Box; px: number; declaredPx: number; weight: number; text: string }> = [];
    const els = document.querySelectorAll(`[data-cdl-diagram="${id}"] [data-cdl-role="edge-label"]`);
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const cs = getComputedStyle(el);
      // `getComputedStyle().fontSize` は SVG の **user 単位**。 `viewBox` で縮小されるので
      // 画面上の大きさとは別 (実測 = 宣言 22px が倍率 0.29-0.38 で 6.4-8.5 CSS px)。
      // WCAG の large text は画面上の大きさで決まるので、 倍率を掛けてから閾値を決める。
      const declared = parseFloat(cs.fontSize);
      const ctm = (el as SVGGraphicsElement).getScreenCTM();
      const scaleY = ctm === null ? 1 : Math.hypot(ctm.c, ctm.d);
      out.push({
        key: `${el.closest("[data-cdl-edge-label-for]")?.getAttribute("data-cdl-edge-label-for") ?? "?"}#${i}`,
        box: { x: r.x, y: r.y, width: r.width, height: r.height },
        px: declared * scaleY,
        declaredPx: declared,
        weight: Number.parseInt(cs.fontWeight, 10) || 400,
        text: (el.textContent ?? "").slice(0, 20),
      });
    });
    return out;
  }, id);
}

/**
 * 文字を隠す / 戻す。 隠した画面が背景になる。
 *
 * `index` を渡すとその 1 つだけを隠す。 全部隠すと、 重なった別 label が「背景」 に含まれたり
 * 含まれなかったりして、 差分を文字と誤認する経路が残る。
 */
async function setLabelsHidden(page: Page, id: string, hidden: boolean, index?: number): Promise<void> {
  await page.evaluate(([id, h, only]) => {
    document
      .querySelectorAll(`[data-cdl-diagram="${id}"] [data-cdl-role="edge-label"]`)
      .forEach((el, i) => {
        if (only !== undefined && i !== only) return;
        (el as SVGElement).style.visibility = h ? "hidden" : "";
      });
  }, [id, hidden, index] as const);
}

/** 1 つの label の判定。 変異試験も本番も同じ経路を通す。 */
function judge(label: Label, m: Measured): string | null {
  const need = requiredRatio(label.px, label.weight);
  const where = `${label.key} ("${label.text}") 画面 ${label.px.toFixed(1)}px (宣言 ${label.declaredPx}px) / ${label.weight}`;
  if (m.kind === "invisible") return `${where} の文字が背景と同じ色で描かれている`;
  if (m.kind === "unmeasurable") return `${where} を測れなかった (${m.reason})`;
  if (m.ratio < need) {
    return `${where} は ${need}:1 が要るが ${m.ratio.toFixed(2)}:1 ` +
      `(文字 rgb(${m.fg.join(",")}) / 背景 rgb(${m.bg.join(",")}))`;
  }
  return null;
}

/**
 * 画素を細かく撮る。
 *
 * label の文字は画面上 6.4-9.3 CSS px しかなく、 等倍で撮ると **どの画素も完全には字で覆われて
 * いない** (実測 = 指定 rgb(134,86,49) が rgb(145,104,72) として出た)。 その値で判定すると
 * anti-alias の混色を測ることになり、 WCAG が見る「指定された色」 より厳しくなる。
 *
 * 3 倍で撮ると 7 CSS px の字が 21 device px になり、 字の芯に完全に覆われた画素が現れる。
 * 閾値の判定に使う大きさは CSS px のままなので、 large text の判定は変わらない。
 */
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });

/**
 * 宣言の値から **明暗で変わらない固定の色** だけを取り出す。
 *
 * 判定も切り出しもブラウザに任せる。 こちらで数え上げるものを 4 度減らした。
 *
 *   1. 色の名前の一覧 (`tomato` / `rebeccapurple` …) → `CSS.supports` に聞く
 *   2. 色関数の種類 (`rgb` / `hsl` / `lab` / `color()` …) → 同上
 *   3. 色を書ける property の一覧 (`border-left` が漏れた) → 全ての宣言を見る
 *   4. 環境で変わる名前の一覧 (`background` が漏れた) → 明暗を切り替えて動くかで見る
 *
 * 値は **空白で割らない**。 割ると `rgb(255 0 0)` が 3 つに散り、 色として渡らない
 * (review で実測)。 括弧の対応を数えて関数を 1 つの塊のまま取り出す。
 *
 * 残さないもの。
 *
 *   - 色として解決しない語 (`solid` / `1px` / `600` 等)。 `CSS.supports` が弾く
 *     (`style.color` への代入だと `600` が 16 進数として通る、 実測)
 *   - `var()` / `color-mix()` の塊 (明暗で変わる)。 **中には降りない** =
 *     降りると `color-mix(in srgb, red 40%, var(--d-bg))` の `red` を拾う
 *   - `url(...)` の中身 (画像の場所であって色ではない)
 *   - 明暗の設定で値が動く語 (system color 等)。 環境依存なので固定色ではない
 *   - 黒 (影に使う。 明暗に依らないので固定でよい)
 *   - 文脈で決まる語 (`transparent` / `currentColor` / `inherit` 等)
 */
async function 固定色を取り出す(page: Page, 宣言: string[]): Promise<string[]> {
  if (宣言.length === 0) return [];

  return await page.evaluate((vs) => {
    /**
     * 値を token に割る。 **関数の中にも降りる**。
     *
     * 降りないと `linear-gradient(red, var(--d-bg))` の `red` を見逃す。 降りるので
     * `var()` / `color-mix()` / `url()` だけは名指しで捨て、 中を見ない。
     *
     * 引用符の中は跨がない = `url("a,)b")` の `)` で切ると内側を誤って拾う。
     */
    const 割る = (値: string): string[] => {
      const out: string[] = [];
      let i = 0;
      const 語を足す = (t: string): void => {
        const 語 = t.trim();
        if (語) out.push(語);
      };
      while (i < 値.length) {
        const c = 値[i]!;
        if (/[\s,;]/.test(c)) {
          i++;
          continue;
        }
        if (c === '"' || c === "'") {
          // 文字列は丸ごと飛ばす (色ではない)
          const 閉じ = 値.indexOf(c, i + 1);
          i = 閉じ === -1 ? 値.length : 閉じ + 1;
          continue;
        }
        const m = /^([a-z-]+)\(/i.exec(値.slice(i));
        if (m) {
          // 括弧の対応を数えて関数の範囲を取る。 引用符の中の括弧は数えない
          let 深さ = 0;
          let j = i + m[0].length - 1;
          let 引用: string | null = null;
          for (; j < 値.length; j++) {
            const d = 値[j]!;
            if (引用) {
              if (d === 引用) 引用 = null;
              continue;
            }
            if (d === '"' || d === "'")引用 = d;
            else if (d === "(") 深さ++;
            else if (d === ")") {
              深さ--;
              if (深さ === 0) {
                j++;
                break;
              }
            }
          }
          const 塊 = 値.slice(i, j);
          const 名 = m[1]!.toLowerCase();
          if (名 === "var" || 名 === "url") {
            // 明暗で変わる / 画像の場所。 中には降りない
          } else if (名 === "color-mix") {
            // **中に `var()` があるかで分ける**。 無ければ固定色なので塊のまま拾う
            // (`color-mix(in srgb, red, blue)` は明暗で変わらない)。 あれば明暗で
            // 変わるので捨てる。 どちらの場合も中には降りない = 降りると
            // `color-mix(in srgb, red 40%, var(--d-bg))` の `red` を拾う
            if (!/\bvar\(/i.test(塊)) 語を足す(塊);
          } else if (/^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)$/.test(名)) {
            語を足す(塊); // 色関数そのもの
          } else if (
            // **色を引数に取る関数だけ中を走査する**。 任意の関数に降りると
            // `counter(blue)` / `attr(green)` の名前を色として拾う (review 指摘)。
            /^(linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient|drop-shadow|cross-fade|image-set|light-dark)$/.test(
              名,
            )
          ) {
            割る(塊.slice(m[0].length, -1)).forEach(語を足す);
          }
          i = j;
          continue;
        }
        let j = i;
        while (j < 値.length && !/[\s,;]/.test(値[j]!) && 値[j] !== "(") j++;
        語を足す(値.slice(i, j));
        i = j === i ? i + 1 : j;
      }
      return out;
    };

    /**
     * 色を RGBA に正規化する。
     *
     * **文字列で比べない**。 `lab()` / `oklch()` / `color()` は解決後も関数の形を保つため、
     * `rgb(...)` だけを見ると新しい色空間の固定色を取りこぼす (review で指摘)。
     * Canvas に 1 画素描けば、 どの色空間で書かれていても同じ RGBA になる。
     */
    const cv = document.createElement("canvas");
    cv.width = 1;
    cv.height = 1;
    const ctx = cv.getContext("2d")!;
    const 正規化 = (v: string): [number, number, number] | null => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      const 前 = ctx.fillStyle;
      ctx.fillStyle = v;
      if (ctx.fillStyle === 前 && !/^#0{3,8}$/i.test(v.trim())) {
        // 受理されなければ既定値のまま = 色ではない
        if (!CSS.supports("color", v)) return null;
      }
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0]!, d[1]!, d[2]!];
    };

    /** 明暗 2 通りで解決させ、 値が動く語 (環境依存) を見分ける。 */
    const 測る = (scheme: string, ws: string[]): Record<string, string> => {
      const e = document.createElement("span");
      e.style.colorScheme = scheme;
      document.body.appendChild(e);
      const out: Record<string, string> = {};
      for (const w of ws) {
        e.style.color = "";
        e.style.color = w;
        out[w] = getComputedStyle(e).color;
      }
      e.remove();
      return out;
    };

    const 候補 = [...new Set(vs.flatMap((v) => 割る(v)))]
      .map((w) => w.replace(/%23/g, "#"))
      .filter((w) => !/^(transparent|currentcolor|inherit|initial|unset|revert|none)$/i.test(w))
      .filter((w) => CSS.supports("color", w));

    const 明 = 測る("light", 候補);
    const 暗 = 測る("dark", 候補);

    const out: string[] = [];
    for (const 語 of 候補) {
      if (暗[語] !== 明[語]) continue; // 環境依存なので固定色ではない
      const rgb = 正規化(語);
      if (!rgb) continue;
      if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) continue; // 黒は影に使うので許す
      out.push(語);
    }
    return out;
  }, 宣言);
}

test.describe("edge label の描画対比 (#977)", () => {
  test.describe.configure({ timeout: 120000 });

  for (const mode of MODES) {
      test(`${mode} の edge label が WCAG AA を満たす`, async ({ page }) => {
        const failures: string[] = [];
        let measured = 0;
        let worst = Infinity;

        for (const target of TARGETS) {
          await open(page, target, mode);
          const labels = await collectLabels(page, target.id);
          // **target ごとに** 件数を固定する。 合計だけだと、 `pattern-passthrough` の sub が
          // 消えて `oauth-flow` が 1 件増える形で合計が変わらず、 sub 行の検査を失う。
          expect(labels.length, `${target.id} の edge label 数`).toBe(target.expectedLabels);
          expect(
            [...new Set(labels.map((l) => l.declaredPx))].sort((a, b) => b - a),
            `${target.id} の宣言された大きさ`,
          ).toEqual([...target.expectedDeclaredPx]);

          for (let i = 0; i < labels.length; i++) {
            const l = labels[i];
            const shot = await shootWhenStill(page, target.id, i, l.box);
            if (shot === null) {
              failures.push(
                `${target.id}/${l.key} は ${STILL_ATTEMPTS} 回撮り直しても画面が動いており測れない`,
              );
              continue;
            }
            const m = measure(shot.fg, shot.bg);
            if (m.kind === "ok") { measured++; worst = Math.min(worst, m.ratio); }
            const f = judge(l, m);
            if (f !== null) failures.push(`${target.id}/${f}`);
          }
        }

        // **理由を先に出す**。 測れなかった label は必ず `failures` にも理由が入る
        // (測れない 3 経路 = 画面が動いた / 文字が背景と同じ / 芯を特定できない、 のどれも
        // `failures.push` を通る)。 件数を先に照合すると「9 対 10」 だけが出て、 なぜ 1 件
        // 落ちたのかが失敗の文面から消える (#1072 の調査で 2 回とも理由が読めなかった)。
        expect(failures, `${mode} 最小の対比 ${worst.toFixed(2)}:1`).toEqual([]);
        // 1 件も測れていなければ、 0 件の failures は「満たした」 ことを意味しない。
        expect(measured, `${mode} で実際に測れた label 数`).toBe(
          TARGETS.reduce((n, t) => n + t.expectedLabels, 0),
        );
      });
  }

  test("図の配色が明暗を 1 箇所でしか決めていない", async ({ page }) => {
    // 元は「暗色の宣言を持たない主題の一覧」 を照合していた。 主題を廃止したので、
    // その一覧が守っていた前提 (どこで暗色が決まるか) を直接測る形に置き換えた。
    //
    // 図の色は変数の差し替えだけで明暗が決まる。 `cdl-theme.css` に `html.dark` を書くと
    // 決める場所が 2 つになり、 変数を変えても図だけ古い色のまま残る。
    // **図に色を当てる CSS を機械的に集める**。 一覧を手で書くと、 3 つ目の file が
    // 増えた時に漏れる (実測 = `cdl-theme.css` だけ見ていた間、 図の中の操作盤を描く
    // `catalog-widgets.css` に `html.dark` が 160 行残っていた)。
    //
    // 目印は「図の部品に色を当てる selector を持つこと」。 `data-cdl-role` (図の部品) と
    // `.cdl-ip-` (図の中の操作盤) のどちらかを書いている file が対象。
    const styles = fileURLToPath(new URL("../src/styles", import.meta.url));
    // 説明文を先に落としてから目印を探す。 落とさないと「かつて `.cdl-ip-` を使っていた」 と
    // 書いただけの file を拾う (実測 = `catalog-new.css` が説明文だけで対象に入った)。
    //
    // 併せて **目印を持つ規則に色の指定があること** も条件にする。 目印を持つが色を当てない
    // file (`display: none` だけを書く等) は配色の file ではない。
    const 対象 = readdirSync(styles)
      .filter((f) => f.endsWith(".css"))
      .filter((f) => {
        const 規則 = readFileSync(join(styles, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        if (!規則.includes("data-cdl-role") && !規則.includes(".cdl-ip-")) return false;
        // 目印を含む規則の塊を取り出し、 その中に色の指定があるかを見る
        return [...規則.matchAll(/([^{}]*)\{([^{}]*)\}/g)].some(
          ([, sel, body]) =>
            (sel.includes("data-cdl-role") || sel.includes(".cdl-ip-")) &&
            /(^|[;\s])(color|background|background-color|fill|stroke|border-color)\s*:/.test(body),
        );
      })
      .sort();

    // 見つからない = 目印を変えたか、 集め方が壊れている。 空で通ると検査が空振りする。
    expect(対象.length, "図に色を当てる CSS が 1 件も見つからない").toBeGreaterThan(0);

    const 違反: string[] = [];
    for (const 名 of 対象) {
      const css = readFileSync(join(styles, 名), "utf8");
      // 説明文に書くのは構わない (規約そのものを書いてある)。 見るのは規則の側だけ。
      const 規則だけ = css.replace(/\/\*[\s\S]*?\*\//g, "");
      const n = (規則だけ.match(/html\.dark/g) ?? []).length;
      if (n > 0) 違反.push(`${名} に html.dark が ${n} 件`);

      // 色を直に書くと明暗が追随しない。 埋め込み画像の中の色 (`%23`) も同じ。
      //
      // **色かどうかの判定はブラウザに任せる**。 自分で色関数と名前を数え上げると
      // 「また別の書き方が漏れている」 が繰り返し出て収束しない (review 2 巡連続で
      // `hsl()` の黒 / `tomato` / `rebeccapurple` を指摘された)。
      //
      // 値を実際に解決させれば、 色関数の種類も名前の一覧も知らなくてよい。
      // **property を選ばない**。 一覧を持つと漏れる (実測 = `border-left` が抜けていた)。
      // 全ての宣言の値を渡し、 色かどうかはブラウザに判定させる。
      const 宣言 = [...規則だけ.matchAll(/(?:^|[;{])\s*[a-z-]+\s*:\s*([^;{}]*)/gi)].map(
        ([, 値]) => 値,
      );
      const 直書き = await 固定色を取り出す(page, 宣言);
      if (直書き.length > 0) {
        違反.push(`${名} に色の直書きが ${直書き.length} 件 (例 ${直書き.slice(0, 3).join(" / ")})`);
      }
      if (!/var\(--d-/.test(規則だけ)) 違反.push(`${名} が変数を参照していない`);
    }
    expect(違反, "図の配色が明暗を 2 箇所以上で決めている").toEqual([]);
  });

  test("judge の境界と種別 (単体)", () => {
    // `judge` は本番も変異試験も通る唯一の判定。 境界と種別を直接固定する。
    const label = (px: number, weight: number): Label => ({
      key: "k", box: { x: 0, y: 0, width: 1, height: 1 }, px, weight, text: "t", declaredPx: 22,
    });
    const ok = (ratio: number) => ({ kind: "ok" as const, fg: [0, 0, 0] as [number, number, number], bg: [255, 255, 255] as [number, number, number], ratio });

    // 画面上 7px の通常文字 = 4.5:1。 4.499 は落とし、 4.5 は通す。
    expect(judge(label(7, 700), ok(4.499))).not.toBeNull();
    expect(judge(label(7, 700), ok(4.5))).toBeNull();
    // 画面上 19px の太字 = large text の 3:1。 大きさの判定が効いていることを固定する。
    expect(judge(label(19, 700), ok(3.0))).toBeNull();
    expect(judge(label(19, 700), ok(2.999))).not.toBeNull();
    // 種別が判定に出る。
    expect(judge(label(7, 700), { kind: "invisible" })).toContain("同じ色");
    expect(judge(label(7, 700), { kind: "unmeasurable", reason: "理由" })).toContain("測れなかった");
  });

  test("画面上の大きさで閾値を決めている (変異試験)", async ({ page }) => {
    // **`#391` 以前の色を戻すと落ちること**。 この色は実測 3.7:1 前後で、
    //
    //   画面上の大きさ (7-9px) で判定 → 通常文字の 4.5:1 が要る → 落ちる
    //   宣言の大きさ (22px) で判定    → large text の 3:1 で足りる → 通る
    //
    // つまり `declared * scaleY` を `declared` に戻す変異を、 この色でだけ検知できる。
    // 一括で対比を落とす変異 (下の test) は 3:1 も割るので、 両者を区別しない。
    const target = TARGETS[0];
    await open(page, target, "light");
    await page.addStyleTag({
      content: `html body [data-cdl-role="edge-label"] { fill: #a66a3d !important; }`,
    });
    await page.waitForTimeout(300);

    const labels = await collectLabels(page, target.id);
    const failures: string[] = [];
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      await setLabelsHidden(page, target.id, true, i);
      const bg = await shoot(page, l.box);
      await setLabelsHidden(page, target.id, false, i);
      const f = judge(l, measure(await shoot(page, l.box), bg));
      if (f !== null) failures.push(f);
    }
    // 3:1 は超えるが 4.5:1 は割る、 という中間の色であることも同時に固定する。
    expect(failures.length, "旧色が検知されない = 画面上の大きさを見ていない").toBeGreaterThan(0);
    expect(failures.some((f) => /4\.5:1 が要るが 3\./.test(f)), `検知の内容: ${failures.join(" | ")}`).toBe(true);
  });

  test("対比を落とすと検知する (変異試験)", async ({ page }) => {
    // 本 test の存在理由。 実際に閾値を割る配色を当てて、 検知できることを確かめる。
    const target = TARGETS[0];
    await open(page, target, "light");
    const labels = await collectLabels(page, target.id);
    expect(labels.length).toBeGreaterThan(0);

    // 背景に近い灰色を当てる。 pill の背景は白系なので対比が 1.5:1 前後まで落ちる。
    //
    // 主題の CSS も `!important` を使うので、 **主題より詳細度の高い selector** で当てる
    // (`[data-cdl-role="edge-label"]` だけだと主題側が勝って何も変わらない)。
    await page.addStyleTag({
      content: `html body [data-cdl-role="edge-label"] { fill: #e8e8e8 !important; }`,
    });
    await page.waitForTimeout(300);

    const fresh = await collectLabels(page, target.id);
    await setLabelsHidden(page, target.id, true);
    const bgShots = await Promise.all(fresh.map((l) => shoot(page, l.box)));
    await setLabelsHidden(page, target.id, false);
    const fgShots = await Promise.all(fresh.map((l) => shoot(page, l.box)));

    // **本番と同じ `judge` を通す**。 別経路で `Math.min(ratios) < 3` を確かめる形だと、
    // 本番側の判定を壊しても変異試験が通り続ける。
    const failures: string[] = [];
    let ok = 0;
    for (let i = 0; i < fresh.length; i++) {
      const m = measure(fgShots[i], bgShots[i]);
      if (m.kind === "ok") ok++;
      const f = judge(fresh[i], m);
      if (f !== null) failures.push(f);
    }
    expect(ok, "測れた label がある").toBeGreaterThan(0);
    expect(failures.length, "対比を落としたのに検知しない").toBeGreaterThan(0);
    // 「測れなかった」 ではなく「閾値を割った」 として検知していること。
    expect(failures.some((f) => /:1 が要るが/.test(f)), `検知の内容: ${failures.join(" | ")}`).toBe(true);
  });
});
