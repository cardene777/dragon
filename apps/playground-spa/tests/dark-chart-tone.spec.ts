import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

/**
 * dark の図の tone を固定する (#383)。
 *
 * 2 つを見る。
 *
 * 1. 暗い画面で色が明側から入れ替わること。 `--dragon-edge-tone` の 6 色は明色紙に合わせて
 *    調律されており、 `html.dark` の上書きが無い間は dark でもそのまま使われていた (実測 =
 *    `chart-line-demo` に `#0060a5` / `#1b6288` / `#006a53` / `#006c33`)。 当時は青系が残って
 *    いないかで見ていたが、配色を明暗 2 種に作り直した後は明暗で値が変わるかを見る。
 * 2. tone が **実際に描かれている背景** に対して読めること。 色相だけ見ると「暖色だが背景に
 *    埋もれる」 形を通す。
 *
 * 2 の背景は宣言値ではなく実測で取る。 `--cdl-node-fill` の宣言値で測っていた間、 実際には
 * 別 selector の `#2a1f14` と変数側の cream が同じ図に混在し、 cream 側の tone が 1.87 まで
 * 落ちていた (codex review Round 1 / Round 2 の指摘)。
 */

/** 図の id。 tone を持つ kind を全て並べる。 */
const IDS = [
  "chart-line-demo",
  "chart-pie-demo",
  "funnel-demo",
  "gantt-demo",
  "journey-demo",
  "quad-demo",
  "tree-demo",
  "mind-demo",
];

/** 実効色を HSV に直して色相を返す。 彩度が低い色 (灰) は色相を持たない。 */
const huesOf = (page: Page, id: string) =>
  page.evaluate((d) => {
    const root = document.querySelector(`[data-cdl-diagram="${d}"]`);
    if (!root) return null;
    const out: Array<{ hue: number; color: string }> = [];
    for (const el of Array.from(
      root.querySelectorAll("path, rect, circle, line, polyline, polygon"),
    )) {
      // `<defs>` の marker は定義であって描画ではない。 含めると「実際には出ていない色」 で
      // 前提が成立してしまう (codex review Round 1 の指摘)。
      if (el.closest("defs")) continue;
      const cs = getComputedStyle(el);
      // `fill="url(#id)"` は `<defs>` の gradient を指す。 stop を辿らないと、 定義側に残った
      // 色が検査から漏れる (codex review Round 3 の指摘 = tree の根の下端に青が残っていた)。
      const vals: string[] = [];
      for (const raw of [cs.fill, cs.stroke]) {
        const u = /^url\(["']?#([^"')]+)["']?\)/.exec(raw ?? "");
        if (!u) {
          vals.push(raw);
          continue;
        }
        // 必須の群。 一致した以上必ず取れる
        const id = u[1];
        if (id === undefined) continue;
        const def = document.getElementById(id);
        if (!def) continue;
        for (const st of Array.from(def.querySelectorAll("stop"))) {
          vals.push(getComputedStyle(st).stopColor);
        }
      }
      for (const v of vals) {
        const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v ?? "");
        if (!m) continue;
        const [r, g, b] = [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (max === 0 || (max - min) / max < 0.25) continue;
        let h = 0;
        if (max === r) h = ((g - b) / (max - min)) % 6;
        else if (max === g) h = (b - r) / (max - min) + 2;
        else h = (r - g) / (max - min) + 4;
        out.push({ hue: (((h * 60) % 360) + 360) % 360, color: v });
      }
    }
    return out;
  }, id);

/**
 * tone を持つ要素ごとに、 **実際に後ろに描かれている色** との対比を測る。
 *
 * 背景は `elementsFromPoint` で後ろの要素を取り、 `fill-opacity` / `opacity` を合成して求める。
 * `fill` だけ見ると淡い塗りを不透明として拾い、 同色に見える偽の 1.00 が出る (実測)。
 */
