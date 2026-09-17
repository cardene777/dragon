import { test, expect, type Page } from "@playwright/test";
import { 記法をURLに載せる, 六色の記法 } from "./box-and-edge-figure";

/**
 * GH #889 = edge の tone が線の色に出ることを画面で確かめる。
 *
 * 色は cdl ではなく本 app の CSS が決める (CAR-643 = cdl は形だけ / dragon が見た目)。
 * 以前は theme ごとに 1 色を `!important` で焼き付けていたため、 cdl が tone を渡しても
 * 画面では全 edge が同じ色になっていた。 したがって「cdl の属性」 ではなく
 * 「画面で解決された色」 を測る必要がある。
 *
 * 測るのは 3 つ。
 *   1. 6 tone が別々の色になる (因果の向きが線から読める)
 *   2. 紙に対する対比が WCAG の非文字要素の下限 3:1 以上 (線が薄くて追えない状態にならない)
 *      (以前は文字の基準 4.5 を当てていた。 旧配色の濃さに合わせて厳しい側を採ったもので
 *       線に求められる標準ではない。 見た目の判断は `.pen` に一本化したため標準に戻した。
 *       user 明示指示「いらない・pencil が全て。 デザインに関しては。」)
 *   3. 隣り合う色が見分けられる (ΔE 15 以上、 暗くして同じ明度に揃うと accent と info が潰れる)
 *
 * 紙の色は画面から読む。 catalog は明暗どちらでも cream、 editor は明暗で別なので、
 * 4 通り (catalog / editor × 明 / 暗) を回す。
 */

const TONES = ["accent", "teal", "success", "error", "warning", "info"] as const;

/**
 * 対比の下限。 WCAG が figure などの非文字要素に定める 3:1。
 *
 * 以前は文字の基準 4.5 を当てていたが、 これは旧配色 (暖色一色) の濃さに合わせて
 * 厳しい側を採ったもので、 線に求められる標準ではない。 見た目の判断は
 * `docs/design/app.pen` に一本化したので (user 指示「pencil が全て」)、 ここは
 * 標準そのものに戻す。
 */
const MIN_CONTRAST = 3;
/** 色の見分けの下限。 ΔE 10 未満は並べても判別しづらい。 */
const MIN_DELTA_E = 15;

type Rgb = [number, number, number];