const contrastsOf = async (page: Page, id: string) => {
  const root = page.locator(`[data-cdl-diagram="${id}"]`);
  if ((await root.count()) === 0) return null;
  await root.scrollIntoViewIfNeeded();
  return page.evaluate((d) => {
    const root = document.querySelector(`[data-cdl-diagram="${d}"]`);
    if (!root) return null;
    const cs0 = getComputedStyle(root);
    // 上書きが無ければ cdl 側の fallback がそのまま出る。 その値で照合しないと明色で 0 件になる。
    const TONE_DEF: Record<string, string> = {
      accent: "#2d6a8f",
      teal: "#2f8770",
      success: "#4ea36a",
      error: "#c15a4a",
      warning: "#a67a2e",
      info: "#5a8ec1",
    };
    const CHART_DEF = ["#4338ca", "#0d9488", "#f59e0b", "#be185d", "#4d7c0f", "#0369a1"];
    const parse = (v: string): [number, number, number, number] | null => {
      const g = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(v ?? "");
      if (g)
        return [Number(g[1]), Number(g[2]), Number(g[3]), g[4] === undefined ? 1 : Number(g[4])];
      const h = /^#([0-9a-f]{6})$/i.exec(v ?? "");
      // 必須の群。 一致した以上必ず取れる
      if (h?.[1] !== undefined) {
        const n = parseInt(h[1], 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
      }
      return null;
    };
    const tones = Object.keys(TONE_DEF).flatMap((t) => {
      // 既定の表は `TONE_DEF` の key で回すので必ず引ける
      const 既定 = TONE_DEF[t];
      const v = cs0.getPropertyValue(`--cdl-tone-${t}`).trim().toLowerCase() || 既定;
      return v === undefined ? [] : [v];
    });
    const chartTones = CHART_DEF.map(
      (既定, index) =>
        cs0
          .getPropertyValue(`--cdl-chart-${index + 1}`)
          .trim()
          .toLowerCase() || 既定,
    );
    const toneRgb = [...tones, ...chartTones].map(parse).filter(Boolean) as Array<
      [number, number, number, number]
    >;
    const near = (a: [number, number, number], b: [number, number, number]) =>
      Math.abs(a[0] - b[0]) < 3 && Math.abs(a[1] - b[1]) < 3 && Math.abs(a[2] - b[2]) < 3;
    const isTone = (c: [number, number, number]) =>
      toneRgb.some((t) => near([t[0], t[1], t[2]], c));
    const lin = (c: number) => {
      const x = c / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    const lum = (c: [number, number, number]) =>
      0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const contrast = (a: [number, number, number], b: [number, number, number]) => {
      const la = lum(a);
      const lb = lum(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };

    /** 祖先まで遡って `opacity` を掛け合わせる。 自分の値だけ見ると group 側の薄さが落ちる。 */
    const chainOpacity = (el: Element): number => {
      let a = 1;
      for (let n: Element | null = el; n && n !== root.parentElement; n = n.parentElement) {
        const v = getComputedStyle(n).opacity;
        a *= Number(v === "" ? 1 : v);
      }
      return a;
    };
    /**
     * 意図して淡く敷く飾り。 role と属性を名指しで除く。
     *
     * 「不透明度が低いものは全部除く」 にはしない。 それでは薄く描かれた本体まで見逃す
     * (codex review Round 3 の指摘)。 枠線のように意味を持つ側は除かない。
     */
    const DECOR: Record<string, readonly string[]> = {
      "quadrant-bg": ["fill"],
      "journey-band": ["fill"],
      "journey-line-glow": ["stroke"],
      "journey-chip": ["fill"],
    };

    const out: Array<{
      tag: string;
      role: string;
      prop: string;
      color: string;
      bg: string;
      c: number;
    }> = [];
    const 測れなかった: string[] = [];
    // 図の題も数える (#2749)。 見るのは描かれた色の対比なので、題の色も同じだけ対比が要る
    for (const el of Array.from(
      root.querySelectorAll("path, rect, circle, line, polyline, polygon, text, ellipse"),
    )) {
      if (el.closest("defs")) continue;
      const cs = getComputedStyle(el);
      const role = el.getAttribute("data-cdl-role") ?? "";
      for (const prop of ["fill", "stroke"] as const) {
        if (DECOR[role]?.includes(prop)) continue;
        // `url(#id)` は gradient の定義を指す。 stop を辿って実際に出る色で測る。
        const u = /^url\(["']?#([^"')]+)["']?\)/.exec(cs[prop] ?? "");
        const raws: string[] = [];
        if (u?.[1] !== undefined) {
          const def = document.getElementById(u[1]);
          for (const st of Array.from(def?.querySelectorAll("stop") ?? [])) {
            raws.push(getComputedStyle(st).stopColor);
          }
        } else {
          raws.push(cs[prop]);
        }
        for (const raw of raws) {
          const c = parse(raw);
          if (!c || c[3] === 0) continue;
          const rgb: [number, number, number] = [c[0], c[1], c[2]];
          if (!isTone(rgb)) continue;
          // 前景も不透明度を含めて実効色にする。 生の色で測ると、 薄く描かれた要素の対比を
          // 実描画より大幅に高く見積もる (codex review Round 3 の指摘)。
          const po = prop === "fill" ? cs.fillOpacity : cs.strokeOpacity;
          const alpha = c[3] * Number(po === "" ? 1 : po) * chainOpacity(el);
          if (alpha < 0.05) continue;
          // 一覧で図が画面外に在っても elementsFromPoint が空にならないよう、測る要素自身を画面へ送る。
          // SVG の中が画面より広い時は根だけを送っても端の要素が外に残るため、候補ごとに行う。
          el.scrollIntoView({ block: "center", inline: "center" });
          const bb = el.getBoundingClientRect();
          // 描かれていない要素は tone の測定対象に数えない。
          if (bb.width === 0 && bb.height === 0) continue;
          const stack = document.elementsFromPoint(bb.left + bb.width / 2, bb.top + bb.height / 2);
          if (stack.length === 0) {
            測れなかった.push(`${el.tagName}/${role || "-"} ${prop}: 画面外のまま`);
            continue;
          }
          const i = stack.indexOf(el);
          // 線と輪の形は外接矩形の中心に要素自身が無い。要素を拾えない時も、中心に在る層を
          // 背景として使えば実際に線や輪が載る面を測れる。
          const behind = i >= 0 ? stack.slice(i + 1) : stack;

          const layers: Array<{ c: [number, number, number]; a: number }> = [];
          let selfColored = false;
          for (const b of behind) {
            if (b === el) continue;
            const bcs = getComputedStyle(b);
            const o = Number(bcs.opacity === "" ? 1 : bcs.opacity);
            const f = bcs.fill !== "none" ? parse(bcs.fill) : null;
            if (f) {
              const a = f[3] * Number(bcs.fillOpacity === "" ? 1 : bcs.fillOpacity) * o;
              if (a > 0.01) {
                // 象限の 6〜9% の色面のような薄い層は、同じ生色でも実際には背景色に近い。
                // 接合点と枝線のように同色面へ重なる時だけ、対比を持たない飾りとして除く。
                if (a > 0.99 && near([f[0], f[1], f[2]], rgb)) selfColored = true;
                layers.push({ c: [f[0], f[1], f[2]], a });
              }
              if (a > 0.99) break;
            }
            const s = bcs.stroke !== "none" ? parse(bcs.stroke) : null;
            if (s && near([s[0], s[1], s[2]], rgb)) selfColored = true;
            const bgc = parse(bcs.backgroundColor);
            if (bgc && bgc[3] * o > 0.01) {
              layers.push({ c: [bgc[0], bgc[1], bgc[2]], a: bgc[3] * o });
              if (bgc[3] * o > 0.99) break;
            }
          }
          if (layers.length === 0) {
            測れなかった.push(`${el.tagName}/${role || "-"} ${prop}: 背景を拾えない`);
            continue;
          }
          // 自分と同じ色の図形の上に乗る飾り (枝線の上の接合点等) は対比を持ちようがない。
          // 明色でも同じ形で 1.00 になるので、 dark 固有の劣化ではない。
          if (selfColored) continue;
          // 3 つ組は添字で回さず 1 つずつ書く。 添字で回すと組の要素が `undefined` を
          // 含む型になり、`as` で潰すしかなくなる
          const 重ねる = (
            c: [number, number, number],
            a: number,
            下: [number, number, number],
          ): [number, number, number] => [
            Math.round(c[0] * a + 下[0] * (1 - a)),
            Math.round(c[1] * a + 下[1] * (1 - a)),
            Math.round(c[2] * a + 下[2] * (1 - a)),
          ];
          const 最下 = layers[layers.length - 1];
          // `layers.length === 0` は上で弾いているので必ず引ける
          if (最下 === undefined) continue;
          let acc = 最下.c;
          for (let k = layers.length - 2; k >= 0; k--) {
            const l = layers[k];
            if (l === undefined) continue;
            acc = 重ねる(l.c, l.a, acc);
          }
          const eff = 重ねる(rgb, alpha, acc);
          out.push({
            tag: el.tagName,
            role,
            prop,
            color: `rgb(${eff.join(",")})`,
            bg: `rgb(${acc.join(",")})`,
            c: contrast(eff, acc),
          });
        }
      }
    }
    return { rows: out, 測れなかった };
  }, id);
};

/** 図を id で名指しして開く。 */
async function open(page: Page, id: string): Promise<void> {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await 一覧の行(page, id).click();
  await page.waitForSelector(`[data-cdl-diagram="${id}"]`, { timeout: 15000 });
}

/**
 * 明暗で同じ値でよい色。
 *
 * 紙に依らない中間色がここに入る。 一覧に載っていない色が明暗の両方に現れたら、
 * 上書きが届いていないとみなす。 **増やす時は理由を書く** = 安易に足すと検査が空洞化する。
 */
const 明暗で共有してよい色 = new Set<string>([
  // 現状は該当なし。 図の色はすべて変数から取るため明暗で入れ替わる。
]);

test.describe("dark の図の tone (#383)", () => {
  /**
   * 暗い画面で色が入れ替わること。
   *
   * かつては「青系が残っていないこと」 で見ていた。 当時の配色は暖色一色で、 青が出るのは
   * 上書きが効いていない証拠になったため (#383)。 配色を明暗 2 種に作り直した今は青も紫も
   * 正規の色なので、 色相ではなく **明暗で値が変わること** を直接見る。
   */
  for (const id of IDS) {
    test(`${id} の色が明暗で入れ替わる`, async ({ page }) => {
      await open(page, id);
      const light = await huesOf(page, id);
      expect(light, `${id} が描かれていない`).not.toBeNull();
      expect(light!.length, `${id} に色が 1 件も無い`).toBeGreaterThan(0);

      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await page.waitForTimeout(600);
      const dark = await huesOf(page, id);
      expect(dark!.length, `${id} の dark に色が 1 件も無い`).toBeGreaterThan(0);
      // **明側の色が 1 つも残らないことを求める**。 「1 色でも変われば」 や「1 つ以上
      // 入れ替われば」 にすると、 6 色のうち 5 色が明色のまま残っても通る (review 指摘 2 回)。
      //
      // 明暗で同じ値でよい色は下の一覧に明示する。 一覧に無い明側の色が暗い画面にも
      // 現れていたら、 その色は上書きが届いていない。
      const 明 = new Set(light!.map((x) => x.color));
      const 暗 = new Set(dark!.map((x) => x.color));

      const 残った = [...暗].filter((c) => 明.has(c) && !明暗で共有してよい色.has(c));
      expect(残った, `${id} の暗い画面に明側の色が残っている`).toEqual([]);

      // 上書きが届いた証拠として、 暗側にしか無い色があることも見る
      // (全色が共有一覧に載っていると上の検査が空振りするため)。
      const 暗だけ = [...暗].filter((c) => !明.has(c));
      expect(暗だけ.length, `${id} の暗側に新しい色が出ていない`).toBeGreaterThan(0);
    });
  }

  /**
   * 実背景に対する対比。 WCAG の非文字要素の下限 3.0 を全 kind で満たすことを見る。
   *
   * 宣言値 (`--cdl-node-fill`) で測っていた間は 6 色とも 4.61 以上に見えていたが、 実描画では
   * 2.30-2.60 しか無かった (codex review Round 1)。 更に kind 内の小さい面 (`#f4f6fb`) と
   * 変数側に残っていた cream (`#f5ecd0`) の上では 1.87-2.14 だった (Round 2)。
   */
  for (const id of IDS) {
    test(`${id} の tone が実背景に対して読める`, async ({ page }) => {
      await open(page, id);
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await page.waitForTimeout(600);

      const result = await contrastsOf(page, id);
      expect(result, `${id} が描かれていない`).not.toBeNull();
      expect(result!.測れなかった, `${id} に画面外のまま測らなかった tone がある`).toEqual([]);
      expect(result!.rows.length, `${id} の tone を 1 件も測っていない`).toBeGreaterThan(0);
      const bad = result!.rows
        .filter((row) => row.c < 3)
        .map(
          (row) =>
            `${row.c.toFixed(2)} ${row.tag}/${row.role || "-"} ${row.prop}=${row.color} on ${row.bg}`,
        );
      expect(bad, `${id} の dark で背景に埋もれる tone`).toEqual([]);
    });
  }

  test("6 tone が全て定義されている", async ({ page }) => {
    // 未定義なら cdl の fallback (青系) に落ちる。
    await open(page, "chart-line-demo");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(600);
    const tones = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('[data-cdl-diagram="chart-line-demo"]')!);
      return ["accent", "teal", "success", "error", "warning", "info"].map((t) =>
        cs.getPropertyValue(`--cdl-tone-${t}`).trim(),
      );
    });
    expect(tones.filter((t) => t !== "").length, `tone = ${JSON.stringify(tones)}`).toBe(6);
  });
});