function parseRgb(s: string): Rgb {
  const m = s.match(/\d+(\.\d+)?/g);
  if (!m || m.length < 3) throw new Error(`色として読めない: ${s}`);
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

function linear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126729 * linear(r) + 0.7151522 * linear(g) + 0.072175 * linear(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** stroke-opacity を掛けた後の実際に見える色。 8bit に丸めない。 */
function applyOpacity(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((i) => fg[i]! * alpha + bg[i]! * (1 - alpha)) as Rgb;
}

/**
 * 実効色を 8bit に丸めた時に取り得る 8 通り (各成分の floor / ceil)。
 *
 * 描画側がどちら向きに丸めるかは実装依存で、 丸めの向きで対比と ΔE が 0.7 ほど動く。
 * 判定を境界ちょうどに置くと丸め次第で下回るため、 全組合せの最悪値で見る。
 */
function quantized(v: Rgb): Rgb[] {
  const out: Rgb[] = [];
  for (const bits of [0, 1, 2, 3, 4, 5, 6, 7]) {
    out.push([0, 1, 2].map((i) => ((bits >> i) & 1 ? Math.ceil(v[i]!) : Math.floor(v[i]!))) as Rgb);
  }
  return out;
}

/**
 * sRGB (0-255 の実数) を CIE Lab に変換する。
 *
 * CSS Color 4 の定義通り sRGB -> D65 XYZ -> Bradford で D50 に適応 -> Lab の順で計算する。
 * D65 XYZ をそのまま Lab の式に入れると、 Lab が D50 基準なので白色点がずれて ΔE が 0.7 ほど
 * 動く。 判定を 15 に置いている以上、 この差は無視できない。
 */
function toLab([r, g, b]: Rgb): [number, number, number] {
  const R = linear(r);
  const G = linear(g);
  const B = linear(b);
  // sRGB -> D65 XYZ
  const x65 = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const y65 = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const z65 = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
  // Bradford D65 -> D50
  const x = 1.0479298208405488 * x65 + 0.022946793341019088 * y65 - 0.05019222954313557 * z65;
  const y = 0.029627815688159344 * x65 + 0.990434484573249 * y65 - 0.01707382502938514 * z65;
  const z = -0.009243058152591178 * x65 + 0.015055144896577895 * y65 + 0.7518742899580008 * z65;
  // D50 白色点で正規化して Lab
  const wp = [0.9642956764295677, 1.0, 0.8251046025104602];
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const fx = f(x / wp[0]!);
  const fy = f(y / wp[1]!);
  const fz = f(z / wp[2]!);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function deltaE(a: Rgb, b: Rgb): number {
  const A = toLab(a);
  const B = toLab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

/**
 * 画面に **実際に描かれた** 矢印から、色味ごとの線と矢頭の色を読む (#1709)。
 *
 * 以前は 1 本を複製して色味だけ差し替えていたが、描画エンジンが矢頭の飾りを
 * **使う分だけ** `<defs>` に出すようになったため成立しなくなった (実測 = カタログの画面に
 * 出るのは 2 色ぶんで、複製した色味の矢頭はどこにも無い)。 複製をやめて、その画面が
 * 描いた矢印だけを読む。 6 色すべてを見るのは 六色の記法 を開いたエディタ側が担う。
 *
 * 矢頭は `<defs><marker>` の中にあり矢印の子孫ではないので、`marker-end` から実物を辿る。
 *
 * **矢頭の計算値が `context-stroke` なら線の色に読み替える** (#2141)。 矢頭は参照した線の色を
 * この語で継ぐので、計算値は色にならない。 語の意味は「この矢頭を使う線の色」 そのもの。
 * 閲覧ソフトが実際にその色で塗ったかは計算値に出ないため、`main-route-edge-color.spec.ts` が
 * 描いた画素で確かめる。
 */
async function readToneColors(
  page: Page,
): Promise<{ paper: string; tones: Record<string, { stroke: string; head: string }> }> {
  const 読めた = await page.evaluate(() => {
    const 先頭 = document.querySelector("[data-cdl-edge]");
    if (!先頭) throw new Error("edge が 1 本も無い");
    let el: HTMLElement | null = 先頭.closest("svg")?.parentElement ?? null;
    let paper: string | null = null;
    while (el && !paper) {
      const c = getComputedStyle(el).backgroundColor;
      if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") paper = c;
      el = el.parentElement;
    }
    if (!paper) throw new Error("紙の色が読めない");
    const out: Record<string, { stroke: string; head: string }> = {};
    for (const g of document.querySelectorAll("[data-cdl-edge]")) {
      const tone = g.getAttribute("data-cdl-tone");
      const line = g.querySelector('[data-cdl-role="edge-line"]');
      if (!tone || !line) continue;
      const ref = (line.getAttribute("marker-end") ?? "").replace(/^url\(#|\)$/g, "");
      const marker = ref ? document.getElementById(ref) : null;
      const head = marker?.querySelector('[data-cdl-role="edge-arrowhead"]');
      if (!head) throw new Error(`${tone} の矢頭 (${ref || "指定なし"}) が引けない`);
      const stroke = getComputedStyle(line).stroke;
      const fill = getComputedStyle(head).fill;
      out[tone] = { stroke, head: fill === "context-stroke" ? stroke : fill };
    }
    return { paper, tones: out };
  });
  // 空振り検知 = 1 色も読めていないなら、実装ではなく検査の側が壊れている
  expect(
    Object.keys(読めた.tones).length,
    "色味を 1 つも読めていない (検査が空振りしている)",
  ).toBeGreaterThan(0);
  return 読めた;
}

async function open(page: Page, path: string, dark: boolean): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate((d) => document.documentElement.classList.toggle("dark", d), dark);
  await page.waitForTimeout(1500);
}

/**
 * 線の色を測る画面。
 *
 * **エディタ側は図を名指しする** (#1477)。 既定の見本は順序図で、`#1466` から 1 枚の板として
 * 描かれる = 矢印が 1 本も出ないため、10 件が「edge が 1 本も無い」 で落ちていた。
 * 線の色は図種に依らないので、矢印が在る図を開いて同じことを測る。
 */
const SCREENS = [
  { name: "catalog", path: "catalog/interactive", 全色: false },
  { name: "editor", path: `editor#s=${記法をURLに載せる(六色の記法)}`, 全色: true },
] as const;

test.use({ viewport: { width: 1500, height: 1000 } });

/** 光っていない edge の不透明度。 実物から読んで、 実効色の計算に使う。 */
async function readInactiveOpacity(page: Page): Promise<number> {
  const v = await page.evaluate(() => {
    for (const g of document.querySelectorAll('[data-cdl-edge][data-cdl-active="false"]')) {
      const line = g.querySelector('[data-cdl-role="edge-line"]');
      if (line) return Number(getComputedStyle(line).strokeOpacity);
    }
    return null;
  });
  if (v === null) throw new Error("光っていない edge が 1 本も無い");
  return v;
}

/**
 * 測る対象は **その画面が描いた色味** に絞る (#1709)。
 *
 * カタログの画面は 2 色しか描かないので、6 色を要求すると測れない色まで数えることになる。
 * 6 色そろっているかはエディタ側 (`全色: true`) で別に確かめ、カタログ側は
 * 描いた色が同じ規則で塗られているかを見る。
 */
function 測れた色味(tones: Record<string, { stroke: string; head: string }>): string[] {
  return TONES.filter((t) => tones[t] !== undefined);
}

for (const screen of SCREENS) {
  for (const dark of [false, true]) {
    const label = `${screen.name} / ${dark ? "暗い画面" : "明るい画面"}`;

    if (screen.全色) {
      test(`${label}: 6 つの色味が全部描かれている (検査の母集団)`, async ({ page }) => {
        // 下の 4 本は「描かれた色味」 を数える。 母集団がやせても落ちないので、
        // 6 色そろっていること自体をここで固定する。
        await open(page, screen.path, dark);
        const { tones } = await readToneColors(page);
        expect(測れた色味(tones).sort(), `描かれた色味: ${Object.keys(tones).join(" / ")}`).toEqual(
          [...TONES].sort(),
        );
      });
    }

    test(`${label}: 描かれた色味が別々の色になる`, async ({ page }) => {
      await open(page, screen.path, dark);
      const { tones } = await readToneColors(page);
      const 色味 = 測れた色味(tones);
      const strokes = 色味.map((t) => tones[t]!.stroke);
      expect(new Set(strokes).size, `色が重複している: ${strokes.join(" / ")}`).toBe(色味.length);
    });

    test(`${label}: 紙に対する対比が ${MIN_CONTRAST}:1 以上 (丸めの最悪値で)`, async ({ page }) => {
      await open(page, screen.path, dark);
      const { paper, tones } = await readToneColors(page);
      const alpha = await readInactiveOpacity(page);
      const bg = parseRgb(paper);
      const low: string[] = [];
      for (const t of 測れた色味(tones)) {
        const eff = applyOpacity(parseRgb(tones[t]!.stroke), bg, alpha);
        const r = Math.min(...quantized(eff).map((q) => contrast(q, bg)));
        if (r < MIN_CONTRAST) low.push(`${t} ${r.toFixed(2)} (${tones[t]!.stroke} on ${paper}, 不透明度 ${alpha})`);
      }
      expect(low, `対比が足りない tone:\n${low.join("\n")}`).toHaveLength(0);
    });

    test(`${label}: 実効色で隣り合う色が見分けられる (ΔE ${MIN_DELTA_E} 以上、 丸めの最悪値で)`, async ({ page }) => {
      // 生の色ではなく、 紙に重ねた後の色で測る。 不透明度で紙に寄るため生の色より近づく。
      // さらに丸めの向きで 0.7 ほど動くので、 全組合せの最悪値で判定する。
      await open(page, screen.path, dark);
      const { paper, tones } = await readToneColors(page);
      const alpha = await readInactiveOpacity(page);
      const bg = parseRgb(paper);
      const eff = (t: string) => quantized(applyOpacity(parseRgb(tones[t]!.stroke), bg, alpha));
      const 色味 = 測れた色味(tones);
      const close: string[] = [];
      for (let i = 0; i < 色味.length; i++) {
        for (let j = i + 1; j < 色味.length; j++) {
          const a = 色味[i]!;
          const b = 色味[j]!;
          let worst = Infinity;
          for (const qa of eff(a)) for (const qb of eff(b)) worst = Math.min(worst, deltaE(qa, qb));
          if (worst < MIN_DELTA_E) close.push(`${a} / ${b} ΔE ${worst.toFixed(1)}`);
        }
      }
      expect(close, `見分けづらい組:\n${close.join("\n")}`).toHaveLength(0);
    });

    test(`${label}: 矢頭も線と同じ色になる`, async ({ page }) => {
      // 矢頭は `<defs><marker>` の中で edge の子孫ではないため、 線と別に色を当てる必要がある。
      // 当て忘れると線だけ色が付いて矢頭が焼き付けの色のまま残る (実測で踏んだ)。
      await open(page, screen.path, dark);
      const { tones } = await readToneColors(page);
      const mismatch: string[] = [];
      for (const t of 測れた色味(tones)) {
        const v = tones[t]!;
        if (v.head !== v.stroke) mismatch.push(`${t}: 線 ${v.stroke} / 矢頭 ${v.head}`);
      }
      expect(mismatch, `線と矢頭の色が違う:\n${mismatch.join("\n")}`).toHaveLength(0);
    });

    test(`${label}: 光っていない線の不透明度が 0.9 以上`, async ({ page }) => {
      // 対比は色と不透明度の積で決まる。 色を濃くしても不透明度で潰せてしまうため、 実物の値を
      // 直接見る。 0.9 未満に戻ると上の対比検査が薄い色でも通ってしまう穴を塞ぐ。
      await open(page, screen.path, dark);
      expect(await readInactiveOpacity(page)).toBeGreaterThanOrEqual(0.9);
    });
  }
}

test("実在する edge も tone の色で描かれる (複製ではなく本物で確かめる)", async ({ page }) => {
  // interactive-ab-test = info (対照群へ) と success (処理群へ) の 2 本を持つ図。
  await open(page, "catalog/interactive", false);
  const seen = await page.evaluate(() => {
    const out: Array<{ tone: string; stroke: string; opacity: number; head: string | null }> = [];
    for (const g of document.querySelectorAll("[data-cdl-edge]")) {
      const tone = g.getAttribute("data-cdl-tone");
      const line = g.querySelector('[data-cdl-role="edge-line"]');
      if (!tone || !line) continue;
      const cs = getComputedStyle(line);
      const ref = (line.getAttribute("marker-end") ?? "").replace(/^url\(#|\)$/g, "");
      const marker = ref ? document.getElementById(ref) : null;
      const head = marker?.querySelector('[data-cdl-role="edge-arrowhead"]');
      // 計算値が `context-stroke` なら線の色 (読み替えの理由は readToneColors の説明)
      const fill = head ? getComputedStyle(head).fill : null;
      out.push({
        tone,
        stroke: cs.stroke,
        opacity: Number(cs.strokeOpacity),
        head: fill === "context-stroke" ? cs.stroke : fill,
      });
    }
    return out;
  });
  expect(seen.length, "edge が読めていない").toBeGreaterThan(0);
  // tone が 2 種類以上あるなら、 色も 2 種類以上になる (以前は全部同じ色だった)
  const tones = new Set(seen.map((s) => s.tone));
  if (tones.size > 1) {
    expect(new Set(seen.map((s) => s.stroke)).size).toBeGreaterThan(1);
  }
  for (const s of seen) {
    // 焼き付けの色 (#6d3f18 / #f0b840) が残っていない
    expect(s.stroke).not.toBe("rgb(109, 63, 24)");
    expect(s.stroke).not.toBe("rgb(240, 184, 64)");
    // 矢頭も線と揃う
    expect(s.head, `${s.tone} の矢頭が解決できない`).not.toBeNull();
    expect(s.head).toBe(s.stroke);
  }
});
